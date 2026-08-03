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
  const hash = window.location.hash;
  const path = window.location.pathname;
  const isAdminRoute = hash === '#admin' || path.startsWith('/admin') || activeModal === 'adminCMS' || activeModal === 'adminLogin';

  if (isAdminRoute) {
    if (!state.adminState.isLoggedIn) {
      container.innerHTML = renderFullPageAdminLogin(state);
    } else {
      container.innerHTML = renderFullPageAdminCMS(state);
    }
    attachEvents(container);
    return;
  }

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
  const { settings, navbarLinks = [] } = state;
  const activeLinks = navbarLinks.filter(l => l.isVisible !== false);

  return `
    <nav class="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/70 border-b border-white/10 px-6 sm:px-12 py-4">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <a href="/" class="flex items-center gap-3 group">
          ${settings.logoImageUrl ? `
            <img src="${settings.logoImageUrl}" alt="Logo" class="w-10 h-10 rounded-xl object-cover border border-indigo-500/40 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform" />
          ` : `
            <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-slate-950 font-bold text-xl group-hover:scale-105 transition-transform">
              ${settings.logoIcon || '✝'}
            </div>
          `}
          <span class="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 italic">
            ${settings.logoText || 'HomeCell'}
          </span>
        </a>

        <!-- Desktop Navigation Links -->
        <div class="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300 uppercase tracking-widest">
          ${activeLinks.map(l => `
            <a href="${l.href}" class="hover:text-indigo-400 transition-colors">${l.label}</a>
          `).join('')}
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
          ${activeLinks.map(l => `
            <a href="${l.href}" class="mobile-nav-link text-sm font-semibold text-slate-300 hover:text-white py-2 border-b border-white/5">${l.label}</a>
          `).join('')}
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
  const { hero, downloadConfig, statistics, settings } = state;
  return `
    <section id="hero" class="relative min-h-[85vh] flex flex-col justify-center px-6 sm:px-12 py-12 overflow-hidden">
      ${hero.bgMediaUrl ? `
        <div class="absolute inset-0 z-0 pointer-events-none opacity-25 overflow-hidden">
          <img src="${hero.bgMediaUrl}" class="w-full h-full object-cover filter blur-xs" alt="Hero Background" />
        </div>
      ` : ''}

      <div class="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        <!-- Left Hero Copy -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          <div class="flex items-center gap-2">
            <span class="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              ${hero.badgeText || `v${downloadConfig.latestVersion} Now Available`}
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
              <span>${hero.primaryCtaText || 'Download APK'} (${downloadConfig.fileSize || '28.4 MB'})</span>
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
          <div class="w-[300px] sm:w-[320px] h-[580px] bg-slate-900 rounded-[48px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div class="absolute top-0 w-full h-7 bg-slate-900 z-20 flex justify-center items-center">
              <div class="w-28 h-3.5 bg-black rounded-b-2xl"></div>
            </div>
            
            ${hero.mockupImageUrl ? `
              <!-- Custom Admin Uploaded Phone Mockup Picture -->
              <div class="w-full h-full pt-7 pb-2 px-2 flex items-center justify-center bg-slate-950">
                <img src="${hero.mockupImageUrl}" class="w-full h-full object-cover rounded-[36px]" alt="Uploaded Phone Mockup" />
              </div>
            ` : `
              <!-- Default Mock App Screen Inside Device -->
              <div class="p-5 pt-10 flex flex-col gap-4 text-white h-full justify-between">
                <div class="space-y-4">
                  <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs">${settings.logoIcon || '✝'}</div>
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

                <button id="mock-download-btn" class="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
                  <span class="material-symbols-outlined text-sm">download</span>
                  <span>Download APK v${downloadConfig.latestVersion}</span>
                </button>
              </div>
            `}
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
  const { settings, navbarLinks } = state;
  const fLinks = settings.footerLinks && settings.footerLinks.length > 0 ? settings.footerLinks : navbarLinks;

  return `
    <footer class="relative z-10 backdrop-blur-xl bg-slate-950/80 border-t border-white/5 py-12 px-6 sm:px-12 text-slate-400 text-xs">
      <div class="max-w-7xl mx-auto space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="space-y-3 md:col-span-2">
            <div class="flex items-center gap-2.5">
              ${settings.logoImageUrl ? `
                <img src="${settings.logoImageUrl}" class="w-8 h-8 rounded-lg object-cover" alt="Logo" />
              ` : `
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-slate-950 font-bold flex items-center justify-center text-base">${settings.logoIcon || '✝'}</div>
              `}
              <span class="text-xl font-bold tracking-tight text-white italic">${settings.logoText || 'HomeCell'}</span>
            </div>
            <p class="text-slate-400 text-xs max-w-md leading-relaxed">${settings.footerText || ''}</p>
          </div>

          <div class="space-y-2">
            <div class="text-white font-bold uppercase text-[11px] tracking-wider">Quick Links</div>
            <div class="flex flex-col space-y-1.5">
              ${fLinks.map(link => `
                <a href="${link.href}" class="hover:text-white transition-colors">${link.label}</a>
              `).join('')}
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-white font-bold uppercase text-[11px] tracking-wider">HQ Ministry</div>
            <div class="text-slate-300 font-semibold">${settings.churchName || ''}</div>
            <div class="text-slate-400">${settings.churchAddress || ''}</div>
            ${settings.churchEmail ? `<div class="text-slate-400 font-mono text-[11px]">${settings.churchEmail}</div>` : ''}
            <a href="/admin" id="footer-admin-link" class="text-indigo-400 hover:underline pt-2 inline-block font-semibold">Admin CMS Portal (/admin)</a>
          </div>
        </div>

        <div class="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <div>${settings.copyright || '© 2026 HomeCell HQ'}</div>
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

function renderFullPageAdminLogin(state) {
  return `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative font-sans">
      <div class="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none"></div>

      <div class="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-8 space-y-6 z-10">
        <div class="flex items-center justify-between">
          <button id="admin-login-back-btn" class="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-semibold">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Website</span>
          </button>
          <span class="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">CMS Admin</span>
        </div>

        <div class="text-center space-y-3">
          <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto text-slate-950 font-bold text-3xl shadow-lg shadow-indigo-500/30">
            ✝
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white">HomeCell Admin Login</h1>
          <p class="text-xs text-slate-400">Manage Navbar Links, App Pictures, Screenshots, Section Copies & APK Binary Files</p>
        </div>

        <form id="form-admin-login" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300">Admin Email</label>
            <input id="admin-email" type="email" required value="admin@homecell.com" class="w-full glass-input p-3 rounded-xl text-xs bg-slate-950/60 border border-white/10 text-white" />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-slate-300">Password</label>
              <span class="text-[10px] text-indigo-400 font-mono">Default: Home.cell+123</span>
            </div>
            <input id="admin-pass" type="password" required value="Home.cell+123" class="w-full glass-input p-3 rounded-xl text-xs bg-slate-950/60 border border-white/10 text-white" />
          </div>

          <button type="submit" class="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-extrabold py-3.5 rounded-xl text-xs cursor-pointer shadow-lg hover:opacity-95 transition-all">
            Login to Admin Dashboard
          </button>

          <p class="text-[10px] text-slate-400 text-center italic">
            Default Password: <code class="text-indigo-300 font-mono">Home.cell+123</code> (or custom password)
          </p>
        </form>
      </div>
    </div>
  `;
}

function renderFullPageAdminCMS(state) {
  const { testimonials = [], spiritualTestimonies = [], settings = {}, features = [], faqs = [], screenshots = [] } = state;

  return `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      <!-- Top Header -->
      <header class="h-16 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md shadow-indigo-500/20">
            ${settings.logoIcon || '✝'}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-bold text-sm text-white">${settings.logoText || 'HomeCell'} Admin CMS</h1>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">🟢 Live Sync</span>
            </div>
            <p class="text-[11px] text-slate-400">Full-Page Management Portal for APKs, Pictures, Navbar & Copy</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button id="admin-view-site-btn" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-sm">open_in_new</span>
            <span>View Live Website</span>
          </button>
          <button id="admin-logout-btn" class="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-sm">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <!-- Main Admin Dashboard with Fixed Left Sidebar -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- Sidebar Navigation -->
        <aside class="w-64 bg-slate-900/60 border-r border-white/10 p-4 space-y-1 flex-shrink-0 overflow-y-auto">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">CMS Admin Dashboard</div>

          <button data-admin-tab="overview" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'overview' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">dashboard</span>
            <span>Dashboard Overview</span>
          </button>

          <button data-admin-tab="apk" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'apk' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">android</span>
            <span>APK & Web Link</span>
          </button>

          <button data-admin-tab="navbar" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'navbar' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">menu</span>
            <span>Navbar & Branding</span>
          </button>

          <button data-admin-tab="hero" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'hero' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">auto_awesome</span>
            <span>Hero & Background</span>
          </button>

          <button data-admin-tab="screenshots" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'screenshots' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">collections</span>
            <span>App Screenshots (${screenshots.length})</span>
          </button>

          <button data-admin-tab="sections_text" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'sections_text' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">edit_note</span>
            <span>Master Section Copy</span>
          </button>

          <button data-admin-tab="features" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'features' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">bolt</span>
            <span>Features (${features.length})</span>
          </button>

          <button data-admin-tab="faqs" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'faqs' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">quiz</span>
            <span>FAQs (${faqs.length})</span>
          </button>

          <button data-admin-tab="reviews" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'reviews' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">reviews</span>
            <div class="flex items-center justify-between w-full">
              <span>Reviews</span>
              ${testimonials.filter(t => t.status === 'pending').length > 0 ? `<span class="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">${testimonials.filter(t => t.status === 'pending').length}</span>` : ''}
            </div>
          </button>

          <button data-admin-tab="testimonies" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'testimonies' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">church</span>
            <div class="flex items-center justify-between w-full">
              <span>Testimonies (${spiritualTestimonies.length})</span>
              ${spiritualTestimonies.filter(st => st.status === 'pending').length > 0 ? `<span class="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">${spiritualTestimonies.filter(st => st.status === 'pending').length}</span>` : ''}
            </div>
          </button>

          <button data-admin-tab="footer" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'footer' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">line_weight</span>
            <span>Footer & Links</span>
          </button>

          <button data-admin-tab="settings" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeAdminTab === 'settings' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <span class="material-symbols-outlined text-lg">settings</span>
            <span>Church Settings</span>
          </button>
        </aside>

        <!-- Main Workspace Area -->
        <main class="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 bg-slate-950/40">
          ${renderAdminTabWorkspace(state, activeAdminTab)}
        </main>

      </div>
    </div>
  `;
}

function renderAdminTabWorkspace(state, tab) {
  const { hero = {}, downloadConfig = {}, testimonials = [], spiritualTestimonies = [], settings = {}, statistics = {}, sectionTitles = {}, features = [], faqs = [], screenshots = [], navbarLinks = [] } = state;
  const titles = sectionTitles || {};

  if (tab === 'overview') {
    return `
      <div class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-card p-5 rounded-2xl space-y-1">
            <div class="text-slate-400 text-xs">Total Downloads</div>
            <div class="text-3xl font-extrabold text-indigo-400">${statistics.totalDownloads || 0}</div>
          </div>
          <div class="glass-card p-5 rounded-2xl space-y-1">
            <div class="text-slate-400 text-xs">Active Cell Units</div>
            <div class="text-3xl font-extrabold text-cyan-400">${statistics.activeCells || 0}</div>
          </div>
          <div class="glass-card p-5 rounded-2xl space-y-1">
            <div class="text-slate-400 text-xs">Spiritual Testimonies</div>
            <div class="text-3xl font-extrabold text-rose-400">${spiritualTestimonies.length}</div>
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl space-y-3 border border-indigo-500/30 bg-indigo-950/20">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-indigo-400 text-lg">android</span>
              <h3 class="text-sm font-bold text-white">Official APK Binary File Status</h3>
            </div>
            ${downloadConfig.hasUploadedApk ? `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">✓ Permanent Binary Active</span>` : `<span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">Default Package Active</span>`}
          </div>
          <div class="text-slate-300 text-xs">
            Current File: <strong class="text-white">${downloadConfig.apkFileName || 'HomeCell-v2.4.0.apk'}</strong> (${downloadConfig.fileSize || '28.4 MB'})
          </div>
          <p class="text-slate-400 text-[11px]">
            When users click "Download APK", they download this exact binary file. Upload a replacement anytime under <strong>APK & Web Link</strong> tab.
          </p>
        </div>

        <div class="glass-card p-6 rounded-2xl space-y-3 border border-cyan-500/30 bg-cyan-950/20">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-cyan-400 text-lg">open_in_new</span>
              <h3 class="text-sm font-bold text-white">Live Web App Portal Link</h3>
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
      </div>
    `;
  }

  if (tab === 'apk') {
    return `
      <div class="space-y-8 max-w-3xl text-xs text-white">
        <!-- APK Upload Zone -->
        <div class="glass-card p-6 rounded-2xl space-y-4 border border-indigo-500/30">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-indigo-400">upload_file</span>
              <span>Upload Official Android Package (.apk File)</span>
            </h3>
            <p class="text-slate-400 text-xs">
              Upload the exact .apk binary file that all users download. Stored in IndexedDB / persistent state, <strong>never expires</strong> until replaced.
            </p>
          </div>

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
                <span>Saving .apk File to Storage...</span>
                <span>${apkUploadProgress}%</span>
              </div>
              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-200" style="width: ${apkUploadProgress}%"></div>
              </div>
            </div>
          ` : ''}

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

        <!-- Web App Link Settings -->
        <form id="form-cms-webapp-link" class="glass-card p-6 rounded-2xl space-y-4 border border-cyan-500/30">
          <div class="space-y-1 border-b border-white/10 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-cyan-400">link</span>
              <span>Web App Link & CTA Button</span>
            </h3>
            <p class="text-slate-400 text-xs">Configure the destination URL for the Web App portal button.</p>
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

        <!-- Release Details -->
        <form id="form-cms-apk" class="glass-card p-6 rounded-2xl space-y-4">
          <h3 class="text-sm font-bold text-white border-b border-white/10 pb-3">Release Info & Changelog</h3>

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
            <label for="cms-apk-maintenance" class="text-slate-300">Enable Maintenance Notice</label>
          </div>

          <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer">
            Save Release Details
          </button>
        </form>
      </div>
    `;
  }

  if (tab === 'navbar') {
    return `
      <div class="space-y-8 max-w-3xl text-xs text-white">
        <!-- Logo & Branding Form -->
        <form id="form-cms-branding" class="glass-card p-6 rounded-2xl space-y-4 border border-indigo-500/30">
          <div class="space-y-1 border-b border-white/10 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-indigo-400">palette</span>
              <span>Website Logo & Brand Customization</span>
            </h3>
            <p class="text-slate-400 text-xs">Admin can change logo text, logo symbol, or upload a custom logo image.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Logo Brand Text</label>
              <input id="cms-logo-text" type="text" required value="${settings.logoText || 'HomeCell'}" class="w-full glass-input p-3 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Logo Icon Symbol (Emoji/SVG Character)</label>
              <input id="cms-logo-icon" type="text" value="${settings.logoIcon || '✝'}" class="w-full glass-input p-3 rounded-xl text-xs" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-slate-300 font-semibold block">Logo Image (URL or Upload File)</label>
            <input id="cms-logo-image-url" type="text" value="${settings.logoImageUrl || ''}" placeholder="e.g. https://domain.com/logo.png" class="w-full glass-input p-3 rounded-xl text-xs font-mono" />
            
            <div class="flex items-center gap-3 pt-1">
              <label for="cms-logo-image-file" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">upload</span>
                <span>Upload Custom Logo Picture</span>
              </label>
              <input type="file" id="cms-logo-image-file" accept="image/*" class="hidden" />
              ${settings.logoImageUrl ? `<img src="${settings.logoImageUrl}" class="w-8 h-8 rounded-lg object-cover border border-white/20" />` : ''}
            </div>
          </div>

          <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer shadow-lg">
            Save Branding Configuration
          </button>
        </form>

        <!-- Navbar Links Manager -->
        <div class="glass-card p-6 rounded-2xl space-y-5 border border-white/10">
          <div class="space-y-1 border-b border-white/10 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-cyan-400">link</span>
              <span>Navbar Navigation Links Manager</span>
            </h3>
            <p class="text-slate-400 text-xs">Edit labels, target anchors/URLs, visibility, or delete/add navbar items.</p>
          </div>

          <!-- Existing Links List -->
          <form id="form-cms-navbar-links" class="space-y-3">
            ${navbarLinks.map(link => `
              <div class="glass-card p-3.5 rounded-xl flex items-center gap-3 border border-white/5">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="text" data-nav-label-id="${link.id}" value="${link.label}" placeholder="Label" class="glass-input p-2 rounded-lg text-xs" />
                  <input type="text" data-nav-href-id="${link.id}" value="${link.href}" placeholder="Target (e.g. #features)" class="glass-input p-2 rounded-lg text-xs font-mono" />
                </div>
                <div class="flex items-center gap-3">
                  <label class="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                    <input type="checkbox" data-nav-vis-id="${link.id}" ${link.isVisible !== false ? 'checked' : ''} class="rounded" />
                    <span>Show</span>
                  </label>
                  <button type="button" data-delete-nav-link="${link.id}" class="p-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 rounded-lg cursor-pointer">
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            `).join('')}

            <button type="submit" class="mt-2 bg-cyan-600 hover:bg-cyan-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer shadow-md">
              Save Navbar Links Changes
            </button>
          </form>

          <!-- Add New Navbar Link Form -->
          <form id="form-add-nav-link" class="pt-4 border-t border-white/10 space-y-3">
            <h4 class="font-bold text-xs text-indigo-300 uppercase tracking-wider">+ Add New Navbar Link</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input id="add-nav-label" type="text" required placeholder="Link Label (e.g. Media)" class="glass-input p-2.5 rounded-xl text-xs" />
              <input id="add-nav-href" type="text" required placeholder="Anchor / Target (e.g. #media)" class="glass-input p-2.5 rounded-xl text-xs font-mono" />
            </div>
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-4 py-2 rounded-xl text-white cursor-pointer">
              Add Link to Navbar
            </button>
          </form>
        </div>
      </div>
    `;
  }

  if (tab === 'hero') {
    return `
      <div class="space-y-8 max-w-3xl text-xs text-white">
        <!-- Hero Text & CTA Form -->
        <form id="form-cms-hero" class="glass-card p-6 rounded-2xl space-y-4">
          <h3 class="text-sm font-bold text-white border-b border-white/10 pb-2">Hero Section Copy & Action Buttons</h3>
          
          <div>
            <label class="text-slate-300 font-semibold block mb-1">Badge Announcement Text</label>
            <input id="cms-hero-badge" type="text" value="${hero.badgeText || ''}" class="w-full glass-input p-2.5 rounded-xl text-xs" />
          </div>

          <div>
            <label class="text-slate-300 font-semibold block mb-1">Main Hero Title</label>
            <input id="cms-hero-title" type="text" value="${hero.title || ''}" class="w-full glass-input p-2.5 rounded-xl text-xs" />
          </div>

          <div>
            <label class="text-slate-300 font-semibold block mb-1">Subtitle Description</label>
            <textarea id="cms-hero-subtitle" rows="3" class="w-full glass-input p-2.5 rounded-xl text-xs">${hero.subtitle || ''}</textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Primary CTA Text ("Download APK")</label>
              <input id="cms-hero-cta1" type="text" value="${hero.primaryCtaText || 'Download APK'}" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Secondary CTA Text ("Open Web App")</label>
              <input id="cms-hero-cta2" type="text" value="${hero.appButtonText || 'Open Web App'}" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
          </div>

          <!-- Hero Background Picture Customization -->
          <div class="space-y-3 pt-4 border-t border-white/10">
            <h4 class="font-bold text-xs text-indigo-300 uppercase tracking-wider">Hero Background Picture & Overlay</h4>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Background Image URL</label>
              <input id="cms-hero-bg-url" type="text" value="${hero.bgMediaUrl || ''}" placeholder="e.g. https://images.unsplash.com/photo-..." class="w-full glass-input p-2.5 rounded-xl text-xs font-mono" />
            </div>
            <div class="flex items-center gap-3">
              <label for="cms-hero-bg-file" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">image</span>
                <span>Upload Hero Background Image</span>
              </label>
              <input type="file" id="cms-hero-bg-file" accept="image/*" class="hidden" />
            </div>
          </div>

          <!-- Hero App Mockup Screenshot -->
          <div class="space-y-3 pt-4 border-t border-white/10">
            <h4 class="font-bold text-xs text-cyan-300 uppercase tracking-wider">Hero Phone Mockup Picture</h4>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Mockup Image URL</label>
              <input id="cms-hero-mockup-url" type="text" value="${hero.mockupImageUrl || ''}" placeholder="e.g. https://images.unsplash.com/photo-..." class="w-full glass-input p-2.5 rounded-xl text-xs font-mono" />
            </div>
            <div class="flex items-center gap-3">
              <label for="cms-hero-mockup-file" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">phone_iphone</span>
                <span>Upload Hero Mockup Picture</span>
              </label>
              <input type="file" id="cms-hero-mockup-file" accept="image/*" class="hidden" />
            </div>
          </div>

          <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer shadow-lg">
            Save Hero Copy & Picture Settings
          </button>
        </form>
      </div>
    `;
  }

  if (tab === 'screenshots') {
    return `
      <div class="space-y-8 max-w-4xl text-xs text-white">
        <!-- Add New Screenshot Form -->
        <form id="form-cms-add-screenshot" class="glass-card p-6 rounded-2xl space-y-4 border border-indigo-500/30">
          <div class="space-y-1 border-b border-white/10 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-indigo-400">add_photo_alternate</span>
              <span>Add New App Picture / Screenshot</span>
            </h3>
            <p class="text-slate-400 text-xs">Upload mobile/tablet screenshots or input picture URLs for the website gallery.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Picture Title *</label>
              <input id="cms-s-title" type="text" required placeholder="e.g. Attendance & Cell Logging" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Device Frame Type</label>
              <select id="cms-s-frame" class="w-full glass-input p-2.5 rounded-xl text-xs bg-slate-900 text-white">
                <option value="phone">📱 Mobile Phone Frame</option>
                <option value="tablet">📱 Tablet Frame</option>
                <option value="desktop">💻 Desktop / Web Dashboard Frame</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-slate-300 font-semibold block mb-1">Description / Caption</label>
            <textarea id="cms-s-caption" rows="2" placeholder="Explain what users see in this screenshot..." class="w-full glass-input p-2.5 rounded-xl text-xs"></textarea>
          </div>

          <div class="space-y-2">
            <label class="text-slate-300 font-semibold block">Picture Image (URL or File Upload)</label>
            <input id="cms-s-url" type="text" placeholder="https://images.unsplash.com/photo-..." class="w-full glass-input p-2.5 rounded-xl text-xs font-mono" />
            <div class="flex items-center gap-3">
              <label for="cms-s-file" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">upload_file</span>
                <span>Select & Upload Image File</span>
              </label>
              <input type="file" id="cms-s-file" accept="image/*" class="hidden" />
              <span id="cms-s-file-name" class="text-slate-400 text-[11px] italic">No file selected</span>
            </div>
          </div>

          <button type="submit" class="bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow-lg hover:opacity-95 transition-all">
            + Save & Add Screenshot to Website
          </button>
        </form>

        <!-- Existing Screenshots Gallery -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-cyan-400">collections</span>
            <span>Existing App Pictures & Screenshots (${screenshots.length})</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${screenshots.map(s => `
              <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
                <div class="space-y-3">
                  <div class="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center">
                    <img src="${s.url}" alt="${s.title}" class="w-full h-full object-cover" />
                    <span class="absolute top-2 right-2 px-2 py-1 rounded-full bg-slate-950/80 text-cyan-300 text-[10px] font-bold border border-white/10 uppercase">${s.frame}</span>
                  </div>

                  <div class="space-y-2">
                    <input type="text" data-edit-s-title="${s.id}" value="${s.title}" class="w-full glass-input p-2 rounded-lg text-xs font-bold" />
                    <textarea data-edit-s-caption="${s.id}" rows="2" class="w-full glass-input p-2 rounded-lg text-xs">${s.caption || ''}</textarea>
                    
                    <div class="flex items-center justify-between text-[11px]">
                      <select data-edit-s-frame="${s.id}" class="glass-input p-1.5 rounded-lg bg-slate-900 text-white">
                        <option value="phone" ${s.frame === 'phone' ? 'selected' : ''}>Mobile Phone</option>
                        <option value="tablet" ${s.frame === 'tablet' ? 'selected' : ''}>Tablet</option>
                        <option value="desktop" ${s.frame === 'desktop' ? 'selected' : ''}>Desktop</option>
                      </select>

                      <label class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg cursor-pointer flex items-center gap-1 font-semibold">
                        <span class="material-symbols-outlined text-xs">upload</span>
                        <span>Replace Image</span>
                        <input type="file" data-upload-s-image="${s.id}" accept="image/*" class="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-white/10">
                  <button type="button" data-save-s="${s.id}" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white text-xs cursor-pointer">
                    Save Changes
                  </button>
                  <button type="button" data-delete-screenshot="${s.id}" class="px-3 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 rounded-xl text-xs font-bold cursor-pointer">
                    Delete
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  if (tab === 'sections_text') {
    return `
      <form id="form-cms-sections-text" class="space-y-8 max-w-3xl text-xs text-white">
        <div class="space-y-1 border-b border-white/10 pb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-indigo-400">edit_note</span>
            <span>Website Master Section Text Editor</span>
          </h3>
          <p class="text-slate-400 text-xs">Admin can modify any section header, badge, or subtitle on the website from here.</p>
        </div>

        <div class="glass-card p-5 rounded-2xl space-y-3">
          <h4 class="font-bold text-indigo-300 text-xs uppercase tracking-wider">Features Section</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Badge Text</label>
              <input id="cms-st-featuresBadge" type="text" value="${titles.featuresBadge || 'Platform Capabilities'}" class="w-full glass-input p-2.5 rounded-xl" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Main Section Title</label>
              <input id="cms-st-featuresTitle" type="text" value="${titles.featuresTitle || 'Built for Cell Group Excellence'}" class="w-full glass-input p-2.5 rounded-xl" />
            </div>
          </div>
          <div>
            <label class="text-slate-300 font-semibold block mb-1">Subtitle Description</label>
            <textarea id="cms-st-featuresSubtitle" rows="2" class="w-full glass-input p-2.5 rounded-xl">${titles.featuresSubtitle || ''}</textarea>
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl space-y-3">
          <h4 class="font-bold text-cyan-300 text-xs uppercase tracking-wider">Screenshots Section</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Badge Text</label>
              <input id="cms-st-screenshotsBadge" type="text" value="${titles.screenshotsBadge || 'App Experience'}" class="w-full glass-input p-2.5 rounded-xl" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Main Section Title</label>
              <input id="cms-st-screenshotsTitle" type="text" value="${titles.screenshotsTitle || 'Designed for Simplicity & Depth'}" class="w-full glass-input p-2.5 rounded-xl" />
            </div>
          </div>
          <div>
            <label class="text-slate-300 font-semibold block mb-1">Subtitle Description</label>
            <textarea id="cms-st-screenshotsSubtitle" rows="2" class="w-full glass-input p-2.5 rounded-xl">${titles.screenshotsSubtitle || ''}</textarea>
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl space-y-3">
          <h4 class="font-bold text-violet-300 text-xs uppercase tracking-wider">Kingdom Mission / About Section</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Badge Text</label>
              <input id="cms-st-aboutBadge" type="text" value="${titles.aboutBadge || 'Kingdom Mission'}" class="w-full glass-input p-2.5 rounded-xl" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Main Section Title</label>
              <input id="cms-st-aboutTitle" type="text" value="${titles.aboutTitle || 'Empowering the Local Church'}" class="w-full glass-input p-2.5 rounded-xl" />
            </div>
          </div>
          <div>
            <label class="text-slate-300 font-semibold block mb-1">Main Paragraph Copy</label>
            <textarea id="cms-st-aboutParagraph1" rows="2" class="w-full glass-input p-2.5 rounded-xl">${titles.aboutParagraph1 || settings.footerText}</textarea>
          </div>
        </div>

        <button type="submit" class="bg-gradient-to-r from-indigo-500 to-cyan-400 hover:opacity-90 font-bold px-8 py-3 rounded-xl text-slate-950 cursor-pointer shadow-xl text-xs">
          Save All Website Section Text
        </button>
      </form>
    `;
  }

  if (tab === 'features') {
    return `
      <div class="space-y-6 max-w-3xl text-xs text-white">
        <form id="form-cms-add-feature" class="glass-card p-5 rounded-2xl space-y-3">
          <h4 class="font-bold text-white text-xs">+ Add New Feature Item</h4>
          <div class="grid grid-cols-2 gap-3">
            <input id="cms-f-title" type="text" required placeholder="Feature Title" class="glass-input p-2.5 rounded-xl" />
            <input id="cms-f-cat" type="text" required placeholder="Category" class="glass-input p-2.5 rounded-xl" />
          </div>
          <textarea id="cms-f-desc" required rows="2" placeholder="Description..." class="w-full glass-input p-2.5 rounded-xl"></textarea>
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-4 py-2 rounded-xl text-white cursor-pointer">Add Feature</button>
        </form>

        <div class="space-y-3">
          <h4 class="font-bold text-white text-xs">Existing Features (${features.length})</h4>
          ${features.map(f => `
            <div class="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <span class="font-bold text-white">${f.title}</span> <span class="text-indigo-400 text-[10px]">(${f.category})</span>
                <p class="text-slate-400 text-[11px]">${f.description}</p>
              </div>
              <button data-delete-feature="${f.id}" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold">Delete</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (tab === 'faqs') {
    return `
      <div class="space-y-6 max-w-3xl text-xs text-white">
        <form id="form-cms-add-faq" class="glass-card p-5 rounded-2xl space-y-3">
          <h4 class="font-bold text-white text-xs">+ Add New FAQ Item</h4>
          <input id="cms-faq-q" type="text" required placeholder="Question" class="w-full glass-input p-2.5 rounded-xl" />
          <textarea id="cms-faq-a" required rows="3" placeholder="Answer..." class="w-full glass-input p-2.5 rounded-xl"></textarea>
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-4 py-2 rounded-xl text-white cursor-pointer">Add FAQ</button>
        </form>

        <div class="space-y-3">
          <h4 class="font-bold text-white text-xs">Existing FAQs (${faqs.length})</h4>
          ${faqs.map(faq => `
            <div class="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <div class="font-bold text-white">${faq.question}</div>
                <p class="text-slate-400 text-[11px]">${faq.answer}</p>
              </div>
              <button data-delete-faq="${faq.id}" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold">Delete</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (tab === 'reviews') {
    return `
      <div class="space-y-4 text-xs text-white">
        <h3 class="font-bold text-sm text-white">App Reviews Moderation</h3>
        <div class="space-y-3">
          ${testimonials.map(t => `
            <div class="glass-card p-4 rounded-2xl flex items-center justify-between gap-4">
              <div class="space-y-1">
                <span class="font-bold text-white">${t.name}</span> <span class="text-slate-400">(${t.church})</span>
                <p class="text-slate-300 italic">"${t.review}"</p>
              </div>
              <div class="flex items-center gap-2">
                ${t.status === 'pending' ? `<button data-approve-review="${t.id}" class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold">Approve</button>` : ''}
                <button data-delete-review="${t.id}" class="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold">Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (tab === 'testimonies') {
    return `
      <div class="space-y-8 max-w-4xl text-xs text-white">
        <!-- Add New Testimony Form -->
        <form id="form-cms-add-testimony" class="glass-card p-6 rounded-2xl space-y-4 border border-rose-500/30">
          <div class="space-y-1 border-b border-white/10 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-rose-400">church</span>
              <span>Add New Spiritual Testimony</span>
            </h3>
            <p class="text-slate-400 text-xs">Admin can manually post new testimonies or edit existing user testimonies.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Testimony Title *</label>
              <input id="cms-t-title" type="text" required placeholder="e.g. Healed of Chronic Pain" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Category *</label>
              <select id="cms-t-category" class="w-full glass-input p-2.5 rounded-xl text-xs bg-slate-900 text-white">
                <option value="Healing">Healing & Divine Health</option>
                <option value="Salvation">Salvation & New Life</option>
                <option value="Provision">Financial & Work Provision</option>
                <option value="Family">Family Restoration</option>
                <option value="Prayer Answered">Answered Prayer</option>
                <option value="Spiritual Growth">Spiritual Growth</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Author Name</label>
              <input id="cms-t-name" type="text" placeholder="e.g. Brother Emmanuel" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Cell Group / Church</label>
              <input id="cms-t-church" type="text" placeholder="e.g. Grace Fellowship Cell #4" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Initial Status</label>
              <select id="cms-t-status" class="w-full glass-input p-2.5 rounded-xl text-xs bg-slate-900 text-white">
                <option value="approved">Approved (Live Immediately)</option>
                <option value="pending">Pending Review</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-slate-300 font-semibold block mb-1">Full Testimony Story *</label>
            <textarea id="cms-t-story" required rows="4" placeholder="Type the miracle or spiritual testimony story here..." class="w-full glass-input p-2.5 rounded-xl text-xs leading-relaxed"></textarea>
          </div>

          <button type="submit" class="bg-rose-600 hover:bg-rose-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer shadow-lg">
            Add Testimony to Website
          </button>
        </form>

        <!-- Existing Testimonies CRUD Manager -->
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 class="font-bold text-sm text-white">Manage & Edit Testimonies (${spiritualTestimonies.length})</h3>
            <span class="text-slate-400 text-xs">${spiritualTestimonies.filter(st => st.status === 'pending').length} Pending Approval</span>
          </div>

          <div class="space-y-4">
            ${spiritualTestimonies.map(st => `
              <div class="glass-card p-5 rounded-2xl space-y-4 border ${st.status === 'pending' ? 'border-amber-500/40 bg-amber-950/10' : 'border-white/10'}">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${st.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                      ${st.status === 'approved' ? '✓ Approved' : '⏳ Pending Review'}
                    </span>
                    <span class="text-slate-400 text-[10px]">${st.createdAt ? new Date(st.createdAt).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    ${st.status === 'pending' ? `
                      <button data-approve-testimony="${st.id}" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer">
                        Approve
                      </button>
                    ` : ''}
                    <button data-save-testimony="${st.id}" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer">
                      Save Edits
                    </button>
                    <button data-delete-testimony="${st.id}" class="px-3 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-200 rounded-lg text-xs font-bold cursor-pointer">
                      Delete
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-slate-400 text-[10px] font-semibold block mb-1">Title</label>
                    <input type="text" data-t-edit-title="${st.id}" value="${st.title || ''}" class="w-full glass-input p-2 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label class="text-slate-400 text-[10px] font-semibold block mb-1">Category</label>
                    <input type="text" data-t-edit-cat="${st.id}" value="${st.category || 'General'}" class="w-full glass-input p-2 rounded-lg text-xs" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-slate-400 text-[10px] font-semibold block mb-1">Author Name</label>
                    <input type="text" data-t-edit-name="${st.id}" value="${st.name || ''}" class="w-full glass-input p-2 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label class="text-slate-400 text-[10px] font-semibold block mb-1">Church / Cell Group</label>
                    <input type="text" data-t-edit-church="${st.id}" value="${st.church || ''}" class="w-full glass-input p-2 rounded-lg text-xs" />
                  </div>
                </div>

                <div>
                  <label class="text-slate-400 text-[10px] font-semibold block mb-1">Story Content</label>
                  <textarea data-t-edit-story="${st.id}" rows="3" class="w-full glass-input p-2 rounded-lg text-xs font-sans leading-relaxed">${st.story || ''}</textarea>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  if (tab === 'footer') {
    const fLinks = settings.footerLinks || [];
    return `
      <div class="space-y-8 max-w-3xl text-xs text-white">
        <!-- Footer Description & Church HQ Info Form -->
        <form id="form-cms-footer-text-settings" class="glass-card p-6 rounded-2xl space-y-4 border border-indigo-500/30">
          <div class="space-y-1 border-b border-white/10 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-indigo-400">description</span>
              <span>Footer Text Copy & Church HQ Settings</span>
            </h3>
            <p class="text-slate-400 text-xs">Edit the footer text, copyright notice, and church contact info displayed at the bottom of the website.</p>
          </div>

          <div>
            <label class="text-slate-300 font-semibold block mb-1">Footer Description Text</label>
            <textarea id="cms-footer-desc" rows="3" class="w-full glass-input p-2.5 rounded-xl text-xs">${settings.footerText || ''}</textarea>
          </div>

          <div>
            <label class="text-slate-300 font-semibold block mb-1">Footer Copyright Notice</label>
            <input id="cms-footer-copyright" type="text" value="${settings.copyright || ''}" class="w-full glass-input p-2.5 rounded-xl text-xs" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">HQ Church Name</label>
              <input id="cms-footer-church-name" type="text" value="${settings.churchName || ''}" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">HQ Church Email</label>
              <input id="cms-footer-church-email" type="email" value="${settings.churchEmail || ''}" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">HQ Phone Number</label>
              <input id="cms-footer-church-phone" type="text" value="${settings.churchPhone || ''}" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">HQ Address</label>
              <input id="cms-footer-church-address" type="text" value="${settings.churchAddress || ''}" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
          </div>

          <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer shadow-lg">
            Save Footer Copy & HQ Info
          </button>
        </form>

        <!-- Footer Links Manager -->
        <div class="glass-card p-6 rounded-2xl space-y-5 border border-white/10">
          <div class="space-y-1 border-b border-white/10 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-cyan-400">link</span>
              <span>Footer Quick Links Manager</span>
            </h3>
            <p class="text-slate-400 text-xs">Edit, add, or delete quick links displayed in the website footer.</p>
          </div>

          <form id="form-cms-footer-links" class="space-y-3">
            ${fLinks.map(link => `
              <div class="glass-card p-3 rounded-xl flex items-center gap-3 border border-white/5">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="text" data-fl-label-id="${link.id}" value="${link.label}" placeholder="Link Label" class="glass-input p-2 rounded-lg text-xs" />
                  <input type="text" data-fl-href-id="${link.id}" value="${link.href}" placeholder="Target Anchor/URL (e.g. #features)" class="glass-input p-2 rounded-lg text-xs font-mono" />
                </div>
                <button type="button" data-delete-footer-link="${link.id}" class="p-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 rounded-lg cursor-pointer">
                  <span class="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            `).join('')}

            <button type="submit" class="mt-2 bg-cyan-600 hover:bg-cyan-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer shadow-md">
              Save Footer Links Changes
            </button>
          </form>

          <!-- Add New Footer Link Form -->
          <form id="form-add-footer-link" class="pt-4 border-t border-white/10 space-y-3">
            <h4 class="font-bold text-xs text-indigo-300 uppercase tracking-wider">+ Add New Footer Link</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input id="add-footer-label" type="text" required placeholder="Link Label (e.g. Prayer Requests)" class="glass-input p-2.5 rounded-xl text-xs" />
              <input id="add-footer-href" type="text" required placeholder="Anchor / URL (e.g. #prayer)" class="glass-input p-2.5 rounded-xl text-xs font-mono" />
            </div>
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-4 py-2 rounded-xl text-white cursor-pointer">
              Add Link to Footer
            </button>
          </form>
        </div>
      </div>
    `;
  }

  if (tab === 'settings') {
    return `
      <div class="space-y-8 max-w-2xl text-xs text-white">
        <form id="form-cms-settings" class="space-y-4">
          <h3 class="text-sm font-bold text-white border-b border-white/10 pb-2">Church Configuration</h3>
          <div>
            <label class="text-slate-300 font-semibold block mb-1">Church / Network Name</label>
            <input id="cms-church-name" type="text" value="${settings.churchName || ''}" class="w-full glass-input p-2.5 rounded-xl" />
          </div>
          <div>
            <label class="text-slate-300 font-semibold block mb-1">Church Email</label>
            <input id="cms-church-email" type="text" value="${settings.churchEmail || ''}" class="w-full glass-input p-2.5 rounded-xl" />
          </div>
          <div>
            <label class="text-slate-300 font-semibold block mb-1">Footer Copy</label>
            <textarea id="cms-footer-text" rows="3" class="w-full glass-input p-2.5 rounded-xl">${settings.footerText || ''}</textarea>
          </div>
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-2.5 rounded-xl text-white cursor-pointer">Save Settings</button>
        </form>

        <form id="form-cms-password" class="space-y-4 pt-6 border-t border-white/10">
          <h3 class="text-sm font-bold text-white">Change Admin Password</h3>
          <div>
            <label class="text-slate-300 font-semibold block mb-1">Current Password</label>
            <input id="cms-pass-current" type="password" required class="w-full glass-input p-2.5 rounded-xl text-xs" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">New Password</label>
              <input id="cms-pass-new" type="password" required minlength="6" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Confirm Password</label>
              <input id="cms-pass-confirm" type="password" required minlength="6" class="w-full glass-input p-2.5 rounded-xl text-xs" />
            </div>
          </div>
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-2.5 rounded-xl text-xs">Update Password</button>
        </form>
      </div>
    `;
  }

  return '';
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

  const adminBackBtn = container.querySelector('#admin-login-back-btn');
  if (adminBackBtn) {
    adminBackBtn.onclick = () => {
      window.history.pushState({}, '', '/');
      checkRoute();
    };
  }

  const adminViewSiteBtn = container.querySelector('#admin-view-site-btn');
  if (adminViewSiteBtn) {
    adminViewSiteBtn.onclick = () => {
      window.history.pushState({}, '', '/');
      checkRoute();
    };
  }

  // Logo & Branding Form Submission
  const formBranding = container.querySelector('#form-cms-branding');
  if (formBranding) {
    formBranding.onsubmit = (e) => {
      e.preventDefault();
      const logoText = container.querySelector('#cms-logo-text').value;
      const logoIcon = container.querySelector('#cms-logo-icon').value;
      const logoImageUrl = container.querySelector('#cms-logo-image-url').value;

      store.updateCMS({
        settings: {
          ...store.state.settings,
          logoText,
          logoIcon,
          logoImageUrl
        }
      });
      alert('Logo & Branding Updated Successfully!');
    };
  }

  const logoFileSelect = container.querySelector('#cms-logo-image-file');
  if (logoFileSelect) {
    logoFileSelect.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          store.updateCMS({
            settings: {
              ...store.state.settings,
              logoImageUrl: evt.target.result
            }
          });
          alert('Custom logo image uploaded!');
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // Navbar Links Form Submission & CRUD
  const formNavbarLinks = container.querySelector('#form-cms-navbar-links');
  if (formNavbarLinks) {
    formNavbarLinks.onsubmit = (e) => {
      e.preventDefault();
      const currentLinks = store.state.navbarLinks || [];
      const updatedLinks = currentLinks.map(link => {
        const labelInput = container.querySelector(`[data-nav-label-id="${link.id}"]`);
        const hrefInput = container.querySelector(`[data-nav-href-id="${link.id}"]`);
        const visInput = container.querySelector(`[data-nav-vis-id="${link.id}"]`);
        return {
          ...link,
          label: labelInput ? labelInput.value : link.label,
          href: hrefInput ? hrefInput.value : link.href,
          isVisible: visInput ? visInput.checked : link.isVisible
        };
      });
      store.updateNavbarLinks(updatedLinks);
      alert('Navbar navigation links updated!');
    };
  }

  const formAddNavLink = container.querySelector('#form-add-nav-link');
  if (formAddNavLink) {
    formAddNavLink.onsubmit = (e) => {
      e.preventDefault();
      const label = container.querySelector('#add-nav-label').value;
      const href = container.querySelector('#add-nav-href').value;
      store.addNavbarLink({ label, href });
      formAddNavLink.reset();
      alert(`Navbar link "${label}" added!`);
    };
  }

  container.querySelectorAll('[data-delete-nav-link]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-delete-nav-link');
      if (confirm('Delete this navbar link?')) {
        store.deleteNavbarLink(id);
      }
    };
  });

  // Hero Image Uploaders
  const heroBgFileSelect = container.querySelector('#cms-hero-bg-file');
  if (heroBgFileSelect) {
    heroBgFileSelect.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          store.updateCMS({
            hero: { ...store.state.hero, bgMediaUrl: evt.target.result }
          });
          alert('Hero Background picture updated!');
        };
        reader.readAsDataURL(file);
      }
    };
  }

  const heroMockupFileSelect = container.querySelector('#cms-hero-mockup-file');
  if (heroMockupFileSelect) {
    heroMockupFileSelect.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          store.updateCMS({
            hero: { ...store.state.hero, mockupImageUrl: evt.target.result }
          });
          alert('Hero mockup picture updated!');
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // Add Screenshot Form & File Upload
  let pendingScreenshotFile = null;
  const sFileInput = container.querySelector('#cms-s-file');
  if (sFileInput) {
    sFileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        pendingScreenshotFile = e.target.files[0];
        const nameEl = container.querySelector('#cms-s-file-name');
        if (nameEl) nameEl.textContent = pendingScreenshotFile.name;
      }
    };
  }

  const formAddScreenshot = container.querySelector('#form-cms-add-screenshot');
  if (formAddScreenshot) {
    formAddScreenshot.onsubmit = (e) => {
      e.preventDefault();
      const title = container.querySelector('#cms-s-title').value;
      const frame = container.querySelector('#cms-s-frame').value;
      const caption = container.querySelector('#cms-s-caption').value;
      let url = container.querySelector('#cms-s-url').value;

      const processAdd = (imgUrl) => {
        store.addScreenshot({ title, frame, caption, url: imgUrl || 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80' });
        alert(`Screenshot "${title}" added to gallery!`);
        pendingScreenshotFile = null;
        formAddScreenshot.reset();
        const nameEl = container.querySelector('#cms-s-file-name');
        if (nameEl) nameEl.textContent = 'No file selected';
      };

      if (pendingScreenshotFile) {
        const reader = new FileReader();
        reader.onload = (evt) => processAdd(evt.target.result);
        reader.readAsDataURL(pendingScreenshotFile);
      } else {
        processAdd(url);
      }
    };
  }

  // Edit/Delete Existing Screenshots
  container.querySelectorAll('[data-save-s]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-save-s');
      const titleEl = container.querySelector(`[data-edit-s-title="${id}"]`);
      const captionEl = container.querySelector(`[data-edit-s-caption="${id}"]`);
      const frameEl = container.querySelector(`[data-edit-s-frame="${id}"]`);

      store.updateScreenshot(id, {
        title: titleEl ? titleEl.value : '',
        caption: captionEl ? captionEl.value : '',
        frame: frameEl ? frameEl.value : 'phone'
      });
      alert('Screenshot updated!');
    };
  });

  container.querySelectorAll('[data-delete-screenshot]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-delete-screenshot');
      if (confirm('Delete this app picture screenshot?')) {
        store.deleteScreenshot(id);
      }
    };
  });

  container.querySelectorAll('[data-upload-s-image]').forEach(input => {
    input.onchange = (e) => {
      const id = input.getAttribute('data-upload-s-image');
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          store.updateScreenshot(id, { url: evt.target.result });
          alert('Screenshot picture replaced!');
        };
        reader.readAsDataURL(file);
      }
    };
  });

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
          appButtonText: container.querySelector('#cms-hero-cta2').value,
          bgMediaUrl: container.querySelector('#cms-hero-bg-url')?.value || '',
          mockupImageUrl: container.querySelector('#cms-hero-mockup-url')?.value || ''
        }
      });
      alert('Hero Copy & Pictures Updated!');
    };
  }

  // Admin Add Testimony Form
  const formAddTestimony = container.querySelector('#form-cms-add-testimony');
  if (formAddTestimony) {
    formAddTestimony.onsubmit = (e) => {
      e.preventDefault();
      const title = container.querySelector('#cms-t-title').value;
      const category = container.querySelector('#cms-t-category').value;
      const name = container.querySelector('#cms-t-name').value || 'Anonymous';
      const church = container.querySelector('#cms-t-church').value || 'HomeCell Group';
      const status = container.querySelector('#cms-t-status').value;
      const story = container.querySelector('#cms-t-story').value;

      store.addSpiritualTestimony({
        title,
        category,
        name,
        church,
        status,
        story
      });
      alert(`Spiritual Testimony "${title}" added!`);
    };
  }

  // Save Testimony Edits
  container.querySelectorAll('[data-save-testimony]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-save-testimony');
      const title = container.querySelector(`[data-t-edit-title="${id}"]`)?.value;
      const category = container.querySelector(`[data-t-edit-cat="${id}"]`)?.value;
      const name = container.querySelector(`[data-t-edit-name="${id}"]`)?.value;
      const church = container.querySelector(`[data-t-edit-church="${id}"]`)?.value;
      const story = container.querySelector(`[data-t-edit-story="${id}"]`)?.value;

      store.updateSpiritualTestimony(id, { title, category, name, church, story });
      alert('Testimony updated!');
    };
  });

  // Footer Text & HQ Settings Form
  const formFooterTextSettings = container.querySelector('#form-cms-footer-text-settings');
  if (formFooterTextSettings) {
    formFooterTextSettings.onsubmit = (e) => {
      e.preventDefault();
      const footerText = container.querySelector('#cms-footer-desc').value;
      const copyright = container.querySelector('#cms-footer-copyright').value;
      const churchName = container.querySelector('#cms-footer-church-name').value;
      const churchEmail = container.querySelector('#cms-footer-church-email').value;
      const churchPhone = container.querySelector('#cms-footer-church-phone').value;
      const churchAddress = container.querySelector('#cms-footer-church-address').value;

      store.updateCMS({
        settings: {
          ...store.state.settings,
          footerText,
          copyright,
          churchName,
          churchEmail,
          churchPhone,
          churchAddress
        }
      });
      alert('Footer Copy & Church HQ Info Saved!');
    };
  }

  // Footer Links CRUD Form
  const formFooterLinks = container.querySelector('#form-cms-footer-links');
  if (formFooterLinks) {
    formFooterLinks.onsubmit = (e) => {
      e.preventDefault();
      const currentLinks = store.state.settings?.footerLinks || [];
      const updatedLinks = currentLinks.map(link => {
        const labelInput = container.querySelector(`[data-fl-label-id="${link.id}"]`);
        const hrefInput = container.querySelector(`[data-fl-href-id="${link.id}"]`);
        return {
          ...link,
          label: labelInput ? labelInput.value : link.label,
          href: hrefInput ? hrefInput.value : link.href
        };
      });
      store.updateCMS({
        settings: {
          ...store.state.settings,
          footerLinks: updatedLinks
        }
      });
      alert('Footer quick links updated!');
    };
  }

  const formAddFooterLink = container.querySelector('#form-add-footer-link');
  if (formAddFooterLink) {
    formAddFooterLink.onsubmit = (e) => {
      e.preventDefault();
      const label = container.querySelector('#add-footer-label').value;
      const href = container.querySelector('#add-footer-href').value;
      store.addFooterLink({ label, href });
      formAddFooterLink.reset();
      alert(`Footer link "${label}" added!`);
    };
  }

  container.querySelectorAll('[data-delete-footer-link]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-delete-footer-link');
      if (confirm('Delete this footer link?')) {
        store.deleteFooterLink(id);
      }
    };
  });

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
