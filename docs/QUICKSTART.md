# Inicio rápido

Para la reunión del 10 de septiembre de 2026, sigue como fuente canónica [REUNION_FARMACIA_2026-09-10.md](REUNION_FARMACIA_2026-09-10.md). La demo local es el recorrido principal de 3 a 5 minutos; Docker es una validación técnica previa o respaldo opcional.

## Elige una superficie

| Quiero… | Comando | Requisitos |
|---|---|---|
| ver la demo de inmediato | `corepack pnpm demo:local` | Node.js 22+ |
| validar la demo antes de presentar | `corepack pnpm demo:check` | Node.js 22+ |
| probar API y PostgreSQL | `docker compose up --build` | Docker Desktop/Engine |
| abrir la app Windows | `corepack pnpm desktop` | Windows 10/11, Node.js 22+ |
| construir el EXE portable | `corepack pnpm desktop:pack` | Windows 10/11 |
| sincronizar Android | `corepack pnpm android:sync` | Node.js 22+ |
| construir el APK | `cd android && ./gradlew assembleDebug` | Java 21, Android SDK |

## Instalación común

```bash
git clone https://github.com/vladimiracunadev-create/commerce-operating-system.git
cd commerce-operating-system
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm demo:check
```

## Demo local

```bash
corepack pnpm demo:local
```

Abre `http://127.0.0.1:4173`. Elige **Demo local**. El producto, cliente y stock inicial permiten comenzar desde el paso 04 o recorrer todo desde el paso 01.

## Stack con servidor

Este perfil no es necesario para la presentación comercial. Úsalo para verificar API, PostgreSQL y agentes antes de la reunión, o como respaldo técnico si surge una pregunta específica.

```bash
docker compose up --build
```

Abre `http://localhost:8080`; la interfaz detecta la API. Si usaste antes la demo local, selecciona **API + PostgreSQL** y conecta `http://localhost:8080`.

Comprobaciones:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/ready
curl http://localhost:8100/health
```

Para detener sin borrar los datos:

```bash
docker compose down
```

`docker compose down -v` borra el volumen de PostgreSQL; úsalo solo si quieres eliminar definitivamente los datos del demo.

## Variables opcionales del agente

```dotenv
LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
```

Sin ellas, los cinco agentes usan propuestas deterministas y seguras. No se requiere una cuenta de IA para ejecutar el demo.

## Problemas frecuentes

- **Puerto 4173 ocupado:** define otro con `$env:PORT=4174` en PowerShell o `PORT=4174` en Bash.
- **La interfaz dice “Sin conexión”:** cambia a Demo local o verifica `/ready`.
- **Windows SmartScreen:** los artefactos de demo no están firmados; comprueba su SHA-256 antes de abrirlos.
- **Android no encuentra Gradle/SDK:** abre `android/` en Android Studio una vez y deja que instale el SDK recomendado.
