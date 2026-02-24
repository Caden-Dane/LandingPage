// ============================================================
// MOTYRIC — script.js v3 (mobile-first)
// All GA4 + Supabase functionality preserved
// Added: modal scroll lock, body scroll restore, mobile-safe
//        smooth scroll, bottom-sheet modal pattern
// ============================================================

const SUPABASE_URL = 'https://kxozpzkumkbipdoeysdv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4b3pwemt1bWtiaXBkb2V5c2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjY2NjgsImV4cCI6MjA4NjM0MjY2OH0.jWUZNqBpSZDxcVRwaFphkOgquH5Xoa4tPgvhemQGdjU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('MOTYRIC SCRIPT VERSION: motyric_v3');

// ============================================================
// INJECT STYLES — toast keyframes + hero thank you
// ============================================================
(function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
        @keyframes toastIn {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
            from { opacity: 1; transform: translateY(0) scale(1); }
            to   { opacity: 0; transform: translateY(8px) scale(0.96); }
        }
        @keyframes toastProgress {
            from { transform: scaleX(1); }
            to   { transform: scaleX(0); }
        }
        /* Toast: full-width at bottom on mobile */
        #motyric-toast {
            position: fixed;
            left: 16px;
            right: 16px;
            bottom: max(20px, env(safe-area-inset-bottom, 20px));
            z-index: 9999;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
            background: #1a2535;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            font-family: 'Barlow', sans-serif;
            overflow: hidden;
            animation: toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            cursor: pointer;
            border-radius: 4px;
        }
        /* Toast: float bottom-right on tablet+ */
        @media (min-width: 600px) {
            #motyric-toast {
                left: auto;
                max-width: 380px;
                right: 24px;
                bottom: 24px;
            }
        }
        /* Hero thank you confirmation */
        .hero-thankyou {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 18px 20px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            margin-bottom: 16px;
        }
        .thankyou-check {
            font-size: 22px;
            color: #10b981;
            flex-shrink: 0;
        }
        .hero-thankyou p {
            font-size: 15px;
            color: #94a3b8;
            line-height: 1.5;
            margin: 0;
        }
    `;
    document.head.appendChild(s);
})();

// ============================================================
// TOAST SYSTEM
// ============================================================
let toastQueue = [];
let toastActive = false;

function showToast(message, type = 'info', duration = 4500) {
    toastQueue.push({ message, type, duration });
    if (!toastActive) processToastQueue();
}

function processToastQueue() {
    if (!toastQueue.length) { toastActive = false; return; }
    toastActive = true;

    const { message, type, duration } = toastQueue.shift();
    const existing = document.getElementById('motyric-toast');
    if (existing) existing.remove();

    const icons = {
        success: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8" stroke="#10b981" stroke-width="1.5"/><path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        error:   `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8" stroke="#ef4444" stroke-width="1.5"/><path d="M6 6l6 6M12 6l-6 6" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        info:    `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8" stroke="#f59e0b" stroke-width="1.5"/><path d="M9 8v5M9 6v.5" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/></svg>`
    };
    const accent = { success: '#10b981', error: '#ef4444', info: '#f59e0b' };

    const toast = document.createElement('div');
    toast.id = 'motyric-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `border-left: 3px solid ${accent[type]}; border-top: 1px solid ${accent[type]}33; border-right: 1px solid ${accent[type]}33; border-bottom: 1px solid ${accent[type]}33;`;

    toast.innerHTML = `
        <div style="flex-shrink:0;margin-top:1px">${icons[type]}</div>
        <p style="flex:1;font-size:14px;color:#f1f5f9;line-height:1.5;margin:0">${message}</p>
        <button aria-label="Dismiss" style="flex-shrink:0;background:none;border:none;color:#64748b;font-size:18px;cursor:pointer;padding:0 0 0 10px;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center">&#x2715;</button>
        <div style="position:absolute;bottom:0;left:0;height:2px;width:100%;background:${accent[type]};transform-origin:left;animation:toastProgress ${duration}ms linear forwards"></div>
    `;

    document.body.appendChild(toast);

    let gone = false;
    function dismiss() {
        if (gone) return;
        gone = true;
        clearTimeout(timer);
        toast.style.animation = 'toastOut 0.22s ease forwards';
        toast.addEventListener('animationend', () => { toast.remove(); setTimeout(processToastQueue, 80); }, { once: true });
    }

    toast.addEventListener('click', dismiss);
    const timer = setTimeout(dismiss, duration);
}

// ============================================================
// MODAL HELPERS — bottom sheet with body scroll lock
// Scroll position is saved and restored to prevent jump
// ============================================================
let savedScrollY = 0;

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    savedScrollY = window.scrollY;
    document.body.style.top = `-${savedScrollY}px`;
    document.body.classList.add('no-scroll');
    modal.classList.add('open');
    // Focus first input for accessibility
    setTimeout(() => {
        const first = modal.querySelector('input');
        if (first) first.focus();
    }, 350); // after sheet animation
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('no-scroll');
    document.body.style.top = '';
    window.scrollTo({ top: savedScrollY, behavior: 'instant' });
}

// ============================================================
// URL PARAMETER PREFILL
// ============================================================
(function prefillForms() {
    const p = new URLSearchParams(window.location.search);
    const email = p.get('email');
    const city  = p.get('city');
    [['hero-email', email], ['hero-city', city],
     ['email', email], ['city', city],
     ['founding-email', email], ['founding-city', city]
    ].forEach(([id, val]) => {
        if (!val) return;
        const el = document.getElementById(id);
        if (el) el.value = val;
    });
})();

// ============================================================
// UTM TRACKING
// ============================================================
(function trackSource() {
    const p = new URLSearchParams(window.location.search);
    sessionStorage.setItem('traffic_source',   p.get('utm_source')   || 'direct');
    sessionStorage.setItem('traffic_medium',   p.get('utm_medium')   || 'none');
    sessionStorage.setItem('traffic_campaign', p.get('utm_campaign') || 'none');
})();

// ============================================================
// SCROLL DEPTH TRACKING
// ============================================================
const scrollMarkers = { '25': false, '50': false, '75': false, '100': false };

window.addEventListener('scroll', function () {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH <= 0) return;
    const pct = (window.pageYOffset / docH) * 100;
    Object.keys(scrollMarkers).forEach(m => {
        if (pct >= parseInt(m) && !scrollMarkers[m]) {
            scrollMarkers[m] = true;
            if (typeof gtag !== 'undefined') {
                gtag('event', 'scroll_depth', {
                    depth_percentage: m,
                    traffic_source: sessionStorage.getItem('traffic_source')
                });
            }
        }
    });
}, { passive: true });

// ============================================================
// TIME ON PAGE
// ============================================================
const pageLoadTime = Date.now();
window.addEventListener('beforeunload', function () {
    const t = Math.round((Date.now() - pageLoadTime) / 1000);
    if (typeof gtag !== 'undefined') {
        gtag('event', 'time_on_page', {
            duration_seconds: t,
            traffic_source: sessionStorage.getItem('traffic_source')
        });
    }
});

// ============================================================
// INTERACTION CLICK TRACKING
// ============================================================
document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-interaction]');
    if (!el) return;
    const type = el.getAttribute('data-interaction');
    if (typeof gtag !== 'undefined') {
        gtag('event', 'interaction_click', {
            interaction_type: type,
            traffic_source: sessionStorage.getItem('traffic_source')
        });
    }
});

// ============================================================
// SECTION VISIBILITY TRACKING
// ============================================================
const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const name = entry.target.getAttribute('data-section');
        if (!name) return;
        if (typeof gtag !== 'undefined') {
            gtag('event', 'section_view', {
                section_name: name,
                traffic_source: sessionStorage.getItem('traffic_source')
            });
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('[data-section]').forEach(s => sectionObserver.observe(s));

// ============================================================
// NAVBAR SCROLL
// ============================================================
const navbar = document.getElementById('navbar');

function updateNavbar() {
    navbar.classList.toggle('scrolled', window.pageYOffset > 50);
}
window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

// ============================================================
// SMOOTH SCROLL
// Uses getBoundingClientRect for accurate offset on mobile
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
        e.preventDefault();
        const id = this.getAttribute('href');
        if (id === '#home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        const target = document.querySelector(id);
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navbar.offsetHeight;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});

// ============================================================
// MODAL — wire up all open/close triggers
// HTML uses IDs, not inline onclick, for cleanliness
// ============================================================
const foundingModal = document.getElementById('founding-modal');

// Open triggers
['open-modal-hero', 'open-modal-founding'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => openModal('founding-modal'));
});

// Close button
const closeBtn = document.getElementById('modal-close-btn');
if (closeBtn) closeBtn.addEventListener('click', () => closeModal('founding-modal'));

// Tap outside modal box to close
foundingModal.addEventListener('click', function (e) {
    if (e.target === this) closeModal('founding-modal');
});

// Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal('founding-modal');
});

// ============================================================
// SHARED SIGNUP HANDLER
// ============================================================
async function handleSignup(email, city, source) {
    try {
        const { data, error } = await supabaseClient
            .from('signups')
            .insert([{ email, city }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                showToast("You're already on the list — we'll be in touch.", 'info');
            } else {
                showToast('Signup failed. Please try again.', 'error');
                console.error('Signup error:', error);
            }
            return null;
        }

        if (!data || !data.id) {
            showToast('Signup failed. Please try again.', 'error');
            return null;
        }

        sessionStorage.setItem('motyric_signup_id', data.id);

        if (typeof gtag !== 'undefined') {
            gtag('event', 'signup_submit', {
                event_category: 'conversion',
                signup_source: source
            });
        }

        return data.id;

    } catch (err) {
        console.error('Signup exception:', err);
        showToast('Signup failed. Please try again.', 'error');
        return null;
    }
}

// ============================================================
// SHOW SURVEY — replaces both signup sections
// Small delay before scrollIntoView so display:block renders
// ============================================================
function showSurvey() {
    const heroForm = document.getElementById('hero-signup-form');
    const secondarySignup = document.querySelector('.signup-secondary');

    if (heroForm) {
        heroForm.innerHTML = `
            <div class="hero-thankyou">
                <span class="thankyou-check">&#x2713;</span>
                <p>You're on the list. Scroll down to help us build the right thing.</p>
            </div>
        `;
    }

    if (secondarySignup) secondarySignup.style.display = 'none';

    const survey = document.getElementById('post-signup-survey');
    if (!survey) return;
    survey.style.display = 'block';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const top = survey.getBoundingClientRect().top + window.pageYOffset - navbar.offsetHeight;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}

// ============================================================
// HERO SIGNUP FORM
// ============================================================
const heroSignupForm = document.getElementById('hero-signup-form');
if (heroSignupForm) {
    heroSignupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = this.querySelector('[type="submit"]');
        const orig = btn.textContent;
        btn.textContent = 'Joining...';
        btn.disabled = true;

        const email = document.getElementById('hero-email').value.trim();
        const city  = document.getElementById('hero-city').value.trim();
        const id    = await handleSignup(email, city, 'hero');

        if (id) {
            showSurvey();
        } else {
            btn.textContent = orig;
            btn.disabled = false;
        }
    });
}

// ============================================================
// SECONDARY SIGNUP FORM
// ============================================================
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = this.querySelector('[type="submit"]');
        const orig = btn.textContent;
        btn.textContent = 'Joining...';
        btn.disabled = true;

        const email = document.getElementById('email').value.trim();
        const city  = document.getElementById('city').value.trim();
        const id    = await handleSignup(email, city, 'secondary');

        if (id) {
            showSurvey();
        } else {
            btn.textContent = orig;
            btn.disabled = false;
        }
    });
}

// ============================================================
// FOUNDING MEMBER FORM
// ============================================================
const foundingForm = document.getElementById('founding-form');
if (foundingForm) {
    foundingForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = this.querySelector('[type="submit"]');
        const orig = btn.textContent;
        btn.textContent = 'Reserving...';
        btn.disabled = true;

        const email = document.getElementById('founding-email').value.trim();
        const city  = document.getElementById('founding-city').value.trim();

        try {
            const { data, error } = await supabaseClient
                .from('founding_members')
                .insert([{ email, city }])
                .select()
                .single();

            if (error && error.code === '23505') {
                showToast("You're already reserved as a Founding Rider!", 'info');
                closeModal('founding-modal');
                btn.textContent = orig;
                btn.disabled = false;
                return;
            }

            if (error && error.code !== '23505') {
                console.warn('founding_members fallback:', error.message);
                await handleSignup(email, city, 'founding');
            }

            if (typeof gtag !== 'undefined') {
                gtag('event', 'founding_member_signup', {
                    event_category: 'conversion',
                    value: 19
                });
            }

            closeModal('founding-modal');
            showToast(
                "You're reserved as a Founding Rider. We'll reach out before we charge anything.",
                'success',
                6000
            );

        } catch (err) {
            console.error('Founding signup error:', err);
            showToast('Something went wrong. Please try again.', 'error');
            btn.textContent = orig;
            btn.disabled = false;
        }
    });
}

// ============================================================
// SURVEY FORM
// ============================================================
const surveyForm = document.getElementById('survey-form');
const completionMessage = document.getElementById('completion-message');

if (surveyForm) {
    surveyForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const signupId = sessionStorage.getItem('motyric_signup_id');
        if (!signupId) {
            console.error('Missing signup_id');
            document.getElementById('post-signup-survey').style.display = 'none';
            completionMessage.style.display = 'block';
            requestAnimationFrame(() => requestAnimationFrame(() => {
                const top = completionMessage.getBoundingClientRect().top + window.pageYOffset - navbar.offsetHeight;
                window.scrollTo({ top, behavior: 'smooth' });
            }));
            return;
        }

        const btn = this.querySelector('[type="submit"]');
        btn.textContent = 'Submitting...';
        btn.disabled = true;

        const { error } = await supabaseClient
            .from('waitlist_feedback')
            .insert([{
                signup_id:    signupId,
                motivation:   document.getElementById('signup-reason').value.trim(),
                usage_timing: document.getElementById('use-case').value.trim(),
                dealbreakers: document.getElementById('dealbreaker').value.trim(),
            }]);

        if (error) console.error('Survey insert failed:', error);

        if (typeof gtag !== 'undefined') {
            gtag('event', 'survey_complete', {
                traffic_source: sessionStorage.getItem('traffic_source')
            });
        }

        document.getElementById('post-signup-survey').style.display = 'none';
        completionMessage.style.display = 'block';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const top = completionMessage.getBoundingClientRect().top + window.pageYOffset - navbar.offsetHeight;
            window.scrollTo({ top, behavior: 'smooth' });
        }));
    });
}
