function buildCoinFlipAnimation(duration, startAngle, finalAngle) {
    // Fixed 3 revolutions per second, with fixed launch and landing times.
    const degreesPerMillisecond = 1080 / 1000;
    const launchTime = 150;
    const landingTime = 250;
    const spinEndTime = duration - landingTime;
    const spinEndAngle = startAngle + spinEndTime * degreesPerMillisecond;
    const landingAngle = Math.ceil((spinEndAngle - finalAngle) / 360) * 360 + finalAngle;
    return [
        { transform: `translateY(0) rotateX(${startAngle}deg) scale(1)`, offset: 0 },
        { transform: `translateY(-70px) rotateX(${startAngle + launchTime * degreesPerMillisecond}deg) scale(1.08)`, offset: launchTime / duration },
        { transform: `translateY(-70px) rotateX(${spinEndAngle}deg) scale(1.08)`, offset: spinEndTime / duration, easing: 'ease-out' },
        { transform: `translateY(0) rotateX(${landingAngle}deg) scale(1)`, offset: 1 }
    ];
}

if (typeof module !== 'undefined' && module.exports) module.exports = { buildCoinFlipAnimation };

if (typeof document !== 'undefined') (() => {
    const coin = document.getElementById('coin');
    const tossBtn = document.getElementById('tossBtn');
    const resetBtn = document.getElementById('resetCoinBtn');
    const result = document.getElementById('coinResult');
    const durationInput = document.getElementById('flipDuration');
    const durationValue = document.getElementById('flipDurationValue');
    const durationKey = 'coinFlipDurationSeconds';
    const savedDuration = Number(toolStorage.get(durationKey));
    durationInput.value = Number.isFinite(savedDuration) && savedDuration >= 0.5 && savedDuration <= 15
        ? Math.round(savedDuration * 10) / 10 : 1.9;

    function updateDuration() {
        const seconds = Number(durationInput.value).toFixed(1);
        durationValue.textContent = `${seconds} 秒`;
        durationInput.setAttribute('aria-valuetext', `${seconds} 秒`);
    }
    updateDuration();
    durationInput.addEventListener('input', () => {
        updateDuration();
        toolStorage.set(durationKey, durationInput.value);
    });
    let heads = 0;
    let tails = 0;
    let angle = 0;
    let animation = null;
    let busy = false;
    let generation = 0;
    let ready = false;

    function updateCounts() {
        document.getElementById('headsCount').textContent = heads;
        document.getElementById('tailsCount').textContent = tails;
        document.getElementById('totalCount').textContent = heads + tails;
    }

    function setBusy(value) {
        busy = value;
        tossBtn.disabled = value || !ready;
        resetBtn.disabled = value || !ready;
        durationInput.disabled = value;
        coin.setAttribute('aria-busy', String(value));
    }

    tossBtn.addEventListener('click', async () => {
        if (busy) return;
        setBusy(true);
        const thisGeneration = ++generation;
        // An unbiased random bit selects the face; animation never changes it.
        const bit = window.crypto?.getRandomValues
            ? window.crypto.getRandomValues(new Uint8Array(1))[0] & 1
            : Math.floor(Math.random() * 2);
        const isHeads = bit === 0;
        const finalAngle = isHeads ? 0 : 180;
        result.textContent = '硬幣翻轉中…';
        toolAudio.unlock();
        toolAudio.start();
        try {
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && coin.animate) {
                const duration = Number(durationInput.value) * 1000;
                animation = coin.animate(buildCoinFlipAnimation(duration, angle, finalAngle),
                    { duration, easing: 'linear', fill: 'forwards' });
                await animation.finished;
            }
            if (generation !== thisGeneration) return;
            angle = finalAngle;
            coin.style.transform = `rotateX(${angle}deg)`;
            animation?.cancel();
            animation = null;
            if (isHeads) heads++; else tails++;
            updateCounts();
            result.textContent = isHeads ? '正面・人像' : '反面・10 圓';
            toolAudio.win();
        } catch {
            if (generation === thisGeneration) result.textContent = '這次擲幣已取消，請再擲一次。';
        } finally {
            if (generation === thisGeneration) setBusy(false);
        }
    });

    resetBtn.addEventListener('click', () => {
        heads = tails = 0;
        angle = 0;
        coin.style.transform = 'rotateX(0deg)';
        updateCounts();
        result.textContent = '準備好了，擲一次硬幣吧！';
        toolAudio.stop();
    });

    window.addEventListener('pagehide', () => {
        generation++;
        animation?.cancel();
        animation = null;
        result.textContent = '準備好了，擲一次硬幣吧！';
        setBusy(false);
    });

    Promise.all([...coin.querySelectorAll('img')].map(image => image.decode())).then(() => {
        ready = true;
        result.textContent = '準備好了，擲一次硬幣吧！';
        setBusy(false);
    }).catch(() => {
        result.textContent = '硬幣圖片載入失敗，請重新整理頁面。';
    });
})();
