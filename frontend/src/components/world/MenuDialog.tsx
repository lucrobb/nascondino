import type { WebsocketSend } from "../../api/game";
import type { OtherPlayer, StatusType } from "../../types";

import {
    Dialog,
    DialogContent,
} from "../../components/ui/dialog";

import {
    Tabs,
    TabsList,
    TabsContent,
    TabsTrigger,
} from "../../components/ui/tabs";

import {
    Table,
    TableCaption,
    TableHeader,
    TableRow,
    TableHead,
    TableCell,
    TableBody,
} from "../../components/ui/table";

import { Button } from "../../components/ui/button";

interface MenuDialogProps {
    isCreator: boolean;
    playerId: React.RefObject<string>;
    menuOpen: boolean;
    onMenuOpenChange: (menuOpen: boolean) => void;
    status: StatusType;
    onWsSend: WebsocketSend;
    onNavigate: (url: string) => void;
    otherPlayers: OtherPlayer[];
}

export function MenuDialog({
    isCreator,
    playerId,
    menuOpen,
    onMenuOpenChange,
    status,
    onWsSend,
    onNavigate,
    otherPlayers,
}: MenuDialogProps) {
    return (
        <Dialog open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DialogContent
                className="pointer-events-auto max-w-lg overflow-hidden border-border/80 bg-background/95 p-0 shadow-2xl backdrop-blur-xl"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="border-b border-border/70 px-6 pb-5 pt-6">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h2 className="text-xl font-semibold uppercase tracking-tight">
                                Menu
                            </h2>
                        </div>

                        <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    </div>
                </div>

                <div className="px-6 pb-6 pt-5">
                    <Tabs defaultValue="menu">
                        <TabsList className="mb-6 h-10 w-full justify-start rounded-md border border-border/70 bg-muted/50 p-1">
                            <TabsTrigger
                                value="menu"
                                className="h-8 flex-1 rounded-sm text-xs font-medium uppercase tracking-[0.12em] data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                                Menu
                            </TabsTrigger>

                            {isCreator && (
                                <TabsTrigger
                                    value="players"
                                    className="h-8 flex-1 rounded-sm text-xs font-medium uppercase tracking-[0.12em] data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    Giocatori
                                </TabsTrigger>
                            )}
                        </TabsList>

                        {/* Menu */}
                        <TabsContent value="menu" className="mt-0">
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() =>
                                        onMenuOpenChange(false)
                                    }
                                    className="h-11 w-full uppercase tracking-wide"
                                >
                                    Riprendi
                                </Button>

                                {isCreator && (
                                    <div className="mt-3 border-t border-border/70 pt-5">
                                        <div className="mb-3">
                                            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                                                Controlli host
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {status !== "in_progress" && (
                                                <Button
                                                    onClick={() => {
                                                        onWsSend.startGame();
                                                        onMenuOpenChange(false);
                                                    }}
                                                    className="h-11 w-full uppercase tracking-wide"
                                                >
                                                    Inizia partita
                                                </Button>
                                            )}

                                            {status === "in_progress" && (
                                                <Button
                                                    variant="destructive"
                                                    onClick={onWsSend.endGame}
                                                    className="h-11 w-full uppercase tracking-wide"
                                                >
                                                    Termina partita
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 border-t border-border/70 pt-5">
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            onNavigate("/")
                                        }
                                        className="h-11 w-full uppercase tracking-wide"
                                    >
                                        Esci dalla partita
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Players */}
                        {isCreator && (
                            <TabsContent
                                value="players"
                                className="mt-0"
                            >
                                <div className="mb-4 flex items-end justify-between">
                                    <div>
                                        <p className="text-sm font-medium uppercase tracking-wide">
                                            Giocatori
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Gestisci i partecipanti alla partita.
                                        </p>
                                    </div>

                                    <span className="font-mono text-xs text-muted-foreground">
                                        {otherPlayers.length}
                                    </span>
                                </div>

                                <div className="overflow-hidden rounded-md border border-border/70">
                                    <Table>
                                        <TableCaption className="sr-only">
                                            {otherPlayers.length > 1
                                                ? "Giocatori nella lobby"
                                                : "La lobby è vuota"}
                                        </TableCaption>

                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-[0.15em]">
                                                    Nome
                                                </TableHead>

                                                <TableHead className="h-10 text-center text-[10px] font-medium uppercase tracking-[0.15em]">
                                                    Cacciatore
                                                </TableHead>

                                                <TableHead className="h-10 text-center text-[10px] font-medium uppercase tracking-[0.15em]">
                                                    Trovat*
                                                </TableHead>

                                                <TableHead className="h-10 w-20" />
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {otherPlayers.map(
                                                (p) =>
                                                    p.id !==
                                                        playerId.current && (
                                                        <TableRow
                                                            key={p.id}
                                                            className="hover:bg-muted/30"
                                                        >
                                                            <TableCell className="font-medium">
                                                                {p.name}
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <span
                                                                    className={
                                                                        p.isHunter
                                                                            ? "text-primary font-medium"
                                                                            : "text-muted-foreground"
                                                                    }
                                                                >
                                                                    {p.isHunter
                                                                        ? "SÌ"
                                                                        : "NO"}
                                                                </span>
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <span
                                                                    className={
                                                                        p.isFound
                                                                            ? "text-destructive font-medium"
                                                                            : "text-muted-foreground"
                                                                    }
                                                                >
                                                                    {p.isFound
                                                                        ? "SÌ"
                                                                        : "NO"}
                                                                </span>
                                                            </TableCell>

                                                            <TableCell align="right">
                                                                <Button
                                                                    variant="destructive"
                                                                    className="h-8 px-2.5 text-[10px] font-medium uppercase tracking-wide"
                                                                    onClick={() =>
                                                                        onWsSend.kickPlayer(
                                                                            p.id
                                                                        )
                                                                    }
                                                                >
                                                                    Espelli
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}