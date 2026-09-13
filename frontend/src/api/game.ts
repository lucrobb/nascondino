import type { ClientMessage } from "../types";

export class WebsocketSend {
    private socketRef: React.RefObject<WebSocket | null>;

    constructor(socketRef: React.RefObject<WebSocket | null>){
        this.socketRef = socketRef;
    }
    
    private send(content: ClientMessage) {
        if (this.socketRef.current) {
            this.socketRef.current.send(JSON.stringify(content))
        }
    }

    public captureTarget(targetId: string): void {
        this.send({
            type: "capture_attempt",
            targetId
        })
    }
    public startGame(): void {
        this.send({
            type: "start_game"
        })
    }
    public kickPlayer(id: string): void {
        this.send({
            type: "kick_player",
            id
        })
    }
}