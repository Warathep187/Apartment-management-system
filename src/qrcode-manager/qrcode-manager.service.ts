const generatePayload = require("promptpay-qr");
const qrCode = require("qrcode");
import { Injectable } from "@nestjs/common";

@Injectable()
export class QrcodeManagerService {
    private promptpayNumber = process.env.PROMPTPAY_NUMBER!;

    private generateSvg(payload: string): Promise<string> {
        return new Promise((resolve, reject) => {
            qrCode.toString(payload, { type: "svg" }, (err, svg) => {
                if (err) {
                    reject(err);
                }
                resolve(svg);
            });
        });
    }

    getQrCodePayload(amount: number): Promise<string> {
        const payload = generatePayload(this.promptpayNumber, {
            amount,
        });
        return this.generateSvg(payload);
    }
}
