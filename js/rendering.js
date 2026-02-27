
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

        function drawNPC(npc, t) {
            const wx = npc.wx - camX, wy = npc.wy - camY;
            if (Math.abs(wx) > W + TS || Math.abs(wy) > H + TS) return;
            const bob = npc.walkR > 0 ? Math.sin(t * 3 + npc.phase) * 1.5 : 0;
            const legSwing = npc.walkR > 0 ? Math.sin(t * 5 + npc.phase) * 3 : 0;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath();
            ctx.ellipse(wx + TS / 2, wy + TS * 0.88, 7, 3, 0, 0, Math.PI * 2); ctx.fill();

            // Legs (pixel art style)
            ctx.fillStyle = shadeCol(npc.color, -40);
            ctx.fillRect(wx + TS / 2 - 5, wy + TS * 0.65 + bob, 4, 10 + legSwing * 0.4);
            ctx.fillRect(wx + TS / 2 + 1, wy + TS * 0.65 + bob, 4, 10 - legSwing * 0.4);

            // Shoes
            ctx.fillStyle = '#2a1810';
            ctx.fillRect(wx + TS / 2 - 7, wy + TS * 0.78 + bob + legSwing * 0.3, 6, 4);
            ctx.fillRect(wx + TS / 2 + 1, wy + TS * 0.78 + bob - legSwing * 0.3, 6, 4);

            // Body
            ctx.fillStyle = npc.color; ctx.fillRect(wx + TS / 2 - 7, wy + TS * 0.35 + bob, 14, TS * 0.32);

            // Arms
            ctx.fillStyle = shadeCol(npc.color, -20);
            ctx.fillRect(wx + TS / 2 - 11, wy + TS * 0.37 + bob, 4, TS * 0.22);
            ctx.fillRect(wx + TS / 2 + 7, wy + TS * 0.37 + bob, 4, TS * 0.22);

            // Head (skin)
            ctx.fillStyle = '#f0c890'; ctx.fillRect(wx + TS / 2 - 6, wy + TS * 0.12 + bob, 12, 12);
            // Hair/hat
            ctx.fillStyle = npc.hat; ctx.fillRect(wx + TS / 2 - 7, wy + TS * 0.08 + bob, 14, 7);
            // Eyes
            ctx.fillStyle = '#201808';
            ctx.fillRect(wx + TS / 2 - 3, wy + TS * 0.18 + bob, 3, 3);
            ctx.fillRect(wx + TS / 2 + 1, wy + TS * 0.18 + bob, 3, 3);
        }

        function drawPlayer() {
            const wx = G.pxPx - camX, wy = G.pyPx - camY;
            const t = G.animT;
            const walking = isWalking;
            const bob = walking ? Math.sin(t * 6) * 2 : Math.sin(t * 1.5) * 0.5;
            const legSwing = walking ? Math.sin(t * 6) * 4 : 0;
            const sway = walking ? Math.sin(t * 6 + 1) * 1.5 : 0;
            const bodyColor = G.char === 'female' ? '#e04080' : '#3868c8';
            const hatColor = G.char === 'female' ? '#901040' : '#1840a0';

            // Walking dust
            if (walking && Math.random() < 0.25) {
                DUST.push({ x: wx + TS / 2 + (Math.random() - 0.5) * 8, y: wy + TS * 0.85, vy: -0.5, vx: (Math.random() - 0.5) * 0.6, life: 1, size: 3 + Math.random() * 2 });
            }

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath();
            ctx.ellipse(wx + TS / 2, wy + TS * 0.9, 9 + (walking ? 2 : 0), 4, 0, 0, Math.PI * 2); ctx.fill();

            // Legs
            ctx.fillStyle = shadeCol(bodyColor, -45);
            ctx.fillRect(wx + TS / 2 - 5 + sway * 0.3, wy + TS * 0.65 + bob, 5, 12 + legSwing * 0.4);
            ctx.fillRect(wx + TS / 2 + 1 + sway * 0.3, wy + TS * 0.65 + bob, 5, 12 - legSwing * 0.4);

            // Shoes
            ctx.fillStyle = '#2a1810';
            ctx.fillRect(wx + TS / 2 - 7 + sway * 0.2, wy + TS * 0.8 + bob + legSwing * 0.4, 7, 5);
            ctx.fillRect(wx + TS / 2 + 1 + sway * 0.2, wy + TS * 0.8 + bob - legSwing * 0.4, 7, 5);

            // Body
            ctx.fillStyle = bodyColor; ctx.fillRect(wx + TS / 2 - 8 + sway, wy + TS * 0.33 + bob, 16, TS * 0.35);

            // Arms (swing when walking)
            ctx.fillStyle = shadeCol(bodyColor, -15);
            ctx.fillRect(wx + TS / 2 - 12 + sway, wy + TS * 0.36 + bob + legSwing * 0.5, 4, TS * 0.25);
            ctx.fillRect(wx + TS / 2 + 8 + sway, wy + TS * 0.36 + bob - legSwing * 0.5, 4, TS * 0.25);

            // Ink on finger
            if (G.inkApplied) {
                ctx.fillStyle = '#7020c0'; ctx.beginPath();
                ctx.arc(wx + TS / 2 + 12 + sway, wy + TS * 0.52 + bob, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(160,60,255,0.45)'; ctx.beginPath();
                ctx.arc(wx + TS / 2 + 12 + sway, wy + TS * 0.52 + bob, 8, 0, Math.PI * 2); ctx.fill();
            }

            // Head
            ctx.fillStyle = '#f0c890'; ctx.fillRect(wx + TS / 2 - 7 + sway * 0.4, wy + TS * 0.09 + bob, 14, 13);
            // Hair/hat
            ctx.fillStyle = hatColor; ctx.fillRect(wx + TS / 2 - 8 + sway * 0.4, wy + TS * 0.04 + bob, 16, 8);
            // Hat brim
            ctx.fillStyle = shadeCol(hatColor, -10); ctx.fillRect(wx + TS / 2 - 10 + sway * 0.4, wy + TS * 0.09 + bob, 20, 4);
            // Eyes
            ctx.fillStyle = '#201808';
            ctx.fillRect(wx + TS / 2 - 4 + sway * 0.2, wy + TS * 0.17 + bob, 3, 3);
            ctx.fillRect(wx + TS / 2 + 2 + sway * 0.2, wy + TS * 0.17 + bob, 3, 3);

            // Name tag
            ctx.font = 'bold 8px "Share Tech Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            const ntw = ctx.measureText(G.name).width + 10;
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(wx + TS / 2 - ntw / 2, wy - 16, ntw, 13);
            ctx.strokeStyle = 'rgba(212,160,23,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(wx + TS / 2 - ntw / 2, wy - 16, ntw, 13);
            ctx.fillStyle = '#d4c020'; ctx.fillText(G.name, wx + TS / 2, wy - 4);
        }

        function shadeCol(hexOrRgb, amt) {
            const el = document.createElement('canvas').getContext('2d');
            el.fillStyle = hexOrRgb;
            const v = el.fillStyle;
            const r = parseInt(v.slice(1, 3), 16), g = parseInt(v.slice(3, 5), 16), b = parseInt(v.slice(5, 7), 16);
            return `rgb(${Math.max(0, Math.min(255, r + amt))},${Math.max(0, Math.min(255, g + amt))},${Math.max(0, Math.min(255, b + amt))})`;
        }

        const DUST = [];
        function updateDust() {
            for (let i = DUST.length - 1; i >= 0; i--) {
                const d = DUST[i]; d.x += d.vx; d.y += d.vy; d.life -= 0.05; d.vy *= 0.9;
                if (d.life <= 0) { DUST.splice(i, 1); continue; }
                ctx.beginPath(); ctx.arc(d.x, d.y, d.size * d.life, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,180,140,${d.life * 0.4})`; ctx.fill();
            }
        }

        // NPC wandering logic
        function updateNPCs(dt) {
            const t = performance.now() / 1000;
            NPCS.forEach(npc => {
                if (npc.walkR <= 0) return;
                const ox = npc.originX || (npc.originX = npc.tx * TS);
                const oy = npc.originY || (npc.originY = npc.ty * TS);
                npc.wx = (ox + Math.sin(t * npc.walkR + npc.phase) * TS * 1.2) | 0;
                npc.wy = (oy + Math.cos(t * npc.walkR * 0.7 + npc.phase) * TS * 0.8) | 0;
            });
            NPCS.forEach(npc => {
                if (!npc.wx) npc.wx = npc.tx * TS;
                if (!npc.wy) npc.wy = npc.ty * TS;
            });
        }

        // ── BFS PATHFINDING ──
        // Returns array of {x,y} tile steps from player to target (up to maxSteps)
        function bfsPath(sx, sy, tx, ty, maxSteps = 20) {
            if (sx === tx && sy === ty) return [];
            const visited = new Set();
            const queue = [{ x: sx, y: sy, path: [] }];
            visited.add(`${sx},${sy}`);
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            while (queue.length) {
                const { x, y, path } = queue.shift();
                for (const [dx, dy] of dirs) {
                    const nx = x + dx, ny = y + dy;
                    const key = `${nx},${ny}`;
                    if (visited.has(key)) continue;
                    if (WALK[ny]?.[nx] !== 0) continue;
                    visited.add(key);
                    const newPath = [...path, { x: nx, y: ny }];
                    if (nx === tx && ny === ty) return newPath.slice(0, maxSteps);
                    queue.push({ x: nx, y: ny, path: newPath });
                }
            }
            return [];
        }

        // ── PATH ARROW TRAIL ──
        function drawPathArrows(zone) {
            if (!zone) return;
            const path = bfsPath(G.px, G.py, zone.tx, zone.ty, 12);
            if (!path.length) return;
            path.forEach((s, i) => {
                const wx = s.x * TS - camX + TS / 2;
                const wy = s.y * TS - camY + TS / 2;
                if (wx < -TS || wx > W + TS || wy < -TS || wy > H + TS) return;
                const progress = i / path.length;
                const alpha = (1 - progress * 0.7) * 0.85;
                const pulse = Math.sin(G.animT * 5 - i * 0.8) * 0.2 + 0.8;
                ctx.save();
                ctx.globalAlpha = alpha * pulse;
                // Glowing footprint circle
                ctx.shadowColor = zone.color; ctx.shadowBlur = 8;
                ctx.fillStyle = zone.color;
                ctx.beginPath(); ctx.arc(wx, wy, i === 0 ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                // Arrow chevron between steps
                if (i < path.length - 1) {
                    const ns = path[i + 1];
                    const nx2 = ns.x * TS - camX + TS / 2;
                    const ny2 = ns.y * TS - camY + TS / 2;
                    const angle = Math.atan2(ny2 - wy, nx2 - wx);
                    ctx.translate(wx, wy); ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(10, 0); ctx.lineTo(4, -4); ctx.lineTo(6, 0); ctx.lineTo(4, 4);
                    ctx.closePath(); ctx.fill();
                }
                ctx.restore();
            });
        }

        // ── INDOOR ROOM OVERLAY ──
        // Draw interior of polling station when player is inside
        function drawIndoorRoom() {
            // Semi-transparent ceiling overlay — hides exterior building sprite
            const bx = 4 * TS - camX, by = 4 * TS - camY;
            const bw = 11 * TS, bh = 8 * TS;

            // Warm indoor lighting
            const indoorLight = ctx.createRadialGradient(bx + bw / 2, by + bh / 2, 10, bx + bw / 2, by + bh / 2, bw * 0.7);
            indoorLight.addColorStop(0, 'rgba(255,240,200,0.12)');
            indoorLight.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = indoorLight; ctx.fillRect(bx, by, bw, bh);

            // Building walls (top and sides)
            ctx.fillStyle = '#b8a878'; ctx.fillRect(bx - 4, by - 8, bw + 8, 10);       // top wall
            ctx.fillStyle = '#a09060'; ctx.fillRect(bx - 4, by, 4, bh);             // left wall
            ctx.fillStyle = '#a09060'; ctx.fillRect(bx + bw, by, 4, bh);            // right wall

            // Wall stripe / baseboard
            ctx.fillStyle = 'rgba(100,80,40,0.4)';
            ctx.fillRect(bx, by, bw, 4);

            // ── FURNITURE ──

            // ID DESK — row 11, cols 8-10  (bottom of indoor area)
            drawDesk(8, 11, 'परिचय डेस्क ✓', '#d4b060', 2.5);

            // VOTING BOOTHS — row 7, cols 6 and 11
            drawBooth(6, 7, '#1e3a8a');
            drawBooth(11, 7, '#1a4a20');

            // BALLOT BOXES — row 8, cols 11-12
            drawBallotBox(11, 8, '#2d6a4f', 'मत\nपेटिका');
            drawBallotBox(12, 8, '#444', 'अन्य');

            // INK STATION — row 5, col 5-6
            drawInkStation(5, 5);

            // Ceiling lights — decorative
            [[6, 4], [9, 4], [12, 4], [6, 8], [9, 8], [12, 8]].forEach(([c, r]) => {
                const lx = c * TS - camX + TS / 2, ly = r * TS - camY + TS / 2;
                const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 24);
                glow.addColorStop(0, 'rgba(255,240,180,0.35)');
                glow.addColorStop(1, 'rgba(255,240,180,0)');
                ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(lx, ly, 24, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff8d0'; ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
            });

            // ── POLICE GATE at row 12 (entrance checkpoint) ──
            const dfx = 8 * TS - camX, dfy = 12 * TS - camY;
            const gateOpen = G.idVerified;
            const gateColor = gateOpen ? '#20c040' : '#e02020';
            const gatePulse = Math.sin(G.animT * 4) * 0.3 + 0.7;

            // Gate posts (left and right of path cols 8-10)
            for (const px of [dfx - TS * 0.3, dfx + 3 * TS + TS * 0.05]) {
                // Post body
                ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px, dfy - TS * 0.8, 8, TS * 0.9);
                // Post cap
                ctx.fillStyle = '#555'; ctx.fillRect(px - 3, dfy - TS * 0.82, 14, 8);
                // Warning stripes
                for (let s = 0; s < 4; s++) {
                    ctx.fillStyle = s % 2 === 0 ? '#e8c020' : '#333';
                    ctx.fillRect(px, dfy - TS * 0.8 + s * TS * 0.18, 8, TS * 0.17);
                }
                // LED light on top
                ctx.fillStyle = `rgba(${gateOpen ? '0,220,60' : '220,20,20'},${gatePulse})`;
                ctx.beginPath(); ctx.arc(px + 4, dfy - TS * 0.85, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(px + 3, dfy - TS * 0.87, 2, 0, Math.PI * 2); ctx.fill();
            }

            // Horizontal gate bar
            const barY = dfy - TS * 0.45;
            if (!gateOpen) {
                // Closed barrier — red striped bar across path
                const barX = dfx - TS * 0.22, barW = 3 * TS + TS * 0.55;
                ctx.fillStyle = '#c01010'; ctx.fillRect(barX, barY, barW, 8);
                // Stripes on bar
                for (let s = 0; s < 8; s++) {
                    ctx.fillStyle = s % 2 === 0 ? 'rgba(255,255,255,0.25)' : 'transparent';
                    ctx.fillRect(barX + s * (barW / 8), barY, barW / 8, 8);
                }
                ctx.strokeStyle = 'rgba(255,50,50,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, 8);
                // STOP sign label
                ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(dfx + TS * 0.5, barY - 14, TS * 2, 13);
                ctx.strokeStyle = '#e02020'; ctx.lineWidth = 1; ctx.strokeRect(dfx + TS * 0.5, barY - 14, TS * 2, 13);
                ctx.fillStyle = '#ff4040'; ctx.fillText('परिचय प्रमाणीकरण आवश्यक', dfx + TS * 1.5, barY - 7);
                // Red glow around barrier
                const grd = ctx.createLinearGradient(dfx - TS * 0.22, barY - 10, dfx - TS * 0.22, barY + 20);
                grd.addColorStop(0, 'rgba(220,0,0,0)'); grd.addColorStop(0.5, `rgba(220,0,0,${0.12 * gatePulse})`); grd.addColorStop(1, 'rgba(220,0,0,0)');
                ctx.fillStyle = grd; ctx.fillRect(dfx - TS * 0.3, barY - 12, 3 * TS + TS * 0.7, 30);
            } else {
                // Open — green light, bar lifted (vertical)
                const postX = dfx - TS * 0.22;
                ctx.fillStyle = '#208040'; ctx.fillRect(postX, barY - TS * 0.6, 8, TS * 0.55);
                // Green glow
                ctx.shadowColor = '#00ff80'; ctx.shadowBlur = 12;
                ctx.fillStyle = 'rgba(0,255,80,0.15)'; ctx.fillRect(dfx, barY - 20, 3 * TS, 30);
                ctx.shadowBlur = 0;
                ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(dfx + TS * 0.5, barY - 14, TS * 2, 13);
                ctx.strokeStyle = '#20c040'; ctx.lineWidth = 1; ctx.strokeRect(dfx + TS * 0.5, barY - 14, TS * 2, 13);
                ctx.fillStyle = '#40ff80'; ctx.fillText('✓ परिचय प्रमाणित — प्रवेश गर्नुहोस्', dfx + TS * 1.5, barY - 7);
            }

            // Signs on walls
            drawSign(9, 4, 'मतदान केन्द्र', '#dc143c');
            drawSign(13, 6, '→ मतपेटिका', '#2d6a4f');
            drawSign(5, 6, '← मसी केन्द्र', '#6020a0');
        }

        function drawDesk(tx, ty, label, color, widthTiles) {
            const wx = tx * TS - camX, wy = ty * TS - camY;
            const dw = (widthTiles || 2) * TS;
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(wx + 4, wy + 6, dw, TS * 0.55);
            ctx.fillStyle = color || '#c8a060'; ctx.fillRect(wx, wy, dw, TS * 0.5);
            ctx.fillStyle = '#705018'; ctx.fillRect(wx, wy + TS * 0.5, dw, TS * 0.1);
            // Computer
            ctx.fillStyle = '#1a2a3a'; ctx.fillRect(wx + dw * 0.35, wy - TS * 0.45, TS * 0.55, TS * 0.4);
            ctx.fillStyle = '#3090c0'; ctx.fillRect(wx + dw * 0.37, wy - TS * 0.42, TS * 0.5, TS * 0.33);
            ctx.strokeStyle = '#504020'; ctx.lineWidth = 1.5; ctx.strokeRect(wx, wy, dw, TS * 0.5);
            // Label sign
            ctx.font = 'bold 7px "Tiro Devanagari Hindi",serif'; ctx.textAlign = 'center';
            const lw = ctx.measureText(label).width + 8;
            ctx.fillStyle = 'rgba(80,50,10,0.85)'; ctx.fillRect(wx + dw / 2 - lw / 2, wy + TS * 0.55, lw, 12);
            ctx.fillStyle = '#f0e0a0'; ctx.fillText(label, wx + dw / 2, wy + TS * 0.64);
        }

        function drawBooth(tx, ty, curtainColor) {
            const wx = tx * TS - camX, wy = ty * TS - camY;
            // Partition walls
            ctx.fillStyle = '#c8b470'; ctx.fillRect(wx - 2, wy - TS * 0.35, TS + 4, TS * 0.85);
            ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(wx + 2, wy - TS * 0.35, TS, TS * 0.85);
            // Curtain
            ctx.fillStyle = curtainColor; ctx.fillRect(wx + 3, wy - TS * 0.3, TS - 2, TS * 0.8);
            ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(wx + 3, wy - TS * 0.3, TS * 0.35, TS * 0.8);
            // Wood frame top
            ctx.fillStyle = '#a08040'; ctx.fillRect(wx - 2, wy - TS * 0.35, TS + 4, 6);
            ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,240,180,0.9)'; ctx.fillText('बुथ', wx + TS / 2, wy + TS * 0.25);
        }

        function drawBallotBox(tx, ty, color, label) {
            const wx = tx * TS - camX + 3, wy = ty * TS - camY + 2;
            const bw = TS - 6, bh = TS * 0.65;
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(wx + 4, wy + 5, bw, bh);
            ctx.fillStyle = color; ctx.fillRect(wx, wy, bw, bh);
            // 3D right face
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.moveTo(wx + bw, wy); ctx.lineTo(wx + bw + 6, wy - 4);
            ctx.lineTo(wx + bw + 6, wy + bh - 4); ctx.lineTo(wx + bw, wy + bh); ctx.closePath(); ctx.fill();
            // Slot
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(wx + bw * 0.25, wy + 2, bw * 0.5, 4);
            // Lock
            ctx.fillStyle = '#d4a017'; ctx.fillRect(wx + bw * 0.4, wy + bh * 0.55, bw * 0.2, bh * 0.3);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(wx, wy, bw, bh);
            ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center';
            ctx.fillStyle = '#fff'; ctx.fillText(label.split('\n')[0], wx + bw / 2, wy + bh * 0.42);
        }

        function drawInkStation(tx, ty) {
            const wx = tx * TS - camX, wy = ty * TS - camY;
            // Table
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(wx + 4, wy + 6, 2 * TS, TS * 0.5);
            ctx.fillStyle = '#b89050'; ctx.fillRect(wx, wy + 2, 2 * TS, TS * 0.45);
            ctx.fillStyle = '#906830'; ctx.fillRect(wx, wy + TS * 0.47, 2 * TS, TS * 0.08);
            // Ink pad box
            const px = wx + TS * 0.15, py = wy - TS * 0.3;
            ctx.fillStyle = '#3a0870'; ctx.beginPath(); ctx.roundRect(px, py, TS * 0.85, TS * 0.55, 4); ctx.fill();
            // Pad surface
            const velvet = ctx.createRadialGradient(px + TS * 0.4, py + TS * 0.25, 2, px + TS * 0.4, py + TS * 0.25, TS * 0.4);
            velvet.addColorStop(0, '#8040c0'); velvet.addColorStop(1, '#4010a0');
            ctx.fillStyle = velvet; ctx.beginPath(); ctx.roundRect(px + 4, py + 4, TS * 0.77, TS * 0.45, 2); ctx.fill();
            // Shimmer
            ctx.fillStyle = 'rgba(200,150,255,0.25)'; ctx.beginPath(); ctx.ellipse(px + TS * 0.3, py + TS * 0.18, TS * 0.18, TS * 0.1, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(160,80,255,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(px, py, TS * 0.85, TS * 0.55, 4); ctx.stroke();
            // Label
            ctx.font = 'bold 7px "Tiro Devanagari Hindi",serif'; ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(60,10,100,0.9)'; ctx.fillRect(wx + TS * 0.8 - 22, wy + TS * 0.5, 44, 12);
            ctx.fillStyle = '#d0a0ff'; ctx.fillText('मसी केन्द्र', wx + TS * 0.8, wy + TS * 0.6);
        }

        function drawSign(tx, ty, text, color) {
            const wx = tx * TS - camX, wy = ty * TS - camY;
            ctx.font = 'bold 7px "Tiro Devanagari Hindi",serif'; ctx.textAlign = 'center';
            const tw = ctx.measureText(text).width + 10;
            ctx.fillStyle = 'rgba(10,10,10,0.75)'; ctx.fillRect(wx - tw / 2, wy, tw, 13);
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(wx - tw / 2, wy, tw, 13);
            ctx.fillStyle = color; ctx.fillText(text, wx, wy + 10);
        }

        // ── MAIN RENDER ──
        function render() {
            if (!ctx) return;
            ctx.clearRect(0, 0, W, H);
            ctx.imageSmoothingEnabled = false;

            const t = G.animT;
            const indoor = isInsideBooth();

            // 1. Ground tiles
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    drawTile(c, r);
                }
            }

            // 2. Path arrows (on ground, before sprites)
            const nextZone = ZONES.find(z => z.phase === G.phase);
            if (nextZone && !G.triggered) {
                drawPathArrows(nextZone);
            }

            // 3. Sprites — painter's sort by Y
            const sprites = [];

            if (!indoor) {
                // OUTDOOR sprites only visible outside
                // Trees
                for (let r = 0; r < ROWS; r++) {
                    for (let c = 0; c < COLS; c++) {
                        if (TILEMAP[r][c] === 9) sprites.push({ sortY: r * TS + TS * 0.8, fn: () => drawTree(c, r) });
                    }
                }
                // Polling station building facade
                sprites.push({ sortY: 3.5 * TS, fn: () => drawPollingStation() });
                // Shop
                sprites.push({ sortY: 13 * TS, fn: () => drawShop(16, 10) });
                // Pond/fountain
                sprites.push({ sortY: 15 * TS, fn: () => drawFountain(5, 15) });
                // Palm trees
                sprites.push({ sortY: 14 * TS, fn: () => drawPalmTree(3, 14) });
                sprites.push({ sortY: 15 * TS, fn: () => drawPalmTree(14, 15) });
                // Gym building
                sprites.push({
                    sortY: 4 * TS, fn: () => {
                        const wx = 16 * TS - camX, wy = 2 * TS - camY;
                        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(wx + 5, wy + 5, 3 * TS, 3 * TS);
                        ctx.fillStyle = '#e0c890'; ctx.fillRect(wx, wy, 3 * TS, 3 * TS);
                        ctx.fillStyle = '#304878'; ctx.fillRect(wx, wy, 3 * TS, TS);
                        ctx.strokeStyle = '#887040'; ctx.lineWidth = 2; ctx.strokeRect(wx, wy, 3 * TS, 3 * TS);
                        ctx.strokeStyle = '#58a8f0'; ctx.lineWidth = 3;
                        const hx = wx + 1.5 * TS, hy = wy + TS * 0.5;
                        ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - Math.PI / 6; ctx.lineTo(hx + Math.cos(a) * 14, hy + Math.sin(a) * 14); }
                        ctx.closePath(); ctx.stroke();
                        ctx.fillStyle = '#d04010'; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fill();
                    }
                });
                // NPCs
                NPCS.forEach(npc => {
                    sprites.push({ sortY: (npc.wy || npc.ty * TS) + TS * 0.9, fn: () => drawNPC(npc, t) });
                });
            } else {
                // INDOOR — draw interior room (furniture, walls)
                sprites.push({ sortY: -999, fn: () => drawIndoorRoom() });
                // Fewer NPCs inside (just players queuing)
                NPCS.slice(3).forEach(npc => {
                    sprites.push({ sortY: (npc.wy || npc.ty * TS) + TS * 0.9, fn: () => drawNPC(npc, t) });
                });
            }

            // Player always visible
            sprites.push({ sortY: G.pyPx + TS * 0.85, fn: () => drawPlayer() });

            sprites.sort((a, b) => a.sortY - b.sortY);
            sprites.forEach(s => s.fn());

            // 4. Zone marker (pulsing ring on destination)
            if (nextZone && !G.triggered) {
                drawZoneMarker(nextZone.tx, nextZone.ty, nextZone.color, nextZone.label);
            }

            // 5. Dust
            updateDust();

            // 6. Atmosphere overlay
            if (indoor) {
                // Warm indoor amber tint at screen edges
                const ind = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
                ind.addColorStop(0, 'rgba(0,0,0,0)');
                ind.addColorStop(1, 'rgba(20,10,0,0.45)');
                ctx.fillStyle = ind; ctx.fillRect(0, 0, W, H);
            }

            // 7. Vignette
            const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.9);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,0.45)');
            ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
        }
