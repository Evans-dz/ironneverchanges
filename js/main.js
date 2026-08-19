/* ============================================================
   IRON NEVER CHANGES — interaction layer
   Motion language: screen-print, not cinema. Nothing eases or
   glides — content STAMPS in on stepped frames, scroll is the
   browser's own, and the only continuously-animated thing is
   the ticker. GSAP is kept for ScrollTrigger; Lenis is gone on
   purpose. No JS → static page; reduced motion → static + UI.
   ============================================================ */
(() => {
  'use strict';

  document.documentElement.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('reduced');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- scroll helpers (native — no smoothing library) ---------------- */
  const scrollTo = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    const top = target === 0 ? 0 : el ? el.getBoundingClientRect().top + window.scrollY - 70 : 0;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  };
  const lockScroll = (on) => {
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

  /* ---------------- hero: print-strike entry ---------------- */
  const l2 = $('.hero__l2');
  if (reduced) {
    l2.classList.add('is-filled');
  } else {
    document.body.classList.add('go');           /* CSS stamp cascade */
    setTimeout(() => {
      l2.classList.add('is-filled');
      $('.hero__h1').classList.add('rack');       /* one hard tick as the ink lands */
    }, 620);
  }

  /* ---------------- ticker (the one thing allowed to move) ---------------- */
  if (!reduced) {
    gsap.to('#tickerTrack', { xPercent: -50, ease: 'none', duration: 46, repeat: -1 });
  }

  /* ---------------- stamp reveals ---------------- */
  if (!reduced) {
    $$('.reveal, .reveal-up').forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => el.classList.add('stamped'),
      });
    });
    $$('.sec__rule').forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => el.classList.add('ruled'),
      });
    });
  } else {
    $$('.reveal, .reveal-up').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* ---------------- 01 the standard: word scrub (already discrete) ---------------- */
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

  /* ---------------- 02 the wall ---------------- */
  $$('.wall__s').forEach((s) => {
    s.addEventListener('click', () => {
      s.classList.remove('is-hit');
      void s.offsetWidth;                          /* restart the stamp */
      s.classList.add('is-stamped', 'is-hit');
    });
  });

  /* ---------------- the load: scroll progress as plates on a bar ---------------- */
  const loadEl = $('#load');
  if (loadEl) {
    const plates = $$('.ld__p', loadEl);
    const wt = $('#loadWt');
    const WEIGHTS = ['BAR · 45 LB', '135 LB', '225 LB', '315 LB', '405 LB', '495 LB'];
    let stage = -1;
    const setStage = (n) => {
      if (n === stage) return;
      stage = n;
      plates.forEach((p, i) => p.classList.toggle('on', i < n));
      wt.textContent = WEIGHTS[n];
      if (!reduced) {
        loadEl.classList.remove('clank');
        void loadEl.offsetWidth;
        loadEl.classList.add('clank');
      }
    };
    if (reduced) setStage(5);
    else {
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (st) => setStage(Math.min(5, Math.floor(st.progress * 6))),
      });
      setStage(0);
      ScrollTrigger.create({
        trigger: '#standard', start: 'top 90%', end: 'max',
        onToggle: (st) => loadEl.classList.toggle('show', st.isActive),
      });
    }
  }

  /* ---------------- 03 the shop: front/back views ---------------- */
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
    const views = $('.prod__views', card);
    views.addEventListener('click', (e) => {
      if (e.target.closest('.prod__flip')) return;
      set(card.dataset.view === 'front' ? 'back' : 'front');
    });
    /* size chips */
    $$('.prod__size button', card).forEach((b) =>
      b.addEventListener('click', () => {
        $$('.prod__size button', card).forEach((x) => {
          x.classList.toggle('is-on', x === b);
          x.setAttribute('aria-pressed', String(x === b));
        });
      }));
  });

  /* ---------------- cart (demo — client-side only) ---------------- */
  const CART_KEY = 'inc-cart';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }
  const save = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} };

  const cartWrap = $('#cartWrap');
  const cartBtn = $('#cartBtn');
  const cartCount = $('#cartCount');
  const cartItems = $('#cartItems');
  const cartEmpty = $('#cartEmpty');
  const cartFoot = $('#cartFoot');
  const cartTotal = $('#cartTotal');
  const cartDemo = $('#cartDemo');
  let cartOpen = false;

  const money = (n) => '$' + n;
  const count = () => cart.reduce((a, i) => a + i.qty, 0);

  function renderCart() {
    const n = count();
    cartCount.textContent = '(' + n + ')';
    cartBtn.setAttribute('aria-label', 'Cart, ' + n + ' item' + (n === 1 ? '' : 's'));
    cartItems.innerHTML = '';
    cart.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'cart__item';
      li.innerHTML =
        '<span class="cart__iname">' + item.name + '</span>' +
        '<span class="cart__imeta">' + item.sku + ' · SIZE ' + item.size + '</span>' +
        '<span class="cart__ictl">' +
          '<button type="button" data-q="-1" aria-label="One fewer">−</button>' +
          '<b>' + item.qty + '</b>' +
          '<button type="button" data-q="1" aria-label="One more">+</button>' +
        '</span>' +
        '<span class="cart__iprice">' + money(item.price * item.qty) + '</span>' +
        '<button class="cart__ix" type="button" aria-label="Remove">×</button>';
      $$('[data-q]', li).forEach((b) => b.addEventListener('click', () => {
        item.qty += Number(b.dataset.q);
        if (item.qty <= 0) cart.splice(idx, 1);
        save(); renderCart();
      }));
      $('.cart__ix', li).addEventListener('click', () => {
        cart.splice(idx, 1); save(); renderCart();
      });
      cartItems.appendChild(li);
    });
    const has = cart.length > 0;
    cartEmpty.hidden = has;
    cartFoot.hidden = !has;
    if (has) cartTotal.textContent = money(cart.reduce((a, i) => a + i.price * i.qty, 0));
  }

  function openCart() {
    cartOpen = true;
    cartWrap.hidden = false;
    lockScroll(true);
    renderCart();
    $('#cartClose').focus({ preventScroll: true });
  }
  function closeCart() {
    if (!cartOpen) return;
    cartOpen = false;
    cartWrap.hidden = true;
    cartDemo.hidden = true;
    lockScroll(false);
    cartBtn.focus({ preventScroll: true });
  }
  cartBtn.addEventListener('click', () => (cartOpen ? closeCart() : openCart()));
  $('#cartClose').addEventListener('click', closeCart);
  $('#cartScrim').addEventListener('click', closeCart);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCart(); closeMenu(); }
  });

  /* add to cart */
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => {
    const card = b.closest('.prod');
    const size = ($('.prod__size .is-on', card) || {}).textContent || 'M';
    const sku = card.dataset.sku;
    const found = cart.find((i) => i.sku === sku && i.size === size);
    if (found) found.qty += 1;
    else cart.push({ sku, name: card.dataset.name, price: Number(card.dataset.price), size, qty: 1 });
    save(); renderCart();
    const label = b.textContent;
    b.textContent = 'RACKED.';
    b.classList.add('is-hit');
    setTimeout(() => { b.textContent = label; b.classList.remove('is-hit'); }, 900);
  }));

  /* checkout: honest about being a concept build */
  $('#cartCheckout').addEventListener('click', () => {
    cartDemo.hidden = false;
  });

  renderCart();

  /* ---------------- waitlist (demo — intentionally unwired) ---------------- */
  const form = $('#listForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#listEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $('#listEmail').focus();
      form.classList.remove('is-hit'); void form.offsetWidth; form.classList.add('is-hit');
      return;
    }
    form.hidden = true;
    const done = $('#listDone');
    done.hidden = false;
    done.classList.add('stamped');
  });
})();
