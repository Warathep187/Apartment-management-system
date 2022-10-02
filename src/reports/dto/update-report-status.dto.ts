import { ReportStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateReportStatusDto {
    @IsEnum(ReportStatus)
    status: ReportStatus;
}
