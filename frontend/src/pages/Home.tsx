import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
    const [roomCode, setRoomCode] = useState<string>("");
    const navigate = useNavigate();

    function handleJoin() {
        const code = roomCode.trim().toUpperCase();

        if (code.length !== 8) {
            toast.error("Il codice non è valido! Riprova.");
            return;
        }

        navigate(`/lobby/${code}`);
    }

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background text-foreground">
            {/* Background grid */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, currentColor 1px, transparent 1px),
                        linear-gradient(to bottom, currentColor 1px, transparent 1px)
                    `,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* Decorative corners */}
            <div className="pointer-events-none absolute left-6 top-6 h-12 w-12 border-l border-t border-primary/30" />
            <div className="pointer-events-none absolute right-6 top-6 h-12 w-12 border-r border-t border-primary/30" />
            <div className="pointer-events-none absolute bottom-6 left-6 h-12 w-12 border-b border-l border-primary/30" />
            <div className="pointer-events-none absolute bottom-6 right-6 h-12 w-12 border-b border-r border-primary/30" />

            <main className="relative flex w-full max-w-md flex-col items-center px-6">
                {/* Header */}
                <div className="mb-10 text-center">

                    <h1 className="text-6xl font-semibold uppercase tracking-[-0.04em] sm:text-7xl">
                        Nascondino
                    </h1>

                    <div className="mx-auto mt-5 h-1 w-12 rounded-full bg-primary" />
                </div>

                {/* Main card */}
                <div className="w-full rounded-md border border-border bg-card p-6 shadow-sm sm:p-7">
                    <div className="mb-6">
                        <p className="text-sm font-medium uppercase tracking-wide">
                            Unisciti a una partita
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Inserisci il codice della lobby per iniziare.
                        </p>
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleJoin();
                        }}
                        className="space-y-3"
                    >
                        <Input
                            value={roomCode}
                            onChange={(e) =>
                                setRoomCode(e.target.value.toUpperCase())
                            }
                            placeholder="CODICE LOBBY"
                            maxLength={8}
                            autoComplete="off"
                            spellCheck={false}
                            className="h-12 rounded-md border-border bg-background text-center text-base font-medium uppercase tracking-[0.5em] placeholder:tracking-[0.15em] placeholder:text-muted-foreground/60"
                        />

                        <Button
                            type="submit"
                            className="h-12 w-full uppercase tracking-wide"
                        >
                            Unisciti
                        </Button>
                    </form>

                    <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            oppure
                        </span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <Button
                        onClick={() => navigate("/build")}
                        variant="outline"
                        className="h-12 w-full uppercase tracking-wide"
                    >
                        Crea lobby
                    </Button>
                </div>
            </main>
        </div>
    );
}