import { JwtService } from "@nestjs/jwt";
import { RealtimeManagerService } from "./../realtime-manager/realtime-manager.service";
import { RedisManagerService } from "./../redis-manager/redis-manager.service";
import { S3ManagerService } from "./../s3-manager/s3-manager.service";
import { PrismaClient } from "@prisma/client";
import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
    controllers: [ReportsController],
    providers: [
        ReportsService,
        PrismaClient,
        S3ManagerService,
        RedisManagerService,
        RealtimeManagerService,
        JwtService,
    ],
})
export class ReportsModule {}
