import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

const URL = 'https://portalcientifico.uned.es/grupos/17474/proyectos';

async function scrape() {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const data = {
    vigentes: {
      titulo: 'Proyectos vigentes',
      descripcion: 'Proyectos en los que participa algún/a investigador/a',
      proyectos: []
    },
    finalizados: {
      titulo: 'Proyectos finalizados',
      descripcion: 'Proyectos finalizados en los que ha participado algún/a investigador/a',
      // ahora lo convertiremos en un ARRAY ordenado
      anios: {}
    }
  };

  // — Extraer proyectos vigentes —
  $('.grupo-proyectos').each((_, section) => {
    const title = $(section).find('.grupo-proyectos__title span').first().text().trim();
    console.log(`Título del bloque de proyectos: ${title}`);

    if (title.toLowerCase().includes('vigentes')) {
      $(section).find('.grupo-proyectos__item').each((_, el) => {
        const titulo = $(el).find('.c-proyecto-card__title').text().trim();
        const responsables = $(el)
          .find('.c-proyecto-card__responsables .item')
          .map((_, span) => $(span).text().trim())
          .get();
        
        // Obtener el enlace del proyecto (asumido como un enlace en la tarjeta del proyecto)
        const enlace = $(el).find('a').attr('href') || ''; // Obtener el enlace del atributo href
        
        console.log(`Proyecto encontrado: ${titulo}, Enlace: ${enlace}`);
        data.vigentes.proyectos.push({ titulo, responsables, link: enlace });
      });
    }

    // — Extraer proyectos finalizados por año —
    if (title.toLowerCase().includes('finalizados')) {
      $(section)
        .find('.grupo-proyectos__proyecto.agrupador-anualidad')
        .each((_, yearBlock) => {
          const year = $(yearBlock).find('.grupo-proyectos__proyecto-titulo').text().trim();
          if (!data.finalizados.anios[year]) data.finalizados.anios[year] = [];

          $(yearBlock)
            .find('.grupo-proyectos__item')
            .each((_, el) => {
              const titulo = $(el).find('.c-proyecto-card__title').text().trim();
              const responsables = $(el)
                .find('.c-proyecto-card__responsables .item')
                .map((_, span) => $(span).text().trim())
                .get();

              // Obtener el enlace del proyecto (asumido como un enlace en la tarjeta del proyecto)
              const enlace = $(el).find('a').attr('href') || ''; // Obtener el enlace del atributo href
              
              data.finalizados.anios[year].push({ titulo, responsables, link: enlace });
            });
        });
    }
  });

  // — Convertir a array y ordenar en orden descendente —
  const sortedAniosArray = Object
    .entries(data.finalizados.anios)
    .map(([year, proyectos]) => ({ year: parseInt(year, 10), proyectos }))
    .sort((a, b) => b.year - a.year);

  // Reemplazamos el objeto original por el array ya ordenado
  data.finalizados.anios = sortedAniosArray;

  writeFileSync('data.json', JSON.stringify(data, null, 2));
  console.log('Scraping completo. JSON finalizados.anios ya ordenado de más reciente a más antiguo.');
}

scrape();
