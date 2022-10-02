import { PrismaService } from './../prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './../auth/auth.module';
import { AuthService } from './../auth/auth.service';
import { PrismaClient } from '@prisma/client';
import { Module } from '@nestjs/common';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';

@Module({
  imports: [AuthModule],
  controllers: [ResidentsController],
  providers: [ResidentsService, PrismaClient]
})
export class ResidentsModule {}
