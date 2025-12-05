(function () {
    const I18N_PATH = '/assets/i18n.json';
    const HERO_INTERVAL_MS = 10000;

    let i18nData = null;
    let currentLang = 'en';

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
        if (!hero) return;

        // Update these to match your real files in /assets/pictures/
        var images = [
            '/assets/pictures/hero-1.jpg',
            '/assets/pictures/hero-2.jpg',
            '/assets/pictures/hero-3.jpg'
        ];

        var index = 0;

        function setBackground(i) {
            hero.style.backgroundImage =
                "linear-gradient(135deg, rgba(28, 35, 79, 0.9), rgba(5, 6, 10, 0.98)), url('" + images[i] + "')";
        }

        setBackground(index);

        setInterval(function () {
            index = (index + 1) % images.length;
            setBackground(index);
        }, HERO_INTERVAL_MS);
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
        var path = window.location.pathname || '/';
        var links = document.querySelectorAll('.nav__link');

        links.forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href) return;
            var linkPath = href.replace(window.location.origin, '');

            if (path === '/' && (href.endsWith('/index.html') || href === '/')) {
                link.classList.add('nav__link--active');
            } else if (path !== '/' &&
                path.indexOf(linkPath.replace('/index.html', '')) === 0 &&
                linkPath !== '/') {
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
        initHeroSlider();
        initScrollReveal();
        initNavHighlight();
        initContactFormFeedback();
    });
})();
