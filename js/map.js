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

        // ── CANVAS INIT ──
        function initCanvas() {
            canvas = document.getElementById('gameCanvas');
            W = canvas.width = canvas.offsetWidth || window.innerWidth;
            H = canvas.height = canvas.offsetHeight || window.innerHeight;
            ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            // Init NPC world positions
            NPCS.forEach(npc => { npc.wx = npc.tx * TS; npc.wy = npc.ty * TS; npc.originX = npc.tx * TS; npc.originY = npc.ty * TS; });
            centerCam();
        }

        function centerCam() {
            camX = G.pxPx - W / 2 + TS / 2;
            camY = G.pyPx - H / 2 + TS / 2;
        }

        // World pixel position of tile
        function tileXY(tx, ty) {
            return { x: tx * TS, y: ty * TS };
        }

        // ── PIXEL ART DRAW HELPERS ──

        function drawTile(tx, ty) {
            const tid = TILEMAP[ty]?.[tx];
            if (tid === undefined) return;
            const wx = tx * TS - camX;
            const wy = ty * TS - camY;
            if (wx > W + TS || wx < -TS || wy > H + TS || wy < -TS) return; // cull off-screen

            const cols = TILE_COLORS[tid] || ['#888', '#666'];
            // Checkerboard shading
            const shade = (tx + ty) % 2 === 0;
            ctx.fillStyle = shade ? cols[0] : cols[1];
            ctx.fillRect(wx, wy, TS, TS);

            // Water animation
            if (tid === 4) {
                const wave = Math.sin(G.animT * 2 + (tx + ty) * 0.8) * 0.3 + 0.3;
                ctx.fillStyle = `rgba(180,230,255,${wave * 0.4})`;
                ctx.fillRect(wx + 2, wy + TS * 0.3, TS - 4, TS * 0.25);
                ctx.fillStyle = `rgba(180,230,255,${wave * 0.25})`;
                ctx.fillRect(wx + 4, wy + TS * 0.6, TS - 8, TS * 0.2);
            }

            // Tall grass details
            if (tid === 6) {
                ctx.fillStyle = 'rgba(0,80,0,0.35)';
                ctx.fillRect(wx + 4, wy + 4, 4, TS - 8);
                ctx.fillRect(wx + TS - 8, wy + 6, 4, TS - 10);
                ctx.fillRect(wx + TS / 2 - 2, wy + 2, 4, TS - 6);
            }

            // Flower dots on tile type 7
            if (tid === 7) {
                const fc = ['#ff6080', '#ffcc20', '#ff80a0', '#80ffcc'];
                [[4, 6], [TS - 8, 10], [TS / 2 - 2, TS - 10], [8, TS - 8], [TS - 6, TS - 6]].forEach(([fx, fy], i) => {
                    ctx.fillStyle = fc[i % fc.length];
                    ctx.fillRect(wx + fx, wy + fy, 3, 3);
                });
            }

            // Concrete grid lines
            if (tid === 3 || tid === 5) {
                ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
                ctx.strokeRect(wx, wy, TS, TS);
            }
        }

        function drawTree(tx, ty) {
            const wx = tx * TS - camX, wy = ty * TS - camY;
            if (wx > W + TS || wx < -TS || wy > H + TS || wy < -TS) return;
            const bob = Math.sin(G.animT * 1.2 + (tx + ty) * 0.6) * 1;
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.beginPath(); ctx.ellipse(wx + TS / 2, wy + TS - 4, TS * 0.35, TS * 0.12, 0, 0, Math.PI * 2); ctx.fill();
            // Trunk
            ctx.fillStyle = '#7a5020'; ctx.fillRect(wx + TS * 0.4, wy + TS * 0.55, TS * 0.2, TS * 0.45);
            // Dark leaf cluster bottom
            ctx.fillStyle = '#306828';
            ctx.beginPath(); ctx.ellipse(wx + TS / 2, wy + TS * 0.45 + bob, TS * 0.45, TS * 0.38, 0, 0, Math.PI * 2); ctx.fill();
            // Main green cluster
            ctx.fillStyle = '#50a838';
            ctx.beginPath(); ctx.ellipse(wx + TS / 2, wy + TS * 0.3 + bob, TS * 0.4, TS * 0.36, 0, 0, Math.PI * 2); ctx.fill();
            // Highlight cluster
            ctx.fillStyle = '#68c048';
            ctx.beginPath(); ctx.ellipse(wx + TS / 2 - 3, wy + TS * 0.2 + bob, TS * 0.22, TS * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        }

        function drawPalmTree(tx, ty) {
            const wx = tx * TS - camX, wy = ty * TS - camY;
            if (wx > W + TS || wx < -TS || wy > H + TS || wy < -TS) return;
            const sway = Math.sin(G.animT * 1.5 + (tx) * 0.8) * 2;
            ctx.fillStyle = '#a07030'; ctx.fillRect(wx + TS / 2 - 3, wy + 8, 6, TS - 8);
            const frondColors = ['#58b828', '#48a018', '#68c838'];
            [[-1, -1], [1, -1], [0, -1.3], [-1.3, 0], [1.3, 0]].forEach(([dx, dy], i) => {
                ctx.fillStyle = frondColors[i % 3];
                ctx.beginPath();
                ctx.ellipse(wx + TS / 2 + dx * 12 + sway, wy + 10 + dy * 10, 12, 5, Math.atan2(dy, dx), 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function drawBuilding(tx, ty, cols, roofW, roofH, label, labelColor) {
            // Simple top-down building — flat-top view
            const wx = tx * TS - camX, wy = ty * TS - camY;
            const [wallC, roofC, darkC] = cols;
            const bw = roofW * TS, bh = roofH * TS;
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(wx + 6, wy + 6, bw, bh);
            // Wall (seen from top)
            ctx.fillStyle = wallC; ctx.fillRect(wx, wy, bw, bh);
            // Roof color overlay (top strip)
            ctx.fillStyle = roofC; ctx.fillRect(wx, wy, bw, TS * 0.5);
            // Dark border
            ctx.strokeStyle = darkC; ctx.lineWidth = 2; ctx.strokeRect(wx + 1, wy + 1, bw - 2, bh - 2);
            // Door (bottom center)
            const dc = wx + bw / 2 - TS * 0.15;
            ctx.fillStyle = '#5a3010'; ctx.fillRect(dc, wy + bh - TS * 0.55, TS * 0.3, TS * 0.5);
            ctx.fillStyle = '#d4a017'; ctx.fillRect(dc + TS * 0.2, wy + bh - TS * 0.32, 4, 4); // handle
            // Windows
            [[0.2, 0.35], [0.6, 0.35], [0.4, 0.6]].forEach(([fx, fy]) => {
                ctx.fillStyle = '#90d8f0'; ctx.fillRect(wx + bw * fx, wy + bh * fy, TS * 0.18, TS * 0.18);
                ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 1; ctx.strokeRect(wx + bw * fx, wy + bh * fy, TS * 0.18, TS * 0.18);
                ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath();
                ctx.moveTo(wx + bw * fx + TS * 0.09, wy + bh * fy); ctx.lineTo(wx + bw * fx + TS * 0.09, wy + bh * fy + TS * 0.18); ctx.stroke();
            });
            if (label) {
                ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(wx + bw / 2 - ctx.measureText(label).width / 2 - 3, wy - 15, ctx.measureText(label).width + 6, 13);
                ctx.fillStyle = labelColor || '#fff'; ctx.fillText(label, wx + bw / 2, wy - 3);
            }
        }

        function drawPollingStation() {
            // Building facade: spans cols 4-14 (11 tiles wide), exterior seen at row 3 only
            const bx = 4 * TS - camX, by = 3 * TS - camY;
            const PW = 11 * TS, PH = TS * 1.5;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(bx + 8, by + 8, PW, PH + TS);
            // Wall
            ctx.fillStyle = '#f0ede0'; ctx.fillRect(bx, by, PW, PH);
            // Red roof strip
            ctx.fillStyle = '#d43020'; ctx.fillRect(bx, by, PW, TS * 0.6);
            ctx.fillStyle = '#b82010'; ctx.fillRect(bx, by + TS * 0.28, PW, 5);
            // Tile texture
            ctx.strokeStyle = 'rgba(80,0,0,0.15)'; ctx.lineWidth = 1;
            for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.moveTo(bx + i * TS * 0.7, by); ctx.lineTo(bx + i * TS * 0.7, by + TS * 0.6); ctx.stroke(); }
            for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bx, by + i * TS * 0.15 + 5); ctx.lineTo(bx + PW, by + i * TS * 0.15 + 5); ctx.stroke(); }
            ctx.strokeStyle = '#c0b090'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, PW, PH);

            // Red cross emblem center
            const cx2 = bx + PW / 2, cy2 = by + TS;
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(cx2, cy2, TS * 0.48, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#e01020'; ctx.fillRect(cx2 - 5, cy2 - 12, 10, 24); ctx.fillRect(cx2 - 12, cy2 - 5, 24, 10);

            // Nepal flag
            const fpx = bx + PW * 0.5 - TS * 1.2, fpy = by - TS * 0.5;
            ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fpx, fpy); ctx.lineTo(fpx, by + TS * 0.55); ctx.stroke();
            ctx.fillStyle = '#003893'; ctx.beginPath(); ctx.moveTo(fpx, fpy); ctx.lineTo(fpx + 18, fpy + 5); ctx.lineTo(fpx + 14, fpy + 12); ctx.lineTo(fpx, fpy + 8); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#dc143c'; ctx.beginPath(); ctx.moveTo(fpx + 1, fpy + 1); ctx.lineTo(fpx + 15, fpy + 6); ctx.lineTo(fpx + 11, fpy + 11); ctx.lineTo(fpx + 1, fpy + 7); ctx.closePath(); ctx.fill();

            // Windows
            [[0.08, 0.42], [0.2, 0.42], [0.76, 0.42], [0.88, 0.42]].forEach(([fx, fy]) => {
                ctx.fillStyle = '#90d8f0'; ctx.fillRect(bx + PW * fx, by + PH * fy, TS * 0.22, TS * 0.28);
                ctx.strokeStyle = '#8a6040'; ctx.lineWidth = 1; ctx.strokeRect(bx + PW * fx, by + PH * fy, TS * 0.22, TS * 0.28);
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(bx + PW * fx + 2, by + PH * fy + 2, TS * 0.09, TS * 0.12);
            });

            // Entrance door + pillars (bottom center)
            const dx = bx + PW / 2 - TS * 0.5, dy = by + PH - TS * 0.7;
            ctx.fillStyle = '#d8ceb0'; ctx.fillRect(dx - 12, dy - 10, 10, TS * 0.75); ctx.fillRect(dx + TS + 3, dy - 10, 10, TS * 0.75);
            ctx.fillStyle = '#5080c0'; ctx.fillRect(dx, dy, TS, TS * 0.7);
            ctx.fillStyle = 'rgba(180,220,255,0.45)'; ctx.fillRect(dx + 3, dy + 2, TS * 0.44, TS * 0.65); ctx.fillRect(dx + TS * 0.54, dy + 2, TS * 0.43, TS * 0.65);
            ctx.strokeStyle = '#3060a0'; ctx.lineWidth = 1; ctx.strokeRect(dx, dy, TS, TS * 0.7);

            // Banner
            ctx.font = 'bold 9px "Tiro Devanagari Hindi",serif'; ctx.textAlign = 'center';
            const lbl = 'मतदान केन्द्र — वडा ४';
            const lw = ctx.measureText(lbl).width + 12;
            ctx.fillStyle = '#2d6a4f'; ctx.fillRect(bx + PW / 2 - lw / 2, by + PH * 0.62, lw, 15);
            ctx.fillStyle = '#f0e8c0'; ctx.fillText(lbl, bx + PW / 2, by + PH * 0.72);
        }

        function drawShop(tx, ty) {
            const wx = tx * TS - camX, wy = ty * TS - camY;
            const sw = 3 * TS, sh = 2.5 * TS;
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(wx + 5, wy + 5, sw, sh);
            ctx.fillStyle = '#e0d0b0'; ctx.fillRect(wx, wy, sw, sh);
            // Blue awning
            ctx.fillStyle = '#3070e0'; ctx.fillRect(wx, wy, sw, sh * 0.3);
            ctx.strokeStyle = '#1050c0'; ctx.lineWidth = 2; ctx.strokeRect(wx, wy, sw, sh);
            // Awning scallop
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = '#2060d0';
                ctx.beginPath(); ctx.arc(wx + i * sw / 4 + sw / 8, wy + sh * 0.3, sw / 8, 0, Math.PI); ctx.fill();
            }
            // SHOP sign
            ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
            ctx.fillStyle = '#fff'; ctx.fillText('SHOP', wx + sw / 2, wy + sh * 0.2);
            // Window
            ctx.fillStyle = '#b0e8ff'; ctx.fillRect(wx + sw * 0.1, wy + sh * 0.4, sw * 0.35, sh * 0.35);
            ctx.fillStyle = '#80c8e8'; ctx.fillRect(wx + sw * 0.55, wy + sh * 0.4, sw * 0.35, sh * 0.35);
            ctx.strokeStyle = '#6a4020'; ctx.lineWidth = 1;
            ctx.strokeRect(wx + sw * 0.1, wy + sh * 0.4, sw * 0.35, sh * 0.35);
            ctx.strokeRect(wx + sw * 0.55, wy + sh * 0.4, sw * 0.35, sh * 0.35);
        }

        function drawFountain(tx, ty) {
            const wx = tx * TS - camX + TS / 2, wy = ty * TS - camY + TS / 2;
            const t = G.animT;
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(wx, wy, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#80b0e0'; ctx.beginPath(); ctx.ellipse(wx, wy, 20, 13, 0, 0, Math.PI * 2); ctx.fill();
            // Water shimmer
            for (let i = 0; i < 5; i++) {
                const a = i / 5 * Math.PI * 2 + t * 0.8;
                ctx.fillStyle = `rgba(180,220,255,${0.5 + Math.sin(t * 3 + i) * 0.3})`;
                ctx.beginPath(); ctx.ellipse(wx + Math.cos(a) * 10, wy + Math.sin(a) * 6, 4, 2.5, a, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = '#a0c8e8'; ctx.beginPath(); ctx.arc(wx, wy, 5, 0, Math.PI * 2); ctx.fill();
        }

        function drawZoneMarker(tx, ty, color, label) {
            const wx = tx * TS - camX, wy = ty * TS - camY;
            const cx = wx + TS / 2, cy = wy + TS / 2;
            const pulse = Math.sin(G.animT * 3) * 0.4 + 0.6;

            // Glowing floor tile under zone
            ctx.save();
            ctx.globalAlpha = pulse * 0.45;
            ctx.fillStyle = color;
            ctx.fillRect(wx + 2, wy + 2, TS - 4, TS - 4);
            ctx.globalAlpha = 1;

            // Pulsing rings
            ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = pulse * 0.8;
            ctx.beginPath(); ctx.arc(cx, cy, TS * 0.42, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = pulse * 0.35; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(cx, cy, TS * 0.6, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1;

            // Bouncing arrow above
            const ay = wy - TS * 0.5 + Math.sin(G.animT * 4) * 5;
            ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowColor = color; ctx.shadowBlur = 10;
            ctx.fillStyle = color; ctx.fillText('▼', cx, ay);
            ctx.shadowBlur = 0;

            // Label badge
            ctx.font = 'bold 8px "Tiro Devanagari Hindi",serif'; ctx.textBaseline = 'top';
            const lw = ctx.measureText(label).width + 10;
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(cx - lw / 2, ay + 14, lw, 14);
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(cx - lw / 2, ay + 14, lw, 14);
            ctx.fillStyle = color; ctx.fillText(label, cx, ay + 17);
            ctx.restore();
        }
