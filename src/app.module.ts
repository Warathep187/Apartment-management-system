import { S3ManagerModule } from "./s3-manager/s3-manager.module";
import { S3 } from "aws-sdk";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { RoomsModule } from "./rooms/rooms.module";
import { ResidentsModule } from "./residents/residents.module";
import { ProfileModule } from "./profile/profile.module";
import { AwsSdkModule } from "nest-aws-sdk/dist/lib/aws.module";
import { ReportsModule } from './reports/reports.module';
import { RedisModule } from "@liaoliaots/nestjs-redis";
import { RedisManagerModule } from './redis-manager/redis-manager.module';
import { RealtimeManagerModule } from './realtime-manager/realtime-manager.module';
import { RealtimeManagerGateway } from './realtime-manager/realtime-manager.gateway';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
    imports: [
        AuthModule,
        RoomsModule,
        ResidentsModule,
        ProfileModule,
        ReportsModule,
        ConfigModule.forRoot({
            envFilePath: ".env",
        }),
        ThrottlerModule.forRoot({}),
        AwsSdkModule.forRoot({
            defaultServiceOptions: {
                region: "ap-southeast-1",
            },
            services: [S3],
        }),
        S3ManagerModule,
        RedisModule.forRoot({
            config: {
                url: "redis://localhost:6379"
            }
        }),
        RedisManagerModule,
        RealtimeManagerModule,
        NotificationsModule
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        RealtimeManagerGateway,
    ],
})
export class AppModule {}
