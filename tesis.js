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

    // No hay botón "Ver más" en esta página, así que no es necesario iterar

    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);

    const tesisPorAnio = [];

    // Las tesis están organizadas en bloques por año con clase "grupo-docs__grupo agrupador-anualidad"
    $('.grupo-docs__grupo.agrupador-anualidad').each((_, grupo) => {
      const year = $(grupo).find('h3').text().trim();

      const trabajos = [];

      // Cada tesis está dentro de un li con clase "grupo-docs__item"
      $(grupo).find('li.grupo-docs__item').each((_, item) => {
        const titulo = $(item).find('a').first().text().trim();

        // La información de autor y director está en un párrafo <p>
        const textoInfo = $(item).find('p').text().trim().split('\n').map(s => s.trim()).filter(Boolean);

        let autor = '';
        let director = [];

        if (textoInfo.length >= 2) {
          autor = textoInfo[0];
          // Extraer directores quitando "Dirigida por " y separando por " y "
          const dirStr = textoInfo[1].replace(/^Dirigida por\s*/i, '');
          director = dirStr.split(/\s+y\s+/).map(s => s.trim());
        } else if (textoInfo.length === 1) {
          autor = textoInfo[0];
        }

        trabajos.push({
          titulo,
          autor,
          director
        });
      });

      tesisPorAnio.push({
        anio: year,
        trabajos
      });
    });

    const data = { tesis: tesisPorAnio };
    await fs.writeFile('tesis.json', JSON.stringify(data, null, 2), 'utf-8');

    console.log('✅ Archivo tesis.json generado correctamente.');
  } catch (error) {
    console.error('Error durante el scraping:', error);
  }
})();
