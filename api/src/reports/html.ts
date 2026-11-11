// The report as a self-contained, print-styled HTML document (A4), rendered to PDF
// by pdf.ts. Bilingual: labels come from a small dictionary keyed by locale. All
// dynamic text is HTML-escaped so a template or department name cannot inject markup.
import type { Locale } from '@prisma/client';
import type { ReportData } from './data.js';

const LABELS = {
  en: {
    title: 'Phishing Simulation Report',
    org: 'Organisation',
    campaign: 'Campaign',
    generated: 'Generated',
    summary: 'Summary',
    funnel: 'Campaign funnel',
    byDepartment: 'By department',
    department: 'Department',
    recipients: 'Recipients',
    sent: 'Sent',
    opened: 'Opened',
    clicked: 'Clicked',
    submitted: 'Submitted',
    reported: 'Reported',
    trained: 'Trained',
    guaranteeTitle: 'Defensive by design',
    guarantee:
      'No submitted data is ever stored — only that a form was submitted, plus technical metadata.',
  },
  tr: {
    title: 'Oltalama Simülasyonu Raporu',
    org: 'Kurum',
    campaign: 'Kampanya',
    generated: 'Oluşturulma',
    summary: 'Özet',
    funnel: 'Kampanya hunisi',
    byDepartment: 'Departmana göre',
    department: 'Departman',
    recipients: 'Alıcılar',
    sent: 'Gönderildi',
    opened: 'Açıldı',
    clicked: 'Tıkladı',
    submitted: 'Veri girdi',
    reported: 'Bildirdi',
    trained: 'Eğitildi',
    guaranteeTitle: 'Tasarımı gereği savunma odaklı',
    guarantee:
      'Girilen hiçbir veri saklanmaz — yalnızca bir formun gönderildiği bilgisi ve teknik üstveri tutulur.',
  },
} as const;

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

const ACCENT = '#4f46e5';

export function renderReportHtml(data: ReportData, locale: Locale): string {
  const L = LABELS[locale];
  const f = data.funnel;
  const pct = (n: number) => (f.total > 0 ? Math.round((n / f.total) * 100) : 0);

  const stages: { label: string; value: number; color: string }[] = [
    { label: L.sent, value: f.sent, color: '#64748b' },
    { label: L.opened, value: f.opened, color: '#eab308' },
    { label: L.clicked, value: f.clicked, color: '#ea580c' },
    { label: L.submitted, value: f.submitted, color: '#dc2626' },
  ];

  const card = (label: string, value: string) =>
    `<div class="card"><div class="num">${value}</div><div class="lbl">${esc(label)}</div></div>`;

  const funnelRows = stages
    .map(
      (s) => `<div class="frow">
        <div class="flabel">${esc(s.label)}</div>
        <div class="fbar"><div class="ffill" style="width:${pct(s.value)}%;background:${s.color}"></div></div>
        <div class="fval">${s.value} · ${pct(s.value)}%</div>
      </div>`,
    )
    .join('');

  const deptRows = data.byDepartment
    .map(
      (d) => `<tr>
        <td>${esc(d.department)}</td>
        <td>${d.total}</td>
        <td>${d.sent}</td>
        <td style="color:#ea580c">${d.clicked}</td>
        <td style="color:#dc2626">${d.submitted}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; }
  .head { border-bottom: 3px solid ${ACCENT}; padding-bottom: 12px; margin-bottom: 20px; }
  .head h1 { margin: 0 0 4px; font-size: 22px; }
  .head .meta { color: #64748b; font-size: 12px; }
  h2 { font-size: 14px; margin: 24px 0 10px; }
  .cards { display: flex; gap: 10px; }
  .card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .card .num { font-size: 22px; font-weight: 700; }
  .card .lbl { color: #64748b; font-size: 11px; }
  .frow { display: grid; grid-template-columns: 110px 1fr 90px; align-items: center; gap: 10px; margin-bottom: 8px; }
  .flabel { font-size: 12px; }
  .fbar { height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
  .ffill { height: 100%; }
  .fval { font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
  th { color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
  .note { margin-top: 24px; border-left: 3px solid ${ACCENT}; background: #eef2ff; padding: 10px 12px; border-radius: 4px; font-size: 11px; }
  .note strong { display: block; margin-bottom: 2px; }
  .foot { margin-top: 28px; color: #94a3b8; font-size: 10px; text-align: center; }
</style>
</head>
<body>
  <div class="head">
    <h1>${esc(L.title)}</h1>
    <div class="meta">${esc(L.org)}: <strong>${esc(data.orgName)}</strong> · ${esc(L.campaign)}: ${esc(data.campaignName)} · ${esc(L.generated)}: ${data.generatedAt.toISOString().slice(0, 10)}</div>
  </div>

  <h2>${esc(L.summary)}</h2>
  <div class="cards">
    ${card(L.recipients, String(f.total))}
    ${card(L.clicked, `${f.clicked} · ${pct(f.clicked)}%`)}
    ${card(L.submitted, `${f.submitted} · ${pct(f.submitted)}%`)}
    ${card(L.reported, String(f.reported))}
    ${card(L.trained, String(data.trainedCount))}
  </div>

  <h2>${esc(L.funnel)}</h2>
  ${funnelRows}

  <h2>${esc(L.byDepartment)}</h2>
  <table>
    <thead><tr><th>${esc(L.department)}</th><th>${esc(L.recipients)}</th><th>${esc(L.sent)}</th><th>${esc(L.clicked)}</th><th>${esc(L.submitted)}</th></tr></thead>
    <tbody>${deptRows || `<tr><td colspan="5" style="color:#94a3b8">—</td></tr>`}</tbody>
  </table>

  <div class="note">
    <strong>${esc(L.guaranteeTitle)}</strong>
    ${esc(L.guarantee)}
  </div>

  <div class="foot">Baitward</div>
</body>
</html>`;
}
