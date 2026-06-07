(function () {
  var menuToggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');

  if (!menuToggle || !nav) return;

  menuToggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('nav-open');
    menuToggle.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close menu when a nav link is clicked
  var navLinks = nav.querySelectorAll('a');
  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].addEventListener('click', function () {
      nav.classList.remove('nav-open');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  }
})();
