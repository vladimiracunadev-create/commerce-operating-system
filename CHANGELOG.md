# Changelog

Todos los cambios relevantes de Commerce Operating System se documentan aquí.

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
