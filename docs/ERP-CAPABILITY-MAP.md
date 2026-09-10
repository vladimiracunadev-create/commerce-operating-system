# Mapa de capacidades ERP

Fecha de corte: 10 de septiembre de 2026  
Versión evaluada: `0.3.0`

## Cómo leer este mapa

- **Operativo:** implementación ejecutada con evidencia reproducible dentro del alcance demo.
- **Simulado:** comportamiento implementado sin efecto externo real o con controles simplificados.
- **Documentado:** contrato o intención descrita, sin implementación operativa.
- **Planeado:** capacidad priorizada con criterio de salida, todavía no implementada.
- **Fuera de alcance:** no forma parte del producto actual y no debe inferirse como disponible.

“Operativo” no equivale a “listo para producción”. La demo local y PostgreSQL son fuentes deliberadamente separadas y no existe sincronización automática entre ellas.

## Capacidades actuales

| Dominio      | Capacidad                                  |                          Estado | Evidencia actual                                                               | Límite verificable                                                             |
| ------------ | ------------------------------------------ | ------------------------------: | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Catálogo     | producto, SKU y precio entero              |                       Operativo | `packages/demo-core/index.js`, `POST /api/products`, `UNIQUE(company_id, sku)` | una empresa demo fija en servidor                                              |
| Inventario   | recepción, saldo, reserva y disponibilidad |                       Operativo | motor local, tabla `stock`, smoke local/API                                    | sin movimientos inmutables, expiración, ajustes o transferencias               |
| CRM          | cliente y consentimiento booleano          |                       Operativo | motor local y `POST /api/customers`                                            | no es ficha clínica; sin ciclo de vida de consentimiento                       |
| Ventas       | pedido simple de una línea                 |                       Operativo | `createOrder`, `POST /api/orders`, máquina de estados                          | impuesto demo 19 %; fulfilment ampliado pendiente                              |
| Pagos        | aprobación y descuento de stock            |                        Simulado | `payOrder`, `/pay/mock`                                                        | no mueve dinero; sin proveedor ni clave de idempotencia                        |
| Tributación  | boleta única después del pago              |                        Simulado | `issueTaxDocument`, `/tax-document/mock`, índice único                         | no emite ante el SII ni tiene validez tributaria                               |
| Auditoría    | eventos visibles del recorrido             |               Operativo en demo | eventos locales y `outbox_events` v1 con contexto                              | worker, entrega y retención siguen pendientes                                  |
| Roles        | capacidades por rol                        |                        Simulado | `ROLES`, `permissions`, selector y `x-demo-role`                               | no autentica identidad; lecturas abiertas del demo                             |
| Agentes      | cinco propuestas con fallback              |                        Simulado | `services/agents/main.py`, `runAgent`                                          | no aplica acciones; gobierno/evaluación incompletos                            |
| Web          | interfaz responsive                        |                       Operativo | smoke Electron sobre seis tabs                                                 | evaluación WCAG completa pendiente                                             |
| PWA          | manifest y caché de activos                | Operativo con evidencia parcial | `manifest.webmanifest`, `sw.js`                                                | sin prueba dedicada de instalación/offline/update                              |
| Windows      | aplicación portable                        |             Operativo sin firma | Electron aislado; EXE local y release                                          | no firmado; usa icono Electron por defecto en build local                      |
| Android      | APK debug                                  |         Operativo en CI/release | workflow/release `v0.3.0`                                                      | build local no reproducida por falta de SDK; no es Play Store                  |
| API          | corte vertical Fastify                     |       Operativo como referencia | capas HTTP/aplicación/dominio/infraestructura y 6 pruebas de dominio           | autenticación real, rate limiting y operación internet pendientes              |
| PostgreSQL   | esquema inicial y transacciones parciales  |       Operativo como referencia | `001_schema.sql`, Compose saludable                                            | no hay migraciones evolutivas ni rollback                                      |
| GitHub Pages | landing y copia web                        |                       Operativo | workflow Pages exitoso                                                         | publicación estática, no backend productivo                                    |

## Capacidades ERP no operativas todavía

| Área          | Capacidad                                   |                  Estado | Evidencia/decisión                       | Gate para cambiar de estado                                                          |
| ------------- | ------------------------------------------- | ----------------------: | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| Plataforma    | multiempresa real                           |                Planeado | columnas `company_id`; diseño incompleto | pruebas cruzadas de lectura/escritura con dos tenants y autorización por operación   |
| Plataforma    | identidad OIDC/OAuth 2.1                    |                Planeado | requisito documentado                    | proveedor elegido, sesiones/tokens seguros y pruebas de autorización                 |
| Plataforma    | permisos por capacidades                    |                Planeado | mapa demo existente                      | permisos persistidos, aplicados a cada endpoint y auditados                          |
| Datos         | migraciones versionadas                     |                Planeado | solo script inicial                      | runner, historial, forward y rollback compatible probados                            |
| Inventario    | movimientos/kardex inmutable                |                Planeado | evento de recepción parcial              | ledger de movimientos que reconstruye saldos y conserva actor/motivo                 |
| Inventario    | múltiples bodegas y ubicaciones             |                Planeado | tabla `warehouses`                       | contexto de bodega, transferencias atómicas y pruebas por tenant                     |
| Inventario    | lotes, series y vencimiento                 |       Planeado opcional | utilidad conceptual para farmacia        | levantamiento funcional; sin afirmar cumplimiento farmacéutico                       |
| Compras       | proveedores y órdenes de compra             |                Planeado | límite arquitectónico                    | flujo vertical proveedor → OC → recepción → movimiento, con UI/API/migración/pruebas |
| Ventas        | cotizaciones y múltiples líneas             |                Planeado | `order_items` existe                     | cálculo compartido, impuestos configurables y conversión auditada                    |
| Ventas        | devoluciones y reembolsos                   |                Planeado | contrato `refund` documentado            | total reembolsado nunca supera pagado; adaptador mock e idempotencia                 |
| Fulfilment    | preparación, envío y entrega                |             Documentado | estados SQL y contrato conceptual        | máquina de estados, adaptador y webhooks firmados                                    |
| CRM           | organizaciones, oportunidades y actividades |                Planeado | sin tablas/casos de uso                  | corte vertical con consentimiento y eliminación/exportación auditadas                |
| Contabilidad  | subledger, CxC y CxP                        |                Planeado | no implementado                          | asientos balanceados de laboratorio y trazabilidad al origen                         |
| Integraciones | pago real                                   | Fuera de alcance actual | contratos en `docs/INTEGRATIONS.md`      | proveedor y sandbox seleccionados, credenciales seguras, conciliación y webhooks     |
| Integraciones | DTE/SII real                                | Fuera de alcance actual | contrato mock                            | proveedor/certificación válida y revisión profesional                                |
| Integraciones | marketing/canales externos                  |             Documentado | slots de conectores                      | consentimiento, aprobación humana y sandbox verificados                              |
| Operación     | outbox worker                               |                Planeado | tabla sin procesamiento                  | reintentos, backoff, observabilidad y dead-letter probados                           |
| Operación     | métricas, trazas y SLO                      |                Planeado | logs y health/ready básicos              | señales definidas, redacción y alertas accionables                                   |
| Operación     | backup y restauración                       | Fuera de alcance actual | volumen Docker únicamente                | restauración automatizada en entorno desechable con evidencia                        |
| Seguridad     | RLS PostgreSQL                              |      Planeado/evaluable | no configurado                           | defensa adicional probada; no reemplaza autorización de aplicación                   |
| Seguridad     | firma de artefactos                         | Fuera de alcance actual | checksums presentes                      | identidad de firma, pipeline seguro y verificación del consumidor                    |

## Invariantes: cobertura actual

| Invariante objetivo                 |                          Local |                                   Servidor | Evidencia faltante                                                |
| ----------------------------------- | -----------------------------: | -----------------------------------------: | ----------------------------------------------------------------- |
| SKU único por empresa               | sí para la única empresa local |                    sí por índice compuesto | conflicto API normalizado y dos tenants                           |
| dinero como entero                  |                             sí |                                         sí | límites y contrato compartido                                     |
| disponibilidad = física - reservada |                             sí |                                         sí | restricción DB y pruebas concurrentes                             |
| reserva no supera disponibilidad    |              sí en flujo único |                        sí con `FOR UPDATE` | concurrencia y otras rutas de escritura                           |
| pago descuenta/libera una vez       |     rechazo al segundo intento | bloqueo de pedido evita segunda transición | idempotencia con mismo resultado y prueba concurrente             |
| transición de pedido válida         |   solo pago pendiente → pagado | máquina explícita y matriz completa probada | paridad compartida entre ambos motores                            |
| cancelar/expirar libera una vez     |                             no |                                         no | implementación y pruebas                                          |
| reembolso ≤ pago                    |                             no |                                         no | implementación y pruebas                                          |
| documento mock pagado y único       |                             sí |                       protegido por índice | carrera y error de dominio estable                                |
| evento auditable completo           |                        parcial | actor, correlación, causación y versión v1 | sanitización avanzada y procesamiento outbox                     |
| aislamiento entre empresas          | no aplicable a un tenant local |                                         no | fixtures y pruebas con dos tenants                                |
| agente propone hasta aprobación     |                             sí |                        declara no escribir | estado de aprobación y aplicación controlada                      |
| operación externa reintentable      |  no existen operaciones reales |                            no implementado | claves, resultado del proveedor y replay protection               |

## Regla de comunicación

Pagos, documentos tributarios y agentes deben conservar etiquetas de simulación. Compras, WMS, contabilidad, identidad, multiempresa, observabilidad y backups no deben aparecer como operativos hasta superar sus gates. Las referencias a otros ERP o estándares solo sirven para comparar procesos y nunca constituyen código o funcionalidad de Commerce OS.
