import type { StatusType, Player } from "../../types";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";
import { WebsocketSend } from "../../api/game";
import { cn } from "cn";

interface GameUiProps {
    status: StatusType;
    timeRemaining: number | null;
    winner: "hunters" | "hiders" | null;
    player: Player;
    onNavigate: (url: string) => void;
    onWsSend: WebsocketSend;
    captureFeedback: string | null;
}

export function GameUi({
    status,
    timeRemaining,
    winner,
    player,
    onNavigate,
    onWsSend,
    captureFeedback,
}: GameUiProps) {
    const formattedTime =
        timeRemaining !== null
            ? `${Math.floor(timeRemaining / 60)}:${String(
                  timeRemaining % 60
              ).padStart(2, "0")}`
            : null;

    const gameEnded = status === "ended";
    const playerWasFound = status === "in_progress" && player.isFound;

    return (
        <>
            {/* Crosshair */}
            {status === "in_progress" && !playerWasFound && (
                <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
                    <div
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                            captureFeedback
                                ? "scale-[3] bg-primary shadow-[0_0_20px_rgba(255,100,0,0.8)]"
                                : "bg-primary"
                        }`}
                    />
                </div>
            )}

            {/* Top-right controls */}
            {!gameEnded && (
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
                </div>
            )}

            {/* Timer */}
            {status === "in_progress" && !playerWasFound && (
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

            {/* Waiting */}
            {status === "waiting" && (
                <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-6 pt-6">
                    <div className="relative overflow-hidden rounded-md border border-border/80 bg-background/90 px-5 py-3 shadow-lg shadow-black/5 backdrop-blur-md">
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-primary" />

                        <div className="flex items-center gap-3 pl-1">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                            <span className="text-xs font-medium uppercase tracking-[0.12em]">
                                {player.isCreator
                                    ? "In attesa che inizi la partita"
                                    : "In attesa che l'host inizi la partita"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Player role */}
            {status === "in_progress" && !playerWasFound && (
                <div className="pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2">
                    <div
                        className={cn(
                            "rounded-lg border px-5 py-2.5 text-sm font-semibold uppercase tracking-wide shadow-lg backdrop-blur-md",
                            player.isHunter
                                ? "border-primary/40 bg-primary text-primary-foreground"
                                : "border-border/80 bg-background/85 text-foreground",
                        )}
                    >
                        {player.isHunter ? "Cacciatore" : "Nascost*"}
                    </div>
                </div>
            )}

            {/* Hunter capture feedback */}
            {captureFeedback && status === "in_progress" && (
                <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
                    <div className="animate-capture-event rounded-lg border border-primary/50 bg-background/90 px-6 py-4 text-center shadow-2xl backdrop-blur-md">
                        <div className="text-2xl font-bold uppercase tracking-wide text-primary">
                            Catturato
                        </div>

                        <div className="mt-1 text-sm text-muted-foreground">
                            {captureFeedback}
                        </div>
                    </div>
                </div>
            )}

            {/* Found transition */}
            {playerWasFound && (
                <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-background/45 backdrop-blur-[2px] animate-found-screen">
                    <div className="mx-6 w-full max-w-md text-center">
                        <div className="mb-5 flex items-center justify-center gap-3">
                            <span className="h-px w-12 bg-destructive/60" />

                            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-destructive">
                                Eliminato
                            </span>

                            <span className="h-px w-12 bg-destructive/60" />
                        </div>

                        <h2 className="text-5xl font-semibold uppercase tracking-[0.12em]">
                            Sei stat* trovat*
                        </h2>

                        <p className="mt-4 text-sm uppercase tracking-[0.14em] text-muted-foreground">
                            Non puoi più nasconderti
                        </p>
                    </div>
                </div>
            )}

            {/* Game over */}
            {gameEnded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-6 backdrop-blur-md animate-game-over">
                    <div className="w-full max-w-lg text-center">
                        <div className="mb-8 flex items-center justify-center gap-4">
                            <span className="h-px flex-1 bg-border" />

                            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                                Partita terminata
                            </span>

                            <span className="h-px flex-1 bg-border" />
                        </div>

                        <div
                            className={`mx-auto mb-6 h-2 w-2 rounded-full ${
                                winner === "hunters"
                                    ? "bg-primary shadow-[0_0_30px_rgba(255,100,0,0.7)]"
                                    : "bg-foreground shadow-[0_0_30px_rgba(255,255,255,0.35)]"
                            }`}
                        />

                        <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                            Hanno vinto
                        </p>

                        <h1 className="mt-3 text-5xl font-semibold uppercase tracking-[0.12em]">
                            {winner === "hunters"
                                ? "I cacciatori"
                                : "I nascosti"}
                        </h1>

                        <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
                            {winner === "hunters"
                                ? "Tutti i giocatori nascosti sono stati trovati."
                                : "Il tempo è scaduto prima che tutti i giocatori venissero trovati."}
                        </p>

                        <div className="mt-10 flex justify-center">
                            <Button
                                onClick={() => onNavigate("/")}
                                className="h-11 rounded-md px-6 uppercase tracking-[0.14em]"
                            >
                                Torna alla lobby
                                <Kbd className="ml-3 border-0 bg-transparent px-0 text-current opacity-60">
                                    ⌫
                                </Kbd>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}