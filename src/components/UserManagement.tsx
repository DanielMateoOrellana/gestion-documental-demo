import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User, UserRoleEnum } from '../types';
import { fetchUsers, createUser, updateUser, changeUserRole, CreateUserInput } from '../api/users';
import { UserPlus, Edit2, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { FormField } from './ui/form-field';
import { EmptyState } from './ui/empty-state';
import { LoadingSpinner, TableSkeleton } from './ui/loading-spinner';
import { validators } from '../lib/validation';
import { cn } from './ui/utils';

interface UserManagementProps {
  currentUser: User;
}

const ROLES = [
  { value: UserRoleEnum.ADMINISTRADOR, label: 'Administrador', description: 'Acceso total al sistema' },
  { value: UserRoleEnum.GESTOR, label: 'Gestor', description: 'Gestión de procesos y plantillas' },
  { value: UserRoleEnum.LECTOR, label: 'Lector', description: 'Lectura y comentarios' },
  { value: UserRoleEnum.AYUDANTE, label: 'Ayudante', description: 'Carga de archivos y evidencias' },
];

interface FormErrors {
  email?: string;
  fullName?: string;
  password?: string;
  role?: string;
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    fullName: '',
    password: '',
    role: UserRoleEnum.LECTOR,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los usuarios. Por favor, intente nuevamente.');
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const validateField = (field: keyof FormErrors, value: string, isCreate = true) => {
    let error: string | undefined;

    switch (field) {
      case 'email':
        error = validators.required(value, 'El email').error || validators.email(value).error;
        break;
      case 'fullName':
        error = validators.required(value, 'El nombre').error || validators.minLength(value, 3, 'El nombre').error;
        break;
      case 'password':
        if (isCreate) {
          error = validators.required(value, 'La contraseña').error || validators.password(value).error;
        }
        break;
    }

    setFormErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateForm = (isCreate = true): boolean => {
    const errors: FormErrors = {};

    // Email validation
    const emailResult = validators.required(formData.email, 'El email');
    if (!emailResult.isValid) {
      errors.email = emailResult.error;
    } else {
      const emailFormatResult = validators.email(formData.email);
      if (!emailFormatResult.isValid) errors.email = emailFormatResult.error;
    }

    // Name validation
    const nameResult = validators.required(formData.fullName, 'El nombre');
    if (!nameResult.isValid) {
      errors.fullName = nameResult.error;
    } else {
      const nameLengthResult = validators.minLength(formData.fullName, 3, 'El nombre');
      if (!nameLengthResult.isValid) errors.fullName = nameLengthResult.error;
    }

    // Password validation (only for create)
    if (isCreate) {
      const pwdResult = validators.required(formData.password, 'La contraseña');
      if (!pwdResult.isValid) {
        errors.password = pwdResult.error;
      } else {
        const pwdStrengthResult = validators.password(formData.password!);
        if (!pwdStrengthResult.isValid) errors.password = pwdStrengthResult.error;
      }
    }

    setFormErrors(errors);
    setTouched({ email: true, fullName: true, password: true, role: true });
    return Object.values(errors).every(e => !e);
  };

  const handleCreate = async () => {
    if (!validateForm(true)) {
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }

    try {
      setSubmitting(true);
      await createUser(formData);
      toast.success('Usuario creado exitosamente');
      setIsCreatingUser(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      console.error(err);
      // Handle specific demo API errors
      if (err.response?.data?.message?.includes('email')) {
        setFormErrors(prev => ({ ...prev, email: 'Este email ya está registrado' }));
        toast.error('El email ya está en uso');
      } else {
        toast.error('Error al crear usuario. Intente nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    if (!validateForm(false)) {
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }

    try {
      setSubmitting(true);
      await updateUser(selectedUser.id, {
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
      });
      toast.success('Usuario actualizado exitosamente');
      setIsEditingUser(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message?.includes('email')) {
        setFormErrors(prev => ({ ...prev, email: 'Este email ya está en uso por otro usuario' }));
        toast.error('El email ya está en uso');
      } else {
        toast.error('Error al actualizar usuario. Intente nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const newStatus = !user.isActive;
      await updateUser(user.id, { isActive: newStatus });
      toast.success(`Usuario ${user.fullName} ${newStatus ? 'activado' : 'desactivado'}`);
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRoleEnum) => {
    try {
      await changeUserRole(userId, newRole);
      toast.success('Rol actualizado exitosamente');
      // Actualizar estado local
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || 'Error al cambiar el rol';
      toast.error(message);
    }
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      password: '',
    });
    setFormErrors({});
    setTouched({});
    setIsEditingUser(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      fullName: '',
      password: '',
      role: UserRoleEnum.LECTOR,
    });
    setSelectedUser(null);
    setFormErrors({});
    setTouched({});
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field] as string, isCreatingUser);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Administración de Usuarios</h2>
          <p className="text-muted-foreground">
            Gestión de usuarios y asignación de roles
          </p>
        </div>
        <Button onClick={() => setIsCreatingUser(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>Lista de usuarios registrados y sus roles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Error al cargar usuarios"
              description={error}
              action={
                <Button variant="outline" onClick={loadUsers}>
                  Reintentar
                </Button>
              }
            />
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No hay usuarios registrados"
              description="Crea el primer usuario para comenzar a administrar el sistema."
              action={
                <Button onClick={() => setIsCreatingUser(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id} className={cn(!user.isActive && "opacity-60")}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(val: UserRoleEnum) => handleRoleChange(user.id, val)}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleToggleActive(user)}
                          />
                          <span className={cn(
                            "text-sm",
                            user.isActive ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('es-EC')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear Usuario */}
      <Dialog open={isCreatingUser} onOpenChange={(open: boolean) => { if (!open) resetForm(); setIsCreatingUser(open); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Ingrese los datos del nuevo usuario. Todos los campos marcados con * son requeridos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField
              label="Nombre Completo"
              htmlFor="fullName"
              required
              error={touched.fullName ? formErrors.fullName : undefined}
            >
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                onBlur={() => handleBlur('fullName')}
                placeholder="Juan Pérez"
                className={cn(touched.fullName && formErrors.fullName && "border-destructive focus-visible:ring-destructive")}
              />
            </FormField>

            <FormField
              label="Email"
              htmlFor="email"
              required
              error={touched.email ? formErrors.email : undefined}
            >
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                onBlur={() => handleBlur('email')}
                placeholder="usuario@tuempresa.com"
                className={cn(touched.email && formErrors.email && "border-destructive focus-visible:ring-destructive")}
              />
            </FormField>

            <FormField
              label="Contraseña"
              htmlFor="password"
              required
              error={touched.password ? formErrors.password : undefined}
              hint="Mínimo 6 caracteres"
            >
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                className={cn(touched.password && formErrors.password && "border-destructive focus-visible:ring-destructive")}
              />
            </FormField>

            <FormField label="Rol" htmlFor="role" required>
              <Select
                value={formData.role}
                onValueChange={(val: UserRoleEnum) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingUser(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Usuario */}
      <Dialog open={isEditingUser} onOpenChange={(open: boolean) => { if (!open) resetForm(); setIsEditingUser(open); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifique los datos del usuario. Los cambios se guardarán automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField
              label="Nombre Completo"
              htmlFor="edit-fullName"
              required
              error={touched.fullName ? formErrors.fullName : undefined}
            >
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                onBlur={() => handleBlur('fullName')}
                className={cn(touched.fullName && formErrors.fullName && "border-destructive focus-visible:ring-destructive")}
              />
            </FormField>

            <FormField
              label="Email"
              htmlFor="edit-email"
              required
              error={touched.email ? formErrors.email : undefined}
            >
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                onBlur={() => handleBlur('email')}
                className={cn(touched.email && formErrors.email && "border-destructive focus-visible:ring-destructive")}
              />
            </FormField>

            <FormField label="Rol" htmlFor="edit-role" required>
              <Select
                value={formData.role}
                onValueChange={(val: UserRoleEnum) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingUser(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
