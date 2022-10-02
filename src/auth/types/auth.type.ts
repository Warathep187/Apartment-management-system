import { Role } from "@prisma/client";

export interface LoggedInResponse {
    user: {
        id: string;
        name: string;
        profileImage: {
            url: string;
        };
        role: Role;
    };
    token: string;
    realtimeToken: string;
}
