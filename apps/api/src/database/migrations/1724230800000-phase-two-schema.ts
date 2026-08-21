import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PhaseTwoSchema1724230800000 implements MigrationInterface {
  name = 'PhaseTwoSchema1724230800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE TABLE users (
  id uniqueidentifier NOT NULL CONSTRAINT PK_users PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  issuer nvarchar(500) NOT NULL, subject nvarchar(255) NOT NULL,
  email nvarchar(320) NULL, display_name nvarchar(255) NULL,
  created_at datetime2(3) NOT NULL CONSTRAINT DF_users_created DEFAULT SYSUTCDATETIME(),
  last_seen_at datetime2(3) NOT NULL CONSTRAINT DF_users_seen DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_users_identity UNIQUE (issuer, subject)
);
CREATE TABLE persisted_jobs (
  id uniqueidentifier NOT NULL CONSTRAINT PK_persisted_jobs PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  source varchar(32) NOT NULL, external_id nvarchar(100) NOT NULL,
  source_url nvarchar(2048) NOT NULL, snapshot_json nvarchar(max) NOT NULL,
  publication_date datetime2(3) NULL, application_deadline datetime2(3) NULL,
  first_persisted_at datetime2(3) NOT NULL CONSTRAINT DF_jobs_first DEFAULT SYSUTCDATETIME(),
  last_refreshed_at datetime2(3) NOT NULL CONSTRAINT DF_jobs_refresh DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_jobs_snapshot_json CHECK (ISJSON(snapshot_json)=1),
  CONSTRAINT UQ_jobs_source_external UNIQUE (source, external_id)
);
CREATE INDEX IX_jobs_deadline ON persisted_jobs(application_deadline);
CREATE TABLE saved_jobs (
  id uniqueidentifier NOT NULL CONSTRAINT PK_saved_jobs PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  user_id uniqueidentifier NOT NULL, persisted_job_id uniqueidentifier NOT NULL,
  saved_at datetime2(3) NOT NULL CONSTRAINT DF_saved_at DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_saved_user FOREIGN KEY(user_id) REFERENCES users(id),
  CONSTRAINT FK_saved_job FOREIGN KEY(persisted_job_id) REFERENCES persisted_jobs(id),
  CONSTRAINT UQ_saved_user_job UNIQUE(user_id, persisted_job_id)
);
CREATE INDEX IX_saved_user_date ON saved_jobs(user_id, saved_at DESC);
CREATE TABLE applications (
  id uniqueidentifier NOT NULL CONSTRAINT PK_applications PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  user_id uniqueidentifier NOT NULL, persisted_job_id uniqueidentifier NOT NULL,
  status varchar(32) NOT NULL, version int NOT NULL CONSTRAINT DF_application_version DEFAULT 1,
  idempotency_key nvarchar(200) NULL,
  created_at datetime2(3) NOT NULL CONSTRAINT DF_application_created DEFAULT SYSUTCDATETIME(),
  updated_at datetime2(3) NOT NULL CONSTRAINT DF_application_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_application_user FOREIGN KEY(user_id) REFERENCES users(id),
  CONSTRAINT FK_application_job FOREIGN KEY(persisted_job_id) REFERENCES persisted_jobs(id),
  CONSTRAINT CK_application_status CHECK(status IN ('saved','preparing','applied','screening','interview','technical_interview','offer','rejected','withdrawn','accepted')),
  CONSTRAINT CK_application_version CHECK(version > 0),
  CONSTRAINT UQ_application_user_job UNIQUE(user_id, persisted_job_id)
);
CREATE UNIQUE INDEX UX_application_idempotency ON applications(user_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IX_application_user_status ON applications(user_id,status,updated_at DESC);
CREATE TABLE application_status_history (
  id uniqueidentifier NOT NULL CONSTRAINT PK_application_history PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  application_id uniqueidentifier NOT NULL, user_id uniqueidentifier NOT NULL,
  from_status varchar(32) NULL, to_status varchar(32) NOT NULL,
  changed_at datetime2(3) NOT NULL CONSTRAINT DF_history_changed DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_history_application FOREIGN KEY(application_id) REFERENCES applications(id),
  CONSTRAINT FK_history_user FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IX_history_application_date ON application_status_history(application_id,changed_at,id);
CREATE TABLE application_notes (
  id uniqueidentifier NOT NULL CONSTRAINT PK_application_notes PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  application_id uniqueidentifier NOT NULL, user_id uniqueidentifier NOT NULL,
  body nvarchar(max) NOT NULL, version int NOT NULL CONSTRAINT DF_note_version DEFAULT 1,
  created_at datetime2(3) NOT NULL CONSTRAINT DF_note_created DEFAULT SYSUTCDATETIME(),
  updated_at datetime2(3) NOT NULL CONSTRAINT DF_note_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_note_application FOREIGN KEY(application_id) REFERENCES applications(id),
  CONSTRAINT FK_note_user FOREIGN KEY(user_id) REFERENCES users(id),
  CONSTRAINT CK_note_body CHECK(LEN(body) BETWEEN 1 AND 10000),
  CONSTRAINT CK_note_version CHECK(version > 0)
);
CREATE INDEX IX_notes_application_date ON application_notes(application_id,created_at,id);
CREATE TABLE audit_events (
  id uniqueidentifier NOT NULL CONSTRAINT PK_audit_events PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  user_id uniqueidentifier NOT NULL, action nvarchar(100) NOT NULL,
  resource_type nvarchar(100) NOT NULL, resource_id uniqueidentifier NULL,
  correlation_id nvarchar(100) NOT NULL, metadata_json nvarchar(max) NULL,
  occurred_at datetime2(3) NOT NULL CONSTRAINT DF_audit_occurred DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_audit_user FOREIGN KEY(user_id) REFERENCES users(id),
  CONSTRAINT CK_audit_metadata CHECK(metadata_json IS NULL OR ISJSON(metadata_json)=1)
);
CREATE INDEX IX_audit_user_date ON audit_events(user_id,occurred_at DESC);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE audit_events, application_notes, application_status_history, applications, saved_jobs, persisted_jobs, users',
    );
  }
}
