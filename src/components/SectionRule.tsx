import type { ReactNode } from 'react';

interface SectionRuleProps {
  title: string;
  align?: 'center' | 'left';
  accent?: boolean;
  trailing?: ReactNode;
}

export function SectionRule({ title, align = 'center', accent = false, trailing }: SectionRuleProps) {
  if (align === 'left') {
    return (
      <div className="flex items-baseline justify-between gap-3 py-2">
        <span className="micro-label">
          <span className={accent ? 'text-on-surface-accent' : ''}>◆</span> {title}
        </span>
        {trailing && <span className="micro-label">{trailing}</span>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-border-subtle" />
      <span className="micro-label whitespace-nowrap">
        <span className={accent ? 'text-on-surface-accent' : ''}>◆</span>&nbsp;&nbsp;{title}&nbsp;&nbsp;<span className={accent ? 'text-on-surface-accent' : ''}>◆</span>
      </span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  );
}
