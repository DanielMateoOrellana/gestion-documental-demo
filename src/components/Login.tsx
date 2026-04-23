import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
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

interface LoginProps {
  onSwitchToRegister: () => void;
}

const demoAccounts = [
  { label: 'Admin', email: 'admin.demo@fiec.espol.edu.ec' },
  { label: 'Gestor', email: 'gestor.demo@fiec.espol.edu.ec' },
  { label: 'Lector', email: 'lector.demo@fiec.espol.edu.ec' },
  { label: 'Ayudante', email: 'ayudante.demo@fiec.espol.edu.ec' },
];

export function Login({ onSwitchToRegister }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      window.history.pushState(null, '', window.location.href);

    } catch (err: any) {
      console.error('[Login] error', err);
      const msg =
        err?.response?.data?.message ||
        'Credenciales invalidas para la demo';
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
            <CardTitle>Repositorio Institucional de Evidencias</CardTitle>
            <CardDescription>
              FIEC - Facultad de Ingeniería en Electricidad y Computación
            </CardDescription>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-left text-sm">
            <p className="font-medium">Modo demo sin backend</p>
            <p className="text-muted-foreground">
              Selecciona una cuenta de prueba. Todas usan la clave{' '}
              <span className="font-mono">demo123</span>.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials(account.email)}
                >
                  {account.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
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

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-2">
              ¿No tienes cuenta aún?{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={onSwitchToRegister}
              >
                Regístrate
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
