import type { ClientMessage, Vector3, FacingAngles } from "../types";

export class WebsocketSend {
    private socketRef: React.RefObject<WebSocket | null>;

    constructor(socketRef: React.RefObject<WebSocket | null>){
        this.socketRef = socketRef;
    }
    
    //We use arrow functions because they capture "this" value, making it possible to pass them down as props to components
    //while maintaining the information necessary to be derived from the class
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