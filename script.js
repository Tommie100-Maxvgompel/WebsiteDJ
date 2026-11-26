const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


// Header: transparant op de hero, zwart bij scrollen (subpagina's altijd zwart)
const header = document.getElementById('site-header');
const isSubpage = document.body.classList.contains('subpage');
function updateHeaderState() {
  header.classList.toggle('scrolled', isSubpage || window.scrollY > 40);
}
updateHeaderState();
window.addEventListener('scroll', updateHeaderState, { passive: true });

// Mobiel menu
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
// Donkere laag achter het open menu: tikken naast het menu sluit het
const navBackdrop = document.createElement('div');
navBackdrop.className = 'nav-backdrop';
document.body.appendChild(navBackdrop);

const setMenu = open => {
  navLinks.classList.toggle('open', open);
  navBackdrop.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
};
navToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navBackdrop.addEventListener('click', () => setMenu(false));
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) setMenu(false);
});

// Reviews: kaarten dupliceren voor een naadloze loop
const reviewTrack = document.getElementById('review-track');
if (reviewTrack && !prefersReducedMotion) {
  Array.from(reviewTrack.children).forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    reviewTrack.appendChild(clone);
  });
}

// Reviews op mobiel: zelf vegen + rustig automatisch doorlopen, oneindig in beide richtingen
if (reviewTrack) {
  const marquee = reviewTrack.parentElement;
  const all = Array.from(reviewTrack.children);
  const n = all.filter(c => !c.hasAttribute('aria-hidden')).length;
  const looped = all.length >= 2 * n;
  const mobile = window.matchMedia('(max-width: 768px)');
  const step = () => (all.length > 1 ? all[1].offsetLeft - all[0].offsetLeft : 1);
  const currentIndex = () => Math.round(marquee.scrollLeft / step());
  const goTo = (i, smooth = true) => marquee.scrollTo({ left: i * step(), behavior: smooth ? 'smooth' : 'instant' });

  // Positie binnen [half, half + n) houden, zodat je altijd beide kanten op kunt vegen
  const half = Math.floor(n / 2);
  const normalize = () => {
    if (!looped || !mobile.matches) return;
    const i = currentIndex();
    if (i < half) goTo(i + n, false);
    else if (i >= half + n) goTo(i - n, false);
  };

  // Oneindige bolletjes: het actieve staat in het midden, naar de randen worden ze kleiner
  const VISIBLE = 3;
  const dots = document.createElement('div');
  dots.className = 'review-dots';
  dots.setAttribute('aria-hidden', 'true');
  const strip = document.createElement('div');
  strip.className = 'review-dots-strip';
  const dotEls = [];
  for (let j = 0; j < 3 * n; j++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.tabIndex = -1;
    dot.addEventListener('click', () => { pause(); jump(j - center); });
    strip.appendChild(dot);
    dotEls.push(dot);
  }
  dots.appendChild(strip);
  marquee.after(dots);

  const PITCH = 18;
  let center = n;        // positie van het actieve bolletje in de strip
  let lastIdx = 0;       // laatst getoonde review (0..n-1)
  const render = (c, animate) => {
    strip.classList.toggle('no-anim', !animate);
    strip.style.transform = `translateX(${(VISIBLE * PITCH) - c * PITCH}px)`;
    dotEls.forEach((d, j) => {
      const dist = Math.abs(j - c);
      d.className = dist === 0 ? 'is-active' : dist > VISIBLE ? 'is-gone' : 'is-d' + dist;
    });
    if (!animate) void strip.offsetWidth;
  };
  const updateDots = () => {
    const idx = ((currentIndex() % n) + n) % n;
    let delta = idx - lastIdx;
    if (delta > n / 2) delta -= n;
    if (delta < -n / 2) delta += n;
    if (!delta) return;
    lastIdx = idx;
    let next = center + delta;
    if (next >= 2 * n || next < n) {
      // Ongemerkt een periode terug/vooruit verschuiven, dan pas animeren
      const shift = next >= 2 * n ? -n : n;
      render(center + shift, false);
      next += shift;
    }
    center = next;
    render(center, true);
  };
  const jump = d => {
    let target = currentIndex() + d;
    if (looped && target < 0) { goTo(currentIndex() + n, false); target += n; }
    goTo(target);
  };

  let settleTimer;
  marquee.addEventListener('scroll', () => {
    updateDots();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { normalize(); updateDots(); }, 150);
  }, { passive: true });

  // Automatisch doorlopen: elke 5 seconden één kaart, pauze bij aanraken
  let autoTimer = null;
  let resumeTimer = null;
  const stop = () => { clearInterval(autoTimer); autoTimer = null; };
  const start = () => {
    stop();
    if (!mobile.matches || prefersReducedMotion) return;
    autoTimer = setInterval(() => goTo(currentIndex() + 1), 5000);
  };
  const pause = () => { stop(); clearTimeout(resumeTimer); resumeTimer = setTimeout(start, 6000); };

  const setup = () => {
    if (mobile.matches && looped) goTo(n, false);   // start op de kopie, zodat terugvegen ook kan
    else marquee.scrollLeft = 0;
    lastIdx = 0;
    center = n;
    render(center, false);
    start();
  };

  marquee.addEventListener('touchstart', pause, { passive: true });
  marquee.addEventListener('pointerdown', pause);
  mobile.addEventListener('change', setup);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  setup();
}

// Galerij lightbox
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
if (gallery && lightbox) {
  const lightboxMedia = document.getElementById('lightbox-media');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  gallery.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      lightboxMedia.innerHTML = '';
      let media;
      if (item.dataset.video) {
        media = document.createElement('video');
        media.src = item.dataset.video;
        media.controls = true;
        media.autoplay = true;
        media.playsInline = true;
      } else {
        media = document.createElement('img');
        media.src = item.dataset.full;
        media.alt = item.dataset.caption || '';
      }
      lightboxMedia.appendChild(media);
      lightboxCaption.textContent = item.dataset.caption || '';
      lightbox.hidden = false;
      lightboxClose.focus();
    });
  });

  const closeLightbox = () => {
    lightbox.hidden = true;
    lightboxMedia.innerHTML = '';
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lightbox.hidden) closeLightbox(); });
}

// Shows: sfeervideo pas laden en afspelen na een klik
const showVideo = document.getElementById('show-video');
if (showVideo) {
  showVideo.addEventListener('click', () => {
    const video = document.createElement('video');
    video.src = showVideo.dataset.video;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    const wrapper = document.createElement('div');
    wrapper.className = 'show-video is-playing';
    wrapper.appendChild(video);
    showVideo.replaceWith(wrapper);
    video.play().catch(() => {});
  }, { once: true });
}

// Offerteformulier: validatie + versturen via Web3Forms
const quoteForm = document.getElementById('quote-form');
if (quoteForm) {
  const quoteSubmit = document.getElementById('quote-submit');
  const confirmation = document.getElementById('form-confirmation');
  const errorMessage = document.getElementById('form-error-message');

  // Vooraf invullen vanuit links als contact?pakket=standaard of ?type=bruiloft
  const params = new URLSearchParams(location.search);
  const prefill = (selectId, value) => {
    const select = document.getElementById(selectId);
    if (value && select.querySelector(`option[value="${CSS.escape(value)}"]`)) select.value = value;
  };
  prefill('qf-package', params.get('pakket'));
  prefill('qf-event-type', params.get('type'));

  const showFieldError = (field, message) => {
    const errorEl = quoteForm.querySelector(`[data-error-for="${field.id}"]`);
    field.closest('.form-field').classList.toggle('invalid', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
  };

  quoteForm.addEventListener('submit', async e => {
    e.preventDefault();
    confirmation.hidden = true;
    errorMessage.hidden = true;

    let isValid = true;
    const requiredFields = quoteForm.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        showFieldError(field, 'Dit veld is verplicht.');
        isValid = false;
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        showFieldError(field, 'Vul een geldig e-mailadres in.');
        isValid = false;
      } else if (field.type === 'tel' && !/^[\d\s()+-]{6,}$/.test(field.value)) {
        showFieldError(field, 'Vul een geldig telefoonnummer in.');
        isValid = false;
      } else {
        showFieldError(field, '');
      }
    });
    if (!isValid) return;

    // Honeypot: ingevuld = bot, stil negeren
    if (quoteForm.botcheck.checked) {
      quoteForm.reset();
      return;
    }

    quoteSubmit.disabled = true;
    quoteSubmit.textContent = 'Versturen...';
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(quoteForm)
      });
      const result = await response.json();
      if (result.success) {
        confirmation.hidden = false;
        quoteForm.reset();
      } else {
        errorMessage.hidden = false;
      }
    } catch (err) {
      errorMessage.hidden = false;
    } finally {
      quoteSubmit.disabled = false;
      quoteSubmit.textContent = 'Offerte aanvragen';
    }
  });
}
