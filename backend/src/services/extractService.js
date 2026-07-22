const fs = require('fs');
const mammoth = require('mammoth');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');

// Import de pdf-parse avec fallback
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  pdfParse = require('pdf-parse').default;
}

// Si pdfParse est un objet avec une méthode default, on l'utilise
if (typeof pdfParse !== 'function' && pdfParse.default) {
  pdfParse = pdfParse.default;
}

/**
 * Extrait le texte d'un fichier PPTX
 */
async function extractTextFromPPTX(filePath) {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();
  let text = '';
  const parser = new xml2js.Parser({ explicitChar: false });

  for (const entry of entries) {
    if (entry.entryName.startsWith('ppt/slides/') && entry.entryName.endsWith('.xml')) {
      const content = entry.getData().toString('utf8');
      try {
        const result = await parser.parseStringPromise(content);
        const textNodes = result['p:sld']?.[0]?.['p:cSld']?.[0]?.['p:spTree']?.[0]?.['p:sp'] || [];
        for (const sp of textNodes) {
          const txBody = sp['p:txBody']?.[0];
          if (txBody) {
            const paragraphs = txBody['a:p'] || [];
            for (const p of paragraphs) {
              const runs = p['a:r'] || [];
              for (const r of runs) {
                const t = r['a:t']?.[0];
                if (t) text += t + ' ';
              }
              text += '\n';
            }
          }
        }
      } catch (err) {
        console.warn('Erreur parsing slide:', entry.entryName);
      }
    }
  }
  return text.trim();
}

/**
 * Extrait le texte d'un fichier selon son type MIME
 */
async function extractTextFromFile(filePath, mimeType) {
  try {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const buffer = fs.readFileSync(normalizedPath);

    // PDF
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    }

    // DOCX
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    // PPTX
    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return await extractTextFromPPTX(normalizedPath);
    }

    // Images
    if (mimeType.startsWith('image/')) {
      return null;
    }

    return '';
  } catch (error) {
    console.error('Erreur extraction:', error);
    throw error;
  }
}

module.exports = { extractTextFromFile };