import { Injectable } from '@nestjs/common';
import { InjectAwsService } from 'nest-aws-sdk';
import { SNS } from 'aws-sdk';

@Injectable()
export class SnsManagerService {
    constructor(@InjectAwsService(SNS) private sns: SNS) {}

    private getSnsParams = (phoneNo: string): {Message: string, PhoneNumber: string} => {
        return {
            Message: `Hello, please check ${process.env.CLIENT_URL}/monthly-rents`,
            PhoneNumber: `+66${phoneNo}`
        }
    }

    async sendSMStoResidents(residentsTel: {id: string, tel: string}[]) {
        for(const residentTel of residentsTel) {
            await this.sns.publish(this.getSnsParams(residentTel.tel)).promise();
        }
    }
}
