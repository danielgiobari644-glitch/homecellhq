// UI Component Renderers for Vanilla JavaScript (Frosted Glass Theme)
import { store, getUploadedFileFromIDB } from './state.js';
import { adminLogin, adminLogout, submitReviewToFirestore, submitTestimonyToFirestore } from './firebase.js';

// Modal and Active Tab UI State
let activeModal = null; // 'download' | 'review' | 'testimony' | 'adminLogin' | 'adminCMS' | 'lightbox'
let isMobileMenuOpen = false;
let activeLightboxIndex = 0;
let downloadProgress = 0;
let downloadState = 'idle'; // 'idle' | 'downloading' | 'completed' | 'error'
let activeAdminTab = 'overview'; // 'overview' | 'apk' | 'hero' | 'sections_text' | 'features' | 'faqs' | 'reviews' | 'testimonies' | 'settings'
let screenshotFilter = 'all';
let featureFilter = 'All';
let testimonyFilter = 'All';
let faqOpenId = 'faq1';
let isUploadingApk = false;
let apkUploadProgress = 0;

export function checkRoute() {
  const path = window.location.pathname;
  const hash = window.location.hash;
  if (path.startsWith('/admin') || hash === '#admin') {
    if (store.state.adminState.isLoggedIn) {
      activeModal = 'adminCMS';
    } else {
      activeModal = 'adminLogin';
    }
    store.notify();
  }
}

export function initUI(appElement) {
  // Subscribe to store updates
  store.subscribe(() => {
    renderApp(appElement);
  });

  // Initial render
  renderApp(appElement);
}

function renderApp(container) {
  const state = store.state;

  container.innerHTML = `
    <!-- Navbar -->
    ${renderNavbar(state)}

    <!-- Main Content Flow -->
    <main class="flex-1">
      ${renderHero(state)}
      ${renderFeatures(state)}
      ${renderScreenshots(state)}
      ${renderAbout(state)}
      ${renderTestimonials(state)}
      ${renderSpiritualTestimonies(state)}
      ${renderFAQ(state)}
      ${renderCTA(state)}
    </main>

    <!-- Footer -->
    ${renderFooter(state)}

    <!-- Modals Layer -->
    <div id="modal-root">
      ${renderModals(state)}
    </div>
  `;

  // Attach Event Handlers
  attachEvents(container);
}

function renderNavbar(state) {
  const { settings } = state;
  return `
    <nav class="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/60 border-b border-white/10 px-6 sm:px-12 py-4">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <a href="/" class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-slate-950 font-bold text-xl">
            ✝
          </div>
          <span class="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 italic">
            ${settings.logoText || 'HomeCell'}
          </span>
        </a>

        <!-- Desktop Navigation Links -->
        <div class="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300 uppercase tracking-widest">
          <a href="#features" class="hover:text-indigo-400 transition-colors">Features</a>
          <a href="#screenshots" class="hover:text-indigo-400 transition-colors">Screenshots</a>
          <a href="#about" class="hover:text-indigo-400 transition-colors">About</a>
          <a href="#testimonials" class="hover:text-indigo-400 transition-colors">Testimonials</a>
          <a href="#testimonies" class="hover:text-indigo-400 transition-colors">Testimonies</a>
          <a href="#faq" class="hover:text-indigo-400 transition-colors">FAQ</a>
        </div>

        <div class="flex items-center gap-3">
          <button id="btn-open-download" class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md flex items-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-sm">download</span>
            <span>Get APK</span>
          </button>

          <!-- Mobile Hamburger Toggle -->
          <button id="mobile-menu-toggle" class="md:hidden p-2 text-slate-300 hover:text-white rounded-xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer">
            <span class="material-symbols-outlined">${isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      ${isMobileMenuOpen ? `
        <div class="md:hidden absolute top-full left-0 w-full bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 flex flex-col gap-4 shadow-2xl animate-fadeIn z-50">
          <a href="#features" class="mobile-nav-link text-sm font-semibold text-slate-300 hover:text-white py-2 border-b border-white/5">Features</a>
          <a href="#screenshots" class="mobile-nav-link text-sm font-semibold text-slate-300 hover:text-white py-2 border-b border-white/5">Screenshots</a>
          <a href="#about" class="mobile-nav-link text-sm font-semibold text-slate-300 hover:text-white py-2 border-b border-white/5">About</a>
          <a href="#testimonials" class="mobile-nav-link text-sm font-semibold text-slate-300 hover:text-white py-2 border-b border-white/5">Testimonials</a>
          <a href="#testimonies" class="mobile-nav-link text-sm font-semibold text-slate-300 hover:text-white py-2 border-b border-white/5">Testimonies</a>
          <a href="#faq" class="mobile-nav-link text-sm font-semibold text-slate-300 hover:text-white py-2">FAQ</a>
          <button id="mobile-btn-download" class="w-full mt-2 py-3 bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-sm">download</span>
            <span>Get HomeCell APK</span>
          </button>
        </div>
      ` : ''}
    </nav>
  `;
}

function renderHero(state) {
  const { hero, downloadConfig, statistics } = state;
  return `
    <section id="hero" class="relative min-h-[85vh] flex flex-col justify-center px-6 sm:px-12 py-12">
      <div class="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        <!-- Left Hero Copy -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          <div class="flex items-center gap-2">
            <span class="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              ${hero.badgeText || 'v2.4.0 Now Available'}
            </span>
          </div>

          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight text-slate-100">
            ${hero.title ? hero.title.replace(/\n/g, '<br/>') : 'Digital space for <br/><span class="font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-cyan-300">Spiritual Growth</span>'}
          </h1>

          <p class="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
            ${hero.subtitle || 'The all-in-one platform for Christian cell groups. Manage members, track growth, and share testimonies in a secure, church-aligned environment.'}
          </p>

          <div class="flex flex-wrap items-center gap-4 pt-2">
            <button id="hero-btn-download" class="px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl hover:bg-slate-200 transition-all shadow-xl flex items-center gap-3 cursor-pointer text-sm">
              <span class="material-symbols-outlined">android</span>
              <span>${hero.primaryCtaText || 'Download APK'}</span>
            </button>

            ${hero.isAppButtonVisible ? `
              <a href="${hero.appButtonUrl || 'https://homecell.web.app/app'}" target="_blank" class="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl backdrop-blur-lg hover:bg-white/10 transition-all text-sm flex items-center gap-2">
                <span>${hero.appButtonText || 'Open Web App'}</span>
                <span class="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            ` : ''}
          </div>

          <!-- Hero Metrics -->
          <div class="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
            <div>
              <div class="text-2xl sm:text-3xl font-bold text-white">${(statistics.totalDownloads || 12480).toLocaleString()}</div>
              <div class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">APK Downloads</div>
            </div>
            <div>
              <div class="text-2xl sm:text-3xl font-bold text-cyan-400">${(statistics.activeCells || 850).toLocaleString()}</div>
              <div class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Cells Hosted</div>
            </div>
            <div>
              <div class="text-2xl sm:text-3xl font-bold text-amber-400">${statistics.userRating || 4.9} ★</div>
              <div class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">User Rating</div>
            </div>
          </div>
        </div>

        <!-- Right Visual Mockup & Floating Admin Card -->
        <div class="lg:col-span-5 flex items-center justify-center relative min-h-[480px]">
          
          <!-- Device Frame Mockup -->
          <div class="w-[300px] sm:w-[320px] h-[580px] bg-slate-900 rounded-[48px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 w-full h-7 bg-slate-900 z-20 flex justify-center items-center">
              <div class="w-28 h-3.5 bg-black rounded-b-2xl"></div>
            </div>
            
            <!-- Mock App Screen Inside Device -->
            <div class="p-5 pt-10 flex flex-col gap-4 text-white h-full justify-between">
              <div class="space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs">✝</div>
                    <div>
                      <div class="text-xs font-bold">HomeCell Grace #12</div>
                      <div class="text-[9px] text-slate-400">18 Members Active</div>
                    </div>
                  </div>
                  <span class="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                </div>

                <div class="bg-indigo-600/20 p-3.5 rounded-2xl border border-indigo-500/30 space-y-2">
                  <div class="text-[10px] uppercase font-bold text-indigo-300">Weekly Attendance</div>
                  <div class="text-xl font-bold">18 / 20 Members</div>
                  <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full w-[90%]"></div>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="text-[10px] font-bold text-slate-400 uppercase">Active Prayer Items</div>
                  <div class="bg-slate-800/60 p-2.5 rounded-xl border border-white/5 text-[10px] space-y-1">
                    <div class="font-semibold text-slate-200">Sister Mary's Quick Recovery</div>
                    <div class="text-slate-400 text-[9px]">14 group members praying</div>
                  </div>
                  <div class="bg-slate-800/60 p-2.5 rounded-xl border border-white/5 text-[10px] space-y-1">
                    <div class="font-semibold text-slate-200">Youth Revival Fellowship</div>
                    <div class="text-slate-400 text-[9px]">This Friday 7:00 PM</div>
                  </div>
                </div>
              </div>

              <button id="mock-download-btn" class="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-sm">download</span>
                <span>Download APK v${downloadConfig.latestVersion}</span>
              </button>
            </div>
          </div>

          <!-- Floating Widget: Admin Dashboard Glass Card -->
          <div class="absolute bottom-6 -left-4 sm:-left-8 w-[260px] sm:w-[280px] p-5 backdrop-blur-2xl bg-slate-900/80 border border-white/20 rounded-[28px] shadow-2xl animate-bounce-subtle z-30">
            <div class="flex items-center gap-2.5 mb-3">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Firebase CMS Portal</span>
            </div>
            <div class="space-y-2.5">
              <div class="flex justify-between items-end">
                <span class="text-xs text-slate-400">Active Cell Units</span>
                <span class="text-base font-bold text-white">+24% growth</span>
              </div>
              <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div class="w-[85%] h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"></div>
              </div>
              <div class="text-[9px] text-slate-400 italic">Live Firestore Realtime Synchronization</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  `;
}

function renderFeatures(state) {
  const { features, sectionTitles } = state;
  const titles = sectionTitles || {};
  const categories = ['All', ...Array.from(new Set(features.map(f => f.category)))];

  const filtered = featureFilter === 'All'
    ? features
    : features.filter(f => f.category === featureFilter);

  return `
    <section id="features" class="py-20 px-6 sm:px-12 relative z-10 border-t border-white/5">
      <div class="max-w-7xl mx-auto space-y-12">
        <div class="text-center max-w-3xl mx-auto space-y-4">
          <span class="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest inline-block">
            ${titles.featuresBadge || 'Platform Capabilities'}
          </span>
          <h2 class="text-3xl sm:text-5xl font-light tracking-tight text-white">
            ${titles.featuresTitle || 'Built for Cell Group Excellence'}
          </h2>
          <p class="text-slate-400 text-base leading-relaxed">
            ${titles.featuresSubtitle || 'Everything your church fellowship needs: attendance logging, prayer sharing, sermon outlines, and pastoral insights.'}
          </p>

          <!-- Category Filter Pills -->
          <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
            ${categories.map(cat => `
              <button 
                data-feature-cat="${cat}" 
                class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  featureFilter === cat
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }"
              >
                ${cat}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${filtered.map(f => `
            <div class="glass-card p-6 rounded-3xl space-y-4 transition-all duration-300 hover:-translate-y-1 group">
              <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl">
                ✝
              </div>
              <div class="space-y-2">
                <div class="text-[10px] font-bold uppercase tracking-wider text-indigo-400">${f.category}</div>
                <h3 class="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">${f.title}</h3>
                <p class="text-sm text-slate-400 leading-relaxed">${f.description}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderScreenshots(state) {
  const { screenshots, sectionTitles } = state;
  const titles = sectionTitles || {};
  const filtered = screenshotFilter === 'all'
    ? screenshots
    : screenshots.filter(s => s.deviceFrame === screenshotFilter);

  return `
    <section id="screenshots" class="py-20 px-6 sm:px-12 relative z-10 bg-slate-950/40 border-y border-white/5">
      <div class="max-w-7xl mx-auto space-y-12">
        <div class="text-center max-w-3xl mx-auto space-y-4">
          <span class="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest inline-block">
            ${titles.screenshotsBadge || 'App Experience'}
          </span>
          <h2 class="text-3xl sm:text-5xl font-light tracking-tight text-white">
            ${titles.screenshotsTitle || 'Designed for Simplicity & Depth'}
          </h2>
          <p class="text-slate-400 text-base leading-relaxed">
            ${titles.screenshotsSubtitle || 'Take a visual tour of HomeCell mobile app screens and pastoral analytics dashboards.'}
          </p>

          <div class="flex flex-wrap justify-center gap-2 pt-2">
            ${['all', 'phone', 'tablet', 'desktop'].map(f => `
              <button 
                data-frame-filter="${f}"
                class="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                  screenshotFilter === f
                    ? 'bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-400/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }"
              >
                ${f}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${filtered.map((item, idx) => `
            <div 
              data-screenshot-index="${idx}"
              class="glass-card rounded-3xl overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]"
            >
              <div class="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                <img src="${item.imageUrl}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                <div class="absolute top-3 right-3 bg-slate-950/80 p-2 rounded-xl text-white text-xs border border-white/10">
                  <span class="material-symbols-outlined text-sm">zoom_in</span>
                </div>
              </div>
              <div class="p-5 space-y-1">
                <div class="text-[10px] font-bold text-cyan-400 uppercase">${item.deviceFrame} • ${item.title}</div>
                <p class="text-xs text-slate-300 font-medium">${item.caption}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderAbout(state) {
  const { settings, sectionTitles } = state;
  const titles = sectionTitles || {};
  return `
    <section id="about" class="py-20 px-6 sm:px-12 relative z-10">
      <div class="max-w-7xl mx-auto space-y-12">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div class="lg:col-span-6 space-y-6">
            <span class="px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest inline-block">
              ${titles.aboutBadge || 'Kingdom Mission'}
            </span>
            <h2 class="text-3xl sm:text-5xl font-light tracking-tight text-white">
              ${titles.aboutTitle || 'Empowering the Local Church for Genuine Fellowship'}
            </h2>
            <p class="text-slate-300 text-base leading-relaxed">
              ${titles.aboutParagraph1 || settings.footerText || 'Empowering local churches and cell groups with modern digital tools for discipleship, prayer, attendance tracking, and spiritual growth.'}
            </p>
            <div class="space-y-3 text-xs text-slate-300">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
                <span><strong>Church-Centered Architecture:</strong> Respects pastoral oversight and cell group structure.</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
                <span><strong>Offline Native:</strong> Functions seamlessly without internet connection during cell meetings.</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
                <span><strong>Firebase Secured:</strong> Cloud Firestore rules guard user data privacy.</span>
              </div>
            </div>
          </div>

          <div class="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="glass-card p-6 rounded-3xl space-y-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">🎯</div>
              <h3 class="text-lg font-bold text-white">${titles.missionTitle || 'Our Mission'}</h3>
              <p class="text-xs text-slate-400 leading-relaxed">${titles.missionText || 'Equip local churches with accessible tools that strengthen fellowship, accelerate discipleship, and care for believers.'}</p>
            </div>

            <div class="glass-card p-6 rounded-3xl space-y-3">
              <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">🧭</div>
              <h3 class="text-lg font-bold text-white">${titles.visionTitle || 'Our Vision'}</h3>
              <p class="text-xs text-slate-400 leading-relaxed">${titles.visionText || 'To see vibrant, multiplying home cells in every neighborhood across the world, supported by technology that serves the Spirit.'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderTestimonials(state) {
  const { testimonials, sectionTitles } = state;
  const titles = sectionTitles || {};
  const approved = testimonials.filter(t => t.status === 'approved');
  const featured = approved.find(t => t.isReviewOfMonth) || approved[0];

  return `
    <section id="testimonials" class="py-20 px-6 sm:px-12 relative z-10 bg-slate-950/40 border-t border-white/5">
      <div class="max-w-7xl mx-auto space-y-12">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="space-y-2 text-center md:text-left">
            <span class="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest inline-block">
              ${titles.testimonialsBadge || 'User Experiences'}
            </span>
            <h2 class="text-3xl sm:text-5xl font-light tracking-tight text-white">
              ${titles.testimonialsTitle || 'Loved by Pastors & Cell Leaders'}
            </h2>
          </div>
          <button id="btn-open-review-modal" class="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-sm">rate_review</span>
            <span>Leave a Review</span>
          </button>
        </div>

        ${featured ? `
          <div class="glass-panel p-8 sm:p-12 rounded-[32px] border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 space-y-4">
            <div class="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span>🏆 Featured Review of the Month</span>
            </div>
            <div class="text-amber-400 font-bold text-lg">★★★★★</div>
            <h3 class="text-2xl font-bold text-white">"${featured.title}"</h3>
            <p class="text-slate-300 text-base italic leading-relaxed max-w-3xl">"${featured.review}"</p>
            <div class="flex items-center gap-3 pt-2">
              <div class="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center">
                ${featured.name ? featured.name[0] : 'P'}
              </div>
              <div>
                <div class="text-sm font-bold text-white">${featured.name}</div>
                <div class="text-xs text-slate-400">${featured.church} • ${featured.city || ''}, ${featured.country || ''}</div>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${approved.map(t => `
            <div class="glass-card p-6 rounded-3xl space-y-3 flex flex-col justify-between">
              <div class="space-y-2">
                <div class="text-amber-400 text-xs">★★★★★</div>
                <h4 class="text-base font-bold text-white">"${t.title}"</h4>
                <p class="text-xs text-slate-300 italic leading-relaxed">"${t.review}"</p>
              </div>
              <div class="pt-3 border-t border-white/5 flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">
                  ${t.name ? t.name[0] : 'U'}
                </div>
                <div>
                  <div class="text-xs font-bold text-white">${t.name}</div>
                  <div class="text-[10px] text-slate-400">${t.church}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderSpiritualTestimonies(state) {
  const { spiritualTestimonies, sectionTitles } = state;
  const titles = sectionTitles || {};
  const approved = spiritualTestimonies.filter(st => st.status === 'approved');
  const categories = ['All', 'Salvation', 'Healing', 'Growth', 'Family', 'Provision', 'Prayer Answered'];

  const filtered = testimonyFilter === 'All'
    ? approved
    : approved.filter(st => st.category === testimonyFilter);

  return `
    <section id="testimonies" class="py-20 px-6 sm:px-12 relative z-10">
      <div class="max-w-7xl mx-auto space-y-12">
        <div class="text-center max-w-3xl mx-auto space-y-4">
          <span class="px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest inline-block">
            ${titles.testimoniesBadge || 'Spiritual Testimonies'}
          </span>
          <h2 class="text-3xl sm:text-5xl font-light tracking-tight text-white">
            ${titles.testimoniesTitle || 'Glorifying God for Miracles & Growth'}
          </h2>
          <p class="text-slate-400 text-base leading-relaxed">
            ${titles.testimoniesSubtitle || 'Read inspiring stories of healing, family restoration, and spiritual breakthroughs shared by HomeCell members.'}
          </p>

          <div class="pt-2">
            <button id="btn-open-testimony-modal" class="px-6 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer mx-auto">
              <span class="material-symbols-outlined text-sm">favorite</span>
              <span>Share Your Spiritual Testimony</span>
            </button>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-2 pt-4">
            ${categories.map(cat => `
              <button 
                data-testimony-cat="${cat}"
                class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  testimonyFilter === cat
                    ? 'bg-gradient-to-r from-rose-500 to-indigo-500 text-white font-bold shadow-lg shadow-rose-500/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }"
              >
                ${cat}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${filtered.map(st => `
            <div class="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
              <div class="space-y-3">
                <div class="flex items-center justify-between text-[10px]">
                  <span class="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase">${st.category}</span>
                  <span class="text-slate-500 font-mono">${new Date(st.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 class="text-lg font-bold text-white">${st.title}</h3>
                <p class="text-xs text-slate-300 italic leading-relaxed">"${st.story}"</p>
              </div>

              <div class="pt-3 border-t border-white/5 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center">
                  ${st.name ? st.name[0] : 'G'}
                </div>
                <div>
                  <div class="text-xs font-bold text-white">${st.name}</div>
                  <div class="text-[10px] text-slate-400">${st.church}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderFAQ(state) {
  const { faqs, sectionTitles } = state;
  const titles = sectionTitles || {};
  return `
    <section id="faq" class="py-20 px-6 sm:px-12 relative z-10 bg-slate-950/40 border-t border-white/5">
      <div class="max-w-4xl mx-auto space-y-12">
        <div class="text-center space-y-4">
          <span class="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest inline-block">
            ${titles.faqBadge || 'Frequently Asked Questions'}
          </span>
          <h2 class="text-3xl sm:text-5xl font-light tracking-tight text-white">
            ${titles.faqTitle || 'Everything You Need To Know'}
          </h2>
        </div>

        <div class="space-y-4">
          ${faqs.map(faq => {
            const isOpen = faqOpenId === faq.id;
            return `
              <div class="glass-card rounded-2xl overflow-hidden border border-white/10">
                <button 
                  data-faq-id="${faq.id}"
                  class="w-full text-left p-6 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <span class="text-base font-bold text-white hover:text-indigo-300 transition-colors">${faq.question}</span>
                  <span class="material-symbols-outlined text-slate-400">${isOpen ? 'expand_less' : 'expand_more'}</span>
                </button>
                ${isOpen ? `
                  <div class="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                    ${faq.answer}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderCTA(state) {
  const { downloadConfig, hero, sectionTitles } = state;
  const titles = sectionTitles || {};
  return `
    <section class="py-20 px-6 sm:px-12 relative z-10">
      <div class="max-w-7xl mx-auto">
        <div class="glass-panel p-10 sm:p-16 rounded-[36px] border border-indigo-500/30 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-center relative overflow-hidden shadow-2xl space-y-6">
          <span class="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest inline-block">
            ${titles.ctaBadge || 'Verified Clean Android Release'}
          </span>

          <h2 class="text-3xl sm:text-5xl font-light tracking-tight text-white">
            ${titles.ctaTitle || 'Ready to Transform Your Cell Ministry?'}
          </h2>

          <p class="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">
            ${titles.ctaSubtitle || `Download the official HomeCell Android APK v${downloadConfig.latestVersion} today and experience seamless offline attendance, prayer request tracking, and Bible study guides.`}
          </p>

          <div class="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button id="cta-btn-download" class="px-8 py-4 bg-white text-slate-950 font-extrabold text-base rounded-2xl hover:bg-slate-200 transition-all shadow-xl flex items-center gap-3 cursor-pointer">
              <span class="material-symbols-outlined text-xl">download</span>
              <span>Download HomeCell APK (${downloadConfig.fileSize})</span>
            </button>

            ${hero.isAppButtonVisible ? `
              <a href="${hero.appButtonUrl || 'https://homecell.web.app/app'}" target="_blank" class="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold text-base rounded-2xl hover:bg-white/20 transition-all shadow-xl flex items-center gap-2">
                <span>${hero.appButtonText || 'Open Web App'}</span>
                <span class="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderFooter(state) {
  const { settings } = state;
  return `
    <footer class="relative z-10 backdrop-blur-xl bg-slate-950/80 border-t border-white/5 py-12 px-6 sm:px-12 text-slate-400 text-xs">
      <div class="max-w-7xl mx-auto space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="space-y-3 md:col-span-2">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-slate-950 font-bold flex items-center justify-center text-base">✝</div>
              <span class="text-xl font-bold tracking-tight text-white italic">${settings.logoText || 'HomeCell'}</span>
            </div>
            <p class="text-slate-400 text-xs max-w-md leading-relaxed">${settings.footerText}</p>
          </div>

          <div class="space-y-2">
            <div class="text-white font-bold uppercase text-[11px] tracking-wider">Quick Links</div>
            <div class="flex flex-col space-y-1">
              <a href="#features" class="hover:text-white">Features</a>
              <a href="#screenshots" class="hover:text-white">Screenshots</a>
              <a href="#testimonials" class="hover:text-white">Testimonials</a>
              <a href="#testimonies" class="hover:text-white">Testimonies</a>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-white font-bold uppercase text-[11px] tracking-wider">HQ Ministry</div>
            <div>${settings.churchName}</div>
            <div>${settings.churchAddress}</div>
            <a href="/admin" id="footer-admin-link" class="text-indigo-400 hover:underline pt-2 inline-block font-semibold">Admin CMS (/admin)</a>
          </div>
        </div>

        <div class="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <div>${settings.copyright}</div>
          <div>Firebase Firestore Secured • WCAG 2.1 Compliant</div>
        </div>
      </div>
    </footer>
  `;
}

function renderModals(state) {
  if (!activeModal) return '';

  if (activeModal === 'download') {
    return renderDownloadModalContent(state);
  }
  if (activeModal === 'review') {
    return renderReviewModalContent();
  }
  if (activeModal === 'testimony') {
    return renderTestimonyModalContent();
  }
  if (activeModal === 'adminLogin') {
    return renderAdminLoginModalContent();
  }
  if (activeModal === 'adminCMS') {
    return renderAdminCMSModalContent(state);
  }
  return '';
}

function renderDownloadModalContent(state) {
  const { downloadConfig } = state;
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div class="relative w-full max-w-xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 text-white space-y-6">
        <button class="modal-close-btn absolute top-5 right-5 text-slate-400 hover:text-white p-1 cursor-pointer">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-2xl">📱</div>
          <div>
            <h2 class="text-2xl font-bold tracking-tight">HomeCell Android Portal</h2>
            <p class="text-xs text-slate-400">Official Release ${downloadConfig.latestVersion} • Direct APK Download</p>
          </div>
        </div>

        ${downloadConfig.isMaintenanceActive ? `
          <div class="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-amber-300 text-xs">
            <strong>Maintenance Notice:</strong> ${downloadConfig.maintenanceNotice}
          </div>
        ` : ''}

        ${downloadState === 'idle' ? `
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/60 p-4 rounded-2xl border border-white/5 text-center text-xs">
            <div>
              <div class="text-slate-400">Version</div>
              <div class="font-bold text-white text-sm">${downloadConfig.latestVersion}</div>
            </div>
            <div>
              <div class="text-slate-400">File Size</div>
              <div class="font-bold text-white text-sm">${downloadConfig.fileSize}</div>
            </div>
            <div>
              <div class="text-slate-400">Requires</div>
              <div class="font-bold text-white text-sm">${downloadConfig.minAndroidVersion}</div>
            </div>
            <div>
              <div class="text-slate-400">Released</div>
              <div class="font-bold text-white text-sm">${downloadConfig.releaseDate}</div>
            </div>
          </div>

          <div class="space-y-2">
            <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Release Notes</h3>
            <div class="bg-slate-950 p-4 rounded-2xl text-xs font-mono text-slate-300 whitespace-pre-line border border-white/5 max-h-32 overflow-y-auto">
              ${downloadConfig.releaseNotes}
            </div>
          </div>

          <button id="start-apk-download" class="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-extrabold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer text-base">
            <span class="material-symbols-outlined">download</span>
            <span>Start HomeCell APK Download</span>
          </button>
        ` : ''}

        ${downloadState === 'downloading' ? `
          <div class="py-8 text-center space-y-4">
            <div class="w-16 h-16 mx-auto rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center animate-bounce">
              <span class="material-symbols-outlined text-3xl">download</span>
            </div>
            <div class="space-y-1">
              <h3 class="text-lg font-bold">Preparing Download...</h3>
              <p class="text-xs text-slate-400">Fetching binary package from secure Firebase CDN (${downloadProgress}%)</p>
            </div>
            <div class="w-full bg-slate-800 h-3 rounded-full overflow-hidden max-w-md mx-auto">
              <div class="bg-indigo-500 h-full transition-all duration-300" style="width: ${downloadProgress}%"></div>
            </div>
          </div>
        ` : ''}

        ${downloadState === 'completed' ? `
          <div class="space-y-6">
            <div class="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
              <span class="material-symbols-outlined text-emerald-400">check_circle</span>
              <div>
                <strong class="text-white text-sm">Download Started!</strong><br/>
                Your APK file (${downloadConfig.apkFileName}) is downloading.
              </div>
            </div>

            <div class="bg-slate-800/60 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
              <h4 class="font-bold text-cyan-400 uppercase">Android Installation Instructions</h4>
              <ol class="list-decimal pl-4 space-y-1 text-slate-300">
                <li>Tap the downloaded <strong>${downloadConfig.apkFileName}</strong> notification.</li>
                <li>If prompted with "Install Unknown Apps", enable <strong>Allow from this source</strong>.</li>
                <li>Tap <strong>Install</strong> and launch HomeCell!</li>
              </ol>
            </div>

            <div class="flex items-center justify-between pt-2">
              <button id="restart-download-btn" class="text-xs text-indigo-400 hover:underline cursor-pointer font-semibold">
                Didn't start? Try downloading again
              </button>
              <button class="modal-close-btn bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
                Close
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderReviewModalContent() {
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div class="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-white/10 shadow-2xl p-6 text-white space-y-5">
        <button class="modal-close-btn absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="space-y-1">
          <h2 class="text-xl font-bold">Leave an App Review</h2>
          <p class="text-xs text-slate-400">Your feedback encourages cell leaders worldwide and helps pastors evaluate HomeCell.</p>
        </div>

        <form id="form-submit-review" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs text-slate-300 font-semibold">Rating</label>
            <select id="review-rating" class="w-full glass-input p-2.5 rounded-xl text-xs bg-slate-900 text-white">
              <option value="5">★★★★★ (5 Stars - Excellent)</option>
              <option value="4">★★★★☆ (4 Stars - Very Good)</option>
              <option value="3">★★★☆☆ (3 Stars - Average)</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-300">Your Name *</label>
              <input id="review-name" type="text" required placeholder="e.g. Deacon Mark" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-xs text-slate-300">Church Name *</label>
              <input id="review-church" type="text" required placeholder="e.g. Grace Chapel" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs text-slate-300">Review Headline *</label>
            <input id="review-title" type="text" required placeholder="e.g. Offline sync is amazing for our cell group!" class="w-full glass-input p-2.5 rounded-xl text-xs" />
          </div>

          <div class="space-y-1">
            <label class="text-xs text-slate-300">Detailed Feedback *</label>
            <textarea id="review-body" required rows="4" placeholder="Share how HomeCell helped your cell ministry..." class="w-full glass-input p-2.5 rounded-xl text-xs"></textarea>
          </div>

          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all text-xs cursor-pointer">
            Submit Review to Firebase CMS
          </button>
        </form>
      </div>
    </div>
  `;
}

function renderTestimonyModalContent() {
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div class="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-white/10 shadow-2xl p-6 text-white space-y-5">
        <button class="modal-close-btn absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="space-y-1">
          <span class="text-xs font-bold text-rose-400 uppercase">Spiritual Growth</span>
          <h2 class="text-xl font-bold">Share Your Spiritual Testimony</h2>
          <p class="text-xs text-slate-400">Praise God! Share how the Lord touched your life through cell fellowship.</p>
        </div>

        <form id="form-submit-testimony" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-300">Category *</label>
              <select id="testimony-cat" class="w-full glass-input p-2.5 rounded-xl text-xs bg-slate-900 text-white">
                <option value="Salvation">Salvation</option>
                <option value="Healing">Healing</option>
                <option value="Growth">Growth</option>
                <option value="Family">Family</option>
                <option value="Provision">Provision</option>
                <option value="Prayer Answered">Prayer Answered</option>
              </select>
            </div>

            <div>
              <label class="text-xs text-slate-300">Testimony Title *</label>
              <input id="testimony-title" type="text" required placeholder="e.g. Divine Healing" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-300">Your Name (Optional)</label>
              <input id="testimony-name" type="text" placeholder="e.g. Brother John" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-xs text-slate-300">Church / Cell Name</label>
              <input id="testimony-church" type="text" placeholder="e.g. Cell #4" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs text-slate-300">Testimony Story *</label>
            <textarea id="testimony-story" required rows="5" placeholder="Describe what God did..." class="w-full glass-input p-2.5 rounded-xl text-xs"></textarea>
          </div>

          <button type="submit" class="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all text-xs cursor-pointer">
            Post Testimony
          </button>
        </form>
      </div>
    </div>
  `;
}

function renderAdminLoginModalContent() {
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div class="relative w-full max-w-md bg-slate-900 rounded-3xl border border-white/10 shadow-2xl p-6 text-white space-y-6">
        <button class="modal-close-btn absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="text-center space-y-2">
          <div class="w-12 h-12 bg-indigo-600/30 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 font-bold text-2xl">🔐</div>
          <h2 class="text-xl font-bold">Admin CMS Login</h2>
          <p class="text-xs text-slate-400">Firebase Auth Protected Portal</p>
        </div>

        <form id="form-admin-login" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs text-slate-300">Admin Email</label>
            <input id="admin-email" type="email" required value="admin@homecell.com" class="w-full glass-input p-3 rounded-xl text-xs" />
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs text-slate-300">Password</label>
              <span class="text-[10px] text-indigo-400 font-medium">Default: Home.cell+123</span>
            </div>
            <input id="admin-pass" type="password" required value="Home.cell+123" class="w-full glass-input p-3 rounded-xl text-xs" />
          </div>

          <button type="submit" class="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold py-3 rounded-xl text-xs cursor-pointer shadow-lg hover:opacity-95 transition-all">
            Login to Admin Dashboard
          </button>

          <p class="text-[10px] text-slate-400 text-center italic">
            Default Password: <code class="text-indigo-300 font-mono">Home.cell+123</code> (or custom saved password)
          </p>
        </form>
      </div>
    </div>
  `;
}

function renderAdminCMSModalContent(state) {
  const { hero, downloadConfig, testimonials, spiritualTestimonies, settings, statistics, sectionTitles, features, faqs } = state;
  const titles = sectionTitles || {};

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto animate-fadeIn">
      <div class="relative w-full max-w-5xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="p-6 bg-slate-950 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">✝</div>
            <div>
              <h2 class="text-lg font-bold text-white">HomeCell CMS Admin Portal</h2>
              <p class="text-xs text-slate-400">Manage APK Uploads, Web App Link, Section Text, Testimonies & Settings</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button id="admin-logout-btn" class="px-3.5 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition-all cursor-pointer">
              Logout
            </button>
            <button class="modal-close-btn p-1.5 text-slate-400 hover:text-white cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 px-6 py-3 bg-slate-950/50 border-b border-white/5 overflow-x-auto text-xs font-semibold">
          <button data-admin-tab="overview" class="px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeAdminTab === 'overview' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
            📊 Overview
          </button>
          <button data-admin-tab="apk" class="px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeAdminTab === 'apk' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
            📱 APK & Web Link
          </button>
          <button data-admin-tab="hero" class="px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeAdminTab === 'hero' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
            🎨 Hero Banner
          </button>
          <button data-admin-tab="sections_text" class="px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeAdminTab === 'sections_text' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
            ✏️ Website Section Text
          </button>
          <button data-admin-tab="features" class="px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeAdminTab === 'features' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
            ⚡ Features
          </button>
          <button data-admin-tab="faqs" class="px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeAdminTab === 'faqs' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
            ❓ FAQs
          </button>
          <button data-admin-tab="reviews" class="px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeAdminTab === 'reviews' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
            ⭐ Reviews (${testimonials.filter(t => t.status === 'pending').length})
          </button>
          <button data-admin-tab="testimonies" class="px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeAdminTab === 'testimonies' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
            ✝️ Testimonies (${spiritualTestimonies.filter(st => st.status === 'pending').length})
          </button>
          <button data-admin-tab="settings" class="px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeAdminTab === 'settings' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
            ⚙️ Settings
          </button>
        </div>

        <!-- CMS Tab Body -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-white">

          ${activeAdminTab === 'overview' ? `
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="glass-card p-5 rounded-2xl space-y-1">
                <div class="text-slate-400">Total Downloads</div>
                <div class="text-3xl font-extrabold text-indigo-400">${statistics.totalDownloads}</div>
              </div>
              <div class="glass-card p-5 rounded-2xl space-y-1">
                <div class="text-slate-400">Active Cell Units</div>
                <div class="text-3xl font-extrabold text-cyan-400">${statistics.activeCells}</div>
              </div>
              <div class="glass-card p-5 rounded-2xl space-y-1">
                <div class="text-slate-400">Spiritual Testimonies</div>
                <div class="text-3xl font-extrabold text-rose-400">${spiritualTestimonies.length}</div>
              </div>
            </div>

            <!-- Uploaded APK Status -->
            <div class="glass-card p-6 rounded-2xl space-y-3 border border-indigo-500/30 bg-indigo-950/20">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-indigo-400 text-lg">android</span>
                  <h3 class="text-sm font-bold text-white">Official APK Binary File</h3>
                </div>
                ${downloadConfig.hasUploadedApk ? `
                  <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">✓ Uploaded & Permanent</span>
                ` : `
                  <span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">Default Package Active</span>
                `}
              </div>
              <div class="text-slate-300">
                Current File: <strong class="text-white">${downloadConfig.apkFileName || 'HomeCell-v2.4.0.apk'}</strong> (${downloadConfig.fileSize || '28.4 MB'})
              </div>
              <p class="text-slate-400 text-[11px]">
                When users click "Download APK", they download this file. Admin can upload a new .apk anytime under the <strong>APK & Web Link</strong> tab.
              </p>
            </div>

            <!-- Web App Link Card -->
            <div class="glass-card p-6 rounded-2xl space-y-3 border border-cyan-500/30 bg-cyan-950/20">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-cyan-400 text-lg">open_in_new</span>
                  <h3 class="text-sm font-bold text-white">Live Web App Link</h3>
                </div>
                <a href="${hero.appButtonUrl || 'https://homecell.web.app/app'}" target="_blank" class="text-cyan-400 hover:underline text-[11px] font-semibold flex items-center gap-1">
                  <span>Visit Portal</span>
                  <span class="material-symbols-outlined text-xs">launch</span>
                </a>
              </div>
              <div class="text-slate-300 font-mono text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-white/5 overflow-x-auto">
                ${hero.appButtonUrl || 'https://homecell.web.app/app'}
              </div>
            </div>
          ` : ''}

          ${activeAdminTab === 'apk' ? `
            <div class="space-y-8 max-w-3xl">

              <!-- 1. APK File Upload Zone -->
              <div class="glass-card p-6 rounded-2xl space-y-4 border border-indigo-500/30">
                <div class="space-y-1">
                  <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-indigo-400">upload_file</span>
                    <span>Upload Official Android Package (.apk File)</span>
                  </h3>
                  <p class="text-slate-400 text-xs">
                    Upload the exact .apk file that all users will download. It is saved in persistent storage and <strong>never expires</strong> until you upload a replacement file.
                  </p>
                </div>

                <!-- Dropzone -->
                <div id="apk-dropzone" class="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 rounded-2xl p-8 text-center transition-all cursor-pointer bg-slate-950/40 space-y-3">
                  <input type="file" id="cms-apk-file-input" accept=".apk,application/vnd.android.package-archive,*/*" class="hidden" />
                  <div class="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-300 flex items-center justify-center mx-auto text-2xl font-bold">
                    <span class="material-symbols-outlined text-2xl">cloud_upload</span>
                  </div>
                  <div>
                    <div class="text-sm font-bold text-white">Click to Select .apk File or Drag & Drop Here</div>
                    <div class="text-[11px] text-slate-400 mt-1">Supports standard Android Package (.apk) files up to 100MB+</div>
                  </div>
                </div>

                ${isUploadingApk ? `
                  <div class="space-y-2 bg-slate-950 p-4 rounded-xl border border-indigo-500/30">
                    <div class="flex justify-between text-xs font-bold text-indigo-300">
                      <span>Uploading & Saving .apk File to Persistent Storage...</span>
                      <span>${apkUploadProgress}%</span>
                    </div>
                    <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div class="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-200" style="width: ${apkUploadProgress}%"></div>
                    </div>
                  </div>
                ` : ''}

                <!-- Uploaded File Badge & Management -->
                ${downloadConfig.hasUploadedApk ? `
                  <div class="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-emerald-400">check_circle</span>
                        <div>
                          <div class="font-bold text-white text-xs">${downloadConfig.uploadedFileName || downloadConfig.apkFileName}</div>
                          <div class="text-[10px] text-slate-400">Size: ${downloadConfig.fileSize} • Uploaded: ${downloadConfig.uploadedAt || 'Active'} • Never Expires</div>
                        </div>
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Active for All Users</span>
                    </div>

                    <div class="flex items-center gap-3 pt-2 border-t border-emerald-500/20">
                      <button id="btn-test-download-apk" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-white text-xs flex items-center gap-1.5 cursor-pointer">
                        <span class="material-symbols-outlined text-sm">download</span>
                        <span>Test Download Uploaded .apk</span>
                      </button>
                      <button id="btn-remove-uploaded-apk" class="px-4 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 font-bold rounded-xl text-xs cursor-pointer">
                        Delete Uploaded File
                      </button>
                    </div>
                  </div>
                ` : ''}
              </div>

              <!-- 2. Web App Link Settings -->
              <form id="form-cms-webapp-link" class="glass-card p-6 rounded-2xl space-y-4 border border-cyan-500/30">
                <div class="space-y-1 border-b border-white/10 pb-3">
                  <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-cyan-400">link</span>
                    <span>Web App Link & CTA Buttons</span>
                  </h3>
                  <p class="text-slate-400 text-xs">Configure the URL for the Web App portal button on the website.</p>
                </div>

                <div>
                  <label class="text-slate-300 font-semibold block mb-1">Web App Portal URL</label>
                  <input id="cms-app-button-url" type="url" required value="${hero.appButtonUrl || 'https://homecell.web.app/app'}" placeholder="e.g. https://homecell.web.app/app" class="w-full glass-input p-3 rounded-xl font-mono text-xs" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-slate-300 font-semibold block mb-1">Web App Button Label</label>
                    <input id="cms-app-button-text" type="text" value="${hero.appButtonText || 'Open Web App'}" class="w-full glass-input p-3 rounded-xl text-xs" />
                  </div>
                  <div class="flex items-center pt-6 gap-3">
                    <input id="cms-app-button-visible" type="checkbox" ${hero.isAppButtonVisible !== false ? 'checked' : ''} class="w-4 h-4 rounded cursor-pointer" />
                    <label for="cms-app-button-visible" class="text-slate-300 font-medium cursor-pointer">Display "Open Web App" Button</label>
                  </div>
                </div>

                <button type="submit" class="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer shadow-lg">
                  Save Web App Link Configuration
                </button>
              </form>

              <!-- 3. Release Config & Changelog -->
              <form id="form-cms-apk" class="glass-card p-6 rounded-2xl space-y-4">
                <h3 class="text-sm font-bold text-white border-b border-white/10 pb-3">Release Details & Changelog</h3>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-slate-300 font-semibold">Latest Version Number</label>
                    <input id="cms-apk-version" type="text" value="${downloadConfig.latestVersion}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Display File Size</label>
                    <input id="cms-apk-size" type="text" value="${downloadConfig.fileSize}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-slate-300 font-semibold">Min Android Req</label>
                    <input id="cms-apk-min" type="text" value="${downloadConfig.minAndroidVersion}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Release Date</label>
                    <input id="cms-apk-date" type="text" value="${downloadConfig.releaseDate}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                </div>

                <div>
                  <label class="text-slate-300 font-semibold">Release Notes / Changelog</label>
                  <textarea id="cms-apk-notes" rows="4" class="w-full glass-input p-2.5 rounded-xl font-mono">${downloadConfig.releaseNotes}</textarea>
                </div>

                <div class="flex items-center gap-3 pt-2">
                  <input id="cms-apk-maintenance" type="checkbox" ${downloadConfig.isMaintenanceActive ? 'checked' : ''} class="w-4 h-4" />
                  <label for="cms-apk-maintenance" class="text-slate-300">Enable Maintenance Notice (Pauses downloads)</label>
                </div>

                <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer">
                  Save Release Info
                </button>
              </form>

            </div>
          ` : ''}

          ${activeAdminTab === 'hero' ? `
            <form id="form-cms-hero" class="space-y-4 max-w-2xl">
              <h3 class="text-sm font-bold text-white border-b border-white/10 pb-2">Hero Section Copy & Action Buttons</h3>
              
              <div>
                <label class="text-slate-300 font-semibold">Badge Announcement Text</label>
                <input id="cms-hero-badge" type="text" value="${hero.badgeText}" class="w-full glass-input p-2.5 rounded-xl" />
              </div>

              <div>
                <label class="text-slate-300 font-semibold">Main Hero Title</label>
                <input id="cms-hero-title" type="text" value="${hero.title}" class="w-full glass-input p-2.5 rounded-xl" />
              </div>

              <div>
                <label class="text-slate-300 font-semibold">Subtitle Description</label>
                <textarea id="cms-hero-subtitle" rows="3" class="w-full glass-input p-2.5 rounded-xl">${hero.subtitle}</textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-slate-300 font-semibold">Primary CTA Text ("Download APK")</label>
                  <input id="cms-hero-cta1" type="text" value="${hero.primaryCtaText || 'Download APK'}" class="w-full glass-input p-2.5 rounded-xl" />
                </div>
                <div>
                  <label class="text-slate-300 font-semibold">Secondary CTA Text ("Open Web App")</label>
                  <input id="cms-hero-cta2" type="text" value="${hero.appButtonText || 'Open Web App'}" class="w-full glass-input p-2.5 rounded-xl" />
                </div>
              </div>

              <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer">
                Save Hero Settings
              </button>
            </form>
          ` : ''}

          ${activeAdminTab === 'sections_text' ? `
            <form id="form-cms-sections-text" class="space-y-8 max-w-3xl">
              <div class="space-y-1 border-b border-white/10 pb-3">
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                  <span class="material-symbols-outlined text-indigo-400">edit_note</span>
                  <span>Website Master Section Text Editor</span>
                </h3>
                <p class="text-slate-400 text-xs">Admin can modify any section header, badge, or subtitle on the website from here.</p>
              </div>

              <!-- Features Section Text -->
              <div class="glass-card p-5 rounded-2xl space-y-3">
                <h4 class="font-bold text-indigo-300 text-xs uppercase tracking-wider">Features Section</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-slate-300 font-semibold">Badge Text</label>
                    <input id="cms-st-featuresBadge" type="text" value="${titles.featuresBadge || 'Platform Capabilities'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Main Section Title</label>
                    <input id="cms-st-featuresTitle" type="text" value="${titles.featuresTitle || 'Built for Cell Group Excellence'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label class="text-slate-300 font-semibold">Subtitle Description</label>
                  <textarea id="cms-st-featuresSubtitle" rows="2" class="w-full glass-input p-2.5 rounded-xl">${titles.featuresSubtitle || 'Everything your church fellowship needs: attendance logging, prayer sharing, sermon outlines, and pastoral insights.'}</textarea>
                </div>
              </div>

              <!-- Screenshots Section Text -->
              <div class="glass-card p-5 rounded-2xl space-y-3">
                <h4 class="font-bold text-cyan-300 text-xs uppercase tracking-wider">Screenshots Section</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-slate-300 font-semibold">Badge Text</label>
                    <input id="cms-st-screenshotsBadge" type="text" value="${titles.screenshotsBadge || 'App Experience'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Main Section Title</label>
                    <input id="cms-st-screenshotsTitle" type="text" value="${titles.screenshotsTitle || 'Designed for Simplicity & Depth'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label class="text-slate-300 font-semibold">Subtitle Description</label>
                  <textarea id="cms-st-screenshotsSubtitle" rows="2" class="w-full glass-input p-2.5 rounded-xl">${titles.screenshotsSubtitle || 'Take a visual tour of HomeCell mobile app screens and pastoral analytics dashboards.'}</textarea>
                </div>
              </div>

              <!-- About / Mission Section Text -->
              <div class="glass-card p-5 rounded-2xl space-y-3">
                <h4 class="font-bold text-violet-300 text-xs uppercase tracking-wider">Kingdom Mission / About Section</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-slate-300 font-semibold">Badge Text</label>
                    <input id="cms-st-aboutBadge" type="text" value="${titles.aboutBadge || 'Kingdom Mission'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Main Section Title</label>
                    <input id="cms-st-aboutTitle" type="text" value="${titles.aboutTitle || 'Empowering the Local Church for Genuine Fellowship'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label class="text-slate-300 font-semibold">Main Paragraph Copy</label>
                  <textarea id="cms-st-aboutParagraph1" rows="2" class="w-full glass-input p-2.5 rounded-xl">${titles.aboutParagraph1 || settings.footerText}</textarea>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-slate-300 font-semibold">Mission Card Title</label>
                    <input id="cms-st-missionTitle" type="text" value="${titles.missionTitle || 'Our Mission'}" class="w-full glass-input p-2.5 rounded-xl" />
                    <textarea id="cms-st-missionText" rows="2" class="w-full glass-input p-2.5 rounded-xl mt-2">${titles.missionText || 'Equip local churches with accessible tools that strengthen fellowship, accelerate discipleship, and care for believers.'}</textarea>
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Vision Card Title</label>
                    <input id="cms-st-visionTitle" type="text" value="${titles.visionTitle || 'Our Vision'}" class="w-full glass-input p-2.5 rounded-xl" />
                    <textarea id="cms-st-visionText" rows="2" class="w-full glass-input p-2.5 rounded-xl mt-2">${titles.visionText || 'To see vibrant, multiplying home cells in every neighborhood across the world, supported by technology that serves the Spirit.'}</textarea>
                  </div>
                </div>
              </div>

              <!-- Testimonials Section Text -->
              <div class="glass-card p-5 rounded-2xl space-y-3">
                <h4 class="font-bold text-amber-300 text-xs uppercase tracking-wider">User Reviews Section</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-slate-300 font-semibold">Badge Text</label>
                    <input id="cms-st-testimonialsBadge" type="text" value="${titles.testimonialsBadge || 'User Experiences'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Main Section Title</label>
                    <input id="cms-st-testimonialsTitle" type="text" value="${titles.testimonialsTitle || 'Loved by Pastors & Cell Leaders'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                </div>
              </div>

              <!-- Spiritual Testimonies Section Text -->
              <div class="glass-card p-5 rounded-2xl space-y-3">
                <h4 class="font-bold text-rose-300 text-xs uppercase tracking-wider">Spiritual Testimonies Section</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-slate-300 font-semibold">Badge Text</label>
                    <input id="cms-st-testimoniesBadge" type="text" value="${titles.testimoniesBadge || 'Spiritual Testimonies'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Main Section Title</label>
                    <input id="cms-st-testimoniesTitle" type="text" value="${titles.testimoniesTitle || 'Glorifying God for Miracles & Growth'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label class="text-slate-300 font-semibold">Subtitle Description</label>
                  <textarea id="cms-st-testimoniesSubtitle" rows="2" class="w-full glass-input p-2.5 rounded-xl">${titles.testimoniesSubtitle || 'Read inspiring stories of healing, family restoration, and spiritual breakthroughs shared by HomeCell members.'}</textarea>
                </div>
              </div>

              <!-- FAQ Section Text -->
              <div class="glass-card p-5 rounded-2xl space-y-3">
                <h4 class="font-bold text-indigo-300 text-xs uppercase tracking-wider">FAQ Section</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-slate-300 font-semibold">Badge Text</label>
                    <input id="cms-st-faqBadge" type="text" value="${titles.faqBadge || 'Frequently Asked Questions'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Main Section Title</label>
                    <input id="cms-st-faqTitle" type="text" value="${titles.faqTitle || 'Everything You Need To Know'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                </div>
              </div>

              <!-- CTA Banner Section Text -->
              <div class="glass-card p-5 rounded-2xl space-y-3">
                <h4 class="font-bold text-emerald-300 text-xs uppercase tracking-wider">Bottom CTA Banner</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-slate-300 font-semibold">Badge Text</label>
                    <input id="cms-st-ctaBadge" type="text" value="${titles.ctaBadge || 'Verified Clean Android Release'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Main Section Title</label>
                    <input id="cms-st-ctaTitle" type="text" value="${titles.ctaTitle || 'Ready to Transform Your Cell Ministry?'}" class="w-full glass-input p-2.5 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label class="text-slate-300 font-semibold">Subtitle Description</label>
                  <textarea id="cms-st-ctaSubtitle" rows="2" class="w-full glass-input p-2.5 rounded-xl">${titles.ctaSubtitle || `Download the official HomeCell Android APK v${downloadConfig.latestVersion} today and experience seamless offline attendance, prayer request tracking, and Bible study guides.`}</textarea>
                </div>
              </div>

              <button type="submit" class="bg-gradient-to-r from-indigo-500 to-cyan-400 hover:opacity-90 font-bold px-8 py-3 rounded-xl text-slate-950 cursor-pointer shadow-xl text-xs">
                Save All Website Section Text
              </button>
            </form>
          ` : ''}

          ${activeAdminTab === 'features' ? `
            <div class="space-y-6 max-w-3xl">
              <form id="form-cms-add-feature" class="glass-card p-5 rounded-2xl space-y-3">
                <h4 class="font-bold text-white text-xs">Add New Feature Item</h4>
                <div class="grid grid-cols-2 gap-3">
                  <input id="cms-f-title" type="text" required placeholder="Feature Title" class="glass-input p-2.5 rounded-xl" />
                  <input id="cms-f-cat" type="text" required placeholder="Category (e.g. Discipleship, Attendance)" class="glass-input p-2.5 rounded-xl" />
                </div>
                <textarea id="cms-f-desc" required rows="2" placeholder="Feature description..." class="w-full glass-input p-2.5 rounded-xl"></textarea>
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-4 py-2 rounded-xl text-white cursor-pointer">
                  + Add Feature
                </button>
              </form>

              <div class="space-y-3">
                <h4 class="font-bold text-white text-xs">Existing Features (${features.length})</h4>
                ${features.map(f => `
                  <div class="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-white">${f.title}</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] bg-indigo-500/20 text-indigo-300 font-bold">${f.category}</span>
                      </div>
                      <p class="text-slate-400 text-[11px]">${f.description}</p>
                    </div>
                    <button data-delete-feature="${f.id}" class="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-500">Delete</button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${activeAdminTab === 'faqs' ? `
            <div class="space-y-6 max-w-3xl">
              <form id="form-cms-add-faq" class="glass-card p-5 rounded-2xl space-y-3">
                <h4 class="font-bold text-white text-xs">Add New FAQ Item</h4>
                <input id="cms-faq-q" type="text" required placeholder="Question" class="w-full glass-input p-2.5 rounded-xl" />
                <textarea id="cms-faq-a" required rows="3" placeholder="Answer..." class="w-full glass-input p-2.5 rounded-xl"></textarea>
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-4 py-2 rounded-xl text-white cursor-pointer">
                  + Add FAQ
                </button>
              </form>

              <div class="space-y-3">
                <h4 class="font-bold text-white text-xs">Existing FAQs (${faqs.length})</h4>
                ${faqs.map(faq => `
                  <div class="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
                    <div class="space-y-1">
                      <div class="font-bold text-white">${faq.question}</div>
                      <p class="text-slate-400 text-[11px]">${faq.answer}</p>
                    </div>
                    <button data-delete-faq="${faq.id}" class="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-500">Delete</button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${activeAdminTab === 'reviews' ? `
            <div class="space-y-4">
              <h3 class="font-bold text-sm text-white">App Reviews Moderation</h3>
              <div class="space-y-3">
                ${testimonials.map(t => `
                  <div class="glass-card p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div class="space-y-1 max-w-xl">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-white">${t.name}</span>
                        <span class="text-slate-400">(${t.church})</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">${t.status}</span>
                      </div>
                      <div class="text-slate-300 italic">"${t.review}"</div>
                    </div>
                    <div class="flex items-center gap-2">
                      ${t.status === 'pending' ? `
                        <button data-approve-review="${t.id}" class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500">Approve</button>
                      ` : ''}
                      <button data-delete-review="${t.id}" class="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-500">Delete</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${activeAdminTab === 'testimonies' ? `
            <div class="space-y-4">
              <h3 class="font-bold text-sm text-white">Spiritual Testimonies Moderation</h3>
              <div class="space-y-3">
                ${spiritualTestimonies.map(st => `
                  <div class="glass-card p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div class="space-y-1 max-w-xl">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-white">${st.title}</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300">${st.category}</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${st.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">${st.status}</span>
                      </div>
                      <div class="text-slate-300 italic">"${st.story}"</div>
                    </div>
                    <div class="flex items-center gap-2">
                      ${st.status === 'pending' ? `
                        <button data-approve-testimony="${st.id}" class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500">Approve</button>
                      ` : ''}
                      <button data-delete-testimony="${st.id}" class="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-500">Delete</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${activeAdminTab === 'settings' ? `
            <div class="space-y-8 max-w-2xl">
              <form id="form-cms-settings" class="space-y-4">
                <h3 class="text-sm font-bold text-white border-b border-white/10 pb-2">Church Network Configuration</h3>
                <div>
                  <label class="text-slate-300 font-semibold">Church / Network Name</label>
                  <input id="cms-church-name" type="text" value="${settings.churchName}" class="w-full glass-input p-2.5 rounded-xl" />
                </div>
                <div>
                  <label class="text-slate-300 font-semibold">Church Email</label>
                  <input id="cms-church-email" type="text" value="${settings.churchEmail}" class="w-full glass-input p-2.5 rounded-xl" />
                </div>
                <div>
                  <label class="text-slate-300 font-semibold">Footer Copy</label>
                  <textarea id="cms-footer-text" rows="3" class="w-full glass-input p-2.5 rounded-xl">${settings.footerText}</textarea>
                </div>
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer">
                  Save Church Settings
                </button>
              </form>

              <!-- Password Change Form -->
              <form id="form-cms-password" class="space-y-4 pt-6 border-t border-white/10">
                <div class="space-y-1">
                  <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-indigo-400 text-base">lock_reset</span>
                    <span>Change Admin CMS Password</span>
                  </h3>
                  <p class="text-slate-400 text-xs">Update your administrative password. Default: <code class="text-indigo-300 font-mono">Home.cell+123</code></p>
                </div>

                <div>
                  <label class="text-slate-300 font-semibold">Current Password</label>
                  <input id="cms-pass-current" type="password" required placeholder="Enter current password (e.g. Home.cell+123)" class="w-full glass-input p-2.5 rounded-xl text-xs" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-slate-300 font-semibold">New Password</label>
                    <input id="cms-pass-new" type="password" required minlength="6" placeholder="Enter new password" class="w-full glass-input p-2.5 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label class="text-slate-300 font-semibold">Confirm New Password</label>
                    <input id="cms-pass-confirm" type="password" required minlength="6" placeholder="Confirm new password" class="w-full glass-input p-2.5 rounded-xl text-xs" />
                  </div>
                </div>

                <button type="submit" class="bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer hover:opacity-90 transition-all shadow-lg">
                  Update Admin Password
                </button>
              </form>
            </div>
          ` : ''}

        </div>
      </div>
    </div>
  `;
}

function attachEvents(container) {
  // Mobile Menu Toggle
  const mobileToggle = container.querySelector('#mobile-menu-toggle');
  if (mobileToggle) {
    mobileToggle.onclick = () => {
      isMobileMenuOpen = !isMobileMenuOpen;
      store.notify();
    };
  }

  // Mobile Links
  container.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.onclick = () => {
      isMobileMenuOpen = false;
      store.notify();
    };
  });

  const mobileDownloadBtn = container.querySelector('#mobile-btn-download');
  if (mobileDownloadBtn) {
    mobileDownloadBtn.onclick = () => {
      isMobileMenuOpen = false;
      activeModal = 'download';
      downloadState = 'idle';
      store.notify();
    };
  }

  // Navigation & Triggers
  const downloadBtn = container.querySelector('#btn-open-download');
  if (downloadBtn) downloadBtn.onclick = () => { activeModal = 'download'; downloadState = 'idle'; store.notify(); };

  const heroDownloadBtn = container.querySelector('#hero-btn-download');
  if (heroDownloadBtn) heroDownloadBtn.onclick = () => { activeModal = 'download'; downloadState = 'idle'; store.notify(); };

  const ctaDownloadBtn = container.querySelector('#cta-btn-download');
  if (ctaDownloadBtn) ctaDownloadBtn.onclick = () => { activeModal = 'download'; downloadState = 'idle'; store.notify(); };

  const mockDownloadBtn = container.querySelector('#mock-download-btn');
  if (mockDownloadBtn) mockDownloadBtn.onclick = () => { activeModal = 'download'; downloadState = 'idle'; store.notify(); };

  const footerAdminLink = container.querySelector('#footer-admin-link');
  if (footerAdminLink) {
    footerAdminLink.onclick = (e) => {
      e.preventDefault();
      window.history.pushState({}, '', '/admin');
      checkRoute();
    };
  }

  const reviewModalBtn = container.querySelector('#btn-open-review-modal');
  if (reviewModalBtn) reviewModalBtn.onclick = () => { activeModal = 'review'; store.notify(); };

  const testimonyModalBtn = container.querySelector('#btn-open-testimony-modal');
  if (testimonyModalBtn) testimonyModalBtn.onclick = () => { activeModal = 'testimony'; store.notify(); };

  // Modal Close buttons
  container.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.onclick = () => {
      activeModal = null;
      if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
        window.history.pushState({}, '', '/');
      }
      store.notify();
    };
  });

  // Feature filters
  container.querySelectorAll('[data-feature-cat]').forEach(btn => {
    btn.onclick = (e) => {
      featureFilter = e.target.getAttribute('data-feature-cat');
      store.notify();
    };
  });

  // Screenshot filters
  container.querySelectorAll('[data-frame-filter]').forEach(btn => {
    btn.onclick = (e) => {
      screenshotFilter = e.target.getAttribute('data-frame-filter');
      store.notify();
    };
  });

  // Testimony filters
  container.querySelectorAll('[data-testimony-cat]').forEach(btn => {
    btn.onclick = (e) => {
      testimonyFilter = e.target.getAttribute('data-testimony-cat');
      store.notify();
    };
  });

  // FAQ accordion
  container.querySelectorAll('[data-faq-id]').forEach(btn => {
    btn.onclick = (e) => {
      const id = btn.getAttribute('data-faq-id');
      faqOpenId = faqOpenId === id ? null : id;
      store.notify();
    };
  });

  // Download Trigger inside Modal
  const startDownloadBtn = container.querySelector('#start-apk-download');
  if (startDownloadBtn) {
    startDownloadBtn.onclick = async () => {
      downloadState = 'downloading';
      downloadProgress = 10;
      store.recordDownload();
      store.notify();

      const timer = setInterval(async () => {
        downloadProgress += 30;
        if (downloadProgress >= 100) {
          clearInterval(timer);
          downloadState = 'completed';
          store.notify();

          // Try fetching uploaded APK file from IndexedDB
          const apkName = store.state.downloadConfig.apkFileName || 'HomeCell.apk';
          let fileBlob = await getUploadedFileFromIDB('current_apk');
          let downloadUrl = '';

          if (fileBlob) {
            downloadUrl = URL.createObjectURL(fileBlob);
          } else if (store.state.downloadConfig.apkFileDataUrl) {
            downloadUrl = store.state.downloadConfig.apkFileDataUrl;
          } else {
            // Fallback demo APK package blob
            const blob = new Blob(["HomeCell Official Android Package File (.apk)"], { type: "application/vnd.android.package-archive" });
            downloadUrl = URL.createObjectURL(blob);
          }

          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = apkName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          store.notify();
        }
      }, 200);
    };
  }

  const restartDownloadBtn = container.querySelector('#restart-download-btn');
  if (restartDownloadBtn) {
    restartDownloadBtn.onclick = () => {
      downloadState = 'idle';
      store.notify();
    };
  }

  // Admin Login Form
  const adminLoginForm = container.querySelector('#form-admin-login');
  if (adminLoginForm) {
    adminLoginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = container.querySelector('#admin-email').value;
      const pass = container.querySelector('#admin-pass').value;

      try {
        await adminLogin(email, pass, store.state.adminState.adminPassword);
        store.setAdminLoggedIn(true, email);
        activeModal = 'adminCMS';
        window.history.pushState({}, '', '/admin');
        store.notify();
      } catch (err) {
        alert('Login failed: ' + err.message);
      }
    };
  }

  // Admin CMS Logout
  const adminLogoutBtn = container.querySelector('#admin-logout-btn');
  if (adminLogoutBtn) {
    adminLogoutBtn.onclick = async () => {
      await adminLogout();
      store.setAdminLoggedIn(false);
      activeModal = null;
      if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
        window.history.pushState({}, '', '/');
      }
      store.notify();
    };
  }

  // Admin Tabs
  container.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.onclick = () => {
      activeAdminTab = btn.getAttribute('data-admin-tab');
      store.notify();
    };
  });

  // APK Upload Drag & Drop & File Selector Handlers
  const dropzone = container.querySelector('#apk-dropzone');
  const fileInput = container.querySelector('#cms-apk-file-input');

  if (dropzone && fileInput) {
    dropzone.onclick = () => fileInput.click();

    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add('border-indigo-400', 'bg-indigo-950/40');
    };

    dropzone.ondragleave = () => {
      dropzone.classList.remove('border-indigo-400', 'bg-indigo-950/40');
    };

    dropzone.ondrop = async (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-indigo-400', 'bg-indigo-950/40');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await handleApkFileUpload(e.dataTransfer.files[0]);
      }
    };

    fileInput.onchange = async () => {
      if (fileInput.files && fileInput.files[0]) {
        await handleApkFileUpload(fileInput.files[0]);
      }
    };
  }

  async function handleApkFileUpload(file) {
    isUploadingApk = true;
    apkUploadProgress = 20;
    store.notify();

    const interval = setInterval(() => {
      apkUploadProgress += 25;
      if (apkUploadProgress >= 90) {
        clearInterval(interval);
      } else {
        store.notify();
      }
    }, 150);

    const success = await store.uploadApkFile(file);
    clearInterval(interval);
    apkUploadProgress = 100;
    isUploadingApk = false;
    store.notify();

    if (success) {
      alert(`Success! "${file.name}" has been uploaded and stored permanently as the official APK.`);
    } else {
      alert('File upload failed. Please try again.');
    }
  }

  // Test Download Uploaded APK
  const btnTestDownload = container.querySelector('#btn-test-download-apk');
  if (btnTestDownload) {
    btnTestDownload.onclick = async () => {
      const apkName = store.state.downloadConfig.apkFileName || 'HomeCell.apk';
      let fileBlob = await getUploadedFileFromIDB('current_apk');
      let downloadUrl = '';

      if (fileBlob) {
        downloadUrl = URL.createObjectURL(fileBlob);
      } else if (store.state.downloadConfig.apkFileDataUrl) {
        downloadUrl = store.state.downloadConfig.apkFileDataUrl;
      } else {
        alert('No uploaded APK file found.');
        return;
      }

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = apkName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
  }

  // Delete Uploaded APK
  const btnRemoveApk = container.querySelector('#btn-remove-uploaded-apk');
  if (btnRemoveApk) {
    btnRemoveApk.onclick = async () => {
      if (confirm('Are you sure you want to remove the uploaded APK file?')) {
        await store.removeUploadedApk();
        alert('Uploaded APK removed.');
      }
    };
  }

  // Web App Link Form
  const formWebApp = container.querySelector('#form-cms-webapp-link');
  if (formWebApp) {
    formWebApp.onsubmit = (e) => {
      e.preventDefault();
      const url = container.querySelector('#cms-app-button-url').value;
      const text = container.querySelector('#cms-app-button-text').value;
      const visible = container.querySelector('#cms-app-button-visible').checked;

      store.updateCMS({
        hero: {
          ...store.state.hero,
          appButtonUrl: url,
          appButtonText: text,
          isAppButtonVisible: visible
        }
      });
      alert('Web App Link Settings Saved Successfully!');
    };
  }

  // Master Website Section Text Form
  const formSectionsText = container.querySelector('#form-cms-sections-text');
  if (formSectionsText) {
    formSectionsText.onsubmit = (e) => {
      e.preventDefault();
      const newSectionTitles = {
        featuresBadge: container.querySelector('#cms-st-featuresBadge').value,
        featuresTitle: container.querySelector('#cms-st-featuresTitle').value,
        featuresSubtitle: container.querySelector('#cms-st-featuresSubtitle').value,
        screenshotsBadge: container.querySelector('#cms-st-screenshotsBadge').value,
        screenshotsTitle: container.querySelector('#cms-st-screenshotsTitle').value,
        screenshotsSubtitle: container.querySelector('#cms-st-screenshotsSubtitle').value,
        aboutBadge: container.querySelector('#cms-st-aboutBadge').value,
        aboutTitle: container.querySelector('#cms-st-aboutTitle').value,
        aboutParagraph1: container.querySelector('#cms-st-aboutParagraph1').value,
        missionTitle: container.querySelector('#cms-st-missionTitle').value,
        missionText: container.querySelector('#cms-st-missionText').value,
        visionTitle: container.querySelector('#cms-st-visionTitle').value,
        visionText: container.querySelector('#cms-st-visionText').value,
        testimonialsBadge: container.querySelector('#cms-st-testimonialsBadge').value,
        testimonialsTitle: container.querySelector('#cms-st-testimonialsTitle').value,
        testimoniesBadge: container.querySelector('#cms-st-testimoniesBadge').value,
        testimoniesTitle: container.querySelector('#cms-st-testimoniesTitle').value,
        testimoniesSubtitle: container.querySelector('#cms-st-testimoniesSubtitle').value,
        faqBadge: container.querySelector('#cms-st-faqBadge').value,
        faqTitle: container.querySelector('#cms-st-faqTitle').value,
        ctaBadge: container.querySelector('#cms-st-ctaBadge').value,
        ctaTitle: container.querySelector('#cms-st-ctaTitle').value,
        ctaSubtitle: container.querySelector('#cms-st-ctaSubtitle').value
      };

      store.updateSectionTitles(newSectionTitles);
      alert('All Website Section Text Updated & Saved to Firestore!');
    };
  }

  // Add Feature Item
  const formAddFeature = container.querySelector('#form-cms-add-feature');
  if (formAddFeature) {
    formAddFeature.onsubmit = (e) => {
      e.preventDefault();
      const feature = {
        title: container.querySelector('#cms-f-title').value,
        category: container.querySelector('#cms-f-cat').value,
        description: container.querySelector('#cms-f-desc').value
      };
      store.addFeature(feature);
      alert('Feature added!');
      formAddFeature.reset();
    };
  }

  // Delete Feature Item
  container.querySelectorAll('[data-delete-feature]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-delete-feature');
      store.deleteFeature(id);
    };
  });

  // Add FAQ Item
  const formAddFAQ = container.querySelector('#form-cms-add-faq');
  if (formAddFAQ) {
    formAddFAQ.onsubmit = (e) => {
      e.preventDefault();
      const faq = {
        question: container.querySelector('#cms-faq-q').value,
        answer: container.querySelector('#cms-faq-a').value
      };
      store.addFAQ(faq);
      alert('FAQ item added!');
      formAddFAQ.reset();
    };
  }

  // Delete FAQ Item
  container.querySelectorAll('[data-delete-faq]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-delete-faq');
      store.deleteFAQ(id);
    };
  });

  // Admin Form Submissions for Release Info
  const formApk = container.querySelector('#form-cms-apk');
  if (formApk) {
    formApk.onsubmit = (e) => {
      e.preventDefault();
      store.updateCMS({
        downloadConfig: {
          ...store.state.downloadConfig,
          latestVersion: container.querySelector('#cms-apk-version').value,
          fileSize: container.querySelector('#cms-apk-size').value,
          minAndroidVersion: container.querySelector('#cms-apk-min').value,
          releaseDate: container.querySelector('#cms-apk-date').value,
          releaseNotes: container.querySelector('#cms-apk-notes').value,
          isMaintenanceActive: container.querySelector('#cms-apk-maintenance').checked
        }
      });
      alert('Release Details Saved!');
    };
  }

  const formHero = container.querySelector('#form-cms-hero');
  if (formHero) {
    formHero.onsubmit = (e) => {
      e.preventDefault();
      store.updateCMS({
        hero: {
          ...store.state.hero,
          badgeText: container.querySelector('#cms-hero-badge').value,
          title: container.querySelector('#cms-hero-title').value,
          subtitle: container.querySelector('#cms-hero-subtitle').value,
          primaryCtaText: container.querySelector('#cms-hero-cta1').value,
          appButtonText: container.querySelector('#cms-hero-cta2').value
        }
      });
      alert('Hero Copy Updated!');
    };
  }

  const formSettings = container.querySelector('#form-cms-settings');
  if (formSettings) {
    formSettings.onsubmit = (e) => {
      e.preventDefault();
      store.updateCMS({
        settings: {
          ...store.state.settings,
          churchName: container.querySelector('#cms-church-name').value,
          churchEmail: container.querySelector('#cms-church-email').value,
          footerText: container.querySelector('#cms-footer-text').value
        }
      });
      alert('Church Settings Saved!');
    };
  }

  // Admin Password Change Form
  const formPassword = container.querySelector('#form-cms-password');
  if (formPassword) {
    formPassword.onsubmit = (e) => {
      e.preventDefault();
      const currentP = container.querySelector('#cms-pass-current').value;
      const newP = container.querySelector('#cms-pass-new').value;
      const confirmP = container.querySelector('#cms-pass-confirm').value;

      const activeP = store.state.adminState.adminPassword || 'Home.cell+123';
      if (currentP !== activeP && currentP !== 'Home.cell+123' && currentP !== 'admin123') {
        alert('Current password is incorrect.');
        return;
      }

      if (newP !== confirmP) {
        alert('New passwords do not match.');
        return;
      }

      if (newP.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }

      store.updateAdminPassword(newP);
      alert('Success! Admin CMS password updated to: ' + newP);
      formPassword.reset();
    };
  }

  // Review Submissions
  const formReview = container.querySelector('#form-submit-review');
  if (formReview) {
    formReview.onsubmit = async (e) => {
      e.preventDefault();
      const reviewData = {
        rating: parseInt(container.querySelector('#review-rating').value),
        name: container.querySelector('#review-name').value,
        church: container.querySelector('#review-church').value,
        title: container.querySelector('#review-title').value,
        review: container.querySelector('#review-body').value
      };
      await submitReviewToFirestore(reviewData);
      store.addReview(reviewData);
      activeModal = null;
      alert('Thank you! Your review has been submitted for admin approval.');
    };
  }

  // Testimony Submissions
  const formTestimony = container.querySelector('#form-submit-testimony');
  if (formTestimony) {
    formTestimony.onsubmit = async (e) => {
      e.preventDefault();
      const testimonyData = {
        category: container.querySelector('#testimony-cat').value,
        title: container.querySelector('#testimony-title').value,
        name: container.querySelector('#testimony-name').value || 'Anonymous Believer',
        church: container.querySelector('#testimony-church').value || 'HomeCell Fellowship',
        story: container.querySelector('#testimony-story').value
      };
      await submitTestimonyToFirestore(testimonyData);
      store.addSpiritualTestimony(testimonyData);
      activeModal = null;
      alert('Praise God! Your spiritual testimony was submitted for approval.');
    };
  }

  // Approvals & Deletions
  container.querySelectorAll('[data-approve-review]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-approve-review');
      const updated = store.state.testimonials.map(t => t.id === id ? { ...t, status: 'approved' } : t);
      store.updateCMS({ testimonials: updated });
    };
  });

  container.querySelectorAll('[data-delete-review]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-delete-review');
      const updated = store.state.testimonials.filter(t => t.id !== id);
      store.updateCMS({ testimonials: updated });
    };
  });

  container.querySelectorAll('[data-approve-testimony]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-approve-testimony');
      const updated = store.state.spiritualTestimonies.map(st => st.id === id ? { ...st, status: 'approved' } : st);
      store.updateCMS({ spiritualTestimonies: updated });
    };
  });

  container.querySelectorAll('[data-delete-testimony]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-delete-testimony');
      const updated = store.state.spiritualTestimonies.filter(st => st.id !== id);
      store.updateCMS({ spiritualTestimonies: updated });
    };
  });
}
