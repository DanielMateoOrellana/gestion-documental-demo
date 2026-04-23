import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Upload, Loader2, FileArchive, CheckCircle, FolderTree, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { fetchProcessTypes, type ProcessType } from "../api/processTypes";
import { fetchProcessTemplates, type ProcessTemplate } from "../api/processTemplates";
import { importProcessZip, type ImportProcessResult } from "../api/processInstances";

interface ImportProcessModalProps {
    open: boolean;
    onClose: () => void;
    onImportSuccess: (result: ImportProcessResult) => void;
}

export function ImportProcessModal({
    open,
    onClose,
    onImportSuccess,
}: ImportProcessModalProps) {
    const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
    const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    // Form state
    const [selectedTypeId, setSelectedTypeId] = useState<string>("");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [customTitle, setCustomTitle] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    useEffect(() => {
        if (selectedTypeId) {
            const filteredTemplates = templates.filter(
                (t) => t.processTypeId === parseInt(selectedTypeId)
            );
            if (filteredTemplates.length === 0) {
                setSelectedTemplateId("");
            } else if (
                !filteredTemplates.find((t) => t.id.toString() === selectedTemplateId)
            ) {
                setSelectedTemplateId("");
            }
        }
    }, [selectedTypeId, templates, selectedTemplateId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [types, temps] = await Promise.all([
                fetchProcessTypes(),
                fetchProcessTemplates(),
            ]);
            setProcessTypes(types.filter((t) => t.isActive));
            setTemplates(temps.filter((t) => t.isActive));
        } catch (e) {
            console.error("Error cargando datos", e);
            toast.error("Error cargando configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith(".zip")) {
                toast.error("Solo se aceptan archivos ZIP");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleImport = async () => {
        if (!selectedTypeId || !selectedTemplateId || !selectedFile) {
            toast.error("Complete todos los campos requeridos");
            return;
        }

        try {
            setImporting(true);
            const result = await importProcessZip(
                selectedFile,
                parseInt(selectedTypeId),
                parseInt(selectedTemplateId),
                customTitle || undefined,
                new Date().getFullYear()
            );

            toast.success(
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Expediente importado</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {result.stats.filesImported} archivos procesados
                        {result.stats.filesSkipped > 0 && (
                            <>, {result.stats.filesSkipped} omitidos</>
                        )}
                    </div>
                </div>
            );

            onImportSuccess(result);
            handleClose();
        } catch (e: any) {
            console.error("Error importando expediente", e);
            const message =
                e.response?.data?.message || "Error al importar el expediente";
            toast.error(message);
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setSelectedTypeId("");
        setSelectedTemplateId("");
        setCustomTitle("");
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onClose();
    };

    const filteredTemplates = templates.filter(
        (t) => t.processTypeId === parseInt(selectedTypeId)
    );

    const isValid = selectedTypeId && selectedTemplateId && selectedFile;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <FileArchive className="w-5 h-5 text-primary" />
                        Importar Expediente
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Cree un proceso importando un archivo ZIP.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        {/* Tipo */}
                        <div className="space-y-1.5">
                            <Label htmlFor="processType" className="text-xs font-semibold">Tipo de Proceso *</Label>
                            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Seleccione tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {processTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Plantilla */}
                        <div className="space-y-1.5">
                            <Label htmlFor="template" className="text-xs font-semibold">Plantilla *</Label>
                            <Select
                                value={selectedTemplateId}
                                onValueChange={setSelectedTemplateId}
                                disabled={!selectedTypeId}
                            >
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue
                                        placeholder={
                                            selectedTypeId
                                                ? "Seleccione plantilla"
                                                : "Seleccione tipo primero"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredTemplates.map((template) => (
                                        <SelectItem key={template.id} value={template.id.toString()}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Título */}
                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-xs font-semibold">
                                Título <span className="text-muted-foreground font-normal">(opcional)</span>
                            </Label>
                            <Input
                                id="title"
                                className="h-9 text-sm"
                                placeholder="Nombre del proceso"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                            />
                        </div>

                        {/* SECCIÓN DE CARGA DE ARCHIVO MEJORADA */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Archivo ZIP *</Label>

                            {/* Input real oculto */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".zip"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {!selectedFile ? (
                                // Botón grande "Dropzone"
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-24 border-dashed border-2 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 hover:border-primary/50 transition-all group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="p-2 bg-muted rounded-full group-hover:bg-background transition-colors">
                                        <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-sm font-medium text-foreground">Seleccionar archivo</span>
                                        <span className="text-[10px] text-muted-foreground">Formato .zip permitido</span>
                                    </div>
                                </Button>
                            ) : (
                                // Tarjeta de archivo seleccionado
                                <div className="w-full border rounded-md p-3 flex items-center justify-between bg-muted/20 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
                                            <FileArchive className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium truncate max-w-[180px]">
                                                {selectedFile.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Cambiar archivo"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Visualización de estructura */}
                        <div className="bg-slate-50 dark:bg-slate-900 border rounded-md p-3 mt-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                                <FolderTree className="w-3.5 h-3.5" />
                                <span>Estructura requerida</span>
                            </div>
                            <div className="font-mono text-[11px] leading-5 text-slate-600 dark:text-slate-400 pl-1">
                                <div className="flex items-center gap-1 text-foreground font-semibold">
                                    <span className="opacity-50">📂</span> NombreProceso/
                                </div>
                                <div className="pl-4 border-l border-slate-200 dark:border-slate-800 ml-1.5 flex flex-col mt-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-300">├──</span>
                                        <span className="text-foreground">📂 Paso 1/</span>
                                    </div>
                                    <div className="flex items-center gap-2 pl-6">
                                        <span className="text-slate-300">└──</span>
                                        <span className="italic opacity-70">📄 documento.pdf</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-slate-300">└──</span>
                                        <span className="text-foreground">📂 Paso 2/</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:space-x-0">
                    <Button variant="outline" size="sm" onClick={handleClose} disabled={importing}>
                        Cancelar
                    </Button>
                    <Button size="sm" onClick={handleImport} disabled={!isValid || importing}>
                        {importing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Importando...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Importar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}