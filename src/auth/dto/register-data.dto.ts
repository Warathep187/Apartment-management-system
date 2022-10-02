import {IsJWT, IsString, IsNotEmpty, IsEmail, MinLength, IsPhoneNumber} from "class-validator"

export class RegisterDataDto {
    @IsJWT()
    token: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    name: string;

    @IsPhoneNumber("TH")
    tel: string
    
    @IsString()
    @MinLength(6)
    password: string
}