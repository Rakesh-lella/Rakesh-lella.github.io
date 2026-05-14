// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
toggle?.addEventListener('click', () => links.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a =>
  a.addEventListener('click', () => links.classList.remove('open'))
);

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section .container > *, .skill-card, .project-card, .t-item, .cert, .contact-card')
  .forEach(el => { el.classList.add('reveal'); observer.observe(el); });

// Smooth header shadow on scroll
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 30 ? '0 10px 30px rgba(0,0,0,0.4)' : 'none';
});
