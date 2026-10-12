// Con Countdown: Home Screen widget for Con Budget Planner.
// 1. Install Scriptable (free) from the App Store.
// 2. Create a new script, name it exactly "Con Countdown", paste this in.
// 3. In the planner, open Money and tap "Update" next to Home Screen widget.
// 4. Long-press your Home Screen, add a Scriptable widget, set Script to Con Countdown.

const fm = FileManager.local();
const path = fm.joinPath(fm.documentsDirectory(), 'con-countdown.json');
const qp = args.queryParameters || {};

if (qp.data) {
  fm.writeString(path, qp.data);
  if (!config.runsInWidget) {
    const a = new Alert();
    a.title = 'Widget updated';
    a.message = 'Your widget will refresh in a moment. Head back to the planner.';
    a.addAction('Done');
    await a.present();
  }
}

let d = null;
try { if (fm.fileExists(path)) d = JSON.parse(fm.readString(path)); } catch (e) {}

const BLUE = new Color('#0066cc');
const WHITE = Color.white();
const SOFT = new Color('#ffffff', 0.72);
const TRACK = new Color('#ffffff', 0.28);

const money = (x, cur) => {
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur || 'EUR', maximumFractionDigits: 0 }).format(Math.round(x)); }
  catch (e) { return Math.round(x) + ' ' + (cur || ''); }
};

const bar = (pct, w, h) => {
  const c = new DrawContext();
  c.size = new Size(w, h); c.opaque = false; c.respectScreenScale = true;
  const t = new Path(); t.addRoundedRect(new Rect(0, 0, w, h), h / 2, h / 2);
  c.addPath(t); c.setFillColor(TRACK); c.fillPath();
  const f = new Path(); f.addRoundedRect(new Rect(0, 0, Math.max(h, w * Math.min(1, pct)), h), h / 2, h / 2);
  c.addPath(f); c.setFillColor(WHITE); c.fillPath();
  return c.getImage();
};

const txt = (stack, s, size, weight, color) => {
  const t = stack.addText(s);
  t.font = weight === 'bold' ? Font.boldSystemFont(size) : weight === 'semi' ? Font.semiboldSystemFont(size) : Font.systemFont(size);
  t.textColor = color; t.lineLimit = 1; t.minimumScaleFactor = 0.6;
  return t;
};

const w = new ListWidget();
w.backgroundColor = BLUE;
w.setPadding(14, 14, 14, 14);
w.refreshAfterDate = new Date(Date.now() + 60 * 60 * 1000);

if (!d) {
  txt(w, 'Con Countdown', 15, 'semi', WHITE);
  w.addSpacer(6);
  txt(w, 'Open the planner, go to Money and tap Update.', 13, '', SOFT).lineLimit = 3;
} else {
  if (d.u) w.url = d.u;
  const start = new Date(d.s + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.ceil((start - today) / 86400000);
  const pct = d.tp > 0 ? d.sv / d.tp : 1;
  const ym = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  const m = (d.m || []).find(r => r[0] === ym) || (d.m || []).find(r => r[0] > ym);
  const medium = config.widgetFamily === 'medium' || (!config.runsInWidget);

  const row = w.addStack(); row.layoutHorizontally();
  const left = row.addStack(); left.layoutVertically();

  const top = left.addStack(); top.layoutHorizontally(); top.centerAlignContent();
  const paw = top.addImage(SFSymbol.named('pawprint.fill').image);
  paw.imageSize = new Size(14, 14); paw.tintColor = WHITE;
  top.addSpacer(5);
  txt(top, d.n || 'My con', 13, 'semi', WHITE);

  left.addSpacer();
  txt(left, days > 0 ? String(days) : days === 0 ? 'Today' : 'Done', 40, 'bold', WHITE);
  txt(left, days === 1 ? 'day to go' : days > 0 ? 'days to go' : days === 0 ? 'con starts' : 'con is over', 13, 'semi', SOFT);
  left.addSpacer(8);
  left.addImage(bar(pct, medium ? 130 : 120, 6));
  left.addSpacer(4);
  txt(left, money(d.sv, d.c) + ' of ' + money(d.tp, d.c), 12, '', SOFT);

  if (medium && m) {
    row.addSpacer();
    const right = row.addStack(); right.layoutVertically();
    right.backgroundColor = new Color('#ffffff', 0.16);
    right.cornerRadius = 14; right.setPadding(10, 12, 10, 12);
    txt(right, m[0] === ym ? 'This month' : 'Next month', 12, 'semi', SOFT);
    right.addSpacer(4);
    txt(right, money(m[2], d.c), 22, 'bold', WHITE);
    txt(right, 'of ' + money(m[1], d.c), 12, '', SOFT);
    right.addSpacer();
    const leftToGo = Math.max(0, m[1] - m[2]);
    txt(right, leftToGo > 0 ? money(leftToGo, d.c) + ' to put away' : 'Target reached', 12, 'semi', WHITE);
  }
}

if (config.runsInWidget) Script.setWidget(w);
else if (!qp.data) await w.presentMedium();
Script.complete();
