# Verificación del proyecto

## Herramientas locales

PHP disponible mediante localmyWP; Node.js para sintaxis y pruebas del editor; WP-CLI para integración con WordPress. Usar rutas de la instalación local, sin versionar secretos ni ejecutables.

## Comandos

1. node --check assets/builder.js
2. php -l includes/class-mvl-plugin.php
3. php wp-cli.phar --path=<wordpress> --skip-plugins=elementor eval-file tests/responsive.php
4. Definir MVL_PRUEBA_JSON con una ruta temporal al ejecutar el paso anterior y ejecutar node tests/responsive.cjs <archivo-json>.
5. git diff --check

## Cobertura actual

Pruebas de integración: sanitización de cuatro dispositivos, Grid/Flex, estilos de Laptop, orden de media queries, compatibilidad de ajustes planos/antiguos y guardado/recuperación en una página temporal. La página temporal se elimina al terminar; no se usa la portada como fixture mutable.

Pruebas JavaScript: herencia y restablecer; comparación literal del CSS del editor con el generado por PHP para el mismo árbol saneado.

Verificación manual de esta conversación: portada y medios, los cinco tipos, inspector y pestañas, acceso WordPress con página de control, guardado conservando contenido, Laptop y panel Estructura alternable en modo normal y Ancho completo. No implica auditoría exhaustiva de todos los navegadores ni verificación de cada futura función.

## Verificación futura registrada

SPEC-003 debe cubrir movimiento entre padres, destinos inválidos/ciclos, límites, IDs de clones, teclado y persistencia. SPEC-002 define las tareas de planificación y ejemplos adicionales. Las pruebas nuevas se añaden junto a cada implementación, no por estar en el backlog.

## Documentación

Comprobar metadatos, IDs únicos, estados iguales en los registros, casillas AC/T y enlaces locales resolubles. Excluir los placeholders de 000-TEMPLATE.md y del kit suministrado al comprobar enlaces reales del proyecto.
