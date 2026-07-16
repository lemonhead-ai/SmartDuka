import Link from "next/link";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
};

export function PlaceholderPage({ eyebrow, title, description, icon }: PlaceholderPageProps) {
  return <section className="grid min-h-[65vh] place-items-center"><div className="max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-card"><div className="text-6xl" aria-hidden="true">{icon}</div><p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-ink">{eyebrow}</p><h1 className="mt-2 text-3xl font-black">{title}</h1><p className="mt-3 leading-relaxed text-ink/65">{description}</p><Link href="/dashboard" className="mt-7 inline-block rounded-xl bg-ink px-5 py-3 font-black text-white">Back to dashboard</Link></div></section>;
}
