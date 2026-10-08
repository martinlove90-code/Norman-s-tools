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

function sampleJiaobeiThrow(random = Math.random) {
    const plan = Array.from({ length: 2 }, () => ({ flat: random() < 0.55, duration: 1000 + random() * 4000 }));
    // Separate near-ties visually; face draws stay independent of timing.
    if (Math.abs(plan[0].duration - plan[1].duration) < 200) {
        plan[1].duration = plan[0].duration <= 4800 ? plan[0].duration + 200 : plan[0].duration - 200;
    }
    return plan;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { getJiaobeiResult, buildJiaobeiAnimation, sampleJiaobeiThrow };

if (typeof document !== 'undefined') (() => {
    const byId = id => document.getElementById(id);
    const blocks = [byId('blockOne'), byId('blockTwo')];
    const labels = [byId('faceOne'), byId('faceTwo')];
    const throwBtn = byId('throwBtn');
    const resetBtn = byId('resetJiaobeiBtn');
    const result = byId('jiaobeiResult');
    const meaning = byId('resultMeaning');
    const counts = { sheng: 0, xiao: 0, ku: 0 };
    let angles = [0, 0];
    // Sprite openings point upward: rotate left clockwise, right counterclockwise.
    const tilts = [90, -90];
    let animations = [];
    let busy = false;
    let ready = false;
    let generation = 0;

    function setBusy(value) {
        busy = value;
        throwBtn.disabled = resetBtn.disabled = value || !ready;
    }
    function updateCounts() {
        for (const key of Object.keys(counts)) byId(`${key}Count`).textContent = `${counts[key]} 次`;
        byId('throwCount').textContent = counts.sheng + counts.xiao + counts.ku;
    }
    function drawFace(index) {
        blocks[index].style.transform = `rotateZ(${tilts[index]}deg) rotateX(${angles[index]}deg)`;
        labels[index].textContent = `${index === 0 ? '第一' : '第二'}片：${angles[index] === 0 ? '平面' : '凸面'}`;
    }
    function drawFaces() { blocks.forEach((_, index) => drawFace(index)); }
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
            const random = () => window.crypto?.getRandomValues
                ? window.crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000 : Math.random();
            const plan = sampleJiaobeiThrow(random);
            const landed = [false, false];
            const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
            animations = [];
            await Promise.all(blocks.map(async (block, index) => {
                const { flat, duration } = plan[index];
                const finalAngle = flat ? 0 : 180;
                if (!reducedMotion && block.animate) {
                    const animation = block.animate(buildJiaobeiAnimation(duration, angles[index], finalAngle, tilts[index]),
                        { duration, easing: 'linear', fill: 'forwards' });
                    animations[index] = animation;
                    await animation.finished;
                }
                if (generation !== currentGeneration) return;
                angles[index] = finalAngle;
                drawFace(index);
                animations[index]?.cancel();
                animations[index] = null;
                landed[index] = true;
                toolAudio.flip();
                if (!landed.every(Boolean)) result.textContent = `${index === 0 ? '第一' : '第二'}片已落定，等待另一片…`;
            }));
            if (generation !== currentGeneration) return;
            animations = [];
            const outcome = getJiaobeiResult(plan[0].flat, plan[1].flat);
            counts[outcome.key]++;
            result.textContent = `${outcome.name}・${outcome.faces}`;
            meaning.textContent = outcome.meaning;
            updateCounts();
            if (outcome.key === 'sheng') toolAudio.win(); else toolAudio.flip();
        } catch {
            if (generation === currentGeneration) {
                generation++;
                animations.forEach(animation => animation?.cancel());
                animations = [];
                drawFaces();
                result.textContent = '這次擲杯已取消，請再擲一次。';
                meaning.textContent = '';
                setBusy(false);
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
        animations.forEach(animation => animation?.cancel());
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
