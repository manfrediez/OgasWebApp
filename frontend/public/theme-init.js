(function () {
  var t = localStorage.getItem('theme');
  var dark = t === 'dark' || (t == null && matchMedia('(prefers-color-scheme:dark)').matches);
  if (dark) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.backgroundColor = '#030712';
  } else {
    document.documentElement.style.backgroundColor = '#F9FAFB';
  }
})();
