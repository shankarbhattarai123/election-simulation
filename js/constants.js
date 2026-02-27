        function createParticles() {
            const container = document.getElementById('particles');
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
        const G = {
            char: 'male', name: 'राम बहादुर', phase: 'queue',
            inkApplied: false, idVerified: false, stamped: 0, stampedParty: 0, foldVertical: null, correctBox: null,
            dlgActive: false, triggered: false, running: false,
            px: 3, py: 9,
            pxPx: 0, pyPx: 0,
            animT: 0,
        };

        // ═══════════════════════════════════════════════════════
        //  POKEMON-STYLE TOP-DOWN WORLD — 20x16 MAP
        //  Tile size: 32x32px pixel art
        //  Tiles: 0=light grass,1=dark grass,2=sand path,3=pavement,
        //         4=water,5=floor tile,8=wall(blocked),9=tree(blocked)
        // ═══════════════════════════════════════════════════════

        const TS = 32; // tile size in pixels
        let canvas, ctx, W, H;
        let camX = 0, camY = 0;

        // ── MAP KEY ──
        // 0=grass light, 1=grass dark, 2=path/sand, 3=pavement,
        // 4=water, 5=indoor floor, 6=tall grass, 7=flowers,
        // 9=tree(blocked), W=wall(blocked)
        // 22 cols × 18 rows
        // Player starts at bottom (col 10, row 16), walks UP through path
        // into the polling station building (indoor floor tiles rows 4-11)
        // Flow: Enter → ID desk (row 11) → Booth (row 7) → Box (row 8) → Ink (row 5) → Exit

        const W_ = 1; // wall/blocked shorthand

        const TILEMAP = [
            //  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21
            [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], // 0
            [9, 1, 1, 1, 6, 6, 6, 1, 1, 1, 1, 1, 1, 6, 6, 6, 1, 1, 1, 9, 9, 9], // 1
            [9, 1, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 1, 9, 9, 9], // 2
            [9, 1, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 1, 9, 9, 9], // 3
            [9, 1, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 1, 9, 9, 9], // 4 top of building
            [9, 1, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 1, 9, 9, 9], // 5 ink row
            [9, 1, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 1, 9, 9, 9], // 6
            [9, 1, 0, 7, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 7, 0, 0, 1, 9, 9, 9], // 7 booth row
            [9, 1, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 1, 9, 9, 9], // 8 box row
            [9, 1, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 1, 9, 9, 9], // 9
            [9, 1, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 1, 9, 9, 9], // 10
            [9, 1, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 1, 9, 9, 9], // 11 ID desk row
            [9, 1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1, 9, 9, 9], // 12 entrance corridor
            [9, 1, 0, 9, 0, 0, 0, 0, 2, 2, 2, 0, 0, 9, 0, 0, 0, 0, 1, 9, 9, 9], // 13
            [9, 1, 0, 0, 0, 7, 0, 0, 2, 2, 2, 0, 7, 0, 0, 0, 0, 0, 1, 9, 9, 9], // 14
            [9, 1, 1, 1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 1, 1, 9, 9, 9, 9, 9, 9], // 15
            [9, 9, 4, 4, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 4, 4, 9, 9, 9, 9, 9, 9], // 16 start row (water sides)
            [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], // 17
        ];

        // Walkable: 0=can walk, 1=blocked
        const WALK = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ];
        const ROWS = WALK.length, COLS = WALK[0].length;

        // ── TILE PALETTES ──
        const TILE_COLORS = {
            0: ['#78c850', '#68b840'],
            1: ['#50a030', '#408820'],
            2: ['#d8b868', '#c8a858'],
            3: ['#c8c0a8', '#b8b098'],
            4: ['#48a8e8', '#3898d8'],
            5: ['#d8cca8', '#c8bc98'],  // warm indoor floor
            6: ['#58a838', '#489028'],
            7: ['#78c850', '#68b840'],
            9: ['#285018', '#1e3e12'],
        };

        // ── BUILDING FOOTPRINT (tiles that are "inside") ──
        // Rows 4-11, cols 4-14 = indoor floor
        function isInsideBooth() {
            return G.py >= 4 && G.py <= 11 && G.px >= 4 && G.px <= 14;
        }

        // ── ZONE MARKERS ──
        // All zones are on walkable indoor floor tiles
        // ID desk:  row 11, col 9  (bottom of interior - first thing you reach)
        // Booth:    row 7,  col 9  (mid interior)
        // Box:      row 8,  col 12 (right side)
        // Ink:      row 5,  col 6  (upper left of interior)
        const ZONES = [
            { tx: 9, ty: 12, phase: 'queue', event: 'id', label: 'परिचय डेस्क', color: '#f0a020' },
            { tx: 9, ty: 7, phase: 'post-id', event: 'ballot', label: 'मत बुथ', color: '#4080e0' },
            { tx: 12, ty: 8, phase: 'post-ballot', event: 'box', label: 'मतपेटिका', color: '#40a060' },
            { tx: 6, ty: 5, phase: 'post-box', event: 'ink', label: 'मसी केन्द्र', color: '#9040d0' },
        ];

        // ── NPCs ──
        const NPCS = [
            { tx: 3, ty: 4, color: '#e040a0', hat: '#8020c0', walkR: 1.2, dir: 0, phase: 0 },
            { tx: 12, ty: 5, color: '#40a0e0', hat: '#206080', walkR: 0.8, dir: 2, phase: 1 },
            { tx: 4, ty: 12, color: '#e08040', hat: '#804020', walkR: 1.5, dir: 1, phase: 2 },
            { tx: 11, ty: 13, color: '#60c060', hat: '#306030', walkR: 0, dir: 3, phase: 0 },
            { tx: 7, ty: 3, color: '#c0c040', hat: '#606020', walkR: 0, dir: 0, phase: 1 },
            { tx: 6, ty: 11, color: '#d04040', hat: '#801818', walkR: 0.6, dir: 2, phase: 3 },
        ];
