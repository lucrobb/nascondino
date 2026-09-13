import type { ClientMessage, Vector3, FacingAngles } from "../types";

export class WebsocketSend {
    private socketRef: React.RefObject<WebSocket | null>;

    constructor(socketRef: React.RefObject<WebSocket | null>){
        this.socketRef = socketRef;
    }
    
    private send = (content: ClientMessage): void => {
        if (this.socketRef.current) {
            this.socketRef.current.send(JSON.stringify(content))
        }
    }

    public join = (
        position: Vector3,
        facing: FacingAngles,
        isHunter: boolean,
        isFound: boolean,
        name: string
    ): void =>  {
        this.send({
            type: "join",
            player: {
                position,
                facing,
                isHunter,
                isFound,
                name
            }
        })
    }

    public captureTarget = (targetId: string): void => {
        this.send({
            type: "capture_attempt",
            targetId
        })
    }
    public startGame = (): void => {
        this.send({
            type: "start_game"
        })
    }
    public kickPlayer = (id: string): void => {
        this.send({
            type: "kick_player",
            id
        })
    }
    public move = (position: Vector3, facing: FacingAngles): void => {
        this.send({
            type: "move",
            position,
            facing
        })
    }
}