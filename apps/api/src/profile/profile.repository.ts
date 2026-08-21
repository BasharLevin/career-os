/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- TypeORM raw SQL returns any; rows are mapped before crossing this repository boundary. */
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ExtractedProfile, ProfileUpdate } from '@career-os/contracts';
import { DataSource, type EntityManager } from 'typeorm';
import { DATA_SOURCE } from '../database/database.js';
import type { Principal } from '../auth/principal.js';

type Row = Record<string, unknown>;

@Injectable()
export class ProfileRepository {
  constructor(@Inject(DATA_SOURCE) private readonly db: DataSource) {}

  async get(principal: Principal): Promise<Row> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      await manager.query(
        `IF NOT EXISTS(SELECT 1 FROM career_profiles WHERE user_id=@0)
        INSERT career_profiles(user_id) VALUES(@0)`,
        [userId],
      );
      return this.getByUser(manager, userId);
    });
  }

  async update(
    principal: Principal,
    input: ProfileUpdate,
    provenance: string | Record<string, string> = 'user_confirmed',
  ): Promise<Row> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      await manager.query(
        `IF NOT EXISTS(SELECT 1 FROM career_profiles WHERE user_id=@0)
        INSERT career_profiles(user_id) VALUES(@0)`,
        [userId],
      );
      const fields = [
        'preferredRoles',
        'preferredLocations',
        'remotePreference',
        'experienceLevel',
        'skills',
        'languages',
        'careerGoals',
      ];
      const source =
        typeof provenance === 'string'
          ? Object.fromEntries(fields.map((field) => [field, provenance]))
          : provenance;
      const rows = await manager.query(
        `UPDATE career_profiles SET preferred_roles_json=@0,preferred_locations_json=@1,
        remote_preference=@2,experience_level=@3,skills_json=@4,languages_json=@5,career_goals=@6,
        field_provenance_json=@7,version=version+1,updated_at=SYSUTCDATETIME() OUTPUT INSERTED.*
        WHERE user_id=@8 AND version=@9`,
        [
          JSON.stringify(input.preferredRoles),
          JSON.stringify(input.preferredLocations),
          input.remotePreference,
          input.experienceLevel,
          JSON.stringify(input.skills),
          JSON.stringify(input.languages),
          input.careerGoals,
          JSON.stringify(source),
          userId,
          input.expectedVersion,
        ],
      );
      if (!rows.length)
        throw new ConflictException('Profile changed since it was loaded');
      return this.dto(rows[0]);
    });
  }

  async addCv(
    principal: Principal,
    file: {
      filename: string;
      mediaType: string;
      bytes: number;
      sha256: string;
      storageKey: string;
      text: string;
      derived: ExtractedProfile;
    },
  ): Promise<Row> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      const rows = await manager.query(
        `INSERT cv_documents(user_id,original_filename,media_type,byte_size,sha256,storage_key,extracted_text,extraction_status,derived_profile_json,extractor_version)
        OUTPUT INSERTED.* VALUES(@0,@1,@2,@3,@4,@5,@6,'review_required',@7,'deterministic-v1')`,
        [
          userId,
          file.filename,
          file.mediaType,
          file.bytes,
          file.sha256,
          file.storageKey,
          file.text,
          JSON.stringify(file.derived),
        ],
      );
      return this.cvDto(rows[0]);
    });
  }

  async listCvs(principal: Principal): Promise<Row[]> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      const rows = await manager.query(
        'SELECT * FROM cv_documents WHERE user_id=@0 ORDER BY created_at DESC',
        [userId],
      );
      return rows.map((row: Row) => this.cvDto(row));
    });
  }

  async approve(
    principal: Principal,
    documentId: string,
    fields: ExtractedProfile,
    expectedVersion: number,
  ): Promise<Row> {
    const current = await this.get(principal);
    const document = (await this.listCvs(principal)).find(
      (item) => item.id === documentId,
    );
    if (!document) throw new NotFoundException('CV document not found');
    const prior = current.fieldProvenance as Record<string, string>;
    const updated = await this.update(
      principal,
      {
        preferredRoles: fields.preferredRoles,
        preferredLocations: fields.preferredLocations,
        remotePreference:
          (current.remotePreference as ProfileUpdate['remotePreference']) ??
          null,
        experienceLevel: fields.experienceLevel,
        skills: fields.skills,
        languages: fields.languages,
        careerGoals: String(current.careerGoals),
        expectedVersion,
      },
      {
        preferredRoles: 'cv_user_approved',
        preferredLocations: 'cv_user_approved',
        experienceLevel: 'cv_user_approved',
        skills: 'cv_user_approved',
        languages: 'cv_user_approved',
        remotePreference: prior.remotePreference ?? 'user_confirmed',
        careerGoals: prior.careerGoals ?? 'user_confirmed',
      },
    );
    await this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      await manager.query(
        "UPDATE cv_documents SET approved_at=SYSUTCDATETIME(),extraction_status='approved' WHERE id=@0 AND user_id=@1",
        [documentId, userId],
      );
    });
    return updated;
  }

  async persistedJob(
    principal: Principal,
    externalId: string,
  ): Promise<{ profile: Row; job: Row }> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      const profile = await this.getByUser(manager, userId);
      const rows = await manager.query(
        "SELECT TOP 1 * FROM persisted_jobs WHERE source='jobtech' AND external_id=@0",
        [externalId],
      );
      if (!rows.length)
        throw new NotFoundException(
          'Persisted job not found; save or track it first',
        );
      return { profile, job: rows[0] as Row };
    });
  }

  async storeMatch(
    principal: Principal,
    externalId: string,
    assessment: Row,
  ): Promise<Row> {
    return this.db.transaction(async (manager) => {
      const userId = await this.ensureUser(manager, principal);
      const rows = await manager.query(
        `INSERT job_profile_matches(user_id,profile_id,persisted_job_id,assessment_json,logic_version,model,configuration_json,profile_version,job_refreshed_at)
        OUTPUT INSERTED.id,INSERTED.calculated_at SELECT @0,p.id,j.id,@1,@2,@3,@4,p.version,j.last_refreshed_at FROM career_profiles p CROSS JOIN persisted_jobs j WHERE p.user_id=@0 AND j.external_id=@5 AND j.source='jobtech'`,
        [
          userId,
          JSON.stringify(assessment),
          assessment.logicVersion,
          assessment.model,
          JSON.stringify(assessment.configuration),
          externalId,
        ],
      );
      return {
        ...assessment,
        id: rows[0]?.id,
        calculatedAt: this.iso(rows[0]?.calculated_at),
      };
    });
  }

  private async ensureUser(
    manager: EntityManager,
    p: Principal,
  ): Promise<string> {
    await manager.query(
      `UPDATE users SET last_seen_at=SYSUTCDATETIME(),email=COALESCE(@2,email),display_name=COALESCE(@3,display_name) WHERE issuer=@0 AND subject=@1;
      IF @@ROWCOUNT=0 INSERT users(issuer,subject,email,display_name) VALUES(@0,@1,@2,@3)`,
      [p.issuer, p.subject, p.email ?? null, p.displayName ?? null],
    );
    const rows = await manager.query(
      'SELECT id FROM users WHERE issuer=@0 AND subject=@1',
      [p.issuer, p.subject],
    );
    return String(rows[0].id);
  }
  private async getByUser(
    manager: EntityManager,
    userId: string,
  ): Promise<Row> {
    const rows = await manager.query(
      'SELECT * FROM career_profiles WHERE user_id=@0',
      [userId],
    );
    if (!rows.length) throw new NotFoundException('Career profile not found');
    return this.dto(rows[0]);
  }
  private dto(row: Row): Row {
    return {
      id: row.id,
      preferredRoles: JSON.parse(String(row.preferred_roles_json)),
      preferredLocations: JSON.parse(String(row.preferred_locations_json)),
      remotePreference: row.remote_preference,
      experienceLevel: row.experience_level,
      skills: JSON.parse(String(row.skills_json)),
      languages: JSON.parse(String(row.languages_json)),
      careerGoals: row.career_goals,
      fieldProvenance: JSON.parse(String(row.field_provenance_json)),
      version: row.version,
      updatedAt: this.iso(row.updated_at),
    };
  }
  private cvDto(row: Row): Row {
    return {
      id: row.id,
      originalFilename: row.original_filename,
      mediaType: row.media_type,
      byteSize: row.byte_size,
      sha256: row.sha256,
      extractedText: row.extracted_text,
      extractionStatus: row.extraction_status,
      derivedProfile: JSON.parse(String(row.derived_profile_json)),
      extractorVersion: row.extractor_version,
      approvedAt: this.iso(row.approved_at),
      createdAt: this.iso(row.created_at),
    };
  }
  private iso(value: unknown): string | null {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number')
      return new Date(value).toISOString();
    return null;
  }
}
