const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const visits = require('./api/visits.js');

// Only root-level browser assets are public. Environment files and API source stay private.
const root = __dirname;
const publicFiles = new Set(fs.readdirSync(root).filter(name => /\.(html|css|js|png|webp)$/.test(name)));
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp' };

function createServer() {
    return http.createServer(async (request, response) => {
        let pathname;
        try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
        catch { response.writeHead(400); response.end(); return; }
        if (pathname === '/api/visits') {
            await visits(request, response);
            return;
        }
        const filename = pathname === '/' ? 'index.html' : pathname.slice(1);
        if (!publicFiles.has(filename)) { response.writeHead(404); response.end(); return; }
        if (!['GET', 'HEAD'].includes(request.method)) {
            response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
        }
        try {
            const content = await fs.promises.readFile(path.join(root, filename));
            response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filename)], 'X-Content-Type-Options': 'nosniff' });
            response.end(request.method === 'HEAD' ? undefined : content);
        } catch { response.writeHead(404); response.end(); }
    });
}

if (require.main === module) {
    if (fs.existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));
    const port = Number(process.env.PORT || 3000);
    createServer().listen(port, '127.0.0.1', () => console.log(`Tools available at http://127.0.0.1:${port}`));
}

module.exports = { createServer };
