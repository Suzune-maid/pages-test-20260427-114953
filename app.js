const supportStatus = document.getElementById('supportStatus');
const lockStatus = document.getElementById('lockStatus');
const pageStatus = document.getElementById('pageStatus');
const message = document.getElementById('message');
const acquireBtn = document.getElementById('acquireBtn');
const releaseBtn = document.getElementById('releaseBtn');

let wakeLock = null;

function setPill(element, text, type) {
  element.textContent = text;
  element.className = `pill ${type}`;
}

function setMessage(text) {
  message.textContent = text;
}

function refreshPageVisibility() {
  const visible = document.visibilityState === 'visible';
  setPill(pageStatus, visible ? '可見中' : '背景 / 隱藏', visible ? 'info' : 'warn');
}

function syncButtons() {
  const active = !!wakeLock;
  acquireBtn.disabled = active || !('wakeLock' in navigator);
  releaseBtn.disabled = !active;
}

async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) {
    setPill(supportStatus, '不支援', 'error');
    setMessage('這個瀏覽器沒有提供 Screen Wake Lock API。');
    syncButtons();
    return;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');
    setPill(lockStatus, '已啟用', 'success');
    setMessage('Wake Lock 已啟用。只要頁面保持前景，手機應該不會因閒置而自動熄屏。');
    syncButtons();

    wakeLock.addEventListener('release', () => {
      wakeLock = null;
      setPill(lockStatus, '已釋放', 'warn');
      setMessage('Wake Lock 已被釋放，可能是頁面切到背景、系統省電或瀏覽器策略造成。');
      syncButtons();
    });
  } catch (error) {
    setPill(lockStatus, '請求失敗', 'error');
    setMessage(`請求 Wake Lock 失敗：${error.name}${error.message ? ` - ${error.message}` : ''}`);
    syncButtons();
  }
}

async function releaseWakeLock() {
  if (!wakeLock) {
    return;
  }

  try {
    await wakeLock.release();
  } catch (error) {
    setMessage(`解除 Wake Lock 時發生錯誤：${error.name}${error.message ? ` - ${error.message}` : ''}`);
  }
}

async function handleVisibilityChange() {
  refreshPageVisibility();

  if (document.visibilityState === 'visible' && !wakeLock && 'wakeLock' in navigator) {
    setMessage('頁面回到前景。若剛才已被釋放，請再按一次「啟用防鎖定測試」。');
  }
}

function init() {
  const supported = 'wakeLock' in navigator;
  setPill(supportStatus, supported ? '支援' : '不支援', supported ? 'success' : 'error');
  setPill(lockStatus, '尚未請求', 'pending');
  refreshPageVisibility();
  syncButtons();

  if (supported) {
    setMessage('此瀏覽器支援 Wake Lock。請按「啟用防鎖定測試」開始。');
  } else {
    setMessage('此瀏覽器不支援 Wake Lock，無法用這個 API 防止自動鎖定。');
  }

  acquireBtn.addEventListener('click', acquireWakeLock);
  releaseBtn.addEventListener('click', releaseWakeLock);
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

init();
