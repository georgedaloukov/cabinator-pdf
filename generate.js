const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { buildHTML } = require('./src/html');
const { parseConfig } = require('./src/parser');

async function generate(inputPath, outputPath) {
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const config = parseConfig(raw);
  const html = buildHTML(config);

  const debugPath = outputPath.replace(/\.pdf$/i, '.html');
  fs.writeFileSync(debugPath, html);
  console.log(`  HTML preview: ${debugPath}`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A3',
    landscape: true,
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  });
  await browser.close();
  console.log(`✓ PDF generated: ${outputPath}`);
}

const [,, inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: node generate.js <input.json> <output.pdf>');
  process.exit(1);
}

generate(path.resolve(inputPath), path.resolve(outputPath)).catch(err => {
  console.error(err.message);
  process.exit(1);
});
