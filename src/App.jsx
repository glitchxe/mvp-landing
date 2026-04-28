import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hero } from '@/components/blocks/hero';
import { translations } from './translations';

// ─── Google Sheets Pipeline ────────────────────────────────────────────────────

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
      if (row.some(c => c !== '')) rows.push(row);
      row = [];
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else {
      current += ch;
    }
  }
  if (current || row.length) { row.push(current); rows.push(row); }
  return rows;
};

const SHEET_URL = `https://docs.google.com/spreadsheets/d/17V8eS7VfCxwTSRs2wfmzUT8wtKW2aHmz-EaQT7E9irM/gviz/tq?tqx=out:csv&gid=53967996`;

// Column names to look up dynamically from the header row — immune to column insertions
const COL_NAMES = {
  SECTOR:  'Sectors',
  STAGE:   'Etapas | Stages',
  AMOUNT:  'Monto buscado | Amount to Raise (USD)',
  PROBLEM: 'El problema | The Problem',
  PUBLISH: 'PUBLISH?',
};

const buildColIndex = (header) => {
  const idx = {};
  for (const [key, name] of Object.entries(COL_NAMES)) {
    idx[key] = header.findIndex(h => h.replace(/^"|"$/g, '').trim() === name);
  }
  return idx;
};

// ─── Logo — full name always visible ──────────────────────────────────────────

const MVPLogo = ({ className = '' }) => (
  <div className={`flex flex-col leading-none gap-1 ${className}`}>
    <span
      className="font-black text-[#E5E5E5] tracking-tight"
      style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', letterSpacing: '-0.03em' }}
    >
      MVP
    </span>
    <span
      className="font-semibold uppercase text-[#C9A84C]"
      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.05rem', letterSpacing: '0.18em' }}
    >
      Max Venture Power
    </span>
  </div>
);

// Nav-sized logo (horizontal layout)
const MVPLogoNav = () => (
  <div className="flex items-center gap-3">
    <span
      className="font-black text-[#E5E5E5]"
      style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.25rem', letterSpacing: '-0.03em', lineHeight: 1 }}
    >
      MVP
    </span>
    <span
      className="hidden sm:block font-semibold uppercase text-[#C9A84C]"
      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.975rem', letterSpacing: '0.16em' }}
    >
      Max Venture Power
    </span>
  </div>
);

// ─── Scroll reveal ─────────────────────────────────────────────────────────────

const useScrollReveal = (threshold = 0.08) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState(null);
  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(ref); } },
      { threshold }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return [setRef, isVisible];
};

const Reveal = ({ children, className = '', delay = 0 }) => {
  const [setRef, isVisible] = useScrollReveal();
  return (
    <div ref={setRef} className={`transition-all duration-700 ease-out ${className}`}
      style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(28px)', transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

// ─── Email Input ───────────────────────────────────────────────────────────────

const EmailInput = ({ placeholder = 'Enter your email', buttonText = 'Join Free', variant = 'dark', className = '' }) => {
  const [email, setEmail] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      window.open(`https://magic.beehiiv.com/v1/030810ba-6dbe-4b31-9ebf-05947c2eb8f5?email=${encodeURIComponent(email)}`, '_blank');
      setEmail('');
    }
  };
  const isDark = variant === 'dark';
  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-0 ${className}`}>
      <input
        type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder={placeholder} required aria-label="Email address"
        className={`flex-1 px-5 py-3.5 text-sm font-medium focus:outline-none transition-colors sm:border-r-0 ${
          isDark
            ? 'bg-[#111] border border-[#2A2A2A] text-[#E5E5E5] placeholder-[#555] focus:border-[#C9A84C]'
            : 'bg-white border border-[#D0C9BB] text-[#0D0D0D] placeholder-[#999] focus:border-[#C9A84C]'
        }`}
      />
      <button type="submit"
        className="px-6 py-3.5 bg-[#C9A84C] text-[#0D0D0D] font-bold text-sm hover:bg-[#D4B45C] transition-colors whitespace-nowrap cursor-pointer tracking-wide"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {buttonText}
      </button>
    </form>
  );
};

// ─── Pipeline Dashboard ────────────────────────────────────────────────────────

const sectorColors = {
  Marketplace: 'bg-violet-900/40 text-violet-300',
  Fintech: 'bg-blue-900/40 text-blue-300',
  'IA / ML': 'bg-emerald-900/40 text-emerald-300',
  HealthTech: 'bg-green-900/40 text-green-300',
  EdTech: 'bg-purple-900/40 text-purple-300',
  AgTech: 'bg-lime-900/40 text-lime-300',
  SaaS: 'bg-sky-900/40 text-sky-300',
  CleanTech: 'bg-teal-900/40 text-teal-300',
};
const getSectorColor = (s) => {
  for (const k of Object.keys(sectorColors)) {
    if (s && s.toLowerCase().includes(k.toLowerCase())) return sectorColors[k];
  }
  return 'bg-[#2A2A2A] text-[#E5E5E5]';
};

const PipelineDashboard = ({ tr }) => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('All');

  const fetchDeals = () => {
    fetch(`${SHEET_URL}&_=${Date.now()}`)
      .then(r => { if (!r.ok) throw new Error('Sheet unavailable'); return r.text(); })
      .then(text => {
        const all = parseCSV(text);
        const COL = buildColIndex(all[0] || []);
        const rows = all.slice(1)
          .filter(r => r[COL.PUBLISH]?.trim().toLowerCase() === 'yes')
          .map((r, i) => ({
            id: i,
            sector: r[COL.SECTOR]?.trim() || '—',
            stage: r[COL.STAGE]?.trim() || '—',
            amount: r[COL.AMOUNT]?.trim() || '—',
            problem: r[COL.PROBLEM]?.trim() || '—',
          }))
          .filter(d => d.sector !== '—' || d.stage !== '—');
        setDeals(rows);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(fetchDeals, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const sectors = ['All', ...Array.from(new Set(deals.map(d => d.sector))).filter(s => s && s !== '—')];
  const filtered = filter === 'All' ? deals : deals.filter(d => d.sector === filter);

  return (
    <div className="border border-[#1F1F1F] overflow-hidden" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#1F1F1F] bg-[#111]">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C9A84C]"></span>
          </span>
          <span className="text-[#E5E5E5] font-semibold text-sm tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {tr.activeDeals}
          </span>
          {!loading && !error && (
            <span className="px-2 py-0.5 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold">
              {filtered.length} {filtered.length !== 1 ? tr.startupPlural : tr.startupSingular}
            </span>
          )}
        </div>
        <a href="https://forms.gle/CaP1GZQE2XUESm6u5" target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#C9A84C] hover:underline shrink-0 font-medium">
          {tr.submitStartup}
        </a>
      </div>

      {/* Sector filters */}
      {!loading && !error && sectors.length > 1 && (
        <div className="flex gap-2 px-6 py-3 border-b border-[#1F1F1F] overflow-x-auto">
          {sectors.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === s
                  ? 'bg-[#C9A84C] text-[#0D0D0D]'
                  : 'bg-[#1A1A1A] text-[#6B6B6B] hover:text-[#E5E5E5] border border-[#2A2A2A]'
              }`}
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Table header — desktop */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-[#080808] text-[#777] text-[10px] uppercase tracking-[0.12em] border-b border-[#1F1F1F]">
        <div className="col-span-3">Sector</div>
        <div className="col-span-2">Stage</div>
        <div className="col-span-2">Raise</div>
        <div className="col-span-5">{tr.elProblema}</div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-px">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 bg-[#111] animate-pulse border-b border-[#1A1A1A]" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-6 py-12 text-center">
          <p className="text-[#777] text-sm mb-3">{tr.noData}</p>
          <a href="https://forms.gle/CaP1GZQE2XUESm6u5" target="_blank" rel="noopener noreferrer"
            className="text-[#C9A84C] text-sm hover:underline">
            {tr.submitLink}
          </a>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="px-6 py-12 text-center text-[#777] text-sm">{tr.noDeals}</div>
      )}

      {/* Rows */}
      {!loading && !error && filtered.map((deal) => (
        <div key={deal.id}>
          <button
            onClick={() => setExpanded(expanded === deal.id ? null : deal.id)}
            className="hidden md:grid w-full grid-cols-12 gap-4 px-6 py-4 border-b border-[#1A1A1A] hover:bg-[#111] transition-colors text-left cursor-pointer group"
          >
            <div className="col-span-3 self-center">
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-sm ${getSectorColor(deal.sector)}`}>
                {deal.sector}
              </span>
            </div>
            <div className="col-span-2 text-[#888] text-sm self-center">{deal.stage}</div>
            <div className="col-span-2 text-[#C9A84C] font-bold text-sm self-center" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{deal.amount}</div>
            <div className="col-span-5 text-[#888] text-sm self-center line-clamp-2 group-hover:text-[#999] transition-colors pr-2">{deal.problem}</div>
          </button>

          {/* Mobile */}
          <button
            onClick={() => setExpanded(expanded === deal.id ? null : deal.id)}
            className="md:hidden w-full px-5 py-4 border-b border-[#1A1A1A] hover:bg-[#111] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-sm ${getSectorColor(deal.sector)}`}>{deal.sector}</span>
              <span className="text-[#C9A84C] font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{deal.amount}</span>
            </div>
            <div className="text-[#777] text-xs mb-1">{deal.stage}</div>
            <div className="text-[#888] text-sm line-clamp-2">{deal.problem}</div>
          </button>

          {/* Expanded */}
          {expanded === deal.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-5 bg-[#0D0D0D] border-b border-[#1F1F1F]"
            >
              <p className="text-[10px] text-[#C9A84C] uppercase tracking-[0.14em] mb-2 font-bold">{tr.elProblema}</p>
              <p className="text-[#999] text-sm leading-relaxed max-w-3xl">{deal.problem}</p>
            </motion.div>
          )}
        </div>
      ))}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#080808]">
        <p className="text-[#888] text-xs">{tr.updatedWeekly}</p>
        <a href="https://forms.gle/CaP1GZQE2XUESm6u5" target="_blank" rel="noopener noreferrer"
          className="text-[#C9A84C] text-xs hover:underline font-medium shrink-0">
          {tr.raisingSubmit}
        </a>
      </div>
    </div>
  );
};

// ─── Hero email preview (shown alongside headline) ─────────────────────────────

const HeroEmailCard = ({ tr }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    className="relative"
  >
    <div className="absolute -inset-px bg-gradient-to-br from-[#C9A84C]/20 via-transparent to-transparent rounded-sm pointer-events-none" />
    <div className="border border-[#1F1F1F] bg-[#0D0D0D] p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-[0.14em] text-[#C9A84C] font-bold">{tr.label}</span>
        <span className="text-xs text-[#888]">{tr.weekly}</span>
      </div>
      <div className="h-px bg-[#1F1F1F]" />
      {tr.rows.map(({ label, text }) => (
        <div key={label} className="flex items-start gap-3">
          <span className="text-xs font-black text-[#C9A84C] tracking-widest w-16 shrink-0 pt-0.5"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{label}</span>
          <span className="text-[#888] text-sm leading-relaxed">{text}</span>
        </div>
      ))}
      <div className="h-px bg-[#1F1F1F]" />
      <EmailInput placeholder="your@email.com" buttonText={tr.joinFree} />
      <p className="text-[#888] text-[10px]">{tr.stats}</p>
    </div>
  </motion.div>
);

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState('en');
  const tr = translations[lang];

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] antialiased" style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-[#0D0D0D]/96 backdrop-blur-md border-b border-[#1A1A1A] py-4' : 'bg-transparent py-5'
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <a href="#" aria-label="Max Venture Power Home" className="hover:opacity-80 transition-opacity">
            <MVPLogoNav />
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
              className="flex items-center gap-1.5 text-xs font-bold text-[#888] hover:text-[#E5E5E5] transition-colors tracking-widest uppercase border border-[#2A2A2A] hover:border-[#555] px-2.5 py-1.5 cursor-pointer"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              aria-label="Toggle language"
            >
              <span className="text-base leading-none">{lang === 'en' ? '🇪🇸' : '🇺🇸'}</span>
              {lang === 'en' ? 'ES' : 'EN'}
            </button>
            <a href="#pipeline"
              className="active-deals-btn hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#0D0D0D] bg-[#C9A84C] hover:bg-[#D4B45C] transition-colors cursor-pointer"
              style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.08em' }}>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D0D0D] opacity-60" style={{ animationDuration: '2s' }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0D0D0D]"></span>
              </span>
              Active Deals
            </a>
            <a href="https://mvpower.beehiiv.com"
              target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 border border-[#C9A84C] text-[#C9A84C] text-xs font-bold hover:bg-[#C9A84C] hover:text-[#0D0D0D] transition-all tracking-wide uppercase"
              style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.08em' }}>
              {tr.nav.join}
            </a>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO (21st.dev Codehagen component) ─────────────────────────────── */}
      <div className="pt-20">
        <Hero
          content={{
            title: tr.hero.title,
            titleHighlight: tr.hero.highlight,
            description: tr.hero.description,
            subtitle: tr.hero.subtitle,
            primaryAction: {
              href: 'https://mvpower.beehiiv.com',
              text: tr.hero.joinFree,
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              ),
            },
            secondaryAction: { href: 'mailto:maxventurepower@gmail.com?subject=Partnership Inquiry', text: tr.hero.partnerWithUs },
          }}
        />
      </div>

      {/* ── LATEST EDITION CARD ─────────────────────────────────────────────── */}
      {/* ── PAIN ────────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-28 lg:py-36 border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-xl font-black text-[#C9A84C] uppercase tracking-[0.22em] mb-10">{tr.pain.label}</p>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-px bg-[#111] mb-16">
            {tr.pain.items.map((text, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="bg-[#0D0D0D] p-8 md:p-10 group hover:bg-[#111] transition-colors">
                  <span className="text-[#C9A84C]/30 font-black text-5xl leading-none block mb-4"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>0{i + 1}</span>
                  <p className="text-[#E5E5E5] text-lg md:text-xl leading-snug font-medium group-hover:text-white transition-colors">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div className="border-l-2 border-[#C9A84C]/30 pl-8 max-w-2xl">
              <p className="text-2xl md:text-3xl text-[#E5E5E5] leading-tight font-medium"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {tr.pain.quote}<br />
                <span className="text-[#888]">{tr.pain.quoteSub}</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── WHAT YOU GET ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-28 lg:py-36 border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-xl font-black text-[#C9A84C] uppercase tracking-[0.22em] mb-4">{tr.whatYouGet.label}</p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#E5E5E5] mb-16 leading-[0.95]"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {tr.whatYouGet.heading}<br /><span className="text-[#888]">{tr.whatYouGet.headingSub}</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-px bg-[#111]">
            {tr.whatYouGet.cards.map(({ label, title, desc, gold }, i) => (
              <Reveal key={label} delay={i * 80}>
                <div className="bg-[#0D0D0D] p-8 md:p-10 h-full hover:bg-[#0F0F0F] transition-colors group">
                  <span className={`inline-block px-3 py-1 text-[10px] font-black tracking-[0.15em] uppercase mb-6 ${
                    gold ? 'bg-[#C9A84C] text-[#0D0D0D]' : 'border border-[#2A2A2A] text-[#888]'
                  }`}
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {label}
                  </span>
                  <h3 className="text-[#E5E5E5] text-2xl font-bold mb-3 leading-tight group-hover:text-white transition-colors"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
                  <p className="text-[#888] text-base leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={400}>
            <a href="https://mvpower.beehiiv.com"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-[#C9A84C] text-base font-bold hover:gap-5 transition-all mt-12"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {tr.whatYouGet.cta}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </Reveal>

          <Reveal delay={500}>
            <div className="mt-16">
              <HeroEmailCard tr={tr.latestEdition} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PROOF ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-28 lg:py-36 border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#E5E5E5] mb-20 leading-[0.95]"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {tr.proof.heading}<br /><span className="text-[#888]">{tr.proof.headingSub}</span>
            </h2>
          </Reveal>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#111] mb-16">
            {tr.proof.stats.map(({ n, l }, i) => (
              <Reveal key={l} delay={i * 80}>
                <div className="bg-[#0D0D0D] p-8 text-center hover:bg-[#0F0F0F] transition-colors">
                  <div className="text-4xl md:text-5xl font-black text-[#C9A84C] mb-2 leading-none"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{n}</div>
                  <div className="text-[#999] text-sm uppercase tracking-[0.12em] font-semibold">{l}</div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-2 gap-px bg-[#111]">
            {tr.proof.testimonials.map(({ quote, author, company }, i) => (
              <Reveal key={author} delay={i * 100}>
                <div className="bg-[#0D0D0D] p-8 md:p-10 h-full hover:bg-[#0F0F0F] transition-colors">
                  <p className="text-[#C9A84C]/20 text-6xl font-black leading-none mb-4"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>"</p>
                  <p className="text-[#999] text-lg leading-relaxed italic mb-6">"{quote}"</p>
                  <div>
                    <div className="text-[#E5E5E5] font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{author}</div>
                    <div className="text-[#777] text-xs mt-1">{company}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── MVP PIPELINE DASHBOARD ──────────────────────────────────────────── */}
      <section id="pipeline" className="py-16 md:py-28 lg:py-36 border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="flex items-center gap-3 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A84C]"></span>
              </span>
              <span className="text-[10px] text-[#C9A84C] font-black uppercase tracking-[0.2em]">{tr.pipeline.liveLabel}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#E5E5E5] mb-4 leading-[0.95]"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {tr.pipeline.heading}
            </h2>
            <p className="text-[#888] text-lg max-w-xl mb-12">
              {tr.pipeline.description}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <PipelineDashboard tr={tr.pipeline} />
          </Reveal>
        </div>
      </section>

      {/* ── FOR FOUNDERS + BUSINESSES ───────────────────────────────────────── */}
      <section id="founders" className="py-16 md:py-28 lg:py-36 border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-px bg-[#111]">

            {/* Founders */}
            <Reveal>
              <div className="bg-[#0D0D0D] p-8 md:p-12">
                <p className="text-xl font-black text-[#C9A84C] uppercase tracking-[0.22em] mb-6">{tr.founders.label}</p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#E5E5E5] mb-4 leading-tight"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {tr.founders.heading}<br />{tr.founders.headingSub}
                </h2>
                <p className="text-[#888] text-base mb-8 leading-relaxed">{tr.founders.description}</p>
                <EmailInput placeholder="your@email.com" buttonText={tr.founders.joinFree} className="mb-6 w-full sm:max-w-sm" />
                <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-[#1A1A1A]">
                  <a href="https://forms.gle/CaP1GZQE2XUESm6u5" target="_blank" rel="noopener noreferrer"
                    className="text-sm text-[#C9A84C] hover:underline font-semibold">
                    {tr.founders.submitStartup}
                  </a>
                  <a href="https://forms.gle/CaP1GZQE2XUESm6u5" target="_blank" rel="noopener noreferrer"
                    className="text-sm text-[#777] hover:text-[#C9A84C] transition-colors">
                    {tr.founders.requestDealflow}
                  </a>
                </div>
              </div>
            </Reveal>

            {/* Businesses */}
            <Reveal delay={120}>
              <div className="bg-[#0D0D0D] p-8 md:p-12 flex flex-col justify-between">
                <div>
                  <p className="text-xl font-black text-[#C9A84C] uppercase tracking-[0.22em] mb-6">{tr.businesses.label}</p>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#E5E5E5] mb-4 leading-tight"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {tr.businesses.heading}<br />{tr.businesses.headingSub}
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {tr.businesses.services.map(s => (
                      <span key={s} className="px-3 py-1 border border-[#2A2A2A] text-[#777] text-xs font-medium"
                        style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <a href="https://calendly.com/cairoa" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3.5 bg-[#C9A84C] text-[#0D0D0D] font-bold text-sm hover:bg-[#D4B45C] transition-colors cursor-pointer"
                    style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.04em' }}>
                    {tr.businesses.book}
                  </a>
                  <a href="mailto:maxventurepower@gmail.com?subject=Partnership Inquiry"
                    className="inline-flex items-center justify-center px-6 py-3.5 border border-[#2A2A2A] text-[#888] font-semibold text-sm hover:border-[#C9A84C] hover:text-[#E5E5E5] transition-colors cursor-pointer"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {tr.businesses.seeOptions}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PARTNERS ────────────────────────────────────────────────────────── */}
      <section id="partnerships" className="py-16 md:py-28 lg:py-36 border-t border-[#111] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16">
          <Reveal>
            <p className="text-xl font-black text-[#C9A84C] uppercase tracking-[0.22em] mb-4 text-center">{tr.partners.label}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#E5E5E5] text-center leading-[0.95]"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Building together.
            </h2>
          </Reveal>
        </div>

        {/* Marquee track — fades at edges */}
        <div className="relative">
          {/* Left fade */}
          <div className="absolute left-0 top-0 h-full w-24 md:w-40 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #0A0A0A, transparent)' }} />
          {/* Right fade */}
          <div className="absolute right-0 top-0 h-full w-24 md:w-40 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #0A0A0A, transparent)' }} />

          <div className="flex overflow-hidden">
            <div className="flex gap-4 animate-marquee">
              {[...tr.partners.items, ...tr.partners.items, ...tr.partners.items].map(({ name, url, desc }, i) => (
                <a key={`${name}-${i}`} href={url} target="_blank" rel="noopener noreferrer"
                  className="partner-card relative overflow-hidden bg-[#0D0D0D] border border-[#1F1F1F] p-8 md:p-10 flex flex-col gap-3 group transition-all duration-300 hover:border-[#C9A84C]/40 flex-shrink-0 w-64 md:w-80"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 60%, transparent 100%)' }} />
                  <span className="partner-name relative text-2xl md:text-3xl font-black tracking-tight transition-all duration-300"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {name}
                  </span>
                  <span className="relative text-[#888] text-sm">{desc}</span>
                  <span className="relative text-[#C9A84C] text-xs font-bold uppercase tracking-[0.14em] opacity-0 group-hover:opacity-100 transition-opacity duration-300">Visit →</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-33.333%); }
          }
          .animate-marquee {
            animation: marquee 22s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="py-16 border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-4 gap-8 md:gap-12 mb-12">
            <div className="md:col-span-2">
              <MVPLogo className="mb-5" />
              <p className="text-[#888] text-sm mb-6 italic" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {tr.footer.tagline}
              </p>
              <div className="flex gap-3">
                {/* LinkedIn */}
                <a href="https://linkedin.com/company/maxventurepower" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 border border-[#1F1F1F] flex items-center justify-center hover:bg-[#C9A84C] hover:border-[#C9A84C] hover:text-[#0D0D0D] text-[#777] transition-all"
                  aria-label="LinkedIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                {/* Email */}
                <a href="mailto:maxventurepower@gmail.com"
                  className="w-9 h-9 border border-[#1F1F1F] flex items-center justify-center hover:bg-[#C9A84C] hover:border-[#C9A84C] hover:text-[#0D0D0D] text-[#777] transition-all"
                  aria-label="Email">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </a>
                {/* Calendar */}
                <a href="https://calendly.com/cairoa" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 border border-[#1F1F1F] flex items-center justify-center hover:bg-[#C9A84C] hover:border-[#C9A84C] hover:text-[#0D0D0D] text-[#777] transition-all"
                  aria-label="Book a call">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-[#E5E5E5] font-bold mb-4 text-xs uppercase tracking-[0.12em]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{tr.footer.navigate}</h4>
              <ul className="space-y-2 text-[#777] text-sm">
                {tr.footer.navLinks.map(({ href, label, external, highlight }) => (
                  <li key={label}>
                    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className={`transition-colors ${highlight ? 'text-[#C9A84C] hover:text-[#D4B45C] font-semibold' : 'hover:text-[#C9A84C]'}`}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[#E5E5E5] font-bold mb-4 text-xs uppercase tracking-[0.12em]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{tr.footer.contact}</h4>
              <ul className="space-y-2 text-[#777] text-sm">
                {tr.footer.contactLinks.map(({ href, label, external }) => (
                  <li key={label}>
                    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="hover:text-[#C9A84C] transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#111] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#555] text-xs" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{tr.footer.copyright}</p>
            <p className="text-[#555] text-xs">{tr.footer.builtFor}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
