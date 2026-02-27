        // ═══════════════════════════════════════════════════════
        //  BOOTH ACTIONS — new order: ID → Ballot → Fold → Box → Ink
        // ═══════════════════════════════════════════════════════

        // STEP 2: ID verification — animated police process
        let _idVerRunning = false;

        function startIDVerification() {
            if (_idVerRunning) return;
            _idVerRunning = true;
            document.getElementById('idStartBtn').style.display = 'none';

            const steps = [
                { id: 'vs1', fill: 'vf1', status: 'vst1', dur: 1400, label: '🪪 स्क्यानिङ...', done: '✅' },
                { id: 'vs2', fill: 'vf2', status: 'vst2', dur: 1800, label: '👆 जाँच गर्दै...', done: '✅' },
                { id: 'vs3', fill: 'vf3', status: 'vst3', dur: 1600, label: '👁️ पहिचान गर्दै...', done: '✅' },
                { id: 'vs4', fill: 'vf4', status: 'vst4', dur: 1200, label: '📋 सूची जाँच...', done: '✅' },
            ];

            let delay = 0;
            steps.forEach((s, i) => {
                setTimeout(() => {
                    // Activate
                    const row = document.getElementById(s.id);
                    row.classList.add('active');
                    document.getElementById(s.status).textContent = '⏳';
                    // Animate progress bar
                    const fill = document.getElementById(s.fill);
                    fill.style.transition = `width ${s.dur}ms linear`;
                    fill.style.width = '100%';
                    // Complete after dur
                    setTimeout(() => {
                        row.classList.remove('active');
                        row.classList.add('done');
                        document.getElementById(s.status).textContent = s.done;
                        playChime();
                        // Last step → show result
                        if (i === steps.length - 1) {
                            setTimeout(() => {
                                document.getElementById('idVerifyResult').style.display = 'block';
                            }, 400);
                        }
                    }, s.dur);
                }, delay);
                delay += s.dur + 300;
            });
        }

        function completeID() {
            playSuccess(); G.idVerified = true; G.phase = 'post-id';
            _idVerRunning = false;
            hideModals(); G.triggered = false; setPhaseDot(2);
            setTimeout(() => showDialogue('👮', 'मतदान अधिकृत', '✅ परिचय पुष्टि भयो! गेट खुल्यो — मत बुथतर्फ हिँड्नुहोस्।', true), 300);
        }

        // STEP 3: Two ballots — प्रत्यक्ष then समानुपातिक
        let stampDone = false, prDone = false, spDone = false;

        function switchTab(tab) {
            document.getElementById('panelPR').style.display = tab === 'pr' ? 'block' : 'none';
            document.getElementById('panelSP').style.display = tab === 'sp' ? 'block' : 'none';
            document.getElementById('tabPR').className = 'ballot-tab ' + (tab === 'pr' ? 'active' : 'inactive');
            document.getElementById('tabSP').className = 'ballot-tab ' + (tab === 'sp' ? 'active' : 'inactive');
            // Can't access SP tab until PR is done
            if (tab === 'sp' && !prDone) {
                switchTab('pr');
                document.getElementById('prPending').style.color = '#dc143c';
                document.getElementById('prPending').textContent = '⚠️ पहिले प्रत्यक्ष मतपत्रमा छाप लगाउनुहोस्!';
                setTimeout(() => {
                    document.getElementById('prPending').style.color = '#907050';
                    document.getElementById('prPending').textContent = 'माथिका उम्मेदवारमध्ये एकलाई छाप लगाउनुहोस् ↑';
                }, 2000);
            }
        }

        function stampPR(num) {
            if (prDone) return;
            prDone = true; G.stamped = num; playStamp();
            // Mark stamped row
            const row = document.getElementById('pr' + num);
            if (row) { row.classList.add('stamped'); row.classList.add('stamp-flash'); }
            // Disable all PR rows
            for (let i = 1; i <= 6; i++) { const el = document.getElementById('pr' + i); if (el) el.onclick = null; }
            // Show next button + badge
            document.getElementById('prPending').style.display = 'none';
            document.getElementById('btnPRNext').classList.remove('hidden');
            document.getElementById('prDoneBadge').style.display = 'inline-block';
            // Dialogue
            setTimeout(() => showDialogue('🗳️', 'बुथ अधिकृत', 'प्रत्यक्ष मतपत्रमा छाप सफलतापूर्वक लगाइयो! अब समानुपातिक मतपत्र (निलो) मा आफ्नो रोजाइको दललाई छाप लगाउनुहोस्।', true), 400);
        }

        function stampSP(num) {
            if (spDone) return;
            spDone = true; G.stampedParty = num; playStamp();
            const row = document.getElementById('sp' + num);
            if (row) { row.classList.add('stamped'); row.classList.add('stamp-flash'); }
            for (let i = 1; i <= 20; i++) { const el = document.getElementById('sp' + i); if (el) el.onclick = null; }
            document.getElementById('spPending').style.display = 'none';
            document.getElementById('btnSPNext').classList.remove('hidden');
            document.getElementById('spDoneBadge').style.display = 'inline-block';
            setTimeout(() => showDialogue('🗳️', 'बुथ अधिकृत', 'दुवै मतपत्रमा छाप लगाइयो! अब मतपत्र ठाडो तहमा लगाएर मतपेटिकामा हाल्नुहोस्।', true), 400);
        }

        function completedBothBallots() {
            if (!prDone || !spDone) return;
            stampDone = true;
            playClick(); hideModals(); showModal('mFOLD');
        }

        // STEP 4: Fold → go to ballot box
        function completedFold(vertical) {
            playClick(); G.foldVertical = vertical; hideModals(); G.triggered = false; G.phase = 'post-ballot'; setPhaseDot(3);
            if (vertical) {
                setStepText('✓ सही तह! मतपेटिकातर्फ हिँड्नुहोस् →');
                setTimeout(() => showDialogue('🧑‍💼', 'बुथ अधिकृत', 'उत्तम ठाडो तह! गोपनीयता कायम रह्यो र मसी धब्बा हुँदैन। अब हरियो आधिकारिक मतपेटिकामा आफ्नो मतपत्र हाल्नुहोस्!', true), 200);
            } else {
                setStepText('⚠️ तेर्सो तह! मतपेटिकातर्फ हिँड्नुहोस् →');
                setTimeout(() => showDialogue('⚠️', 'चेतावनी', 'तपाईंले तेर्सो तह लगाउनुभयो — यसले उम्मेदवारहरूमा मसी धब्बा पार्न सक्छ! जे भए पनि मतपेटिकामा मतपत्र हाल्नुहोस्।', true), 200);
            }
            document.getElementById('hudPhase').textContent = 'मतपेटिका';
        }

        // STEP 5: Deposit ballot → go to ink station
        function dropBallot(correct) {
            playClick(); G.correctBox = correct; hideModals(); G.triggered = false; G.phase = 'post-box'; setPhaseDot(4);
            setStepText('✓ मतपत्र हालियो! मसी केन्द्रतर्फ हिँड्नुहोस् →');
            document.getElementById('hudPhase').textContent = 'मसी केन्द्र';
            setTimeout(() => showDialogue('👮', 'मतदान अधिकृत', 'मतपत्र हालियो! अब अन्तिम चरण — दोहोरो मतदान रोक्न बायाँ हातको काकुल औंलामा अमिट मसी लगाउन मसी केन्द्रतर्फ जानुहोस्।', true), 400);
        }

        // STEP 6: Ink applied — FINAL STEP → show result

        // ═══════════════════════════════════════════════════════
        //  3D INK PAD CANVAS — 9000 Things illustrated style
        // ═══════════════════════════════════════════════════════
        let inkRaf = null, inkState = { phase: 'idle', t: 0, inkLevel: 0, fingerY: 0, fingerPressed: false, splashT: 0, splashActive: false, done: false };

        function initInkCanvas() {
            const c = document.getElementById('inkCanvas');
            if (!c) return;
            inkState = { phase: 'idle', t: 0, inkLevel: 0, fingerY: 0, fingerPressed: false, splashT: 0, splashActive: false, done: false };
            c.classList.remove('done');
            document.getElementById('inkHint').style.display = 'block';
            if (inkRaf) cancelAnimationFrame(inkRaf);
            drawInkFrame();
        }

        function drawInkFrame() {
            const c = document.getElementById('inkCanvas');
            if (!c) { if (inkRaf) cancelAnimationFrame(inkRaf); return; }
            const x = c.getContext('2d');
            const W = 340, H = 260;
            x.clearRect(0, 0, W, H);
            inkState.t += 0.035;

            const pulse = Math.sin(inkState.t * 2) * 0.5 + 0.5;
            const idleFloat = Math.sin(inkState.t * 1.2) * 3;

            // ── DESK SURFACE (wooden table) ──
            const tableGrad = x.createLinearGradient(20, 180, 320, 260);
            tableGrad.addColorStop(0, '#c8a060'); tableGrad.addColorStop(0.4, '#e8c080'); tableGrad.addColorStop(1, '#b08040');
            x.fillStyle = tableGrad;
            x.beginPath(); x.roundRect(20, 195, 300, 55, 6); x.fill();
            // Table edge highlight
            x.strokeStyle = 'rgba(255,220,140,0.4)'; x.lineWidth = 1.5;
            x.beginPath(); x.roundRect(20, 195, 300, 55, 6); x.stroke();
            // Wood grain lines
            x.strokeStyle = 'rgba(160,110,40,0.15)'; x.lineWidth = 1;
            for (let g = 0; g < 8; g++) { const gy = 200 + g * 7; x.beginPath(); x.moveTo(20, gy); x.lineTo(320, gy); x.stroke(); }
            // Table shadow under pad
            x.beginPath(); x.ellipse(170, 200, 85, 12, 0, 0, Math.PI * 2);
            const ts = x.createRadialGradient(170, 200, 0, 170, 200, 85);
            ts.addColorStop(0, 'rgba(0,0,0,0.35)'); ts.addColorStop(1, 'rgba(0,0,0,0)');
            x.fillStyle = ts; x.fill();

            // ── INK PAD BOX ── 3D isometric-ish with thick body
            const padX = 80, padY = 120 + idleFloat, padW = 180, padH = 60, padDepth = 18;

            // Box bottom face (front)
            const frontGrad = x.createLinearGradient(padX, padY + padH, padX, padY + padH + padDepth);
            frontGrad.addColorStop(0, '#3a1a60'); frontGrad.addColorStop(1, '#1a0830');
            x.fillStyle = frontGrad;
            x.beginPath(); x.roundRect(padX, padY + padH - 4, padW, padDepth + 4, { lowerLeft: 4, lowerRight: 4 }); x.fill();
            // Front highlight strip
            x.strokeStyle = 'rgba(120,60,200,0.3)'; x.lineWidth = 1;
            x.beginPath(); x.moveTo(padX + 6, padY + padH + padDepth - 2); x.lineTo(padX + padW - 6, padY + padH + padDepth - 2); x.stroke();

            // Box side (right depth face)
            const rightGrad = x.createLinearGradient(padX + padW, padY, padX + padW + 12, padY + padH);
            rightGrad.addColorStop(0, '#280a50'); rightGrad.addColorStop(1, '#100520');
            x.fillStyle = rightGrad;
            x.beginPath();
            x.moveTo(padX + padW, padY + 6); x.lineTo(padX + padW + 12, padY + 14);
            x.lineTo(padX + padW + 12, padY + padH + padDepth); x.lineTo(padX + padW, padY + padH + padDepth - 4);
            x.closePath(); x.fill();

            // ── PAD SURFACE (the actual ink pad top) ──
            const padSurface = x.createLinearGradient(padX, padY, padX + padW, padY + padH);
            padSurface.addColorStop(0, '#8040c0'); padSurface.addColorStop(0.3, '#6028a8'); padSurface.addColorStop(0.7, '#401080'); padSurface.addColorStop(1, '#2a0858');
            // Outer frame of pad top
            x.fillStyle = '#4a1a80';
            x.beginPath(); x.roundRect(padX, padY, padW, padH, 8); x.fill();

            // Inner velvet ink surface
            const velvet = x.createRadialGradient(padX + padW * 0.42, padY + padH * 0.38, 4, padX + padW * 0.5, padY + padH * 0.5, padW * 0.6);
            velvet.addColorStop(0, '#9050d8'); velvet.addColorStop(0.4, '#6828b0'); velvet.addColorStop(0.8, '#401080'); velvet.addColorStop(1, '#200848');
            x.fillStyle = velvet;
            x.beginPath(); x.roundRect(padX + 8, padY + 8, padW - 16, padH - 16, 5); x.fill();

            // Velvet texture — subtle horizontal lines
            x.strokeStyle = 'rgba(180,100,255,0.08)'; x.lineWidth = 1;
            for (let vl = 0; vl < 8; vl++) {
                const vy = padY + 12 + vl * 5.5;
                x.beginPath(); x.moveTo(padX + 10, vy); x.lineTo(padX + padW - 10, vy); x.stroke();
            }

            // Ink shimmer / gloss on pad surface
            const shimmer = x.createLinearGradient(padX + 12, padY + 10, padX + padW * 0.6, padY + padH * 0.5);
            shimmer.addColorStop(0, 'rgba(220,180,255,0.22)'); shimmer.addColorStop(0.5, 'rgba(160,100,255,0.08)'); shimmer.addColorStop(1, 'rgba(100,50,200,0)');
            x.fillStyle = shimmer; x.beginPath(); x.roundRect(padX + 8, padY + 8, padW - 16, padH - 16, 5); x.fill();

            // Ink wet sheen — animated ripple when idle
            if (!inkState.done) {
                const rippleR = 20 + pulse * 8;
                const ripple = x.createRadialGradient(padX + padW * 0.5, padY + padH * 0.5, 0, padX + padW * 0.5, padY + padH * 0.5, rippleR);
                ripple.addColorStop(0, 'rgba(200,150,255,0.0)');
                ripple.addColorStop(0.5, `rgba(200,150,255,${0.08 + pulse * 0.06})`);
                ripple.addColorStop(1, 'rgba(200,150,255,0)');
                x.fillStyle = ripple; x.beginPath(); x.ellipse(padX + padW * 0.5, padY + padH * 0.5, rippleR * 1.5, rippleR * 0.8, 0, 0, Math.PI * 2); x.fill();
            }

            // Pad label badge
            x.fillStyle = 'rgba(80,20,140,0.8)'; x.beginPath(); x.roundRect(padX + padW / 2 - 38, padY + padH - 22, 76, 16, 3); x.fill();
            x.font = 'bold 8px "Share Tech Mono",monospace'; x.fillStyle = 'rgba(200,160,255,0.9)'; x.textAlign = 'center';
            x.fillText('अमिट मसी', padX + padW / 2, padY + padH - 11);

            // Outer pad border glow
            const glowAlpha = 0.4 + pulse * 0.3;
            x.strokeStyle = `rgba(160,80,255,${glowAlpha})`; x.lineWidth = 2;
            x.beginPath(); x.roundRect(padX, padY, padW, padH, 8); x.stroke();
            // Outer soft glow aura
            const aura = x.createLinearGradient(padX - 10, padY - 10, padX + padW + 10, padY + padH + 10);
            aura.addColorStop(0, `rgba(140,60,255,${0.1 + pulse * 0.08})`); aura.addColorStop(1, 'rgba(80,20,200,0)');
            x.strokeStyle = aura; x.lineWidth = 8; x.beginPath(); x.roundRect(padX - 4, padY - 4, padW + 8, padH + 8, 12); x.stroke();

            // ── INK SPLASH EFFECT (after press) ──
            if (inkState.splashActive) {
                inkState.splashT += 0.08;
                const sc = padX + padW * 0.5, sr = padY + padH * 0.5;
                const splashColors = ['rgba(180,80,255,', 'rgba(140,60,230,', 'rgba(220,160,255,', 'rgba(100,40,200,'];
                for (let d = 0; d < 12; d++) {
                    const angle = (d / 12) * Math.PI * 2;
                    const dist = inkState.splashT * 60;
                    const sx = sc + Math.cos(angle) * dist * 1.4;
                    const sy = sr + Math.sin(angle) * dist * 0.6;
                    const alpha = Math.max(0, 1 - inkState.splashT * 0.8);
                    const sz = Math.max(0, 6 - inkState.splashT * 4);
                    x.fillStyle = splashColors[d % 4] + alpha + ')';
                    x.beginPath(); x.arc(sx, sy, sz, 0, Math.PI * 2); x.fill();
                }
                // Ring wave
                const ringR = inkState.splashT * 70;
                x.strokeStyle = `rgba(180,100,255,${Math.max(0, 0.6 - inkState.splashT * 0.7)})`;
                x.lineWidth = Math.max(0, 3 - inkState.splashT * 2);
                x.beginPath(); x.ellipse(sc, sr, ringR, ringR * 0.5, 0, 0, Math.PI * 2); x.stroke();
                if (inkState.splashT > 1.5) inkState.splashActive = false;
            }

            // ── FINGER + HAND ──
            const fingerX = padX + padW * 0.52;
            let fingerBaseY;
            if (inkState.done) {
                fingerBaseY = padY - 24; // resting just above pad after press
            } else {
                // Idle hover float
                fingerBaseY = padY - 60 + idleFloat;
            }
            if (inkState.fingerPressed) {
                fingerBaseY = padY + 4; // squished onto pad
            }

            // Hand/arm
            const handGrad = x.createLinearGradient(fingerX - 22, fingerBaseY, fingerX + 22, fingerBaseY + 80);
            handGrad.addColorStop(0, '#d4a070'); handGrad.addColorStop(0.5, '#b88050'); handGrad.addColorStop(1, '#9a6838');
            // Wrist/arm
            x.fillStyle = '#b88050'; x.beginPath();
            x.roundRect(fingerX - 18, fingerBaseY + 55, 36, 60, 6); x.fill();
            // Palm
            x.fillStyle = handGrad; x.beginPath();
            x.ellipse(fingerX, fingerBaseY + 55, 22, 18, 0, 0, Math.PI * 2); x.fill();
            // Palm highlight
            x.fillStyle = 'rgba(255,200,150,0.2)'; x.beginPath();
            x.ellipse(fingerX - 6, fingerBaseY + 50, 10, 7, Math.PI * 0.2, 0, Math.PI * 2); x.fill();

            // Curled fingers (non-index)
            const fingerPositions = [[-16, 8], [-6, 6], [8, 6], [18, 8]];
            fingerPositions.forEach(([fx, fy]) => {
                x.fillStyle = '#c08858'; x.beginPath();
                x.roundRect(fingerX + fx - 5, fingerBaseY + fy, 10, 22, 5); x.fill();
                x.fillStyle = 'rgba(255,200,150,0.15)'; x.beginPath();
                x.roundRect(fingerX + fx - 4, fingerBaseY + fy + 1, 5, 8, 3); x.fill();
            });

            // Index finger (pointing down)
            const ifX = fingerX - 2, ifY = fingerBaseY;
            // Finger body
            const ifGrad = x.createLinearGradient(ifX - 7, ifY, ifX + 7, ifY + 50);
            ifGrad.addColorStop(0, '#d4a878'); ifGrad.addColorStop(0.5, '#c09060'); ifGrad.addColorStop(1, '#a07848');
            x.fillStyle = ifGrad; x.beginPath(); x.roundRect(ifX - 7, ifY, 14, 46, 7); x.fill();
            // Knuckle line
            x.strokeStyle = 'rgba(140,90,40,0.25)'; x.lineWidth = 1;
            x.beginPath(); x.moveTo(ifX - 5, ifY + 18); x.lineTo(ifX + 5, ifY + 18); x.stroke();
            x.beginPath(); x.moveTo(ifX - 4, ifY + 30); x.lineTo(ifX + 4, ifY + 30); x.stroke();
            // Fingertip
            x.fillStyle = '#c09060'; x.beginPath(); x.ellipse(ifX, ifY + 46, 7, 5, 0, 0, Math.PI * 2); x.fill();
            // Fingernail
            x.fillStyle = 'rgba(255,230,200,0.6)'; x.beginPath(); x.roundRect(ifX - 5, ifY + 2, 10, 14, 4); x.fill();
            x.strokeStyle = 'rgba(180,130,80,0.3)'; x.lineWidth = 0.8; x.beginPath(); x.roundRect(ifX - 5, ifY + 2, 10, 14, 4); x.stroke();
            // Highlight on finger
            x.fillStyle = 'rgba(255,220,180,0.25)'; x.beginPath(); x.roundRect(ifX - 5, ifY + 2, 5, 30, 3); x.fill();

            // Ink on fingertip (after pressing)
            if (inkState.done) {
                const inkAlpha = Math.min(1, inkState.inkLevel);
                // Purple ink stain
                const inkG = x.createRadialGradient(ifX, ifY + 44, 0, ifX, ifY + 46, 10);
                inkG.addColorStop(0, `rgba(120,40,220,${inkAlpha * 0.95})`);
                inkG.addColorStop(0.5, `rgba(90,20,180,${inkAlpha * 0.8})`);
                inkG.addColorStop(1, `rgba(60,10,140,0)`);
                x.fillStyle = inkG; x.beginPath(); x.ellipse(ifX, ifY + 46, 11, 8, 0, 0, Math.PI * 2); x.fill();
                // Ink shine
                x.fillStyle = `rgba(200,150,255,${inkAlpha * 0.4})`; x.beginPath();
                x.ellipse(ifX - 2, ifY + 43, 4, 2.5, Math.PI * 0.3, 0, Math.PI * 2); x.fill();
                // Ink drip
                if (inkState.inkLevel > 0.5) {
                    const dripLen = (inkState.inkLevel - 0.5) * 16;
                    const dripG = x.createLinearGradient(ifX, ifY + 50, ifX, ifY + 50 + dripLen);
                    dripG.addColorStop(0, `rgba(100,30,200,${inkAlpha * 0.8})`); dripG.addColorStop(1, 'rgba(80,20,160,0)');
                    x.fillStyle = dripG; x.beginPath();
                    x.moveTo(ifX - 3, ifY + 50); x.quadraticCurveTo(ifX + 2, ifY + 50 + dripLen * 0.6, ifX, ifY + 50 + dripLen);
                    x.quadraticCurveTo(ifX - 2, ifY + 50 + dripLen * 0.6, ifX + 3, ifY + 50); x.closePath(); x.fill();
                }
                inkState.inkLevel = Math.min(1, inkState.inkLevel + 0.025);
            }

            // ── LABEL PLATE on table ──
            x.fillStyle = 'rgba(180,140,60,0.9)'; x.beginPath(); x.roundRect(110, 207, 120, 18, 3); x.fill();
            x.strokeStyle = 'rgba(220,180,80,0.6)'; x.lineWidth = 1; x.beginPath(); x.roundRect(110, 207, 120, 18, 3); x.stroke();
            x.font = 'bold 8px "Share Tech Mono",monospace'; x.fillStyle = '#3a1a00'; x.textAlign = 'center';
            x.fillText('मसी प्रयोग केन्द्र', 170, 219);

            // ── GLOW pulse ring around whole pad (idle call to action) ──
            if (!inkState.done) {
                x.strokeStyle = `rgba(160,80,255,${0.15 + pulse * 0.2})`; x.lineWidth = 12;
                x.beginPath(); x.roundRect(padX - 6, padY - 6, padW + 12, padH + 12, 14); x.stroke();
            }

            inkRaf = requestAnimationFrame(drawInkFrame);
        }

        let inkDone = false;
        function applyInk() {
            if (inkDone) return;
            inkDone = true; G.inkApplied = true;
            inkState.fingerPressed = true;
            inkState.splashActive = true; inkState.splashT = 0;
            inkState.done = true;
            playStamp();
            // Screen shake effect on modal
            const panel = document.querySelector('#mINK .booth-panel');
            panel.style.animation = 'none';
            panel.style.transform = 'translate(-2px,1px)';
            setTimeout(() => { panel.style.transform = 'translate(2px,-1px)'; }, 60);
            setTimeout(() => { panel.style.transform = 'translate(-1px,2px)'; }, 120);
            setTimeout(() => { panel.style.transform = ''; }, 200);
            // Finger goes back up after press
            setTimeout(() => { inkState.fingerPressed = false; }, 300);
            // Show particles burst
            burstInkParticles();
            // Grow ink level
            let lvl = 0; const ivl = setInterval(() => { lvl += 0.04; inkState.inkLevel = Math.min(1, lvl); if (lvl >= 1) clearInterval(ivl); }, 30);
            // Show result
            setTimeout(() => {
                document.getElementById('inkResult').style.display = 'block';
                document.getElementById('inkHint').style.display = 'none';
                document.getElementById('btnInkNext').classList.remove('hidden');
                const c = document.getElementById('inkCanvas'); if (c) c.classList.add('done');
            }, 900);
        }

        function burstInkParticles() {
            const burst = document.getElementById('inkBurst');
            if (!burst) return;
            burst.innerHTML = '';
            const colors = ['#a040e0', '#c070ff', '#7020c0', '#e090ff', '#5010a0', '#d4a0ff'];
            for (let i = 0; i < 20; i++) {
                const d = document.createElement('div');
                const angle = (i / 20) * 360; const dist = 40 + Math.random() * 80;
                const tx = Math.cos(angle * Math.PI / 180) * dist, ty = Math.sin(angle * Math.PI / 180) * dist;
                const size = 4 + Math.random() * 8;
                d.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${-size / 2}px;top:${-size / 2}px;
      --tx:${tx}px;--ty:${ty}px;
      animation:burst 0.7s ${Math.random() * 0.15}s cubic-bezier(0,0.5,0.5,1) forwards;
      box-shadow:0 0 ${size}px ${colors[Math.floor(Math.random() * colors.length)]}`;
                burst.appendChild(d);
            }
        }
        function completedInk() {
            playSuccess(); G.inkApplied = true; hideModals(); G.triggered = false; setPhaseDot(5);
            setTimeout(showResult, 700);
        }

