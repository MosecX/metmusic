# MetMusic — Reproductor web HiFi

[English](README.md)

Un reproductor web inspirado en Tidal que transmite música FLAC sin pérdida / Hi-Res a través de un proxy de API compatible con Tidal. Construido con Next.js App Router, React 19, TypeScript y Tailwind CSS v4, empaquetado como PWA y como app Android (Capacitor).

> Esto es un **cliente front-end**. No interactúa directamente con Tidal — todos los metadatos y el streaming pasan por tu propio proveedor de API (ver [APIs compatibles](#apis-compatibles)).

## Estado

Este proyecto es **muy reciente** y aún está en desarrollo activo. Es probable que tenga errores, bordes sin pulir y funciones faltantes. Si encuentras un error, un flujo roto o tienes una sugerencia, por favor **[abre un issue](https://github.com/MosecX/metmusic/issues)** — nos alegrará enterarnos para corregirlo en próximas actualizaciones.

## Funciones

- **Streaming de audio Hi-Res** — reproducción DASH (MPEG-DASH) y directa con insignias de calidad automáticas (`HI-RES`, `LOSSLESS`, `HIGH`, `LOSSY`) y marcadores Dolby Atmos
- **Visualizador a pantalla completa** — un `<dialog>` nativo con animaciones en capas del arte del álbum, letras sincronizadas y controles de transporte completos (consciente del *safe-area* en móviles con muesca)
- **Controles de medios del sistema** — Media Session API para las teclas de medios del SO / navegador (play, pause, next, previous, seek) con título/artista/portada y progreso en la pantalla de bloqueo; en Android va por el plugin nativo `@capgo/capacitor-media-session`
- **Manejo del botón atrás nativo en Android** — el botón físico cierra diálogos, retrocede en el historial o minimiza la app (`@capacitor/app`)
- **Atajos de teclado** — Espacio (play/pause), ←/→ (buscar ±10s), ↑/↓ (volumen), `N`/`P` (siguiente/anterior), `M` (silenciar)
- **Inicio personalizado** — el álbum destacado y las recomendaciones rotan aleatoriamente en la primera visita y se adaptan a tu historial de escucha en visitas posteriores
- **Tidal Mixes** — mixes reales generados (`/mix/<id>`) más un hub de mixes (`/mix`) con tarjetas basadas en semillas
- **Búsqueda** — búsqueda en vivo con debounce en canciones, álbumes, artistas y playlists
- **Biblioteca** — álbumes, artistas, playlists y canciones guardados (localStorage)
- **Páginas de detalle** — páginas de álbum, artista, canción, playlist y mix con reproducción total, menús contextuales (p. ej. "Go to mix") y soporte de cola
- **Playlists paginadas** — las playlists largas cargan por bloques con scroll infinito (`/api/playlist/[id]/tracks`)
- **Cola y controles de reproducción** — shuffle, repetir (off/todas/una), buscar, volumen, siguiente/anterior
- **UI responsive** — navegación por sidebar en escritorio, pestañas inferiores en móvil, insignias de calidad solo-icono en pantallas pequeñas, fondo degradado aurora
- **PWA** — service worker (`public/sw.js`) para caché y navegación amigable offline
- **Obtención de datos en el servidor** — las páginas obtienen los datos de la API en el servidor; los componentes cliente solo llaman a las rutas propias `/api/*`

## APIs compatibles

La app habla con proxies compatibles con Tidal. La compatibilidad depende del proveedor:

| Proveedor | Streaming | Metadatos | Global |
| --------- | --------- | --------- | ------ |
| [ez-hifi-api](https://github.com/itenai/ez-hifi-api) (recomendado) | DASH (`/track/`) **+ directo** (`/trackv2/`) | Completo | **100%** — esta es la implementación de referencia contra la que se construyó este reproductor |
| [hifi-api](https://github.com/binimum/hifi-api) | DASH (`/track/`) | Completo | **~100%** — casi completo; todo funciona salvo el camino rápido de stream directo `/trackv2/`, que cae elegantemente a DASH |

Ambos son del mismo linaje: `ez-hifi-api` es un fork de `binimum/hifi-api`, que a su vez es un fork del `sachinsenal0x64/hifi` original. Cualquier proveedor que exponga este esquema de API es compatible:

- `GET /search/?s=&a=&al=&p=` — buscar canciones, artistas, álbumes, playlists
- `GET /info/?id=` — metadatos de canción
- `GET /album/?id=` — detalle del álbum + lista de canciones
- `GET /artist/?id=` / `GET /artist/?f=` — perfil de artista / discografía
- `GET /playlist/?id=` — detalle de playlist + lista de canciones (límite de 100)
- `GET /mix/?id=` — detalle de mix de Tidal
- `GET /recommendations/?id=` — canciones relacionadas
- `GET /lyrics/?id=` — letras sincronizadas
- `GET /track/?id=&quality=` — manifiesto DASH (MPD en base64)
- `GET /trackv2/?id=` — URL de stream directo (solo ez-hifi-api)

## Stack tecnológico

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS v4
- [dash.js](https://github.com/Dash-Industry-Forum/dash.js) para reproducción DASH
- [@uimaxbai/am-lyrics](https://www.npmjs.com/package/@uimaxbai/am-lyrics) para letras sincronizadas
- [Capacitor 8](https://capacitorjs.com) + `@capacitor/app` + `@capgo/capacitor-media-session` para la app Android
- GitHub Actions para el build del APK Android

## Cómo funciona

```
┌─────────────┐     ┌─────────────────────────┐     ┌──────────────────────┐
│   Navegador │ ──► │  App Next.js (este repo)│ ──► │   Proveedor de API   │
│  (dash.js)  │ ◄── │  rutas /api/stream/*    │ ◄── │  (ez-hifi-api / hifi-│
└─────────────┘     └─────────────────────────┘     │   api)               │
                                                    └──────────────────────┘
```

1. Los componentes servidor obtienen los metadatos (álbumes, canciones, mixes, letras, búsquedas) de tu proveedor y renderizan la UI.
2. Cuando el usuario presiona play, el cliente pregunta a `/api/stream/info?id=…`, que sondea el proveedor para:
   - una **URL de stream directo** (`/trackv2/`, reenviada por `/api/stream`), o
   - un **manifiesto DASH** (`/track/`, obtenido por `/api/stream/manifest`, con las URLs de segmentos reescritas a `/api/segment` para mantener la reproducción a través de tu propio origen).
3. `/api/segment` hace de proxy de los segmentos de medios con soporte de `Range`, así el navegador nunca habla directamente con el proveedor.
4. `/api/artwork` hace de proxy de las portadas del CDN de Tidal para que la Media Session API pueda mostrar el arte (el CDN no envía cabeceras CORS).

**Notas móvil / WebView:**
- En clientes nativos (Capacitor) el reproductor llama a `/api/stream/info?...&native=1`, que prefiere una fuente directa AAC/mp4 sobre un manifiesto DASH FLAC — el WebView de Android no puede decodificar FLAC vía MSE.
- Si la reproducción DASH falla, el reproductor reintenta con el stream directo (`/trackv2/`), luego `LOSSLESS` y luego `HIGH`.

## Requisitos

- Node.js 20+
- npm
- Un endpoint de API compatible con Tidal — preferiblemente [ez-hifi-api](https://github.com/itenai/ez-hifi-api) (self-hosted). Es el proveedor con más soporte.

## Primeros pasos

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar el proveedor de API

La app lee la URL base de la API desde el entorno. **Nunca está hardcodeada** en el código fuente.

```bash
cp .env.example .env
```

Luego edita `.env` y pon tu proveedor:

```bash
# .env
NEXT_PUBLIC_API_BASE=https://tu-proveedor.example.com
```

> `.env` está en gitignore y no debe commitearse. `.env.example` está commiteado y solo contiene un placeholder, para que el proveedor siga siendo privado.

### 3. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## App Android (Capacitor)

El mismo código base también se distribuye como app Android. La app es un wrapper WebView que carga la app web desplegada mediante `server.url` en `capacitor.config.ts` (no empaqueta el servidor Next.js).

- **Construir el APK localmente:**

  ```bash
  npm run build        # primero compila la app web (Turbopack)
  npx cap sync android
  cd android && ./gradlew assembleDebug
  ```

- **CI:** `.github/workflows/build-apk.yml` corre en cada push a `main`: lint → build web → `cap sync` → build Gradle debug → sube `app-debug.apk` como artefacto.

> `web/` es el directorio de salida web de Capacitor (definido en `webDir`). La URL servida se configura en `capacitor.config.ts` → `server.url`.

## Atajos de teclado

| Tecla          | Acción                                |
| -------------- | ------------------------------------- |
| `Espacio`      | Reproducir / pausar                    |
| `←` / `→`      | Retroceder / avanzar 10 segundos       |
| `↑` / `↓`      | Subir / bajar volumen                 |
| `N` / `P`      | Siguiente / anterior canción           |
| `M`            | Silenciar / reactivar sonido           |

Los atajos se ignoran mientras escribes en inputs, o cuando un botón/enlace tiene el foco (toma el control el comportamiento nativo). Las teclas de medios (play/pause/next/prev/seek) y los metadatos de la pantalla de bloqueo se manejan con la [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API).

## Scripts

| Comando            | Descripción                            |
| ------------------ | -------------------------------------- |
| `npm run dev`      | Inicia el servidor de desarrollo (Turbopack) |
| `npm run build`    | Crea un build de producción optimizado |
| `npm run start`    | Inicia el servidor de producción       |
| `npm run lint`     | Ejecuta ESLint                         |

## Variables de entorno

| Variable               | Requerida | Descripción                                   |
| ---------------------- | --------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_BASE` | Sí        | URL base de tu proveedor de API compatible con Tidal |

Si `NEXT_PUBLIC_API_BASE` no está definida, la app lanza un error claro en tiempo de petición. Esta variable solo se usa en el servidor y dentro de las rutas propias `/api/*` — el proveedor queda oculto del navegador.

## Despliegue

### Vercel (recomendado)

1. Sube el repositorio a tu host de Git e impórtalo en [Vercel](https://vercel.com) (detecta Next.js automáticamente — sin configuración extra).
2. En **Project → Settings → Environment Variables**, añade `NEXT_PUBLIC_API_BASE` apuntando a tu proveedor.
3. Despliega. El comando de build (`next build`) y el output por defecto se usan tal cual.

### Cloudflare Workers (OpenNext)

El proyecto también corre en Cloudflare Workers vía [OpenNext](https://opennext.js.org) (`@opennextjs/cloudflare`). Después de `npm run build`, despliega el output del worker de OpenNext con la variable `NEXT_PUBLIC_API_BASE` definida; la `server.url` de la app Android apunta a la URL resultante del worker.

> **Nota sobre self-hosting de tu proveedor:** **no** despliegues `ez-hifi-api`/`hifi-api` en un host público — mira sus READMEs sobre los riesgos de baneo de cuenta y el uso pensado solo para homelab. Mantén tu API privada y expón solo el reproductor.

### Self-hosted

```bash
npm run build
npm run start
```

Asegúrate de que `NEXT_PUBLIC_API_BASE` esté presente en el entorno del proceso (p. ej. en la unidad systemd, env de Docker, o `.env.local`).

## Rutas de API

Todas las rutas devuelven JSON o medios con proxy y son lo único con lo que habla el cliente.

| Ruta                                  | Propósito                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `GET /api/stream/info?id=`            | Devuelve `{ mode: "direct" \| "dash", url?, manifest?, quality }` (acepta `&native=1` y `&atmos=1`) |
| `GET /api/stream?id=`                 | Hace proxy de una URL de stream directo (consciente de Range)             |
| `GET /api/stream/manifest?id=&quality=` | Obtiene el manifiesto DASH y reescribe las URLs de segmentos a `/api/segment` |
| `GET /api/segment?url=`               | Hace proxy de un segmento de medios con soporte de Range                  |
| `GET /api/artwork?url=`               | Hace proxy de la portada de `resources.tidal.com` (con cabeceras CORS)     |
| `GET /api/playlist/[id]/tracks?limit=&offset=` | Obtiene una página de playlist (paginación por scroll infinito) |

## Estructura del proyecto

```
.
├── app/
│   ├── layout.tsx              # Layout raíz, shell de navegación, PlayerProvider, manejador de botón atrás
│   ├── page.tsx                # Inicio: álbum destacado, recomendaciones, secciones
│   ├── album/[id]/             # Detalle de álbum
│   ├── artist/[id]/            # Detalle de artista + discografía
│   ├── track/[id]/             # Detalle de canción
│   ├── playlist/[id]/          # Detalle de playlist (scroll infinito)
│   ├── mix/                    # Hub de mixes (tarjetas basadas en semillas)
│   ├── mix/[id]/               # Detalle de mix real de Tidal
│   ├── search/                 # Búsqueda en vivo
│   ├── library/                # Álbumes/artistas/playlists/canciones guardados
│   └── api/
│       ├── stream/info/        # Sondea el proveedor: directo vs DASH
│       ├── stream/             # Reenvía la URL de stream directo
│       ├── stream/manifest/    # Obtiene + reescribe el manifiesto DASH
│       ├── segment/            # Hace proxy de segmentos de medios (consciente de Range)
│       ├── artwork/            # Hace proxy de portadas (CORS para Media Session)
│       └── playlist/[id]/tracks/  # Página de playlist (scroll infinito)
├── components/
│   ├── player.tsx              # Motor de reproducción (dash.js), cola, PlayerBar, visualizador
│   ├── playlist-content.tsx    # Lista de playlist con scroll infinito
│   ├── track-row.tsx           # Filas de canciones + insignia de calidad + menú contextual
│   ├── context-menu.tsx        # Menú contextual de canciones (Go to mix, añadir a cola…)
│   ├── cards.tsx               # Tarjetas de Álbum / Artista / Mix + CardGrid
│   ├── quality-badge.tsx       # Insignias de calidad + Atmos (solo-icono en móvil)
│   ├── lyrics.tsx              # Letras sincronizadas (visualizador)
│   ├── lyrics-preview.tsx      # Vista previa de letras en la página de canción
│   ├── android-back.tsx        # Manejo del botón atrás nativo (Capacitor)
│   ├── queue-panel.tsx         # Panel lateral de la cola
│   ├── api-status.tsx          # Banner de estado del proveedor
│   ├── retry-button.tsx        # UI de reintentar
│   ├── pwa-register.tsx        # Registro del service worker
│   ├── sidebar.tsx             # Navegación de escritorio
│   ├── nav-buttons.tsx         # Navegación por pestañas inferiores (móvil)
│   ├── search-box.tsx          # Input de búsqueda con debounce
│   ├── play-button.tsx         # Botón de reproducir todo
│   └── …
├── lib/
│   ├── tidal.ts                # Cliente de API + tipos (fetch del lado servidor)
│   ├── media-session.ts        # Helpers de Media Session (web + nativo capgo)
│   └── utils.ts                # Helpers de formato
├── android/                    # Proyecto Android de Capacitor (generado)
├── web/                        # Directorio de salida web de Capacitor
├── public/                     # Assets estáticos, iconos, sw.js (PWA)
├── capacitor.config.ts         # Config de Capacitor (appId, server.url, webDir)
└── next.config.ts              # Patrones remotos de imágenes para los CDN de Tidal
```

## Notas

- Los assets de imagen se sirven desde el CDN público de Tidal (`resources.tidal.com`, `images.tidal.com`); los patrones remotos permitidos se configuran en `next.config.ts`.
- La URL del proveedor de API solo se usa del lado del servidor y a través de las rutas propias de la app, manteniendo el proveedor subyacente oculto del navegador.
- El CDN rechaza el tamaño de portada `500x500` (403) — las portadas se piden a `640x640` o más.
- La cobertura `640x640` también aplica al arte de álbum/artista/mix servido por proxy a través de `/api/artwork`.