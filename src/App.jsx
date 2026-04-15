import React, { useState, useEffect } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// Google Sheets: public CSV export
const SHEET_ID = '17V8eS7VfCxwTSRs2wfmzUT8wtKW2aHmz-EaQT7E9irM';
const GID = '53967996';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

// Column indices (0-based): T=19, U=20, W=22, Y=24, AH=33
const COL = { SECTOR: 19, STAGE: 20, AMOUNT: 22, PROBLEM: 24, PUBLISH: 33 };

// ─── SVG Logo ─────────────────────────────────────────────────────────────────

const MVPLogo = ({ className = 'w-32 h-10' }) => (
  <svg className={className} viewBox="0 0 220 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Max Venture Power">
    <text x="0" y="35" fill="currentColor" fontSize="28" fontWeight="700" letterSpacing="-0.5" style={{ fontFamily: 'Georgia, serif' }}>MVP</text>
    <text x="78" y="38" fill="#C9A84C" fontSize="13" fontWeight="400" letterSpacing="2" style={{ fontFamily: 'Inter, sans-serif' }}>MAX VENTURE POWER</text>
  </svg>
);

// ─── Scroll Reveal ────────────────────────────────────────────────────────────

const useScrollReveal = (threshold = 0.1) => {
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

const FadeSection = ({ children, className = '', delay = 0 }) => {
  const [setRef, isVisible] = useScrollReveal(0.08);
  return (
    <div ref={setRef} className={`transition-all duration-700 ease-out ${className}`}
      style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(32px)', transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

// ─── Email Input ──────────────────────────────────────────────────────────────

const EmailInput = ({ placeholder = 'Enter your email', buttonText = 'Join Free', variant = 'dark', className = '' }) => {
  const [email, setEmail] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      window.open(`https://magic.beehiiv.com/v1/030810ba-6dbe-4b31-9ebf-05947c2eb8f5?email=${encodeURIComponent(email)}`, '_blank');
      setEmail('');
    }
  };
  const inputCls = variant === 'dark'
    ? 'bg-[#141414] border-[#2A2A2A] text-[#E5E5E5] placeholder-[#6B6B6B] focus:border-[#C9A84C]'
    : 'bg-white border-[#D0C9BB] text-[#0D0D0D] placeholder-[#999] focus:border-[#C9A84C]';
  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder={placeholder} required aria-label="Email address"
        className={`flex-1 px-4 py-3 border text-base focus:outline-none transition-colors ${inputCls}`} />
      <button type="submit"
        className="px-6 py-3 bg-[#C9A84C] text-[#0D0D0D] font-semibold text-base hover:bg-[#D4B45C] transition-colors whitespace-nowrap cursor-pointer">
        {buttonText}
      </button>
    </form>
  );
};

// ─── Pipeline Dashboard ───────────────────────────────────────────────────────

const sectorColors = {
  Fintech: 'bg-blue-900/40 text-blue-300',
  HealthTech: 'bg-green-900/40 text-green-300',
  EdTech: 'bg-purple-900/40 text-purple-300',
  AgTech: 'bg-lime-900/40 text-lime-300',
  SaaS: 'bg-sky-900/40 text-sky-300',
  CleanTech: 'bg-teal-900/40 text-teal-300',
  LegalTech: 'bg-orange-900/40 text-orange-300',
  default: 'bg-[#2A2A2A] text-[#E5E5E5]',
};

const getSectorColor = (sector) => {
  for (const key of Object.keys(sectorColors)) {
    if (sector && sector.toLowerCase().includes(key.toLowerCase())) return sectorColors[key];
  }
  return sectorColors.default;
};

const PipelineDashboard = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(SHEET_URL);
        if (!res.ok) throw new Error('Could not load sheet');
        const text = await res.text();
        const rows = parseCSV(text);
        // Skip header row, filter by AH = "Yes" (case-insensitive)
        const data = rows.slice(1)
          .filter(row => row[COL.PUBLISH] && row[COL.PUBLISH].trim().toLowerCase() === 'yes')
          .map((row, i) => ({
            id: i,
            sector: row[COL.SECTOR]?.trim() || '—',
            stage: row[COL.STAGE]?.trim() || '—',
            amount: row[COL.AMOUNT]?.trim() || '—',
            problem: row[COL.PROBLEM]?.trim() || '—',
          }))
          .filter(d => d.sector !== '—' || d.stage !== '—');
        setDeals(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sectors = ['All', ...Array.from(new Set(deals.map(d => d.sector))).filter(s => s && s !== '—')];
  const filtered = filter === 'All' ? deals : deals.filter(d => d.sector === filter);

  return (
    <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-[#1F1F1F] bg-[#141414]">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#C9A84C] rounded-full animate-pulse" />
          <span className="text-[#E5E5E5] font-semibold tracking-wide">Active Deals</span>
          {!loading && !error && (
            <span className="px-2 py-0.5 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold rounded">
              {filtered.length} {filtered.length === 1 ? 'startup' : 'startups'}
            </span>
          )}
        </div>
        <a href="https://forms.gle/CaP1GZQE2XUESm6u5" target="_blank" rel="noopener noreferrer"
          className="text-sm text-[#C9A84C] hover:underline shrink-0">
          Submit Your Startup →
        </a>
      </div>

      {/* Sector filters */}
      {!loading && !error && sectors.length > 1 && (
        <div className="flex gap-2 px-6 py-3 border-b border-[#1F1F1F] overflow-x-auto scrollbar-hide">
          {sectors.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === s ? 'bg-[#C9A84C] text-[#0D0D0D]' : 'bg-[#1F1F1F] text-[#6B6B6B] hover:text-[#E5E5E5]'
              }`}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Table header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-[#0D0D0D] text-[#6B6B6B] text-xs uppercase tracking-widest border-b border-[#1F1F1F]">
        <div className="col-span-3">Sector</div>
        <div className="col-span-2">Stage</div>
        <div className="col-span-2">Raise</div>
        <div className="col-span-5">The Problem</div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex flex-col gap-3 p-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-[#1A1A1A] animate-pulse rounded" />
          ))}
        </div>
      )}

      {error && (
        <div className="px-6 py-12 text-center">
          <p className="text-[#6B6B6B] text-sm mb-4">Pipeline data temporarily unavailable.</p>
          <a href="https://forms.gle/CaP1GZQE2XUESm6u5" target="_blank" rel="noopener noreferrer"
            className="text-[#C9A84C] text-sm hover:underline">
            Submit your startup to the pipeline →
          </a>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="px-6 py-12 text-center text-[#6B6B6B] text-sm">
          No deals found for this filter.
        </div>
      )}

      {/* Rows */}
      {!loading && !error && filtered.map((deal, idx) => (
        <div key={deal.id}>
          {/* Desktop row */}
          <button
            onClick={() => setExpanded(expanded === deal.id ? null : deal.id)}
            className="hidden md:grid w-full grid-cols-12 gap-4 px-6 py-4 border-b border-[#1F1F1F] hover:bg-[#1A1A1A] transition-colors text-left cursor-pointer group"
          >
            <div className="col-span-3">
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getSectorColor(deal.sector)}`}>
                {deal.sector}
              </span>
            </div>
            <div className="col-span-2 text-[#6B6B6B] text-sm self-center">{deal.stage}</div>
            <div className="col-span-2 text-[#C9A84C] font-semibold text-sm self-center">{deal.amount}</div>
            <div className="col-span-5 text-[#6B6B6B] text-sm self-center line-clamp-2 group-hover:text-[#E5E5E5] transition-colors">
              {deal.problem}
            </div>
          </button>

          {/* Mobile card */}
          <button
            onClick={() => setExpanded(expanded === deal.id ? null : deal.id)}
            className="md:hidden w-full px-5 py-4 border-b border-[#1F1F1F] hover:bg-[#1A1A1A] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getSectorColor(deal.sector)}`}>
                {deal.sector}
              </span>
              <span className="text-[#C9A84C] font-semibold text-sm">{deal.amount}</span>
            </div>
            <div className="text-[#6B6B6B] text-xs mb-1">{deal.stage}</div>
            <div className="text-[#6B6B6B] text-sm line-clamp-2">{deal.problem}</div>
          </button>

          {/* Expanded problem */}
          {expanded === deal.id && (
            <div className="px-6 py-4 bg-[#141414] border-b border-[#1F1F1F]">
              <p className="text-xs text-[#C9A84C] uppercase tracking-widest mb-2 font-semibold">El Problema</p>
              <p className="text-[#E5E5E5] text-sm leading-relaxed">{deal.problem}</p>
            </div>
          )}
        </div>
      ))}

      {/* Footer */}
      <div className="px-6 py-4 bg-[#0D0D0D] border-t border-[#1F1F1F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[#6B6B6B] text-xs">
          Updated weekly. Only verified startups are listed.
        </p>
        <a href="https://forms.gle/CaP1GZQE2XUESm6u5" target="_blank" rel="noopener noreferrer"
          className="text-[#C9A84C] text-xs hover:underline shrink-0">
          Are you raising? Submit here →
        </a>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E5E5E5] font-sans antialiased">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#0D0D0D]/95 backdrop-blur-md border-b border-[#1F1F1F] py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <a href="#" aria-label="Max Venture Power Home" className="text-[#E5E5E5] hover:text-[#C9A84C] transition-colors">
            <MVPLogo />
          </a>
          <div className="flex items-center gap-4 md:gap-6">
            <a href="https://magic.beehiiv.com/v1/030810ba-6dbe-4b31-9ebf-05947c2eb8f5"
              target="_blank" rel="noopener noreferrer"
              className="hidden sm:block text-sm font-medium hover:text-[#C9A84C] transition-colors">
              Join Free
            </a>
            <a href="#partnerships"
              className="px-4 py-2 border border-[#C9A84C] text-[#C9A84C] text-sm font-medium hover:bg-[#C9A84C] hover:text-[#0D0D0D] transition-all">
              Partner with Us
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <header className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#141414]/60 via-[#0D0D0D] to-[#0D0D0D]" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-[#C9A84C]/4 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24">
          {/* Trust bar */}
          <FadeSection>
            <div className="flex items-center gap-2 text-[#6B6B6B] text-sm mb-10">
              <svg className="w-4 h-4 text-[#C9A84C] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>3,100 subscribers</span>
              <span className="text-[#2A2A2A]">·</span>
              <span>18 countries</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-[3.75rem] font-bold leading-[1.1] mb-6 max-w-4xl">
              <span className="text-[#E5E5E5]">The capital, tools, and connections to build in LATAM exist.</span>
              <br />
              <span className="text-[#C9A84C]">You just don't have access yet.</span>
            </h1>

            <p className="text-xl md:text-2xl text-[#6B6B6B] max-w-2xl mb-3 leading-relaxed font-light">
              MVP closes that gap.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-5 mt-10 mb-12">
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="https://magic.beehiiv.com/v1/030810ba-6dbe-4b31-9ebf-05947c2eb8f5"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#C9A84C] text-[#0D0D0D] font-semibold text-lg hover:bg-[#D4B45C] transition-colors">
                  Join Free
                </a>
                <a href="#partnerships"
                  className="inline-flex items-center justify-center px-8 py-4 border border-[#2A2A2A] text-[#E5E5E5] font-semibold text-lg hover:border-[#C9A84C] transition-colors">
                  Partner with Us
                </a>
              </div>
              <EmailInput placeholder="your@email.com" buttonText="Join Free" className="max-w-md" />
            </div>
          </FadeSection>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-5 h-5 text-[#2A2A2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </header>

      {/* ── PAIN ────────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeSection>
            <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-6">Sound familiar?</p>
            <div className="max-w-2xl space-y-5 mb-12">
              {[
                "Investors in your market don't get it",
                'The right people exist — you just can\'t find them',
                'Other founders are raising, closing deals, getting coverage',
                "You're one intro away from everything changing",
              ].map((pain, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-[#C9A84C] font-mono text-sm mt-0.5 shrink-0">0{i + 1}</span>
                  <p className="text-[#E5E5E5] text-lg leading-snug">{pain}</p>
                </div>
              ))}
            </div>
            <div className="max-w-2xl border-l-2 border-[#C9A84C]/40 pl-6">
              <p className="text-xl text-[#E5E5E5] leading-relaxed italic" style={{ fontFamily: 'Georgia, serif' }}>
                MVP is not a news digest. It's the briefing from inside the room.
              </p>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── WHAT YOU GET ────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeSection>
            <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-4">What you get</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Every week. Free.</h2>
          </FadeSection>

          <div className="grid md:grid-cols-2 gap-px bg-[#1F1F1F] mt-12 mb-4">
            {[
              { label: 'MAX', title: 'The tools actually worth using', desc: 'Curated AI tools, platforms, and systems for founders who build — not browse. Every recommendation is used, tested, and explained in plain language.' },
              { label: 'VENTURE', title: 'Capital intelligence before it\'s obvious', desc: 'Deep VC market analysis. Who\'s deploying, where, and why. Position yourself before everyone else figures it out.' },
              { label: 'POWER', title: 'Market stories that follow the money', desc: 'The deals, policies, and moves reshaping LATAM. Contrarian takes, real data, no PR spin.' },
              { label: 'MVP PRO', title: 'Paid research — reports, market maps, frameworks', desc: 'The intelligence that used to cost you a consultant. Starting with the definitive guide to pre-seed capital in LATAM.', gold: true },
            ].map(({ label, title, desc, gold }, i) => (
              <FadeSection key={label} delay={i * 80}>
                <div className="bg-[#141414] p-8 h-full hover:bg-[#181818] transition-colors">
                  <span className={`inline-block px-3 py-1 text-xs font-bold tracking-widest mb-5 ${gold ? 'bg-[#C9A84C] text-[#0D0D0D]' : 'bg-[#2A2A2A] text-[#E5E5E5]'}`}>
                    {label}
                  </span>
                  <h3 className="text-[#E5E5E5] text-xl font-semibold mb-3">{title}</h3>
                  <p className="text-[#6B6B6B] text-base leading-relaxed">{desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>

          <FadeSection delay={400}>
            <a href="https://magic.beehiiv.com/v1/030810ba-6dbe-4b31-9ebf-05947c2eb8f5"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#C9A84C] text-lg font-semibold hover:gap-3 transition-all mt-8">
              Start Reading Free — Join 3,100+ Founders
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </FadeSection>
        </div>
      </section>

      {/* ── PROOF ───────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeSection>
            <h2 className="text-3xl md:text-4xl font-bold mb-16">Founders. Investors. Builders.<br />All reading the same thing.</h2>
          </FadeSection>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[
              { n: '3,100+', l: 'Subscribers' },
              { n: '18', l: 'Countries' },
              { n: 'Weekly', l: 'Editions' },
              { n: '100+', l: 'Founders Featured' },
            ].map(({ n, l }, i) => (
              <FadeSection key={l} delay={i * 80}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-[#C9A84C] mb-2" style={{ fontFamily: 'Georgia, serif' }}>{n}</div>
                  <div className="text-[#6B6B6B] text-sm uppercase tracking-wider">{l}</div>
                </div>
              </FadeSection>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { quote: 'Si te interesa estar al tanto de lo que está pasando en inversión y venture en LATAM, te recomiendo suscribirte.', author: 'Laura Suárez León', company: 'Co-Founder, BlockCon Global' },
              { quote: 'Muy bueno el material que estás publicando en MVP.', author: 'Giancarlo Mañon Hoepelman', company: 'Founder, Dominican Republic' },
            ].map(({ quote, author, company }, i) => (
              <FadeSection key={author} delay={i * 100}>
                <div className="bg-[#141414] border border-[#1F1F1F] p-8 relative h-full">
                  <svg className="absolute top-6 left-6 w-7 h-7 text-[#C9A84C]/20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                  <p className="text-[#E5E5E5] text-lg leading-relaxed italic pl-8 pt-4 mb-6">"{quote}"</p>
                  <div className="pl-8">
                    <div className="text-[#E5E5E5] font-semibold text-sm">{author}</div>
                    <div className="text-[#6B6B6B] text-sm">{company}</div>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── MVP PIPELINE DASHBOARD ──────────────────────────────────────────── */}
      <section id="pipeline" className="py-24 md:py-32 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeSection>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2.5 h-2.5 bg-[#C9A84C] rounded-full animate-pulse" />
              <span className="text-[#C9A84C] text-xs font-mono uppercase tracking-widest">Live</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">MVP Pipeline</h2>
            <p className="text-[#6B6B6B] text-lg max-w-2xl mb-12">
              Startups actively raising in LATAM. Verified, curated, and updated weekly.
              Click any row to expand the problem statement.
            </p>
          </FadeSection>

          <FadeSection delay={150}>
            <PipelineDashboard />
          </FadeSection>
        </div>
      </section>

      {/* ── FOR FOUNDERS ────────────────────────────────────────────────────── */}
      <section id="founders" className="py-24 md:py-32 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12">
            <FadeSection>
              <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-4">For Founders</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Building something?<br />Get in the pipeline.</h2>
              <p className="text-[#6B6B6B] text-lg mb-10">
                Join 3,100+ founders getting weekly capital intelligence, tools, and market moves across LATAM and the Caribbean.
              </p>
              <EmailInput placeholder="your@email.com" buttonText="Join the Newsletter Free" className="mb-6 max-w-md" />
              <div className="flex flex-col gap-3 mt-4">
                <a href="https://forms.gle/CaP1GZQE2XUESm6u5" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#C9A84C] hover:underline text-sm">
                  Submit Your Startup →
                </a>
                <a href="https://forms.gle/CaP1GZQE2XUESm6u5" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#6B6B6B] hover:text-[#C9A84C] text-sm transition-colors">
                  Investor? Request Dealflow →
                </a>
              </div>
            </FadeSection>

            <FadeSection delay={150}>
              <div className="bg-[#141414] border border-[#1F1F1F] p-8 h-full flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-4">For Businesses & Events</p>
                  <h3 className="text-2xl font-bold text-[#E5E5E5] mb-4">Your next customer is already reading MVP.</h3>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {['Sponsorship', 'Affiliate Links', 'Co-Branding', 'Content Partnership', 'Events', 'LATAM Advisory'].map(s => (
                      <span key={s} className="px-3 py-1 bg-[#1F1F1F] text-[#6B6B6B] text-xs">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <a href="https://calendly.com/cairoa" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-[#C9A84C] text-[#0D0D0D] font-semibold text-sm hover:bg-[#D4B45C] transition-colors">
                    Book 15 Minutes
                  </a>
                  <a href="mailto:maxventurepower@gmail.com?subject=Partnership Inquiry"
                    className="inline-flex items-center justify-center px-6 py-3 border border-[#2A2A2A] text-[#E5E5E5] font-semibold text-sm hover:border-[#C9A84C] transition-colors">
                    See Partnership Options
                  </a>
                </div>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ── PARTNERS ────────────────────────────────────────────────────────── */}
      <section id="partnerships" className="py-16 border-t border-[#1F1F1F] bg-[#F7F4EE]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeSection>
            <p className="text-xs font-bold text-[#0D0D0D]/40 uppercase tracking-widest mb-8 text-center">Current Partners</p>
            <div className="flex flex-wrap items-center justify-center gap-10">
              {[
                { name: 'BlockCon Global', url: 'https://www.blockcon.co/' },
                { name: 'Venture Week', url: 'https://www.venture-week.com/' },
              ].map(({ name, url }) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-[#0D0D0D]/60 hover:text-[#C9A84C] text-lg font-semibold transition-colors tracking-wide">
                  {name}
                </a>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="py-16 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <MVPLogo className="w-40 h-12 mb-4" />
              <p className="text-[#6B6B6B] text-sm mb-6 max-w-xs italic" style={{ fontFamily: 'Georgia, serif' }}>
                "We don't sell ads. We create pipeline."
              </p>
              <div className="flex gap-3">
                {/* LinkedIn */}
                <a href="https://linkedin.com/company/maxventurepower" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-[#1F1F1F] flex items-center justify-center hover:bg-[#C9A84C] hover:text-[#0D0D0D] text-[#6B6B6B] transition-colors"
                  aria-label="LinkedIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                {/* Email */}
                <a href="mailto:maxventurepower@gmail.com"
                  className="w-9 h-9 bg-[#1F1F1F] flex items-center justify-center hover:bg-[#C9A84C] hover:text-[#0D0D0D] text-[#6B6B6B] transition-colors"
                  aria-label="Email">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </a>
                {/* Calendar */}
                <a href="https://calendly.com/cairoa" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-[#1F1F1F] flex items-center justify-center hover:bg-[#C9A84C] hover:text-[#0D0D0D] text-[#6B6B6B] transition-colors"
                  aria-label="Book a call">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-[#E5E5E5] font-semibold mb-4 text-sm">Navigate</h4>
              <ul className="space-y-2 text-[#6B6B6B] text-sm">
                <li><a href="#pipeline" className="hover:text-[#C9A84C] transition-colors">MVP Pipeline</a></li>
                <li><a href="#founders" className="hover:text-[#C9A84C] transition-colors">For Founders</a></li>
                <li><a href="#partnerships" className="hover:text-[#C9A84C] transition-colors">Partners</a></li>
                <li><a href="https://magic.beehiiv.com/v1/030810ba-6dbe-4b31-9ebf-05947c2eb8f5" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">Subscribe</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#E5E5E5] font-semibold mb-4 text-sm">Contact</h4>
              <ul className="space-y-2 text-[#6B6B6B] text-sm">
                <li><a href="mailto:maxventurepower@gmail.com" className="hover:text-[#C9A84C] transition-colors">maxventurepower@gmail.com</a></li>
                <li><a href="https://calendly.com/cairoa" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">Book an appointment</a></li>
                <li><a href="https://linkedin.com/company/maxventurepower" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1F1F1F] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#6B6B6B] text-xs">© {new Date().getFullYear()} Max Venture Power. All rights reserved.</p>
            <p className="text-[#6B6B6B] text-xs">Built for the LATAM ecosystem.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
