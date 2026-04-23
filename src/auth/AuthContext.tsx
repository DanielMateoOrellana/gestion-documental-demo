import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { loginApi, fetchMe } from '../api/auth';
import type { User } from '../types'; // <- tu tipo existente

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Adaptador de lo que devuelve la API demo -> User del frontend
function mapAuthUserToUser(authUser: any): User {
  return {
    id: authUser.id,
    email: authUser.email,
    // tu front usa full_name, el back fullName
    fullName: authUser.fullName ?? authUser.full_name ?? authUser.email,
    role: authUser.role,
    isActive: authUser.isActive ?? true,
    createdAt: authUser.createdAt ?? new Date().toISOString(),
    updatedAt: authUser.updatedAt ?? new Date().toISOString(),
  } as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión si hay token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMe()
      .then((authUser) => {
        const mapped = mapAuthUserToUser(authUser);
        setUser(mapped);
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { access_token, user: authUser } = await loginApi(email, password);
    const mapped = mapAuthUserToUser(authUser);

    localStorage.setItem('auth_token', access_token);
    setUser(mapped);
  }

  function logout() {
    localStorage.removeItem('auth_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
