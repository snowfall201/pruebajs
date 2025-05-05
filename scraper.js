// scraper.js
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

const URL = 'https://example.com';

async function scrape() {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);
  const text = $('body').text().replace(/\s+/g, ' ').trim();

  writeFileSync('data.json', JSON.stringify({ texto: text, fecha: new Date() }, null, 2));
}

scrape();
