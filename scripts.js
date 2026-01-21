/**
 * PEA Cooperative Election Campaign Website
 * JavaScript - Interactions & Google Sheets Integration
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
    // Replace with your Google Sheets Web App URL
    GOOGLE_SHEETS_API_URL: 'https://script.google.com/macros/s/AKfycbxI0O2U5KhwQHtgaMTwif9vFN_DjlTv7lCQpCiE74rm9OE7pi1gg69QTX1f5jJgs8Jxcw/exec',

    // Animation settings
    animationDuration: 300,
    scrollThreshold: 100,

    // Intersection Observer settings
    observerThreshold: 0.1,
    observerRootMargin: '0px 0px -50px 0px'
};

// ============================================
// DOM Elements
// ============================================
const elements = {
    navbar: document.getElementById('navbar'),
    navToggle: document.getElementById('navToggle'),
    navMenu: document.getElementById('navMenu'),
    backToTop: document.getElementById('backToTop'),
    policiesGrid: document.getElementById('policiesGrid'),
    articlesGrid: document.getElementById('articlesGrid'),
    downloadsList: document.getElementById('downloadsList'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    candidateProfiles: document.querySelectorAll('.candidate-profile')
};

// ============================================
// Initialize Application
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollEffects();
    initCandidateTabs();
    initScrollAnimations();

    // Load data from Google Sheets (when configured)
    if (CONFIG.GOOGLE_SHEETS_API_URL !== 'https://script.google.com/macros/s/AKfycbxI0O2U5KhwQHtgaMTwif9vFN_DjlTv7lCQpCiE74rm9OE7pi1gg69QTX1f5jJgs8Jxcw/exec') {
        loadAllData();
    }
});

// ============================================
// Navigation
// ============================================
function initNavigation() {
    // Mobile menu toggle
    elements.navToggle?.addEventListener('click', () => {
        elements.navToggle.classList.toggle('active');
        elements.navMenu.classList.toggle('active');
        document.body.style.overflow = elements.navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            elements.navToggle?.classList.remove('active');
            elements.navMenu?.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navHeight = elements.navbar?.offsetHeight || 0;
                const targetPosition = targetElement.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// Scroll Effects
// ============================================
function initScrollEffects() {
    let lastScrollY = 0;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // Navbar background on scroll
        if (currentScrollY > CONFIG.scrollThreshold) {
            elements.navbar?.classList.add('scrolled');
        } else {
            elements.navbar?.classList.remove('scrolled');
        }

        // Back to top button visibility
        if (currentScrollY > 500) {
            elements.backToTop?.classList.add('visible');
        } else {
            elements.backToTop?.classList.remove('visible');
        }

        lastScrollY = currentScrollY;
    });

    // Back to top click
    elements.backToTop?.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// Candidate Tabs
// ============================================
function initCandidateTabs() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const candidateId = btn.dataset.candidate;

            // Update active tab
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show corresponding profile
            elements.candidateProfiles.forEach(profile => {
                profile.classList.remove('active');
            });

            const targetProfile = document.getElementById(`profile-${candidateId}`);
            targetProfile?.classList.add('active');
        });
    });
}

// ============================================
// Scroll Animations (Intersection Observer)
// ============================================
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.aosDelay || 0;

                setTimeout(() => {
                    entry.target.classList.add('aos-animate');
                }, delay);

                // Unobserve after animation
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: CONFIG.observerThreshold,
        rootMargin: CONFIG.observerRootMargin
    });

    animatedElements.forEach(el => {
        el.classList.add('aos-init');
        observer.observe(el);
    });

    // Add AOS styles dynamically
    addAOSStyles();
}

function addAOSStyles() {
    const style = document.createElement('style');
    style.textContent = `
        [data-aos].aos-init {
            opacity: 0;
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        [data-aos="fade-up"].aos-init {
            transform: translateY(30px);
        }
        
        [data-aos="fade-right"].aos-init {
            transform: translateX(-30px);
        }
        
        [data-aos="fade-left"].aos-init {
            transform: translateX(30px);
        }
        
        [data-aos].aos-animate {
            opacity: 1;
            transform: translate(0, 0);
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// Google Sheets Integration
// ============================================

/**
 * Load all data from Google Sheets
 */
async function loadAllData() {
    try {
        showLoadingState();

        const [candidates, policies, articles, downloads, timelines] = await Promise.all([
            fetchSheetData('candidates'),
            fetchSheetData('policies'),
            fetchSheetData('articles'),
            fetchSheetData('downloads'),
            fetchSheetData('timelines')
        ]);

        if (candidates) updateCandidateImages(candidates);
        if (policies) updatePolicies(policies);
        if (articles) updateArticles(articles);
        if (downloads) updateDownloads(downloads);
        if (timelines) updateTimelines(timelines);

    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        hideLoadingState();
    }
}

/**
 * Fetch data from Google Sheets via Apps Script Web App
 * @param {string} sheetName - Name of the sheet to fetch
 * @returns {Promise<Array>} - Array of data objects
 */
async function fetchSheetData(sheetName) {
    try {
        const response = await fetch(`${CONFIG.GOOGLE_SHEETS_API_URL}?sheet=${sheetName}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error(`Error fetching ${sheetName}:`, error);
        return null;
    }
}

/**
 * Update candidate images from Google Sheets data
 * Expected data structure: [{ candidateNumber: 9, imageUrl: '...', name: '...', position: '...' }]
 */
function updateCandidateImages(candidates) {
    candidates.forEach(candidate => {
        const num = candidate.candidateNumber;
        const imageUrl = candidate.imageUrl;

        // Update Hero section images
        const heroImage = document.getElementById(`candidate${num}-image`);
        if (heroImage && imageUrl) {
            heroImage.src = imageUrl;
        }

        // Update Profile section images
        const profileImage = document.getElementById(`profile${num}-image`);
        if (profileImage && imageUrl) {
            profileImage.src = imageUrl;
        }

        // Update profile info
        const profilePosition = document.getElementById(`profile${num}-position`);
        if (profilePosition && candidate.position) {
            profilePosition.textContent = candidate.position;
        }

        const profileExperience = document.getElementById(`profile${num}-experience`);
        if (profileExperience && candidate.experience) {
            profileExperience.textContent = candidate.experience;
        }

        const profileProjects = document.getElementById(`profile${num}-projects`);
        if (profileProjects && candidate.projects) {
            profileProjects.textContent = candidate.projects;
        }
    });
}

/**
 * Update policies section from Google Sheets data
 * Expected data structure: [{ icon: 'fa-mobile-alt', title: '...', description: '...', tags: ['tag1', 'tag2'] }]
 */
function updatePolicies(policies) {
    if (!elements.policiesGrid || policies.length === 0) return;

    // Clear existing policies (keep structure if needed)
    const policyCards = elements.policiesGrid.querySelectorAll('.policy-card');

    policies.forEach((policy, index) => {
        if (policyCards[index]) {
            const card = policyCards[index];

            // Update icon
            const iconEl = card.querySelector('.policy-icon i');
            if (iconEl && policy.icon) {
                iconEl.className = `fas ${policy.icon}`;
            }

            // Update title
            const titleEl = card.querySelector('.policy-title');
            if (titleEl && policy.title) {
                titleEl.textContent = policy.title;
            }

            // Update description
            const descEl = card.querySelector('.policy-description');
            if (descEl && policy.description) {
                descEl.textContent = policy.description;
            }

            // Update tags
            const featuresEl = card.querySelector('.policy-features');
            if (featuresEl && policy.tags && Array.isArray(policy.tags)) {
                featuresEl.innerHTML = policy.tags
                    .map(tag => `<span class="feature-tag">${tag}</span>`)
                    .join('');
            }
        }
    });
}

/**
 * Update articles section from Google Sheets data
 * Expected data structure: [{ imageUrl: '...', category: '...', date: '...', title: '...', excerpt: '...', link: '...' }]
 */
function updateArticles(articles) {
    if (!elements.articlesGrid || articles.length === 0) return;

    elements.articlesGrid.innerHTML = articles.map((article, index) => `
        <div class="article-card" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}">
            <div class="article-image">
                <img src="${article.imageUrl || 'https://via.placeholder.com/400x250'}" alt="${article.title}">
                <div class="article-category">${article.category || 'ข่าวสาร'}</div>
            </div>
            <div class="article-content">
                <span class="article-date">
                    <i class="far fa-calendar-alt"></i>
                    ${formatDate(article.date)}
                </span>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <a href="${article.link || '#'}" class="article-link">
                    อ่านเพิ่มเติม
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `).join('');

    // Re-initialize animations for new elements
    initScrollAnimations();
}

/**
 * Update downloads section from Google Sheets data
 * Expected data structure: [{ filename: '...', fileType: 'PDF', fileSize: '2.5 MB', url: '...' }]
 */
function updateDownloads(downloads) {
    if (!elements.downloadsList || downloads.length === 0) return;

    elements.downloadsList.innerHTML = downloads.map((file, index) => `
        <div class="download-item" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}">
            <div class="download-icon">
                <i class="fas ${getFileIcon(file.fileType)}"></i>
            </div>
            <div class="download-info">
                <h4 class="download-name">${file.filename}</h4>
                <span class="download-meta">
                    <span class="file-type">${file.fileType || 'FILE'}</span>
                    <span class="file-size">${file.fileSize || '-'}</span>
                </span>
            </div>
            <a href="${file.url || '#'}" class="download-btn" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-download"></i>
                ดาวน์โหลด
            </a>
        </div>
    `).join('');

    // Re-initialize animations for new elements
    initScrollAnimations();
}

/**
 * Update timelines from Google Sheets data
 * Expected data structure: [{ candidateNumber: 9, year: '2563', role: '...', description: '...' }]
 */
function updateTimelines(timelines) {
    const timeline9 = document.getElementById('timeline-9');
    const timeline10 = document.getElementById('timeline-10');

    const items9 = timelines.filter(t => t.candidateNumber === 9 || t.candidateNumber === '9');
    const items10 = timelines.filter(t => t.candidateNumber === 10 || t.candidateNumber === '10');

    if (timeline9 && items9.length > 0) {
        timeline9.innerHTML = items9.map(item => createTimelineItemHTML(item)).join('');
    }

    if (timeline10 && items10.length > 0) {
        timeline10.innerHTML = items10.map(item => createTimelineItemHTML(item)).join('');
    }
}

/**
 * Create timeline item HTML
 */
function createTimelineItemHTML(item) {
    return `
        <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <span class="timeline-year">${item.year}</span>
                <h5 class="timeline-role">${item.role}</h5>
                <p class="timeline-desc">${item.description || ''}</p>
            </div>
        </div>
    `;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format date string
 */
function formatDate(dateString) {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString('th-TH', options);
    } catch {
        return dateString;
    }
}

/**
 * Get file icon based on file type
 */
function getFileIcon(fileType) {
    const type = (fileType || '').toLowerCase();

    const icons = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'png': 'fa-file-image',
        'gif': 'fa-file-image',
        'zip': 'fa-file-archive',
        'rar': 'fa-file-archive'
    };

    return icons[type] || 'fa-file';
}

/**
 * Show loading state
 */
function showLoadingState() {
    document.body.classList.add('loading');
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    document.body.classList.remove('loading');
}

// ============================================
// Google Apps Script Template (for reference)
// ============================================
/*
 * Deploy this as a Web App in Google Apps Script:
 * 
 * function doGet(e) {
 *   const sheet = e.parameter.sheet || 'candidates';
 *   const ss = SpreadsheetApp.getActiveSpreadsheet();
 *   const ws = ss.getSheetByName(sheet);
 *   
 *   if (!ws) {
 *     return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet not found' }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 *   
 *   const data = ws.getDataRange().getValues();
 *   const headers = data[0];
 *   const rows = data.slice(1);
 *   
 *   const result = rows.map(row => {
 *     const obj = {};
 *     headers.forEach((header, index) => {
 *       obj[header] = row[index];
 *     });
 *     return obj;
 *   });
 *   
 *   return ContentService.createTextOutput(JSON.stringify(result))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 */
