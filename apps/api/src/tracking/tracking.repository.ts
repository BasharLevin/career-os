/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- TypeORM's raw SQL boundary returns `any`; rows are immediately mapped into validated API contracts. */
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ApplicationStatus, JobDetail } from '@career-os/contracts';
import { DataSource, type EntityManager } from 'typeorm';
import { DATA_SOURCE } from '../database/database.js';
import type { Principal } from '../auth/principal.js';

type Row = Record<string, unknown>;

@Injectable()
export class TrackingRepository {
  constructor(@Inject(DATA_SOURCE) private readonly db: DataSource) {}

  async saveJob(
    principal: Principal,
    job: JobDetail,
    correlationId: string,
  ): Promise<Row> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      const jobId = await this.upsertJob(manager, job, false);
      await manager.query(
        `IF NOT EXISTS (SELECT 1 FROM saved_jobs WITH (UPDLOCK,HOLDLOCK) WHERE user_id=@0 AND persisted_job_id=@1)
        INSERT saved_jobs(user_id,persisted_job_id) VALUES(@0,@1)`,
        [userId, jobId],
      );
      await this.audit(
        manager,
        userId,
        'saved_job.created',
        'saved_job',
        jobId,
        correlationId,
      );
      return this.getSaved(manager, userId, jobId);
    });
  }

  async unsaveJob(
    principal: Principal,
    externalId: string,
    correlationId: string,
  ): Promise<void> {
    await this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      const result = await manager.query(
        `DELETE s OUTPUT DELETED.id FROM saved_jobs s
        JOIN persisted_jobs j ON j.id=s.persisted_job_id
        WHERE s.user_id=@0 AND j.source='jobtech' AND j.external_id=@1`,
        [userId, externalId],
      );
      if (!result.length) throw new NotFoundException('Saved job not found');
      await this.audit(
        manager,
        userId,
        'saved_job.deleted',
        'saved_job',
        null,
        correlationId,
      );
    });
  }

  async listSaved(principal: Principal): Promise<Row[]> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      const rows = await manager.query(
        this.savedSelect() + ' WHERE s.user_id=@0 ORDER BY s.saved_at DESC',
        [userId],
      );
      return rows.map((row: Row) => this.savedDto(row));
    });
  }

  async createApplication(
    principal: Principal,
    job: JobDetail,
    status: ApplicationStatus,
    key: string,
    correlationId: string,
  ): Promise<Row> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      const existing = await manager.query(
        'SELECT id FROM applications WHERE user_id=@0 AND idempotency_key=@1',
        [userId, key],
      );
      if (existing[0]?.id)
        return this.getApplication(manager, userId, String(existing[0].id));
      const jobId = await this.upsertJob(manager, job, false);
      const sameJob = await manager.query(
        'SELECT id FROM applications WHERE user_id=@0 AND persisted_job_id=@1',
        [userId, jobId],
      );
      if (sameJob[0]?.id)
        return this.getApplication(manager, userId, String(sameJob[0].id));
      const inserted = await manager.query(
        `INSERT applications(user_id,persisted_job_id,status,idempotency_key)
        OUTPUT INSERTED.id VALUES(@0,@1,@2,@3)`,
        [userId, jobId, status, key],
      );
      const id = String(inserted[0]?.id);
      await manager.query(
        'INSERT application_status_history(application_id,user_id,from_status,to_status) VALUES(@0,@1,NULL,@2)',
        [id, userId, status],
      );
      await this.audit(
        manager,
        userId,
        'application.created',
        'application',
        id,
        correlationId,
      );
      return this.getApplication(manager, userId, id);
    });
  }

  async listApplications(
    principal: Principal,
    status?: ApplicationStatus,
  ): Promise<Row[]> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      const filter = status ? ' AND a.status=@1' : '';
      const rows = await manager.query(
        this.applicationSelect() +
          ` WHERE a.user_id=@0${filter} ORDER BY a.updated_at DESC`,
        status ? [userId, status] : [userId],
      );
      return rows.map((row: Row) => this.applicationDto(row));
    });
  }

  async findApplication(principal: Principal, id: string): Promise<Row> {
    return this.db.transaction(async (manager) =>
      this.getApplication(
        manager,
        await this.ensureUser(manager, principal),
        id,
      ),
    );
  }

  async updateStatus(
    principal: Principal,
    id: string,
    status: ApplicationStatus,
    version: number,
    correlationId: string,
  ): Promise<Row> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      const current = await manager.query(
        'SELECT status,version FROM applications WHERE id=@0 AND user_id=@1',
        [id, userId],
      );
      if (!current[0]) throw new NotFoundException('Application not found');
      const changed = await manager.query(
        `UPDATE applications SET status=@0,version=version+1,updated_at=SYSUTCDATETIME()
        OUTPUT INSERTED.id WHERE id=@1 AND user_id=@2 AND version=@3`,
        [status, id, userId, version],
      );
      if (!changed.length)
        throw new ConflictException('Application changed since it was loaded');
      await manager.query(
        'INSERT application_status_history(application_id,user_id,from_status,to_status) VALUES(@0,@1,@2,@3)',
        [id, userId, current[0].status, status],
      );
      await this.audit(
        manager,
        userId,
        'application.status_changed',
        'application',
        id,
        correlationId,
      );
      return this.getApplication(manager, userId, id);
    });
  }

  async addNote(
    principal: Principal,
    id: string,
    body: string,
    correlationId: string,
  ): Promise<Row> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      await this.assertApplication(manager, userId, id);
      const rows = await manager.query(
        'INSERT application_notes(application_id,user_id,body) OUTPUT INSERTED.* VALUES(@0,@1,@2)',
        [id, userId, body],
      );
      await this.audit(
        manager,
        userId,
        'application_note.created',
        'application_note',
        String(rows[0]?.id),
        correlationId,
      );
      return this.noteDto(rows[0]);
    });
  }
  async editNote(
    principal: Principal,
    applicationId: string,
    noteId: string,
    body: string,
    version: number,
    correlationId: string,
  ): Promise<Row> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      await this.assertApplication(manager, userId, applicationId);
      const rows = await manager.query(
        `UPDATE application_notes SET body=@0,version=version+1,updated_at=SYSUTCDATETIME() OUTPUT INSERTED.*
      WHERE id=@1 AND application_id=@2 AND user_id=@3 AND version=@4`,
        [body, noteId, applicationId, userId, version],
      );
      if (!rows.length) {
        const found = await manager.query(
          'SELECT 1 found FROM application_notes WHERE id=@0 AND application_id=@1 AND user_id=@2',
          [noteId, applicationId, userId],
        );
        if (!found.length) throw new NotFoundException('Note not found');
        throw new ConflictException('Note changed since it was loaded');
      }
      await this.audit(
        manager,
        userId,
        'application_note.updated',
        'application_note',
        noteId,
        correlationId,
      );
      return this.noteDto(rows[0]);
    });
  }
  async deleteNote(
    principal: Principal,
    applicationId: string,
    noteId: string,
    correlationId: string,
  ): Promise<void> {
    await this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      await this.assertApplication(manager, userId, applicationId);
      const result = await manager.query(
        'DELETE application_notes OUTPUT DELETED.id WHERE id=@0 AND application_id=@1 AND user_id=@2',
        [noteId, applicationId, userId],
      );
      if (!result.length) throw new NotFoundException('Note not found');
      await this.audit(
        manager,
        userId,
        'application_note.deleted',
        'application_note',
        noteId,
        correlationId,
      );
    });
  }
  async history(principal: Principal, id: string): Promise<Row[]> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      await this.assertApplication(manager, userId, id);
      const rows = await manager.query(
        'SELECT id,from_status,to_status,changed_at FROM application_status_history WHERE application_id=@0 AND user_id=@1 ORDER BY changed_at,id',
        [id, userId],
      );
      return rows.map((r: Row) => ({
        id: r.id,
        fromStatus: r.from_status,
        toStatus: r.to_status,
        changedAt: this.iso(r.changed_at),
      }));
    });
  }
  async refresh(
    principal: Principal,
    applicationId: string,
    job: JobDetail,
    correlationId: string,
  ): Promise<Row> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      await this.assertApplication(manager, userId, applicationId);
      await this.upsertJob(manager, job, true);
      await this.audit(
        manager,
        userId,
        'job_snapshot.refreshed',
        'application',
        applicationId,
        correlationId,
      );
      return this.getApplication(manager, userId, applicationId);
    });
  }

  private async ensureUser(m: EntityManager, p: Principal): Promise<string> {
    await m.query(
      `UPDATE users WITH(UPDLOCK,HOLDLOCK) SET last_seen_at=SYSUTCDATETIME(),email=COALESCE(@2,email),display_name=COALESCE(@3,display_name) WHERE issuer=@0 AND subject=@1;
    IF @@ROWCOUNT=0 INSERT users(issuer,subject,email,display_name) VALUES(@0,@1,@2,@3)`,
      [p.issuer, p.subject, p.email ?? null, p.displayName ?? null],
    );
    const rows = await m.query(
      'SELECT id FROM users WHERE issuer=@0 AND subject=@1',
      [p.issuer, p.subject],
    );
    return String(rows[0]!.id);
  }
  private async upsertJob(
    m: EntityManager,
    j: JobDetail,
    refresh: boolean,
  ): Promise<string> {
    const sourceUrl =
      j.webpageUrl ??
      j.applicationUrl ??
      `https://arbetsformedlingen.se/platsbanken/annonser/${encodeURIComponent(j.id)}`;
    const json = JSON.stringify(j);
    await m.query(
      `UPDATE persisted_jobs WITH(UPDLOCK,HOLDLOCK) SET ${refresh ? 'source_url=@2,snapshot_json=@3,publication_date=@4,application_deadline=@5,last_refreshed_at=SYSUTCDATETIME()' : 'external_id=external_id'} WHERE source=@0 AND external_id=@1;
    IF @@ROWCOUNT=0 INSERT persisted_jobs(source,external_id,source_url,snapshot_json,publication_date,application_deadline) VALUES(@0,@1,@2,@3,@4,@5)`,
      [
        'jobtech',
        j.id,
        sourceUrl,
        json,
        j.publicationDate,
        j.applicationDeadline,
      ],
    );
    const rows = await m.query(
      'SELECT id FROM persisted_jobs WHERE source=@0 AND external_id=@1',
      ['jobtech', j.id],
    );
    return String(rows[0]!.id);
  }
  private async assertApplication(
    m: EntityManager,
    userId: string,
    id: string,
  ): Promise<void> {
    const rows = await m.query(
      'SELECT 1 found FROM applications WHERE id=@0 AND user_id=@1',
      [id, userId],
    );
    if (!rows.length) throw new NotFoundException('Application not found');
  }
  private async getApplication(
    m: EntityManager,
    userId: string,
    id: string,
  ): Promise<Row> {
    const rows = await m.query(
      this.applicationSelect() + ' WHERE a.id=@0 AND a.user_id=@1',
      [id, userId],
    );
    if (!rows[0]) throw new NotFoundException('Application not found');
    const notes = await m.query(
      'SELECT id,body,version,created_at,updated_at FROM application_notes WHERE application_id=@0 AND user_id=@1 ORDER BY created_at,id',
      [id, userId],
    );
    return {
      ...this.applicationDto(rows[0]),
      notes: notes.map((n: Row) => this.noteDto(n)),
    };
  }
  private async getSaved(
    m: EntityManager,
    userId: string,
    jobId: string,
  ): Promise<Row> {
    const rows = await m.query(
      this.savedSelect() + ' WHERE s.user_id=@0 AND s.persisted_job_id=@1',
      [userId, jobId],
    );
    return this.savedDto(rows[0]);
  }
  private applicationSelect(): string {
    return `SELECT a.id,a.status,a.version,a.created_at,a.updated_at,j.id job_id,j.source,j.external_id,j.source_url,j.snapshot_json,j.publication_date,j.application_deadline,j.first_persisted_at,j.last_refreshed_at FROM applications a JOIN persisted_jobs j ON j.id=a.persisted_job_id`;
  }
  private savedSelect(): string {
    return `SELECT s.id,s.saved_at,j.id job_id,j.source,j.external_id,j.source_url,j.snapshot_json,j.publication_date,j.application_deadline,j.first_persisted_at,j.last_refreshed_at FROM saved_jobs s JOIN persisted_jobs j ON j.id=s.persisted_job_id`;
  }
  private audit(
    m: EntityManager,
    userId: string,
    action: string,
    type: string,
    id: string | null,
    correlationId: string,
  ): Promise<unknown> {
    return m.query(
      'INSERT audit_events(user_id,action,resource_type,resource_id,correlation_id) VALUES(@0,@1,@2,@3,@4)',
      [userId, action, type, id, correlationId],
    );
  }
  private iso(value: unknown): string {
    return value instanceof Date
      ? value.toISOString()
      : new Date(String(value)).toISOString();
  }
  private jobDto(r: Row): Row {
    return {
      id: r.job_id,
      source: r.source,
      externalId: r.external_id,
      sourceUrl: r.source_url,
      snapshot: JSON.parse(String(r.snapshot_json)) as unknown,
      publicationDate: r.publication_date ? this.iso(r.publication_date) : null,
      applicationDeadline: r.application_deadline
        ? this.iso(r.application_deadline)
        : null,
      firstPersistedAt: this.iso(r.first_persisted_at),
      lastRefreshedAt: this.iso(r.last_refreshed_at),
    };
  }
  private savedDto(r: Row): Row {
    return { id: r.id, savedAt: this.iso(r.saved_at), job: this.jobDto(r) };
  }
  private applicationDto(r: Row): Row {
    return {
      id: r.id,
      status: r.status,
      version: r.version,
      createdAt: this.iso(r.created_at),
      updatedAt: this.iso(r.updated_at),
      job: this.jobDto(r),
    };
  }
  private noteDto(r: Row): Row {
    return {
      id: r.id,
      body: r.body,
      version: r.version,
      createdAt: this.iso(r.created_at),
      updatedAt: this.iso(r.updated_at),
    };
  }
}
