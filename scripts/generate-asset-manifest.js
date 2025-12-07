/* Generate assets/asset-manifest.json by scanning logos and pictures directories. */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const assetsRoot = path.join(projectRoot, 'assets');

const sources = {
    pictures: path.join(assetsRoot, 'pictures'),
    logos: path.join(assetsRoot, 'logos')
};

const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);

function listFiles(dir) {
    try {
        return fs.readdirSync(dir, { withFileTypes: true })
            .filter(function (entry) { return entry.isFile(); })
            .map(function (entry) { return entry.name; })
            .filter(function (name) { return allowedExt.has(path.extname(name).toLowerCase()); })
            .sort();
    } catch (err) {
        return [];
    }
}

const manifest = {
    pictures: listFiles(sources.pictures),
    logos: listFiles(sources.logos)
};

const manifestPath = path.join(assetsRoot, 'asset-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('asset-manifest.json updated:', manifest);
