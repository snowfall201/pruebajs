import puppeteer from 'puppeteer';
import fs from 'fs/promises';  // Usando la versión asíncrona de fs
import * as cheerio from 'cheerio';

(async () => {
  try {
    // Lanza Puppeteer con las opciones necesarias
    const browser = await puppeteer.launch({
      headless: 'new',  // Usar el nuevo modo sin cabeza
      args: ['--no-sandbox', '--disable-setuid-sandbox'],  // Evitar problemas de sandboxing
    });

    const page = await browser.newPage();
    await page.goto('https://portalcientifico.uned.es/grupos/17474/publicaciones', {
      waitUntil: 'networkidle0'
    });

    // Repetir clic en "Ver más" hasta que no esté disponible
    while (true) {
      // Espera hasta que el botón "Ver más" sea visible
      const buttonVisible = await page.$('button.btn.btn-secondary');
      if (!buttonVisible) break;  // Si el botón no está visible, salimos del bucle

      // Haz clic en el botón "Ver más"
      await page.click('button.btn.btn-secondary');
      
      // Esperar a que se actualice el contenido en #publicaciones después del clic
      await page.waitForSelector('#publicaciones', { visible: true });

      // Espera breve para asegurar que los datos se carguen completamente
      await page.waitForTimeout(1000);  // 1 segundo, ajustable según sea necesario
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

    // Guardar el resultado en un archivo JSON
    const data = { publicaciones: publicacionesPorAnio };
    await fs.writeFile('publicaciones.json', JSON.stringify(data, null, 2), 'utf-8');

    console.log('✅ Archivo publicaciones.json generado.');

  } catch (error) {
    console.error('Error durante el proceso de scraping:', error);
  }
})();
