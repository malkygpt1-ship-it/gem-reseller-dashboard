import { useMemo, useState } from 'react'
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import {
  ArrowDownRight, ArrowLeft, ArrowUpRight, BarChart3, Box, Calculator, Check, ChevronDown,
  ChevronRight, CircleDollarSign, ClipboardList, ExternalLink, History, LayoutDashboard, Menu,
  MoreHorizontal, Package, Plus, RefreshCw, Search, ShoppingBag, Sparkles, Trash2, X, Zap
} from 'lucide-react'
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import type { PlannerItem, Product } from './types'
import { calc, money, seedProducts } from './data'

type View = 'dashboard'|'catalogue'|'import'|'planner'
const categoryColours: Record<string,string> = {
  'Garden & Outdoor':'bg-emerald-400/10 text-emerald-300', 'Home & Living':'bg-violet-400/10 text-violet-300',
  Kitchen:'bg-amber-400/10 text-amber-300', 'Pet Supplies':'bg-sky-400/10 text-sky-300'
}

export default function App() {
  const [view,setView] = useState<View>('dashboard')
  const [products,setProducts] = useState<Product[]>(() => {
    const saved=localStorage.getItem('gem-products'); return saved ? JSON.parse(saved) : seedProducts
  })
  const [planner,setPlanner] = useState<PlannerItem[]>(() => JSON.parse(localStorage.getItem('gem-planner')||'[]'))
  const [selected,setSelected] = useState<Product|null>(null)
  const [mobile,setMobile] = useState(false)
  const saveProducts=(next:Product[])=>{setProducts(next);localStorage.setItem('gem-products',JSON.stringify(next))}
  const savePlanner=(next:PlannerItem[])=>{setPlanner(next);localStorage.setItem('gem-planner',JSON.stringify(next))}
  const addPlanner=(id:string)=>{ const old=planner.find(x=>x.productId===id); savePlanner(old?planner.map(x=>x.productId===id?{...x,lots:x.lots+1}:x):[...planner,{productId:id,lots:1}]) }
  const openProduct=(p:Product)=>{setSelected(p);setMobile(false)}
  return <div className="min-h-screen flex">
    <Sidebar view={view} setView={setView} mobile={mobile} setMobile={setMobile} count={planner.length}/>
    <main className="flex-1 min-w-0 lg:ml-[244px]">
      <Topbar setMobile={setMobile}/>
      <div className="p-4 md:p-7 lg:p-9 max-w-[1500px] mx-auto">
        {view==='dashboard'&&<Dashboard products={products} openProduct={openProduct} go={setView}/>}
        {view==='catalogue'&&<Catalogue products={products} openProduct={openProduct} addPlanner={addPlanner}/>}
        {view==='import'&&<ImportProduct products={products} save={saveProducts} openProduct={openProduct}/>}
        {view==='planner'&&<Planner products={products} planner={planner} save={savePlanner}/>}
      </div>
    </main>
    {selected&&<ProductDrawer product={selected} close={()=>setSelected(null)} addPlanner={addPlanner} save={(p)=>{saveProducts(products.map(x=>x.id===p.id?p:x));setSelected(p)}}/>}
  </div>
}

function Sidebar({view,setView,mobile,setMobile,count}:{view:View,setView:(v:View)=>void,mobile:boolean,setMobile:(v:boolean)=>void,count:number}) {
  const links:[View,string,typeof LayoutDashboard][]=[['dashboard','Overview',LayoutDashboard],['catalogue','Product catalogue',Package],['import','Import product',Plus],['planner','Purchase planner',ClipboardList]]
  return <>
    {mobile&&<button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={()=>setMobile(false)}/>}
    <aside className={`fixed z-40 inset-y-0 left-0 w-[244px] border-r border-white/[.07] bg-[#0c0f13] p-5 flex flex-col transition-transform lg:translate-x-0 ${mobile?'translate-x-0':'-translate-x-full'}`}>
      <button className="lg:hidden absolute right-3 top-3 text-slate-500" onClick={()=>setMobile(false)}><X size={19}/></button>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-lime text-black flex items-center justify-center font-black heading text-lg">G</div>
        <div><div className="heading font-extrabold text-[15px]">GEM INTELLIGENCE</div><div className="text-[10px] uppercase tracking-[.18em] text-slate-500">eBay Reseller Suite</div></div>
      </div>
      <div className="text-[10px] uppercase text-slate-600 font-bold tracking-[.18em] px-3 mb-2">Workspace</div>
      <nav className="space-y-1">
        {links.map(([id,label,Icon])=><button key={id} onClick={()=>{setView(id);setMobile(false)}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${view===id?'bg-lime text-[#0b0d0f]':'text-slate-400 hover:text-white hover:bg-white/5'}`}>
          <Icon size={17}/><span>{label}</span>{id==='planner'&&count>0&&<b className={`ml-auto text-[10px] px-1.5 rounded-full ${view===id?'bg-black/15':'bg-lime text-black'}`}>{count}</b>}
        </button>)}
      </nav>
      <div className="mt-auto card p-4 grid-fade">
        <div className="w-7 h-7 bg-lime/10 rounded-lg flex items-center justify-center text-lime mb-3"><Sparkles size={14}/></div>
        <div className="heading font-bold text-sm">Research smarter</div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Compare GEM costs with eBay sold prices before you buy.</p>
      </div>
      <div className="flex items-center gap-3 pt-5 mt-5 border-t border-white/[.06]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime to-emerald-500 text-black font-bold flex items-center justify-center text-xs">GI</div>
        <div><div className="text-xs font-semibold">GEM Imports</div><div className="text-[10px] text-slate-600">Reseller account</div></div><MoreHorizontal size={15} className="ml-auto text-slate-600"/>
      </div>
    </aside>
  </>
}

function Topbar({setMobile}:{setMobile:(v:boolean)=>void}) {
  return <header className="h-[70px] border-b border-white/[.06] px-4 md:px-8 flex items-center bg-ink/80 backdrop-blur-xl sticky top-0 z-20">
    <button className="lg:hidden mr-3" onClick={()=>setMobile(true)}><Menu size={21}/></button>
    <div className="hidden md:flex items-center gap-2 text-xs text-slate-500"><span>GEM Imports</span><ChevronRight size={13}/><span className="text-slate-300">Reseller dashboard</span></div>
    <div className="ml-auto flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-400/10 border border-emerald-400/10 rounded-full px-3 py-1.5"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>Data up to date</div>
      <button className="w-9 h-9 soft rounded-xl flex items-center justify-center text-slate-400"><Search size={16}/></button>
    </div>
  </header>
}

function PageTitle({eyebrow,title,children}:{eyebrow:string,title:string,children?:React.ReactNode}) {
  return <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 rise"><div><div className="text-lime uppercase tracking-[.2em] font-bold text-[10px] mb-2">{eyebrow}</div><h1 className="heading text-3xl md:text-[38px] leading-none font-extrabold">{title}</h1></div>{children}</div>
}

function Dashboard({products,openProduct,go}:{products:Product[],openProduct:(p:Product)=>void,go:(v:View)=>void}) {
  const researched=products.filter(p=>p.researchedAt)
  const metrics=products.map(p=>calc(p))
  const avg=(key:'roi'|'profit')=>metrics.reduce((s,m)=>s+m[key],0)/metrics.length
  const stock=products.reduce((s,p)=>s+p.lotEx*1.2,0)
  const stats=[
    ['Products imported',String(products.length),'Live catalogue',Box,'lime'],
    ['Products researched',String(researched.length),`${Math.round(researched.length/products.length*100)}% complete`,Search,'mint'],
    ['Average ROI',`${avg('roi').toFixed(1)}%`,'Across researched lines',ArrowUpRight,'lime'],
    ['Avg. profit / unit',money(avg('profit')),'After costs & fees',CircleDollarSign,'mint'],
  ]
  const chart=products.map(p=>({name:p.title.split(' ').slice(0,2).join(' '),roi:Math.max(0,calc(p).roi),profit:Math.max(0,calc(p).profit)}))
  return <>
    <PageTitle eyebrow="Good morning" title="Reseller overview">
      <button onClick={()=>go('import')} className="bg-lime hover:bg-[#c9ff3e] text-black px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lime"><Plus size={16}/>Import GEM product</button>
    </PageTitle>
    <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
      {stats.map(([label,value,sub,Icon,tone],i)=><div className="card p-5 rise" style={{animationDelay:`${i*60}ms`}} key={label as string}>
        <div className="flex justify-between items-start"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone==='lime'?'bg-lime/10 text-lime':'bg-mint/10 text-mint'}`}><Icon size={17}/></div><MoreHorizontal size={15} className="text-slate-700"/></div>
        <div className="heading text-3xl font-extrabold mt-6">{value as string}</div><div className="text-xs font-semibold mt-1">{label as string}</div><div className="text-[10px] text-slate-600 mt-1">{sub as string}</div>
      </div>)}
    </section>
    <section className="grid xl:grid-cols-[1.55fr_.75fr] gap-4 mb-4">
      <div className="card p-5 md:p-6 min-h-[330px]">
        <div className="flex items-start justify-between mb-6"><div><h2 className="heading font-bold text-lg">Profit potential</h2><p className="text-[11px] text-slate-500 mt-1">ROI performance across your catalogue</p></div><select className="soft rounded-lg text-[10px] text-slate-400 px-2 py-1.5"><option>Last 30 days</option></select></div>
        <ResponsiveContainer width="100%" height={235}><AreaChart data={chart}><defs><linearGradient id="roi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9f227" stopOpacity={.35}/><stop offset="1" stopColor="#b9f227" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#20252d" vertical={false}/><XAxis dataKey="name" tick={{fill:'#626c79',fontSize:10}} tickLine={false} axisLine={false}/><YAxis tick={{fill:'#626c79',fontSize:10}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/><Tooltip contentStyle={{background:'#10141a',border:'1px solid #29303a',borderRadius:12,fontSize:11}} formatter={(v:number)=>`${v.toFixed(1)}%`}/><Area type="monotone" dataKey="roi" stroke="#b9f227" strokeWidth={2} fill="url(#roi)"/></AreaChart></ResponsiveContainer>
      </div>
      <div className="card p-6 relative overflow-hidden grid-fade">
        <div className="relative z-10"><div className="text-[10px] uppercase text-slate-500 font-bold tracking-[.16em]">Potential inventory value</div><div className="heading text-4xl font-extrabold mt-3">{money(stock)}</div><div className="flex gap-2 mt-3"><span className="text-emerald-300 text-[10px] bg-emerald-400/10 px-2 py-1 rounded-md">+8.4%</span><span className="text-[10px] text-slate-500 py-1">vs last month</span></div></div>
        <div className="mt-10 space-y-4 relative z-10">
          <Metric label="Expected revenue" value={money(products.reduce((s,p)=>s+p.soldAvg*p.units,0))} pct={84}/>
          <Metric label="Total purchase cost" value={money(stock)} pct={46}/>
          <Metric label="Expected profit" value={money(metrics.reduce((s,m)=>s+m.lotProfit,0))} pct={67}/>
        </div>
      </div>
    </section>
    <div className="card overflow-hidden">
      <div className="p-5 flex justify-between items-center border-b border-white/[.06]"><div><h2 className="heading font-bold">Recently imported</h2><p className="text-[10px] text-slate-600 mt-1">Last sync today at 09:42</p></div><button onClick={()=>go('catalogue')} className="text-xs text-lime font-semibold flex items-center gap-1">View catalogue <ChevronRight size={14}/></button></div>
      <div className="divide-y divide-white/[.05]">{products.slice(0,4).map(p=><ProductRow key={p.id} p={p} open={()=>openProduct(p)}/>)}</div>
    </div>
  </>
}

function Metric({label,value,pct}:{label:string,value:string,pct:number}) {return <div><div className="flex justify-between text-[11px] mb-2"><span className="text-slate-500">{label}</span><span className="font-semibold">{value}</span></div><div className="h-1 bg-white/5 rounded-full"><div className="h-full bg-lime rounded-full" style={{width:`${pct}%`}}/></div></div>}

function ProductRow({p,open}:{p:Product,open:()=>void}) {
 const m=calc(p); return <button onClick={open} className="w-full p-4 md:px-5 flex items-center text-left hover:bg-white/[.02] transition group">
  <img src={p.image} className="w-11 h-11 object-cover rounded-xl bg-white/5" alt=""/>
  <div className="ml-3 min-w-0 flex-1"><div className="text-xs font-semibold truncate group-hover:text-lime transition">{p.title}</div><div className="text-[10px] text-slate-600 mt-1">{p.sku} · {p.category}</div></div>
  <div className="hidden sm:block text-right w-24"><div className="text-xs font-bold">{money(p.lotEx*1.2/p.units)}</div><div className="text-[9px] text-slate-600">unit cost</div></div>
  <div className="hidden md:block text-right w-24"><div className="text-xs font-bold text-lime">{m.roi.toFixed(0)}%</div><div className="text-[9px] text-slate-600">ROI</div></div>
  <span className={`ml-5 w-2 h-2 rounded-full ${p.available?'bg-emerald-400':'bg-rose-400'}`}/><ChevronRight size={14} className="ml-3 text-slate-700"/>
 </button>
}

const columnHelper=createColumnHelper<Product>()
function Catalogue({products,openProduct,addPlanner}:{products:Product[],openProduct:(p:Product)=>void,addPlanner:(id:string)=>void}) {
 const [search,setSearch]=useState(''); const [category,setCategory]=useState('All'); const [stock,setStock]=useState('All')
 const filtered=useMemo(()=>products.filter(p=>(category==='All'||p.category===category)&&(stock==='All'||(stock==='In stock')===p.available)),[products,category,stock])
 const columns=useMemo(()=>[
  columnHelper.accessor('title',{header:'Product',cell:i=><div className="flex items-center gap-3 min-w-[250px]"><img src={i.row.original.image} className="w-10 h-10 rounded-lg object-cover"/><div><div className="font-semibold text-xs">{i.getValue()}</div><div className="text-[9px] text-slate-600 mt-1">{i.row.original.sku}</div></div></div>}),
  columnHelper.accessor('category',{header:'Category',cell:i=><span className={`text-[9px] px-2 py-1 rounded-md ${categoryColours[i.getValue()]}`}>{i.getValue()}</span>}),
  columnHelper.accessor('units',{header:'Units',cell:i=><span className="text-xs">{i.getValue()}</span>}),
  columnHelper.accessor('lotEx',{header:'Lot ex VAT',cell:i=><span className="text-xs">{money(i.getValue())}</span>}),
  columnHelper.display({id:'lotInc',header:'Lot inc VAT',cell:i=><span className="text-xs">{money(i.row.original.lotEx*1.2)}</span>}),
  columnHelper.display({id:'unit',header:'Unit inc VAT',cell:i=><span className="text-xs font-semibold">{money(i.row.original.lotEx*1.2/i.row.original.units)}</span>}),
  columnHelper.display({id:'roi',header:'ROI',cell:i=><span className="text-xs text-lime font-bold">{calc(i.row.original).roi.toFixed(0)}%</span>}),
  columnHelper.accessor('available',{header:'Status',cell:i=><span className={`text-[9px] px-2 py-1 rounded-full ${i.getValue()?'bg-emerald-400/10 text-emerald-300':'bg-rose-400/10 text-rose-300'}`}>{i.getValue()?'In stock':'Out of stock'}</span>}),
  columnHelper.display({id:'actions',cell:i=><button onClick={e=>{e.stopPropagation();addPlanner(i.row.original.id)}} className="w-8 h-8 soft rounded-lg flex items-center justify-center text-slate-400 hover:text-lime"><Plus size={14}/></button>})
 ],[addPlanner])
 const table=useReactTable({data:filtered,columns,state:{globalFilter:search},onGlobalFilterChange:setSearch,getCoreRowModel:getCoreRowModel(),getFilteredRowModel:getFilteredRowModel(),getSortedRowModel:getSortedRowModel()})
 return <><PageTitle eyebrow="Product intelligence" title="GEM catalogue"><div className="text-[11px] text-slate-500">{filtered.length} wholesale lines</div></PageTitle>
  <div className="card">
   <div className="p-4 flex flex-wrap gap-2 border-b border-white/[.06]">
    <label className="soft h-10 rounded-xl flex items-center px-3 flex-1 min-w-[220px]"><Search size={15} className="text-slate-600"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, SKU or category…" className="bg-transparent outline-none text-xs px-3 w-full"/></label>
    <select value={category} onChange={e=>setCategory(e.target.value)} className="soft rounded-xl px-3 text-[11px] text-slate-300"><option>All</option>{[...new Set(products.map(p=>p.category))].map(c=><option key={c}>{c}</option>)}</select>
    <select value={stock} onChange={e=>setStock(e.target.value)} className="soft rounded-xl px-3 text-[11px] text-slate-300"><option>All</option><option>In stock</option><option>Out of stock</option></select>
   </div>
   <div className="overflow-x-auto scrollbar"><table className="w-full"><thead><tr>{table.getHeaderGroups()[0].headers.map(h=><th key={h.id} onClick={h.column.getToggleSortingHandler()} className="text-left text-[9px] uppercase tracking-[.12em] text-slate-600 font-bold px-4 py-3 whitespace-nowrap">{flexRender(h.column.columnDef.header,h.getContext())}</th>)}</tr></thead><tbody>{table.getRowModel().rows.map(r=><tr key={r.id} onClick={()=>openProduct(r.original)} className="border-t border-white/[.05] hover:bg-white/[.025] cursor-pointer">{r.getVisibleCells().map(c=><td className="px-4 py-3" key={c.id}>{flexRender(c.column.columnDef.cell,c.getContext())}</td>)}</tr>)}</tbody></table></div>
  </div></>
}

function ImportProduct({products,save,openProduct}:{products:Product[],save:(p:Product[])=>void,openProduct:(p:Product)=>void}) {
 const [url,setUrl]=useState(''); const [loading,setLoading]=useState(false); const [done,setDone]=useState<Product|null>(null)
 const run=()=>{if(!url.includes('gemimports.co.uk'))return;setLoading(true);setTimeout(()=>{const p:Product={...seedProducts[4],id:`gem-${Date.now()}`,title:'GEM Product — Imported Preview',sku:`GE${Math.floor(1000+Math.random()*8999)}`,productUrl:url,importedAt:new Date().toISOString().slice(0,10),updatedAt:'Just now'};save([p,...products]);setDone(p);setLoading(false)},1100)}
 return <><PageTitle eyebrow="Single product import" title="Import from GEM"/>
  <div className="grid lg:grid-cols-[1.3fr_.7fr] gap-4">
   <div className="card p-6 md:p-8"><div className="w-12 h-12 bg-lime/10 text-lime rounded-2xl flex items-center justify-center mb-6"><Zap size={21}/></div><h2 className="heading text-xl font-bold">Paste a GEM Imports URL</h2><p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed">We’ll collect its title, imagery, SKU, trade-lot pricing, availability and description. VAT and unit pricing are calculated automatically.</p>
    <div className="mt-7"><label className="text-[10px] uppercase tracking-[.14em] text-slate-500 font-bold">Product URL</label><div className="mt-2 soft rounded-xl h-12 flex items-center px-4 focus-within:border-lime/40"><ExternalLink size={15} className="text-slate-600"/><input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&run()} className="bg-transparent flex-1 outline-none px-3 text-xs" placeholder="https://www.gemimports.co.uk/product/..."/><button disabled={!url.includes('gemimports.co.uk')||loading} onClick={run} className="bg-lime disabled:opacity-30 text-black rounded-lg px-4 py-2 text-[11px] font-bold">{loading?<RefreshCw size={14} className="animate-spin"/>:'Import'}</button></div></div>
    {done&&<button onClick={()=>openProduct(done)} className="mt-5 w-full text-left border border-emerald-400/20 bg-emerald-400/[.06] rounded-xl p-4 flex items-center gap-3"><div className="w-8 h-8 bg-emerald-400/10 text-emerald-300 rounded-full flex items-center justify-center"><Check size={15}/></div><div><div className="text-xs font-bold">Product imported successfully</div><div className="text-[10px] text-slate-500 mt-1">Open the product to review costs and resale potential.</div></div><ChevronRight className="ml-auto text-emerald-300" size={16}/></button>}
   </div>
   <div className="card p-6"><h3 className="heading font-bold">Automatic calculations</h3><div className="space-y-5 mt-6">{[['VAT rate','20%'],['Unit cost ex VAT','Lot cost ÷ units'],['Unit cost inc VAT','Lot cost × 1.2 ÷ units']].map(([a,b])=><div key={a} className="flex justify-between text-xs border-b border-white/[.05] pb-4"><span className="text-slate-500">{a}</span><span className="font-semibold">{b}</span></div>)}</div><p className="text-[10px] text-slate-600 leading-relaxed mt-5">Pricing snapshots are saved every time a product is re-imported, so increases and decreases remain visible.</p></div>
  </div></>
}

function Planner({products,planner,save}:{products:Product[],planner:PlannerItem[],save:(x:PlannerItem[])=>void}) {
 const lines=planner.map(i=>({i,p:products.find(p=>p.id===i.productId)})).filter(x=>x.p) as {i:PlannerItem,p:Product}[]
 const cost=lines.reduce((s,x)=>s+x.p.lotEx*1.2*x.i.lots,0), revenue=lines.reduce((s,x)=>s+x.p.soldAvg*x.p.units*x.i.lots,0), profit=lines.reduce((s,x)=>s+calc(x.p).lotProfit*x.i.lots,0)
 return <><PageTitle eyebrow="Buying decisions" title="Purchase planner"><span className="text-[11px] text-slate-500">{lines.length} lines selected</span></PageTitle>
  <div className="grid xl:grid-cols-[1.4fr_.6fr] gap-4">
   <div className="card overflow-hidden">{lines.length===0?<div className="p-16 text-center"><ShoppingBag size={30} className="mx-auto text-slate-700"/><h3 className="heading font-bold mt-4">Your purchase list is empty</h3><p className="text-xs text-slate-600 mt-2">Add profitable products from the catalogue.</p></div>:lines.map(({i,p})=><div key={p.id} className="p-4 border-b border-white/[.05] flex items-center gap-3"><img src={p.image} className="w-11 h-11 rounded-xl object-cover"/><div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate">{p.title}</div><div className="text-[10px] text-slate-600 mt-1">{money(p.lotEx*1.2)} per lot · {p.units} units</div></div><div className="soft rounded-lg flex items-center"><button className="px-2 py-1 text-slate-500" onClick={()=>save(planner.map(x=>x.productId===p.id?{...x,lots:Math.max(1,x.lots-1)}:x))}>−</button><span className="w-5 text-center text-xs">{i.lots}</span><button className="px-2 py-1 text-lime" onClick={()=>save(planner.map(x=>x.productId===p.id?{...x,lots:x.lots+1}:x))}>+</button></div><div className="w-20 text-right text-xs font-bold">{money(p.lotEx*1.2*i.lots)}</div><button onClick={()=>save(planner.filter(x=>x.productId!==p.id))} className="text-slate-700 hover:text-rose-400"><Trash2 size={15}/></button></div>)}</div>
   <div className="card p-6 h-fit"><h3 className="heading font-bold">Order summary</h3><div className="space-y-4 mt-6">{[['Cost ex VAT',money(cost/1.2)],['VAT amount',money(cost/6)],['Cost inc VAT',money(cost)],['Expected revenue',money(revenue)]].map(([a,b])=><div key={a} className="flex justify-between text-xs"><span className="text-slate-500">{a}</span><b>{b}</b></div>)}</div><div className="border-t border-white/10 mt-6 pt-5"><div className="text-[10px] text-slate-500 uppercase tracking-wider">Expected profit</div><div className="heading text-3xl font-extrabold text-lime mt-2">{money(profit)}</div><div className="text-[10px] text-slate-500 mt-1">{cost?`${(profit/cost*100).toFixed(1)}% expected ROI`:'Add products to calculate'}</div></div><button disabled={!lines.length} className="w-full mt-6 bg-lime disabled:opacity-30 text-black rounded-xl py-3 text-xs font-bold">Create purchase order</button></div>
  </div></>
}

function ProductDrawer({product,close,addPlanner,save}:{product:Product,close:()=>void,addPlanner:(id:string)=>void,save:(p:Product)=>void}) {
 const [tab,setTab]=useState<'analysis'|'history'|'notes'>('analysis'); const [selling,setSelling]=useState(product.soldAvg); const [fee,setFee]=useState(12.8); const [shipping,setShipping]=useState(3.29); const [note,setNote]=useState(product.note||''); const m=calc(product,selling,fee,.3,shipping,.45)
 const ebay=(sold=false)=>`https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(product.title)}${sold?'&LH_Sold=1&LH_Complete=1':''}`
 return <div className="fixed inset-0 z-50 flex justify-end"><button aria-label="Close product" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={close}/><aside className="relative w-full max-w-[720px] bg-[#0d1015] border-l border-white/10 h-full overflow-y-auto scrollbar">
  <div className="sticky top-0 z-10 bg-[#0d1015]/95 backdrop-blur border-b border-white/[.07] h-16 px-5 flex items-center"><button onClick={close} className="text-slate-500 hover:text-white flex items-center gap-2 text-xs"><ArrowLeft size={16}/>Back to catalogue</button><div className="ml-auto flex gap-2"><a href={ebay()} target="_blank" className="soft rounded-lg px-3 py-2 text-[10px] font-semibold flex gap-2 items-center">eBay search <ExternalLink size={12}/></a><button onClick={()=>addPlanner(product.id)} className="bg-lime text-black rounded-lg px-3 py-2 text-[10px] font-bold flex gap-1 items-center"><Plus size={13}/>Planner</button></div></div>
  <div className="p-5 md:p-7">
   <div className="grid sm:grid-cols-[180px_1fr] gap-6"><img src={product.image} className="w-full aspect-square rounded-2xl object-cover bg-white/5"/><div><div className="flex gap-2"><span className={`text-[9px] px-2 py-1 rounded-md ${categoryColours[product.category]}`}>{product.category}</span><span className={`text-[9px] px-2 py-1 rounded-md ${product.available?'bg-emerald-400/10 text-emerald-300':'bg-rose-400/10 text-rose-300'}`}>{product.available?'In stock':'Out of stock'}</span></div><h2 className="heading font-extrabold text-2xl mt-3 leading-tight">{product.title}</h2><p className="text-[10px] text-slate-600 mt-2">SKU {product.sku} · Imported {product.importedAt}</p><p className="text-xs text-slate-400 mt-4 leading-relaxed">{product.description}</p></div></div>
   <div className="flex gap-5 border-b border-white/[.07] mt-8">{(['analysis','history','notes'] as const).map(t=><button onClick={()=>setTab(t)} className={`text-xs capitalize pb-3 border-b-2 ${tab===t?'text-lime border-lime':'text-slate-500 border-transparent'}`} key={t}>{t}</button>)}</div>
   {tab==='analysis'&&<div className="mt-6 space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{[['Lot ex VAT',money(product.lotEx)],['Lot inc VAT',money(product.lotEx*1.2)],['Units / lot',String(product.units)],['Unit inc VAT',money(m.unit)]].map(([a,b])=><div className="card p-4" key={a}><div className="text-[9px] text-slate-600">{a}</div><div className="heading font-bold text-lg mt-2">{b}</div></div>)}</div>
    <div className="card p-5"><div className="flex justify-between"><div><h3 className="heading font-bold">eBay research</h3><p className="text-[10px] text-slate-600 mt-1">{product.soldCount} sold listings analysed</p></div><a href={ebay(true)} target="_blank" className="text-lime text-[10px] flex items-center gap-1">Sold listings <ExternalLink size={11}/></a></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">{[['Average sold',money(product.soldAvg)],['Highest',money(product.soldHigh)],['Lowest',money(product.soldLow)],['Sell-through',`${product.sellThrough}%`]].map(([a,b])=><div key={a}><div className="text-[9px] text-slate-600">{a}</div><div className="font-bold text-sm mt-1">{b}</div></div>)}</div></div>
    <div className="card p-5"><div className="flex items-center gap-2"><Calculator size={16} className="text-lime"/><h3 className="heading font-bold">Profit calculator</h3><span className="ml-auto text-[9px] text-slate-600">Updates instantly</span></div><div className="grid sm:grid-cols-3 gap-3 mt-5"><Input label="Selling price" value={selling} set={setSelling}/><Input label="eBay fee %" value={fee} set={setFee}/><Input label="Shipping cost" value={shipping} set={setShipping}/></div><div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-5">{[['Profit / unit',money(m.profit)],['Profit / lot',money(m.lotProfit)],['ROI',`${m.roi.toFixed(1)}%`],['Margin',`${m.margin.toFixed(1)}%`],['Net revenue',money(m.net)],['Break-even',money(m.breakEven)]].map(([a,b],i)=><div className={`rounded-xl p-3 ${i<3?'bg-lime/[.06] border border-lime/10':'soft'}`} key={a}><div className="text-[9px] text-slate-600">{a}</div><div className={`font-bold mt-1 ${i<3?'text-lime':''}`}>{b}</div></div>)}</div></div>
   </div>}
   {tab==='history'&&<div className="mt-6 card p-5"><h3 className="heading font-bold">GEM price history</h3><div className="h-56 mt-5"><ResponsiveContainer width="100%" height="100%"><LineChart data={product.history}><CartesianGrid stroke="#20252d" vertical={false}/><XAxis dataKey="date" tick={{fill:'#69727e',fontSize:10}} axisLine={false}/><YAxis tick={{fill:'#69727e',fontSize:10}} axisLine={false}/><Tooltip contentStyle={{background:'#10141a',border:'1px solid #29303a',borderRadius:10}} formatter={(v:number)=>money(v)}/><Line dataKey="lotEx" stroke="#b9f227" strokeWidth={2} dot={{fill:'#b9f227'}}/></LineChart></ResponsiveContainer></div>{product.history.map((h,i)=><div key={h.date} className="flex items-center border-t border-white/[.05] py-3 text-xs"><History size={13} className="text-slate-600 mr-3"/><span>{h.date} 2026</span><span className="ml-auto font-bold">{money(h.lotEx)}</span>{i>0&&(h.lotEx>=product.history[i-1].lotEx?<ArrowUpRight size={13} className="text-rose-400 ml-2"/>:<ArrowDownRight size={13} className="text-emerald-400 ml-2"/>)}</div>)}</div>}
   {tab==='notes'&&<div className="mt-6 card p-5"><h3 className="heading font-bold">Personal product notes</h3><p className="text-[10px] text-slate-600 mt-1">Keep buying context with the product.</p><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Good seller, seasonal, avoid…" className="soft rounded-xl w-full min-h-36 p-4 text-xs outline-none mt-5 focus:border-lime/30"/><button onClick={()=>save({...product,note})} className="bg-lime text-black rounded-lg px-4 py-2.5 font-bold text-[11px] mt-3">Save note</button></div>}
  </div>
 </aside></div>
}

function Input({label,value,set}:{label:string,value:number,set:(n:number)=>void}) {return <label><span className="text-[9px] text-slate-600">{label}</span><div className="soft rounded-lg mt-1 flex items-center px-3"><span className="text-slate-600 text-xs">{label.includes('%')?'%':'£'}</span><input type="number" value={value} step=".01" onChange={e=>set(Number(e.target.value))} className="bg-transparent outline-none py-2 px-2 text-xs w-full"/></div></label>}
