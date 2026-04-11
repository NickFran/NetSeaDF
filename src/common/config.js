const fs = require('fs');
const path = require('path');
const { resolveToProperDataPath } = require('./pathDep');

const configDir = resolveToProperDataPath(__dirname, 'config');

// Cache: { "basics" => { enableDebug: false, ... }, "IO" => { ... } }
const cache = {};

// Lightweight flat YAML parser (supports key: value pairs and # comments)
function parseYaml(raw) {
    const result = {};
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) continue;
        const key = trimmed.slice(0, colonIndex).trim();
        let val = trimmed.slice(colonIndex + 1).trim();
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val !== '' && !isNaN(val)) val = Number(val);
        result[key] = val;
    }
    return result;
}

// Serializes a flat object back to YAML key: value lines
function toYaml(obj) {
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join('\n') + '\n';
}

function loadFile(name) {
    if (!cache[name]) {
        const raw = fs.readFileSync(path.join(configDir, `${name}.yaml`), 'utf8');
        cache[name] = parseYaml(raw);
    }
    return cache[name];
}

function get(name, key) {
    return loadFile(name)[key];
}

function set(name, key, value) {
    const data = loadFile(name);
    data[key] = value;
    // Write back to disk
    fs.writeFileSync(path.join(configDir, `${name}.yaml`), toYaml(data), 'utf8');
}

module.exports = { get, set };