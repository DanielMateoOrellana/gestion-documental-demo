import { useState } from 'react';
import { Mail, Lock, User2, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
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

  const inputStyle: React.CSSProperties = {
    paddingLeft: '40px',
    height: '44px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    width: '100%',
    fontSize: '0.875rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#334155',
    marginBottom: '6px',
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '18px',
    height: '18px',
    color: '#94a3b8',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '40px 40px 0', textAlign: 'center' }}>
          <img
            src={logoExample}
            alt="Logo"
            style={{
              width: '140px',
              height: '140px',
              objectFit: 'contain',
              margin: '0 auto',
              display: 'block',
            }}
          />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 40px 0', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 4px',
              letterSpacing: '-0.025em',
            }}
          >
            Crear cuenta
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#64748b',
              margin: 0,
            }}
          >
            Registre un usuario para acceder a la plataforma
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: '24px 40px 36px' }}
        >
          <div style={{ marginBottom: '16px' }}>
            <Label htmlFor="fullName" style={labelStyle}>
              Nombre completo
            </Label>
            <div style={{ position: 'relative' }}>
              <User2 style={iconStyle} />
              <Input
                id="fullName"
                type="text"
                placeholder="Nombre Apellido"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Label htmlFor="email" style={labelStyle}>
              Correo electrónico
            </Label>
            <div style={{ position: 'relative' }}>
              <Mail style={iconStyle} />
              <Input
                id="email"
                type="email"
                placeholder="usuario@tuempresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Label htmlFor="password" style={labelStyle}>
              Contraseña
            </Label>
            <div style={{ position: 'relative' }}>
              <Lock style={iconStyle} />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Label htmlFor="confirmPassword" style={labelStyle}>
              Confirmar contraseña
            </Label>
            <div style={{ position: 'relative' }}>
              <Lock style={iconStyle} />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#dc2626',
                textAlign: 'center',
                background: '#fef2f2',
                padding: '8px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              {error}
            </p>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              background: '#0f3460',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = '#0a2540')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = '#0f3460')
            }
          >
            <UserPlus style={{ width: '18px', height: '18px' }} />
            {submitting ? 'Creando cuenta...' : 'Registrarse'}
          </Button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: '#64748b',
              marginTop: '20px',
            }}
          >
            ¿Ya tienes una cuenta?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{
                fontWeight: 600,
                color: '#0f3460',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.8125rem',
              }}
            >
              Inicia sesión
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
