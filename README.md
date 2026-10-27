# 🎯 Campo de Tiro Interactivo con GSAP

Un simulador interactivo de galería de tiro estilo feria arcade / vintage desarrollado con **HTML5**, **CSS3**, **JavaScript moderno** y animaciones avanzadas con **GSAP (GreenSock Animation Platform)**.

---

## ✨ Características Principales

1. **Línea de Blancos Dinámica y Físicas con GSAP**:
   - Hilera de círculos / dianas concéntricas colgadas de un riel de acero con bisagras mecánicas.
   - **Animación Idle (Oscilación pendular)**: Cada blanco se mece suavemente con funciones `sine.inOut` y desfases independientes con GSAP.
   - **Impacto 3D de Derribo**: Al acertar un tiro, el blanco rota hacia atrás en el eje X (`rotateX: -115deg`) con efecto de inercia y amortiguación de resorte.
   - **Reaparición Elástica (Respawn)**: Tras caer derribado, el blanco regresa elásticamente a su posición colgada mediante `elastic.out`.
   - **Modo Cinta en Movimiento**: Alterna entre oscilación estática y desplazamiento continuo de la hilera a lo largo del riel.

2. **Detección Concéntrica de Impacto**:
   - **Anillo Exterior (Blanco)**: 25 puntos.
   - **Anillo Medio (Rojo)**: 50 puntos.
   - **Anillo Interior**: 75 puntos.
   - **Centro / Diana Dorada**: 100 puntos ("¡DIANA!").
   - **Blancos Especiales**:
     - ⭐ **Diana Dorada (Bonus)**: Multiplica los puntos y otorga hasta 300 pts.
     - ☠ **Diana Trampa (Calavera)**: Resta 100 pts, reinicia la racha y produce un destello de advertencia.

3. **Sistema de Partículas y Feedback Visual (GSAP)**:
   - Chispas incandescentes que vuelan con gravedad simulada en cada impacto.
   - Onda expansiva circular que se disipa rápidamente.
   - Texto flotante de puntuación animado con efecto `back.out`.
   - Agujeros de bala realistas en el fondo de madera cuando se falla un disparo.
   - Retroceso de pantalla (*Screen Shake*) y retroceso de la mira (*Crosshair recoil*).

4. **Motor de Sonido Procedural (Web Audio API)**:
   - Sin necesidad de cargar archivos de audio externos (cero errores 404 / CORS).
   - Síntesis de sonido de disparo con sub-graves y ruido blanco filtrado.
   - Tintineo metálico ("ding/clang") al golpear los blancos de acero.
   - Sonido de rebote (*ricochet*) en fallos.
   - Sonido mecánico de recarga y gatillo en seco cuando no hay munición.

5. **Mecánicas de Juego Arcade**:
   - Tambor de 6 proyectiles con aviso de recarga.
   - Recarga presionando la tecla <kbd>R</kbd>, haciendo clic en el botón de recarga o directamente sobre las balas.
   - Contador de racha/combo (*Streak*) que se enciende en llamas a partir de x3.
   - Cálculo en tiempo real del porcentaje de precisión.

---

## 🚀 Cómo Ejecutarlo

Puedes abrirlo directamente de dos maneras:

### Opción 1: Directamente en tu navegador
Haz doble clic sobre el archivo `index.html` en tu explorador de archivos o ábrelo con tu navegador preferido (Chrome, Edge, Firefox, Brave, etc.).

### Opción 2: Servidor local (Opcional)
Si dispones de Python o Node.js:
```bash
# Con Python
python -m http.server 8080

# Con npx (Node)
npx serve .
```
Luego abre `http://localhost:8080` en tu navegador.

---

## 🎮 Controles

| Acción | Control |
|---|---|
| **Apuntar** | Mover el cursor del ratón |
| **Disparar** | Clic izquierdo del ratón |
| **Recargar** | Tecla <kbd>R</kbd> o clic en las balas / "clic aquí" |
| **Alternar modo** | Botón "🎯 Línea: Oscilante / En Movimiento" |
| **Silenciar / Activar sonido** | Botón "🔊 Sonido" |
| **Reiniciar partida** | Botón "🔄 Reiniciar" |

---

## 📁 Estructura del Proyecto

```text
gsappueba/
├── index.html            # Estructura del escenario, galería de tiro y HUD
├── css/
│   └── style.css         # Estilos visuales de caseta de feria, mira, dianas y efectos
├── js/
│   ├── audio.js          # Síntesis procedural de audio con Web Audio API
│   ├── particles.js      # Partículas de impacto, chispas y puntuación flotante con GSAP
│   └── game.js           # Lógica del juego, detección de impacto y animaciones GSAP
└── README.md             # Documentación del proyecto
```
