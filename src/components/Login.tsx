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
import { useAuth } from '../auth/AuthContext';
import logoExample from '../assets/logo-example.jpg';

interface LoginProps {
  onSwitchToRegister: () => void;
}

const demoAccounts = [
  { label: 'Admin', email: 'admin.demo@tuempresa.com' },
  { label: 'Gestor', email: 'gestor.demo@tuempresa.com' },
  { label: 'Lector', email: 'lector.demo@tuempresa.com' },
  { label: 'Ayudante', email: 'ayudante.demo@tuempresa.com' },
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/50 blur-[100px] pointer-events-none" />
      
      <Card className="w-full max-w-md relative z-10 border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white/70 backdrop-blur-xl">
        <CardHeader className="space-y-6 text-center pb-8">
          <div className="mx-auto relative group mt-2">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl overflow-hidden shadow-xl bg-white border border-white/50">
              <img src={logoExample} alt="Logo" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">Gestión Documental</CardTitle>
            <CardDescription className="text-base text-slate-500 font-medium">
              Plataforma SaaS para centralizar procesos y evidencias
            </CardDescription>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-left text-sm shadow-sm">
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
                  className="bg-white hover:bg-indigo-100 hover:text-indigo-900 border-indigo-200 transition-colors"
                >
                  {account.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@tuempresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white/80 focus:bg-white transition-colors"
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
                  className="pl-10 h-11 bg-white/80 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" disabled={submitting}>
              {submitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
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
