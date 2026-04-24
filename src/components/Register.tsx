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
import { useAuth } from '../auth/AuthContext';
import { registerApi } from '../api/auth';
import logoExample from '../assets/logo-example.jpg';

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
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Crear cuenta</h1>
            <p className="text-sm text-slate-500 mt-2">Registre un usuario para acceder a la plataforma</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Nombre completo</Label>
              <div className="relative">
                <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nombre Apellido"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {submitting ? 'Creando cuenta...' : 'Registrarse'}
            </button>

            <p className="text-center text-sm text-slate-500 pt-4">
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                className="font-semibold text-[#002f6c] hover:underline"
                onClick={onSwitchToLogin}
              >
                Inicia sesión
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
