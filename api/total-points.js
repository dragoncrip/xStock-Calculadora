export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=1800'); // cache 30 minutos

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://xpoints.io/api/stats', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; xStocksCalculator/1.0)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error al consultar xpoints.io' });
    }

    const data = await response.json();

    if (data.totalPointsSum) {
      const total = Math.round(data.totalPointsSum); // redondeamos porque viene con decimales

      return res.status(200).json({
        total: total,
        formatted: (total / 1_000_000_000).toFixed(2) + 'B'
      });
    }

    return res.status(404).json({ error: 'No se encontró totalPointsSum' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
