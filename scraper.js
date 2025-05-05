// scraper.js
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

const URL = 'https://portalcientifico.uned.es/grupos/17474/proyectos';

async function scrape() {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const resultados = [];

  $('.c-proyecto-card').each((_, el) => {
    const titulo = $(el).find('.c-proyecto-card__title').text().trim();
    const responsables = [];

    $(el).find('.c-proyecto-card__responsables .item').each((_, span) => {
      responsables.push($(span).text().trim());
    });

    resultados.push({ titulo, responsables });
  });

  writeFileSync('data.json', JSON.stringify(resultados, null, 2));
  console.log('Scraping terminado');
}

scrape();
