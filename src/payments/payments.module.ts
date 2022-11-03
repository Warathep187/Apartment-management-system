import { QrcodeManagerService } from './../qrcode-manager/qrcode-manager.service';
import { RedisManagerService } from './../redis-manager/redis-manager.service';
import { JwtService } from "@nestjs/jwt";
import { S3ManagerService } from "./../s3-manager/s3-manager.service";
import { RealtimeManagerService } from "./../realtime-manager/realtime-manager.service";
import { PrismaClient } from "@prisma/client";
import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
    controllers: [PaymentsController],
    providers: [
        PaymentsService,
        PrismaClient,
        RealtimeManagerService,
        S3ManagerService,
        JwtService,
        RedisManagerService,
        QrcodeManagerService
    ],
})
export class PaymentsModule {}
