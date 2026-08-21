import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PhaseThreeIntelligence1724317200000 implements MigrationInterface {
  name = 'PhaseThreeIntelligence1724317200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE TABLE career_profiles (
  id uniqueidentifier NOT NULL CONSTRAINT PK_career_profiles PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  user_id uniqueidentifier NOT NULL CONSTRAINT UQ_career_profiles_user UNIQUE,
  preferred_roles_json nvarchar(max) NOT NULL CONSTRAINT DF_profile_roles DEFAULT '[]',
  preferred_locations_json nvarchar(max) NOT NULL CONSTRAINT DF_profile_locations DEFAULT '[]',
  remote_preference varchar(20) NULL, experience_level varchar(20) NULL,
  skills_json nvarchar(max) NOT NULL CONSTRAINT DF_profile_skills DEFAULT '[]',
  languages_json nvarchar(max) NOT NULL CONSTRAINT DF_profile_languages DEFAULT '[]',
  career_goals nvarchar(max) NOT NULL CONSTRAINT DF_profile_goals DEFAULT '',
  field_provenance_json nvarchar(max) NOT NULL CONSTRAINT DF_profile_provenance DEFAULT '{}',
  version int NOT NULL CONSTRAINT DF_profile_version DEFAULT 1,
  created_at datetime2(3) NOT NULL CONSTRAINT DF_profile_created DEFAULT SYSUTCDATETIME(),
  updated_at datetime2(3) NOT NULL CONSTRAINT DF_profile_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_profile_user FOREIGN KEY(user_id) REFERENCES users(id),
  CONSTRAINT CK_profile_json CHECK(ISJSON(preferred_roles_json)=1 AND ISJSON(preferred_locations_json)=1 AND ISJSON(skills_json)=1 AND ISJSON(languages_json)=1 AND ISJSON(field_provenance_json)=1),
  CONSTRAINT CK_profile_version CHECK(version > 0)
);
CREATE TABLE cv_documents (
  id uniqueidentifier NOT NULL CONSTRAINT PK_cv_documents PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  user_id uniqueidentifier NOT NULL, original_filename nvarchar(255) NOT NULL,
  media_type varchar(100) NOT NULL, byte_size int NOT NULL, sha256 char(64) NOT NULL,
  storage_key nvarchar(500) NOT NULL CONSTRAINT UQ_cv_storage UNIQUE,
  extracted_text nvarchar(max) NOT NULL, extraction_status varchar(30) NOT NULL,
  derived_profile_json nvarchar(max) NOT NULL, extractor_version nvarchar(100) NOT NULL,
  approved_at datetime2(3) NULL,
  created_at datetime2(3) NOT NULL CONSTRAINT DF_cv_created DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_cv_user FOREIGN KEY(user_id) REFERENCES users(id),
  CONSTRAINT CK_cv_size CHECK(byte_size > 0),
  CONSTRAINT CK_cv_derived CHECK(ISJSON(derived_profile_json)=1)
);
CREATE INDEX IX_cv_user_created ON cv_documents(user_id,created_at DESC);
CREATE TABLE job_profile_matches (
  id uniqueidentifier NOT NULL CONSTRAINT PK_job_profile_matches PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  user_id uniqueidentifier NOT NULL, profile_id uniqueidentifier NOT NULL,
  persisted_job_id uniqueidentifier NOT NULL, assessment_json nvarchar(max) NOT NULL,
  logic_version nvarchar(100) NOT NULL, model nvarchar(200) NULL,
  configuration_json nvarchar(max) NOT NULL, profile_version int NOT NULL,
  job_refreshed_at datetime2(3) NOT NULL,
  calculated_at datetime2(3) NOT NULL CONSTRAINT DF_match_calculated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_match_user FOREIGN KEY(user_id) REFERENCES users(id),
  CONSTRAINT FK_match_profile FOREIGN KEY(profile_id) REFERENCES career_profiles(id),
  CONSTRAINT FK_match_job FOREIGN KEY(persisted_job_id) REFERENCES persisted_jobs(id),
  CONSTRAINT CK_match_json CHECK(ISJSON(assessment_json)=1 AND ISJSON(configuration_json)=1)
);
CREATE INDEX IX_match_lookup ON job_profile_matches(user_id,persisted_job_id,calculated_at DESC);
CREATE TABLE conversations (
  id uniqueidentifier NOT NULL CONSTRAINT PK_conversations PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  user_id uniqueidentifier NOT NULL, title nvarchar(160) NOT NULL,
  summary nvarchar(max) NULL, summary_through_sequence int NULL,
  version int NOT NULL CONSTRAINT DF_conversation_version DEFAULT 1,
  created_at datetime2(3) NOT NULL CONSTRAINT DF_conversation_created DEFAULT SYSUTCDATETIME(),
  updated_at datetime2(3) NOT NULL CONSTRAINT DF_conversation_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_conversation_user FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IX_conversation_user_date ON conversations(user_id,updated_at DESC);
CREATE TABLE conversation_messages (
  id uniqueidentifier NOT NULL CONSTRAINT PK_conversation_messages PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  conversation_id uniqueidentifier NOT NULL, user_id uniqueidentifier NOT NULL,
  sequence int NOT NULL, role varchar(20) NOT NULL, kind varchar(30) NOT NULL,
  content nvarchar(max) NOT NULL, client_message_id uniqueidentifier NULL,
  provider_response_id nvarchar(200) NULL, metadata_json nvarchar(max) NULL,
  created_at datetime2(3) NOT NULL CONSTRAINT DF_message_created DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_message_conversation FOREIGN KEY(conversation_id) REFERENCES conversations(id),
  CONSTRAINT FK_message_user FOREIGN KEY(user_id) REFERENCES users(id),
  CONSTRAINT UQ_message_sequence UNIQUE(conversation_id,sequence),
  CONSTRAINT CK_message_role CHECK(role IN ('user','assistant','system','tool')),
  CONSTRAINT CK_message_metadata CHECK(metadata_json IS NULL OR ISJSON(metadata_json)=1)
);
CREATE UNIQUE INDEX UX_message_client_id ON conversation_messages(user_id,client_message_id) WHERE client_message_id IS NOT NULL;
CREATE TABLE assistant_operations (
  id uniqueidentifier NOT NULL CONSTRAINT PK_assistant_operations PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  user_id uniqueidentifier NOT NULL, conversation_id uniqueidentifier NOT NULL,
  tool_name nvarchar(100) NOT NULL, mutating bit NOT NULL, authorization_result varchar(30) NOT NULL,
  status varchar(30) NOT NULL, idempotency_key nvarchar(200) NULL,
  arguments_hash char(64) NOT NULL, outcome_summary nvarchar(500) NULL,
  pending_arguments_json nvarchar(max) NULL,
  duration_ms int NULL, confirmed_at datetime2(3) NULL, expires_at datetime2(3) NULL,
  created_at datetime2(3) NOT NULL CONSTRAINT DF_operation_created DEFAULT SYSUTCDATETIME(),
  completed_at datetime2(3) NULL,
  CONSTRAINT FK_operation_user FOREIGN KEY(user_id) REFERENCES users(id),
  CONSTRAINT FK_operation_conversation FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  ,CONSTRAINT CK_operation_arguments CHECK(pending_arguments_json IS NULL OR ISJSON(pending_arguments_json)=1)
);
CREATE UNIQUE INDEX UX_operation_idempotency ON assistant_operations(user_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IX_operation_user_date ON assistant_operations(user_id,created_at DESC);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE assistant_operations, conversation_messages, conversations, job_profile_matches, cv_documents, career_profiles',
    );
  }
}
