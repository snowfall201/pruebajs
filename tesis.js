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
      waitUntil: 'networkidle0'
    });

    // Click "Load More" button repeatedly until it disappears
    while (true) {
      const loadMoreButton = await page.$('button.btn.btn-secondary');
      if (!loadMoreButton) break;

      await loadMoreButton.click();
      // Wait for content update
      await page.waitForSelector('#tesis', { visible: true });
      // Wait a bit more to ensure content is loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get the full page HTML after all content loaded
    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const thesesByYear = [];

    // Each year block container has classes 'grupo-docs__grupo agrupador-anualidad'
    $('.grupo-docs__grupo.agrupador-anualidad').each((_, yearGroup) => {
      const year = $(yearGroup).find('h3').text().trim();
      const theses = [];

      $(yearGroup).find('li.grupo-docs__item').each((_, thesisItem) => {
        const titleElement = $(thesisItem).find('a');
        const title = titleElement.text().trim();
        const link = titleElement.attr('href');

        // The <p> tags inside contain info like author, director, program, etc.
        // Extract each <p> text and parse key-value if possible
        const info = {};
        $(thesisItem).find('p').each((_, p) => {
          const text = $(p).text().trim();
          // The text is typically in format: "Key: Value"
          const [key, ...rest] = text.split(':');
          if (key && rest.length > 0) {
            info[key.trim().toLowerCase()] = rest.join(':').trim();
          }
        });

        // Build thesis object with expected keys: title, author, director, program, etc.
        theses.push({
          title,
          link,
          author: info['author'] || info['authors'] || null,
          director: info['director'] || null,
          program: info['program'] || null,
          // add any other fields you want to keep here
        });
      });

      thesesByYear.push({ year, theses });
    });

    // Save the JSON file
    await fs.writeFile('theses.json', JSON.stringify({ thesesByYear }, null, 2), 'utf-8');
    console.log('✅ File theses.json has been generated.');

  } catch (error) {
    console.error('Error during scraping:', error);
  }
})();

