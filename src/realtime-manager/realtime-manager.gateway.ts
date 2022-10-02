import { RealtimeManagerService } from "./realtime-manager.service";
import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayDisconnect,
} from "@nestjs/websockets";
import { ConnectedSocket } from "@nestjs/websockets";
import { Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: "*",
    },
})
export class RealtimeManagerGateway implements OnGatewayDisconnect<Socket> {
    constructor(private realTimeManagerService: RealtimeManagerService) {}

    handleDisconnect(@ConnectedSocket() client: Socket) {
        this.realTimeManagerService.verifyRequestHeader(client);
        this.realTimeManagerService.disconnect(client);
        client.emit("disconnected");
    }

    @SubscribeMessage("join")
    join(@ConnectedSocket() client: Socket) {
        this.realTimeManagerService.verifyRequestHeader(client);
        this.realTimeManagerService.join(client);
        client.emit("joined");
    }
}
