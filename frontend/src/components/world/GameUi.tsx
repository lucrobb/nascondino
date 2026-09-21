import type { StatusType, Player } from '../../types';
import { Button } from '../ui/button';
import { Kbd } from '../ui/kbd';
import { WebsocketSend } from '../../api/game';


interface GameUiProps {
    status: StatusType;
    timeRemaining: number | null;
    winner: "hunters" | "hiders" | null;
    player: Player ;
    onNavigate: (url: string) => void;
    onWsSend: WebsocketSend;
}

export function GameUi({ status, timeRemaining, winner, player, onNavigate, onWsSend }: GameUiProps) {
    return (
        <>
            {/*Action buttons*/}
            <div className="fixed top-10 right-10 z-20 flex flex-col gap-2">
                {player.isCreator && status !== "in_progress" && (
                    <Button onClick={onWsSend.startGame}>
                        Inizia partita
                        <Kbd className="ml-2 bg-transparent text-current">⏎</Kbd>
                    </Button>
                )}
                {status === "ended" && (
                    <Button onClick={() => onNavigate("/")}>
                        Esci
                        <Kbd className="ml-2 bg-transparent text-current">⌫</Kbd>
                    </Button>
                )}
            </div>

            {/*Status banners*/}
            <div className="fixed top-0 inset-x-0 flex justify-center pt-6 z-20 pointer-events-none">
                <div className="bg-background border-2 px-6 py-2 rounded-md uppercase tracking-wide font-medium">
                    <>
                        {status === "waiting" && (
                            player.isCreator ? "In attesa che inizi la partita" : "In attesa che l'host inizi la partita"
                        )}
                        {status === "ended" &&(
                            `La partita è finita. Hanno vinto i ${winner === "hunters" ? "cacciatori" : "nascosti"}`
                        )}
                    </>
                </div>
            </div>

            {/*In progress information*/}
            {status === "in_progress" && timeRemaining !== null && (
                <div className="fixed top-6 right-6 z-20 text-2xl font-mono">
                    {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
                </div>
            )}
            {status === "in_progress" && !player?.isFound && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <div className={`px-6 py-2 rounded-md uppercase tracking-wide font-medium ${
                        player?.isHunter ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}>
                        {player?.isHunter ? "Cacciatore" : "Nascost*"}
                    </div>
                </div>
            )}
            {status === "in_progress" && player.isFound && (
                <div className="fixed top-0 inset-x-0 flex justify-center pt-6 z-20 pointer-events-none">
                    <div className="bg-destructive text-destructive-foreground px-6 py-2 rounded-md uppercase tracking-wide font-medium">
                        Sei stat* trovat*
                    </div>
                </div>
            )}
        </>
    )
}