// ZAP 100T — Perimeter HUD, 3-Tab Blueprint Modal (Skill Tree / Core Contracts / Milestones), Theme Toggle
window.ZAP = window.ZAP || {};

(function () {
  const SOUND_ON_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>';
  const SOUND_OFF_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';

  const UI = {
    selectedNodeId: 'weaponTier',
    activeTab: 'tree', // 'tree' | 'contracts' | 'milestones' | 'codex'
    dockTab: 'upgrades', // 'upgrades' | 'contracts'
    buyMode: '1', // '1' | 'max'
    lastDockWeaponKey: '',
    lastDockRenderKey: '',
    treePan: { x: 0, y: 0, scale: 0.88, dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 },
    nodeEls: {},
    edgeEls: [],
    activeModal: null,

    init() {
      this._cacheDom();
      this._bindEvents();
      this._buildSkillTreeGraph();
      this.centerTree();
      this.refreshSettingsInputs();
      this.applyTheme();
      this.updateHUD();
      this.renderDock(true);
    },

    _cacheDom() {
      const $ = (id) => document.getElementById(id);
      this.el = {
        volt: $('volt-display'),
        vps: $('vps-display'),
        corePill: $('core-pill'),
        core: $('core-display'),

        weaponBtn: $('btn-weapon-evolve'),
        dockWeaponCanvas: $('dock-weapon-canvas'),
        weaponIcon: $('weapon-icon'),
        weaponTierLabel: $('weapon-tier-label'),
        weaponName: $('weapon-name-display'),
        weaponNextBadge: $('weapon-next-badge'),

        dockList: $('dock-list'),
        dockUpgBadge: $('dock-upg-badge'),
        dockContractBadge: $('dock-contract-badge'),
        btnBuyMode: $('btn-buy-mode'),
        btnToggleDock: $('btn-toggle-dock'),
        dockToggleIcon: $('dock-toggle-icon'),
        dockSpecStrip: $('dock-spec-strip'),

        stageBadge: $('stage-badge'),
        scaleBadge: $('scale-badge'),
        remaining: $('remaining-display'),
        liveSwarmBadge: $('live-swarm-badge'),
        stageProgressFill: $('stage-progress-fill'),
        stageProgressText: $('stage-progress-text'),
        stageNotifyDot: $('stage-notify-dot'),

        rushBanner: $('rush-banner'),
        rushDesc: $('rush-desc'),
        rushTimer: $('rush-timer'),

        comboContainer: $('combo-container'),
        comboCount: $('combo-count'),
        comboMult: $('combo-mult'),
        comboDecayFill: $('combo-decay-fill'),

        bossHud: $('boss-hud'),
        bossName: $('boss-name'),
        bossHpText: $('boss-hp-text'),
        bossHpFill: $('boss-hp-fill'),
        bossSummonBtn: $('btn-summon-boss'),

        feverWidget: $('fever-widget'),
        feverPercent: $('fever-percent'),
        feverFill: $('fever-fill'),
        empProgress: $('emp-progress'),
        empTitle: $('emp-title'),

        skillTreeBtn: $('btn-skill-tree'),
        affordableBadge: $('affordable-badge'),

        themeBtn: $('btn-theme'),
        soundBtn: $('btn-sound'),
        soundIcon: $('sound-icon'),
        bgmBtn: $('btn-bgm'),
        stageSelectBtn: $('btn-stage-select'),
        helpBtn: $('btn-help'),

        toastContainer: $('toast-container'),

        // Blueprint Modal + 3 Tabs
        treeModal: $('skill-tree-modal'),
        treeViewport: $('tree-viewport'),
        treeCanvasLayer: $('tree-canvas-layer'),
        treeEdgesSvg: $('tree-edges-svg'),
        treeNodesLayer: $('tree-nodes-layer'),
        treeVolt: $('tree-volt-display'),
        treeCore: $('tree-core-display'),
        btnCenterTree: $('btn-center-tree'),
        btnCloseTree: $('btn-close-tree'),

        panelTree: $('panel-tree'),
        panelContracts: $('panel-contracts'),
        panelMilestones: $('panel-milestones'),
        panelCodex: $('panel-codex'),
        contractsGrid: $('contracts-grid'),
        milestonesGrid: $('milestones-grid'),
        weaponRoadmap: $('weapon-roadmap'),
        codexGrid: $('codex-grid'),
        combatSpecSummary: $('combat-spec-summary'),
        milestoneBonusSummary: $('milestone-bonus-summary'),
        contractTabBadge: $('contract-tab-badge'),
        milestoneTabCount: $('milestone-tab-count'),

        inspIcon: $('insp-icon'),
        inspBranch: $('insp-branch'),
        inspName: $('insp-name'),
        inspLevel: $('insp-level'),
        inspDesc: $('insp-desc'),
        inspEffect: $('insp-effect'),
        inspCost: $('insp-cost'),
        btnBuyNode: $('btn-buy-node'),
        btnBuyMax: $('btn-buy-max'),

        stageModal: $('stage-modal'),
        stageList: $('stage-list'),

        settingsModal: $('settings-modal'),
        statsGrid: $('stats-grid'),
        volumeSlider: $('volume-slider'),
        bgmToggle: $('bgm-toggle'),
        shakeToggle: $('shake-toggle'),
        numbersToggle: $('numbers-toggle'),
        btnExportSave: $('btn-export-save'),
        btnImportSave: $('btn-import-save'),
        btnPrestige: $('btn-prestige'),
        btnHardReset: $('btn-hard-reset'),

        victoryModal: $('victory-modal'),
        victoryStats: $('victory-stats'),
        btnContinueEndless: $('btn-continue-endless'),
      };
    },

    applyTheme() {
      const theme = window.ZAP.State.data.settings.theme === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
    },

    _bindEvents() {
      this.el.weaponBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.ZAP.Audio.unlock();
        if (window.ZAP.State.canAffordNode('weaponTier')) {
          this._purchaseSkill('weaponTier');
        } else {
          this.selectedNodeId = 'weaponTier';
          this.switchTab('tree');
          this.openModal('skill-tree');
        }
      });

      this.el.corePill.addEventListener('click', (e) => {
        e.stopPropagation();
        if (document.body.classList.contains('dock-collapsed')) {
          this.switchTab('contracts');
          this.openModal('skill-tree');
        } else {
          this.switchDockTab('contracts');
        }
      });

      this.el.skillTreeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.ZAP.Audio.unlock();
        this.toggleModal('skill-tree');
      });

      this.el.stageSelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleModal('stage');
      });

      this.el.themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const s = window.ZAP.State.data.settings;
        s.theme = s.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.lastDockWeaponKey = '';
        this.renderDock(true);
        window.ZAP.State.save();
        this.showToast(s.theme === 'dark' ? '다크 잉크 모드' : '화이트 종이 모드');
      });

      this.el.helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleModal('settings');
      });

      if (this.el.btnToggleDock) {
        this.el.btnToggleDock.addEventListener('click', (e) => {
          e.stopPropagation();
          const collapsed = document.body.classList.toggle('dock-collapsed');
          if (this.el.dockToggleIcon) {
            this.el.dockToggleIcon.textContent = collapsed ? '«' : '»';
          }
          if (window.ZAP.syncPlayfieldSize) {
            window.ZAP.syncPlayfieldSize();
            setTimeout(() => window.ZAP.syncPlayfieldSize(), 210);
          }
        });
      }

      document.querySelectorAll('.dock-tab').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.switchDockTab(btn.dataset.dockTab);
        });
      });

      if (this.el.btnBuyMode) {
        this.el.btnBuyMode.addEventListener('click', (e) => {
          e.stopPropagation();
          this.buyMode = this.buyMode === '1' ? 'max' : '1';
          this.el.btnBuyMode.textContent = this.buyMode === 'max' ? 'MAX' : '×1';
          this.el.btnBuyMode.classList.toggle('max-active', this.buyMode === 'max');
          this.renderDock(true);
        });
      }

      this.el.soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.ZAP.Audio.unlock();
        const s = window.ZAP.State.data.settings;
        s.muted = !s.muted;
        window.ZAP.Audio.setMuted(s.muted);
        this.el.soundIcon.innerHTML = s.muted ? SOUND_OFF_SVG : SOUND_ON_SVG;
        window.ZAP.State.save();
      });

      this.el.bgmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.ZAP.Audio.unlock();
        const s = window.ZAP.State.data.settings;
        s.bgm = !s.bgm;
        window.ZAP.Audio.setBgmEnabled(s.bgm);
        this.el.bgmBtn.classList.toggle('bgm-off', !s.bgm);
        if (this.el.bgmToggle) this.el.bgmToggle.checked = s.bgm;
        window.ZAP.State.save();
        this.showToast(s.bgm ? '미니멀 BGM 켜짐' : '미니멀 BGM 꺼짐');
      });

      this.el.bossSummonBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.ZAP.Audio.unlock();
        window.ZAP.Engine.summonBoss();
      });

      this.el.btnCloseTree.addEventListener('click', () => this.closeModal());
      this.el.btnCenterTree.addEventListener('click', () => this.centerTree());

      document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
      });

      document.querySelectorAll('[data-close]').forEach((el) => {
        el.addEventListener('click', () => this.closeModal());
      });

      this.el.btnBuyNode.addEventListener('click', () => {
        if (this.selectedNodeId) this._purchaseSkill(this.selectedNodeId);
      });

      this.el.btnBuyMax.addEventListener('click', () => {
        if (!this.selectedNodeId) return;
        let bought = 0;
        while (window.ZAP.State.canAffordNode(this.selectedNodeId) && bought < 20) {
          this._purchaseSkill(this.selectedNodeId, bought > 0);
          bought++;
        }
      });

      this.el.volumeSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value) / 100;
        window.ZAP.State.data.settings.volume = val;
        window.ZAP.State.data.settings.muted = val === 0;
        window.ZAP.Audio.setVolume(val);
        window.ZAP.Audio.setMuted(val === 0);
        this.el.soundIcon.innerHTML = val === 0 ? SOUND_OFF_SVG : SOUND_ON_SVG;
        window.ZAP.State.save();
      });

      this.el.bgmToggle.addEventListener('change', (e) => {
        const on = e.target.checked;
        window.ZAP.State.data.settings.bgm = on;
        window.ZAP.Audio.setBgmEnabled(on);
        this.el.bgmBtn.classList.toggle('bgm-off', !on);
        window.ZAP.State.save();
      });

      this.el.btnExportSave.addEventListener('click', async () => {
        const code = window.ZAP.State.exportSave();
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code);
          this.showToast('세이브 코드가 클립보드에 복사되었습니다!', 'gold');
        } catch (err) {
          prompt('아래 세이브 코드를 복사해 보관하세요:', code);
        }
      });

      this.el.btnImportSave.addEventListener('click', () => {
        const code = prompt('불러올 세이브 코드를 붙여넣으세요:');
        if (!code) return;
        if (window.ZAP.State.importSave(code)) {
          this.applyTheme();
          this.refreshSettingsInputs();
          window.ZAP.Engine.resetTransient();
          window.ZAP.Engine.rebuildStructures();
          window.ZAP.Engine.seedInitialSwarm();
          this.closeModal();
          this.updateHUD();
          this.showToast('세이브를 성공적으로 불러왔습니다!', 'gold');
        } else {
          this.showToast('유효하지 않은 세이브 코드입니다.', 'boss');
        }
      });

      this.el.shakeToggle.addEventListener('change', (e) => {
        window.ZAP.State.data.settings.shake = e.target.checked;
        window.ZAP.State.save();
      });

      this.el.numbersToggle.addEventListener('change', (e) => {
        window.ZAP.State.data.settings.showNumbers = e.target.checked;
        window.ZAP.State.save();
      });

      this.el.btnPrestige.addEventListener('click', () => {
        const bonus = window.ZAP.State.getNextPrestigeBonus();
        if (!confirm(`초전도 리부트를 진행할까요?\n영구 화력·볼트·멸종 배율 +${bonus}× 및 변이 코어 +2를 획득하며 계약서·업적은 모두 유지됩니다.`)) return;
        window.ZAP.State.doPrestige();
        window.ZAP.Engine.resetTransient();
        window.ZAP.Engine.rebuildStructures();
        window.ZAP.Engine.seedInitialSwarm();
        this.closeModal();
        this.updateHUD();
        this.showToast(`초전도 리부트 완료! 영구 배율 ×${window.ZAP.State.data.prestigeMult}`, 'gold');
        window.ZAP.Audio.playFeverStart();
      });

      this.el.btnHardReset.addEventListener('click', () => {
        if (!confirm('정말 모든 진행 데이터를 초기화할까요?')) return;
        window.ZAP.State.hardReset();
        this.applyTheme();
        window.ZAP.Engine.resetTransient();
        window.ZAP.Engine.rebuildStructures();
        window.ZAP.Engine.seedInitialSwarm();
        this.closeModal();
        this.updateHUD();
        this.showToast('세이브가 초기화되었습니다.');
      });

      this.el.btnContinueEndless.addEventListener('click', () => this.closeModal());

      // Pan & Zoom on Blueprint Skill Tree
      const vp = this.el.treeViewport;
      vp.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.skill-node')) return;
        this.treePan.dragging = true;
        this.treePan.startX = e.clientX;
        this.treePan.startY = e.clientY;
        this.treePan.origX = this.treePan.x;
        this.treePan.origY = this.treePan.y;
        vp.setPointerCapture(e.pointerId);
      });

      vp.addEventListener('pointermove', (e) => {
        if (!this.treePan.dragging) return;
        this.treePan.x = this.treePan.origX + (e.clientX - this.treePan.startX);
        this.treePan.y = this.treePan.origY + (e.clientY - this.treePan.startY);
        this._applyTreeTransform();
      });

      vp.addEventListener('pointerup', () => {
        this.treePan.dragging = false;
      });

      vp.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.91;
        const nextScale = Math.max(0.5, Math.min(1.45, this.treePan.scale * factor));
        const rect = vp.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        this.treePan.x = mx - (mx - this.treePan.x) * (nextScale / this.treePan.scale);
        this.treePan.y = my - (my - this.treePan.y) * (nextScale / this.treePan.scale);
        this.treePan.scale = nextScale;
        this._applyTreeTransform();
      }, { passive: false });
    },

    switchTab(tab) {
      this.activeTab = tab;
      document.querySelectorAll('.tab-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.tab === tab);
      });
      this.el.panelTree.classList.toggle('hidden', tab !== 'tree');
      this.el.panelContracts.classList.toggle('hidden', tab !== 'contracts');
      this.el.panelMilestones.classList.toggle('hidden', tab !== 'milestones');
      this.el.panelCodex.classList.toggle('hidden', tab !== 'codex');
      this.el.btnCenterTree.classList.toggle('hidden', tab !== 'tree');

      if (tab === 'tree') {
        this.refreshSkillTree();
        requestAnimationFrame(() => this.centerTree());
      } else if (tab === 'contracts') {
        this.renderContracts();
      } else if (tab === 'milestones') {
        this.renderMilestones();
      } else if (tab === 'codex') {
        this.renderCodex();
      }
    },

    buyQuickUpgrade() {
      const best = window.ZAP.State.getBestQuickUpgrade();
      if (!best) return false;
      if (this._purchaseSkill(best.node.id)) {
        const eng = window.ZAP.Engine;
        const tx = eng.mouse.active ? eng.mouse.x : eng.width / 2;
        const ty = eng.mouse.active ? eng.mouse.y - 38 : eng.height / 2;
        eng.spawnText(tx, ty, `${best.node.name} +LV!`, '#ffca00', 16, true);
        return true;
      }
      return false;
    },

    refreshSettingsInputs() {
      const s = window.ZAP.State.data.settings;
      if (s.bgm === undefined) s.bgm = true;
      this.el.volumeSlider.value = Math.round(s.volume * 100);
      this.el.bgmToggle.checked = !!s.bgm;
      this.el.bgmBtn.classList.toggle('bgm-off', !s.bgm);
      this.el.shakeToggle.checked = !!s.shake;
      this.el.numbersToggle.checked = !!s.showNumbers;
      this.el.soundIcon.innerHTML = s.muted ? SOUND_OFF_SVG : SOUND_ON_SVG;
      window.ZAP.Audio.setVolume(s.volume);
      window.ZAP.Audio.setMuted(s.muted);
      window.ZAP.Audio.setBgmEnabled(s.bgm);
    },

    _buildSkillTreeGraph() {
      const cfg = window.ZAP.CONFIG;
      const svg = this.el.treeEdgesSvg;
      const layer = this.el.treeNodesLayer;
      svg.innerHTML = '';
      layer.innerHTML = '';
      this.nodeEls = {};
      this.edgeEls = [];

      const byId = {};
      for (const n of cfg.SKILL_NODES) byId[n.id] = n;

      const edgePairs = [];
      for (const childId of ['voltage', 'voltGain', 'spawnRate']) {
        edgePairs.push({ from: 'weaponTier', to: childId });
      }
      for (const node of cfg.SKILL_NODES) {
        for (const reqId of node.requires || []) {
          edgePairs.push({ from: reqId, to: node.id });
        }
      }

      for (const ep of edgePairs) {
        const a = byId[ep.from];
        const b = byId[ep.to];
        if (!a || !b) continue;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', a.x);
        line.setAttribute('y1', a.y);
        line.setAttribute('x2', b.x);
        line.setAttribute('y2', b.y);
        line.classList.add('tree-edge');
        svg.appendChild(line);
        this.edgeEls.push({ el: line, from: ep.from, to: ep.to });
      }

      for (const node of cfg.SKILL_NODES) {
        const div = document.createElement('button');
        div.type = 'button';
        div.className = 'skill-node';
        div.style.left = `${node.x}px`;
        div.style.top = `${node.y}px`;
        div.style.setProperty('--node-color', cfg.BRANCH_COLORS[node.branch] || '#141414');
        if (node.id === 'weaponTier') {
          div.style.width = '104px';
          div.style.height = '98px';
          div.style.marginLeft = '-52px';
          div.style.marginTop = '-49px';
          div.style.borderRadius = '18px';
        }
        div.innerHTML = `
          <span class="node-branch-bar"></span>
          <span class="node-icon mono">${node.icon}</span>
          <span class="node-title">${node.name}</span>
          <span class="node-lvl mono">0/${node.maxLevel}</span>
          <span class="node-cost-pill mono">⚡0</span>
        `;

        div.addEventListener('click', (e) => {
          e.stopPropagation();
          window.ZAP.Audio.unlock();
          if (this.selectedNodeId === node.id && window.ZAP.State.canAffordNode(node.id)) {
            this._purchaseSkill(node.id);
          } else {
            this.selectedNodeId = node.id;
            this.refreshSkillTree();
          }
        });

        layer.appendChild(div);
        this.nodeEls[node.id] = div;
      }
    },

    centerTree() {
      const rect = this.el.treeViewport.getBoundingClientRect();
      const vw = rect.width || 1100;
      const vh = rect.height || 660;
      const scale = vw < 760 ? 0.56 : 0.68;
      this.treePan.scale = scale;
      // Offset slightly left on desktop so the right-side inspector never hides outer nodes
      const shiftX = vw >= 900 ? -110 : 0;
      this.treePan.x = vw / 2 + shiftX - 800 * scale;
      this.treePan.y = vh / 2 - 565 * scale;
      this._applyTreeTransform();
    },

    _applyTreeTransform() {
      this.el.treeCanvasLayer.style.transform =
        `translate(${this.treePan.x}px, ${this.treePan.y}px) scale(${this.treePan.scale})`;
    },

    _purchaseSkill(id, silent = false) {
      const state = window.ZAP.State;
      if (!state.buyNode(id)) return false;

      const isEvolution = id === 'weaponTier';
      if (!silent) window.ZAP.Audio.playUpgrade(isEvolution);
      if (isEvolution) {
        const w = state.getWeaponTier();
        this.showToast(`장비 진화! [${w.name}] 장착`, 'gold');
        window.ZAP.Engine.triggerEvolutionBurst();
      }

      if (id === 'uvLamp' || id === 'coil' || id === 'turret') {
        window.ZAP.Engine.rebuildStructures();
      }

      this.refreshSkillTree();
      this.updateHUD();
      this.renderDock(true);
      return true;
    },

    refreshSkillTree() {
      const state = window.ZAP.State;
      const cfg = window.ZAP.CONFIG;
      const fmt = window.ZAP.formatNum;

      this.el.treeVolt.textContent = fmt(state.data.volts);
      this.el.treeCore.textContent = fmt(state.data.cores);

      const affContracts = state.countAffordableContracts();
      this.el.contractTabBadge.textContent = affContracts;
      this.el.contractTabBadge.classList.toggle('hidden', affContracts === 0);

      const earnedMs = Object.keys(state.data.milestones).length;
      this.el.milestoneTabCount.textContent = `${earnedMs}/${cfg.MILESTONES.length}`;

      for (const edge of this.edgeEls) {
        const unlocked = state.isNodeUnlocked(edge.to) && (edge.from === 'weaponTier' || state.getSkillLevel(edge.from) > 0);
        edge.el.classList.toggle('unlocked', unlocked);
      }

      for (const node of cfg.SKILL_NODES) {
        const el = this.nodeEls[node.id];
        if (!el) continue;
        const lv = state.getSkillLevel(node.id);
        const unlocked = state.isNodeUnlocked(node.id);
        const maxed = lv >= node.maxLevel;
        const affordable = state.canAffordNode(node.id);
        const cost = state.getNodeCost(node.id);

        if (node.id === 'weaponTier') {
          const curW = state.getWeaponTier();
          const nextW = state.getNextWeaponTier();
          el.querySelector('.node-icon').textContent = nextW ? nextW.tag : curW.tag;
          el.querySelector('.node-title').textContent = nextW ? `→ ${nextW.shortName}` : curW.shortName;
        }

        el.querySelector('.node-lvl').textContent = `${lv}/${node.maxLevel}`;
        const pill = el.querySelector('.node-cost-pill');
        if (maxed) pill.textContent = 'MAX';
        else if (cost.cores > 0) pill.textContent = `⚡${fmt(cost.volts)} + C${cost.cores}`;
        else pill.textContent = `⚡${fmt(cost.volts)}`;

        el.classList.toggle('locked', !unlocked);
        el.classList.toggle('available', unlocked && lv === 0 && !affordable);
        el.classList.toggle('affordable', affordable);
        el.classList.toggle('purchased', lv > 0 && !maxed);
        el.classList.toggle('maxed', maxed);
        el.classList.toggle('selected', this.selectedNodeId === node.id);
      }

      const sel = state.nodeMap[this.selectedNodeId] || cfg.SKILL_NODES[0];
      const lv = state.getSkillLevel(sel.id);
      const unlocked = state.isNodeUnlocked(sel.id);
      const maxed = lv >= sel.maxLevel;
      const affordable = state.canAffordNode(sel.id);
      const cost = state.getNodeCost(sel.id);

      if (sel.id === 'weaponTier') {
        const curW = state.getWeaponTier();
        const nextW = state.getNextWeaponTier();
        this.el.inspIcon.textContent = nextW ? nextW.tag : curW.tag;
        this.el.inspName.textContent = nextW ? `장비 진화: ${nextW.name}` : `최종 장비: ${curW.name}`;
        this.el.inspDesc.textContent = nextW ? nextW.desc : curW.desc;
      } else {
        this.el.inspIcon.textContent = sel.icon;
        this.el.inspName.textContent = sel.name;
        this.el.inspDesc.textContent = sel.desc;
      }

      this.el.inspBranch.textContent = cfg.BRANCH_NAMES[sel.branch] || 'SKILL';
      this.el.inspLevel.textContent = `Lv.${lv} / ${sel.maxLevel}`;
      this.el.inspEffect.textContent = sel.effectText(lv);

      if (maxed) {
        this.el.inspCost.textContent = '최고 레벨 달성 완료';
        this.el.btnBuyNode.textContent = '강화 완료';
        this.el.btnBuyNode.disabled = true;
        this.el.btnBuyMax.disabled = true;
      } else if (!unlocked) {
        const lockReason = state.getNodeLockReason(sel.id);
        this.el.inspCost.textContent = `잠김 · ${lockReason}`;
        this.el.btnBuyNode.textContent = '잠김';
        this.el.btnBuyNode.disabled = true;
        this.el.btnBuyMax.disabled = true;
      } else {
        const coreStr = cost.cores > 0 ? ` + CORE ${cost.cores}` : '';
        this.el.inspCost.textContent = `필요 비용: ⚡ ${fmt(cost.volts)}${coreStr}`;
        this.el.btnBuyNode.textContent = sel.id === 'weaponTier' ? '장비 진화하기' : '강화하기';
        this.el.btnBuyNode.disabled = !affordable;
        this.el.btnBuyMax.disabled = !affordable;
      }
    },

    renderContracts() {
      const state = window.ZAP.State;
      this.el.treeVolt.textContent = window.ZAP.formatNum(state.data.volts);
      this.el.treeCore.textContent = window.ZAP.formatNum(state.data.cores);
      this.el.contractsGrid.innerHTML = '';

      for (const c of window.ZAP.CONFIG.CONTRACTS) {
        const signed = state.hasContract(c.id);
        const canBuy = state.canBuyContract(c.id);

        const card = document.createElement('div');
        card.className = `contract-card${signed ? ' signed' : ''}`;
        card.innerHTML = `
          <div>
            <div class="contract-head">
              <span class="contract-code mono">${c.code}</span>
              <span class="contract-tag">${c.tag}</span>
            </div>
            <h4>${c.name}</h4>
            <p>${c.desc}</p>
          </div>
          <div class="contract-footer">
            <span class="contract-cost mono">필요: CORE ${c.coreCost}</span>
            ${signed
              ? '<span class="contract-stamp mono">계약 완료</span>'
              : `<button class="buy-btn" style="flex:0 0 auto;padding:7px 14px;" ${canBuy ? '' : 'disabled'}>계약 체결</button>`}
          </div>
        `;

        if (!signed && canBuy) {
          card.querySelector('button').addEventListener('click', () => {
            if (state.buyContract(c.id)) {
              window.ZAP.Audio.playStamp();
              window.ZAP.Engine.rebuildStructures();
              this.showToast(`계약 체결! [${c.name}] 영구 발동`, 'gold');
              this.renderContracts();
              this.refreshSkillTree();
              this.updateHUD();
            }
          });
        }
        this.el.contractsGrid.appendChild(card);
      }
    },

    renderMilestones() {
      const state = window.ZAP.State;
      const fmt = window.ZAP.formatNum;
      const mb = state.getMilestoneBonuses();

      this.el.milestoneBonusSummary.textContent =
        `현재 영구 업적 보너스: 화력 ×${mb.dmg.toFixed(2)} · 볼트 ×${mb.volt.toFixed(2)} · 치명타 +${Math.round(mb.crit * 100)}% · 멸종 환산 ×${mb.popMult.toFixed(2)}`;

      this.el.milestonesGrid.innerHTML = '';
      for (const ms of window.ZAP.CONFIG.MILESTONES) {
        const earned = !!state.data.milestones[ms.id];
        const [cur, max] = ms.progress(state.data);
        const pct = Math.min(100, (cur / Math.max(1, max)) * 100);

        const card = document.createElement('div');
        card.className = `milestone-card${earned ? ' earned' : ''}`;
        card.innerHTML = `
          <div class="ms-top">
            <span class="ms-name">${earned ? '✓ ' : ''}${ms.name}</span>
            <span class="ms-reward mono">${ms.rewardLabel}</span>
          </div>
          <div class="ms-desc">${ms.desc}</div>
          <div class="ms-bar"><div class="ms-bar-fill" style="width:${pct}%"></div></div>
          <div class="ms-prog-text mono">${earned ? '달성 완료' : `${fmt(cur)} / ${fmt(max)}`}</div>
        `;
        this.el.milestonesGrid.appendChild(card);
      }
    },

    renderCodex() {
      const state = window.ZAP.State;
      const stats = state.getStats();
      const fmt = window.ZAP.formatNum;
      const kills = state.data.speciesKills || {};
      const curTier = state.getSkillLevel('weaponTier');

      this.el.combatSpecSummary.textContent =
        `기본 화력 ${fmt(stats.baseDamage)} · 초당 타격 ${stats.ticksPerSec.toFixed(1)}회 · 치명타 ${Math.round(stats.critChance * 100)}% (×${stats.critMult.toFixed(1)}) · 연쇄 점프 ${stats.chainJumps}회 · 반경 ${Math.round(stats.zapRadius)}px`;

      // 1. Render 7-Tier Illustrated Weapon Roadmap!
      this.el.weaponRoadmap.innerHTML = '';
      window.ZAP.CONFIG.WEAPON_TIERS.forEach((wt, idx) => {
        const unlocked = idx <= curTier;
        const isCurrent = idx === curTier;
        const card = document.createElement('div');
        card.className = `roadmap-card${isCurrent ? ' current' : unlocked ? '' : ' locked'}`;
        card.innerHTML = `
          <span class="roadmap-tag mono">${wt.tag} · ×${wt.dmgMult}</span>
          <canvas class="roadmap-canvas"></canvas>
          <span class="roadmap-name">${unlocked ? wt.shortName : '???'}</span>
        `;
        this.el.weaponRoadmap.appendChild(card);
        if (unlocked) {
          window.ZAP.Renderer.drawWeaponThumb(card.querySelector('canvas'), idx);
        }
      });

      // 2. Render 6-Species Illustrated Mosquito Codex!
      this.el.codexGrid.innerHTML = '';
      for (const sp of window.ZAP.CONFIG.CODEX) {
        const count = kills[sp.id] || 0;
        const seen = count > 0 || sp.id === 'normal';

        const card = document.createElement('div');
        card.className = `codex-card${seen ? '' : ' unseen'}`;
        card.innerHTML = `
          <div class="codex-top-row">
            <div class="codex-portrait-box">
              ${seen ? '<canvas class="codex-portrait-canvas"></canvas>' : '<span class="mono" style="font-size:18px;font-weight:900;">?</span>'}
            </div>
            <div class="codex-meta">
              <div class="codex-head">
                <span class="codex-code mono">${sp.code}</span>
                <span class="codex-kills mono">${seen ? `처치 ${fmt(count)}마리` : '미발견'}</span>
              </div>
              <h4 style="margin-top:5px;"><i class="codex-dot" style="background:${sp.accent}"></i>${seen ? sp.name : '??? (미확인 개체)'}</h4>
            </div>
          </div>
          <p class="codex-desc">${seen ? sp.desc : '작전 중 이 특수 모기를 격추하면 도감 기록과 일러스트가 해금됩니다.'}</p>
          <div class="codex-reward mono">${seen ? sp.reward : sp.tag}</div>
        `;
        this.el.codexGrid.appendChild(card);
        if (seen) {
          window.ZAP.Renderer.drawCodexPortrait(card.querySelector('canvas'), sp.id);
        }
      }
    },

    renderStageList() {
      const state = window.ZAP.State;
      const fmt = window.ZAP.formatNum;
      this.el.stageList.innerHTML = '';

      window.ZAP.CONFIG.STAGES.forEach((stage, idx) => {
        const unlocked = idx <= state.data.unlockedStage;
        const active = idx === state.data.stageIndex;
        const cleared = state.data.stageBossDefeated[idx];

        const item = document.createElement('div');
        item.className = `stage-item${active ? ' active' : ''}${unlocked ? '' : ' locked'}`;
        item.innerHTML = `
          <div class="stage-item-left">
            <span class="stage-num-badge mono">${unlocked ? '0' + (idx + 1) : '—'}</span>
            <div class="stage-info">
              <h3>STAGE ${idx + 1} · ${stage.name}</h3>
              <p>${unlocked ? stage.desc : `STAGE ${idx} 보스를 처치하면 해금됩니다.`}</p>
              <p class="mono" style="font-size:11px;margin-top:3px;font-weight:800;opacity:0.85;">${stage.unlockSummary}</p>
            </div>
          </div>
          <div class="stage-item-right">
            <div class="stage-mult-tag mono">환산 ×${fmt(stage.popScale)} · 최대 ${stage.baseCap}+마리</div>
            <div class="stage-status-tag">${active ? '작전 중' : cleared ? '보스 격파' : unlocked ? '이동 가능' : '잠김'}</div>
          </div>
        `;
        if (unlocked && !active) {
          item.addEventListener('click', () => {
            window.ZAP.Engine.switchStage(idx);
            this.closeModal();
            this.updateHUD();
          });
        }
        this.el.stageList.appendChild(item);
      });
    },

    renderStatsGrid(targetEl) {
      const d = window.ZAP.State.data;
      const fmt = window.ZAP.formatNum;
      const mins = Math.floor(d.playTime / 60);
      const secs = Math.floor(d.playTime % 60);
      const w = window.ZAP.State.getWeaponTier();

      const items = [
        ['현재 장비', `${w.tag} ${w.name}`],
        ['누적 멸종 모기', `${fmt(d.totalPopKilled)} 마리`],
        ['직접 처치 개체', `${fmt(d.totalKills)} 마리`],
        ['최고 콤보', `${d.maxCombo} COMBO`],
        ['보스 / 황금 / 폭탄', `${d.bossKills || 0} / ${d.goldenKills || 0} / ${d.bombKills || 0}`],
        ['플레이 시간', `${mins}분 ${secs}초`],
      ];

      targetEl.innerHTML = items.map(([label, val]) => `
        <div class="mini-stat">
          <div class="mini-stat-label">${label}</div>
          <div class="mini-stat-val mono">${val}</div>
        </div>
      `).join('');
    },

    openModal(name) {
      this.closeModal(true);
      this.activeModal = name;
      window.ZAP.Engine.paused = true;
      document.body.classList.add('modal-open');

      if (name === 'skill-tree') {
        this.el.treeModal.classList.remove('hidden');
        this.switchTab(this.activeTab || 'tree');
      } else if (name === 'stage') {
        this.renderStageList();
        this.el.stageModal.classList.remove('hidden');
      } else if (name === 'settings') {
        this.renderStatsGrid(this.el.statsGrid);
        const canP = window.ZAP.State.canPrestige();
        this.el.btnPrestige.classList.toggle('hidden', !canP);
        if (canP) {
          this.el.btnPrestige.textContent = `초전도 리부트 (+${window.ZAP.State.getNextPrestigeBonus()}× 영구 배율)`;
        }
        this.el.settingsModal.classList.remove('hidden');
      } else if (name === 'victory') {
        this.renderStatsGrid(this.el.victoryStats);
        this.el.victoryModal.classList.remove('hidden');
      }
    },

    toggleModal(name) {
      if (this.activeModal === name) this.closeModal();
      else this.openModal(name);
    },

    closeModal(silent = false) {
      this.el.treeModal.classList.add('hidden');
      this.el.stageModal.classList.add('hidden');
      this.el.settingsModal.classList.add('hidden');
      this.el.victoryModal.classList.add('hidden');
      this.activeModal = null;
      if (!silent) {
        window.ZAP.Engine.paused = false;
        document.body.classList.remove('modal-open');
      }
    },

    showToast(message, kind = '') {
      while (this.el.toastContainer.children.length >= 2) {
        this.el.toastContainer.firstChild.remove();
      }
      const div = document.createElement('div');
      div.className = `toast${kind ? ' ' + kind : ''}`;
      div.textContent = message;
      this.el.toastContainer.appendChild(div);
      setTimeout(() => div.remove(), 2550);
    },

    updateHUD() {
      const state = window.ZAP.State;
      const eng = window.ZAP.Engine;
      const stats = state.getStats();
      const stage = state.getStage();
      const fmt = window.ZAP.formatNum;

      this.el.volt.textContent = fmt(state.data.volts);
      this.el.vps.textContent = `+${fmt(eng.currentVPS)}/s`;

      if (state.data.cores > 0 || state.data.unlockedStage > 0) {
        this.el.corePill.classList.remove('hidden');
        this.el.core.textContent = fmt(state.data.cores);
      }

      const curW = stats.weapon;
      const nextW = state.getNextWeaponTier();
      const canEvolve = state.canAffordNode('weaponTier');
      this.el.weaponIcon.textContent = curW.tag;
      this.el.weaponTierLabel.textContent = `장비 · TIER ${curW.tier + 1}`;
      this.el.weaponName.textContent = curW.name;
      this.el.weaponBtn.classList.toggle('can-evolve', canEvolve);
      if (nextW) {
        const cost = state.getNodeCost('weaponTier').volts;
        this.el.weaponNextBadge.textContent = canEvolve
          ? `진화! → ${nextW.shortName}`
          : `다음 ${nextW.shortName} ⚡${fmt(cost)}`;
      } else {
        this.el.weaponNextBadge.textContent = '최종 진화';
      }

      const remaining = Math.max(0, window.ZAP.CONFIG.TARGET_POPULATION - state.data.totalPopKilled);
      this.el.stageBadge.textContent = `S${stage.id + 1} · ${stage.name}`;
      this.el.scaleBadge.textContent = `×${fmt(stats.popPerKill)}`;
      this.el.remaining.textContent = remaining === 0 ? '0 (멸종 완료!)' : window.ZAP.formatExactPop(remaining);
      if (this.el.liveSwarmBadge) {
        const alive = eng.mosquitoes.length;
        this.el.liveSwarmBadge.textContent = `공중 ${alive}`;
        this.el.liveSwarmBadge.classList.toggle('dense', alive >= 80);
      }

      const kills = state.data.stageKills[stage.id] || 0;
      const bossDone = state.data.stageBossDefeated[stage.id];
      const pct = Math.min(100, (kills / stage.bossQuota) * 100);
      this.el.stageProgressFill.style.width = `${bossDone ? 100 : pct}%`;
      if (bossDone) {
        this.el.stageProgressText.textContent =
          stage.id < window.ZAP.CONFIG.STAGES.length - 1 ? '보스 격파 · 다음 지역 가능' : '최종 작전 중';
      } else if (kills >= stage.bossQuota) {
        this.el.stageProgressText.textContent = '보스 소환 준비 완료!';
      } else {
        this.el.stageProgressText.textContent = `보스 ${kills} / ${stage.bossQuota}`;
      }

      this.el.stageNotifyDot.classList.toggle('hidden', state.data.stageIndex >= state.data.unlockedStage);

      // Swarm Rush slim top-edge ribbon
      if (eng.swarmRushActive) {
        this.el.rushBanner.classList.remove('hidden');
        this.el.rushDesc.textContent = `모기 대습격 · 볼트 ×${stats.swarmRushVoltMult.toFixed(1)}`;
        this.el.rushTimer.textContent = `${Math.max(0, eng.swarmRushTimer).toFixed(1)}s`;
      } else {
        this.el.rushBanner.classList.add('hidden');
      }

      const canSummonBoss = !eng.boss && kills >= stage.bossQuota;
      this.el.bossSummonBtn.classList.toggle('hidden', !canSummonBoss);

      if (eng.boss && !eng.boss.dead) {
        this.el.bossHud.classList.remove('hidden');
        this.el.bossName.textContent = stage.bossName;
        this.el.bossHpText.textContent = `${fmt(Math.max(0, eng.boss.hp))} / ${fmt(eng.boss.maxHp)}`;
        this.el.bossHpFill.style.width = `${Math.max(0, (eng.boss.hp / eng.boss.maxHp) * 100)}%`;
      } else {
        this.el.bossHud.classList.add('hidden');
      }

      if (eng.combo >= 2) {
        this.el.comboContainer.classList.remove('hidden');
        this.el.comboCount.textContent = eng.combo;
        this.el.comboMult.textContent = `×${eng.getComboMultiplier().toFixed(1)}`;
        this.el.comboDecayFill.style.width = `${Math.max(0, (eng.comboTimer / stats.comboDecayTime) * 100)}%`;
      } else {
        this.el.comboContainer.classList.add('hidden');
      }

      const odUnlocked = state.isOverdriveUnlocked();
      if (this.el.feverWidget) this.el.feverWidget.style.opacity = odUnlocked ? '1' : '0.45';
      this.el.feverPercent.textContent = !odUnlocked ? 'S2 해금' : eng.feverActive ? 'MAX' : `${Math.floor(eng.fever)}%`;
      this.el.feverFill.style.width = odUnlocked ? `${eng.fever}%` : '0%';

      const ratio = 1 - Math.min(1, eng.empTimer / Math.max(0.01, stats.empCooldown));
      const dashLen = 87.96;
      this.el.empProgress.style.strokeDashoffset = (dashLen * (1 - ratio)).toFixed(2);
      this.el.empTitle.textContent = curW.pulseName;

      const affordable = state.countAffordableNodes() + state.countAffordableContracts();
      this.el.affordableBadge.textContent = affordable;
      this.el.affordableBadge.classList.toggle('hidden', affordable === 0);
      this.el.skillTreeBtn.classList.toggle('has-upgrades', affordable > 0);

      // Sync always-visible Right Upgrade Dock (signature-gated to prevent scroll/click flicker)
      this.renderDock(false);
    },

    switchDockTab(tab) {
      this.dockTab = tab === 'contracts' ? 'contracts' : 'upgrades';
      document.querySelectorAll('.dock-tab').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.dockTab === this.dockTab);
      });
      this.renderDock(true);
    },

    _calcMaxBuy(nodeId) {
      const state = window.ZAP.State;
      const node = state.nodeMap[nodeId];
      if (!node || !state.isNodeUnlocked(nodeId)) return { count: 0, volts: 0, cores: 0 };
      let lv = state.getSkillLevel(nodeId);
      let remVolts = state.data.volts;
      let remCores = state.data.cores;
      let count = 0;
      let totalVolts = 0;
      let totalCores = 0;

      while (lv < node.maxLevel && count < 25) {
        const c = state.getNodeCostAt(nodeId, lv);
        if (remVolts < c.volts || remCores < c.cores) break;
        remVolts -= c.volts;
        remCores -= c.cores;
        totalVolts += c.volts;
        totalCores += c.cores;
        lv++;
        count++;
      }
      return { count, volts: totalVolts, cores: totalCores };
    },

    renderDock(force = false) {
      if (!this.el.dockList) return;
      const state = window.ZAP.State;
      const cfg = window.ZAP.CONFIG;
      const fmt = window.ZAP.formatNum;
      const stats = state.getStats();
      const curTier = state.getSkillLevel('weaponTier');
      const theme = state.data.settings.theme === 'dark' ? 'dark' : 'light';

      // 1. Live sculpted miniature weapon portrait (re-drawn only when tier or theme changes)
      const weaponKey = `${curTier}|${theme}`;
      if (this.el.dockWeaponCanvas && (force || weaponKey !== this.lastDockWeaponKey)) {
        this.lastDockWeaponKey = weaponKey;
        window.ZAP.Renderer.drawWeaponThumb(this.el.dockWeaponCanvas, curTier);
      }

      // 2. Live Dock Badges & Footer Spec Strip
      let affNonWeapon = 0;
      for (const n of cfg.SKILL_NODES) {
        if (n.id !== 'weaponTier' && state.canAffordNode(n.id)) affNonWeapon++;
      }
      if (this.el.dockUpgBadge) {
        this.el.dockUpgBadge.textContent = affNonWeapon;
        this.el.dockUpgBadge.classList.toggle('hidden', affNonWeapon === 0);
      }

      const affContracts = state.countAffordableContracts();
      if (this.el.dockContractBadge) {
        this.el.dockContractBadge.textContent = affContracts;
        this.el.dockContractBadge.classList.toggle('hidden', affContracts === 0);
      }

      if (this.el.dockSpecStrip) {
        const chainPart = stats.chainJumps > 0 ? ` · 연쇄 ${stats.chainJumps}` : '';
        this.el.dockSpecStrip.textContent =
          `화력 ${fmt(stats.baseDamage)} · ${stats.ticksPerSec.toFixed(1)}/s · 치명 ${Math.round(stats.critChance * 100)}%${chainPart}`;
      }

      // 3. Signature check so DOM only rebuilds when state/affordability actually changes (zero scroll flicker!)
      let sig = `${this.dockTab}|${this.buyMode}|${theme}|${state.data.stageIndex}|${state.data.unlockedStage}|${curTier}|${state.data.cores}|`;
      if (this.dockTab === 'upgrades') {
        for (const n of cfg.SKILL_NODES) {
          if (n.id === 'weaponTier') continue;
          const lv = state.getSkillLevel(n.id);
          const unl = state.isNodeUnlocked(n.id) ? 1 : 0;
          const aff = state.canAffordNode(n.id) ? 1 : 0;
          const mb = (this.buyMode === 'max' && aff) ? this._calcMaxBuy(n.id).count : aff;
          sig += `${lv}${unl}${mb},`;
        }
      } else {
        for (const c of cfg.CONTRACTS) {
          sig += `${state.hasContract(c.id) ? 2 : state.canBuyContract(c.id) ? 1 : 0}`;
        }
      }

      if (!force && sig === this.lastDockRenderKey) return;
      this.lastDockRenderKey = sig;

      const prevScroll = this.el.dockList.scrollTop;
      const frag = document.createDocumentFragment();

      if (this.dockTab === 'contracts') {
        const banner = document.createElement('div');
        banner.className = 'dock-core-banner';
        banner.innerHTML = `<span>보유 변이 CORE</span><span class="mono">CORE ${fmt(state.data.cores)}</span>`;
        frag.appendChild(banner);

        for (const c of cfg.CONTRACTS) {
          const signed = state.hasContract(c.id);
          const canBuy = state.canBuyContract(c.id);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `dock-item dock-contract${signed ? ' maxed' : canBuy ? ' affordable' : ''}`;
          btn.disabled = signed || !canBuy;
          btn.innerHTML = `
            <span class="dock-icon-box mono" style="--branch-col:var(--accent-violet);font-size:11px;">${c.code}</span>
            <div class="dock-item-body">
              <div class="dock-item-title-row">
                <span class="dock-item-name">${c.name}</span>
                <span class="dock-cost-tag mono">${signed ? '체결됨' : `CORE ${c.coreCost}`}</span>
              </div>
              <div class="dock-item-sub">${c.desc}</div>
            </div>
          `;
          if (!signed && canBuy) {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              window.ZAP.Audio.unlock();
              if (state.buyContract(c.id)) {
                window.ZAP.Audio.playStamp();
                window.ZAP.Engine.rebuildStructures();
                this.showToast(`계약 체결! [${c.name}] 영구 발동`, 'gold');
                this.refreshSkillTree();
                this.updateHUD();
                this.renderDock(true);
              }
            });
          }
          frag.appendChild(btn);
        }
      } else {
        const unlockedActive = [];
        const maxedList = [];
        const lockedList = [];

        for (const node of cfg.SKILL_NODES) {
          if (node.id === 'weaponTier') continue;
          const lv = state.getSkillLevel(node.id);
          const unlocked = state.isNodeUnlocked(node.id);
          if (lv >= node.maxLevel) maxedList.push(node);
          else if (unlocked) unlockedActive.push(node);
          else lockedList.push(node);
        }

        // Stable progression order by base cost so cards never jump wildly while rapid-clicking!
        unlockedActive.sort((a, b) => state.getNodeCostAt(a.id, 0).volts - state.getNodeCostAt(b.id, 0).volts);

        const makeNodeRow = (node, mode) => {
          const lv = state.getSkillLevel(node.id);
          const cost = state.getNodeCost(node.id);
          const affordable = mode === 'active' && state.canAffordNode(node.id);
          const branchCol = cfg.BRANCH_COLORS[node.branch] || 'var(--ink)';
          const btn = document.createElement('button');
          btn.type = 'button';

          let cls = 'dock-item';
          if (mode === 'locked') cls += ' locked';
          else if (mode === 'maxed') cls += ' maxed';
          else if (affordable) cls += ' affordable';
          btn.className = cls;
          btn.disabled = mode !== 'active' || !affordable;
          btn.title = `${node.name} — ${node.desc}`;

          let subText = node.effectText(lv);
          let costLabel = 'MAX';

          if (mode === 'locked') {
            subText = state.getNodeLockReason(node.id);
            costLabel = '잠김';
          } else if (mode === 'active') {
            if (this.buyMode === 'max' && affordable) {
              const mb = this._calcMaxBuy(node.id);
              const corePart = mb.cores > 0 ? `+C${mb.cores}` : '';
              costLabel = mb.count > 1 ? `+${mb.count} ⚡${fmt(mb.volts)}${corePart}` : `⚡${fmt(cost.volts)}${corePart}`;
            } else {
              costLabel = cost.cores > 0 ? `⚡${fmt(cost.volts)}+C${cost.cores}` : `⚡${fmt(cost.volts)}`;
            }
          }

          btn.innerHTML = `
            <span class="dock-icon-box mono" style="--branch-col:${branchCol};">${node.icon}</span>
            <div class="dock-item-body">
              <div class="dock-item-title-row">
                <span class="dock-item-name">${node.name}</span>
                <span class="dock-item-lv mono">Lv.${lv}/${node.maxLevel}</span>
              </div>
              <div class="dock-item-bottom-row">
                <span class="dock-item-sub">${subText}</span>
                <span class="dock-cost-tag mono">${costLabel}</span>
              </div>
            </div>
          `;

          if (mode === 'active' && affordable) {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              window.ZAP.Audio.unlock();
              let bought = 0;
              const limit = this.buyMode === 'max' ? 25 : 1;
              while (state.canAffordNode(node.id) && bought < limit) {
                if (!this._purchaseSkill(node.id, bought > 0)) break;
                bought++;
              }
              if (bought > 0) {
                const eng = window.ZAP.Engine;
                eng.spawnText(
                  eng.width * 0.5,
                  Math.max(96, eng.height * 0.24),
                  `${node.name} +${bought}!`,
                  '#ffca00',
                  17,
                  true
                );
              }
            });
          }
          return btn;
        };

        if (unlockedActive.length > 0) {
          const lbl = document.createElement('div');
          lbl.className = 'dock-section-label';
          lbl.textContent = `실시간 강화 (${unlockedActive.length})`;
          frag.appendChild(lbl);
          for (const node of unlockedActive) frag.appendChild(makeNodeRow(node, 'active'));
        }

        if (lockedList.length > 0) {
          const nextLocked = lockedList.slice(0, 4);
          const lbl = document.createElement('div');
          lbl.className = 'dock-section-label';
          lbl.textContent = `다음 해금 예정 (${lockedList.length}개 남음)`;
          frag.appendChild(lbl);
          for (const node of nextLocked) frag.appendChild(makeNodeRow(node, 'locked'));
        }

        if (maxedList.length > 0) {
          const lbl = document.createElement('div');
          lbl.className = 'dock-section-label';
          lbl.textContent = `강화 완료 (${maxedList.length})`;
          frag.appendChild(lbl);
          for (const node of maxedList) frag.appendChild(makeNodeRow(node, 'maxed'));
        }
      }

      this.el.dockList.innerHTML = '';
      this.el.dockList.appendChild(frag);
      this.el.dockList.scrollTop = prevScroll;
    },
  };

  window.ZAP.UI = UI;
})();
