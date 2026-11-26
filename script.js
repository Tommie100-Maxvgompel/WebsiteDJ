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
navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
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

  // Vooraf invullen vanuit links als contact.html?pakket=standaard of ?type=bruiloft
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
