export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=1800'); // cache 30 min

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://xpoints.io/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `xpoints.io respondió con status ${response.status}` 
      });
    }

    const html = await response.text();

    // Varias regex por si la estructura cambia un poco
    let match = html.match(/Total points[\s\S]{0,200}?([\d,]{10,})/i);
    
    if (!match) {
      // Intento alternativo
      match = html.match(/([\d,]{11,})[\s\S]{0,50}?Snapshot/i);
    }

    if (match && match[1]) {
      const total = parseInt(match[1].replace(/,/g, ''), 10);
      
      if (total > 10_000_000_000) {
        return res.status(200).json({ 
          total: total,
          formatted: (total / 1_000_000_000).toFixed(2) + 'B'
        });
      }
    }

    // Si llegamos aquí, no encontramos el número
    return res.status(404).json({ 
      error: 'No se encontró el total de puntos en el HTML',
      htmlPreview: html.substring(0, 500) // para debug
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
