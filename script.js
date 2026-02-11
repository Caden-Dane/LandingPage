const SUPABASE_URL = 'https://kxozpzkumkbipdoeysdv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4b3pwemt1bWtiaXBkb2V5c2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjY2NjgsImV4cCI6MjA4NjM0MjY2OH0.jWUZNqBpSZDxcVRwaFphkOgquH5Xoa4tPgvhemQGdjU';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// Traffic source tracking
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source') || 'direct';
    const utmMedium = urlParams.get('utm_medium') || 'none';
    const utmCampaign = urlParams.get('utm_campaign') || 'none';
    
    sessionStorage.setItem('traffic_source', utmSource);
    sessionStorage.setItem('traffic_medium', utmMedium);
    sessionStorage.setItem('traffic_campaign', utmCampaign);
})();

// Scroll depth tracking
let scrollDepthMarkers = {
    '25': false,
    '50': false,
    '75': false,
    '100': false
};

function trackScrollDepth() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
    
    Object.keys(scrollDepthMarkers).forEach(marker => {
        if (scrollPercentage >= parseInt(marker) && !scrollDepthMarkers[marker]) {
            scrollDepthMarkers[marker] = true;
            
            // Log to console
            console.log('Scroll depth:', marker + '%');
            
            // GA4 event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'scroll_depth', {
                    'depth_percentage': marker,
                    'traffic_source': sessionStorage.getItem('traffic_source')
                });
            }
        }
    });
}

window.addEventListener('scroll', trackScrollDepth);

// Time on page tracking
const pageLoadTime = Date.now();

window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
    
    // Log to console
    console.log('Time on page:', timeOnPage, 'seconds');
    
    // GA4 event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'time_on_page', {
            'duration_seconds': timeOnPage,
            'traffic_source': sessionStorage.getItem('traffic_source')
        });
    }
});

// Interaction tracking for all data-interaction elements
document.addEventListener('click', function(e) {
    const element = e.target.closest('[data-interaction]');
    if (element) {
        const interactionType = element.getAttribute('data-interaction');
        
        // Log to console
        console.log('Interaction:', interactionType);
        
        // GA4 event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'interaction_click', {
                'interaction_type': interactionType,
                'traffic_source': sessionStorage.getItem('traffic_source')
            });
        }
    }
});

// Demo button interaction (mock functionality)
const demoButton = document.querySelector('.demo-button');
if (demoButton) {
    demoButton.addEventListener('click', function(e) {
        e.preventDefault();
        // Visual feedback only - no actual functionality
        this.textContent = 'Analyzing...';
        setTimeout(() => {
            this.textContent = 'Analyze Route';
        }, 800);
    });
}

// Signup form handling
const signupForm = document.getElementById('signup-form');
const postSignupSurvey = document.getElementById('post-signup-survey');
const signupSection = document.querySelector('.signup');

signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const city = document.getElementById('city').value.trim();

    try {
        const { data, error } = await supabaseClient
          .from('signups')
          .insert([{ email, city }])
          .select()
          .single();

        
        if (error) {
            alert('This email is already registered.');
            return;
        }
        
        if (!data || !data.id) {
            console.error('Signup returned no ID');
            alert('Signup failed. Please try again.');
            return;
        }



              // Store signup_id for survey linkage
        sessionStorage.setItem('ridesafe_signup_id', data.id);


        // GA4 conversion event (NO PII)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'signup_submit', {
                event_category: 'conversion'
            });
        }

        // UI flow (unchanged)
        signupSection.style.display = 'none';
        postSignupSurvey.style.display = 'block';
        postSignupSurvey.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
        console.error(err);
        alert('Signup failed. Please try again.');
    }
});


// Survey form handling
const surveyForm = document.getElementById('survey-form');
const completionMessage = document.getElementById('completion-message');

surveyForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const signupId = sessionStorage.getItem('ridesafe_signup_id');

    if (!signupId) {
        console.error('Missing signup_id — cannot save feedback');
        return;
    }

    const signupReason = document.getElementById('signup-reason').value.trim();
    const useCase = document.getElementById('use-case').value.trim();
    const dealbreaker = document.getElementById('dealbreaker').value.trim();

    const { error } = await supabaseClient
        .from('signup_feedback')
        .insert([{
            signup_id: signupId,
            motivation: signupReason,
            usage_timing: useCase,
            dealbreakers: dealbreaker,
            traffic_source: sessionStorage.getItem('traffic_source')
        }]);

    if (error) {
        console.error('Survey insert failed:', error);
        alert('Failed to submit feedback. Please try again.');
        return;
    }

    // GA4 event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'survey_complete', {
            traffic_source: sessionStorage.getItem('traffic_source')
        });
    }

    // UI completion
    postSignupSurvey.style.display = 'none';
    completionMessage.style.display = 'block';
    completionMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
});


// Section visibility tracking (log when sections come into view)
const observerOptions = {
    threshold: 0.5
};

const sectionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionName = entry.target.getAttribute('data-section');
            
            // Log to console
            console.log('Section viewed:', sectionName);
            
            // GA4 event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'section_view', {
                    'section_name': sectionName,
                    'traffic_source': sessionStorage.getItem('traffic_source')
                });
            }
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('[data-section]').forEach(section => {
    sectionObserver.observe(section);
});

// Navbar scroll effect
const navbar = document.getElementById('navbar');

function updateNavbar() {
    const scrollY = window.pageYOffset;
    
    if (scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', updateNavbar);
updateNavbar();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
            const navHeight = navbar.offsetHeight;
            let offsetTop;
            
            if (targetId === '#home') {
                offsetTop = 0;
            } else {
                offsetTop = target.offsetTop - navHeight;
            }
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});
