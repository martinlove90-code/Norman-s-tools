// Synthesized effects: no downloads, and audio starts only after a user gesture.
function createWheelAudio(initialEnabled) {
    let enabled = initialEnabled;
    let context = null;
    let output = null;
    let lastTick = -Infinity;
    const voices = new Set();

    function silence() {
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
        if (!enabled || !context || context.state !== 'running' || document.hidden) return;
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
