// ZAP 100T — Application Entry Point & Input Wiring
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
    Engine.init(window.innerWidth, window.innerHeight);
    UI.init();

    Engine.onToast = (msg, kind) => UI.showToast(msg, kind);
    Engine.onVictory = () => {
      Audio.playBossKill();
      UI.openModal('victory');
    };

    // Mouse / Touch controls on main Canvas
    canvas.addEventListener('pointermove', (e) => {
      Engine.setCursor(e.clientX, e.clientY);
    });

    canvas.addEventListener('pointerdown', (e) => {
      Audio.unlock();
      Engine.setCursor(e.clientX, e.clientY);
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
      } else if (!UI.activeModal && e.key >= '1' && e.key <= '6') {
        const idx = Number(e.key) - 1;
        if (idx <= State.data.unlockedStage && idx !== State.data.stageIndex) {
          Engine.switchStage(idx);
          UI.updateHUD();
        }
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      Renderer.resize();
      Engine.resize(window.innerWidth, window.innerHeight);
    });

    // Auto-save every 5 seconds
    setInterval(() => State.save(), 5000);
    window.addEventListener('beforeunload', () => State.save());

    // Main RAF Loop (60-120fps physics + throttled 15Hz HUD sync)
    let lastTime = performance.now();
    let hudAcc = 0;

    function frame(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      Engine.update(dt);
      Renderer.render();

      hudAcc += dt;
      if (hudAcc >= 0.065) {
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
