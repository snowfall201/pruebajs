import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

(async () => {
  try {
    const { data: html } = await axios.get('https://sites.google.com/view/giss-uned/localizaci%C3%B3n?authuser=0');
    const $ = cheerio.load(html);

    const direccion = "C. de Juan del Rosal, 14, Moncloa - Aravaca, 28040 Madrid";
    const emailMatch = html.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : "rheradio@issi.uned.es";

    const telefonoMatch = html.match(/tlf\.\s*:\s*([\d\s]+)/i);
    const telefono = telefonoMatch ? telefonoMatch[1].trim() : "91 398 82 42";

    const transporte = {
      metro: 'Línea 6 (Ciudad Universitaria)',
      autobuses: ['U (Autobús Universitario)', 'F (Cuatro Caminos)', 'G (Moncloa)', '82 (Moncloa)']
    };

    const localizacion = {
      direccion,
      email,
      telefono,
      transporte
    };

    await fs.writeFile('localizacion.json', JSON.stringify(localizacion, null, 2), 'utf-8');
    console.log('✅ Archivo localizacion.json generado.');
  } catch (error) {
    console.error('❌ Error durante el scraping:', error);
  }
})();
