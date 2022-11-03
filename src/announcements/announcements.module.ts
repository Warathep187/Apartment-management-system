import { JwtModule } from "@nestjs/jwt";
import { RealtimeManagerService } from "./../realtime-manager/realtime-manager.service";
import { S3ManagerService } from "./../s3-manager/s3-manager.service";
import { RedisManagerService } from "./../redis-manager/redis-manager.service";
import { PrismaClient } from "@prisma/client";
import { Module } from "@nestjs/common";
import { AnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";

@Module({
    imports: [JwtModule.register({})],
    controllers: [AnnouncementsController],
    providers: [
        AnnouncementsService,
        PrismaClient,
        RedisManagerService,
        S3ManagerService,
        RealtimeManagerService,
    ],
})
export class AnnouncementsModule {}
