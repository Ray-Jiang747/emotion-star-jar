export function detectInstallEnvironment({ userAgent = '', standalone = false, displayMode = false } = {}) {
  const ios = /iPhone|iPad|iPod/i.test(userAgent);
  return { installed: Boolean(standalone || displayMode), ios };
}

export function createInstallController({ view, environment }) {
  let deferredPrompt = null;

  const capture = (event) => {
    event.preventDefault();
    deferredPrompt = event;
    view.setReady(true);
    view.setStatus('可以安装到手机桌面');
  };

  const prompt = async () => {
    if (!deferredPrompt) {
      view.setStatus('请使用浏览器菜单中的“安装应用”或“添加到主屏幕”');
      return 'unavailable';
    }
    const currentPrompt = deferredPrompt;
    deferredPrompt = null;
    view.setReady(false);
    await currentPrompt.prompt();
    const { outcome } = await currentPrompt.userChoice;
    view.setStatus(outcome === 'accepted' ? '正在完成安装…' : '已取消，可以稍后再安装');
    return outcome;
  };

  const installed = () => {
    view.setReady(false);
    view.setInstalled(true);
    view.setStatus('情绪星星瓶已经安装');
  };

  view.setInstalled(environment.installed);
  view.setIos?.(environment.ios && !environment.installed);
  view.setManual?.(!environment.ios && !environment.installed);
  if (environment.installed) view.setStatus('情绪星星瓶已经安装');

  return { capture, prompt, installed };
}

const bindInstallPage = () => {
  const action = document.querySelector('#install-action');
  if (!action) return;
  const status = document.querySelector('#install-status');
  const iosGuide = document.querySelector('#ios-guide');
  const manualGuide = document.querySelector('#manual-guide');
  const installedPanel = document.querySelector('#installed-panel');
  const view = {
    setReady(value) { action.disabled = !value; action.hidden = false; },
    setStatus(value) { status.textContent = value; },
    setInstalled(value) { installedPanel.hidden = !value; if (value) action.hidden = true; },
    setIos(value) { iosGuide.hidden = !value; if (value) action.hidden = true; },
    setManual(value) { manualGuide.hidden = !value; }
  };
  const environment = detectInstallEnvironment({
    userAgent: navigator.userAgent,
    standalone: navigator.standalone === true,
    displayMode: matchMedia('(display-mode: standalone)').matches
  });
  const controller = createInstallController({ view, environment });
  action.addEventListener('click', () => { controller.prompt(); });
  window.addEventListener('beforeinstallprompt', controller.capture);
  window.addEventListener('appinstalled', controller.installed);
};

if (typeof document !== 'undefined') bindInstallPage();
