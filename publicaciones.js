import puppeteer from 'puppeteer';
import fs from 'fs';
import * as cheerio from 'cheerio';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://portalcientifico.uned.es/grupos/17474/publicaciones', {
    waitUntil: 'networkidle0'
  });

  // Repetir clic en "Ver más" hasta que no esté disponible
  while (true) {
    try {
      await page.click('button.ver-mas'); // Ajusta el selector según el botón real
      await page.waitForTimeout(1000); // Espera a que se cargue el nuevo contenido
    } catch (err) {
      break; // Sale del bucle si el botón ya no está disponible
    }
  }

  // Extraer el HTML completo renderizado
  const html = await page.content();
  await browser.close();

  // Cargar el HTML con cheerio para extraer los datos
  const $ = cheerio.load(html);
  const publicacionesPorAnio = [];

  $('.grupo-docs__grupo.agrupador-anualidad').each((_, grupo) => {
    const year = $(grupo).find('h3').text().trim();
    const publicaciones = [];

    $(grupo).find('li.grupo-docs__item').each((_, item) => {
      const linkEl = $(item).find('a');
      const titulo = linkEl.text().trim();
      const link = linkEl.attr('href');
      const revista = $(item).find('p').text().trim();

      publicaciones.push({ titulo, link, revista });
    });

    publicacionesPorAnio.push({ year, publicaciones });
  });

  const data = { publicaciones: publicacionesPorAnio };
  fs.writeFileSync('publicaciones.json', JSON.stringify(data, null, 2), 'utf-8');

  console.log('✅ Archivo publicaciones.json generado.');
})();
