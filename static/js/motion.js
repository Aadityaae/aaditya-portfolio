(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const toggle = document.querySelector('#motion-toggle');
  const hero = document.querySelector('.hero');
  const portrait = document.querySelector('.portrait');
  const heroCopy = document.querySelector('.hero-copy');
  const star = document.querySelector('.big-star');
  const playbook = document.querySelector('.playbook');
  const stage = document.querySelector('.playbook-stage');
  const field = document.querySelector('.field-board');
  const editor = document.querySelector('.code-board');
  const route = document.querySelector('#ball-route');
  const ball = document.querySelector('#match-ball');
  const spin = document.querySelector('#ball-spin');
  const progressBar = document.querySelector('.playbook-progress span');
  const phaseLabel = document.querySelector('.playbook-phase');
  const description = document.querySelector('.playbook-description');
  const phaseSteps = [...document.querySelectorAll('.playbook-steps span')];
  const compileLabel = document.querySelector('.compile-label');
  const goalLabel = document.querySelector('.goal-label');
  const lines = [...document.querySelectorAll('.code-line')];
  const depthNotes = [...document.querySelectorAll('.section-heading .heading-side')];
  const readingProgress = document.createElement('div');
  readingProgress.className = 'reading-progress';
  readingProgress.setAttribute('aria-hidden', 'true');
  document.body.append(readingProgress);
  const clamp = value => Math.max(0, Math.min(1, value));
  const phases = [
    ['01 / SEE THE POSSIBILITY', 'Football is where my interest in patterns becomes personal. Cup’26 applies machine learning to historical match data.', 'READY TO MAKE SOMETHING.'],
    ['02 / MAKE YOUR MOVE', 'Cup’26 uses engineered performance metrics and an XGBoost classifier trained on 964 historical matches.', 'TURNING IDEAS INTO REALITY…'],
    ['03 / FOLLOW THROUGH', 'Match predictions, group-stage simulations, and a 48-team knockout bracket turn the model into an interactive application.', 'BUILT WITH CURIOSITY. ✓']
  ];

  // Sample the SVG once; scrolling only interpolates numbers in this table.
  const sampleCount = 240;
  const routeLength = route.getTotalLength();
  const routePoints = Array.from({ length: sampleCount + 1 }, (_, index) => {
    const point = route.getPointAtLength(routeLength * index / sampleCount);
    return { x: point.x, y: point.y };
  });
  let paused = false;
  let frame = 0;
  let measureFrame = 0;
  let previousTime = 0;
  let scrollTarget = scrollY;
  let scrollCurrent = scrollY;
  let activePhase = -1;
  let previousProgress = -1;
  let previousGoal = null;
  let geometry = {};
  let activeTilt = null;
  // Optional local profiling; disabled in normal browsing.
  const profiling = new URLSearchParams(location.search).has('motionProfile');
  const frameIntervals = [];
  let longestUpdate = 0;
  const allowed = () => !paused && !reducedMotion.matches && !document.hidden;

  function drawPlaybook(progress) {
    if (Math.abs(progress - previousProgress) < 0.0001) return;
    previousProgress = progress;
    const play = clamp((progress - 0.08) / 0.84);
    const position = play * sampleCount;
    const index = Math.min(sampleCount - 1, Math.floor(position));
    const mix = position - index;
    const a = routePoints[index];
    const b = routePoints[index + 1];
    const x = a.x + (b.x - a.x) * mix;
    const y = a.y + (b.y - a.y) * mix;
    ball.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    spin.setAttribute('transform', `rotate(${(play * 720).toFixed(2)})`);
    route.style.strokeDashoffset = (1 - play).toFixed(4);
    progressBar.style.transform = `scaleX(${progress.toFixed(4)})`;
    field.style.transform = `translate3d(0,${((0.5 - progress) * 35).toFixed(2)}px,0) rotate(${-4 + progress * 5}deg)`;
    editor.style.transform = `translate3d(0,${((progress - 0.5) * 25).toFixed(2)}px,0) rotate(${4 - progress * 5}deg)`;
    lines.forEach((line, index) => {
      const reveal = clamp((progress - index * 0.085) * 7);
      line.style.opacity = reveal.toFixed(3);
      line.style.transform = `translate3d(0,${((1 - reveal) * 8).toFixed(2)}px,0)`;
    });
    const phase = Math.min(2, Math.floor(progress * 3));
    if (phase !== activePhase) {
      activePhase = phase;
      phaseLabel.textContent = phases[phase][0];
      description.textContent = phases[phase][1];
      compileLabel.textContent = phases[phase][2];
      phaseSteps.forEach((step, index) => step.classList.toggle('is-active', index === phase));
    }
    const goal = play > 0.97;
    if (goal !== previousGoal) {
      previousGoal = goal;
      playbook.classList.toggle('is-goal', goal);
      goalLabel.textContent = goal ? 'GOAL. KEEP GOING. ↗' : 'PLAY IN PROGRESS';
    }
  }

  // All layout reads happen here, outside the animation loop.
  function measure() {
    measureFrame = 0;
    const y = scrollY;
    const playBounds = playbook.getBoundingClientRect();
    const heroBounds = hero.getBoundingClientRect();
    const starBounds = star.getBoundingClientRect();
    const stageStyle = getComputedStyle(stage);
    geometry = {
      playTop: playBounds.top + y,
      playHeight: playBounds.height,
      stageHeight: stage.offsetHeight,
      pinned: stageStyle.position === 'sticky',
      inset: parseFloat(stageStyle.top) || 0,
      heroTop: heroBounds.top + y,
      heroHeight: heroBounds.height,
      starTop: starBounds.top + y,
      viewport: innerHeight,
      wide: innerWidth > 760,
      scrollRange: Math.max(1, document.documentElement.scrollHeight - innerHeight),
      notes: depthNotes.map(element => {
        const bounds = element.getBoundingClientRect();
        return { element, top: bounds.top + y, height: bounds.height };
      })
    };
    scrollTarget = scrollY;
    wake();
  }
  function queueMeasure() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measure);
  }

  function tick(time) {
    frame = 0;
    const updateStarted = profiling ? performance.now() : 0;
    if (!allowed()) { previousTime = 0; return; }
    // Time-based damping feels the same on 60 Hz and 120 Hz screens.
    const dt = Math.min(48, previousTime ? time - previousTime : 16.67);
    if (profiling && previousTime && frameIntervals.length < 240) frameIntervals.push(time - previousTime);
    previousTime = time;
    const ease = 1 - Math.exp(-dt / 85);
    scrollCurrent += (scrollTarget - scrollCurrent) * ease;
    const unsettled = Math.abs(scrollTarget - scrollCurrent) > 0.1;
    if (!unsettled) scrollCurrent = scrollTarget;
    readingProgress.style.transform = `scaleX(${clamp(scrollCurrent / geometry.scrollRange).toFixed(4)})`;
    if (finePointer.matches && geometry.wide) {
      geometry.notes.forEach(({ element, top, height }) => {
        const relative = top - scrollCurrent;
        if (relative < geometry.viewport + 40 && relative + height > -40) {
          const depth = Math.max(-16, Math.min(16, (relative / geometry.viewport - 0.5) * 32));
          element.style.translate = `0 ${depth.toFixed(2)}px`;
        }
      });
    }

    const top = geometry.playTop - scrollCurrent;
    if (top < geometry.viewport && top + geometry.playHeight > 0) {
      const progress = geometry.pinned
        ? clamp((geometry.inset - top) / Math.max(1, geometry.playHeight - geometry.stageHeight))
        : clamp((geometry.viewport * 0.9 - top) / Math.max(1, geometry.playHeight + geometry.viewport * 0.1));
      drawPlaybook(progress);
    }
    if (finePointer.matches && scrollCurrent < geometry.heroTop + geometry.heroHeight) {
      const travel = Math.max(0, scrollCurrent - geometry.heroTop);
      portrait.style.translate = `0 ${Math.min(85, travel * 0.16).toFixed(2)}px`;
      heroCopy.style.translate = `0 ${Math.min(35, travel * 0.055).toFixed(2)}px`;
    }
    if (finePointer.matches && Math.abs(geometry.starTop - scrollCurrent) < geometry.viewport) {
      star.style.rotate = `${(scrollCurrent * 0.025).toFixed(2)}deg`;
    }
    let tiltMoving = false;
    if (activeTilt) {
      activeTilt.x += (activeTilt.targetX - activeTilt.x) * ease;
      activeTilt.y += (activeTilt.targetY - activeTilt.y) * ease;
      activeTilt.art.style.setProperty('--tilt-x', `${activeTilt.x.toFixed(3)}deg`);
      activeTilt.art.style.setProperty('--tilt-y', `${activeTilt.y.toFixed(3)}deg`);
      tiltMoving = Math.abs(activeTilt.x - activeTilt.targetX) + Math.abs(activeTilt.y - activeTilt.targetY) > 0.01;
      if (!tiltMoving && activeTilt.leaving) {
        activeTilt.art.style.removeProperty('--tilt-x');
        activeTilt.art.style.removeProperty('--tilt-y');
        activeTilt = null;
      }
    }
    if (profiling) longestUpdate = Math.max(longestUpdate, performance.now() - updateStarted);
    if (unsettled || tiltMoving) wake();
    else {
      previousTime = 0;
      if (profiling && frameIntervals.length) {
        const sorted = [...frameIntervals].sort((a, b) => a - b);
        document.body.dataset.motionProfile = JSON.stringify({
          samples: sorted.length,
          medianFrameMs: Number(sorted[Math.floor(sorted.length / 2)].toFixed(2)),
          p95FrameMs: Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))].toFixed(2)),
          longestUpdateMs: Number(longestUpdate.toFixed(2))
        });
      }
    }
  }
  function wake() {
    if (!frame && allowed()) frame = requestAnimationFrame(tick);
  }

  function syncMotion() {
    const stopped = reducedMotion.matches || paused;
    document.body.classList.toggle('motion-paused', stopped);
    toggle.setAttribute('aria-pressed', String(stopped));
    toggle.textContent = stopped ? 'Motion paused ▶' : 'Pause motion Ⅱ';
    if (stopped) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      portrait.style.translate = '';
      heroCopy.style.translate = '';
      depthNotes.forEach(element => { element.style.translate = ''; });
      if (activeTilt) {
        activeTilt.art.style.removeProperty('--tilt-x');
        activeTilt.art.style.removeProperty('--tilt-y');
        activeTilt = null;
      }
      drawPlaybook(1);
      document.querySelectorAll('.reveal-pending').forEach(element => {
        element.classList.remove('reveal-pending');
        element.classList.add('reveal-visible');
      });
    } else {
      scrollCurrent = scrollTarget = scrollY;
      previousProgress = -1;
    }
    queueMeasure();
  }
  toggle.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reducedMotion.addEventListener('change', syncMotion);
  finePointer.addEventListener('change', () => {
    depthNotes.forEach(element => { element.style.translate = ''; });
    queueMeasure();
  });
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('tab-inactive', document.hidden);
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    } else { scrollCurrent = scrollTarget = scrollY; queueMeasure(); }
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.replace('reveal-pending', 'reveal-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px 60px 0px', threshold: 0.01 });
    document.body.classList.add('motion-ready');
    document.querySelectorAll('.section-heading, .project-toolbar, .project, .about-story, .skills-panel, .experience-row, .milestones article, .gallery-photo:not(.album-photo), .quote, .story-layout, .contact-grid').forEach(element => {
      if (!reducedMotion.matches && element.getBoundingClientRect().top > innerHeight) {
        element.classList.add('reveal-pending');
        revealObserver.observe(element);
      }
      element.addEventListener('transitionend', event => {
        if (event.target === element && event.propertyName === 'translate') element.classList.add('reveal-settled');
      });
    });
    const regionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-in-view', entry.isIntersecting));
    }, { rootMargin: '100px', threshold: 0 });
    document.querySelectorAll('.project-art, .hero, .playbook, .character, .discipline-strip, .skill-orbit, .frame-motion').forEach(element => regionObserver.observe(element));
  }

  document.querySelectorAll('.project').forEach(project => {
    const art = project.querySelector('.project-art');
    let bounds;
    project.addEventListener('pointerenter', () => { bounds = project.getBoundingClientRect(); });
    project.addEventListener('pointermove', event => {
      if (!allowed() || !finePointer.matches || !bounds) return;
      if (!activeTilt || activeTilt.art !== art) {
        if (activeTilt) { activeTilt.art.style.removeProperty('--tilt-x'); activeTilt.art.style.removeProperty('--tilt-y'); }
        activeTilt = { art, x: 0, y: 0 };
      }
      activeTilt.targetX = -((event.clientY - bounds.top) / bounds.height - 0.5) * 5;
      activeTilt.targetY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 5;
      activeTilt.leaving = false;
      wake();
    });
    project.addEventListener('pointerleave', () => {
      if (activeTilt?.art === art) {
        activeTilt.targetX = activeTilt.targetY = 0;
        activeTilt.leaving = true;
        wake();
      }
    });
  });
  window.addEventListener('scroll', () => { scrollTarget = scrollY; wake(); }, { passive: true });
  window.addEventListener('resize', () => {
    depthNotes.forEach(element => { element.style.translate = ''; });
    queueMeasure();
  }, { passive: true });
  window.addEventListener('load', queueMeasure, { once: true });
  document.fonts?.ready.then(queueMeasure);
  document.querySelectorAll('[data-filter]').forEach(filter => filter.addEventListener('click', queueMeasure));
  document.querySelectorAll('img').forEach(image => image.addEventListener('load', queueMeasure, { once: true }));
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(queueMeasure);
    resizeObserver.observe(document.querySelector('main'));
    resizeObserver.observe(stage);
  }
  syncMotion();
})();
