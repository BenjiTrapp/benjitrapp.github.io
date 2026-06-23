(function () {
  var DURATION = 350; // must match CSS transition duration in ms

  // Fade in once the page is ready
  document.addEventListener('DOMContentLoaded', function () {
    requestAnimationFrame(function () {
      document.body.classList.add('page-loaded');
    });
  });

  // Fade out before leaving
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');

    // Skip: external, hash-only, new-tab, or modifier-key combos
    if (link.hostname !== window.location.hostname) return;
    if (href.charAt(0) === '#') return;
    if (link.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    document.body.classList.remove('page-loaded');

    setTimeout(function () {
      window.location.href = href;
    }, DURATION);
  });

  // Re-fade-in when navigating back via browser history
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      document.body.classList.add('page-loaded');
    }
  });
}());
