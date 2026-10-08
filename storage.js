// Optional persistence; unavailable or invalid storage never disables tools.
window.toolStorage = {
    get(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { window.localStorage.setItem(key, value); return true; } catch { return false; } },
    getJSON(key) { try { return JSON.parse(this.get(key)); } catch { return null; } }
};
