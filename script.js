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
            
            // Log to console (replace with GA4 event)
            console.log('Scroll depth:', marker + '%');
            
            // Example GA4 event (uncomment when GA4 is configured):
            // gtag('event', 'scroll_depth', {
            //     'depth_percentage': marker,
            //     'traffic_source': sessionStorage.getItem('traffic_source')
            // });
        }
    });
}

window.addEventListener('scroll', trackScrollDepth);

// Time on page tracking
const pageLoadTime = Date.now();

window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
    
    // Log to console (replace with GA4 event)
    console.log('Time on page:', timeOnPage, 'seconds');
    
    // Example GA4 event (uncomment when GA4 is configured):
    // gtag('event', 'time_on_page', {
    //     'duration_seconds': timeOnPage,
    //     'traffic_source': sessionStorage.getItem('traffic_source')
    // });
});

// Interaction tracking for all data-interaction elements
document.addEventListener('click', function(e) {
    const element = e.target.closest('[data-interaction]');
    if (element) {
        const interactionType = element.getAttribute('data-interaction');
        
        // Log to console (replace with GA4 event)
        console.log('Interaction:', interactionType);
        
        // Example GA4 event (uncomment when GA4 is configured):
        // gtag('event', 'interaction_click', {
        //     'interaction_type': interactionType,
        //     'traffic_source': sessionStorage.getItem('traffic_source')
        // });
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

signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const city = document.getElementById('city').value;
    
    // Log to console (replace with actual data collection)
    console.log('Signup submitted:', {
        email: email,
        city: city,
        traffic_source: sessionStorage.getItem('traffic_source'),
        timestamp: new Date().toISOString()
    });
    
    // Example GA4 event (uncomment when GA4 is configured):
    // gtag('event', 'signup', {
    //     'city': city,
    //     'traffic_source': sessionStorage.getItem('traffic_source')
    // });
    
    // Store signup data in sessionStorage
    sessionStorage.setItem('signup_email', email);
    sessionStorage.setItem('signup_city', city);
    
    // Hide signup form and show survey
    signupSection.style.display = 'none';
    postSignupSurvey.style.display = 'block';
    
    // Scroll to survey
    postSignupSurvey.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Survey form handling
const surveyForm = document.getElementById('survey-form');
const completionMessage = document.getElementById('completion-message');

surveyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const signupReason = document.getElementById('signup-reason').value;
    const useCase = document.getElementById('use-case').value;
    const dealbreaker = document.getElementById('dealbreaker').value;
    
    // Log to console (replace with actual data collection)
    console.log('Survey submitted:', {
        email: sessionStorage.getItem('signup_email'),
        city: sessionStorage.getItem('signup_city'),
        signup_reason: signupReason,
        use_case: useCase,
        dealbreaker: dealbreaker,
        traffic_source: sessionStorage.getItem('traffic_source'),
        timestamp: new Date().toISOString()
    });
    
    // Example GA4 event (uncomment when GA4 is configured):
    // gtag('event', 'survey_complete', {
    //     'traffic_source': sessionStorage.getItem('traffic_source')
    // });
    
    // Hide survey and show completion message
    postSignupSurvey.style.display = 'none';
    completionMessage.style.display = 'block';
    
    // Scroll to completion message
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
            
            // Log to console (replace with GA4 event)
            console.log('Section viewed:', sectionName);
            
            // Example GA4 event (uncomment when GA4 is configured):
            // gtag('event', 'section_view', {
            //     'section_name': sectionName,
            //     'traffic_source': sessionStorage.getItem('traffic_source')
            // });
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
