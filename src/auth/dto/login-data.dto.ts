import { IsEmail } from "class-validator";
import { IsString, MinLength } from "class-validator";

export class LoginDataDto {
    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;
}
