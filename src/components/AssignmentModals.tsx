import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { updateProcessResponsible } from '../api/processInstances';
import { fetchUsers, type User } from '../api/users';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';

interface AssignResponsibleModalProps {
    open: boolean;
    onClose: () => void;
    processId: number;
    processTitle: string;
    currentResponsible?: { id: number; fullName: string } | null;
    onAssigned: () => void;
}

export function AssignResponsibleModal({
    open,
    onClose,
    processId,
    processTitle,
    currentResponsible,
    onAssigned,
}: AssignResponsibleModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [saving, setSaving] = useState(false);

    // Cargar usuarios cuando se abre el modal
    useEffect(() => {
        if (open) {
            const loadUsers = async () => {
                try {
                    setLoading(true);
                    const data = await fetchUsers();
                    console.log('Usuarios cargados:', data);
                    setUsers(data);
                } catch (e) {
                    console.error('Error cargando usuarios:', e);
                    toast.error('Error al cargar usuarios');
                } finally {
                    setLoading(false);
                }
            };
            loadUsers();

            // Establecer el usuario actual si existe
            if (currentResponsible) {
                setSelectedUserId(currentResponsible.id.toString());
            } else {
                setSelectedUserId('');
            }
        }
    }, [open, currentResponsible]);

    const handleAssign = async () => {
        if (!selectedUserId) {
            toast.error('Seleccione un usuario');
            return;
        }

        try {
            setSaving(true);
            await updateProcessResponsible(processId, parseInt(selectedUserId, 10));
            toast.success('Responsable asignado exitosamente');
            onAssigned();
            onClose();
        } catch (e) {
            console.error(e);
            toast.error('Error al asignar responsable');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        try {
            setSaving(true);
            await updateProcessResponsible(processId, null);
            toast.success('Responsable removido');
            onAssigned();
            onClose();
        } catch (e) {
            console.error(e);
            toast.error('Error al remover responsable');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) onClose();
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Delegar Proceso
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Delegar el proceso <strong>"{processTitle}"</strong> a otro usuario:
                    </p>

                    {currentResponsible && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="text-sm">
                                Responsable actual: <strong>{currentResponsible.fullName}</strong>
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRemove}
                                disabled={saving}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Remover
                            </Button>
                        </div>
                    )}

                    <Select
                        value={selectedUserId}
                        onValueChange={setSelectedUserId}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={loading ? 'Cargando usuarios...' : 'Seleccionar usuario'} />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.fullName} ({user.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAssign} disabled={saving || !selectedUserId}>
                            {saving ? 'Guardando...' : 'Delegar'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
