# DES-001 · Renovación visual del editor

| Campo | Valor |
|---|---|
| Estado | `proposed` |
| Autor | Codex |
| Propietario | Marcos Di Caprio |
| Creada | 2026-10-08 |
| Actualizada | 2026-10-08 |
| Relacionadas | SPEC-001 |

## 1. Contexto

El usuario pidió modernizar el plugin. La propuesta ya está implementada localmente y pendiente de valoración visual. Su autorización para renovar la interfaz no se interpreta como aceptación automática de cada token.

## 2. Decisión

Propuesta actual: paneles claros, barra superior oscura, acento turquesa, controles agrupados, cabecera con icono y nombre del bloque. Fuente de verdad de los valores: variables CSS de `assets/admin-theme.css`.

## 3. Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| Conservar la estética inicial | No responde a la renovación solicitada. |
| Incorporar una biblioteca visual nueva | Añade dependencias a un editor ligero. |

## 4. Consecuencias

El editor presenta una apariencia coherente. Los estilos administrativos están limitados a su ámbito y no alteran los estilos de la página pública.

## 5. Reglas para la interfaz

- Mantener la cabecera del inspector al cambiar sus pestañas.
- Mantener foco visible y nombres accesibles en el selector de dispositivos.
- Reutilizar los tokens administrativos existentes para los controles nuevos.
- Tras la confirmación del usuario, trasladar los valores aprobados a fundamentos del sistema de diseño.

## 6. Referencias

`assets/admin-theme.css`, `assets/builder.js`, `assets/post-editor.css` y `docs/design/sistema/index.md`.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `proposed` | Registro de la propuesta visual ya implementada localmente; pendiente de revisión del usuario. |
