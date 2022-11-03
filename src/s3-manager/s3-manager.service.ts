import { Injectable } from "@nestjs/common";
import { InjectAwsService } from "nest-aws-sdk";
import { S3 } from "aws-sdk";
import { v4 as uuid } from "uuid";
const fs = require("fs");

@Injectable()
export class S3ManagerService {
    constructor(@InjectAwsService(S3) private s3: S3) {}

    private getUploadImageParams(
        folder: string,
        file: Express.Multer.File,
    ): S3.PutObjectRequest {
        return {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `${folder}/${uuid()}.${file.mimetype.split("/")[1]}`,
            Body: file.buffer,
            ACL: "public-read",
            ContentType: file.mimetype,
        };
    }

    private getDeleteObjectParams(key: string): S3.DeleteObjectRequest {
        return {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
        };
    }

    uploadToS3(
        folder: string,
        file: Express.Multer.File,
    ): Promise<{ url: string; key: string }> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = this.getUploadImageParams(folder, file);
                const result = await this.s3.upload(params).promise();
                resolve({
                    url: result.Location,
                    key: result.Key,
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    uploadPdfFileToS3(fileSrc: string): Promise<{ url: string; key: string }> {
        return new Promise(async (resolve, reject) => {
            try {
                const fileStream = fs.createReadStream(fileSrc);
                const now = new Date();
                const params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: `monthly-rents/${now.getFullYear()}-${now.getMonth()}-${now.getDate()}_${uuid()}.pdf`,
                    Body: fileStream,
                    ACL: "public-read",
                    ContentType: "application/pdf",
                };
                const uploadedFile = await this.s3.upload(params).promise();
                resolve({
                    url: uploadedFile.Location,
                    key: uploadedFile.Key,
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async removeObjectFromS3(oldKey: string) {
        const params = this.getDeleteObjectParams(oldKey);
        await this.s3.deleteObject(params).promise();
    }
}
