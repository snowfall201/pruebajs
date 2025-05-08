import fetch from 'node-fetch';
import cheerio from 'cheerio';
import fs from 'fs';

const URL = 'https://portalcientifico.uned.es/grupos/17474/publicaciones';

const res = await fetch(URL);
const html = await res.text();
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
fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf-8');

console.log('✅ Archivo data.json generado.');
