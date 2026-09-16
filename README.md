# Cotizador

App de escritorio para crear y gestionar cotizaciones, hecha con Electron, React (Vite) y SQLite (`better-sqlite3`). Corre en Windows y Mac.

## Funcionalidades

- Clientes y catálogo de productos/servicios reutilizables.
- Cotizaciones con folio automático (`COT-0001`, `COT-0002`, ...) y estado (Borrador, Enviada, Aprobada, Rechazada).
- Exportar cualquier cotización a PDF (con logo y datos de la empresa).
- Historial de cotizaciones con búsqueda, filtro por estado y duplicado.
- Moneda e impuesto configurables desde Configuración.
- Todos los datos se guardan localmente en SQLite (no requiere internet ni servidor).

## Desarrollo

```bash
npm install
npm run dev
```

`npm install` corre automáticamente `electron-rebuild` (vía el script `postinstall`) para compilar `better-sqlite3` contra la versión de Node que usa Electron. Si alguna vez ves un error de `NODE_MODULE_VERSION`, corre:

```bash
npx electron-rebuild -f -w better-sqlite3
```

Si tu npm (v11+) muestra un aviso de que hay "packages with install scripts not yet covered by allowScripts" (electron, better-sqlite3, esbuild, fsevents), es la protección de scripts de instalación de npm. Este proyecto ya declara esos paquetes como aprobados en `package.json` (`allowScripts`), así que solo debería pasar si actualizas sus versiones. En ese caso corre:

```bash
npm approve-scripts --allow-scripts-pending
```

`npm run dev` levanta el servidor de Vite y abre la ventana de Electron apuntando a él, con recarga en caliente del renderer.

## Generar los instaladores

```bash
npm run dist:mac   # genera un .dmg en release/
npm run dist:win   # genera un instalador .exe (NSIS) en release/
```

Notas:

- **Mac**: como la app no está firmada con un certificado de Apple Developer, al abrir el `.dmg` por primera vez macOS puede mostrar una advertencia de Gatekeeper ("no se puede verificar el desarrollador"). Se resuelve haciendo clic derecho sobre la app instalada → **Abrir**, y confirmando en el diálogo.
- **Windows**: `npm run dist:win` normalmente funciona desde Mac (electron-builder empaqueta su propio NSIS). Si tu entorno no logra generarlo desde Mac, corre el mismo comando en una máquina Windows o en un runner de CI con Windows.
- El icono de la app usa el ícono por defecto de Electron. Para personalizarlo, coloca un `icon.png` (1024x1024) en `build/` y agrega `"icon": "build/icon.png"` dentro de `mac` y `win` en la sección `build` de `package.json`.

## Dónde se guardan los datos

La base de datos SQLite y el logo de la empresa se guardan en la carpeta de datos de usuario de la app (`app.getPath('userData')`), no dentro de la carpeta del proyecto. Esto significa que los datos persisten entre actualizaciones de la app.
