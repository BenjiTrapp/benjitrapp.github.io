(function () {
  var LEAVE_DURATION = 260; // must match CSS .page-leaving transition (ms)

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-assign reveal classes to main content sections on load
  function assignRevealClasses() {
    // Header area
    var masthead = document.querySelector('.wrapper-masthead');
    if (masthead) {
      masthead.classList.add('reveal', 'reveal-delay-1');
    }

    // Main content area
    var main = document.getElementById('main');
    if (main) {
      // If the page has a post listing, stagger individual posts
      var posts = main.querySelector('.posts');
      if (posts) {
        var articles = posts.querySelectorAll('article.post');
        for (var i = 0; i < articles.length; i++) {
          if (i < 4) {
            // First few posts: immediate stagger (above the fold)
            articles[i].classList.add('reveal', 'reveal-delay-' + (i + 2));
          } else {
            // Rest: scroll-triggered
            articles[i].classList.add('scroll-reveal');
          }
        }
      } else {
        // Single page/post content: stagger direct children
        var children = main.children;
        for (var i = 0; i < children.length; i++) {
          var delay = Math.min(i + 2, 8);
          children[i].classList.add('reveal', 'reveal-delay-' + delay);
        }
      }
    }

    // Footer
    var footer = document.querySelector('.wrapper-footer');
    if (footer) {
      footer.classList.add('scroll-reveal');
    }
  }

  // Trigger visibility for above-the-fold reveal elements
  function showRevealElements() {
    var reveals = document.querySelectorAll('.reveal');
    for (var i = 0; i < reveals.length; i++) {
      reveals[i].classList.add('visible');
    }
  }

  // Show every reveal/scroll-reveal element at once (no animation path)
  function showEverything() {
    var els = document.querySelectorAll('.reveal, .scroll-reveal');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('visible');
    }
  }

  // Intersection Observer for scroll-triggered elements
  function initScrollReveal() {
    var scrollElements = document.querySelectorAll('.scroll-reveal');
    if (!scrollElements.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      });

      scrollElements.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback: show all immediately
      scrollElements.forEach(function (el) {
        el.classList.add('visible');
      });
    }
  }

  // Reveal the page. The body fade-in and the staggered content reveal are
  // started together (overlapping) rather than in sequence, so the page
  // settles quickly and cleanly even when the network was slow.
  function revealPage() {
    assignRevealClasses();
    document.body.classList.add('page-loaded');

    if (prefersReducedMotion) {
      showEverything();
      return;
    }

    // Two frames: let the browser paint the initial (hidden) state once,
    // then flip elements to visible so the CSS transition actually runs.
    requestAnimationFrame(function () {
      requestAnimationFrame(showRevealElements);
    });
    initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealPage);
  } else {
    // Script ran after the document was already parsed
    revealPage();
  }

  // Fade out before leaving (internal navigation only)
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');

    // Skip: external, hash-only, new-tab, or modifier-key combos
    if (link.hostname !== window.location.hostname) return;
    if (href.charAt(0) === '#') return;
    if (link.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // No motion preference: navigate straight away, no artificial delay
    if (prefersReducedMotion) return;

    e.preventDefault();

    document.body.classList.remove('page-loaded');
    document.body.classList.add('page-leaving');

    setTimeout(function () {
      window.location.href = href;
    }, LEAVE_DURATION);
  });

  // Re-fade-in when navigating back via browser history (bfcache restore)
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      document.body.classList.remove('page-leaving');
      assignRevealClasses();
      document.body.classList.add('page-loaded');
      showEverything();
    }
  });
}());
