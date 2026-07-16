type ProgressBarProps = { value: number; label: string; tone?: "leaf" | "mango" | "sky" };

const tones = { leaf: "bg-ink", mango: "bg-muted", sky: "bg-accent" };

export function ProgressBar({ value, label, tone = "leaf" }: ProgressBarProps) {
  const progress = Math.max(0, Math.min(100, value));
  return <div className="space-y-2"><div className="flex justify-between text-sm font-medium"><span>{label}</span><span>{progress}%</span></div><div className="h-3 overflow-hidden rounded-full bg-line"><div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${progress}%` }} /></div></div>;
}
