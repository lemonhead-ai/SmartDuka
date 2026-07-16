const products = [
  { name: "Unga", price: 120, icon: "🌽" },
  { name: "Chai", price: 80, icon: "🫖" },
  { name: "Mandazi", price: 20, icon: "🥯" },
  { name: "Pencil", price: 15, icon: "✏️" }
];

export function ShopCounter() {
  return <section className="rounded-[2rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-ink/60">Customer at the counter</p><h1 className="text-2xl font-black">Brian wants a snack</h1></div><span className="rounded-xl bg-sky/20 px-3 py-2 text-sm font-black text-ink">KES 200</span></div><p className="mt-5 rounded-2xl bg-cream p-4 text-lg font-bold">“Please give me chai and two mandazi.”</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{products.map((product) => <button key={product.name} className="rounded-2xl border-2 border-transparent bg-cream p-4 text-left transition hover:border-leaf"><span className="text-3xl">{product.icon}</span><p className="mt-3 font-black">{product.name}</p><p className="text-sm text-ink/60">KES {product.price}</p></button>)}</div><div className="mt-6 flex flex-wrap justify-between gap-3 rounded-2xl bg-leaf/10 p-4"><p className="font-bold">Pick the items, then work out the change.</p><button className="rounded-xl bg-leaf px-5 py-3 font-black text-white">Check basket</button></div></section>;
}
