# Plataformas

## Matriz

| Plataforma | Tecnología | Datos por defecto | Artefacto | Requisito mínimo |
|---|---|---|---|---|
| Navegador | HTML/CSS/JS + PWA | local persistente | sitio estático | navegador moderno |
| Windows | Electron 44 | local persistente | EXE portable | Windows 10/11 x64 |
| Android | Capacitor 8 | local persistente | APK debug | Android 7+ recomendado |
| Servidor | Fastify + PostgreSQL + FastAPI | PostgreSQL | imágenes Docker | Docker Compose |

## Contrato de paridad

Las tres interfaces deben permitir el recorrido definido en [DEMO.md](DEMO.md). No se acepta una edición móvil recortada: el layout cambia, no las capacidades del demo.

Para la reunión de farmacia, el orden de presentación, mensajes y Plan B se definen en [REUNION_FARMACIA_2026-09-10.md](REUNION_FARMACIA_2026-09-10.md). La superficie local es principal y el servidor Docker es opcional.

## Windows

Electron carga exclusivamente los activos locales del repositorio. La ventana activa:

- `contextIsolation: true`;
- `nodeIntegration: false`;
- `sandbox: true`;
- enlaces externos fuera de la WebView.

El EXE portable no está firmado. Windows puede mostrar SmartScreen; una release debe publicar `SHA256SUMS.txt` y declarar esta limitación.

## Android

Capacitor empaqueta los mismos activos de `apps/web`. La build debug es instalable manualmente; no es una publicación de Play Store y no está firmada para distribución comercial.

Para conectar un dispositivo a la API del PC:

1. ambos deben estar en la misma red;
2. la API debe escuchar en `0.0.0.0`;
3. usa la IP LAN del PC, por ejemplo `http://192.168.1.20:8080`;
4. configura CORS y red solo en un entorno de confianza.

El emulador Android suele acceder al host mediante `http://10.0.2.2:8080`.

## PWA

El service worker cachea la interfaz y el motor local. No cachea rutas `/api/`; una caída del servidor nunca se disfraza como una respuesta de negocio válida.
