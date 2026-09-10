# Changelog

Todos los cambios relevantes de Commerce Operating System se documentan aquí.

## No publicado — documentación posterior a 0.3.0

### Cambiado

- La API Fastify pasa de un archivo monolítico a capas de transporte, aplicación, dominio, puertos e infraestructura PostgreSQL.
- Los estados de pedido se centralizan en una máquina explícita y los errores HTTP adoptan Problem Details.
- Los eventos de servidor quedan versionados y conservan tenant, actor, correlación y causación.
- `@fastify/static` se actualiza a `10.1.2`, eliminando la vulnerabilidad alta aplicable.
- La suite determinista crece de 11 a 17 pruebas.
- La guía de reunión de la farmacia se declara como referencia canónica para el recorrido local de 3 a 5 minutos.
- Docker se documenta como validación técnica previa y respaldo opcional, no como requisito de la presentación comercial.
- Se añade una landing pública autocontenida con demo web, capturas, límites, guía canónica y descargas de `v0.3.0` mediante GitHub Pages.
- La presentación pública adopta una jerarquía comercial más clara, una ruta de reunión visible, estados de madurez separados y evidencia técnica verificable.

Esta sección no modifica el contenido histórico ni el tag de `0.3.0`.

## 0.3.0 — 2026-09-09

### Añadido

- Navegación guiada mediante seis pestañas accesibles: Catálogo, Inventario, Cliente, Pedido, Pago simulado y Trazabilidad.
- Texto orientado al cliente en cada paso: qué demuestra, qué no significa y qué queda pendiente para Fase 1.
- Verificación de que solo una tarea principal permanece visible y que el recorrido admite teclado.

### Cambiado

- Interfaz de presentación simplificada para reducir carga visual y mantener capacidades técnicas dentro de secciones secundarias.
- Smoke test actualizado para operar las seis pestañas en Chromium/Electron y regenerar las capturas de la reunión.

### Seguridad

- Se conservan sin cambios los adaptadores mock, permisos por rol y confirmación de restablecimiento.
- Webpay, SII, ERP, multisucursal y procesos farmacéuticos continúan fuera del alcance implementado.

## 0.2.0 — 2026-09-09

### Añadido

- Modo visible **Demo conceptual** con recorrido principal de seis pasos.
- Advertencias inequívocas para pago y documento tributario simulados.
- Preflight reproducible mediante `pnpm demo:check`.
- Smoke test de interfaz con Chromium/Electron y capturas verificables.
- Guía específica de apoyo para la reunión del 10 de septiembre de 2026.

### Cambiado

- Agentes movidos fuera del recorrido principal y mantenidos como función secundaria.
- Datos iniciales de formulario reemplazados por identidades inequívocamente ficticias.
- Caché PWA actualizada para incluir los estilos de presentación.

### Seguridad

- Webpay, SII, ERP, multisucursal y preparados magistrales se mantienen explícitamente pendientes.
- Ninguna integración, credencial, secreto o escritura externa fue incorporada.

## 0.1.0 — 2026-08-31

### Añadido

- Demo local persistente con datos iniciales y seis pasos operativos.
- Aplicación Windows mediante Electron con aislamiento de contexto.
- Proyecto Android mediante Capacitor.
- Motor local probado para catálogo, stock, CRM, pedidos, pagos, boleta y agentes.
- Modo API con PostgreSQL y servicio de agentes FastAPI.
- Endpoint de disponibilidad de base de datos y restablecimiento del demo.
- CI multiplataforma y workflow de release para EXE portable y APK debug.
- Documentación consolidada de producto, plataformas e instancias tecnológicas.

### Seguridad

- Acciones externas simuladas y sujetas a aprobación humana.
- Validación básica de entradas y una boleta demo máxima por pedido.
- Electron con sandbox, aislamiento de contexto y Node deshabilitado en la interfaz.
