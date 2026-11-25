const page = document.body.dataset.page;
const actor = document.querySelector('#actor');
const results = document.querySelector('#results');
const feedback = document.querySelector('#feedback');
const form = document.querySelector('#claim-form');
const submit = document.querySelector('#submit');
const month = document.querySelector('#month');
const statuses = { pending: 'Menunggu manager', pending_finance: 'Menunggu Finance', approved: 'Disetujui', rejected: 'Ditolak' };
const categories = { Travel: 'Perjalanan', Meals: 'Makan', Equipment: 'Peralatan', Other: 'Lainnya' };
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
let busy = false;
let today;

async function api(path, body) {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'x-demo-user': actor.value, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? `Permintaan gagal (HTTP ${response.status}).`);
  return data;
}

function message(text, kind) {
  feedback.textContent = text;
  feedback.className = kind ?? '';
}

function row(values) {
  const tr = document.createElement('tr');
  for (const value of values) tr.insertCell().textContent = value;
  results.append(tr);
  return tr;
}

async function refresh() {
  if (page === 'report') {
    const params = new URLSearchParams(month.value ? { month: month.value } : {});
    const data = await api(`/reports?${params}`);
    month.value = data.month;
    results.replaceChildren();
    for (const item of data.rows) row([categories[item.category] ?? item.category, item.department, item.claimCount, money.format(item.total)]);
  } else {
    const data = await api(page === 'employee' ? '/claims' : '/approvals');
    results.replaceChildren();
    for (const claim of data.claims) {
      const tr = row([claim.title, money.format(claim.amount), statuses[claim.status]]);
      if (page === 'approval') {
        const cell = tr.insertCell();
        for (const [decision, label] of [['approve', 'Setujui'], ['reject', 'Tolak']]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = label;
          button.setAttribute('aria-label', `${label}: ${claim.title}`);
          if (decision === 'reject') button.className = 'secondary';
          button.addEventListener('click', () => perform(async () => {
            const { claim: updated } = await api(`/approvals/${claim.id}`, { decision });
            await refresh();
            message(`Status klaim: ${statuses[updated.status]}.`, 'toast');
          }));
          cell.append(button);
        }
      }
    }
  }
  if (!results.childElementCount) {
    row(['Belum ada data.']).firstElementChild.colSpan = page === 'employee' ? 3 : 4;
  }
}

async function perform(action) {
  if (busy) return;
  busy = true;
  actor.disabled = true;
  if (submit) submit.disabled = true;
  if (month) month.disabled = true;
  message('Memuat…');
  try {
    await action();
    if (!feedback.className) message('');
  } catch (error) {
    message(error.message || 'Tidak bisa terhubung ke aplikasi latihan.', 'error');
  } finally {
    busy = false;
    actor.disabled = false;
    if (submit) submit.disabled = !today;
    if (month) month.disabled = false;
  }
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  perform(async () => {
    const input = Object.fromEntries(new FormData(form));
    input.amount = Number(input.amount);
    await api('/claims', input);
    form.reset();
    await refresh();
    message('Klaim berhasil diajukan.', 'toast');
  });
});
actor.addEventListener('change', () => perform(refresh));
month?.addEventListener('change', () => perform(refresh));
perform(async () => {
  if (form) {
    ({ today } = await api('/session'));
  }
  await refresh();
});
