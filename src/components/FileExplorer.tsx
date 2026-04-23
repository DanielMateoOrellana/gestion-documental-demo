import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import {
    Folder,
    FolderOpen,
    FileText,
    ChevronRight,
    Home,
    Download,
    Eye,
    Loader2,
    FolderTree,
    Search,
    Filter,
    X,
} from 'lucide-react';
import { cn } from './ui/utils';
import { toast } from 'sonner';
import type { User } from '../types';

import { fetchProcessCategories, type ProcessCategory } from '../api/processCategories';
import { fetchProcessTypes, type ProcessType } from '../api/processTypes';
import { fetchProcessInstances, type ProcessInstance } from '../api/processInstances';
import { listStepFiles, getFileViewUrl, type StepFileSummary } from '../api/stepFiles';
import { downloadFolder, type FolderType } from '../api/folderDownload';

interface FileExplorerProps {
    currentUser: User;
}

type BreadcrumbItem = {
    id: number | string;
    name: string;
    type: 'root' | 'category' | 'processType' | 'process' | 'step';
};

type FolderItem = {
    id: number | string;
    name: string;
    type: 'category' | 'processType' | 'process' | 'step' | 'file';
    count?: number;
    status?: string;
    mimeType?: string;
    sizeBytes?: number;
    stepId?: number;
    fileId?: number;
};

export function FileExplorer({ currentUser }: FileExplorerProps) {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<ProcessCategory[]>([]);
    const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
    const [processes, setProcesses] = useState<ProcessInstance[]>([]);
    const [stepFiles, setStepFiles] = useState<Record<number, StepFileSummary[]>>({});

    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
        { id: 'root', name: 'Repositorio', type: 'root' }
    ]);

    const [currentItems, setCurrentItems] = useState<FolderItem[]>([]);
    const [selectedProcess, setSelectedProcess] = useState<ProcessInstance | null>(null);
    const [downloadingFile, setDownloadingFile] = useState<number | null>(null);
    const [downloadingFolder, setDownloadingFolder] = useState(false);

    // Filtros
    const [searchQuery, setSearchQuery] = useState('');
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Estado para resultados de búsqueda global
    const [globalSearchResults, setGlobalSearchResults] = useState<FolderItem[]>([]);
    const [isGlobalSearch, setIsGlobalSearch] = useState(false);
    const [searching, setSearching] = useState(false);

    // Obtener años disponibles
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        processes.forEach(p => {
            if (p.year) years.add(p.year);
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [processes]);

    // Limpiar filtros
    const clearFilters = () => {
        setSearchQuery('');
        setFilterYear('all');
        setFilterStatus('all');
        setGlobalSearchResults([]);
        setIsGlobalSearch(false);
    };

    const hasActiveFilters = searchQuery || filterYear !== 'all' || filterStatus !== 'all';

    // Búsqueda global
    const performGlobalSearch = async (query: string) => {
        if (query.length < 2) {
            setIsGlobalSearch(false);
            setGlobalSearchResults([]);
            return;
        }

        setSearching(true);
        setIsGlobalSearch(true);
        const results: FolderItem[] = [];
        const lowerQuery = query.toLowerCase();

        try {
            // Buscar en categorías
            for (const category of categories) {
                if (category.name.toLowerCase().includes(lowerQuery)) {
                    const typesCount = processTypes.filter(t => t.categoryId === category.id).length;
                    results.push({
                        id: category.id,
                        name: category.name,
                        type: 'category' as const,
                        count: typesCount,
                        status: 'Categoría',
                    });
                }
            }

            // Buscar en tipos de proceso
            for (const pType of processTypes) {
                if (pType.name.toLowerCase().includes(lowerQuery)) {
                    const category = categories.find(c => c.id === pType.categoryId);
                    const processCount = processes.filter(p => p.processType?.id === pType.id).length;
                    results.push({
                        id: pType.id,
                        name: pType.name,
                        type: 'processType' as const,
                        count: processCount,
                        status: category?.name || 'Tipo de proceso',
                    });
                }
            }

            // Buscar en procesos, pasos y archivos
            for (const process of processes) {
                if (filterYear !== 'all' && process.year?.toString() !== filterYear) continue;
                if (filterStatus !== 'all' && process.estado !== filterStatus) continue;

                const steps = process.steps || [];

                // Buscar por título de proceso
                if (process.title.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        id: process.id,
                        name: process.title,
                        type: 'process' as const,
                        status: process.processType?.name,
                        count: steps.length,
                    });
                }

                for (const step of steps) {
                    let files = stepFiles[step.id];
                    if (!files) {
                        try {
                            files = await listStepFiles(step.id);
                            setStepFiles(prev => ({ ...prev, [step.id]: files }));
                        } catch (e) {
                            continue;
                        }
                    }

                    // Buscar por nombre de archivo
                    for (const file of files) {
                        if (file.originalName.toLowerCase().includes(lowerQuery)) {
                            results.push({
                                id: file.id,
                                name: file.originalName,
                                type: 'file' as const,
                                mimeType: file.mimeType,
                                sizeBytes: file.sizeBytes,
                                stepId: step.id,
                                fileId: file.id,
                                status: `${process.processType?.name} → ${process.title} → ${step.templateStep?.name || step.title}`,
                            });
                        }
                    }

                    // Buscar por nombre de paso
                    const stepName = step.templateStep?.name || step.title;
                    if (stepName.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            id: step.id,
                            name: stepName,
                            type: 'step' as const,
                            status: `${process.processType?.name} → ${process.title}`,
                            count: files.length,
                        });
                    }
                }
            }
            setGlobalSearchResults(results);
        } catch (error) {
            console.error('Error en búsqueda global:', error);
        } finally {
            setSearching(false);
        }
    };

    // Debounce para búsqueda global
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performGlobalSearch(searchQuery);
            } else {
                setIsGlobalSearch(false);
                setGlobalSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, filterYear, filterStatus]);

    // Procesos filtrados por año y estado
    const filteredProcesses = useMemo(() => {
        return processes.filter(p => {
            if (filterYear !== 'all' && p.year?.toString() !== filterYear) return false;
            if (filterStatus !== 'all' && p.estado !== filterStatus) return false;
            return true;
        });
    }, [processes, filterYear, filterStatus]);

    // Filtrar items actuales basado en los filtros
    const filteredItems = useMemo(() => {
        if (isGlobalSearch) return currentItems;

        // Si no hay filtros de año/estado activos, mostrar todo
        if (filterYear === 'all' && filterStatus === 'all') {
            return currentItems;
        }

        // Aplicar filtros según el tipo de item
        return currentItems.filter(item => {
            switch (item.type) {
                case 'category': {
                    // Mostrar categoría si tiene al menos un tipo con procesos filtrados
                    const typesInCategory = processTypes.filter(t => t.categoryId === item.id);
                    return typesInCategory.some(type =>
                        filteredProcesses.some(p => p.processType?.id === type.id)
                    );
                }
                case 'processType': {
                    // Mostrar tipo si tiene al menos un proceso filtrado
                    return filteredProcesses.some(p => p.processType?.id === item.id);
                }
                case 'process': {
                    // Mostrar proceso si pasa los filtros
                    return filteredProcesses.some(p => p.id === item.id);
                }
                case 'step':
                case 'file':
                    // Steps y archivos siempre se muestran (ya están dentro de un proceso filtrado)
                    return true;
                default:
                    return true;
            }
        }).map(item => {
            // Actualizar contadores basado en procesos filtrados
            if (item.type === 'category') {
                const typesInCategory = processTypes.filter(t => t.categoryId === item.id);
                const typesWithProcesses = typesInCategory.filter(type =>
                    filteredProcesses.some(p => p.processType?.id === type.id)
                );
                return { ...item, count: typesWithProcesses.length };
            }
            if (item.type === 'processType') {
                const processCount = filteredProcesses.filter(p => p.processType?.id === item.id).length;
                return { ...item, count: processCount };
            }
            return item;
        });
    }, [currentItems, filterYear, filterStatus, isGlobalSearch, filteredProcesses, processTypes]);

    // Cargar datos iniciales
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [categoriesData, typesData, processesData] = await Promise.all([
                fetchProcessCategories(),
                fetchProcessTypes(),
                fetchProcessInstances(),
            ]);
            setCategories(categoriesData);
            setProcessTypes(typesData);
            setProcesses(processesData);

            // Mostrar categorías como carpetas iniciales
            const items: FolderItem[] = categoriesData.map(cat => ({
                id: cat.id,
                name: cat.name,
                type: 'category' as const,
                count: typesData.filter(t => t.categoryId === cat.id).length,
            }));
            setCurrentItems(items);
        } catch (error) {
            console.error('Error cargando datos:', error);
            toast.error('Error al cargar el explorador');
        } finally {
            setLoading(false);
        }
    };

    // Navegar a una carpeta
    const navigateTo = async (item: FolderItem) => {
        if (item.type === 'file') {
            // Si es archivo, descargar o previsualizar
            await handleFileClick(item);
            return;
        }

        setLoading(true);
        try {
            let newItems: FolderItem[] = [];
            let newBreadcrumb = [...breadcrumb];

            switch (item.type) {
                case 'category': {
                    // Mostrar tipos de proceso de esta categoría
                    const typesInCategory = processTypes.filter(t => t.categoryId === item.id);
                    newItems = typesInCategory.map(type => ({
                        id: type.id,
                        name: type.name,
                        type: 'processType' as const,
                        count: processes.filter(p => p.processType?.id === type.id).length,
                    }));
                    newBreadcrumb.push({ id: item.id, name: item.name, type: 'category' });
                    break;
                }
                case 'processType': {
                    // Mostrar procesos de este tipo
                    const processesOfType = processes.filter(p => p.processType?.id === item.id);
                    newItems = processesOfType.map(process => ({
                        id: process.id,
                        name: process.title,
                        type: 'process' as const,
                        status: process.estado,
                        count: process.steps?.length || 0,
                    }));
                    newBreadcrumb.push({ id: item.id, name: item.name, type: 'processType' });
                    break;
                }
                case 'process': {
                    // Mostrar pasos del proceso
                    const process = processes.find(p => p.id === item.id);
                    if (process) {
                        setSelectedProcess(process);
                        const steps = process.steps || [];
                        newItems = steps.map(step => ({
                            id: step.id,
                            name: step.templateStep?.name || step.title,
                            type: 'step' as const,
                            status: step.estado,
                            count: 0, // Se actualizará con los archivos
                        }));

                        // Cargar archivos de cada paso
                        for (const step of steps) {
                            try {
                                const files = await listStepFiles(step.id);
                                setStepFiles(prev => ({ ...prev, [step.id]: files }));
                                // Actualizar count
                                newItems = newItems.map(i =>
                                    i.id === step.id ? { ...i, count: files.length } : i
                                );
                            } catch (e) {
                                console.error(`Error cargando archivos del paso ${step.id}:`, e);
                            }
                        }
                    }
                    newBreadcrumb.push({ id: item.id, name: item.name, type: 'process' });
                    break;
                }
                case 'step': {
                    // Mostrar archivos del paso
                    const files = stepFiles[item.id as number] || [];
                    newItems = files.map(file => ({
                        id: file.id,
                        name: file.originalName,
                        type: 'file' as const,
                        mimeType: file.mimeType,
                        sizeBytes: file.sizeBytes,
                        stepId: item.id as number,
                        fileId: file.id,
                    }));
                    newBreadcrumb.push({ id: item.id, name: item.name, type: 'step' });
                    break;
                }
            }

            setCurrentItems(newItems);
            setBreadcrumb(newBreadcrumb);
        } catch (error) {
            console.error('Error navegando:', error);
            toast.error('Error al navegar');
        } finally {
            setLoading(false);
        }
    };

    // Navegar usando breadcrumb
    const navigateToBreadcrumb = async (index: number) => {
        if (index === breadcrumb.length - 1) return; // Ya estamos aquí

        const targetItem = breadcrumb[index];
        const newBreadcrumb = breadcrumb.slice(0, index + 1);
        setBreadcrumb(newBreadcrumb);

        setLoading(true);
        try {
            let newItems: FolderItem[] = [];

            if (targetItem.type === 'root') {
                newItems = categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    type: 'category' as const,
                    count: processTypes.filter(t => t.categoryId === cat.id).length,
                }));
                setSelectedProcess(null);
            } else if (targetItem.type === 'category') {
                const typesInCategory = processTypes.filter(t => t.categoryId === targetItem.id);
                newItems = typesInCategory.map(type => ({
                    id: type.id,
                    name: type.name,
                    type: 'processType' as const,
                    count: processes.filter(p => p.processType?.id === type.id).length,
                }));
                setSelectedProcess(null);
            } else if (targetItem.type === 'processType') {
                const processesOfType = processes.filter(p => p.processType?.id === targetItem.id);
                newItems = processesOfType.map(process => ({
                    id: process.id,
                    name: process.title,
                    type: 'process' as const,
                    status: process.estado,
                    count: process.steps?.length || 0,
                }));
                setSelectedProcess(null);
            } else if (targetItem.type === 'process') {
                const process = processes.find(p => p.id === targetItem.id);
                if (process) {
                    setSelectedProcess(process);
                    const steps = process.steps || [];
                    newItems = steps.map(step => ({
                        id: step.id,
                        name: step.templateStep?.name || step.title,
                        type: 'step' as const,
                        status: step.estado,
                        count: stepFiles[step.id]?.length || 0,
                    }));
                }
            }

            setCurrentItems(newItems);
        } finally {
            setLoading(false);
        }
    };

    // Manejar click en archivo
    const handleFileClick = async (item: FolderItem) => {
        if (!item.stepId || !item.fileId) return;

        setDownloadingFile(item.fileId);
        try {
            const url = getFileViewUrl(item.stepId, item.fileId);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error obteniendo archivo:', error);
            toast.error('Error al abrir el archivo');
        } finally {
            setDownloadingFile(null);
        }
    };

    // Obtener el tipo de carpeta actual para descarga
    const getCurrentFolderInfo = (): { type: FolderType; id: number } | null => {
        if (breadcrumb.length <= 1) return null; // En el root no hay descarga
        const current = breadcrumb[breadcrumb.length - 1];
        if (current.type === 'root') return null;
        return { type: current.type as FolderType, id: current.id as number };
    };

    // Descargar carpeta actual como ZIP
    const handleFolderDownload = async () => {
        const folderInfo = getCurrentFolderInfo();
        if (!folderInfo) return;

        setDownloadingFolder(true);
        try {
            await downloadFolder(folderInfo.type, folderInfo.id);
            toast.success('Descarga iniciada');
        } catch (error: any) {
            console.error('Error descargando carpeta:', error);
            if (error.response?.status === 404) {
                toast.error('No hay archivos para descargar en esta carpeta');
            } else {
                toast.error('Error al descargar la carpeta');
            }
        } finally {
            setDownloadingFolder(false);
        }
    };

    // Formatear tamaño de archivo
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Obtener icono según tipo
    const getIcon = (item: FolderItem, isOpen = false) => {
        if (item.type === 'file') {
            return <FileText className="w-5 h-5 text-blue-500" />;
        }
        return isOpen
            ? <FolderOpen className="w-5 h-5 text-amber-500" />
            : <Folder className="w-5 h-5 text-amber-500" />;
    };

    // Obtener badge de estado
    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        const colors: Record<string, string> = {
            'EN_PROGRESO': 'bg-blue-100 text-blue-800',
            'COMPLETADO': 'bg-green-100 text-green-800',
            'PENDIENTE': 'bg-gray-100 text-gray-800',
            'CANCELADO': 'bg-red-100 text-red-800',
        };
        const labels: Record<string, string> = {
            'EN_PROGRESO': 'En progreso',
            'COMPLETADO': 'Completado',
            'PENDIENTE': 'Pendiente',
            'CANCELADO': 'Cancelado',
        };
        return (
            <Badge className={cn("text-xs", colors[status] || 'bg-gray-100')}>
                {labels[status] || status}
            </Badge>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <FolderTree className="w-6 h-6" />
                        Explorador de Documentos
                    </h1>
                    <p className="text-muted-foreground">
                        Navega por los procesos como un sistema de archivos
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Búsqueda y Filtros
                        </CardTitle>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="w-4 h-4 mr-1" />
                                Limpiar
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Buscador */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Buscar</label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar archivos, pasos, procesos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Filtro por año */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Año</label>
                            <Select value={filterYear} onValueChange={setFilterYear}>
                                <SelectTrigger className={cn(filterYear !== 'all' && "border-primary")}>
                                    <SelectValue placeholder="Todos los años" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los años</SelectItem>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtro por estado */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Estado</label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className={cn(filterStatus !== 'all' && "border-primary")}>
                                    <SelectValue placeholder="Todos los estados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                    <SelectItem value="COMPLETADO">Completado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Breadcrumb */}
            <Card>
                <CardContent className="py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                        {breadcrumb.map((item, index) => (
                            <div key={`${item.type}-${item.id}`} className="flex items-center">
                                {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
                                <button
                                    onClick={() => navigateToBreadcrumb(index)}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors",
                                        index === breadcrumb.length - 1
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    {item.type === 'root' && <Home className="w-4 h-4" />}
                                    {item.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Contenido */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                            {isGlobalSearch ? (
                                <>
                                    {searching ? 'Buscando...' : `${globalSearchResults.length} resultado(s)`}
                                    <span className="text-muted-foreground font-normal ml-2">(búsqueda global)</span>
                                </>
                            ) : (
                                <>
                                    {filteredItems.length} {filteredItems.length === 1 ? 'elemento' : 'elementos'}
                                </>
                            )}
                        </CardTitle>
                        {/* Botón de descargar carpeta */}
                        {breadcrumb.length > 1 && !isGlobalSearch && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleFolderDownload}
                                disabled={downloadingFolder}
                            >
                                {downloadingFolder ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Descargar carpeta
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {loading || searching ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">
                                {searching ? 'Buscando archivos...' : 'Cargando...'}
                            </span>
                        </div>
                    ) : isGlobalSearch ? (
                        globalSearchResults.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Search className="w-12 h-12 mb-2 opacity-50" />
                                <p>No se encontraron resultados para "{searchQuery}"</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {globalSearchResults.map((item, idx) => (
                                    <button
                                        key={`search-${item.type}-${item.id}-${idx}`}
                                        onClick={() => navigateTo(item)}
                                        disabled={item.type === 'file' && downloadingFile === item.fileId}
                                        className={cn(
                                            "flex items-start gap-3 p-4 rounded-lg border bg-card text-left transition-all",
                                            "hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm",
                                            "focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        )}
                                    >
                                        <div className="flex-shrink-0 mt-0.5">
                                            {item.type === 'file' && downloadingFile === item.fileId ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                            ) : (
                                                getIcon(item)
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate" title={item.name}>
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5" title={item.status}>
                                                {item.status}
                                            </p>
                                            {item.type === 'file' && item.sizeBytes && (
                                                <span className="text-xs text-muted-foreground">
                                                    {formatFileSize(item.sizeBytes)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Folder className="w-12 h-12 mb-2 opacity-50" />
                            <p>Esta carpeta está vacía</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filteredItems.map((item) => (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => navigateTo(item)}
                                    disabled={item.type === 'file' && downloadingFile === item.fileId}
                                    className={cn(
                                        "flex items-start gap-3 p-4 rounded-lg border bg-card text-left transition-all",
                                        "hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm",
                                        "focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    )}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {item.type === 'file' && downloadingFile === item.fileId ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        ) : (
                                            getIcon(item)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate" title={item.name}>
                                            {item.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.type !== 'file' && item.count !== undefined && (
                                                <span className="text-xs text-muted-foreground">
                                                    {item.count} {item.type === 'step' ? 'archivo(s)' :
                                                        item.type === 'process' ? 'paso(s)' :
                                                            item.type === 'category' ? 'tipo(s)' : 'proceso(s)'}
                                                </span>
                                            )}
                                            {item.type === 'file' && item.sizeBytes && (
                                                <span className="text-xs text-muted-foreground">
                                                    {formatFileSize(item.sizeBytes)}
                                                </span>
                                            )}
                                            {getStatusBadge(item.status)}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
