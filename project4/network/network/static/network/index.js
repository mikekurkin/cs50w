document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  var p = 1;
  if (urlParams.has('p')) {
    p = parseInt(urlParams.get('p'));
  }
  showPage(p);
});
