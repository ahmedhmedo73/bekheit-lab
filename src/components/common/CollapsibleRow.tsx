import { Children, cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import { Icons } from './Icons';

type Cell = ReactElement<{ children?: ReactNode; className?: string }>;

export function CollapsibleRow({ children, summary, primaryCell = 0, className = '' }: { children: ReactNode; summary: ReactNode; primaryCell?: number; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const cells = Children.toArray(children);
  return <tr className={className} data-expanded={expanded} data-primary-cell={primaryCell}>
    {cells.map((cell, index) => {
      if (index !== primaryCell || !isValidElement(cell)) return cell;
      const element = cell as Cell;
      return cloneElement(element, {
        className: `${element.props.className ?? ''} mobile-row-primary`.trim(),
        children: <>
          <div className="mobile-row-original">{element.props.children}</div>
          <span className="mobile-row-heading">{summary}</span>
          <button type="button" className="mobile-row-toggle" aria-label={`${expanded ? 'Collapse' : 'Expand'} ${typeof summary === 'string' ? summary : 'row'} details`} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><Icons.ChevronDown size={18} /></button>
        </>,
      });
    })}
  </tr>;
}
