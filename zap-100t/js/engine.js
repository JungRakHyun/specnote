// ZAP 100T — Airborne Swarm Engine (Curving Flight AI, Zero-Dead-Click Snap-Slap, Bomb Mosquitoes, Swarm Rush, Core Contracts & Milestones)
window.ZAP = window.ZAP || {};

(function () {
  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const Engine = {
    width: window.innerWidth,
    height: window.innerHeight,
    paused: false,
    time: 0,
    hitstop: 0,
    shakeMag: 0,
    screenFlash: 0,

    mouse: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: 0,
      vy: 0,
      speed: 0,
      active: false,
      slapAnim: 0,
      quickSlapCd: 0,
      trail: [],
    },

    zapTimer: 0,
    empTimer: 0,
    spawnTimer: 0,
    orbitalTimer: 6,
    orbitAngle: 0,

    // Swarm Rush wave event!
    swarmRushCooldown: 24,
    swarmRushActive: false,
    swarmRushTimer: 0,
    swarmRushDuration: 10,

    // Combo & Overdrive
    combo: 0,
    comboTimer: 0,
    lastComboMilestone: 0,
    fever: 0,
    feverActive: false,
    feverTimer: 0,
    feverBeatAcc: 0,
    feverBeatStep: 0,

    // Entities
    mosquitoes: [],
    orbs: [],
    particles: [],
    bolts: [],
    rings: [],
    texts: [],
    fallingDebris: [], // Tumbling wings & toasted sparks falling through mid-air!
    missiles: [],      // C-01 Blood Homing Missiles
    drones: [],        // C-05 Autonomous Mini Zapper Drones
    orbitalBeams: [],
    uvLamps: [],
    coils: [],
    turrets: [],
    airSpecs: [],      // Drifting mid-air dust specks for airborne depth

    boss: null,
    bossReadyNotified: false,
    hasInteracted: false,
    milestoneCheckAcc: 0,

    voltHistory: [],
    currentVPS: 0,

    onToast: null,
    onVictory: null,

    init(width, height) {
      this.resize(width, height);
      this._initAirSpecs();
      this.rebuildStructures();
      this.seedInitialSwarm();
    },

    resize(w, h) {
      this.width = Math.max(320, w);
      this.height = Math.max(320, h);
      this.rebuildStructures();
    },

    _initAirSpecs() {
      this.airSpecs = [];
      for (let i = 0; i < 36; i++) {
        this.airSpecs.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          r: rand(0.9, 2.1),
          vx: rand(8, 26),
          vy: rand(-8, 6),
          phase: rand(0, Math.PI * 2),
        });
      }
    },

    rebuildStructures() {
      const state = window.ZAP.State;
      const stats = state.getStats();
      const cx = this.width / 2;
      const cy = this.height / 2;
      const rx = Math.min(this.width * 0.28, 310);
      const ry = Math.min(this.height * 0.24, 210);

      this.uvLamps = [];
      for (let i = 0; i < stats.uvLampCount; i++) {
        const angle = (i / Math.max(1, stats.uvLampCount)) * Math.PI * 2 - Math.PI / 2;
        const distScale = stats.uvLampCount === 1 ? 0 : 1;
        this.uvLamps.push({
          x: cx + Math.cos(angle) * rx * distScale,
          y: cy + Math.sin(angle) * ry * distScale,
          radius: 175 + stats.uvLampCount * 22,
          phase: i * 1.4,
        });
      }

      this.coils = [];
      for (let i = 0; i < stats.coilCount; i++) {
        const angle = (i / Math.max(1, stats.coilCount)) * Math.PI * 2 + Math.PI / 4;
        const distScale = stats.coilCount === 1 ? 0.45 : 0.72;
        this.coils.push({
          x: cx + Math.cos(angle) * rx * distScale,
          y: cy + Math.sin(angle) * ry * distScale,
          radius: 78 + stats.coilCount * 8,
          angle: rand(0, Math.PI * 2),
          tickAcc: 0,
        });
      }

      this.turrets = [];
      const padX = Math.min(110, this.width * 0.13);
      const padY = Math.min(115, this.height * 0.16);
      const anchors = [
        [padX, padY + 45],
        [this.width - padX, padY + 45],
        [padX, this.height - padY],
        [this.width - padX, this.height - padY],
        [cx, padY],
        [cx, this.height - padY],
      ];
      for (let i = 0; i < stats.turretCount; i++) {
        const pt = anchors[i % anchors.length];
        this.turrets.push({ x: pt[0], y: pt[1], angle: 0, cooldown: rand(0, 0.3) });
      }

      // Contract C-05: Autonomous Mini Zapper Drones (3 drones!)
      const desiredDrones = state.hasContract('droneSquad') ? 3 : 0;
      while (this.drones.length < desiredDrones) {
        this.drones.push({
          x: cx + rand(-140, 140),
          y: cy + rand(-100, 100),
          vx: rand(-80, 80),
          vy: rand(-80, 80),
          zapCd: rand(0, 0.2),
          phase: rand(0, Math.PI * 2),
        });
      }
      if (this.drones.length > desiredDrones) this.drones.length = desiredDrones;
    },

    seedInitialSwarm() {
      this.mosquitoes = [];
      this.boss = null;
      this.bossReadyNotified = false;
      for (let i = 0; i < 16; i++) {
        this.spawnMosquito('normal', rand(95, this.width - 95), rand(95, this.height - 95));
      }
    },

    resetTransient() {
      this.combo = 0;
      this.comboTimer = 0;
      this.lastComboMilestone = 0;
      this.fever = 0;
      this.feverActive = false;
      this.feverTimer = 0;
      this.swarmRushActive = false;
      this.swarmRushTimer = 0;
      this.swarmRushCooldown = 24;
      this.empTimer = 0;
      this.orbs = [];
      this.bolts = [];
      this.particles = [];
      this.rings = [];
      this.texts = [];
      this.fallingDebris = [];
      this.missiles = [];
      this.orbitalBeams = [];
      this.voltHistory = [];
      this.currentVPS = 0;
      document.body.classList.remove('fever-active');
    },

    switchStage(newStageIdx) {
      const state = window.ZAP.State;
      if (newStageIdx < 0 || newStageIdx > state.data.unlockedStage) return;
      state.data.stageIndex = newStageIdx;
      state.save();
      this.mosquitoes = [];
      this.orbs = [];
      this.missiles = [];
      this.fallingDebris = [];
      this.boss = null;
      this.bossReadyNotified = false;
      this.seedInitialSwarm();
      const stage = state.getStage();
      this._toast(`STAGE ${stage.id + 1} · ${stage.name} 진입 (환산 ×${window.ZAP.formatNum(stage.popScale)})`);
    },

    setCursor(x, y) {
      const dx = x - this.mouse.x;
      const dy = y - this.mouse.y;
      this.mouse.vx = dx;
      this.mouse.vy = dy;
      this.mouse.speed = Math.min(130, Math.hypot(dx, dy));
      this.mouse.x = x;
      this.mouse.y = y;
      this.mouse.active = true;
      if (!this.hasInteracted) {
        this.hasInteracted = true;
        const hint = document.getElementById('onboarding-hint');
        if (hint) hint.classList.add('fade-out');
      }
    },

    // ZERO DEAD CLICKS! If Super Pulse is ready -> fires huge Pulse; if recharging -> instant tactile Snap-Slap!
    triggerPulse(forceSuperOnly = false) {
      if (this.paused) return;
      window.ZAP.Audio.unlock();

      const state = window.ZAP.State;
      const stats = state.getStats();
      const weapon = stats.weapon;

      if (this.empTimer > 0) {
        if (forceSuperOnly || this.mouse.quickSlapCd > 0) return;
        // Instant crisp Snap-Slap / Quick-Zap while Pulse recharges!
        this.mouse.quickSlapCd = 0.14;
        this.mouse.slapAnim = 0.65;
        const quickR = stats.zapRadius * (this.feverActive ? 1.45 : 1.12);
        const quickDmg = stats.baseDamage * 1.65 * (this.feverActive ? 1.6 : 1);

        window.ZAP.Audio.playHit(weapon.soundType, this.combo, false, false);
        this.addShake(2.5);
        this.rings.push({
          x: this.mouse.x,
          y: this.mouse.y,
          r: 10,
          maxR: quickR,
          life: 0.16,
          maxLife: 0.16,
          color: weapon.tier >= 3 ? '#ffca00' : '#141414',
          width: 2.2,
          isSpiky: weapon.tier <= 1,
        });

        for (const m of this.mosquitoes) {
          if (m.dead) continue;
          if (Math.hypot(m.x - this.mouse.x, m.y - this.mouse.y) <= quickR + m.radius) {
            const isCrit = this.feverActive || Math.random() < stats.critChance + 0.12;
            this.damageMosquito(
              m,
              quickDmg * (isCrit ? stats.critMult : 1),
              isCrit,
              weapon.tier >= 3 ? 'electric' : weapon.soundType,
              this.mouse.x,
              this.mouse.y
            );
          }
        }
        return;
      }

      // FULL SUPER PULSE / TWO-HAND CLAP / 220V EMP WAVE!
      this.empTimer = stats.empCooldown;
      this.mouse.slapAnim = 1;

      const radius = stats.empRadius * (this.feverActive ? 1.25 : 1);
      const dmg = stats.empDamage * (this.feverActive ? 1.85 : 1);

      // Contract C-03: Blackhole Pulse sucks nearby mosquitoes right into the center before slamming!
      if (state.hasContract('blackholePulse')) {
        const pullR = radius * 1.85;
        for (const m of this.mosquitoes) {
          if (m.dead || m.type === 'boss') continue;
          const dx = this.mouse.x - m.x;
          const dy = this.mouse.y - m.y;
          const d = Math.hypot(dx, dy);
          if (d < pullR && d > 14) {
            m.x += dx * 0.62;
            m.y += dy * 0.62;
          }
        }
      }

      window.ZAP.Audio.playEMP(weapon.soundType);
      this.addShake(weapon.tier >= 3 ? 8.5 : 6);

      this.rings.push({
        x: this.mouse.x,
        y: this.mouse.y,
        r: 14,
        maxR: radius,
        life: 0.3,
        maxLife: 0.3,
        color: weapon.tier >= 3 ? '#ffca00' : '#141414',
        width: weapon.tier >= 3 ? 4.5 : 3.2,
        isSpiky: weapon.tier <= 1,
      });

      const sfxWord = weapon.sfxWords ? weapon.sfxWords[Math.floor(Math.random() * weapon.sfxWords.length)] : '짝!';
      this.spawnText(this.mouse.x, this.mouse.y - 34, sfxWord, weapon.tier >= 3 ? '#ffca00' : '#e5383b', 19, true);

      const pCount = weapon.tier === 2 ? 24 : 14;
      for (let i = 0; i < pCount; i++) {
        const a = (i / pCount) * Math.PI * 2 + rand(-0.15, 0.15);
        const spd = rand(110, 310);
        this.particles.push({
          x: this.mouse.x,
          y: this.mouse.y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          r: weapon.tier === 2 ? rand(4, 8.5) : rand(2, 4),
          life: rand(0.2, 0.42),
          maxLife: 0.42,
          color: weapon.tier === 2 ? '#0096c7' : weapon.tier >= 3 ? '#ffca00' : '#141414',
          kind: weapon.tier === 2 ? 'mist' : 'spark',
        });
      }

      const targets = [];
      for (const m of this.mosquitoes) {
        if (m.dead) continue;
        if (Math.hypot(m.x - this.mouse.x, m.y - this.mouse.y) <= radius + m.radius) targets.push(m);
      }

      for (const m of targets) {
        const isCrit = this.feverActive || Math.random() < stats.critChance + 0.18;
        this.damageMosquito(
          m,
          dmg * (isCrit ? stats.critMult : 1),
          isCrit,
          weapon.tier >= 3 ? 'electric' : weapon.soundType,
          this.mouse.x,
          this.mouse.y
        );
      }
    },

    triggerEvolutionBurst() {
      const w = window.ZAP.State.getWeaponTier();
      const x = this.mouse.active ? this.mouse.x : this.width / 2;
      const y = this.mouse.active ? this.mouse.y : this.height / 2;
      this.screenFlash = 0.22;
      this.addShake(9);
      this.rings.push({
        x, y, r: 12, maxR: 190, life: 0.45, maxLife: 0.45, color: '#ffca00', width: 5, isSpiky: true,
      });
      this.spawnText(x, y - 42, `${w.name} 진화!`, '#ffca00', 22, true);
    },

    summonBoss() {
      if (this.boss && !this.boss.dead) return;
      const stage = window.ZAP.State.getStage();
      const boss = {
        id: Math.random(),
        type: 'boss',
        x: this.width / 2,
        y: 120,
        vx: rand(-55, 55),
        vy: rand(22, 45),
        radius: 38,
        hp: stage.bossHp,
        maxHp: stage.bossHp,
        voltBase: Math.max(30, Math.floor(stage.bossHp * 0.52)),
        wingPhase: 0,
        hoverPhase: 0,
        curveRate: 0,
        hitFlash: 0,
        electricShock: 0,
        slowTimer: 0,
        dashTimer: 2.0,
        dashTelegraph: 0,
        dashTargetX: this.width / 2,
        dashTargetY: this.height / 2,
        spawnMinionTimer: 2.8,
        trail: [],
        dead: false,
      };
      this.mosquitoes.push(boss);
      this.boss = boss;
      window.ZAP.Audio.playBossWarning();
      this.addShake(10);
      this.screenFlash = 0.16;
      this._toast(`경고 · ${stage.bossName} 출현! 집중 타격하세요`, 'boss');
    },

    spawnMosquito(type = 'normal', forceX = null, forceY = null) {
      const stage = window.ZAP.State.getStage();
      const margin = 40;
      let x = forceX;
      let y = forceY;
      if (x === null || y === null) {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { x = rand(margin, this.width - margin); y = -18; }
        else if (edge === 1) { x = this.width + 18; y = rand(margin, this.height - margin); }
        else if (edge === 2) { x = rand(margin, this.width - margin); y = this.height + 18; }
        else { x = -18; y = rand(margin, this.height - margin); }
      }

      let hp = 12 * stage.hpMult;
      let radius = 11.5;
      let speed = rand(82, 138);
      let voltBase = 2;

      if (type === 'fat') {
        hp = 38 * stage.hpMult;
        radius = 16;
        speed = rand(48, 76);
        voltBase = 9;
      } else if (type === 'golden') {
        hp = 24 * stage.hpMult;
        radius = 13;
        speed = rand(155, 215);
        voltBase = 2;
      } else if (type === 'bomb') {
        hp = 16 * stage.hpMult;
        radius = 14.5;
        speed = rand(72, 112);
        voltBase = 6;
      } else if (type === 'swarm') {
        hp = 7 * stage.hpMult;
        radius = 8.5;
        speed = rand(96, 152);
        voltBase = 1.6;
      }

      const angle = Math.atan2(this.height / 2 - y + rand(-190, 190), this.width / 2 - x + rand(-190, 190));
      this.mosquitoes.push({
        id: Math.random(),
        type,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        baseSpeed: speed,
        radius,
        hp,
        maxHp: hp,
        voltBase,
        wingPhase: rand(0, Math.PI * 2),
        hoverPhase: rand(0, Math.PI * 2),
        depthScale: rand(0.9, 1.12), // Subtle 3D aerial depth parallax!
        curveRate: rand(-2.6, 2.6),  // Smooth aerial banking weave!
        turnTimer: rand(0.35, 1.1),
        dartTimer: rand(0.6, 2.0),
        hitFlash: 0,
        slowTimer: 0,
        trail: [],
        dead: false,
      });
    },

    spawnSwarmCluster(extraSize) {
      const cx = rand(120, this.width - 120);
      const cy = rand(110, this.height - 110);
      const count = 8 + extraSize;
      for (let i = 0; i < count; i++) {
        this.spawnMosquito('swarm', cx + rand(-50, 50), cy + rand(-50, 50));
      }
      this.rings.push({
        x: cx, y: cy, r: 10, maxR: 60, life: 0.34, maxLife: 0.34, color: '#e5383b', width: 2, isSpiky: false,
      });
    },

    startSwarmRush() {
      this.swarmRushActive = true;
      this.swarmRushTimer = this.swarmRushDuration;
      window.ZAP.Audio.playSwarmRush();
      const stats = window.ZAP.State.getStats();
      // Immediately drop 2 tight aerial clusters + a volatile Bomb Mosquito!
      this.spawnSwarmCluster(stats.swarmBonusSize + 2);
      this.spawnMosquito('bomb', rand(150, this.width - 150), rand(130, this.height - 130));
      this._toast(`SWARM RUSH! 모기 대습격 (${this.swarmRushDuration}초간 볼트 ×${stats.swarmRushVoltMult.toFixed(1)})`, 'boss');
    },

    getComboMultiplier() {
      const stats = window.ZAP.State.getStats();
      return Math.min(stats.comboMaxMult, 1 + this.combo * 0.045);
    },

    addShake(amount) {
      if (!window.ZAP.State.data.settings.shake) return;
      this.shakeMag = Math.min(16, Math.max(this.shakeMag, amount));
    },

    spawnText(x, y, text, color = '#141414', size = 13, isComic = false) {
      if (!window.ZAP.State.data.settings.showNumbers) return;
      if (this.texts.length > 75) this.texts.shift();
      this.texts.push({
        x: x + rand(-10, 10),
        y: y + rand(-6, 6),
        vy: isComic ? rand(-35, -55) : rand(-50, -76),
        text,
        color,
        size,
        isComic,
        rot: isComic ? rand(-0.16, 0.16) : 0,
        life: isComic ? 0.58 : 0.65,
        maxLife: isComic ? 0.58 : 0.65,
      });
    },

    spawnBolt(x1, y1, x2, y2, color = '#ffca00', width = 2.6) {
      if (this.bolts.length > 95) this.bolts.shift();
      const segs = 5;
      const pts = [{ x: x1, y: y1 }];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;
      const jitter = Math.min(22, dist * 0.16);
      for (let i = 1; i < segs; i++) {
        const t = i / segs;
        const offset = rand(-jitter, jitter);
        pts.push({ x: x1 + dx * t + nx * offset, y: y1 + dy * t + ny * offset });
      }
      pts.push({ x: x2, y: y2 });
      this.bolts.push({ pts, color, width, life: 0.14, maxLife: 0.14 });
    },

    // Airborne mid-air debris: fluttering wings & toasted falling sparks (NO flat wall-stain look!)
    spawnMidAirDebris(x, y, kind, isBloody = false, scale = 1) {
      if (this.fallingDebris.length > 70) this.fallingDebris.splice(0, 4);
      const count = kind === 'scorch' ? 3 : 2;
      for (let i = 0; i < count; i++) {
        this.fallingDebris.push({
          x: x + rand(-6, 6),
          y: y + rand(-6, 6),
          vx: rand(-55, 55),
          vy: rand(-75, -15),
          rot: rand(0, Math.PI * 2),
          vrot: rand(-9, 9),
          kind: i === 0 ? 'wing' : kind === 'scorch' ? 'ash' : (isBloody ? 'drop' : 'wing'),
          scale: scale * rand(0.8, 1.2),
          life: rand(0.65, 1.2),
          maxLife: 1.2,
        });
      }
    },

    spawnHomingMissiles(x, y, count, dmg) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
        this.missiles.push({
          x, y,
          vx: Math.cos(a) * 230,
          vy: Math.sin(a) * 230,
          dmg,
          life: 2.2,
          trail: [],
        });
      }
    },

    damageMosquito(m, dmg, isCrit, sourceKind, srcX, srcY, allowChain = true) {
      if (!m || m.dead) return;
      const stats = window.ZAP.State.getStats();
      const weapon = stats.weapon;

      if (m.type === 'boss') dmg *= stats.bossDamageMult;

      m.hp -= dmg;
      m.hitFlash = 0.11;

      if (sourceKind === 'electric' || sourceKind === 'laser' || sourceKind === 'plasma') {
        m.electricShock = 0.14; // Electric X-ray shock silhouette!
        const boltColor = isCrit ? '#ffca00' : sourceKind === 'laser' ? '#e5383b' : '#0096c7';
        this.spawnBolt(srcX, srcY, m.x, m.y, boltColor, isCrit ? 3.2 : 2.3);
      } else if (sourceKind === 'slap' || sourceKind === 'smack') {
        this.rings.push({
          x: m.x, y: m.y, r: 4, maxR: isCrit ? 26 : 17, life: 0.15, maxLife: 0.15,
          color: isCrit ? '#e5383b' : '#141414', width: 2.0, isSpiky: true,
        });
      }

      if (allowChain && stats.chainJumps > 0 && (sourceKind === 'electric' || sourceKind === 'plasma' || weapon.tier >= 3 || stats.chainJumps > 0)) {
        this._triggerChainLightning(m, dmg * stats.chainDmgRatio, stats.chainJumps, stats.chainRange, stats.chainBranches);
      }

      if (m.hp <= 0) {
        this.killMosquito(m, isCrit);
      } else {
        window.ZAP.Audio.playHit(sourceKind === 'electric' ? 'zap' : weapon.soundType, this.combo, isCrit, false);
        if (m.type === 'boss' || isCrit) {
          this.spawnText(m.x, m.y - m.radius, window.ZAP.formatNum(dmg), isCrit ? '#e5383b' : '#141414', isCrit ? 14 : 11);
        }
      }
    },

    _triggerChainLightning(origin, dmg, maxJumps, range, branches) {
      const state = window.ZAP.State;
      const stats = state.getStats();
      const domino = state.hasContract('dominoChain');
      let dominoBonusLeft = domino ? 6 : 0;

      const visited = new Set([origin.id]);
      let frontier = [origin];
      let jumpsLeft = maxJumps;

      while (jumpsLeft > 0 && frontier.length > 0) {
        const nextFrontier = [];
        for (const curr of frontier) {
          if (jumpsLeft <= 0) break;
          const candidates = [];
          for (const other of this.mosquitoes) {
            if (other.dead || visited.has(other.id)) continue;
            const d = Math.hypot(other.x - curr.x, other.y - curr.y);
            if (d <= range) candidates.push({ m: other, d });
          }
          candidates.sort((a, b) => a.d - b.d);

          const take = Math.min(branches, candidates.length, jumpsLeft);
          for (let i = 0; i < take; i++) {
            const target = candidates[i].m;
            visited.add(target.id);
            jumpsLeft--;

            const chainIsCrit = stats.chainCritLevel > 0 && (this.feverActive || Math.random() < stats.critChance);
            const hitDmg = chainIsCrit ? dmg * (1.8 + stats.chainCritLevel * 0.5) : dmg;
            this.spawnBolt(curr.x, curr.y, target.x, target.y, chainIsCrit ? '#ffca00' : '#0096c7', chainIsCrit ? 3.0 : 2.1);

            target.hp -= hitDmg;
            target.hitFlash = 0.1;
            if (target.hp <= 0) {
              this.killMosquito(target, chainIsCrit);
              // Contract C-02: Domino Chain refunds a jump on instant kill!
              if (dominoBonusLeft > 0) {
                jumpsLeft++;
                dominoBonusLeft--;
              }
            }
            nextFrontier.push(target);
          }
        }
        frontier = nextFrontier;
        dmg *= 0.9;
      }
    },

    killMosquito(m, isCrit) {
      if (m.dead) return;
      m.dead = true;

      const state = window.ZAP.State;
      const stats = state.getStats();
      const weapon = stats.weapon;
      const stage = state.getStage();

      // Combo & Combo Milestones (50, 100, 250, 500)
      this.combo++;
      this.comboTimer = stats.comboDecayTime;
      if (this.combo > state.data.maxCombo) state.data.maxCombo = this.combo;
      for (const tier of [50, 100, 250, 500]) {
        if (this.combo === tier && this.lastComboMilestone < tier) {
          this.lastComboMilestone = tier;
          window.ZAP.Audio.playMilestone();
          this.spawnText(this.mouse.x, this.mouse.y - 46, `${tier} COMBO!`, '#ffca00', 22, true);
        }
      }

      // Fever charge
      if (!this.feverActive) {
        const gain = (m.type === 'boss' ? 45 : m.type === 'golden' ? 24 : m.type === 'bomb' ? 14 : m.type === 'fat' ? 6 : 2.3) * stats.feverChargeMult;
        this.fever = Math.min(100, this.fever + gain);
        if (this.fever >= 100) this.activateFever();
      }

      // Population & Kill stats (including Codex per-species counter!)
      const popMult = m.type === 'boss' ? 28 : m.type === 'fat' ? 3 : m.type === 'golden' ? 6 : m.type === 'bomb' ? 4 : 1;
      state.data.totalKills++;
      if (!state.data.speciesKills) state.data.speciesKills = {};
      state.data.speciesKills[m.type] = (state.data.speciesKills[m.type] || 0) + 1;
      if (m.type === 'golden') state.data.goldenKills = (state.data.goldenKills || 0) + 1;
      if (m.type === 'bomb') state.data.bombKills = (state.data.bombKills || 0) + 1;
      state.data.totalPopKilled += stats.popPerKill * popMult;
      state.data.stageKills[state.data.stageIndex] = (state.data.stageKills[state.data.stageIndex] || 0) + 1;

      if (!state.data.victoryShown && state.data.totalPopKilled >= window.ZAP.CONFIG.TARGET_POPULATION) {
        state.data.victoryShown = true;
        state.save();
        if (this.onVictory) this.onVictory();
      }

      if (
        !this.boss &&
        !this.bossReadyNotified &&
        state.data.stageKills[state.data.stageIndex] >= stage.bossQuota &&
        !state.data.stageBossDefeated[state.data.stageIndex]
      ) {
        this.bossReadyNotified = true;
        this._toast(`${stage.bossName} 출현 준비 완료! 우측 하단 보스 버튼을 누르세요`, 'boss');
      }

      // Mid-air falling wings & toasted ash instead of flat wall stains!
      const debrisKind = weapon.tier >= 3 ? 'scorch' : 'slap';
      this.spawnMidAirDebris(m.x, m.y, debrisKind, m.type === 'fat', m.type === 'boss' ? 2.2 : 1);

      if (weapon.tier >= 3) {
        for (let s = 0; s < 3; s++) {
          this.particles.push({
            x: m.x + rand(-5, 5), y: m.y + rand(-4, 4),
            vx: rand(-14, 14), vy: rand(-46, -22),
            r: rand(2.5, 5), life: rand(0.45, 0.72), maxLife: 0.72,
            color: '#555555', kind: 'smoke',
          });
        }
      }

      // Special: Volatile BOMB MOSQUITO Chain Detonation!
      if (m.type === 'bomb') {
        const blastR = 165;
        window.ZAP.Audio.playBombBlast();
        this.addShake(11);
        this.screenFlash = 0.14;
        this.rings.push({
          x: m.x, y: m.y, r: 12, maxR: blastR, life: 0.34, maxLife: 0.34, color: '#ffca00', width: 5, isSpiky: true,
        });
        this.spawnText(m.x, m.y - 18, '연쇄 폭파!!', '#e5383b', 18, true);
        for (const other of this.mosquitoes) {
          if (other.dead || other.id === m.id) continue;
          if (Math.hypot(other.x - m.x, other.y - m.y) <= blastR + other.radius) {
            this.damageMosquito(other, stats.baseDamage * 4.2, true, 'electric', m.x, m.y, true);
          }
        }
        if (state.hasContract('bloodMissiles')) {
          this.spawnHomingMissiles(m.x, m.y, 6, stats.baseDamage * 2.2);
        }
      }

      // Special: Blood-Full Burst Skill + Contract C-01 Homing Missiles!
      if (m.type === 'fat') {
        if (stats.bloodBurstLevel > 0) {
          const br = 90 + stats.bloodBurstLevel * 24;
          this.rings.push({
            x: m.x, y: m.y, r: 8, maxR: br, life: 0.28, maxLife: 0.28, color: '#e5383b', width: 3.5, isSpiky: true,
          });
          for (const other of this.mosquitoes) {
            if (other.dead || other.id === m.id) continue;
            if (Math.hypot(other.x - m.x, other.y - m.y) <= br) {
              this.damageMosquito(other, stats.baseDamage * (1.2 + stats.bloodBurstLevel * 0.5), false, 'slap', m.x, m.y, false);
            }
          }
        }
        if (state.hasContract('bloodMissiles')) {
          this.spawnHomingMissiles(m.x, m.y, 6, stats.baseDamage * 2.0);
        }
      }

      // Volt calculation
      const comboMult = this.getComboMultiplier();
      const feverMult = this.feverActive ? 2 : 1;
      const rushMult = this.swarmRushActive ? stats.swarmRushVoltMult : 1;
      let totalVolts = m.voltBase * stats.voltMult * comboMult * feverMult * rushMult;
      if (m.type === 'golden') totalVolts *= stats.goldenRewardMult;
      if (m.type === 'boss') totalVolts *= stats.bossVoltMult;

      const extraFatOrbs = m.type === 'fat' ? stats.bloodBurstLevel * 2 : 0;
      const orbCount = (m.type === 'boss' ? 24 : m.type === 'golden' ? 10 : m.type === 'bomb' ? 7 : m.type === 'fat' ? 5 : 1) + extraFatOrbs;
      const perOrb = Math.max(1, totalVolts / orbCount);
      for (let i = 0; i < orbCount; i++) {
        const a = rand(0, Math.PI * 2);
        const spd = rand(55, m.type === 'boss' ? 250 : 155);
        this.orbs.push({
          x: m.x, y: m.y,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          value: perOrb,
          color: m.type === 'golden' ? '#f59e0b' : m.type === 'boss' ? '#7c3aed' : '#ffca00',
          r: m.type === 'boss' ? 5.5 : m.type === 'golden' ? 5 : 4,
          age: 0,
        });
      }

      // Burst particles
      const burstCount = m.type === 'boss' ? 38 : isCrit || m.type === 'golden' || m.type === 'bomb' ? 12 : 6;
      for (let i = 0; i < burstCount; i++) {
        const a = rand(0, Math.PI * 2);
        const spd = rand(45, m.type === 'boss' ? 360 : 175);
        const col = m.type === 'golden'
          ? '#f59e0b'
          : m.type === 'fat' || m.type === 'bomb'
            ? (i % 2 === 0 ? '#e5383b' : '#ffca00')
            : weapon.tier >= 3
              ? (i % 2 === 0 ? '#ffca00' : '#0096c7')
              : '#141414';
        this.particles.push({
          x: m.x, y: m.y,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          r: rand(1.8, m.type === 'boss' ? 5 : 3.4),
          life: rand(0.18, m.type === 'boss' ? 0.7 : 0.38),
          maxLife: 0.45, color: col, kind: 'spark',
        });
      }

      // Death Nova EMP
      if (stats.deathNovaChance > 0 && Math.random() < stats.deathNovaChance) {
        this.rings.push({
          x: m.x, y: m.y, r: 8, maxR: stats.deathNovaRadius, life: 0.24, maxLife: 0.24, color: '#0096c7', width: 3, isSpiky: false,
        });
        for (const other of this.mosquitoes) {
          if (other.dead || other.id === m.id) continue;
          if (Math.hypot(other.x - m.x, other.y - m.y) <= stats.deathNovaRadius) {
            this.damageMosquito(other, stats.baseDamage * 1.45, false, 'electric', m.x, m.y, false);
          }
        }
      }

      if (m.type === 'boss') {
        this.boss = null;
        this.hitstop = 0.12; // Dramatic micro freeze-frame!
        this.screenFlash = 0.3;
        this.addShake(16);
        window.ZAP.Audio.playBossKill();
        // Epic 3-Bolt Sky-to-Boss Lightning Finisher!
        for (let k = -1; k <= 1; k++) {
          this.spawnBolt(m.x + k * 75, 0, m.x + k * 14, m.y, '#ffca00', 4.0);
        }
        this.rings.push({
          x: m.x, y: m.y, r: 16, maxR: 220, life: 0.45, maxLife: 0.45, color: '#e5383b', width: 5.5, isSpiky: true,
        });
        const coresEarned = 1 + stats.coreDropBonus;
        state.data.cores += coresEarned;
        state.data.bossKills = (state.data.bossKills || 0) + 1;
        state.data.stageBossDefeated[state.data.stageIndex] = true;

        if (state.data.stageIndex === state.data.unlockedStage && state.data.unlockedStage < window.ZAP.CONFIG.STAGES.length - 1) {
          state.data.unlockedStage++;
          const nextStage = window.ZAP.CONFIG.STAGES[state.data.unlockedStage];
          this._toast(`보스 격파! CORE +${coresEarned} · [${nextStage.name}] 해금!`, 'gold');
        } else {
          this._toast(`${stage.bossName} 격파! CORE +${coresEarned} 획득`, 'gold');
        }
        state.save();
        this.spawnText(m.x, m.y - 26, `BOSS CLEAR! +CORE ${coresEarned}`, '#e5383b', 20, true);
      } else {
        window.ZAP.Audio.playHit(weapon.soundType, this.combo, isCrit, true);
        if (isCrit) this.addShake(2.8);
        if (m.type === 'golden') {
          this.spawnText(m.x, m.y - 14, `GOLDEN +⚡${window.ZAP.formatNum(totalVolts)}`, '#d97706', 16, true);
          this.addShake(5);
        } else if (isCrit) {
          const w = weapon.sfxWords ? weapon.sfxWords[Math.floor(Math.random() * weapon.sfxWords.length)] : 'CRIT!';
          this.spawnText(m.x, m.y - 12, `${w} +${window.ZAP.formatNum(totalVolts)}`, '#e5383b', 14, true);
        } else if (Math.random() < 0.3) {
          this.spawnText(m.x, m.y - 10, `+${window.ZAP.formatNum(totalVolts)}`, '#141414', 11, false);
        }
      }
    },

    activateFever() {
      const stats = window.ZAP.State.getStats();
      this.feverActive = true;
      this.fever = 100;
      this.feverTimer = stats.feverDuration;
      this.screenFlash = 0.2;
      document.body.classList.add('fever-active');
      window.ZAP.Audio.playFeverStart();
      this.addShake(9);
      this._toast('220V OVERDRIVE! 전 타격 치명타 · 범위 & 스폰 폭증', 'gold');
    },

    _toast(msg, kind = '') {
      if (this.onToast) this.onToast(msg, kind);
    },

    update(rawDt) {
      if (this.paused) return;
      const dt = Math.min(0.05, rawDt);
      this.time += dt;
      window.ZAP.State.data.playTime += dt;

      if (this.hitstop > 0) {
        this.hitstop -= dt;
        return;
      }

      const state = window.ZAP.State;
      const stats = state.getStats();
      const weapon = stats.weapon;

      // Periodic Milestone check
      this.milestoneCheckAcc += dt;
      if (this.milestoneCheckAcc >= 0.4) {
        this.milestoneCheckAcc = 0;
        const earned = state.checkMilestones();
        for (const ms of earned) {
          window.ZAP.Audio.playMilestone();
          this._toast(`업적 달성 [${ms.name}] · ${ms.rewardLabel}`, 'gold');
        }
      }

      this.mouse.speed *= Math.pow(0.05, dt);
      this.mouse.slapAnim = Math.max(0, this.mouse.slapAnim - dt * 5.2);
      if (this.mouse.quickSlapCd > 0) this.mouse.quickSlapCd = Math.max(0, this.mouse.quickSlapCd - dt);
      if (this.screenFlash > 0) this.screenFlash = Math.max(0, this.screenFlash - dt * 1.8);

      if (this.mouse.active) {
        this.mouse.trail.push({ x: this.mouse.x, y: this.mouse.y, life: 0.14 });
        if (this.mouse.trail.length > 12) this.mouse.trail.shift();
      }
      for (let i = this.mouse.trail.length - 1; i >= 0; i--) {
        this.mouse.trail[i].life -= dt;
        if (this.mouse.trail[i].life <= 0) this.mouse.trail.splice(i, 1);
      }

      this.shakeMag *= Math.pow(0.0015, dt);
      if (this.shakeMag < 0.2) this.shakeMag = 0;
      if (this.empTimer > 0) this.empTimer = Math.max(0, this.empTimer - dt);

      // Combo decay
      if (this.combo > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.comboTimer = 0;
          this.lastComboMilestone = 0;
        }
      }

      // Contract C-04: Overdrive Engine auto-charges Fever above 50 combo!
      if (!this.feverActive && state.hasContract('overdriveEngine') && this.combo >= 50) {
        this.fever = Math.min(100, this.fever + dt * 12);
        if (this.fever >= 100) this.activateFever();
      }

      // Fever timer + rhythmic 138 BPM pulse beat
      if (this.feverActive) {
        this.feverTimer -= dt;
        this.feverBeatAcc += dt;
        if (this.feverBeatAcc >= 0.435) {
          this.feverBeatAcc -= 0.435;
          this.feverBeatStep = (this.feverBeatStep + 1) % 4;
          window.ZAP.Audio.playOverdriveBeat(this.feverBeatStep === 0);
        }
        this.fever = Math.max(0, (this.feverTimer / stats.feverDuration) * 100);
        if (this.feverTimer <= 0) {
          this.feverActive = false;
          this.fever = 0;
          this.feverBeatAcc = 0;
          document.body.classList.remove('fever-active');
          if (state.hasContract('overdriveEngine')) {
            window.ZAP.Audio.playBombBlast();
            this.screenFlash = 0.24;
            this.addShake(12);
            for (const m of this.mosquitoes) {
              if (!m.dead) this.damageMosquito(m, stats.baseDamage * 5, true, 'electric', m.x, 0, false);
            }
          }
        }
      }

      // Swarm Rush timer!
      if (this.swarmRushActive) {
        this.swarmRushTimer -= dt;
        if (this.swarmRushTimer <= 0) {
          this.swarmRushActive = false;
          this.swarmRushCooldown = stats.swarmRushInterval;
        }
      } else if (state.data.totalKills >= 18) {
        this.swarmRushCooldown -= dt;
        if (this.swarmRushCooldown <= 0) {
          this.startSwarmRush();
        }
      }

      // 1. Spawning
      const spawnMult = (this.feverActive ? 2.0 : 1) * (this.swarmRushActive ? 2.6 : 1);
      this.spawnTimer -= dt * spawnMult;
      const maxPop = stats.maxMosquitoes + (this.feverActive ? 24 : 0) + (this.swarmRushActive ? 38 : 0);
      if (this.spawnTimer <= 0 && this.mosquitoes.length < maxPop) {
        this.spawnTimer = stats.spawnInterval;
        const r = Math.random();
        if (r < (this.swarmRushActive ? stats.swarmChance + 0.22 : stats.swarmChance) && this.mosquitoes.length < maxPop - 6) {
          this.spawnSwarmCluster(stats.swarmBonusSize);
        } else if (r < stats.swarmChance + 0.032 * stats.rareLuckMult) {
          this.spawnMosquito('golden');
        } else if (r < stats.swarmChance + 0.085 * stats.rareLuckMult) {
          this.spawnMosquito('bomb');
        } else if (r < stats.swarmChance + 0.19 * stats.rareLuckMult) {
          this.spawnMosquito('fat');
        } else {
          this.spawnMosquito('normal');
        }
      }

      // 2. Active Cursor Weapon Tick & Swing Vortex Pull!
      const effectiveRadius = stats.zapRadius * (this.feverActive ? 1.4 : 1);
      const tickInterval = 1 / (stats.ticksPerSec * (this.feverActive ? 1.35 : 1));
      this.zapTimer -= dt;

      if (weapon.tier === 2 && this.mouse.active && Math.random() < 0.5) {
        const a = rand(-0.6, 0.6) - Math.PI * 0.75;
        const rad = rand(18, effectiveRadius * 0.85);
        this.particles.push({
          x: this.mouse.x + Math.cos(a) * rad + rand(-18, 18),
          y: this.mouse.y + Math.sin(a) * rad + rand(-18, 18),
          vx: rand(-24, 24), vy: rand(-24, 24),
          r: rand(3, 7), life: 0.32, maxLife: 0.32, color: '#0096c7', kind: 'mist',
        });
      }

      // Swing Vortex: fast mouse movement creates an aerial vortex pulling nearby mosquitoes inward!
      if (stats.vortexLevel > 0 && this.mouse.active && this.mouse.speed > 14) {
        const speedFactor = Math.min(2.2, this.mouse.speed / 28);
        for (const m of this.mosquitoes) {
          if (m.dead || m.type === 'boss') continue;
          const dx = this.mouse.x - m.x;
          const dy = this.mouse.y - m.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < stats.vortexRadius && d > 18) {
            const pull = stats.vortexStrength * speedFactor * (1 - d / stats.vortexRadius);
            m.vx += (dx / d) * pull * dt * 4;
            m.vy += (dy / d) * pull * dt * 4;
          }
        }
      }

      if (this.mouse.active && this.zapTimer <= 0) {
        this.zapTimer = tickInterval;
        const swingBonus = 1 + Math.min(0.55, this.mouse.speed / 50);
        const srcKind = weapon.tier >= 5 ? 'plasma' : weapon.tier >= 3 ? 'electric' : weapon.soundType;
        let multiHits = 0;

        for (const m of this.mosquitoes) {
          if (m.dead) continue;
          const d = Math.hypot(m.x - this.mouse.x, m.y - this.mouse.y);
          if (d <= effectiveRadius + m.radius) {
            const isCrit = this.feverActive || Math.random() < stats.critChance + (this.mouse.speed > 24 ? 0.12 : 0);
            const dmg = stats.baseDamage * swingBonus * (isCrit ? stats.critMult : 1) * (this.feverActive ? 1.5 : 1);
            this.damageMosquito(m, dmg, isCrit, srcKind, this.mouse.x, this.mouse.y, true);
            multiHits++;
          }
        }
        if (multiHits >= 3 && weapon.tier >= 3) {
          window.ZAP.Audio.playArcSizzle();
        }
      }

      // 3. Orbiting Tesla Satellites
      this.orbitAngle += dt * 3.5;
      if (stats.orbitTeslaCount > 0 && this.mouse.active) {
        const orbitR = effectiveRadius + 46;
        for (let i = 0; i < stats.orbitTeslaCount; i++) {
          const ang = this.orbitAngle + (i / stats.orbitTeslaCount) * Math.PI * 2;
          const ox = this.mouse.x + Math.cos(ang) * orbitR;
          const oy = this.mouse.y + Math.sin(ang) * orbitR;
          if (Math.random() < dt * 8) {
            let best = null, bestD = 130;
            for (const m of this.mosquitoes) {
              if (m.dead) continue;
              const d = Math.hypot(m.x - ox, m.y - oy);
              if (d < bestD) { bestD = d; best = m; }
            }
            if (best) this.damageMosquito(best, stats.baseDamage * 0.95, false, 'electric', ox, oy, true);
          }
        }
      }

      // 4. Contract C-05: Autonomous Mini Zapper Drones!
      for (const dr of this.drones) {
        dr.phase += dt * 6;
        dr.zapCd -= dt;
        // Prioritize Golden -> Bomb -> Boss -> Closest!
        let target = null;
        let bestScore = Infinity;
        for (const m of this.mosquitoes) {
          if (m.dead) continue;
          const d = Math.hypot(m.x - dr.x, m.y - dr.y);
          const priority = m.type === 'golden' ? 0.25 : m.type === 'bomb' ? 0.4 : m.type === 'boss' ? 0.55 : 1;
          const score = d * priority;
          if (score < bestScore) { bestScore = score; target = m; }
        }
        if (target) {
          const dx = target.x - dr.x;
          const dy = target.y - dr.y;
          const d = Math.hypot(dx, dy) || 1;
          dr.vx += (dx / d) * 680 * dt;
          dr.vy += (dy / d) * 680 * dt;
          if (d < 78 && dr.zapCd <= 0) {
            dr.zapCd = 0.22;
            this.damageMosquito(target, stats.baseDamage * 1.15, Math.random() < stats.critChance, 'electric', dr.x, dr.y, true);
          }
        }
        const spd = Math.hypot(dr.vx, dr.vy) || 1;
        if (spd > 280) { dr.vx = (dr.vx / spd) * 280; dr.vy = (dr.vy / spd) * 280; }
        dr.x = clamp(dr.x + dr.vx * dt, 40, this.width - 40);
        dr.y = clamp(dr.y + dr.vy * dt, 40, this.height - 40);
      }

      // 5. Contract C-01: Homing Blood/Static Missiles!
      for (let i = this.missiles.length - 1; i >= 0; i--) {
        const ms = this.missiles[i];
        ms.life -= dt;
        let best = null, bestD = 420;
        for (const m of this.mosquitoes) {
          if (m.dead) continue;
          const d = Math.hypot(m.x - ms.x, m.y - ms.y);
          if (d < bestD) { bestD = d; best = m; }
        }
        if (best) {
          const dx = best.x - ms.x;
          const dy = best.y - ms.y;
          const d = Math.hypot(dx, dy) || 1;
          ms.vx += (dx / d) * 1400 * dt;
          ms.vy += (dy / d) * 1400 * dt;
          if (d < best.radius + 10) {
            this.damageMosquito(best, ms.dmg, true, 'electric', ms.x, ms.y, false);
            this.missiles.splice(i, 1);
            continue;
          }
        }
        const spd = Math.hypot(ms.vx, ms.vy) || 1;
        if (spd > 440) { ms.vx = (ms.vx / spd) * 440; ms.vy = (ms.vy / spd) * 440; }
        ms.x += ms.vx * dt;
        ms.y += ms.vy * dt;
        ms.trail.push({ x: ms.x, y: ms.y });
        if (ms.trail.length > 7) ms.trail.shift();
        if (ms.life <= 0) this.missiles.splice(i, 1);
      }

      // 6. Mosquito Coils
      for (const coil of this.coils) {
        coil.angle += dt * 1.4;
        coil.tickAcc += dt;
        const doTick = coil.tickAcc >= 0.25;
        if (doTick) coil.tickAcc = 0;
        for (const m of this.mosquitoes) {
          if (m.dead) continue;
          if (Math.hypot(m.x - coil.x, m.y - coil.y) <= coil.radius + m.radius) {
            m.slowTimer = 0.25;
            if (doTick) this.damageMosquito(m, stats.baseDamage * 0.55, false, 'spray', coil.x, coil.y, false);
          }
        }
      }

      // 7. Auto Laser Turrets
      for (const turret of this.turrets) {
        turret.cooldown -= dt;
        if (turret.cooldown <= 0 && this.mosquitoes.length > 0) {
          let best = null, bestD = Infinity;
          for (const m of this.mosquitoes) {
            if (m.dead) continue;
            const d = Math.hypot(m.x - turret.x, m.y - turret.y);
            if (d < bestD) { bestD = d; best = m; }
          }
          if (best) {
            turret.angle = Math.atan2(best.y - turret.y, best.x - turret.x);
            turret.cooldown = Math.max(0.14, 0.56 - stats.turretCount * 0.06);
            this.damageMosquito(best, stats.baseDamage * 1.3, Math.random() < stats.critChance, 'laser', turret.x, turret.y, true);
          }
        }
      }

      // 8. Orbital Plasma Beams
      if (stats.orbitalLevel > 0) {
        this.orbitalTimer -= dt;
        if (this.orbitalTimer <= 0) {
          this.orbitalTimer = stats.orbitalCooldown;
          window.ZAP.Audio.playOrbitalBeam();
          this.addShake(9);
          this.orbitalBeams.push({
            x: -80, speed: this.width * 1.25,
            width: 52 + stats.orbitalLevel * 14,
            dmg: stats.baseDamage * (3.5 + stats.orbitalLevel * 2.5),
            hitIds: new Set(),
          });
        }
      }
      for (let i = this.orbitalBeams.length - 1; i >= 0; i--) {
        const b = this.orbitalBeams[i];
        b.x += b.speed * dt;
        for (const m of this.mosquitoes) {
          if (m.dead || b.hitIds.has(m.id)) continue;
          if (Math.abs(m.x - b.x) <= b.width * 0.55 + m.radius) {
            b.hitIds.add(m.id);
            this.damageMosquito(m, b.dmg, true, 'plasma', b.x, m.y, true);
          }
        }
        if (b.x > this.width + 120) this.orbitalBeams.splice(i, 1);
      }

      // 9. Airborne Curving Mosquito Flight AI!
      for (let i = this.mosquitoes.length - 1; i >= 0; i--) {
        const m = this.mosquitoes[i];
        if (m.dead) {
          this.mosquitoes.splice(i, 1);
          continue;
        }

        m.wingPhase += dt * (m.type === 'boss' ? 40 : 62);
        m.hoverPhase += dt * (m.type === 'boss' ? 4.5 : 8.5);
        if (m.hitFlash > 0) m.hitFlash -= dt;
        if (m.electricShock > 0) m.electricShock -= dt;
        if (m.slowTimer > 0) m.slowTimer -= dt;

        if (m.type === 'boss') {
          m.spawnMinionTimer -= dt;
          if (m.dashTelegraph > 0) {
            // Telegraph windup before dashing!
            m.dashTelegraph -= dt;
            m.vx *= Math.pow(0.06, dt);
            m.vy *= Math.pow(0.06, dt);
            if (m.dashTelegraph <= 0) {
              const ang = Math.atan2(m.dashTargetY - m.y, m.dashTargetX - m.x);
              m.vx = Math.cos(ang) * 380;
              m.vy = Math.sin(ang) * 380;
              window.ZAP.Audio.playBossDash();
              this.rings.push({
                x: m.x, y: m.y, r: 14, maxR: 64, life: 0.24, maxLife: 0.24, color: '#e5383b', width: 2.5, isSpiky: true,
              });
            }
          } else {
            m.dashTimer -= dt;
            if (m.dashTimer <= 0) {
              m.dashTimer = rand(2.1, 3.2);
              m.dashTelegraph = 0.48;
              m.dashTargetX = rand(120, this.width - 120);
              m.dashTargetY = rand(110, this.height - 110);
            }
            m.vx *= Math.pow(0.35, dt);
            m.vy *= Math.pow(0.35, dt);
          }
          if (m.spawnMinionTimer <= 0 && this.mosquitoes.length < maxPop + 10) {
            m.spawnMinionTimer = 2.9;
            this.rings.push({
              x: m.x, y: m.y, r: 10, maxR: 56, life: 0.28, maxLife: 0.28, color: '#141414', width: 2, isSpiky: false,
            });
            for (let k = 0; k < 5; k++) {
              this.spawnMosquito('swarm', m.x + rand(-28, 28), m.y + rand(-28, 28));
            }
          }
        } else {
          // Smooth aerial banking weave + occasional quick dart!
          m.turnTimer -= dt;
          if (m.turnTimer <= 0) {
            m.turnTimer = rand(0.35, 1.05);
            m.curveRate = rand(-3.4, 3.4);
          }
          const heading = Math.atan2(m.vy, m.vx) + m.curveRate * dt;
          const spd = Math.hypot(m.vx, m.vy) || m.baseSpeed;
          m.vx = Math.cos(heading) * spd;
          m.vy = Math.sin(heading) * spd;

          // Brief hovering dart pulse
          m.dartTimer -= dt;
          if (m.dartTimer <= 0) {
            m.dartTimer = rand(0.7, 1.9);
            const boost = rand(0.75, 1.38);
            m.vx = Math.cos(heading) * m.baseSpeed * boost;
            m.vy = Math.sin(heading) * m.baseSpeed * boost;
          }

          // UV Lamp attraction
          for (const lamp of this.uvLamps) {
            const dx = lamp.x - m.x;
            const dy = lamp.y - m.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < lamp.radius * 1.65) {
              const pull = stats.uvPullStrength * (1 - d / (lamp.radius * 1.8));
              m.vx += (dx / d) * pull * dt * 4.5;
              m.vy += (dy / d) * pull * dt * 4.5;
            }
          }

          // Soft open-air edge steering
          const pad = 52;
          if (m.x < pad) m.vx += 260 * dt;
          if (m.x > this.width - pad) m.vx -= 260 * dt;
          if (m.y < 68) m.vy += 260 * dt;
          if (m.y > this.height - 68) m.vy -= 260 * dt;

          const curSpd = Math.hypot(m.vx, m.vy) || 1;
          const cap = m.baseSpeed * 1.45;
          if (curSpd > cap) {
            m.vx = (m.vx / curSpd) * cap;
            m.vy = (m.vy / curSpd) * cap;
          }
        }

        const slowFactor = m.slowTimer > 0 ? 1 - stats.coilSlow : 1;
        m.x += m.vx * dt * slowFactor;
        m.y += m.vy * dt * slowFactor;

        if (m.type === 'boss') {
          m.x = clamp(m.x, 70, this.width - 70);
          m.y = clamp(m.y, 90, this.height - 90);
        }

        // Record short dashed flight wake trail for true airborne feel!
        if (!m.trail) m.trail = [];
        const lastPt = m.trail[m.trail.length - 1];
        if (!lastPt || Math.hypot(m.x - lastPt.x, m.y - lastPt.y) > 9) {
          m.trail.push({ x: m.x, y: m.y });
          if (m.trail.length > (m.type === 'golden' ? 8 : 5)) m.trail.shift();
        }
      }

      // 10. Orbs Vacuum
      const collectX = this.mouse.active ? this.mouse.x : this.width / 2;
      const collectY = this.mouse.active ? this.mouse.y : this.height / 2;
      for (let i = this.orbs.length - 1; i >= 0; i--) {
        const o = this.orbs[i];
        o.age += dt;
        o.vx *= Math.pow(0.04, dt);
        o.vy *= Math.pow(0.04, dt);

        const dx = collectX - o.x;
        const dy = collectY - o.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (o.age > 0.14 && (dist <= stats.magnetRadius || o.age > 2.2)) {
          const pullSpd = stats.magnetSpeed * (1 + o.age * 0.9);
          o.vx += (dx / dist) * pullSpd * dt * 6;
          o.vy += (dy / dist) * pullSpd * dt * 6;
        }

        o.x += o.vx * dt;
        o.y += o.vy * dt;

        if (dist < 28 || o.age > 5.5) {
          state.data.volts += o.value;
          state.data.totalVolts += o.value;
          this.voltHistory.push({ t: this.time, v: o.value });
          window.ZAP.Audio.playOrb();
          this.orbs.splice(i, 1);
        }
      }

      const cutoff = this.time - 3.0;
      let sumV = 0;
      while (this.voltHistory.length > 0 && this.voltHistory[0].t < cutoff) this.voltHistory.shift();
      for (const h of this.voltHistory) sumV += h.v;
      this.currentVPS = sumV / 3.0;

      // 11. Mid-Air Falling Debris (gravity + flutter!)
      for (let i = this.fallingDebris.length - 1; i >= 0; i--) {
        const fd = this.fallingDebris[i];
        fd.life -= dt;
        fd.vy += (fd.kind === 'wing' ? 115 : 260) * dt;
        if (fd.kind === 'wing') {
          fd.vx += Math.sin(this.time * 12 + fd.rot) * 90 * dt;
          fd.vx *= Math.pow(0.25, dt);
        }
        fd.x += fd.vx * dt;
        fd.y += fd.vy * dt;
        fd.rot += fd.vrot * dt;
        if (fd.life <= 0) this.fallingDebris.splice(i, 1);
      }

      // 12. Particles, Bolts, Rings, Texts, Air Specs
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind !== 'smoke') {
          p.vx *= Math.pow(0.08, dt);
          p.vy *= Math.pow(0.08, dt);
        }
        if (p.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.bolts.length - 1; i >= 0; i--) {
        this.bolts[i].life -= dt;
        if (this.bolts[i].life <= 0) this.bolts.splice(i, 1);
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.life -= dt;
        const p = 1 - r.life / r.maxLife;
        r.r = r.maxR * (1 - Math.pow(1 - p, 3));
        if (r.life <= 0) this.rings.splice(i, 1);
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.life -= dt;
        t.y += t.vy * dt;
        t.vy *= Math.pow(0.25, dt);
        if (t.life <= 0) this.texts.splice(i, 1);
      }
      for (const sp of this.airSpecs) {
        sp.x += sp.vx * dt;
        sp.y += (sp.vy + Math.sin(this.time * 1.5 + sp.phase) * 8) * dt;
        if (sp.x > this.width + 10) { sp.x = -10; sp.y = Math.random() * this.height; }
        if (sp.y < -10) sp.y = this.height + 10;
        if (sp.y > this.height + 10) sp.y = -10;
      }
    },
  };

  window.ZAP.Engine = Engine;
})();
