// CommonJS handler usable by a Node server or a serverless deployment.
function createVisitsHandler({ env = process.env, fetchImpl = fetch } = {}) {
    return async function visits(request, response) {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        const send = (status, body) => {
            response.statusCode = status;
            response.end(JSON.stringify(body));
        };
        const origin = request.headers?.origin;
        const allowedOrigin = env.COUNTER_SITE_ORIGIN;
        if (origin && origin === allowedOrigin) {
            response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
            response.setHeader('Vary', 'Origin');
            response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
        }
        if (request.method === 'OPTIONS') {
            response.statusCode = origin && origin === allowedOrigin ? 204 : 403;
            response.end();
            return;
        }
        if (request.method !== 'POST') {
            response.setHeader('Allow', 'POST');
            send(405, { error: 'Method not allowed' });
            return;
        }
        if (request.headers?.['sec-fetch-site'] === 'cross-site' && (!origin || origin !== allowedOrigin)) {
            send(403, { error: 'Cross-site request rejected' });
            return;
        }
        const key = env.COUNTERAPI_API_KEY;
        const workspace = env.COUNTERAPI_WORKSPACE;
        const counter = env.COUNTERAPI_COUNTER;
        if (!key || !workspace || !counter) {
            send(503, { error: 'Cloud counter is not configured' });
            return;
        }
        try {
            const url = `https://api.counterapi.dev/v2/${encodeURIComponent(workspace)}/${encodeURIComponent(counter)}/up`;
            const upstream = await fetchImpl(url, {
                method: 'GET',
                cache: 'no-store',
                headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
                signal: AbortSignal.timeout(4000),
                redirect: 'error'
            });
            if (!upstream.ok) throw new Error('Upstream request failed');
            const payload = await upstream.json();
            const data = payload?.data ?? payload;
            let count = data?.count ?? data?.value;
            if (count === undefined && Number.isSafeInteger(data?.up_count)
                && Number.isSafeInteger(data?.down_count ?? 0)) {
                count = data.up_count - (data.down_count ?? 0);
            }
            if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid counter response');
            send(200, { count });
        } catch {
            // Never forward upstream payloads, credentials, or request details to browsers.
            send(502, { error: 'Cloud counter is temporarily unavailable' });
        }
    };
}

module.exports = createVisitsHandler();
module.exports.createVisitsHandler = createVisitsHandler;
