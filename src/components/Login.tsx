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
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 sm:p-10">
          
          <div className="flex justify-center mb-6">
            <img 
              src={logoExample} 
              alt="Logo" 
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain" 
            />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Gestión Documental</h1>
            <p className="text-sm text-slate-500 mt-2">Plataforma SaaS para centralizar procesos</p>
          </div>

          <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-sm font-semibold text-blue-900 mb-1">Modo demo sin backend</p>
            <p className="text-xs text-blue-700 mb-3">
              Selecciona una cuenta. Clave: <span className="font-mono bg-blue-100/50 px-1 py-0.5 rounded">demo123</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemoCredentials(account.email)}
                  className="px-3 py-2 text-xs font-medium bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@tuempresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full h-11 mt-2 rounded-lg bg-[#002f6c] hover:bg-[#001f4c] text-white font-medium shadow-sm transition-colors disabled:opacity-70"
            >
              {submitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>

            <p className="text-center text-sm text-slate-500 pt-4">
              ¿No tienes cuenta aún?{' '}
              <button
                type="button"
                className="font-semibold text-[#002f6c] hover:underline"
                onClick={onSwitchToRegister}
              >
                Regístrate
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
