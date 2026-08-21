import { BadRequestException, Injectable } from '@nestjs/common';
import { parseApiEnvironment } from '@career-os/config';
import type { ExtractedProfile, ProfileUpdate } from '@career-os/contracts';
import type { Principal } from '../auth/principal.js';
import { CvExtractor } from './cv-extractor.js';
import { LocalCvStorage } from './cv-storage.js';
import { ProfileRepository } from './profile.repository.js';

@Injectable()
export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly storage: LocalCvStorage,
    private readonly extractor: CvExtractor,
  ) {}
  get(principal: Principal) {
    return this.repository.get(principal);
  }
  update(principal: Principal, input: ProfileUpdate) {
    return this.repository.update(principal, input);
  }
  cvs(principal: Principal) {
    return this.repository.listCvs(principal);
  }
  approve(
    principal: Principal,
    documentId: string,
    fields: ExtractedProfile,
    version: number,
  ) {
    return this.repository.approve(principal, documentId, fields, version);
  }
  async upload(principal: Principal, file: Express.Multer.File) {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.mimetype))
      throw new BadRequestException('Only PDF and DOCX CVs are supported');
    if (!file.size || file.size > parseApiEnvironment(process.env).CV_MAX_BYTES)
      throw new BadRequestException('CV file size is invalid');
    const magicOk =
      file.mimetype === 'application/pdf'
        ? file.buffer.subarray(0, 5).toString() === '%PDF-'
        : file.buffer[0] === 0x50 && file.buffer[1] === 0x4b;
    if (!magicOk)
      throw new BadRequestException(
        'CV content does not match its declared type',
      );
    const text = await this.extractor.text(file.mimetype, file.buffer);
    const derived = this.extractor.derive(text);
    const stored = await this.storage.put(
      `${principal.issuer}:${principal.subject}`,
      file.originalname,
      file.buffer,
    );
    return this.repository.addCv(principal, {
      filename: file.originalname.slice(0, 255),
      mediaType: file.mimetype,
      bytes: file.size,
      text,
      derived,
      ...stored,
    });
  }
}
