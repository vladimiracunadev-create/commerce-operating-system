# Política de seguridad

## Alcance actual

Commerce OS `0.3.x` es una demo. No debe exponerse directamente a internet ni recibir información personal, tributaria o financiera real.

## Reporte responsable

Reporta vulnerabilidades mediante un aviso privado al propietario del repositorio. No abras un issue público con credenciales, datos personales, pasos de explotación destructivos o secretos.

## Garantías del demo

- pagos y documentos tributarios usan adaptadores mock;
- los agentes no ejecutan escrituras externas;
- `.env` y variantes locales quedan fuera de Git;
- Electron no expone Node a la interfaz;
- el rol enviado en `x-demo-role` demuestra autorización, pero no autentica identidad.

## Uso seguro durante la reunión

La guía canónica es [docs/REUNION_FARMACIA_2026-09-10.md](docs/REUNION_FARMACIA_2026-09-10.md). Para el recorrido comercial se recomienda **Demo local**, sin infraestructura ni datos reales. Docker es una validación o respaldo opcional: sus puertos no deben exponerse a internet y solo debe utilizarse en una red de confianza.

## Antes de producción

Se requieren OIDC/MFA, sesiones seguras, autorización multi-tenant, almacenamiento de secretos, rate limiting, validación exhaustiva, CSP por superficie, TLS, backups, observabilidad, revisión de dependencias, firma de binarios y pruebas de seguridad específicas de cada proveedor.
