// ============================================================
// MOTYRIC — script.js
// Preserves: GA4 tracking, Supabase signups + feedback
// Adds: founding member flow, hero form, modal, dual signup
// ============================================================

const SUPABASE_URL = 'https://kxozpzkumkbipdoeysdv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4b3pwemt1bWtiaXBkb2V5c2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjY2NjgsImV4cCI6MjA4NjM0MjY2OH0.jWUZNqBpSZDxcVRwaFphkOgquH5Xoa4tPgvhemQGdjU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('MOTYRIC SCRIPT VERSION: motyric_v1');

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
// MODAL — close on overlay click
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
// Handles both hero form and secondary signup form identically
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
                alert('This email is already registered — you\'re on the list!');
            } else {
                alert('Signup failed. Please try again.');
                console.error('Signup error:', error);
            }
            return null;
        }

        if (!data || !data.id) {
            console.error('Signup returned no ID');
            alert('Signup failed. Please try again.');
            return null;
        }

        sessionStorage.setItem('motyric_signup_id', data.id);

        // GA4 conversion event — preserved from original, no PII
        if (typeof gtag !== 'undefined') {
            gtag('event', 'signup_submit', {
                event_category: 'conversion',
                signup_source: source
            });
        }

        return data.id;

    } catch (err) {
        console.error('Signup exception:', err);
        alert('Signup failed. Please try again.');
        return null;
    }
}

// ============================================================
// SHOW POST-SIGNUP SURVEY
// ============================================================
function showSurvey() {
    // Hide both signup sections
    const heroForm = document.getElementById('hero-signup-form');
    const secondarySignup = document.querySelector('.signup-secondary');

    if (heroForm) {
        // Replace hero form with a thankyou message inline
        heroForm.innerHTML = `
            <div class="hero-thankyou">
                <span class="thankyou-check">✓</span>
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

        if (id) showSurvey();
        else {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// ============================================================
// SECONDARY SIGNUP FORM (bottom of page)
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

        if (id) showSurvey();
        else {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// ============================================================
// FOUNDING MEMBER FORM
// Stores to a separate 'founding_members' table in Supabase
// (create this table: id, email, city, created_at)
// Falls back gracefully to signups table if table doesn't exist yet
// ============================================================
const foundingForm = document.getElementById('founding-form');
if (foundingForm) {
    foundingForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = this.querySelector('[type="submit"]');
        btn.textContent = 'Reserving...';
        btn.disabled = true;

        const email = document.getElementById('founding-email').value.trim();
        const city = document.getElementById('founding-city').value.trim();

        try {
            // Try founding_members table first
            const { data, error } = await supabaseClient
                .from('founding_members')
                .insert([{ email, city }])
                .select()
                .single();

            if (error && error.code !== '23505') {
                // Table may not exist yet — fall back to signups with founding flag
                console.warn('founding_members table not found, falling back to signups:', error.message);
                await handleSignup(email, city, 'founding');
            } else if (error && error.code === '23505') {
                alert('You\'re already reserved as a Founding Rider!');
                document.getElementById('founding-modal').classList.remove('open');
                return;
            }

            // GA4 founding conversion — higher value event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'founding_member_signup', {
                    event_category: 'conversion',
                    value: 19
                });
            }

            // Close modal, show confirmation
            document.getElementById('founding-modal').classList.remove('open');
            alert('You\'re reserved as a Founding Rider. We\'ll be in touch before we charge anything. Thank you!');

        } catch (err) {
            console.error('Founding signup error:', err);
            btn.textContent = 'Reserve My Spot — $19';
            btn.disabled = false;
            alert('Something went wrong. Please try again.');
        }
    });
}

// ============================================================
// SURVEY FORM — preserved from original, updated field mapping
// ============================================================
const surveyForm = document.getElementById('survey-form');
const completionMessage = document.getElementById('completion-message');

if (surveyForm) {
    surveyForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const signupId = sessionStorage.getItem('motyric_signup_id');
        if (!signupId) {
            console.error('Missing signup_id — cannot save feedback');
            // Still show completion so UX doesn't break
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
            // Don't block UX on survey failure — still complete
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

// ============================================================
// HERO THANK YOU STYLES (injected inline for simplicity)
// ============================================================
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);
