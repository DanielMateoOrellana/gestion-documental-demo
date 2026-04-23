import { useState } from 'react';
import { User } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, FileSearch, Settings as SettingsIcon } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { AuditLogViewer } from './AuditLogViewer';

interface AdminPanelProps {
  currentUser: User;
}

export function AdminPanel({ currentUser }: AdminPanelProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Administración</h1>
        <p className="text-muted-foreground">
          Gestión de usuarios, auditoría y configuración del sistema
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Shield className="w-4 h-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileSearch className="w-4 h-4 mr-2" />
            Bitácora
          </TabsTrigger>
          <TabsTrigger value="system">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogViewer currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
              <CardDescription>
                Configuracion de la version demo frontend-only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Version</div>
                    <div className="text-2xl">Demo</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Persistencia</div>
                    <div className="text-2xl">localStorage</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Ambiente</div>
                    <div className="text-2xl">Demo</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Backend</div>
                    <div className="text-2xl">No requerido</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Los datos se simulan en el navegador para presentar el flujo completo sin servidor ni base de datos.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
