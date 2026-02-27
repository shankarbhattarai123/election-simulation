        // ── INPUT STATE ──
        const keys = {};
        const heldKeys = { left: false, right: false, up: false, down: false };

        document.addEventListener('keydown', e => {
            keys[e.key] = true;
            if (e.key === ' ' || e.key === 'Enter') advanceDialogue();
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { heldKeys.left = true; document.getElementById('kL').classList.add('active-key'); }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { heldKeys.right = true; document.getElementById('kR').classList.add('active-key'); }
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { heldKeys.up = true; document.getElementById('kU').classList.add('active-key'); }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { heldKeys.down = true; document.getElementById('kD').classList.add('active-key'); }
        });
        document.addEventListener('keyup', e => {
            keys[e.key] = false;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { heldKeys.left = false; document.getElementById('kL').classList.remove('active-key'); }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { heldKeys.right = false; document.getElementById('kR').classList.remove('active-key'); }
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { heldKeys.up = false; document.getElementById('kU').classList.remove('active-key'); }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { heldKeys.down = false; document.getElementById('kD').classList.remove('active-key'); }
        });

        const WALK_LERP = 0.055, WALK_ARRIVE_THRESH = 1.5, STEP_DELAY = 185;
        let lastTime = 0, lastStepTime = 0, isWalking = false;

        function gameLoop(ts) {
            requestAnimationFrame(gameLoop);
            const dt = Math.min((ts - lastTime) / 16.67, 3); lastTime = ts;
            const onTitle = !document.getElementById('titleScreen').classList.contains('hidden');
            if (onTitle) return;
            if (G.running) { updateGame(dt, ts); render(); }
        }

        function updateGame(dt, ts) {
            G.animT += dt * 0.035;

            // Lerp pixel position toward target tile (top-down: each tile = TS pixels)
            const target = { x: G.px * TS, y: G.py * TS };
            const dxx = target.x - G.pxPx, dyy = target.y - G.pyPx;
            const dist = Math.sqrt(dxx * dxx + dyy * dyy);

            if (dist > WALK_ARRIVE_THRESH) {
                isWalking = true;
                G.pxPx += dxx * WALK_LERP * dt;
                G.pyPx += dyy * WALK_LERP * dt;
            } else {
                G.pxPx = target.x; G.pyPx = target.y;
                if (isWalking) { isWalking = false; checkZone(); }
            }

            // Smooth camera follow
            const tcamX = G.pxPx - W / 2 + TS / 2;
            const tcamY = G.pyPx - H / 2 + TS / 2;
            camX += (tcamX - camX) * 0.1 * dt;
            camY += (tcamY - camY) * 0.1 * dt;

            // Update NPC positions
            updateNPCs(dt);

            if (G.dlgActive || G.triggered) return;
            const canStep = dist < WALK_ARRIVE_THRESH * 10 && (ts - lastStepTime) > STEP_DELAY;
            if (!canStep) return;

            let nx = G.px, ny = G.py, moved = false;
            if (heldKeys.left) { nx--; moved = true; }
            else if (heldKeys.right) { nx++; moved = true; }
            else if (heldKeys.up) { ny--; moved = true; }
            else if (heldKeys.down) { ny++; moved = true; }

            if (moved) {
                nx = Math.max(0, Math.min(COLS - 1, nx));
                ny = Math.max(0, Math.min(ROWS - 1, ny));
                // GATE: block crossing from row>=12 into row<=11 until ID verified
                const crossingGate = (ny <= 11 && G.py >= 12 && !G.idVerified);
                if (crossingGate) {
                    // Auto-open the ID verification modal immediately
                    if (!G.triggered) {
                        G.triggered = true;
                        playChime();
                        setTimeout(() => showModal('mID'), 200);
                    }
                } else if (WALK[ny]?.[nx] === 0) {
                    G.px = nx; G.py = ny; lastStepTime = ts;
                    G.stepTimer = (G.stepTimer || 0) + 1;
                    if (G.stepTimer % 2 === 0) playStep();
                }
            }
        }

        function checkZone() {
            if (G.triggered) return;
            const zone = ZONES.find(z => z.tx === G.px && z.ty === G.py && z.phase === G.phase);
            if (zone) {
                G.triggered = true; playChime();
                const modalMap = { id: 'mID', ballot: 'mBALLOT', box: 'mBOX', ink: 'mINK' };
                setTimeout(() => showModal(modalMap[zone.event]), 350);
            }
        }

        // ═══════════════════════════════════════════════════════
        //  CANVAS INIT (called from startGame)
        // ═══════════════════════════════════════════════════════
        function initCanvasLegacy() {
            // Old isometric init replaced — top-down initCanvas defined above
            window.addEventListener('resize', () => {
                if (!canvas) return;
                W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight;
            });
            requestAnimationFrame(gameLoop);
            startAmbient();
        }

