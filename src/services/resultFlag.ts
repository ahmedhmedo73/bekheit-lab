// Only compare unambiguous numeric reference intervals. Narrative/category
// ranges need interpretation and must not be reduced to their first numbers.
const numberPattern = '[+-]?(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?|[+-]?\\.\\d+';
const numeric = `(?:${numberPattern})(?:[eE][+-]?\\d+)?`;
const valuePattern = new RegExp(`^${numeric}$`);
const intervalPattern = new RegExp(`^(${numeric})\\s*(?:-|–|—|to)\\s*(${numeric})$`, 'i');
const limitPattern = new RegExp(`^(<=|>=|<|>|≤|≥|less than|greater than)\\s*(${numeric})$`, 'i');
const asNumber = (value: string) => Number(value.replaceAll(',', ''));

export function resultFlag(value: string | undefined, reference: string | undefined, gender?: string): '' | '↑' | '↓' {
  const input = (value ?? '').trim();
  if (!valuePattern.test(input)) return '';
  const result = asNumber(input);
  if (!Number.isFinite(result)) return '';
  let range = (reference ?? '').replace(/\s*\[Published adult example; lab review required\]\s*$/i, '').trim();
  if (/\b(?:female|male)\b/i.test(range)) {
    if (!/^(female|male)$/i.test(gender ?? '')) return '';
    const pieces = range.split(/[;\n]/).map(part => part.trim());
    const selected = pieces.filter(part => new RegExp(`^${gender}\\b`, 'i').test(part));
    if (selected.length !== 1) return '';
    range = selected[0].replace(/^(female|male)\s*:?\s*/i, '');
  }
  const interval = range.match(intervalPattern);
  if (interval) {
    const low = asNumber(interval[1]), high = asNumber(interval[2]);
    if (!Number.isFinite(low) || !Number.isFinite(high) || low > high) return '';
    return result < low ? '↓' : result > high ? '↑' : '';
  }
  const limit = range.match(limitPattern);
  if (!limit) return '';
  const boundary = asNumber(limit[2]);
  if (!Number.isFinite(boundary)) return '';
  switch (limit[1].toLowerCase()) {
    case '<': case 'less than': return result >= boundary ? '↑' : '';
    case '<=': case '≤': return result > boundary ? '↑' : '';
    case '>': case 'greater than': return result <= boundary ? '↓' : '';
    default: return result < boundary ? '↓' : '';
  }
}

export function flaggedResult(value: string | undefined, reference: string | undefined, gender?: string): string {
  const flag = resultFlag(value, reference, gender);
  return `${value ?? ''}${flag ? ` ${flag}` : ''}`;
}
