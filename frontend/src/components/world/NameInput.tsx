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

export function NameInput({ name, nameInput, onNameInputChange, onHandleNameSubmit }: NameInputProps) {
    return (
        <Dialog open={!name}>
            <DialogContent>
                <DialogHeader className="uppercase tracking-wide">
                    <DialogTitle>Unisciti alla lobby</DialogTitle>
                    <DialogDescription>
                        Inserisci il nome per unirti alla lobby.
                    </DialogDescription>
                </DialogHeader>

                <form //Allows us to use the return button to submit as well
                    onSubmit={(e) => {
                        e.preventDefault();
                        onHandleNameSubmit();
                    }}
                    className="space-y-4"
                >
                    <Input
                        onChange={(e) => onNameInputChange(e.target.value)}
                        placeholder="Il tuo nome"
                        maxLength={20}
                        autoFocus
                    />

                    <Button
                        type="submit"
                        disabled={!nameInput.trim()}
                        className="w-full"
                    >
                        Unisciti
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}