import { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
              width: '180px',
              height: '180px',
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
            Gestión Documental
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#64748b',
              margin: 0,
            }}
          >
            Plataforma para centralizar procesos y evidencias
          </p>
        </div>

        {/* Demo accounts */}
        <div style={{ padding: '20px 40px 0' }}>
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <p
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#1e3a5f',
                margin: '0 0 4px',
              }}
            >
              Modo demo
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#3b82f6',
                margin: '0 0 10px',
              }}
            >
              Selecciona una cuenta · Clave:{' '}
              <code
                style={{
                  background: '#dbeafe',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                }}
              >
                demo123
              </code>
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemoCredentials(account.email)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: '#ffffff',
                    border: '1px solid #93c5fd',
                    color: '#1d4ed8',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#dbeafe')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = '#ffffff')
                  }
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: '24px 40px 36px' }}
        >
          <div style={{ marginBottom: '16px' }}>
            <Label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Correo electrónico
            </Label>
            <div style={{ position: 'relative' }}>
              <Mail
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#94a3b8',
                }}
              />
              <Input
                id="email"
                type="email"
                placeholder="usuario@tuempresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  paddingLeft: '40px',
                  height: '44px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  width: '100%',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Contraseña
            </Label>
            <div style={{ position: 'relative' }}>
              <Lock
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#94a3b8',
                }}
              />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  paddingLeft: '40px',
                  height: '44px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  width: '100%',
                  fontSize: '0.875rem',
                }}
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
            <LogIn style={{ width: '18px', height: '18px' }} />
            {submitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: '#64748b',
              marginTop: '20px',
            }}
          >
            ¿No tienes cuenta aún?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
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
              Regístrate
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
