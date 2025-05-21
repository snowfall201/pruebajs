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

    // Pulsar "Ver más" hasta que no haya más (si existe)
    while (true) {
      const button = await page.$('button.btn.btn-secondary');
      if (!button) break;
      await button.click();
      await page.waitForSelector('#tesis', { visible: true });
      await new Promise((r) => setTimeout(r, 1000));
    }

    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const tesisPorAnio = {};
    const baseUrl = 'https://portalcientifico.uned.es';

    $('.grupo-docs__grupo.agrupador-anualidad').each((_, grupo) => {
      const year = $(grupo).find('h3').text().trim();
      if (!year) return;

      if (!tesisPorAnio[year]) tesisPorAnio[year] = [];

      $(grupo).find('li.grupo-docs__item').each((_, item) => {
        const titulo = $(item).find('a').first().text().trim();
        const link = baseUrl + ($(item).find('a').first().attr('href') || '');

        const infoText = $(item).find('p').text().trim();

        let autor = '';
        let directores = [];

        const lines = infoText.split('\n').map(l => l.trim()).filter(Boolean);

        for (const line of lines) {
          if (!line.toLowerCase().includes('dirigida por')) {
            autor = line;
            break;
          }
        }

        lines.forEach(line => {
          if (line.toLowerCase().includes('dirigida por')) {
            const match = line.match(/Dirigida por (.+)/i);
            if (match && match[1]) {
              const dirsRaw = match[1].split(/ y |, /).map(d => d.trim());
              directores.push(...dirsRaw);
            }
          }
        });

        tesisPorAnio[year].push({
          titulo,
          autor,
          directores,
          link
        });
      });
    });

    await fs.writeFile('tesis.json', JSON.stringify(tesisPorAnio, null, 2), 'utf-8');
    console.log('✅ Archivo tesis.json generado.');
  } catch (error) {
    console.error('Error durante el scraping:', error);
  }
})();
