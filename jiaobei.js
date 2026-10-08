function getJiaobeiResult(firstFlat, secondFlat) {
    if (firstFlat !== secondFlat) return { key: 'sheng', name: '聖杯', faces: '一平一凸', meaning: '傳統上表示同意、可以。' };
    if (firstFlat) return { key: 'xiao', name: '笑杯', faces: '兩個平面', meaning: '傳統上表示未明確回答，可將問題說得更清楚。' };
    return { key: 'ku', name: '哭杯（陰筊）', faces: '兩個凸面', meaning: '傳統上表示不同意、不宜。' };
}

function buildJiaobeiAnimation(duration, startAngle, finalAngle, tilt) {
    const spinEnd = duration - 250;
    const spinAngle = startAngle + spinEnd * 1.08;
    const landing = Math.ceil((spinAngle - finalAngle) / 360) * 360 + finalAngle;
    return [
        { transform: `translateY(0) rotateZ(${tilt}deg) rotateX(${startAngle}deg)`, offset: 0 },
        { transform: `translateY(-45px) rotateZ(${tilt}deg) rotateX(${startAngle + 162}deg)`, offset: 150 / duration },
        { transform: `translateY(-45px) rotateZ(${tilt}deg) rotateX(${spinAngle}deg)`, offset: spinEnd / duration, easing: 'ease-out' },
        { transform: `translateY(0) rotateZ(${tilt}deg) rotateX(${landing}deg)`, offset: 1 }
    ];
}

if (typeof module !== 'undefined' && module.exports) module.exports = { getJiaobeiResult, buildJiaobeiAnimation };

if (typeof document !== 'undefined') (() => {
    const byId = id => document.getElementById(id);
    const blocks = [byId('blockOne'), byId('blockTwo')];
    const labels = [byId('faceOne'), byId('faceTwo')];
    const throwBtn = byId('throwBtn');
    const resetBtn = byId('resetJiaobeiBtn');
    const durationInput = byId('throwDuration');
    const result = byId('jiaobeiResult');
    const meaning = byId('resultMeaning');
    const counts = { sheng: 0, xiao: 0, ku: 0 };
    let angles = [0, 0];
    const tilts = [-18, 18];
    let animations = [];
    let busy = false;
    let ready = false;
    let generation = 0;
    const durationKey = 'jiaobeiDurationSeconds';
    const savedDuration = Number(toolStorage.get(durationKey));
    durationInput.value = Number.isFinite(savedDuration) && savedDuration >= .5 && savedDuration <= 15 ? Math.round(savedDuration * 10) / 10 : 2;
    function updateDuration() {
        const text = `${Number(durationInput.value).toFixed(1)} 秒`;
        byId('throwDurationValue').textContent = text;
        durationInput.setAttribute('aria-valuetext', text);
    }
    updateDuration();
    durationInput.addEventListener('input', () => { updateDuration(); toolStorage.set(durationKey, durationInput.value); });

    function setBusy(value) {
        busy = value;
        throwBtn.disabled = resetBtn.disabled = value || !ready;
        durationInput.disabled = value;
    }
    function updateCounts() {
        for (const key of Object.keys(counts)) byId(`${key}Count`).textContent = `${counts[key]} 次`;
        byId('throwCount').textContent = counts.sheng + counts.xiao + counts.ku;
    }
    function drawFaces() {
        blocks.forEach((block, index) => {
            block.style.transform = `rotateZ(${tilts[index]}deg) rotateX(${angles[index]}deg)`;
            labels[index].textContent = `${index === 0 ? '第一' : '第二'}片：${angles[index] === 0 ? '平面' : '凸面'}`;
        });
    }
    drawFaces();

    throwBtn.addEventListener('click', async () => {
        if (busy || !ready) return;
        setBusy(true);
        const currentGeneration = ++generation;
        toolAudio.unlock();
        toolAudio.start();
        result.textContent = '筊杯翻轉中…';
        meaning.textContent = '等待兩片筊杯落定。';
        labels.forEach(label => { label.textContent = '翻轉中…'; });
        try {
            // Two independent uniform bits; simulated probabilities are 50/25/25.
            const bits = window.crypto?.getRandomValues ? crypto.getRandomValues(new Uint8Array(1))[0] : Math.floor(Math.random() * 256);
            const flats = [(bits & 1) === 0, (bits & 2) === 0];
            const finalAngles = flats.map(flat => flat ? 0 : 180);
            if (!matchMedia('(prefers-reduced-motion: reduce)').matches && blocks.every(block => block.animate)) {
                const duration = Number(durationInput.value) * 1000;
                animations = blocks.map((block, index) => block.animate(
                    buildJiaobeiAnimation(duration, angles[index], finalAngles[index], tilts[index]),
                    { duration, easing: 'linear', fill: 'forwards' }
                ));
                await Promise.all(animations.map(animation => animation.finished));
            }
            if (generation !== currentGeneration) return;
            angles = finalAngles;
            drawFaces();
            animations.forEach(animation => animation.cancel());
            animations = [];
            const outcome = getJiaobeiResult(...flats);
            counts[outcome.key]++;
            result.textContent = `${outcome.name}・${outcome.faces}`;
            meaning.textContent = outcome.meaning;
            updateCounts();
            if (outcome.key === 'sheng') toolAudio.win(); else toolAudio.flip();
        } catch {
            if (generation === currentGeneration) {
                animations.forEach(animation => animation.cancel());
                animations = [];
                drawFaces();
                result.textContent = '這次擲杯已取消，請再擲一次。';
                meaning.textContent = '';
            }
        } finally {
            if (generation === currentGeneration) setBusy(false);
        }
    });

    resetBtn.addEventListener('click', () => {
        for (const key of Object.keys(counts)) counts[key] = 0;
        angles = [0, 0];
        drawFaces();
        updateCounts();
        toolAudio.stop();
        result.textContent = '準備好了，擲一次杯吧！';
        meaning.textContent = '一平一凸：聖杯｜兩平：笑杯｜兩凸：哭杯';
    });
    window.addEventListener('pagehide', () => {
        generation++;
        animations.forEach(animation => animation.cancel());
        animations = [];
        drawFaces();
        result.textContent = '準備好了，擲一次杯吧！';
        meaning.textContent = '一平一凸：聖杯｜兩平：笑杯｜兩凸：哭杯';
        setBusy(false);
    });
    Promise.all([...document.querySelectorAll('.block-face img')].map(image => image.decode())).then(() => {
        ready = true;
        setBusy(false);
        result.textContent = '準備好了，擲一次杯吧！';
    }).catch(() => { result.textContent = '筊杯圖片載入失敗，請重新整理頁面。'; });
})();
