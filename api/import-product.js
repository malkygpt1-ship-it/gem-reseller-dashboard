const VAT_MULTIPLIER = 1.2

const decode = (value = '') => value
  .replace(/&pound;|&#163;/gi, '£')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const first = (html, patterns) => {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decode(match[1])
  }
  return null
}

const numeric = (value) => {
  const number = Number(String(value ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(number) ? number : null
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  let target
  try {
    target = new URL(request.body?.url)
  } catch {
    return response.status(400).json({ error: 'Enter a valid GEM Imports product URL.' })
  }

  const hostname = target.hostname.toLowerCase()
  if (hostname !== 'www.gemimports.co.uk' && hostname !== 'gemimports.co.uk') {
    return response.status(400).json({ error: 'Only gemimports.co.uk product URLs are supported.' })
  }
  if (!target.pathname.startsWith('/buy/')) {
    return response.status(400).json({ error: 'This does not appear to be a GEM product page.' })
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'user-agent': 'GEM-Reseller-Intelligence/1.0 (+product research)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!upstream.ok) throw new Error(`GEM returned HTTP ${upstream.status}`)
    const html = await upstream.text()
    const pageText = decode(html)

    const title = first(html, [
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
      /<h2[^>]*>([\s\S]*?)<\/h2>/i,
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i,
    ])?.replace(/^Wholesale\s+/i, '').replace(/\s*\|\s*GEM Imports.*$/i, '')
    const gemSku = first(html, [
      /Product\s*code:\s*<\/[^>]+>\s*<[^>]+>\s*([^<\s]+)/i,
      /Product\s*code:\s*([A-Z0-9-]+)/i,
    ])
    const unitsPerLot = numeric(first(html, [
      /Carton\s*Qty:\s*<\/[^>]+>\s*<[^>]+>\s*(\d+)/i,
      /Carton\s*Qty:\s*(\d+)/i,
    ]))
    const lotCostExVat = numeric(first(html, [
      /Carton\s*Price:\s*<\/[^>]+>\s*<[^>]+>\s*(?:£|&pound;|&#163;)\s*([\d.]+)/i,
      /Carton\s*Price:[\s\S]{0,180}?(?:£|&pound;|&#163;)\s*([\d.]+)/i,
    ]))
    const unitCostExVat = numeric(first(html, [
      /Unit\s*Price:\s*<\/[^>]+>\s*<[^>]+>\s*(?:£|&pound;|&#163;)\s*([\d.]+)/i,
      /Unit\s*Price:[\s\S]{0,180}?(?:£|&pound;|&#163;)\s*([\d.]+)/i,
    ]))
    const imageUrl = first(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    ])
    const description = first(html, [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    ]) ?? ''
    const category = first(html, [
      /<meta[^>]+property=["']product:category["'][^>]+content=["']([^"']+)/i,
    ])
    const outOfStock = /temporarily out of stock|can't be ordered at present/i.test(html)
    const packagedDimensions = pageText.match(/Packaged Dimensions:\s*([\d.]+)\s*(?:cm)?\s*x\s*([\d.]+)\s*(?:cm)?\s*x\s*([\d.]+)\s*cm/i)
    const packagedWeight = pageText.match(/Packaged Weight:\s*([\d.]+)\s*(kg|g)\b/i)
    const packagedLengthCm = numeric(packagedDimensions?.[1])
    const packagedWidthCm = numeric(packagedDimensions?.[2])
    const packagedDepthCm = numeric(packagedDimensions?.[3])
    const rawWeight = numeric(packagedWeight?.[1])
    const packagedWeightKg = rawWeight == null ? null : packagedWeight?.[2].toLowerCase() === 'g' ? rawWeight / 1000 : rawWeight

    if (!title || !gemSku || !unitsPerLot || lotCostExVat == null) {
      return response.status(422).json({
        error: 'The GEM page loaded, but required product fields could not be verified.',
      })
    }

    const calculatedUnitEx = unitCostExVat ?? lotCostExVat / unitsPerLot
    const now = new Date().toISOString()
    return response.status(200).json({
      product: {
        id: crypto.randomUUID(),
        title,
        imageUrl: imageUrl ? new URL(imageUrl, target).toString() : null,
        gemUrl: target.toString(),
        gemSku,
        category,
        description,
        unitsPerLot,
        lotCostExVat,
        lotCostIncVat: lotCostExVat * VAT_MULTIPLIER,
        unitCostExVat: calculatedUnitEx,
        unitCostIncVat: calculatedUnitEx * VAT_MULTIPLIER,
        packagedLengthCm,
        packagedWidthCm,
        packagedDepthCm,
        packagedWeightKg,
        stockStatus: outOfStock ? 'out_of_stock' : 'in_stock',
        importedAt: now,
        updatedAt: now,
        opportunityStatus: 'Unresearched',
        notes: '',
        research: null,
        priceHistory: [],
      },
    })
  } catch (error) {
    return response.status(502).json({
      error: error instanceof Error ? `Could not retrieve the GEM product: ${error.message}` : 'Could not retrieve the GEM product.',
    })
  }
}
