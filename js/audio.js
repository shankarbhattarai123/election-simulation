        // ═══════════════════════════════════════════════════════
        //  AUDIO
        // ═══════════════════════════════════════════════════════
        const AC = new (window.AudioContext || window.webkitAudioContext)();
        let muted = false;
        function tone(f, t = 'sine', d = 0.14, v = 0.18, delay = 0) {
            if (muted) return;
            try {
                const o = AC.createOscillator(), g = AC.createGain(); o.connect(g); g.connect(AC.destination);
                o.type = t; o.frequency.setValueAtTime(f, AC.currentTime + delay);
                g.gain.setValueAtTime(0, AC.currentTime + delay);
                g.gain.linearRampToValueAtTime(v, AC.currentTime + delay + 0.01);
                g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + delay + d);
                o.start(AC.currentTime + delay); o.stop(AC.currentTime + delay + d + 0.05);
            } catch (e) { }
        }
        const playClick = () => tone(900, 'square', 0.055, 0.1);
        const playStep = () => tone(180 + Math.random() * 50, 'sine', 0.06, 0.07);
        const playStamp = () => { tone(180, 'sawtooth', 0.09, 0.22); tone(440, 'square', 0.06, 0.14, 0.07); tone(920, 'sine', 0.09, 0.08, 0.12) };
        const playSuccess = () => [523, 659, 784, 988, 1047].forEach((f, i) => tone(f, 'sine', 0.18, 0.13, i * 0.09));
        const playFail = () => [280, 200, 140].forEach((f, i) => tone(f, 'sawtooth', 0.22, 0.18, i * 0.13));
        const playChime = () => [800, 1050, 1280].forEach((f, i) => tone(f, 'sine', 0.28, 0.09, i * 0.09));
        function toggleMute() { muted = !muted; document.getElementById('muteLabel').textContent = muted ? 'आवाज बन्द' : 'आवाज चालू'; }

        // ═══════════════════════════════════════════════════════
        //  ZONE TRIGGERS — defined in top-down world section below
        // ═══════════════════════════════════════════════════════

        // Ambient crowd hum
        let ambInterval;
        function startAmbient() {
            clearInterval(ambInterval);
            ambInterval = setInterval(() => { if (!muted && Math.random() < 0.25) tone(160 + Math.random() * 80, 'sine', 0.4 + Math.random() * 0.6, 0.012); }, 900);
        }
