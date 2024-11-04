const { FETCH_DELAY, CACHE_LIFETIME } = require('../../opts');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

async function kfetch(url) {
    const cacheDir = path.join(this.outputDir, 'cache');
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const cacheFile = path.join(cacheDir, hash);

    // Check if cached file exists and is within CACHE_LIFETIME
    if (fs.existsSync(cacheFile)) {
        const stats = fs.statSync(cacheFile);
        const fileAge = Date.now() - stats.mtimeMs;

        if (fileAge < CACHE_LIFETIME) {
            // console.log('  cached', cacheFile, url);
            return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        }
    }

    // Proceed with fetch if no valid cache is found
    // Ensure that fetchQueue is used to limit concurrent fetches
    this.fetchQueue = this.fetchQueue.then(async () => {
        console.log('Fetching', cacheFile, url);
        await new Promise(resolve => setTimeout(resolve, FETCH_DELAY));

        const response = await fetch(url);

        if (!response.ok) {
            console.error('error processing for', cacheFile, uri, response);
            throw new Error(`kfetch failed at ${url} with ${response}`);
        }

        const data = await response.json();

        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        fs.writeFileSync(cacheFile, JSON.stringify(data), 'utf-8');

        return data;
    });

    return this.fetchQueue;
}

exports.kfetch = kfetch;
