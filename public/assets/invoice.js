// ── Surat Penawaran / Invoice Generator (PT SAHOHA MULTISTRADA SEJAHTERA) ──
// Dipanggil dari admin.html renderTab('invoice'). Load jsPDF dari CDN saat download.

window.INV = {
  items: [],
  company: {
    name: 'PT SAHOHA MULTISTRADA SEJAHTERA',
    address: 'Gedung Sahoha Multistrada Sejahtera, Jl. Raya Industri No. 1, Jakarta Barat, DKI Jakarta',
    phone: '0813-9419-1904',
    email: 'sahoha.multistrada@gmail.com',
    director: 'Winardiyanto'
  },
  doc: { type: 'SURAT PENAWARAN', no: '', date: '', valid: '14 hari' },
  cust: { name: '', address: '', phone: '', email: '' },
  discPct: 0,
  ppnPct: 0,
  banks: [],        // dari /api/payment-methods/all (type=bank, is_active)
  selBanks: [],     // id bank yang dipilih untuk tampil di dokumen
  notes: 'Pembayaran dilakukan via transfer ke rekening perusahaan.\nHarga belum termasuk ongkos kirim.\nPenawaran berlaku sesuai masa berlaku di atas.'
};

INV.load = function () {
  try {
    const s = JSON.parse(localStorage.getItem('inv_state') || 'null');
    if (s) { this.company = Object.assign(this.company, s.company || {}); this.doc = Object.assign(this.doc, s.doc || {}); this.cust = Object.assign(this.cust, s.cust || {}); this.discPct = s.discPct || 0; this.ppnPct = s.ppnPct || 0; this.notes = s.notes || this.notes; if (Array.isArray(s.items)) this.items = s.items; }
  } catch (e) { /* abaikan */ }
  if (!this.items.length) this.items = [{ desc: '', qty: 1, price: 0 }];
};

INV.save = function () {
  try { localStorage.setItem('inv_state', JSON.stringify({ company: this.company, doc: this.doc, cust: this.cust, discPct: this.discPct, ppnPct: this.ppnPct, notes: this.notes, items: this.items, selBanks: this.selBanks })); } catch (e) { /* abaikan */ }
};

// Muat rekening bank dari pengaturan pembayaran (tab Pembayaran di admin)
INV._loadBanks = function () {
  const self = this;
  if (typeof api !== 'function') return; // tidak di halaman admin
  api('GET', '/api/payment-methods/all').then(list => {
    self.banks = (list || []).filter(m => m.type === 'bank' && m.is_active);
    // seleksi default: semua bank aktif yang belum pernah dipilih
    if (!self.selBanks.length) self.selBanks = self.banks.map(b => b.id);
    self._renderBanks();
    self.upd();
  }).catch(() => { const el = document.getElementById('inv-bank-list'); if (el) el.innerHTML = '<span style="color:var(--red)">Gagal memuat rekening.</span>'; });
};

INV._renderBanks = function () {
  const el = document.getElementById('inv-bank-list');
  if (!el) return;
  if (!this.banks.length) { el.innerHTML = '<span style="color:var(--muted)">Belum ada rekening aktif di Pengaturan → Pembayaran.</span>'; return; }
  el.innerHTML = this.banks.map(b => `
    <label style="display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;background:#fff">
      <input type="checkbox" ${this.selBanks.includes(b.id) ? 'checked' : ''} onchange="INV.toggleBank('${b.id}', this.checked)" style="margin-top:2px">
      <span><b style="color:var(--dark)">${this.esc(b.label)}</b>${b.account_name ? ' · a.n. ' + this.esc(b.account_name) : ''}<br>
      <span style="color:var(--gold);font-weight:700">${this.esc(b.account_number) || ''}</span></span>
    </label>`).join('');
};

INV.toggleBank = function (id, on) {
  this.selBanks = this.selBanks.filter(x => x !== id);
  if (on) this.selBanks.push(id);
  this.save(); this.upd();
};

INV.selectedBanks = function () {
  return this.banks.filter(b => this.selBanks.includes(b.id));
};

INV.bankText = function () {
  const bs = this.selectedBanks();
  if (!bs.length) return '';
  return 'Pembayaran via transfer ke:\n' + bs.map(b => (b.label ? b.label + ' ' : '') + (b.account_number || '') + (b.account_name ? ' a.n. ' + b.account_name : '')).join('\n');
};

INV._bankPreviewHtml = function () {
  const bs = this.selectedBanks();
  if (!bs.length) return '';
  return `<div class="notes" style="margin-top:8px"><b>Pembayaran</b><br>` + bs.map(b => this.esc((b.label ? b.label + ' ' : '') + (b.account_number || '') + (b.account_name ? ' a.n. ' + b.account_name : ''))).join('<br>') + `</div>`;
};

INV.esc = function (s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

INV.rp = function (n) {
  return 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
};

INV.fmtDate = function (iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

INV.genNo = function () {
  const d = new Date();
  const y = d.getFullYear();
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  const seq = String(1 + Math.floor(Math.random() * 900) + 99); // 3 digit
  return 'SP/' + y + '/' + m + '/' + seq;
};

INV.totals = function () {
  let sub = 0;
  this.items.forEach(it => { sub += (it.qty || 0) * (it.price || 0); });
  const disc = sub * (this.discPct / 100);
  const afterDisc = sub - disc;
  const ppn = afterDisc * (this.ppnPct / 100);
  const total = afterDisc + ppn;
  return { sub, disc, afterDisc, ppn, total };
};

INV.render = function (c) {
  const self = this;
  this.load();
  if (!this.doc.no) this.doc.no = this.genNo();
  if (!this.doc.date) this.doc.date = new Date().toISOString().slice(0, 10);

  c.innerHTML = `
  <style>
  .inv-wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start}
  .inv-form{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:18px}
  .inv-form h3{margin:14px 0 8px;font-size:12px;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border);padding-bottom:6px}
  .inv-form h3:first-child{margin-top:0}
  .inv-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .inv-row .full{grid-column:1/-1}
  .inv-field{margin-bottom:8px}
  .inv-field label{display:block;font-size:11px;font-weight:700;color:var(--mid);margin-bottom:3px}
  .inv-field input,.inv-field select,.inv-field textarea{width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:#fff}
  .inv-field input:focus,.inv-field select:focus,.inv-field textarea:focus{border-color:var(--gold);outline:none}
  .inv-item-head{display:grid;grid-template-columns:3fr 70px 110px 30px;gap:6px;font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:4px}
  .inv-item{display:grid;grid-template-columns:3fr 70px 110px 30px;gap:6px;margin-bottom:6px}
  .inv-item .x{background:none;border:none;color:var(--red);font-size:18px;cursor:pointer;line-height:1;padding:0}
  .inv-btn-add{margin-top:4px;padding:6px 12px;font-size:12px;font-weight:700;background:var(--gold-light);color:var(--gold);border:1px solid var(--border);border-radius:8px;cursor:pointer}
  .inv-sum{background:var(--gold-light);border-radius:10px;padding:10px 12px;margin-top:10px;font-size:13px}
  .inv-sum div{display:flex;justify-content:space-between;padding:2px 0}
  .inv-sum .tot{font-weight:900;font-size:15px;color:var(--red);border-top:1px solid var(--border);margin-top:4px;padding-top:6px}
  .inv-actions{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
  .inv-btn{flex:1;min-width:140px;padding:10px 14px;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-family:var(--font)}
  .inv-btn.dl{background:linear-gradient(135deg,#1E3A5F 0%,#0F1B2D 100%);color:#fff}
  .inv-btn.pr{background:#fff;color:var(--gold);border:1px solid var(--gold)}
  .inv-btn:disabled{opacity:.6;cursor:wait}
  .inv-prev{background:#fff;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
  .inv-prev-bar{padding:10px 16px;background:var(--gold-light);border-bottom:1px solid var(--border);font-size:12px;font-weight:800;color:var(--gold);display:flex;justify-content:space-between;align-items:center}
  .inv-page{background:#fff;padding:28px;font-family:'Times New Roman',Georgia,serif;color:#111;min-height:700px;max-height:85vh;overflow-y:auto;font-size:12px;line-height:1.55}
  .inv-page .co-head{text-align:center;border-bottom:2.5px solid #1E3A5F;padding-bottom:10px;margin-bottom:12px}
  .inv-page .co-name{font-size:19px;font-weight:900;letter-spacing:.5px;color:#1E3A5F}
  .inv-page .co-sub{font-size:10.5px;color:#555;margin-top:3px}
  .inv-page .doc-title{text-align:center;font-size:15px;font-weight:900;margin:10px 0 8px;letter-spacing:2px}
  .inv-page table{width:100%;border-collapse:collapse;font-size:10.5px}
  .inv-page .meta{width:100%;margin-bottom:8px}
  .inv-page .meta td{border:none;padding:1px 0;font-size:10.5px;vertical-align:top}
  .inv-page .meta .k{font-weight:700;width:90px}
  .inv-page table.tb th{background:#1E3A5F;color:#fff;font-size:10px;padding:5px 7px;text-align:left;border:1px solid #1E3A5F}
  .inv-page table.tb td{border:1px solid #ccc;padding:5px 7px;font-size:10px;vertical-align:top}
  .inv-page table.tb .r{text-align:right}
  .inv-page table.tb .c{text-align:center}
  .inv-page .tot-line{display:flex;justify-content:flex-end;margin-top:6px}
  .inv-page .tot-box{width:250px;font-size:10.5px}
  .inv-page .tot-box div{display:flex;justify-content:space-between;padding:2px 4px}
  .inv-page .tot-box .grand{font-weight:900;font-size:12px;background:#1E3A5F;color:#fff;padding:5px 8px;border-radius:4px;margin-top:2px}
  .inv-page .notes{margin-top:10px;font-size:10px;color:#444;background:#f7f7f7;border-radius:6px;padding:8px 10px;white-space:pre-line}
  .inv-page .sign{display:flex;justify-content:flex-end;margin-top:34px}
  .inv-page .sign .box{text-align:center;font-size:10.5px}
  .inv-page .sign .line{width:180px;border-top:1px solid #333;margin-top:44px;padding-top:4px;font-weight:700}
  .inv-page .sign .role{font-size:9.5px;color:#555}
  .inv-page .foot-note{text-align:center;font-size:8.5px;color:#999;margin-top:26px;border-top:1px solid #eee;padding-top:6px}
  @media(max-width:1100px){.inv-wrap{grid-template-columns:1fr}}
  </style>

  <div class="inv-wrap">
    <div class="inv-form">
      <h3>Data Perusahaan</h3>
      <div class="inv-field"><label>Nama Perusahaan</label><input id="inv-cname" value="${this.esc(this.company.name)}"></div>
      <div class="inv-field"><label>Alamat</label><textarea id="inv-caddr" rows="2">${this.esc(this.company.address)}</textarea></div>
      <div class="inv-row">
        <div class="inv-field"><label>Telepon</label><input id="inv-cphone" value="${this.esc(this.company.phone)}"></div>
        <div class="inv-field"><label>Email</label><input id="inv-cemail" value="${this.esc(this.company.email)}"></div>
      </div>
      <div class="inv-field"><label>Nama Direktur / Penandatangan</label><input id="inv-cdir" value="${this.esc(this.company.director)}"></div>

      <h3>Data Dokumen</h3>
      <div class="inv-row">
        <div class="inv-field"><label>Jenis</label><select id="inv-dtype">
          <option value="SURAT PENAWARAN">SURAT PENAWARAN</option>
          <option value="INVOICE">INVOICE</option>
          <option value="SURAT PENAWARAN & INVOICE">SURAT PENAWARAN & INVOICE</option>
        </select></div>
        <div class="inv-field"><label>No. Dokumen</label><input id="inv-dno" value="${this.esc(this.doc.no)}"></div>
        <div class="inv-field"><label>Tanggal</label><input id="inv-ddate" type="date" value="${this.esc(this.doc.date)}"></div>
        <div class="inv-field"><label>Masa Berlaku</label><input id="inv-dvalid" value="${this.esc(this.doc.valid)}"></div>
      </div>

      <h3>Kepada Yth. (Pembeli)</h3>
      <div class="inv-field"><label>Nama / Perusahaan</label><input id="inv-kname" value="${this.esc(this.cust.name)}" placeholder="Nama customer / instansi"></div>
      <div class="inv-field"><label>Alamat</label><textarea id="inv-kaddr" rows="2" placeholder="Alamat lengkap">${this.esc(this.cust.address)}</textarea></div>
      <div class="inv-row">
        <div class="inv-field"><label>Telepon</label><input id="inv-kphone" value="${this.esc(this.cust.phone)}"></div>
        <div class="inv-field"><label>Email</label><input id="inv-kemail" value="${this.esc(this.cust.email)}"></div>
      </div>

      <h3>Item Penawaran</h3>
      <div class="inv-item-head"><span>Deskripsi Item</span><span>Qty</span><span>Harga Satuan</span><span></span></div>
      <div id="inv-items"></div>
      <button class="inv-btn-add" onclick="INV.addItem()">+ Tambah Item</button>

      <div class="inv-sum">
        <div><span>Subtotal</span><span id="inv-s-sub">${this.rp(0)}</span></div>
        <div><span>Diskon (<input id="inv-disc" type="number" min="0" max="100" value="${this.discPct}" style="width:48px;padding:2px 4px;border:1px solid var(--border);border-radius:5px">%)</span><span id="inv-s-disc">-${this.rp(0)}</span></div>
        <div><span>PPN (<input id="inv-ppn" type="number" min="0" max="100" value="${this.ppnPct}" style="width:48px;padding:2px 4px;border:1px solid var(--border);border-radius:5px">%)</span><span id="inv-s-ppn">${this.rp(0)}</span></div>
        <div class="tot"><span>TOTAL</span><span id="inv-s-tot">${this.rp(0)}</span></div>
      </div>
      <div class="inv-field" style="margin-top:10px"><label>Catatan / Ketentuan</label><textarea id="inv-notes" rows="4">${this.esc(this.notes)}</textarea></div>

      <h3>Pembayaran (Rekening)</h3>
      <div id="inv-bank-list" style="font-size:12px;color:var(--mid)">Memuat data rekening...</div>

      <div class="inv-actions">
        <button class="inv-btn dl" id="inv-dl" onclick="INV.dl()">⬇ Download PDF</button>
        <button class="inv-btn pr" onclick="INV.prn()">🖨 Print</button>
      </div>
    </div>

    <div class="inv-prev">
      <div class="inv-prev-bar"><span>Preview</span><span style="font-weight:400;font-size:11px">Update otomatis</span></div>
      <div class="inv-page" id="inv-page"></div>
    </div>
  </div>`;

  // set select value
  const sel = document.getElementById('inv-dtype');
  if (sel) sel.value = this.doc.type;

  // render item rows
  this.items.forEach((it, i) => this._itemRow(i, it));

  // bind events (real-time update)
  ['inv-cname','inv-caddr','inv-cphone','inv-cemail','inv-cdir','inv-dno','inv-ddate','inv-dvalid','inv-kname','inv-kaddr','inv-kphone','inv-kemail','inv-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { self.sync(); self.upd(); });
  });
  const dsel = document.getElementById('inv-dtype');
  if (dsel) dsel.addEventListener('change', () => { self.doc.type = dsel.value; self.save(); self.upd(); });
  const ddisc = document.getElementById('inv-disc');
  if (ddisc) ddisc.addEventListener('input', () => { self.discPct = parseFloat(ddisc.value) || 0; self.save(); self.upd(); });
  const dppn = document.getElementById('inv-ppn');
  if (dppn) dppn.addEventListener('input', () => { self.ppnPct = parseFloat(dppn.value) || 0; self.save(); self.upd(); });

  this.upd();
  this._loadBanks();
};

INV._itemRow = function (i, it) {
  const self = this;
  const wrap = document.getElementById('inv-items');
  if (!wrap) return;
  const row = document.createElement('div');
  row.className = 'inv-item';
  row.dataset.idx = i;
  row.innerHTML = `
    <input id="inv-i-d${i}" placeholder="Contoh: Digital Clamp Meter Fluke 376" value="${this.esc(it.desc)}">
    <input id="inv-i-q${i}" type="number" min="1" value="${it.qty || 1}">
    <input id="inv-i-p${i}" type="number" min="0" step="500" value="${it.price || 0}">
    <button class="x" title="Hapus" onclick="INV.delItem(${i})">×</button>`;
  row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => {
    self.items[i] = { desc: document.getElementById('inv-i-d' + i).value, qty: parseFloat(document.getElementById('inv-i-q' + i).value) || 0, price: parseFloat(document.getElementById('inv-i-p' + i).value) || 0 };
    self.save(); self.upd();
  }));
  wrap.appendChild(row);
};

INV.addItem = function () {
  this.items.push({ desc: '', qty: 1, price: 0 });
  this._itemRow(this.items.length - 1, this.items[this.items.length - 1]);
  this.save(); this.upd();
};

INV.delItem = function (i) {
  this.items.splice(i, 1);
  const wrap = document.getElementById('inv-items');
  if (wrap) wrap.innerHTML = '';
  this.items.forEach((it, j) => this._itemRow(j, it));
  this.save(); this.upd();
};

INV.sync = function () {
  this.company.name = Gv('inv-cname') || this.company.name;
  this.company.address = Gv('inv-caddr');
  this.company.phone = Gv('inv-cphone');
  this.company.email = Gv('inv-cemail');
  this.company.director = Gv('inv-cdir');
  this.doc.no = Gv('inv-dno');
  this.doc.date = Gv('inv-ddate');
  this.doc.valid = Gv('inv-dvalid');
  this.cust.name = Gv('inv-kname');
  this.cust.address = Gv('inv-kaddr');
  this.cust.phone = Gv('inv-kphone');
  this.cust.email = Gv('inv-kemail');
  this.notes = Gv('inv-notes');
  this.save();
};

function Gv(id) { const el = document.getElementById(id); return el ? el.value : ''; }

INV.upd = function () {
  const self = this;
  this.sync();
  const t = this.totals();
  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  s('inv-s-sub', this.rp(t.sub));
  s('inv-s-disc', '-' + this.rp(t.disc));
  s('inv-s-ppn', this.rp(t.ppn));
  s('inv-s-tot', this.rp(t.total));

  const page = document.getElementById('inv-page');
  if (!page) return;
  const rows = this.items.map((it, i) => {
    const tot = (it.qty || 0) * (it.price || 0);
    return `<tr><td class="c">${i + 1}</td><td>${this.esc(it.desc) || '&nbsp;'}</td><td class="c">${it.qty || 0}</td><td class="r">${this.rp(it.price)}</td><td class="r">${this.rp(tot)}</td></tr>`;
  }).join('');

  const ddate = this.fmtDate(this.doc.date);
  page.innerHTML = `
    <div class="co-head">
      <div class="co-name">${this.esc(this.company.name)}</div>
      <div class="co-sub">${this.esc(this.company.address)}<br>Telp/WA: ${this.esc(this.company.phone)}${this.company.email ? ' · Email: ' + this.esc(this.company.email) : ''}</div>
    </div>
    <div class="doc-title">${this.esc(this.doc.type)}</div>
    <table class="meta">
      <tr><td class="k">Nomor</td><td>: ${this.esc(this.doc.no)}</td><td class="k">Tanggal</td><td>: ${this.esc(ddate)}</td></tr>
      <tr><td class="k">Kepada Yth.</td><td>: ${this.esc(this.cust.name) || '-'}</td><td class="k">Berlaku</td><td>: ${this.esc(this.doc.valid)}</td></tr>
      ${this.cust.address ? `<tr><td class="k">Alamat</td><td colspan="3">: ${this.esc(this.cust.address)}</td></tr>` : ''}
      ${this.cust.phone ? `<tr><td class="k">Telp</td><td colspan="3">: ${this.esc(this.cust.phone)}</td></tr>` : ''}
    </table>
    <table class="tb">
      <thead><tr><th style="width:26px" class="c">No</th><th>Deskripsi</th><th style="width:50px" class="c">Qty</th><th style="width:100px" class="r">Harga Satuan</th><th style="width:110px" class="r">Jumlah</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="tot-line">
      <div class="tot-box">
        <div><span>Subtotal</span><span>${this.rp(t.sub)}</span></div>
        ${t.disc ? `<div><span>Diskon (${this.discPct}%)</span><span>-${this.rp(t.disc)}</span></div>` : ''}
        ${t.ppn ? `<div><span>PPN (${this.ppnPct}%)</span><span>${this.rp(t.ppn)}</span></div>` : ''}
        <div class="grand"><span>TOTAL</span><span>${this.rp(t.total)}</span></div>
      </div>
    </div>
    ${this.notes ? `<div class="notes">${this.esc(this.notes)}</div>` : ''}
    ${this._bankPreviewHtml()}
    <div class="sign">
      <div class="box">
        <div>Jakarta, ${this.esc(ddate)}</div>
        <div class="line">${this.esc(this.company.director)}</div>
        <div class="role">Direktur</div>
      </div>
    </div>
    <div class="foot-note">Dokumen ini dibuat otomatis dari sistem — ${this.esc(this.company.name)}</div>`;
};

// ── PDF ──
INV._loadJsPDF = function () {
  return new Promise((res, rej) => {
    if (window.jspdf && window.jspdf.jsPDF) return res(window.jspdf.jsPDF);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => res(window.jspdf.jsPDF);
    s.onerror = () => rej(new Error('Gagal memuat library jsPDF (periksa koneksi)'));
    document.head.appendChild(s);
  });
};

INV.dl = function () {
  const self = this;
  const btn = document.getElementById('inv-dl');
  btn.disabled = true;
  btn.textContent = 'Membuat PDF…';
  this._loadJsPDF().then(jsPDF => {
    try { self._buildPdf(jsPDF); }
    catch (e) { alert('Gagal membuat PDF: ' + e.message); }
    btn.disabled = false;
    btn.innerHTML = '⬇ Download PDF';
  }).catch(e => {
    alert(e.message + ' — silakan gunakan tombol Print lalu pilih "Save as PDF".');
    btn.disabled = false;
    btn.innerHTML = '⬇ Download PDF';
  });
};

INV._buildPdf = function (jsPDF) {
  this.sync();
  const t = this.totals();
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = 210, M = 14;
  const navy = [30, 62, 95];
  const gray = [85, 85, 85];
  let y = 0;

  // Header perusahaan
  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(this.company.name, W / 2, y + 16, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  const addr = this.company.address;
  const phone = 'Telp/WA: ' + this.company.phone + (this.company.email ? ' · Email: ' + this.company.email : '');
  doc.text(addr, W / 2, y + 22, { align: 'center' });
  doc.text(phone, W / 2, y + 27, { align: 'center' });
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(0.9);
  doc.line(M, y + 31, W - M, y + 31);

  // Judul dokumen
  y = 38;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(this.doc.type, W / 2, y, { align: 'center' });
  y += 7;

  // Meta
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  const meta = (k, v) => { doc.setFont('times', 'bold'); doc.text(k, M, y); doc.setFont('times', 'normal'); doc.text(': ' + v, M + 16, y); };
  meta('Nomor', this.doc.no);
  doc.text('Tanggal', W - M - 60, y);
  doc.text(': ' + this.fmtDate(this.doc.date), W - M - 44, y);
  y += 5;
  meta('Kepada Yth.', this.cust.name || '-');
  doc.text('Berlaku', W - M - 60, y);
  doc.text(': ' + this.doc.valid, W - M - 44, y);
  y += 5;
  if (this.cust.address) { meta('Alamat', this.cust.address); y += 5; }
  if (this.cust.phone) { meta('Telp', this.cust.phone); y += 5; }
  y += 3;

  // Tabel item (gambar manual, tanpa plugin eksternal)
  const cols = [
    { w: 12, h: 'center' },   // No
    { w: W - M * 2 - 12 - 20 - 34 - 40 }, // Deskripsi (sisa)
    { w: 20, h: 'center' },   // Qty
    { w: 34, h: 'right' },    // Harga Satuan
    { w: 40, h: 'right' }     // Jumlah
  ];
  const rowH = 7.5;
  const pad = 1.5;
  const headY = y;
  // header
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(M, headY, W - M * 2, rowH, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  const headCells = ['No', 'Deskripsi', 'Qty', 'Harga Satuan', 'Jumlah'];
  let cx = M;
  headCells.forEach((h, i) => {
    const cw = cols[i].w;
    doc.text(h, cx + (cols[i].h === 'center' ? cw / 2 : pad), headY + 5, { align: cols[i].h === 'center' ? 'center' : cols[i].h === 'right' ? 'right' : 'left', baseline: 'middle' });
    cx += cw;
  });
  y = headY + rowH;

  // baris item
  const itemRows = this.items.map((it, i) => {
    const tot = (it.qty || 0) * (it.price || 0);
    return { no: String(i + 1), desc: it.desc || '', qty: String(it.qty || 0), price: this.rp(it.price), total: this.rp(tot) };
  });

  // hitung tinggi per baris (wrap deskripsi)
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  const rows = itemRows.map(r => {
    const descLines = doc.splitTextToSize(r.desc, cols[1].w - pad * 2);
    const h = Math.max(rowH, descLines.length * 4.2 + pad * 2);
    return { r, descLines, h };
  });

  rows.forEach(row => {
    // garis atas
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(M, y, W - M, y);
    // sel
    let cx2 = M;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text(row.r.no, cx2 + cols[0].w / 2, y + row.h / 2 + 1, { align: 'center', baseline: 'middle' });
    cx2 += cols[0].w;
    doc.text(row.descLines, cx2 + pad, y + pad + 2);
    cx2 += cols[1].w;
    doc.text(row.r.qty, cx2 + cols[2].w / 2, y + row.h / 2 + 1, { align: 'center', baseline: 'middle' });
    cx2 += cols[2].w;
    doc.text(row.r.price, cx2 + cols[3].w - pad, y + row.h / 2 + 1, { align: 'right', baseline: 'middle' });
    cx2 += cols[3].w;
    doc.text(row.r.total, cx2 + cols[4].w - pad, y + row.h / 2 + 1, { align: 'right', baseline: 'middle' });
    y += row.h;
  });

  // garis bawah
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, W - M, y);
  y += 6;

  // Ringkasan harga
  const bx = W - M - 78, bw = 78;
  const row = (k, v, bold) => {
    doc.setFont('times', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9);
    doc.setTextColor(20, 20, 20);
    doc.text(k, bx, y);
    doc.text(v, bx + bw, y, { align: 'right' });
    y += 5.5;
  };
  row('Subtotal', this.rp(t.sub));
  if (t.disc) row('Diskon (' + this.discPct + '%)', '-' + this.rp(t.disc));
  if (t.ppn) row('PPN (' + this.ppnPct + '%)', this.rp(t.ppn));
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(bx, y - 1, bw, 7, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL', bx + 3, y + 4);
  doc.text(this.rp(t.total), bx + bw - 3, y + 4, { align: 'right' });
  y += 12;

  // Catatan
  if (this.notes) {
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    const lines = doc.splitTextToSize(this.notes, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 3.6 + 2;
  }

  // Pembayaran (rekening bank dari pengaturan)
  const bs = this.selectedBanks();
  if (bs.length) {
    y += 2;
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text('Pembayaran via transfer:', M, y);
    y += 4.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    bs.forEach(b => {
      const txt = (b.label ? b.label + ' ' : '') + (b.account_number || '') + (b.account_name ? ' a.n. ' + b.account_name : '');
      doc.text(txt, M + 2, y);
      y += 4;
    });
    y += 3;
  }

  // Tanda tangan
  y = Math.max(y + 10, 250);
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text('Jakarta, ' + this.fmtDate(this.doc.date), W - M - 55, y);
  doc.line(W - M - 55, y + 24, W - M, y + 24);
  doc.setFont('times', 'bold');
  doc.text(this.company.director, W - M - 55, y + 30);
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text('Direktur', W - M - 55, y + 35);

  // Footer
  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text('Dokumen dibuat otomatis dari sistem · ' + this.company.name, W / 2, 290, { align: 'center' });

  const fname = (this.doc.no || 'penawaran').replace(/[^\w\-/]+/g, '_').replace(/\//g, '-') + '.pdf';
  doc.save(fname);
};

INV.prn = function () {
  this.sync();
  const t = this.totals();
  const rows = this.items.map((it, i) => {
    const tot = (it.qty || 0) * (it.price || 0);
    return `<tr><td class="c">${i + 1}</td><td>${this.esc(it.desc) || '&nbsp;'}</td><td class="c">${it.qty || 0}</td><td class="r">${this.rp(it.price)}</td><td class="r">${this.rp(tot)}</td></tr>`;
  }).join('');
  const w = window.open('', '_blank');
  if (!w) { alert('Popup diblokir — izinkan popup lalu coba lagi.'); return; }
  w.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>${this.esc(this.doc.type)} — ${this.esc(this.doc.no)}</title>
  <style>body{font-family:'Times New Roman',serif;color:#111;margin:30px;font-size:12px;line-height:1.55}
  .co-head{text-align:center;border-bottom:2.5px solid #1E3A5F;padding-bottom:10px;margin-bottom:12px}
  .co-name{font-size:20px;font-weight:900;color:#1E3A5F}.co-sub{font-size:11px;color:#555;margin-top:3px}
  .doc-title{text-align:center;font-size:16px;font-weight:900;margin:12px 0 10px;letter-spacing:2px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  .meta td{border:none;padding:2px 0;vertical-align:top}.meta .k{font-weight:700;width:90px}
  table.tb th{background:#1E3A5F;color:#fff;padding:6px 8px;text-align:left;border:1px solid #1E3A5F}
  table.tb td{border:1px solid #ccc;padding:6px 8px;vertical-align:top}.r{text-align:right}.c{text-align:center}
  .tot-box{width:250px;margin-left:auto;font-size:11px}.tot-box div{display:flex;justify-content:space-between;padding:3px 4px}
  .grand{font-weight:900;font-size:13px;background:#1E3A5F;color:#fff;padding:6px 10px;border-radius:4px;margin-top:2px}
  .notes{margin-top:12px;font-size:10px;color:#444;background:#f7f7f7;border-radius:6px;padding:10px;white-space:pre-line}
  .sign{display:flex;justify-content:flex-end;margin-top:50px}.sign .box{text-align:center;font-size:11px}
  .sign .line{width:190px;border-top:1px solid #333;margin-top:50px;padding-top:5px;font-weight:700}
  .role{font-size:10px;color:#555}.foot-note{text-align:center;font-size:9px;color:#999;margin-top:30px}
  @media print{body{margin:10mm}}
  </style></head><body>
  <div class="co-head"><div class="co-name">${this.esc(this.company.name)}</div><div class="co-sub">${this.esc(this.company.address)}<br>Telp/WA: ${this.esc(this.company.phone)}${this.company.email ? ' · Email: ' + this.esc(this.company.email) : ''}</div></div>
  <div class="doc-title">${this.esc(this.doc.type)}</div>
  <table class="meta"><tr><td class="k">Nomor</td><td>: ${this.esc(this.doc.no)}</td><td class="k">Tanggal</td><td>: ${this.esc(this.fmtDate(this.doc.date))}</td></tr>
  <tr><td class="k">Kepada Yth.</td><td>: ${this.esc(this.cust.name) || '-'}</td><td class="k">Berlaku</td><td>: ${this.esc(this.doc.valid)}</td></tr>
  ${this.cust.address ? `<tr><td class="k">Alamat</td><td colspan="3">: ${this.esc(this.cust.address)}</td></tr>` : ''}
  ${this.cust.phone ? `<tr><td class="k">Telp</td><td colspan="3">: ${this.esc(this.cust.phone)}</td></tr>` : ''}</table>
  <table class="tb"><thead><tr><th style="width:26px" class="c">No</th><th>Deskripsi</th><th style="width:50px" class="c">Qty</th><th style="width:110px" class="r">Harga Satuan</th><th style="width:120px" class="r">Jumlah</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="tot-box">
    <div><span>Subtotal</span><span>${this.rp(t.sub)}</span></div>
    ${t.disc ? `<div><span>Diskon (${this.discPct}%)</span><span>-${this.rp(t.disc)}</span></div>` : ''}
    ${t.ppn ? `<div><span>PPN (${this.ppnPct}%)</span><span>${this.rp(t.ppn)}</span></div>` : ''}
    <div class="grand"><span>TOTAL</span><span>${this.rp(t.total)}</span></div>
  </div>
  ${this.notes ? `<div class="notes">${this.esc(this.notes)}</div>` : ''}
  ${this._bankPreviewHtml()}
  <div class="sign"><div class="box"><div>Jakarta, ${this.esc(this.fmtDate(this.doc.date))}</div><div class="line">${this.esc(this.company.director)}</div><div class="role">Direktur</div></div></div>
  <div class="foot-note">Dokumen ini dibuat otomatis dari sistem — ${this.esc(this.company.name)}</div>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 300);
};
