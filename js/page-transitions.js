(function () {
  var DURATION = 600; // must match CSS transition duration in ms

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

  // Fade in once the page is ready
  document.addEventListener('DOMContentLoaded', function () {
    assignRevealClasses();

    requestAnimationFrame(function () {
      document.body.classList.add('page-loaded');
      // Wait for body fade to complete before staggering elements in
      setTimeout(showRevealElements, DURATION);
      initScrollReveal();
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

    // Remove visible from reveal elements (they fade out)
    var reveals = document.querySelectorAll('.reveal.visible, .scroll-reveal.visible');
    for (var i = 0; i < reveals.length; i++) {
      reveals[i].classList.remove('visible');
    }
    document.body.classList.remove('page-loaded');

    setTimeout(function () {
      window.location.href = href;
    }, DURATION);
  });

  // Re-fade-in when navigating back via browser history
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      assignRevealClasses();
      document.body.classList.add('page-loaded');
      showRevealElements();
      initScrollReveal();
    }
  });
}());
