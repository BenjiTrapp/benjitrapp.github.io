// Reading progress bar. The element is hidden on desktop/tablet via CSS and
// only shown inside the slim fixed header on smartphones, so this runs cheaply
// everywhere but is only visible where it matters.
(function () {
  var bar = document.querySelector('.reading-progress > span');
  if (!bar) return;

  var ticking = false;

  function update() {
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop || 0;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    bar.style.width = pct + '%';
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // Scrubbing: tap or drag along the bar to jump to that point in the page.
  var track = document.querySelector('.reading-progress');
  if (track) {
    var dragging = false;

    function scrubTo(clientX) {
      var rect = track.getBoundingClientRect();
      if (rect.width <= 0) return; // hidden (desktop/tablet)
      var frac = (clientX - rect.left) / rect.width;
      if (frac < 0) frac = 0;
      if (frac > 1) frac = 1;
      var doc = document.documentElement;
      var height = doc.scrollHeight - doc.clientHeight;
      // behavior:'instant' overrides the page's `scroll-behavior: smooth`, so the
      // scrub tracks the finger immediately instead of animating behind it.
      window.scrollTo({ top: frac * height, behavior: 'instant' });
      update();
    }

    track.addEventListener('pointerdown', function (e) {
      dragging = true;
      if (track.setPointerCapture) {
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
      }
      scrubTo(e.clientX);
      e.preventDefault();
    });

    track.addEventListener('pointermove', function (e) {
      if (dragging) scrubTo(e.clientX);
    });

    function endDrag() { dragging = false; }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
  }
}());
