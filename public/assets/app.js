document.documentElement.classList.add('enhanced');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const updateHeader = () => document.body.classList.toggle('is-scrolled', window.scrollY > 36);
addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-panel');
const mobile = matchMedia('(max-width: 700px)');
if (menuButton && menu) {
  const closeMenu = (restoreFocus = false) => {
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('menu-open');
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    if (!open) return closeMenu(true);
    menu.classList.add('open');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close navigation');
    document.body.classList.add('menu-open');
    menu.querySelector('a')?.focus();
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(true); }
    if (event.key === 'Tab') {
      const focusable = [menuButton, ...menu.querySelectorAll('a')];
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  mobile.addEventListener('change', () => closeMenu());
}

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.remove('waiting'); observer.unobserve(entry.target); }
  }), { threshold: .08, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.reveal').forEach(element => {
    if (element.getBoundingClientRect().top > window.innerHeight) element.classList.add('waiting');
    observer.observe(element);
  });
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

const gallery = document.querySelector('.gallery');
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const value = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  gallery.classList.toggle('filtered', value !== 'all');
  let shown = 0;
  gallery.querySelectorAll('.gallery-item').forEach(item => {
    item.hidden = value !== 'all' && item.dataset.category !== value;
    if (!item.hidden) shown++;
  });
  const announcement = document.querySelector('#gallery-status');
  if (announcement) announcement.textContent = `${shown} visuals shown.`;
}));

function makeDialog(className, label) {
  const dialog = document.createElement('dialog'); dialog.className = className; dialog.setAttribute('aria-label', label);
  const close = document.createElement('button'); close.className = 'dialog-close'; close.type = 'button';
  close.textContent = '×'; close.setAttribute('aria-label', 'Close'); close.addEventListener('click', () => dialog.close());
  dialog.append(close); document.body.append(dialog);
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { dialog.querySelector('iframe')?.remove(); });
  return dialog;
}

const photos = document.querySelectorAll('[data-photo]');
if (photos.length) {
  const lightbox = makeDialog('lightbox', 'J!NX visual');
  const photo = document.createElement('img'), caption = document.createElement('p');
  lightbox.append(photo, caption);
  photos.forEach(button => button.addEventListener('click', () => {
    const source = button.querySelector('img'); photo.src = source.src; photo.alt = source.alt;
    caption.textContent = button.dataset.photo; lightbox.showModal();
  }));
}

const releases = {
  'static-rebel': {
    title: 'Static Rebel', track: '5EhdfUMwMjuetnnQ3K8duB',
    spotify: 'https://open.spotify.com/track/5EhdfUMwMjuetnnQ3K8duB',
    apple: 'https://music.apple.com/album/static-rebel-single/1871383227'
  },
  'chromatic-dreams': {
    title: 'Chromatic Dreams', track: '6YRsF8P7ioSrsn903rhSmI',
    spotify: 'https://open.spotify.com/track/6YRsF8P7ioSrsn903rhSmI',
    apple: 'https://music.apple.com/album/chromatic-dreams-single/1852219265'
  }
};
const streamButtons = document.querySelectorAll('[data-stream]');
if (streamButtons.length) {
  const streamDialog = makeDialog('stream-dialog', 'Listen to J!NX');
  const body = document.createElement('div'); body.className = 'dialog-body'; streamDialog.append(body);
  streamButtons.forEach(button => button.addEventListener('click', () => {
    const release = releases[button.dataset.stream]; if (!release) return;
    body.replaceChildren();
    const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'Choose your platform';
    const title = document.createElement('h2'); title.textContent = release.title;
    const links = document.createElement('div'); links.className = 'platform-links';
    for (const [label, url] of [['Spotify', release.spotify], ['Apple Music', release.apple], ['YouTube Music · artist channel', 'https://music.youtube.com/channel/UCfnqeK60B8ZPpxMbfNx6h_w']]) {
      const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      const name = document.createElement('span'); name.textContent = label;
      const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      link.append(name, arrow); links.append(link);
    }
    const load = document.createElement('button'); load.className = 'spotify-load'; load.textContent = 'Play here with Spotify →'; load.type = 'button';
    const help = document.createElement('p'); help.className = 'embed-help'; help.textContent = 'Loading this player connects to Spotify. You can also open a platform above.';
    load.addEventListener('click', () => {
      const frame = document.createElement('iframe'); frame.className = 'spotify-frame';
      frame.src = `https://open.spotify.com/embed/track/${release.track}?utm_source=generator&theme=0`;
      frame.title = `Spotify player — ${release.title}`;
      frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'; frame.referrerPolicy = 'strict-origin-when-cross-origin';
      load.replaceWith(frame);
    }, { once: true });
    body.append(eyebrow, title, links, load, help); streamDialog.showModal();
  }));
}

const intake = document.querySelector('#intake-form');
if (intake) {
  const explanation = intake.elements.explanation;
  const count = document.querySelector('#explanation-count');
  const status = document.querySelector('#form-notice');
  const submit = intake.querySelector('button[type=submit]');
  const params = new URLSearchParams(window.location.search);
  if (params.get('reason') === 'objects') intake.elements.reason.value = 'objects';
  const interests = ['Collection details', 'T-shirts', 'Jackets', 'Posters', 'Accessories', 'Limited drops'];
  const selectedInterest = params.get('interest');
  if (interests.includes(selectedInterest)) intake.elements.interest.value = selectedInterest;
  const interestField = document.querySelector('#interest-field');
  const showInterest = () => { interestField.hidden = intake.elements.reason.value !== 'objects'; };
  intake.elements.reason.addEventListener('change', showInterest); showInterest();
  explanation.addEventListener('input', () => {
    explanation.setCustomValidity(''); count.textContent = `${explanation.value.length.toLocaleString()} / 3,000`;
  });
  for (const element of [intake.elements.name, intake.elements.email, intake.elements.reason]) {
    element.addEventListener('input', () => element.setCustomValidity(''));
  }
  function notify(message, type) {
    status.replaceChildren(); status.className = `form-notice ${type}`; status.hidden = false;
    const paragraph = document.createElement('p'); paragraph.textContent = message; status.append(paragraph);
    if (type === 'error') {
      const email = document.createElement('a'); email.href = 'mailto:vandalenzan102@gmail.com'; email.textContent = 'Email J!NX directly';
      status.append(email);
    }
  }
  intake.addEventListener('submit', async event => {
    event.preventDefault(); if (submit.disabled) return;
    explanation.setCustomValidity(explanation.value.trim().replace(/\s+/g, ' ').length < 20 ? 'Please explain why you are contacting J!NX using at least 20 characters.' : '');
    intake.elements.name.setCustomValidity(intake.elements.name.value.trim().length < 2 ? 'Please enter your name.' : '');
    if (!intake.reportValidity()) return;
    const values = Object.fromEntries(new FormData(intake));
    if (values.reason !== 'objects') values.interest = '';
    submit.disabled = true; const original = submit.textContent; submit.textContent = 'Sending your inquiry…'; status.hidden = true;
    const slow = setTimeout(() => { submit.textContent = 'Still sending. Please keep this page open…'; }, 8000);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(values), signal: AbortSignal.timeout(30_000) });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        for (const [field, message] of Object.entries(result.errors || {})) {
          if (intake.elements[field]?.setCustomValidity) intake.elements[field].setCustomValidity(message);
        }
        intake.reportValidity(); throw new Error(result.message || 'Your inquiry could not be sent. Please try again.');
      }
      intake.hidden = true; notify(result.message, 'success');
      const title = document.createElement('h2'); title.textContent = 'Inquiry submitted.'; status.prepend(title);
      const again = document.createElement('button'); again.className = 'button silver'; again.type = 'button'; again.textContent = 'Send another inquiry →';
      again.addEventListener('click', () => { intake.reset(); intake.hidden = false; status.hidden = true; count.textContent = '0 / 3,000'; showInterest(); intake.elements.name.focus(); });
      status.append(again); status.setAttribute('tabindex', '-1'); status.focus();
    } catch (error) {
      notify(error.name === 'TimeoutError' ? 'The connection timed out. Please email J!NX directly if you need to confirm receipt.' : (error.message || 'Your inquiry could not be sent. Please try again.'), 'error');
    } finally { clearTimeout(slow); submit.disabled = false; submit.textContent = original; }
  });
}
