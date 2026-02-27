        // ═══════════════════════════════════════════════════════
        //  SCREEN MANAGEMENT
        // ═══════════════════════════════════════════════════════
        function fadeToScreen(id) {
            playClick();
            const v = document.getElementById('veil'); v.classList.add('on');
            setTimeout(() => {
                document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
                document.getElementById(id)?.classList.remove('hidden');
                v.classList.remove('on');
            }, 450);
        }
        function showModal(id) {
            playClick();
            document.querySelectorAll('.booth-modal').forEach(m => m.classList.add('hidden'));
            document.getElementById(id)?.classList.remove('hidden');
            if (id === 'mINK') setTimeout(initInkCanvas, 80);
            if (id === 'mID') resetIDModal();
        }
        function resetIDModal() {
            _idVerRunning = false;
            [1, 2, 3, 4].forEach(i => {
                const row = document.getElementById('vs' + i);
                if (row) { row.className = 'vstep'; }
                const fill = document.getElementById('vf' + i);
                if (fill) { fill.style.transition = 'none'; fill.style.width = '0%'; }
                const st = document.getElementById('vst' + i);
                if (st) st.textContent = '⏳';
            });
            document.getElementById('idVerifyResult').style.display = 'none';
            document.getElementById('idStartBtn').style.display = 'block';
        }
        function hideModals() { document.querySelectorAll('.booth-modal').forEach(m => m.classList.add('hidden')); }
        function setPhaseDot(n) {
            for (let i = 0; i < 6; i++) {
                const d = document.getElementById('pd' + i); if (!d) continue;
                d.className = 'ph-dot' + (i < n ? ' done' : i === n ? ' active' : '');
            }
        }

        // ═══════════════════════════════════════════════════════
        //  CHARACTER SELECT
        // ═══════════════════════════════════════════════════════
        function selectChar(c) {
            playClick(); G.char = c; G.name = c === 'male' ? 'राम बहादुर' : 'सीता देवी';
            document.getElementById('cM').classList.toggle('sel', c === 'male');
            document.getElementById('cF').classList.toggle('sel', c === 'female');
            const btn = document.getElementById('btnStartGame'); btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
        }

        function startGame() {
            if (!G.char) return;
            playClick(); AC.resume();
            document.getElementById('idCardName').textContent = G.char === 'male' ? 'राम बहादुर थापा' : 'सीता देवी थापा';
            document.getElementById('idCardNum').textContent = G.char === 'male' ? 'मतदाता नं: ०००/०४/२८४७' : 'मतदाता नं: ०००/०४/२८४८';
            document.getElementById('hudName').textContent = G.name;
            G.px = 9; G.py = 16; G.phase = 'queue';
            const p = { x: G.px * TS, y: G.py * TS }; G.pxPx = p.x; G.pyPx = p.y;
            setPhaseDot(0);
            G.running = true;
            const v = document.getElementById('veil'); v.classList.add('on');
            setTimeout(() => {
                document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
                v.classList.remove('on');
                if (!canvas) {
                    initCanvas();
                    window.addEventListener('resize', () => { if (canvas) { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; } });
                    requestAnimationFrame(gameLoop);
                    startAmbient();
                }
                setStepText('परिचय डेस्कतर्फ हिँड्नुहोस् — तीर किज वा WASD थिच्नुहोस्');
                setTimeout(() => showDialogue('👮', 'मतदान अधिकृत', `नमस्ते, ${G.name} जी! आज फागुन २१, २०८२ — काठमाडौंमा निर्वाचनको दिन हो। सुरु गर्न नारंगी चम्किलो टाइलतर्फ हिँड्नुहोस्!`, false), 500);
            }, 450);
        }

        // ═══════════════════════════════════════════════════════
        //  DIALOGUE
        // ═══════════════════════════════════════════════════════
        function showDialogue(face, speaker, text, auto = false) {
            G.dlgActive = true;
            document.getElementById('dlgFace').textContent = face;
            document.getElementById('dlgSpeaker').textContent = speaker;
            document.getElementById('dlgText').textContent = text;
            document.getElementById('dialogueBox').classList.remove('hidden');
            if (auto) setTimeout(advanceDialogue, 3800);
        }
        function advanceDialogue() {
            G.dlgActive = false;
            document.getElementById('dialogueBox').classList.add('hidden');
            G.triggered = false;
        }
        document.getElementById('dialogueBox').addEventListener('click', advanceDialogue);

        // ═══════════════════════════════════════════════════════
        //  RESULT
        // ═══════════════════════════════════════════════════════
        function showResult() {
            const checks = [
                { ok: G.idVerified, label: 'परिचय डेस्कमा परिचयपत्र प्रमाणित' },
                { ok: G.stamped > 0, label: 'प्रत्यक्ष मतपत्रमा उम्मेदवारलाई छाप लगाइएको' },
                { ok: G.stampedParty > 0, label: 'समानुपातिक मतपत्रमा दललाई छाप लगाइएको' },
                { ok: G.foldVertical === true, label: 'मतपत्र ठाडो तहमा लगाइएको (मसी धब्बा छैन)' },
                { ok: G.correctBox === true, label: 'आधिकारिक मतपेटिकामा मतपत्र हालिएको' },
                { ok: G.inkApplied, label: 'काकुल औंलामा अमिट मसी लगाइएको' },
            ];
            const valid = checks.every(c => c.ok);
            valid ? playSuccess() : playFail();
            const ring = document.getElementById('resRing');
            ring.textContent = valid ? '✅' : '❌'; ring.className = 'result-ring ' + (valid ? 'valid' : 'invalid');
            document.getElementById('resVerdict').textContent = valid ? 'मत मान्य — गणना हुन्छ' : 'मत अमान्य — गणना हुँदैन';
            document.getElementById('resVerdict').className = 'verdict-tag ' + (valid ? 'valid' : 'invalid');
            document.getElementById('resTitle').textContent = valid ? 'बधाई छ! मतदान सम्पन्न' : 'खेद छ! त्रुटि भयो';
            document.getElementById('reportItems').innerHTML = checks.map(c => `<div class="r-item"><div class="r-icon ${c.ok ? 'ok' : 'fail'}">${c.ok ? '✓' : '✗'}</div><div class="r-txt ${c.ok ? 'ok' : 'fail'}">${c.label}</div></div>`).join('');
            G.running = false;
            hideModals(); document.getElementById('dialogueBox').classList.add('hidden');
            setTimeout(() => fadeToScreen('resultScreen'), 500);
        }

        function setStepText(t) { document.getElementById('stepText').textContent = t; }

        // ═══════════════════════════════════════════════════════
        //  RESTART
        // ═══════════════════════════════════════════════════════
        function restartGame() {
            G.phase = 'queue'; G.inkApplied = false; G.idVerified = false;
            G.stamped = 0; G.stampedParty = 0; G.foldVertical = null; G.correctBox = null;
            G.triggered = false; G.dlgActive = false; G.stepTimer = 0; G.running = false;
            G.px = 9; G.py = 16; G._gateWarn = 0;
            _idVerRunning = false;
            inkDone = false; stampDone = false; prDone = false; spDone = false; isWalking = false;
            inkState = { phase: 'idle', t: 0, inkLevel: 0, fingerY: 0, fingerPressed: false, splashT: 0, splashActive: false, done: false };
            if (inkRaf) { cancelAnimationFrame(inkRaf); inkRaf = null; }
            // Reset PR ballot
            for (let i = 1; i <= 6; i++) {
                const el = document.getElementById('pr' + i);
                if (el) { el.classList.remove('stamped', 'stamp-flash'); const n = i; el.onclick = () => stampPR(n); }
            }
            // Reset SP ballot
            for (let i = 1; i <= 20; i++) {
                const el = document.getElementById('sp' + i);
                if (el) { el.classList.remove('stamped', 'stamp-flash'); const n = i; el.onclick = () => stampSP(n); }
            }
            // Reset tab state
            const btnPR = document.getElementById('btnPRNext'); if (btnPR) btnPR.classList.add('hidden');
            const btnSP = document.getElementById('btnSPNext'); if (btnSP) btnSP.classList.add('hidden');
            const prB = document.getElementById('prDoneBadge'); if (prB) prB.style.display = 'none';
            const spB = document.getElementById('spDoneBadge'); if (spB) spB.style.display = 'none';
            const prP = document.getElementById('prPending'); if (prP) { prP.style.display = 'block'; prP.textContent = 'माथिका उम्मेदवारमध्ये एकलाई छाप लगाउनुहोस् ↑'; }
            const spP = document.getElementById('spPending'); if (spP) { spP.style.display = 'block'; spP.textContent = 'माथिका दलमध्ये एकलाई छाप लगाउनुहोस् ↑'; }
            // Reset panels to PR tab
            const pPR = document.getElementById('panelPR'); if (pPR) pPR.style.display = 'block';
            const pSP = document.getElementById('panelSP'); if (pSP) pSP.style.display = 'none';
            const tPR = document.getElementById('tabPR'); if (tPR) tPR.className = 'ballot-tab active';
            const tSP = document.getElementById('tabSP'); if (tSP) tSP.className = 'ballot-tab inactive';
            document.getElementById('inkResult').style.display = 'none';
            document.getElementById('btnInkNext').classList.add('hidden');
            document.getElementById('dialogueBox').classList.add('hidden');
            fadeToScreen('charScreen');
            document.getElementById('cM').classList.remove('sel');
            document.getElementById('cF').classList.remove('sel');
            const btn = document.getElementById('btnStartGame'); btn.style.opacity = '0.38'; btn.style.pointerEvents = 'none';
        }

        // ═══════════════════════════════════════════════════════
        //  TOUCH
        // ═══════════════════════════════════════════════════════
        let tX = 0, tY = 0;
        document.addEventListener('touchstart', e => { tX = e.touches[0].clientX; tY = e.touches[0].clientY; }, { passive: true });
        document.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - tX, dy = e.changedTouches[0].clientY - tY;
            if (Math.abs(dx) < 14 && Math.abs(dy) < 14) { advanceDialogue(); return; }
            heldKeys.left = heldKeys.right = heldKeys.up = heldKeys.down = false;
            if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0) heldKeys.right = true; else heldKeys.left = true; }
            else { if (dy > 0) heldKeys.down = true; else heldKeys.up = true; }
            setTimeout(() => { heldKeys.left = heldKeys.right = heldKeys.up = heldKeys.down = false; }, STEP_DELAY + 50);
        }, { passive: true });

        // ═══════════════════════════════════════════════════════
        //  INIT
        // ═══════════════════════════════════════════════════════
        // ═══════════════════════════════════════════════════════
        //  CHARACTER PREVIEW CANVAS (title screen)
        // ═══════════════════════════════════════════════════════
        function drawCharPreview(canvasId, gender) {
            const c = document.getElementById(canvasId);
            if (!c) return;
            const x = c.getContext('2d');
            x.imageSmoothingEnabled = false;
            x.clearRect(0, 0, 100, 120);

            // Background
            const bg = x.createLinearGradient(0, 0, 100, 120);
            bg.addColorStop(0, 'rgba(30,50,30,0.3)'); bg.addColorStop(1, 'rgba(10,20,10,0.5)');
            x.fillStyle = bg; x.fillRect(0, 0, 100, 120);

            // Ground shadow
            x.beginPath(); x.ellipse(50, 108, 18, 5, 0, 0, Math.PI * 2);
            x.fillStyle = 'rgba(0,0,0,0.3)'; x.fill();

            const bodyColor = gender === 'female' ? '#e04080' : '#3868c8';
            const hatColor = gender === 'female' ? '#901040' : '#1840a0';

            // Legs
            x.fillStyle = gender === 'female' ? '#903060' : '#243870';
            x.fillRect(38, 80, 9, 22); x.fillRect(53, 80, 9, 22);
            // Shoes
            x.fillStyle = '#2a1810'; x.fillRect(36, 100, 11, 5); x.fillRect(51, 100, 11, 5);

            // Body
            x.fillStyle = bodyColor; x.fillRect(33, 48, 34, 34);
            // Arms
            x.fillStyle = bodyColor;
            x.fillRect(24, 50, 10, 20); x.fillRect(66, 50, 10, 20);
            // Hands
            x.fillStyle = '#f0c890'; x.fillRect(24, 70, 10, 8); x.fillRect(66, 70, 10, 8);

            // Head
            x.fillStyle = '#f0c890'; x.fillRect(36, 26, 28, 26);
            // Hat
            x.fillStyle = hatColor; x.fillRect(34, 18, 32, 14);
            x.fillRect(30, 28, 40, 6); // brim
            // Eyes
            x.fillStyle = '#201808'; x.fillRect(41, 35, 6, 5); x.fillRect(53, 35, 6, 5);
            // Smile
            x.fillStyle = '#c08060'; x.fillRect(43, 44, 14, 3);

            // Gender indicator star/heart
            x.font = '14px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
            x.fillText(gender === 'female' ? '♀' : '♂', 50, 10);
        }

        window.addEventListener('load', () => {
            drawCharPreview('prevMale', 'male');
            drawCharPreview('prevFemale', 'female');
        });
