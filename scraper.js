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
          if (!data.finalizados.anios[year]) {
            data.finalizados.anios[year] = [];
          }

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

  // Ordenar los años descendente y reconstruir el objeto
  const sortedAnios = Object.fromEntries(
    Object.entries(data.finalizados.anios)
      .sort(([a], [b]) => b - a)
  );

  data.finalizados.anios = sortedAnios;
} catch (error) {
  console.error('Error al procesar los datos:', error);
}
