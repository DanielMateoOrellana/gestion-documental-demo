import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ProcessListSimple } from './components/ProcessListSimple';
import { ProcessDetailSimple } from './components/ProcessDetailSimple';
import { AdminPanel } from './components/AdminPanel';
import { TemplateManagerSimple } from './components/TemplateManagerSimple';
import { ProcessTypesList } from './components/ProcessTypesList';
import { FileExplorer } from './components/FileExplorer';
import { Login } from './components/Login';
import { AppSidebar } from './components/AppSidebar';
import { FileStack } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { useAuth } from './auth/AuthContext';
import type { User } from './types';
import { Register } from './components/Register';

type ViewType =
  | 'dashboard'
  | 'processes'
  | 'process-detail'
  | 'admin'
  | 'templates'
  | 'process-types'
  | 'file-explorer';

interface ViewData {
  processId?: number;
  action?: string;
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [viewData, setViewData] = useState<ViewData>({});
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (user) {
      window.history.pushState(null, '', window.location.href);

      const handleBackButton = () => {
        window.history.pushState(null, '', window.location.href);
      };

      window.addEventListener('popstate', handleBackButton);

      return () => {
        window.removeEventListener('popstate', handleBackButton);
      };
    }
  }, [user]);

  const handleViewChange = (view: string, data?: any) => {
    setCurrentView(view as ViewType);
    setViewData(data || {});
  };

  const handleLogout = () => {
    logout();
    setCurrentView('dashboard');
    setViewData({});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground">Cargando sesión...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {authMode === 'login' ? (
          <Login onSwitchToRegister={() => setAuthMode('register')} />
        ) : (
          <Register onSwitchToLogin={() => setAuthMode('login')} />
        )}
        <Toaster />
      </>
    );
  }

  const currentUser: User = user; // ya viene mapeado desde AuthContext

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard currentUser={currentUser} onViewChange={handleViewChange} />
        );
      case 'processes':
        return (
          <ProcessListSimple
            currentUser={currentUser}
            onViewChange={handleViewChange}
          />
        );
      case 'templates':
        return <TemplateManagerSimple currentUser={currentUser} />;
      case 'file-explorer':
        return <FileExplorer currentUser={currentUser} />;
      case 'process-types':
        return (
          <ProcessTypesList
            currentUser={currentUser}
            onViewChange={handleViewChange}
          />
        );
      case 'process-detail':
        return viewData.processId ? (
          <ProcessDetailSimple
            processId={viewData.processId}
            currentUser={currentUser}
            onBack={() => handleViewChange('processes')}
          />
        ) : (
          <Dashboard
            currentUser={currentUser}
            onViewChange={handleViewChange}
          />
        );
      case 'admin':
        // Protección de ruta: solo ADMINISTRADOR puede acceder
        if (currentUser.role !== 'ADMINISTRADOR') {
          // Redirigir a dashboard si no es admin
          handleViewChange('dashboard');
          return (
            <Dashboard currentUser={currentUser} onViewChange={handleViewChange} />
          );
        }
        return <AdminPanel currentUser={currentUser} />;
      default:
        return (
          <Dashboard currentUser={currentUser} onViewChange={handleViewChange} />
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header - Responsive */}
          <header className="border-b bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between px-3 sm:px-6 py-3">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mobile Menu Button */}
                <SidebarTrigger className="md:hidden" />
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <FileStack className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h2 className="text-muted-foreground text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                  Gestión Documental — Tu Empresa
                </h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  {currentUser.fullName} ({currentUser.role})
                </div>
                <div className="text-xs text-muted-foreground sm:hidden">
                  {currentUser.fullName.split(' ')[0]}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content - Responsive padding */}
          <main className="flex-1 bg-secondary overflow-x-hidden">
            {renderView()}
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}