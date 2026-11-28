// ZAP 100T — Application Entry Point & Playfield-Aware Input Wiring
(function () {
  function boot() {
    const canvas = document.getElementById('game-canvas');
    const State = window.ZAP.State;
    const Engine = window.ZAP.Engine;
    const Renderer = window.ZAP.Renderer;
    const UI = window.ZAP.UI;
    const Audio = window.ZAP.Audio;

    State.init();
    Renderer.init(canvas);
    const initialSize = Renderer.resize();
    Engine.init(initialSize.width, initialSize.height);
    UI.init();

    function syncPlayfieldSize() {
      const sz = Renderer.resize();
      Engine.resize(sz.width, sz.height);
    }
    window.ZAP.syncPlayfieldSize = syncPlayfieldSize;

    Engine.onToast = (msg, kind) => UI.showToast(msg, kind);
    Engine.onVictory = () => {
      Audio.playBossKill();
      UI.openModal('victory');
    };

    // Accurate playfield-local pointer coordinates!
    function toCanvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    canvas.addEventListener('pointermove', (e) => {
      const [x, y] = toCanvasCoords(e);
      Engine.setCursor(x, y);
    });

    canvas.addEventListener('pointerleave', () => {
      // Gently park custom cursor when user moves into right Upgrade Dock!
      Engine.mouse.active = false;
    });

    canvas.addEventListener('pointerdown', (e) => {
      Audio.unlock();
      const [x, y] = toCanvasCoords(e);
      Engine.setCursor(x, y);
      if (e.button === 0 || e.pointerType !== 'mouse') {
        Engine.triggerPulse();
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        Audio.unlock();
        UI.toggleModal('skill-tree');
      } else if (e.code === 'Escape') {
        if (UI.activeModal) UI.closeModal();
      } else if (e.code === 'Space') {
        if (!UI.activeModal) {
          e.preventDefault();
          Engine.triggerPulse();
        }
      } else if (e.code === 'KeyE') {
        if (!UI.activeModal) {
          e.preventDefault();
          Audio.unlock();
          UI.buyQuickUpgrade();
        }
      } else if (e.code === 'KeyB') {
        if (!UI.activeModal) {
          const st = State.getStage();
          const kills = State.data.stageKills[st.id] || 0;
          if (!Engine.boss && kills >= st.bossQuota) {
            e.preventDefault();
            Audio.unlock();
            Engine.summonBoss();
          }
        }
      } else if (!UI.activeModal && e.key >= '1' && e.key <= '6') {
        const idx = Number(e.key) - 1;
        if (idx <= State.data.unlockedStage && idx !== State.data.stageIndex) {
          Engine.switchStage(idx);
          UI.updateHUD();
        }
      }
    });

    window.addEventListener('resize', syncPlayfieldSize);

    // Auto-save every 5 seconds
    setInterval(() => State.save(), 5000);
    window.addEventListener('beforeunload', () => State.save());

    let lastTime = performance.now();
    let hudAcc = 0;

    function frame(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      Engine.update(dt);
      Renderer.render();

      hudAcc += dt;
      if (hudAcc >= 0.08) {
        hudAcc = 0;
        UI.updateHUD();
        if (UI.activeModal === 'skill-tree') {
          UI.refreshSkillTree();
        }
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
