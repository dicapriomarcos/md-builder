# Durante la implementación

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

- Antes de empezar, comprueba que la spec ya la ha aprobado la persona (está en `in-progress`; o el fix en `investigating` / `in-progress`). Al terminar, pásala a `awaiting-review` siguiendo [`estados.md`](estados.md).
- Marca cada `T-NN` como `[x]` en cuanto la termines, no al final.
- Marca un `AC-NN` solo cuando lo hayas comprobado (test, revisión manual descrita o captura).
- Si descubres trabajo nuevo, añádelo como `T-NN` antes de hacerlo.
- Si tomas una decisión de arquitectura o de diseño por el camino, regístrala como ADR o DES en `proposed` y menciónala a la persona. Si la persona decide algo visual o de un componente, escríbelo en el sistema de diseño ([`sistema-diseno.md`](sistema-diseno.md)).
- Al construir pantallas, usa los tokens y componentes del sistema de diseño en lugar de valores sueltos.
- Al terminar la sesión, deja en el Historial una fila con el avance si el estado no cambió (repite el estado actual).
