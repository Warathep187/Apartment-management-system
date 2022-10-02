import { RedisManagerService } from "./../redis-manager/redis-manager.service";
import { Role } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "./types/jwt-payload.type";
import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets/errors";
import { Socket, Server } from "socket.io";
import { WebSocketServer } from "@nestjs/websockets";
import { WebSocketGateway } from "@nestjs/websockets/decorators";

@WebSocketGateway()
@Injectable()
export class RealtimeManagerService {
    @WebSocketServer()
    server: Server;

    constructor(
        private jwtService: JwtService,
        private redisManagerService: RedisManagerService,
    ) {}

    verifyRequestHeader(client: Socket, verifyAdmin = false) {
        const headers = client.handshake.headers;
        if (!headers.authorization) {
            throw new WsException("Access denied");
        }
        try {
            const payload: JwtPayload = this.jwtService.verify(
                headers.authorization,
                {
                    secret: process.env.JWT_REALTIME_AUTHENTICATION_KEY!,
                },
            );
            if (verifyAdmin) {
                if (payload.role !== Role.ADMIN) {
                    throw new WsException("Access denied");
                }
            }
            client.handshake.auth = payload;
        } catch (e) {
            throw new WsException("Access denied");
        }
    }

    async join(client: Socket) {
        await this.redisManagerService.setNewJoinedClient(
            client.handshake.auth.sub,
            client.id,
        );
    }

    async disconnect(client: Socket) {
        await this.redisManagerService.removeJoinedClient(
            client.handshake.auth.sub,
            client.id,
        );
    }

    emitEventToClient(event: string, socketIds: string[], data: any) {
        this.server.to(socketIds).emit(event, data);
    }
}
