// static/app.js
const catalog = document.getElementById('catalog');
const resultsInfo = document.getElementById('resultsInfo');
const cityFilter = document.createElement('select'); // we'll not display city filter UI in this script but keep default
let products = [];
let currentUser = null;

async function apiGet(url) {
  const res = await fetch(url, { credentials: 'include' });
  return res.json();
}
async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body)
  });
  return res.json();
}

async function loadPGs() {
  const r = await apiGet('/api/pgs');
  if (r.ok) { products = r.pgs; renderCatalog(products); populateCityOptions(); }
}

function populateCityOptions() {
  // reuse the cityFilter from original layout if exists
  const citySelect = document.getElementById('cityFilter');
  if (!citySelect) return;
  citySelect.innerHTML = '<option value="all">All cities</option>';
  const cities = Array.from(new Set(products.map(p => p.city))).sort();
  cities.forEach(c => {
    const opt = document.createElement('option'); opt.value = c; opt.textContent = c; citySelect.appendChild(opt);
  });
}

function applyFilters() {
  const q = (document.getElementById('q')?.value || '').trim().toLowerCase();
  const city = document.getElementById('cityFilter')?.value || 'all';
  const maxP = Number(document.getElementById('maxPrice')?.value) || Infinity;
  const type = document.getElementById('typeFilter')?.value || 'all';
  const sortBy = document.getElementById('sortBy')?.value || 'relevance';
  const checkedFac = Array.from(document.querySelectorAll('.fac:checked')).map(i => i.value);

  let res = products.filter(p => {
    if (q) { if (!(p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q))) return false }
    if (city !== 'all' && p.city !== city) return false;
    if (type !== 'all' && p.type !== type) return false;
    if (p.price > maxP) return false;
    if (checkedFac.length) {
      for (const f of checkedFac) if (!p.fac.includes(f)) return false;
    }
    return true;
  });

  if (sortBy === 'priceAsc') res.sort((a, b) => a.price - b.price);
  if (sortBy === 'priceDesc') res.sort((a, b) => b.price - a.price);

  renderCatalog(res);
}

function renderCatalog(list) {
  catalog.innerHTML = '';
  if (!list.length) { document.getElementById('emptyState').style.display = 'block'; resultsInfo.textContent = 'Showing 0 results'; return }
  document.getElementById('emptyState').style.display = 'none';
  resultsInfo.textContent = `Showing ${list.length} results`;

  list.forEach(p => {
    const el = document.createElement('div'); el.className = 'card';
    el.innerHTML = `
      <div class="thumb" style="background-image:url(${p.thumb})" role="img" aria-label="${p.name}"></div>
      <div>
        <div class="meta"><div>
          <div class="title">${p.name}</div>
          <div class="muted">${p.city} · <span class="pill">${p.type}</span></div>
        </div><div class="price">₹${p.price}</div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <div class="muted">⭐ ${p.rating}</div>
          <div style="display:flex;gap:8px">
            <button class="icon-btn" data-id="${p.id}">Details</button>
            <button class="btn" data-id="${p.id}">Book</button>
          </div>
        </div>
      </div>`;
    catalog.appendChild(el);
  });

  // bind buttons
  catalog.querySelectorAll('.card .icon-btn').forEach(b => b.addEventListener('click', (e) => {
    const id = Number(e.currentTarget.getAttribute('data-id'));
    viewDetail(id);
  }));
  catalog.querySelectorAll('.card .btn').forEach(b => b.addEventListener('click', async (e) => {
    const id = Number(e.currentTarget.getAttribute('data-id'));
    if (!currentUser) { alert('Please login to book.'); return; }
    const qty = 1; // demo a single booking
    const r = await apiPost('/api/book', { pg_id: id, qty });
    if (r.ok) { alert('Booked successfully!'); await loadBookings(); }
    else if (r.error) { alert(r.error); }
  }));
}

function viewDetail(id) {
  const p = products.find(x => x.id === id); if (!p) return;
  const modalRoot = document.getElementById('modalRoot');
  modalRoot.innerHTML = `
    <div class="modal-backdrop" onclick="document.getElementById('modalRoot').style.display='none'">
      <div class="modal" onclick="event.stopPropagation()">
        <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
          <div style="flex:1;min-width:260px">
            <div class="thumb" style="background-image:url(${p.thumb})"></div>
          </div>
          <div style="flex:1;min-width:220px">
            <h2 style="margin:0">${p.name}</h2>
            <div class="muted">${p.city} · <span class="pill">${p.type}</span></div>
            <p style="margin-top:8px;color:var(--muted)">Comfortable stay with essential amenities.</p>
            <ul style="color:var(--muted);padding-left:18px;margin-top:8px">${p.fac.map(f => `<li>${f.toUpperCase()}</li>`).join('')}</ul>
            <div style="display:flex;gap:8px;align-items:center;margin-top:12px">
              <div style="font-size:20px;font-weight:700">₹${p.price}</div>
              <button class="btn" id="modalBook">Book Now</button>
              <button class="icon-btn" id="modalClose">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  modalRoot.style.display = 'block';
  document.getElementById('modalClose').addEventListener('click', () => { modalRoot.style.display = 'none'; modalRoot.innerHTML = ''; });
  document.getElementById('modalBook').addEventListener('click', async () => {
    if (!currentUser) { alert('Please login to book.'); return; }
    const r = await apiPost('/api/book', { pg_id: id, qty: 1 });
    if (r.ok) { alert('Booked!'); modalRoot.style.display = 'none'; modalRoot.innerHTML = ''; await loadBookings(); }
    else alert(r.error || 'Booking failed');
  });
}

async function loadBookings() {
  const bookingItems = document.getElementById('bookingItems');
  const bookingTotal = document.getElementById('bookingTotal');
  bookingItems.innerHTML = 'Loading...';
  const res = await apiGet('/api/bookings');
  if (res.ok) {
    const b = res.bookings || [];
    if (!b.length) { bookingItems.innerHTML = '<div style="color:var(--muted);padding:12px">No bookings yet</div>'; bookingTotal.textContent = '₹0'; return; }
    let total = 0;
    bookingItems.innerHTML = '';
    for (const it of b) {
      total += it.amount;
      const row = document.createElement('div');
      row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.padding = '6px 0';
      row.innerHTML = `<div>PG #${it.pg_id} · qty:${it.qty} · <span class="small">${it.created_at}</span></div><div>₹${it.amount}</div>`;
      bookingItems.appendChild(row);
    }
    bookingTotal.textContent = `₹${total}`;
  } else {
    bookingItems.innerHTML = 'Login to see bookings';
    bookingTotal.textContent = '₹0';
  }
}

async function bootApp() {
  await loadPGs();
  // wire filters from page
  document.getElementById('q').addEventListener('input', applyFilters);
  const citySelect = document.getElementById('cityFilter');
  if (citySelect) citySelect.addEventListener('change', applyFilters);
  const maxPrice = document.getElementById('maxPrice');
  if (maxPrice) maxPrice.addEventListener('input', applyFilters);
  document.querySelectorAll('.fac').forEach(n => n.addEventListener('change', applyFilters));
  document.getElementById('typeFilter').addEventListener('change', applyFilters);
  document.getElementById('sortBy').addEventListener('change', applyFilters);

  // handle auth changes
  window.onAuthChange = async (user) => {
    currentUser = user;
    if (user) { await loadBookings(); } else {
      document.getElementById('bookingItems').innerHTML = 'Login to see your bookings';
      document.getElementById('bookingTotal').textContent = '₹0';
    }
  };
}

window.addEventListener('DOMContentLoaded', bootApp);
