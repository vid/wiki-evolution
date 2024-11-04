const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const { opts, MAX_ERRORS } = require('../../opts');
const { kfetch } = require('./kfetch');

class Processor {
    errors = 0;

    constructor(domain, wikiPath, config) {
        this.domain = domain;
        this.wikiSource = `${domain}${wikiPath}`;
        this.config = config;
        this.fetchQueue = Promise.resolve();
        this.outputDir = path.join('output', domain.replace(/\./g, '_'));
        fs.mkdirSync(this.outputDir, { recursive: true });
        this.kfetch = kfetch;
    }

    async fetchWikiData() {
        const statsURI = `https://${this.wikiSource}/api.php?action=query&format=json&meta=siteinfo&siprop=statistics&list=allpages&apnamespace=0&aplimit=max`;
        const data = await this.kfetch(statsURI);

        const topCategoriesURI = `https://${this.wikiSource}/api.php?action=query&list=querypage&qppage=Mostlinkedcategories&format=json`;
        const res = await this.kfetch(topCategoriesURI)
        const topCategories = res.query.querypage.results.map(item => item.title.replace(/^Category:/, ''));
        console.log('Top categories:', topCategories);

        // Handle pagination for all pages
        let allPages = data.query.allpages || [];
        let continueToken = data.continue ? data.continue.apcontinue : '';

        while (continueToken) {
            const nextUrl = `https://${this.wikiSource}/api.php?action=query&format=json&list=allpages&apnamespace=0&aplimit=max&apcontinue=${continueToken}`;
            const nextData = await this.kfetch(nextUrl);
            allPages = allPages.concat(nextData.query.allpages || []);
            continueToken = nextData.continue ? nextData.continue.apcontinue : '';
        }

        return {
            statistics: data.query.statistics,
            pages: allPages,
            topCategories
        };
    }

    // Function to process each page
    async processPage(page, edits, categoriesRanker, colorsRanker) {
        let queryURI = `https://${this.wikiSource}/api.php?action=query&format=json&prop=revisions&titles=${encodeURIComponent(page.title)}&rvlimit=max&rvprop=timestamp|user|comment|parentid`
        let categoriesData;
        try {
            const revisionsData = await this.kfetch(queryURI);
            const revisions = revisionsData.query.pages[Object.keys(revisionsData.query.pages)[0]].revisions || [];

            if (revisions.length === 0) {
                console.info(`No revisions found for ${page.title}`);
                return;
            }
            queryURI = `https://${this.wikiSource}/api.php?action=query&format=json&prop=categories&titles=${encodeURIComponent(page.title)}`;
            categoriesData = await this.kfetch(queryURI);
            const categories = categoriesData.query.pages[Object.keys(categoriesData.query.pages)[0]].categories || [];
            const cleanedCategories = categories.map(item => item.title.replace(/^[^:]+:/, '')); // Remove category namespace

            const articlePath = '/' + categoriesRanker.getArticlePath(page.title, cleanedCategories, this.config.categoriesLimit);
            const color = colorsRanker.getColorForEdit(revisions.length - 1);

            console.info(`${articlePath} [${revisions.length} edits]...`);

            if (this.editsCompression) {
                revisions = revisions.filter((item, index) => index % this.editsCompression === 0);
                console.info(`${articlePath} [${revisions.length} edits after compression]...`);
            }

            // Generate log entries
            revisions.forEach(rev => {
                const edit = {
                    timestamp: Date.parse(rev.timestamp) / 1000,
                    author: rev.user,
                    type: rev.parentid === 0 ? 'A' : 'M', // Article created / edited
                    path: articlePath,
                    color: color
                };
                edits.push(edit);
            });
        } catch (error) {
            console.error(`Error processing page ${page.title} from ${queryURI}: ${error.message}`);
            console.error('data:', categoriesData);
            if (this.errors++ > MAX_ERRORS) {
                console.error('failing due to too many errors', this.errors);
                process.exit(1);
            }
        }
    }

    // Function to create log file
    async createLogFile(logFilePath, edits) {
        return new Promise((resolve, reject) => {
            const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
            edits.forEach(edit => {
                logStream.write(`${edit.timestamp}|${edit.author}|${edit.type}|${edit.path}|${edit.color}\n`);
            });
            logStream.end();
            logStream.on('finish', resolve);
            logStream.on('error', reject);
        });
    }

    // Function to sort the log file
    async sortLogFile(logFilePath, sortedLogFilePath) {
        return new Promise((resolve, reject) => {
            const sortProcess = exec(`sort ${logFilePath} -o ${sortedLogFilePath}`, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    // Function to generate Gource visualization
    async generateGourceVisualization(logFilePath) {
        const movie = path.join(this.outputDir, 'movie.webm');

        const cliOpts = opts + ` --title "wiki-evolution for ${this.domain}" `;
        const gourceCommand = `gource ${logFilePath} ${cliOpts} -o - | ffmpeg -y -f image2pipe -vcodec ppm -i - -b:v 5000K -vcodec libvpx ${movie}`;
        console.info('running', gourceCommand);

        return new Promise((resolve, reject) => {
            exec(gourceCommand, (err, stdout, stderr) => {
                if (err) {
                    console.error(`Gource error: ${stderr}`);
                    return reject(err);
                }
                console.info(`Gource visualization generated successfully. ${movie}`);
                resolve();
            });
        });
    }

}

exports.Processor = Processor;