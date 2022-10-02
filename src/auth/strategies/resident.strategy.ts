import { Role } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

interface JwtPayload {
    sub: string;
    role: Role;
}

@Injectable()
export class ResidentStrategy extends PassportStrategy(
    Strategy,
    "jwt-resident-access",
) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_RESIDENT_AUTHENTICATION_KEY!,
        });
    }

    validate(payload: JwtPayload) {
        return payload;
    }
}
