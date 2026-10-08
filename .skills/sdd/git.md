# Git: commits, push y despliegue

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md). **Léelo solo al hacer commit, push o desplegar.**

La configuración de Git de este proyecto está en **`.sdd/git.md`**: identidad, remotes, cuándo se sube a cada uno y cómo se escriben los commits. Léela antes de operar. Si no existe, haz el paso «Git» de [`onboarding.md`](onboarding.md).

## Reglas que valen siempre

- **Identidad del proyecto**: commitea con el `user.name` y el `user.email` de `.sdd/git.md`. Si `git config --local user.name` / `user.email` no coinciden, configúralos con `git config --local`. **Nunca** toques la configuración global (`--global`).
- **`git status` antes de cada commit**, y revisa el diff de lo que vas a añadir.
- **Nada de `git add .`** ni `git add -A` a ciegas: añade los archivos de la tarea por su nombre. (Excepción: el primer commit de un repositorio nuevo con el `.gitignore` ya creado.)
- **Busca secretos en el diff** antes de commitear (claves, contraseñas, tokens, `.env`). Si hay uno, para y sigue [`seguridad.md`](seguridad.md).
- Nunca te saltes los hooks (`--no-verify`) ni la firma de commits.
- Mensajes con el formato e idioma de `.sdd/git.md`. Si un commit cierra trabajo de una spec o un fix, cita su ID (`SPEC-012`, `FIX-003`).
- Si hay conflictos, muéstralos y pregunta cómo resolverlos. No los resuelvas descartando cambios ajenos.

## Cuándo subir a cada remote

Lo dice la tabla `## Remotes` de `.sdd/git.md`. Si no dice nada:

| Remote | Por defecto |
|---|---|
| `origin` | Solo cuando la persona lo pida o lo indique `.sdd/git.md`. |
| `dev` (desarrollo, staging) | Cuando la persona lo pida. |
| `pro` (producción) | **Solo con autorización expresa de la persona en ese momento**, para ese push concreto. Una autorización anterior no vale para el siguiente. |

Y siempre:

- Antes de subir a `pro`, di qué se va a subir (rama, commits) y espera un «sí» explícito.
- **Nunca** `git push --force` (ni `--force-with-lease`) a `pro` ni a la rama principal compartida. En otras ramas, solo si la persona lo pide.
- Si el repositorio no tiene el remote configurado, avísalo antes de intentar subir.

## Mantener `.sdd/git.md` al día

Si la persona cambia algo (un email, un remote, una rama, cuándo se sube a cada sitio), actualiza `.sdd/git.md` en el momento y avisa: «📝 Actualicé `.sdd/git.md`: qué ha cambiado». Las URL de los remotes van **sin credenciales** (nada de `https://usuario:token@…`).
