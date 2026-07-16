import { useState, useEffect } from 'react';

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/17V8eS7VfCxwTSRs2wfmzUT8wtKW2aHmz-EaQT7E9irM/gviz/tq?tqx=out:csv&gid=53967996';

const parseCSV = (text) => {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let row = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(current); current = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      row.push(current); current = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else {
      current += ch;
    }
  }
  if (current || row.length) { row.push(current); rows.push(row); }
  return rows;
};

// Counts rows where PUBLISH? = "PAGADO" (club members)
// Pipeline uses "yes" — no collision.
export const useMemberCount = () => {
  const [count, setCount] = useState(null); // null = loading
  const [error, setError] = useState(false);

  const fetchCount = () => {
    fetch(`${SHEET_URL}&_=${Date.now()}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.text(); })
      .then((text) => {
        const all = parseCSV(text);
        if (!all.length) { setCount(0); return; }
        const header = all[0].map((h) => h.replace(/^"|"$/g, '').trim());
        const pubCol = header.findIndex((h) => h === 'PUBLISH?');
        if (pubCol === -1) { setCount(0); return; }
        const paid = all
          .slice(1)
          .filter((r) => r[pubCol]?.replace(/^"|"$/g, '').trim().toUpperCase() === 'PAGADO')
          .length;
        setCount(paid);
        setError(false);
      })
      .catch(() => setError(true));
  };

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Derived: which tier is active and spots remaining
  const FOUNDING_SPOTS = 20;
  const spotsLeft = count !== null ? Math.max(0, FOUNDING_SPOTS - count) : null;
  const foundingActive = count !== null && count < FOUNDING_SPOTS;

  return { count, error, spotsLeft, foundingActive };
};
