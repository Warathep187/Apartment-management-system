import { IsPhoneNumber, IsString } from "class-validator";

export class UpdateProfileDto {
    @IsString()
    name: string;

    @IsPhoneNumber("TH")
    tel: string;
}