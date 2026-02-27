        // ═══════════════════════════════════════════════════════
        //  TITLE SCREEN PARTICLES
        // ═══════════════════════════════════════════════════════
        function createParticles() {
            const container = document.getElementById('particles');
            if (!container) return;
            for (let i = 0; i < 28; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                const size = 2 + Math.random() * 5;
                const colors = ['#d4a017', '#e8701a', '#6bcf9f', '#f2e8d0', '#e8c840'];
                p.style.cssText = `width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}%;bottom:${-10 - Math.random() * 20}%;
      animation-duration:${6 + Math.random() * 10}s;animation-delay:${Math.random() * 8}s;
      box-shadow:0 0 ${size * 2}px currentColor`;
                container.appendChild(p);
            }
        }
        createParticles();

        // ═══════════════════════════════════════════════════════
        //  GAME STATE
        // ═══════════════════════════════════════════════════════
        var G = {
            char: 'male', name: 'राम बहादुर', phase: 'queue',
            inkApplied: false, idVerified: false, stamped: 0, stampedParty: 0, foldVertical: null, correctBox: null,
            dlgActive: false, triggered: false, running: false,
            px: 3, py: 9,
            pxPx: 0, pyPx: 0,
            animT: 0,
        };
