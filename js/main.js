// Remove no-js class (proves JS is running)
document.documentElement.classList.remove('no-js');

// Nav scroll effect
const nav = document.getElementById('nav');
const navHeight = nav.offsetHeight;
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// Smooth scroll with offset (fixed nav compensation)
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// Intersection Observer — reveal on scroll
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Animated counters
const counters = document.querySelectorAll('.num-n[data-target]');
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(target * ease) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObs.unobserve(el);
  });
}, { threshold: 0.3 });
counters.forEach(el => counterObs.observe(el));

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const activeObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    }
  });
}, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });
sections.forEach(s => activeObs.observe(s));

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    if (isOpen) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => { mobileMenu.style.display = 'none'; }, 350);
    } else {
      mobileMenu.style.display = 'flex';
      requestAnimationFrame(() => {
        mobileMenu.classList.add('open');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }
  });

  // Close menu on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => { mobileMenu.style.display = 'none'; }, 350);
    });
  });
}
