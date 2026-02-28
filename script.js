// Google Apps Script URL — paste your deployed Web App URL here
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

// Smooth Scroll and Animation on Scroll Implementation

// Animate on Scroll Observer
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
        }
    });
}, observerOptions);

// Observe all elements with data-aos attribute
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('[data-aos]');
    animatedElements.forEach(el => observer.observe(el));
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const navHeight = document.querySelector('.nav').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Close modal if clicking link from within modal
            if (this.getAttribute('href') === '#') {
                window.location.hash = '';
            }
        }
    });
});

// Navigation background on scroll
let lastScroll = 0;
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        nav.style.background = 'rgba(251, 251, 253, 0.95)';
        nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
    } else {
        nav.style.background = 'rgba(255, 255, 255, 0.8)';
        nav.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Video autoplay handling
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) {
    heroVideo.addEventListener('ended', () => {
        // Keep the video on the last frame
        heroVideo.pause();
    });
    
    // Ensure video plays on page load
    heroVideo.play().catch(e => {
        console.log('Video autoplay prevented:', e);
    });
}

// Add animation delay to feature cards
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.2}s`;
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        window.location.hash = '';
    }
});

// Escape key to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.location.hash) {
        window.location.hash = '';
    }
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-content');
    
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        hero.style.opacity = 1 - (scrolled / window.innerHeight) * 0.8;
    }
});

// Add smooth reveal for scroll indicator
window.addEventListener('load', () => {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        setTimeout(() => {
            scrollIndicator.style.opacity = '1';
            scrollIndicator.style.transform = 'translateX(-50%) translateY(0)';
        }, 2000);
    }
});

// Intersection Observer for product images with scaling effect
const productObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.transform = 'scale(1)';
            entry.target.style.opacity = '1';
        }
    });
}, {
    threshold: 0.2
});

document.querySelectorAll('.product-image').forEach(img => {
    img.style.transform = 'scale(0.95)';
    img.style.opacity = '0';
    img.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    productObserver.observe(img);
});

// Smooth page transitions
window.addEventListener('beforeunload', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
});

// Initialize scroll indicator visibility
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    scrollIndicator.style.opacity = '0';
    scrollIndicator.style.transform = 'translateX(-50%) translateY(20px)';
    scrollIndicator.style.transition = 'all 0.8s ease';
}

// Add hover effect to all CTA buttons
document.querySelectorAll('.cta-button').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px) scale(1.02)';
    });
    btn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Performance optimization: Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Newsletter Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = form.querySelector('#nl-name');
        const emailInput = form.querySelector('#nl-email');
        const submitBtn = form.querySelector('#nl-submit');
        const messageEl = form.querySelector('#nl-message');

        // Clear previous state
        nameInput.classList.remove('error');
        emailInput.classList.remove('error');
        messageEl.textContent = '';
        messageEl.className = 'form-message';

        // Validate
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        if (!name) { nameInput.classList.add('error'); return; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailInput.classList.add('error'); return;
        }

        // Submit
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'newsletter', name, email })
            });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.detail || 'Submission failed');
            }
            messageEl.textContent = 'Thank you! You have been signed up.';
            messageEl.className = 'form-message success';
            form.reset();
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                messageEl.textContent = 'Unable to connect. Please check your internet connection.';
            } else {
                messageEl.textContent = err.message || 'Something went wrong. Please try again.';
            }
            messageEl.className = 'form-message error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up for News';
        }
    });
});

console.log('ZOE AI™ - Website Initialized');
