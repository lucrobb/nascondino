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
    TabsTrigger
} from "../../components/ui/tabs";
import{
    Table,
    TableCaption,
    TableHeader,
    TableRow,
    TableHead,
    TableCell,
    TableBody
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
                className="pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <Tabs defaultValue="menu">
                    <TabsList className="mb-4">
                        <TabsTrigger value="menu" className="uppercase tracking-wide">Menu</TabsTrigger>
                        {isCreator && <TabsTrigger value="players" className="uppercase tracking-wide">Giocatori</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="menu">
                        <div className="flex flex-col gap-4">
                            <Button onClick={() => onMenuOpenChange(false)}>Riprendi</Button>

                            {isCreator && (
                                <div className="border-t pt-4 flex flex-col gap-2">
                                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                                        Controlli host
                                    </span>

                                    {status !== "in_progress" && (
                                        <Button onClick={() => {
                                            onWsSend.startGame();
                                            onMenuOpenChange(false);
                                        }}>
                                            Inizia partita
                                        </Button>
                                    )}
                                    {status === "in_progress" && (
                                        <Button variant="destructive" onClick={onWsSend.endGame}>
                                            Termina partita
                                        </Button>
                                    )}
                                </div>
                            )}

                            <Button variant="destructive" onClick={() => onNavigate("/")}>Esci dalla partita</Button>
                        </div>
                    </TabsContent>
                    {isCreator && (
                        <TabsContent value="players">
                            <Table>
                                <TableCaption>{otherPlayers.length > 1 ? "Giocatori nella lobby" : "La lobby è vuota"}</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="uppercase tracking-wide">Nome</TableHead>
                                        <TableHead className="uppercase tracking-wide">Cacciatore</TableHead>
                                        <TableHead className="uppercase tracking-wide">Trovat*</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {otherPlayers.map((p) => p.id !== playerId.current && (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.name}</TableCell>
                                            <TableCell>{p.isHunter ? "SÌ" : "NO"}</TableCell>
                                            <TableCell>{p.isFound ? "SÌ" : "NO"}</TableCell>
                                            <TableCell align="right">
                                                <Button variant="destructive" className="text-xs h-fit p-2" onClick={() => onWsSend.kickPlayer(p.id)}>Espelli</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    )}
                </Tabs>
                
            </DialogContent>
        </Dialog>
    )
}