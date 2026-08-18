// Resolve theme synchronously, before loader.css is applied, so the
// splash never flashes the wrong theme. Mirrors resolveVuetifyTheme()
// in src/@core/utils/vuetify.js, hand-rolled since Vue isn't loaded yet.
(function () {
  try {
    function readCookie(name) {
      var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    }

    var themeCookie = readCookie('IRON-theme');
    var colorScheme = readCookie('IRON-color-scheme');
    var resolved;

    if (themeCookie === 'dark' || themeCookie === 'light') {
      resolved = themeCookie;
    } else if (colorScheme === 'dark' || colorScheme === 'light') {
      resolved = colorScheme;
    } else {
      resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', resolved);

    var storedAccent = window.localStorage && window.localStorage.getItem('IRON-initial-loader-color');
    if (storedAccent && /^#[0-9a-fA-F]{3,8}$/.test(storedAccent)) {
      document.documentElement.style.setProperty('--iron-accent', storedAccent);
    }
  } catch (e) {}
})();
