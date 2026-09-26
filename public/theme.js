(function () {
  const KEY = 'theme-preference';

  function apply(pref) {
    if (pref === 'dark' || pref === 'light') {
      document.documentElement.setAttribute('data-theme', pref);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function current() {
    return localStorage.getItem(KEY) || 'system';
  }

  // Safe to call again even though the inline snippet in <head>
  // already applied this once — keeps this file self-sufficient.
  apply(current());

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('settings-btn');
    const menu = document.getElementById('settings-menu');
    const options = document.getElementById('theme-options');
    if (!btn || !menu || !options) return; // page has no settings UI

    function syncActive() {
      const pref = current();
      [...options.children].forEach((b) => {
        b.classList.toggle('active', b.dataset.themeChoice === pref);
      });
    }
    syncActive();

    btn.addEventListener('click', () => {
      const isOpen = !menu.hasAttribute('hidden');
      if (isOpen) {
        menu.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        menu.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    options.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const pref = b.dataset.themeChoice;
      localStorage.setItem(KEY, pref);
      apply(pref);
      syncActive();
    });

    document.addEventListener('click', (e) => {
      if (!document.getElementById('settings').contains(e.target)) {
        menu.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();
