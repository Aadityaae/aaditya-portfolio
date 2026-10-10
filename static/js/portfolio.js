const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});
const viewer = document.querySelector('#photo-viewer');
document.querySelectorAll('.gallery-photo').forEach(button => {
  button.addEventListener('click', () => {
    const photo = button.querySelector('img');
    viewer.querySelector('img').src = photo.dataset.full || photo.src;
    viewer.querySelector('img').alt = photo.alt;
    viewer.querySelector('p').textContent = button.dataset.caption;
    viewer.showModal();
  });
});
viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => {
  const bounds = viewer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
});
const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Sending…';
  status.textContent = '';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'X-CSRFToken': form.querySelector('[name="csrfmiddlewaretoken"]').value },
      mode: 'same-origin'
    });
    if (!response.ok) throw new Error('Message could not be sent');
    status.textContent = 'Thank you! Your message is on its way. I’ll get back to you soon.';
    form.reset();
  } catch (error) {
    status.textContent = 'Your message couldn’t be sent. Please try again or reach me by email.';
  } finally {
    button.disabled = false;
    button.innerHTML = 'Send your message <span>↗</span>';
  }
});

const projectFilters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('.projects-grid .project');
projectFilters.forEach(filter => {
  filter.addEventListener('click', () => {
    projectFilters.forEach(button => button.setAttribute('aria-pressed', String(button === filter)));
    let visibleCount = 0;
    projects.forEach(project => {
      const visible = filter.dataset.filter === 'all' || project.dataset.category === filter.dataset.filter;
      project.hidden = !visible;
      if (visible) visibleCount++;
    });
    document.querySelector('#project-count').textContent = `SHOWING ${String(visibleCount).padStart(2, '0')} PROJECTS`;
  });
});
