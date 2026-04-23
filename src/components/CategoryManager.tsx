import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Loader2, Plus, Edit2, Trash2, AlertTriangle, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchProcessCategories,
    createProcessCategory,
    updateProcessCategory,
    deleteProcessCategory,
    ProcessCategory,
} from '../api/processCategories';
import { LoadingSpinner, TableSkeleton } from './ui/loading-spinner';

interface CategoryManagerProps {
    open: boolean;
    onClose: () => void;
    onCategoriesChanged: () => void;
}

export function CategoryManager({ open, onClose, onCategoriesChanged }: CategoryManagerProps) {
    const [categories, setCategories] = useState<ProcessCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Estado para nueva categoría
    const [newName, setNewName] = useState('');

    // Estado para edición
    const [editingCategory, setEditingCategory] = useState<ProcessCategory | null>(null);
    const [editName, setEditName] = useState('');

    // Estado para eliminar
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<ProcessCategory | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await fetchProcessCategories();
            setCategories(data);
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar las categorías');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadCategories();
        }
    }, [open]);

    const handleCreate = async () => {
        if (!newName.trim()) {
            toast.error('Ingrese un nombre para la categoría');
            return;
        }

        try {
            setSubmitting(true);
            await createProcessCategory({ name: newName.trim() });
            toast.success('Categoría creada exitosamente');
            setNewName('');
            await loadCategories();
            onCategoriesChanged();
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.message || 'Error al crear la categoría';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStartEdit = (category: ProcessCategory) => {
        setEditingCategory(category);
        setEditName(category.name);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setEditName('');
    };

    const handleSaveEdit = async () => {
        if (!editingCategory || !editName.trim()) {
            toast.error('Ingrese un nombre válido');
            return;
        }

        try {
            setSubmitting(true);
            await updateProcessCategory(editingCategory.id, { name: editName.trim() });
            toast.success('Categoría actualizada');
            setEditingCategory(null);
            setEditName('');
            await loadCategories();
            onCategoriesChanged();
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.message || 'Error al actualizar la categoría';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDelete = (category: ProcessCategory) => {
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;

        try {
            setDeleting(true);
            await deleteProcessCategory(categoryToDelete.id);
            toast.success(`Categoría "${categoryToDelete.name}" eliminada`);
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
            await loadCategories();
            onCategoriesChanged();
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.message || 'Error al eliminar la categoría';
            toast.error(message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderTree className="w-5 h-5" />
                            Gestionar Categorías
                        </DialogTitle>
                        <DialogDescription>
                            Administra las categorías de tipos de proceso. Las categorías con tipos asociados no pueden eliminarse.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Formulario para crear nueva categoría */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nombre de nueva categoría..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                disabled={submitting}
                            />
                            <Button onClick={handleCreate} disabled={submitting || !newName.trim()}>
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Agregar
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Tabla de categorías */}
                        {loading ? (
                            <TableSkeleton rows={3} columns={3} />
                        ) : categories.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FolderTree className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>No hay categorías registradas</p>
                            </div>
                        ) : (
                            <div className="border rounded-md max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead className="w-[100px] text-center">Tipos</TableHead>
                                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((category) => (
                                            <TableRow key={category.id}>
                                                <TableCell>
                                                    {editingCategory?.id === category.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveEdit();
                                                                    if (e.key === 'Escape') handleCancelEdit();
                                                                }}
                                                                autoFocus
                                                                className="h-8"
                                                            />
                                                            <Button size="sm" onClick={handleSaveEdit} disabled={submitting}>
                                                                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Guardar'}
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                                                Cancelar
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="font-medium">{category.name}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary">
                                                        {category._count?.processTypes ?? 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {editingCategory?.id !== category.id && (
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleStartEdit(category)}
                                                                title="Editar"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleOpenDelete(category)}
                                                                className="text-destructive hover:text-destructive"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo de confirmación de eliminación */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Confirmar eliminación
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar la categoría{' '}
                            <strong>"{categoryToDelete?.name}"</strong>?
                            <br />
                            <br />
                            {(categoryToDelete?._count?.processTypes ?? 0) > 0 ? (
                                <span className="text-destructive font-medium">
                                    ⚠️ Esta categoría tiene {categoryToDelete?._count?.processTypes} tipo(s) asociado(s) y no puede eliminarse.
                                </span>
                            ) : (
                                'Esta acción no se puede deshacer.'
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={deleting || (categoryToDelete?._count?.processTypes ?? 0) > 0}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
