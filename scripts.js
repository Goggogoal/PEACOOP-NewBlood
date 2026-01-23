/**
 * PEA Cooperative Election Campaign Website
 * JavaScript - Interactions & Google Sheets Integration
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
    // Replace with your Google Sheets Web App URL
    GOOGLE_SHEETS_API_URL: 'https://script.google.com/macros/s/AKfycbyfBiSU_PZHxDRl3uOqs9oGIAnyRofnMejNYSP10L1VTYlwXaU3WsTau7LQW8zXTwnHpg/exec',

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
    initCountdown();
    initOpinionSection();

    // Load data from Google Sheets (when configured)
    if (CONFIG.GOOGLE_SHEETS_API_URL && CONFIG.GOOGLE_SHEETS_API_URL.includes('script.google.com')) {
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
// Countdown Timer
// ============================================
function initCountdown() {
    // Election Date: February 27, 2026 at 08:30 (Thai time)
    const electionDate = new Date('2026-02-27T08:30:00+07:00');

    function updateCountdown() {
        const now = new Date();
        const timeLeft = electionDate - now;

        // Check if election has passed
        if (timeLeft < 0) {
            document.getElementById('countdownDays').textContent = '00';
            document.getElementById('countdownHours').textContent = '00';
            document.getElementById('countdownMinutes').textContent = '00';
            return;
        }

        // Calculate days, hours, minutes
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        // Update display (with leading zeros)
        document.getElementById('countdownDays').textContent = String(days).padStart(2, '0');
        document.getElementById('countdownHours').textContent = String(hours).padStart(2, '0');
        document.getElementById('countdownMinutes').textContent = String(minutes).padStart(2, '0');
    }

    // Update immediately
    updateCountdown();

    // Update every minute (60000 milliseconds)
    setInterval(updateCountdown, 60000);
}

// ============================================
// Opinion Section
// ============================================
function initOpinionSection() {
    const form = document.getElementById('opinionForm');
    const formMessage = document.getElementById('formMessage');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('opinionTitle').value.trim();

            // Collect selected checkboxes
            const selectedTags = Array.from(document.querySelectorAll('input[name="tags"]:checked'))
                .map(checkbox => checkbox.value);
            const tags = selectedTags.join(',');

            const details = document.getElementById('opinionDetails').value.trim();

            if (!title || !tags || !details) {
                showFormMessage('กรุณากรอกข้อมูลให้ครบถ้วน (โปรดเลือกแท็กอย่างน้อย 1 รายการ)', 'error');
                return;
            }


            // Use JSONP to avoid CORS issues
            const callbackName = 'opinionCallback_' + Date.now();

            window[callbackName] = function (response) {
                if (response && response.success) {
                    showFormMessage('ส่งความคิดเห็นสำเร็จ! ขอบคุณที่แบ่งปันความคิดเห็น', 'success');
                    form.reset();
                    setTimeout(() => loadWordCloud(), 2000);
                } else {
                    showFormMessage('เกิดข้อผิดพลาด: ' + (response?.error || 'ไม่สามารถบันทึกข้อมูลได้'), 'error');
                }
                delete window[callbackName];
            };

            const params = new URLSearchParams({
                action: 'addOpinion',
                title: title,
                tags: tags,
                details: details,
                timestamp: new Date().toISOString(),
                callback: callbackName
            });

            const script = document.createElement('script');
            script.src = `${CONFIG.GOOGLE_SHEETS_API_URL}?${params.toString()}`;
            script.onerror = function () {
                showFormMessage('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง', 'error');
                delete window[callbackName];
            };

            document.head.appendChild(script);
            setTimeout(() => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }, 10000);
        });
    }

    // Load word cloud on page load
    loadWordCloud();
}

function showFormMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    if (formMessage) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            formMessage.className = 'form-message';
        }, 5000);
    }
}

async function loadWordCloud() {
    const wordCloudContainer = document.getElementById('wordCloud');
    if (!wordCloudContainer) return;

    // Use JSONP to load opinions
    const callbackName = 'wordCloudCallback_' + Date.now();

    window[callbackName] = function (data) {
        if (data && data.opinions && data.opinions.length > 0) {
            generateWordCloud(data.opinions);
        } else {
            wordCloudContainer.innerHTML = '<p style="color: var(--text-secondary);">ยังไม่มีแท็กในระบบ</p>';
        }
        delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `${CONFIG.GOOGLE_SHEETS_API_URL}?sheet=Opinion&callback=${callbackName}`;
    script.onerror = function () {
        wordCloudContainer.innerHTML = '<p style="color: var(--text-secondary);">ไม่สามารถโหลดข้อมูลได้</p>';
        delete window[callbackName];
    };

    document.head.appendChild(script);
    setTimeout(() => {
        if (script.parentNode) {
            script.parentNode.removeChild(script);
        }
    }, 10000);
}

function generateWordCloud(opinions) {
    const wordCloudContainer = document.getElementById('wordCloud');
    if (!wordCloudContainer) return;

    // Count tag frequencies (unique tags per submission)
    const tagCounts = {};
    opinions.forEach(opinion => {
        if (opinion.tags) {
            // Use Set to get unique tags per submission
            const tags = opinion.tags.split(',').map(tag => tag.trim().toLowerCase());
            const uniqueTags = [...new Set(tags)]; // Remove duplicates within same submission
            uniqueTags.forEach(tag => {
                if (tag) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
            });
        }
    });

    // Convert to array and sort by frequency
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30); // Top 30 tags

    if (sortedTags.length === 0) {
        wordCloudContainer.innerHTML = '<p style="color: var(--text-secondary);">ยังไม่มีแท็กในระบบ</p>';
        return;
    }

    // Find max and min counts for scaling
    const maxCount = sortedTags[0][1];
    const minCount = sortedTags[sortedTags.length - 1][1];

    // Generate HTML
    wordCloudContainer.innerHTML = sortedTags.map(([tag, count]) => {
        // Scale font size between 0.875rem and 2rem
        const scale = (count - minCount) / (maxCount - minCount || 1);
        const fontSize = 0.875 + (scale * 1.125);

        return `<span class="wordcloud-tag" style="font-size: ${fontSize}rem;" title="${count} ครั้ง">${tag}</span>`;
    }).join('');
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
 * Uses fetch with redirect handling for cross-origin requests
 * @param {string} sheetName - Name of the sheet to fetch
 * @returns {Promise<Array>} - Array of data objects
 */
async function fetchSheetData(sheetName) {
    try {
        const url = `${CONFIG.GOOGLE_SHEETS_API_URL}?sheet=${sheetName}`;

        // Try fetch with redirect following (required for Apps Script)
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Loaded ${sheetName}:`, data);
        return data;

    } catch (error) {
        console.error(`Error fetching ${sheetName} with fetch, trying JSONP:`, error);

        // Fallback to JSONP for CORS issues
        return fetchWithJSONP(sheetName);
    }
}

/**
 * JSONP fallback for cross-origin requests
 * @param {string} sheetName - Name of the sheet to fetch
 * @returns {Promise<Array>} - Array of data objects
 */
function fetchWithJSONP(sheetName) {
    return new Promise((resolve, reject) => {
        const callbackName = `jsonpCallback_${sheetName}_${Date.now()}`;
        const url = `${CONFIG.GOOGLE_SHEETS_API_URL}?sheet=${sheetName}&callback=${callbackName}`;

        // Create callback function
        window[callbackName] = function (data) {
            console.log(`JSONP loaded ${sheetName}:`, data);
            resolve(data);

            // Cleanup
            delete window[callbackName];
            document.head.removeChild(script);
        };

        // Create script element
        const script = document.createElement('script');
        script.src = url;
        script.onerror = function () {
            console.error(`JSONP error for ${sheetName}`);
            reject(new Error(`JSONP failed for ${sheetName}`));
            delete window[callbackName];
            document.head.removeChild(script);
        };

        // Set timeout
        setTimeout(() => {
            if (window[callbackName]) {
                console.error(`JSONP timeout for ${sheetName}`);
                reject(new Error(`JSONP timeout for ${sheetName}`));
                delete window[callbackName];
                if (script.parentNode) {
                    document.head.removeChild(script);
                }
            }
        }, 10000);

        document.head.appendChild(script);
    });
}

/**
 * Update candidate images from Google Sheets data
 * Expected data structure: [{ candidateNumber: 9, imageUrl: '...', name: '...', position: '...' }]
 */
function updateCandidateImages(candidates) {
    candidates.forEach(candidate => {
        const num = candidate.candidateNumber;
        const imageUrl = candidate.imageUrl;

        // Update Hero section images ***Decided to not update Hero images***
        //const heroImage = document.getElementById(`candidate${num}-image`);
        //if (heroImage && imageUrl) {
        //    heroImage.src = imageUrl;
        //}

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

    console.log('Candidates section updated successfully');
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
let allDownloads = []; // Store all downloads for filtering
const INITIAL_DISPLAY_COUNT = 9; // Show 9 items initially (3 rows x 3 columns)

function updateDownloads(downloads) {
    if (!elements.downloadsList || downloads.length === 0) return;

    allDownloads = downloads; // Store for filtering
    renderDownloads(allDownloads);
    initDownloadSearch();
}

function renderDownloads(downloads, showAll = false) {
    const container = elements.downloadsList;
    const itemsToShow = showAll ? downloads : downloads.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMore = downloads.length > INITIAL_DISPLAY_COUNT;

    container.innerHTML = itemsToShow.map((file, index) => `
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

    // Add show more/less button if needed
    updateShowMoreButton(downloads, showAll, hasMore);

    // Re-initialize animations for new elements
    initScrollAnimations();
}

function updateShowMoreButton(downloads, showAll, hasMore) {
    const downloadsSection = document.getElementById('downloads');
    let buttonContainer = downloadsSection.querySelector('.show-more-container');

    // Remove existing button
    if (buttonContainer) {
        buttonContainer.remove();
    }

    // Add button if there are more items
    if (hasMore && !showAll) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'show-more-container';
        buttonContainer.innerHTML = `
            <button class="show-more-btn" onclick="toggleShowMore(true)">
                <span>แสดงเพิ่มเติม</span>
                <i class="fas fa-chevron-down"></i>
            </button>
        `;
        downloadsSection.querySelector('.container').appendChild(buttonContainer);
    } else if (showAll && downloads.length > INITIAL_DISPLAY_COUNT) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'show-more-container';
        buttonContainer.innerHTML = `
            <button class="show-more-btn" onclick="toggleShowMore(false)">
                <span>แสดงน้อยลง</span>
                <i class="fas fa-chevron-up"></i>
            </button>
        `;
        downloadsSection.querySelector('.container').appendChild(buttonContainer);
    }
}

// Global function for show more/less
window.toggleShowMore = function (showAll) {
    const searchInput = document.getElementById('downloadSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filteredDownloads = allDownloads;
    if (searchTerm) {
        filteredDownloads = allDownloads.filter(file =>
            file.filename.toLowerCase().includes(searchTerm)
        );
    }

    renderDownloads(filteredDownloads, showAll);
};

function initDownloadSearch() {
    const searchInput = document.getElementById('downloadSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        if (searchTerm === '') {
            renderDownloads(allDownloads, false);
        } else {
            const filtered = allDownloads.filter(file =>
                file.filename.toLowerCase().includes(searchTerm)
            );
            renderDownloads(filtered, true); // Show all filtered results
        }
    });
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
