import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";

import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

interface NameInputProps {
    name: string | null;
    nameInput: string;
    onNameInputChange: (nameInput: string) => void;
    onHandleNameSubmit: () => void;
}

export function NameInput({
    name,
    nameInput,
    onNameInputChange,
    onHandleNameSubmit,
}: NameInputProps) {
    return (
        <Dialog open={!name}>
            <DialogContent
                className="max-w-sm border-border/80 bg-background/95 p-0 shadow-2xl backdrop-blur-xl"
            >
                <DialogHeader className="border-b border-border/70 px-6 pb-5 pt-6">
                    <DialogTitle className="text-xl font-semibold uppercase tracking-tight">
                        Unisciti alla lobby
                    </DialogTitle>

                    <DialogDescription className="mt-1 text-sm">
                        Inserisci il nome per unirti alla lobby.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onHandleNameSubmit();
                    }}
                    className="space-y-4 px-6 pb-6 pt-5"
                >
                    <div className="space-y-2">
                        <Input
                            id="player-name"
                            value={nameInput}
                            onChange={(e) =>
                                onNameInputChange(e.target.value)
                            }
                            placeholder="IL TUO NOME"
                            maxLength={20}
                            autoFocus
                            autoComplete="off"
                            className="h-12 rounded-md bg-muted/30 text-base font-medium uppercase tracking-wide placeholder:text-muted-foreground/50"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={!nameInput.trim()}
                        className="h-11 w-full uppercase tracking-wide"
                    >
                        Unisciti
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}