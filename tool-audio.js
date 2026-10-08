// Synthesized effects: no downloads, and audio starts only after a user gesture.
function createToolAudio(initialEnabled) {
    let enabled = initialEnabled;
    let context = null;
    let output = null;
    let lastTick = -Infinity;
    let generation = 0;
    const voices = new Set();

    function silence() {
        generation++;
        for (const voice of voices) {
            try { voice.stop(); } catch { /* Already stopped. */ }
        }
        voices.clear();
    }

    function unlock() {
        if (!enabled) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            if (!context) {
                context = new AudioContext();
                output = context.createGain();
                output.gain.value = 0.15;
                output.connect(context.destination);
            }
            if (context.state === 'suspended') context.resume().catch(() => {});
        } catch { /* Audio failure must not interrupt the draw. */ }
    }

    function tone(frequency, delay, duration, type) {
        if (!enabled || !context || document.hidden) return;
        if (context.state === 'suspended') {
            const requestedGeneration = generation;
            try {
                context.resume().then(() => {
                    if (generation === requestedGeneration && context.state === 'running') tone(frequency, delay, duration, type);
                }).catch(() => {});
            } catch { /* A failed resume must not affect the tool. */ }
            return;
        }
        if (context.state !== 'running') return;
        try {
            const start = context.currentTime + delay;
            const oscillator = context.createOscillator();
            const envelope = context.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, start);
            envelope.gain.setValueAtTime(0, start);
            envelope.gain.linearRampToValueAtTime(0.65, start + 0.004);
            envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
            oscillator.connect(envelope);
            envelope.connect(output);
            voices.add(oscillator);
            oscillator.onended = () => {
                voices.delete(oscillator);
                oscillator.disconnect();
                envelope.disconnect();
            };
            oscillator.start(start);
            oscillator.stop(start + duration + 0.01);
        } catch { /* Unsupported audio remains silent. */ }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) silence();
    });
    window.addEventListener('pagehide', silence);

    return {
        unlock,
        stop: silence,
        start() { tone(440, 0.02, 0.12, 'sine'); tone(660, 0.14, 0.15, 'sine'); },
        flip() { tone(700, 0.01, 0.09, 'triangle'); },
        shoot() { tone(1500, 0, 0.045, 'triangle'); },
        hit() { tone(180, 0, 0.12, 'sawtooth'); },
        damage() { tone(100, 0, 0.22, 'triangle'); },
        end() { silence(); tone(330, 0, 0.2, 'sine'); tone(220, 0.2, 0.35, 'sine'); },
        setEnabled(value) {
            enabled = value;
            if (!enabled) silence();
        },
        tick() {
            if (!enabled || !context || context.state !== 'running') return;
            if (context.currentTime - lastTick < 0.04) return;
            lastTick = context.currentTime;
            tone(1100, 0, 0.035, 'triangle');
        },
        win() {
            silence();
            [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
                tone(frequency, index * 0.12, index === 3 ? 0.4 : 0.18, 'sine');
            });
        }
    };
}

// One control per tool; each preference is independent.
(() => {
    const name = location.pathname.split('/').pop();
    const key = name === 'Randomtool01.html' ? 'wheel_sound_enabled' : 'tool_sound_' + name;
    const enabled = toolStorage.get(key) !== 'false';
    window.toolAudio = createToolAudio(enabled);
    const label = document.createElement('label');
    label.className = 'tool-sound-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'soundEnabled';
    checkbox.checked = enabled;
    label.append(checkbox, document.createTextNode('🔊 開啟音效'));
    document.querySelector('.site-header').insertAdjacentElement('afterend', label);
    checkbox.addEventListener('change', () => {
        toolAudio.setEnabled(checkbox.checked);
        toolStorage.set(key, String(checkbox.checked));
        if (checkbox.checked) toolAudio.unlock();
    });
    document.addEventListener('pointerdown', () => toolAudio.unlock(), { capture: true });
    document.addEventListener('keydown', () => toolAudio.unlock(), { capture: true });
})();
