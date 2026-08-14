(() => {
  const scene = document.querySelector('.bottle-scene');
  const count = document.querySelector('#count');
  const bottlePanel = document.querySelector('.bottle-panel');

  const selectFirstPendingStar = () => {
    const firstStar = document.querySelector('#stars .star');
    if (firstStar) firstStar.click();
  };

  scene.setAttribute('role', 'button');
  scene.setAttribute('tabindex', '0');
  scene.setAttribute('aria-label', '从瓶中选择一颗待解决的情绪星星');
  scene.addEventListener('click', (event) => {
    if (!event.target.closest('.star')) selectFirstPendingStar();
  });
  scene.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectFirstPendingStar();
    }
  });

  const syncEmptyState = () => {
    bottlePanel.classList.toggle('is-empty', Number(count.textContent) === 0);
  };
  new MutationObserver(syncEmptyState).observe(count, { childList: true, characterData: true, subtree: true });
  syncEmptyState();

  let installPrompt;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    if (document.querySelector('.install-chip')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'install-chip';
    button.textContent = '安装轻应用';
    button.addEventListener('click', async () => {
      await installPrompt.prompt();
      installPrompt = null;
      button.remove();
    });
    document.querySelector('.header').append(button);
  });
})();
