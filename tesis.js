import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

(async () => {
  try {
    const { data: html } = await axios.get('https://sites.google.com/view/giss-uned/tesis-doctorales?authuser=0');
    const $ = cheerio.load(html);

    const tesisPorAnio = {};

    $('.tyJCtd').each((i, el) => {
      const text = $(el).text().trim();

      // Regex para capturar autor, año y título
      const match = text.match(/^(.+?)\s+\((\d{4})\)[\.:]?\s+[“"](.+?)[”"]?$/);

      if (match) {
        const [, autor, year, titulo] = match;

        if (!tesisPorAnio[year]) {
          tesisPorAnio[year] = [];
        }

        tesisPorAnio[year].push({
          autor: autor.trim(),
          titulo: titulo.trim(),
        });
      }
    });

    // Convertimos a un array como en el ejemplo original
    const resultado = {
      tesis: Object.entries(tesisPorAnio).map(([year, publicaciones]) => ({
        year,
        publicaciones,
      })),
    };

    await fs.writeFile('tesis_doctorales.json', JSON.stringify(resultado, null, 2), 'utf-8');
    console.log('✅ Archivo tesis_doctorales.json generado.');
  } catch (error) {
    console.error('❌ Error durante el scraping:', error);
  }
})();

