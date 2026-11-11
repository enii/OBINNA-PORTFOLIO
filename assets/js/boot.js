/* Runs in <head>, before the page is drawn: marks that JavaScript is on, and applies the light or dark
 * theme the visitor picked last time, so the page never flashes the wrong colours.
 * (A file rather than an inline script, so the Content Security Policy can allow scripts from this site only.) */
document.documentElement.classList.replace('no-js', 'js');
try {
  var theme = localStorage.getItem('oo-theme');
  if (theme) document.documentElement.dataset.theme = theme;
} catch (e) { /* storage blocked */ }
