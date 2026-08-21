import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  profileApprovalSchema,
  profileUpdateSchema,
} from '@career-os/contracts';
import { CurrentPrincipal } from '../auth/current-principal.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { Principal } from '../auth/principal.js';
import { parsed } from '../common/request-validation.js';
import { MatchingService } from './matching.service.js';
import { ProfileService } from './profile.service.js';

@Controller('api/v1')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(
    private readonly profiles: ProfileService,
    private readonly matching: MatchingService,
  ) {}
  @Get('profile') get(@CurrentPrincipal() principal: Principal) {
    return this.profiles.get(principal);
  }
  @Patch('profile') update(
    @CurrentPrincipal() principal: Principal,
    @Body() body: unknown,
  ) {
    return this.profiles.update(principal, parsed(profileUpdateSchema, body));
  }
  @Get('profile/cvs') cvs(@CurrentPrincipal() principal: Principal) {
    return this.profiles.cvs(principal);
  }
  @Post('profile/cvs')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentPrincipal() principal: Principal,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('CV file is required');
    return this.profiles.upload(principal, file);
  }
  @Post('profile/cvs/:id/approve') approve(
    @CurrentPrincipal() principal: Principal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = parsed(profileApprovalSchema, body);
    if (input.documentId !== id)
      throw new BadRequestException('Document identifier mismatch');
    return this.profiles.approve(
      principal,
      id,
      input.fields,
      input.expectedVersion,
    );
  }
  @Post('matches/:externalId') compare(
    @CurrentPrincipal() principal: Principal,
    @Param('externalId') externalId: string,
  ) {
    return this.matching.compare(principal, externalId);
  }
}
