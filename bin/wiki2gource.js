#!/usr/bin/env node
/**
 * Usage: wiki2gource <wiki domain> [path] [editsCompression]
 */

'use strict';

const path = require('path');
const fs = require('fs');

const { CategoriesRanker, ColorsRanker } = require('./lib/rankers');
const { Processor } = require('./lib/Processor');

const domain = process.argv[2];
const wikiPath = process.argv[3] !== undefined ? process.argv[3] : ((domain.match(/\.wikia\.org$/) || domain.match(/\.fandom\.com$/) ? '' : '/w'));
const editsCompression = parseInt(process.argv[4], 10) || 0;

if (!domain) {
	console.error('Usage: wiki2gource <wiki domain> [path] [editsCompression]');
	process.exit(1);
}

const config = {
	categoriesLimit: -1,
	nodeColorFrom: '#4c4b4b',
	nodeColorTo: '#70b8ff',
	editsCompression
};

// Main process
(async () => {
	try {
		console.info(`Getting wiki statistics from ${domain} with path ${wikiPath}...`);
		if (editsCompression) {
			console.info(`Edits compression of ${editsCompression} will be applied`);
		}

		const p = new Processor(domain, wikiPath, config);
		const logFilePath = path.join(p.outputDir, 'log.gource');
		const sortedLogFilePath = logFilePath.replace('.gource', '.sorted.gource');

		// don't do these if sortedLogFilePath already exists
		if (true || !fs.existsSync(sortedLogFilePath)) {
			const results = await p.fetchWikiData();
			const edits = [];
			const categoriesRanker = new CategoriesRanker(results.topCategories);
			const colorsRanker = new ColorsRanker(results.statistics, config.nodeColorFrom, config.nodeColorTo);

			if (results.pages.length < 1) {
				console.error('No articles found.');
				process.exit(3);
			}
			console.info('Fetching revisions for articles...\n', results.pages.length, 'articles found.');

			await Promise.all(results.pages.map(page => p.processPage(page, edits, categoriesRanker, colorsRanker)));

			await p.createLogFile(logFilePath, edits);

			await p.sortLogFile(logFilePath, sortedLogFilePath);
		}

		await p.generateGourceVisualization(sortedLogFilePath, domain);
	} catch (err) {
		console.error(err);
		process.exit(2);
	}
})();
