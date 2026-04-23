import { useState, useEffect } from 'react';
import { User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import {
  Search,
  FileText,
  Calendar,
} from 'lucide-react';
import { fetchProcessInstances, ProcessInstance } from '../api/processInstances';
import { fetchProcessTypes, ProcessType } from '../api/processTypes';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardProps {
  currentUser: User;
  onViewChange: (view: string, data?: any) => void;
}

interface TaskItem {
  id: string;
  type: 'process' | 'step';
  processId: number;
  stepId?: number;
  title: string;
  processTitle: string;
  processType: string;
  responsible: string;
  dueDate: Date | null;
  status: 'PENDIENTE' | 'COMPLETADO';
  overdue: boolean;
  year?: number;
  processTypeId?: number;
  progress: number; // 0-100
  completedSteps: number;
  totalSteps: number;
}

export function Dashboard({ currentUser, onViewChange }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const [processes, setProcesses] = useState<ProcessInstance[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [processesData, typesData] = await Promise.all([
          fetchProcessInstances(),
          fetchProcessTypes()
        ]);
        setProcesses(processesData);
        setProcessTypes(typesData);
        processData(processesData, typesData);
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar datos del tablero');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const years = Array.from(new Set(processes.map(p => p.year).filter(y => y != null))).sort((a, b) => b - a);

  const processData = (procs: ProcessInstance[], types: ProcessType[]) => {
    const newTasks: TaskItem[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    procs.forEach(p => {

      const pType = types.find(t => t.id === p.processTypeId);
      const responsibleName = p.responsibleUser?.fullName || 'Sin asignar';
      const pTitle = p.title || pType?.name || `Proceso #${p.id}`;
      const due = p.dueAt ? new Date(p.dueAt) : null;

      const steps = p.steps || [];
      const totalSteps = steps.length;
      const completedSteps = steps.filter(s => s.estado === 'COMPLETADO').length;
      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      newTasks.push({
        id: `p-${p.id}`,
        type: 'process',
        processId: p.id,
        title: pTitle,
        processTitle: pTitle,
        processType: pType?.name || 'Desconocido',
        responsible: responsibleName,
        dueDate: due,
        status: p.estado,
        overdue: p.estado === 'PENDIENTE' && due ? due < now : false,
        year: p.year ?? undefined,
        processTypeId: p.processTypeId ?? undefined,
        progress,
        completedSteps,
        totalSteps,
      });
    });

    newTasks.sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
      if (!a.dueDate) return 1;
      return -1;
    });

    setTasks(newTasks);
  };

  const filteredTasks = tasks.filter(task => {
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !task.processTitle.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') return task.overdue;
      if (statusFilter !== task.status) return false;
    }

    if (filterYear !== 'all' && task.year?.toString() !== filterYear) {
      return false;
    }

    return true;
  });

  const statusBadge = (status: string, overdue: boolean) => {
    if (status === 'COMPLETADO') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 shadow-none font-normal">Completado</Badge>;
    }
    if (overdue) {
      return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 shadow-none font-normal">Vencido</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 shadow-none font-normal">Pendiente</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1>Tablero de Control</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Supervisa el estado y cumplimiento de los procesos
          </p>
        </div>

        {/* Bloque de estadísticas - Responsive grid */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 bg-white p-1.5 rounded-xl border shadow-sm">
          <div className="px-3 sm:px-4 py-1 text-center border-r">
            <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</span>
            <span className="text-lg sm:text-xl font-bold text-gray-900">{tasks.length}</span>
          </div>
          <div className="px-3 sm:px-4 py-1 text-center sm:border-r">
            <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Pendientes</span>
            <span className="text-lg sm:text-xl font-bold text-yellow-600">{tasks.filter(t => t.status === 'PENDIENTE').length}</span>
          </div>
          {/* NUEVO: Contador de completados */}
          <div className="px-3 sm:px-4 py-1 text-center border-r">
            <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Completados</span>
            <span className="text-lg sm:text-xl font-bold text-green-600">{tasks.filter(t => t.status === 'COMPLETADO').length}</span>
          </div>
          <div className="px-3 sm:px-4 py-1 text-center">
            <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Vencidos</span>
            <span className="text-lg sm:text-xl font-bold text-red-600">{tasks.filter(t => t.overdue).length}</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar proceso..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                <SelectItem value="overdue">Vencidos</SelectItem>
                <SelectItem value="COMPLETADO">Completados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Tareas (Sin checkboxes) */}
      <Card>
        <CardHeader>
          <CardTitle>Procesos ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <p>No se encontraron procesos</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Proceso</TableHead>
                  <TableHead className="font-medium">Tipo</TableHead>
                  <TableHead className="font-medium">Fecha Límite</TableHead>
                  <TableHead className="font-medium">Responsable</TableHead>
                  <TableHead className="font-medium text-center">Estado</TableHead>
                  <TableHead className="font-medium">Progreso</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="group cursor-pointer hover:bg-muted/50"
                    onClick={() => onViewChange('process-detail', { processId: task.processId })}
                  >
                    <TableCell>
                      <span className="font-medium text-gray-900">
                        {task.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs bg-gray-100 text-gray-600 border-gray-200">
                        {task.processType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className={`h-4 w-4 ${task.overdue ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className={task.overdue ? 'text-red-700 font-medium' : 'text-gray-600'}>
                          {task.dueDate ? format(task.dueDate, "PPP", { locale: es }) : 'Sin fecha'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-medium text-indigo-700 border border-indigo-100">
                          {task.responsible.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-600">{task.responsible}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {statusBadge(task.status, task.overdue)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <Progress value={task.progress} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8 text-right">
                            {task.progress}%
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {task.completedSteps} de {task.totalSteps} completados
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}