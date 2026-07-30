import type { Product } from './types'

const pics = [
  'https://images.unsplash.com/photo-1602524812576-a42b5dd5d1d8?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1528310385748-dba09bf1657a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1575377427642-087cf684f29d?auto=format&fit=crop&w=400&q=80',
]

export const seedProducts: Product[] = [
  ['Solar Festoon String Lights 20 LED','GE4512','Garden & Outdoor',24,57.60,12.49,14.99,8.50,62,true],
  ['Luxury Sherpa Fleece Throw 150 × 200cm','GE7821','Home & Living',12,72.00,18.95,24.99,14.25,78,true],
  ['Bamboo Drawer Organiser Expandable','GE3398','Kitchen',16,64.00,14.50,18.99,10.25,55,true],
  ['Pet Cooling Mat Large 90 × 50cm','GE9104','Pet Supplies',10,52.50,16.99,21.50,12.00,71,false],
  ['Rechargeable LED Camping Lantern','GE6230','Garden & Outdoor',20,86.00,15.99,19.99,11.49,68,true],
  ['Velvet Storage Ottoman Foldable','GE1845','Home & Living',8,68.00,27.99,34.00,22.50,48,true],
].map((p, i) => ({
  id: `gem-${i+1}`, title: p[0] as string, sku: p[1] as string, category: p[2] as string,
  units: p[3] as number, lotEx: p[4] as number, soldAvg: p[5] as number, soldHigh: p[6] as number,
  soldLow: p[7] as number, sellThrough: p[8] as number, available: p[9] as boolean, image: pics[i],
  productUrl: 'https://www.gemimports.co.uk/', description: 'A popular wholesale line from GEM Imports with strong eBay resale potential. Supplied in a trade lot and ready for dispatch.',
  importedAt: `2026-07-${30-i}`, updatedAt: i < 2 ? 'Today' : `${i+1} days ago`, soldCount: 18+i*4,
  researchedAt: i < 4 ? '2026-07-30' : undefined, note: i === 1 ? 'Good seller — restock before autumn.' : '',
  history: [
    { date: 'May', lotEx: (p[4] as number)*.94, available: true },
    { date: 'Jun', lotEx: (p[4] as number)*.97, available: true },
    { date: 'Jul', lotEx: p[4] as number, available: p[9] as boolean },
  ]
}))

export const money = (n: number) => new Intl.NumberFormat('en-GB', { style:'currency', currency:'GBP' }).format(n)
export const calc = (p: Product, selling = p.soldAvg, fee = 12.8, payment = .3, shipping = 3.29, packaging = .45) => {
  const unit = p.lotEx * 1.2 / p.units
  const net = selling - selling * fee/100 - payment - shipping - packaging
  const profit = net - unit
  return { unit, net, profit, lotProfit: profit*p.units, margin: profit/selling*100, roi: profit/unit*100, breakEven:(unit+payment+shipping+packaging)/(1-fee/100) }
}
