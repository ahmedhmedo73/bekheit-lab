import { flaggedResult } from './resultFlag.ts';
import type { Patient } from '../types/patient';
import type { AnalyticResult, ChildAnalyticResult } from '../types/analyticType';

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

export function latestPanelResults(results: AnalyticResult[]): AnalyticResult[] {
  const latest = new Map<string, AnalyticResult>();
  for (const result of results) {
    const previous = latest.get(result.analyticTypeId);
    if (!previous || (result.createdAt ?? '') > (previous.createdAt ?? '')) latest.set(result.analyticTypeId, result);
  }
  return [...latest.values()];
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-GB', { timeZone: 'Africa/Cairo' });
}

function renderResultTables(children: ChildAnalyticResult[], panelName: string, gender?: string): string {
  const groups: { name: string; differential: boolean; children: ChildAnalyticResult[] }[] = [];
  for (const child of children) {
    const name = child.section || panelName;
    const differential = child.resultType === 'differential';
    const last = groups[groups.length - 1];
    if (last && last.name === name && last.differential === differential) last.children.push(child);
    else groups.push({ name, differential, children: [child] });
  }
  return groups.map(group => {
    if (group.differential) return `<table class="results differential" aria-label="${escapeHtml(group.name)}">
      <colgroup><col style="width:32%"><col style="width:14%"><col style="width:18%"><col style="width:16%"><col style="width:20%"></colgroup>
      <thead><tr class="section-heading"><th colspan="5">${escapeHtml(group.name)}</th></tr>
      <tr><th rowspan="2">Test</th><th colspan="2">Relative Count</th><th colspan="2">Absolute Count</th></tr>
      <tr><th>Result</th><th>Ref. Range</th><th>Result</th><th>Ref. Range</th></tr></thead>
      <tbody>${group.children.map(child => `<tr><td class="test-name">${escapeHtml(child.name)}</td><td class="value">${escapeHtml(flaggedResult(child.result, child.referenceRange, gender))} ${escapeHtml(child.unit)}</td><td class="range">${escapeHtml(child.referenceRange || '—')}</td><td class="value">${child.absoluteEnabled ? `${escapeHtml(flaggedResult(child.absoluteResult, child.absoluteReferenceRange, gender) || '—')} ${escapeHtml(child.absoluteUnit || '')}` : '—'}</td><td class="range">${child.absoluteEnabled ? escapeHtml(child.absoluteReferenceRange || '—') : '—'}</td></tr>`).join('')}</tbody></table>`;
    return `<table class="results" aria-label="${escapeHtml(group.name)} results">
      <colgroup><col style="width:36%"><col style="width:3%"><col style="width:17%"><col style="width:15%"><col style="width:29%"></colgroup>
      <thead><tr><th>Test</th><th></th><th>Result</th><th>Unit</th><th>Reference Range</th></tr><tr class="section-heading"><th colspan="5">${escapeHtml(group.name)}</th></tr></thead>
      <tbody>${group.children.map(child => `<tr><td class="test-name">${escapeHtml(child.name)}</td><td class="separator">:</td><td class="value">${escapeHtml(flaggedResult(child.result, child.referenceRange, gender))}</td><td>${escapeHtml(child.unit || '—')}</td><td class="range">${escapeHtml(child.referenceRange || '—')}</td></tr>`).join('')}</tbody></table>`;
  }).join('');
}

export function buildAnalyticReport(patient: Patient, results: AnalyticResult[]): string {
  const panels = latestPanelResults(results);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lab Report — ${escapeHtml(patient.name)}</title>
<style>
  @page { size: A4 portrait; margin: 15mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #000; background: white; font-family: "Times New Roman", Times, serif; }
  .report-page { min-height: 267mm; display: flex; flex-direction: column; break-after: page; }
  .report-page:last-child { break-after: auto; }
  .lab-name { font-size: 15pt; text-align: center; letter-spacing: 1px; margin: 0 0 2mm; }
  .lab-subtitle { text-align: center; font-size: 9pt; margin: 0 0 9mm; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .patient-info { font-size: 9pt; margin-bottom: 6mm; }
  .patient-info th, .patient-info td { border: 0.3pt solid #aaa; padding: 1mm 1.5mm; text-align: left; overflow-wrap: anywhere; }
  .patient-info th { width: 17%; }
  .patient-info td { width: 33%; font-weight: bold; }
  .panel-title { margin: 0; padding: 3mm 0 4mm; border-top: 0.7pt solid #000; font-size: 14pt; text-align: center; text-decoration: underline; }
  .results th { text-align: left; font-size: 11pt; padding: 0 1.5mm 5mm; }
  .results td { padding: 1.2mm 1.5mm; vertical-align: top; font-family: Arial, sans-serif; font-size: 9pt; overflow-wrap: anywhere; white-space: pre-wrap; }
  .results .group td { font-weight: bold; text-decoration: underline; padding-bottom: 2mm; }
  .results .test-name, .results .value { font-weight: bold; }
  .results .separator { text-align: center; }
  .results .range { font-size: 8pt; line-height: 1.35; }
  .results { margin-bottom: 4mm; }
  .results th { padding-bottom: 2mm; }
  .results .section-heading th { padding-top: 2mm; text-decoration: underline; font-size: 10pt; }
  .differential { border-top: 0.7pt solid #000; }
  .differential th:not(:first-child) { text-align: center; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  .notes { font-size: 9pt; white-space: pre-wrap; margin: 5mm 1.5mm; overflow-wrap: anywhere; }
  .rule { border: 0; border-top: 0.7pt solid #000; margin: 6mm 0 0; }
  .signatures { margin-top: auto; padding: 20mm 12mm 5mm; display: flex; justify-content: space-between; font-size: 11pt; font-weight: bold; font-style: italic; break-inside: avoid; }
  @media screen { body { background: #eee; padding: 20px; } .report-page { width: 210mm; min-height: 297mm; padding: 15mm 12mm; margin: 0 auto 20px; background: white; box-shadow: 0 1px 8px #ccc; } }
</style></head><body>
${panels.map(result => {
  const children = result.children ?? [{ id: 'legacy', name: result.analyticTypeName, result: result.result, unit: '', referenceRange: '' }];
  return `<section class="report-page">
    <header><p class="lab-subtitle">Clinical Pathology — Laboratory Report</p></header>
    <table class="patient-info" aria-label="Patient details"><tbody>
      <tr><th>Name</th><td dir="auto">${escapeHtml(patient.name)}</td><th>Patient ID</th><td>${escapeHtml(patient.patientId)}</td></tr>
      <tr><th>Sex</th><td>${escapeHtml(patient.gender || '—')}</td><th>Age</th><td>${escapeHtml(patient.age)} Y</td></tr>
      <tr><th>Request ID</th><td>${escapeHtml(result.id)}</td><th>Registration Date</th><td>${escapeHtml(formatDate(patient.createdAt || patient.registeredDate))}</td></tr>
      <tr><th>Phone</th><td>${escapeHtml(patient.phone || '—')}</td><th>Reporting Date</th><td>${escapeHtml(formatDate(result.createdAt))}</td></tr>
    </tbody></table>
    <h2 class="panel-title">${escapeHtml(result.analyticTypeName)}</h2>
    ${renderResultTables(children, result.analyticTypeName, patient.gender)}
    ${result.generalComment ? `<p class="notes"><strong>General Comment:</strong> ${escapeHtml(result.generalComment)}</p>` : ''}
    ${result.notes ? `<p class="notes"><strong>Notes:</strong> ${escapeHtml(result.notes)}</p>` : ''}
    <hr class="rule"><footer class="signatures"><span>Lab Manager</span><span>Signature</span></footer>
  </section>`;
}).join('')}
</body></html>`;
}
