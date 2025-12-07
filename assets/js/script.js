(function () {
    const I18N_PATH = '/assets/i18n.json';
    const ASSET_MANIFEST_PATH = '/assets/asset-manifest.json';
    const HERO_IMAGE_DURATION_MS = 10000;
    const HERO_PAUSE_MS = 20000;
    const ALLOWED_ASSET_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];

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

        var dict = i18nData[lang];

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var value = dict[key];
            if (value) {
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

    function updateLangToggleUI(lang) {
        document.querySelectorAll('.lang-toggle__btn').forEach(function (btn) {
            var btnLang = btn.getAttribute('data-lang');
            if (btnLang === lang) {
                btn.classList.add('lang-toggle__btn--active');
            } else {
                btn.classList.remove('lang-toggle__btn--active');
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
        if (!hero || !assetManifest.pictures.length) return;

        var images = assetManifest.pictures.map(function (file) {
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

        var dots = document.createElement('div');
        dots.className = 'hero__dots';
        var dotEls = [null].concat(images.map(function () { return null; }));

        // First dot for default background (no picture)
        dotEls[0] = document.createElement('span');
        dotEls[0].className = 'hero__dot';
        dots.appendChild(dotEls[0]);

        images.forEach(function (_, idx) {
            var dot = document.createElement('span');
            dot.className = 'hero__dot';
            dots.appendChild(dot);
            dotEls[idx + 1] = dot;
        });
        hero.appendChild(dots);

        function clearTimer() {
            if (slideTimer) {
                clearTimeout(slideTimer);
                slideTimer = null;
            }
        }

        function setActiveDot(activeIndex) {
            dotEls.forEach(function (dot, idx) {
                if (idx === activeIndex) {
                    dot.classList.add('hero__dot--active');
                } else {
                    dot.classList.remove('hero__dot--active');
                }
            });
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

        function hideImage() {
            bgLayers.forEach(function (layer) {
                layer.classList.remove('hero__bg--visible');
            });
        }

        function runSlides(index) {
            clearTimer();
            fadeToImage(images[index]);
            setActiveDot(index + 1);
            slideTimer = window.setTimeout(function () {
                var nextIndex = index + 1;
                if (nextIndex < images.length) {
                    runSlides(nextIndex);
                } else {
                    beginPause();
                }
            }, HERO_IMAGE_DURATION_MS);
        }

        function beginPause() {
            clearTimer();
            hideImage();
            setActiveDot(0);
            slideTimer = window.setTimeout(function () {
                runSlides(0);
            }, HERO_PAUSE_MS);
        }

        // Dot click navigation
        dotEls.forEach(function (dot, idx) {
            if (!dot) return;
            dot.addEventListener('click', function () {
                if (idx === 0) {
                    beginPause();
                } else {
                    runSlides(idx - 1);
                }
            });
        });

        // Start on default background
        beginPause();
    }

    function initLogoGrid() {
        var grid = document.querySelector('.logo-grid');
        if (!grid) return;

        grid.innerHTML = '';

        if (!assetManifest.logos.length) return;

        assetManifest.logos.forEach(function (file, idx) {
            var src = file.startsWith('http://') || file.startsWith('https://') || file.startsWith('/')
                ? file
                : '/assets/logos/' + file;

            var card = document.createElement('div');
            card.className = 'logo-card';

            var img = document.createElement('img');
            img.src = src;
            img.alt = 'Client logo ' + (idx + 1);
            img.loading = 'lazy';

            card.appendChild(img);
            grid.appendChild(card);
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

    function applyAssetManifest(data) {
        assetManifest = {
            pictures: Array.isArray(data && data.pictures) ? data.pictures : [],
            logos: Array.isArray(data && data.logos) ? data.logos : []
        };
        return assetManifest;
    }

    function hasAssets(data) {
        if (!data) return false;
        var hasPics = Array.isArray(data.pictures) && data.pictures.length > 0;
        var hasLogos = Array.isArray(data.logos) && data.logos.length > 0;
        return hasPics || hasLogos;
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

        // Local/dev: manifest first, then GitHub fallback
        return fetchLocalManifest()
            .then(applyAssetManifest)
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

    function initNavHighlight() {
        var links = document.querySelectorAll('.nav__link');

        function normalize(pathname) {
            if (!pathname) return '/';
            var normalized = pathname.replace(/\/index\.html$/, '/');
            if (!normalized.startsWith('/')) normalized = '/' + normalized;
            if (normalized.length > 1 && normalized.endsWith('/')) {
                normalized = normalized.slice(0, -1);
            }
            return normalized || '/';
        }

        var currentPath = normalize(window.location.pathname || '/');

        // Adjust for GitHub Pages project sites (e.g., /repo-name/…)
        var host = window.location.hostname || '';
        var segments = (window.location.pathname || '/').split('/').filter(Boolean);
        if (host.endsWith('github.io') && segments.length) {
            var repoBase = '/' + segments[0];
            if (currentPath.indexOf(repoBase) === 0) {
                currentPath = normalize(currentPath.slice(repoBase.length) || '/');
            }
        }

        links.forEach(function (link) {
            link.classList.remove('nav__link--active');
            var href = link.getAttribute('href');
            if (!href) return;
            var linkPath = normalize(href.replace(window.location.origin, ''));

            if (currentPath === linkPath || (linkPath !== '/' && currentPath.indexOf(linkPath) === 0)) {
                link.classList.add('nav__link--active');
            }
        });
    }

    function initContactFormFeedback() {
        var form = document.querySelector('.contact-form');
        if (!form) return;

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            form.classList.add('contact-form--sent');
            setTimeout(function () {
                form.reset();
                form.classList.remove('contact-form--sent');
            }, 1200);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initLangToggle();
        loadI18n();
        loadAssetManifest();
        initScrollReveal();
        initNavHighlight();
        initContactFormFeedback();
    });
})();
