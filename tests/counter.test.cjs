const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createVisitsHandler } = require('../api/visits.js');
const { createServer } = require('../server.cjs');

function response() {
    return { headers: {}, setHeader(key, value) { this.headers[key] = value; },
        end(body) { this.body = body ? JSON.parse(body) : null; } };
}
const configuration = { COUNTERAPI_API_KEY: 'test-secret', COUNTERAPI_WORKSPACE: 'workspace', COUNTERAPI_COUNTER: 'counter', COUNTER_SITE_ORIGIN: 'https://example.github.io' };

test('authenticated upstream increment returns only the public count, including zero', async () => {
    for (const payload of [{ data: { up_count: 12, down_count: 2 } }, { count: 0 }, { data: { value: 8 } }]) {
        const result = response();
        await createVisitsHandler({ env: configuration, fetchImpl: async (url, options) => {
            assert.equal(url, 'https://api.counterapi.dev/v2/workspace/counter/up');
            assert.equal(options.headers.Authorization, 'Bearer test-secret');
            assert.equal(options.redirect, 'error');
            return { ok: true, json: async () => payload };
        } })({ method: 'POST', headers: {} }, result);
        assert.equal(result.statusCode, 200);
        assert.deepEqual(Object.keys(result.body), ['count']);
        assert.equal(result.body.count, payload.count ?? payload.data.value ?? 10);
        assert.equal(result.headers['Cache-Control'], 'no-store');
    }
});

test('unconfigured, rejected, malformed and failed requests never expose credentials', async () => {
    for (const [env, request, upstream, expected] of [
        [{}, { method: 'POST' }, null, 503],
        [configuration, { method: 'GET' }, null, 405],
        [configuration, { method: 'POST', headers: { 'sec-fetch-site': 'cross-site', origin: 'https://untrusted.example' } }, null, 403],
        [configuration, { method: 'POST' }, { ok: false }, 502],
        [configuration, { method: 'POST' }, { ok: true, json: async () => ({ data: { count: -1, token: 'test-secret' } }) }, 502],
        [configuration, { method: 'POST' }, { ok: true, json: async () => ({ data: { count: '5' } }) }, 502],
        [configuration, { method: 'POST' }, 'throw', 502]
    ]) {
        const result = response();
        await createVisitsHandler({ env, fetchImpl: async () => {
            if (upstream === 'throw') throw new Error('test-secret');
            assert.ok(upstream, 'invalid requests must not reach the upstream');
            return upstream;
        } })(request, result);
        assert.equal(result.statusCode, expected);
        assert.ok(!JSON.stringify(result).includes('test-secret'));
    }
});

test('GitHub Pages origin can call the proxy; other origins receive no CORS permission', async () => {
    const handler = createVisitsHandler({ env: configuration, fetchImpl: async () => ({ ok: true, json: async () => ({ count: 1 }) }) });
    for (const method of ['OPTIONS', 'POST']) {
        const result = response();
        await handler({ method, headers: { origin: configuration.COUNTER_SITE_ORIGIN, 'sec-fetch-site': 'cross-site' } }, result);
        assert.equal(result.statusCode, method === 'OPTIONS' ? 204 : 200);
        assert.equal(result.headers['Access-Control-Allow-Origin'], configuration.COUNTER_SITE_ORIGIN);
    }
    const result = response();
    await handler({ method: 'OPTIONS', headers: { origin: 'https://untrusted.example' } }, result);
    assert.equal(result.statusCode, 403);
    assert.equal(result.headers['Access-Control-Allow-Origin'], undefined);
});

test('local server serves browser assets and refuses environment, repository and API source files', async () => {
    const server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        for (const asset of ['/', '/index.html', '/theme.css', '/storage.js']) assert.equal((await fetch(base + asset)).status, 200);
        for (const privateFile of ['/.env', '/.env.example', '/.git/config', '/server.cjs', '/api/visits.js', '/%2eenv']) assert.equal((await fetch(base + privateFile)).status, 404);
        assert.equal((await fetch(base + '/api/visits')).status, 405);
    } finally { await new Promise(resolve => server.close(resolve)); }
});
