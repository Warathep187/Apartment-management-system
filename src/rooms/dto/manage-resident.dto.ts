import { IsString, IsUUID } from "class-validator";

export class AddResidentDto {
    @IsString()
    @IsUUID("4")
    userId: string;
}

export class RemoveResidentDto {
    @IsString()
    @IsUUID("4")
    userId: string;
}