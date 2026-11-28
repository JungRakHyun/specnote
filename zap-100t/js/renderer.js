// ZAP 100T — Minimalist Paper & Ink Airborne Illustration Renderer
// Truly flying mosquitoes (curved buzz trails, 3/4 side-airborne silhouette, trailing legs, wing-blur fans, distant ground shadow, tumbling detached wings!)
window.ZAP = window.ZAP || {};

(function () {
  const Renderer = {
    canvas: null,
    ctx: null,
    dpr: 1,

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resize();
    },

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },

    _palette() {
      const dark = window.ZAP.State.data.settings.theme === 'dark';
      return dark
        ? {
            dark: true,
            paper: '#121316',
            ink: '#f3f2ec',
            inkSoft: 'rgba(243, 242, 236, 0.32)',
            inkFaint: 'rgba(243, 242, 236, 0.055)',
            airShadow: 'rgba(0, 0, 0, 0.25)',
            surface: '#1b1d22',
            shadow: 'rgba(0, 0, 0, 0.4)',
            wingFill: 'rgba(243, 242, 236, 0.24)',
            handFill: '#24262c',
            volt: '#ffe135',
            red: '#ff4d5a',
            cyan: '#38bdf8',
          }
        : {
            dark: false,
            paper: '#f6f5f0',
            ink: '#141414',
            inkSoft: 'rgba(20, 20, 20, 0.28)',
            inkFaint: 'rgba(20, 20, 20, 0.048)',
            airShadow: 'rgba(20, 20, 20, 0.06)',
            surface: '#ffffff',
            shadow: 'rgba(20, 20, 20, 0.14)',
            wingFill: 'rgba(255, 255, 255, 0.72)',
            handFill: '#ffffff',
            volt: '#ffca00',
            red: '#e5383b',
            cyan: '#0096c7',
          };
    },

    render() {
      const ctx = this.ctx;
      const eng = window.ZAP.Engine;
      const state = window.ZAP.State;
      const stage = state.getStage();
      const stats = state.getStats();
      const pal = this._palette();
      const w = eng.width;
      const h = eng.height;

      ctx.save();

      if (eng.shakeMag > 0.2) {
        ctx.translate((Math.random() - 0.5) * 2 * eng.shakeMag, (Math.random() - 0.5) * 2 * eng.shakeMag);
      }

      // 1. Clean Open-Air Paper Canvas
      ctx.fillStyle = pal.paper;
      ctx.fillRect(-24, -24, w + 48, h + 48);

      // 2. Subtle Atmospheric Horizon / Stage Line-Art + Drifting Mid-Air Dust Specks
      this._drawPaperGrid(ctx, w, h, pal);
      this._drawStageWatermark(ctx, w, h, stage.id, pal, eng.time);
      this._drawAirSpecs(ctx, eng.airSpecs, pal);

      // Bold Minimalist Editorial Poster Watermark during 220V OVERDRIVE!
      if (eng.feverActive) {
        ctx.save();
        ctx.font = `900 ${Math.min(110, Math.floor(w * 0.09))}px "JetBrains Mono", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = pal.dark ? 'rgba(255, 225, 53, 0.055)' : 'rgba(20, 20, 20, 0.045)';
        ctx.fillText('220V OVERDRIVE', w / 2, h / 2);
        ctx.restore();
      }

      // 3. UV Lamps, Coils, Turrets
      for (const lamp of eng.uvLamps) this._drawUVLamp(ctx, lamp, eng.time, pal);
      for (const coil of eng.coils) this._drawCoil(ctx, coil, pal);
      for (const turret of eng.turrets) this._drawTurret(ctx, turret, pal);

      // 4. Orbital Plasma Beams
      for (const b of eng.orbitalBeams) {
        ctx.save();
        ctx.fillStyle = pal.dark ? 'rgba(255, 225, 53, 0.22)' : 'rgba(255, 202, 0, 0.28)';
        ctx.fillRect(b.x - b.width, 0, b.width * 2, h);
        ctx.fillStyle = pal.surface;
        ctx.fillRect(b.x - b.width * 0.26, 0, b.width * 0.52, h);
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(b.x - b.width * 0.28, 0); ctx.lineTo(b.x - b.width * 0.28, h);
        ctx.moveTo(b.x + b.width * 0.28, 0); ctx.lineTo(b.x + b.width * 0.28, h);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Tumbling Detached Wings & Toasted Mid-Air Ash
      for (const fd of eng.fallingDebris) {
        this._drawFallingDebris(ctx, fd, pal);
      }

      // 6. Shockwave & Comic Impact Rings
      for (const r of eng.rings) {
        const alpha = Math.max(0, r.life / r.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = r.color === '#141414' ? pal.ink : r.color;
        ctx.lineWidth = r.width * alpha + 0.8;
        if (r.isSpiky) {
          const rays = 10;
          ctx.beginPath();
          for (let i = 0; i < rays; i++) {
            const a = (i / rays) * Math.PI * 2;
            const r1 = r.r * 0.65;
            const r2 = r.r * (i % 2 === 0 ? 1.12 : 0.92);
            ctx.moveTo(r.x + Math.cos(a) * r1, r.y + Math.sin(a) * r1);
            ctx.lineTo(r.x + Math.cos(a) * r2, r.y + Math.sin(a) * r2);
          }
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 7. Static Volt Diamonds
      for (const o of eng.orbs) {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.fillStyle = o.color;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -o.r * 1.35);
        ctx.lineTo(o.r * 1.1, 0);
        ctx.lineTo(0, o.r * 1.35);
        ctx.lineTo(-o.r * 1.1, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 8. Homing Missiles (Contract C-01)
      for (const ms of eng.missiles) {
        this._drawMissile(ctx, ms, pal);
      }

      // 9. Truly Airborne Flying Mosquitoes + Striped Adidas Boss!
      for (const m of eng.mosquitoes) {
        if (m.type === 'boss') this._drawBoss(ctx, m, eng.time, pal);
        else this._drawFlyingMosquito(ctx, m, eng.time, pal);
      }

      // 10. Autonomous Mini Zapper Drones (Contract C-05)
      for (const dr of eng.drones) {
        this._drawDrone(ctx, dr, eng.time, pal);
      }

      // 11. Particles
      for (const p of eng.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = p.kind === 'mist' ? alpha * 0.42 : p.kind === 'smoke' ? alpha * 0.45 : alpha;
        if (p.kind === 'smoke') {
          ctx.strokeStyle = pal.ink;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1.4 - alpha * 0.5), 0, Math.PI * 1.4);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color === '#141414' ? pal.ink : p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (p.kind === 'mist' ? 1.35 - alpha * 0.35 : alpha + 0.25), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 12. Ink-Outlined Lightning Bolts
      for (const b of eng.bolts) {
        const alpha = Math.max(0, b.life / b.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = b.width * 2.2;
        this._tracePolyline(ctx, b.pts);
        ctx.stroke();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.width * 1.15;
        this._tracePolyline(ctx, b.pts);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(0.8, b.width * 0.4);
        this._tracePolyline(ctx, b.pts);
        ctx.stroke();
        ctx.restore();
      }

      // 13. Orbiting Tesla Satellites
      const effR = stats.zapRadius * (eng.feverActive ? 1.4 : 1);
      if (stats.orbitTeslaCount > 0 && eng.mouse.active) {
        const orbitR = effR + 46;
        for (let i = 0; i < stats.orbitTeslaCount; i++) {
          const ang = eng.orbitAngle + (i / stats.orbitTeslaCount) * Math.PI * 2;
          const ox = eng.mouse.x + Math.cos(ang) * orbitR;
          const oy = eng.mouse.y + Math.sin(ang) * orbitR;
          ctx.save();
          ctx.fillStyle = pal.volt;
          ctx.strokeStyle = pal.ink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ox, oy, 7.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      // 14. Swing Vortex Subtle Swirl Visual + 7-Tier Cursor Weapon
      if (eng.mouse.active) {
        if (stats.vortexLevel > 0 && eng.mouse.speed > 14) {
          ctx.save();
          ctx.translate(eng.mouse.x, eng.mouse.y);
          ctx.rotate(eng.time * 5);
          ctx.strokeStyle = pal.inkSoft;
          ctx.lineWidth = 1.4;
          ctx.setLineDash([12, 16]);
          ctx.beginPath();
          ctx.arc(0, 0, stats.vortexRadius * 0.72, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
        this._drawCursorTrail(ctx, eng.mouse.trail, pal);
        this._drawWeaponCursor(ctx, eng.mouse.x, eng.mouse.y, effR, stats.weapon, eng, pal);
      }

      // 15. Comic Onomatopoeia & Damage/Volt Popups (Crisp black ink casing on yellow/bright comic SFX!)
      for (const t of eng.texts) {
        const alpha = Math.max(0, t.life / t.maxLife);
        ctx.save();
        ctx.translate(t.x, t.y);
        if (t.rot) ctx.rotate(t.rot);
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.font = t.isComic
          ? `900 ${t.size}px "Noto Sans KR", sans-serif`
          : `800 ${t.size}px "JetBrains Mono", "Noto Sans KR", sans-serif`;
        const isBrightText = t.color === '#ffca00' || t.color === '#ffe135' || t.color === '#d97706';
        ctx.lineWidth = t.isComic ? 4.2 : 2.8;
        ctx.strokeStyle = isBrightText ? '#141414' : pal.surface;
        ctx.lineJoin = 'round';
        ctx.strokeText(t.text, 0, 0);
        ctx.fillStyle = t.color === '#141414' ? pal.ink : t.color;
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
      }

      // 16. Crisp Brief Impact Screen Flash
      if (eng.screenFlash > 0.01) {
        ctx.fillStyle = pal.volt;
        ctx.globalAlpha = eng.screenFlash * 0.35;
        ctx.fillRect(-20, -20, w + 40, h + 40);
      }

      ctx.restore();
    },

    _tracePolyline(ctx, pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    },

    _drawPaperGrid(ctx, w, h, pal) {
      const step = 48;
      ctx.fillStyle = pal.inkFaint;
      for (let x = step / 2; x < w; x += step) {
        for (let y = step / 2; y < h; y += step) {
          ctx.fillRect(x, y, 1.8, 1.8);
        }
      }
    },

    _drawAirSpecs(ctx, specs, pal) {
      ctx.save();
      ctx.fillStyle = pal.inkFaint;
      for (const sp of specs) {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },

    _drawStageWatermark(ctx, w, h, stageId, pal, time) {
      ctx.save();
      ctx.strokeStyle = pal.inkFaint;
      ctx.fillStyle = pal.inkFaint;
      ctx.lineWidth = 1.7;
      const cx = w / 2;
      const cy = h / 2;

      if (stageId === 0) {
        // Stage 1: Gently swaying ceiling pendant lamp + moonlight cone + subtle side window blind frame
        const sway = Math.sin(time * 0.9) * 14;
        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx + sway * 0.35, 62);
        ctx.arc(cx + sway * 0.35, 78, 22, Math.PI, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.moveTo(cx + sway * 0.35 - 22, 78); ctx.lineTo(cx - 210 + sway, h);
        ctx.moveTo(cx + sway * 0.35 + 22, 78); ctx.lineTo(cx + 210 + sway, h);
        ctx.stroke();
        ctx.setLineDash([]);
        // Minimalist window blind slats far right
        for (let y = 130; y <= 290; y += 22) {
          ctx.beginPath();
          ctx.moveTo(w - 140, y); ctx.lineTo(w - 30, y);
          ctx.stroke();
        }
      } else if (stageId === 1) {
        // Stage 2: Han River suspension bridge cables, arches & shimmering water dashes
        const waterY = h * 0.72;
        ctx.beginPath();
        ctx.moveTo(0, waterY); ctx.lineTo(w, waterY);
        for (let x = w * 0.08; x < w * 0.92; x += 220) {
          ctx.moveTo(x, waterY);
          ctx.arc(x + 110, waterY, 110, Math.PI, 0, false);
          ctx.moveTo(x + 110, waterY - 110); ctx.lineTo(x + 110, waterY);
        }
        ctx.stroke();
        // Gentle animated river ripples
        for (let row = 0; row < 4; row++) {
          const ry = waterY + 24 + row * 24;
          const shift = Math.sin(time * 1.2 + row) * 18;
          for (let rx = 60 + row * 40; rx < w - 60; rx += 140) {
            ctx.beginPath();
            ctx.moveTo(rx + shift, ry); ctx.lineTo(rx + 42 + shift, ry);
            ctx.stroke();
          }
        }
      } else if (stageId === 2) {
        // Stage 3: Crescent moon, swaying wetland reeds & floating fireflies
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.24, 38, 0.35, Math.PI * 1.65);
        ctx.stroke();
        for (let i = 0; i < 11; i++) {
          const rx = w * (0.06 + i * 0.09);
          const sway = Math.sin(time * 1.3 + i * 0.9) * 12;
          ctx.beginPath();
          ctx.moveTo(rx, h);
          ctx.quadraticCurveTo(rx + sway, h - 85, rx + sway * 1.8, h - 160);
          ctx.stroke();
        }
      } else if (stageId === 3) {
        // Stage 4: Rainforest botanical framing arcs + faint diagonal rain streaks
        for (let r = 130; r <= 370; r += 80) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        const rainShift = (time * 160) % 120;
        ctx.beginPath();
        for (let rx = -80; rx < w + 80; rx += 120) {
          for (let ry = -80; ry < h + 80; ry += 120) {
            const x1 = rx + rainShift * 0.45;
            const y1 = ry + rainShift;
            ctx.moveTo(x1, y1); ctx.lineTo(x1 - 12, y1 + 26);
          }
        }
        ctx.stroke();
      } else if (stageId === 4) {
        // Stage 5: Stratosphere curved Earth horizon + orbital satellite track
        const earthR = Math.max(w, h) * 0.9;
        ctx.beginPath();
        ctx.arc(cx, h + earthR * 0.78, earthR, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(cx, h + earthR * 0.78, earthR + 55, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Stage 6: Slowly rotating global wireframe Earth & extinction drafting crosshairs
        const globeR = Math.min(w, h) * 0.4;
        ctx.beginPath();
        ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
        ctx.stroke();
        const rot = (time * 0.25) % 1;
        for (let k = -2; k <= 2; k++) {
          const factor = Math.abs(Math.sin((k * 0.22 + rot) * Math.PI));
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.max(8, globeR * factor), globeR, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (const ly of [-0.45, 0, 0.45]) {
          const rw = Math.sqrt(Math.max(0.1, 1 - ly * ly)) * globeR;
          ctx.beginPath();
          ctx.ellipse(cx, cy + ly * globeR, rw, rw * 0.22, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    },

    _drawFallingDebris(ctx, fd, pal) {
      const alpha = Math.max(0, fd.life / fd.maxLife);
      ctx.save();
      ctx.translate(fd.x, fd.y);
      ctx.rotate(fd.rot);
      ctx.scale(fd.scale, fd.scale);
      ctx.globalAlpha = alpha * 0.75;
      if (fd.kind === 'wing') {
        ctx.fillStyle = pal.wingFill;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6.5, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (fd.kind === 'drop') {
        ctx.fillStyle = pal.red;
        ctx.beginPath();
        ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = pal.ink;
        ctx.fillRect(-2, -2, 4, 4);
      }
      ctx.restore();
    },

    _drawMissile(ctx, ms, pal) {
      if (ms.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = pal.red;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.55;
        this._tracePolyline(ctx, ms.trail);
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(ms.x, ms.y);
      ctx.rotate(Math.atan2(ms.vy, ms.vx));
      ctx.fillStyle = pal.red;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-4, -3.5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },

    _drawDrone(ctx, dr, time, pal) {
      ctx.save();
      ctx.translate(dr.x, dr.y + Math.sin(dr.phase) * 3);
      ctx.rotate(Math.atan2(dr.vy, dr.vx) * 0.15);

      // Cute mini autonomous flying electric racket drone!
      ctx.fillStyle = pal.volt;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pal.surface;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tiny buzzing side rotors
      const rotorW = 6 + Math.sin(time * 40 + dr.phase) * 3;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15 - rotorW / 2, -6); ctx.lineTo(-15 + rotorW / 2, -6);
      ctx.moveTo(15 - rotorW / 2, -6); ctx.lineTo(15 + rotorW / 2, -6);
      ctx.stroke();
      ctx.restore();
    },

    _drawUVLamp(ctx, lamp, time, pal) {
      const pulse = 1 + Math.sin(time * 3.8 + lamp.phase) * 0.05;
      ctx.save();
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.32)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, lamp.radius * pulse * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
      ctx.fill();

      ctx.fillStyle = pal.surface;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(lamp.x - 10, lamp.y - 16, 20, 32, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.roundRect(lamp.x - 4, lamp.y - 11, 8, 22, 3);
      ctx.fill();
      ctx.restore();
    },

    _drawCoil(ctx, coil, pal) {
      ctx.save();
      ctx.translate(coil.x, coil.y);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.36)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, coil.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.rotate(coil.angle);
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let t = 0; t < Math.PI * 4.5; t += 0.22) {
        const r = t * 1.6;
        if (t === 0) ctx.moveTo(Math.cos(t) * r, Math.sin(t) * r);
        else ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r);
      }
      ctx.stroke();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      const tipT = Math.PI * 4.5;
      ctx.fillStyle = pal.red;
      ctx.beginPath();
      ctx.arc(Math.cos(tipT) * tipT * 1.6, Math.sin(tipT) * tipT * 1.6, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },

    _drawTurret(ctx, turret, pal) {
      ctx.save();
      ctx.translate(turret.x, turret.y);
      ctx.fillStyle = pal.surface;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
        else ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.rotate(turret.angle);
      ctx.fillStyle = pal.ink;
      ctx.fillRect(0, -3.2, 18, 6.4);
      ctx.fillStyle = pal.red;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },

    // ================= ICONIC SLENDER, LONG-LEGGED AIRBORNE MOSQUITO =================
    _drawFlyingMosquito(ctx, m, time, pal) {
      const hoverY = Math.sin(m.hoverPhase) * 3.8;
      const drawX = m.x;
      const drawY = m.y + hoverY;
      const facingLeft = m.vx < -4;
      const tilt = Math.max(-0.28, Math.min(0.28, m.vy * 0.002));

      // 1. Subtle dashed airborne flight trail (`- - -`)
      if (m.trail && m.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = m.type === 'golden' ? 'rgba(245, 158, 11, 0.45)' : m.type === 'bomb' ? 'rgba(229, 56, 59, 0.35)' : pal.inkSoft;
        ctx.lineWidth = m.type === 'golden' ? 1.6 : 0.95;
        ctx.setLineDash([3, 5]);
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(m.trail[0].x, m.trail[0].y);
        for (let i = 1; i < m.trail.length; i++) ctx.lineTo(m.trail[i].x, m.trail[i].y);
        ctx.lineTo(drawX, drawY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 2. Distant soft floor shadow far below (+30px) for genuine floating height
      ctx.save();
      ctx.fillStyle = pal.airShadow;
      const shadowScale = 0.85 - Math.sin(m.hoverPhase) * 0.08;
      ctx.beginPath();
      ctx.ellipse(drawX + 3, m.y + 30, m.radius * 0.8 * shadowScale, m.radius * 0.2 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(drawX, drawY);
      const sc = (m.radius / 12.2) * (m.depthScale || 1);
      ctx.scale(facingLeft ? -sc : sc, sc);
      ctx.rotate(facingLeft ? -tilt : tilt);

      const flap = Math.sin(m.wingPhase);
      const sway = Math.sin(m.hoverPhase * 1.3) * 1.4;
      const isFlash = m.hitFlash > 0;
      const strokeCol = isFlash ? pal.red : pal.ink;

      // Golden mosquito sparkles
      if (m.type === 'golden') {
        ctx.save();
        ctx.fillStyle = '#f59e0b';
        for (let i = 0; i < 3; i++) {
          const sa = time * 4.5 + (i * Math.PI * 2) / 3;
          const sx = Math.cos(sa) * 20;
          const sy = Math.sin(sa) * 13;
          ctx.beginPath();
          ctx.moveTo(sx, sy - 3.2); ctx.lineTo(sx + 1, sy - 1);
          ctx.lineTo(sx + 3.2, sy); ctx.lineTo(sx + 1, sy + 1);
          ctx.lineTo(sx, sy + 3.2); ctx.lineTo(sx - 1, sy + 1);
          ctx.lineTo(sx - 3.2, sy); ctx.lineTo(sx - 1, sy - 1);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Volatile BOMB Mosquito pulsing danger halo
      if (m.type === 'bomb') {
        const bp = 1 + Math.sin(time * 14 + m.hoverPhase) * 0.14;
        ctx.save();
        ctx.strokeStyle = pal.red;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(-6, 2, 13.5 * bp, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Electric X-Ray Shock Halo when zapped by 220V current!
      if (m.electricShock > 0) {
        ctx.save();
        ctx.strokeStyle = pal.volt;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const sa = (s / 6) * Math.PI * 2 + time * 24;
          const r1 = 10;
          const r2 = 17 + (s % 2) * 5;
          ctx.moveTo(Math.cos(sa) * r1, Math.sin(sa) * r1);
          ctx.lineTo(Math.cos(sa + 0.12) * r2, Math.sin(sa + 0.12) * r2);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 3. Far-side Slender Lance Wing (swept cleanly back from top of humpback!)
      ctx.save();
      ctx.translate(0.5, -3.8);
      ctx.rotate(-0.42 + flap * 0.42);
      ctx.fillStyle = pal.wingFill;
      ctx.strokeStyle = pal.inkSoft;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-8, -5.2, -16.5, -3.2);
      ctx.quadraticCurveTo(-8.5, -0.4, 0, 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 4. Far-side Hair-Thin Jointed Legs (lighter ink for 3D depth)
      ctx.strokeStyle = pal.inkSoft;
      ctx.lineWidth = 0.75;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      // Far front leg
      ctx.moveTo(3.2, 0.2); ctx.lineTo(8.5, -1.8); ctx.lineTo(10.8, 8.2); ctx.lineTo(13.8, 11.2);
      // Far mid leg
      ctx.moveTo(1.2, 0.4); ctx.lineTo(2.4, 6.2); ctx.lineTo(-1.2, 14.5 + sway * 0.4); ctx.lineTo(-3.8, 17.2 + sway * 0.4);
      // Far hind leg (classic trailing upturned curl!)
      ctx.moveTo(-1.0, 0.2); ctx.lineTo(-7.5, -2.8); ctx.lineTo(-17.8, 8.2 + sway * 0.6); ctx.lineTo(-23.2, 6.0 + sway * 0.6);
      ctx.stroke();

      // 5. Near-side Iconic Extra-Long, High-Knee Spindly Mosquito Legs!
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      // Near front leg: sharp forward-up knee -> dangling foreleg -> tiny hooked foot
      ctx.moveTo(3.6, 0.4);
      ctx.lineTo(9.8, -2.6);
      ctx.lineTo(12.2, 9.2);
      ctx.lineTo(15.6, 12.6);
      // Near mid leg: angled knee -> long steep hanging shin
      ctx.moveTo(1.4, 0.7);
      ctx.lineTo(3.0, 7.0);
      ctx.lineTo(-2.2, 16.4 + sway * 0.5);
      ctx.lineTo(-5.5, 19.0 + sway * 0.5);
      // Near hind leg: signature high back-knee -> long trailing leg -> upturned mosquito tip!
      ctx.moveTo(-0.8, 0.4);
      ctx.lineTo(-8.6, -3.4);
      ctx.lineTo(-19.5, 9.4 + sway * 0.8);
      ctx.lineTo(-25.4, 6.8 + sway * 0.8);
      ctx.stroke();

      // 6. Ultra-Slender Segmented Mosquito Abdomen (thin waist -> long tapered rod!)
      if (m.type === 'fat') {
        // Thin mosquito waist opening into a heavy pendulous crimson blood sac + pointed tip!
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-1.2, -1.2);
        ctx.lineTo(-4.8, 0.5);
        ctx.stroke();

        ctx.fillStyle = isFlash ? '#ffffff' : pal.red;
        ctx.lineWidth = 1.45;
        ctx.beginPath();
        ctx.moveTo(-4.0, -0.4);
        ctx.bezierCurveTo(-7.5, -2.5, -14.8, 0.4, -17.2, 5.2);
        ctx.bezierCurveTo(-13.2, 7.6, -6.2, 6.2, -4.0, 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shiny blood highlight
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.ellipse(-9.5, 1.4, 2.8, 1.0, 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.type === 'bomb') {
        // Thin waist + volatile yellow-black banded abdomen!
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-1.4, -1.4);
        ctx.bezierCurveTo(-7.2, -2.4, -14.5, 0.8, -17.6, 5.4);
        ctx.bezierCurveTo(-13.2, 6.6, -6.2, 4.4, -1.4, 1.2);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = pal.volt;
        ctx.fillRect(-19, -5, 20, 14);
        ctx.fillStyle = '#141414';
        ctx.fillRect(-13, -5, 2.8, 14);
        ctx.fillRect(-7.5, -5, 2.8, 14);
        ctx.restore();
        ctx.strokeStyle = pal.red;
        ctx.lineWidth = 1.45;
        ctx.beginPath();
        ctx.moveTo(-1.4, -1.4);
        ctx.bezierCurveTo(-7.2, -2.4, -14.5, 0.8, -17.6, 5.4);
        ctx.bezierCurveTo(-13.2, 6.6, -6.2, 4.4, -1.4, 1.2);
        ctx.closePath();
        ctx.stroke();
      } else {
        // True needle-slender segmented mosquito abdomen (long & graceful!)
        ctx.fillStyle = isFlash ? '#ffffff' : m.type === 'golden' ? '#fbbf24' : pal.ink;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.moveTo(-1.2, -1.5);
        ctx.quadraticCurveTo(-9.0, -0.5, -17.6, 5.0);
        ctx.quadraticCurveTo(-9.6, 3.8, -1.4, 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crisp fine abdominal segment bands (classic mosquito stripes)
        ctx.strokeStyle = m.type === 'golden' ? '#fef3c7' : pal.surface;
        ctx.lineWidth = 0.85;
        const bands = [
          [-4.8, -0.7, -5.6, 1.7],
          [-8.2, 0.3, -9.0, 2.7],
          [-11.6, 1.5, -12.3, 3.6],
          [-14.6, 2.8, -15.1, 4.3],
        ];
        ctx.beginPath();
        for (const b of bands) {
          ctx.moveTo(b[0], b[1]); ctx.lineTo(b[2], b[3]);
        }
        ctx.stroke();
      }

      // 7. Prominent Arched Humpback Thorax (the unmistakable mosquito hunch!)
      ctx.fillStyle = isFlash ? '#ffffff' : m.type === 'golden' ? '#f59e0b' : pal.ink;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.ellipse(1.6, -2.0, 3.6, 2.7, -0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 8. Petite Head tucked low-front + Eye + Feathered Antennae + LONG SYRINGE PROBOSCIS!
      ctx.fillStyle = isFlash ? '#ffffff' : pal.ink;
      ctx.beginPath();
      ctx.arc(5.8, -0.3, 1.85, 0, Math.PI * 2);
      ctx.fill();

      // Tiny crisp eye glint
      ctx.fillStyle = m.type === 'bomb' ? pal.volt : pal.surface;
      ctx.beginPath();
      ctx.arc(6.5, -0.8, 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Delicate V-shaped Feathered Antennae (더듬이)
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(6.9, -1.7); ctx.lineTo(11.6, -5.6);
      ctx.moveTo(7.2, -1.2); ctx.lineTo(12.6, -3.2);
      // Tiny feather barbs on top antenna
      ctx.moveTo(9.0, -3.4); ctx.lineTo(9.4, -4.9);
      ctx.moveTo(10.4, -4.6); ctx.lineTo(10.8, -5.9);
      ctx.stroke();

      // LONG RAZOR-SHARP SYRINGE PROBOSCIS (침!)
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(7.3, 0.3);
      ctx.lineTo(18.2, 4.6);
      ctx.stroke();
      // Tiny maxillary palps flanking base of proboscis
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(7.4, -0.1); ctx.lineTo(10.2, 0.7);
      ctx.stroke();

      // 9. Near-side Narrow Elongated Spear Wing (vibrating cleanly — NO chunky fly halo!)
      ctx.save();
      ctx.translate(1.2, -3.8);
      // Subtle rapid-flutter motion echo line
      ctx.strokeStyle = pal.inkSoft;
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(-4, -5.8);
      ctx.quadraticCurveTo(-11, -8.5, -16, -6.5);
      ctx.stroke();

      ctx.rotate(-0.18 - flap * 0.56);
      ctx.fillStyle = isFlash ? '#ffffff' : pal.wingFill;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-8.5, -4.6, -17.5, -1.8);
      ctx.quadraticCurveTo(-9.0, 0.9, 0, 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Delicate center wing vein
      ctx.strokeStyle = pal.inkSoft;
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(-0.5, 0);
      ctx.lineTo(-15.5, -1.7);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // Crisp HP bar only when damaged on special types
      if (m.hp < m.maxHp && (m.type === 'fat' || m.type === 'golden' || m.type === 'bomb')) {
        const bw = m.radius * 2.1;
        ctx.fillStyle = pal.surface;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.4;
        ctx.fillRect(drawX - bw / 2, drawY - m.radius - 13, bw, 4.5);
        ctx.fillStyle = m.type === 'golden' ? '#f59e0b' : m.type === 'bomb' ? pal.volt : pal.red;
        ctx.fillRect(drawX - bw / 2, drawY - m.radius - 13, bw * Math.max(0, m.hp / m.maxHp), 4.5);
        ctx.strokeRect(drawX - bw / 2, drawY - m.radius - 13, bw, 4.5);
      }
    },

    // ================= AIRBORNE BOSS: GIANT SLENDER STRIPED ADIDAS TIGER MOSQUITO =================
    _drawBoss(ctx, m, time, pal) {
      const hoverY = Math.sin(m.hoverPhase) * 6.5;
      const drawX = m.x;
      const drawY = m.y + hoverY;
      const facingLeft = m.vx < -8;

      // Distant soft floor shadow far below boss
      ctx.save();
      ctx.fillStyle = pal.airShadow;
      ctx.beginPath();
      ctx.ellipse(drawX + 6, m.y + 62, 42, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Boss Telegraphed Crimson Dash Aim-Line!
      if (m.dashTelegraph > 0) {
        ctx.save();
        ctx.strokeStyle = pal.red;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        ctx.lineTo(m.dashTargetX, m.dashTargetY);
        ctx.stroke();
        ctx.setLineDash([]);
        // Target lock ring at destination
        ctx.beginPath();
        ctx.arc(m.dashTargetX, m.dashTargetY, 14 + m.dashTelegraph * 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(drawX, drawY);

      const pulse = 1 + Math.sin(time * 7) * 0.07;
      ctx.strokeStyle = pal.red;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, m.radius * 1.48 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (facingLeft) ctx.scale(-1, 1);
      ctx.rotate(Math.max(-0.2, Math.min(0.2, m.vy * 0.0016)));

      const flap = Math.sin(m.wingPhase);
      const isFlash = m.hitFlash > 0;

      // Back Narrow Lance Wing
      ctx.save();
      ctx.translate(2, -13);
      ctx.rotate(-0.42 + flap * 0.4);
      ctx.fillStyle = pal.wingFill;
      ctx.strokeStyle = pal.inkSoft;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-24, -18, -54, -10);
      ctx.quadraticCurveTo(-28, -2, 0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 6 Extra-Long BLACK-AND-WHITE BANDED ADIDAS TIGER LEGS (High knees + upturned trailing hind legs!)
      const legChains = [
        [[11, 1], [29, -8], [36, 28], [46, 36]],       // Front high-knee leg
        [[4, 2], [9, 22], [-7, 48], [-17, 55]],        // Mid steep hanging leg
        [[-3, 1], [-26, -11], [-58, 28], [-74, 20]],   // Signature giant curled hind leg!
        [[-5, 0], [-22, -7], [-50, 22], [-64, 15]],    // Far hind leg
      ];
      for (const pts of legChains) {
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = 3.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
        ctx.stroke();
        // Crisp white Adidas stripes along every leg segment!
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([5, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Giant Slender Tapered Black-and-White Striped Abdomen!
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-4, -5);
      ctx.quadraticCurveTo(-28, -2, -56, 17);
      ctx.quadraticCurveTo(-30, 14, -4, 4);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = isFlash ? pal.red : '#141414';
      ctx.fillRect(-62, -12, 64, 38);
      ctx.fillStyle = '#ffffff';
      for (let sx = -50; sx <= -8; sx += 9) {
        ctx.fillRect(sx, -12, 4, 38);
      }
      ctx.restore();

      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-4, -5);
      ctx.quadraticCurveTo(-28, -2, -56, 17);
      ctx.quadraticCurveTo(-30, 14, -4, 4);
      ctx.closePath();
      ctx.stroke();

      // Prominent Humpback Thorax with True Aedes White Dorsal Stripe!
      ctx.fillStyle = isFlash ? pal.red : '#141414';
      ctx.beginPath();
      ctx.ellipse(5, -6, 12.5, 9.5, -0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-5, -8); ctx.lineTo(14, -10);
      ctx.stroke();

      // Petite Fierce Head + Crimson Eye + Feathered Antennae + Giant Syringe Needle!
      ctx.fillStyle = '#141414';
      ctx.beginPath();
      ctx.arc(19, -1, 6.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = pal.red;
      ctx.beginPath();
      ctx.ellipse(21.5, -2.5, 3.0, 1.9, -0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(23, -6); ctx.lineTo(38, -18);
      ctx.moveTo(24, -4); ctx.lineTo(41, -11);
      ctx.stroke();

      // Extra-long deadly syringe proboscis!
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(25, 1.5);
      ctx.lineTo(62 + Math.sin(time * 22) * 2, 16);
      ctx.stroke();

      // Front Narrow Veined Lance Wing
      ctx.save();
      ctx.translate(4, -13);
      ctx.rotate(-0.18 - flap * 0.54);
      ctx.fillStyle = isFlash ? 'rgba(255,255,255,0.88)' : pal.wingFill;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-26, -15, -58, -5);
      ctx.quadraticCurveTo(-30, 4, 0, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = pal.inkSoft;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-2, 0); ctx.lineTo(-52, -5);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    },

    _drawCursorTrail(ctx, trail, pal) {
      if (trail.length < 2) return;
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        ctx.strokeStyle = pal.ink;
        ctx.globalAlpha = (i / trail.length) * 0.14;
        ctx.lineWidth = (i / trail.length) * 5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    },

    _drawAnatomicalHand(ctx, fillCol, strokeCol, mirror = 1) {
      ctx.save();
      ctx.scale(mirror, 1);
      ctx.fillStyle = fillCol;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(-10, 26);
      ctx.lineTo(-12, 13);
      ctx.bezierCurveTo(-17, 10, -23, 5, -26, -1);
      ctx.bezierCurveTo(-28, -5, -24, -8, -20, -5);
      ctx.bezierCurveTo(-17, -3, -15, -1, -13, 1);
      ctx.lineTo(-13, -17);
      ctx.bezierCurveTo(-13, -22, -7, -22, -7, -17);
      ctx.lineTo(-6.5, -5);
      ctx.lineTo(-5.5, -23);
      ctx.bezierCurveTo(-5.5, -28, 0.8, -28, 0.8, -23);
      ctx.lineTo(1, -5.5);
      ctx.lineTo(2.5, -20.5);
      ctx.bezierCurveTo(2.5, -25.5, 8.5, -25.5, 8.5, -20.5);
      ctx.lineTo(8, -4);
      ctx.lineTo(10, -14.5);
      ctx.bezierCurveTo(10, -19, 15.5, -19, 15.5, -14.5);
      ctx.lineTo(14.5, 5);
      ctx.bezierCurveTo(14.5, 13, 11, 18, 9, 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-9, 11); ctx.quadraticCurveTo(-5, 3, -10, -1);
      ctx.moveTo(-6, 1); ctx.quadraticCurveTo(2, -1, 10, 2);
      // Crisp wrist cuff band + delicate fingertip nail arcs
      ctx.moveTo(-9, 22); ctx.lineTo(8, 22);
      ctx.stroke();

      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.arc(-10, -17.5, 2.0, Math.PI, 0);
      ctx.arc(-2.3, -23.5, 2.1, Math.PI, 0);
      ctx.arc(5.5, -21, 2.0, Math.PI, 0);
      ctx.arc(12.7, -15, 1.8, Math.PI, 0);
      ctx.stroke();
      ctx.restore();
    },

    _drawWeaponCursor(ctx, x, y, radius, weapon, eng, pal) {
      const fever = eng.feverActive;
      const tilt = Math.max(-0.32, Math.min(0.32, eng.mouse.vx * 0.013));
      const slap = eng.mouse.slapAnim;

      ctx.save();
      ctx.translate(x, y);

      // Clean Minimalist Range Ring
      ctx.save();
      ctx.strokeStyle = fever ? pal.red : weapon.tier >= 3 ? pal.ink : pal.inkSoft;
      ctx.lineWidth = fever ? 2.4 : 1.4;
      ctx.setLineDash(weapon.tier >= 3 ? [7, 5] : [4, 6]);
      ctx.lineDashOffset = -eng.time * (weapon.tier >= 3 ? 34 : 14);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (fever) {
        ctx.fillStyle = 'rgba(255, 202, 0, 0.1)';
        ctx.fill();
      }
      ctx.restore();

      if (weapon.tier === 0) {
        ctx.rotate(tilt);
        if (slap > 0.02) {
          const offset = (1 - Math.sin(slap * Math.PI)) * 22;
          ctx.save();
          ctx.translate(-offset - 4, 2);
          ctx.rotate(-0.18 * (1 - slap));
          this._drawAnatomicalHand(ctx, pal.handFill, pal.ink, -1);
          ctx.restore();
          ctx.save();
          ctx.translate(offset + 4, 2);
          ctx.rotate(0.18 * (1 - slap));
          this._drawAnatomicalHand(ctx, pal.handFill, pal.ink, 1);
          ctx.restore();
        } else {
          ctx.save();
          ctx.translate(4, 6);
          this._drawAnatomicalHand(ctx, pal.shadow, 'transparent', 1);
          ctx.restore();
          this._drawAnatomicalHand(ctx, pal.handFill, pal.ink, 1);
        }
      } else if (weapon.tier === 1) {
        const squash = 1 - slap * 0.24;
        ctx.rotate(tilt - 0.12 + slap * 0.28);
        ctx.scale(1 + slap * 0.15, squash);

        ctx.save();
        ctx.translate(4, 6);
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.roundRect(-24, -29, 48, 46, 9);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = pal.surface;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-3.5, 17); ctx.lineTo(3.5, 17);
        ctx.lineTo(5.5, 58); ctx.quadraticCurveTo(0, 64, -5.5, 58);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.paper;
        ctx.beginPath();
        ctx.arc(0, 54, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-24, -29, 48, 46, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.paper;
        ctx.beginPath();
        ctx.roundRect(-18.5, -23.5, 37, 35, 5);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        for (let gx = -12; gx <= 12; gx += 6) { ctx.moveTo(gx, -23.5); ctx.lineTo(gx, 11.5); }
        for (let gy = -17.5; gy <= 6; gy += 6) { ctx.moveTo(-18.5, gy); ctx.lineTo(18.5, gy); }
        ctx.stroke();
      } else if (weapon.tier === 2) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 150, 199, 0.13)';
        ctx.strokeStyle = 'rgba(0, 150, 199, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(-6, -12); ctx.lineTo(-48, -42);
        ctx.arc(-6, -12, 54, -Math.PI * 0.82, -Math.PI * 0.48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.save();
        ctx.translate(10, 12);
        ctx.rotate(-0.42 - slap * 0.12);
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.roundRect(-9, -15, 24, 44, 5);
        ctx.fill();

        ctx.fillStyle = pal.surface;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-12, -16, 24, 42, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.cyan;
        ctx.fillRect(-11, -5, 22, 16);
        ctx.fillStyle = pal.ink;
        ctx.fillRect(-11, 12, 22, 4);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 7px "JetBrains Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('KILL', 0, 5.5);

        ctx.fillStyle = pal.surface;
        ctx.beginPath();
        ctx.arc(0, -16, 11.5, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const pressY = slap * 2.5;
        ctx.fillStyle = pal.red;
        ctx.beginPath();
        ctx.roundRect(-4.5, -31 + pressY, 9, 8, 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-3.5, -27 + pressY, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (weapon.tier === 3) {
        const sc = 1 - slap * 0.12;
        ctx.rotate(tilt - 0.14);
        ctx.scale(sc, sc);

        ctx.save();
        ctx.translate(5, 7);
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.ellipse(0, -6, 28, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = pal.ink;
        ctx.beginPath();
        ctx.roundRect(-6.5, 34, 13, 32, 6);
        ctx.fill();
        ctx.strokeStyle = pal.surface;
        ctx.lineWidth = 1.2;
        for (let gy = 48; gy <= 60; gy += 4) {
          ctx.beginPath(); ctx.moveTo(-4, gy); ctx.lineTo(4, gy); ctx.stroke();
        }
        ctx.fillStyle = pal.red;
        ctx.beginPath();
        ctx.arc(0, 41, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Crisp "220V" stencil badge on handle!
        ctx.fillStyle = pal.volt;
        ctx.font = '900 6px "JetBrains Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('220V', 0, 39.5 + 24);

        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(-4, 35); ctx.lineTo(-10, 24);
        ctx.moveTo(4, 35); ctx.lineTo(10, 24);
        ctx.stroke();

        ctx.fillStyle = pal.volt;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(0, -6, 28, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.dark ? 'rgba(18,19,22,0.72)' : 'rgba(246,245,240,0.86)';
        ctx.beginPath();
        ctx.ellipse(0, -6, 22, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, -6, 21.5, 27.5, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        for (let gx = -18; gx <= 18; gx += 6) { ctx.moveTo(gx, -36); ctx.lineTo(gx, 24); }
        for (let gy = -30; gy <= 18; gy += 7) { ctx.moveTo(-24, gy); ctx.lineTo(24, gy); }
        ctx.stroke();
        ctx.restore();

        if (Math.random() < 0.7) {
          const sx = (Math.random() - 0.5) * 26;
          const sy = -6 + (Math.random() - 0.5) * 32;
          ctx.strokeStyle = pal.ink;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + (Math.random() - 0.5) * 18, sy + (Math.random() - 0.5) * 18);
          ctx.stroke();
          ctx.strokeStyle = pal.volt;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      } else if (weapon.tier === 4) {
        ctx.rotate(tilt);
        ctx.fillStyle = pal.ink;
        ctx.beginPath();
        ctx.roundRect(-7, 30, 14, 30, 4);
        ctx.fill();

        ctx.fillStyle = pal.surface;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
          if (i === 0) ctx.moveTo(Math.cos(a) * 33, Math.sin(a) * 33 - 2);
          else ctx.lineTo(Math.cos(a) * 33, Math.sin(a) * 33 - 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        for (const side of [-1, 1]) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(side * 22 - 5, -14, 10, 24, 3);
          ctx.fill();
          ctx.stroke();
        }

        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(-17, -2);
        ctx.lineTo(-6, -2 + (Math.random() - 0.5) * 18);
        ctx.lineTo(6, -2 + (Math.random() - 0.5) * 18);
        ctx.lineTo(17, -2);
        ctx.stroke();
        ctx.strokeStyle = pal.volt;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else if (weapon.tier === 5) {
        for (let ring = 0; ring < 3; ring++) {
          ctx.save();
          ctx.rotate(eng.time * (ring % 2 === 0 ? 2.4 : -3.1) + ring * 1.05);
          ctx.strokeStyle = pal.ink;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.ellipse(0, 0, 35 - ring * 5, 16 + ring * 4, 0, 0, Math.PI * 2);
          ctx.stroke();
          if (ring === 1) {
            ctx.strokeStyle = pal.volt;
            ctx.lineWidth = 1.4;
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.fillStyle = pal.volt;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, 9.5 + Math.sin(eng.time * 16) * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = pal.dark ? 'rgba(255, 225, 53, 0.12)' : 'rgba(255, 202, 0, 0.18)';
        ctx.fillRect(-14, -y, 28, y);
        ctx.strokeStyle = pal.inkSoft;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-14, -y); ctx.lineTo(-14, 0);
        ctx.moveTo(14, -y); ctx.lineTo(14, 0);
        ctx.stroke();

        ctx.save();
        ctx.rotate(eng.time * 1.3);
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.6;
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(0, 0, 34, a + 0.2, a + Math.PI / 2 - 0.2);
          ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = pal.red;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-44, 0); ctx.lineTo(-14, 0);
        ctx.moveTo(14, 0); ctx.lineTo(44, 0);
        ctx.moveTo(0, -44); ctx.lineTo(0, -14);
        ctx.moveTo(0, 14); ctx.lineTo(0, 44);
        ctx.stroke();

        ctx.fillStyle = pal.volt;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.inkSoft;
        ctx.font = '800 9px "JetBrains Mono", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`X:${Math.round(x)} Y:${Math.round(y)}`, 42, -26);
        ctx.fillStyle = pal.red;
        ctx.fillText('ION LOCK', 42, -15);
      }

      ctx.restore();
    },
  };

  window.ZAP.Renderer = Renderer;
})();
