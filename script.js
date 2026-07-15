/* ================================================================
   ZANE PIERRE — BEAUTIFUL CHAOS
   script.js — Shared across all pages
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. VORTEX LOADER ── */
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('gone');
      const heroBg = document.querySelector('.hero-img');
      if (heroBg) heroBg.classList.add('loaded');
    }, 2100);
  }

  /* ── 2. NAV SCROLL STATE ── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 3. HAMBURGER / MOBILE MENU ── */
  const burger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── 4. ACTIVE NAV LINK ── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── 5. SCROLL REVEAL ── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => obs.observe(el));
  }

  /* ── 6. NEWSLETTER FORM ── */
  const nlForm = document.getElementById('nl-form');
  if (nlForm) {
    nlForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = nlForm.querySelector('.btn-sub');
      btn.textContent = 'JOINED ✓';
      btn.classList.add('done');
      btn.disabled = true;
      nlForm.querySelector('.nl-input').value = '';
    });
  }

  /* ── 7. CONTACT FORM ── */
  const cf = document.getElementById('cf');
  if (cf) {
    cf.addEventListener('submit', e => {
      e.preventDefault();
      const btn = cf.querySelector('.btn-pink');
      btn.textContent = 'SENDING...';
      btn.disabled = true;
      setTimeout(() => {
        cf.style.display = 'none';
        const ok = document.getElementById('form-ok');
        if (ok) ok.style.display = 'block';
      }, 1400);
    });
  }

  /* ── 8. SUBTLE HERO PARALLAX ── */
  const heroBg = document.querySelector('.hero-img');
  if (heroBg && window.innerWidth > 768) {
    window.addEventListener('scroll', () => {
      heroBg.style.transform = `translateY(${window.scrollY * 0.22}px)`;
    }, { passive: true });
  }

  /* ── 9. CURSOR AMBIENT GLOW (desktop) ── */
  if (window.innerWidth > 1024 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const glow = document.createElement('div');
    glow.style.cssText = 'position:fixed;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(232,0,90,0.055) 0%,transparent 70%);pointer-events:none;z-index:0;transform:translate(-50%,-50%);transition:left 0.12s,top 0.12s;';
    document.body.appendChild(glow);
    document.addEventListener('mousemove', e => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
  }

});
