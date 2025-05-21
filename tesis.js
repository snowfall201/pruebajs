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

    // En esta página no hay botón "Ver más" para tesis, así que no iteramos

    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);

    const tesisPorAnio = [];

    // El contenido está organizado en secciones por año con la clase "grupo-docs__grupo agrupador-anualidad"
    $('.grupo-docs__grupo.agrupador-anualidad').each((_, grupo) => {
      const year = $(grupo).find('h3').text().trim();

      const trabajos = [];

      // Cada tesis está dentro de un li con clase "grupo-docs__item"
      $(grupo).find('li.grupo-docs__item').each((_, item) => {
        // El título está en el enlace <a>
        const titulo = $(item).find('a').first().text().trim();

        // El texto debajo contiene autor y director, separados por saltos de línea
        const textoInfo = $(item).find('p').text().trim().split('\n').map(s => s.trim()).filter(Boolean);

        // El formato típico es:
        // Línea 1: Autor (todo mayúsculas o normal)
        // Línea 2: "Dirigida por ..." con uno o varios directores separados por "y"

        let autor = '';
        let director = [];

        if (textoInfo.length >= 2) {
          autor = textoInfo[0];
          const dirStr = textoInfo[1].replace(/^Dirigida por\s*/i, '');
          director = dirStr.split(/\sy\s/).map(s => s.trim());
        } else {
          // Por si faltase algún campo
          autor = textoInfo[0] || '';
          director = [];
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

    // Guardamos el JSON
    const data = { tesis: tesisPorAnio };
    await fs.writeFile('tesis.json', JSON.stringify(data, null, 2), 'utf-8');

    console.log('✅ Archivo tesis.json generado correctamente.');

  } catch (error) {
    console.error('Error durante el scraping:', error);
  }
})();
