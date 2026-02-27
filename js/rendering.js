
        // ── CANVAS INIT ──
        function initCanvas() {
            canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
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

        function drawPollingStation() {
            const bx = 4 * TS - camX, by = 3 * TS - camY;
            const PW = 11 * TS, PH = TS * 1.5;
            ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(bx + 8, by + 8, PW, PH + TS);
            ctx.fillStyle = '#f0ede0'; ctx.fillRect(bx, by, PW, PH);
            ctx.fillStyle = '#d43020'; ctx.fillRect(bx, by, PW, TS * 0.6);
            ctx.fillStyle = '#b82010'; ctx.fillRect(bx, by + TS * 0.28, PW, 5);
            ctx.strokeStyle = 'rgba(80,0,0,0.15)'; ctx.lineWidth = 1;
            for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.moveTo(bx + i * TS * 0.7, by); ctx.lineTo(bx + i * TS * 0.7, by + TS * 0.6); ctx.stroke(); }
            for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bx, by + i * TS * 0.15 + 5); ctx.lineTo(bx + PW, by + i * TS * 0.15 + 5); ctx.stroke(); }
            ctx.strokeStyle = '#c0b090'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, PW, PH);
            const cx2 = bx + PW / 2, cy2 = by + TS;
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(cx2, cy2, TS * 0.48, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#e01020'; ctx.fillRect(cx2 - 5, cy2 - 12, 10, 24); ctx.fillRect(cx2 - 12, cy2 - 5, 24, 10);
            const fpx = bx + PW * 0.5 - TS * 1.2, fpy = by - TS * 0.5;
            ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fpx, fpy); ctx.lineTo(fpx, by + TS * 0.55); ctx.stroke();
            ctx.fillStyle = '#003893'; ctx.beginPath(); ctx.moveTo(fpx, fpy); ctx.lineTo(fpx + 18, fpy + 5); ctx.lineTo(fpx + 14, fpy + 12); ctx.lineTo(fpx, fpy + 8); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#dc143c'; ctx.beginPath(); ctx.moveTo(fpx + 1, fpy + 1); ctx.lineTo(fpx + 15, fpy + 6); ctx.lineTo(fpx + 11, fpy + 11); ctx.lineTo(fpx + 1, fpy + 7); ctx.closePath(); ctx.fill();
            [[0.08, 0.42], [0.2, 0.42], [0.76, 0.42], [0.88, 0.42]].forEach(([fx, fy]) => {
                ctx.fillStyle = '#90d8f0'; ctx.fillRect(bx + PW * fx, by + PH * fy, TS * 0.22, TS * 0.28);
                ctx.strokeStyle = '#8a6040'; ctx.lineWidth = 1; ctx.strokeRect(bx + PW * fx, by + PH * fy, TS * 0.22, TS * 0.28);
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(bx + PW * fx + 2, by + PH * fy + 2, TS * 0.09, TS * 0.12);
            });
            const dxIdx = bx + PW / 2 - TS * 0.5, dyIdx = by + PH - TS * 0.7;
            ctx.fillStyle = '#d8ceb0'; ctx.fillRect(dxIdx - 12, dyIdx - 10, 10, TS * 0.75); ctx.fillRect(dxIdx + TS + 3, dyIdx - 10, 10, TS * 0.75);
            ctx.fillStyle = '#5080c0'; ctx.fillRect(dxIdx, dyIdx, TS, TS * 0.7);
            ctx.fillStyle = 'rgba(180,220,255,0.45)'; ctx.fillRect(dxIdx + 3, dyIdx + 2, TS * 0.44, TS * 0.65); ctx.fillRect(dxIdx + TS * 0.54, dyIdx + 2, TS * 0.43, TS * 0.65);
            ctx.strokeStyle = '#3060a0'; ctx.lineWidth = 1; ctx.strokeRect(dxIdx, dyIdx, TS, TS * 0.7);
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
            ctx.fillStyle = '#3070e0'; ctx.fillRect(wx, wy, sw, sh * 0.3);
            ctx.strokeStyle = '#1050c0'; ctx.lineWidth = 2; ctx.strokeRect(wx, wy, sw, sh);
            for (let i = 0; i < 5; i++) { ctx.fillStyle = '#2060d0'; ctx.beginPath(); ctx.arc(wx + i * sw / 4 + sw / 8, wy + sh * 0.3, sw / 8, 0, Math.PI); ctx.fill(); }
            ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('SHOP', wx + sw / 2, wy + sh * 0.2);
            ctx.fillStyle = '#b0e8ff'; ctx.fillRect(wx + sw * 0.1, wy + sh * 0.4, sw * 0.35, sh * 0.35);
            ctx.fillStyle = '#80c8e8'; ctx.fillRect(wx + sw * 0.55, wy + sh * 0.4, sw * 0.35, sh * 0.35);
            ctx.strokeStyle = '#6a4020'; ctx.lineWidth = 1; ctx.strokeRect(wx + sw * 0.1, wy + sh * 0.4, sw * 0.35, sh * 0.35);
            ctx.strokeRect(wx + sw * 0.55, wy + sh * 0.4, sw * 0.35, sh * 0.35);
        }

        function drawFountain(tx, ty) {
            const wx = tx * TS - camX + TS / 2, wy = ty * TS - camY + TS / 2;
            const t = G.animT;
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(wx, wy, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#80b0e0'; ctx.beginPath(); ctx.ellipse(wx, wy, 20, 13, 0, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + t * 0.8; ctx.fillStyle = `rgba(180,220,255,${0.5 + Math.sin(t * 3 + i) * 0.3})`; ctx.beginPath(); ctx.ellipse(wx + Math.cos(a) * 10, wy + Math.sin(a) * 6, 4, 2.5, a, 0, Math.PI * 2); ctx.fill(); }
            ctx.fillStyle = '#a0c8e8'; ctx.beginPath(); ctx.arc(wx, wy, 5, 0, Math.PI * 2); ctx.fill();
        }

        function drawZoneMarker(tx, ty, color, label) {
            const wx = tx * TS - camX, wy = ty * TS - camY;
            const cx = wx + TS / 2, cy = wy + TS / 2;
            const pulse = Math.sin(G.animT * 3) * 0.4 + 0.6;
            ctx.save(); ctx.globalAlpha = pulse * 0.45; ctx.fillStyle = color; ctx.fillRect(wx + 2, wy + 2, TS - 4, TS - 4); ctx.globalAlpha = 1;
            ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = pulse * 0.8; ctx.beginPath(); ctx.arc(cx, cy, TS * 0.42, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = pulse * 0.35; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, TS * 0.6, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
            const ay = wy - TS * 0.5 + Math.sin(G.animT * 4) * 5;
            ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillStyle = color; ctx.fillText('▼', cx, ay); ctx.shadowBlur = 0;
            ctx.font = 'bold 8px "Tiro Devanagari Hindi",serif'; ctx.textBaseline = 'top';
            const lwIdx = ctx.measureText(label).width + 10;
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(cx - lwIdx / 2, ay + 14, lwIdx, 14); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(cx - lwIdx / 2, ay + 14, lwIdx, 14);
            ctx.fillStyle = color; ctx.fillText(label, cx, ay + 17); ctx.restore();
        }

        function drawNPC(npc, t) {
            const wx = npc.wx - camX, wy = npc.wy - camY;
            if (Math.abs(wx) > W + TS || Math.abs(wy) > H + TS) return;
            const bob = npc.walkR > 0 ? Math.sin(t * 3 + npc.phase) * 1.5 : 0;
            const legSwing = npc.walkR > 0 ? Math.sin(t * 5 + npc.phase) * 3 : 0;
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(wx + TS / 2, wy + TS * 0.88, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = shadeCol(npc.color, -40); ctx.fillRect(wx + TS / 2 - 5, wy + TS * 0.65 + bob, 4, 10 + legSwing * 0.4); ctx.fillRect(wx + TS / 2 + 1, wy + TS * 0.65 + bob, 4, 10 - legSwing * 0.4);
            ctx.fillStyle = '#2a1810'; ctx.fillRect(wx + TS / 2 - 7, wy + TS * 0.78 + bob + legSwing * 0.3, 6, 4); ctx.fillRect(wx + TS / 2 + 1, wy + TS * 0.78 + bob - legSwing * 0.3, 6, 4);
            ctx.fillStyle = npc.color; ctx.fillRect(wx + TS / 2 - 7, wy + TS * 0.35 + bob, 14, TS * 0.32);
            ctx.fillStyle = shadeCol(npc.color, -20); ctx.fillRect(wx + TS / 2 - 11, wy + TS * 0.37 + bob, 4, TS * 0.22); ctx.fillRect(wx + TS / 2 + 7, wy + TS * 0.37 + bob, 4, TS * 0.22);
            ctx.fillStyle = '#f0c890'; ctx.fillRect(wx + TS / 2 - 6, wy + TS * 0.12 + bob, 12, 12);
            ctx.fillStyle = npc.hat; ctx.fillRect(wx + TS / 2 - 7, wy + TS * 0.08 + bob, 14, 7);
            ctx.fillStyle = '#201808'; ctx.fillRect(wx + TS / 2 - 3, wy + TS * 0.18 + bob, 3, 3); ctx.fillRect(wx + TS / 2 + 1, wy + TS * 0.18 + bob, 3, 3);
        }

        function drawPlayer() {
            const wxIdx = G.pxPx - camX, wyIdx = G.pyPx - camY;
            const tIdx = G.animT;
            const walking = isWalking;
            const bob = walking ? Math.sin(tIdx * 6) * 2 : Math.sin(tIdx * 1.5) * 0.5;
            const legSwing = walking ? Math.sin(tIdx * 6) * 4 : 0;
            const sway = walking ? Math.sin(tIdx * 6 + 1) * 1.5 : 0;
            const bodyColor = G.char === 'female' ? '#e04080' : '#3868c8';
            const hatColor = G.char === 'female' ? '#901040' : '#1840a0';
            if (walking && Math.random() < 0.25) DUST.push({ x: wxIdx + TS / 2 + (Math.random() - 0.5) * 8, y: wyIdx + TS * 0.85, vy: -0.5, vx: (Math.random() - 0.5) * 0.6, life: 1, size: 3 + Math.random() * 2 });
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(wxIdx + TS / 2, wyIdx + TS * 0.9, 9 + (walking ? 2 : 0), 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = shadeCol(bodyColor, -45); ctx.fillRect(wxIdx + TS / 2 - 5 + sway * 0.3, wyIdx + TS * 0.65 + bob, 5, 12 + legSwing * 0.4); ctx.fillRect(wxIdx + TS / 2 + 1 + sway * 0.3, wyIdx + TS * 0.65 + bob, 5, 12 - legSwing * 0.4);
            ctx.fillStyle = '#2a1810'; ctx.fillRect(wxIdx + TS / 2 - 7 + sway * 0.2, wyIdx + TS * 0.8 + bob + legSwing * 0.4, 7, 5); ctx.fillRect(wxIdx + TS / 2 + 1 + sway * 0.2, wyIdx + TS * 0.8 + bob - legSwing * 0.4, 7, 5);
            ctx.fillStyle = bodyColor; ctx.fillRect(wxIdx + TS / 2 - 8 + sway, wyIdx + TS * 0.33 + bob, 16, TS * 0.35);
            ctx.fillStyle = shadeCol(bodyColor, -15); ctx.fillRect(wxIdx + TS / 2 - 12 + sway, wyIdx + TS * 0.36 + bob + legSwing * 0.5, 4, TS * 0.25); ctx.fillRect(wxIdx + TS / 2 + 8 + sway, wyIdx + TS * 0.36 + bob - legSwing * 0.5, 4, TS * 0.25);
            if (G.inkApplied) { ctx.fillStyle = '#7020c0'; ctx.beginPath(); ctx.arc(wxIdx + TS / 2 + 12 + sway, wyIdx + TS * 0.52 + bob, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(160,60,255,0.45)'; ctx.beginPath(); ctx.arc(wxIdx + TS / 2 + 12 + sway, wyIdx + TS * 0.52 + bob, 8, 0, Math.PI * 2); ctx.fill(); }
            ctx.fillStyle = '#f0c890'; ctx.fillRect(wxIdx + TS / 2 - 7 + sway * 0.4, wyIdx + TS * 0.09 + bob, 14, 13);
            ctx.fillStyle = hatColor; ctx.fillRect(wxIdx + TS / 2 - 8 + sway * 0.4, wyIdx + TS * 0.04 + bob, 16, 8);
            ctx.fillStyle = shadeCol(hatColor, -10); ctx.fillRect(wxIdx + TS / 2 - 10 + sway * 0.4, wyIdx + TS * 0.09 + bob, 20, 4);
            ctx.fillStyle = '#201808'; ctx.fillRect(wxIdx + TS / 2 - 4 + sway * 0.2, wyIdx + TS * 0.17 + bob, 3, 3); ctx.fillRect(wxIdx + TS / 2 + 2 + sway * 0.2, wyIdx + TS * 0.17 + bob, 3, 3);
            ctx.font = 'bold 8px "Share Tech Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            const ntwIdx = ctx.measureText(G.name).width + 10;
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(wxIdx + TS / 2 - ntwIdx / 2, wyIdx - 16, ntwIdx, 13);
            ctx.strokeStyle = 'rgba(212,160,23,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(wxIdx + TS / 2 - ntwIdx / 2, wyIdx - 16, ntwIdx, 13);
            ctx.fillStyle = '#d4c020'; ctx.fillText(G.name, wxIdx + TS / 2, wyIdx - 4);
        }

        function shadeCol(hexOrRgb, amt) {
            const elIdx = document.createElement('canvas').getContext('2d');
            elIdx.fillStyle = hexOrRgb;
            const vIdx = elIdx.fillStyle;
            const rIdx = parseInt(vIdx.slice(1, 3), 16), gIdx = parseInt(vIdx.slice(3, 5), 16), bIdx = parseInt(vIdx.slice(5, 7), 16);
            return `rgb(${Math.max(0, Math.min(255, rIdx + amt))},${Math.max(0, Math.min(255, gIdx + amt))},${Math.max(0, Math.min(255, bIdx + amt))})`;
        }

        var DUST = [];
        function updateDust() {
            for (let i = DUST.length - 1; i >= 0; i--) {
                const dIdx = DUST[i]; dIdx.x += dIdx.vx; dIdx.y += dIdx.vy; dIdx.life -= 0.05; dIdx.vy *= 0.9;
                if (dIdx.life <= 0) { DUST.splice(i, 1); continue; }
                ctx.beginPath(); ctx.arc(dIdx.x, dIdx.y, dIdx.size * dIdx.life, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,180,140,${dIdx.life * 0.4})`; ctx.fill();
            }
        }

        function updateNPCs(dt) {
            const tIdx = performance.now() / 1000;
            NPCS.forEach(npc => {
                if (npc.walkR <= 0) return;
                const oxIdx = npc.originX || (npc.originX = npc.tx * TS);
                const oyIdx = npc.originY || (npc.originY = npc.ty * TS);
                npc.wx = (oxIdx + Math.sin(tIdx * npc.walkR + npc.phase) * TS * 1.2) | 0;
                npc.wy = (oyIdx + Math.cos(tIdx * npc.walkR * 0.7 + npc.phase) * TS * 0.8) | 0;
            });
            NPCS.forEach(npc => {
                if (!npc.wx) npc.wx = npc.tx * TS;
                if (!npc.wy) npc.wy = npc.ty * TS;
            });
        }

        function bfsPath(sx, sy, tx, ty, maxSteps = 20) {
            if (sx === tx && sy === ty) return [];
            const visitedIdx = new Set();
            const queueIdx = [{ x: sx, y: sy, path: [] }];
            visitedIdx.add(`${sx},${sy}`);
            const dirsIdx = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            while (queueIdx.length) {
                const { x, y, path } = queueIdx.shift();
                for (const [dx, dy] of dirsIdx) {
                    const nx2 = x + dx, ny2 = y + dy;
                    const keyIdx = `${nx2},${ny2}`;
                    if (visitedIdx.has(keyIdx)) continue;
                    if (WALK[ny2]?.[nx2] !== 0) continue;
                    visitedIdx.add(keyIdx);
                    const newPathIdx = [...path, { x: nx2, y: ny2 }];
                    if (nx2 === tx && ny2 === ty) return newPathIdx.slice(0, maxSteps);
                    queueIdx.push({ x: nx2, y: ny2, path: newPathIdx });
                }
            }
            return [];
        }

        function drawPathArrows(zone) {
            if (!zone) return;
            const pathIdx = bfsPath(G.px, G.py, zone.tx, zone.ty, 12);
            if (!pathIdx.length) return;
            pathIdx.forEach((sIdx, i) => {
                const wxIdx2 = sIdx.x * TS - camX + TS / 2;
                const wyIdx2 = sIdx.y * TS - camY + TS / 2;
                if (wxIdx2 < -TS || wxIdx2 > W + TS || wyIdx2 < -TS || wyIdx2 > H + TS) return;
                const progressIdx = i / pathIdx.length;
                const alphaIdx = (1 - progressIdx * 0.7) * 0.85;
                const pulseIdx = Math.sin(G.animT * 5 - i * 0.8) * 0.2 + 0.8;
                ctx.save();
                ctx.globalAlpha = alphaIdx * pulseIdx;
                ctx.shadowColor = zone.color; ctx.shadowBlur = 8;
                ctx.fillStyle = zone.color;
                ctx.beginPath(); ctx.arc(wxIdx2, wyIdx2, i === 0 ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                if (i < pathIdx.length - 1) {
                    const nsIdx = pathIdx[i + 1];
                    const nx3 = nsIdx.x * TS - camX + TS / 2;
                    const ny3 = nsIdx.y * TS - camY + TS / 2;
                    const angleIdx = Math.atan2(ny3 - wyIdx2, nx3 - wxIdx2);
                    ctx.translate(wxIdx2, wyIdx2); ctx.rotate(angleIdx);
                    ctx.beginPath();
                    ctx.moveTo(10, 0); ctx.lineTo(4, -4); ctx.lineTo(6, 0); ctx.lineTo(4, 4);
                    ctx.closePath(); ctx.fill();
                }
                ctx.restore();
            });
        }

        function drawIndoorRoom() {
            const bxIdx = 4 * TS - camX, byIdx = 4 * TS - camY;
            const bwIdx = 11 * TS, bhIdx = 8 * TS;
            const indoorLightIdx = ctx.createRadialGradient(bxIdx + bwIdx / 2, byIdx + bhIdx / 2, 10, bxIdx + bwIdx / 2, byIdx + bhIdx / 2, bwIdx * 0.7);
            indoorLightIdx.addColorStop(0, 'rgba(255,240,200,0.12)');
            indoorLightIdx.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = indoorLightIdx; ctx.fillRect(bxIdx, byIdx, bwIdx, bhIdx);
            ctx.fillStyle = '#b8a878'; ctx.fillRect(bxIdx - 4, byIdx - 8, bwIdx + 8, 10);
            ctx.fillStyle = '#a09060'; ctx.fillRect(bxIdx - 4, byIdx, 4, bhIdx);
            ctx.fillStyle = '#a09060'; ctx.fillRect(bxIdx + bwIdx, byIdx, 4, bhIdx);
            ctx.fillStyle = 'rgba(100,80,40,0.4)'; ctx.fillRect(bxIdx, byIdx, bwIdx, 4);
            drawDesk(8, 11, 'परिचय डेस्क ✓', '#d4b060', 2.5);
            drawBooth(6, 7, '#1e3a8a');
            drawBooth(11, 7, '#1a4a20');
            drawBallotBox(11, 8, '#2d6a4f', 'मत\nपेटिका');
            drawBallotBox(12, 8, '#444', 'अन्य');
            drawInkStation(5, 5);
            [[6, 4], [9, 4], [12, 4], [6, 8], [9, 8], [12, 8]].forEach(([c, r]) => {
                const lxIdx = c * TS - camX + TS / 2, lyIdx = r * TS - camY + TS / 2;
                const glowIdx = ctx.createRadialGradient(lxIdx, lyIdx, 0, lxIdx, lyIdx, 24);
                glowIdx.addColorStop(0, 'rgba(255,240,180,0.35)'); glowIdx.addColorStop(1, 'rgba(255,240,180,0)');
                ctx.fillStyle = glowIdx; ctx.beginPath(); ctx.arc(lxIdx, lyIdx, 24, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff8d0'; ctx.beginPath(); ctx.arc(lxIdx, lyIdx, 4, 0, Math.PI * 2); ctx.fill();
            });
            const dfxIdx = 8 * TS - camX, dfyIdx = 12 * TS - camY;
            const gateOpenIdx = G.idVerified;
            const gateColorIdx = gateOpenIdx ? '#20c040' : '#e02020';
            const gatePulseIdx = Math.sin(G.animT * 4) * 0.3 + 0.7;
            for (const pxIdx of [dfxIdx - TS * 0.3, dfxIdx + 3 * TS + TS * 0.05]) {
                ctx.fillStyle = '#3a3a3a'; ctx.fillRect(pxIdx, dfyIdx - TS * 0.8, 8, TS * 0.9);
                ctx.fillStyle = '#555'; ctx.fillRect(pxIdx - 3, dfyIdx - TS * 0.82, 14, 8);
                for (let sIdx = 0; sIdx < 4; sIdx++) { ctx.fillStyle = sIdx % 2 === 0 ? '#e8c020' : '#333'; ctx.fillRect(pxIdx, dfyIdx - TS * 0.8 + sIdx * TS * 0.18, 8, TS * 0.17); }
                ctx.fillStyle = `rgba(${gateOpenIdx ? '0,220,60' : '220,20,20'},${gatePulseIdx})`; ctx.beginPath(); ctx.arc(pxIdx + 4, dfyIdx - TS * 0.85, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(pxIdx + 3, dfyIdx - TS * 0.87, 2, 0, Math.PI * 2); ctx.fill();
            }
            const barYIdx = dfyIdx - TS * 0.45;
            if (!gateOpenIdx) {
                const barXIdx = dfxIdx - TS * 0.22, barWIdx = 3 * TS + TS * 0.55;
                ctx.fillStyle = '#c01010'; ctx.fillRect(barXIdx, barYIdx, barWIdx, 8);
                for (let sIdx = 0; sIdx < 8; sIdx++) { ctx.fillStyle = sIdx % 2 === 0 ? 'rgba(255,255,255,0.25)' : 'transparent'; ctx.fillRect(barXIdx + sIdx * (barWIdx / 8), barYIdx, barWIdx / 8, 8); }
                ctx.strokeStyle = 'rgba(255,50,50,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(barXIdx, barYIdx, barWIdx, 8);
                ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(dfxIdx + TS * 0.5, barYIdx - 14, TS * 2, 13);
                ctx.strokeStyle = '#e02020'; ctx.lineWidth = 1; ctx.strokeRect(dfxIdx + TS * 0.5, barYIdx - 14, TS * 2, 13);
                ctx.fillStyle = '#ff4040'; ctx.fillText('परिचय प्रमाणीकरण आवश्यक', dfxIdx + TS * 1.5, barYIdx - 7);
                const grdIdx = ctx.createLinearGradient(dfxIdx - TS * 0.22, barYIdx - 10, dfxIdx - TS * 0.22, barYIdx + 20);
                grdIdx.addColorStop(0, 'rgba(220,0,0,0)'); grdIdx.addColorStop(0.5, `rgba(220,0,0,${0.12 * gatePulseIdx})`); grdIdx.addColorStop(1, 'rgba(220,0,0,0)');
                ctx.fillStyle = grdIdx; ctx.fillRect(dfxIdx - TS * 0.3, barYIdx - 12, 3 * TS + TS * 0.7, 30);
            } else {
                const postXIdx = dfxIdx - TS * 0.22;
                ctx.fillStyle = '#208040'; ctx.fillRect(postXIdx, barYIdx - TS * 0.6, 8, TS * 0.55);
                ctx.shadowColor = '#00ff80'; ctx.shadowBlur = 12; ctx.fillStyle = 'rgba(0,255,80,0.15)'; ctx.fillRect(dfxIdx, barYIdx - 20, 3 * TS, 30); ctx.shadowBlur = 0;
                ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(dfxIdx + TS * 0.5, barYIdx - 14, TS * 2, 13); ctx.strokeStyle = '#20c040'; ctx.lineWidth = 1; ctx.strokeRect(dfxIdx + TS * 0.5, barYIdx - 14, TS * 2, 13);
                ctx.fillStyle = '#40ff80'; ctx.fillText('✓ परिचय प्रमाणित — प्रवेश गर्नुहोस्', dfxIdx + TS * 1.5, barYIdx - 7);
            }
            drawSign(9, 4, 'मतदान केन्द्र', '#dc143c'); drawSign(13, 6, '→ मतपेटिका', '#2d6a4f'); drawSign(5, 6, '← मसी केन्द्र', '#6020a0');
        }

        function drawDesk(tx, ty, label, color, widthTiles) {
            const wxIdx = tx * TS - camX, wyIdx = ty * TS - camY;
            const dwIdx = (widthTiles || 2) * TS;
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(wxIdx + 4, wyIdx + 6, dwIdx, TS * 0.55);
            ctx.fillStyle = color || '#c8a060'; ctx.fillRect(wxIdx, wyIdx, dwIdx, TS * 0.5);
            ctx.fillStyle = '#705018'; ctx.fillRect(wxIdx, wyIdx + TS * 0.5, dwIdx, TS * 0.1);
            ctx.fillStyle = '#1a2a3a'; ctx.fillRect(wxIdx + dwIdx * 0.35, wyIdx - TS * 0.45, TS * 0.55, TS * 0.4);
            ctx.fillStyle = '#3090c0'; ctx.fillRect(wxIdx + dwIdx * 0.37, wyIdx - TS * 0.42, TS * 0.5, TS * 0.33);
            ctx.strokeStyle = '#504020'; ctx.lineWidth = 1.5; ctx.strokeRect(wxIdx, wyIdx, dwIdx, TS * 0.5);
            ctx.font = 'bold 7px "Tiro Devanagari Hindi",serif'; ctx.textAlign = 'center';
            const lwIdx2 = ctx.measureText(label).width + 8;
            ctx.fillStyle = 'rgba(80,50,10,0.85)'; ctx.fillRect(wxIdx + dwIdx / 2 - lwIdx2 / 2, wyIdx + TS * 0.55, lwIdx2, 12);
            ctx.fillStyle = '#f0e0a0'; ctx.fillText(label, wxIdx + dwIdx / 2, wyIdx + TS * 0.64);
        }

        function drawBooth(tx, ty, curtainColor) {
            const wxIdx = tx * TS - camX, wyIdx = ty * TS - camY;
            ctx.fillStyle = '#c8b470'; ctx.fillRect(wxIdx - 2, wyIdx - TS * 0.35, TS + 4, TS * 0.85);
            ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(wxIdx + 2, wyIdx - TS * 0.35, TS, TS * 0.85);
            ctx.fillStyle = curtainColor; ctx.fillRect(wxIdx + 3, wyIdx - TS * 0.3, TS - 2, TS * 0.8);
            ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(wxIdx + 3, wyIdx - TS * 0.3, TS * 0.35, TS * 0.8);
            ctx.fillStyle = '#a08040'; ctx.fillRect(wxIdx - 2, wyIdx - TS * 0.35, TS + 4, 6);
            ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,240,180,0.9)'; ctx.fillText('बुथ', wxIdx + TS / 2, wyIdx + TS * 0.25);
        }

        function drawBallotBox(tx, ty, color, label) {
            const wxIdx = tx * TS - camX + 3, wyIdx = ty * TS - camY + 2;
            const bwIdx = TS - 6, bhIdx = TS * 0.65;
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(wxIdx + 4, wyIdx + 5, bwIdx, bhIdx);
            ctx.fillStyle = color; ctx.fillRect(wxIdx, wyIdx, bwIdx, bhIdx);
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(wxIdx + bwIdx, wyIdx); ctx.lineTo(wxIdx + bwIdx + 6, wyIdx - 4); ctx.lineTo(wxIdx + bwIdx + 6, wyIdx + bhIdx - 4); ctx.lineTo(wxIdx + bwIdx, wyIdx + bhIdx); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(wxIdx + bwIdx * 0.25, wyIdx + 2, bwIdx * 0.5, 4);
            ctx.fillStyle = '#d4a017'; ctx.fillRect(wxIdx + bwIdx * 0.4, wyIdx + bhIdx * 0.55, bwIdx * 0.2, bhIdx * 0.3);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(wxIdx, wyIdx, bwIdx, bhIdx);
            ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(label.split('\n')[0], wxIdx + bwIdx / 2, wyIdx + bhIdx * 0.42);
        }

        function drawInkStation(tx, ty) {
            const wxIdx = tx * TS - camX, wyIdx = ty * TS - camY;
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(wxIdx + 4, wyIdx + 6, 2 * TS, TS * 0.5);
            ctx.fillStyle = '#b89050'; ctx.fillRect(wxIdx, wyIdx + 2, 2 * TS, TS * 0.45);
            ctx.fillStyle = '#906830'; ctx.fillRect(wxIdx, wyIdx + TS * 0.47, 2 * TS, TS * 0.08);
            const pxIdx = wxIdx + TS * 0.15, pyIdx = wyIdx - TS * 0.3;
            ctx.fillStyle = '#3a0870'; ctx.beginPath(); ctx.roundRect(pxIdx, pyIdx, TS * 0.85, TS * 0.55, 4); ctx.fill();
            const velvetIdx = ctx.createRadialGradient(pxIdx + TS * 0.4, pyIdx + TS * 0.25, 2, pxIdx + TS * 0.4, pyIdx + TS * 0.25, TS * 0.4);
            velvetIdx.addColorStop(0, '#8040c0'); velvetIdx.addColorStop(1, '#4010a0');
            ctx.fillStyle = velvetIdx; ctx.beginPath(); ctx.roundRect(pxIdx + 4, pyIdx + 4, TS * 0.77, TS * 0.45, 2); ctx.fill();
            ctx.fillStyle = 'rgba(200,150,255,0.25)'; ctx.beginPath(); ctx.ellipse(pxIdx + TS * 0.3, pyIdx + TS * 0.18, TS * 0.18, TS * 0.1, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(160,80,255,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(pxIdx, pyIdx, TS * 0.85, TS * 0.55, 4); ctx.stroke();
            ctx.font = 'bold 7px "Tiro Devanagari Hindi",serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(60,10,100,0.9)'; ctx.fillRect(wxIdx + TS * 0.8 - 22, wyIdx + TS * 0.5, 44, 12);
            ctx.fillStyle = '#d0a0ff'; ctx.fillText('मसी केन्द्र', wxIdx + TS * 0.8, wyIdx + TS * 0.6);
        }

        function drawSign(tx, ty, text, color) {
            const wxIdx = tx * TS - camX, wyIdx = ty * TS - camY;
            ctx.font = 'bold 7px "Tiro Devanagari Hindi",serif'; ctx.textAlign = 'center';
            const twIdx = ctx.measureText(text).width + 10;
            ctx.fillStyle = 'rgba(10,10,10,0.75)'; ctx.fillRect(wxIdx - twIdx / 2, wyIdx, twIdx, 13);
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(wxIdx - twIdx / 2, wyIdx, twIdx, 13);
            ctx.fillStyle = color; ctx.fillText(text, wxIdx, wyIdx + 10);
        }

        function render() {
            if (!ctx) return;
            ctx.clearRect(0, 0, W, H);
            ctx.imageSmoothingEnabled = false;
            const tIdx = G.animT;
            const indoorIdx = isInsideBooth();
            for (let r = 0; r < ROWS; r++) { for (let cIdx = 0; cIdx < COLS; cIdx++) { drawTile(cIdx, r); } }
            const nextZoneIdx = ZONES.find(z => z.phase === G.phase);
            if (nextZoneIdx && !G.triggered) { drawPathArrows(nextZoneIdx); }
            const spritesIdx = [];
            if (!indoorIdx) {
                for (let r = 0; r < ROWS; r++) { for (let cIdx = 0; cIdx < COLS; cIdx++) { if (TILEMAP[r][cIdx] === 9) spritesIdx.push({ sortY: r * TS + TS * 0.8, fn: () => drawTree(cIdx, r) }); } }
                spritesIdx.push({ sortY: 3.5 * TS, fn: () => drawPollingStation() });
                spritesIdx.push({ sortY: 13 * TS, fn: () => drawShop(16, 10) });
                spritesIdx.push({ sortY: 15 * TS, fn: () => drawFountain(5, 15) });
                spritesIdx.push({ sortY: 14 * TS, fn: () => drawPalmTree(3, 14) });
                spritesIdx.push({ sortY: 15 * TS, fn: () => drawPalmTree(14, 15) });
                spritesIdx.push({ sortY: 4 * TS, fn: () => { const wxIdx3 = 16 * TS - camX, wyIdx3 = 2 * TS - camY; ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(wxIdx3 + 5, wyIdx3 + 5, 3 * TS, 3 * TS); ctx.fillStyle = '#e0c890'; ctx.fillRect(wxIdx3, wyIdx3, 3 * TS, 3 * TS); ctx.fillStyle = '#304878'; ctx.fillRect(wxIdx3, wyIdx3, 3 * TS, TS); ctx.strokeStyle = '#887040'; ctx.lineWidth = 2; ctx.strokeRect(wxIdx3, wyIdx3, 3 * TS, 3 * TS); ctx.strokeStyle = '#58a8f0'; ctx.lineWidth = 3; const hxIdx = wxIdx3 + 1.5 * TS, hyIdx = wyIdx3 + TS * 0.5; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - Math.PI / 6; ctx.lineTo(hxIdx + Math.cos(a) * 14, hyIdx + Math.sin(a) * 14); } ctx.closePath(); ctx.stroke(); ctx.fillStyle = '#d04010'; ctx.beginPath(); ctx.arc(hxIdx, hyIdx, 8, 0, Math.PI * 2); ctx.fill(); } });
                NPCS.forEach(npc => { spritesIdx.push({ sortY: (npc.wy || npc.ty * TS) + TS * 0.9, fn: () => drawNPC(npc, tIdx) }); });
            } else {
                spritesIdx.push({ sortY: -999, fn: () => drawIndoorRoom() });
                NPCS.slice(3).forEach(npc => { spritesIdx.push({ sortY: (npc.wy || npc.ty * TS) + TS * 0.9, fn: () => drawNPC(npc, tIdx) }); });
            }
            spritesIdx.push({ sortY: G.pyPx + TS * 0.85, fn: () => drawPlayer() });
            spritesIdx.sort((a, b) => a.sortY - b.sortY);
            spritesIdx.forEach(s => s.fn());
            if (nextZoneIdx && !G.triggered) { drawZoneMarker(nextZoneIdx.tx, nextZoneIdx.ty, nextZoneIdx.color, nextZoneIdx.label); }
            updateDust();
            if (indoorIdx) { const indIdx = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75); indIdx.addColorStop(0, 'rgba(0,0,0,0)'); indIdx.addColorStop(1, 'rgba(20,10,0,0.45)'); ctx.fillStyle = indIdx; ctx.fillRect(0, 0, W, H); }
            const vigIdx = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.9); vigIdx.addColorStop(0, 'rgba(0,0,0,0)'); vigIdx.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = vigIdx; ctx.fillRect(0, 0, W, H);
        }
