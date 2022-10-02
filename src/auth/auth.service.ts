import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDataDto } from "./dto/register-data.dto";
import { LoginDataDto } from "./dto/login-data.dto";
import { LoggedInResponse } from "./types/auth.type";
import { PrismaClient, Role } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { ConflictException } from "@nestjs/common/exceptions";
import { v4 as uuid } from "uuid";

@Injectable()
export class AuthService {
    constructor(
        private prismaClient: PrismaClient,
        private jwtService: JwtService
    ) {}

    async signin(loginDataDto: LoginDataDto): Promise<LoggedInResponse> {
        const email = loginDataDto.email;
        const inputPassword = loginDataDto.password;

        const user = await this.prismaClient.user.findUnique({
            where: {
                email,
            },
            select: {
                id: true,
                name: true,
                password: true,
                role: true,
                profileImage: {
                    select: {
                        url: true,
                    },
                },
            },
        });
        if (!user) {
            throw new ConflictException("User not found");
        }
        const isMatch = await bcrypt.compare(inputPassword, user.password);
        if (!isMatch) {
            throw new ConflictException("Password is incorrect");
        }

        delete user.password;

        const token = this.jwtService.sign(
            {
                sub: user.id,
                role: user.role,
            },
            {
                expiresIn: "3d",
                secret:
                    user.role === Role.ADMIN
                        ? process.env.JWT_ADMIN_AUTHENTICATION_KEY
                        : process.env.JWT_RESIDENT_AUTHENTICATION_KEY,
            },
        );
        const realtimeToken = this.jwtService.sign({
            sub: user.id,
            role: user.role
        }, {
            expiresIn: "3d",
            secret: process.env.JWT_REALTIME_AUTHENTICATION_KEY
        })

        return {
            user,
            token,
            realtimeToken
        };
    }

    async signup(registerDataDto: RegisterDataDto): Promise<LoggedInResponse> {
        const { token, email, name, tel, password } = registerDataDto;

        try {
            await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_REGISTER_KEY,
            });
        } catch (e) {
            throw new ConflictException("Token is invalid or expired");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userExists = await this.prismaClient.user.findUnique({
            where: {
                email,
            },
        });
        if (userExists) {
            throw new ConflictException("Email has already used");
        }

        const user = await this.prismaClient.user.create({
            data: {
                id: uuid(),
                email,
                name,
                tel,
                password: hashedPassword,
                role: Role.RESIDENT,
                profileImage: {
                    create: {}
                },
            },
            select: {
                id: true,
                name: true,
                profileImage: {
                    select: {
                        url: true,
                    },
                },
                role: true,
            },
        });

        const accessToken = this.jwtService.sign(
            {
                sub: user.id,
                role: user.role,
            },
            {
                expiresIn: "3d",
                secret: process.env.JWT_RESIDENT_AUTHENTICATION_KEY!,
            },
        );

        const realtimeToken = this.jwtService.sign({
            sub: user.id,
            role: user.role
        }, {
            expiresIn: "3d",
            secret: process.env.JWT_REALTIME_AUTHENTICATION_KEY!
        })

        return {
            token: accessToken,
            user,
            realtimeToken
        };
    }

    genRegisterToken(): { token: string } {
        const token = this.jwtService.sign(
            { type: "REGISTERING" },
            { expiresIn: "5m", secret: process.env.JWT_REGISTER_KEY },
        );
        return { token };
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(changePasswordDto.password, salt);
        await this.prismaClient.user.update({
            where: {
                id: userId
            },
            data: {
                password: hashedPassword
            }
        })
    }
}
