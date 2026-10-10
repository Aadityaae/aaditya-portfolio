(() => {
  const stack = document.querySelector('.story-stack');
  const cards = [...stack.querySelectorAll('.story-card')];
  const count = document.querySelector('[data-stack-count]');
  const controls = [...document.querySelectorAll('[data-stack-prev], [data-stack-next]')];
  let current = 0;
  let busy = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function render() {
    cards.forEach((card, index) => {
      const slot = (index - current + cards.length) % cards.length;
      card.dataset.slot = slot;
      card.inert = slot !== 0;
      card.setAttribute('aria-hidden', String(slot !== 0));
      card.classList.remove('is-leaving');
    });
    count.textContent = `${String(current + 1).padStart(2, '0')} / 03`;
  }
  function move(direction) {
    if (busy) return;
    const stopped = reduced.matches || document.body.classList.contains('motion-paused');
    if (stopped) { current = (current + direction + cards.length) % cards.length; render(); return; }
    busy = true;
    controls.forEach(button => button.disabled = true);
    const leaving = cards[current];
    leaving.classList.add('is-leaving');
    window.setTimeout(() => {
      current = (current + direction + cards.length) % cards.length;
      render();
      busy = false;
      controls.forEach(button => button.disabled = false);
    }, 450);
  }
  document.querySelector('[data-stack-prev]').addEventListener('click', () => move(-1));
  document.querySelector('[data-stack-next]').addEventListener('click', () => move(1));
  stack.addEventListener('keydown', event => {
    if (event.target !== stack) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  let touchStart = null;
  stack.addEventListener('touchstart', event => { touchStart = event.touches[0].clientX; }, {passive:true});
  stack.addEventListener('touchend', event => {
    if (touchStart === null) return;
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 60) move(distance < 0 ? 1 : -1);
    touchStart = null;
  }, {passive:true});
  render();
  const photos = [...document.querySelectorAll('.gallery-photo:not(.album-photo)')].slice(0,4);
  photos.forEach(photo => {
    const frame = document.createElement('span');
    frame.className = 'split-photo';
    frame.style.display = 'block';
    const image = photo.querySelector('img');
    image.before(frame); frame.append(image);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
      });
    }, {threshold: .08});
    document.querySelectorAll('.split-photo').forEach(photo => observer.observe(photo));
  } else document.querySelectorAll('.split-photo').forEach(photo => photo.classList.add('is-revealed'));
})();
