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
      const parent = this.canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(320, Math.floor(rect.height));
      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      return { width: w, height: h };
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

      // 3. UV Lamps, Coils, Turrets & Window Breach Rift
      for (const lamp of eng.uvLamps) this._drawUVLamp(ctx, lamp, eng.time, pal);
      for (const coil of eng.coils) this._drawCoil(ctx, coil, pal);
      for (const turret of eng.turrets) this._drawTurret(ctx, turret, pal);
      if (eng.breach) this._drawWindowBreach(ctx, eng.breach, eng.time, pal);

      // 4. Orbital Plasma Beams & Sculpted Tier 7+ Vertical Sky-Ion Strikes
      for (const b of eng.orbitalBeams) {
        ctx.save();
        const beamGrad = ctx.createLinearGradient(b.x - b.width, 0, b.x + b.width, 0);
        beamGrad.addColorStop(0, 'rgba(255, 202, 0, 0)');
        beamGrad.addColorStop(0.3, pal.dark ? 'rgba(255, 225, 53, 0.25)' : 'rgba(255, 202, 0, 0.34)');
        beamGrad.addColorStop(0.5, pal.surface);
        beamGrad.addColorStop(0.7, pal.dark ? 'rgba(255, 225, 53, 0.25)' : 'rgba(255, 202, 0, 0.34)');
        beamGrad.addColorStop(1, 'rgba(255, 202, 0, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(b.x - b.width, 0, b.width * 2, h);
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(b.x - b.width * 0.22, 0); ctx.lineTo(b.x - b.width * 0.22, h);
        ctx.moveTo(b.x + b.width * 0.22, 0); ctx.lineTo(b.x + b.width * 0.22, h);
        ctx.stroke();
        ctx.restore();
      }
      for (const sb of eng.ionSkyBeams) {
        const a = Math.max(0, sb.life / sb.maxLife);
        ctx.save();
        ctx.globalAlpha = a;
        // Soft tapered sky corona
        const bw = 16 * a;
        const g = ctx.createLinearGradient(sb.x - bw, 0, sb.x + bw, 0);
        g.addColorStop(0, 'rgba(255, 202, 0, 0)');
        g.addColorStop(0.5, 'rgba(255, 202, 0, 0.42)');
        g.addColorStop(1, 'rgba(255, 202, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(sb.x - bw, 0, bw * 2, sb.y);
        // Razor ink-cased central ion lance
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 4.8 * a;
        ctx.beginPath();
        ctx.moveTo(sb.x, 0); ctx.lineTo(sb.x, sb.y);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8 * a;
        ctx.stroke();
        // Ground-contact splash ring & cross flare!
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(sb.x, sb.y, (1 - a) * 24 + 6, (1 - a) * 8 + 2.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Tumbling 3D-Flipping Veined Wings & Sculpted S-Curve Rising Ink Smoke Wisps
      for (const fd of eng.fallingDebris) {
        this._drawFallingDebris(ctx, fd, pal);
      }
      for (const sw of eng.smokeWisps) {
        this._drawSmokeWisp(ctx, sw, pal);
      }

      // 6. Double-Edge Kinetic Shock-Rings (Leading ink edge + accent echo + tapered burst rays!)
      for (const r of eng.rings) {
        const alpha = Math.max(0, r.life / r.maxLife);
        const col = r.color === '#141414' ? pal.ink : r.color;
        ctx.save();
        ctx.globalAlpha = alpha;
        // Leading crisp outer arc
        ctx.strokeStyle = col;
        ctx.lineWidth = r.width * alpha + 0.8;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();

        // Trailing subtle inner echo ring
        if (r.r > 18) {
          ctx.globalAlpha = alpha * 0.42;
          ctx.strokeStyle = pal.ink;
          ctx.lineWidth = Math.max(0.8, r.width * alpha * 0.45);
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.r * 0.84, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Tapered manga kinetic spikes (only for spiky impact/blast pulses!)
        if (r.isSpiky && r.r > 12) {
          ctx.globalAlpha = alpha * 0.85;
          ctx.fillStyle = col;
          const rays = 12;
          for (let i = 0; i < rays; i++) {
            const a = (i / rays) * Math.PI * 2 + (i % 2) * 0.08;
            const r1 = r.r * 0.86;
            const r2 = r.r * (i % 2 === 0 ? 1.18 : 1.04);
            const spread = 0.045 * alpha;
            ctx.beginPath();
            ctx.moveTo(r.x + Math.cos(a - spread) * r1, r.y + Math.sin(a - spread) * r1);
            ctx.lineTo(r.x + Math.cos(a) * r2, r.y + Math.sin(a) * r2);
            ctx.lineTo(r.x + Math.cos(a + spread) * r1, r.y + Math.sin(a + spread) * r1);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 7. Static Volt Diamonds with Sleek Tapered Vacuum Comet-Tails!
      for (const o of eng.orbs) {
        if (o.trail && o.trail.length > 1) {
          ctx.save();
          ctx.lineCap = 'round';
          for (let i = 1; i < o.trail.length; i++) {
            const frac = i / o.trail.length;
            ctx.strokeStyle = o.color;
            ctx.globalAlpha = frac * 0.55;
            ctx.lineWidth = frac * o.r * 1.15;
            ctx.beginPath();
            ctx.moveTo(o.trail[i - 1].x, o.trail[i - 1].y);
            ctx.lineTo(o.trail[i].x, o.trail[i].y);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.fillStyle = o.color;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -o.r * 1.35);
        ctx.lineTo(o.r * 1.05, 0);
        ctx.lineTo(0, o.r * 1.35);
        ctx.lineTo(-o.r * 1.05, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 8. Homing Missiles & Drifting 220V Overcharge Capacitors!
      for (const ms of eng.missiles) {
        this._drawMissile(ctx, ms, pal);
      }
      for (const cap of eng.capacitors) {
        this._drawCapacitor(ctx, cap, eng.time, pal);
      }

      // 9. Truly Airborne Flying Mosquitoes (Smart LOD for 500-mosquito butter-smooth 60fps!) + Boss!
      const useFastSwarmLOD = eng.mosquitoes.length > 110;
      for (const m of eng.mosquitoes) {
        if (m.type === 'boss') this._drawBoss(ctx, m, eng.time, pal);
        else if (useFastSwarmLOD && m.type === 'swarm') this._drawFastSwarmMosquito(ctx, m, pal);
        else this._drawFlyingMosquito(ctx, m, eng.time, pal);
      }

      // 10. Autonomous Mini Zapper Drones (Contract C-05)
      for (const dr of eng.drones) {
        this._drawDrone(ctx, dr, eng.time, pal);
      }

      // 11. Velocity-Stretched Shard Sparks, Watercolor Mist & Manga Impact Star-Flashes!
      for (const p of eng.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        if (p.kind === 'mist') {
          ctx.globalAlpha = alpha * 0.34;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1.6 - alpha * 0.5), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'shard') {
          // Razor-sharp velocity-stretched directional needle streak!
          const ang = Math.atan2(p.vy, p.vx);
          const spd = Math.hypot(p.vx, p.vy);
          const len = Math.max(4, (p.len || 10) * alpha * Math.min(1.6, spd / 120 + 0.5));
          const w2 = Math.max(0.8, p.r * 0.55 * alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(ang);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color === '#141414' ? pal.ink : p.color;
          ctx.beginPath();
          ctx.moveTo(len, 0);
          ctx.lineTo(0, -w2);
          ctx.lineTo(-len * 0.65, 0);
          ctx.lineTo(0, w2);
          ctx.closePath();
          ctx.fill();
          if (p.color === '#ffca00' || p.color === '#f59e0b') {
            ctx.strokeStyle = '#141414';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color === '#141414' ? pal.ink : p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (alpha + 0.25), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Crisp 2-frame Manga Impact Star-Flashes!
      for (const fl of eng.flashes) {
        this._drawImpactFlash(ctx, fl, pal);
      }

      // 12. AAA Fractal Branching Tapered Lightning Bolts & Wire-Mesh Fry Sparks!
      for (const b of eng.bolts) {
        this._drawFractalBolt(ctx, b, pal);
      }
      for (const sp of eng.meshSparks) {
        const a = Math.max(0, sp.life / sp.maxLife);
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.4;
        // Sharp 4-point electric needle flare
        ctx.beginPath();
        const L = 13 * a + 4;
        const W = 2.4 * a + 0.8;
        ctx.moveTo(0, -L); ctx.lineTo(W, -W); ctx.lineTo(L, 0); ctx.lineTo(W, W);
        ctx.lineTo(0, L); ctx.lineTo(-W, W); ctx.lineTo(-L, 0); ctx.lineTo(-W, -W);
        ctx.closePath();
        ctx.fill();
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

      // 14. Sculpted Curved Wind-Vortex Arcs + 10-Tier Cursor Weapon!
      if (eng.mouse.active) {
        if (stats.vortexLevel > 0 && eng.mouse.speed > 14) {
          ctx.save();
          ctx.translate(eng.mouse.x, eng.mouse.y);
          ctx.rotate(eng.time * 5.2);
          const vr = stats.vortexRadius * 0.72;
          ctx.strokeStyle = pal.inkSoft;
          ctx.lineCap = 'round';
          for (let i = 0; i < 3; i++) {
            ctx.rotate((Math.PI * 2) / 3);
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(0, 0, vr, 0, 0.75);
            ctx.stroke();
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.arc(0, 0, vr * 0.85, 0.3, 1.0);
            ctx.stroke();
          }
          ctx.restore();
        }
        this._drawCursorTrail(ctx, eng.mouse.trail, pal);
        this._drawWeaponCursor(ctx, eng.mouse.x, eng.mouse.y, effR, stats.weapon, eng, pal);
      }

      // 15. Elastic Pop-In Comic Typography!
      for (const t of eng.texts) {
        const alpha = Math.max(0, t.life / t.maxLife);
        // Elastic pop-in curve: 0.45 -> 1.24 -> 1.0 in first 85ms!
        const age = t.age || 0;
        let popScale = 1;
        if (age < 0.05) popScale = 0.5 + (age / 0.05) * 0.74;
        else if (age < 0.11) popScale = 1.24 - ((age - 0.05) / 0.06) * 0.24;

        ctx.save();
        ctx.translate(t.x, t.y);
        if (t.rot) ctx.rotate(t.rot);
        ctx.scale(popScale, popScale);
        ctx.globalAlpha = Math.min(1, alpha * 1.45);
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

    // 3D-Flipping Veined Detached Wing & Sharp Charred Debris
    _drawFallingDebris(ctx, fd, pal) {
      const alpha = Math.max(0, fd.life / fd.maxLife);
      ctx.save();
      ctx.translate(fd.x, fd.y);
      ctx.rotate(fd.rot);
      ctx.globalAlpha = alpha * 0.82;
      if (fd.kind === 'wing') {
        // 3D flutter foreshortening!
        const flipY = 0.25 + Math.abs(Math.cos(fd.rot * 1.8)) * 0.75;
        ctx.scale(fd.scale, fd.scale * flipY);
        ctx.fillStyle = pal.wingFill;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 0.95;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.quadraticCurveTo(0, -3.2, 7.5, -0.5);
        ctx.quadraticCurveTo(0, 2.2, -7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = pal.inkSoft;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(-6, 0); ctx.lineTo(6.5, -0.4);
        ctx.stroke();
      } else if (fd.kind === 'drop') {
        ctx.scale(fd.scale, fd.scale);
        ctx.fillStyle = pal.red;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, -3.8);
        ctx.quadraticCurveTo(2.8, 0, 0, 3.2);
        ctx.quadraticCurveTo(-2.8, 0, 0, -3.8);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.scale(fd.scale, fd.scale);
        ctx.fillStyle = pal.ink;
        ctx.beginPath();
        ctx.moveTo(-3, -1); ctx.lineTo(2, -2.5); ctx.lineTo(3, 1.5); ctx.lineTo(-1.5, 2.5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },

    // Sculpted S-Curve Rising Ink Smoke Ribbon!
    _drawSmokeWisp(ctx, sw, pal) {
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = Math.max(0.8, 2.0 * alpha);
      ctx.lineCap = 'round';
      const w1 = Math.sin(sw.phase) * sw.amp;
      const w2 = Math.cos(sw.phase * 1.15) * sw.amp;
      ctx.beginPath();
      ctx.moveTo(sw.x, sw.y);
      ctx.bezierCurveTo(
        sw.x + w1, sw.y - sw.len * 0.35,
        sw.x - w2, sw.y - sw.len * 0.72,
        sw.x + w1 * 0.4, sw.y - sw.len
      );
      ctx.stroke();
      ctx.restore();
    },

    // Crisp 2-Frame Manga Asymmetric Impact Star-Flash!
    _drawImpactFlash(ctx, fl, pal) {
      const a = Math.max(0, fl.life / fl.maxLife);
      const sc = 0.7 + (1 - a) * 0.55;
      ctx.save();
      ctx.translate(fl.x, fl.y);
      ctx.rotate(fl.rot);
      ctx.scale(sc, sc);
      ctx.globalAlpha = a;

      if (fl.kind === 'puff') {
        ctx.strokeStyle = pal.cyan;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, fl.size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      } else if (fl.kind === 'cross') {
        // Blinding 4-point electric needle cross + crisp ink border!
        const L = fl.size * 1.15;
        const W = fl.size * 0.22;
        ctx.fillStyle = fl.color;
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -L); ctx.lineTo(W, -W); ctx.lineTo(L, 0); ctx.lineTo(W, W);
        ctx.lineTo(0, L); ctx.lineTo(-W, W); ctx.lineTo(-L, 0); ctx.lineTo(-W, -W);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, W * 0.9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Asymmetric spiky manga slap/kill impact star!
        ctx.fillStyle = fl.color;
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        const spikes = 7;
        for (let i = 0; i < spikes * 2; i++) {
          const ang = (i / (spikes * 2)) * Math.PI * 2;
          const r = i % 2 === 0 ? fl.size * (0.85 + (i % 4 === 0 ? 0.35 : 0)) : fl.size * 0.32;
          if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
          else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    },

    // AAA Fractal Branching Tapered Lightning Renderer!
    _drawFractalBolt(ctx, b, pal) {
      const alpha = Math.max(0, b.life / b.maxLife);
      const pts = b.pts;
      if (!pts || pts.length < 2) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Subtle electric halo aura (gives electric energy without muddy neon blur!)
      ctx.globalAlpha = alpha * 0.32;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width * 4.2;
      this._tracePolyline(ctx, pts);
      ctx.stroke();

      // 2. Tapered main bolt segments (thick origin -> razor tip!)
      ctx.globalAlpha = alpha;
      const segCount = pts.length - 1;
      for (let i = 0; i < segCount; i++) {
        const taper = 1 - (i / segCount) * 0.58;
        // Dark ink contour
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = Math.max(1.8, b.width * 2.15 * taper);
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.stroke();

        // Vivid electric color layer
        ctx.strokeStyle = b.color;
        ctx.lineWidth = Math.max(1.1, b.width * 1.25 * taper);
        ctx.stroke();

        // White-hot inner core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(0.6, b.width * 0.45 * taper);
        ctx.stroke();
      }

      // 3. Organic micro-branch forks!
      if (b.forks && b.forks.length > 0) {
        for (const fpts of b.forks) {
          ctx.globalAlpha = alpha * 0.85;
          ctx.strokeStyle = '#141414';
          ctx.lineWidth = Math.max(1.4, b.width * 1.1);
          this._tracePolyline(ctx, fpts);
          ctx.stroke();
          ctx.strokeStyle = b.color;
          ctx.lineWidth = Math.max(0.8, b.width * 0.65);
          ctx.stroke();
        }
      }

      // 4. Crisp 4-point impact spark glint at contact endpoint!
      if (b.endX !== undefined) {
        ctx.translate(b.endX, b.endY);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = 1.2;
        const s = (b.width * 2.4 + 3) * alpha;
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.lineTo(s * 0.25, -s * 0.25); ctx.lineTo(s, 0); ctx.lineTo(s * 0.25, s * 0.25);
        ctx.lineTo(0, s); ctx.lineTo(-s * 0.25, s * 0.25); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.25, -s * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
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

    // UV Lamp with Smooth Expanding UV Light Ripples (ZERO cheap dashed circles!)
    _drawUVLamp(ctx, lamp, time, pal) {
      const maxR = lamp.radius * 0.68;
      ctx.save();
      const grad = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, maxR);
      grad.addColorStop(0, 'rgba(124, 58, 237, 0.16)');
      grad.addColorStop(0.6, 'rgba(124, 58, 237, 0.05)');
      grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, maxR, 0, Math.PI * 2);
      ctx.fill();

      // Two gently breathing concentric solid UV light waves
      for (let w = 0; w < 2; w++) {
        const p = (time * 0.55 + lamp.phase * 0.3 + w * 0.5) % 1;
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.42)';
        ctx.globalAlpha = (1 - p) * 0.7;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y, 18 + p * (maxR - 18), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

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

    // Mosquito Coil with Swirling Emerald Smoke Ribbons (ZERO cheap dashed circles!)
    _drawCoil(ctx, coil, pal) {
      ctx.save();
      ctx.translate(coil.x, coil.y);
      const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, coil.radius);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, coil.radius, 0, Math.PI * 2);
      ctx.fill();

      // 3 smooth curving emerald smoke ribbon arcs rotating around perimeter
      ctx.save();
      ctx.rotate(-coil.angle * 0.65);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.48)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.arc(0, 0, coil.radius * 0.94, 0, 1.05);
        ctx.stroke();
      }
      ctx.restore();

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

    // Ultra-fast LOD Mosquito Glyph for 150~500 simultaneous "와르르" swarm floods (identical ink silhouette, 5x faster!)
    _drawFastSwarmMosquito(ctx, m, pal) {
      const hoverY = Math.sin(m.hoverPhase) * 3.0;
      const facingLeft = m.vx < -4;
      const sc = m.radius / 11.5;
      const flap = Math.sin(m.wingPhase);
      const col = m.hitFlash > 0 ? pal.red : pal.ink;

      ctx.save();
      ctx.translate(m.x, m.y + hoverY);
      ctx.scale(facingLeft ? -sc : sc, sc);

      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineCap = 'round';

      // Hair-thin 3-leg airborne silhouette + needle proboscis + narrow abdomen
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      // Front, mid, curled hind legs
      ctx.moveTo(3, 0); ctx.lineTo(9, -2); ctx.lineTo(12, 9);
      ctx.moveTo(1, 0); ctx.lineTo(-2, 14);
      ctx.moveTo(-1, 0); ctx.lineTo(-8, -3); ctx.lineTo(-18, 8); ctx.lineTo(-23, 6);
      // Long proboscis & slender abdomen
      ctx.moveTo(6, 0); ctx.lineTo(16, 4);
      ctx.moveTo(-1, -1); ctx.lineTo(-15, 4.5);
      ctx.stroke();

      // Tiny humpback thorax dot
      ctx.beginPath();
      ctx.arc(1.5, -1.6, 2.7, 0, Math.PI * 2);
      ctx.fill();

      // Narrow fluttering wing stroke
      ctx.strokeStyle = m.electricShock > 0 ? pal.volt : pal.inkSoft;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(1, -3.5);
      ctx.lineTo(-14, -6 - flap * 4.5);
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
      const jitterX = m.electricShock > 0 ? (Math.random() - 0.5) * 4.5 : 0;
      const jitterY = m.electricShock > 0 ? (Math.random() - 0.5) * 4.5 : 0;
      ctx.translate(drawX + jitterX, drawY + jitterY);
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

      // Volatile BOMB Mosquito: Crisp Radial Static-Heat Warning Sparks (NO dashed circle!)
      if (m.type === 'bomb') {
        const bp = 1 + Math.sin(time * 14 + m.hoverPhase) * 0.16;
        ctx.save();
        ctx.translate(-6, 2);
        ctx.rotate(time * 2.2);
        ctx.strokeStyle = pal.red;
        ctx.lineWidth = 1.35;
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const r1 = 10.5 * bp;
          const r2 = 14.5 * bp;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
          ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
          ctx.stroke();
        }
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

      // Dizzy spiral above sprayed mosquitoes!
      if (m.dizzyTimer > 0) {
        ctx.save();
        ctx.translate(drawX, drawY - m.radius - 10);
        ctx.rotate(time * 9);
        ctx.strokeStyle = pal.cyan;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let t = 0; t < Math.PI * 3.5; t += 0.35) {
          const r = t * 0.75;
          if (t === 0) ctx.moveTo(Math.cos(t) * r, Math.sin(t) * r);
          else ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r);
        }
        ctx.stroke();
        ctx.restore();
      }

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

      // Boss Telegraphed Crimson Hazard Lane + Animated Sliding Chevrons + Diamond Target Lock!
      if (m.dashTelegraph > 0) {
        const dx = m.dashTargetX - drawX;
        const dy = m.dashTargetY - drawY;
        const dist = Math.hypot(dx, dy) || 1;
        const ang = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(ang);
        // Tapered translucent crimson corridor
        ctx.fillStyle = 'rgba(229, 56, 59, 0.11)';
        ctx.beginPath();
        ctx.moveTo(0, -14); ctx.lineTo(dist, -5);
        ctx.lineTo(dist, 5); ctx.lineTo(0, 14);
        ctx.closePath();
        ctx.fill();
        // Thin solid guiding rails
        ctx.strokeStyle = 'rgba(229, 56, 59, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -14); ctx.lineTo(dist, -5);
        ctx.moveTo(0, 14); ctx.lineTo(dist, 5);
        ctx.stroke();
        // Animated sliding chevrons (`▸ ▸ ▸`)
        ctx.strokeStyle = pal.red;
        ctx.lineWidth = 2.2;
        const slide = (time * 180) % 36;
        for (let cx = slide; cx < dist - 14; cx += 36) {
          ctx.beginPath();
          ctx.moveTo(cx - 6, -7); ctx.lineTo(cx + 4, 0); ctx.lineTo(cx - 6, 7);
          ctx.stroke();
        }
        ctx.restore();

        // Rotating crimson diamond target lock at destination
        ctx.save();
        ctx.translate(m.dashTargetX, m.dashTargetY);
        ctx.rotate(time * 3);
        const s = 12 + m.dashTelegraph * 14;
        ctx.strokeStyle = pal.red;
        ctx.lineWidth = 2;
        ctx.strokeRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(drawX, drawY);

      // Boss Architectural Corner-Lock Reticle (ZERO cheap dashed circle!)
      const pulse = 1 + Math.sin(time * 6) * 0.05;
      const br = m.radius * 1.46 * pulse;
      ctx.save();
      ctx.rotate(time * 0.45);
      ctx.strokeStyle = pal.red;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'square';
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.arc(0, 0, br, a - 0.24, a + 0.24);
        ctx.stroke();
        // Inward precision lock tick
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (br - 7), Math.sin(a) * (br - 7));
        ctx.lineTo(Math.cos(a) * (br + 3), Math.sin(a) * (br + 3));
        ctx.stroke();
        ctx.lineWidth = 2.4;
      }
      ctx.restore();

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

      // Custom Sculpted Weapon-Class Range Field (ZERO cheap dashed debug circles!)
      if (radius > 4) {
        this._drawWeaponRangeField(ctx, radius, weapon, eng, pal);
      }

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
        // Fast-swipe comic motion swoosh arc behind plastic swatter!
        if (eng.mouse.speed > 18) {
          ctx.save();
          const swAng = Math.atan2(eng.mouse.vy, eng.mouse.vx) + Math.PI;
          ctx.strokeStyle = pal.inkSoft;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(0, 0, 42, swAng - 0.6, swAng + 0.6);
          ctx.stroke();
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(0, 0, 50, swAng - 0.4, swAng + 0.4);
          ctx.stroke();
          ctx.restore();
        }
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
      } else if (weapon.tier === 6) {
        // ---- TIER 7: 궤도 이온 포격기 (Sculpted Soft Radiant Sky-Beam Column!) ----
        if (radius > 4) {
          const colW = 24;
          const colGrad = ctx.createLinearGradient(-colW, 0, colW, 0);
          colGrad.addColorStop(0, 'rgba(255, 202, 0, 0)');
          colGrad.addColorStop(0.5, pal.dark ? 'rgba(255, 225, 53, 0.14)' : 'rgba(255, 202, 0, 0.2)');
          colGrad.addColorStop(1, 'rgba(255, 202, 0, 0)');
          ctx.fillStyle = colGrad;
          ctx.fillRect(-colW, -y, colW * 2, y);
          // Delicate central laser sighting hairline
          ctx.strokeStyle = pal.dark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(20, 20, 20, 0.16)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -y); ctx.lineTo(0, -14);
          ctx.stroke();
        }

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

        if (radius > 4) {
          ctx.fillStyle = pal.inkSoft;
          ctx.font = '800 9px "JetBrains Mono", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`X:${Math.round(x)} Y:${Math.round(y)}`, 42, -26);
          ctx.fillStyle = pal.red;
          ctx.fillText('ION LOCK', 42, -15);
        }
      } else if (weapon.tier === 7) {
        // ---- TIER 8: 성층권 전자기 링 (Counter-Rotating Dual EMP Ring + 4 Tesla Electrodes!) ----
        ctx.save();
        ctx.rotate(eng.time * 1.8);
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = pal.cyan;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([12, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4 Electrode pods arcing around the ring
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          const ex = Math.cos(a) * 36;
          const ey = Math.sin(a) * 36;
          ctx.fillStyle = pal.volt;
          ctx.strokeStyle = pal.ink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ex, ey, 6.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();

        // Inner counter-rotating octagon
        ctx.save();
        ctx.rotate(-eng.time * 2.5);
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          if (i === 0) ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
          else ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = pal.cyan;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (weapon.tier === 8) {
        // ---- TIER 9: 반물질 살충 블랙홀 (Pitch-Black Singularity + Tilted Accretion Disk + Gravity Spiral!) ----
        // Swirling gravitational pull arcs
        ctx.save();
        ctx.rotate(-eng.time * 3.2);
        ctx.strokeStyle = pal.inkSoft;
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.arc(10, 0, 28, 0.2, 1.55);
          ctx.stroke();
        }
        ctx.restore();

        // Tilted bright violet-white accretion ring
        ctx.save();
        ctx.rotate(-0.32 + Math.sin(eng.time * 2) * 0.08);
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 38, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2.6;
        ctx.stroke();
        ctx.restore();

        // Pitch-black singularity event horizon
        ctx.fillStyle = '#09090b';
        ctx.strokeStyle = pal.volt;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // ---- TIER 10: 태양열 멸종 코어 (12-Ray Geometric Solar Mandala!) ----
        ctx.save();
        ctx.rotate(eng.time * 1.4);
        ctx.fillStyle = pal.volt;
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        const rays = 12;
        for (let i = 0; i < rays * 2; i++) {
          const a = (i / (rays * 2)) * Math.PI * 2;
          const r = i % 2 === 0 ? 40 : 22;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Counter-rotating crimson inner corona ring
        ctx.save();
        ctx.rotate(-eng.time * 2.6);
        ctx.strokeStyle = pal.red;
        ctx.lineWidth = 2.6;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Blazing white-ink sun core
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(0, 0, 13 + Math.sin(eng.time * 16) * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    },

    // ================= AAA SCULPTED WEAPON-CLASS RANGE FIELD (ZERO CHEAP DASHED CIRCLES!) =================
    _drawWeaponRangeField(ctx, radius, weapon, eng, pal) {
      const fever = eng.feverActive;
      const t = eng.time;
      ctx.save();

      // 1. Subtle radial presence tint (super clean paper wash — heavier golden aura in Overdrive!)
      const grad = ctx.createRadialGradient(0, 0, radius * 0.25, 0, 0, radius);
      if (fever) {
        grad.addColorStop(0, 'rgba(255, 202, 0, 0.02)');
        grad.addColorStop(0.75, 'rgba(255, 202, 0, 0.09)');
        grad.addColorStop(1, 'rgba(229, 56, 59, 0.16)');
      } else if (weapon.tier === 2) {
        grad.addColorStop(0, 'rgba(0, 150, 199, 0.01)');
        grad.addColorStop(0.78, 'rgba(0, 150, 199, 0.07)');
        grad.addColorStop(1, 'rgba(0, 150, 199, 0.02)');
      } else if (weapon.tier >= 8) {
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.06)');
        grad.addColorStop(0.8, 'rgba(20, 20, 20, 0.05)');
        grad.addColorStop(1, 'rgba(20, 20, 20, 0)');
      } else {
        grad.addColorStop(0, 'rgba(20, 20, 20, 0)');
        grad.addColorStop(0.84, pal.dark ? 'rgba(243, 242, 236, 0.03)' : 'rgba(20, 20, 20, 0.025)');
        grad.addColorStop(1, pal.dark ? 'rgba(243, 242, 236, 0.07)' : 'rgba(20, 20, 20, 0.06)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Tier-Specific Graphic Boundary Design!
      if (weapon.tier <= 1) {
        // Tier 1-2 (맨손 / 파리채): Hairline soft ring + 4 crisp minimalist rotating corner brackets
        ctx.strokeStyle = pal.inkFaint;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.rotate(t * 0.55);
        ctx.strokeStyle = fever ? pal.red : pal.inkSoft;
        ctx.lineWidth = 2.0;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(0, 0, radius, a - 0.18, a + 0.18);
          ctx.stroke();
        }
      } else if (weapon.tier === 2) {
        // Tier 3 (살충 스프레이): Organic breathing mist vapor arcs!
        ctx.rotate(t * 0.4);
        ctx.strokeStyle = 'rgba(0, 150, 199, 0.36)';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const wobble = Math.sin(t * 3 + i * 1.3) * 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, radius + wobble, a, a + 0.52);
          ctx.stroke();
        }
      } else if (weapon.tier <= 5) {
        // Tier 4-6 (전기모기채 / 테슬라채 / 플라즈마 돔): Sleek double electromagnetic ring + dancing perimeter sparks!
        ctx.strokeStyle = fever ? 'rgba(229, 56, 59, 0.45)' : pal.inkSoft;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 4 Rotating solid high-voltage accent segments
        ctx.save();
        ctx.rotate(t * 1.1);
        ctx.strokeStyle = fever ? pal.red : pal.ink;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(0, 0, radius, a - 0.25, a + 0.25);
          ctx.stroke();
        }
        ctx.restore();

        // Live crackling micro-arcs hugging the circumference!
        ctx.strokeStyle = pal.volt;
        ctx.lineWidth = 1.8;
        for (let k = 0; k < 2; k++) {
          const baseA = t * 3.2 + k * Math.PI + Math.sin(t * 17 + k) * 0.4;
          ctx.beginPath();
          for (let s = 0; s <= 4; s++) {
            const a = baseA + s * 0.09;
            const rJit = radius + (s === 0 || s === 4 ? 0 : (Math.random() - 0.5) * 9);
            const px = Math.cos(a) * rJit;
            const py = Math.sin(a) * rJit;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      } else {
        // Tier 7-10 (궤도 이온포 / 전자기 링 / 블랙홀 / 태양 코어): Precision Architectural Drafting Compass!
        ctx.strokeStyle = fever ? 'rgba(229, 56, 59, 0.35)' : pal.inkSoft;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Precision degree ticks every 30°
        ctx.save();
        ctx.rotate(t * 0.25);
        ctx.strokeStyle = fever ? pal.red : pal.inkSoft;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const tickLen = i % 3 === 0 ? 9 : 4.5;
          ctx.moveTo(Math.cos(a) * (radius - tickLen), Math.sin(a) * (radius - tickLen));
          ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
        }
        ctx.stroke();
        ctx.restore();

        // Counter-rotating bold technical caliper arcs (clean solid beveled geometry!)
        ctx.save();
        ctx.rotate(-t * 0.85);
        ctx.strokeStyle = fever ? pal.red : pal.ink;
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'butt';
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(0, 0, radius + 3, a - 0.22, a + 0.22);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Overdrive Signature Serrated Energy Ticks (Replaces cheap red dashed circle!)
      if (fever) {
        ctx.save();
        ctx.rotate(-t * 2.2);
        ctx.strokeStyle = pal.red;
        ctx.lineWidth = 2.0;
        const spikes = 24;
        ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
          const a = (i / spikes) * Math.PI * 2;
          const out = i % 2 === 0 ? 8 : 4;
          ctx.moveTo(Math.cos(a) * (radius + 2), Math.sin(a) * (radius + 2));
          ctx.lineTo(Math.cos(a) * (radius + 2 + out), Math.sin(a) * (radius + 2 + out));
        }
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    },

    // Interactive Event: Open Window Crack pouring a river of mosquitoes!
    _drawWindowBreach(ctx, breach, time, pal) {
      ctx.save();
      ctx.translate(breach.x, breach.y);
      const pulse = 1 + Math.sin(time * 10) * 0.12;
      ctx.strokeStyle = pal.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(breach.dirX * 8, -20);
      ctx.lineTo(-breach.dirX * 4, 0);
      ctx.lineTo(breach.dirX * 10, 22);
      ctx.lineTo(0, 48);
      ctx.stroke();

      // Animated directional inflow chevrons (`» »`)
      for (let i = 0; i < 3; i++) {
        const off = ((time * 48 + i * 20) % 60) * breach.dirX;
        const alpha = 1 - Math.abs(off) / 60;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(off - 6 * breach.dirX, -10 * pulse);
        ctx.lineTo(off + 4 * breach.dirX, 0);
        ctx.lineTo(off - 6 * breach.dirX, 10 * pulse);
        ctx.stroke();
      }
      ctx.restore();
    },

    // Interactive Event: Spinning 220V Overcharge Capacitor Orb!
    _drawCapacitor(ctx, cap, time, pal) {
      ctx.save();
      ctx.translate(cap.x, cap.y);
      const pulse = 1 + Math.sin(time * 12 + cap.phase) * 0.1;

      // Outer dashed spark ring
      ctx.save();
      ctx.rotate(time * 3);
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, (cap.r + 7) * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Yellow-ink high-voltage sphere
      ctx.fillStyle = pal.volt;
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, cap.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bold lightning bolt inside + "220V" tag below
      ctx.fillStyle = '#141414';
      ctx.beginPath();
      ctx.moveTo(2, -10); ctx.lineTo(-7, 2); ctx.lineTo(-1, 2);
      ctx.lineTo(-3, 10); ctx.lineTo(7, -2); ctx.lineTo(1, -2);
      ctx.closePath();
      ctx.fill();

      ctx.font = '900 9px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = pal.ink;
      ctx.fillText('220V', 0, cap.r + 16);
      ctx.restore();
    },

    // Public Helper: Draw live crisp miniature mosquito portrait inside Codex cards!
    drawCodexPortrait(canvas, speciesId) {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = 92, h = 62;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pal = this._palette();

      ctx.clearRect(0, 0, w, h);
      const mock = {
        type: speciesId,
        x: w * 0.52,
        y: h * 0.48,
        vx: 90,
        vy: -8,
        radius: speciesId === 'boss' ? 17 : speciesId === 'swarm' ? 9.5 : speciesId === 'fat' ? 14 : 12.5,
        hp: 100,
        maxHp: 100,
        wingPhase: 0.4,
        hoverPhase: 0.5,
        depthScale: speciesId === 'boss' ? 0.55 : 1.15,
        hitFlash: 0,
        electricShock: 0,
        dizzyTimer: 0,
        trail: [],
      };

      if (speciesId === 'boss') {
        ctx.save();
        ctx.translate(w * 0.52, h * 0.5);
        ctx.scale(0.56, 0.56);
        mock.x = 0; mock.y = 0;
        this._drawBoss(ctx, mock, 1.0, pal);
        ctx.restore();
      } else if (speciesId === 'swarm') {
        for (const [ox, oy] of [[-14, -6], [6, 8], [16, -9]]) {
          this._drawFlyingMosquito(ctx, { ...mock, x: w * 0.5 + ox, y: h * 0.46 + oy, radius: 7.5 }, 1.0, pal);
        }
      } else {
        this._drawFlyingMosquito(ctx, mock, 1.0, pal);
      }
    },

    // Public Helper: Draw live crisp miniature weapon illustration inside the 7-Tier Roadmap!
    drawWeaponThumb(canvas, tierIdx) {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = 66, h = 54;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pal = this._palette();
      const weapon = window.ZAP.CONFIG.WEAPON_TIERS[tierIdx];
      if (!weapon) return;

      ctx.clearRect(0, 0, w, h);
      const fakeEng = {
        time: 0.6,
        feverActive: false,
        mouse: { vx: 0, vy: 0, speed: 0, slapAnim: 0 },
      };
      ctx.save();
      ctx.translate(w / 2, tierIdx === 1 || tierIdx === 3 || tierIdx === 4 ? h * 0.44 : h * 0.52);
      const scaleMap = [0.68, 0.52, 0.62, 0.48, 0.5, 0.54, 0.48, 0.46, 0.48, 0.45];
      const sc = scaleMap[tierIdx] || 0.5;
      ctx.scale(sc, sc);
      this._drawWeaponCursor(ctx, 0, 0, 0, weapon, fakeEng, pal);
      ctx.restore();
    },
  };

  window.ZAP.Renderer = Renderer;
})();
