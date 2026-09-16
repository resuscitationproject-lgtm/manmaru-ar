(() => {
  const scene = document.querySelector('#ar-scene');
  const target = document.querySelector('#target-entity');
  const speechBubble = document.querySelector('#speech-bubble');
  const startButton = document.querySelector('#start-button');
  const statusText = document.querySelector('#status-text');
  const statusDot = document.querySelector('#status-dot');
  const loadingUi = document.querySelector('#loading-ui');
  const scanningUi = document.querySelector('#scanning-ui');
  const errorUi = document.querySelector('#camera-error');

  const params = new URLSearchParams(window.location.search);
  const spot = params.get('spot') || '01';
  const characters = {
    '01': { name: 'まるぽん', speech: 'まるぽんパワー！\nきらきらビーム！', image: 'assets/character-marpon.png' }
  };
  const character = characters[spot] || characters['01'];

  document.querySelector('#marpon-image').setAttribute('src', character.image);
  document.querySelector('#speech-bubble a-text').setAttribute('value', character.speech);

  const setStatus = (message, mode = 'ready') => {
    statusText.textContent = message;
    statusDot.className = `status-dot is-${mode}`;
  };

  const showError = (message) => {
    loadingUi.hidden = true;
    scanningUi.hidden = true;
    errorUi.hidden = false;
    errorUi.textContent = message;
    setStatus('準備に時間がかかっています', 'error');
  };

  target.addEventListener('targetFound', () => {
    scanningUi.hidden = true;
    speechBubble.setAttribute('visible', 'true');
    setStatus(`${character.name}を発見！`, 'ready');
  });

  target.addEventListener('targetLost', () => {
    speechBubble.setAttribute('visible', 'false');
    scanningUi.hidden = false;
    setStatus('ARマークを探しています…', 'ready');
  });

  scene.addEventListener('arReady', () => {
    loadingUi.hidden = true;
    scanningUi.hidden = false;
    setStatus('カメラ起動中。ARマークを探してね', 'ready');
  });

  scene.addEventListener('arError', (event) => {
    const reason = event.detail?.error || '';
    if (String(reason).includes('target')) {
      showError('assets/targets.mind が見つかりません。READMEの手順で認識データを配置してください。');
    } else {
      showError('カメラを起動できませんでした。HTTPS接続とカメラの許可を確認してください。');
    }
  });

  startButton.addEventListener('click', async () => {
    startButton.disabled = true;
    startButton.textContent = 'カメラを準備中…';
    errorUi.hidden = true;
    loadingUi.hidden = false;
    setStatus('カメラの許可を確認しています…', 'ready');
    try {
      await scene.systems['mindar-image-system'].start();
      startButton.textContent = 'ARカメラ起動中';
    } catch (error) {
      showError('カメラを起動できませんでした。ブラウザのカメラ許可を確認してください。');
      startButton.disabled = false;
      startButton.textContent = 'もう一度試す →';
    }
  });
})();
