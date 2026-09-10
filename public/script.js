/* ============================================
   Sri Sai Realty - Interactive JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

    // === Preloader ===
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', function () {
        setTimeout(function () {
            preloader.classList.add('hidden');
        }, 800);
    });
    setTimeout(function () {
        preloader.classList.add('hidden');
    }, 3000);

    // === Navbar Scroll Effect ===
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-link:not(.nav-cta)');

    function handleScroll() {
        const scrollY = window.scrollY;

        if (scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        let current = '';
        sections.forEach(function (section) {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', handleScroll);

    backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // === Mobile Navigation Toggle ===
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // === Hero Particles ===
    const heroParticles = document.getElementById('heroParticles');
    if (heroParticles) {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.classList.add('hero-particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = (Math.random() * 4 + 2) + 'px';
            particle.style.height = particle.style.width;
            particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
            particle.style.animationDelay = (Math.random() * 10) + 's';
            particle.style.opacity = Math.random() * 0.4 + 0.1;
            heroParticles.appendChild(particle);
        }
    }

    // === Counter Animation ===
    function animateCounters() {
        const counters = document.querySelectorAll('[data-count]');
        counters.forEach(function (counter) {
            if (counter.dataset.animated) return;

            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            function updateCounter() {
                current += step;
                if (current >= target) {
                    counter.textContent = target;
                    counter.dataset.animated = 'true';
                } else {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                }
            }
            updateCounter();
        });
    }

    const statsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                animateCounters();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }

    // ============================================
    // PROPERTIES - Load from API
    // ============================================
    let allProperties = [];
    let currentFilter = 'all';
    const propertiesGrid = document.querySelector('.properties-grid');

    function getPropertyIcon() {
        return 'fa-home';
    }

    function getBadgeClass(p) {
        const status = (p.available || p.status || '').toLowerCase();
        if (status.includes('rent')) return 'badge-plot';
        if (status.includes('lease')) return 'badge-commercial';
        if (status.includes('buy')) return 'badge-new';
        return '';
    }

    function createPropertyCard(p) {
        const img = p.images && p.images.length
            ? `<img src="${p.images[0]}" alt="${escapeHtml(p.name)}" class="property-real-img">`
            : `<div class="image-placeholder property-placeholder"><i class="fas ${getPropertyIcon()}"></i></div>`;

        const badgeClass = getBadgeClass(p);
        const statusText = p.available || p.status || 'Available';

        return `
            <div class="property-card" data-id="${p.id}">
                <div class="property-image">
                    ${img}
                    <div class="property-badge ${badgeClass}">${escapeHtml(statusText)}</div>
                    ${p.price ? `<div class="property-price">${escapeHtml(p.price)}</div>` : ''}
                    <div class="property-overlay">
                        <button class="btn btn-sm btn-white" onclick="openPropertyModal('${p.id}')">View Details</button>
                    </div>
                </div>
                <div class="property-info">
                    <div class="property-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(p.place || 'Location')}</span>
                        ${p.size ? `<span><i class="fas fa-vector-square"></i> ${escapeHtml(p.size)}</span>` : ''}
                    </div>
                    <h3>${escapeHtml(p.name)}</h3>
                    <div class="property-features">
                        ${p.facing ? `<span><i class="fas fa-compass"></i> ${escapeHtml(p.facing)} Facing</span>` : ''}
                        ${p.khata ? `<span><i class="fas fa-file-contract"></i> ${escapeHtml(p.khata)}</span>` : ''}
                        ${p.road ? `<span><i class="fas fa-road"></i> ${escapeHtml(p.road)}</span>` : ''}
                        ${p.loan ? `<span><i class="fas fa-hand-holding-usd"></i> Loan: ${escapeHtml(p.loan)}</span>` : ''}
                    </div>
                    ${p.description ? `<p class="property-desc">${escapeHtml(truncate(p.description, 70))}</p>` : ''}
                    <div class="property-footer">
                        <span class="property-type">
                            <i class="fas ${getPropertyIcon()}"></i> ${escapeHtml(p.available || 'Available')}
                        </span>
                        <button class="btn btn-sm btn-primary" onclick="enquireProperty('${p.id}')">Enquire</button>
                    </div>
                </div>
            </div>`;
    }

    function renderProperties() {
        if (!propertiesGrid) return;

        const loading = document.getElementById('propertyLoading');
        if (loading) loading.style.display = 'none';

        const filtered = currentFilter === 'all'
            ? allProperties
            : allProperties.filter((p) => (p.available || '').toLowerCase().includes(currentFilter.toLowerCase()));

        if (!filtered.length) {
            propertiesGrid.innerHTML = `
                <div class="property-empty">
                    <i class="fas fa-building"></i>
                    <h3>No Properties Found</h3>
                    <p>We don't have properties in this category right now.<br>Check back soon or contact us for options.</p>
                    <a href="#enquiry" class="btn btn-primary">Contact Us</a>
                </div>`;
            return;
        }

        propertiesGrid.innerHTML = filtered.map(createPropertyCard).join('');
    }

    async function loadProperties() {
        if (!propertiesGrid) return;
        const loading = document.getElementById('propertyLoading');

        try {
            const res = await fetch('/api/properties');
            if (!res.ok) throw new Error('Failed to load');
            allProperties = await res.json();
            renderProperties();
        } catch (err) {
            if (loading) {
                loading.innerHTML = `
                    <div class="property-empty">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Couldn't load properties</h3>
                        <p>Please refresh the page or contact us directly.</p>
                        <a href="#enquiry" class="btn btn-primary">Contact Us</a>
                    </div>`;
            }
        }
    }

    // Property filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filterBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderProperties();
        });
    });

    loadProperties();

    // ============================================
    // PROPERTY DETAIL MODAL
    // ============================================
    window.openPropertyModal = function (id) {
        const p = allProperties.find((x) => x.id === id);
        if (!p) return;

        const modal = document.getElementById('propertyModal');
        const body = document.getElementById('propertyModalBody');

        const images = p.images && p.images.length ? p.images : [];
        modalPropertyImages = images;

        body.innerHTML = `
            <div class="pm-images">
                ${images.length
                    ? images.slice(0, 4).map((img, i) => `
                        <div class="pm-img ${i === 0 ? 'pm-main' : ''}">
                            <img src="${img}" alt="${escapeHtml(p.name)}" onclick="openImage(${i})">
                        </div>`).join('')
                    : `<div class="pm-img pm-main">
                        <div class="image-placeholder property-placeholder" style="height: 100%; border-radius: 0;">
                            <i class="fas fa-home"></i>
                        </div>
                    </div>`}
            </div>
            <div class="pm-content">
                <div class="pm-header">
                    <div>
                        <span class="pm-badge ${getBadgeClass(p)}">${escapeHtml(p.available || p.status || 'Available')}</span>
                        ${p.size ? `<span class="pm-type"><i class="fas fa-vector-square"></i> ${escapeHtml(p.size)}</span>` : ''}
                    </div>
                    ${p.price ? `<div class="pm-price">${escapeHtml(p.price)}</div>` : ''}
                </div>
                <h2 class="pm-title">${escapeHtml(p.name)}</h2>
                <p class="pm-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(p.place || '')}</p>
                ${p.description ? `<p class="pm-desc">${escapeHtml(p.description)}</p>` : ''}
                <div class="pm-features">
                    ${p.size ? `<div class="pm-feature"><i class="fas fa-vector-square"></i><strong>${escapeHtml(p.size)}</strong><span>Size</span></div>` : ''}
                    ${p.facing ? `<div class="pm-feature"><i class="fas fa-compass"></i><strong>${escapeHtml(p.facing)}</strong><span>Facing</span></div>` : ''}
                    ${p.khata ? `<div class="pm-feature"><i class="fas fa-file-contract"></i><strong>${escapeHtml(p.khata)}</strong><span>Khata</span></div>` : ''}
                    ${p.road ? `<div class="pm-feature"><i class="fas fa-road"></i><strong>${escapeHtml(p.road)}</strong><span>Road</span></div>` : ''}
                </div>
                ${p.loan ? `<div class="pm-loan" style="margin-top: 12px; padding: 10px 14px; background: ${p.loan === 'Yes' ? '#fff3cd' : '#e6f4ea'}; border-radius: 8px; font-size: 0.9rem; color: ${p.loan === 'Yes' ? '#664d03' : '#1e7e34'};"><i class="fas fa-hand-holding-usd" style="margin-right: 6px;"></i>Existing Loan: <strong>${escapeHtml(p.loan)}</strong></div>` : ''}
                <div class="pm-actions">
                    <button class="btn btn-primary btn-lg" onclick="enquireProperty('${p.id}')">
                        <i class="fas fa-paper-plane"></i> Enquire Now
                    </button>
                    <a href="tel:+919986111031" class="btn btn-outline btn-lg">
                        <i class="fas fa-phone"></i> Call Us
                    </a>
                </div>
            </div>`;

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    window.closePropertyModal = function () {
        const modal = document.getElementById('propertyModal');
        modal.classList.remove('open');
        document.body.style.overflow = '';
    };

    var modalPropertyImages = [];
    window.openImage = function (index) {
        if (!modalPropertyImages.length) return;
        var lb = document.getElementById('imageLightbox');
        if (!lb) {
            lb = document.createElement('div');
            lb.id = 'imageLightbox';
            lb.className = 'image-lightbox';
            lb.innerHTML = '<button class="lightbox-close" onclick="closeImageLightbox()"><i class="fas fa-times"></i></button>' +
                '<button class="lightbox-prev" onclick="navImage(-1)"><i class="fas fa-chevron-left"></i></button>' +
                '<img class="lightbox-img" src="" alt="Property image">' +
                '<button class="lightbox-next" onclick="navImage(1)"><i class="fas fa-chevron-right"></i></button>';
            document.body.appendChild(lb);
        }
        window._lightboxIndex = index;
        window._lightboxImages = modalPropertyImages;
        renderLightbox();
        lb.classList.add('open');
    };

    window.renderLightbox = function () {
        var lb = document.getElementById('imageLightbox');
        if (!lb) return;
        var img = lb.querySelector('.lightbox-img');
        var idx = window._lightboxIndex;
        var images = window._lightboxImages || [];
        if (images.length && img) img.src = images[idx];
        var prev = lb.querySelector('.lightbox-prev');
        var next = lb.querySelector('.lightbox-next');
        if (prev) prev.style.display = images.length > 1 ? 'flex' : 'none';
        if (next) next.style.display = images.length > 1 ? 'flex' : 'none';
    };

    window.navImage = function (delta) {
        var images = window._lightboxImages || [];
        if (!images.length) return;
        window._lightboxIndex = (window._lightboxIndex + delta + images.length) % images.length;
        renderLightbox();
    };

    window.closeImageLightbox = function () {
        var lb = document.getElementById('imageLightbox');
        if (lb) lb.classList.remove('open');
    };

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeImageLightbox();
            closePropertyModal();
        }
    });

    // ============================================
    // PROPERTY-SPECIFIC ENQUIRY
    // ============================================
    window.enquireProperty = function (id) {
        const p = allProperties.find((x) => x.id === id);
        closePropertyModal();

        // Scroll to enquiry form
        const enquirySection = document.getElementById('enquiry');
        if (enquirySection) {
            enquirySection.scrollIntoView({ behavior: 'smooth' });
        }

        // Pre-fill the enquiry form
        setTimeout(function () {
            const interest = document.getElementById('interest');
            const message = document.getElementById('message');
            const formHeading = document.querySelector('.enquiry-form h3');

            if (interest) interest.value = 'buying';
            if (message) {
                message.value = `I'm interested in this property:\n\n${p.name}\nPlace: ${p.place}\nSize: ${p.size}${p.price ? '\nPrice: ' + p.price : ''}`;
            }
            if (formHeading) {
                formHeading.textContent = `Enquire About: ${p.name}`;
            }

            // Store property reference
            const hiddenInput = document.getElementById('propertyRef');
            if (hiddenInput) {
                hiddenInput.value = p.id;
                hiddenInput.dataset.title = p.name;
            }

            // Focus on first name
            const firstName = document.getElementById('firstName');
            if (firstName) firstName.focus();
        }, 400);
    };

    // ============================================
    // ENQUIRY FORM - Submit to API
    // ============================================
    const enquiryForm = document.getElementById('enquiryForm');
    const formSuccess = document.getElementById('formSuccess');

    if (enquiryForm) {
        // Add hidden property reference field
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.id = 'propertyRef';
        hiddenField.name = 'propertyId';
        enquiryForm.appendChild(hiddenField);

        enquiryForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const btn = enquiryForm.querySelector('button[type="submit"]');
            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            const formData = new FormData(enquiryForm);
            const data = {};
            formData.forEach(function (value, key) {
                data[key] = value;
            });

            const propertyRef = document.getElementById('propertyRef');
            if (propertyRef && propertyRef.value) {
                data.propertyId = propertyRef.value;
                const prop = allProperties.find((x) => x.id === propertyRef.value);
                if (prop) data.propertyTitle = prop.name;
            }

            fetch('/api/enquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(function (res) {
                    if (!res.ok) throw new Error('Failed to submit');
                    return res.json();
                })
                .then(function () {
                    enquiryForm.style.display = 'none';
                    formSuccess.style.display = 'block';
                    window.scrollTo({ top: enquirySectionTop(), behavior: 'smooth' });
                })
                .catch(function (err) {
                    alert('Sorry, there was an error submitting your enquiry. Please try again or call us directly.');
                })
                .finally(function () {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                });
        });
    }

    function enquirySectionTop() {
        const el = document.getElementById('enquiry');
        return el ? el.offsetTop : 0;
    }

    window.resetForm = function () {
        enquiryForm.reset();
        enquiryForm.style.display = 'block';
        formSuccess.style.display = 'none';
        const heading = document.querySelector('.enquiry-form h3');
        if (heading) heading.textContent = 'Send Us an Enquiry';
        const propertyRef = document.getElementById('propertyRef');
        if (propertyRef) propertyRef.value = '';
    };

    // === Scroll Reveal Animation ===
    const aosElements = document.querySelectorAll('[data-aos]');

    const aosObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-aos-delay') || 0;
                setTimeout(function () {
                    entry.target.classList.add('aos-animate');
                }, parseInt(delay));
                aosObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    aosElements.forEach(function (el) {
        aosObserver.observe(el);
    });

    // === Smooth Scroll for Anchor Links ===
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });

    // === Parallax Effect on Hero ===
    window.addEventListener('scroll', function () {
        const scrollY = window.scrollY;
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrollY < window.innerHeight) {
            heroContent.style.transform = 'translateY(' + (scrollY * 0.3) + 'px)';
            heroContent.style.opacity = 1 - (scrollY / window.innerHeight);
        }
    });

    // === Phone Number Formatting ===
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.substring(0, 10);
            if (value.length >= 6) {
                value = value.substring(0, 5) + ' ' + value.substring(5);
            }
            if (value.length >= 2) {
                value = value.substring(0, 2) + ' ' + value.substring(2);
            }
            e.target.value = value;
        });
    }

    // === Testimonial Slider ===
    const testimonialTrack = document.getElementById('testimonialTrack');
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');
    const dotsContainer = document.getElementById('testimonialDots');
    const testimonials = document.querySelectorAll('.testimonial-card');
    let currentTestimonial = 0;
    const totalTestimonials = testimonials.length;

    if (totalTestimonials > 0) {
        for (let i = 0; i < totalTestimonials; i++) {
            const dot = document.createElement('div');
            dot.classList.add('testimonial-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', function () {
                goToTestimonial(i);
            });
            dotsContainer.appendChild(dot);
        }

        function goToTestimonial(index) {
            currentTestimonial = index;
            testimonialTrack.style.transform = 'translateX(-' + (currentTestimonial * 100) + '%)';
            document.querySelectorAll('.testimonial-dot').forEach(function (dot, i) {
                dot.classList.toggle('active', i === currentTestimonial);
            });
        }

        prevBtn.addEventListener('click', function () {
            currentTestimonial = (currentTestimonial - 1 + totalTestimonials) % totalTestimonials;
            goToTestimonial(currentTestimonial);
        });

        nextBtn.addEventListener('click', function () {
            currentTestimonial = (currentTestimonial + 1) % totalTestimonials;
            goToTestimonial(currentTestimonial);
        });

        setInterval(function () {
            currentTestimonial = (currentTestimonial + 1) % totalTestimonials;
            goToTestimonial(currentTestimonial);
        }, 6000);
    }

    // === Utility Functions ===
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function truncate(str, n) {
        return str.length > n ? str.substring(0, n) + '…' : str;
    }

    // === Initialize ===
    handleScroll();

});
