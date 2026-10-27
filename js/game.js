// game.js - Lógica principal del juego y orquestación de animaciones GSAP

document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const gameContainer = document.getElementById('game-container');
    const shootingRange = document.getElementById('shooting-range');
    const targetLine = document.getElementById('target-line');
    const crosshair = document.getElementById('crosshair');
    const hudScore = document.getElementById('hud-score');
    const hudCombo = document.getElementById('hud-combo');
    const hudAccuracy = document.getElementById('hud-accuracy');
    const ammoRow = document.getElementById('ammo-row');
    const reloadAlert = document.getElementById('reload-overlay-alert');
    const btnManualReload = document.getElementById('btn-manual-reload');
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    const soundIcon = document.getElementById('sound-icon');
    const btnToggleMode = document.getElementById('btn-toggle-mode');
    const modeText = document.getElementById('mode-text');
    const btnReset = document.getElementById('btn-reset');

    // Instancia del sistema de efectos
    const fx = new FXSystem(gameContainer);

    // Estado del juego
    const MAX_AMMO = 6;
    const NUM_TARGETS = 7;
    let currentAmmo = MAX_AMMO;
    let isReloading = false;
    let score = 0;
    let combo = 0;
    let totalShots = 0;
    let hits = 0;
    let currentMode = 'swing'; // 'swing' o 'conveyor' (cinta móvil)
    let conveyorTween = null;
    let targets = [];

    // ==========================================
    // 1. INICIALIZACIÓN DE LA MUNICIÓN (HUD)
    // ==========================================
    function setupAmmoUI() {
        ammoRow.innerHTML = '';
        for (let i = 0; i < MAX_AMMO; i++) {
            const bullet = document.createElement('div');
            bullet.className = 'bullet-icon';
            bullet.id = `bullet-${i}`;
            ammoRow.appendChild(bullet);
        }
    }

    // ==========================================
    // 2. CREACIÓN DE LA LÍNEA DE CÍRCULOS (BLANCOS)
    // ==========================================
    function createTargetElement(index, type = 'normal') {
        const unit = document.createElement('div');
        unit.className = `target-unit ${type}`;
        unit.dataset.id = index;
        unit.dataset.type = type;
        unit.dataset.down = 'false';

        unit.innerHTML = `
            <div class="target-hinge"></div>
            <div class="target-rod"></div>
            <div class="target-disc">
                <div class="ring ring-outer" data-zone="outer" data-points="25">
                    <span class="zone-label" style="top: 8px;">25</span>
                    <div class="ring ring-mid" data-zone="mid" data-points="50">
                        <span class="zone-label" style="top: 6px;">50</span>
                        <div class="ring ring-inner" data-zone="inner" data-points="75">
                            <div class="ring ring-bullseye" data-zone="bullseye" data-points="100"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return unit;
    }

    function buildTargetLine() {
        targetLine.innerHTML = '';
        targets = [];

        for (let i = 0; i < NUM_TARGETS; i++) {
            // Probabilidad aleatoria inicial de diana dorada (bonus)
            let type = 'normal';
            if (i === 3) type = 'gold'; // Diana central dorada al iniciar
            
            const targetEl = createTargetElement(i, type);
            targetLine.appendChild(targetEl);
            targets.push(targetEl);
        }

        // Animación de entrada inicial con GSAP Stagger
        gsap.fromTo(targets, 
            {
                y: -120,
                opacity: 0,
                rotateX: 90
            },
            {
                y: 0,
                opacity: 1,
                rotateX: 0,
                duration: 0.9,
                stagger: 0.1,
                ease: 'back.out(1.8)',
                onComplete: () => {
                    initModeAnimations();
                }
            }
        );
    }

    // ==========================================
    // 3. ANIMACIONES DE REPOSO (IDLE GSAP)
    // ==========================================
    function initModeAnimations() {
        if (currentMode === 'swing') {
            // Detener cinta móvil si existía
            if (conveyorTween) {
                conveyorTween.kill();
                conveyorTween = null;
                gsap.to(targetLine, { x: 0, duration: 0.5, ease: 'power2.out' });
            }

            // Cada blanco oscila individualmente en su bisagra
            targets.forEach(target => {
                startTargetSwing(target);
            });
        } else if (currentMode === 'conveyor') {
            // Detener oscilaciones individuales y alinearlos
            targets.forEach(target => {
                if (target.swingTween) target.swingTween.kill();
                gsap.to(target, { rotation: 0, duration: 0.3 });
            });

            // Animación continua de la línea completa desplazándose a lo largo del riel
            startConveyorTrack();
        }
    }

    function startTargetSwing(target) {
        if (target.dataset.down === 'true') return;
        if (target.swingTween) target.swingTween.kill();

        target.swingTween = gsap.to(target, {
            rotation: gsap.utils.random(-5, 5),
            duration: gsap.utils.random(1.3, 2.0),
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
    }

    function startConveyorTrack() {
        if (conveyorTween) conveyorTween.kill();

        // Desplazamiento lateral de la hilera imitando una galería mecánica
        conveyorTween = gsap.to(targetLine, {
            x: 80,
            duration: 2.8,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
    }

    // ==========================================
    // 4. MIRA TELESCOPIAL Y EFECTOS DE RATÓN
    // ==========================================
    gsap.set(crosshair, { 
        xPercent: -50, 
        yPercent: -50, 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 2 
    });

    window.addEventListener('mousemove', (e) => {
        gsap.to(crosshair, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.02,
            ease: 'none'
        });
    });

    // ==========================================
    // 5. SISTEMA DE DISPARO
    // ==========================================
    gameContainer.addEventListener('mousedown', (e) => {
        // Ignorar clics sobre botones del HUD
        if (e.target.closest('.hud-header') || e.target.closest('.ammo-container') || e.target.closest('.legend-card')) {
            return;
        }

        e.preventDefault();
        shoot(e);
    });

    function shoot(e) {
        if (isReloading) return;

        // Comprobar munición
        if (currentAmmo <= 0) {
            window.soundController.playEmptyClick();
            showReloadPrompt();
            
            // Efecto de retroceso fallido
            gsap.timeline()
                .to(crosshair, { scale: 0.85, duration: 0.05 })
                .to(crosshair, { scale: 1, duration: 0.15 });
            return;
        }

        // Consumir 1 bala
        currentAmmo--;
        totalShots++;
        const spentBullet = document.getElementById(`bullet-${currentAmmo}`);
        if (spentBullet) {
            spentBullet.classList.add('spent');
            gsap.fromTo(spentBullet, { scale: 1.3 }, { scale: 0.85, duration: 0.2 });
        }

        // Audio del disparo
        window.soundController.playGunshot();

        // Destello de cañón
        fx.createMuzzleFlash(e.clientX, e.clientY);

        // Retroceso en la mira (Crosshair recoil)
        gsap.timeline()
            .to(crosshair, { scale: 0.7, duration: 0.04 })
            .to(crosshair, { scale: 1.15, duration: 0.08 })
            .to(crosshair, { scale: 1, duration: 0.15, ease: 'back.out(2)' });

        // Sacudida de pantalla (Screen Shake con GSAP)
        const shakeIntensity = 4;
        gsap.fromTo(gameContainer, 
            { 
                x: gsap.utils.random(-shakeIntensity, shakeIntensity), 
                y: gsap.utils.random(-shakeIntensity, shakeIntensity) 
            }, 
            { 
                x: 0, 
                y: 0, 
                duration: 0.12, 
                ease: 'power2.out' 
            }
        );

        // Si se acaba la munición, mostrar aviso
        if (currentAmmo === 0) {
            showReloadPrompt();
        }

        // DETECCIÓN DE IMPACTO
        // Revisar si el disparo dio en algún blanco (o alguno de sus anillos concéntricos)
        const targetUnit = e.target.closest('.target-unit');
        const hitRing = e.target.closest('.ring');

        if (targetUnit && targetUnit.dataset.down !== 'true') {
            handleTargetHit(targetUnit, hitRing, e.clientX, e.clientY);
        } else {
            // Disparo fallido (impacto en la madera o fuera de los blancos)
            handleMiss(e.clientX, e.clientY);
        }

        updateAccuracy();
    }

    // ==========================================
    // 6. GESTIÓN DEL IMPACTO EN UN BLANCO
    // ==========================================
    function handleTargetHit(targetUnit, ring, clickX, clickY) {
        targetUnit.dataset.down = 'true';
        hits++;

        // Detener animación de oscilación mientras está derribado
        if (targetUnit.swingTween) {
            targetUnit.swingTween.pause();
        }

        const isBullseye = ring ? ring.dataset.zone === 'bullseye' : false;
        const targetType = targetUnit.dataset.type;

        let points = ring ? (parseInt(ring.dataset.points, 10) || 25) : 25;
        let bonusText = '';

        // Bonificaciones o penalizaciones especiales
        if (targetType === 'gold') {
            points = isBullseye ? 300 : points * 2;
            bonusText = ' ¡BONUS!';
        } else if (targetType === 'skull') {
            points = -100;
            bonusText = ' ¡TRAMPA!';
            combo = 0;
            // Destello rojo de penalización
            gsap.fromTo(gameContainer, 
                { filter: 'sepia(1) hue-rotate(300deg) saturate(3)' }, 
                { filter: 'none', duration: 0.45, ease: 'power2.out' }
            );
        }

        // Racha de aciertos (Combo)
        if (targetType !== 'skull') {
            combo++;
            if (combo >= 3) {
                points = Math.round(points * (1 + (combo * 0.15)));
            }
        }

        // Actualizar Puntos con animación elástica de GSAP
        score = Math.max(0, score + points);
        hudScore.textContent = score;
        gsap.fromTo(hudScore, { scale: 1.45, color: '#ffffff' }, { scale: 1, color: '#ffcc00', duration: 0.35, ease: 'back.out(2)' });

        // Actualizar Combo
        hudCombo.textContent = `x${combo}`;
        if (combo >= 3) {
            hudCombo.classList.add('on-fire');
            gsap.fromTo(hudCombo, { scale: 1.3 }, { scale: 1, duration: 0.25 });
        } else {
            hudCombo.classList.remove('on-fire');
        }

        // Sonido de impacto metálico
        window.soundController.playTargetHit(isBullseye);

        // Chispas y onda expansiva de partículas
        fx.createImpactSparks(clickX, clickY, isBullseye || targetType === 'gold');

        // Texto flotante de puntuación
        const displayLabel = (points >= 0 ? `+${points}` : `${points}`) + 
            (isBullseye ? ' ¡DIANA!' : '') + bonusText;
        fx.showFloatingScore(clickX, clickY, displayLabel, isBullseye || targetType === 'gold');

        // ANIMACIÓN GSAP DEL BLANCO AL SER DERRIBADO:
        // Cae hacia atrás en perspectiva 3D girando sobre la bisagra del riel
        const hitTimeline = gsap.timeline();
        
        hitTimeline.to(targetUnit, {
            rotateX: -115,
            y: "+=12",
            scale: 0.88,
            duration: 0.3,
            ease: 'power2.in',
            transformOrigin: 'top center'
        });

        // Vibración residual de la bisagra
        hitTimeline.to(targetUnit, {
            rotateX: -105,
            duration: 0.15,
            yoyo: true,
            repeat: 2,
            ease: 'sine.inOut'
        });

        // Programar reaparición del blanco tras 1.8 segundos
        gsap.delayedCall(1.8, () => {
            respawnTarget(targetUnit);
        });
    }

    // ==========================================
    // 7. DISPARO FALLIDO (MISS)
    // ==========================================
    function handleMiss(clickX, clickY) {
        combo = 0;
        hudCombo.textContent = 'x0';
        hudCombo.classList.remove('on-fire');

        // Sonido de rebote
        window.soundController.playRicochet();

        // Agujero de bala en la madera
        fx.createBulletHole(clickX, clickY);
    }

    function updateAccuracy() {
        const acc = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 100;
        hudAccuracy.textContent = `${acc}%`;
    }

    // ==========================================
    // 8. REAPARICIÓN DEL BLANCO (RESPAWN GSAP)
    // ==========================================
    function respawnTarget(targetUnit) {
        // Posibilidad aleatoria de cambiar tipo de blanco al regenerarse
        const rand = Math.random();
        let newType = 'normal';
        if (rand < 0.18) {
            newType = 'gold'; // 18% bonus diana de oro
        } else if (rand < 0.28) {
            newType = 'skull'; // 10% diana calavera
        }

        targetUnit.className = `target-unit ${newType}`;
        targetUnit.dataset.type = newType;

        // Animación elástica de regreso: El blanco vuelve a colgar del riel oscilando
        gsap.fromTo(targetUnit, 
            {
                rotateX: -115,
                scale: 0.88
            },
            {
                rotateX: 0,
                y: 0,
                scale: 1,
                duration: 0.95,
                ease: 'elastic.out(1.2, 0.45)',
                transformOrigin: 'top center',
                onComplete: () => {
                    targetUnit.dataset.down = 'false';
                    if (currentMode === 'swing') {
                        startTargetSwing(targetUnit);
                    }
                }
            }
        );
    }

    // ==========================================
    // 9. SISTEMA DE RECARGA
    // ==========================================
    function reload() {
        if (isReloading || currentAmmo === MAX_AMMO) return;

        isReloading = true;
        hideReloadPrompt();
        window.soundController.playReload();

        const bullets = document.querySelectorAll('.bullet-icon');
        
        // Animación GSAP de recarga secuencial (Stagger) de los proyectiles
        gsap.timeline({
            onComplete: () => {
                currentAmmo = MAX_AMMO;
                isReloading = false;
            }
        })
        .to(bullets, {
            scale: 0.5,
            opacity: 0,
            duration: 0.15
        })
        .set(bullets, {
            className: 'bullet-icon'
        })
        .to(bullets, {
            scale: 1,
            opacity: 1,
            stagger: 0.08,
            duration: 0.25,
            ease: 'back.out(2)'
        });
    }

    function showReloadPrompt() {
        reloadAlert.style.display = 'block';
        gsap.fromTo(reloadAlert, 
            { scale: 0.8, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(2)' }
        );
    }

    function hideReloadPrompt() {
        gsap.to(reloadAlert, {
            scale: 0.8,
            opacity: 0,
            duration: 0.15,
            onComplete: () => {
                reloadAlert.style.display = 'none';
            }
        });
    }

    // Atajos de teclado (R para recargar)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') {
            reload();
        }
    });

    btnManualReload.addEventListener('click', () => {
        reload();
    });

    ammoRow.addEventListener('click', () => {
        reload();
    });

    // ==========================================
    // 10. CONTROLES DEL HUD
    // ==========================================

    // Alternar Sonido
    btnToggleSound.addEventListener('click', () => {
        const muted = window.soundController.toggleMute();
        soundIcon.textContent = muted ? '🔇' : '🔊';
        btnToggleSound.style.opacity = muted ? '0.6' : '1';
    });

    // Alternar Modo de la Línea (Oscilante vs Cinta Mecánica Móvil)
    btnToggleMode.addEventListener('click', () => {
        if (currentMode === 'swing') {
            currentMode = 'conveyor';
            modeText.textContent = 'Línea: En Movimiento';
            btnToggleMode.style.borderColor = 'var(--neon-gold)';
        } else {
            currentMode = 'swing';
            modeText.textContent = 'Línea: Oscilante';
            btnToggleMode.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }
        initModeAnimations();
    });

    // Reiniciar Puntuación y Escenario
    btnReset.addEventListener('click', () => {
        score = 0;
        combo = 0;
        totalShots = 0;
        hits = 0;
        currentAmmo = MAX_AMMO;

        hudScore.textContent = '0';
        hudCombo.textContent = 'x0';
        hudCombo.classList.remove('on-fire');
        hudAccuracy.textContent = '100%';

        hideReloadPrompt();
        setupAmmoUI();
        buildTargetLine();

        gsap.fromTo('.hud-card', 
            { scale: 1.15 }, 
            { scale: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
        );
    });

    // ==========================================
    // 11. ANIMACIÓN DE LAS LUCES DE LA FERIA
    // ==========================================
    function animateCanopyLights() {
        const bulbs = document.querySelectorAll('.bulb');
        bulbs.forEach((bulb) => {
            gsap.to(bulb, {
                opacity: gsap.utils.random(0.35, 1),
                duration: gsap.utils.random(0.4, 1.2),
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: gsap.utils.random(0, 1)
            });
        });
    }

    // Iniciar Juego
    setupAmmoUI();
    buildTargetLine();
    animateCanopyLights();
});
