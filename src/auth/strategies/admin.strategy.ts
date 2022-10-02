import { Role } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

interface JwtPayload {
    sub: string;
    role: Role;
}

@Injectable()
export class AdminStrategy extends PassportStrategy(
    Strategy,
    "jwt-admin-access",
) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_ADMIN_AUTHENTICATION_KEY!,
        });
    }

    validate(payload: JwtPayload) {
        return payload;
    }
}
