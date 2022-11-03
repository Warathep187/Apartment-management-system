import { SnsManagerService } from "./../sns-manager/sns-manager.service";
import { PrismaClient } from "@prisma/client";
import { RedisManagerService } from "./../redis-manager/redis-manager.service";
import { RealtimeManagerService } from "./../realtime-manager/realtime-manager.service";
import { S3ManagerService } from "./../s3-manager/s3-manager.service";
import { JwtModule } from "@nestjs/jwt";
import { Module } from "@nestjs/common";
import { MonthlyRentsController } from "./monthly-rents.controller";
import { MonthlyRentsService } from "./monthly-rents.service";

@Module({
    imports: [JwtModule.register({})],
    controllers: [MonthlyRentsController],
    providers: [
        MonthlyRentsService,
        S3ManagerService,
        RealtimeManagerService,
        PrismaClient,
        RedisManagerService,
        SnsManagerService,
    ],
})
export class MonthlyRentsModule {}
