# Auditoría ERP y línea base

Fecha de auditoría: 10 de septiembre de 2026  
Repositorio: `vladimiracunadev-create/commerce-operating-system`  
Rama y revisión auditadas: `main` en `3377292ff2e0035c5591504a10466bc67dedc7f6`  
Versión canónica: `0.3.0`

## Resumen ejecutivo

Commerce Operating System tiene una línea base ejecutable y honesta como demo conceptual: el motor local, la API TypeScript, el flujo visual, el stack Docker y el empaquetado Windows fueron reproducidos durante esta auditoría. La suite actual contiene 11 pruebas y `pnpm demo:check` termina en `DEMO READY`.

La base todavía no es un núcleo ERP apto para producción. Los principales bloqueos son una dependencia HTTP con vulnerabilidad alta conocida, el tenant y la bodega globales del perfil servidor, lecturas sin autorización, eventos escritos fuera de las transacciones comerciales y la ausencia de idempotencia contractual, migraciones evolutivas y pruebas de concurrencia/aislamiento. No se encontró una razón para reescribir el producto ni para cambiar Fastify, TypeScript, PostgreSQL o el enfoque de monolito modular.

No se detectaron hallazgos de severidad crítica en el alcance revisado. Esta conclusión no sustituye una prueba de penetración, un análisis SAST completo ni una auditoría profesional de cumplimiento.

## Alcance y método

Se revisaron completamente los archivos de raíz solicitados, los tres workflows, la documentación, `apps/`, `packages/`, `services/agents/`, `infra/sql/`, `scripts/` y `tests/`. También se inspeccionaron la configuración de Capacitor, el manifiesto Android, el historial reciente y los metadatos públicos de GitHub.

La auditoría distinguió afirmaciones de estado actual de referencias históricas. No se modificaron entradas históricas del changelog ni la release `v0.3.0`.

## Línea base reproducible

Entorno local observado:

| Herramienta    | Valor observado |           Requisito declarado | Resultado                                     |
| -------------- | --------------: | ----------------------------: | --------------------------------------------- |
| Node.js        |       `24.11.1` |                         `22+` | compatible para las verificaciones realizadas |
| pnpm           |       `10.16.1` | `10.16.1` en `packageManager` | coincide                                      |
| Python         |        `3.12.9` |     imagen `python:3.12-slim` | coincide en versión mayor/menor               |
| Java           |        `19.0.1` |                       Java 21 | no coincide                                   |
| Docker         |        `29.7.2` |                Docker Compose | disponible                                    |
| Docker Compose |        `v5.5.1` |                Docker Compose | disponible                                    |

Comandos ejecutados:

| Comando                                        | Resultado                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `corepack pnpm install --frozen-lockfile`      | correcto; lockfile vigente; pnpm informó scripts de build no aprobados para `electron-winstaller` y `esbuild` |
| `corepack pnpm check`                          | correcto; 11/11 pruebas, TypeScript y 23 archivos requeridos verificados                                      |
| `corepack pnpm demo:check`                     | correcto; salida final `DEMO READY`                                                                           |
| `corepack pnpm test:web` con `pnpm demo:local` | correcto; seis pestañas, pago/documento mock, rechazo por rol y eventos verificados                           |
| `corepack pnpm desktop:pack`                   | correcto; EXE de 99.779.949 bytes, SHA-256 `A3B0BC198C2490268898588AEFCB7713598EDE64261D5FEADF87F7DCBF6F5E21` |
| `corepack pnpm android:build`                  | no ejecutable hasta el final: falta Android SDK/local `sdk.dir`; el host además tiene Java 19, no Java 21     |
| `docker compose config --quiet`                | correcto                                                                                                      |
| `docker compose up --build --detach --wait`    | correcto; `db`, `api` y `agents` saludables                                                                   |
| `node scripts/smoke-api.mjs`                   | correcto; API activa, DB `ready`, pedido pagado, pago/documento mock y agente `safe-fallback`                 |
| `corepack pnpm audit --audit-level=low`        | falló el gate de seguridad: 1 vulnerabilidad alta y 4 moderadas                                               |
| escaneo de patrones de secretos                | sin coincidencias en archivos fuente auditados                                                                |
| escaneo programático de mojibake UTF-8         | `MOJIBAKE_RESIDUAL=0`                                                                                         |

El stack Docker temporal fue detenido con `docker compose down`, conservando el volumen. Las capturas regeneradas por el smoke visual fueron retiradas del diff porque no representaban un cambio funcional.

## Coherencia de afirmaciones

| Dimensión      | Fuente de verdad             | Afirmación actual                                               | Resultado                                                                                                |
| -------------- | ---------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Versión        | `package.json` y tag/release | `0.3.0`                                                         | coherente en README, UI, landing y Android `versionName`                                                 |
| Pruebas        | salida de `node --test`      | 11 pruebas                                                      | coherente con README y landing                                                                           |
| Workflows      | `.github/workflows/*.yml`    | 3 workflows                                                     | `ci.yml`, `pages.yml`, `release.yml`; `dependabot.yml` es configuración, no workflow                     |
| Prerrequisitos | CI y documentación           | Node 22, Java 21 para Android                                   | coherente; falta declarar `engines` en los manifests                                                     |
| Actions        | referencias `uses:` y GitHub | versiones válidas                                               | las etiquetas v7/v8/v6 existen; Pages fija cuatro acciones por SHA, CI y Release usan etiquetas mutables |
| GitHub About   | API de GitHub                | v0.3.0, seis pestañas, Web/Windows/Android, sin dinero/SII real | coherente con el repositorio                                                                             |
| Release        | GitHub `v0.3.0`              | EXE, APK y checksums                                            | artefactos publicados y release no preliminar                                                            |
| Codificación   | escaneo UTF-8 programático   | texto español y símbolos                                        | sin mojibake residual detectado                                                                          |

Workflows remotos verificados:

- CI de `3377292` finalizó correctamente: <https://github.com/vladimiracunadev-create/commerce-operating-system/actions/runs/34479616157>.
- Pages de `6956ba1` finalizó correctamente: <https://github.com/vladimiracunadev-create/commerce-operating-system/actions/runs/34478962836>. El commit auditado solo cambia documentación que no dispara ese workflow.
- Release `v0.3.0` finalizó correctamente: <https://github.com/vladimiracunadev-create/commerce-operating-system/actions/runs/34426231644>.

## Matriz capacidad → evidencia → brecha

Prioridad: P0 bloquea cualquier exposición o piloto; P1 antecede nuevos módulos; P2 acompaña la evolución; P3 es mejora diferible.

| Capacidad                | Estado actual                 | Evidencia                                                                         | Brecha                                                                                                                              |                Prioridad | Riesgo                                  |
| ------------------------ | ----------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -----------------------: | --------------------------------------- |
| Catálogo                 | operativo en demo             | `DemoStore.createProduct`, `POST /api/products`, índice único `(company_id, sku)` | API monolítica; manejo de conflicto SQL no normalizado                                                                              |                       P1 | medio                                   |
| Dinero                   | operativo en demo             | enteros `*_cents` en JS y PostgreSQL                                              | nombre `cents` es específico pese a CLP; falta tipo/contrato compartido y límites de overflow                                       |                       P1 | medio                                   |
| Inventario y reserva     | operativo en demo             | `quantity - reserved`; bloqueo `FOR UPDATE` al crear pedido                       | DB no impide negativos ni `reserved > quantity`; no hay movimiento inmutable, expiración o cancelación                              |                       P0 | alto                                    |
| Pedidos                  | operativo en corte simple     | pedido de una línea y estado `pending_payment → paid`                             | no hay máquina de estados central, varias líneas, cancelación ni historial de transiciones                                          |                       P1 | alto                                    |
| Pago                     | simulado                      | adaptador mock implícito; transacción con bloqueo de pedido                       | no acepta clave de idempotencia; un retry obtiene 409 en vez del resultado previo                                                   |                       P0 | alto                                    |
| Documento tributario     | simulado                      | pago previo e índice único por pedido                                             | carrera entre consulta e inserción puede terminar como error SQL no controlado; no es DTE/SII                                       |                       P1 | medio                                   |
| CRM                      | operativo en demo             | cliente, email y consentimiento booleano                                          | consentimiento sin propósito/fuente/versión/fecha; sin deduplicación, retención o eliminación                                       |                       P2 | alto para datos reales                  |
| Eventos/auditoría        | demo parcial                  | `outbox_events` y línea de tiempo local                                           | `emit` ocurre después del `COMMIT`; faltan actor, correlación, causación y versión; no se emite reserva explícita                   |                       P0 | alto                                    |
| Outbox                   | documentado/no operativo      | tabla `outbox_events`                                                             | sin worker, reintentos, backoff, estado de error o dead-letter                                                                      |                       P2 | medio                                   |
| Multiempresa             | planeado                      | varias tablas contienen `company_id`                                              | constantes globales de empresa/bodega; joins/FK no garantizan pertenencia; sin pruebas de aislamiento                               |                       P0 | alto                                    |
| Identidad y RBAC         | simulado                      | `x-demo-role` y mapa de capacidades                                               | lecturas `/api/demo/users`, `/api/demo/state` sin autorización; no hay identidad ni sesión real                                     |                       P0 | alto                                    |
| Compras/proveedores      | fuera de alcance actual       | solo aparece como límite arquitectónico                                           | sin proveedor, orden, recepción ni costo                                                                                            |                       P2 | medio                                   |
| WMS/múltiples bodegas    | planeado                      | tabla `warehouses`                                                                | bodega global fija; sin ubicaciones, transferencias, ajustes o kardex                                                               |                       P2 | alto                                    |
| Ventas/OMS ampliado      | planeado                      | una línea por endpoint aunque existe `order_items`                                | IVA 19 % hardcodeado, sin cotización, descuentos, devoluciones o fulfilment                                                         |                       P2 | alto                                    |
| Contabilidad operacional | fuera de alcance actual       | no hay implementación                                                             | sin subledger, CxC/CxP ni asientos de laboratorio                                                                                   |                       P3 | medio                                   |
| Agentes                  | simulado                      | cinco perfiles, fallback, aprobación declarada                                    | sin esquema versionado, redacción, métricas, evaluación o defensa de prompt injection                                               |                       P2 | alto antes de usar LLM con datos reales |
| PWA                      | operativo con alcance acotado | manifest y service worker; UI compartida                                          | sin prueba automatizada específica de instalación/offline/cache upgrade                                                             |                       P2 | medio                                   |
| Windows                  | operativo sin firma           | smoke Electron y EXE reproducido                                                  | icono por defecto, binario no firmado; enlaces HTTPS se abren externamente                                                          |                       P2 | medio                                   |
| Android                  | operativo en CI/release       | APK publicado por workflow exitoso                                                | build local no reproducida por falta de SDK; `allowBackup=true`; documentación de API HTTP debe validarse contra política cleartext |                       P2 | medio                                   |
| Observabilidad           | planeado                      | logger Fastify y endpoints health/ready                                           | sin correlation ID, redacción sistemática, métricas, trazas o SLO                                                                   |                       P2 | alto en producción                      |
| Backup/restauración      | fuera de alcance actual       | volumen Compose                                                                   | sin procedimiento ni prueba de restauración                                                                                         | P1 antes de datos reales | alto                                    |
| Integraciones reales     | documentado                   | contratos en `docs/INTEGRATIONS.md`                                               | estados como `adapter-ready` pueden interpretarse en exceso; no hay proveedor conectado                                             |                       P3 | alto si se comunica mal                 |

## Hallazgos priorizados

### Altos

#### A-01 — Dependencia de serving estático vulnerable

`pnpm audit` resolvió `@fastify/static 8.3.0` y reportó una vulnerabilidad alta de evasión de guardas/path traversal, además de tres avisos moderados del mismo paquete. El perfil servidor registra este plugin en la raíz `/`.

Criterio de aceptación: actualizar a una versión compatible y corregida, documentar la compatibilidad con Fastify 5, ejecutar `pnpm audit`, `pnpm check`, Compose y el smoke API; el gate no debe conservar vulnerabilidades altas aplicables.

#### A-02 — Aislamiento y autorización de tenant no implementados

La API utiliza `COMPANY` y `WAREHOUSE` globales. Las lecturas de usuarios/estado no llaman a autorización. La creación de pedidos valida el producto contra la empresa, pero no valida que el cliente pertenezca a ella; stock y relaciones tampoco usan claves foráneas compuestas que refuercen pertenencia.

Criterio de aceptación: contexto de tenant derivado de identidad autenticada o fixture explícito de integración, autorización en cada lectura/escritura, restricciones relacionales y pruebas negativas cruzadas entre al menos dos tenants.

#### A-03 — Transacción comercial y evento pueden divergir

Producto, stock, cliente, pedido, pago, documento y reset confirman cambios antes de llamar a `emit`, que usa otra conexión. Un fallo del evento puede devolver error después de persistir la operación; también impide garantizar auditoría exactamente una vez.

Criterio de aceptación: cambio de estado y evento se escriben con el mismo cliente/transacción; rollback probado cuando falla cualquiera; `event_id`, tenant, actor, correlación, causación, versión y payload sanitizado son obligatorios.

#### A-04 — Invariantes de stock insuficientemente reforzadas

La tabla `stock` carece de `CHECK (quantity >= 0)`, `CHECK (reserved >= 0)` y `CHECK (reserved <= quantity)`. La lógica evita sobre-reserva en el camino feliz, pero no protege otras escrituras ni futuros adaptadores.

Criterio de aceptación: restricciones/migración no destructiva, casos de rollback y pruebas concurrentes que demuestren que nunca se confirma stock negativo o sobre-reservado.

#### A-05 — Pago mock no es idempotente como contrato

El bloqueo de la fila impide normalmente dos descuentos confirmados, pero una repetición devuelve `invalid_order_status`; no existe clave de idempotencia ni recuperación del resultado previo. No hay prueba concurrente del endpoint.

Criterio de aceptación: misma clave + mismo payload devuelve el mismo pago sin segundo efecto; misma clave + payload distinto se rechaza; pruebas concurrentes verifican un pago, un descuento y una liberación.

### Medios

#### M-01 — Núcleo API concentrado en `server.ts`

Rutas, validación, autorización, SQL y casos de uso conviven en un único archivo. Esto favorece divergencia con `packages/demo-core` y hace difícil probar invariantes sin infraestructura HTTP.

Criterio de aceptación: modularización incremental con rutas/adaptadores, aplicación, dominio, repositorios e infraestructura; sin cambio de framework ni reescritura.

#### M-02 — Divergencia local/API sin suite de contrato

Ambos núcleos duplican permisos, impuesto, estados, eventos y validaciones. Las 11 pruebas cubren principalmente el motor local, presentación y documentación; la API solo tiene un smoke feliz en Docker.

Criterio de aceptación: tabla explícita de paridad y casos compartidos para stock insuficiente, retry de pago, documento duplicado, rol, estado inválido, rollback y tenant.

#### M-03 — Emisión mock tiene una carrera no normalizada

La comprobación de documento existente y el `INSERT` no comparten transacción/bloqueo. El índice único protege los datos, pero una carrera puede aparecer como error interno en lugar de respuesta de dominio estable.

Criterio de aceptación: emisión atómica e idempotente o conflicto de dominio determinista, con prueba concurrente.

#### M-04 — Workflows CI/Release usan etiquetas mutables

Las versiones referenciadas existen y los workflows están verdes, pero CI y Release usan `@v7`, `@v8` y `@v6`; solo Pages fija sus cuatro acciones por SHA.

Criterio de aceptación: fijar todas las acciones de terceros por SHA con comentario de versión, validar YAML/actionlint y ejecutar los workflows aplicables.

#### M-05 — Agentes sin controles de entrada y medición suficientes

El servicio puede enviar `goal` y `context` completos a un endpoint LLM configurado. No hay redacción, versionado de esquema/prompt, allowlist de contexto, evaluación ni estado de aprobación persistente.

Criterio de aceptación: entradas mínimas y sanitizadas, salida versionada, telemetría segura, pruebas de prompt injection y flujo `propuesta → revisión → aprobación/rechazo → aplicación` sin herramientas privilegiadas.

#### M-06 — Endurecimiento HTTP pendiente

CORS usa `origin: true`, la API escucha en `0.0.0.0` y no se observan rate limiting ni cabeceras seguras específicas. Esto es compatible con una demo en red de confianza, no con exposición pública.

Criterio de aceptación: perfiles demo/servidor explícitos, CORS restrictivo, límites documentados, cabeceras y pruebas de error sin filtraciones.

#### M-07 — Android requiere reconciliar seguridad y documentación de red

El manifiesto permite backup de datos locales. La documentación propone API HTTP en LAN mientras la plataforma moderna puede bloquear cleartext según configuración efectiva. La build local no llegó a compilar por ausencia de SDK.

Criterio de aceptación: decisión documentada sobre backups, prueba en dispositivo/emulador del perfil permitido y configuración de red coherente; build con Java 21 y SDK reproducida.

### Bajos

#### B-01 — “Esquema versionado” puede sobrestimar la persistencia

`docs/STATUS.md` describe PostgreSQL como “esquema versionado”, pero hoy existe un único script de inicialización de Compose, sin runner, tabla de historial ni rollback probado.

Criterio de aceptación: hasta introducir migraciones, describirlo como esquema SQL inicial; después exigir migración forward, historial y rollback compatible.

#### B-02 — Prerrequisitos no reforzados por manifests

README/Quickstart/CI usan Node 22, pero `package.json` no declara `engines`; el paquete API tampoco. Esto permite instalaciones no probadas sin advertencia temprana.

Criterio de aceptación: ADR breve o campos `engines` coherentes con CI y documentación, más verificación en `check:project`.

#### B-03 — Evidencia PWA y accesibilidad es parcial

Hay skip link, foco visible, tabs con teclado, manifest y service worker. No existe auditoría WCAG automatizada ni prueba dedicada de instalación/offline/actualización de caché.

Criterio de aceptación: casos automatizados mínimos y lista manual reproducible para WCAG 2.2 AA en los flujos principales.

## Riesgos que permanecen explícitamente fuera del producto actual

- pagos reales y reembolsos de proveedor;
- emisión DTE/SII certificada;
- autenticación productiva, MFA/passkeys y aislamiento multiempresa;
- cumplimiento farmacéutico o sanitario;
- contabilidad oficial, libros tributarios y conciliación bancaria;
- firma de EXE/APK, backups restaurados, SLO y operación 24/7.

## Rollback del Hito 1

Este hito solo añade documentación. El rollback consiste en retirar los tres documentos de auditoría/mapa/roadmap. No hay migraciones, cambios de API, dependencias, datos ni artefactos versionados que revertir.

## Decisión de salida

La línea base funcional está verde y permite continuar. El Hito 2 debe limitarse a modularizar el núcleo, introducir errores de dominio y una máquina explícita de estados, preservando contratos y demo. Antes o dentro de ese incremento debe resolverse A-01, porque una vulnerabilidad alta aplicable no debe acompañar el crecimiento del perfil servidor.
