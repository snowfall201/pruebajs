try {
  const response = await fetch(URL);
  const html = await response.text();
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
      anios: {}
    }
  };

  // Extraer proyectos vigentes
  $('.grupo-proyectos').each((_, section) => {
    const title = $(section).find('.grupo-proyectos__title span').first().text().trim();

    if (title.includes('vigentes')) {
      $(section).find('.grupo-proyectos__item').each((_, el) => {
        const titulo = $(el).find('.c-proyecto-card__title').text().trim();
        const responsables = [];
        $(el).find('.c-proyecto-card__responsables .item').each((_, span) => {
          responsables.push($(span).text().trim());
        });
        data.vigentes.proyectos.push({ titulo, responsables });
      });
    }

    // Extraer proyectos finalizados por año
    if (title.includes('finalizados')) {
      $(section)
        .find('.grupo-proyectos__proyecto.agrupador-anualidad')
        .each((_, yearBlock) => {
          const year = $(yearBlock).find('.grupo-proyectos__proyecto-titulo').text().trim();
          data.finalizados.anios[year] = [];

          $(yearBlock).find('.grupo-proyectos__item').each((_, el) => {
            const titulo = $(el).find('.c-proyecto-card__title').text().trim();
            const responsables = [];
            $(el).find('.c-proyecto-card__responsables .item').each((_, span) => {
              responsables.push($(span).text().trim());
            });
            data.finalizados.anios[year].push({ titulo, responsables });
          });
        });
    }
  });

  // Ordenar los años numéricamente en orden descendente
  const sortedYears = Object.keys(data.finalizados.anios)
    .map(year => parseInt(year)) // Convertir las claves (años) a números
    .sort((a, b) => b - a) // Ordenar numéricamente de mayor a menor

  // Crear un nuevo objeto 'anios' con los años ordenados
  const sortedAnios = {};
  sortedYears.forEach(year => {
    sortedAnios[year] = data.finalizados.anios[year];
  });

  // Reemplazar los 'anios' con los años ordenados
  data.finalizados.anios = sortedAnios;

  // Guardar los datos en el archivo JSON
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  console.log('Scraping completo. Datos guardados en data.json');
} catch (error) {
  console.error('Error durante el scraping:', error);
}
