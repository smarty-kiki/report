(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var progress = document.querySelector('.reading-progress span');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateScrollUI() {
    var top = window.scrollY || window.pageYOffset || 0;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    if (header) {
      header.classList.toggle('is-scrolled', top > 24);
    }
    if (progress) {
      progress.style.transform = 'scaleX(' + Math.min(1, top / max).toFixed(4) + ')';
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateScrollUI();
      ticking = false;
    });
  }, { passive: true });
  window.addEventListener('resize', updateScrollUI, { passive: true });
  updateScrollUI();

  var revealItems = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -8% 0px'
  });

  revealItems.forEach(function (item) { observer.observe(item); });
})();
