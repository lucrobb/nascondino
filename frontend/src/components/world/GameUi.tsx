import type { StatusType, Player } from "../../types";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";
import { WebsocketSend } from "../../api/game";

interface GameUiProps {
    status: StatusType;
    timeRemaining: number | null;
    winner: "hunters" | "hiders" | null;
    player: Player;
    onNavigate: (url: string) => void;
    onWsSend: WebsocketSend;
}

export function GameUi({
    status,
    timeRemaining,
    winner,
    player,
    onNavigate,
    onWsSend,
}: GameUiProps) {
    const formattedTime =
        timeRemaining !== null
            ? `${Math.floor(timeRemaining / 60)}:${String(
                  timeRemaining % 60
              ).padStart(2, "0")}`
            : null;

    return (
        <>
            {/* Top-right controls */}
            <div className="fixed right-6 top-6 z-20 flex flex-col items-end gap-2">
                {player.isCreator && status !== "in_progress" && (
                    <Button
                        onClick={onWsSend.startGame}
                        className="h-10 rounded-md border border-primary/20 px-4 uppercase tracking-wide shadow-lg shadow-black/5"
                    >
                        Inizia partita
                        <Kbd className="ml-3 border-0 bg-transparent px-0 text-current opacity-60">
                            ⏎
                        </Kbd>
                    </Button>
                )}

                {status === "ended" && (
                    <Button
                        onClick={() => onNavigate("/")}
                        variant="outline"
                        className="h-10 rounded-md bg-background/90 px-4 uppercase tracking-wide backdrop-blur-md"
                    >
                        Esci
                        <Kbd className="ml-3 border-0 bg-transparent px-0 text-current opacity-50">
                            ⌫
                        </Kbd>
                    </Button>
                )}
            </div>

            {/* Waiting / game-over banner */}
            {(status === "waiting" || status === "ended") && (
                <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-6 pt-6">
                    <div className="relative overflow-hidden rounded-md border border-border/80 bg-background/90 px-5 py-3 shadow-lg shadow-black/5 backdrop-blur-md">
                        {/* Accent line */}
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-primary" />

                        <div className="flex items-center gap-3 pl-1">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                            <span className="text-xs font-medium uppercase tracking-[0.12em]">
                                {status === "waiting" &&
                                    (player.isCreator
                                        ? "In attesa che inizi la partita"
                                        : "In attesa che l'host inizi la partita")}

                                {status === "ended" &&
                                    `La partita è finita. Hanno vinto i ${
                                        winner === "hunters"
                                            ? "cacciatori"
                                            : "nascosti"
                                    }`}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Timer */}
            {status === "in_progress" && timeRemaining !== null && (
                <div className="pointer-events-none fixed right-6 top-6 z-20">
                    <div className="rounded-md border border-border/80 bg-background/75 px-4 py-2.5 shadow-lg shadow-black/5 backdrop-blur-md">
                        <div className="flex items-baseline gap-2">
                            <span className="font-mono text-xl font-medium tabular-nums tracking-tight">
                                {formattedTime}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Player role */}
            {status === "in_progress" && !player.isFound && (
                <div className="pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2">
                    <div
                        className={`flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] shadow-lg shadow-black/5 backdrop-blur-md ${
                            player.isHunter
                                ? "border-primary/30 bg-primary/95 text-primary-foreground"
                                : "border-border/80 bg-background/80 text-foreground"
                        }`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                player.isHunter
                                    ? "bg-primary-foreground"
                                    : "bg-primary"
                            }`}
                        />

                        {player.isHunter ? "Cacciatore" : "Nascost*"}
                    </div>
                </div>
            )}

            {/* Found notification */}
            {status === "in_progress" && player.isFound && (
                <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-6 pt-6">
                    <div className="rounded-md border border-destructive/30 bg-destructive/95 px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-destructive-foreground shadow-lg shadow-black/10 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />

                            Sei stat* trovat*
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}