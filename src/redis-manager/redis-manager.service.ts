import Redis from "ioredis";
import { Injectable } from "@nestjs/common";
import { InjectRedis } from "@liaoliaots/nestjs-redis";

@Injectable()
export class RedisManagerService {
    constructor(@InjectRedis() private redis: Redis) {}

    setNewJoinedClient(userId: string, socketId: string): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const addedMember = await this.redis.sadd(userId, socketId);
                resolve(addedMember);
            } catch (e) {
                reject(e);
            }
        });
    }

    removeJoinedClient(userId: string, socketId: string): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const removedMember = await this.redis.srem(userId, socketId);
                resolve(removedMember);
            } catch (e) {
                reject(e);
            }
        });
    }

    getSpecifiedClientSocketIds(userId: string): Promise<string[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const socketIds = await this.redis.smembers(userId);
                resolve(socketIds);
            } catch (e) {
                reject(e);
            }
        });
    }
}
