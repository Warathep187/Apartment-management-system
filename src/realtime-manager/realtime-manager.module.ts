import { RedisManagerService } from './../redis-manager/redis-manager.service';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeManagerGateway } from './realtime-manager.gateway';
import { Module } from '@nestjs/common';
import { RealtimeManagerService } from './realtime-manager.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [RealtimeManagerGateway, RealtimeManagerService, RedisManagerService],
  exports: [RealtimeManagerService]
})
export class RealtimeManagerModule {}
