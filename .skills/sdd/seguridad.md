# Seguridad

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

## Nada de secretos en los `.md`

Los documentos del proyecto (specs, decisiones, ficha, estado, avisos de revisión, `AGENTS.md`…) se suben a git, los leen varias IAs y a veces se publican sin querer. **Nunca** escribas en ningún `.md`:

- contraseñas, claves de API, tokens, *secrets* de OAuth, claves privadas o certificados;
- cadenas de conexión con usuario y contraseña (`mysql://usuario:clave@host`) ni URL de git con credenciales;
- los valores de `.env`, `wp-config.php` o de cualquier archivo de configuración con secretos;
- datos personales de clientes o usuarios (emails, teléfonos, DNI…) que no hagan falta.

En su lugar, escribe **el nombre de la variable y dónde vive**: «La clave de Stripe está en `STRIPE_SECRET_KEY` (`.env`, no se versiona)». Para ejemplos usa marcadores evidentes: `<tu-clave>`, `${DB_PASSWORD}`, `********`.

MD SDD Hub se niega a guardar un `.md` con algo que parezca un secreto y avisa de los que ya lo tienen.

## Si encuentras uno

1. Quítalo del `.md` en el momento y sustitúyelo por el nombre de la variable.
2. **Avisa a la persona**: el secreto se ha expuesto y hay que **rotarlo** (crear uno nuevo y revocar el viejo). Quitarlo del archivo no basta si ya estaba en un commit: sigue en el historial de git.
3. No lo repitas en el chat, en el historial del documento ni en el aviso de revisión.

## Archivos con secretos

- `.env`, `.env.*` (salvo `.env.example` sin valores reales), claves (`*.pem`, `*.key`) y volcados de base de datos van en `.gitignore`. Si faltan, propón añadirlos.
- Nunca hagas commit de esos archivos, aunque la persona lo pida sin darse cuenta: avísale primero.
- Antes de cada commit, revisa el diff buscando secretos (ver [`git.md`](git.md)).

## Carpetas expuestas en la web

Si el proyecto vive en una carpeta servida por Apache (XAMPP, hosting compartido), los `.md` se pueden leer desde el navegador. MD SDD Hub pone un `.htaccess` que lo bloquea en `.sdd/`, `.skills/`, `.claude/` y `docs/`. Si creas otra carpeta con documentos dentro de la parte pública, avisa a la persona para protegerla también. En Nginx los `.htaccess` no sirven: hay que bloquear las rutas en la configuración del servidor.
