import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Plus, Edit, FileText, AlertTriangle, Filter, Lock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { User } from '../types';
import { toast } from 'sonner';
import { CreateTemplateModal } from './CreateTemplateModal';
import { EditTemplateModal } from './EditTemplateModal';
import { EmptyState } from './ui/empty-state';
import { TableSkeleton } from './ui/loading-spinner';
import { cn } from './ui/utils';

import {
  fetchProcessTemplates,
  type ProcessTemplate,
} from '../api/processTemplates';
import { fetchProcessTypes, type ProcessType } from '../api/processTypes';

interface TemplateManagerSimpleProps {
  currentUser: User;
}

export function TemplateManagerSimple({ currentUser }: TemplateManagerSimpleProps) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting state
  type SortField = 'name' | 'type' | 'status' | 'steps';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [templatesData, typesData] = await Promise.all([
        fetchProcessTemplates(),
        fetchProcessTypes()
      ]);
      setTemplates(templatesData);
      setProcessTypes(typesData);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las plantillas. Por favor, intente nuevamente.');
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTemplates = templates.filter((template) => {
    const matchesType =
      filterType === 'all' ||
      template.processTypeId.toString() === filterType;

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && template.isActive) ||
      (filterStatus === 'obsolete' && !template.isActive);

    return matchesType && matchesStatus;
  });

  // Ordenar las plantillas filtradas
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        const typeA = a.processType?.name || '';
        const typeB = b.processType?.name || '';
        comparison = typeA.localeCompare(typeB);
        break;
      case 'status':
        comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
        break;
      case 'steps':
        const stepsA = a.steps?.length || 0;
        const stepsB = b.steps?.length || 0;
        comparison = stepsA - stepsB;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSelectAll = () => {
    if (selectedItems.length === filteredTemplates.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredTemplates.map((t) => t.id));
    }
  };

  const handleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((i) => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleExport = () => {
    if (selectedItems.length === 0) {
      toast.error('Seleccione al menos una plantilla');
      return;
    }
    toast.success(`Exportando ${selectedItems.length} plantilla(s)`);
  };

  const getStepCount = (templateId: number) => {
    const tpl = templates.find((t) => t.id === templateId);
    return tpl?.steps?.length ?? 0;
  };

  const hasActiveFilters = filterType !== 'all' || filterStatus !== 'all';

  const clearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plantillas</h1>
          <p className="text-muted-foreground">
            Gestión de plantillas de procesos institucionales
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva plantilla
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de proceso</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className={cn(filterType !== 'all' && "border-primary")}>
                  <SelectValue placeholder="Tipo de proceso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {processTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className={cn(filterStatus !== 'all' && "border-primary")}>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="obsolete">Obsoletas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Plantillas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Plantillas
            <Badge variant="secondary" className="ml-2">
              {filteredTemplates.length}
            </Badge>
            {hasActiveFilters && (
              <span className="text-sm font-normal text-muted-foreground">
                (filtrado de {templates.length} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Error al cargar plantillas"
              description={error}
              action={
                <Button variant="outline" onClick={loadData}>
                  Reintentar
                </Button>
              }
            />
          ) : templates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No hay plantillas creadas"
              description="Las plantillas definen los pasos y la estructura de tus procesos. Crea la primera plantilla para comenzar."
              action={
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear plantilla
                </Button>
              }
            />
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="Sin resultados"
              description="No se encontraron plantillas que coincidan con los filtros seleccionados."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedItems.length === filteredTemplates.length &&
                        filteredTemplates.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-primary transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      Nombre
                      <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-primary transition-colors"
                      onClick={() => handleSort('type')}
                    >
                      Tipo de proceso
                      <SortIcon field="type" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-primary transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      Estado
                      <SortIcon field="status" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-primary transition-colors"
                      onClick={() => handleSort('steps')}
                    >
                      Pasos
                      <SortIcon field="steps" />
                    </button>
                  </TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTemplates.map((template) => {
                  const stepCount = getStepCount(template.id);
                  const processTypeName = template.processType?.name ?? 'Sin tipo';

                  return (
                    <TableRow
                      key={template.id}
                      className={cn(!template.isActive && "opacity-60")}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedItems.includes(template.id)}
                          onCheckedChange={() => handleSelectItem(template.id)}
                        />
                      </TableCell>

                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {template.name}
                          {template.isLocked && (
                            <span title="Plantilla bloqueada">
                              <Lock className="w-4 h-4 text-amber-500" />
                            </span>
                          )}
                        </span>
                      </TableCell>

                      <TableCell className="max-w-md truncate">
                        <span title={template.description}>
                          {template.description}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{processTypeName}</Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={cn(
                            template.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          )}
                        >
                          {template.isActive ? 'Activa' : 'Obsoleta'}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="flex items-center gap-1">
                          <span className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                            stepCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {stepCount}
                          </span>
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTemplateId(template.id);
                              setIsEditModalOpen(true);
                            }}
                            title="Editar plantilla"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Creación de Plantilla */}
      <CreateTemplateModal
        open={isCreateModalOpen}
        onClose={async () => {
          setIsCreateModalOpen(false);
          await loadData();
        }}
      />

      {/* Modal de Edición de Plantilla */}
      <EditTemplateModal
        open={isEditModalOpen}
        templateId={editingTemplateId}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTemplateId(null);
        }}
        onTemplateUpdated={loadData}
        onTemplateDeleted={loadData}
      />
    </div>
  );
}
