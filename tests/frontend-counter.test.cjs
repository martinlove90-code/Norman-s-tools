const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match => !/src=/.test(match[1])).map(match => match[2]).join('\n');

async function loadCounter({ payload, ok = true, failure = false, blocked = false, saved = '7', timeout = false } = {}) {
    const elements = { visitCount: {}, counterLabel: {} };
    let ready, stored, request, timerCallback, timerCleared = false;
    const sandbox = {
        AbortController,
        document: { getElementById: id => elements[id], addEventListener: (type, callback) => { ready = callback; } },
        localStorage: { getItem: () => { if (blocked) throw new Error('blocked'); return saved; }, setItem: (key, value) => { if (blocked) throw new Error('blocked'); stored = value; } },
        setTimeout: callback => { timerCallback = callback; return 1; },
        clearTimeout: () => { timerCleared = true; },
        fetch: async (url, options) => {
            request = { url, options };
            if (timeout) { timerCallback(); assert.ok(options.signal.aborted); }
            if (failure || timeout) throw new Error('Network unavailable');
            return { ok, json: async () => payload };
        }
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(root, 'storage.js'), 'utf8'), sandbox);
    vm.runInContext(inline, sandbox);
    await ready();
    assert.ok(timerCleared);
    return { elements, stored, request };
}

test('public V2 request uses GET without credentials and displays returned net count', async () => {
    const result = await loadCounter({ payload: { data: { up_count: 18, down_count: 2 } } });
    assert.equal(result.request.url, 'https://api.counterapi.dev/v2/normanyangs-team-3848/first-counter-3848/up');
    assert.equal(result.request.options.method, 'GET');
    assert.equal(result.request.options.headers.Authorization, undefined);
    assert.equal(result.elements.visitCount.textContent, '16');
    assert.ok(result.elements.counterLabel.textContent.includes('系統總啟動次數'));
    assert.equal(result.stored, undefined);
    assert.ok(!/ut_[A-Za-z0-9]{30,}/.test(html));
});

test('zero count is valid for V2 and optional proxy response formats', async () => {
    for (const payload of [{ data: { up_count: 0, down_count: 0 } }, { count: 0 }, { data: { value: 0 } }]) {
        const result = await loadCounter({ payload });
        assert.equal(result.elements.visitCount.textContent, '0');
        assert.ok(result.elements.counterLabel.textContent.includes('系統總啟動次數'));
    }
});

test('HTTP, network, timeout and malformed responses fall back to local count', async () => {
    for (const options of [{ ok: false }, { failure: true }, { timeout: true }, { payload: null }, { payload: { data: { up_count: '8' } } }, { payload: { count: -1 } }]) {
        const result = await loadCounter(options);
        assert.equal(result.elements.visitCount.textContent, '8');
        assert.equal(result.stored, '8');
        assert.ok(result.elements.counterLabel.textContent.includes('本機啟動次數'));
    }
});

test('invalid local data resets safely and blocked storage shows current visit', async () => {
    for (const saved of ['corrupt', '-1', '1.5', '9007199254740991']) {
        const result = await loadCounter({ failure: true, saved });
        assert.equal(result.elements.visitCount.textContent, '1');
    }
    const result = await loadCounter({ failure: true, blocked: true });
    assert.equal(result.elements.visitCount.textContent, '1');
    assert.ok(result.elements.counterLabel.textContent.includes('本次啟動'));
});
