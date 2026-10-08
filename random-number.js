function validRange(min, max) {
    return Number.isSafeInteger(min) && Number.isSafeInteger(max) && min >= 1 && min <= max;
}

function generateSequence(min, max, quantity, noRepeat, random = Math.random) {
    if (!validRange(min, max)) throw new RangeError('請輸入有效的正整數範圍，最小值不可大於最大值。');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw new RangeError('產生數量必須是 1～1,000 的整數。');
    const size = max - min + 1;
    if (noRepeat && quantity > size) throw new RangeError(`此範圍只有 ${size} 個數字，不重複時無法產生 ${quantity} 個。`);
    const swaps = new Map();
    return Array.from({ length: quantity }, (_, index) => {
        if (!noRepeat) return min + Math.floor(random() * size);
        // Partial Fisher–Yates using a sparse map: no full-range array or rejection loop.
        const remaining = size - index;
        const chosen = Math.floor(random() * remaining);
        const value = swaps.get(chosen) ?? chosen;
        swaps.set(chosen, swaps.get(remaining - 1) ?? (remaining - 1));
        swaps.delete(remaining - 1);
        return min + value;
    });
}

if (typeof module !== 'undefined' && module.exports) module.exports = { validRange, generateSequence };

if (typeof document !== 'undefined') (() => {
    const byId = id => document.getElementById(id);
    const display = byId('numberDisplay');
    const generateBtn = byId('generateBtn');
    const minInput = byId('minValue');
    const maxInput = byId('maxValue');
    const quantityInput = byId('quantity');
    const noRepeatInput = byId('noRepeat');
    const sortInput = byId('sortAscending');
    const error = byId('errorMessage');
    const generatedAt = byId('generatedAt');
    let results = [];
    let animationTimer = null;
    let view = 'inline';
    let title = '隨機亂數產生器';
    const settingsKey = 'randomNumberBatchSettings';

    function saveSettings() {
        toolStorage.set(settingsKey, JSON.stringify({ min: Number(minInput.value), max: Number(maxInput.value),
            quantity: Number(quantityInput.value), noRepeat: noRepeatInput.checked, sortAscending: sortInput.checked, view, title }));
    }

    function setBusy(busy) {
        generateBtn.disabled = busy;
        for (const input of [minInput, maxInput, quantityInput, noRepeatInput, sortInput]) input.disabled = busy;
        display.setAttribute('aria-busy', String(busy));
    }

    function applyView() {
        display.classList.toggle('list-view', view === 'list' && results.length > 0);
        byId('inlineViewBtn').setAttribute('aria-pressed', String(view === 'inline'));
        byId('listViewBtn').setAttribute('aria-pressed', String(view === 'list'));
    }

    function renderResults() {
        display.replaceChildren();
        display.classList.toggle('is-empty', results.length === 0);
        if (results.length === 0) display.textContent = '尚未產生數字';
        const displayedResults = sortInput.checked ? [...results].sort((a, b) => a - b) : results;
        for (const number of displayedResults) {
            const item = document.createElement('span');
            item.className = 'result-number';
            item.textContent = String(number);
            display.appendChild(item);
        }
        applyView();
    }

    function finishGeneration() {
        animationTimer = null;
        renderResults();
        toolAudio.win();
        const date = new Date();
        generatedAt.dateTime = date.toISOString();
        generatedAt.textContent = date.toLocaleString('zh-TW');
        generatedAt.hidden = false;
        setBusy(false);
    }

    function animateSingle(number) {
        display.replaceChildren();
        display.classList.remove('is-empty', 'list-view');
        const item = document.createElement('span');
        item.className = 'result-number';
        const targets = String(number).split('');
        const digits = targets.map(() => {
            const digit = document.createElement('span');
            digit.className = 'digit';
            digit.textContent = '0';
            item.appendChild(digit);
            return digit;
        });
        display.appendChild(item);
        let index = digits.length - 1;
        let ticks = 0;
        animationTimer = setInterval(() => {
            for (let i = 0; i <= index; i++) digits[i].textContent = Math.floor(Math.random() * 10);
            toolAudio.tick();
            if (++ticks < 3) return;
            digits[index].textContent = targets[index];
            digits[index].classList.add('final');
            ticks = 0;
            if (--index < 0) {
                clearInterval(animationTimer);
                finishGeneration();
            }
        }, 100);
    }

    byId('generatorForm').addEventListener('submit', event => {
        event.preventDefault();
        if (generateBtn.disabled) return;
        try {
            const next = generateSequence(Number(minInput.value), Number(maxInput.value), Number(quantityInput.value), noRepeatInput.checked);
            error.hidden = true;
            toolAudio.unlock();
            results = next;
            saveSettings();
            generatedAt.hidden = true;
            setBusy(true);
            if (results.length === 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) animateSingle(results[0]);
            else finishGeneration();
        } catch (failure) {
            error.textContent = failure.message;
            error.hidden = false;
        }
    });

    sortInput.addEventListener('change', () => { renderResults(); saveSettings(); });
    for (const [id, mode] of [['inlineViewBtn', 'inline'], ['listViewBtn', 'list']]) {
        byId(id).addEventListener('click', () => { view = mode; applyView(); saveSettings(); });
    }
    byId('clearResultsBtn').addEventListener('click', () => {
        if (animationTimer !== null) clearInterval(animationTimer);
        animationTimer = null;
        toolAudio.stop();
        results = [];
        generatedAt.hidden = true;
        generatedAt.textContent = '';
        generatedAt.removeAttribute('datetime');
        error.hidden = true;
        setBusy(false);
        renderResults();
    });
    byId('editTitleBtn').addEventListener('click', () => {
        const editor = byId('titleEditor');
        editor.hidden = !editor.hidden;
        byId('editTitleBtn').setAttribute('aria-expanded', String(!editor.hidden));
        if (!editor.hidden) { byId('titleInput').value = title; byId('titleInput').focus(); }
    });
    byId('titleEditor').addEventListener('submit', event => {
        event.preventDefault();
        title = byId('titleInput').value.trim().slice(0, 80) || '隨機亂數產生器';
        byId('mainTitle').textContent = `🎲 ${title}`;
        document.title = title;
        byId('titleEditor').hidden = true;
        byId('editTitleBtn').setAttribute('aria-expanded', 'false');
        saveSettings();
        byId('editTitleBtn').focus();
    });

    // Restore this tool's preferences; ignore corrupt or incompatible values.
    // Import prior batch preferences once; subsequent writes use this tool's own key.
    const legacy = toolStorage.getJSON('randomNumberSettings');
    const saved = toolStorage.getJSON(settingsKey) ?? (legacy && Number.isInteger(legacy.quantity) ? legacy : null);
    if (saved && validRange(saved.min, saved.max)) {
        minInput.value = saved.min;
        maxInput.value = saved.max;
        noRepeatInput.checked = typeof saved.noRepeat === 'boolean' ? saved.noRepeat : true;
        sortInput.checked = saved.sortAscending === true;
        const quantity = Number.isInteger(saved.quantity) && saved.quantity >= 1 && saved.quantity <= 1000 ? saved.quantity : 5;
        quantityInput.value = noRepeatInput.checked ? Math.min(quantity, saved.max - saved.min + 1) : quantity;
        view = saved.view === 'list' ? 'list' : 'inline';
        if (typeof saved.title === 'string' && saved.title.trim()) title = saved.title.trim().slice(0, 80);
    }
    byId('mainTitle').textContent = `🎲 ${title}`;
    document.title = title;
    applyView();
    saveSettings();
})();
