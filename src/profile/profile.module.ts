import { S3ManagerService } from './../s3-manager/s3-manager.service';
import { PrismaClient } from '@prisma/client';
import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, PrismaClient, S3ManagerService]
})
export class ProfileModule {}
