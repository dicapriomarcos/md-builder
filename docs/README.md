# Documentación del Maquetador Visual Ligero

La configuración de MD SDD Hub vive en .sdd.json. Las reglas de los agentes están en AGENTS.md, CLAUDE.md y GEMINI.md. Esta documentación pertenece al plugin; no usa el SDD del plugin de cookies.

## Índice

- [Ficha del proyecto](../.sdd/proyecto.md), [estado](../.sdd/estado.md), [decisiones](../.sdd/decisiones.md) y [Git](../.sdd/git.md).
- [Especificaciones y tareas](specs/README.md).
- [Sistema de diseño](design/sistema/index.md) y [propuestas visuales](design/README.md).
- [Arquitectura](architecture/README.md).
- [Correcciones](fixes/README.md).
- [Contrato técnico](spec-ia-maquetador.md).
- [Verificación](verificacion.md).

## Cobertura de solicitudes

| Petición | Documento | Situación |
|---|---|---|
| Página Lorem Ipsum y portada | SPEC-004 | Implementado localmente, awaiting-review |
| Usar los bloques existentes desde el maquetador | SPEC-004 y decisiones | Regla conservada |
| Ocultar editor WordPress y mostrar botón | SPEC-005 | Implementado, awaiting-review |
| Nombre sobre las opciones y renovación visual | SPEC-006, DES-001 y sistema | Implementado, documentado |
| Añadir Laptop | SPEC-001 | done, cerrado por el usuario desde MD SDD Hub |
| Estructura en lugar de edición y alternable | SPEC-003 | Primera fase implementada |
| Propuesta visual del árbol | DES-002, SPEC-003 | Propuesta escrita; muestra visual pendiente |
| Arrastrar entre contenedores, copiar y duplicar | SPEC-003 | Pendiente de implementar |
| Botones de edición al seleccionar elementos | SPEC-003, DES-002 | Pendiente de implementar |
| Tareas técnicas y documentación IA | SPEC-002 | Backlog, requiere priorización |
| Completar SDD, diseño y arquitectura | Esta documentación | Configuración completada |
| Corregir escapes del guardado | FIX-001 | verified |

## Criterio de estados

Documentar una función no significa implementarla. Las implementaciones previas están pendientes de revisión final; las propuestas y ADR no se marcan accepted automáticamente. El cambio de esta sesión completa documentación/configuración SDD y no programa el backlog.
