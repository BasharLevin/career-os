import { Module } from '@nestjs/common';
import { CvExtractor } from './cv-extractor.js';
import { LocalCvStorage } from './cv-storage.js';
import { MatchingService } from './matching.service.js';
import { ProfileController } from './profile.controller.js';
import { ProfileRepository } from './profile.repository.js';
import { ProfileService } from './profile.service.js';

@Module({
  controllers: [ProfileController],
  providers: [
    ProfileRepository,
    ProfileService,
    LocalCvStorage,
    CvExtractor,
    MatchingService,
  ],
  exports: [ProfileService, MatchingService],
})
export class ProfileModule {}
