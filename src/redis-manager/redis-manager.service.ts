import Redis from "ioredis";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRedis } from "@liaoliaots/nestjs-redis";

@Injectable()
export class RedisManagerService {
    constructor(@InjectRedis() private redis: Redis) {}

    getAllKeys() {
        return this.redis.keys("*");
    }

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

    async getAllClientSocketIds(
        initSocketIds: string[][],
        allKeys: string[],
        curIndex=0,
    ): Promise<string[][]> {
        try {
            if (allKeys.length === 0) {
                return initSocketIds;
            }
            const socketIds = await this.redis.smembers(
                allKeys[curIndex],
            );
            initSocketIds.push(socketIds);
            allKeys.shift();
            curIndex++;
            return this.getAllClientSocketIds(initSocketIds, allKeys);
        } catch (e) {
            throw new InternalServerErrorException();
        }
    }
}
