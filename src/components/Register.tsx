import { useState } from 'react';
import { Mail, Lock, User2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import logoEspol from 'figma:asset/2793a7bad49c6296879d99578377c2b3f531f7e5.png';
import { useAuth } from '../auth/AuthContext';
import { registerApi } from '../api/auth';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export function Register({ onSwitchToLogin }: RegisterProps) {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);
    try {
      // 1) Crear usuario en el store demo
      await registerApi({
        email,
        password,
        fullName,
        // role: 'LECTOR', // si quisieras forzar rol por defecto
      });

      // 2) Loguear automáticamente
      await login(email, password);
      // App se encargará de pasar a la vista principal porque user != null
    } catch (err: any) {
      console.error('[Register] error', err);
      const msg =
        err?.response?.data?.message ||
        'No se pudo registrar el usuario. Intente nuevamente.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-full max-w-sm flex items-center justify-center">
            <img
              src={logoEspol}
              alt="ESPOL Logo"
              className="w-full h-auto object-contain px-4"
            />
          </div>
          <div>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>
              Registre un usuario para acceder al Repositorio Institucional de Evidencias
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <div className="relative">
                <User2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nombre Apellido"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo institucional</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@fiec.edu.ec"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creando cuenta...' : 'Registrarse'}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-2">
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={onSwitchToLogin}
              >
                Inicia sesión
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
