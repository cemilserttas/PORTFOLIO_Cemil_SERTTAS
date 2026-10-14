// ===== PHOTO ZOOM-OUT ON LOAD =====
window.addEventListener('load', () => {
  // Preloader
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => preloader.remove(), 600);
  }
  
  setTimeout(() => {
    document.getElementById('photoColumn')?.classList.add('loaded');
  }, 300);
});

// ===== SCROLL REVEAL =====
const rootMargin = window.innerWidth <= 960 ? '0px 0px -80px 0px' : '0px 0px -40px 0px';
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: rootMargin });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Initialize Signature SVG path lengths
  document.querySelectorAll('.signature-svg path').forEach(path => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
  });

  // Separate observer for the signature so it repeats every time you scroll to it
  const signatureObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible');
      }
    });
  }, { threshold: 0.1 });

  const signatureEl = document.querySelector('.footer-signature');
  if (signatureEl) signatureObserver.observe(signatureEl);
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const href = this.getAttribute('href');
    if (href === '#') return; // Skip empty anchors
    const target = document.querySelector(href);
    if (target) {
      const absoluteTop = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: absoluteTop - 60, behavior: 'smooth' });
    }
  });
});

// ===== ACTIVE NAV =====
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveNav() {
  const scrollPos = window.scrollY + window.innerHeight * 0.4; // 40% threshold
  const sections = document.querySelectorAll('#about, .section-block[id]');

  let activeId = 'about';
  sections.forEach(section => {
    const absoluteTop = section.getBoundingClientRect().top + window.scrollY;
    if (absoluteTop <= scrollPos) {
      activeId = section.id;
    }
  });

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
  });
}

window.addEventListener('scroll', updateActiveNav);
updateActiveNav(); // Call on load

// ===== SCROLL PROGRESS & INDICATOR =====
const progressBar = document.getElementById('progressBar');
const scrollIndicator = document.getElementById('scrollIndicator');
const scrollText = document.getElementById('scrollText');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const docH = document.documentElement.scrollHeight;
  const winH = window.innerHeight;
  const scrolled = (scrollY / (docH - winH)) * 100;
  
  if (progressBar) progressBar.style.width = scrolled + '%';

  if (scrollIndicator && scrollText) {
    if (scrollY > winH * 1.2) {
      scrollIndicator.classList.add('up');
      scrollIndicator.setAttribute('href', '#hero');
      
      const currentLang = localStorage.getItem('preferredLang') || 'fr';
      const upTexts = {
        fr: "Retour en haut",
        en: "Back to top",
        nl: "Terug naar boven"
      };
      
      scrollText.textContent = upTexts[currentLang];
      scrollText.setAttribute('data-fr', "Retour en haut");
      scrollText.setAttribute('data-en', "Back to top");
      scrollText.setAttribute('data-nl', "Terug naar boven");
    } else {
      scrollIndicator.classList.remove('up');
      // Set href to next section (#about)
      scrollIndicator.setAttribute('href', '#about');
      
      const currentLang = localStorage.getItem('preferredLang') || 'fr';
      const downTexts = {
        fr: "Défiler vers le bas",
        en: "Scroll down",
        nl: "Naar beneden scrollen"
      };
      
      scrollText.textContent = downTexts[currentLang];
      scrollText.setAttribute('data-fr', "Défiler vers le bas");
      scrollText.setAttribute('data-en', "Scroll down");
      scrollText.setAttribute('data-nl', "Naar beneden scrollen");
    }
  }
});

// ===== HERO PHOTO TRANSITION ON SCROLL (PHYSICS-BASED LERP) =====
// Phase 1 (top of page): Photo is FULLSCREEN (100% width) in background behind hero text.
// Phase 2 (on scroll): Photo smoothly shrinks & glides into right side (45% width) with physics inertia.
function initHeroPhotoScroll() {
  const photoColumn = document.getElementById('photoColumn');
  const photoOverlay = document.getElementById('photoOverlay');
  const heroImg = document.getElementById('heroImg');
  if (!photoColumn) return;

  let targetProgress = 0;
  let currentProgress = 0;
  let isRunning = false;

  function updateTarget() {
    const isDesktop = window.innerWidth > 767;
    if (!isDesktop) {
      targetProgress = 0;
    } else {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight * 0.75;
      targetProgress = Math.min(1, Math.max(0, scrollY / heroHeight));
    }

    if (!isRunning) {
      isRunning = true;
      requestAnimationFrame(renderLoop);
    }
  }

  function renderLoop() {
    const isDesktop = window.innerWidth > 767;

    if (!isDesktop) {
      photoColumn.style.width = '100%';
      photoColumn.style.borderTopLeftRadius = '0px';
      photoColumn.style.borderBottomLeftRadius = '0px';
      if (photoOverlay) photoOverlay.style.opacity = '0.65';
      isRunning = false;
      return;
    }

    // Smooth inertia lerp (0.075 factor gives a luxurious spring physics feel)
    const diff = targetProgress - currentProgress;
    currentProgress += diff * 0.075;

    // Apply cubic ease-in-out to interpolated progress for ultra fluid motion
    const p = currentProgress;
    const easedP = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

    // Photo width: 100% down to 45%
    const currentWidth = 100 - (easedP * 55);
    photoColumn.style.width = `${currentWidth}%`;

    // Rounded left corners on shrink
    const borderRadius = easedP * 24;
    photoColumn.style.borderTopLeftRadius = `${borderRadius}px`;
    photoColumn.style.borderBottomLeftRadius = `${borderRadius}px`;

    // Overlay opacity: 0.65 at top -> 0 when docked right
    if (photoOverlay) {
      const overlayOpacity = Math.max(0, 0.65 * (1 - easedP * 1.25));
      photoOverlay.style.opacity = overlayOpacity.toFixed(2);
    }

    // Subtle scale effect on heroImg
    if (heroImg) {
      const scale = 1 + (easedP * 0.05);
      heroImg.style.transform = `scale(${scale})`;
    }

    // Continue running frame loop until smooth interpolation completes
    if (Math.abs(diff) > 0.0003) {
      requestAnimationFrame(renderLoop);
    } else {
      currentProgress = targetProgress;
      isRunning = false;
    }
  }

  window.addEventListener('scroll', updateTarget, { passive: true });
  window.addEventListener('resize', updateTarget, { passive: true });

  // Initial calculation
  updateTarget();
}

document.addEventListener('DOMContentLoaded', initHeroPhotoScroll);

// ===== LANGUAGE BARS =====
const langBars = document.querySelectorAll('.lang-bar-fill');
const langObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.width = entry.target.dataset.width;
      langObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
langBars.forEach(bar => langObserver.observe(bar));



// ===== NAV BG ON SCROLL =====
const navPills = document.querySelector('.nav-pills');
window.addEventListener('scroll', () => {
  if (!navPills) return;
  if (window.scrollY > window.innerHeight * 0.5) {
    navPills.style.background = 'rgba(10,10,10,0.95)';
    navPills.style.borderColor = 'rgba(255,255,255,0.12)';
  } else {
    navPills.style.background = 'rgba(17,17,17,0.85)';
    navPills.style.borderColor = 'rgba(255,255,255,0.08)';
  }
});

// ===== TILT ON PROJECT CARDS =====
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = (y - rect.height / 2) / 30;
    const ry = (rect.width / 2 - x) / 30;
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ===== TRANSLATION SWITCHER =====
function switchLanguage(lang) {
  // Update active state on buttons
  document.querySelectorAll('.lang-switch-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Translate elements
  document.querySelectorAll('[data-' + lang + ']').forEach(el => {
    // If it has HTML content inside (like italic tags), we use innerHTML, else textContent
    if (el.dataset.html === 'true') {
      el.innerHTML = el.getAttribute('data-' + lang);
    } else {
      // For elements with a mix of text and spans, we might want to just set innerHTML anyway
      el.innerHTML = el.getAttribute('data-' + lang);
    }
  });

  // Save preference
  localStorage.setItem('preferredLang', lang);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('preferredLang') || 'fr';
  switchLanguage(savedLang);

  document.querySelectorAll('.lang-switch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchLanguage(btn.dataset.lang);
    });
  });

  // ===== HAMBURGER MENU =====
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navPills = document.querySelector('.nav-pills');
  const menuBackdrop = document.getElementById('menuBackdrop');
  
  function toggleMenu(forceClose) {
    if (!hamburgerBtn || !navPills) return;
    if (forceClose) {
      hamburgerBtn.classList.remove('open');
      navPills.classList.remove('open');
      if (menuBackdrop) menuBackdrop.classList.remove('visible');
    } else {
      hamburgerBtn.classList.toggle('open');
      navPills.classList.toggle('open');
      if (menuBackdrop) menuBackdrop.classList.toggle('visible');
    }
  }
  
  if (hamburgerBtn && navPills) {
    hamburgerBtn.addEventListener('click', () => toggleMenu());
    
    // Close menu when backdrop is clicked
    if (menuBackdrop) {
      menuBackdrop.addEventListener('click', () => toggleMenu(true));
    }
    
    // Close menu when a link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => toggleMenu(true));
    });
  }

  // ===== DYNAMIC COPYRIGHT YEAR =====
  const copyrightYear = document.getElementById('copyrightYear');
  if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
  }
});
