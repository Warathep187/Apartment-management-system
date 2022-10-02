import { AuthGuard } from "@nestjs/passport";

export class ResidentGuard extends AuthGuard("jwt-resident-access") {
    constructor() {
        super();
    }
}
