import { useMemo, useState } from 'react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  ArrowLeft, BarChart3, Box, Calculator, ChevronRight, CircleDollarSign,
  ClipboardList, ExternalLink, LayoutDashboard, Menu, Package, Plus, Search,
  ShoppingBag, Sparkles, Trash2, X, Zap,
} from 'lucide-react'
import {
  createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable,
} from '@tanstack/react-table'
import type { OpportunityStatus, PlannerItem, Product, VatBasis } from './types'
import { money, percent } from './data'
import { calculateProfit, productCosts } from './utils/pricing'
import { eligibleRoyalMailRates, ROYAL_MAIL_RATES } from './utils/shipping'

type View = 'dashboard' | 'catalogue' | 'import' | 'planner'
type Go = (view: View) => void

const PRODUCTS_KEY = 'gem-products-v2'
const PLANNER_KEY = 'gem-planner-v2'
const VAT_KEY = 'gem-vat-basis'

const readJson = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T } catch { return fallback }
}

const opportunityStyles: Record<OpportunityStatus, string> = {
  Buy: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  Review: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  Avoid: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  Unresearched: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
}

const profitFor = (product: Product, vat: VatBasis) => {
  const sale = product.research?.expectedSellingPrice ?? 0
  return calculateProfit({
    unitPurchaseCost: productCosts(product, vat).unit,
    salePrice: sale,
    ebayPercentageFee: 12.8,
    ebayFixedFee: 0.3,
    shippingCost: 3.29,
    packagingCost: 0.45,
    promotedListingPercentage: 0,
    unitsPerLot: product.unitsPerLot,
  })
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [products, setProducts] = useState<Product[]>(() => readJson(PRODUCTS_KEY, []))
  const [planner, setPlanner] = useState<PlannerItem[]>(() => readJson(PLANNER_KEY, []))
  const [vat, setVat] = useState<VatBasis>(() => localStorage.getItem(VAT_KEY) === 'ex' ? 'ex' : 'inc')
  const [selected, setSelected] = useState<Product | null>(null)
  const [mobile, setMobile] = useState(false)

  const saveProducts = (next: Product[]) => {
    setProducts(next)
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next))
  }
  const savePlanner = (next: PlannerItem[]) => {
    setPlanner(next)
    localStorage.setItem(PLANNER_KEY, JSON.stringify(next))
  }
  const changeVat = (basis: VatBasis) => {
    setVat(basis)
    localStorage.setItem(VAT_KEY, basis)
  }
  const addPlanner = (productId: string) => {
    const existing = planner.find(item => item.productId === productId)
    savePlanner(existing
      ? planner.map(item => item.productId === productId ? { ...item, selected: true, lotQuantity: item.lotQuantity + 1 } : item)
      : [...planner, { productId, lotQuantity: 1, selected: true, createdAt: new Date().toISOString() }])
  }
  const updateProduct = (product: Product) => {
    saveProducts(products.map(item => item.id === product.id ? product : item))
    setSelected(product)
  }

  return <div className="min-h-screen flex">
    <Sidebar view={view} go={setView} mobile={mobile} setMobile={setMobile} count={planner.filter(i => i.selected).length} />
    <main className="flex-1 min-w-0 lg:ml-[244px]">
      <Topbar setMobile={setMobile} />
      <div className="p-4 md:p-7 lg:p-9 max-w-[1500px] mx-auto">
        {view === 'dashboard' && <Dashboard products={products} planner={planner} vat={vat} setVat={changeVat} go={setView} open={setSelected} />}
        {view === 'catalogue' && <Catalogue products={products} vat={vat} go={setView} open={setSelected} addPlanner={addPlanner} />}
        {view === 'import' && <ImportProduct products={products} save={saveProducts} open={setSelected} go={setView} />}
        {view === 'planner' && <Planner products={products} planner={planner} save={savePlanner} vat={vat} go={setView} />}
      </div>
    </main>
    {selected && <ProductDrawer product={selected} vat={vat} close={() => setSelected(null)} addPlanner={addPlanner} save={updateProduct} />}
  </div>
}

function Sidebar({ view, go, mobile, setMobile, count }: { view: View, go: Go, mobile: boolean, setMobile: (v: boolean) => void, count: number }) {
  const links: [View, string, typeof LayoutDashboard][] = [
    ['dashboard', 'Overview', LayoutDashboard], ['catalogue', 'Product catalogue', Package],
    ['import', 'Import product', Plus], ['planner', 'Purchase planner', ClipboardList],
  ]
  return <>
    {mobile && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={() => setMobile(false)} />}
    <aside className={`fixed z-40 inset-y-0 left-0 w-[244px] border-r border-white/[.07] bg-[#0c0f13] p-5 flex flex-col transition-transform lg:translate-x-0 ${mobile ? '' : '-translate-x-full'}`}>
      <button aria-label="Close navigation" className="lg:hidden absolute right-3 top-3 text-slate-500" onClick={() => setMobile(false)}><X size={19} /></button>
      <div className="flex items-center gap-3 mb-10"><div className="w-10 h-10 rounded-xl bg-lime text-black flex items-center justify-center font-black heading text-lg">G</div><div><div className="heading font-extrabold text-[15px]">GEM INTELLIGENCE</div><div className="text-[10px] uppercase tracking-[.18em] text-slate-500">eBay Reseller Suite</div></div></div>
      <div className="text-[10px] uppercase text-slate-600 font-bold tracking-[.18em] px-3 mb-2">Workspace</div>
      <nav className="space-y-1">{links.map(([id, label, Icon]) => <button key={id} onClick={() => { go(id); setMobile(false) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${view === id ? 'bg-lime text-black' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><Icon size={17} />{label}{id === 'planner' && count > 0 && <b className="ml-auto text-[10px] bg-black/15 px-1.5 rounded-full">{count}</b>}</button>)}</nav>
      <div className="mt-auto card p-4 grid-fade"><Sparkles size={16} className="text-lime mb-3" /><div className="heading font-bold text-sm">GEM → eBay</div><p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Compare real wholesale costs with eBay research before you buy.</p></div>
    </aside>
  </>
}

function Topbar({ setMobile }: { setMobile: (v: boolean) => void }) {
  return <header className="h-[70px] border-b border-white/[.06] px-4 md:px-8 flex items-center bg-ink/80 backdrop-blur-xl sticky top-0 z-20"><button aria-label="Open navigation" className="lg:hidden mr-3" onClick={() => setMobile(true)}><Menu size={21} /></button><div className="hidden md:flex items-center gap-2 text-xs text-slate-500">GEM Imports <ChevronRight size={13} /> <span className="text-slate-300">eBay reseller dashboard</span></div><div className="ml-auto text-[11px] text-emerald-300 bg-emerald-400/10 rounded-full px-3 py-1.5">GEM Imports only</div></header>
}

function PageTitle({ eyebrow, title, children }: { eyebrow: string, title: string, children?: React.ReactNode }) {
  return <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 rise"><div><div className="text-lime uppercase tracking-[.2em] font-bold text-[10px] mb-2">{eyebrow}</div><h1 className="heading text-3xl md:text-[38px] leading-none font-extrabold">{title}</h1></div>{children}</div>
}

function VatToggle({ vat, setVat }: { vat: VatBasis, setVat: (v: VatBasis) => void }) {
  return <div className="soft rounded-xl p-1 flex" role="group" aria-label="VAT display basis">{(['inc', 'ex'] as const).map(value => <button key={value} aria-pressed={vat === value} onClick={() => setVat(value)} className={`px-3 py-2 rounded-lg text-[10px] font-bold ${vat === value ? 'bg-lime text-black' : 'text-slate-500'}`}>{value === 'inc' ? 'Inc VAT' : 'Ex VAT'}</button>)}</div>
}

function EmptyState({ title, body, go, compact = false }: { title: string, body: string, go?: Go, compact?: boolean }) {
  return <div className={`${compact ? 'py-10' : 'py-16'} px-6 text-center`}><div className="w-11 h-11 rounded-2xl bg-lime/[.07] text-lime flex items-center justify-center mx-auto"><Box size={20} /></div><h3 className="heading font-bold mt-4">{title}</h3><p className="text-xs text-slate-600 mt-2 max-w-md mx-auto">{body}</p>{go && <button onClick={() => go('import')} className="bg-lime text-black rounded-xl px-4 py-2.5 text-xs font-bold mt-5 inline-flex items-center gap-2"><Plus size={14} />Import GEM Product</button>}</div>
}

function Dashboard({ products, planner, vat, setVat, go, open }: { products: Product[], planner: PlannerItem[], vat: VatBasis, setVat: (v: VatBasis) => void, go: Go, open: (p: Product) => void }) {
  const researched = products.filter(p => p.research?.researchedAt)
  const results = researched.map(p => ({ product: p, result: profitFor(p, vat) }))
  const valid = results.filter(x => x.result.roiPercentage != null)
  const average = (key: 'profitPerUnit' | 'roiPercentage') => valid.length ? valid.reduce((sum, x) => sum + (x.result[key] ?? 0), 0) / valid.length : 0
  const selected = planner.filter(i => i.selected).map(i => ({ item: i, product: products.find(p => p.id === i.productId) })).filter(x => x.product) as { item: PlannerItem, product: Product }[]
  const capital = selected.reduce((sum, x) => sum + productCosts(x.product, vat).lot * x.item.lotQuantity, 0)
  const projectedRevenue = results.reduce((sum, x) => sum + x.result.expectedRevenuePerLot, 0)
  const purchaseCost = results.reduce((sum, x) => sum + productCosts(x.product, vat).lot, 0)
  const projectedProfit = results.reduce((sum, x) => sum + x.result.profitPerLot, 0)
  const chart = valid.map(x => ({ name: x.product.title, roi: x.result.roiPercentage }))
  const stats = [
    ['Products imported', String(products.length), Box],
    ['eBay researched', String(researched.length), Search],
    ['Average ROI', percent(average('roiPercentage')), BarChart3],
    ['Avg. profit / unit', money(average('profitPerUnit')), CircleDollarSign],
    ['Capital required', money(capital), ShoppingBag],
  ] as const
  return <>
    <PageTitle eyebrow="GEM Imports → eBay" title="Reseller overview"><div className="flex gap-2"><VatToggle vat={vat} setVat={setVat} /><button onClick={() => go('import')} className="bg-lime text-black px-4 rounded-xl font-bold text-xs flex items-center gap-2"><Plus size={16} />Import GEM Product</button></div></PageTitle>
    <section className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3.5 mb-4">{stats.map(([label, value, Icon]) => <div className="card p-5" key={label}><Icon size={17} className="text-lime" /><div className="heading text-3xl font-extrabold mt-6">{value}</div><div className="text-xs font-semibold mt-1">{label}</div>{label === 'Capital required' && <div className="text-[9px] text-slate-600 mt-1">{vat === 'inc' ? 'Inc VAT' : 'Ex VAT'}</div>}</div>)}</section>
    {products.length === 0 && <div className="card mb-4"><EmptyState title="No products imported yet." body="Import your first GEM product URL to begin tracking costs and eBay resale potential." go={go} compact /></div>}
    <section className="grid xl:grid-cols-[1.55fr_.75fr] gap-4 mb-4">
      <div className="card p-5 md:p-6 min-h-[330px]"><div className="flex justify-between"><div><h2 className="heading font-bold text-lg">Profit potential</h2><p className="text-[11px] text-slate-500 mt-1">Real researched product ROI only</p></div><select aria-label="Sort chart" className="soft rounded-lg text-[10px] text-slate-400 px-2"><option>Recently researched</option><option>Highest ROI</option><option>Highest profit per lot</option><option>Highest confidence</option></select></div>{chart.length ? <ResponsiveContainer width="100%" height={240}><AreaChart data={chart}><CartesianGrid stroke="#20252d" vertical={false} /><XAxis dataKey="name" hide /><YAxis tick={{ fill: '#626c79', fontSize: 10 }} tickFormatter={v => `${v}%`} /><Tooltip contentStyle={{ background: '#10141a', border: '1px solid #29303a' }} /><Area dataKey="roi" stroke="#b9f227" fill="#b9f22722" /></AreaChart></ResponsiveContainer> : <EmptyState title="No performance data yet." body="Import and research GEM products to generate performance data." compact />}</div>
      <div className="card p-6 grid-fade"><div className="text-[10px] uppercase text-slate-500 font-bold tracking-[.16em]">Projected resale summary</div><div className="heading text-4xl font-extrabold mt-3">{money(projectedRevenue)}</div><div className="text-[9px] text-slate-600 mt-1">Projected revenue</div><div className="mt-10 space-y-5"><SummaryMetric label="Projected revenue" value={projectedRevenue} /><SummaryMetric label={`Total purchase cost · ${vat === 'inc' ? 'Inc VAT' : 'Ex VAT'}`} value={purchaseCost} /><SummaryMetric label="Projected profit" value={projectedProfit} /></div></div>
    </section>
    <RecentlyImported products={products} vat={vat} open={open} go={go} />
    <BestOpportunities products={products} vat={vat} open={open} go={go} />
  </>
}

function SummaryMetric({ label, value }: { label: string, value: number }) {
  return <div className="flex justify-between border-b border-white/[.06] pb-4 text-[11px]"><span className="text-slate-500">{label}</span><b>{money(value)}</b></div>
}

function OpportunityBadge({ value, onChange }: { value: OpportunityStatus, onChange?: (v: OpportunityStatus) => void }) {
  return onChange ? <select aria-label="Opportunity status" value={value} onChange={e => onChange(e.target.value as OpportunityStatus)} className={`border rounded-full text-[9px] px-2 py-1 ${opportunityStyles[value]}`}>{(['Buy', 'Review', 'Avoid', 'Unresearched'] as const).map(x => <option key={x} className="bg-[#151a21]">{x}</option>)}</select> : <span className={`border rounded-full text-[9px] px-2 py-1 ${opportunityStyles[value]}`}>{value}</span>
}

function RecentlyImported({ products, vat, open, go }: { products: Product[], vat: VatBasis, open: (p: Product) => void, go: Go }) {
  return <div className="card overflow-hidden mb-4"><div className="p-5 border-b border-white/[.06]"><h2 className="heading font-bold">Recently imported</h2></div>{products.length === 0 ? <EmptyState title="No recent imports." body="Imported GEM products will appear here." go={go} compact /> : <div className="divide-y divide-white/[.05]">{products.slice(0, 5).map(product => { const costs = productCosts(product, vat); const profit = profitFor(product, vat); return <button key={product.id} onClick={() => open(product)} className="w-full p-4 md:px-5 grid grid-cols-[44px_1fr] md:grid-cols-[44px_1fr_80px_100px_80px_100px_18px] gap-3 items-center text-left hover:bg-white/[.02]"><Image product={product} /><div className="min-w-0"><div className="text-xs font-semibold truncate">{product.title}</div><div className="text-[10px] text-slate-600 mt-1">{product.gemSku ?? 'No SKU'} · {product.category ?? 'Uncategorised'} · {product.unitsPerLot} units</div></div><Cost value={costs.lot} label={`lot · ${vat} VAT`} /><Cost value={costs.unit} label={`unit · ${vat} VAT`} /><div className="hidden md:block text-xs text-lime font-bold">{percent(profit.roiPercentage)}</div><div className="hidden md:block"><OpportunityBadge value={product.opportunityStatus} /></div><ChevronRight size={14} className="hidden md:block text-slate-700" /></button> })}</div>}</div>
}

function Image({ product }: { product: Product }) {
  return product.imageUrl ? <img src={product.imageUrl} alt="" className="w-11 h-11 object-cover rounded-xl" /> : <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center"><Package size={16} className="text-slate-700" /></div>
}
function Cost({ value, label }: { value: number, label: string }) { return <div className="hidden md:block text-right"><div className="text-xs font-bold">{money(value)}</div><div className="text-[9px] text-slate-600">{label}</div></div> }

function BestOpportunities({ products, vat, open, go }: { products: Product[], vat: VatBasis, open: (p: Product) => void, go: Go }) {
  const [status, setStatus] = useState('All')
  const [stock, setStock] = useState('All')
  const [minRoi, setMinRoi] = useState(0)
  const [minProfit, setMinProfit] = useState(0)
  const [minConfidence, setMinConfidence] = useState(0)
  const researched = products.filter(p => p.research?.researchedAt).map(p => ({ p, r: profitFor(p, vat) }))
    .filter(x => (status === 'All' || x.p.opportunityStatus === status) && (stock === 'All' || x.p.stockStatus === stock) && (x.r.roiPercentage ?? -Infinity) >= minRoi && x.r.profitPerLot >= minProfit && (x.p.research?.confidenceScore ?? -Infinity) >= minConfidence)
    .sort((a, b) => (b.r.profitPerLot - a.r.profitPerLot) || ((b.r.roiPercentage ?? 0) - (a.r.roiPercentage ?? 0)) || ((b.p.research?.confidenceScore ?? 0) - (a.p.research?.confidenceScore ?? 0)) || ((b.p.research?.recentSoldCount ?? 0) - (a.p.research?.recentSoldCount ?? 0)) || (productCosts(a.p, vat).lot - productCosts(b.p, vat).lot))
  return <div className="card overflow-hidden"><div className="p-5 border-b border-white/[.06]"><h2 className="heading font-bold">Best opportunities</h2><div className="flex flex-wrap gap-2 mt-4"><FilterSelect label="Opportunity status" value={status} set={setStatus} options={['All', 'Buy', 'Review', 'Avoid', 'Unresearched']} /><FilterSelect label="Stock status" value={stock} set={setStock} options={['All', 'in_stock', 'out_of_stock']} /><FilterNumber label="Minimum ROI" value={minRoi} set={setMinRoi} /><FilterNumber label="Minimum profit / lot" value={minProfit} set={setMinProfit} /><FilterNumber label="Minimum confidence" value={minConfidence} set={setMinConfidence} /></div></div>{researched.length === 0 ? <EmptyState title="No researched opportunities yet." body="Add eBay research to imported GEM products to rank opportunities." go={go} compact /> : <div className="overflow-x-auto scrollbar"><table className="w-full text-xs"><thead><tr>{['Product', 'GEM SKU', 'Units / lot', 'Lot cost', 'Unit cost', 'Expected eBay price', 'Profit / unit', 'Profit / lot', 'ROI', 'Sold', 'Confidence', 'GEM stock', 'Opportunity', 'Actions'].map(h => <th className="text-left text-[9px] uppercase text-slate-600 px-4 py-3 whitespace-nowrap" key={h}>{h}</th>)}</tr></thead><tbody>{researched.map(({ p, r }) => { const costs = productCosts(p, vat); return <tr key={p.id} className="border-t border-white/[.05]"><td className="px-4 py-3 min-w-[220px] font-semibold">{p.title}</td><td className="px-4">{p.gemSku ?? '—'}</td><td className="px-4">{p.unitsPerLot}</td><td className="px-4">{money(costs.lot)}</td><td className="px-4">{money(costs.unit)}</td><td className="px-4">{money(p.research?.expectedSellingPrice)}</td><td className="px-4">{money(r.profitPerUnit)}</td><td className="px-4 text-lime font-bold">{money(r.profitPerLot)}</td><td className="px-4">{percent(r.roiPercentage)}</td><td className="px-4">{p.research?.recentSoldCount ?? '—'}</td><td className="px-4">{p.research?.confidenceScore == null ? 'Not enough data' : `${p.research.confidenceScore} · ${p.research.confidenceLabel}`}</td><td className="px-4">{p.stockStatus.replaceAll('_', ' ')}</td><td className="px-4"><OpportunityBadge value={p.opportunityStatus} /></td><td className="px-4"><button onClick={() => open(p)} className="text-lime">Details</button></td></tr> })}</tbody></table></div>}</div>
}

function FilterSelect({ label, value, set, options }: { label: string, value: string, set: (v: string) => void, options: string[] }) { return <label className="text-[9px] text-slate-600">{label}<select value={value} onChange={e => set(e.target.value)} className="soft block rounded-lg px-2 py-1.5 mt-1 text-[10px] text-slate-300">{options.map(o => <option key={o}>{o}</option>)}</select></label> }
function FilterNumber({ label, value, set }: { label: string, value: number, set: (v: number) => void }) { return <label className="text-[9px] text-slate-600">{label}<input type="number" min="0" value={value} onChange={e => set(Number(e.target.value) || 0)} className="soft block rounded-lg px-2 py-1.5 mt-1 text-[10px] w-28" /></label> }

function Catalogue({ products, vat, go, open, addPlanner }: { products: Product[], vat: VatBasis, go: Go, open: (p: Product) => void, addPlanner: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const columns = useMemo(() => {
    const helper = createColumnHelper<Product>()
    return [
      helper.accessor('title', { header: 'Product', cell: i => <div className="flex items-center gap-3 min-w-[240px]"><Image product={i.row.original} /><div><b className="text-xs">{i.getValue()}</b><div className="text-[9px] text-slate-600 mt-1">{i.row.original.gemSku ?? 'No SKU'}</div></div></div> }),
      helper.accessor('category', { header: 'Category', cell: i => i.getValue() ?? '—' }),
      helper.accessor('unitsPerLot', { header: 'Units' }),
      helper.display({ id: 'lot', header: `Lot · ${vat} VAT`, cell: i => money(productCosts(i.row.original, vat).lot) }),
      helper.display({ id: 'unit', header: `Unit · ${vat} VAT`, cell: i => money(productCosts(i.row.original, vat).unit) }),
      helper.display({ id: 'roi', header: 'ROI', cell: i => percent(i.row.original.research ? profitFor(i.row.original, vat).roiPercentage : null) }),
      helper.accessor('stockStatus', { header: 'GEM stock', cell: i => i.getValue().replaceAll('_', ' ') }),
      helper.accessor('opportunityStatus', { header: 'Opportunity', cell: i => <OpportunityBadge value={i.getValue()} /> }),
      helper.display({ id: 'actions', cell: i => <button aria-label={`Add ${i.row.original.title} to planner`} onClick={e => { e.stopPropagation(); addPlanner(i.row.original.id) }} className="soft w-8 h-8 rounded-lg flex items-center justify-center"><Plus size={14} /></button> }),
    ]
  }, [vat, addPlanner])
  const table = useReactTable({ data: products, columns, state: { globalFilter: search }, onGlobalFilterChange: setSearch, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() })
  return <><PageTitle eyebrow="Product intelligence" title="GEM catalogue"><span className="text-[11px] text-slate-500">{products.length} products</span></PageTitle><div className="card">{products.length === 0 ? <EmptyState title="Your GEM product catalogue is empty." body="Import your first GEM product URL to begin tracking costs and eBay resale potential." go={go} /> : <><div className="p-4 border-b border-white/[.06]"><label className="soft h-10 rounded-xl flex items-center px-3"><Search size={15} className="text-slate-600" /><input aria-label="Search catalogue" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, GEM SKU or category…" className="bg-transparent outline-none text-xs px-3 w-full" /></label></div><div className="overflow-x-auto scrollbar"><table className="w-full"><thead>{table.getHeaderGroups().map(group => <tr key={group.id}>{group.headers.map(h => <th key={h.id} className="text-left text-[9px] uppercase text-slate-600 px-4 py-3 whitespace-nowrap">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row => <tr key={row.id} onClick={() => open(row.original)} className="border-t border-white/[.05] cursor-pointer hover:bg-white/[.02]">{row.getVisibleCells().map(cell => <td key={cell.id} className="px-4 py-3 text-xs">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div></>}</div></>
}

function ImportProduct({ products, save, open, go }: { products: Product[], save: (products: Product[]) => void, open: (product: Product) => void, go: Go }) {
  const [url, setUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [imported, setImported] = useState<Product | null>(null)
  const run = async () => {
    setLoading(true)
    setMessage('')
    setImported(null)
    try {
      const response = await fetch('/api/import-product', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const result = await response.json() as { product?: Product, error?: string }
      if (!response.ok || !result.product) throw new Error(result.error ?? 'Import failed.')
      const existing = products.find(product => product.gemUrl === result.product!.gemUrl || product.gemSku === result.product!.gemSku)
      const nextProduct = existing ? { ...result.product, id: existing.id, importedAt: existing.importedAt, notes: existing.notes, research: existing.research, opportunityStatus: existing.opportunityStatus } : result.product
      save(existing ? products.map(product => product.id === existing.id ? nextProduct : product) : [nextProduct, ...products])
      setImported(nextProduct)
      setMessage(existing ? 'Product refreshed with the latest verified GEM pricing and stock.' : 'Product imported successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import failed.')
    } finally {
      setLoading(false)
    }
  }
  return <><PageTitle eyebrow="Single product import" title="Import from GEM" /><div className="card p-6 md:p-8 max-w-4xl"><Zap size={22} className="text-lime" /><h2 className="heading text-xl font-bold mt-6">Paste a GEM Imports URL</h2><p className="text-xs text-slate-500 mt-2">Only verified data returned by the server-side GEM scraper will be saved. This interface never invents product details.</p><label className="block text-[10px] uppercase text-slate-500 font-bold mt-7">Product URL<div className="soft rounded-xl h-12 flex items-center mt-2 px-4"><ExternalLink size={15} className="text-slate-600" /><input value={url} onChange={e => { setUrl(e.target.value); setMessage(''); setImported(null) }} className="bg-transparent flex-1 outline-none px-3 text-xs" placeholder="https://www.gemimports.co.uk/..." /><button disabled={!url.includes('gemimports.co.uk') || loading} onClick={run} className="bg-lime disabled:opacity-30 text-black rounded-lg px-4 py-2 text-[11px] font-bold">{loading ? 'Importing…' : 'Import'}</button></div></label>{message && <div role="status" className={`mt-4 text-xs p-3 rounded-xl border ${imported ? 'text-emerald-300 bg-emerald-400/[.06] border-emerald-400/15' : 'text-amber-300 bg-amber-400/[.06] border-amber-400/15'}`}>{message}{imported && <span className="ml-3"><button onClick={() => open(imported)} className="text-lime font-bold">View details</button><button onClick={() => go('catalogue')} className="text-lime font-bold ml-3">Open catalogue</button></span>}</div>}</div></>
}

function Planner({ products, planner, save, vat, go }: { products: Product[], planner: PlannerItem[], save: (x: PlannerItem[]) => void, vat: VatBasis, go: Go }) {
  const lines = planner.map(item => ({ item, product: products.find(p => p.id === item.productId) })).filter(x => x.product) as { item: PlannerItem, product: Product }[]
  const active = lines.filter(x => x.item.selected)
  const cost = active.reduce((sum, x) => sum + productCosts(x.product, vat).lot * x.item.lotQuantity, 0)
  const revenue = active.reduce((sum, x) => sum + profitFor(x.product, vat).expectedRevenuePerLot * x.item.lotQuantity, 0)
  const profit = active.reduce((sum, x) => sum + profitFor(x.product, vat).profitPerLot * x.item.lotQuantity, 0)
  return <><PageTitle eyebrow="Buying decisions" title="Purchase planner"><span className="text-[11px] text-slate-500">{active.length} active products</span></PageTitle><div className="grid xl:grid-cols-[1.4fr_.6fr] gap-4"><div className="card">{lines.length === 0 ? <EmptyState title="No products added to the purchase planner." body="Add a GEM product from the catalogue to calculate capital required." go={go} /> : lines.map(({ item, product }) => <div key={product.id} className="p-4 border-b border-white/[.05] flex items-center gap-3"><input aria-label={`Select ${product.title}`} type="checkbox" checked={item.selected} onChange={e => save(planner.map(x => x.productId === product.id ? { ...x, selected: e.target.checked } : x))} /><Image product={product} /><div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate">{product.title}</div><div className="text-[10px] text-slate-600 mt-1">{money(productCosts(product, vat).lot)} per lot · {vat} VAT</div></div><div className="soft rounded-lg flex items-center"><button onClick={() => save(planner.map(x => x.productId === product.id ? { ...x, lotQuantity: Math.max(1, x.lotQuantity - 1) } : x))} className="px-2">−</button><span className="w-6 text-center text-xs">{item.lotQuantity}</span><button onClick={() => save(planner.map(x => x.productId === product.id ? { ...x, lotQuantity: x.lotQuantity + 1 } : x))} className="px-2 text-lime">+</button></div><button aria-label={`Remove ${product.title}`} onClick={() => save(planner.filter(x => x.productId !== product.id))} className="text-slate-700 hover:text-rose-400"><Trash2 size={15} /></button></div>)}</div><div className="card p-6 h-fit"><h3 className="heading font-bold">Purchase summary</h3><div className="space-y-4 mt-6"><SummaryMetric label={`Capital required · ${vat} VAT`} value={cost} /><SummaryMetric label="Projected revenue" value={revenue} /><SummaryMetric label="Projected profit" value={profit} /></div><div className="heading text-3xl text-lime font-extrabold mt-6">{money(profit)}</div><div className="text-[10px] text-slate-600">Projected profit</div></div></div></>
}

function ProductDrawer({ product, vat, close, addPlanner, save }: { product: Product, vat: VatBasis, close: () => void, addPlanner: (id: string) => void, save: (p: Product) => void }) {
  const [status, setStatus] = useState(product.opportunityStatus)
  const [note, setNote] = useState(product.notes)
  const [sale, setSale] = useState(product.research?.expectedSellingPrice ?? 0)
  const [fee, setFee] = useState(12.8)
  const [fixed, setFixed] = useState(0.3)
  const eligibleShipping = eligibleRoyalMailRates({
    lengthCm: product.packagedLengthCm ?? null,
    widthCm: product.packagedWidthCm ?? null,
    depthCm: product.packagedDepthCm ?? null,
    weightKg: product.packagedWeightKg ?? null,
  })
  const [shipping, setShipping] = useState(eligibleShipping[0]?.onlinePrice ?? 3.29)
  const [packaging, setPackaging] = useState(0.45)
  const [promoted, setPromoted] = useState(0)
  const [shippingRateId, setShippingRateId] = useState(eligibleShipping[0]?.id ?? 'manual')
  const costs = productCosts(product, vat)
  const result = calculateProfit({ unitPurchaseCost: costs.unit, salePrice: sale, ebayPercentageFee: fee, ebayFixedFee: fixed, shippingCost: shipping, packagingCost: packaging, promotedListingPercentage: promoted, unitsPerLot: product.unitsPerLot })
  const research = product.research
  return <div className="fixed inset-0 z-50 flex justify-end"><button aria-label="Close product details" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={close} /><aside className="relative w-full max-w-[720px] bg-[#0d1015] border-l border-white/10 h-full overflow-y-auto scrollbar"><div className="sticky top-0 z-10 bg-[#0d1015]/95 border-b border-white/[.07] h-16 px-5 flex items-center"><button onClick={close} className="text-slate-500 flex gap-2 text-xs"><ArrowLeft size={16} />Back</button><button onClick={() => addPlanner(product.id)} className="ml-auto bg-lime text-black rounded-lg px-3 py-2 text-[10px] font-bold"><Plus size={13} className="inline mr-1" />Planner</button></div><div className="p-5 md:p-7"><div className="grid sm:grid-cols-[180px_1fr] gap-6"><Image product={product} /><div><OpportunityBadge value={status} onChange={value => { setStatus(value); save({ ...product, opportunityStatus: value }) }} /><h2 className="heading font-extrabold text-2xl mt-3">{product.title}</h2><p className="text-[10px] text-slate-600 mt-2">GEM SKU {product.gemSku ?? '—'} · {product.stockStatus.replaceAll('_', ' ')}</p><p className="text-xs text-slate-400 mt-4">{product.description}</p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-7">{[[`Lot · ${vat} VAT`, money(costs.lot)], [`Unit · ${vat} VAT`, money(costs.unit)], ['Units / lot', String(product.unitsPerLot)], ['Confidence', research?.confidenceScore == null ? 'Not enough data' : `${research.confidenceScore} · ${research.confidenceLabel}`]].map(([label, value]) => <div className="card p-4" key={label}><div className="text-[9px] text-slate-600">{label}</div><div className="heading font-bold text-base mt-2">{value}</div></div>)}</div><div className="card p-5 mt-4"><h3 className="heading font-bold">Packaged size & weight</h3><div className="grid grid-cols-2 gap-4 mt-4"><div><div className="text-[9px] text-slate-600">Dimensions</div><b className="text-sm">{product.packagedLengthCm != null && product.packagedWidthCm != null && product.packagedDepthCm != null ? `${product.packagedLengthCm} × ${product.packagedWidthCm} × ${product.packagedDepthCm} cm` : 'Not provided by GEM'}</b></div><div><div className="text-[9px] text-slate-600">Packaged weight</div><b className="text-sm">{product.packagedWeightKg != null ? `${product.packagedWeightKg} kg` : 'Not provided by GEM'}</b></div></div></div><div className="card p-5 mt-4"><h3 className="heading font-bold">eBay research</h3>{!research?.researchedAt ? <p className="text-xs text-slate-600 mt-4">No eBay research has been added. Confidence and opportunity analytics are withheld until evidence is available.</p> : <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">{[['Expected price', money(research.expectedSellingPrice)], ['Average sold', money(research.averageSoldPrice)], ['Recent sold', String(research.recentSoldCount ?? '—')], ['Sell-through', percent(research.estimatedSellThroughRate)]].map(([a, b]) => <div key={a}><div className="text-[9px] text-slate-600">{a}</div><b className="text-sm">{b}</b></div>)}</div>}</div><div className="card p-5 mt-4"><Calculator size={16} className="text-lime inline mr-2" /><h3 className="heading font-bold inline">Profit calculator</h3><div className="mt-5"><label className="text-[9px] text-slate-600">Royal Mail service<select value={shippingRateId} onChange={e => { const id = e.target.value; setShippingRateId(id); const rate = ROYAL_MAIL_RATES.find(item => item.id === id); if (rate) setShipping(rate.onlinePrice) }} className="soft rounded-lg mt-1 block w-full px-3 py-2 text-xs"><option value="manual">Manual shipping cost</option>{eligibleShipping.map(rate => <option key={rate.id} value={rate.id}>{rate.service} · {rate.format} · from {money(rate.onlinePrice)}</option>)}</select></label>{eligibleShipping.length === 0 && <p className="text-[10px] text-amber-300 mt-2">No automatic Royal Mail match. Packaged dimensions and weight may be missing or exceed Medium Parcel limits.</p>}<p className="text-[9px] text-slate-600 mt-2">Eligibility uses GEM packaged measurements. Royal Mail prices are online “from” rates and should be checked before purchase.</p></div><div className="grid sm:grid-cols-3 gap-3 mt-5"><NumberInput label="Selling price" value={sale} set={setSale} /><NumberInput label="eBay fee %" value={fee} set={setFee} /><NumberInput label="Fixed fee" value={fixed} set={setFixed} /><NumberInput label="Shipping" value={shipping} set={value => { setShipping(value); setShippingRateId('manual') }} /><NumberInput label="Packaging" value={packaging} set={setPackaging} /><NumberInput label="Promoted %" value={promoted} set={setPromoted} /></div><div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-5">{[['Gross revenue / unit', money(result.grossRevenuePerUnit)], ['Total fees / unit', money(result.totalFeesPerUnit)], ['Net revenue / unit', money(result.netRevenuePerUnit)], ['Profit / unit', money(result.profitPerUnit)], ['Profit / lot', money(result.profitPerLot)], ['ROI', percent(result.roiPercentage)], ['Margin', percent(result.marginPercentage)], ['Break-even', money(result.breakEvenSellingPrice)], ['Revenue / lot', money(result.expectedRevenuePerLot)]].map(([a, b]) => <div className="soft rounded-xl p-3" key={a}><div className="text-[9px] text-slate-600">{a}</div><b className="text-sm mt-1 block">{b}</b></div>)}</div></div><div className="card p-5 mt-4"><h3 className="heading font-bold">Notes</h3><textarea value={note} onChange={e => setNote(e.target.value)} className="soft rounded-xl w-full min-h-28 p-3 text-xs mt-4" /><button onClick={() => save({ ...product, opportunityStatus: status, notes: note })} className="bg-lime text-black rounded-lg px-4 py-2 text-[11px] font-bold mt-3">Save notes</button></div></div></aside></div>
}

function NumberInput({ label, value, set }: { label: string, value: number, set: (n: number) => void }) {
  return <label className="text-[9px] text-slate-600">{label}<input aria-label={label} type="number" min="0" step=".01" value={value} onChange={e => set(Number(e.target.value) || 0)} className="soft rounded-lg mt-1 block w-full px-3 py-2 text-xs" /></label>
}
