// Sticky header: transparant op hero, zwart bij scrollen
const header = document.getElementById('site-header');

function updateHeaderState() {
  if (window.scrollY > 40) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}

updateHeaderState();
window.addEventListener('scroll', updateHeaderState);

// Mobiel menu togglen
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

// Fade-in bij scrollen
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

fadeEls.forEach(el => fadeObserver.observe(el));

// Galerij lightbox
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxMedia = document.getElementById('lightbox-media');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.getElementById('lightbox-close');

gallery.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const media = item.querySelector('.gallery-media');
    lightboxMedia.style.background = getComputedStyle(media).background;
    lightboxCaption.textContent = item.dataset.caption || '';
    lightbox.hidden = false;
    lightboxClose.focus();
  });
});

function closeLightbox() {
  lightbox.hidden = true;
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

// Reviews marquee: kaarten dupliceren voor een naadloze, doorlopende loop
const reviewTrack = document.getElementById('review-track');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const originalCards = Array.from(reviewTrack.children);
  originalCards.forEach(card => {
    reviewTrack.appendChild(card.cloneNode(true));
  });
}

// FAQ accordion
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const panel = trigger.nextElementSibling;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';

    trigger.setAttribute('aria-expanded', String(!isOpen));
    panel.style.maxHeight = isOpen ? '0px' : panel.scrollHeight + 'px';
  });
});

// Offerteformulier validatie
const quoteForm = document.getElementById('quote-form');
const confirmation = document.getElementById('form-confirmation');

function showFieldError(field, message) {
  const errorEl = quoteForm.querySelector(`[data-error-for="${field.id}"]`);
  field.closest('.form-field').classList.toggle('invalid', Boolean(message));
  if (errorEl) errorEl.textContent = message || '';
}

quoteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  confirmation.hidden = true;

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

  confirmation.hidden = false;
  quoteForm.reset();
  requiredFields.forEach(field => showFieldError(field, ''));
});
