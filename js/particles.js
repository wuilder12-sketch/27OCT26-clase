// particles.js - Sistema de partículas y efectos visuales impulsado por GSAP

class FXSystem {
    constructor(container) {
        this.container = container;
    }

    // Chispas metálicas y resplandor cuando una bala impacta el blanco
    createImpactSparks(x, y, isBullseye = false) {
        const sparkCount = isBullseye ? 22 : 12;
        const colors = isBullseye 
            ? ['#ffe066', '#ffd700', '#ffffff', '#ff9900'] 
            : ['#ffaa33', '#ff5500', '#ffffff', '#ffdd55'];

        for (let i = 0; i < sparkCount; i++) {
            const spark = document.createElement('div');
            spark.className = 'fx-spark';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * (isBullseye ? 6 : 4) + 2;
            
            spark.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border-radius: 50%;
                box-shadow: 0 0 8px ${color}, 0 0 14px ${color};
                pointer-events: none;
                z-index: 100;
            `;

            this.container.appendChild(spark);

            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * (isBullseye ? 90 : 55) + 20;
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance + (Math.random() * 25); // ligera gravedad

            gsap.to(spark, {
                x: targetX,
                y: targetY,
                scale: 0,
                opacity: 0,
                duration: gsap.utils.random(0.4, 0.75),
                ease: 'power3.out',
                onComplete: () => spark.remove()
            });
        }

        // Anillo de onda expansiva
        const shockwave = document.createElement('div');
        shockwave.className = 'fx-shockwave';
        shockwave.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 10px;
            height: 10px;
            border: 2px solid ${isBullseye ? '#ffd700' : '#ffffff'};
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 99;
        `;
        this.container.appendChild(shockwave);

        gsap.to(shockwave, {
            width: isBullseye ? 90 : 60,
            height: isBullseye ? 90 : 60,
            opacity: 0,
            duration: 0.35,
            ease: 'power2.out',
            onComplete: () => shockwave.remove()
        });
    }

    // Texto flotante de puntuación
    showFloatingScore(x, y, text, isBullseye = false) {
        const floatEl = document.createElement('div');
        floatEl.className = 'fx-float-score ' + (isBullseye ? 'bullseye' : '');
        floatEl.textContent = text;
        
        floatEl.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            color: ${isBullseye ? '#ffd700' : '#ffffff'};
            font-family: 'Impact', 'Segoe UI Black', sans-serif;
            font-size: ${isBullseye ? '26px' : '20px'};
            font-weight: bold;
            letter-spacing: 1px;
            text-shadow: 0 0 10px ${isBullseye ? 'rgba(255,215,0,0.8)' : 'rgba(0,0,0,0.9)'}, 2px 2px 0 #000;
            pointer-events: none;
            z-index: 105;
            user-select: none;
            white-space: nowrap;
        `;

        this.container.appendChild(floatEl);

        gsap.fromTo(floatEl, 
            {
                scale: 0.4,
                y: 0,
                opacity: 0
            },
            {
                scale: isBullseye ? 1.3 : 1.1,
                opacity: 1,
                y: -50,
                duration: 0.8,
                ease: 'back.out(2)',
                onComplete: () => {
                    gsap.to(floatEl, {
                        opacity: 0,
                        y: -75,
                        duration: 0.3,
                        ease: 'power1.in',
                        onComplete: () => floatEl.remove()
                    });
                }
            }
        );
    }

    // Agujero de bala en el fondo (cuando se falla el tiro)
    createBulletHole(x, y) {
        const hole = document.createElement('div');
        hole.className = 'fx-bullet-hole';
        hole.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 12px;
            height: 12px;
            background: radial-gradient(circle, #080808 30%, #2b2b2b 70%, transparent 100%);
            border: 1px solid rgba(0, 0, 0, 0.7);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0.6);
            pointer-events: none;
            z-index: 5;
            box-shadow: inset 0 0 4px #000, 0 0 3px rgba(255,200,100,0.5);
        `;
        this.container.appendChild(hole);

        gsap.to(hole, {
            scale: 1,
            duration: 0.15,
            ease: 'back.out(2)'
        });

        // Desvanecimiento suave después de unos segundos para no sobrecargar el DOM
        gsap.to(hole, {
            opacity: 0,
            delay: 4,
            duration: 1.5,
            onComplete: () => hole.remove()
        });
    }

    // Destello de boca de cañón (Muzzle Flash)
    createMuzzleFlash(x, y) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 40px;
            height: 40px;
            background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,200,50,0.8) 40%, transparent 70%);
            transform: translate(-50%, -50%) scale(0.5);
            pointer-events: none;
            z-index: 120;
            border-radius: 50%;
        `;
        this.container.appendChild(flash);

        gsap.to(flash, {
            scale: 1.6,
            opacity: 0,
            duration: 0.08,
            ease: 'power2.out',
            onComplete: () => flash.remove()
        });
    }
}
