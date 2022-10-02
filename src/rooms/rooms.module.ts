import { PrismaClient } from '@prisma/client';
import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';

@Module({
  providers: [RoomsService, PrismaClient],
  controllers: [RoomsController]
})
export class RoomsModule {}
