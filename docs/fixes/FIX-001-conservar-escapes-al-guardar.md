# FIX-001 · Conservar escapes al guardar

| Campo | Valor |
|---|---|
| Estado | `verified` |
| Autor | Codex |
| Propietario | Marcos Di Caprio |
| Creada | 2026-10-08 |
| Actualizada | 2026-10-08 |
| Gravedad | Alta |
| Relacionadas | SPEC-001, SPEC-004, SPEC-005, ADR-001 |

## 1. Síntoma

Al guardar un layout serializado con acentos, comillas o HTML, los escapes del JSON podían cambiar y afectar a la recuperación del árbol. Reproducción: guardar contenido con estos caracteres y volver a leer el documento.

## 2. Causa raíz

wp_update_post elimina barras al procesar post_content; pasar JSON sin compensarlo altera escapes de la serialización. Método save_layout_route() de includes/class-mvl-plugin.php.

## 3. Solución

Aplicar wp_slash() al array enviado a wp_update_post(), conservando la serialización original.

## 4. Prevención

Comparar árbol saneado antes y después de guardar. tests/responsive.php mantiene una prueba de integración de guardado/recuperación con caracteres acentuados. En la sesión original se comprobó además el árbol completo de la portada y una actualización real desde WordPress.

## 5. Criterios de verificación

- [x] AC-01 · Guardar y recuperar el documento completo conserva sus datos tras la corrección.
- [x] AC-02 · La prueba de integración de guardado/recuperación pasa en WP-CLI.

## 6. Plan de tareas

- [x] T-01 · Localizar la alteración de escapes al persistir post_content.
- [x] T-02 · Aplicar wp_slash al guardado.
- [x] T-03 · Verificar el layout completo y mantener la prueba de integración.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `verified` | Registro retrospectivo de la corrección y pruebas realizadas; no se marca released sin revisión del usuario. |
