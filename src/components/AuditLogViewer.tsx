import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User as UserIcon,
  FileText,
  RefreshCw,
  Eye,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAuditLogs,
  fetchActionTypes,
  fetchEntityTypes,
  type AuditLog,
  type AuditLogFilter,
  actionLabels,
  entityTypeLabels,
  actionColors,
} from "../api/auditLogs";

interface AuditLogViewerProps {
  currentUser: User;
}

export function AuditLogViewer({ currentUser }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntityType, setFilterEntityType] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Available filter options
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadFilterOptions = async () => {
    try {
      const [actions, entities] = await Promise.all([
        fetchActionTypes(),
        fetchEntityTypes(),
      ]);
      setActionTypes(actions);
      setEntityTypes(entities);
    } catch (e) {
      console.error("Error loading filter options", e);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const filter: AuditLogFilter = {
        limit,
        offset: (page - 1) * limit,
      };

      if (filterAction !== "all") filter.action = filterAction;
      if (filterEntityType !== "all") filter.entityType = filterEntityType;
      if (filterStartDate) filter.startDate = filterStartDate;
      if (filterEndDate) filter.endDate = filterEndDate;

      const response = await fetchAuditLogs(filter);

      // Filter by search term locally (description)
      let filteredData = response.data;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter(
          (log) =>
            log.description.toLowerCase().includes(term) ||
            log.user?.fullName?.toLowerCase().includes(term) ||
            log.entityType.toLowerCase().includes(term)
        );
      }

      setLogs(filteredData);
      setTotal(response.total);
    } catch (e) {
      console.error(e);
      setError("Error al cargar la bitácora");
      toast.error("No se pudo cargar la bitácora");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, filterAction, filterEntityType, filterStartDate, filterEndDate]);

  const handleSearch = () => {
    setPage(1);
    loadLogs();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterAction("all");
    setFilterEntityType("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setPage(1);
  };

  const handleExportCSV = async () => {
    if (logs.length === 0) {
      toast.error("No hay registros para exportar");
      return;
    }

    try {
      const headers = ["Fecha", "Usuario", "Acción", "Entidad", "ID Entidad", "Descripción"];

      const escapeCSV = (value: string | null | undefined): string => {
        if (value == null) return "";
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = logs.map((log) => {
        const fecha = format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: es });
        const usuario = log.user?.fullName || "Sistema";
        const accion = actionLabels[log.action] || log.action;
        const entidad = entityTypeLabels[log.entityType] || log.entityType;
        const entityId = log.entityId?.toString() || "";
        const descripcion = log.description;

        return [
          escapeCSV(fecha),
          escapeCSV(usuario),
          escapeCSV(accion),
          escapeCSV(entidad),
          escapeCSV(entityId),
          escapeCSV(descripcion),
        ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      const fechaActual = format(new Date(), "yyyy-MM-dd", { locale: es });
      const fileName = `bitacora_${fechaActual}.csv`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Se exportaron ${logs.length} registros a ${fileName}`);
    } catch (error) {
      console.error("Error exportando CSV:", error);
      toast.error("Error al exportar los registros");
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  };

  const hasActiveFilters =
    filterAction !== "all" ||
    filterEntityType !== "all" ||
    filterStartDate !== "" ||
    filterEndDate !== "" ||
    searchTerm !== "";

  const activeFiltersCount = [
    filterAction !== "all",
    filterEntityType !== "all",
    filterStartDate !== "",
    filterEndDate !== "",
    searchTerm !== "",
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Bitácora de Auditoría</h2>
          <p className="text-sm text-muted-foreground">
            Registro completo de eventos y acciones del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Filtros de Búsqueda</CardTitle>
              <CardDescription>
                Filtre los registros por fecha, usuario o tipo de acción
              </CardDescription>
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search-text">Buscar en detalles</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search-text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filter-action">Acción</Label>
              <Select value={filterAction} onValueChange={(value: string) => { setFilterAction(value); setPage(1); }}>
                <SelectTrigger id="filter-action" className={filterAction !== "all" ? "border-primary" : ""}>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {actionLabels[action] || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-entity">Tipo de entidad</Label>
              <Select value={filterEntityType} onValueChange={(value: string) => { setFilterEntityType(value); setPage(1); }}>
                <SelectTrigger id="filter-entity" className={filterEntityType !== "all" ? "border-primary" : ""}>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {entityTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-date-from">Fecha Desde</Label>
              <Input
                id="filter-date-from"
                type="date"
                value={filterStartDate}
                onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }}
                className={filterStartDate ? "border-primary" : ""}
              />
            </div>
            <div>
              <Label htmlFor="filter-date-to">Fecha Hasta</Label>
              <Input
                id="filter-date-to"
                type="date"
                value={filterEndDate}
                onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }}
                className={filterEndDate ? "border-primary" : ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total de Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mostrando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tipos de Acción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionTypes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tipos de Entidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entityTypes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría</CardTitle>
          <CardDescription>
            {total > 0 ? `${logs.length} de ${total} registro(s)` : "Sin registros"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{error}</p>
              <Button variant="outline" onClick={loadLogs} className="mt-4">
                Reintentar
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No se encontraron registros</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">ID</TableHead>
                    <TableHead className="w-[160px]">Fecha/Hora</TableHead>
                    <TableHead className="w-[130px]">Usuario</TableHead>
                    <TableHead className="w-[100px]">Acción</TableHead>
                    <TableHead className="w-[110px]">Entidad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[60px]">Ver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[100px]">
                              {log.user.fullName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sistema</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: actionColors[log.action] || "#6B7280",
                            color: "#fff",
                          }}
                          className="text-xs"
                        >
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{entityTypeLabels[log.entityType] || log.entityType}</div>
                          {log.entityId && (
                            <div className="text-xs text-muted-foreground">ID: {log.entityId}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm truncate" title={log.description}>
                          {log.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Registro</DialogTitle>
            <DialogDescription>
              Información completa de la acción registrada
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">ID</div>
                  <div className="font-mono">#{selectedLog.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Fecha y hora</div>
                  <div>{formatDate(selectedLog.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Acción</div>
                  <Badge
                    style={{
                      backgroundColor: actionColors[selectedLog.action] || "#6B7280",
                      color: "#fff",
                    }}
                  >
                    {actionLabels[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tipo de entidad</div>
                  <div>{entityTypeLabels[selectedLog.entityType] || selectedLog.entityType}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">ID de entidad</div>
                  <div className="font-mono">{selectedLog.entityId ?? "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Usuario</div>
                  <div>{selectedLog.user?.fullName || "Sistema"}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Descripción</div>
                <div className="p-3 bg-muted rounded-lg text-sm">{selectedLog.description}</div>
              </div>
              {selectedLog.details && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Detalles adicionales</div>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                    {JSON.stringify(parseDetails(selectedLog.details), null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.user?.email && (
                <div>
                  <div className="text-sm text-muted-foreground">Email del usuario</div>
                  <div className="text-sm">{selectedLog.user.email}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
