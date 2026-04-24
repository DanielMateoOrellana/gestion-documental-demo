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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/50 blur-[100px] pointer-events-none" />
      
      <Card className="w-full max-w-md relative z-10 border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white/70 backdrop-blur-xl">
        <CardHeader className="space-y-6 text-center pb-8">
          <div className="mx-auto relative group mt-2">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex h-36 w-36 sm:h-48 sm:w-48 p-4 items-center justify-center rounded-[2rem] shadow-xl bg-white border border-white/50">
              <img src={logoExample} alt="Logo" className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">Crear cuenta</CardTitle>
            <CardDescription className="text-base text-slate-500 font-medium">
              Registre un usuario para acceder a la plataforma de gestión documental
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="pl-10 h-11 bg-white/80 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

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
                  className="pl-10 h-11 bg-white/80 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 bg-[#002f6c] hover:bg-[#001a40] text-white rounded-xl" disabled={submitting}>
              {submitting ? 'Creando cuenta...' : 'Registrarse'}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
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
