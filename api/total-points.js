export default async function handler(req, res) {
  // Permitir CORS desde tu dominio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=3600'); // cache 1 hora

  try {
    const response = await fetch('https://xpoints.io/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; xStocksCalculator/1.0)'
      }
    });

    const html = await response.text();
    
    // Buscamos el número de Total points
    const match = html.match(/Total points[\s\S]{0,150}?([\d,]{10,})/i);
    
    if (match && match[1]) {
      const total = parseInt(match[1].replace(/,/g, ''), 10);
      return res.status(200).json({ total });
    }

    return res.status(404).json({ error: 'No se encontró el total de puntos' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
