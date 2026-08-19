/* ============================================================
   IRON NEVER CHANGES — interaction layer
   Lenis smooth scroll + GSAP ScrollTrigger. Everything degrades:
   no JS → static page; reduced motion → static page with JS UI.
   ============================================================ */
(() => {
  'use strict';

  document.documentElement.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('reduced');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- smooth scroll ---------------- */
  let lenis = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else {
      const el = typeof target === 'string' ? $(target) : target;
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: reduced ? 'auto' : 'smooth' });
    }
  };
  /* scroll lock needs BOTH: under reduced motion Lenis is never constructed */
  const lockScroll = (on) => {
    if (lenis) on ? lenis.stop() : lenis.start();
    document.documentElement.style.overflow = on ? 'hidden' : '';
  };

  /* ---------------- anchors ---------------- */
  $$('[data-scroll]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      closeMenu();
      scrollTo(href === '#top' ? 0 : href);
    });
  });

  /* ---------------- nav ---------------- */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('is-solid', window.scrollY > 40);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* active link */
  const links = $$('.nav__links a');
  const byHash = {};
  links.forEach((l) => { byHash[l.getAttribute('href')] = l; });
  $$('main section[id]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 45%', end: 'bottom 45%',
      onToggle: (st) => {
        const l = byHash['#' + sec.id];
        if (l) l.classList.toggle('is-active', st.isActive);
      },
    });
  });

  /* ---------------- menu ---------------- */
  const burger = $('#burger');
  const menu = $('#menu');
  menu.hidden = true;
  let menuOpen = false;
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    burger.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    lockScroll(false);
  }
  burger.addEventListener('click', () => {
    menuOpen = !menuOpen;
    burger.setAttribute('aria-expanded', String(menuOpen));
    menu.hidden = !menuOpen;
    lockScroll(menuOpen);
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------------- hero ---------------- */
  const l2 = $('.hero__l2');
  if (reduced) {
    l2.classList.add('is-filled');
  } else {
    const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
    intro
      .from('.hero__l1', { yPercent: 24, opacity: 0, duration: 0.9 })
      .from('.hero__l2', { yPercent: 24, opacity: 0, duration: 0.9 }, 0.14)
      .add(() => l2.classList.add('is-filled'), 0.95)
      /* the rack settles: one hard 1px tick when YOU DO. fills */
      .to('.hero__h1', { x: 1.5, duration: 0.05, repeat: 3, yoyo: true, ease: 'none' }, 0.95)
      .fromTo('.hero__eyebrow, .hero__lede, .hero__ctas',
        { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.7 }, 0.5);
    gsap.to('.hero__ring', {
      yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
  /* ---------------- ticker ---------------- */
  if (!reduced) {
    gsap.to('#tickerTrack', { xPercent: -50, ease: 'none', duration: 46, repeat: -1 });
  }

  /* ---------------- generic reveals ---------------- */
  if (!reduced) {
    $$('.reveal').forEach((el) => {
      gsap.to(el, {
        opacity: 1, duration: 0.85, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 86%' },
      });
    });
    $$('.reveal-up').forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });
    $$('.sec__rule').forEach((el) => {
      gsap.from(el, {
        scaleX: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
      });
    });
  } else {
    /* belt and braces: CSS .reduced already shows these */
    $$('.reveal, .reveal-up').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* ---------------- 01 the standard: word scrub ---------------- */
  const scrub = $('#scrub');
  if (scrub) {
    const words = scrub.textContent.trim().split(/\s+/);
    scrub.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w-word';
      s.textContent = w;
      scrub.appendChild(s);
      if (i < words.length - 1) scrub.appendChild(document.createTextNode(' '));
    });
    const spans = $$('.w-word', scrub);
    if (reduced) spans.forEach((s) => s.classList.add('lit'));
    else {
      ScrollTrigger.create({
        trigger: scrub, start: 'top 78%', end: 'bottom 42%', scrub: true,
        onUpdate: (st) => {
          const n = Math.round(st.progress * spans.length);
          spans.forEach((s, i) => s.classList.toggle('lit', i < n));
        },
      });
    }
  }

  /* ---------------- 02 the wall: stamp on tap ---------------- */
  $$('.wall__s').forEach((s) => {
    s.addEventListener('click', () => {
      s.classList.add('is-stamped');
      if (!reduced) gsap.fromTo(s, { scale: 0.96 }, { scale: 1, duration: 0.28, ease: 'back.out(3)' });
    });
  });

  /* ---------------- 03 the line: front/back ---------------- */
  $$('.prod').forEach((card) => {
    const set = (face) => {
      card.dataset.view = face;
      $$('.prod__flip button', card).forEach((b) => {
        const on = b.dataset.face === face;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
    };
    $$('.prod__flip button', card).forEach((b) =>
      b.addEventListener('click', () => set(b.dataset.face)));
    /* the view itself flips too — hover to peek on desktop, tap on touch */
    const views = $('.prod__views', card);
    views.addEventListener('click', (e) => {
      if (e.target.closest('.prod__flip')) return;
      set(card.dataset.view === 'front' ? 'back' : 'front');
    });
    if (finePointer) {
      let hovered = false;
      views.addEventListener('mouseenter', () => { hovered = card.dataset.view === 'front'; if (hovered) set('back'); });
      views.addEventListener('mouseleave', () => { if (hovered) { set('front'); hovered = false; } });
    }
  });

  /* notify buttons → waitlist */
  $$('[data-notify]').forEach((b) => b.addEventListener('click', () => {
    scrollTo('#list');
    setTimeout(() => $('#listEmail').focus({ preventScroll: true }), reduced ? 0 : 900);
  }));

  /* ---------------- waitlist (demo — intentionally unwired) ---------------- */
  const form = $('#listForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#listEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $('#listEmail').focus();
      if (!reduced) gsap.fromTo(form, { x: -4 }, { x: 0, duration: 0.3, ease: 'elastic.out(1,0.35)' });
      return;
    }
    form.hidden = true;
    const done = $('#listDone');
    done.hidden = false;
    if (!reduced) gsap.from(done, { opacity: 0, y: 10, duration: 0.5, ease: 'power2.out' });
  });
})();
