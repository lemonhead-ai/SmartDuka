import React from "react";
import { BookOpen01Icon } from "hugeicons-react";

interface CbcBadgeProps {
  gradeLevel?: string;
  subStrand?: string;
  competencyId?: string;
}

export function CbcBadge({
  gradeLevel = "Grade 2",
  subStrand = "1.3 Currency & Change Math",
  competencyId = "CBC-MATH-G2-01",
}: CbcBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent border border-accent/20"
      title={`KICD Competency: ${competencyId}`}
    >
      <BookOpen01Icon size={14} className="shrink-0" />
      <span>
        {gradeLevel} CBC: <span className="font-normal text-ink/80">{subStrand}</span>
      </span>
    </div>
  );
}
