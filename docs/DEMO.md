# Guion de demo

## DEMO PARA REUNIÓN FARMACIA — 3 A 5 MINUTOS

Esta sección es una variante de presentación; no sustituye el guion genérico ni representa el sistema definitivo del cliente.

1. Pulsa **Restablecer demo** y confirma.
2. Muestra el catálogo ficticio.
3. Muestra el stock disponible.
4. Registra **Cliente Demostración**.
5. Crea un pedido por una unidad.
6. Muestra el estado **Pago pendiente**.
7. Aprueba el pago mock y señala **PAGO SIMULADO — No mueve dinero ni utiliza Webpay real**.
8. Muestra la disminución de stock.
9. Si aporta a la conversación, emite el documento mock y señala **DOCUMENTO TRIBUTARIO SIMULADO — No emite documentos ante el SII**.
10. Cierra mostrando la trazabilidad.

No mostrar más salvo pregunta directa. Los agentes son una funcionalidad secundaria y siempre requieren aprobación humana.

Consulta [REUNION_FARMACIA_2026-09-10.md](REUNION_FARMACIA_2026-09-10.md) para las frases de apertura/cierre, límites y Plan B.

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
