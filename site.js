(() => {
  'use strict';

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const menuPairs = Array.from(document.querySelectorAll('[data-nav-toggle]')).map((toggle) => {
    const targetId = toggle.getAttribute('aria-controls');
    let menu = targetId ? document.getElementById(targetId) : null;
    if (!menu) {
      const selector = toggle.getAttribute('data-nav-toggle');
      if (selector && selector.startsWith('#')) {
        menu = document.getElementById(selector.slice(1));
      } else {
        menu = document.querySelector('[data-mobile-nav]');
      }
    }
    if (!menu) return null;
    if (!toggle.hasAttribute('aria-expanded')) toggle.setAttribute('aria-expanded', String(!menu.hidden));

    const setOpen = (isOpen, restoreFocus = false) => {
      toggle.setAttribute('aria-expanded', String(isOpen));
      menu.hidden = !isOpen;
      menu.classList.toggle('is-open', isOpen);
      if (restoreFocus) toggle.focus({ preventScroll: true });
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
    });
    return { toggle, menu, setOpen };
  }).filter(Boolean);

  if (menuPairs.length) {
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      for (const pair of menuPairs) {
        if (pair.toggle.getAttribute('aria-expanded') === 'true') pair.setOpen(false, true);
      }
    });
  }

  const backToTopButtons = Array.from(document.querySelectorAll('[data-back-top]'));
  if (backToTopButtons.length) {
    let updateQueued = false;
    const updateVisibility = () => {
      for (const button of backToTopButtons) button.hidden = window.scrollY < 480;
      updateQueued = false;
    };
    for (const button of backToTopButtons) {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    }
    window.addEventListener('scroll', () => {
      if (!updateQueued) {
        updateQueued = true;
        window.requestAnimationFrame(updateVisibility);
      }
    }, { passive: true });
    updateVisibility();
  }

  const lightboxControls = Array.from(document.querySelectorAll('[data-lightbox]'));
  if (!lightboxControls.length) return;
  for (const control of lightboxControls) {
    if (control.matches('button, a[href], input, select, textarea')) continue;
    if (!control.hasAttribute('tabindex')) control.setAttribute('tabindex', '0');
    if (!control.hasAttribute('role')) control.setAttribute('role', 'button');
    control.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        control.click();
      }
    });
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'image-dialog';
  dialog.setAttribute('aria-label', 'Просмотр изображения');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'image-dialog__close';
  closeButton.setAttribute('aria-label', 'Закрыть изображение');
  closeButton.textContent = '×';

  const figure = document.createElement('figure');
  figure.className = 'image-dialog__figure';
  const image = document.createElement('img');
  image.className = 'image-dialog__image';
  const caption = document.createElement('figcaption');
  caption.className = 'image-dialog__caption';
  figure.append(image, caption);
  dialog.append(closeButton, figure);
  document.body.append(dialog);

  let sourceControl = null;
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    if (sourceControl instanceof HTMLElement) sourceControl.focus({ preventScroll: true });
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest('[data-lightbox]');
    if (!control) return;

    const thumbnail = control instanceof HTMLImageElement ? control : control.querySelector('img');
    const explicitSource = control.getAttribute('data-lightbox');
    const source = explicitSource && explicitSource !== 'true'
      ? explicitSource
      : control.getAttribute('href') || thumbnail?.currentSrc || thumbnail?.src;
    if (!source) return;

    event.preventDefault();
    if (typeof dialog.showModal !== 'function') {
      window.open(source, '_blank', 'noopener');
      return;
    }

    sourceControl = control;
    image.src = source;
    image.alt = thumbnail?.alt || control.getAttribute('aria-label') || '';
    caption.textContent = control.getAttribute('data-caption') || '';
    dialog.showModal();
  });
})();
