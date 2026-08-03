/**
 * MatchedIn landing — scroll reveals, counters, carousel, FAQ, mobile CTA.
 */
(function () {
  const PLAY =
    'https://play.google.com/store/apps/details?id=com.linkedup.mobile';

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return [...(root || document).querySelectorAll(sel)];
  }

  function initReveal() {
    const nodes = qsa('.reveal');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    nodes.forEach((n) => io.observe(n));
  }

  function initNav() {
    const nav = qs('#landing-nav');
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const toggle = qs('[data-landing-menu]');
    const panel = qs('#landing-mobile-panel');
    const backdrop = qs('#landing-mobile-backdrop');
    const close = () => {
      panel?.classList.add('translate-x-full');
      panel?.setAttribute('aria-hidden', 'true');
      backdrop?.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    };
    const open = () => {
      panel?.classList.remove('translate-x-full');
      panel?.setAttribute('aria-hidden', 'false');
      backdrop?.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    };
    toggle?.addEventListener('click', () => {
      const closed = panel?.classList.contains('translate-x-full');
      closed ? open() : close();
    });
    backdrop?.addEventListener('click', close);
    panel?.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  }

  function initCounters() {
    const counters = qsa('[data-count]');
    if (!counters.length) return;

    const animate = (el) => {
      const target = Number(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(target * eased);
        el.textContent = `${prefix}${value.toLocaleString('en-IN')}${suffix}`;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animate);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          animate(e.target);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.4 },
    );
    counters.forEach((c) => io.observe(c));
  }

  function initChips() {
    const chips = qsa('.compat-chip');
    if (!chips.length) return;
    let i = 0;
    setInterval(() => {
      chips.forEach((c) => c.classList.remove('is-active'));
      chips[i % chips.length].classList.add('is-active');
      i += 1;
    }, 1600);
    chips[0]?.classList.add('is-active');
  }

  function initTestimonials() {
    const track = qs('#testimonial-track');
    const dots = qsa('[data-testimonial-dot]');
    if (!track || !dots.length) return;
    let index = 0;
    const cards = qsa('.testimonial-card', track);
    const go = (n) => {
      index = (n + cards.length) % cards.length;
      const cardW = cards[0].getBoundingClientRect().width + 20;
      track.style.transform = `translateX(${-index * cardW}px)`;
      dots.forEach((d, i) => {
        d.classList.toggle('bg-indigo-600', i === index);
        d.classList.toggle('bg-slate-300', i !== index);
      });
    };
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    qs('[data-testimonial-prev]')?.addEventListener('click', () => go(index - 1));
    qs('[data-testimonial-next]')?.addEventListener('click', () => go(index + 1));
    setInterval(() => go(index + 1), 5500);
    window.addEventListener('resize', () => go(index));
  }

  function initFaq() {
    qsa('.faq-item').forEach((item) => {
      const btn = item.querySelector('button');
      btn?.addEventListener('click', () => {
        const open = item.classList.contains('is-open');
        qsa('.faq-item').forEach((other) => other.classList.remove('is-open'));
        if (!open) item.classList.add('is-open');
        btn.setAttribute('aria-expanded', String(!open));
      });
    });
  }

  function initFloatCta() {
    const bar = qs('#float-download');
    if (!bar) return;
    const hero = qs('#hero');
    const update = () => {
      const pastHero = hero
        ? window.scrollY > hero.offsetHeight * 0.55
        : window.scrollY > 480;
      bar.classList.toggle('is-shown', pastHero);
      document.body.classList.toggle('has-float-cta', pastHero);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function initDemo() {
    qsa('[data-watch-demo]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        qs('#screenshots')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function wireStoreLinks() {
    qsa('[data-play-store]').forEach((a) => {
      a.href = PLAY;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
    initCounters();
    initChips();
    initTestimonials();
    initFaq();
    initFloatCta();
    initDemo();
    wireStoreLinks();
  });
})();
