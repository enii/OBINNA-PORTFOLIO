/* Runs in <head>, before the page is drawn: marks that JavaScript is on, and applies the theme: dark,
 * unless the visitor picked light last time, so the page never flashes the wrong colours.
 * (A file rather than an inline script, so the Content Security Policy can allow scripts from this site only.) */
document.documentElement.classList.replace('no-js', 'js');
// The key changed (from 'oo-theme') when the site began opening dark, so a light pick made before then is forgotten.
try {
  var theme = localStorage.getItem('oo-theme-v2');
  document.documentElement.dataset.theme = theme || 'dark';
} catch (e) { document.documentElement.dataset.theme = 'dark'; /* storage blocked */ }
