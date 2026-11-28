// ZAP 100T — Game State, Contracts, Milestones, Derived Stats, and Persistence
window.ZAP = window.ZAP || {};

window.ZAP.formatNum = function formatNum(n) {
  if (!isFinite(n)) return '∞';
  const abs = Math.abs(n);
  if (abs < 10_000) return Math.floor(n).toLocaleString('ko-KR');
  if (abs < 100_000_000) return (n / 10_000).toFixed(abs < 100_000 ? 2 : 1) + '만';
  if (abs < 1_000_000_000_000) return (n / 100_000_000).toFixed(2) + '억';
  if (abs < 10_000_000_000_000_000) return (n / 1_000_000_000_000).toFixed(2) + '조';
  return (n / 10_000_000_000_000_000).toFixed(2) + '경';
};

window.ZAP.formatExactPop = function formatExactPop(n) {
  return Math.max(0, Math.floor(n)).toLocaleString('ko-KR');
};

(function () {
  const SAVE_KEY = 'zap100t_save_v2';

  function createDefaultState() {
    return {
      volts: 0,
      totalVolts: 0,
      cores: 0,
      prestigeCount: 0,
      prestigeMult: 1,
      stageIndex: 0,
      unlockedStage: 0,
      stageKills: [0, 0, 0, 0, 0, 0],
      stageBossDefeated: [false, false, false, false, false, false],
      totalKills: 0,
      bossKills: 0,
      goldenKills: 0,
      bombKills: 0,
      speciesKills: {
        normal: 0,
        fat: 0,
        golden: 0,
        bomb: 0,
        swarm: 0,
        boss: 0,
      },
      totalPopKilled: 0,
      maxCombo: 0,
      playTime: 0,
      victoryShown: false,
      skills: {
        weaponTier: 0,
      },
      contracts: {},
      milestones: {},
      settings: {
        volume: 0.65,
        muted: false,
        shake: true,
        showNumbers: true,
        theme: 'light',
      },
    };
  }

  const State = {
    data: createDefaultState(),
    nodeMap: {},
    contractMap: {},

    init() {
      this.nodeMap = {};
      for (const node of window.ZAP.CONFIG.SKILL_NODES) {
        this.nodeMap[node.id] = node;
      }
      this.contractMap = {};
      for (const c of window.ZAP.CONFIG.CONTRACTS) {
        this.contractMap[c.id] = c;
      }
      this.load();
    },

    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const def = createDefaultState();
        this.data = Object.assign(def, parsed);
        this.data.skills = Object.assign({ weaponTier: 0 }, parsed.skills || {});
        this.data.contracts = Object.assign({}, parsed.contracts || {});
        this.data.milestones = Object.assign({}, parsed.milestones || {});
        this.data.speciesKills = Object.assign(
          { normal: 0, fat: 0, golden: 0, bomb: 0, swarm: 0, boss: 0 },
          parsed.speciesKills || {}
        );
        this.data.settings = Object.assign(def.settings, parsed.settings || {});
        if (!Array.isArray(this.data.stageKills) || this.data.stageKills.length < 6) {
          this.data.stageKills = [0, 0, 0, 0, 0, 0];
        }
        if (!Array.isArray(this.data.stageBossDefeated) || this.data.stageBossDefeated.length < 6) {
          this.data.stageBossDefeated = [false, false, false, false, false, false];
        }
      } catch (e) {
        console.warn('Save load failed, using fresh state:', e);
      }
    },

    save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      } catch (e) {
        // Ignore storage errors
      }
    },

    hardReset() {
      localStorage.removeItem(SAVE_KEY);
      this.data = createDefaultState();
      this.save();
    },

    getSkillLevel(id) {
      return this.data.skills[id] || 0;
    },

    hasContract(id) {
      return !!this.data.contracts[id];
    },

    canBuyContract(id) {
      const c = this.contractMap[id];
      if (!c || this.hasContract(id)) return false;
      return this.data.cores >= c.coreCost;
    },

    buyContract(id) {
      if (!this.canBuyContract(id)) return false;
      const c = this.contractMap[id];
      this.data.cores -= c.coreCost;
      this.data.contracts[id] = true;
      this.save();
      return true;
    },

    countAffordableContracts() {
      let n = 0;
      for (const c of window.ZAP.CONFIG.CONTRACTS) {
        if (this.canBuyContract(c.id)) n++;
      }
      return n;
    },

    // Check newly unlocked milestones and return list of newly earned ones
    checkMilestones() {
      const newlyEarned = [];
      for (const m of window.ZAP.CONFIG.MILESTONES) {
        if (this.data.milestones[m.id]) continue;
        if (m.check(this.data)) {
          this.data.milestones[m.id] = true;
          newlyEarned.push(m);
        }
      }
      if (newlyEarned.length > 0) this.save();
      return newlyEarned;
    },

    getMilestoneBonuses() {
      let dmg = 1;
      let volt = 1;
      let crit = 0;
      let popMult = 1;
      for (const m of window.ZAP.CONFIG.MILESTONES) {
        if (!this.data.milestones[m.id]) continue;
        if (m.bonus.dmg) dmg += m.bonus.dmg;
        if (m.bonus.volt) volt += m.bonus.volt;
        if (m.bonus.crit) crit += m.bonus.crit;
        if (m.bonus.popMult) popMult *= m.bonus.popMult;
      }
      return { dmg, volt, crit, popMult };
    },

    getWeaponTier() {
      const idx = Math.min(
        window.ZAP.CONFIG.WEAPON_TIERS.length - 1,
        Math.max(0, this.getSkillLevel('weaponTier'))
      );
      return window.ZAP.CONFIG.WEAPON_TIERS[idx];
    },

    getNextWeaponTier() {
      const lv = this.getSkillLevel('weaponTier');
      return window.ZAP.CONFIG.WEAPON_TIERS[lv + 1] || null;
    },

    isNodeUnlocked(id) {
      const node = this.nodeMap[id];
      if (!node) return false;
      if (!node.requires || node.requires.length === 0) return true;
      return node.requires.some((reqId) => this.getSkillLevel(reqId) > 0);
    },

    getNodeCost(id) {
      const node = this.nodeMap[id];
      if (!node) return { volts: Infinity, cores: 0 };
      const lv = this.getSkillLevel(id);
      if (lv >= node.maxLevel) return { volts: Infinity, cores: 0 };

      let volts;
      if (Array.isArray(node.customCosts) && node.customCosts[lv] !== undefined) {
        volts = node.customCosts[lv];
      } else {
        volts = Math.floor(node.baseCost * Math.pow(node.costMult, lv));
      }
      const cores = node.coreCost ? (lv === 0 ? node.coreCost : Math.ceil(node.coreCost * (lv + 1) * 0.7)) : 0;
      return { volts, cores };
    },

    canAffordNode(id) {
      const node = this.nodeMap[id];
      if (!node) return false;
      if (!this.isNodeUnlocked(id)) return false;
      const lv = this.getSkillLevel(id);
      if (lv >= node.maxLevel) return false;
      const cost = this.getNodeCost(id);
      return this.data.volts >= cost.volts && this.data.cores >= cost.cores;
    },

    buyNode(id) {
      if (!this.canAffordNode(id)) return false;
      const cost = this.getNodeCost(id);
      this.data.volts -= cost.volts;
      this.data.cores -= cost.cores;
      this.data.skills[id] = (this.data.skills[id] || 0) + 1;
      this.save();
      return true;
    },

    countAffordableNodes() {
      let count = 0;
      for (const node of window.ZAP.CONFIG.SKILL_NODES) {
        if (this.canAffordNode(node.id)) count++;
      }
      return count;
    },

    // Picks the best single-click Quick-Upgrade skill (excluding weaponTier which has its own top-left pill!)
    getBestQuickUpgrade() {
      let best = null;
      let bestCost = Infinity;
      for (const node of window.ZAP.CONFIG.SKILL_NODES) {
        if (node.id === 'weaponTier') continue;
        if (!this.canAffordNode(node.id)) continue;
        const c = this.getNodeCost(node.id);
        if (c.cores > 0) continue; // Keep Core upgrades deliberate in Blueprint modal
        if (c.volts < bestCost) {
          bestCost = c.volts;
          best = { node, cost: c.volts };
        }
      }
      return best;
    },

    getStage() {
      return window.ZAP.CONFIG.STAGES[this.data.stageIndex] || window.ZAP.CONFIG.STAGES[0];
    },

    getStats() {
      const s = (id) => this.getSkillLevel(id);
      const weapon = this.getWeaponTier();
      const stage = this.getStage();
      const prestigeMult = this.data.prestigeMult || 1;
      const mb = this.getMilestoneBonuses();

      const baseDamage = 13 * weapon.dmgMult * Math.pow(1.42, s('voltage')) * prestigeMult * mb.dmg;
      const zapRadius = 44 + weapon.radiusBonus + s('radius') * 14;
      const ticksPerSec = 4.4 + weapon.tickBonus + s('tickRate') * 2.2;
      const critChance = Math.min(0.9, 0.1 + s('crit') * 0.07 + mb.crit + (weapon.tier >= 4 ? 0.08 : 0));
      const critMult = 2.4 + s('crit') * 0.38;
      const feverDuration = 7.5 + s('feverMastery') * 1.6;
      const feverChargeMult = 1 + s('feverMastery') * 0.28;

      const vortexLevel = s('swingVortex');
      const vortexRadius = vortexLevel > 0 ? 160 + vortexLevel * 42 : 0;
      const vortexStrength = vortexLevel > 0 ? 110 * (1 + vortexLevel * 0.45) : 0;

      const builtInChains = weapon.tier >= 6 ? 4 : weapon.tier >= 5 ? 3 : weapon.tier >= 4 ? 2 : weapon.tier >= 3 ? 1 : 0;
      const chainJumps = s('chainCount') + builtInChains;
      const chainRange = 120 + s('chainCount') * 18 + (weapon.tier >= 4 ? 25 : 0);
      const chainDmgRatio = 0.68 + s('chainSplit') * 0.16;
      const chainBranches = 1 + Math.floor(s('chainSplit') * 0.65);
      const chainCritLevel = s('chainCrit');
      const deathNovaChance = s('deathNova') * 0.15;
      const deathNovaRadius = 80 + s('deathNova') * 18;

      const empRadius = 120 + weapon.radiusBonus * 0.9 + s('empPulse') * 34;
      const empCooldown = Math.max(0.6, 2.3 - s('empPulse') * 0.28 - weapon.tier * 0.07);
      const empDamage = baseDamage * (2.8 + s('empPulse') * 0.75);

      const uvLampCount = s('uvLamp');
      const uvPullStrength = 48 + s('uvLamp') * 36;
      const coilCount = s('coil');
      const coilSlow = Math.min(0.72, 0.22 + s('coil') * 0.1);
      const turretCount = s('turret');
      const orbitTeslaCount = s('orbitTesla');
      const bloodBurstLevel = s('bloodBurst');

      const voltMult = Math.pow(1.48, s('voltGain')) * stage.voltMult * prestigeMult * mb.volt;
      const magnetRadius = s('magnet') >= 6 ? 2500 : 160 + s('magnet') * 90;
      const magnetSpeed = 500 + s('magnet') * 150;
      const rareLuckMult = 1 + s('goldenLuck') * 0.45;
      const goldenRewardMult = 16 + s('goldenLuck') * 7;
      const comboMaxMult = 3.2 + s('comboCap') * 1.8;
      const comboDecayTime = 2.6 + s('comboCap') * 0.48;
      const bossDamageMult = 1 + s('bossHunter') * 0.45;
      const bossVoltMult = 1 + s('bossHunter') * 0.7;

      const maxMosquitoes = 26 + s('spawnRate') * 16;
      const spawnInterval = Math.max(0.055, 0.64 / (1 + s('spawnRate') * 0.34));
      const swarmChance = 0.14 + s('swarmCluster') * 0.12;
      const swarmBonusSize = s('swarmCluster') * 2;
      const swarmRushInterval = Math.max(18, 38 - s('swarmRushUpgrade') * 4);
      const swarmRushVoltMult = 2 + s('swarmRushUpgrade') * 0.8;

      const omegaMult = this.hasContract('omegaScale') ? 10 : 1;
      const popPerKill = Math.max(
        1,
        Math.floor(stage.popScale * Math.pow(1.9, s('popBoost')) * prestigeMult * mb.popMult * omegaMult)
      );
      const coreDropBonus = this.hasContract('omegaScale') ? 1 : 0;

      const orbitalLevel = s('orbitalBeam');
      const orbitalCooldown = Math.max(4, 10 - orbitalLevel * 1.8);

      return {
        weapon,
        baseDamage,
        zapRadius,
        ticksPerSec,
        critChance,
        critMult,
        feverDuration,
        feverChargeMult,
        vortexLevel,
        vortexRadius,
        vortexStrength,
        chainJumps,
        chainRange,
        chainDmgRatio,
        chainBranches,
        chainCritLevel,
        deathNovaChance,
        deathNovaRadius,
        empRadius,
        empCooldown,
        empDamage,
        uvLampCount,
        uvPullStrength,
        coilCount,
        coilSlow,
        turretCount,
        orbitTeslaCount,
        bloodBurstLevel,
        voltMult,
        magnetRadius,
        magnetSpeed,
        rareLuckMult,
        goldenRewardMult,
        comboMaxMult,
        comboDecayTime,
        bossDamageMult,
        bossVoltMult,
        maxMosquitoes,
        spawnInterval,
        swarmChance,
        swarmBonusSize,
        swarmRushInterval,
        swarmRushVoltMult,
        popPerKill,
        coreDropBonus,
        orbitalLevel,
        orbitalCooldown,
      };
    },

    canPrestige() {
      return this.data.unlockedStage >= 3 || this.data.totalPopKilled >= 500_000_000;
    },

    getNextPrestigeBonus() {
      return Math.max(0.5, Math.floor(Math.log10(Math.max(10, this.data.totalVolts)) * 0.5 * 10) / 10);
    },

    doPrestige() {
      const bonus = this.getNextPrestigeBonus();
      const keptCores = this.data.cores + 2;
      const keptContracts = { ...this.data.contracts };
      const keptMilestones = { ...this.data.milestones };
      const keptSettings = { ...this.data.settings };
      const nextCount = this.data.prestigeCount + 1;
      const nextMult = Number((this.data.prestigeMult + bonus).toFixed(2));
      const keptTotalPop = this.data.totalPopKilled;
      const keptBossKills = this.data.bossKills;
      const keptGoldenKills = this.data.goldenKills;
      const keptBombKills = this.data.bombKills;

      this.data = createDefaultState();
      this.data.prestigeCount = nextCount;
      this.data.prestigeMult = nextMult;
      this.data.cores = keptCores;
      this.data.contracts = keptContracts;
      this.data.milestones = keptMilestones;
      this.data.totalPopKilled = keptTotalPop;
      this.data.bossKills = keptBossKills;
      this.data.goldenKills = keptGoldenKills;
      this.data.bombKills = keptBombKills;
      this.data.settings = keptSettings;
      this.save();
    },
  };

  window.ZAP.State = State;
})();
