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
                  Math.floor(timeRemaining % 60)
              ).padStart(2, "0")}`
            : null;

    const gameEnded = status === "ended";
    const playerWasFound =
        status === "in_progress" && player.isFound;

    const captureSucceeded =
        captureFeedback !== null;

    return (
        <div className="game-ui">

            {/* ==================================================
                CROSSHAIR
            ================================================== */}

            {status === "in_progress" && !playerWasFound && (
                <div className="game-crosshair" aria-hidden="true">
                    <span className="game-crosshair__line game-crosshair__line--top" />
                    <span className="game-crosshair__line game-crosshair__line--right" />
                    <span className="game-crosshair__line game-crosshair__line--bottom" />
                    <span className="game-crosshair__line game-crosshair__line--left" />
                    <span className="game-crosshair__dot" />
                </div>
            )}

            {/* ==================================================
                TOP LEFT — GAME STATUS
            ================================================== */}

            {status === "in_progress" && !playerWasFound && (
                <div className="game-status">
                    <div
                        className={`game-status__role ${
                            player.isHunter
                                ? "game-status__role--hunter"
                                : "game-status__role--hider"
                        }`}
                    >
                        <span className="game-status__indicator" />

                        <span>
                            {player.isHunter
                                ? "Cacciatore"
                                : "Nascost*"}
                        </span>
                    </div>
                </div>
            )}

            {/* ==================================================
                TOP RIGHT — HOST CONTROL
            ================================================== */}

            {!gameEnded && player.isCreator && status !== "in_progress" && (
                <div className="game-host-control">
                    <Button
                        onClick={onWsSend.startGame}
                        className="game-start-button"
                    >
                        <span>Inizia partita</span>

                        <Kbd className="game-start-button__kbd">
                            ⏎
                        </Kbd>
                    </Button>
                </div>
            )}

            {/* ==================================================
                TOP RIGHT — TIMER
            ================================================== */}

            {status === "in_progress" && !playerWasFound && (
                <div className="game-timer">
                    <span className="game-timer__value">
                        {formattedTime}
                    </span>

                    <span className="game-timer__label">
                        tempo
                    </span>
                </div>
            )}

            {/* ==================================================
                WAITING SCREEN
            ================================================== */}

            {status === "waiting" && (
                <div className="game-waiting">
                    <div className="game-waiting__card">
                        <span className="game-waiting__indicator" />

                        <div className="game-waiting__content">
                            <span className="game-waiting__title">
                                Lobby pronta
                            </span>

                            <span className="game-waiting__message">
                                {player.isCreator
                                    ? "In attesa che inizi la partita"
                                    : "In attesa che l'host inizi la partita"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================
                PLAYER ROLE — BOTTOM
            ================================================== */}

            {status === "in_progress" && !playerWasFound && (
                <div className="game-role">
                    <div
                        className={`game-role__badge ${
                            player.isHunter
                                ? "game-role__badge--hunter"
                                : "game-role__badge--hider"
                        }`}
                    >
                        <span className="game-role__dot" />

                        <span>
                            {player.isHunter
                                ? "Cacciatore"
                                : "Nascost*"}
                        </span>
                    </div>
                </div>
            )}

            {/* ==================================================
                CAPTURE FEEDBACK
            ================================================== */}

            {captureFeedback && status === "in_progress" && (
                <div
                    className={`capture-feedback ${
                        captureSucceeded
                            ? "capture-feedback--success"
                            : "capture-feedback--miss"
                    }`}
                >
                    <div className="capture-feedback__flash" />

                    <div className="capture-feedback__content">

                        <div className="capture-feedback__reticle">
                            <span className="capture-feedback__reticle-ring" />
                            <span className="capture-feedback__reticle-ring capture-feedback__reticle-ring--inner" />

                            <span className="capture-feedback__reticle-line capture-feedback__reticle-line--top" />
                            <span className="capture-feedback__reticle-line capture-feedback__reticle-line--right" />
                            <span className="capture-feedback__reticle-line capture-feedback__reticle-line--bottom" />
                            <span className="capture-feedback__reticle-line capture-feedback__reticle-line--left" />

                            <span className="capture-feedback__reticle-center" />
                        </div>

                        <div className="capture-feedback__label">
                            {captureSucceeded
                                ? "CATTURATO"
                                : "MANCATO"}
                        </div>

                        <div className="capture-feedback__target">
                            {captureFeedback}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================
                FOUND / ELIMINATED
            ================================================== */}

            {playerWasFound && (
                <div className="found-screen">
                    <div className="found-screen__vignette" />
                    <div className="found-screen__scanlines" />

                    <div className="found-screen__content">

                        <div className="found-screen__symbol">
                            <span className="found-screen__symbol-line found-screen__symbol-line--a" />
                            <span className="found-screen__symbol-line found-screen__symbol-line--b" />
                        </div>

                        <div className="found-screen__eyebrow">
                            ELIMINATO
                        </div>

                        <h2 className="found-screen__title">
                            TROVATO
                        </h2>

                        <p className="found-screen__subtitle">
                            Non puoi più nasconderti
                        </p>

                    </div>
                </div>
            )}

            {/* ==================================================
                GAME OVER
            ================================================== */}

            {gameEnded && (
                <div className="game-over">
                    <div className="game-over__backdrop" />

                    <div
                        className={`game-over__panel ${
                            winner === "hunters"
                                ? "game-over__panel--hunters"
                                : "game-over__panel--hiders"
                        }`}
                    >
                        <div className="game-over__top-line" />

                        <div className="game-over__eyebrow">
                            PARTITA TERMINATA
                        </div>

                        <div className="game-over__symbol">
                            <span />
                        </div>

                        <div className="game-over__winner-label">
                            HANNO VINTO
                        </div>

                        <h1 className="game-over__title">
                            {winner === "hunters"
                                ? "I CACCIATORI"
                                : "I NASCOSTI"}
                        </h1>

                        <p className="game-over__description">
                            {winner === "hunters"
                                ? "Tutti i giocatori nascosti sono stati trovati."
                                : "Il tempo è scaduto prima che tutti i giocatori venissero trovati."}
                        </p>

                        <Button
                            onClick={() => onNavigate("/")}
                            className="game-over__button"
                        >
                            <span>Torna alla lobby</span>

                            <Kbd className="game-over__button-kbd">
                                ⌫
                            </Kbd>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}