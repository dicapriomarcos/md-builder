# Movimiento

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante | Valor actual | Uso |
|---|---|---|
| Respuesta de botón | .15 s | Fondo, borde y sombra |
| Ancho del lienzo | .2 s | Cambio de dispositivo |
| Movimiento reducido | Transiciones y animaciones desactivadas | prefers-reduced-motion |

## Reglas

No depender de animaciones para comunicar selección o destino. La futura señalización de arrastre se define en DES-002; no está implementada.

## En el código

assets/admin-theme.css y assets/builder.css.

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
