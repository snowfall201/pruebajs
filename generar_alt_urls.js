import fs from 'fs';

// Leer las alternativas existentes (si el archivo existe)
let prevAltUrls = {};
try {
  const prev = fs.readFileSync('proyectos_alt_urls.js', 'utf-8');
  const match = prev.match(/window\.PROYECTOS_ALT_URLS\s*=\s*({[\s\S]*?});/);
  if (match) {
    prevAltUrls = eval('(' + match[1] + ')');
  }
} catch (e) {
  // No existe el archivo, no pasa nada
}

const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
const altUrls = {};

// Proyectos vigentes
if (data.vigentes && data.vigentes.proyectos) {
  data.vigentes.proyectos.forEach(p => {
    altUrls[p.link] = prevAltUrls[p.link] || "";
  });
}

// Proyectos finalizados
if (data.finalizados && Array.isArray(data.finalizados.anios)) {
  data.finalizados.anios.forEach(({ proyectos }) => {
    proyectos.forEach(p => {
      altUrls[p.link] = prevAltUrls[p.link] || "";
    });
  });
}

// Generar el archivo JS
const lines = [
  "// Este archivo se genera automáticamente ejecutando: node generar_alt_urls.js",
  "// Edita SOLO el valor de cada clave si quieres una URL alternativa para ese proyecto.",
  "// Si añades o cambias proyectos en data.json, vuelve a ejecutar el script para actualizar las claves.",
  "window.PROYECTOS_ALT_URLS = {"
];
for (const [link, url] of Object.entries(altUrls)) {
  lines.push(`  "${link}": "${url}",`);
}
lines.push("};\n");

fs.writeFileSync('proyectos_alt_urls.js', lines.join('\n'), 'utf-8');
console.log('✅ Archivo proyectos_alt_urls.js generado/actualizado (conservando tus alternativas).');
