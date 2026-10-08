const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup({ suspended = false, unsupported = false, rejectResume = false } = {}) {
    const notes = [];
    const contexts = [];
    const pending = [];
    const handlers = {};
    class AudioContext {
        constructor() { this.state = suspended ? 'suspended' : 'running'; this.currentTime = 1; contexts.push(this); }
        createGain() {
            return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
        }
        createOscillator() {
            const note = { stops: 0, frequency: { setValueAtTime(value) { note.value = value; } }, connect() {}, disconnect() {},
                start() { notes.push(note); }, stop() { note.stops++; } };
            return note;
        }
        resume() {
            if (rejectResume) return Promise.reject(new Error('Audio blocked'));
            return new Promise(resolve => pending.push(() => { this.state = 'running'; resolve(); }));
        }
    }
    const document = { hidden: false, addEventListener(name, fn) { handlers[name] = fn; } };
    const sandbox = { window: { AudioContext: unsupported ? undefined : AudioContext, addEventListener(name, fn) { handlers[name] = fn; } }, document };
    vm.createContext(sandbox);
    const source = fs.readFileSync(path.join(__dirname, '..', 'tool-audio.js'), 'utf8').split('// One control per tool;')[0];
    vm.runInContext(source, sandbox);
    return { audio: sandbox.createToolAudio(true), notes, contexts, document, handlers, resume: async () => { pending.splice(0).forEach(fn => fn()); await Promise.resolve(); } };
}

test('audio is lazy, tick frequency is bounded, and mute stops scheduled melody', () => {
    const s = setup();
    s.audio.win();
    assert.equal(s.contexts.length, 0);
    s.audio.unlock(); s.audio.tick(); s.audio.tick();
    assert.equal(s.notes.length, 1);
    s.audio.win();
    assert.equal(s.notes.length, 5);
    const before = s.notes.map(note => note.stops);
    s.audio.setEnabled(false);
    s.notes.slice(1).forEach((note, index) => assert.equal(note.stops, before[index + 1] + 1));
    s.audio.win(); s.audio.shoot(); s.audio.flip();
    assert.equal(s.notes.length, 5);
});

test('first immediate result waits for audio resume, while mute cancels pending notes', async () => {
    const s = setup({ suspended: true });
    s.audio.unlock(); s.audio.win();
    assert.equal(s.notes.length, 0);
    await s.resume();
    assert.equal(s.notes.length, 4);
    const canceled = setup({ suspended: true });
    canceled.audio.unlock(); canceled.audio.win(); canceled.audio.setEnabled(false);
    await canceled.resume();
    assert.equal(canceled.notes.length, 0);
});

test('background and page exit stop active voices, and hidden pages stay silent', () => {
    const s = setup(); s.audio.unlock(); s.audio.shoot();
    s.document.hidden = true; s.handlers.visibilitychange();
    assert.equal(s.notes[0].stops, 2);
    s.audio.win(); assert.equal(s.notes.length, 1);
    s.document.hidden = false; s.audio.flip(); s.handlers.pagehide();
    assert.equal(s.notes[1].stops, 2);
});

test('unavailable or rejected audio never throws into tool actions', async () => {
    const s = setup({ unsupported: true });
    assert.doesNotThrow(() => { s.audio.unlock(); s.audio.win(); s.audio.tick(); });
    const blocked = setup({ suspended: true, rejectResume: true });
    blocked.audio.unlock(); blocked.audio.win();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(blocked.notes.length, 0);
});
