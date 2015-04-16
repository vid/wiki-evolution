#!/usr/bin/env node
/**
 * Example:
 *  wiki2gource 8bit.wikia.com | sort > examples/8bit.gource
 */

'use strict';

var async = require('async'),
	nodemw = require('nodemw'),
	CategoriesRanker = require('../').CategoriesRanker,
	ColorsRanker = require('../').ColorsRanker,
	client;

var server = process.argv[2] || false;

if (!server) {
	console.error('Usage: wiki2gource <wiki domain>');
	process.exit(1);
}

// use a proper path based on MW provider
var path;

if (server.match(/\.wikia\.com$/)) {
	path = ''; // wikia.com
}
else {
	path = '/w'; // Wikipedia default
}

client = new nodemw({
	server: server,
	path: path,
	debug: false
});

// get the wiki-specific data
// @see https://github.com/caolan/async#paralleltasks-callback
console.error('Getting wiki statistics...');

async.parallel(
	{
		// get wiki statistics
		// @see http://nordycka.wikia.com/api.php?action=query&meta=siteinfo&siprop=general%7Cstatistics
		stats: function (callback) {
			client.api.call({
				action: 'query',
				meta: 'siteinfo',
				siprop: [/* 'general', */ 'statistics'].join('|')
			}, callback);
		},

		// get the list of all pages
		pages: function (callback) {
			client.getAllPages(callback);
		},

		// get the list of top categories
		topCategories: function (callback) {
			client.getQueryPage('Mostlinkedcategories', callback);
		}
	},
	function(err, results) {
		var edits = [];

		if (err) {
			process.exit(2);
		}

		// results post-processing
		results.stats = results.stats[0].statistics;

		results.topCategories = results.topCategories.map(function(item) {
			// <page value="11" ns="14" title="Kategoria:Atlantic Airways" />
			return item.title.split(':')[1];
		}).slice(0, 500);

		console.error('This wikis has %d edits on %d articles', results.stats.edits, results.pages.length);
		console.error('\nFetching revisions for all articles...\n');

		// set up rankers
		var categoriesRanker = new CategoriesRanker(results.topCategories),
			colorsRanker = new ColorsRanker(results.stats, '#4c4b4b', '#70b8ff');

		// fetch revisions for all pages
		results.pages.forEach(function(page) {
			client.getArticleRevisions(page.title, function(err, revisions) {
				if (err) {
					process.exit(4);
				}

				// get article categories
				// @see http://nordycka.wikia.com/api.php?action=query&prop=categories&titles=Wyspy%20Owcze
				client.api.call({
					action: 'query',
					prop: 'categories',
					titles: page.title
				}, function(err, data) {
					if (err) {
						process.exit(5);
					}

					var categories = (data.pages[page.pageid].categories || []).map(function(cat) {
							// { ns: 14, title: 'Kategoria:XX wiek' }
							return cat.title.split(':')[1];
						}),
						articlePath,
						color;

					articlePath = '/' + categoriesRanker.getArticlePath(page.title, categories);
					color = colorsRanker.getColorForEdit(revisions.length - 1);

					console.error('%s [%d edits]...', articlePath, revisions.length);

					// generate entries for all revisions
					revisions.forEach(function(rev) {
						var edit = {
							timestamp: Date.parse(rev.timestamp) / 1000,
							author: rev.user,
							type: (rev.parentid === 0) ? 'A' : 'M', // article created / edited
							path: articlePath,
							color: color
						};
						edits.push(edit);

						// print-out the entry
						var out = [];

						Object.keys(edit).forEach(function(key) {
							out.push(edit[key]);
						});

						console.log(out.join('|'));
					});
				});
			});
		});
	}
);
