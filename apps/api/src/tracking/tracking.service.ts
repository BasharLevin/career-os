import { Injectable } from '@nestjs/common';
import type { ApplicationStatus, JobDetail } from '@career-os/contracts';
import { JobTechClient } from '@career-os/jobtech-client';
import type { Principal } from '../auth/principal.js';
import { TrackingRepository } from './tracking.repository.js';

@Injectable()
export class TrackingService {
  constructor(
    private readonly repository: TrackingRepository,
    private readonly jobs: JobTechClient,
  ) {}
  save(p: Principal, id: string, c: string) {
    return this.jobs
      .getJob(id)
      .then((job) => this.repository.saveJob(p, job, c));
  }
  unsave(p: Principal, id: string, c: string) {
    return this.repository.unsaveJob(p, id, c);
  }
  saved(p: Principal) {
    return this.repository.listSaved(p);
  }
  create(
    p: Principal,
    id: string,
    status: ApplicationStatus,
    key: string,
    c: string,
  ) {
    return this.jobs
      .getJob(id)
      .then((job) => this.repository.createApplication(p, job, status, key, c));
  }
  list(p: Principal, status?: ApplicationStatus) {
    return this.repository.listApplications(p, status);
  }
  one(p: Principal, id: string) {
    return this.repository.findApplication(p, id);
  }
  status(
    p: Principal,
    id: string,
    status: ApplicationStatus,
    version: number,
    c: string,
  ) {
    return this.repository.updateStatus(p, id, status, version, c);
  }
  note(p: Principal, id: string, body: string, c: string) {
    return this.repository.addNote(p, id, body, c);
  }
  editNote(
    p: Principal,
    id: string,
    noteId: string,
    body: string,
    version: number,
    c: string,
  ) {
    return this.repository.editNote(p, id, noteId, body, version, c);
  }
  deleteNote(p: Principal, id: string, noteId: string, c: string) {
    return this.repository.deleteNote(p, id, noteId, c);
  }
  history(p: Principal, id: string) {
    return this.repository.history(p, id);
  }
  async refresh(p: Principal, id: string, c: string) {
    const app = await this.repository.findApplication(p, id);
    const externalId = String((app.job as Record<string, unknown>).externalId);
    const job: JobDetail = await this.jobs.getJob(externalId);
    return this.repository.refresh(p, id, job, c);
  }
}
