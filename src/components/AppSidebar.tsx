import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  LogOut,
  FileText,
  List,
  FolderTree,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { User } from "../types";
import logoExample from '../assets/logo-example.jpg';

interface AppSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
}

export function AppSidebar({
  currentView,
  onViewChange,
  currentUser,
  onLogout,
}: AppSidebarProps) {
  const allMenuItems = [
    {
      id: "dashboard",
      label: "Tablero",
      icon: LayoutDashboard,
    },
    { id: "processes", label: "Procesos", icon: FolderKanban },
    { id: "file-explorer", label: "Explorador", icon: FolderTree },
    { id: "templates", label: "Plantillas", icon: FileText },
    { id: "process-types", label: "Tipos de proceso", icon: List },
    { id: "admin", label: "Administración", icon: Settings, adminOnly: true },
  ];

  // Filtrar items según rol
  const menuItems = allMenuItems.filter(item => {
    if (item.adminOnly && currentUser.role !== 'ADMINISTRADOR') {
      return false;
    }
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md overflow-hidden bg-sidebar-primary">
            <img src={logoExample} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-sidebar-foreground">Tu Empresa</h2>
            <p className="text-xs text-sidebar-foreground/70">
              Gestión Documental
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id)}
                    isActive={currentView === item.id}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
              <span className="text-sidebar-primary-foreground text-sm">
                {currentUser.fullName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sidebar-foreground truncate">
                {currentUser.fullName}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate font-medium">
                {currentUser.role}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}