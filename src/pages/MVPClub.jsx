import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useMemberCount } from '../hooks/useMemberCount';

// ─────────────────────────────────────────────────────────────────────────────
// TIER STRUCTURE (spots only — filled is derived from live sheet count)
// ─────────────────────────────────────────────────────────────────────────────
const TIER_DEFS = [
  { id: 'founding', price: '$80', spots: 20, unlockAt: null },
  { id: 'tier2',    price: '$97', spots: 30, unlockAt: 20 },
  { id: 'tier3',    price: '$120', spots: 50, unlockAt: 50 },
  { id: 'tier4',    price: '$150', spots: null, unlockAt: 100 },
];

// Derive per-tier filled counts from a flat total
const buildTiers = (total) => {
  let remaining = total;
  return TIER_DEFS.map((def) => {
    const filled = def.spots ? Math.min(remaining, def.spots) : remaining;
    remaining = Math.max(0, remaining - (def.spots ?? remaining));
    const soldOut = def.spots ? filled >= def.spots : false;
    return { ...def, filled, soldOut };
  });
};

const APPLY_URL = 'https://forms.gle/47cyuuQethNd9YkE9';

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────────────────────────────
const t = {
  en: {
    nav: { back: '← maxventurepower.com', apply: 'Apply Now', lang: 'ES' },

    badge: 'Private Membership',
    hero: {
      eyebrow: 'MVP Club',
      headline: 'The room most founders\nnever get into.',
      sub: 'A private group for founders and operators building in Latin America.',
      price: '$80 / month',
      priceSub: 'Founding price — locks in when you join.',
      cta: 'Apply for membership',
      note: 'You apply. Cairo reviews. You\'re in or you\'re not.',
    },

    counter: {
      label: 'Membership Status',
      founding: 'Founding',
      tier: 'Tier',
      spotsLeft: (n) => `${n} spot${n !== 1 ? 's' : ''} remaining`,
      spotsOf: (f, t) => `${f} of ${t} filled`,
      soldOut: 'Sold Out',
      locked: 'Locked',
      unlockAt: (n) => `Unlocks at ${n} members`,
      unlimited: '100+',
      yourPriceLocks: 'Your price locks when you join. Cancel and it\'s gone.',
    },

    benefits: {
      label: 'What You Get',
      items: [
        {
          title: 'Private weekly intelligence',
          desc: 'A Monday brief with what\'s actually moving in the ecosystem — not published anywhere else.',
        },
        {
          title: 'Monthly live session',
          desc: 'One founder in the hot seat. Real diagnosis. Real consequences.',
        },
        {
          title: 'Curated resource directory',
          desc: 'Lawyers, capital, developers, and tools — verified by people who have used them.',
        },
        {
          title: 'Private community access',
          desc: 'A small, selected group. High signal. No noise.',
        },
        {
          title: 'Workshops & advice',
          desc: 'Quarterly hands-on sessions on what\'s working now.',
        },
      ],
    },

    table: {
      eyebrow: 'The Table',
      headline: 'For members ready for\nthe next conversation.',
      desc: 'Direct introductions to investors, corporates, and strategic partners — with the explicit goal of producing a deal, an LOI, or a formal agreement.',
      note: 'Available to active members after 30 days. Not included. Not for everyone.',
    },

    who: {
      label: 'Who Is This For',
      items: [
        'Founders with something real already in motion.',
        'Operators who make decisions that cost money.',
        'Builders who are done going it alone.',
      ],
      notFor: [
        'Not for people exploring whether to start.',
        'Not for passive observers.',
      ],
    },

    about: {
      label: 'About',
      headline: 'This is that room.',
      text: 'MVP Club is built by Cairo Arévalo — venture builder, ecosystem operator, and founder of Max Venture Power, the fastest-growing venture newsletter in LATAM.\n\nHe built this because the most valuable conversations in the ecosystem happen in rooms most founders never get into.',
    },

    pricing: {
      label: 'Pricing',
      headline: 'Simple. Tier-based. Fair.',
      tiers: [
        { label: 'Founding', range: '1–20', price: '$80 / month' },
        { label: 'Tier 2', range: '21–50', price: '$97 / month' },
        { label: 'Tier 3', range: '51–100', price: '$120 / month' },
        { label: 'Tier 4', range: '100+', price: '$150 / month' },
      ],
      lock: 'Your price locks in when you join. Cancel and it\'s gone.',
    },

    cta: {
      headline: 'You apply.\nCairo reviews.\nYou\'re in or you\'re not.',
      button: 'Apply Now',
    },

    footer: {
      copy: '© 2026 MVP Club · by Max Venture Power',
      link: 'maxventurepower.com',
    },
  },

  es: {
    nav: { back: '← maxventurepower.com', apply: 'Aplicar Ahora', lang: 'EN' },

    badge: 'Membresía Privada',
    hero: {
      eyebrow: 'MVP Club',
      headline: 'El cuarto al que la mayoría\nde founders nunca llega.',
      sub: 'Un grupo privado para founders y operadores construyendo en América Latina.',
      price: '$80 / mes',
      priceSub: 'Precio fundador — se fija cuando te unes.',
      cta: 'Aplicar para membresía',
      note: 'Tú aplicas. Cairo revisa. Entras o no entras.',
    },

    counter: {
      label: 'Estado de Membresía',
      founding: 'Fundador',
      tier: 'Nivel',
      spotsLeft: (n) => `${n} cupo${n !== 1 ? 's' : ''} disponible${n !== 1 ? 's' : ''}`,
      spotsOf: (f, t) => `${f} de ${t} ocupados`,
      soldOut: 'Agotado',
      locked: 'Bloqueado',
      unlockAt: (n) => `Se activa en ${n} miembros`,
      unlimited: '100+',
      yourPriceLocks: 'Tu precio se fija cuando te unes. Cancelas y lo pierdes.',
    },

    benefits: {
      label: 'Qué Incluye',
      items: [
        {
          title: 'Inteligencia semanal privada',
          desc: 'Un brief del lunes con lo que realmente está moviendo el ecosistema — no publicado en ningún otro lado.',
        },
        {
          title: 'Sesión en vivo mensual',
          desc: 'Un founder en el hot seat. Diagnóstico real. Consecuencias reales.',
        },
        {
          title: 'Directorio de recursos curado',
          desc: 'Abogados, capital, desarrolladores y herramientas — verificados por personas que los han usado.',
        },
        {
          title: 'Acceso a comunidad privada',
          desc: 'Un grupo pequeño y selecto. Alta señal. Cero ruido.',
        },
        {
          title: 'Talleres y asesoría',
          desc: 'Sesiones prácticas trimestrales sobre lo que está funcionando ahora.',
        },
      ],
    },

    table: {
      eyebrow: 'The Table',
      headline: 'Para miembros listos para\nla siguiente conversación.',
      desc: 'Introducciones directas a inversionistas, corporativos y socios estratégicos — con el objetivo explícito de producir un deal, un LOI o un acuerdo formal.',
      note: 'Disponible para miembros activos después de 30 días. No incluido. No es para todos.',
    },

    who: {
      label: 'Para Quién Es',
      items: [
        'Founders con algo real ya en movimiento.',
        'Operadores que toman decisiones que cuestan dinero.',
        'Builders que ya terminaron de hacerlo solos.',
      ],
      notFor: [
        'No es para personas explorando si empezar.',
        'No es para observadores pasivos.',
      ],
    },

    about: {
      label: 'Sobre el Club',
      headline: 'Este es ese cuarto.',
      text: 'MVP Club es construido por Cairo Arévalo — venture builder, operador de ecosistemas y fundador de Max Venture Power, el newsletter de venture de mayor crecimiento en LATAM.\n\nLo construyó porque las conversaciones más valiosas del ecosistema ocurren en cuartos a los que la mayoría de founders nunca llega.',
    },

    pricing: {
      label: 'Precios',
      headline: 'Simple. Por niveles. Justo.',
      tiers: [
        { label: 'Fundador', range: '1–20', price: '$80 / mes' },
        { label: 'Nivel 2', range: '21–50', price: '$97 / mes' },
        { label: 'Nivel 3', range: '51–100', price: '$120 / mes' },
        { label: 'Nivel 4', range: '100+', price: '$150 / mes' },
      ],
      lock: 'Tu precio se fija cuando te unes. Cancelas y lo pierdes.',
    },

    cta: {
      headline: 'Tú aplicas.\nCairo revisa.\nEntras o no entras.',
      button: 'Aplicar Ahora',
    },

    footer: {
      copy: '© 2026 MVP Club · por Max Venture Power',
      link: 'maxventurepower.com',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GOLD accent colour
const GOLD = '#B8962E';
const GOLD_LIGHT = '#D4AF5A';
const CREAM = '#F0EAE0';
const WARM_GRAY = '#7A7168';
const BG = '#060504';
const SURFACE = '#0C0B09';
const BORDER = '#1C1A16';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: fade-in reveal hook
// ─────────────────────────────────────────────────────────────────────────────
const FadeUp = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER COUNTER COMPONENT — elegant bars
// ─────────────────────────────────────────────────────────────────────────────
const MemberCounter = ({ tr, count, error }) => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (inView && count !== null) setTimeout(() => setAnimated(true), 300);
  }, [inView, count]);

  const totalMembers = count ?? 0;
  const rawTiers = buildTiers(totalMembers);
  const isLoading = count === null && !error;

  const tiers = rawTiers.map((tier, i) => {
    const prevSoldOut = rawTiers.slice(0, i).every((t) => t.soldOut);
    const isActive = i === 0 ? !tier.soldOut : prevSoldOut && !tier.soldOut;
    return {
      ...tier,
      active: isActive,
      remaining: tier.spots ? tier.spots - tier.filled : null,
      progress: tier.spots ? (tier.filled / tier.spots) * 100 : 0,
    };
  });

  const activeTier = tiers.find((t) => t.active) || tiers[0];

  return (
    <div ref={ref} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>

      {/* ── Header stat ── */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: WARM_GRAY, marginBottom: '0.5rem' }}>
          {tr.counter.label}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
          <span style={{ fontSize: '3.5rem', fontWeight: 900, color: isLoading ? BORDER : GOLD, letterSpacing: '-0.04em', lineHeight: 1, transition: 'color 0.4s' }}>
            {isLoading ? '·' : totalMembers}
          </span>
          {!isLoading && !error && activeTier.spots && (
            <span style={{ fontSize: '0.8rem', color: WARM_GRAY }}>
              / {activeTier.spots} {tr.counter.founding.toLowerCase()}
            </span>
          )}
        </div>
        {!isLoading && !error && activeTier.remaining > 0 && (
          <p style={{ fontSize: '0.72rem', color: GOLD, marginTop: '0.25rem', opacity: 0.8 }}>
            {tr.counter.spotsLeft(activeTier.remaining)}
          </p>
        )}
      </div>

      {/* ── Tier bars ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {tiers.map((tier, i) => {
          const isCurrent = tier.active;
          const isDone = tier.soldOut;
          const isLocked = !isCurrent && !isDone;
          const opacity = isLocked ? 0.28 : 1;

          return (
            <div key={tier.id} style={{ opacity, transition: 'opacity 0.3s' }}>
              {/* Top row: label + price + status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  {isCurrent && (
                    <span className="relative flex shrink-0" style={{ width: 7, height: 7 }}>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ background: GOLD }} />
                      <span className="relative inline-flex rounded-full h-full w-full" style={{ background: GOLD }} />
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: isCurrent ? GOLD : WARM_GRAY }}>
                    {i === 0 ? tr.counter.founding : `${tr.counter.tier} ${i + 1}`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isDone && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: WARM_GRAY, opacity: 0.6 }}>
                      {tr.counter.soldOut}
                    </span>
                  )}
                  {isLocked && tier.unlockAt && (
                    <span style={{ fontSize: '0.65rem', color: WARM_GRAY, opacity: 0.7 }}>
                      {tr.counter.unlockAt(tier.unlockAt)}
                    </span>
                  )}
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: isCurrent ? CREAM : WARM_GRAY, letterSpacing: '-0.01em' }}>
                    {tier.price}
                    <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>/mo</span>
                  </span>
                </div>
              </div>

              {/* Bar track */}
              <div style={{ position: 'relative', height: 10, background: `${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
                {/* Segment dividers every 5 spots */}
                {tier.spots && Array.from({ length: Math.floor(tier.spots / 5) - 1 }).map((_, j) => (
                  <div
                    key={j}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${((j + 1) * 5 / tier.spots) * 100}%`,
                      width: 2,
                      background: BG,
                      zIndex: 2,
                    }}
                  />
                ))}
                {/* Fill */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: animated && (isCurrent || isDone) ? `${tier.progress}%` : '0%',
                    background: isDone
                      ? `linear-gradient(90deg, ${WARM_GRAY}80, ${WARM_GRAY}40)`
                      : `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                    transition: `width ${0.9 + i * 0.15}s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms`,
                  }}
                />
              </div>

              {/* Bottom row: spots filled */}
              {(isCurrent || isDone) && tier.spots && (
                <p style={{ fontSize: '0.65rem', color: WARM_GRAY, marginTop: '0.4rem', opacity: 0.7 }}>
                  {tr.counter.spotsOf(tier.filled, tier.spots)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Price lock note ── */}
      <p style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: `1px solid ${BORDER}`, fontSize: '0.68rem', color: WARM_GRAY, fontStyle: 'italic', opacity: 0.55 }}>
        {tr.counter.yourPriceLocks}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────────────────────
const Divider = () => (
  <div style={{ height: 1, background: BORDER, margin: '0' }} />
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function MVPClub() {
  const [lang, setLang] = useState('en');
  const [scrolled, setScrolled] = useState(false);
  const { count } = useMemberCount();
  const tr = t[lang];

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  // Grain overlay SVG (inline, no external requests)
  const grainSVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        color: CREAM,
        fontFamily: 'DM Sans, sans-serif',
        position: 'relative',
      }}
    >
      {/* Grain texture */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: grainSVG,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          opacity: 0.025,
          pointerEvents: 'none',
          zIndex: 999,
        }}
      />

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrolled ? `${BG}F0` : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? `1px solid ${BORDER}` : '1px solid transparent',
          transition: 'all 0.4s ease',
        }}
      >
        <a
          href="/"
          style={{
            fontSize: '0.7rem',
            color: WARM_GRAY,
            textDecoration: 'none',
            letterSpacing: '0.1em',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.color = CREAM)}
          onMouseLeave={(e) => (e.target.style.color = WARM_GRAY)}
        >
          {tr.nav.back}
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Lang toggle */}
          <button
            onClick={() => setLang((l) => (l === 'en' ? 'es' : 'en'))}
            style={{
              fontSize: '0.65rem',
              color: WARM_GRAY,
              background: 'transparent',
              border: `1px solid ${BORDER}`,
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = CREAM; e.currentTarget.style.borderColor = WARM_GRAY; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = WARM_GRAY; e.currentTarget.style.borderColor = BORDER; }}
          >
            {tr.nav.lang}
          </button>

          {/* Apply CTA */}
          <a
            href={APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.7rem',
              color: BG,
              background: GOLD,
              border: `1px solid ${GOLD}`,
              padding: '0.45rem 1.1rem',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = GOLD_LIGHT)}
            onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
          >
            {tr.nav.apply}
          </a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: '9rem', paddingBottom: '5rem' }}>
        <div
          style={{
            maxWidth: '88rem',
            margin: '0 auto',
            padding: '0 clamp(1.25rem, 5vw, 5rem)',
          }}
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}
          >
            <div style={{ width: 28, height: 1, background: GOLD }} />
            <span style={{ fontSize: '1.3rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD }}>
              {tr.badge}
            </span>
          </motion.div>

          {/* Main grid: headline left, counter right */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr)',
            gap: '3rem',
          }}
            className="hero-grid"
          >
            {/* Left: headline + sub + CTA */}
            <div style={{ minWidth: 0 }}>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color: CREAM,
                  marginBottom: '1.5rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {tr.hero.headline}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.22 }}
                style={{ fontSize: 'clamp(1rem, 1.3vw, 1.1rem)', color: WARM_GRAY, lineHeight: 1.7, marginBottom: '2rem', maxWidth: '52ch' }}
              >
                {tr.hero.sub}
              </motion.p>

              {/* Price + CTA row */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}
              >
                <div>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: CREAM, letterSpacing: '-0.02em' }}>
                    {tr.hero.price}
                  </span>
                  <p style={{ fontSize: '0.72rem', color: WARM_GRAY, marginTop: '0.2rem' }}>{tr.hero.priceSub}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <a
                    href={APPLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.85rem 1.75rem', background: GOLD, color: '#050504',
                      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '0.78rem',
                      letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
                      transition: 'background 0.2s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = GOLD_LIGHT)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
                  >
                    {tr.hero.cta}
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                  <p style={{ fontSize: '0.68rem', color: WARM_GRAY, fontStyle: 'italic' }}>{tr.hero.note}</p>
                </div>
              </motion.div>
            </div>

            {/* Right: Counter */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '2rem' }}
              className="counter-col"
            >
              <MemberCounter tr={tr} count={count} error={false} />
            </motion.div>
          </div>
        </div>
      </section>

      <style>{`
        @media (min-width: 768px) {
          .hero-grid {
            grid-template-columns: 3fr 2fr !important;
            gap: 5rem !important;
            align-items: start;
          }
          .counter-col {
            border-top: none !important;
            padding-top: 0.5rem !important;
          }
        }
      `}</style>

      <Divider />

      {/* ── WHAT YOU GET ─────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 6rem)',
          maxWidth: '72rem',
          margin: '0 auto',
        }}
      >
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3.5rem' }}>
            <div style={{ width: 28, height: 1, background: GOLD }} />
            <span
              style={{
                fontSize: '1.3rem',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: GOLD,
              }}
            >
              {tr.benefits.label}
            </span>
          </div>
        </FadeUp>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            border: `1px solid ${BORDER}`,
          }}
        >
          {tr.benefits.items.map((item, i) => (
            <FadeUp key={item.title} delay={i * 70}>
              <div
                style={{
                  padding: '2.25rem 2rem',
                  borderRight: i % 2 === 0 ? `1px solid ${BORDER}` : 'none',
                  borderBottom: i < tr.benefits.items.length - 1 ? `1px solid ${BORDER}` : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background 0.3s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    color: GOLD,
                    opacity: 0.5,
                    display: 'block',
                    marginBottom: '0.75rem',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  style={{
                    fontFamily: 'Playfair Display, Georgia, serif',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: CREAM,
                    marginBottom: '0.6rem',
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: WARM_GRAY, lineHeight: 1.65 }}>
                  {item.desc}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── THE TABLE ────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 6rem)',
          maxWidth: '72rem',
          margin: '0 auto',
        }}
      >
        <FadeUp>
          <div
            style={{
              border: `1px solid ${GOLD}30`,
              background: `linear-gradient(135deg, ${GOLD}06 0%, transparent 60%)`,
              padding: 'clamp(2.5rem, 5vw, 4rem)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Corner ornament */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 60,
                height: 60,
                borderRight: `1px solid ${GOLD}40`,
                borderBottom: `1px solid ${GOLD}40`,
                background: `linear-gradient(135deg, ${GOLD}10 0%, transparent 100%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 60,
                height: 60,
                borderLeft: `1px solid ${GOLD}40`,
                borderTop: `1px solid ${GOLD}40`,
                background: `linear-gradient(315deg, ${GOLD}10 0%, transparent 100%)`,
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ width: 28, height: 1, background: GOLD }} />
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 800,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: GOLD,
                }}
              >
                {tr.table.eyebrow}
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 'clamp(1.9rem, 3.5vw, 3rem)',
                fontWeight: 700,
                color: CREAM,
                lineHeight: 1.15,
                marginBottom: '1.5rem',
                whiteSpace: 'pre-line',
              }}
            >
              {tr.table.headline}
            </h2>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.3vw, 1.05rem)',
                color: WARM_GRAY,
                lineHeight: 1.75,
                maxWidth: '54ch',
                marginBottom: '1.5rem',
              }}
            >
              {tr.table.desc}
            </p>

            <p
              style={{
                fontSize: '0.8rem',
                color: GOLD,
                fontStyle: 'italic',
                opacity: 0.75,
              }}
            >
              {tr.table.note}
            </p>
          </div>
        </FadeUp>
      </section>

      <Divider />

      {/* ── WHO IS THIS FOR ──────────────────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 6rem)',
          maxWidth: '72rem',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '4rem',
        }}
      >
        {/* For */}
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{ width: 28, height: 1, background: GOLD }} />
            <span
              style={{
                fontSize: '1.3rem',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: GOLD,
              }}
            >
              {tr.who.label}
            </span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tr.who.items.map((item, i) => (
              <li
                key={i}
                style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    border: `1px solid ${GOLD}60`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.5 6L6.5 2" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span style={{ fontSize: '1rem', color: CREAM, lineHeight: 1.6 }}>{item}</span>
              </li>
            ))}
          </ul>

          <div style={{ paddingTop: '1.5rem', borderTop: `1px solid ${BORDER}` }}>
            {tr.who.notFor.map((item, i) => (
              <p
                key={i}
                style={{
                  fontSize: '0.875rem',
                  color: WARM_GRAY,
                  fontStyle: 'italic',
                  marginBottom: '0.5rem',
                  opacity: 0.65,
                }}
              >
                {item}
              </p>
            ))}
          </div>
        </FadeUp>

        {/* About */}
        <FadeUp delay={120}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{ width: 28, height: 1, background: GOLD }} />
            <span
              style={{
                fontSize: '1.3rem',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: GOLD,
              }}
            >
              {tr.about.label}
            </span>
          </div>
          <h2
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(1.6rem, 2.5vw, 2.25rem)',
              fontWeight: 700,
              color: CREAM,
              lineHeight: 1.2,
              marginBottom: '1.5rem',
            }}
          >
            {tr.about.headline}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tr.about.text.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: '0.95rem', color: WARM_GRAY, lineHeight: 1.75 }}>
                {para}
              </p>
            ))}
          </div>
        </FadeUp>
      </section>

      <Divider />

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 6rem)',
          maxWidth: '72rem',
          margin: '0 auto',
        }}
      >
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 28, height: 1, background: GOLD }} />
            <span
              style={{
                fontSize: '1.3rem',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: GOLD,
              }}
            >
              {tr.pricing.label}
            </span>
          </div>
          <h2
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(1.9rem, 3vw, 2.8rem)',
              fontWeight: 700,
              color: CREAM,
              lineHeight: 1.15,
              marginBottom: '3rem',
            }}
          >
            {tr.pricing.headline}
          </h2>
        </FadeUp>

        <div style={{ border: `1px solid ${BORDER}` }}>
          {tr.pricing.tiers.map((tier, i) => {
            const tierData = buildTiers(count ?? 0)[i];
            const isSoldOut = tierData.soldOut;
            const prevSoldOut = buildTiers(count ?? 0).slice(0, i).every((t) => t.soldOut);
            const isCurrent = i === 0 ? !isSoldOut : (prevSoldOut && !isSoldOut);
            const isLocked = !isCurrent && !isSoldOut;

            return (
              <FadeUp key={tier.label} delay={i * 60}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1.5rem 2rem',
                    borderBottom: i < tr.pricing.tiers.length - 1 ? `1px solid ${BORDER}` : 'none',
                    background: isCurrent ? `${GOLD}06` : 'transparent',
                    opacity: isLocked ? 0.45 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: isCurrent ? GOLD : WARM_GRAY,
                      }}
                    >
                      {tier.label}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: WARM_GRAY, opacity: 0.6 }}>
                      {tier.range}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        color: isCurrent ? CREAM : WARM_GRAY,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {tier.price}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontWeight: 800,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: GOLD,
                          background: `${GOLD}15`,
                          border: `1px solid ${GOLD}35`,
                          padding: '0.25rem 0.6rem',
                        }}
                      >
                        {lang === 'en' ? 'Current' : 'Actual'}
                      </span>
                    )}
                    {isSoldOut && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontWeight: 800,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: WARM_GRAY,
                          background: `${WARM_GRAY}15`,
                          border: `1px solid ${WARM_GRAY}35`,
                          padding: '0.25rem 0.6rem',
                        }}
                      >
                        {tr.counter.soldOut}
                      </span>
                    )}
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>

        <FadeUp delay={250}>
          <p
            style={{
              marginTop: '1.5rem',
              fontSize: '0.8rem',
              color: WARM_GRAY,
              fontStyle: 'italic',
              paddingLeft: '0.25rem',
            }}
          >
            {tr.pricing.lock}
          </p>
        </FadeUp>
      </section>

      <Divider />

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 6vw, 6rem)',
          maxWidth: '72rem',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <FadeUp>
          <h2
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(2.5rem, 5.5vw, 5rem)',
              fontWeight: 700,
              color: CREAM,
              lineHeight: 1.1,
              whiteSpace: 'pre-line',
              marginBottom: '2.5rem',
            }}
          >
            {tr.cta.headline}
          </h2>

          <a
            href={APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 2.5rem',
              background: GOLD,
              color: '#050504',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = GOLD_LIGHT)}
            onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
          >
            {tr.cta.button}
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </FadeUp>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: `1px solid ${BORDER}`,
          padding: '2rem clamp(1.5rem, 6vw, 6rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <p
          style={{
            fontSize: '0.7rem',
            color: WARM_GRAY,
            opacity: 0.6,
            fontFamily: 'Space Grotesk, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          {tr.footer.copy}
        </p>
        <a
          href="/"
          style={{
            fontSize: '0.7rem',
            color: WARM_GRAY,
            opacity: 0.6,
            fontFamily: 'Space Grotesk, sans-serif',
            textDecoration: 'none',
            letterSpacing: '0.05em',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          {tr.footer.link}
        </a>
      </footer>
    </div>
  );
}
