import { Module } from '@nestjs/common';
import { S3ManagerService } from './s3-manager.service';

@Module({
  providers: [S3ManagerService],
  exports: [S3ManagerModule]
})
export class S3ManagerModule {}
