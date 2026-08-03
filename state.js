// State Store for HomeCell CMS
import { subscribeToCMSData, saveCMSConfigToFirestore } from './firebase.js';

// IndexedDB storage helper for large uploaded files like APKs (never expires)
const DB_NAME = 'HomeCellDB';
const STORE_NAME = 'files';

function openFileDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function saveUploadedFileToIDB(key, fileBlob) {
  try {
    const db = await openFileDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(fileBlob, key);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('IDB Save error:', err);
    return false;
  }
}

export async function getUploadedFileFromIDB(key) {
  try {
    const db = await openFileDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('IDB Get error:', err);
    return null;
  }
}

export async function deleteUploadedFileFromIDB(key) {
  try {
    const db = await openFileDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('IDB Delete error:', err);
    return false;
  }
}

const DEFAULT_STATE = {
  hero: {
    title: 'Digital space for Spiritual Growth',
    subtitle: 'The all-in-one platform for Christian cell groups. Manage members, track growth, and share testimonies in a secure, church-aligned environment.',
    badgeText: 'v2.4.0 Now Available',
    primaryCtaText: 'Download APK',
    appButtonText: 'Open Web App',
    appButtonUrl: 'https://homecell.web.app/app',
    isAppButtonVisible: true,
    bgType: 'gradient',
    bgMediaUrl: '',
    overlayOpacity: 0.1
  },
  downloadConfig: {
    latestVersion: 'v2.4.0',
    fileSize: '28.4 MB',
    minAndroidVersion: 'Android 7.0+',
    releaseDate: 'Aug 2026',
    apkFileName: 'HomeCell-v2.4.0.apk',
    releaseNotes: '• Introduced real-time offline fellowship attendance reporting.\n• Enhanced prayer request sharing with group push notifications.\n• Offline Bible study guides with multi-translation support.\n• Security hardening & zero data retention guarantees.',
    downloadMethod: 'uploaded_file',
    externalApkUrl: '',
    apkFileDataUrl: '',
    uploadedAt: '',
    uploadedFileName: '',
    hasUploadedApk: false,
    isDownloadEnabled: true,
    isMaintenanceActive: false,
    maintenanceNotice: 'APK downloads are temporarily paused for routine database index upgrades. Please check back in a few minutes.'
  },
  sectionTitles: {
    featuresBadge: 'Platform Capabilities',
    featuresTitle: 'Built for Cell Group Excellence',
    featuresSubtitle: 'Everything your church fellowship needs: attendance logging, prayer sharing, sermon outlines, and pastoral insights.',
    screenshotsBadge: 'App Experience',
    screenshotsTitle: 'Designed for Simplicity & Depth',
    screenshotsSubtitle: 'Take a visual tour of HomeCell mobile app screens and pastoral analytics dashboards.',
    aboutBadge: 'Kingdom Mission',
    aboutTitle: 'Empowering the Local Church for Genuine Fellowship',
    aboutParagraph1: 'Empowering local churches and cell groups with modern digital tools for discipleship, prayer, attendance tracking, and spiritual growth.',
    missionTitle: 'Our Mission',
    missionText: 'Equip local churches with accessible tools that strengthen fellowship, accelerate discipleship, and care for believers.',
    visionTitle: 'Our Vision',
    visionText: 'To see vibrant, multiplying home cells in every neighborhood across the world, supported by technology that serves the Spirit.',
    testimonialsBadge: 'User Experiences',
    testimonialsTitle: 'Loved by Pastors & Cell Leaders',
    testimoniesBadge: 'Spiritual Testimonies',
    testimoniesTitle: 'Glorifying God for Miracles & Growth',
    testimoniesSubtitle: 'Read inspiring stories of healing, family restoration, and spiritual breakthroughs shared by HomeCell members.',
    faqBadge: 'Frequently Asked Questions',
    faqTitle: 'Everything You Need To Know',
    ctaBadge: 'Join Thousands of Churches',
    ctaTitle: 'Ready to Transform Your Cell Ministry?',
    ctaSubtitle: 'Download the official HomeCell Android package today or launch the Web App portal.'
  },
  statistics: {
    totalDownloads: 12480,
    activeCells: 850,
    membersReached: 28500,
    prayersShared: 84300,
    userRating: 4.9,
    countriesRepresented: 34
  },
  features: [
    {
      id: 'f1',
      title: 'Member & Fellowship Directory',
      description: 'Keep structured records of cell members, emergency contact details, spiritual milestone dates, and active leadership assignments.',
      category: 'Cell Management',
      icon: 'Users'
    },
    {
      id: 'f2',
      title: 'Offline Attendance Tracking',
      description: 'Log weekly fellowship attendance without internet connectivity. Auto-syncs to church HQ when network access is restored.',
      category: 'Reporting',
      icon: 'CheckCircle2'
    },
    {
      id: 'f3',
      title: 'Prayer Wall & Requests',
      description: 'Share prayer burdens securely with cell members. Send praises, updates, and answered prayer notifications instantly.',
      category: 'Community',
      icon: 'HeartHandshake'
    },
    {
      id: 'f4',
      title: 'Digital Bible & Outlines',
      description: 'Access weekly cell discussion guides, Bible verses, study questions, and sermon outlines directly within the application.',
      category: 'Discipleship',
      icon: 'BookOpen'
    },
    {
      id: 'f5',
      title: 'Pastoral Growth Dashboard',
      description: 'Real-time charts and analytics for pastors to track cell health, multiplication progress, and attendance trends.',
      category: 'Analytics',
      icon: 'BarChart3'
    },
    {
      id: 'f6',
      title: 'Zero-Data Loss Offline Storage',
      description: 'All local edits are encrypted and stored safely on device storage, ensuring uninterrupted cell meetings anywhere.',
      category: 'Security',
      icon: 'WifiOff'
    }
  ],
  screenshots: [
    {
      id: 's1',
      title: 'Cell Home Screen',
      caption: 'Main fellowship dashboard showing active prayer needs, member list, and upcoming cell meeting timer.',
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      deviceFrame: 'phone'
    },
    {
      id: 's2',
      title: 'Attendance Marker',
      caption: 'One-tap attendance marking interface for cell leaders with automatic count calculation.',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      deviceFrame: 'phone'
    },
    {
      id: 's3',
      title: 'Prayer Request Wall',
      caption: 'Real-time community prayer feed with interactive "I am praying" counter.',
      imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
      deviceFrame: 'phone'
    },
    {
      id: 's4',
      title: 'Pastoral Analytics Tablet View',
      caption: 'Comprehensive dashboard showing fellowship multiplication rates and zone summaries.',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      deviceFrame: 'tablet'
    },
    {
      id: 's5',
      title: 'Desktop Admin Portal',
      caption: 'Web CMS interface for managing APK releases, testimony approvals, and church settings.',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      deviceFrame: 'desktop'
    }
  ],
  testimonials: [
    {
      id: 't1',
      name: 'Pastor David Okafor',
      church: 'Redeemed Grace Chapel',
      city: 'Lagos',
      country: 'Nigeria',
      rating: 5,
      title: 'Transformed Our Cell Ministry Reporting',
      review: 'HomeCell solved our attendance tracking challenge overnight. Our cell leaders can log reports offline during meetings without needing mobile data!',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      status: 'approved',
      isReviewOfMonth: true,
      createdAt: '2026-07-15T10:00:00Z'
    },
    {
      id: 't2',
      name: 'Deaconess Sarah Jenkins',
      church: 'Hope Community Church',
      city: 'Atlanta',
      country: 'USA',
      rating: 5,
      title: 'The Prayer Wall Keeps Us Connected Daily',
      review: 'Our members share prayer points during the week and see when others pray for them. It has deepened our spiritual bond tremendously.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      status: 'approved',
      isReviewOfMonth: false,
      createdAt: '2026-07-20T14:30:00Z'
    },
    {
      id: 't3',
      name: 'Cell Leader Mark Lin',
      church: 'Living Word Fellowship',
      city: 'Singapore',
      country: 'Singapore',
      rating: 5,
      title: 'Lightweight and Super Fast on Older Phones',
      review: 'The direct APK installer works seamlessly on all Android devices. Very clean UI and zero complex setup required!',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      status: 'approved',
      isReviewOfMonth: false,
      createdAt: '2026-07-28T09:15:00Z'
    }
  ],
  spiritualTestimonies: [
    {
      id: 'st1',
      name: 'Brother Samuel & Family',
      church: 'Victory Fellowship Cell #3',
      category: 'Healing',
      title: 'Complete Divine Healing from Chronic Illness',
      story: 'During our Thursday cell meeting, the brethren prayed over my medical report. By Sunday, the doctor confirmed all test results came back 100% clear! Glory to God!',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      status: 'approved',
      createdAt: '2026-07-10T12:00:00Z'
    },
    {
      id: 'st2',
      name: 'Sister Rachel K.',
      church: 'Grace Life Home Cell',
      category: 'Salvation',
      title: 'My Neighbor Gave Their Life to Christ',
      story: 'I invited my neighbor to our informal home cell Bible study. She surrendered her heart to Jesus and was baptized last Sunday. HomeCell keeps us accountable!',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      status: 'approved',
      createdAt: '2026-07-18T16:20:00Z'
    },
    {
      id: 'st3',
      name: 'Elder Thomas Wright',
      church: 'Covenant Center Cell Network',
      category: 'Provision',
      title: 'God Provided Tuition Fees for Our Cell Youth',
      story: 'Our cell group rallied in prayer and financial support for two young believers about to drop out of university. God opened doors and fees were fully paid!',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      status: 'approved',
      createdAt: '2026-07-25T11:45:00Z'
    }
  ],
  faqs: [
    {
      id: 'faq1',
      question: 'How do I install the HomeCell APK on my Android device?',
      answer: 'Tap the "Download APK" button to download the HomeCell installation file. Once downloaded, open your Downloads folder, tap the APK file, allow "Install from Unknown Sources" in Android Settings if prompted, and tap Install.'
    },
    {
      id: 'faq2',
      question: 'Does the app work without an active internet connection?',
      answer: 'Yes! HomeCell is built offline-first. Cell leaders can take attendance, record prayer requests, and read study outlines offline. The app automatically syncs with church servers as soon as internet connectivity is available.'
    },
    {
      id: 'faq3',
      question: 'Is my cell group data secure and private?',
      answer: 'Absolutely. HomeCell enforces strict row-level security and end-to-end encryption for prayer requests and member records. We never sell or share church data with third parties.'
    },
    {
      id: 'faq4',
      question: 'Can church administrators customize content from the Web Portal?',
      answer: 'Yes! Pastors and admins can log into the secure CMS Admin Portal to update app version releases, manage cell group directories, review testimonies, and customize hero announcements.'
    }
  ],
  navbarLinks: [
    { id: 'nav1', label: 'Features', href: '#features', isVisible: true },
    { id: 'nav2', label: 'Screenshots', href: '#screenshots', isVisible: true },
    { id: 'nav3', label: 'About', href: '#about', isVisible: true },
    { id: 'nav4', label: 'Testimonials', href: '#testimonials', isVisible: true },
    { id: 'nav5', label: 'Testimonies', href: '#testimonies', isVisible: true },
    { id: 'nav6', label: 'FAQ', href: '#faq', isVisible: true }
  ],
  settings: {
    logoText: 'HomeCell',
    logoIcon: '✝',
    logoImageUrl: '',
    churchName: 'HomeCell Global Fellowship Network',
    churchEmail: 'contact@homecell.web.app',
    churchPhone: '+1 (800) 555-CELL',
    churchAddress: 'Grace Way City Campus, HQ Ministry Center',
    footerText: 'Empowering local churches and cell groups with modern digital tools for discipleship, prayer, attendance tracking, and spiritual growth.',
    copyright: '© 2026 HomeCell HQ — Empowering the digital church.'
  },
  theme: {
    buttonRadius: '16px',
    cardRadius: '24px'
  },
  adminState: {
    isLoggedIn: false,
    adminEmail: '',
    adminPassword: 'Home.cell+123'
  }
};

class StateStore {
  constructor() {
    // Load persisted state or fallback
    const saved = localStorage.getItem('homecell_cms_state');
    if (saved) {
      try {
        this.data = { ...DEFAULT_STATE, ...JSON.parse(saved) };
      } catch (e) {
        this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    } else {
      this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    // Ensure large binary base64 URLs are never kept in state or localStorage
    if (this.data.downloadConfig && this.data.downloadConfig.apkFileDataUrl) {
      this.data.downloadConfig.apkFileDataUrl = '';
      this.persist();
    }

    this.listeners = [];

    // Subscribe to Firebase Firestore for real-time remote updates
    subscribeToCMSData((remoteConfig) => {
      if (remoteConfig) {
        // Strip out any accidental binary payloads from remote config
        if (remoteConfig.downloadConfig) {
          remoteConfig.downloadConfig.apkFileDataUrl = '';
        }
        this.data = {
          ...this.data,
          ...remoteConfig
        };
        this.persist();
        this.notify();
      }
    });
  }

  get state() {
    return this.data;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  persist() {
    try {
      // Create lightweight state copy to guarantee localStorage quota limits are respected
      const cleanData = JSON.parse(JSON.stringify(this.data));
      if (cleanData.downloadConfig && cleanData.downloadConfig.apkFileDataUrl) {
        cleanData.downloadConfig.apkFileDataUrl = '';
      }
      localStorage.setItem('homecell_cms_state', JSON.stringify(cleanData));
    } catch (err) {
      console.warn('LocalStorage quota handled safely:', err);
      // Fallback: clear older localStorage entries if storage is choked
      try {
        const lightweight = {
          downloadConfig: this.data.downloadConfig,
          statistics: this.data.statistics,
          hero: this.data.hero,
          sectionTitles: this.data.sectionTitles,
          settings: this.data.settings
        };
        localStorage.setItem('homecell_cms_state', JSON.stringify(lightweight));
      } catch (innerErr) {
        console.warn('LocalStorage write bypassed:', innerErr);
      }
    }
  }

  updateCMS(partial) {
    // Clean partial payload from any large binary properties before saving
    if (partial.downloadConfig && partial.downloadConfig.apkFileDataUrl) {
      partial.downloadConfig.apkFileDataUrl = '';
    }
    this.data = {
      ...this.data,
      ...partial
    };
    this.persist();
    this.notify();
    saveCMSConfigToFirestore(partial);
  }

  async uploadApkFile(file) {
    if (!file) return false;

    // Convert size to human readable
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const formattedSize = sizeInMB > 0.1 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' });

    // Store binary in IndexedDB permanently (supports files hundreds of MBs in size)
    await saveUploadedFileToIDB('current_apk', file);

    const updatedDownloadConfig = {
      ...this.data.downloadConfig,
      apkFileName: file.name,
      uploadedFileName: file.name,
      fileSize: formattedSize,
      uploadedAt: timestamp,
      hasUploadedApk: true,
      apkFileDataUrl: '', // Cleaned out: binary stored strictly in IndexedDB
      downloadMethod: 'uploaded_file'
    };

    this.updateCMS({ downloadConfig: updatedDownloadConfig });
    return true;
  }

  async removeUploadedApk() {
    await deleteUploadedFileFromIDB('current_apk');
    const updatedDownloadConfig = {
      ...this.data.downloadConfig,
      hasUploadedApk: false,
      apkFileDataUrl: '',
      uploadedFileName: '',
      uploadedAt: ''
    };
    this.updateCMS({ downloadConfig: updatedDownloadConfig });
  }

  updateSectionTitles(newTitles) {
    const updated = {
      ...this.data.sectionTitles,
      ...newTitles
    };
    this.updateCMS({ sectionTitles: updated });
  }

  addFeature(feature) {
    const newFeature = {
      id: 'f_' + Date.now(),
      ...feature
    };
    const updated = [...(this.data.features || []), newFeature];
    this.updateCMS({ features: updated });
  }

  deleteFeature(id) {
    const updated = (this.data.features || []).filter(f => f.id !== id);
    this.updateCMS({ features: updated });
  }

  addFAQ(faq) {
    const newFaq = {
      id: 'faq_' + Date.now(),
      ...faq
    };
    const updated = [...(this.data.faqs || []), newFaq];
    this.updateCMS({ faqs: updated });
  }

  deleteFAQ(id) {
    const updated = (this.data.faqs || []).filter(f => f.id !== id);
    this.updateCMS({ faqs: updated });
  }

  addScreenshot(screenshot) {
    const newS = {
      id: 's_' + Date.now(),
      ...screenshot
    };
    const updated = [...(this.data.screenshots || []), newS];
    this.updateCMS({ screenshots: updated });
  }

  updateScreenshot(id, partial) {
    const updated = (this.data.screenshots || []).map(s => s.id === id ? { ...s, ...partial } : s);
    this.updateCMS({ screenshots: updated });
  }

  deleteScreenshot(id) {
    const updated = (this.data.screenshots || []).filter(s => s.id !== id);
    this.updateCMS({ screenshots: updated });
  }

  addNavbarLink(link) {
    const newLink = {
      id: 'nav_' + Date.now(),
      isVisible: true,
      ...link
    };
    const updated = [...(this.data.navbarLinks || []), newLink];
    this.updateCMS({ navbarLinks: updated });
  }

  updateNavbarLink(id, partial) {
    const updated = (this.data.navbarLinks || []).map(l => l.id === id ? { ...l, ...partial } : l);
    this.updateCMS({ navbarLinks: updated });
  }

  deleteNavbarLink(id) {
    const updated = (this.data.navbarLinks || []).filter(l => l.id !== id);
    this.updateCMS({ navbarLinks: updated });
  }

  recordDownload() {
    this.data.statistics.totalDownloads += 1;
    this.persist();
    this.notify();
    saveCMSConfigToFirestore({ statistics: this.data.statistics });
  }

  addReview(review) {
    const newReview = {
      id: 'rev_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      isReviewOfMonth: false,
      ...review
    };
    this.data.testimonials.unshift(newReview);
    this.persist();
    this.notify();
    saveCMSConfigToFirestore({ testimonials: this.data.testimonials });
  }

  addSpiritualTestimony(testimony) {
    const newTestimony = {
      id: 'st_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      ...testimony
    };
    this.data.spiritualTestimonies.unshift(newTestimony);
    this.persist();
    this.notify();
    saveCMSConfigToFirestore({ spiritualTestimonies: this.data.spiritualTestimonies });
  }

  setAdminLoggedIn(isLoggedIn, email = '') {
    this.data.adminState = { 
      ...this.data.adminState, 
      isLoggedIn, 
      adminEmail: email 
    };
    this.persist();
    this.notify();
  }

  updateAdminPassword(newPassword) {
    this.data.adminState = {
      ...this.data.adminState,
      adminPassword: newPassword
    };
    this.persist();
    this.notify();
    saveCMSConfigToFirestore({ adminPassword: newPassword });
  }
}

export const store = new StateStore();
