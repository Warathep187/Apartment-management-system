import { AdminStrategy } from './strategies/admin.strategy';
import { ResidentStrategy } from './strategies/resident.strategy';
import { PrismaClient } from '@prisma/client';
import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";

@Module({
    imports: [JwtModule.register({})],
    controllers: [AuthController],
    providers: [AuthService, PrismaClient, ResidentStrategy, AdminStrategy],
    exports: [AuthService]
})
export class AuthModule {}
