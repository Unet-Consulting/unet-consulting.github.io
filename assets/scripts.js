(function () {
  const I18N_PATH = '/assets/i18n.json';
  const ASSET_MANIFEST_PATH = '/assets/asset-manifest.json';
  const HERO_IMAGE_DURATION_MS = 10000;
  const HERO_AUTO_SCROLL = false;
  const ALLOWED_ASSET_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];
  const BRAND_LOGOS = {
    en: '/assets/logo_en.svg',
    mn: '/assets/logo_mn.svg'
  };

  let i18nData = null;
  let currentLang = 'en';
  let assetManifest = {
    pictures: [],
    logos: []
  };

  function loadI18n() {
    return fetch(I18N_PATH)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        i18nData = data;
        const stored = window.localStorage.getItem('siteLang');
        if (stored && data[stored]) {
          currentLang = stored;
        }
        applyLanguage(currentLang);
      })
      .catch(function (err) {
        console.error('Failed to load i18n.json', err);
      });
  }

  function applyLanguage(lang) {
    if (!i18nData || !i18nData[lang]) return;

    currentLang = lang;
    document.documentElement.setAttribute('lang', lang === 'mn' ? 'mn' : 'en');
    window.localStorage.setItem('siteLang', lang);
    updateBrandLogos(lang);

    var dict = i18nData[lang];

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var value = dict[key];
      if (value) {
        if (el.getAttribute('data-i18n-break') === 'pipe') {
          var lines = value
            .split('|')
            .map(function (item) { return item.trim(); })
            .filter(Boolean);
          el.textContent = lines.join('\n');
          return;
        }
        if (el.classList.contains('services-pillar__body') && value.indexOf('|') !== -1) {
          var bulletItems = value
            .split('|')
            .map(function (item) { return item.trim(); })
            .filter(Boolean);
          var list = document.createElement('ul');
          list.className = 'services-pillar__list';
          bulletItems.forEach(function (item) {
            var li = document.createElement('li');
            li.className = 'services-pillar__list-item';
            li.textContent = item;
            list.appendChild(li);
          });
          el.innerHTML = '';
          el.appendChild(list);
          return;
        }
        el.textContent = value;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var value = dict[key];
      if (value) {
        el.setAttribute('placeholder', value);
      }
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria-label');
      var value = dict[key];
      if (value) {
        el.setAttribute('aria-label', value);
      }
    });

    updateLangToggleUI(lang);
  }

  function updateBrandLogos(lang) {
    var logoSrc = lang === 'mn' ? BRAND_LOGOS.mn : BRAND_LOGOS.en;

    document.querySelectorAll('.brand__logo').forEach(function (logo) {
      if (logo.getAttribute('src') !== logoSrc) {
        logo.setAttribute('src', logoSrc);
      }
    });
  }

  function updateLangToggleUI(lang) {
    document.querySelectorAll('.lang-toggle').forEach(function (toggle) {
      toggle.setAttribute('data-active', lang);
    });

    document.querySelectorAll('.lang-toggle__btn').forEach(function (btn) {
      var btnLang = btn.getAttribute('data-lang');
      if (btnLang === lang) {
        btn.classList.add('lang-toggle__btn--active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('lang-toggle__btn--active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  function initLangToggle() {
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (target && target.classList.contains('lang-toggle__btn')) {
        var lang = target.getAttribute('data-lang');
        if (lang && lang !== currentLang) {
          applyLanguage(lang);
        }
      }
    });
  }

  function initHeroSlider() {
    var hero = document.getElementById('hero');
    if (!hero) return;

    var sectionImages = Array.from(hero.querySelectorAll('.hero__source[src]'))
      .map(function (img) { return (img.getAttribute('src') || '').trim(); })
      .filter(Boolean);

    var images = sectionImages.length
      ? sectionImages
      : assetManifest.pictures.map(function (file) {
        if (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('/')) {
          return file;
        }
        return '/assets/pictures/' + file;
      });

    if (!images.length) return;

    var slideTimer = null;
    var bgLayerA = document.createElement('div');
    bgLayerA.className = 'hero__bg';
    var bgLayerB = document.createElement('div');
    bgLayerB.className = 'hero__bg';
    hero.insertBefore(bgLayerB, hero.firstChild);
    hero.insertBefore(bgLayerA, hero.firstChild);
    var bgLayers = [bgLayerA, bgLayerB];
    var activeLayer = 0;

    function clearTimer() {
      if (slideTimer) {
        clearTimeout(slideTimer);
        slideTimer = null;
      }
    }

    function fadeToImage(imageUrl) {
      var nextLayerIndex = activeLayer === 0 ? 1 : 0;
      var nextLayer = bgLayers[nextLayerIndex];
      var currentLayer = bgLayers[activeLayer];

      nextLayer.style.backgroundImage = "url('" + imageUrl + "')";
      window.requestAnimationFrame(function () {
        nextLayer.classList.add('hero__bg--visible');
        currentLayer.classList.remove('hero__bg--visible');
      });
      activeLayer = nextLayerIndex;
    }

    function runSlides(index) {
      clearTimer();
      fadeToImage(images[index]);
      if (HERO_AUTO_SCROLL && images.length > 1) {
        slideTimer = window.setTimeout(function () {
          var nextIndex = (index + 1) % images.length;
          runSlides(nextIndex);
        }, HERO_IMAGE_DURATION_MS);
      }
    }

    // Start on first image immediately
    runSlides(0);
  }

  function initLogoGrid() {
    var grids = document.querySelectorAll('[data-logo-grid]');
    if (!grids.length) return;

    var logos = assetManifest.logos.map(function (file) {
      if (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('/')) {
        return file;
      }
      return '/assets/logos/' + file;
    });

    if (!logos.length) {
      grids.forEach(function (grid) {
        grid.innerHTML = '';
      });
      return;
    }

    grids.forEach(function (grid) {
      grid.innerHTML = '';
      logos.forEach(function (logoUrl, idx) {
        var card = document.createElement('article');
        card.className = 'client-logo-card';
        card.style.setProperty('--logo-delay', (idx * 45) + 'ms');

        var img = document.createElement('img');
        img.className = 'client-logo-image';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = logoUrl;
        img.alt = 'Client logo ' + (idx + 1);

        function applyLogoFitClass() {
          if (!img.naturalWidth || !img.naturalHeight) return;

          var ratio = img.naturalWidth / img.naturalHeight;
          card.classList.remove(
            'client-logo-card--ultra-wide',
            'client-logo-card--wide',
            'client-logo-card--square',
            'client-logo-card--tall'
          );

          if (ratio >= 2.4) {
            card.classList.add('client-logo-card--ultra-wide');
          } else if (ratio >= 1.5) {
            card.classList.add('client-logo-card--wide');
          } else if (ratio <= 0.8) {
            card.classList.add('client-logo-card--tall');
          } else {
            card.classList.add('client-logo-card--square');
          }
        }

        img.addEventListener('load', applyLogoFitClass);
        img.addEventListener('error', function () {
          card.classList.add('client-logo-card--square');
        });
        if (img.complete) {
          applyLogoFitClass();
        }

        card.appendChild(img);
        grid.appendChild(card);
      });
    });
  }

  function detectRepoInfo() {
    var host = window.location.hostname || '';
    var pathSegments = (window.location.pathname || '/').split('/').filter(Boolean);
    var owner = host.split('.')[0] || '';
    var repo = owner ? owner + '.github.io' : '';

    if (host.endsWith('github.io') && pathSegments.length > 0) {
      // GitHub project pages: /repo-name/...
      repo = pathSegments[0];
    }

    return {
      owner: owner,
      repo: repo,
      branch: 'main'
    };
  }

  function isAllowedAsset(fileName) {
    var lower = fileName.toLowerCase();
    return ALLOWED_ASSET_EXT.some(function (ext) { return lower.endsWith(ext); });
  }

  function fetchGithubDirContents(dirName) {
    var info = detectRepoInfo();
    if (!info.owner || !info.repo) return Promise.resolve([]);

    var url = 'https://api.github.com/repos/' + info.owner + '/' + info.repo + '/contents/assets/' + dirName + '?ref=' + info.branch;

    return fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('GitHub API request failed: ' + res.status);
        return res.json();
      })
      .then(function (entries) {
        if (!Array.isArray(entries)) return [];
        return entries
          .filter(function (entry) { return entry.type === 'file' && entry.name && isAllowedAsset(entry.name); })
          .map(function (entry) { return entry.name; })
          .sort();
      })
      .catch(function (err) {
        console.warn('Failed to fetch GitHub contents for', dirName, err);
        return [];
      });
  }

  function fetchGithubAssetManifest() {
    if (!(window.location.hostname || '').endsWith('github.io')) {
      return Promise.resolve({ pictures: [], logos: [] });
    }

    return Promise.all([
      fetchGithubDirContents('pictures'),
      fetchGithubDirContents('logos')
    ]).then(function (results) {
      return {
        pictures: results[0] || [],
        logos: results[1] || []
      };
    });
  }

  function fetchDirectoryListing(dirName) {
    return fetch('/assets/' + dirName + '/')
      .then(function (res) {
        if (!res.ok) throw new Error('Directory listing request failed: ' + res.status);
        return res.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var names = Array.from(doc.querySelectorAll('a[href]'))
          .map(function (link) { return link.getAttribute('href') || ''; })
          .map(function (href) { return decodeURIComponent(href.split('?')[0].split('#')[0]); })
          .map(function (href) { return href.replace(/\/+$/, ''); })
          .filter(function (href) { return href && !href.endsWith('..') && href !== '.' && href !== '..'; })
          .map(function (href) { return href.split('/').pop() || ''; })
          .filter(function (name) { return name && isAllowedAsset(name); });

        return Array.from(new Set(names)).sort();
      })
      .catch(function () {
        return [];
      });
  }

  function fetchDirectoryAssetManifest() {
    return Promise.all([
      fetchDirectoryListing('pictures'),
      fetchDirectoryListing('logos')
    ]).then(function (results) {
      return {
        pictures: results[0] || [],
        logos: results[1] || []
      };
    });
  }

  function applyAssetManifest(data) {
    assetManifest = {
      pictures: Array.isArray(data && data.pictures) ? data.pictures : [],
      logos: Array.isArray(data && data.logos) ? data.logos : []
    };
    return assetManifest;
  }

  function hasAssets(data) {
    if (!data) return false;
    var hasPictures = Array.isArray(data.pictures) && data.pictures.length > 0;
    var hasLogos = Array.isArray(data.logos) && data.logos.length > 0;
    return hasPictures || hasLogos;
  }

  function fetchLocalManifest() {
    return fetch(ASSET_MANIFEST_PATH)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Manifest request failed: ' + res.status);
        }
        return res.json();
      });
  }

  function loadAssetManifest() {
    var isGithubPages = (window.location.hostname || '').endsWith('github.io');

    function finish() {
      initHeroSlider();
      initLogoGrid();
    }

    function tryGithubThenManifest() {
      return fetchGithubAssetManifest()
        .then(function (data) {
          if (hasAssets(data)) return applyAssetManifest(data);
          throw new Error('GitHub asset list empty');
        })
        .catch(function (err) {
          console.warn('GitHub assets unavailable, trying local manifest', err);
          return fetchLocalManifest().then(applyAssetManifest);
        });
    }

    if (isGithubPages) {
      return tryGithubThenManifest()
        .catch(function (err) {
          console.error('Failed to fetch assets from GitHub and manifest', err);
        })
        .finally(finish);
    }

    // Local/dev: directory listing first (if available), then manifest, then GitHub fallback
    return fetchDirectoryAssetManifest()
      .then(function (data) {
        if (hasAssets(data)) return applyAssetManifest(data);
        throw new Error('Directory listing unavailable or empty');
      })
      .catch(function () {
        return fetchLocalManifest().then(applyAssetManifest);
      })
      .catch(function (err) {
        console.warn('Manifest fetch failed, trying GitHub API', err);
        return fetchGithubAssetManifest().then(applyAssetManifest);
      })
      .catch(function (err) {
        console.error('Failed to load assets manifest', err);
      })
      .finally(finish);
  }

  function initScrollReveal() {
    var sections = document.querySelectorAll('.section');
    if (!sections.length) return;

    if (!('IntersectionObserver' in window)) {
      sections.forEach(function (section) {
        section.classList.add('section--visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('section--visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initHomeSectionScroll() {
    if (!document.body.classList.contains('page--home')) return;

    var stack = document.querySelector('.home-stack');
    if (!stack) return;

    var sections = Array.from(stack.querySelectorAll('.home-section[id]'));
    if (!sections.length) return;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fadeDuration = prefersReducedMotion ? 0 : 320;
    var wheelThreshold = 42;
    var touchThreshold = 38;
    var maxPreviewOffset = 40;
    var wheelDelta = 0;
    var activePreviewOffset = 0;
    var blockedDirection = 0;
    var isTransitioning = false;
    var isSyncingHash = false;
    var fadeOutTimer = null;
    var fadeInTimer = null;
    var touchStartY = null;

    function clearTransitionTimers() {
      if (fadeOutTimer) {
        clearTimeout(fadeOutTimer);
        fadeOutTimer = null;
      }
      if (fadeInTimer) {
        clearTimeout(fadeInTimer);
        fadeInTimer = null;
      }
    }

    function setActiveSection(index) {
      sections.forEach(function (section, sectionIndex) {
        section.classList.remove('home-section--active');
        section.classList.remove('home-section--fading-out');
        section.classList.remove('home-section--preview-active');
        section.style.transform = '';
        if (sectionIndex === index) {
          section.classList.add('home-section--active');
        }
      });
      activePreviewOffset = 0;
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function setPreviewOffset(offset) {
      var activeSection = sections[currentIndex];
      if (!activeSection) return;

      var clampedOffset = clamp(offset, -maxPreviewOffset, maxPreviewOffset);
      if (Math.abs(clampedOffset - activePreviewOffset) < 0.2) return;

      activeSection.classList.add('home-section--preview-active');
      activePreviewOffset = clampedOffset;
      if (Math.abs(clampedOffset) < 0.2) {
        activeSection.style.transform = '';
        return;
      }

      activeSection.style.transform = 'translateY(' + clampedOffset.toFixed(2) + 'px)';
    }

    function resetPreviewOffset() {
      var activeSection = sections[currentIndex];
      activePreviewOffset = 0;
      if (!activeSection) return;

      activeSection.classList.remove('home-section--preview-active');
      activeSection.style.transform = '';
    }

    function getIndexFromHash(hash) {
      var cleanHash = (hash || '').replace(/^#/, '');
      if (!cleanHash) return -1;

      var decoded;
      try {
        decoded = decodeURIComponent(cleanHash);
      } catch (err) {
        decoded = cleanHash;
      }

      return sections.findIndex(function (section) {
        return section.id === decoded;
      });
    }

    function emitHashChange() {
      try {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (err) {
        window.dispatchEvent(new Event('hashchange'));
      }
    }

    function syncHashForIndex(index) {
      var targetSection = sections[index];
      if (!targetSection || !targetSection.id) return;

      var nextHash = '#' + targetSection.id;
      if (window.location.hash === nextHash) return;

      isSyncingHash = true;

      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState(null, '', nextHash);
        emitHashChange();
        setTimeout(function () {
          isSyncingHash = false;
        }, 0);
        return;
      }

      window.location.hash = nextHash;
      setTimeout(function () {
        isSyncingHash = false;
      }, 0);
    }

    function transitionToIndex(targetIndex, options) {
      if (isTransitioning) return;
      if (targetIndex < 0 || targetIndex >= sections.length) return;
      if (targetIndex === currentIndex) return;

      var currentSection = sections[currentIndex];
      var nextSection = sections[targetIndex];
      if (!currentSection || !nextSection) return;

      isTransitioning = true;
      blockedDirection = 0;
      wheelDelta = 0;
      clearTransitionTimers();

      if (fadeDuration === 0) {
        currentSection.classList.remove('home-section--active');
        currentSection.classList.remove('home-section--fading-out');
        currentSection.classList.remove('home-section--preview-active');
        currentSection.style.transform = '';
        activePreviewOffset = 0;
        nextSection.classList.remove('home-section--preview-active');
        nextSection.classList.add('home-section--active');
        nextSection.style.transform = '';
        currentIndex = targetIndex;
        isTransitioning = false;
        if (!(options && options.fromHash)) {
          syncHashForIndex(currentIndex);
        }
        return;
      }

      currentSection.classList.add('home-section--fading-out');

      fadeOutTimer = setTimeout(function () {
        currentSection.classList.remove('home-section--active');
        currentSection.classList.remove('home-section--fading-out');
        currentSection.classList.remove('home-section--preview-active');
        currentSection.style.transform = '';
        activePreviewOffset = 0;
        nextSection.classList.remove('home-section--preview-active');
        nextSection.classList.add('home-section--active');
        nextSection.style.transform = '';

        fadeInTimer = setTimeout(function () {
          currentIndex = targetIndex;
          isTransitioning = false;
          if (!(options && options.fromHash)) {
            syncHashForIndex(currentIndex);
          }
        }, fadeDuration);
      }, fadeDuration);
    }

    function handleDirectionalTransition(direction) {
      if (direction === 0) return false;
      var targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= sections.length) return false;
      transitionToIndex(targetIndex);
      return true;
    }

    function isTextInputFocused() {
      var activeEl = document.activeElement;
      if (!activeEl) return false;
      var tag = (activeEl.tagName || '').toLowerCase();
      return tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        tag === 'button' ||
        !!activeEl.isContentEditable;
    }

    function onWheel(event) {
      event.preventDefault();
      if (isTransitioning) return;

      var deltaY = event.deltaY;
      if (blockedDirection !== 0) {
        var stillBlocked =
          (blockedDirection > 0 && deltaY > 0) ||
          (blockedDirection < 0 && deltaY < 0);

        if (stillBlocked) {
          setPreviewOffset(-blockedDirection * maxPreviewOffset);
          return;
        }

        blockedDirection = 0;
        wheelDelta = 0;
      }

      wheelDelta += deltaY;
      var previewOffset = -(wheelDelta / wheelThreshold) * maxPreviewOffset;
      setPreviewOffset(previewOffset);
      if (Math.abs(wheelDelta) < wheelThreshold) return;

      var direction = wheelDelta > 0 ? 1 : -1;
      var didStartTransition = handleDirectionalTransition(direction);
      if (didStartTransition) {
        wheelDelta = 0;
        return;
      }

      // At first/last section: keep the current offset pinned instead of snapping back.
      blockedDirection = direction;
      wheelDelta = direction * wheelThreshold;
      setPreviewOffset(-blockedDirection * maxPreviewOffset);
    }

    function onKeyDown(event) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTextInputFocused()) {
        return;
      }

      var direction = 0;
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
        direction = 1;
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        direction = -1;
      }

      if (!direction) return;

      event.preventDefault();
      if (isTransitioning) return;
      var didStartTransition = handleDirectionalTransition(direction);
      if (didStartTransition) {
        wheelDelta = 0;
        blockedDirection = 0;
        return;
      }

      blockedDirection = direction;
    }

    function onTouchStart(event) {
      if (!event.touches || event.touches.length !== 1) return;
      touchStartY = event.touches[0].clientY;
    }

    function onTouchMove(event) {
      if (touchStartY === null) return;
      if (event.touches && event.touches.length) {
        var currentY = event.touches[0].clientY;
        var touchDelta = touchStartY - currentY;
        var previewOffset = -(touchDelta / touchThreshold) * maxPreviewOffset;
        setPreviewOffset(previewOffset);
      }
      event.preventDefault();
    }

    function onTouchEnd(event) {
      if (touchStartY === null) return;
      if (isTransitioning) {
        touchStartY = null;
        return;
      }

      var endY = touchStartY;
      if (event.changedTouches && event.changedTouches.length) {
        endY = event.changedTouches[0].clientY;
      }

      var deltaY = touchStartY - endY;
      touchStartY = null;

      if (Math.abs(deltaY) < touchThreshold) return;

      var direction = deltaY > 0 ? 1 : -1;
      var didStartTransition = handleDirectionalTransition(direction);
      if (didStartTransition) {
        wheelDelta = 0;
        blockedDirection = 0;
        return;
      }

      blockedDirection = direction;
    }

    var currentIndex = sections.findIndex(function (section) {
      return section.classList.contains('home-section--active');
    });
    if (currentIndex < 0) {
      currentIndex = 0;
    }

    var hashIndex = getIndexFromHash(window.location.hash);
    if (hashIndex >= 0) {
      currentIndex = hashIndex;
    }
    setActiveSection(currentIndex);

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    window.addEventListener('hashchange', function () {
      if (isSyncingHash) return;

      var targetIndex = getIndexFromHash(window.location.hash);
      if (targetIndex < 0) {
        targetIndex = 0;
      }

      wheelDelta = 0;
      blockedDirection = 0;
      resetPreviewOffset();
      transitionToIndex(targetIndex, { fromHash: true });
    });
  }

  function initNavHighlight() {
    var links = document.querySelectorAll('.nav__link');
    if (!links.length) return;

    function normalize(pathname) {
      if (!pathname) return '/';
      var normalized = pathname.replace(/\/index\.html$/, '/');
      if (!normalized.startsWith('/')) normalized = '/' + normalized;
      if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
      return normalized || '/';
    }

    function resolveCurrentPath() {
      var currentPath = normalize(window.location.pathname || '/');
      var host = window.location.hostname || '';
      var segments = (window.location.pathname || '/').split('/').filter(Boolean);
      var repoBase = '';

      // Adjust for GitHub Pages project sites (e.g., /repo-name/…)
      if (host.endsWith('github.io') && segments.length) {
        repoBase = '/' + segments[0];
        if (currentPath.indexOf(repoBase) === 0) {
          currentPath = normalize(currentPath.slice(repoBase.length) || '/');
        }
      }

      return {
        currentPath: currentPath,
        currentHash: window.location.hash || '',
        repoBase: repoBase
      };
    }

    function parseLink(href, repoBase) {
      if (!href) return null;
      var url;
      try {
        url = new URL(href, window.location.origin);
      } catch (err) {
        return null;
      }
      var linkPath = normalize(url.pathname || '/');
      if (repoBase && linkPath.indexOf(repoBase) === 0) {
        linkPath = normalize(linkPath.slice(repoBase.length) || '/');
      }
      return {
        linkPath: linkPath,
        linkHash: url.hash || ''
      };
    }

    function updateNavHighlight() {
      var state = resolveCurrentPath();

      links.forEach(function (link) {
        link.classList.remove('nav__link--active');
        var href = link.getAttribute('href');
        var target = parseLink(href, state.repoBase);
        if (!target) return;

        if (target.linkHash) {
          if (state.currentPath === target.linkPath &&
            (state.currentHash === target.linkHash || (!state.currentHash && target.linkHash === '#home'))) {
            link.classList.add('nav__link--active');
          }
          return;
        }

        if (state.currentPath === target.linkPath || (target.linkPath !== '/' && state.currentPath.indexOf(target.linkPath) === 0)) {
          link.classList.add('nav__link--active');
        }
      });
    }

    updateNavHighlight();
    window.addEventListener('hashchange', updateNavHighlight);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLangToggle();
    loadI18n();
    loadAssetManifest();
    initScrollReveal();
    initNavHighlight();
    initHomeSectionScroll();
  });
})();
