/*
 * i18n.js — العربية والإنجليزية
 * ------------------------------------------------------------
 *  tr('نص عربي', 'English text')  → النص حسب اللغة الحالية
 *  T({ar, en})                      → نفس الشيء لكائن ثنائي اللغة
 *  عناصر HTML الثابتة: <span data-en="English">عربي</span>
 */
(function () {
  'use strict';
  let lang = 'ar';
  try { lang = localStorage.getItem('ml.lang') === 'en' ? 'en' : 'ar'; } catch (e) { /* ignore */ }
  const listeners = [];

  const tr = (ar, en) => (lang === 'en' && en != null ? en : ar);
  const T = x => (x == null ? '' : typeof x === 'string' ? x : (lang === 'en' ? (x.en != null ? x.en : x.ar) : x.ar));

  function applyStatic(root) {
    const doc = document.documentElement;
    doc.lang = lang;
    doc.dir = lang === 'en' ? 'ltr' : 'rtl';
    (root || document).querySelectorAll('[data-en]').forEach(el => {
      if (el.dataset.ar == null) el.dataset.ar = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.ar;
    });
    (root || document).querySelectorAll('[data-en-label]').forEach(el => {
      if (el.dataset.arLabel == null) el.dataset.arLabel = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', lang === 'en' ? el.dataset.enLabel : el.dataset.arLabel);
    });
    (root || document).querySelectorAll('[data-en-title]').forEach(el => {
      if (el.dataset.arTitle == null) el.dataset.arTitle = document.title;
      document.title = lang === 'en' ? el.dataset.enTitle : el.dataset.arTitle;
    });
  }

  function set(l) {
    lang = l === 'en' ? 'en' : 'ar';
    try { localStorage.setItem('ml.lang', lang); } catch (e) { /* ignore */ }
    applyStatic();
    listeners.forEach(f => f(lang));
  }

  window.I18N = { get lang() { return lang; }, tr, T, set, applyStatic, onChange: f => listeners.push(f) };
  window.tr = tr;
  window.T = T;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
})();
