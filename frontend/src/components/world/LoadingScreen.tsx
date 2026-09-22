interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({
    message = "Caricamento partita",
}: LoadingScreenProps) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-foreground">
            {/* Subtle background grid */}
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

            {/* Decorative corner elements */}
            <div className="pointer-events-none absolute left-6 top-6 h-12 w-12 border-l border-t border-primary/30" />
            <div className="pointer-events-none absolute right-6 top-6 h-12 w-12 border-r border-t border-primary/30" />
            <div className="pointer-events-none absolute bottom-6 left-6 h-12 w-12 border-b border-l border-primary/30" />
            <div className="pointer-events-none absolute bottom-6 right-6 h-12 w-12 border-b border-r border-primary/30" />

            <div className="relative flex w-full max-w-sm flex-col items-center px-6">
                {/* Logo / title */}
                <div className="mb-10 text-center">

                    <h1 className="text-5xl font-semibold uppercase tracking-tight">
                        Nascondino
                    </h1>
                </div>

                {/* Loading indicator */}
                <div className="w-full rounded-md border border-border bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <span className="text-sm font-medium uppercase tracking-wide">
                            {message}
                        </span>

                        <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                            <span
                                className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]"
                            />
                            <span
                                className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]"
                            />
                        </span>
                    </div>

                    {/* Loading line */}
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
                    </div>
                </div>

                <p className="mt-5 text-center text-xs uppercase tracking-wider text-muted-foreground">
                    Preparazione della partita
                </p>
            </div>

            <style>{`
                @keyframes loading {
                    0% {
                        transform: translateX(-150%);
                    }
                    50% {
                        transform: translateX(200%);
                    }
                    100% {
                        transform: translateX(400%);
                    }
                }
            `}</style>
        </div>
    );
}