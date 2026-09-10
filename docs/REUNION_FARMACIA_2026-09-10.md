# Reunión farmacia — demo conceptual

Fecha: 10 de septiembre de 2026, 12:00

Duración recomendada de la demo: 3 a 5 minutos.

## A. Qué es la demo

Commerce Operating System es un laboratorio tecnológico propio utilizado para demostrar conceptos de operación comercial.

No es el sistema definitivo de la farmacia. No define la arquitectura final y no significa que los requerimientos del cliente ya estén levantados.

## B. Qué demuestra

- catálogo;
- inventario;
- CRM básico;
- pedidos;
- reserva y descuento de stock;
- pago simulado;
- documento tributario simulado;
- roles;
- trazabilidad;
- ejecución local.

## C. Qué no demuestra

- Webpay real;
- SII real;
- ERP de la farmacia;
- preparados magistrales;
- recetas;
- multisucursal real;
- autenticación productiva;
- infraestructura definitiva;
- cumplimiento sanitario validado;
- solución final del cliente.

## D. Frase de apertura

> “Quiero mostrarles algo muy breve sólo como referencia. Este no es el sistema de la farmacia ni una definición de cómo deberá quedar. Es un laboratorio tecnológico propio que nos permite visualizar algunos conceptos de comercio, como catálogo, inventario, clientes, pedidos y trazabilidad. La Fase 1 es precisamente la que permitirá transformar estos conceptos en los procesos reales de sus tres sucursales, su ERP y su operación.”

## Recorrido de 3 a 5 minutos

1. Ejecutar `corepack pnpm demo:check`.
2. Abrir `http://127.0.0.1:4173`.
3. Seleccionar **Demo local** y perfil **Administrador**.
4. Pulsar **Restablecer demo** y confirmar.
5. Mostrar catálogo e inventario.
6. Registrar **Cliente Demostración**.
7. Crear un pedido y explicar la reserva de stock.
8. Aprobar el pago mock, leyendo la advertencia **PAGO SIMULADO**.
9. Mostrar la disminución de stock.
10. Emitir la boleta mock solo si aporta a la conversación, leyendo la advertencia **DOCUMENTO TRIBUTARIO SIMULADO**.
11. Cerrar en trazabilidad.

No mostrar agentes, API, arquitectura, roles ni otras superficies salvo pregunta directa.

## Mensajes que deben quedar explícitos

- **PAGO SIMULADO:** No mueve dinero ni utiliza Webpay real.
- **DOCUMENTO TRIBUTARIO SIMULADO:** No emite documentos ante el SII.
- **ERP:** pendiente de levantamiento e integración durante Fase 1.
- **Preparados magistrales:** pendiente de levantamiento funcional con el cliente y químico farmacéutico.
- **MULTISUCURSAL:** pendiente de levantamiento con el cliente.

Todos los datos de la demo son ficticios. No ingresar RUT, pacientes, recetas, correos, teléfonos, credenciales ni datos médicos reales.

## Preguntas para devolver al cliente

- ¿Qué ERP utiliza hoy cada sucursal y quién administra su integración?
- ¿Cómo se actualizan actualmente catálogo, precios y stock?
- ¿Qué diferencias operacionales existen entre las tres sucursales?
- ¿Qué roles intervienen desde la venta hasta la entrega?
- ¿Qué procesos requieren validación del químico farmacéutico?
- ¿Qué información y responsables estarán disponibles durante la Fase 1?

## PLAN B

Si el recorrido nuevo presenta un problema, recargar la página, elegir **Demo local** y pulsar **Restablecer demo**. Si el problema continúa, usar el flujo estable descrito en la sección genérica de [DEMO.md](DEMO.md) y apoyar la conversación con las capturas del README. La reunión debe continuar centrada en el levantamiento, no en reparar la aplicación.

## E. Frase de cierre

> “Lo importante de esta demo no es copiar este sistema. Es visualizar conceptos. La Fase 1 permitirá determinar cuáles aplican realmente a la farmacia, cuáles deben cambiar y cuáles no corresponden.”

## Preflight del expositor

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm demo:check
corepack pnpm demo:local
```

- equipo conectado a energía;
- navegador abierto en `http://127.0.0.1:4173`;
- modo local seleccionado;
- datos restablecidos;
- zoom y resolución legibles;
- capturas disponibles sin conexión;
- notificaciones del sistema silenciadas.
