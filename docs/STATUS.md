# Estado verificable

Fecha de verificación documental y funcional: 2026-09-10.

## Leyenda

- ✅ **operativo:** implementado, ejecutable y cubierto por una comprobación.
- 🟡 **demo:** implementado con adaptador simulado o control simplificado.
- 🔵 **documentado:** contrato definido, implementación pendiente.
- ⚪ **fuera de alcance actual:** no debe darse por existente.

## Funcionalidad

| Capacidad | Estado | Evidencia |
|---|---:|---|
| Catálogo | ✅ | creación, SKU único y precio positivo |
| Inventario | ✅ | recepción, reserva, disponibilidad y descuento |
| CRM | ✅ | cliente, email y consentimiento |
| Pedidos | ✅ | cálculo neto + IVA demo 19 %, reserva transaccional en API |
| Pago | 🟡 | aprobación mock; no mueve dinero |
| Documento tributario | 🟡 | boleta mock única por pedido; no contacta al SII |
| Eventos | ✅ | registro cronológico; contrato v1 con tenant, actor, correlación y causación en servidor |
| Agentes | 🟡 | cinco perfiles, fallback seguro, LLM opcional |
| RBAC | 🟡 | roles reales; identidad demostrada por encabezado o selector |
| Restablecimiento | ✅ | estado inicial local y limpieza transaccional del servidor |
| Modo de presentación conceptual | ✅ | seis pestañas guiadas, una tarea visible por vez, advertencias mock y capturas automatizadas |

## Superficies

| Superficie | Estado | Verificación |
|---|---:|---|
| Navegador / localhost | ✅ | `pnpm test:web`: seis pestañas, recorrido completo, mocks, eventos y rechazo por rol |
| PWA | ✅ | manifest, service worker y modo standalone |
| Windows | ✅ | Electron, sandbox y workflow que produce EXE portable |
| Android | ✅ | Capacitor y workflow que produce APK debug |
| Backend Docker | ✅ | API modular Fastify, PostgreSQL, Problem Details y recorrido comercial transaccional |
| GitHub Pages | ✅ | landing autocontenida, capturas verificadas, demo local ejecutable y workflow dedicado |

Para la reunión, la fuente canónica es [REUNION_FARMACIA_2026-09-10.md](REUNION_FARMACIA_2026-09-10.md). El modo local es principal; Docker demuestra la instancia de referencia y funciona como validación o respaldo opcional.

## Producción

| Capacidad | Estado |
|---|---:|
| Pago Webpay/Mercado Pago | 🔵 |
| Emisión DTE certificada | 🔵 |
| OIDC/passkeys/MFA | ⚪ |
| Aislamiento multi-tenant/RLS | ⚪ |
| Firma de EXE/APK | ⚪ |
| Backups y restauración | ⚪ |
| Métricas, trazas y alertas | ⚪ |
| Procesamiento de outbox | ⚪ |

## Gates antes de cambiar un estado

Una fila solo pasa a ✅ cuando existe implementación, prueba reproducible y documentación de límites. Compilar sin ejecutar no basta para afirmar que una superficie es operativa.
