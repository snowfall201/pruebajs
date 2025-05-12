import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

(async () => {
  try {
    const { data: html } = await axios.get('https://sites.google.com/view/giss-uned/localizaci%C3%B3n?authuser=0');
    const $ = cheerio.load(html);

    // Extraer la dirección
    const direccion = $('body').text().match(/Calle Juan del Rosal 16, 28040 Madrid/)[0];

    // Extraer el correo electrónico
    const emailMatch = html.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : null;

    // Extraer el teléfono
    const telefonoMatch = html.match(/tlf\.\s*:\s*([\d\s]+)/i);
    const telefono = telefonoMatch ? telefonoMatch[1].trim() : null;

    // Extraer información de transporte
    const transporte = {
      metro: 'Línea 6 (Ciudad Universitaria)',
      autobuses: ['U (Autobús Universitario)', 'F (Cuatro Caminos)', 'G (Moncloa)', '82 (Moncloa)']
    };

    // Construir el objeto de localización
    const localizacion = {
      direccion,
      email,
      telefono,
      transporte
    };

    // Guardar en un archivo JSON
    await fs.writeFile('localizacion.json', JSON.stringify(localizacion, null, 2), 'utf-8');
    console.log('✅ Archivo localizacion.json generado.');
  } catch (error) {
    console.error('❌ Error durante el scraping:', error);
  }
})();

