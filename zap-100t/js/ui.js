// ZAP 100T — Perimeter HUD, 3-Tab Blueprint Modal (Skill Tree / Core Contracts / Milestones), Theme Toggle
window.ZAP = window.ZAP || {};

(function () {
  const SOUND_ON_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>';
  const SOUND_OFF_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';

  const UI = {
    selectedNodeId: 'weaponTier',
    activeTab: 'tree', // 'tree' | 'contracts' | 'milestones'
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
    },

    _cacheDom() {
      const $ = (id) => document.getElementById(id);
      this.el = {
        volt: $('volt-display'),
        vps: $('vps-display'),
        corePill: $('core-pill'),
        core: $('core-display'),

        weaponBtn: $('btn-weapon-evolve'),
        weaponIcon: $('weapon-icon'),
        weaponTierLabel: $('weapon-tier-label'),
        weaponName: $('weapon-name-display'),
        weaponNextBadge: $('weapon-next-badge'),

        stageBadge: $('stage-badge'),
        scaleBadge: $('scale-badge'),
        remaining: $('remaining-display'),
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

        feverPercent: $('fever-percent'),
        feverFill: $('fever-fill'),
        empProgress: $('emp-progress'),
        empTitle: $('emp-title'),

        quickUpgradeBtn: $('btn-quick-upgrade'),
        qbName: $('qb-name'),
        qbCost: $('qb-cost'),

        skillTreeBtn: $('btn-skill-tree'),
        affordableBadge: $('affordable-badge'),

        themeBtn: $('btn-theme'),
        soundBtn: $('btn-sound'),
        soundIcon: $('sound-icon'),
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
        shakeToggle: $('shake-toggle'),
        numbersToggle: $('numbers-toggle'),
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
        this.switchTab('contracts');
        this.openModal('skill-tree');
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
        window.ZAP.State.save();
        this.showToast(s.theme === 'dark' ? '다크 잉크 모드' : '화이트 종이 모드');
      });

      this.el.helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleModal('settings');
      });

      this.el.soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.ZAP.Audio.unlock();
        const s = window.ZAP.State.data.settings;
        s.muted = !s.muted;
        window.ZAP.Audio.setMuted(s.muted);
        this.el.soundIcon.innerHTML = s.muted ? SOUND_OFF_SVG : SOUND_ON_SVG;
        window.ZAP.State.save();
      });

      this.el.bossSummonBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.ZAP.Audio.unlock();
        window.ZAP.Engine.summonBoss();
      });

      this.el.quickUpgradeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.ZAP.Audio.unlock();
        this.buyQuickUpgrade();
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
      this.el.volumeSlider.value = Math.round(s.volume * 100);
      this.el.shakeToggle.checked = !!s.shake;
      this.el.numbersToggle.checked = !!s.showNumbers;
      this.el.soundIcon.innerHTML = s.muted ? SOUND_OFF_SVG : SOUND_ON_SVG;
      window.ZAP.Audio.setVolume(s.volume);
      window.ZAP.Audio.setMuted(s.muted);
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
        const reqNames = (sel.requires || []).map((r) => state.nodeMap[r]?.name || r).join(' 또는 ');
        this.el.inspCost.textContent = `선행 필요: ${reqNames}`;
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

      this.el.combatSpecSummary.textContent =
        `기본 화력 ${fmt(stats.baseDamage)} · 초당 타격 ${stats.ticksPerSec.toFixed(1)}회 · 치명타 ${Math.round(stats.critChance * 100)}% (×${stats.critMult.toFixed(1)}) · 연쇄 점프 ${stats.chainJumps}회 · 반경 ${Math.round(stats.zapRadius)}px`;

      this.el.codexGrid.innerHTML = '';
      for (const sp of window.ZAP.CONFIG.CODEX) {
        const count = kills[sp.id] || 0;
        const seen = count > 0 || sp.id === 'normal';

        const card = document.createElement('div');
        card.className = `codex-card${seen ? '' : ' unseen'}`;
        card.innerHTML = `
          <div class="codex-head">
            <span class="codex-code mono">${sp.code}</span>
            <span class="codex-kills mono">${seen ? `처치 ${fmt(count)}마리` : '미발견'}</span>
          </div>
          <h4><i class="codex-dot" style="background:${sp.accent}"></i>${seen ? sp.name : '??? (미확인 개체)'}</h4>
          <p class="codex-desc">${seen ? sp.desc : '작전 중 이 특수 모기를 격추하면 도감 기록이 해금됩니다.'}</p>
          <div class="codex-reward mono">${seen ? sp.reward : sp.tag}</div>
        `;
        this.el.codexGrid.appendChild(card);
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
            </div>
          </div>
          <div class="stage-item-right">
            <div class="stage-mult-tag mono">환산 ×${fmt(stage.popScale)}</div>
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

      this.el.feverPercent.textContent = eng.feverActive ? 'MAX' : `${Math.floor(eng.fever)}%`;
      this.el.feverFill.style.width = `${eng.fever}%`;

      const ratio = 1 - Math.min(1, eng.empTimer / Math.max(0.01, stats.empCooldown));
      const dashLen = 87.96;
      this.el.empProgress.style.strokeDashoffset = (dashLen * (1 - ratio)).toFixed(2);
      this.el.empTitle.textContent = curW.pulseName;

      const affordable = state.countAffordableNodes() + state.countAffordableContracts();
      this.el.affordableBadge.textContent = affordable;
      this.el.affordableBadge.classList.toggle('hidden', affordable === 0);
      this.el.skillTreeBtn.classList.toggle('has-upgrades', affordable > 0);

      // 1-Click Quick-Upgrade Chip (press E or click mid-combat!)
      const quick = state.getBestQuickUpgrade();
      if (quick) {
        this.el.quickUpgradeBtn.classList.remove('hidden');
        this.el.qbName.textContent = quick.node.name;
        this.el.qbCost.textContent = `⚡${fmt(quick.cost)}`;
      } else {
        this.el.quickUpgradeBtn.classList.add('hidden');
      }
    },
  };

  window.ZAP.UI = UI;
})();
