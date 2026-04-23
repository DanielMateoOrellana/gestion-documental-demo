# Gestion Documental FIEC Demo

Demo frontend-only del Repositorio Institucional de Evidencias FIEC. La app no requiere backend, base de datos ni variables de entorno: los datos se simulan en el navegador con `localStorage`.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Para generar el build de produccion:

```bash
npm run build
```

## Cuentas de prueba

Todas las cuentas usan la clave `demo123`.

| Rol | Email |
| --- | --- |
| Administrador | `admin.demo@fiec.espol.edu.ec` |
| Gestor | `gestor.demo@fiec.espol.edu.ec` |
| Lector | `lector.demo@fiec.espol.edu.ec` |
| Ayudante | `ayudante.demo@fiec.espol.edu.ec` |

## Datos demo

La informacion inicial incluye categorias, tipos de proceso, plantillas, expedientes, archivos simulados y bitacora. Los cambios se guardan en `localStorage`, por lo que se mantienen entre recargas del navegador.

Para reiniciar los datos, borra la clave `gestion-documental-demo::state::v1` desde las herramientas de desarrollo del navegador.

## Deploy

El proyecto esta listo para Vercel como app estatica de Vite:

- `buildCommand`: `npm run build`
- `outputDirectory`: `build`
- rewrite SPA hacia `/index.html`
