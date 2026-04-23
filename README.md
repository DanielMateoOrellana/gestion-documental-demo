# Gestión Documental — Demo SaaS

Demo frontend-only de una plataforma SaaS de gestión documental. La app no requiere backend, base de datos ni variables de entorno: los datos se simulan en el navegador con `localStorage`.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Para generar el build de producción:

```bash
npm run build
```

## Cuentas de prueba

Todas las cuentas usan la clave `demo123`.

| Rol | Email |
| --- | --- |
| Administrador | `admin.demo@tuempresa.com` |
| Gestor | `gestor.demo@tuempresa.com` |
| Lector | `lector.demo@tuempresa.com` |
| Ayudante | `ayudante.demo@tuempresa.com` |

## Datos demo

La información inicial incluye categorías, tipos de proceso, plantillas, expedientes, archivos simulados y bitácora (contratos, RR. HH. y finanzas). Los cambios se guardan en `localStorage`, por lo que se mantienen entre recargas del navegador.

Para reiniciar los datos, borra la clave `gestion-documental-demo::state::v1` desde las herramientas de desarrollo del navegador.

## Deploy

El proyecto está listo para Vercel como app estática de Vite:

- `buildCommand`: `npm run build`
- `outputDirectory`: `build`
- rewrite SPA hacia `/index.html`
