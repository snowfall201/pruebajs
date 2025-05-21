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

    // Obtener contenido ya cargado
    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const tesisPorAnio = {};

    // Cada grupo de tesis está agrupado por año
    $('.grupo-docs__grupo.agrupador-anualidad').each((_, grupo) => {
      const year = $(grupo).find('h3').text().trim();
      if (!year) return; // Ignorar si no hay año

      // Inicializar array para este año
      if (!tesisPorAnio[year]) tesisPorAnio[year] = [];

      // Cada tesis está en li.grupo-docs__item
      $(grupo)
        .find('li.grupo-docs__item')
        .each((_, item) => {
          const titulo = $(item).find('a').first().text().trim();

          // El texto debajo incluye autor y directores, pero no tiene estructura clara,
          // así que haremos un split básico y regex para extraer datos.
          const infoText = $(item).find('p').text().trim();

          // Intentamos extraer autor y directores del texto. 
          // Basado en tu texto: Autor está en la primera línea, Directores en "Dirigida por ..."
          let autor = '';
          let directores = [];

          // Dividir infoText en líneas para procesar
          const lines = infoText.split('\n').map((l) => l.trim()).filter(Boolean);

          // Autor: primera línea que no contenga "Dirigida"
          for (const line of lines) {
            if (!line.toLowerCase().includes('dirigida por')) {
              autor = line;
              break;
            }
          }

          // Buscar directores: líneas que contienen "Dirigida por"
          lines.forEach((line) => {
            if (line.toLowerCase().includes('dirigida por')) {
              // Extraer nombres después de "Dirigida por"
              const match = line.match(/Dirigida por (.+)/i);
              if (match && match[1]) {
                // Separar por " y " o ", "
                const dirsRaw = match[1].split(/ y |, /).map((d) => d.trim());
                directores.push(...dirsRaw);
              }
            }
          });

          tesisPorAnio[year].push({
            titulo,
            autor,
            directores,
          });
        });
    });

    // Guardar en JSON
    await fs.writeFile('tesis.json', JSON.stringify(tesisPorAnio, null, 2), 'utf-8');
    console.log('✅ Archivo tesis.json generado.');
  } catch (error) {
    console.error('Error durante el scraping:', error);
  }
})();

