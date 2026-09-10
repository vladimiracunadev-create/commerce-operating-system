# Contribuir

1. Crea una rama desde `main`.
2. Mantén separado el contrato comercial de la tecnología de presentación.
3. Ejecuta `corepack pnpm check`.
4. Si cambias el recorrido comercial, actualiza primero la guía canónica `docs/REUNION_FARMACIA_2026-09-10.md` y después reconcilia `README.md`, `docs/DEMO.md`, `docs/QUICKSTART.md`, `docs/STATUS.md` y las pruebas.
5. No marques una superficie como operativa hasta construir su artefacto y completar el mismo flujo funcional.

Para cambios en backend o Compose, valida `docker compose config --quiet`, levanta el stack y ejecuta `node scripts/smoke-api.mjs`. Docker prueba la instancia de referencia; la reunión comercial mantiene la demo local como recorrido principal.

Los conectores reales de pagos, tributación o publicación requieren revisión de seguridad y aprobación explícita del propietario.
