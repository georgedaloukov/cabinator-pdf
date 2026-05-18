const express = require('express');
const multer  = require('multer');
const puppeteer = require('puppeteer');
const path = require('path');
const { buildHTML } = require('./src/html');
const { parseConfig } = require('./src/parser');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const PORT = process.env.PORT || 3000;

// ── UI ────────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cabinator PDF</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F5F4F0;
      color: #1B1917;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
    }

    h1 {
      font-size: 22px;
      font-weight: 600;
      letter-spacing: -0.3px;
    }

    p.sub {
      font-size: 14px;
      color: #6A6863;
    }

    #drop-zone {
      width: 100%;
      max-width: 480px;
      border: 2px dashed #D5D1C9;
      border-radius: 12px;
      padding: 48px 32px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      background: #fff;
    }

    #drop-zone.hover {
      border-color: #E07B39;
      background: #FFF8F3;
    }

    #drop-zone .icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    #drop-zone p {
      font-size: 15px;
      color: #6A6863;
    }

    #drop-zone strong {
      color: #E07B39;
    }

    #file-input { display: none; }

    #status {
      font-size: 14px;
      color: #6A6863;
      min-height: 20px;
    }

    #status.error { color: #c0392b; }
    #status.success { color: #27ae60; }

    button#generate-btn {
      display: none;
      background: #E07B39;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 12px 28px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }

    button#generate-btn:hover { background: #c96928; }
    button#generate-btn:disabled { background: #D5D1C9; cursor: not-allowed; }
  </style>
</head>
<body>
  <h1>Cabinator PDF Generator</h1>
  <p class="sub">Upload a cabinet configuration JSON to generate a technical drawing PDF.</p>

  <div id="drop-zone">
    <div class="icon">📄</div>
    <p>Drop your <strong>.json</strong> file here<br>or <strong>click to browse</strong></p>
    <input type="file" id="file-input" accept=".json,application/json">
  </div>

  <div id="status"></div>
  <button id="generate-btn">Generate PDF</button>

  <script>
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const status = document.getElementById('status');
    const btn = document.getElementById('generate-btn');
    let selectedFile = null;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('hover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('hover'));

    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('hover');
      const f = e.dataTransfer.files[0];
      if (f) setFile(f);
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) setFile(fileInput.files[0]);
    });

    function setFile(f) {
      if (!f.name.endsWith('.json')) {
        setStatus('Please upload a .json file.', 'error');
        return;
      }
      selectedFile = f;
      setStatus('Ready: ' + f.name, '');
      btn.style.display = 'inline-block';
    }

    function setStatus(msg, cls) {
      status.textContent = msg;
      status.className = cls || '';
    }

    btn.addEventListener('click', async () => {
      if (!selectedFile) return;
      btn.disabled = true;
      btn.textContent = 'Generating…';
      setStatus('Rendering PDF, please wait…', '');

      try {
        const form = new FormData();
        form.append('config', selectedFile, selectedFile.name);

        const res = await fetch('/generate', { method: 'POST', body: form });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || 'Generation failed');
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFile.name.replace(/\\.json$/i, '') + '.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        setStatus('PDF downloaded!', 'success');
      } catch (err) {
        setStatus('Error: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Generate PDF';
      }
    });
  </script>
</body>
</html>`);
});

// ── Generate endpoint ─────────────────────────────────────────────────────────
let browser; // reuse browser across requests

async function getBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }
  return browser;
}

app.post('/generate', upload.single('config'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Send a JSON file as "config".' });
  }

  let raw;
  try {
    raw = JSON.parse(req.file.buffer.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON file.' });
  }

  let config;
  try {
    config = parseConfig(raw);
  } catch (err) {
    return res.status(422).json({ error: 'Could not parse configuration: ' + err.message });
  }

  try {
    const html = buildHTML(config);
    const b = await getBrowser();
    const page = await b.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A3',
        landscape: true,
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      });
      const filename = (raw.filename || 'cabinet').replace(/[^a-z0-9_-]/gi, '_') + '.pdf';
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdf.length,
      });
      res.send(Buffer.from(pdf));
    } finally {
      await page.close();
    }
  } catch (err) {
    console.error('PDF generation error:', err.message);
    res.status(500).json({ error: 'PDF generation failed: ' + err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Cabinator PDF server running at http://localhost:${PORT}`);
});
