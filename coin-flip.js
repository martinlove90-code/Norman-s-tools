(() => {
    const coin = document.getElementById('coin');
    const tossBtn = document.getElementById('tossBtn');
    const resetBtn = document.getElementById('resetCoinBtn');
    const result = document.getElementById('coinResult');
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
                const landing = 360 * 6 + finalAngle;
                animation = coin.animate([
                    { transform: `translateY(0) rotateX(${angle}deg)`, offset: 0 },
                    { transform: `translateY(-70px) rotateX(${angle + 900}deg) scale(1.08)`, offset: .35 },
                    { transform: `translateY(-18px) rotateX(${landing - 180}deg)`, offset: .8 },
                    { transform: `translateY(0) rotateX(${landing}deg)`, offset: 1 }
                ], { duration: 1900, easing: 'ease-in-out', fill: 'forwards' });
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
