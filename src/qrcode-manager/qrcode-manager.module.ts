import { Module } from '@nestjs/common';
import { QrcodeManagerService } from './qrcode-manager.service';

@Module({
  providers: [QrcodeManagerService]
})
export class QrcodeManagerModule {}
