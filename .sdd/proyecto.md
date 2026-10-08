# Ficha del proyecto

| Campo | Valor |
|---|---|
| Nombre | Maquetador Visual Ligero |
| Descripción | Plugin WordPress para maquetar con contenedores Flex/Grid y bloques de contenido desde su editor visual. |
| Stack | PHP 8.0+, WordPress 6.0+, JavaScript sin framework, CSS. |
| Despliegue | WordPress local de pruebas mediante localmyWP. Sin publicación autorizada. |
| Actualizada | 2026-10-08 |

## Onboarding

| Paso | Estado |
|---|---|
| Ficha | ✅ |
| Git | ✅ |
| Diseño | ✅ |
| Decisiones existentes | ✅ |

## Comandos

| Para qué | Comando |
|---|---|
| Sintaxis JavaScript | node --check assets/builder.js |
| Sintaxis PHP | php -l includes/class-mvl-plugin.php |
| Prueba responsive | php wp-cli.phar --path=<ruta-wordpress> eval-file tests/responsive.php |

## Estructura

- `assets/`: editor visual y estilos.
- `includes/class-mvl-plugin.php`: administración, REST, sanitización y renderizado.
- `docs/spec-ia-maquetador.md`: contrato técnico existente.
- `docs/specs/`: especificaciones y tareas SDD.
- `.sdd/`: ficha, decisiones y estado propios del plugin.

## Convenciones

- Aplicar el kit SDD local de `.skills/sdd/`; no mezclar tareas con el plugin de cookies.
- Usar exclusivamente los bloques y controles existentes para la página de pruebas.

## Notas

El remoto es https://github.com/dicapriomarcos/md-builder.git. Identidad y autorización de subida registradas en `.sdd/git.md`. El sistema de diseño documenta la implementación actual por petición del usuario; las propuestas futuras no se consideran implementadas ni aceptadas por documentarlas.
