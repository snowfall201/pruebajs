import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://portalcientifico.uned.es/grupos/17474/tesis', {
      waitUntil: 'networkidle0',
    });

    // Click "Load More" until button disappears
    while (true) {
      const loadMoreButton = await page.$('button.btn.btn-secondary');
      if (!loadMoreButton) break;

      await loadMoreButton.click();
      await page.waitForTimeout(1000); // wait for content load
    }

    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const thesesByYear = [];

    $('.grupo-docs__grupo.agrupador-anualidad').each((_, yearGroup) => {
      const year = $(yearGroup).find('h3').text().trim();
      const theses = [];

      $(yearGroup).find('li.grupo-docs__item').each((_, thesisItem) => {
        const titleElement = $(thesisItem).find('a');
        const title = titleElement.text().trim();

        const info = {};
        $(thesisItem).find('p').each((_, p) => {
          const text = $(p).text().trim();
          const [key, ...rest] = text.split(':');
          if (key && rest.length > 0) {
            info[key.trim().toLowerCase()] = rest.join(':').trim();
          }
        });

        theses.push({
          title,
          author: info['author'] || info['authors'] || null,
          director: info['director'] || null,
        });
      });

      thesesByYear.push({ year, theses });
    });

    await fs.writeFile('theses.json', JSON.stringify({ thesesByYear }, null, 2), 'utf-8');
    console.log('✅ File theses.json has been generated.');
  } catch (error) {
    console.error('Error during scraping:', error);
  }
})();
