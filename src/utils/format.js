export function nowIso() {
  return new Date().toISOString();
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function formatMoney(value) {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function daysBetween(fromIso, toDate = new Date()) {
  const from = new Date(fromIso);
  const diff = toDate.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
  return Math.floor(diff / 86400000);
}

export function sectionLabel(sectionType, t) {
  return sectionType === 'BORROW' ? t.supplier : t.customer;
}
