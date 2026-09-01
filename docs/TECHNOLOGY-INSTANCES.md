# Instancias tecnológicas

## Principio

Commerce OS es un producto definido por comportamiento. Un framework es una instancia intercambiable siempre que conserve contratos, invariantes, eventos, permisos y trazabilidad.

## Instancia de referencia actual

| Capa | Tecnología | Estado |
|---|---|---:|
| Interfaz | HTML, CSS y JavaScript ESM | ✅ operativa |
| Motor demo | JavaScript sin dependencias | ✅ operativo |
| API | TypeScript + Fastify | ✅ operativa |
| Datos | PostgreSQL 16 | ✅ operativo |
| Agentes | Python + FastAPI | ✅ demo segura |
| Windows | Electron | ✅ operativo |
| Android | Capacitor | ✅ operativo |

## Instancias compatibles documentadas

| Familia | Opciones | Condición de equivalencia | Estado |
|---|---|---|---:|
| Frontend web | React, Vue, Svelte, Angular | mismo contrato y recorrido | 🔵 documentado |
| Cliente móvil | Flutter, React Native, Kotlin | mismas capacidades y eventos | 🔵 documentado |
| Cliente Windows | Tauri, .NET/WinUI, Flutter | aislamiento y persistencia equivalentes | 🔵 documentado |
| Backend Node | NestJS, Express | transacciones e invariantes equivalentes | 🔵 documentado |
| Backend Python | FastAPI, Django | contrato HTTP y outbox equivalentes | 🔵 documentado |
| Backend JVM | Spring Boot, Quarkus | contrato HTTP y transacciones equivalentes | 🔵 documentado |
| Backend .NET | ASP.NET Core | contrato HTTP y transacciones equivalentes | 🔵 documentado |
| Backend Go | chi, Gin, Fiber | contrato HTTP y transacciones equivalentes | 🔵 documentado |

`Documentado` no significa implementado. Evita convertir una posibilidad arquitectónica en una afirmación de producto.

## Contrato mínimo de una instancia

Toda nueva implementación debe conservar:

1. `Product`: SKU único por compañía y precio no negativo.
2. `Stock`: cantidad, reserva y disponibilidad separadas.
3. `Order`: cliente, ítems, subtotal, impuesto, total y estado.
4. `Payment`: transición única desde `pending_payment` a `paid`.
5. `TaxDocument`: pago previo y máximo uno por pedido en el demo.
6. `Event`: tipo, agregado, payload y fecha.
7. `AgentRun`: propuesta, aprobación humana y declaración de escrituras.

## Gate de portabilidad

Una instancia nueva se considera equivalente cuando:

- pasa los escenarios de [DEMO.md](DEMO.md);
- rechaza permisos y estados inválidos;
- mantiene los mismos eventos significativos;
- documenta persistencia, secretos y superficie de ataque;
- construye un artefacto reproducible en CI;
- declara explícitamente cualquier diferencia.

## Estrategia recomendada

No reescribir todo el sistema para “probar” un framework. Implementa primero un adaptador del contrato, ejecuta la suite de paridad y conserva una sola instancia de referencia por capa hasta que exista una necesidad medible de operación, equipo o rendimiento.
