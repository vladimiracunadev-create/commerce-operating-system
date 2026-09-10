# Guion de demo

## DEMO PARA REUNIÓN FARMACIA — 3 A 5 MINUTOS

La fuente canónica para esta reunión es [REUNION_FARMACIA_2026-09-10.md](REUNION_FARMACIA_2026-09-10.md). Esta sección conserva un resumen operativo; ante cualquier diferencia prevalece la guía de reunión. No representa el sistema definitivo del cliente.

1. Pulsa **Restablecer demo** y confirma.
2. Recorre las pestañas de izquierda a derecha; solo una tarea principal permanece visible.
3. En **Catálogo**, guarda el producto ficticio.
4. En **Inventario**, recibe sus unidades.
5. En **Cliente**, registra **Cliente Demostración**.
6. En **Pedido**, crea una unidad y explica la reserva.
7. En **Pago simulado**, aprueba el mock y señala **PAGO SIMULADO — No mueve dinero ni utiliza Webpay real**.
8. Si aporta a la conversación, emite el documento mock y señala **DOCUMENTO TRIBUTARIO SIMULADO — No emite documentos ante el SII**.
9. En **Trazabilidad**, muestra el pedido pagado y la secuencia de eventos.

Cada pestaña contiene texto para explicar al cliente qué demuestra y qué no significa o queda pendiente de Fase 1. No mostrar más salvo pregunta directa. Las opciones técnicas y los agentes están colapsados; los agentes siempre requieren aprobación humana.

Usa **Demo local** como recorrido principal. Docker queda fuera del guion de 3 a 5 minutos y se reserva para validación previa o respaldo técnico opcional.

## Guion genérico de demo operativa

Duración esperada: 5 a 8 minutos. Sirve igual en navegador, Windows y Android.

## Preparación

1. Abre la aplicación.
2. Selecciona **Demo local**.
3. Mantén el perfil **Administrador**.
4. Pulsa **Restablecer demo** para comenzar desde el estado conocido.

El estado inicial incluye un producto, 12 unidades y un cliente. Esto permite mostrar un recorrido corto o crear registros nuevos.

## Recorrido completo

1. **Catálogo:** crea `DEMO-002 / Pack Inicio / 15990`.
2. **Inventario:** elige `DEMO-002` y recibe 10 unidades.
3. **CRM:** registra a Cliente Demostración y decide si autoriza comunicaciones.
4. **Ventas:** elige cliente y producto, crea un pedido por una unidad. Comprueba que aparece como `Pago pendiente`.
5. **Cobro:** aprueba el pago mock. Comprueba que el estado cambia a `Pagado` y el stock disminuye.
6. **Tributación:** emite la boleta mock. Un segundo intento debe ser rechazado.
7. **Agente:** solicita una propuesta de marketing. La respuesta debe exigir aprobación y declarar que no ejecutó escrituras externas.
8. **Trazabilidad:** revisa los eventos en orden inverso.

## Demostración de roles

- Cambia a **Bodega**: puede recibir stock, pero no crear clientes.
- Cambia a **Ventas**: puede registrar clientes, pedir y cobrar.
- Cambia a **Contador**: puede emitir la boleta de un pedido pagado.
- Cambia a **Auditor**: puede leer, pero las escrituras son rechazadas.

## Resultado esperado

El recorrido prueba cinco invariantes:

- no hay pedido sin cliente, producto y stock disponible;
- crear un pedido reserva inventario;
- pagar descuenta cantidad y libera reserva;
- una boleta demo exige pago previo y se emite una sola vez;
- una propuesta de agente nunca equivale a una acción externa.

## Lo que no demuestra

No prueba pagos reales, emisión SII, identidad de usuario, concurrencia de producción, firma de binarios ni operación multi-tenant. Esas capacidades no deben inferirse de la interfaz.
