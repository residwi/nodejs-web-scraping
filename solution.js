const superagent = require('superagent');
const cheerio = require('cheerio');
var Promise = require("bluebird");
const fs = require('fs');

// save scraped_data to file
const writeFile = (filename, data) => new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err) => {
        if (err) {
            return reject(err);
        }
        return resolve(data);
    })
})

// get detail from article
const getPage = (url) => new Promise((resolve, reject) => {
    console.log(`Scraping ${url}...`);
    superagent.get(url)
        .then(res => {
            const $ = cheerio.load(res.text);
            const url = $('link[rel=canonical]').attr('href').trim();
            const title = $('.post-title').text().trim();
            const author = $('.author-name').text().trim();
            const postingDate = $('.post-date span').text().trim();
            const relatedArticles = [];

            $('.side-list-panel ul').first().children('li').each((i, elem) => {
                const slug = $(elem).find('a').attr('href').split('/')[2];
                const title = $(elem).find($('.item-title')).text().trim();
                const url = BASE_URL + '/' + slug;

                relatedArticles.push({
                    url,
                    title
                });
            });

            return resolve({
                url,
                title,
                author,
                postingDate,
                relatedArticles
            });
        })
        .catch(err => {
            return reject(err);
        });
})

var BASE_URL = 'https://www.cermati.com/artikel';

superagent.get(BASE_URL)
    .then(res => {
        const $ = cheerio.load(res.text);
        const urls = [];
        $('.article-list-item a').each((i, elem) => {
            const slug = $(elem).attr('href').split('/')[2];
            const index = urls.indexOf(slug);

            if (index < 0) {
                urls.push(BASE_URL + '/' + slug);
            }
        });

        const sites = [];

        for (let i = 0; i < urls.length; i++) {
            sites.push(getPage(urls[i]));
        }

        Promise.all(sites)
            .then((articles) => {
                return JSON.stringify({
                    articles
                });
            })
            .then((text) => writeFile('solution.json', text))
            .then(() => console.log('done'))
            .catch((e) => {
                throw e;
            });
    });