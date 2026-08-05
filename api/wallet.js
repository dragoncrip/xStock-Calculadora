export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300'); // cache 5 min

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const address = (req.query.address || '').trim();

  if (!address) {
    return res.status(400).json({ error: 'Missing address parameter' });
  }

  if (!isValidAddress(address)) {
    return res.status(400).json({
      error: 'Invalid wallet address',
      hint: 'Supports EVM (0x…), Solana, Tron (T…) and TON addresses'
    });
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (compatible; xStocksCalculator/1.0)',
      'Accept': 'application/json'
    };

    const [walletRes, statsRes] = await Promise.all([
      fetch(`https://xpoints.io/api/wallet/${encodeURIComponent(address)}`, { headers }),
      fetch('https://xpoints.io/api/stats', { headers })
    ]);

    if (walletRes.status === 404) {
      return res.status(404).json({ error: 'Wallet not found or not registered in xPoints' });
    }

    if (!walletRes.ok) {
      return res.status(walletRes.status).json({ error: 'Error fetching wallet from xpoints.io' });
    }

    const wallet = await walletRes.json();
    const stats = statsRes.ok ? await statsRes.json() : {};

    const points = Math.round(Number(wallet.total_points) || 0);
    const rank = wallet.rank != null ? Number(wallet.rank) : null;
    const registered = stats.registered != null ? Number(stats.registered) : null;

    const percentile = rank && registered ? (rank / registered) * 100 : null;
    const percentileLabel = getPercentileLabel(percentile);

    return res.status(200).json({
      address: wallet.address_display || wallet.address || address,
      points,
      rank,
      registered,
      percentile: percentile != null ? Number(percentile.toFixed(4)) : null,
      percentileLabel,
      walletType: wallet.wallet_type || null,
      status: wallet.status || null
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

function isValidAddress(addr) {
  if (!addr || typeof addr !== 'string') return false;
  const a = addr.trim();

  // EVM: 0x + 40 hex chars
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return true;

  // Tron: starts with T, base58, 34 chars
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)) return true;

  // TON: EQ / UQ / kQ / 0Q + ~46 chars
  if (/^(EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}$/.test(a)) return true;

  // Solana / generic base58 (no 0 O I l), typical length 32–44
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) return true;

  return false;
}

function getPercentileLabel(pct) {
  if (pct == null || Number.isNaN(pct)) return null;

  const buckets = [0.1, 0.5, 1, 5, 10, 15, 25, 50, 75, 90];
  for (const b of buckets) {
    if (pct <= b) return `Top ${b}%`;
  }
  return `Top ${Math.ceil(pct)}%`;
}
