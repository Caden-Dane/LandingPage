// ============================================================
// MOTYRIC — script.js
// Preserves: GA4 tracking, Supabase signups + feedback
// Adds: founding member flow, hero form, modal, dual signup
// Updated: custom toast notifications replacing all alert() calls
// ============================================================

const SUPABASE_URL = 'https://kxozpzkumkbipdoeysdv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4b3pwemt1bWtiaXBkb2V5c2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjY2NjgsImV4cCI6MjA4NjM0MjY2OH0.jWUZNqBpSZDxcVRwaFphkOgquH5Xoa4tPgvhemQGdjU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('MOTYRIC SCRIPT VERSION: motyric_v2');

// ============================================================
// TOAST NOTIFICATION SYSTEM
// Replaces all alert() calls with branded notifications
// Types: 'success' | 'error' | 'info'
// ============================================================

let toastQueue = [];
let toastVisible = false;

function showToast(message, type = 'info', duration = 4500) {
    toastQueue.push({ message, type, duration });
    if (!toastVisible) processToastQueue();
}

function processToastQueue() {
    if (toastQueue.length === 0) {
        toastVisible = false;
        return;
    }

    toastVisible = true;
    const { message, type, duration } = toastQueue.shift();

    const existing = document.getElementById('motyric-toast');
    if (existing) existing.remove();

    const icons = {
        success: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8" stroke="#10b981" stroke-width="1.5"/>
                    <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>`,
        error:   `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8" stroke="#ef4444" stroke-width="1.5"/>
                    <path d="M6 6l6 6M12 6l-6 6" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>`,
        info:    `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8" stroke="#f59e0b" stroke-width="1.5"/>
                    <path d="M9 8v5M9 6v.5" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>`
    };

    const accentColors = {
        success: '#10b981',
        error:   '#ef4444',
        info:    '#f59e0b'
    };

    const toast = document.createElement('div');
    toast.id = 'motyric-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    toast.style.cssText = `
        position: fixed;
        bottom: 32px;
        right: 32px;
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 20px;
        background: #1a2535;
        border: 1px solid ${accentColors[type]}40;
        border-left: 3px solid ${accentColors[type]};
        max-width: 380px;
        min-width: 280px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        font-family: 'Barlow', sans-serif;
        overflow: hidden;
        animation: toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        cursor: pointer;
    `;

    toast.innerHTML = `
        <div style="flex-shrink:0; margin-top:1px;">${icons[type]}</div>
        <div style="flex:1;">
            <p style="
                font-size: 14px;
                color: #f1f5f9;
                line-height: 1.5;
                margin: 0;
            ">${message}</p>
        </div>
        <button aria-label="Dismiss" style="
            flex-shrink: 0;
            background: none;
            border: none;
            color: #64748b;
            font-size: 16px;
            cursor: pointer;
            padding: 0 0 0 8px;
            line-height: 1;
            transition: color 0.2s ease;
            margin-top: -1px;
        " onmouseover="this.style.color='#f1f5f9'" onmouseout="this.style.color='#64748b'">&#x2715;</button>
        <div style="
            position: absolute;
            bottom: 0;
            left: 0;
            height: 2px;
            width: 100%;
            background: ${accentColors[type]};
            transform-origin: left;
            animation: toastProgress ${duration}ms linear forwards;
        "></div>
    `;

    document.body.appendChild(toast);

    let dismissed = false;
    function dismissToast() {
        if (dismissed) return;
        dismissed = true;
        clearTimeout(timer);
        toast.style.animation = 'toastOut 0.25s ease forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
            setTimeout(processToastQueue, 100);
        }, { once: true });
    }

    toast.addEventListener('click', dismissToast);
    const timer = setTimeout(dismissToast, duration);
}

// ============================================================
// STYLE INJECTION — toast keyframes + hero thankyou
// ============================================================
(function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
        @keyframes toastIn {
            from { opacity: 0; transform: translateY(16px) scale(0.96); }
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
        @media (max-width: 600px) {
            #motyric-toast {
                bottom: 16px !important;
                right: 16px !important;
                left: 16px !important;
                max-width: none !important;
            }
        }
        .hero-thankyou {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 20px 24px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            margin-top: 8px;
        }
        .thankyou-check {
            font-size: 24px;
            color: #10b981;
            flex-shrink: 0;
        }
        .hero-thankyou p {
            font-size: 15px;
            color: #94a3b8;
            line-height: 1.5;
        }
    `;
    document.head.appendChild(s);
})();

// ============================================================
// URL PARAMETER PREFILL — preserved from original
// ============================================================
(function prefillForms() {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const city = params.get('city');

    const fields = [
        ['hero-email', email], ['hero-city', city],
        ['email', email], ['city', city],
        ['founding-email', email], ['founding-city', city]
    ];

    fields.forEach(([id, val]) => {
        if (!val) return;
        const el = document.getElementById(id);
        if (el) el.value = val;
    });
})();

// ============================================================
// UTM / TRAFFIC SOURCE TRACKING — preserved from original
// ============================================================
(function trackSource() {
    const p = new URLSearchParams(window.location.search);
    sessionStorage.setItem('traffic_source', p.get('utm_source') || 'direct');
    sessionStorage.setItem('traffic_medium', p.get('utm_medium') || 'none');
    sessionStorage.setItem('traffic_campaign', p.get('utm_campaign') || 'none');
})();

// ============================================================
// SCROLL DEPTH TRACKING — preserved from original
// ============================================================
const scrollMarkers = { '25': false, '50': false, '75': false, '100': false };

window.addEventListener('scroll', function () {
    const pct = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    Object.keys(scrollMarkers).forEach(m => {
        if (pct >= parseInt(m) && !scrollMarkers[m]) {
            scrollMarkers[m] = true;
            console.log('Scroll depth:', m + '%');
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
// TIME ON PAGE — preserved from original
// ============================================================
const pageLoadTime = Date.now();
window.addEventListener('beforeunload', function () {
    const t = Math.round((Date.now() - pageLoadTime) / 1000);
    console.log('Time on page:', t, 'seconds');
    if (typeof gtag !== 'undefined') {
        gtag('event', 'time_on_page', {
            duration_seconds: t,
            traffic_source: sessionStorage.getItem('traffic_source')
        });
    }
});

// ============================================================
// INTERACTION CLICK TRACKING — preserved from original
// ============================================================
document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-interaction]');
    if (!el) return;
    const type = el.getAttribute('data-interaction');
    console.log('Interaction:', type);
    if (typeof gtag !== 'undefined') {
        gtag('event', 'interaction_click', {
            interaction_type: type,
            traffic_source: sessionStorage.getItem('traffic_source')
        });
    }
});

// ============================================================
// SECTION VISIBILITY TRACKING — preserved from original
// ============================================================
const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const name = entry.target.getAttribute('data-section');
        console.log('Section viewed:', name);
        if (typeof gtag !== 'undefined') {
            gtag('event', 'section_view', {
                section_name: name,
                traffic_source: sessionStorage.getItem('traffic_source')
            });
        }
    });
}, { threshold: 0.4 });

document.querySelectorAll('[data-section]').forEach(s => sectionObserver.observe(s));

// ============================================================
// NAVBAR SCROLL EFFECT — preserved from original
// ============================================================
const navbar = document.getElementById('navbar');

function updateNavbar() {
    navbar.classList.toggle('scrolled', window.pageYOffset > 80);
}

window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

// ============================================================
// SMOOTH SCROLL — preserved from original
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        const offset = this.getAttribute('href') === '#home'
            ? 0
            : target.offsetTop - navbar.offsetHeight;
        window.scrollTo({ top: offset, behavior: 'smooth' });
    });
});

// ============================================================
// MODAL — close on overlay click and escape key
// ============================================================
document.getElementById('founding-modal').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('open');
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.getElementById('founding-modal').classList.remove('open');
    }
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
            console.error('Signup returned no ID');
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
// SHOW POST-SIGNUP SURVEY
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
    survey.style.display = 'block';
    survey.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// HERO SIGNUP FORM
// ============================================================
const heroSignupForm = document.getElementById('hero-signup-form');
if (heroSignupForm) {
    heroSignupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = this.querySelector('[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Joining...';
        btn.disabled = true;

        const email = document.getElementById('hero-email').value.trim();
        const city = document.getElementById('hero-city').value.trim();

        const id = await handleSignup(email, city, 'hero');

        if (id) {
            showSurvey();
        } else {
            btn.textContent = originalText;
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
        const originalText = btn.textContent;
        btn.textContent = 'Joining...';
        btn.disabled = true;

        const email = document.getElementById('email').value.trim();
        const city = document.getElementById('city').value.trim();

        const id = await handleSignup(email, city, 'secondary');

        if (id) {
            showSurvey();
        } else {
            btn.textContent = originalText;
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
        const originalText = btn.textContent;
        btn.textContent = 'Reserving...';
        btn.disabled = true;

        const email = document.getElementById('founding-email').value.trim();
        const city = document.getElementById('founding-city').value.trim();

        try {
            const { data, error } = await supabaseClient
                .from('founding_members')
                .insert([{ email, city }])
                .select()
                .single();

            if (error && error.code === '23505') {
                showToast("You're already reserved as a Founding Rider!", 'info');
                document.getElementById('founding-modal').classList.remove('open');
                btn.textContent = originalText;
                btn.disabled = false;
                return;
            }

            if (error && error.code !== '23505') {
                console.warn('founding_members insert error, falling back to signups:', error.message);
                await handleSignup(email, city, 'founding');
            }

            if (typeof gtag !== 'undefined') {
                gtag('event', 'founding_member_signup', {
                    event_category: 'conversion',
                    value: 19
                });
            }

            document.getElementById('founding-modal').classList.remove('open');
            showToast(
                "You're reserved as a Founding Rider. We'll reach out before we charge anything.",
                'success',
                6000
            );

        } catch (err) {
            console.error('Founding signup error:', err);
            showToast('Something went wrong. Please try again.', 'error');
            btn.textContent = originalText;
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
            console.error('Missing signup_id — cannot save feedback');
            document.getElementById('post-signup-survey').style.display = 'none';
            completionMessage.style.display = 'block';
            completionMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        const btn = this.querySelector('[type="submit"]');
        btn.textContent = 'Submitting...';
        btn.disabled = true;

        const { error } = await supabaseClient
            .from('waitlist_feedback')
            .insert([{
                signup_id: signupId,
                motivation: document.getElementById('signup-reason').value.trim(),
                usage_timing: document.getElementById('use-case').value.trim(),
                dealbreakers: document.getElementById('dealbreaker').value.trim(),
            }]);

        if (error) {
            console.error('Survey insert failed:', error);
        }

        if (typeof gtag !== 'undefined') {
            gtag('event', 'survey_complete', {
                traffic_source: sessionStorage.getItem('traffic_source')
            });
        }

        document.getElementById('post-signup-survey').style.display = 'none';
        completionMessage.style.display = 'block';
        completionMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
