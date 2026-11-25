/* ==========================================================================
   NEXORA — FULL INTERACTIVE WEBSITE DEMO V2.0
   Single-Vendor Digital Commerce Ecosystem (Produk Digital, Jasa, Pelatihan)
   Pure Vanilla ES6+ | LocalStorage Persistence | Browser Simulation Only
   ========================================================================== */
(function () {
  'use strict';

  const STORAGE_KEY = 'nexora_demo_state_v2';

  /**
   * Required global state schema (Section 12)
   */
  const state = {
    version: 2,
    currentUser: null,
    currentRole: 'guest',
    products: [],
    categories: [],
    services: [],
    servicePackages: [],
    trainingPrograms: [],
    trainingSessions: [],
    articles: [],
    portfolios: [],
    cart: [],
    customers: [],
    orders: [],
    invoices: [],
    payments: [],
    customRequests: [],
    quotations: [],
    projects: [],
    enrollments: [],
    notifications: [],
    auditLogs: [],
    settings: {}
  };

  /**
   * Ephemeral UI state (filters, pagination, dropdowns, drawers)
   */
  const ui = {
    announcementDismissed: false,
    megaMenuOpen: false,
    notifDropdownOpen: false,
    profileDropdownOpen: false,
    searchQuery: '',
    searchFocused: false,
    demoPanelOpen: false,
    dashSidebarCollapsed: false,
    dashMobileOpen: false,
    catalog: {
      search: '',
      category: 'all',
      minPrice: '',
      maxPrice: '',
      sort: 'popular',
      view: 'grid',
      page: 1
    },
    servicesFilter: {
      search: '',
      category: 'all',
      sort: 'popular'
    },
    trainingFilter: {
      search: '',
      mode: 'all',
      location: 'all',
      category: 'all',
      maxPrice: ''
    },
    articleFilter: {
      search: '',
      category: 'all',
      page: 1
    },
    portfolioFilter: {
      category: 'all'
    },
    helpSearch: '',
    helpCategory: 'Semua',
    checkoutTab: 'product', // product | service | training
    checkoutDraft: null,
    appliedCouponCode: '',
    customWizardStep: 1,
    customWizardData: {
      serviceType: 'Website Company Profile',
      needs: [],
      projectTitle: '',
      description: '',
      budgetRange: 'Rp 5.000.000 – Rp 15.000.000',
      timeline: '3–4 Minggu',
      attachmentName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      company: ''
    },
    adminFilters: {
      productSearch: '',
      productCat: 'all',
      productStatus: 'all',
      productSort: 'newest',
      productPage: 1,
      paymentStatus: 'all',
      orderType: 'all',
      reportPeriod: 'all'
    },
    storageError: null,
    activeModalCleanup: null
  };

  /* ------------------------------------------------------------------------
     01. UTILITIES & SECURITY HELPERS
     ------------------------------------------------------------------------ */
  function escapeHtml(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatIDR(amount) {
    const num = Number(amount) || 0;
    return 'Rp ' + num.toLocaleString('id-ID');
  }

  function formatDate(isoStr, withTime = false) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return escapeHtml(isoStr);
    const datePart = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    if (!withTime) return datePart;
    const timePart = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${datePart}, ${timePart} WIB`;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function slugify(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function clampText(text, maxLen = 110) {
    const str = String(text || '');
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
  }

  function copyText(text, label = 'Teks') {
    const value = String(text || '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(() => {
        showToast(`${label} berhasil disalin ke clipboard.`, 'success');
      }).catch(() => fallbackCopy(value, label));
    } else {
      fallbackCopy(value, label);
    }
  }

  function fallbackCopy(value, label) {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(`${label} berhasil disalin.`, 'success');
    } catch {
      showToast(`Salin manual: ${value}`, 'info');
    }
    document.body.removeChild(ta);
  }

  /* ------------------------------------------------------------------------
     02. SVG ICON LIBRARY (LUCIDE-STYLE)
     ------------------------------------------------------------------------ */
  const ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
    sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    briefcase: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    'graduation-cap': '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    'file-text': '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>',
    'credit-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    'bar-chart': '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    sliders: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
    tag: '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    layout: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    video: '<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
  };

  function icon(name, size = 18, cls = '') {
    const path = ICON_PATHS[name] || ICON_PATHS.sparkles;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg ${escapeHtml(cls)}" aria-hidden="true">${path}</svg>`;
  }

  /* ------------------------------------------------------------------------
     03. BESPOKE SVG ARTWORK & SAMPLE RECEIPT GENERATORS (ZERO BROKEN IMAGES)
     ------------------------------------------------------------------------ */
  const ART_THEMES = {
    blue: ['#EAF0FF', '#245BDB', '#7657D8', '#142238'],
    violet: ['#F1EDFF', '#7657D8', '#245BDB', '#142238'],
    emerald: ['#E8F7EF', '#16794C', '#245BDB', '#142238'],
    amber: ['#FFF5DD', '#986100', '#245BDB', '#142238'],
    slate: ['#EEF3FA', '#334155', '#245BDB', '#142238']
  };

  function createArtworkDataUri({ type = 'product', title = 'NEXORA', subtitle = 'Digital Asset', badge = 'DEMO', theme = 'blue', seed = 1 }) {
    const [bg, c1, c2, ink] = ART_THEMES[theme] || ART_THEMES.blue;
    const safeTitle = escapeHtml(clampText(title, 30));
    const safeSub = escapeHtml(clampText(subtitle, 34));
    const safeBadge = escapeHtml(clampText(badge, 20));
    const shift = ((Number(seed) || 1) * 19) % 40;

    let motif = '';
    if (type === 'ebook') {
      motif = `
        <rect x="330" y="48" width="132" height="174" rx="12" fill="#FFFFFF" stroke="#DCE4EF" stroke-width="2"/>
        <rect x="330" y="48" width="22" height="174" rx="6" fill="${c1}"/>
        <rect x="366" y="74" width="76" height="10" rx="5" fill="${c1}" opacity="0.22"/>
        <rect x="366" y="94" width="60" height="8" rx="4" fill="#CBD5E1"/>
        <rect x="366" y="132" width="76" height="62" rx="8" fill="${bg}"/>
        <circle cx="404" cy="163" r="16" fill="${c2}" opacity="0.25"/>
      `;
    } else if (type === 'service' || type === 'portfolio') {
      motif = `
        <rect x="278" y="46" width="204" height="154" rx="14" fill="#FFFFFF" stroke="#DCE4EF" stroke-width="2"/>
        <rect x="278" y="46" width="204" height="28" rx="14" fill="#F7F9FC"/>
        <circle cx="296" cy="60" r="4" fill="#F87171"/><circle cx="309" cy="60" r="4" fill="#FBBF24"/><circle cx="322" cy="60" r="4" fill="#34D399"/>
        <rect x="294" y="88" width="102" height="14" rx="6" fill="${c1}" opacity="0.22"/>
        <rect x="294" y="110" width="84" height="9" rx="4" fill="#CBD5E1"/>
        <rect x="294" y="134" width="78" height="48" rx="8" fill="${bg}"/>
        <rect x="382" y="134" width="84" height="48" rx="8" fill="#F7F9FC" stroke="#DCE4EF"/>
      `;
    } else if (type === 'training') {
      motif = `
        <rect x="286" y="54" width="192" height="142" rx="14" fill="#FFFFFF" stroke="#DCE4EF" stroke-width="2"/>
        <circle cx="332" cy="108" r="24" fill="${c1}" opacity="0.16"/>
        <circle cx="332" cy="108" r="11" fill="${c1}"/>
        <rect x="370" y="90" width="88" height="10" rx="5" fill="${ink}" opacity="0.75"/>
        <rect x="370" y="108" width="68" height="8" rx="4" fill="#94A3B8"/>
        <rect x="308" y="148" width="148" height="28" rx="8" fill="${bg}"/>
        <rect x="320" y="158" width="72" height="8" rx="4" fill="${c2}"/>
      `;
    } else {
      motif = `
        <rect x="284" y="52" width="196" height="150" rx="14" fill="#FFFFFF" stroke="#DCE4EF" stroke-width="2"/>
        <rect x="302" y="72" width="160" height="24" rx="8" fill="${bg}"/>
        <rect x="302" y="108" width="74" height="74" rx="10" fill="${c1}" opacity="0.14"/>
        <rect x="388" y="108" width="74" height="32" rx="8" fill="${c2}" opacity="0.18"/>
        <rect x="388" y="150" width="74" height="32" rx="8" fill="#F7F9FC" stroke="#DCE4EF"/>
      `;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="300" viewBox="0 0 520 300">
      <defs>
        <linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="${bg}"/>
        </linearGradient>
      </defs>
      <rect width="520" height="300" fill="url(#g${seed})"/>
      <circle cx="${450 - shift}" cy="46" r="78" fill="${c1}" opacity="0.08"/>
      <circle cx="${70 + shift}" cy="260" r="64" fill="${c2}" opacity="0.08"/>
      <rect x="28" y="34" width="128" height="26" rx="13" fill="#FFFFFF" stroke="#DCE4EF"/>
      <text x="42" y="51" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="11" font-weight="700" fill="${c1}">${safeBadge}</text>
      <text x="28" y="114" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="21" font-weight="800" fill="${ink}">${safeTitle}</text>
      <text x="28" y="142" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="13" font-weight="600" fill="#526178">${safeSub}</text>
      <rect x="28" y="168" width="110" height="8" rx="4" fill="${c1}" opacity="0.35"/>
      <rect x="28" y="186" width="160" height="8" rx="4" fill="#CBD5E1"/>
      <rect x="28" y="242" width="132" height="24" rx="6" fill="#FFFFFF" stroke="#DCE4EF"/>
      <text x="40" y="258" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="11" font-weight="700" fill="#526178">NEXORA DEMO</text>
      ${motif}
    </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function createAvatarDataUri(name = 'NX', bg = '#245BDB') {
    const parts = String(name || 'NX').trim().split(/\s+/);
    const initials = ((parts[0] ? parts[0][0] : 'N') + (parts[1] ? parts[1][0] : '')).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="60" fill="${bg}"/>
      <circle cx="96" cy="24" r="28" fill="#FFFFFF" opacity="0.14"/>
      <text x="60" y="70" text-anchor="middle" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="40" font-weight="800" fill="#FFFFFF">${escapeHtml(initials)}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function createSampleReceiptDataUri(orderNo, amount, payerName, bankName = 'Bank Demo Nusantara') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="320" viewBox="0 0 440 320">
      <rect width="440" height="320" fill="#F7F9FC"/>
      <rect x="24" y="20" width="392" height="280" rx="14" fill="#FFFFFF" stroke="#DCE4EF" stroke-width="2"/>
      <rect x="24" y="20" width="392" height="52" rx="14" fill="#245BDB"/>
      <text x="44" y="51" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="15" font-weight="800" fill="#FFFFFF">BUKTI TRANSFER SIMULASI</text>
      <text x="44" y="102" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="12" fill="#718096">Bank Pengirim / Tujuan</text>
      <text x="44" y="122" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="14" font-weight="700" fill="#142238">${escapeHtml(bankName)}</text>
      <text x="44" y="156" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="12" fill="#718096">Nomor Referensi Pesanan</text>
      <text x="44" y="176" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="14" font-weight="700" fill="#142238">${escapeHtml(orderNo)}</text>
      <text x="44" y="210" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="12" fill="#718096">Pengirim (Contoh)</text>
      <text x="44" y="230" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="14" font-weight="700" fill="#142238">${escapeHtml(payerName)}</text>
      <rect x="44" y="248" width="352" height="36" rx="8" fill="#E8F7EF"/>
      <text x="58" y="271" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="14" font-weight="800" fill="#16794C">Nominal: ${escapeHtml(formatIDR(amount))}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  /* ------------------------------------------------------------------------
     04. TOASTS, MODALS & DRAWERS
     ------------------------------------------------------------------------ */
  function showToast(message, type = 'info', duration = 3800) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const iconName = type === 'success' ? 'check-circle' : type === 'danger' ? 'alert-circle' : 'sparkles';
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span style="color:var(--${type === 'info' ? 'primary' : type}); flex-shrink:0; margin-top:2px;">${icon(iconName, 18)}</span>
      <div style="flex:1; font-size:13.5px; font-weight:500;">${escapeHtml(message)}</div>
      <button type="button" class="btn-ghost" style="border:none;padding:2px;cursor:pointer;" aria-label="Tutup notifikasi">${icon('x', 16)}</button>
    `;
    const closeBtn = toast.querySelector('button');
    const remove = () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    };
    closeBtn.addEventListener('click', remove);
    root.appendChild(toast);
    setTimeout(remove, duration);
  }

  function closeModal() {
    const root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
    if (typeof ui.activeModalCleanup === 'function') {
      ui.activeModalCleanup();
      ui.activeModalCleanup = null;
    }
  }

  function openModal({ title, bodyHtml, footerHtml = '', size = 'md', onMount = null }) {
    const root = document.getElementById('modal-root');
    if (!root) return;
    closeModal();
    const sizeCls = size === 'lg' ? 'modal-lg' : '';
    root.innerHTML = `
      <div class="overlay-backdrop" id="active-modal-backdrop" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="modal-dialog ${sizeCls}">
          <div class="modal-header">
            <h3 class="text-h4">${escapeHtml(title)}</h3>
            <button type="button" class="icon-btn" id="modal-close-btn" aria-label="Tutup modal">${icon('x', 18)}</button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
          ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        </div>
      </div>
    `;
    const backdrop = document.getElementById('active-modal-backdrop');
    const closeBtn = document.getElementById('modal-close-btn');
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    const escHandler = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escHandler);
    ui.activeModalCleanup = () => document.removeEventListener('keydown', escHandler);
    if (typeof onMount === 'function') onMount(root);
  }

  function openConfirmModal({ title, message, confirmText = 'Konfirmasi', confirmClass = 'btn-primary', onConfirm }) {
    openModal({
      title,
      bodyHtml: `<p class="text-body text-secondary">${escapeHtml(message)}</p>`,
      footerHtml: `
        <button type="button" class="btn btn-secondary" id="confirm-cancel-btn">Batal</button>
        <button type="button" class="btn ${escapeHtml(confirmClass)}" id="confirm-ok-btn">${escapeHtml(confirmText)}</button>
      `,
      onMount: () => {
        document.getElementById('confirm-cancel-btn').addEventListener('click', closeModal);
        document.getElementById('confirm-ok-btn').addEventListener('click', () => {
          closeModal();
          if (typeof onConfirm === 'function') onConfirm();
        });
      }
    });
  }

  function closeDrawer() {
    const root = document.getElementById('drawer-root');
    if (root) root.innerHTML = '';
  }

  function openCartDrawer() {
    const root = document.getElementById('drawer-root');
    if (!root) return;
    const activeItems = state.cart.map((c) => {
      const p = state.products.find((pr) => pr.id === c.productId);
      return p ? { ...c, product: p } : null;
    }).filter(Boolean);
    const selectedTotal = activeItems
      .filter((i) => i.selected && i.product.status === 'active')
      .reduce((sum, i) => sum + i.product.price * i.qty, 0);
    const selectedCount = activeItems.filter((i) => i.selected && i.product.status === 'active').length;

    root.innerHTML = `
      <div class="drawer-backdrop" id="cart-drawer-backdrop" role="dialog" aria-modal="true" aria-label="Keranjang Belanja">
        <div class="drawer-panel">
          <div class="drawer-header">
            <div class="flex items-center gap-2">
              ${icon('shopping-bag', 20)}
              <h3 class="text-h4">Keranjang Belanja (${activeItems.length})</h3>
            </div>
            <button type="button" class="icon-btn" id="drawer-close-btn" aria-label="Tutup keranjang">${icon('x', 18)}</button>
          </div>
          <div class="drawer-body">
            ${activeItems.length === 0 ? `
              <div class="state-box" style="padding:32px 16px;">
                <div class="state-icon">${icon('shopping-bag', 24)}</div>
                <h4 class="text-h4">Keranjang masih kosong</h4>
                <p class="text-sm text-secondary mt-1 mb-3">Jelajahi e-book, template, aplikasi, dan lisensi resmi NEXORA.</p>
                <a href="#/produk" class="btn btn-primary btn-sm" data-close-drawer>Jelajahi Produk</a>
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:14px;">
                ${activeItems.map((item) => {
                  const archived = item.product.status !== 'active';
                  return `
                    <div class="card" style="padding:12px;">
                      <div class="flex items-start gap-3">
                        <input type="checkbox" ${item.selected && !archived ? 'checked' : ''} ${archived ? 'disabled' : ''} data-cart-toggle="${escapeHtml(item.id)}" aria-label="Pilih ${escapeHtml(item.product.name)}" style="margin-top:4px; accent-color:var(--primary);">
                        <img src="${item.product.thumbnail}" alt="${escapeHtml(item.product.name)}" style="width:68px; height:48px; object-fit:cover; border-radius:8px; border:1px solid var(--border); flex-shrink:0;">
                        <div style="flex:1; min-width:0;">
                          <div class="font-bold text-sm" style="line-height:1.3;">${escapeHtml(item.product.name)}</div>
                          <div class="text-caption text-muted">${escapeHtml(item.product.category)}</div>
                          ${archived ? `<span class="badge badge-danger mt-1">Produk Diarsipkan</span>` : `<div class="font-bold text-sm text-primary-brand mt-1">${formatIDR(item.product.price)}</div>`}
                          <div class="flex items-center justify-between mt-2">
                            ${item.product.allowMultiUnit && !archived ? `
                              <div class="flex items-center gap-1">
                                <button type="button" class="icon-btn" style="width:28px;height:28px;" data-cart-qty="${escapeHtml(item.id)}" data-delta="-1" aria-label="Kurangi jumlah">${icon('minus', 14)}</button>
                                <span class="text-sm font-bold" style="min-width:24px;text-align:center;">${item.qty}</span>
                                <button type="button" class="icon-btn" style="width:28px;height:28px;" data-cart-qty="${escapeHtml(item.id)}" data-delta="1" aria-label="Tambah jumlah">${icon('plus', 14)}</button>
                              </div>
                            ` : `<span class="text-caption text-muted">1 Lisensi</span>`}
                            <button type="button" class="btn btn-ghost btn-sm text-danger" data-cart-remove="${escapeHtml(item.id)}" aria-label="Hapus item">${icon('trash', 15)}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
          ${activeItems.length > 0 ? `
            <div class="drawer-footer">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-secondary">Subtotal (${selectedCount} dipilih)</span>
                <strong class="text-h4 tabular-nums">${formatIDR(selectedTotal)}</strong>
              </div>
              <div class="grid-2" style="gap:10px;">
                <a href="#/keranjang" class="btn btn-secondary" data-close-drawer>Lihat Keranjang</a>
                <button type="button" class="btn btn-primary" id="drawer-checkout-btn" ${selectedCount === 0 ? 'disabled' : ''}>Checkout</button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);
    document.getElementById('cart-drawer-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'cart-drawer-backdrop') closeDrawer();
    });
    const checkoutBtn = document.getElementById('drawer-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        closeDrawer();
        startDigitalCheckout();
      });
    }
  }

  function openMobileNavDrawer() {
    const root = document.getElementById('drawer-root');
    if (!root) return;
    root.innerHTML = `
      <div class="drawer-backdrop left" id="mobile-nav-backdrop" role="dialog" aria-modal="true" aria-label="Navigasi Mobile">
        <div class="drawer-panel">
          <div class="drawer-header">
            <span class="brand-logo"><span class="brand-mark">${icon('layers', 18)}</span><span>NEXORA</span></span>
            <button type="button" class="icon-btn" id="drawer-close-btn" aria-label="Tutup menu">${icon('x', 18)}</button>
          </div>
          <div class="drawer-body">
            <form id="mobile-search-form" class="mb-4">
              <div class="nav-search-input-box">
                ${icon('search', 16)}
                <input type="search" id="mobile-search-input" placeholder="Cari produk, jasa, pelatihan..." value="${escapeHtml(ui.searchQuery)}">
              </div>
            </form>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <a href="#/" class="dash-link" data-close-drawer>${icon('home', 16)} Beranda</a>
              <a href="#/produk" class="dash-link" data-close-drawer>${icon('layers', 16)} Produk Digital</a>
              <a href="#/jasa" class="dash-link" data-close-drawer>${icon('briefcase', 16)} Jasa Digital</a>
              <a href="#/jasa/custom" class="dash-link" data-close-drawer>${icon('sliders', 16)} Penawaran Custom</a>
              <a href="#/pelatihan" class="dash-link" data-close-drawer>${icon('graduation-cap', 16)} Pelatihan</a>
              <a href="#/portofolio" class="dash-link" data-close-drawer>${icon('image', 16)} Portofolio</a>
              <a href="#/artikel" class="dash-link" data-close-drawer>${icon('file-text', 16)} Artikel & Insight</a>
              <a href="#/tentang" class="dash-link" data-close-drawer>${icon('globe', 16)} Tentang Kami</a>
              <a href="#/bantuan" class="dash-link" data-close-drawer>${icon('help-circle', 16)} Pusat Bantuan</a>
              <a href="#/kontak" class="dash-link" data-close-drawer>${icon('mail', 16)} Kontak</a>
            </div>
            <hr style="border:none;border-top:1px solid var(--border);margin:18px 0;">
            ${state.currentUser ? `
              <div class="flex flex-wrap gap-2">
                <a href="${state.currentRole === 'admin' ? '#/admin/dashboard' : '#/akun/dashboard'}" class="btn btn-primary w-full" data-close-drawer>
                  Buka Dashboard (${escapeHtml(state.currentUser.name)})
                </a>
                <button type="button" class="btn btn-secondary w-full" data-action="logout" data-close-drawer>Keluar</button>
              </div>
            ` : `
              <div class="grid-2" style="gap:10px;">
                <a href="#/masuk" class="btn btn-secondary" data-close-drawer>Masuk</a>
                <a href="#/daftar" class="btn btn-primary" data-close-drawer>Daftar</a>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
    document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);
    document.getElementById('mobile-nav-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'mobile-nav-backdrop') closeDrawer();
    });
    document.getElementById('mobile-search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      ui.searchQuery = document.getElementById('mobile-search-input').value.trim();
      closeDrawer();
      navigate(`#/cari?q=${encodeURIComponent(ui.searchQuery)}`);
    });
  }

  /* ------------------------------------------------------------------------
     05. LOCALSTORAGE PERSISTENCE & ERROR RECOVERY
     ------------------------------------------------------------------------ */
  function saveState() {
    try {
      const serialized = JSON.stringify(state);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      ui.storageError = null;
      return true;
    } catch (err) {
      if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
        ui.storageError = 'Penyimpanan browser (LocalStorage) penuh. Hapus sebagian data demo atau unggah gambar dengan ukuran lebih kecil.';
      } else {
        ui.storageError = 'LocalStorage tidak tersedia pada browser ini. Perubahan hanya tersimpan sementara selama tab terbuka.';
      }
      showToast(ui.storageError, 'warning', 5500);
      return false;
    }
  }

  function applySeedToState(seedObj) {
    Object.keys(state).forEach((k) => {
      if (k in seedObj) state[k] = seedObj[k];
    });
  }

  function loadState() {
    let raw = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      ui.storageError = 'LocalStorage tidak dapat diakses. Aplikasi berjalan menggunakan state memori sementara.';
      applySeedToState(buildInitialSeed());
      return;
    }
    if (!raw) {
      applySeedToState(buildInitialSeed());
      saveState();
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.products) || !Array.isArray(parsed.orders)) {
        throw new Error('Struktur data tidak valid');
      }
      applySeedToState(parsed);
    } catch {
      ui.storageError = 'Data LocalStorage terdeteksi rusak dan telah dipulihkan otomatis ke data demo awal.';
      applySeedToState(buildInitialSeed());
      saveState();
    }
  }

  function resetDemoState() {
    const fresh = buildInitialSeed();
    applySeedToState(fresh);
    ui.appliedCouponCode = '';
    ui.checkoutDraft = null;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    saveState();
    showToast('Seluruh data demo berhasil direset ke kondisi awal.', 'success');
    navigate('#/');
  }

  /* ------------------------------------------------------------------------
     06. SEED DATA GENERATOR (SECTION 11 MINIMUMS STRICTLY EXCEEDED)
     ------------------------------------------------------------------------ */
  function buildInitialSeed() {
    const now = Date.now();
    const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();
    const daysAgo = (d) => new Date(now - d * 86400 * 1000).toISOString();
    const daysAhead = (d) => new Date(now + d * 86400 * 1000).toISOString();

    const categories = [
      { id: 'cat-ebook', name: 'E-Book', slug: 'e-book', description: 'Panduan praktis dan buku digital terstruktur dalam format PDF & EPUB.', countLabel: 'Panduan & Riset' },
      { id: 'cat-app', name: 'Aplikasi & Platform', slug: 'aplikasi-platform', description: 'Perangkat lunak produktivitas, toolkit otomasi, dan sistem siap pakai.', countLabel: 'Toolkit & SaaS Kit' },
      { id: 'cat-content', name: 'Konten Digital', slug: 'konten-digital', description: 'Paket aset visual, copywriting, dan komponen konten media sosial.', countLabel: 'Aset Kreatif' },
      { id: 'cat-pro', name: 'Akun Pro Resmi', slug: 'akun-pro-resmi', description: 'Distribusi lisensi akun profesional resmi dan berizin untuk tim maupun individu.', countLabel: 'Lisensi Resmi' },
      { id: 'cat-template', name: 'Template Digital', slug: 'template-digital', description: 'Template website, presentasi bisnis, spreadsheet keuangan, dan Notion.', countLabel: 'Template Siap Pakai' }
    ];

    const productSpecs = [
      ['prod-01', 'E-Book AI untuk Pemula', 'E-Book', 149000, 'PDF & EPUB', '18.4 MB', 'blue', 'ebook', true, false, 1, 'Panduan sistematis memahami AI generatif, prompt engineering, dan alur kerja harian.', ['6 Modul terstruktur dari dasar hingga studi kasus', '45+ contoh prompt siap salin untuk pekerjaan kantor', 'Checklist implementasi etika dan keamanan data'], ['PDF Interaktif (140 Halaman)', 'EPUB untuk E-Reader', 'Lembar Latihan Prompt (Notion & Docs)'], 'Lisensi Personal (1 Pengguna) — Dilarang mendistribusikan ulang secara komersial.'],
      ['prod-02', 'Panduan Produktivitas Digital', 'E-Book', 125000, 'PDF & Notion', '12.1 MB', 'violet', 'ebook', true, false, 2, 'Kerangka kerja manajemen waktu, catatan terhubung, dan fokus kerja bagi kreator.', ['Metode time-blocking mingguan yang realistis', 'Template weekly review terintegrasi', 'Panduan pengarsipan dokumen berbasis proyek'], ['E-Book PDF (112 Halaman)', 'Template Weekly Review Notion', 'Daftar Referensi Aplikasi'], 'Lisensi Personal — Penggunaan pribadi atau internal tim kecil.'],
      ['prod-03', 'Template Website UMKM', 'Template Digital', 299000, 'HTML, CSS, JS', '24.6 MB', 'blue', 'service', true, false, 3, 'Kit halaman profil usaha dan katalog produk ringan dengan struktur SEO rapi.', ['5 variasi halaman siap sunting tanpa framework berat', 'Desain responsif mobile-first', 'Panduan penyesuaian warna dan tipografi'], ['Kode Sumber HTML5 & CSS3', 'Komponen Hero, Katalog, FAQ, Kontak', 'Panduan Deploy Statis'], 'Lisensi Komersial Tunggal — Dapat digunakan untuk 1 brand/klien.'],
      ['prod-04', 'Template Landing Page Premium', 'Template Digital', 349000, 'HTML, Figma', '38.2 MB', 'violet', 'service', true, false, 4, 'Sistem desain landing page konversi tinggi lengkap dengan file Figma dan kode bersih.', ['12 blok layout modular bergaya SaaS', 'File Figma dengan Auto Layout & variabel warna', 'Versi kode statis siap uji coba'], ['File Figma Terorganisir', 'Kode HTML/CSS Modular', 'Panduan Copywriting Halaman'], 'Lisensi Komersial (hingga 3 proyek klien).'],
      ['prod-05', 'Template Presentasi Bisnis', 'Template Digital', 199000, 'PPTX & Google Slides', '42.0 MB', 'amber', 'product', true, false, 5, 'Deck presentasi 65 slide untuk proposal, laporan kuartalan, dan pemaparan produk.', ['65 variasi layout data, roadmap, dan profil', 'Tipografi bersih dan grafik vektor editable', 'Tersedia rasio 16:9 siap presentasi'], ['File PowerPoint (.pptx)', 'Tautan Salin Google Slides', 'Paket Ikon Bisnis Vektor'], 'Lisensi Komersial Internal Perusahaan.'],
      ['prod-06', 'Paket Konten Instagram', 'Konten Digital', 175000, 'Canva & PSD', '85.4 MB', 'emerald', 'product', true, false, 6, '90 template carousel edukasi, pengumuman promo, dan microblog untuk brand modern.', ['30 desain carousel multi-slide', '30 template story interaktif', '30 ide caption terstruktur'], ['Link Template Canva Pro & Gratis', 'File PSD Terlapis', 'Dokumen Bank Ide Caption'], 'Lisensi Brand Tunggal (penggunaan komersial akun sendiri).'],
      ['prod-07', 'Template Dashboard Keuangan', 'Template Digital', 249000, 'XLSX & Google Sheets', '9.8 MB', 'emerald', 'product', true, false, 7, 'Sistem pencatatan arus kas, laba rugi bulanan, dan proyeksi anggaran UMKM.', ['Rumus otomatis rekap bulanan & tahunan', 'Grafik tren pemasukan vs pengeluaran', 'Simulasi margin per lini produk'], ['Workbook Excel (.xlsx)', 'Salinan Google Sheets', 'Panduan Video Singkat (Simulasi)'], 'Lisensi Personal & Usaha Sendiri.'],
      ['prod-08', 'Social Media Content Planner', 'Template Digital', 159000, 'Notion & Sheets', '6.4 MB', 'blue', 'product', true, false, 8, 'Kalender editorial lintas platform untuk menyusun brief, jadwal tayang, dan evaluasi.', ['Kalender bulanan & pipeline status produksi', 'Database bank konten evergreen', 'Checklist tinjauan sebelum publikasi'], ['Workspace Notion Siap Duplikasi', 'Versi Spreadsheet Cadangan', 'SOP Alur Persetujuan Konten'], 'Lisensi Tim (maksimal 5 anggota).'],
      ['prod-09', 'Digital Business Starter Kit', 'Aplikasi & Platform', 499000, 'Bundle ZIP', '112.0 MB', 'blue', 'product', true, false, 9, 'Paket lengkap fondasi operasional bisnis digital dari SOP, keuangan, hingga landing kit.', ['Menggabungkan toolkit SOP, keuangan, dan web kit', 'Cocok untuk perintis produk & jasa digital', 'Pembaruan minor berkala selama masa simulasi'], ['SOP Operasional Digital', 'Template Keuangan & Invoice', 'Landing Page Starter Kit'], 'Lisensi Komersial Bisnis Tunggal.'],
      ['prod-10', 'Lisensi Pro Desain Kolaboratif (1 Tahun)', 'Akun Pro Resmi', 850000, 'Aktivasi Resmi', '1.2 MB', 'violet', 'product', true, true, 10, 'Aktivasi lisensi resmi perangkat desain kolaboratif melalui jalur distribusi berizin.', ['Aktivasi langsung ke email akun resmi Anda', 'Invoice resmi dan panduan aktivasi tertulis', 'Dukungan perpanjangan terpadu'], ['Sertifikat Aktivasi Simulasi', 'Panduan Onboarding Tim', 'Akses Dukungan Teknis'], 'Lisensi Resmi Tahunan — Tidak dapat dipindahtangankan.', 25],
      ['prod-11', 'Lisensi Pro Meeting & Webinar (1000 Peserta)', 'Akun Pro Resmi', 620000, 'Aktivasi Resmi', '1.0 MB', 'blue', 'product', true, true, 11, 'Add-on kapasitas ruang rapat dan webinar resmi untuk kebutuhan acara daring perusahaan.', ['Kapasitas hingga 1000 peserta simulasi', 'Fitur breakout room dan perekaman cloud', 'Aktivasi resmi berizin melalui NEXORA'], ['Panduan Host & Co-Host', 'Checklist Persiapan Webinar', 'Dokumen Aktivasi Lisensi'], 'Lisensi Bulanan Resmi (Multi-unit tersedia untuk divisi).', 18],
      ['prod-12', 'NEXORA Automation Scripts Pack', 'Aplikasi & Platform', 379000, 'JS & Apps Script', '14.5 MB', 'slate', 'product', true, false, 12, 'Kumpulan skrip otomatisasi pelaporan spreadsheet, pengingat email, dan rekap formulir.', ['15 skrip Google Apps Script terdokumentasi', 'Tanpa ketergantungan server eksternal', 'Panduan instalasi langkah demi langkah'], ['15 File Skrip (.gs)', 'Dokumentasi Konfigurasi PDF', 'Contoh Data Uji'], 'Lisensi Pengembang Tunggal.'],
      ['prod-13', 'Mini CRM Pelanggan Berbasis Web', 'Aplikasi & Platform', 449000, 'HTML, JS, JSON', '19.3 MB', 'blue', 'service', false, false, 13, 'Aplikasi pencatatan prospek dan tindak lanjut pelanggan ringan berjalan di browser.', ['Pipeline status prospek visual', 'Ekspor catatan kontak CSV', 'Pencarian cepat riwayat interaksi'], ['Paket Aplikasi Statis', 'Panduan Penggunaan Tim Sales', 'Skema Data JSON Contoh'], 'Lisensi Internal Perusahaan.'],
      ['prod-14', 'E-Book Strategi Jasa Digital Mandiri', 'E-Book', 139000, 'PDF', '11.0 MB', 'amber', 'ebook', false, false, 14, 'Panduan menyusun penawaran jasa, ruang lingkup kerja, dan manajemen revisi klien.', ['Cara menyusun paket Basic hingga Premium', 'Template klausul ruang lingkup & revisi', 'Simulasi penghitungan estimasi jam kerja'], ['E-Book PDF (98 Halaman)', 'Template Dokumen Brief Klien', 'Kalkulator Estimasi Sederhana'], 'Lisensi Personal.'],
      ['prod-15', 'Paket Sound & Motion Transition Kit', 'Konten Digital', 229000, 'WAV, MOGRT', '210.0 MB', 'violet', 'product', false, false, 15, 'Koleksi 80 efek transisi bersih dan audio whoosh bebas royalti untuk editor video.', ['Kualitas audio 24-bit siap pakai', 'Preset motion bersih untuk title & lower third', 'Cocok untuk video YouTube dan modul pelatihan'], ['50 File Audio Transisi WAV', '30 Preset Motion Grafis', 'Katalog Preview Cepat'], 'Lisensi Bebas Royalti untuk Proyek Klien.'],
      ['prod-16', 'Lisensi Pro Suite Produktivitas Dokumen', 'Akun Pro Resmi', 740000, 'Aktivasi Resmi', '1.4 MB', 'emerald', 'product', false, true, 16, 'Paket lisensi tahunan aplikasi pengolah dokumen, penyimpanan cloud, dan kolaborasi resmi.', ['Distribusi resmi dan berizin', 'Dukungan migrasi folder tim', 'Pengelolaan kuota lisensi terpusat'], ['Dokumen Rincian Lisensi', 'Panduan Admin Organisasi', 'Checklist Keamanan Akun'], 'Lisensi Resmi Organisasi (Dapat dibeli multi-unit).', 30],
      ['prod-17', 'UI Kit Wireframe & Design System', 'Konten Digital', 289000, 'Figma', '52.0 MB', 'blue', 'service', false, false, 17, 'Komponen antarmuka bersih dengan sistem token warna, spasi, dan pola dashboard modern.', ['180+ komponen interaktif dalam varian lengkap', 'Struktur token warna Light Premium', 'Contoh halaman checkout dan dashboard'], ['File Figma Design System', 'Dokumentasi Pemakaian Token', 'Checklist Aksesibilitas Warna'], 'Lisensi Tim Desain (hingga 5 desainer).'],
      ['prod-18', 'E-Book Manajemen Pelatihan & Workshop', 'E-Book', 145000, 'PDF & DOCX', '15.2 MB', 'emerald', 'ebook', false, false, 18, 'Panduan teknis penyelenggaraan workshop offline & webinar dari kurikulum hingga evaluasi.', ['Checklist logistik kelas tatap muka & daring', 'Format silabus dan lembar umpan balik peserta', 'Studi kasus penyusunan alur registrasi'], ['E-Book PDF (108 Halaman)', 'Template Silabus DOCX', 'Form Evaluasi Siap Cetak'], 'Lisensi Personal & Lembaga Pelatihan.'],
      ['prod-19', 'Template Proposal & Kontrak Jasa Kreatif', 'Template Digital', 169000, 'DOCX & PDF', '8.7 MB', 'slate', 'product', false, false, 19, 'Kumpulan draf struktur proposal penawaran harga, jadwal milestone, dan berita acara serah terima.', ['Draf contoh siap disesuaikan tim legal Anda', 'Struktur rincian biaya yang transparan', 'Lembar persetujuan deliverable'], ['6 Template Dokumen DOCX', 'Versi PDF Referensi', 'Panduan Pengisian Ruang Lingkup'], 'Lisensi Komersial Studio/Agensi.'],
      ['prod-20', 'Paket Ikon Klasik V1 (Arsip)', 'Konten Digital', 99000, 'SVG', '5.5 MB', 'slate', 'product', false, false, 20, 'Paket ikon generasi lama yang telah diarsipkan namun tetap tersimpan pada riwayat pesanan lama.', ['300 ikon garis 24px', 'Format SVG teroptimasi'], ['Arsip ZIP SVG'], 'Lisensi Personal (Produk Diarsipkan).', null, 'archived']
    ];

    const products = productSpecs.map((p, idx) => ({
      id: p[0],
      name: p[1],
      category: p[2],
      price: p[3],
      fileFormat: p[4],
      fileSize: p[5],
      theme: p[6],
      artType: p[7],
      featured: p[8],
      allowMultiUnit: p[9],
      popularity: 100 - idx * 3,
      shortDesc: p[11],
      description: `${p[11]} Dirancang agar siap diimplementasikan dalam alur kerja tim maupun individu di ekosistem digital modern.`,
      advantages: p[12],
      contents: p[13],
      licenseTerms: p[14],
      licenseLimit: p[15] || null,
      status: p[16] || 'active',
      createdAt: daysAgo(45 - idx),
      thumbnail: createArtworkDataUri({
        type: p[7],
        title: p[1],
        subtitle: `${p[2]} • ${p[4]}`,
        badge: p[2],
        theme: p[6],
        seed: p[10]
      }),
      gallery: [
        createArtworkDataUri({ type: p[7], title: p[1], subtitle: 'Tampilan Utama Produk', badge: 'PREVIEW 01', theme: p[6], seed: p[10] }),
        createArtworkDataUri({ type: 'service', title: `Isi: ${p[1]}`, subtitle: p[13][0] || p[4], badge: 'PREVIEW 02', theme: 'slate', seed: p[10] + 20 }),
        createArtworkDataUri({ type: 'product', title: 'Struktur & Lisensi', subtitle: p[5], badge: 'PREVIEW 03', theme: 'emerald', seed: p[10] + 40 })
      ],
      faqs: [
        { q: 'Kapan file produk dapat saya unduh?', a: 'Pada simulasi ini, tautan unduhan terbuka otomatis di menu Unduhan Digital setelah pembayaran diverifikasi oleh Admin.' },
        { q: 'Apakah perubahan harga di katalog memengaruhi transaksi lama?', a: 'Tidak. Sistem menyimpan snapshot harga saat checkout sehingga nilai transaksi lama tetap konsisten.' }
      ]
    }));

    const services = [
      {
        id: 'srv-01',
        name: 'Website Company Profile',
        category: 'Pembuatan Website',
        startingPrice: 3500000,
        estimateLabel: '10–18 Hari Kerja',
        theme: 'blue',
        shortDesc: 'Website profil perusahaan modern, cepat, responsif, dan terstruktur untuk membangun kredibilitas digital.',
        description: 'Layanan pembuatan website company profile lengkap mulai dari perencanaan struktur informasi, desain antarmuka modern, implementasi responsif, hingga panduan pengelolaan konten.',
        scope: ['Riset struktur halaman & arsitektur informasi', 'Desain UI Light Premium responsif desktop & mobile', 'Integrasi formulir kontak & optimasi kecepatan dasar'],
        deliverables: ['Website siap tayang (multi-halaman)', 'Dokumentasi panduan sunting teks & gambar', 'Sesi serah terima & peninjauan'],
        terms: 'Revisi dihitung per putaran umpan balik terkumpul. Materi teks dan logo dasar disediakan klien atau melalui add-on.',
        faqs: [
          { q: 'Apakah domain dan hosting sudah termasuk?', a: 'Paket tertentu mencakup panduan setup; biaya domain/hosting tahunan dapat dimasukkan pada penawaran custom sesuai kebutuhan.' },
          { q: 'Bagaimana jika butuh fitur khusus di luar paket?', a: 'Gunakan tombol Minta Penawaran Custom untuk mendiskusikan integrasi atau halaman khusus.' }
        ]
      },
      {
        id: 'srv-02',
        name: 'Website Toko Online',
        category: 'Pembuatan Website',
        startingPrice: 5500000,
        estimateLabel: '14–25 Hari Kerja',
        theme: 'violet',
        shortDesc: 'Platform e-commerce terstruktur dengan katalog produk, keranjang, checkout, dan manajemen pesanan.',
        description: 'Solusi pembangunan website toko online yang memudahkan pengelolaan katalog, variasi produk, alur pemesanan, serta pelaporan penjualan.',
        scope: ['Arsitektur katalog & filter kategori', 'Alur keranjang, checkout, dan status pesanan', 'Pelatihan singkat pengelolaan dashboard admin'],
        deliverables: ['Website toko online responsif', 'Panduan input produk & kelola pesanan', 'Checklist peluncuran'],
        terms: 'Integrasi payment gateway eksternal memerlukan akun merchant resmi klien pada tahap production.',
        faqs: [{ q: 'Apakah bisa mulai dengan pembayaran transfer manual?', a: 'Ya, sangat cocok untuk UMKM yang ingin memverifikasi transfer secara langsung.' }]
      },
      {
        id: 'srv-03',
        name: 'Landing Page Profesional',
        category: 'Pembuatan Website',
        startingPrice: 1850000,
        estimateLabel: '5–9 Hari Kerja',
        theme: 'blue',
        shortDesc: 'Halaman penawaran tunggal berfokus konversi untuk peluncuran produk, event, atau kampanye iklan.',
        description: 'Perancangan satu halaman terfokus dengan hirarki visual jelas, penempatan CTA strategis, dan kecepatan muat tinggi.',
        scope: ['Penyusunan wireframe alur narasi halaman', 'Desain visual khusus sesuai identitas brand', 'Implementasi responsif & formulir lead'],
        deliverables: ['1 Landing page siap pakai', 'Aset visual header', 'Panduan pelacakan CTA'],
        terms: 'Materi penawaran utama dan penawaran harga disiapkan sebelum tahap desain dimulai.',
        faqs: [{ q: 'Berapa lama pengerjaan standar?', a: 'Rata-rata 5 hingga 9 hari kerja tergantung kelengkapan materi awal.' }]
      },
      {
        id: 'srv-04',
        name: 'Editing Video YouTube',
        category: 'Editing Video',
        startingPrice: 950000,
        estimateLabel: '3–6 Hari Kerja',
        theme: 'amber',
        shortDesc: 'Penyuntingan video berdurasi panjang dengan pacing rapi, lower third, color grading, dan audio bersih.',
        description: 'Membantu kreator dan perusahaan menghasilkan video edukasi maupun dokumentasi dengan ritme penyampaian yang nyaman ditonton.',
        scope: ['Pemotongan footage & penyusunan alur cerita', 'Penambahan motion text, B-roll, & transisi halus', 'Pembersihan noise audio & color balancing'],
        deliverables: ['Master video Full HD / 4K MP4', 'Thumbnail konsep opsional', '1–3 kali putaran revisi'],
        terms: 'Footage mentah dikirim melalui tautan penyimpanan cloud dengan catatan timestamp penting.',
        faqs: [{ q: 'Apakah musik latar bebas hak cipta disediakan?', a: 'Ya, menggunakan katalog musik berlisensi aman untuk publikasi.' }]
      },
      {
        id: 'srv-05',
        name: 'Editing Short Video',
        category: 'Editing Konten',
        startingPrice: 650000,
        estimateLabel: '2–4 Hari Kerja',
        theme: 'emerald',
        shortDesc: 'Paket editing video vertikal (Reels, TikTok, Shorts) dengan hook kuat, subtitle dinamis, dan ritme cepat.',
        description: 'Mengubah rekaman mentah atau potongan webinar menjadi konten pendek yang padat pesan dan ramah layar ponsel.',
        scope: ['Pemilihan momen hook 3 detik pertama', 'Subtitle akurat berbahasa Indonesia', 'Penyesuaian rasio vertikal 9:16'],
        deliverables: ['Batch video vertikal MP4 siap unggah', 'Draft preview untuk peninjauan', 'Revisi teks & pacing'],
        terms: 'Minimal pemesanan paket sesuai kuota batch pada masing-masing paket.',
        faqs: [{ q: 'Bisakah mengambil potongan dari rekaman Zoom?', a: 'Bisa, cukup kirimkan file rekaman webinar atau podcast Anda.' }]
      },
      {
        id: 'srv-06',
        name: 'Streaming Zoom Webinar',
        category: 'Streaming Zoom',
        startingPrice: 1200000,
        estimateLabel: 'Persiapan 2–5 Hari',
        theme: 'blue',
        shortDesc: 'Dukungan teknis penyelenggaraan webinar dan acara hybrid lengkap dengan operator, overlay, dan gladi resik.',
        description: 'Memastikan acara daring Anda berjalan tertib dari manajemen ruang tunggu, spotlight pembicara, tampilan visual siaran, hingga rekaman pasca-acara.',
        scope: ['Penyiapan ruang webinar & tata letak overlay', 'Gladi resik teknis bersama pembicara', 'Pendampingan operator penuh selama acara berlangsung'],
        deliverables: ['Operasional live streaming lancar', 'File rekaman mentah pasca-acara', 'Ringkasan daftar hadir ekspor CSV'],
        terms: 'Jadwal acara dikunci setelah pembayaran terverifikasi dan slot tanggal tersedia.',
        faqs: [{ q: 'Apakah bisa multi-pembicara dari lokasi berbeda?', a: 'Bisa, operator kami mengatur spotlight dan transisi layar setiap pembicara.' }]
      },
      {
        id: 'srv-07',
        name: 'Desain Konten Media Sosial',
        category: 'Desain Kreatif',
        startingPrice: 1400000,
        estimateLabel: '5–8 Hari Kerja',
        theme: 'violet',
        shortDesc: 'Produksi visual feed, carousel edukasi, dan materi kampanye yang konsisten dengan pedoman merek.',
        description: 'Layanan desain bulanan atau per kampanye untuk menjaga identitas visual media sosial Anda terlihat profesional dan mudah dikenali.',
        scope: ['Penyelarasan gaya visual dengan brand guideline', 'Desain grid feed, carousel, & story', 'Penyerahan file master siap arsip'],
        deliverables: ['Paket desain PNG/JPG resolusi tinggi', 'Link master template yang disepakati', 'Kalender urutan posting contoh'],
        terms: 'Copywriting inti dapat disediakan klien atau disertakan pada paket Professional/Premium.',
        faqs: [{ q: 'Apakah desain mencakup file sumber?', a: 'File sumber tersedia pada paket Professional dan Premium.' }]
      },
      {
        id: 'srv-08',
        name: 'Custom Digital Project',
        category: 'Layanan Custom',
        startingPrice: 4500000,
        estimateLabel: 'Sesuai Ruang Lingkup',
        theme: 'slate',
        shortDesc: 'Solusi proyek digital terintegrasi yang menggabungkan web, sistem internal, produksi konten, dan pelatihan tim.',
        description: 'Dirancang khusus untuk kebutuhan organisasi atau bisnis yang memerlukan pendekatan bertahap dan penawaran harga yang disesuaikan.',
        scope: ['Sesi penemuan kebutuhan dan pemetaan solusi', 'Penyusunan dokumen penawaran harga & timeline', 'Eksekusi multi-disiplin dan pendampingan'],
        deliverables: ['Proposal ruang lingkup & RAB simulasi', 'Hasil proyek sesuai milestone', 'Dokumentasi serah terima'],
        terms: 'Dimulai dari pengajuan form permintaan custom dan persetujuan penawaran oleh pelanggan.',
        faqs: [{ q: 'Bagaimana alur layanan custom?', a: 'Anda mengisi formulir kebutuhan, admin mengirim penawaran resmi, Anda menyetujui penawaran, lalu invoice diterbitkan.' }]
      }
    ].map((s, idx) => ({
      ...s,
      thumbnail: createArtworkDataUri({
        type: 'service',
        title: s.name,
        subtitle: `${s.category} • Mulai ${formatIDR(s.startingPrice)}`,
        badge: s.category,
        theme: s.theme,
        seed: idx + 101
      })
    }));

    const tierConfigs = [
      { tier: 'Basic', mult: 1, rev: 1, daysDelta: 0, note: 'Cocok untuk kebutuhan awal yang ringkas dan cepat.' },
      { tier: 'Professional', mult: 1.75, rev: 3, daysDelta: 3, note: 'Pilihan seimbang untuk bisnis bertumbuh dengan fitur lebih lengkap.' },
      { tier: 'Premium', mult: 2.6, rev: 5, daysDelta: 6, note: 'Pendampingan prioritas dengan cakupan deliverable paling komprehensif.' }
    ];

    const servicePackages = [];
    services.forEach((srv, sIdx) => {
      tierConfigs.forEach((t, tIdx) => {
        const price = Math.round((srv.startingPrice * t.mult) / 50000) * 50000;
        const baseDays = 5 + sIdx + t.daysDelta;
        servicePackages.push({
          id: `pkg-${srv.id}-${t.tier.toLowerCase()}`,
          serviceId: srv.id,
          tier: t.tier,
          name: `${srv.name} — Paket ${t.tier}`,
          price,
          revisions: t.rev,
          estimatedDays: baseDays,
          summary: t.note,
          features: [
            `${srv.scope[0]}`,
            tIdx >= 1 ? `${srv.scope[1]} + penyesuaian lanjutan` : `${srv.scope[1]} standar`,
            tIdx === 2 ? 'Prioritas komunikasi & file master lengkap' : `Maksimal ${t.rev}x putaran revisi terstruktur`,
            `Estimasi pengerjaan ${baseDays} hari kerja`
          ],
          status: 'active'
        });
      });
    });

    const trainingPrograms = [
      {
        id: 'trn-01',
        title: 'Pelatihan AI TQN',
        category: 'Kecerdasan Buatan',
        mode: 'Offline / Hybrid',
        primaryLocation: 'Cisarua & Online',
        price: 750000,
        theme: 'blue',
        instructor: 'Hendrik Suryana (Instruktur Contoh — Praktisi AI Terapan)',
        shortDesc: 'Penerapan kecerdasan buatan praktis untuk otomasi dokumen, riset materi, dan produktivitas organisasi.',
        description: 'Program intensif berbasis praktik langsung untuk memahami alur kerja AI secara terstruktur, aman, dan kontekstual.',
        objectives: ['Memahami prinsip penyusunan prompt efektif', 'Membangun asisten alur kerja harian tanpa coding rumit', 'Menerapkan verifikasi akurasi output AI'],
        curriculum: ['Sesi 1: Fondasi & Peta Penggunaan AI', 'Sesi 2: Rekayasa Prompt & Studi Kasus Kantor', 'Sesi 3: Integrasi Konten & Evaluasi Risiko'],
        facilities: ['Modul digital & lembar kerja', 'Sertifikat penyelesaian simulasi', 'Konsumsi & ruang belajar nyaman (untuk kelas tatap muka)'],
        requirements: 'Membawa laptop pribadi dan memiliki akun email aktif.',
        faqs: [{ q: 'Apakah cocok untuk peserta non-teknis?', a: 'Ya, materi disusun bertahap dari pengenalan konsep hingga praktik langsung.' }]
      },
      {
        id: 'trn-02',
        title: 'Pelatihan Barista',
        category: 'Vokasi & F&B',
        mode: 'Offline',
        primaryLocation: 'Bekasi',
        price: 1250000,
        theme: 'amber',
        instructor: 'Dimas Ardiansyah (Instruktur Contoh — Praktisi Seduh Kopi)',
        shortDesc: 'Kelas praktik meracik espresso, kalibrasi gilingan, milk steaming, dan standar operasional kedai.',
        description: 'Pelatihan tatap muka langsung di bar simulasi untuk membangun keterampilan dasar barista hingga manajemen alur kerja meja seduh.',
        objectives: ['Mengenal karakter biji dan profil sangrai', 'Melakukan kalibrasi espresso secara konsisten', 'Mempraktikkan teknik tekstur susu dan menu populer'],
        curriculum: ['Pengenalan Kopi & Peralatan Bar', 'Kalibrasi Grinder & Ekstraksi Espresso', 'Milk Texturing & Simulasi Penyajian'],
        facilities: ['Bahan praktik kopi & susu disediakan', 'Celemek latihan & buku panduan seduh', 'Sertifikat keikutsertaan simulasi'],
        requirements: 'Peserta hadir minimal 15 menit sebelum sesi dimulai.',
        faqs: [{ q: 'Apakah alat praktik disediakan di lokasi?', a: 'Ya, seluruh mesin espresso dan perlengkapan manual brew disiapkan di lokasi.' }]
      },
      {
        id: 'trn-03',
        title: 'Pelatihan Offline Cisarua',
        category: 'Digital & Kepemimpinan',
        mode: 'Offline',
        primaryLocation: 'Cisarua, Bogor',
        price: 1450000,
        theme: 'emerald',
        instructor: 'Nadia Kusuma (Instruktur Contoh — Fasilitator Transformasi Digital)',
        shortDesc: 'Bootcamp tatap muka di lingkungan asri Cisarua membahas strategi bisnis digital dan eksekusi tim.',
        description: 'Program intensif luar ruang/kelas yang menggabungkan lokakarya perencanaan produk digital, kolaborasi tim, dan simulasi peluncuran.',
        objectives: ['Menyusun peta jalan inisiatif digital 90 hari', 'Melatih komunikasi lintas peran produk & pemasaran', 'Menghasilkan prototipe rencana aksi'],
        curriculum: ['Hari 1: Pemetaan Masalah & Model Nilai', 'Hari 1 Sore: Desain Alur Layanan Digital', 'Hari 2: Simulasi Presentasi & Evaluasi'],
        facilities: ['Ruang pelatihan Cisarua & kit peserta', 'Makan siang dan rehat kopi', 'Template rencana kerja digital'],
        requirements: 'Membawa laptop dan catatan proyek masing-masing.',
        faqs: [{ q: 'Apakah tersedia pilihan tanpa menginap?', a: 'Informasi detail akomodasi contoh tertera pada deskripsi setiap jadwal sesi.' }]
      },
      {
        id: 'trn-04',
        title: 'Pelatihan Offline Bekasi',
        category: 'Digital Marketing & UMKM',
        mode: 'Offline',
        primaryLocation: 'Bekasi',
        price: 650000,
        theme: 'blue',
        instructor: 'Bagus Santoso (Instruktur Contoh — Konsultan UMKM Digital)',
        shortDesc: 'Kelas praktik tatap muka di Bekasi untuk membangun katalog online, konten promosi, dan pencatatan kas.',
        description: 'Dirancang bagi pelaku usaha di wilayah Bekasi dan sekitarnya agar mampu merapikan etalase digital dan alur layanan pelanggan.',
        objectives: ['Menata katalog produk dan deskripsi yang jelas', 'Membuat kalender konten mingguan', 'Mencatat transaksi masuk dan arus kas dasar'],
        curriculum: ['Audit Etalase Digital Usaha', 'Praktik Pembuatan Konten & Copywriting', 'Simulasi Pencatatan Pesanan & Keuangan'],
        facilities: ['Ruang belajar ber-AC di Bekasi', 'Buku kerja cetak & file template', 'Sesi konsultasi kelompok'],
        requirements: 'Membawa ponsel berkamera atau laptop serta daftar produk usaha.',
        faqs: [{ q: 'Apakah ada pendampingan setelah kelas?', a: 'Peserta mendapatkan akses grup diskusi alumni contoh selama 14 hari.' }]
      },
      {
        id: 'trn-05',
        title: 'Webinar AI',
        category: 'Kecerdasan Buatan',
        mode: 'Online',
        primaryLocation: 'Online (Zoom)',
        price: 149000,
        theme: 'violet',
        instructor: 'Hendrik Suryana (Instruktur Contoh — Praktisi AI Terapan)',
        shortDesc: 'Sesi daring interaktif 2,5 jam membedah alat AI terbaru untuk riset, penulisan, dan desain materi.',
        description: 'Webinar terfokus yang memberikan demonstrasi langsung penggunaan perangkat AI untuk mempercepat pekerjaan tanpa mengorbankan kualitas.',
        objectives: ['Mengenal skenario penggunaan AI yang relevan', 'Mempraktikkan template prompt ringkas', 'Menghindari kesalahan umum validasi informasi'],
        curriculum: ['Demo Alur Kerja AI untuk Teks & Ringkasan', 'Demo Pembuatan Struktur Presentasi Cepat', 'Sesi Tanya Jawab Interaktif'],
        facilities: ['Akses Zoom Webinar resmi', 'Rekaman ulang akses terbatas (simulasi)', 'E-sertifikat partisipasi'],
        requirements: 'Koneksi internet stabil dan aplikasi Zoom versi terbaru.',
        faqs: [{ q: 'Kapan tautan Zoom dikirimkan?', a: 'Tautan akses muncul pada detail pendaftaran setelah pembayaran diverifikasi Admin.' }]
      },
      {
        id: 'trn-06',
        title: 'Workshop Digital',
        category: 'Desain & Produk Digital',
        mode: 'Online',
        primaryLocation: 'Online (Zoom)',
        price: 390000,
        theme: 'slate',
        instructor: 'Rina Permata (Instruktur Contoh — Product Designer)',
        shortDesc: 'Workshop praktik membangun aset produk digital pertama dari validasi ide hingga siap dijual.',
        description: 'Membimbing peserta menyusun kerangka e-book, template, atau aset digital yang memiliki nilai guna nyata dan siap dipasarkan.',
        objectives: ['Menentukan topik produk digital yang spesifik', 'Menyusun struktur kemasan dan halaman penjualan', 'Menyiapkan mekanisme pengiriman file ke pembeli'],
        curriculum: ['Penentuan Masalah & Format Produk', 'Produksi Aset & Penulisan Panduan Lisensi', 'Simulasi Alur Penjualan & Pembayaran'],
        facilities: ['File kerja workshop', 'Contoh halaman detail produk', 'Sesi tinjauan konsep peserta'],
        requirements: 'Memiliki ide topik atau keahlian dasar yang ingin dikemas.',
        faqs: [{ q: 'Apakah workshop ini direkam?', a: 'Ya, peserta terdaftar memperoleh akses rekaman simulasi selama 30 hari.' }]
      }
    ].map((t, idx) => ({
      ...t,
      thumbnail: createArtworkDataUri({
        type: 'training',
        title: t.title,
        subtitle: `${t.mode} • ${t.primaryLocation}`,
        badge: t.category,
        theme: t.theme,
        seed: idx + 201
      })
    }));

    const trainingSessions = [
      { id: 'ses-01', programId: 'trn-01', title: 'Batch 04 — Intensif AI TQN Cisarua', mode: 'Offline', location: 'Pusat Pelatihan Cisarua, Bogor', date: daysAhead(12), timeLabel: '09:00 – 16:00 WIB', quota: 25, confirmedCount: 16, reservedCount: 2, status: 'open' },
      { id: 'ses-02', programId: 'trn-01', title: 'Batch 05 — AI TQN Kelas Daring Akhir Pekan', mode: 'Online', location: 'Online via Zoom', date: daysAhead(21), timeLabel: '09:30 – 15:00 WIB', quota: 40, confirmedCount: 22, reservedCount: 1, status: 'open' },
      { id: 'ses-03', programId: 'trn-02', title: 'Batch 08 — Barista Dasar & Espresso Calibration', mode: 'Offline', location: 'Training Bar Bekasi Barat', date: daysAhead(9), timeLabel: '10:00 – 16:30 WIB', quota: 12, confirmedCount: 8, reservedCount: 1, status: 'open' },
      { id: 'ses-04', programId: 'trn-02', title: 'Batch 09 — Barista Akhir Pekan (Penuh)', mode: 'Offline', location: 'Training Bar Bekasi Barat', date: daysAhead(5), timeLabel: '10:00 – 16:30 WIB', quota: 10, confirmedCount: 10, reservedCount: 0, status: 'open' },
      { id: 'ses-05', programId: 'trn-03', title: 'Camp Cisarua — Strategi Ekosistem Digital', mode: 'Offline', location: 'Villa Edukasi Cisarua, Bogor', date: daysAhead(18), timeLabel: '08:30 – 17:00 WIB (2 Hari)', quota: 20, confirmedCount: 11, reservedCount: 1, status: 'open' },
      { id: 'ses-06', programId: 'trn-03', title: 'Camp Cisarua — Edisi Khusus Tim Kreatif', mode: 'Offline', location: 'Villa Edukasi Cisarua, Bogor', date: daysAhead(32), timeLabel: '08:30 – 17:00 WIB (2 Hari)', quota: 20, confirmedCount: 6, reservedCount: 0, status: 'open' },
      { id: 'ses-07', programId: 'trn-04', title: 'Kelas Bekasi — Digitalisasi Katalog UMKM', mode: 'Offline', location: 'Hub Kreatif Bekasi Selatan', date: daysAhead(14), timeLabel: '09:00 – 15:30 WIB', quota: 24, confirmedCount: 14, reservedCount: 1, status: 'open' },
      { id: 'ses-08', programId: 'trn-04', title: 'Kelas Bekasi — Konten & Keuangan Praktis', mode: 'Offline', location: 'Hub Kreatif Bekasi Selatan', date: daysAhead(28), timeLabel: '09:00 – 15:30 WIB', quota: 24, confirmedCount: 7, reservedCount: 0, status: 'open' },
      { id: 'ses-09', programId: 'trn-05', title: 'Webinar AI — Otomasi Kerja & Prompting', mode: 'Online', location: 'Online via Zoom', date: daysAhead(6), timeLabel: '19:00 – 21:30 WIB', quota: 100, confirmedCount: 64, reservedCount: 3, status: 'open' },
      { id: 'ses-10', programId: 'trn-05', title: 'Webinar AI — Pemanfaatan AI untuk Konten', mode: 'Online', location: 'Online via Zoom', date: daysAhead(16), timeLabel: '19:00 – 21:30 WIB', quota: 100, confirmedCount: 41, reservedCount: 0, status: 'open' },
      { id: 'ses-11', programId: 'trn-06', title: 'Workshop — Merancang Produk Digital Pertama', mode: 'Online', location: 'Online via Zoom', date: daysAhead(11), timeLabel: '13:00 – 16:30 WIB', quota: 35, confirmedCount: 19, reservedCount: 2, status: 'open' },
      { id: 'ses-12', programId: 'trn-06', title: 'Workshop — Sistem Template & Lisensi', mode: 'Online', location: 'Online via Zoom', date: daysAhead(25), timeLabel: '13:00 – 16:30 WIB', quota: 35, confirmedCount: 10, reservedCount: 0, status: 'open' }
    ];

    const articles = [
      ['art-01', 'Cara Membangun Ekosistem Produk Digital dari Nol untuk Bisnis Kecil', 'Produk Digital', 'Nadia Kusuma (Penulis Contoh)', 6, 'blue', true],
      ['art-02', 'Panduan Menentukan Paket Jasa Tetap vs Penawaran Custom', 'Jasa & Proyek', 'Bagus Santoso (Penulis Contoh)', 5, 'violet', false],
      ['art-03', 'Penerapan AI Praktis untuk Mempercepat Riset dan Penulisan Brief', 'Kecerdasan Buatan', 'Hendrik Suryana (Penulis Contoh)', 7, 'blue', false],
      ['art-04', 'Checklist Persiapan Teknis Webinar Zoom agar Siaran Berjalan Tertib', 'Produksi & Streaming', 'Raka Mahendra (Penulis Contoh)', 4, 'emerald', false],
      ['art-05', 'Struktur Halaman Landing Page yang Jelas dan Mudah Dipahami Pengunjung', 'Desain & Web', 'Rina Permata (Penulis Contoh)', 6, 'amber', false],
      ['art-06', 'Mengapa Snapshot Harga Penting dalam Sistem Transaksi Digital', 'Sistem Commerce', 'Alya Wijaya (Penulis Contoh)', 5, 'slate', false],
      ['art-07', 'Tips Merancang Pelatihan Hybrid antara Kelas Tatap Muka dan Daring', 'Pelatihan & Akademi', 'Nadia Kusuma (Penulis Contoh)', 6, 'emerald', false],
      ['art-08', 'Menyusun Kalender Konten Instagram yang Konsisten Tanpa Kehabisan Ide', 'Konten Digital', 'Salsa Azzahra (Penulis Contoh)', 5, 'violet', false],
      ['art-09', 'Standar Dasar Pencatatan Keuangan bagi Pelaku Jasa Kreatif', 'Bisnis Digital', 'Bagus Santoso (Penulis Contoh)', 5, 'amber', false],
      ['art-10', 'Memahami Perbedaan Lisensi Personal, Tim, dan Komersial pada Produk Digital', 'Produk Digital', 'Alya Wijaya (Penulis Contoh)', 4, 'blue', false],
      ['art-11', 'Langkah Menyiapkan Materi Brief sebelum Memesan Pembuatan Website', 'Jasa & Proyek', 'Rina Permata (Penulis Contoh)', 5, 'slate', false],
      ['art-12', 'Evaluasi Kualitas Audio dan Pencahayaan untuk Konten Video Edukasi', 'Produksi & Streaming', 'Dimas Ardiansyah (Penulis Contoh)', 6, 'emerald', false]
    ].map((a, idx) => ({
      id: a[0],
      title: a[1],
      category: a[2],
      author: a[3],
      readMinutes: a[4],
      theme: a[5],
      featured: a[6],
      status: 'published',
      publishedAt: daysAgo(30 - idx * 2),
      excerpt: `Pembahasan terstruktur mengenai ${a[1].toLowerCase()} dengan langkah praktis yang dapat diterapkan langsung oleh kreator dan tim usaha.`,
      cover: createArtworkDataUri({
        type: 'ebook',
        title: a[1],
        subtitle: `${a[2]} • ${a[4]} menit baca`,
        badge: 'INSIGHT NEXORA',
        theme: a[5],
        seed: idx + 301
      }),
      sections: [
        {
          id: `sec-${idx}-1`,
          heading: 'Latar Belakang dan Konteks Utama',
          body: `Dalam pengelolaan inisiatif digital modern, keterpaduan antara produk, layanan, dan peningkatan kapasitas SDM menjadi kunci keberlanjutan. Artikel contoh ini mengulas pendekatan praktis seputar ${a[1].toLowerCase()} secara ringkas dan sistematis.`
        },
        {
          id: `sec-${idx}-2`,
          heading: 'Langkah Implementasi Terstruktur',
          body: 'Mulailah dengan memetakan tujuan utama, menginventarisasi sumber daya yang tersedia, dan menetapkan indikator keberhasilan yang terukur sebelum memperluas skala kegiatan.',
          bullets: [
            'Tetapkan definisi hasil akhir yang jelas sejak awal proyek.',
            'Gunakan template kerja dan daftar periksa agar kualitas konsisten.',
            'Evaluasi hasil secara berkala berdasarkan umpan balik nyata pengguna.'
          ]
        },
        {
          id: `sec-${idx}-3`,
          heading: 'Ringkasan dan Langkah Lanjutan',
          body: 'Pendekatan bertahap membantu mengurangi risiko pemborosan biaya dan menjaga fokus eksekusi. Anda dapat mengeksplorasi produk digital, paket jasa, atau program pelatihan terkait langsung di ekosistem NEXORA.'
        }
      ]
    }));

    const portfolios = [
      ['prt-01', 'Portal Profil Usaha Kuliner Nusantara (Contoh)', 'Website', 'Klien Contoh: Dapur Nusa', 'blue', 'Pembuatan website company profile multi-halaman dengan katalog menu dan reservasi kontak.'],
      ['prt-02', 'Redesign Sistem Toko Online Aksesori Kerja (Contoh)', 'Website', 'Klien Contoh: MejaRapi Studio', 'violet', 'Perancangan ulang etalase toko online dengan filter kategori responsif dan alur checkout ringkas.'],
      ['prt-03', 'Identitas Visual & Paket Carousel Edukasi Finansial (Contoh)', 'Desain', 'Klien Contoh: RencanaDana', 'emerald', 'Penyusunan 30 template carousel edukasi dan pedoman tipografi media sosial yang konsisten.'],
      ['prt-04', 'Produksi Serial Video Tutorial Aplikasi Keuangan (Contoh)', 'Editing', 'Klien Contoh: CatatKas', 'amber', 'Editing 12 episode video YouTube dan 24 potongan video vertikal lengkap dengan subtitle rapi.'],
      ['prt-05', 'Operator Teknis & Visual Overlay Konferensi Daring (Contoh)', 'Streaming', 'Klien Contoh: Forum Kreator Daerah', 'blue', 'Pengelolaan siaran Zoom Webinar untuk 400+ peserta dengan transisi multi-pembicara dan rekaman bersih.'],
      ['prt-06', 'Landing Page Peluncuran Program Pelatihan Vokasi (Contoh)', 'Website', 'Klien Contoh: Akademi Karya', 'slate', 'Desain dan implementasi landing page konversi dengan informasi jadwal sesi dan ringkasan silabus.'],
      ['prt-07', 'Motion Graphics & Intro Modul Pembelajaran Video (Contoh)', 'Editing', 'Klien Contoh: BelajarMandiri', 'violet', 'Paket bumper pembuka, lower third instruktur, dan penataan audio modul pembelajaran daring.'],
      ['prt-08', 'Kit Presentasi & Proposal Kemitraan B2B (Contoh)', 'Desain', 'Klien Contoh: Sinergi Logistik', 'emerald', 'Desain deck presentasi korporat 45 slide beserta ikonografi kustom yang mudah disunting.']
    ].map((pt, idx) => ({
      id: pt[0],
      title: pt[1],
      category: pt[2],
      client: pt[3],
      theme: pt[4],
      summary: pt[5],
      status: 'published',
      completedAt: daysAgo(40 - idx * 4),
      needs: `Klien membutuhkan penyajian informasi dan aset visual di bidang ${pt[2].toLowerCase()} yang rapi, modern, dan mudah diakses lintas perangkat.`,
      approach: 'Tim melaksanakan sesi penyelarasan brief, pembuatan prototipe visual tahap awal, pengujian responsif, serta penyempurnaan berdasarkan umpan balik terstruktur.',
      deliverables: ['Aset utama sesuai ruang lingkup yang disepakati', 'Dokumentasi panduan penggunaan', 'Arsip file master contoh'],
      outcome: 'Seluruh deliverable contoh terselesaikan sesuai jadwal simulasi dengan tampilan konsisten di desktop maupun mobile.',
      thumbnail: createArtworkDataUri({
        type: 'portfolio',
        title: pt[1],
        subtitle: `${pt[2]} • ${pt[3]}`,
        badge: `PORTOFOLIO ${pt[2].toUpperCase()}`,
        theme: pt[4],
        seed: idx + 401
      }),
      gallery: [
        createArtworkDataUri({ type: 'portfolio', title: pt[1], subtitle: 'Tampilan Desktop', badge: 'GALERI 01', theme: pt[4], seed: idx + 401 }),
        createArtworkDataUri({ type: 'service', title: 'Detail Komponen & Alur', subtitle: pt[3], badge: 'GALERI 02', theme: 'slate', seed: idx + 421 })
      ]
    }));

    const customerNames = [
      ['cust-01', 'Raka Pratama', 'pelanggan@example.com', '0812-3456-7890', 'Pratama Digital Lab'],
      ['cust-02', 'Siti Rahmawati', 'siti.rahma@example.com', '0813-2201-4411', 'Kopi Senja Bekasi'],
      ['cust-03', 'Andi Wijanarko', 'andi.w@example.com', '0815-9921-1022', 'Wijanarko Konsultan'],
      ['cust-04', 'Dewi Lestari', 'dewi.l@example.com', '0817-4452-3310', 'Studio Lestari'],
      ['cust-05', 'Fajar Nugroho', 'fajar.n@example.com', '0818-7761-9901', 'Nugroho Media'],
      ['cust-06', 'Maya Puspita', 'maya.p@example.com', '0819-6612-8821', 'Puspita Craft'],
      ['cust-07', 'Bima Saputra', 'bima.s@example.com', '0821-3341-7712', 'Saputra Tech'],
      ['cust-08', 'Intan Permata', 'intan.p@example.com', '0822-5519-6620', 'Karya Intan'],
      ['cust-09', 'Reza Mahendra', 'reza.m@example.com', '0852-1190-3341', 'Mahendra Edu'],
      ['cust-10', 'Putri Anggraini', 'putri.a@example.com', '0856-8812-9012', 'Anggraini Studio'],
      ['cust-11', 'Gilang Ramadhan', 'gilang.r@example.com', '0857-4410-2219', 'Ramadhan Visual'],
      ['cust-12', 'Tari Kartika', 'tari.k@example.com', '0812-9011-7743', 'Kartika Food'],
      ['cust-13', 'Yoga Pratista', 'yoga.p@example.com', '0813-7741-5510', 'Pratista Web'],
      ['cust-14', 'Nisa Fauziah', 'nisa.f@example.com', '0878-2210-4418', 'Fauziah Learning'],
      ['cust-15', 'Hendra Gunawan', 'hendra.g@example.com', '0811-9023-1182', 'Gunawan Retail'],
      ['cust-16', 'Larasati Dewi', 'laras.d@example.com', '0812-6619-2204', 'Laras Creative']
    ];

    const customers = customerNames.map((c, idx) => ({
      id: c[0],
      name: c[1],
      email: c[2],
      password: 'demo123',
      phone: c[3],
      company: c[4],
      role: 'customer',
      verified: true,
      preferences: { emailNotif: true, newsletter: idx % 2 === 0 },
      createdAt: daysAgo(60 - idx * 2)
    }));

    const orders = [];
    const invoices = [];
    const payments = [];

    const statusesFor22 = [
      'Menunggu Verifikasi', 'Menunggu Verifikasi', 'Menunggu Verifikasi', 'Menunggu Verifikasi',
      'Menunggu Verifikasi', 'Menunggu Verifikasi', 'Menunggu Verifikasi', 'Menunggu Verifikasi',
      'Pembayaran Diverifikasi', 'Pembayaran Diverifikasi', 'Pembayaran Diverifikasi', 'Pembayaran Diverifikasi',
      'Pembayaran Diverifikasi', 'Pembayaran Diverifikasi',
      'Menunggu Pembayaran', 'Menunggu Pembayaran',
      'Pembayaran Ditolak', 'Pembayaran Ditolak',
      'Pembayaran Kedaluwarsa', 'Pembayaran Kedaluwarsa',
      'Pesanan Dibatalkan', 'Pembayaran Diverifikasi'
    ];

    for (let i = 0; i < 22; i++) {
      const num = String(i + 1).padStart(3, '0');
      const ordId = `ord-${num}`;
      const invId = `inv-${num}`;
      const payId = `pay-${num}`;
      const orderNo = `NX-ORD-2026-${num}`;
      const invoiceNo = `NX-INV-2026-${num}`;
      const cust = i < 7 ? customers[0] : customers[(i % 15) + 1];
      const payStatus = statusesFor22[i];

      let type = 'product';
      let itemTitle = '';
      let amount = 0;
      let items = [];

      if (i % 4 === 0) {
        type = 'product';
        const prod = products[i % 14];
        itemTitle = prod.name;
        amount = prod.price;
        items = [{
          refId: prod.id,
          name: prod.name,
          category: prod.category,
          unitPrice: prod.price,
          qty: 1,
          subtotal: prod.price
        }];
      } else if (i % 4 === 1) {
        type = 'service';
        const pkg = servicePackages[(i * 2) % servicePackages.length];
        itemTitle = pkg.name;
        amount = pkg.price;
        items = [{
          refId: pkg.id,
          name: pkg.name,
          category: 'Jasa Digital',
          unitPrice: pkg.price,
          qty: 1,
          subtotal: pkg.price
        }];
      } else if (i % 4 === 2) {
        type = 'training';
        const ses = trainingSessions[i % trainingSessions.length];
        const prog = trainingPrograms.find((pr) => pr.id === ses.programId);
        itemTitle = `${prog.title} — ${ses.title}`;
        amount = prog.price;
        items = [{
          refId: ses.id,
          programId: prog.id,
          name: itemTitle,
          category: 'Pelatihan',
          unitPrice: prog.price,
          qty: 1,
          subtotal: prog.price
        }];
      } else {
        type = 'product';
        const pA = products[(i + 2) % 12];
        const pB = products[(i + 5) % 12];
        itemTitle = `${pA.name} & 1 item lainnya`;
        amount = pA.price + pB.price;
        items = [
          { refId: pA.id, name: pA.name, category: pA.category, unitPrice: pA.price, qty: 1, subtotal: pA.price },
          { refId: pB.id, name: pB.name, category: pB.category, unitPrice: pB.price, qty: 1, subtotal: pB.price }
        ];
      }

      const createdAt = daysAgo(24 - i);
      const orderStatus =
        payStatus === 'Pembayaran Diverifikasi' ? 'Selesai'
          : payStatus === 'Pesanan Dibatalkan' ? 'Dibatalkan'
            : payStatus === 'Pembayaran Kedaluwarsa' ? 'Kedaluwarsa'
              : payStatus === 'Pembayaran Ditolak' ? 'Perlu Unggah Ulang'
                : payStatus === 'Menunggu Verifikasi' ? 'Menunggu Verifikasi'
                  : 'Menunggu Pembayaran';

      const invStatus =
        payStatus === 'Pembayaran Diverifikasi' ? 'Lunas'
          : payStatus === 'Pesanan Dibatalkan' ? 'Dibatalkan'
            : payStatus === 'Pembayaran Kedaluwarsa' ? 'Kedaluwarsa'
              : 'Belum Lunas';

      orders.push({
        id: ordId,
        orderNo,
        invoiceId: invId,
        paymentId: payId,
        customerId: cust.id,
        customerName: cust.name,
        customerEmail: cust.email,
        type,
        summaryTitle: itemTitle,
        items,
        subtotal: amount,
        discount: 0,
        couponCode: '',
        total: amount,
        status: orderStatus,
        createdAt
      });

      invoices.push({
        id: invId,
        invoiceNo,
        orderId: ordId,
        orderNo,
        customerId: cust.id,
        customerName: cust.name,
        customerEmail: cust.email,
        customerPhone: cust.phone,
        type,
        items,
        subtotal: amount,
        discount: 0,
        total: amount,
        status: invStatus,
        issuedAt: createdAt,
        dueAt: daysAhead(2)
      });

      const hasProof = ['Menunggu Verifikasi', 'Pembayaran Diverifikasi', 'Pembayaran Ditolak'].includes(payStatus);
      payments.push({
        id: payId,
        orderId: ordId,
        orderNo,
        invoiceId: invId,
        invoiceNo,
        customerId: cust.id,
        customerName: cust.name,
        type,
        amount,
        bankName: 'Bank Demo Nusantara (Simulasi)',
        status: payStatus,
        verifiedApplied: payStatus === 'Pembayaran Diverifikasi',
        proofImage: hasProof ? createSampleReceiptDataUri(orderNo, amount, cust.name) : '',
        proofFileName: hasProof ? `bukti-${orderNo.toLowerCase()}.svg` : '',
        customerNote: hasProof ? `Transfer simulasi untuk ${orderNo} a.n. ${cust.name}.` : '',
        rejectionReason: payStatus === 'Pembayaran Ditolak' ? 'Nominal pada lampiran bukti tidak sesuai atau referensi pesanan belum terbaca jelas. Silakan unggah ulang bukti demo.' : '',
        submittedAt: hasProof ? hoursAgo(30 - i) : '',
        verifiedAt: payStatus === 'Pembayaran Diverifikasi' ? hoursAgo(12) : '',
        expiresAt: payStatus === 'Pembayaran Kedaluwarsa' ? daysAgo(1) : daysAhead(2),
        createdAt
      });
    }

    const customRequests = [
      {
        id: 'creq-01',
        requestNo: 'NX-REQ-001',
        customerId: 'cust-01',
        customerName: 'Raka Pratama',
        customerEmail: 'pelanggan@example.com',
        customerPhone: '0812-3456-7890',
        serviceType: 'Website Toko Online',
        projectTitle: 'Portal Katalog Grosir & Distributor Regional',
        needs: ['Katalog Produk Bertingkat', 'Integrasi Invoice Simulasi', 'Pelatihan Admin'],
        description: 'Membutuhkan website katalog grosir dengan penyesuaian harga per tier mitra dan halaman informasi kemitraan.',
        budgetRange: 'Rp 10.000.000 – Rp 20.000.000',
        timeline: '4–6 Minggu',
        attachmentName: 'brief-portal-grosir.pdf',
        status: 'Penawaran Dikirim',
        createdAt: daysAgo(5)
      },
      {
        id: 'creq-02',
        requestNo: 'NX-REQ-002',
        customerId: 'cust-01',
        customerName: 'Raka Pratama',
        customerEmail: 'pelanggan@example.com',
        customerPhone: '0812-3456-7890',
        serviceType: 'Editing Video YouTube',
        projectTitle: 'Paket Produksi 8 Episode Podcast Video',
        needs: ['Multi-Cam Sync', 'Color Grading', 'Potongan Short Video'],
        description: 'Penyuntingan 8 episode diskusi bisnis masing-masing 40 menit beserta 16 klip pendek vertikal.',
        budgetRange: 'Rp 5.000.000 – Rp 8.000.000',
        timeline: '2–3 Minggu',
        attachmentName: 'panduan-brand-podcast.pdf',
        status: 'Penawaran Kedaluwarsa',
        createdAt: daysAgo(18)
      },
      {
        id: 'creq-03',
        requestNo: 'NX-REQ-003',
        customerId: 'cust-02',
        customerName: 'Siti Rahmawati',
        customerEmail: 'siti.rahma@example.com',
        customerPhone: '0813-2201-4411',
        serviceType: 'Website Company Profile',
        projectTitle: 'Microsite Profil Kedai & Pemesanan Katering Kopi',
        needs: ['Halaman Menu Interaktif', 'Formulir Permintaan Event'],
        description: 'Website ringkas untuk menampilkan paket coffee cart acara kantor dan profil penyangraian.',
        budgetRange: 'Rp 4.000.000 – Rp 7.000.000',
        timeline: '2 Minggu',
        attachmentName: '',
        status: 'Menunggu Peninjauan',
        createdAt: daysAgo(2)
      },
      {
        id: 'creq-04',
        requestNo: 'NX-REQ-004',
        customerId: 'cust-03',
        customerName: 'Andi Wijanarko',
        customerEmail: 'andi.w@example.com',
        customerPhone: '0815-9921-1022',
        serviceType: 'Streaming Zoom Webinar',
        projectTitle: 'Operator Webinar Nasional 3 Hari Berturut-turut',
        needs: ['Overlay Branded', 'Gladi Resik Pembicara', 'Rekaman Terpisah'],
        description: 'Pendampingan penuh selama 3 hari acara daring dengan 12 pembicara panel.',
        budgetRange: 'Rp 6.000.000 – Rp 9.000.000',
        timeline: 'Bulan Depan',
        attachmentName: 'rundown-webinar.xlsx',
        status: 'Disetujui',
        createdAt: daysAgo(10)
      },
      {
        id: 'creq-05',
        requestNo: 'NX-REQ-005',
        customerId: 'cust-04',
        customerName: 'Dewi Lestari',
        customerEmail: 'dewi.l@example.com',
        customerPhone: '0817-4452-3310',
        serviceType: 'Desain Konten Media Sosial',
        projectTitle: 'Paket Rebranding Feed & Kit Peluncuran Produk',
        needs: ['Pedoman Visual Ringkas', '40 Desain Carousel & Story'],
        description: 'Menyelaraskan tampilan visual seluruh kanal media sosial menjelang peluncuran lini produk baru.',
        budgetRange: 'Rp 3.500.000 – Rp 6.000.000',
        timeline: '2–3 Minggu',
        attachmentName: 'referensi-moodboard.png',
        status: 'Menunggu Peninjauan',
        createdAt: daysAgo(1)
      },
      {
        id: 'creq-06',
        requestNo: 'NX-REQ-006',
        customerId: 'cust-05',
        customerName: 'Fajar Nugroho',
        customerEmail: 'fajar.n@example.com',
        customerPhone: '0818-7761-9901',
        serviceType: 'Custom Digital Project',
        projectTitle: 'Portal Pelatihan Internal & Bank Materi PDF',
        needs: ['Portal Login Simulasi', 'Katalog Materi Video & Dokumen'],
        description: 'Membangun portal pembelajaran terpusat untuk 50 anggota tim cabang.',
        budgetRange: 'Rp 12.000.000 – Rp 18.000.000',
        timeline: '5 Minggu',
        attachmentName: '',
        status: 'Penawaran Dikirim',
        createdAt: daysAgo(3)
      }
    ];

    const quotations = [
      {
        id: 'quo-01',
        quotationNo: 'NX-QUO-2026-001',
        requestId: 'creq-01',
        customerId: 'cust-01',
        customerName: 'Raka Pratama',
        version: 1,
        title: 'Penawaran Portal Katalog Grosir & Distributor',
        scope: 'Perancangan UI/UX Portal Katalog, Sistem Permintaan Mitra, Dashboard Pengelolaan Katalog, dan Sesi Pelatihan Operator.',
        deliverables: ['Desain UI Figma & Prototype', 'Website Katalog Responsif', 'Panduan Admin & Video Onboarding'],
        price: 12500000,
        estimatedDays: 28,
        validUntil: daysAhead(7),
        status: 'Dikirim',
        orderId: '',
        createdAt: daysAgo(4)
      },
      {
        id: 'quo-02',
        quotationNo: 'NX-QUO-2026-002',
        requestId: 'creq-02',
        customerId: 'cust-01',
        customerName: 'Raka Pratama',
        version: 1,
        title: 'Penawaran Produksi 8 Episode Podcast Video',
        scope: 'Editing multi-cam 8 episode (40 menit/eps), mastering audio, color grading, serta 16 klip pendek vertikal.',
        deliverables: ['8 Master Video Full HD', '16 Klip Vertikal 9:16', '2x Revisi per Episode'],
        price: 6800000,
        estimatedDays: 18,
        validUntil: daysAgo(3),
        status: 'Kedaluwarsa',
        orderId: '',
        createdAt: daysAgo(16)
      },
      {
        id: 'quo-03',
        quotationNo: 'NX-QUO-2026-003',
        requestId: 'creq-04',
        customerId: 'cust-03',
        customerName: 'Andi Wijanarko',
        version: 2,
        title: 'Penawaran Operator Webinar Nasional 3 Hari (Revisi V2)',
        scope: '2 Operator utama + 1 cadangan, overlay grafis kustom, gladi resik 2 sesi, dan pengarsipan rekaman cloud.',
        deliverables: ['Operasional Live 3 Hari', 'Paket Grafis Overlay', 'Rekaman Bersih MP4'],
        price: 7500000,
        estimatedDays: 10,
        validUntil: daysAhead(14),
        status: 'Diterima',
        orderId: 'ord-006',
        createdAt: daysAgo(8)
      },
      {
        id: 'quo-04',
        quotationNo: 'NX-QUO-2026-004',
        requestId: 'creq-06',
        customerId: 'cust-05',
        customerName: 'Fajar Nugroho',
        version: 1,
        title: 'Penawaran Portal Pelatihan Internal Tim',
        scope: 'Desain sistem portal materi, modul kategori pelatihan, pencarian materi, dan panduan pengelolaan admin.',
        deliverables: ['Portal Web Responsif', 'Struktur Kategori & Modul', 'Dokumentasi Pemakaian'],
        price: 14800000,
        estimatedDays: 35,
        validUntil: daysAhead(10),
        status: 'Dikirim',
        orderId: '',
        createdAt: daysAgo(2)
      },
      {
        id: 'quo-05',
        quotationNo: 'NX-QUO-2026-005',
        requestId: 'creq-03',
        customerId: 'cust-02',
        customerName: 'Siti Rahmawati',
        version: 1,
        title: 'Draf Penawaran Microsite Kedai Kopi',
        scope: 'Desain dan pembuatan microsite 4 bagian dengan katalog menu dan form katering.',
        deliverables: ['Microsite Responsif', 'Formulir Permintaan Katering'],
        price: 4200000,
        estimatedDays: 14,
        validUntil: daysAhead(12),
        status: 'Draf',
        orderId: '',
        createdAt: daysAgo(1)
      }
    ];

    const projects = [
      {
        id: 'prj-01',
        orderId: 'ord-002',
        orderNo: 'NX-ORD-2026-002',
        customerId: 'cust-01',
        customerName: 'Raka Pratama',
        title: 'Website Company Profile — Pratama Digital Lab',
        serviceName: 'Website Company Profile — Paket Professional',
        brief: 'Membuat website profil perusahaan teknologi edukasi dengan warna biru modern dan halaman studi kasus.',
        targetDate: daysAhead(12),
        status: 'Dalam Pengerjaan',
        progress: 65,
        deliverables: ['Struktur Wireframe (Selesai)', 'Desain UI Beranda & Layanan (Selesai)', 'Implementasi Responsif (Berjalan)'],
        sampleOutputNote: 'Draft preview layout beranda dan halaman layanan telah diunggah untuk peninjauan awal.',
        revisionHistory: [
          { date: daysAgo(3), note: 'Penyesuaian kontras tombol utama dan penambahan blok FAQ singkat.' }
        ],
        timeline: [
          { date: daysAgo(6), title: 'Pesanan dibuat & pembayaran diverifikasi', by: 'Sistem Simulasi' },
          { date: daysAgo(5), title: 'Proyek masuk antrean & brief ditinjau', by: 'Alya Wijaya (Admin)' },
          { date: daysAgo(3), title: 'Desain antarmuka selesai 65%', by: 'Tim Produksi Contoh' }
        ],
        createdAt: daysAgo(6)
      },
      {
        id: 'prj-02',
        orderId: 'ord-006',
        orderNo: 'NX-ORD-2026-006',
        customerId: 'cust-01',
        customerName: 'Raka Pratama',
        title: 'Landing Page Peluncuran Produk E-Course',
        serviceName: 'Landing Page Profesional — Paket Basic',
        brief: 'Landing page tunggal untuk kampanye pendaftaran workshop akhir bulan.',
        targetDate: daysAhead(6),
        status: 'Menunggu Review',
        progress: 90,
        deliverables: ['Wireframe & Copywriting', 'Implementasi Halaman Lengkap', 'Formulir Pendaftaran Demo'],
        sampleOutputNote: 'Versi pratinjau penuh siap diperiksa pelanggan sebelum finalisasi.',
        revisionHistory: [],
        timeline: [
          { date: daysAgo(8), title: 'Pembayaran terverifikasi, masuk antrean', by: 'Sistem Simulasi' },
          { date: daysAgo(4), title: 'Implementasi selesai dan menunggu review pelanggan', by: 'Tim Produksi Contoh' }
        ],
        createdAt: daysAgo(8)
      },
      {
        id: 'prj-03',
        orderId: 'ord-010',
        orderNo: 'NX-ORD-2026-010',
        customerId: 'cust-04',
        customerName: 'Dewi Lestari',
        title: 'Editing Video Company Overview (4 Menit)',
        serviceName: 'Editing Video YouTube — Paket Professional',
        brief: 'Menyatukan wawancara pendiri dan footage kantor menjadi video profil berdurasi 4 menit.',
        targetDate: daysAhead(4),
        status: 'Revisi',
        progress: 80,
        deliverables: ['Rough Cut & Audio Mastering', 'Revisi Lower Third Jabatan'],
        sampleOutputNote: 'Menyesuaikan ejaan gelar pembicara pada menit 01:42 sesuai catatan revisi #1.',
        revisionHistory: [
          { date: daysAgo(1), note: 'Revisi #1: Ganti teks lower third dan perhalus transisi penutup.' }
        ],
        timeline: [
          { date: daysAgo(7), title: 'Proyek dimulai', by: 'Tim Editor Contoh' },
          { date: daysAgo(1), title: 'Masuk fase revisi #1', by: 'Dewi Lestari' }
        ],
        createdAt: daysAgo(7)
      },
      {
        id: 'prj-04',
        orderId: 'ord-014',
        orderNo: 'NX-ORD-2026-014',
        customerId: 'cust-01',
        customerName: 'Raka Pratama',
        title: 'Paket Desain Konten Peluncuran Kuartal IV',
        serviceName: 'Desain Konten Media Sosial — Paket Basic',
        brief: '12 desain carousel edukasi mengenai literasi digital UMKM.',
        targetDate: daysAhead(9),
        status: 'Selesai',
        progress: 100,
        deliverables: ['12 Carousel PNG Resolusi Tinggi', 'Link Master Template Canva', 'Ringkasan Pedoman Warna'],
        sampleOutputNote: 'Seluruh file final telah diserahkan dan disetujui pelanggan.',
        revisionHistory: [
          { date: daysAgo(10), note: 'Penyesuaian ukuran font pada slide sampul agar lebih terbaca di layar kecil.' }
        ],
        timeline: [
          { date: daysAgo(14), title: 'Pembayaran diverifikasi', by: 'Admin Demo' },
          { date: daysAgo(9), title: 'Proyek ditandai Selesai', by: 'Admin Demo' }
        ],
        createdAt: daysAgo(14)
      },
      {
        id: 'prj-05',
        orderId: 'ord-018',
        orderNo: 'NX-ORD-2026-018',
        customerId: 'cust-06',
        customerName: 'Maya Puspita',
        title: 'Setup Streaming Zoom Seminar Komunitas',
        serviceName: 'Streaming Zoom Webinar — Paket Professional',
        brief: 'Pendampingan webinar daring 2 sesi pembicara tamu dan pengelolaan Q&A.',
        targetDate: daysAhead(15),
        status: 'Dalam Antrean',
        progress: 20,
        deliverables: ['Penjadwalan Gladi Resik', 'Desain Overlay Pembuka'],
        sampleOutputNote: 'Menunggu pengiriman logo resolusi tinggi dari panitia acara.',
        revisionHistory: [],
        timeline: [
          { date: daysAgo(2), title: 'Pembayaran terverifikasi, proyek masuk antrean produksi', by: 'Admin Demo' }
        ],
        createdAt: daysAgo(2)
      },
      {
        id: 'prj-06',
        orderId: 'ord-015',
        orderNo: 'NX-ORD-2026-015',
        customerId: 'cust-01',
        customerName: 'Raka Pratama',
        title: 'Short Video Reels Campaign (Batch 6 Video)',
        serviceName: 'Editing Short Video — Paket Basic',
        brief: 'Enam video vertikal singkat berdurasi 45 detik dengan subtitle dinamis.',
        targetDate: daysAhead(14),
        status: 'Menunggu Pembayaran',
        progress: 0,
        deliverables: ['Menunggu verifikasi pembayaran untuk memulai produksi'],
        sampleOutputNote: 'Proyek otomatis masuk antrean setelah pembayaran diverifikasi Admin.',
        revisionHistory: [],
        timeline: [
          { date: daysAgo(1), title: 'Pesanan jasa dibuat, menunggu pembayaran', by: 'Raka Pratama' }
        ],
        createdAt: daysAgo(1)
      }
    ];

    const enrollments = [
      {
        id: 'enr-01',
        orderId: 'ord-003',
        orderNo: 'NX-ORD-2026-003',
        sessionId: 'ses-01',
        programId: 'trn-01',
        customerId: 'cust-01',
        participantName: 'Raka Pratama',
        participantEmail: 'pelanggan@example.com',
        participantPhone: '0812-3456-7890',
        seats: 1,
        paymentStatus: 'Menunggu Verifikasi',
        status: 'Reservasi Sementara',
        reservationExpiresAt: daysAhead(2),
        createdAt: daysAgo(2)
      },
      {
        id: 'enr-02',
        orderId: 'ord-011',
        orderNo: 'NX-ORD-2026-011',
        sessionId: 'ses-09',
        programId: 'trn-05',
        customerId: 'cust-01',
        participantName: 'Raka Pratama',
        participantEmail: 'pelanggan@example.com',
        participantPhone: '0812-3456-7890',
        seats: 1,
        paymentStatus: 'Pembayaran Diverifikasi',
        status: 'Terkonfirmasi',
        reservationExpiresAt: daysAhead(5),
        createdAt: daysAgo(5)
      },
      {
        id: 'enr-03',
        orderId: 'ord-007',
        orderNo: 'NX-ORD-2026-007',
        sessionId: 'ses-03',
        programId: 'trn-02',
        customerId: 'cust-01',
        participantName: 'Raka Pratama',
        participantEmail: 'pelanggan@example.com',
        participantPhone: '0812-3456-7890',
        seats: 1,
        paymentStatus: 'Menunggu Verifikasi',
        status: 'Reservasi Sementara',
        reservationExpiresAt: daysAhead(1),
        createdAt: daysAgo(1)
      },
      {
        id: 'enr-04',
        orderId: 'ord-012',
        orderNo: 'NX-ORD-2026-012',
        sessionId: 'ses-07',
        programId: 'trn-04',
        customerId: 'cust-03',
        participantName: 'Andi Wijanarko',
        participantEmail: 'andi.w@example.com',
        participantPhone: '0815-9921-1022',
        seats: 2,
        paymentStatus: 'Pembayaran Diverifikasi',
        status: 'Terkonfirmasi',
        reservationExpiresAt: daysAhead(10),
        createdAt: daysAgo(6)
      },
      {
        id: 'enr-05',
        orderId: 'ord-016',
        orderNo: 'NX-ORD-2026-016',
        sessionId: 'ses-05',
        programId: 'trn-03',
        customerId: 'cust-07',
        participantName: 'Bima Saputra',
        participantEmail: 'bima.s@example.com',
        participantPhone: '0821-3341-7712',
        seats: 1,
        paymentStatus: 'Menunggu Pembayaran',
        status: 'Reservasi Sementara',
        reservationExpiresAt: daysAhead(1),
        createdAt: daysAgo(1)
      },
      {
        id: 'enr-06',
        orderId: 'ord-019',
        orderNo: 'NX-ORD-2026-019',
        sessionId: 'ses-11',
        programId: 'trn-06',
        customerId: 'cust-08',
        participantName: 'Intan Permata',
        participantEmail: 'intan.p@example.com',
        participantPhone: '0822-5519-6620',
        seats: 1,
        paymentStatus: 'Pembayaran Kedaluwarsa',
        status: 'Kedaluwarsa',
        reservationExpiresAt: daysAgo(1),
        createdAt: daysAgo(4)
      }
    ];

    const notifications = [
      { id: 'ntf-01', userId: 'cust-01', roleTarget: 'customer', title: 'Penawaran Custom Diterima', message: 'Penawaran NX-QUO-2026-001 untuk Portal Katalog Grosir telah dikirim Admin.', link: '#/akun/penawaran/quo-01', read: false, createdAt: hoursAgo(3) },
      { id: 'ntf-02', userId: 'cust-01', roleTarget: 'customer', title: 'Progres Proyek Diperbarui', message: 'Proyek Website Company Profile mencapai progres 65%.', link: '#/akun/proyek/prj-01', read: false, createdAt: hoursAgo(5) },
      { id: 'ntf-03', userId: 'cust-01', roleTarget: 'customer', title: 'Pendaftaran Pelatihan Terkonfirmasi', message: 'Kursi Anda pada Webinar AI — Otomasi Kerja telah terkonfirmasi.', link: '#/akun/pelatihan', read: true, createdAt: daysAgo(1) },
      { id: 'ntf-04', userId: 'cust-01', roleTarget: 'customer', title: 'Menunggu Verifikasi Pembayaran', message: 'Bukti transfer untuk pesanan NX-ORD-2026-001 sedang ditinjau Admin.', link: '#/pembayaran/pay-001', read: false, createdAt: hoursAgo(8) },
      { id: 'ntf-05', userId: 'cust-01', roleTarget: 'customer', title: 'Proyek Menunggu Review Anda', message: 'Landing Page Peluncuran Produk E-Course siap untuk Anda tinjau.', link: '#/akun/proyek/prj-02', read: false, createdAt: hoursAgo(10) },
      { id: 'ntf-06', userId: 'cust-01', roleTarget: 'customer', title: 'Unduhan Digital Tersedia', message: 'Produk pada pesanan NX-ORD-2026-009 siap diunduh di halaman Unduhan Digital.', link: '#/akun/unduhan', read: true, createdAt: daysAgo(3) },
      { id: 'ntf-07', userId: 'admin-01', roleTarget: 'admin', title: '8 Pembayaran Menunggu Verifikasi', message: 'Terdapat 8 bukti transfer simulasi yang perlu ditinjau.', link: '#/admin/pembayaran', read: false, createdAt: hoursAgo(1) },
      { id: 'ntf-08', userId: 'admin-01', roleTarget: 'admin', title: 'Permintaan Penawaran Custom Baru', message: 'Dewi Lestari mengirimkan permintaan Rebranding Feed & Kit Peluncuran.', link: '#/admin/permintaan-custom', read: false, createdAt: hoursAgo(4) },
      { id: 'ntf-09', userId: 'admin-01', roleTarget: 'admin', title: 'Sesi Pelatihan Barista Penuh', message: 'Batch 09 Pelatihan Barista Bekasi telah mencapai 10/10 kuota.', link: '#/admin/sesi-pelatihan', read: false, createdAt: hoursAgo(9) },
      { id: 'ntf-10', userId: 'admin-01', roleTarget: 'admin', title: 'Proyek Jasa Memasuki Fase Revisi', message: 'Klien Dewi Lestari mengajukan revisi #1 untuk Editing Video Overview.', link: '#/admin/proyek', read: true, createdAt: daysAgo(1) },
      { id: 'ntf-11', userId: 'admin-01', roleTarget: 'admin', title: 'Tiket Bantuan Baru', message: 'Pengguna mengirimkan pertanyaan mengenai lisensi multi-unit Akun Pro.', link: '#/admin/aktivitas', read: true, createdAt: daysAgo(2) },
      { id: 'ntf-12', userId: 'admin-01', roleTarget: 'admin', title: 'Produk Diarsipkan', message: 'Paket Ikon Klasik V1 dipindahkan ke arsip; riwayat pesanan lama tetap aman.', link: '#/admin/produk', read: true, createdAt: daysAgo(5) },
      { id: 'ntf-13', userId: 'cust-01', roleTarget: 'customer', title: 'Pembayaran Membutuhkan Unggah Ulang', message: 'Periksa catatan penolakan jika ada bukti transfer yang belum terbaca.', link: '#/akun/pembayaran', read: true, createdAt: daysAgo(4) },
      { id: 'ntf-14', userId: 'admin-01', roleTarget: 'admin', title: 'Ringkasan Simulasi Mingguan', message: 'Laporan transaksi simulasi siap diekspor ke CSV.', link: '#/admin/laporan', read: true, createdAt: daysAgo(6) }
    ];

    const auditLogs = [
      { id: 'aud-01', actor: 'Alya Wijaya (Admin)', action: 'VERIFIKASI_PEMBAYARAN', target: 'NX-ORD-2026-009', detail: 'Menyetujui bukti transfer demo Rp 499.000 & membuka unduhan digital.', createdAt: hoursAgo(6) },
      { id: 'aud-02', actor: 'Alya Wijaya (Admin)', action: 'KIRIM_PENAWARAN', target: 'NX-QUO-2026-001', detail: 'Mengirimkan penawaran custom v1 senilai Rp 12.500.000.', createdAt: daysAgo(4) },
      { id: 'aud-03', actor: 'Raka Pratama (Pelanggan)', action: 'UNGGAH_BUKTI', target: 'NX-ORD-2026-001', detail: 'Mengunggah bukti transfer simulasi ke Bank Demo Nusantara.', createdAt: hoursAgo(8) },
      { id: 'aud-04', actor: 'Alya Wijaya (Admin)', action: 'TOLAK_PEMBAYARAN', target: 'NX-ORD-2026-017', detail: 'Menolak bukti transfer karena nominal tidak sesuai.', createdAt: daysAgo(2) },
      { id: 'aud-05', actor: 'Alya Wijaya (Admin)', action: 'UPDATE_PROYEK', target: 'prj-01', detail: 'Memperbarui progres proyek Website Company Profile menjadi 65%.', createdAt: hoursAgo(5) },
      { id: 'aud-06', actor: 'Alya Wijaya (Admin)', action: 'ARSIP_PRODUK', target: 'prod-20', detail: 'Mengarsipkan Paket Ikon Klasik V1 tanpa menghapus riwayat transaksi.', createdAt: daysAgo(5) },
      { id: 'aud-07', actor: 'Raka Pratama (Pelanggan)', action: 'DAFTAR_PELATIHAN', target: 'ses-01', detail: 'Mereservasi 1 kursi sementara pada Pelatihan AI TQN Batch 04.', createdAt: daysAgo(2) },
      { id: 'aud-08', actor: 'Alya Wijaya (Admin)', action: 'KONFIRMASI_PELATIHAN', target: 'enr-02', detail: 'Mengonfirmasi pendaftaran Webinar AI setelah pembayaran terverifikasi.', createdAt: daysAgo(5) },
      { id: 'aud-09', actor: 'Andi Wijanarko (Pelanggan)', action: 'TERIMA_PENAWARAN', target: 'NX-QUO-2026-003', detail: 'Menyetujui penawaran custom v2 dan menerbitkan invoice otomatis.', createdAt: daysAgo(8) },
      { id: 'aud-10', actor: 'Alya Wijaya (Admin)', action: 'REVISI_PENAWARAN', target: 'NX-QUO-2026-003', detail: 'Membuat revisi penawaran v2 dengan penyesuaian jadwal 3 hari.', createdAt: daysAgo(9) },
      { id: 'aud-11', actor: 'Dewi Lestari (Pelanggan)', action: 'AJUKAN_CUSTOM', target: 'NX-REQ-005', detail: 'Mengirimkan formulir permintaan jasa custom desain media sosial.', createdAt: daysAgo(1) },
      { id: 'aud-12', actor: 'Alya Wijaya (Admin)', action: 'TERBITKAN_ARTIKEL', target: 'art-01', detail: 'Menerbitkan artikel insight ekosistem produk digital.', createdAt: daysAgo(7) },
      { id: 'aud-13', actor: 'Alya Wijaya (Admin)', action: 'BUAT_KUPON', target: 'NEXORA10', detail: 'Mengaktifkan kode promo simulasi NEXORA10 (diskon 10%).', createdAt: daysAgo(10) },
      { id: 'aud-14', actor: 'Bima Saputra (Pelanggan)', action: 'BUAT_PESANAN', target: 'NX-ORD-2026-016', detail: 'Melakukan checkout pendaftaran Pelatihan Offline Cisarua.', createdAt: daysAgo(1) },
      { id: 'aud-15', actor: 'Alya Wijaya (Admin)', action: 'SELESAIKAN_PROYEK', target: 'prj-04', detail: 'Menandai proyek Desain Konten Kuartal IV sebagai Selesai (100%).', createdAt: daysAgo(9) },
      { id: 'aud-16', actor: 'Alya Wijaya (Admin)', action: 'UPDATE_PENGATURAN', target: 'settings', detail: 'Memperbarui label rekening demo dan jam operasional contoh.', createdAt: daysAgo(12) },
      { id: 'aud-17', actor: 'Fajar Nugroho (Pelanggan)', action: 'AJUKAN_CUSTOM', target: 'NX-REQ-006', detail: 'Mengirimkan kebutuhan portal pelatihan internal tim.', createdAt: daysAgo(3) },
      { id: 'aud-18', actor: 'Sistem Simulasi', action: 'INISIALISASI_DEMO', target: 'nexora_v2', detail: 'Dataset demonstrasi NEXORA V2.0 siap digunakan.', createdAt: daysAgo(20) }
    ];

    const settings = {
      siteName: 'NEXORA',
      tagline: 'Belajar. Berkarya. Berkembang.',
      positioning: 'Your Digital Growth Ecosystem',
      announcementText: 'MODE DEMO V2.0 — Jelajahi simulasi lengkap Produk Digital, Jasa Kreatif, dan Pelatihan dalam satu ekosistem.',
      announcementCta: 'Jelajahi Produk',
      announcementLink: '#/produk',
      contactEmail: 'halo-demo@nexora.example',
      contactPhone: '+62 21-5550-2026 (Nomor Contoh)',
      contactAddress: 'Jl. Ekosistem Digital No. 24, Jakarta & Hub Bekasi / Cisarua (Alamat Contoh)',
      operatingHours: 'Senin – Jumat, 09:00 – 17:30 WIB (Simulasi)',
      footerNote: 'Platform demonstrasi Single Vendor Digital Commerce. Seluruh transaksi, rekening, dan data merupakan simulasi browser.',
      demoBank: {
        bankName: 'Bank Demo Nusantara (BDN)',
        accountNumber: '0000-1234-5678-900 (CONTOH)',
        accountHolder: 'PT NEXORA EKOSISTEM DEMO'
      },
      cms: {
        coupons: [
          { id: 'cpn-01', code: 'NEXORA10', type: 'percent', value: 10, maxDiscount: 150000, minSpend: 100000, active: true, desc: 'Diskon simulasi 10% (maks. Rp 150.000)' },
          { id: 'cpn-02', code: 'HEMAT50K', type: 'fixed', value: 50000, maxDiscount: 50000, minSpend: 250000, active: true, desc: 'Potongan langsung Rp 50.000 min. belanja Rp 250.000' },
          { id: 'cpn-03', code: 'PELATIHAN15', type: 'percent', value: 15, maxDiscount: 300000, minSpend: 140000, active: true, desc: 'Diskon 15% khusus program pelatihan demo' },
          { id: 'cpn-04', code: 'KREATIF100K', type: 'fixed', value: 100000, maxDiscount: 100000, minSpend: 1000000, active: true, desc: 'Potongan Rp 100.000 untuk jasa digital' }
        ],
        banners: [
          { id: 'bnr-01', title: 'Peluncuran E-Book AI & Template Bisnis V2', position: 'Beranda Atas', status: 'active', link: '#/produk' },
          { id: 'bnr-02', title: 'Jadwal Pelatihan Offline Cisarua & Bekasi', position: 'Halaman Pelatihan', status: 'active', link: '#/pelatihan' },
          { id: 'bnr-03', title: 'Konsultasi Jasa Custom untuk Kebutuhan Organisasi', position: 'Halaman Jasa', status: 'active', link: '#/jasa/custom' }
        ],
        locations: [
          { id: 'loc-01', name: 'Pusat Pelatihan Cisarua', city: 'Bogor', capacity: 25, type: 'Offline', address: 'Kawasan Puncak Cisarua Km. 78 (Lokasi Contoh)' },
          { id: 'loc-02', name: 'Hub Kreatif & Bar Bekasi', city: 'Bekasi', capacity: 24, type: 'Offline', address: 'Koridor Ahmad Yani, Bekasi Selatan (Lokasi Contoh)' },
          { id: 'loc-03', name: 'Ruang Webinar Zoom Resmi', city: 'Online', capacity: 1000, type: 'Online', address: 'Tautan ruang daring dikirim setelah verifikasi pembayaran' }
        ],
        articleCategories: ['Produk Digital', 'Jasa & Proyek', 'Kecerdasan Buatan', 'Produksi & Streaming', 'Desain & Web', 'Sistem Commerce', 'Pelatihan & Akademi', 'Konten Digital', 'Bisnis Digital'],
        adminUsers: [
          { id: 'adm-01', name: 'Alya Wijaya', email: 'admin@example.com', password: 'demo123', roleName: 'Super Admin Demo', status: 'active' },
          { id: 'adm-02', name: 'Fikri Hakim', email: 'verifikator@example.com', password: 'demo123', roleName: 'Finance & Verifikasi Demo', status: 'active' },
          { id: 'adm-03', name: 'Salsa Azzahra', email: 'konten@example.com', password: 'demo123', roleName: 'Editor Konten & Akademi Demo', status: 'active' }
        ],
        roles: [
          { id: 'rol-01', name: 'Super Admin Demo', permissions: ['Kelola Produk & Jasa', 'Verifikasi Pembayaran', 'Kelola Pelatihan', 'CMS & Pengaturan', 'Ekspor Laporan'], note: 'Simulasi UI browser — bukan kontrol otorisasi backend production.' },
          { id: 'rol-02', name: 'Finance & Verifikasi Demo', permissions: ['Lihat Pesanan & Invoice', 'Setujui/Tolak Pembayaran', 'Lihat Laporan'], note: 'Simulasi peran keuangan pada demonstrasi.' },
          { id: 'rol-03', name: 'Editor Konten & Akademi Demo', permissions: ['Kelola Artikel & Portofolio', 'Kelola Sesi Pelatihan'], note: 'Simulasi peran pengelola konten dan akademi.' }
        ],
        newsletters: [
          { id: 'nws-01', email: 'pembaca.demo@example.com', subscribedAt: daysAgo(10) },
          { id: 'nws-02', email: 'pelanggan@example.com', subscribedAt: daysAgo(20) }
        ],
        supportTickets: [
          { id: 'tkt-01', name: 'Raka Pratama', email: 'pelanggan@example.com', topic: 'Lisensi Akun Pro Resmi', message: 'Apakah pembelian lisensi pro bisa lebih dari 1 unit sekaligus?', status: 'Dijawab', reply: 'Ya, produk Akun Pro mendukung pemilihan jumlah multi-unit di keranjang.', createdAt: daysAgo(2) }
        ]
      }
    };

    return {
      version: 2,
      currentUser: null,
      currentRole: 'guest',
      products,
      categories,
      services,
      servicePackages,
      trainingPrograms,
      trainingSessions,
      articles,
      portfolios,
      cart: [
        { id: 'cart-seed-1', productId: 'prod-01', qty: 1, selected: true }
      ],
      customers,
      orders,
      invoices,
      payments,
      customRequests,
      quotations,
      projects,
      enrollments,
      notifications,
      auditLogs,
      settings
    };
  }

  /* ------------------------------------------------------------------------
     07. BUSINESS RULES, LOGGING & CROSS-ROLE DOMAIN ACTIONS
     ------------------------------------------------------------------------ */
  function addAuditLog(action, target, detail) {
    const actor = state.currentUser
      ? `${state.currentUser.name} (${state.currentRole === 'admin' ? 'Admin' : 'Pelanggan'})`
      : 'Pengunjung Demo';
    state.auditLogs.unshift({
      id: uid('aud'),
      actor,
      action,
      target,
      detail,
      createdAt: new Date().toISOString()
    });
  }

  function pushNotification({ userId = 'cust-01', roleTarget = 'customer', title, message, link = '#/' }) {
    state.notifications.unshift({
      id: uid('ntf'),
      userId,
      roleTarget,
      title,
      message,
      link,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  function getStatusBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (s.includes('diverifikasi') || s.includes('lunas') || s.includes('selesai') || s.includes('terkonfirmasi') || s.includes('diterima') || s === 'active' || s === 'published' || s === 'open' || s === 'dijawab') {
      return 'badge-success';
    }
    if (s.includes('menunggu verifikasi') || s.includes('dalam pengerjaan') || s.includes('review') || s.includes('dikirim') || s.includes('antrean') || s.includes('reservasi')) {
      return 'badge-primary';
    }
    if (s.includes('menunggu pembayaran') || s.includes('revisi') || s.includes('peninjauan') || s.includes('draf') || s === 'belum lunas') {
      return 'badge-warning';
    }
    if (s.includes('ditolak') || s.includes('kedaluwarsa') || s.includes('dibatalkan') || s.includes('archived') || s.includes('penuh')) {
      return 'badge-danger';
    }
    return 'badge-neutral';
  }

  function loginAsCustomer(email = 'pelanggan@example.com', password = 'demo123', silent = false) {
    const found = state.customers.find((c) => c.email.toLowerCase() === String(email).toLowerCase());
    if (!found || (password !== null && found.password !== password)) {
      return { ok: false, error: 'Email atau kata sandi pelanggan tidak cocok pada data demo.' };
    }
    state.currentUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      phone: found.phone,
      company: found.company || '',
      verified: found.verified
    };
    state.currentRole = 'customer';
    addAuditLog('MASUK_PELANGGAN', found.email, 'Login simulasi sebagai pelanggan.');
    saveState();
    if (!silent) showToast(`Masuk sebagai Pelanggan: ${found.name}`, 'success');
    return { ok: true };
  }

  function loginAsAdmin(email = 'admin@example.com', password = 'demo123', silent = false) {
    const admins = state.settings.cms && state.settings.cms.adminUsers ? state.settings.cms.adminUsers : [];
    const found = admins.find((a) => a.email.toLowerCase() === String(email).toLowerCase());
    if (!found || (password !== null && found.password !== password)) {
      return { ok: false, error: 'Kredensial admin simulasi tidak valid.' };
    }
    state.currentUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      roleName: found.roleName
    };
    state.currentRole = 'admin';
    addAuditLog('MASUK_ADMIN', found.email, 'Login simulasi sebagai Admin NEXORA.');
    saveState();
    if (!silent) showToast(`Masuk sebagai Admin: ${found.name}`, 'success');
    return { ok: true };
  }

  function logoutDemo() {
    if (state.currentUser) {
      addAuditLog('KELUAR_AKUN', state.currentUser.email, 'Keluar dari sesi demo.');
    }
    state.currentUser = null;
    state.currentRole = 'guest';
    ui.profileDropdownOpen = false;
    saveState();
    showToast('Anda telah keluar dari sesi demo.', 'info');
    navigate('#/');
  }

  function ensureCustomerForTransaction(fallbackName = 'Pelanggan Demo', fallbackEmail = 'pelanggan@example.com', fallbackPhone = '0812-3456-7890') {
    if (state.currentUser && state.currentRole === 'customer') {
      return state.currentUser;
    }
    // Automatically use default demo customer or create temp reference if guest checks out
    const defaultCust = state.customers[0];
    if (!state.currentUser) {
      return {
        id: defaultCust.id,
        name: fallbackName || defaultCust.name,
        email: fallbackEmail || defaultCust.email,
        phone: fallbackPhone || defaultCust.phone
      };
    }
    return {
      id: defaultCust.id,
      name: fallbackName || defaultCust.name,
      email: fallbackEmail || defaultCust.email,
      phone: fallbackPhone || defaultCust.phone
    };
  }

  /* ---- Cart & Digital Checkout ---- */
  function addToCart(productId, qty = 1, openDrawerAfter = true) {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod) return;
    if (prod.status !== 'active') {
      showToast('Produk ini sedang diarsipkan dan tidak dapat dibeli.', 'warning');
      return;
    }
    const existing = state.cart.find((c) => c.productId === productId);
    if (existing) {
      if (prod.allowMultiUnit) {
        const limit = prod.licenseLimit || 99;
        existing.qty = Math.min(limit, existing.qty + qty);
        existing.selected = true;
        showToast(`Jumlah ${prod.name} diperbarui menjadi ${existing.qty}.`, 'success');
      } else {
        existing.selected = true;
        showToast(`${prod.name} sudah ada di keranjang Anda.`, 'info');
      }
    } else {
      state.cart.push({
        id: uid('cart'),
        productId,
        qty: prod.allowMultiUnit ? Math.max(1, qty) : 1,
        selected: true
      });
      showToast(`${prod.name} ditambahkan ke keranjang.`, 'success');
    }
    saveState();
    renderShellOnly();
    if (openDrawerAfter) openCartDrawer();
  }

  function buyProductNow(productId) {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod || prod.status !== 'active') {
      showToast('Produk tidak tersedia untuk dibeli.', 'warning');
      return;
    }
    addToCart(productId, 1, false);
    startDigitalCheckout();
  }

  function toggleCartItem(cartId) {
    const item = state.cart.find((c) => c.id === cartId);
    if (item) {
      item.selected = !item.selected;
      saveState();
      rerenderActiveViews();
    }
  }

  function updateCartQty(cartId, delta) {
    const item = state.cart.find((c) => c.id === cartId);
    if (!item) return;
    const prod = state.products.find((p) => p.id === item.productId);
    if (!prod || !prod.allowMultiUnit) return;
    const nextQty = item.qty + delta;
    if (nextQty <= 0) {
      removeFromCart(cartId);
      return;
    }
    const max = prod.licenseLimit || 99;
    item.qty = Math.min(max, nextQty);
    saveState();
    rerenderActiveViews();
  }

  function removeFromCart(cartId) {
    state.cart = state.cart.filter((c) => c.id !== cartId);
    saveState();
    showToast('Item dihapus dari keranjang.', 'info');
    rerenderActiveViews();
  }

  function calculateCouponDiscount(code, subtotal) {
    if (!code) return { valid: false, discount: 0, message: '' };
    const coupons = (state.settings.cms && state.settings.cms.coupons) || [];
    const cpn = coupons.find((c) => c.code.toUpperCase() === String(code).trim().toUpperCase() && c.active);
    if (!cpn) return { valid: false, discount: 0, message: 'Kode promo tidak ditemukan atau tidak aktif.' };
    if (subtotal < cpn.minSpend) {
      return { valid: false, discount: 0, message: `Minimum transaksi ${formatIDR(cpn.minSpend)} untuk kupon ${cpn.code}.` };
    }
    let disc = cpn.type === 'percent' ? Math.round((subtotal * cpn.value) / 100) : cpn.value;
    if (cpn.maxDiscount) disc = Math.min(disc, cpn.maxDiscount);
    disc = Math.min(disc, subtotal);
    return { valid: true, discount: disc, coupon: cpn, message: `Kupon ${cpn.code} diterapkan (-${formatIDR(disc)}).` };
  }

  function startDigitalCheckout() {
    const selected = state.cart.filter((c) => {
      const p = state.products.find((pr) => pr.id === c.productId);
      return c.selected && p && p.status === 'active';
    });
    if (selected.length === 0) {
      showToast('Pilih minimal satu produk aktif di keranjang terlebih dahulu.', 'warning');
      navigate('#/keranjang');
      return;
    }
    ui.checkoutTab = 'product';
    ui.checkoutDraft = {
      type: 'product',
      cartItemIds: selected.map((s) => s.id)
    };
    navigate('#/checkout?type=product');
  }

  function createOrderBundle({ customer, type, summaryTitle, items, subtotal, discount = 0, couponCode = '' }) {
    const seq = state.orders.length + 1;
    const pad = String(seq).padStart(3, '0');
    const ordId = uid('ord');
    const invId = uid('inv');
    const payId = uid('pay');
    const orderNo = `NX-ORD-2026-${pad}`;
    const invoiceNo = `NX-INV-2026-${pad}`;
    const nowIso = new Date().toISOString();
    const total = Math.max(0, subtotal - discount);

    const order = {
      id: ordId,
      orderNo,
      invoiceId: invId,
      paymentId: payId,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      type,
      summaryTitle,
      items,
      subtotal,
      discount,
      couponCode,
      total,
      status: 'Menunggu Pembayaran',
      createdAt: nowIso
    };

    const invoice = {
      id: invId,
      invoiceNo,
      orderId: ordId,
      orderNo,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone || '-',
      type,
      items,
      subtotal,
      discount,
      total,
      status: 'Belum Lunas',
      issuedAt: nowIso,
      dueAt: new Date(Date.now() + 2 * 86400 * 1000).toISOString()
    };

    const payment = {
      id: payId,
      orderId: ordId,
      orderNo,
      invoiceId: invId,
      invoiceNo,
      customerId: customer.id,
      customerName: customer.name,
      type,
      amount: total,
      bankName: state.settings.demoBank.bankName,
      status: 'Menunggu Pembayaran',
      verifiedApplied: false,
      proofImage: '',
      proofFileName: '',
      customerNote: '',
      rejectionReason: '',
      submittedAt: '',
      verifiedAt: '',
      expiresAt: new Date(Date.now() + 2 * 86400 * 1000).toISOString(),
      createdAt: nowIso
    };

    state.orders.unshift(order);
    state.invoices.unshift(invoice);
    state.payments.unshift(payment);

    addAuditLog('BUAT_PESANAN', orderNo, `Pesanan ${type} dibuat senilai ${formatIDR(total)} (snapshot harga terkunci).`);
    pushNotification({
      userId: customer.id,
      roleTarget: 'customer',
      title: 'Pesanan & Invoice Dibuat',
      message: `Pesanan ${orderNo} menunggu pembayaran sebesar ${formatIDR(total)}.`,
      link: `#/pembayaran/${payId}`
    });
    pushNotification({
      userId: 'admin-01',
      roleTarget: 'admin',
      title: 'Pesanan Baru Dibuat',
      message: `${customer.name} membuat pesanan ${orderNo} (${formatIDR(total)}).`,
      link: `#/admin/pesanan`
    });
    return { order, invoice, payment };
  }

  function completeDigitalCheckoutForm({ customerName, customerEmail, customerPhone }) {
    const selectedItems = state.cart
      .filter((c) => c.selected)
      .map((c) => ({ cart: c, product: state.products.find((p) => p.id === c.productId) }))
      .filter((x) => x.product && x.product.status === 'active');

    if (selectedItems.length === 0) {
      showToast('Tidak ada produk aktif terpilih untuk checkout.', 'warning');
      return null;
    }

    if (!state.currentUser || state.currentRole !== 'customer') {
      loginAsCustomer('pelanggan@example.com', 'demo123', true);
    }
    const customer = ensureCustomerForTransaction(customerName, customerEmail, customerPhone);
    const items = selectedItems.map(({ cart, product }) => ({
      refId: product.id,
      name: product.name,
      category: product.category,
      unitPrice: product.price, // Price snapshot locked at checkout
      qty: cart.qty,
      subtotal: product.price * cart.qty
    }));
    const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
    const couponCheck = calculateCouponDiscount(ui.appliedCouponCode, subtotal);
    const discount = couponCheck.valid ? couponCheck.discount : 0;
    const summaryTitle = items.length === 1 ? items[0].name : `${items[0].name} + ${items.length - 1} produk lainnya`;

    const bundle = createOrderBundle({
      customer,
      type: 'product',
      summaryTitle,
      items,
      subtotal,
      discount,
      couponCode: couponCheck.valid ? couponCheck.coupon.code : ''
    });

    const boughtIds = new Set(selectedItems.map((x) => x.cart.id));
    state.cart = state.cart.filter((c) => !boughtIds.has(c.id));
    ui.appliedCouponCode = '';
    ui.checkoutDraft = null;
    saveState();
    showToast(`Pesanan ${bundle.order.orderNo} berhasil dibuat!`, 'success');
    navigate(`#/invoice/${bundle.invoice.id}`);
    return bundle;
  }

  /* ---- Service Package Order ---- */
  function submitServicePackageOrder(pkg, form) {
    if (!state.currentUser || state.currentRole !== 'customer') {
      loginAsCustomer('pelanggan@example.com', 'demo123', true);
    }
    const customer = ensureCustomerForTransaction(form.customerName, form.customerEmail, form.customerPhone);
    const srv = state.services.find((s) => s.id === pkg.serviceId);
    const items = [{
      refId: pkg.id,
      serviceId: pkg.serviceId,
      name: pkg.name,
      category: srv ? srv.category : 'Jasa Digital',
      unitPrice: pkg.price,
      qty: 1,
      subtotal: pkg.price
    }];
    const couponCheck = calculateCouponDiscount(form.couponCode, pkg.price);
    const discount = couponCheck.valid ? couponCheck.discount : 0;

    const bundle = createOrderBundle({
      customer,
      type: 'service',
      summaryTitle: `${form.projectTitle} (${pkg.name})`,
      items,
      subtotal: pkg.price,
      discount,
      couponCode: couponCheck.valid ? couponCheck.coupon.code : ''
    });

    const prj = {
      id: uid('prj'),
      orderId: bundle.order.id,
      orderNo: bundle.order.orderNo,
      customerId: customer.id,
      customerName: customer.name,
      title: form.projectTitle,
      serviceName: pkg.name,
      brief: form.brief + (form.requirements ? `\nKebutuhan: ${form.requirements}` : '') + (form.attachmentName ? `\nLampiran contoh: ${form.attachmentName}` : ''),
      targetDate: form.targetDate || new Date(Date.now() + pkg.estimatedDays * 86400 * 1000).toISOString(),
      status: 'Menunggu Pembayaran',
      progress: 0,
      deliverables: pkg.features.slice(),
      sampleOutputNote: 'Proyek akan masuk antrean pengerjaan setelah pembayaran diverifikasi Admin.',
      revisionHistory: [],
      timeline: [
        { date: new Date().toISOString(), title: 'Pesanan paket jasa dibuat, menunggu pembayaran', by: customer.name }
      ],
      createdAt: new Date().toISOString()
    };
    state.projects.unshift(prj);
    saveState();
    showToast(`Pemesanan jasa ${bundle.order.orderNo} dibuat! Lanjutkan ke pembayaran.`, 'success');
    navigate(`#/invoice/${bundle.invoice.id}`);
  }

  /* ---- Custom Quotation Workflow ---- */
  function submitCustomRequest(data) {
    if (!state.currentUser || state.currentRole !== 'customer') {
      loginAsCustomer('pelanggan@example.com', 'demo123', true);
    }
    const customer = ensureCustomerForTransaction(data.contactName, data.contactEmail, data.contactPhone);
    const reqNo = `NX-REQ-${String(state.customRequests.length + 1).padStart(3, '0')}`;
    const req = {
      id: uid('creq'),
      requestNo: reqNo,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: data.contactEmail || customer.email,
      customerPhone: data.contactPhone || customer.phone,
      serviceType: data.serviceType,
      projectTitle: data.projectTitle,
      needs: data.needs || [],
      description: data.description,
      budgetRange: data.budgetRange,
      timeline: data.timeline,
      attachmentName: data.attachmentName || '',
      status: 'Menunggu Peninjauan',
      createdAt: new Date().toISOString()
    };
    state.customRequests.unshift(req);
    addAuditLog('AJUKAN_CUSTOM', reqNo, `Permintaan custom "${data.projectTitle}" dikirim pelanggan.`);
    pushNotification({
      userId: 'admin-01',
      roleTarget: 'admin',
      title: 'Permintaan Penawaran Custom Baru',
      message: `${customer.name} mengajukan ${reqNo}: ${data.projectTitle}`,
      link: '#/admin/permintaan-custom'
    });
    saveState();
    return req;
  }

  function createOrReviseQuotation({ requestId, existingQuotationId = null, title, scope, deliverablesText, price, estimatedDays, validDays = 7 }) {
    const req = state.customRequests.find((r) => r.id === requestId);
    if (!req) return null;
    const deliverables = String(deliverablesText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const existingList = state.quotations.filter((q) => q.requestId === requestId);
    const nextVersion = existingQuotationId
      ? (state.quotations.find((q) => q.id === existingQuotationId)?.version || 1) + 1
      : existingList.length + 1;

    const quo = {
      id: uid('quo'),
      quotationNo: `NX-QUO-2026-${String(state.quotations.length + 1).padStart(3, '0')}`,
      requestId: req.id,
      customerId: req.customerId,
      customerName: req.customerName,
      version: nextVersion,
      title: title || `Penawaran ${req.projectTitle} (V${nextVersion})`,
      scope,
      deliverables: deliverables.length ? deliverables : ['Deliverable sesuai kesepakatan ruang lingkup'],
      price: Number(price) || 1000000,
      estimatedDays: Number(estimatedDays) || 14,
      validUntil: new Date(Date.now() + Number(validDays || 7) * 86400 * 1000).toISOString(),
      status: 'Dikirim',
      orderId: '',
      createdAt: new Date().toISOString()
    };
    state.quotations.unshift(quo);
    req.status = 'Penawaran Dikirim';
    addAuditLog('KIRIM_PENAWARAN', quo.quotationNo, `Mengirim penawaran v${nextVersion} senilai ${formatIDR(quo.price)} untuk ${req.requestNo}.`);
    pushNotification({
      userId: req.customerId,
      roleTarget: 'customer',
      title: `Penawaran ${quo.quotationNo} Tersedia`,
      message: `Admin mengirim penawaran v${nextVersion} untuk "${req.projectTitle}" (${formatIDR(quo.price)}).`,
      link: `#/akun/penawaran/${quo.id}`
    });
    saveState();
    return quo;
  }

  function respondToQuotation(quotationId, accept) {
    const quo = state.quotations.find((q) => q.id === quotationId);
    if (!quo) return;
    const req = state.customRequests.find((r) => r.id === quo.requestId);
    const isExpired = new Date(quo.validUntil).getTime() < Date.now() || quo.status === 'Kedaluwarsa';

    if (accept && isExpired) {
      quo.status = 'Kedaluwarsa';
      saveState();
      showToast('Penawaran ini sudah kedaluwarsa. Hubungi Admin untuk pembaruan versi penawaran.', 'danger');
      return;
    }

    if (accept) {
      if (quo.status === 'Diterima' && quo.orderId) {
        navigate(`#/invoice/${state.orders.find((o) => o.id === quo.orderId)?.invoiceId || ''}`);
        return;
      }
      const cust = state.customers.find((c) => c.id === quo.customerId) || ensureCustomerForTransaction();
      const bundle = createOrderBundle({
        customer: cust,
        type: 'service',
        summaryTitle: `${quo.title} (${quo.quotationNo})`,
        items: [{
          refId: quo.id,
          name: quo.title,
          category: 'Jasa Custom',
          unitPrice: quo.price,
          qty: 1,
          subtotal: quo.price
        }],
        subtotal: quo.price
      });
      quo.status = 'Diterima';
      quo.orderId = bundle.order.id;
      if (req) req.status = 'Disetujui';

      state.projects.unshift({
        id: uid('prj'),
        orderId: bundle.order.id,
        orderNo: bundle.order.orderNo,
        customerId: cust.id,
        customerName: cust.name,
        title: quo.title,
        serviceName: `Custom Project (${quo.quotationNo})`,
        brief: quo.scope,
        targetDate: new Date(Date.now() + quo.estimatedDays * 86400 * 1000).toISOString(),
        status: 'Menunggu Pembayaran',
        progress: 0,
        deliverables: quo.deliverables.slice(),
        sampleOutputNote: 'Penawaran custom telah disetujui. Pengerjaan dimulai setelah pembayaran diverifikasi.',
        revisionHistory: [],
        timeline: [
          { date: new Date().toISOString(), title: `Penawaran ${quo.quotationNo} disetujui pelanggan & invoice diterbitkan`, by: cust.name }
        ],
        createdAt: new Date().toISOString()
      });

      addAuditLog('TERIMA_PENAWARAN', quo.quotationNo, `Pelanggan menyetujui penawaran dan invoice ${bundle.invoice.invoiceNo} dibuat.`);
      saveState();
      showToast('Penawaran disetujui! Invoice pembayaran telah diterbitkan.', 'success');
      navigate(`#/invoice/${bundle.invoice.id}`);
    } else {
      quo.status = 'Ditolak';
      if (req) req.status = 'Penawaran Ditolak';
      addAuditLog('TOLAK_PENAWARAN', quo.quotationNo, 'Pelanggan menolak penawaran custom.');
      saveState();
      showToast('Penawaran ditolak. Anda dapat berdiskusi ulang dengan Admin.', 'info');
      rerenderActiveViews();
    }
  }

  /* ---- Training Seat Reservation & Registration ---- */
  function getSessionAvailability(session) {
    const used = (Number(session.confirmedCount) || 0) + (Number(session.reservedCount) || 0);
    const remaining = Math.max(0, (Number(session.quota) || 0) - used);
    return { used, remaining, isFull: remaining <= 0 };
  }

  function submitTrainingRegistration(sessionId, form) {
    const ses = state.trainingSessions.find((s) => s.id === sessionId);
    if (!ses) return null;
    const prog = state.trainingPrograms.find((p) => p.id === ses.programId);
    const seats = Math.max(1, Number(form.seats) || 1);
    const avail = getSessionAvailability(ses);
    if (seats > avail.remaining) {
      showToast(`Sisa kuota sesi ini hanya ${avail.remaining} kursi.`, 'danger');
      return null;
    }

    if (!state.currentUser || state.currentRole !== 'customer') {
      loginAsCustomer('pelanggan@example.com', 'demo123', true);
    }
    const customer = ensureCustomerForTransaction(form.participantName, form.participantEmail, form.participantPhone);
    const subtotal = prog.price * seats;
    const couponCheck = calculateCouponDiscount(form.couponCode, subtotal);
    const discount = couponCheck.valid ? couponCheck.discount : 0;

    const bundle = createOrderBundle({
      customer,
      type: 'training',
      summaryTitle: `${prog.title} — ${ses.title} (${seats} peserta)`,
      items: [{
        refId: ses.id,
        programId: prog.id,
        name: `${prog.title} (${ses.title})`,
        category: 'Pelatihan',
        unitPrice: prog.price,
        qty: seats,
        subtotal
      }],
      subtotal,
      discount,
      couponCode: couponCheck.valid ? couponCheck.coupon.code : ''
    });

    ses.reservedCount = (Number(ses.reservedCount) || 0) + seats;
    const enr = {
      id: uid('enr'),
      orderId: bundle.order.id,
      orderNo: bundle.order.orderNo,
      sessionId: ses.id,
      programId: prog.id,
      customerId: customer.id,
      participantName: form.participantName,
      participantEmail: form.participantEmail,
      participantPhone: form.participantPhone,
      seats,
      notes: form.notes || '',
      paymentStatus: 'Menunggu Pembayaran',
      status: 'Reservasi Sementara',
      reservationExpiresAt: new Date(Date.now() + 2 * 86400 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };
    state.enrollments.unshift(enr);
    addAuditLog('RESERVASI_PELATIHAN', bundle.order.orderNo, `${seats} kursi direservasi sementara pada ${ses.title}.`);
    saveState();
    showToast(`Reservasi ${seats} kursi berhasil! Selesaikan pembayaran sebelum batas waktu.`, 'success');
    navigate(`#/invoice/${bundle.invoice.id}`);
    return enr;
  }

  function releaseExpiredTrainingReservation(enrollmentId) {
    const enr = state.enrollments.find((e) => e.id === enrollmentId);
    if (!enr || enr.status !== 'Reservasi Sementara') return;
    const ses = state.trainingSessions.find((s) => s.id === enr.sessionId);
    if (ses) {
      ses.reservedCount = Math.max(0, (Number(ses.reservedCount) || 0) - enr.seats);
    }
    enr.status = 'Kedaluwarsa';
    enr.paymentStatus = 'Pembayaran Kedaluwarsa';
    const pay = state.payments.find((p) => p.orderId === enr.orderId);
    if (pay && pay.status === 'Menunggu Pembayaran') pay.status = 'Pembayaran Kedaluwarsa';
    addAuditLog('LEPAS_KUOTA_RESERVASI', enr.orderNo, `Reservasi kedaluwarsa dilepas (${enr.seats} kursi kembali tersedia).`);
    saveState();
    showToast('Reservasi kedaluwarsa dilepas dan kuota sesi dikembalikan.', 'info');
    rerenderActiveViews();
  }

  /* ---- Manual Payment Proof Upload & Admin Verification (Strict Rules) ---- */
  function uploadPaymentProof(paymentId, { imageDataUrl, fileName, customerNote }) {
    const pay = state.payments.find((p) => p.id === paymentId);
    if (!pay) return false;
    if (!imageDataUrl) {
      showToast('Pilih atau unggah gambar bukti transfer terlebih dahulu.', 'warning');
      return false;
    }
    // Business rule: upload proof NEVER automatically approves payment!
    pay.proofImage = imageDataUrl;
    pay.proofFileName = fileName || 'bukti-transfer-demo.jpg';
    pay.customerNote = customerNote || '';
    pay.status = 'Menunggu Verifikasi';
    pay.rejectionReason = '';
    pay.submittedAt = new Date().toISOString();

    const ord = state.orders.find((o) => o.id === pay.orderId);
    if (ord) ord.status = 'Menunggu Verifikasi';
    const enr = state.enrollments.find((e) => e.orderId === pay.orderId);
    if (enr) enr.paymentStatus = 'Menunggu Verifikasi';

    addAuditLog('UNGGAH_BUKTI', pay.orderNo, 'Pelanggan mengunggah bukti transfer. Status menjadi Menunggu Verifikasi.');
    pushNotification({
      userId: 'admin-01',
      roleTarget: 'admin',
      title: 'Bukti Pembayaran Perlu Verifikasi',
      message: `${pay.customerName} mengunggah bukti transfer untuk ${pay.orderNo} (${formatIDR(pay.amount)}).`,
      link: '#/admin/pembayaran'
    });
    saveState();
    showToast('Bukti pembayaran berhasil diunggah dan menunggu verifikasi Admin.', 'success');
    rerenderActiveViews();
    return true;
  }

  function verifyPayment(paymentId) {
    const pay = state.payments.find((p) => p.id === paymentId);
    if (!pay) return;
    // Strict idempotency guard: repeated approval cannot double-count revenue or entitlements
    if (pay.verifiedApplied || pay.status === 'Pembayaran Diverifikasi') {
      showToast('Pembayaran ini sudah diverifikasi sebelumnya. Tidak ada duplikasi hak akses atau pendapatan.', 'info');
      return;
    }

    pay.status = 'Pembayaran Diverifikasi';
    pay.verifiedApplied = true;
    pay.verifiedAt = new Date().toISOString();
    pay.rejectionReason = '';

    const ord = state.orders.find((o) => o.id === pay.orderId);
    if (ord) ord.status = ord.type === 'service' ? 'Diproses' : 'Selesai';
    const inv = state.invoices.find((i) => i.id === pay.invoiceId);
    if (inv) inv.status = 'Lunas';

    // Fulfill entitlement based on order type
    if (pay.type === 'product' && ord) {
      ord.items.forEach((it) => {
        const prod = state.products.find((p) => p.id === it.refId);
        if (prod && prod.licenseLimit !== null && prod.licenseLimit !== undefined) {
          prod.licenseLimit = Math.max(0, prod.licenseLimit - (it.qty || 1));
        }
      });
    }

    if (pay.type === 'service') {
      const prj = state.projects.find((p) => p.orderId === pay.orderId);
      if (prj && prj.status === 'Menunggu Pembayaran') {
        prj.status = 'Dalam Antrean';
        prj.progress = 15;
        prj.sampleOutputNote = 'Pembayaran diverifikasi. Proyek telah masuk antrean produksi.';
        prj.timeline.push({
          date: new Date().toISOString(),
          title: 'Pembayaran diverifikasi Admin & proyek masuk antrean',
          by: state.currentUser ? state.currentUser.name : 'Admin'
        });
      }
    }

    if (pay.type === 'training') {
      const enr = state.enrollments.find((e) => e.orderId === pay.orderId);
      if (enr) {
        const ses = state.trainingSessions.find((s) => s.id === enr.sessionId);
        const expired = new Date(enr.reservationExpiresAt).getTime() < Date.now();
        if (expired && enr.status !== 'Terkonfirmasi') {
          const avail = ses ? getSessionAvailability(ses) : { remaining: 0 };
          if (avail.remaining >= enr.seats) {
            enr.status = 'Terkonfirmasi';
            enr.paymentStatus = 'Pembayaran Diverifikasi';
            if (ses) ses.confirmedCount = (Number(ses.confirmedCount) || 0) + enr.seats;
          } else {
            enr.status = 'Perlu Penjadwalan Ulang';
            enr.paymentStatus = 'Pembayaran Diverifikasi';
          }
        } else {
          enr.status = 'Terkonfirmasi';
          enr.paymentStatus = 'Pembayaran Diverifikasi';
          if (ses) {
            ses.reservedCount = Math.max(0, (Number(ses.reservedCount) || 0) - enr.seats);
            ses.confirmedCount = (Number(ses.confirmedCount) || 0) + enr.seats;
          }
        }
      }
    }

    addAuditLog('VERIFIKASI_PEMBAYARAN', pay.orderNo, `Menyetujui pembayaran ${formatIDR(pay.amount)} & membuka hak akses.`);
    pushNotification({
      userId: pay.customerId,
      roleTarget: 'customer',
      title: 'Pembayaran Diverifikasi',
      message: `Pembayaran ${pay.orderNo} (${formatIDR(pay.amount)}) telah disetujui. Akses layanan Anda kini aktif.`,
      link: pay.type === 'product' ? '#/akun/unduhan' : pay.type === 'service' ? '#/akun/proyek' : '#/akun/pelatihan'
    });
    saveState();
    showToast(`Pembayaran ${pay.orderNo} berhasil diverifikasi!`, 'success');
    rerenderActiveViews();
  }

  function rejectPayment(paymentId, reason) {
    const pay = state.payments.find((p) => p.id === paymentId);
    if (!pay) return false;
    const cleanReason = String(reason || '').trim();
    if (!cleanReason) {
      showToast('Alasan penolakan wajib diisi.', 'danger');
      return false;
    }
    pay.status = 'Pembayaran Ditolak';
    pay.rejectionReason = cleanReason;

    const ord = state.orders.find((o) => o.id === pay.orderId);
    if (ord) ord.status = 'Perlu Unggah Ulang';
    const enr = state.enrollments.find((e) => e.orderId === pay.orderId);
    if (enr) enr.paymentStatus = 'Pembayaran Ditolak';

    addAuditLog('TOLAK_PEMBAYARAN', pay.orderNo, `Menolak pembayaran: ${cleanReason}`);
    pushNotification({
      userId: pay.customerId,
      roleTarget: 'customer',
      title: 'Pembayaran Ditolak — Unggah Ulang',
      message: `Pembayaran ${pay.orderNo} ditolak: ${cleanReason}`,
      link: `#/pembayaran/${pay.id}`
    });
    saveState();
    showToast(`Pembayaran ${pay.orderNo} ditolak dengan alasan tercatat.`, 'warning');
    rerenderActiveViews();
    return true;
  }

  /* ---- Digital Deliverable Blob Download ---- */
  function downloadDigitalDeliverable(orderId, productId) {
    const ord = state.orders.find((o) => o.id === orderId);
    const pay = state.payments.find((p) => p.orderId === orderId);
    if (!ord || !pay || pay.status !== 'Pembayaran Diverifikasi') {
      showToast('Unduhan hanya tersedia setelah pembayaran diverifikasi oleh Admin.', 'warning');
      return;
    }
    const prod = state.products.find((p) => p.id === productId);
    const item = ord.items.find((i) => i.refId === productId);
    const title = prod ? prod.name : (item ? item.name : 'Produk Digital NEXORA');
    const content = [
      '====================================================================',
      'NEXORA DIGITAL COMMERCE DEMO — PAKET UNDUHAN PRODUK DIGITAL',
      '====================================================================',
      `Nomor Pesanan    : ${ord.orderNo}`,
      `Pelanggan        : ${ord.customerName} (${ord.customerEmail})`,
      `Nama Produk      : ${title}`,
      `Kategori         : ${item ? item.category : (prod ? prod.category : '-')}`,
      `Format File      : ${prod ? prod.fileFormat : 'Digital Package'}`,
      `Harga Transaksi  : ${formatIDR(item ? item.unitPrice : ord.total)}`,
      `Tanggal Verif.   : ${formatDate(pay.verifiedAt || pay.createdAt, true)}`,
      '',
      'RINGKASAN ISI PRODUK (SIMULASI):',
      ...(prod && prod.contents ? prod.contents.map((c, i) => `  ${i + 1}. ${c}`) : ['  1. Materi Utama Produk Digital']),
      '',
      'KETENTUAN LISENSI:',
      `  ${prod ? prod.licenseTerms : 'Lisensi Demo NEXORA.'}`,
      '',
      'CATATAN: File ini dibuat otomatis melalui JavaScript Blob API untuk keperluan demonstrasi.'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEXORA-${slugify(title)}-${ord.orderNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast(`Mengunduh paket file contoh: ${title}`, 'success');
  }

  /* ---- CSV Export Simulation ---- */
  function exportReportsCSV() {
    const headers = ['No Pesanan', 'Tanggal', 'Pelanggan', 'Jenis', 'Ringkasan', 'Nominal (IDR)', 'Status Pembayaran'];
    const rows = state.orders.map((o) => {
      const pay = state.payments.find((p) => p.orderId === o.id);
      return [
        o.orderNo,
        formatDate(o.createdAt),
        o.customerName,
        o.type,
        o.summaryTitle,
        o.total,
        pay ? pay.status : o.status
      ].map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexora-laporan-simulasi-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('Laporan transaksi simulasi berhasil diekspor ke CSV.', 'success');
  }

  /* ---- Verified Revenue & Dashboard Metrics ---- */
  function computeAnalytics() {
    const verifiedPayments = state.payments.filter((p) => p.status === 'Pembayaran Diverifikasi');
    const verifiedRevenue = verifiedPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const pendingPayments = state.payments.filter((p) => p.status === 'Menunggu Verifikasi');
    const activeProducts = state.products.filter((p) => p.status === 'active').length;
    const runningProjects = state.projects.filter((p) => ['Dalam Antrean', 'Dalam Pengerjaan', 'Menunggu Review', 'Revisi'].includes(p.status)).length;
    const totalParticipants = state.enrollments.filter((e) => e.status === 'Terkonfirmasi' || e.status === 'Reservasi Sementara').reduce((s, e) => s + (e.seats || 1), 0);

    const revByCategory = { product: 0, service: 0, training: 0 };
    verifiedPayments.forEach((p) => {
      if (p.type in revByCategory) revByCategory[p.type] += Number(p.amount) || 0;
    });

    const statusCounts = {
      'Pembayaran Diverifikasi': 0,
      'Menunggu Verifikasi': 0,
      'Menunggu Pembayaran': 0,
      'Pembayaran Ditolak': 0,
      'Lainnya': 0
    };
    state.payments.forEach((p) => {
      if (p.status in statusCounts) statusCounts[p.status]++;
      else statusCounts['Lainnya']++;
    });

    const productSalesMap = {};
    state.orders.filter((o) => o.type === 'product').forEach((o) => {
      o.items.forEach((it) => {
        productSalesMap[it.name] = (productSalesMap[it.name] || 0) + (it.qty || 1);
      });
    });
    const topProducts = Object.entries(productSalesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const trainingRank = state.trainingPrograms.map((prog) => {
      const sesList = state.trainingSessions.filter((s) => s.programId === prog.id);
      const count = sesList.reduce((s, x) => s + (Number(x.confirmedCount) || 0), 0);
      return { title: prog.title, count };
    }).sort((a, b) => b.count - a.count);

    return {
      verifiedRevenue,
      totalOrders: state.orders.length,
      totalCustomers: state.customers.length,
      activeProducts,
      pendingVerificationCount: pendingPayments.length,
      runningProjects,
      totalParticipants,
      revByCategory,
      statusCounts,
      topProducts,
      trainingRank
    };
  }

  /* ------------------------------------------------------------------------
     08. GLOBAL WEBSITE COMPONENTS & RENDER HELPERS
     ------------------------------------------------------------------------ */
  function renderBreadcrumbs(items) {
    return `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="#/">Beranda</a>
        ${items.map((it, i) => `
          <span>${icon('chevron-right', 14)}</span>
          ${i === items.length - 1 || !it.href
            ? `<span class="font-semibold text-primary-brand">${escapeHtml(it.label)}</span>`
            : `<a href="${escapeHtml(it.href)}">${escapeHtml(it.label)}</a>`}
        `).join('')}
      </nav>
    `;
  }

  function renderProductCard(prod, listView = false) {
    const archived = prod.status !== 'active';
    return `
      <article class="card card-hover catalog-card ${listView ? 'list-view' : ''}">
        <a href="#/produk/detail/${escapeHtml(prod.id)}" class="card-thumb">
          <img src="${prod.thumbnail}" alt="${escapeHtml(prod.name)}">
          <div class="card-thumb-badge flex gap-1">
            <span class="badge ${archived ? 'badge-danger' : 'badge-primary'}">${escapeHtml(archived ? 'Diarsipkan' : prod.category)}</span>
          </div>
        </a>
        <div class="card-content">
          <div class="flex items-center justify-between gap-2">
            <span class="text-caption text-muted">${escapeHtml(prod.fileFormat)} • ${escapeHtml(prod.fileSize)}</span>
            ${prod.allowMultiUnit ? `<span class="badge badge-accent">Multi-unit</span>` : ''}
          </div>
          <a href="#/produk/detail/${escapeHtml(prod.id)}" class="card-title">${escapeHtml(prod.name)}</a>
          <p class="card-desc">${escapeHtml(prod.shortDesc)}</p>
          <div class="card-footer">
            <div class="price-tag">${formatIDR(prod.price)}</div>
            <div class="flex items-center gap-2">
              <a href="#/produk/detail/${escapeHtml(prod.id)}" class="btn btn-secondary btn-sm">Detail</a>
              <button type="button" class="btn btn-primary btn-sm" data-add-cart="${escapeHtml(prod.id)}" ${archived ? 'disabled' : ''} aria-label="Tambah ${escapeHtml(prod.name)} ke keranjang">
                ${icon('shopping-bag', 14)} Tambah
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderServiceCard(srv) {
    return `
      <article class="card card-hover catalog-card">
        <a href="#/jasa/detail/${escapeHtml(srv.id)}" class="card-thumb">
          <img src="${srv.thumbnail}" alt="${escapeHtml(srv.name)}">
          <div class="card-thumb-badge">
            <span class="badge badge-primary">${escapeHtml(srv.category)}</span>
          </div>
        </a>
        <div class="card-content">
          <div class="flex items-center gap-2 text-caption text-muted">
            ${icon('clock', 14)} <span>Estimasi ${escapeHtml(srv.estimateLabel)}</span>
          </div>
          <a href="#/jasa/detail/${escapeHtml(srv.id)}" class="card-title">${escapeHtml(srv.name)}</a>
          <p class="card-desc">${escapeHtml(srv.shortDesc)}</p>
          <div class="card-footer">
            <div>
              <div class="text-caption text-muted">Mulai dari</div>
              <div class="price-tag">${formatIDR(srv.startingPrice)}</div>
            </div>
            <a href="#/jasa/detail/${escapeHtml(srv.id)}" class="btn btn-outline btn-sm">
              Lihat Paket ${icon('arrow-right', 14)}
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function renderTrainingCard(prog) {
    const sessions = state.trainingSessions.filter((s) => s.programId === prog.id);
    const nextSes = sessions[0];
    const avail = nextSes ? getSessionAvailability(nextSes) : { remaining: 0, isFull: true };
    return `
      <article class="card card-hover catalog-card">
        <a href="#/pelatihan/detail/${escapeHtml(prog.id)}" class="card-thumb">
          <img src="${prog.thumbnail}" alt="${escapeHtml(prog.title)}">
          <div class="card-thumb-badge flex gap-1">
            <span class="badge badge-accent">${escapeHtml(prog.mode)}</span>
          </div>
        </a>
        <div class="card-content">
          <div class="flex items-center gap-2 text-caption text-muted">
            ${icon('map-pin', 14)} <span>${escapeHtml(prog.primaryLocation)}</span>
          </div>
          <a href="#/pelatihan/detail/${escapeHtml(prog.id)}" class="card-title">${escapeHtml(prog.title)}</a>
          <p class="card-desc">${escapeHtml(prog.shortDesc)}</p>
          ${nextSes ? `
            <div class="text-caption text-secondary flex items-center gap-1">
              ${icon('calendar', 14)} <span>Berikutnya: ${formatDate(nextSes.date)} • ${avail.isFull ? '<strong class="text-danger">Penuh</strong>' : `Sisa ${avail.remaining} kursi`}</span>
            </div>
          ` : ''}
          <div class="card-footer">
            <div class="price-tag">${formatIDR(prog.price)}</div>
            <a href="#/pelatihan/detail/${escapeHtml(prog.id)}" class="btn btn-primary btn-sm">
              Detail & Jadwal
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function renderArticleCard(art) {
    return `
      <article class="card card-hover catalog-card">
        <a href="#/artikel/detail/${escapeHtml(art.id)}" class="card-thumb">
          <img src="${art.cover}" alt="${escapeHtml(art.title)}">
          <div class="card-thumb-badge">
            <span class="badge badge-neutral">${escapeHtml(art.category)}</span>
          </div>
        </a>
        <div class="card-content">
          <div class="flex items-center gap-2 text-caption text-muted">
            <span>${formatDate(art.publishedAt)}</span>
            <span>•</span>
            <span>${art.readMinutes} menit baca</span>
          </div>
          <a href="#/artikel/detail/${escapeHtml(art.id)}" class="card-title">${escapeHtml(art.title)}</a>
          <p class="card-desc">${escapeHtml(art.excerpt)}</p>
          <div class="card-footer">
            <span class="text-caption text-secondary">${escapeHtml(art.author)}</span>
            <a href="#/artikel/detail/${escapeHtml(art.id)}" class="btn btn-ghost btn-sm text-primary-brand">
              Baca Artikel ${icon('arrow-right', 14)}
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function renderPagination(currentPage, totalPages, dataAttr) {
    if (totalPages <= 1) return '';
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return `
      <div class="pagination" role="navigation" aria-label="Navigasi halaman">
        <button type="button" class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} ${dataAttr}="${currentPage - 1}" aria-label="Halaman sebelumnya">‹</button>
        ${pages.map((p) => `
          <button type="button" class="page-btn ${p === currentPage ? 'active' : ''}" ${dataAttr}="${p}">${p}</button>
        `).join('')}
        <button type="button" class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} ${dataAttr}="${currentPage + 1}" aria-label="Halaman berikutnya">›</button>
      </div>
    `;
  }

  function getGlobalSearchSuggestions(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const results = [];
    state.products.filter((p) => p.status === 'active' && (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)))
      .slice(0, 3)
      .forEach((p) => results.push({ type: 'Produk', label: p.name, meta: formatIDR(p.price), href: `#/produk/detail/${p.id}` }));
    state.services.filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((s) => results.push({ type: 'Jasa', label: s.name, meta: `Mulai ${formatIDR(s.startingPrice)}`, href: `#/jasa/detail/${s.id}` }));
    state.trainingPrograms.filter((t) => t.title.toLowerCase().includes(q) || t.primaryLocation.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((t) => results.push({ type: 'Pelatihan', label: t.title, meta: t.mode, href: `#/pelatihan/detail/${t.id}` }));
    state.articles.filter((a) => a.status === 'published' && a.title.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((a) => results.push({ type: 'Artikel', label: a.title, meta: a.category, href: `#/artikel/detail/${a.id}` }));
    return results.slice(0, 7);
  }

  function getActiveNotifications() {
    if (!state.currentUser) return [];
    if (state.currentRole === 'admin') {
      return state.notifications.filter((n) => n.roleTarget === 'admin');
    }
    return state.notifications.filter((n) => n.roleTarget === 'customer' && n.userId === state.currentUser.id);
  }

  function renderAnnouncementBar() {
    if (ui.announcementDismissed) return '';
    return `
      <div class="announcement-bar no-print">
        <div class="announcement-inner">
          <div class="announcement-copy">
            <span class="announcement-pill">${icon('sparkles', 12)} SIMULASI V2.0</span>
            <span>${escapeHtml(state.settings.announcementText)}</span>
            <a href="${escapeHtml(state.settings.announcementLink)}" class="announcement-link">${escapeHtml(state.settings.announcementCta)}</a>
          </div>
          <button type="button" class="announcement-close" id="dismiss-announcement-btn" aria-label="Tutup pengumuman">${icon('x', 16)}</button>
        </div>
      </div>
    `;
  }

  function renderPublicHeader(route) {
    const cartCount = state.cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    const notifs = getActiveNotifications();
    const unreadCount = notifs.filter((n) => !n.read).length;
    const suggestions = ui.searchFocused ? getGlobalSearchSuggestions(ui.searchQuery) : [];

    return `
      <div class="demo-banner-strip no-print">MODE DEMO — Data simulasi, bukan transaksi nyata.</div>
      ${renderAnnouncementBar()}
      <header class="site-header no-print" id="site-header">
        <div class="navbar-inner">
          <div class="flex items-center gap-3">
            <button type="button" class="icon-btn mobile-menu-btn" id="open-mobile-nav-btn" aria-label="Buka menu navigasi">
              ${icon('menu', 20)}
            </button>
            <a href="#/" class="brand-logo" aria-label="NEXORA Beranda">
              <span class="brand-mark">${icon('layers', 20)}</span>
              <span>
                <span>NEXORA</span>
                <span class="brand-sub">Belajar. Berkarya. Berkembang.</span>
              </span>
            </a>
          </div>

          <nav class="nav-links" aria-label="Navigasi utama">
            <div class="nav-item">
              <button type="button" class="nav-link ${route.path.startsWith('/produk') || route.path.startsWith('/jasa') || route.path.startsWith('/pelatihan') ? 'active' : ''}" id="mega-menu-trigger" aria-expanded="${ui.megaMenuOpen ? 'true' : 'false'}">
                Ekosistem ${icon('chevron-down', 14)}
              </button>
            </div>
            <a href="#/produk" class="nav-link ${route.path.startsWith('/produk') ? 'active' : ''}">Produk Digital</a>
            <a href="#/jasa" class="nav-link ${route.path.startsWith('/jasa') ? 'active' : ''}">Jasa Digital</a>
            <a href="#/pelatihan" class="nav-link ${route.path.startsWith('/pelatihan') ? 'active' : ''}">Pelatihan</a>
            <a href="#/portofolio" class="nav-link ${route.path.startsWith('/portofolio') ? 'active' : ''}">Portofolio</a>
            <a href="#/artikel" class="nav-link ${route.path.startsWith('/artikel') ? 'active' : ''}">Artikel</a>
          </nav>

          <div class="nav-search-wrap">
            <form id="global-search-form" class="nav-search-input-box" role="search">
              <span class="text-muted">${icon('search', 16)}</span>
              <input type="search" id="global-search-input" placeholder="Cari produk, jasa, pelatihan..." value="${escapeHtml(ui.searchQuery)}" autocomplete="off" aria-label="Pencarian global">
            </form>
            ${ui.searchFocused && ui.searchQuery.trim().length > 0 ? `
              <div class="search-suggestions" role="listbox">
                ${suggestions.length === 0 ? `
                  <div class="text-caption text-muted" style="padding:10px 12px;">Tidak ada saran langsung. Tekan Enter untuk pencarian penuh.</div>
                ` : suggestions.map((s) => `
                  <a href="${escapeHtml(s.href)}" class="search-suggestion-item" data-clear-search-focus>
                    <div>
                      <div class="font-semibold">${escapeHtml(s.label)}</div>
                      <div class="text-caption text-muted">${escapeHtml(s.type)}</div>
                    </div>
                    <span class="text-caption font-bold text-primary-brand">${escapeHtml(s.meta)}</span>
                  </a>
                `).join('')}
                <a href="#/cari?q=${encodeURIComponent(ui.searchQuery)}" class="search-suggestion-item" style="border-top:1px solid var(--border);margin-top:4px;color:var(--primary);font-weight:700;" data-clear-search-focus>
                  <span>Lihat semua hasil untuk "${escapeHtml(ui.searchQuery)}"</span>
                  ${icon('arrow-right', 14)}
                </a>
              </div>
            ` : ''}
          </div>

          <div class="nav-actions">
            <button type="button" class="icon-btn" id="open-cart-btn" aria-label="Buka keranjang belanja">
              ${icon('shopping-bag', 18)}
              ${cartCount > 0 ? `<span class="count-badge">${cartCount}</span>` : ''}
            </button>

            ${state.currentUser ? `
              <div class="dropdown-wrap">
                <button type="button" class="icon-btn" id="notif-toggle-btn" aria-label="Notifikasi" aria-expanded="${ui.notifDropdownOpen ? 'true' : 'false'}">
                  ${icon('bell', 18)}
                  ${unreadCount > 0 ? `<span class="count-badge">${unreadCount}</span>` : ''}
                </button>
                ${ui.notifDropdownOpen ? `
                  <div class="dropdown-panel">
                    <div class="dropdown-header">
                      <span>Notifikasi (${unreadCount} baru)</span>
                      <button type="button" class="btn btn-ghost btn-sm" id="mark-all-read-btn">Tandai Dibaca</button>
                    </div>
                    <div class="dropdown-list">
                      ${notifs.length === 0 ? `<div class="text-sm text-muted" style="padding:16px;">Belum ada notifikasi.</div>` : notifs.slice(0, 6).map((n) => `
                        <a href="${escapeHtml(n.link)}" class="dropdown-item ${n.read ? '' : 'unread'}" data-read-notif="${escapeHtml(n.id)}">
                          <span style="color:var(--primary);margin-top:2px;">${icon('bell', 15)}</span>
                          <div>
                            <div class="font-semibold">${escapeHtml(n.title)}</div>
                            <div class="text-caption text-secondary">${escapeHtml(n.message)}</div>
                          </div>
                        </a>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>

              <div class="dropdown-wrap nav-auth-desktop">
                <button type="button" class="btn btn-secondary btn-sm" id="profile-toggle-btn" aria-expanded="${ui.profileDropdownOpen ? 'true' : 'false'}">
                  ${icon('user', 16)}
                  <span>${escapeHtml(state.currentUser.name.split(' ')[0])}</span>
                  ${icon('chevron-down', 14)}
                </button>
                ${ui.profileDropdownOpen ? `
                  <div class="dropdown-panel" style="width:240px;">
                    <div class="dropdown-header">
                      <div>
                        <div class="font-bold">${escapeHtml(state.currentUser.name)}</div>
                        <div class="text-caption text-muted">${state.currentRole === 'admin' ? 'Admin Demo' : 'Pelanggan Demo'}</div>
                      </div>
                    </div>
                    <div style="padding:8px;">
                      <a href="${state.currentRole === 'admin' ? '#/admin/dashboard' : '#/akun/dashboard'}" class="dash-link" data-close-dropdowns>${icon('layout', 15)} Dashboard</a>
                      ${state.currentRole === 'customer' ? `
                        <a href="#/akun/pesanan" class="dash-link" data-close-dropdowns>${icon('file-text', 15)} Pesanan Saya</a>
                        <a href="#/akun/unduhan" class="dash-link" data-close-dropdowns>${icon('download', 15)} Unduhan Digital</a>
                      ` : `
                        <a href="#/admin/pembayaran" class="dash-link" data-close-dropdowns>${icon('credit-card', 15)} Verifikasi Pembayaran</a>
                      `}
                      <button type="button" class="dash-link w-full text-danger" style="border:none;background:transparent;cursor:pointer;" data-action="logout">${icon('log-out', 15)} Keluar</button>
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : `
              <div class="flex items-center gap-2 nav-auth-desktop">
                <a href="#/masuk" class="btn btn-secondary btn-sm">Masuk</a>
                <a href="#/daftar" class="btn btn-primary btn-sm">Daftar</a>
              </div>
            `}
          </div>
        </div>

        <!-- Mega Menu Panel -->
        <div class="mega-menu ${ui.megaMenuOpen ? 'open' : ''}" id="mega-menu-panel" role="region" aria-label="Menu Ekosistem NEXORA">
          <div class="mega-grid">
            <div>
              <div class="text-caption font-bold text-muted mb-2" style="text-transform:uppercase;letter-spacing:.05em;">Tiga Pilar Bisnis NEXORA</div>
              <a href="#/produk" class="mega-item" data-close-mega>
                <div class="mega-icon">${icon('layers', 20)}</div>
                <div>
                  <div class="font-bold">Produk Digital</div>
                  <div class="text-caption text-secondary">E-book, aplikasi & platform, konten digital, template siap pakai, dan lisensi akun pro resmi.</div>
                </div>
              </a>
              <a href="#/jasa" class="mega-item" data-close-mega>
                <div class="mega-icon" style="background:var(--accent-light);color:var(--accent);">${icon('briefcase', 20)}</div>
                <div>
                  <div class="font-bold">Jasa Digital & Custom</div>
                  <div class="text-caption text-secondary">Pembuatan website, streaming Zoom, editing video, desain kreatif, hingga proyek custom.</div>
                </div>
              </a>
              <a href="#/pelatihan" class="mega-item" data-close-mega>
                <div class="mega-icon" style="background:var(--success-light);color:var(--success);">${icon('graduation-cap', 20)}</div>
                <div>
                  <div class="font-bold">Pelatihan & Workshop</div>
                  <div class="text-caption text-secondary">Pelatihan offline Cisarua & Bekasi, Barista, AI TQN, Webinar AI, dan Workshop Digital.</div>
                </div>
              </a>
            </div>
            <div class="mega-promo">
              <div>
                <span class="badge badge-primary">Akses Cepat</span>
                <h4 class="text-h4 mt-2">Butuh Solusi Khusus Perusahaan?</h4>
                <p class="text-sm text-secondary mt-1">Ajukan kebutuhan proyek melalui formulir penawaran custom bertahap dan pantau penawaran langsung dari dashboard.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <a href="#/jasa/custom" class="btn btn-primary btn-sm" data-close-mega>Minta Penawaran Custom</a>
                <a href="#/bantuan" class="btn btn-secondary btn-sm" data-close-mega>Pusat Bantuan</a>
              </div>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  function renderPublicFooter() {
    return `
      <footer class="site-footer no-print">
        <div class="container">
          <div class="footer-grid">
            <div>
              <a href="#/" class="brand-logo" style="color:#fff;">
                <span class="brand-mark">${icon('layers', 20)}</span>
                <span>NEXORA</span>
              </a>
              <p class="text-sm mt-3" style="color:#B9C7DC;max-width:340px;">
                ${escapeHtml(state.settings.positioning)} — Belajar. Berkarya. Berkembang.
                ${escapeHtml(state.settings.footerNote)}
              </p>
              <div class="mt-3 text-caption" style="color:#94A8C4;">
                <div>${escapeHtml(state.settings.contactEmail)} • ${escapeHtml(state.settings.contactPhone)}</div>
                <div class="mt-1">${escapeHtml(state.settings.operatingHours)}</div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-bold mb-2" style="color:#fff;">Ekosistem Bisnis</h4>
              <ul>
                <li><a href="#/produk" class="footer-link">Katalog Produk Digital</a></li>
                <li><a href="#/jasa" class="footer-link">Katalog Jasa Digital</a></li>
                <li><a href="#/jasa/custom" class="footer-link">Penawaran Custom</a></li>
                <li><a href="#/pelatihan" class="footer-link">Program Pelatihan</a></li>
                <li><a href="#/portofolio" class="footer-link">Portofolio Contoh</a></li>
              </ul>
            </div>
            <div>
              <h4 class="text-sm font-bold mb-2" style="color:#fff;">Informasi & Dukungan</h4>
              <ul>
                <li><a href="#/tentang" class="footer-link">Tentang NEXORA</a></li>
                <li><a href="#/artikel" class="footer-link">Artikel & Insight</a></li>
                <li><a href="#/bantuan" class="footer-link">Pusat Bantuan</a></li>
                <li><a href="#/kontak" class="footer-link">Kontak Kami</a></li>
                <li><a href="#/cari" class="footer-link">Pencarian Global</a></li>
              </ul>
            </div>
            <div>
              <h4 class="text-sm font-bold mb-2" style="color:#fff;">Kebijakan Contoh & Akun</h4>
              <ul>
                <li><a href="#/kebijakan-privasi" class="footer-link">Kebijakan Privasi (Contoh)</a></li>
                <li><a href="#/syarat-ketentuan" class="footer-link">Syarat & Ketentuan (Contoh)</a></li>
                <li><a href="#/pengembalian-dana" class="footer-link">Kebijakan Pengembalian Dana (Contoh)</a></li>
                <li><a href="#/masuk" class="footer-link">Masuk Pelanggan / Admin</a></li>
                <li><a href="#/keranjang" class="footer-link">Keranjang Belanja</a></li>
              </ul>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 text-caption" style="padding-top:24px; color:#8FA4C2;">
            <span>© 2026 NEXORA Demo Platform. Seluruh konten & transaksi bersifat simulasi demonstrasi.</span>
            <span>Single Vendor Digital Commerce • Bahasa Indonesia (IDR)</span>
          </div>
        </div>
      </footer>
    `;
  }

  function renderDemoControlCenter() {
    const root = document.getElementById('demo-control-root');
    if (!root) return;
    const roleText = state.currentRole === 'admin'
      ? `Admin (${state.currentUser?.name || ''})`
      : state.currentRole === 'customer'
        ? `Pelanggan (${state.currentUser?.name || ''})`
        : 'Tamu Publik';

    root.innerHTML = `
      <div class="demo-fab-wrap no-print">
        ${ui.demoPanelOpen ? `
          <div class="demo-panel" role="dialog" aria-label="Mode Demo Control Center">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-bold text-sm">Demo Control Center</div>
                <div class="text-caption text-muted">Peran aktif: <strong>${escapeHtml(roleText)}</strong></div>
              </div>
              <button type="button" class="icon-btn" style="width:32px;height:32px;" id="close-demo-panel-btn" aria-label="Tutup panel demo">${icon('x', 16)}</button>
            </div>
            <div class="alert alert-warning mt-2" style="padding:8px 10px;font-size:11.5px;">
              ${icon('alert-circle', 15)}
              <span>MODE DEMO — Data simulasi, bukan transaksi nyata.</span>
            </div>
            <div class="demo-panel-grid">
              <button type="button" class="demo-action-btn" data-demo-action="public"><span>Buka Website Publik</span>${icon('globe', 14)}</button>
              <button type="button" class="demo-action-btn" data-demo-action="login-customer"><span>Masuk sebagai Pelanggan</span>${icon('user', 14)}</button>
              <button type="button" class="demo-action-btn" data-demo-action="login-admin"><span>Masuk sebagai Admin</span>${icon('shield', 14)}</button>
              <button type="button" class="demo-action-btn" data-demo-action="sim-product"><span>Simulasikan Produk Digital</span>${icon('layers', 14)}</button>
              <button type="button" class="demo-action-btn" data-demo-action="sim-service"><span>Simulasikan Jasa Paket Tetap</span>${icon('briefcase', 14)}</button>
              <button type="button" class="demo-action-btn" data-demo-action="sim-custom"><span>Simulasikan Jasa Custom</span>${icon('sliders', 14)}</button>
              <button type="button" class="demo-action-btn" data-demo-action="sim-training"><span>Simulasikan Pendaftaran Pelatihan</span>${icon('graduation-cap', 14)}</button>
              <button type="button" class="demo-action-btn" data-demo-action="sim-rejected"><span>Simulasikan Pembayaran Ditolak</span>${icon('alert-circle', 14)}</button>
              <button type="button" class="demo-action-btn text-danger" data-demo-action="reset"><span>Reset Data Demo</span>${icon('refresh', 14)}</button>
            </div>
          </div>
        ` : ''}
        <button type="button" class="demo-fab" id="toggle-demo-panel-btn" aria-expanded="${ui.demoPanelOpen ? 'true' : 'false'}">
          ${icon('zap', 15)}
          <span>Mode Demo</span>
        </button>
      </div>
    `;
  }

  /* ------------------------------------------------------------------------
     09. HASH ROUTER
     ------------------------------------------------------------------------ */
  function parseRoute() {
    const raw = window.location.hash || '#/';
    const clean = raw.startsWith('#') ? raw.slice(1) : raw;
    const [pathPart, queryPart] = clean.split('?');
    const path = pathPart ? (pathPart.startsWith('/') ? pathPart : `/${pathPart}`) : '/';
    const params = new URLSearchParams(queryPart || '');
    return { path, params, segments: path.split('/').filter(Boolean) };
  }

  function navigate(hashUrl) {
    const target = hashUrl.startsWith('#') ? hashUrl : `#${hashUrl}`;
    if (window.location.hash === target) {
      renderApp();
    } else {
      window.location.hash = target;
    }
  }

  function renderShellOnly() {
    const route = parseRoute();
    if (!route.path.startsWith('/akun') && !route.path.startsWith('/admin')) {
      renderApp();
    } else {
      renderDemoControlCenter();
    }
  }

  function rerenderActiveViews() {
    renderApp(false);
    if (document.getElementById('cart-drawer-backdrop')) {
      openCartDrawer();
    }
  }

  /* ------------------------------------------------------------------------
     10. PUBLIC PAGES 01 – 10
     ------------------------------------------------------------------------ */
  function renderHomePage() {
    const activeProducts = state.products.filter((p) => p.status === 'active');
    const featuredProducts = activeProducts.filter((p) => p.featured).slice(0, 6);
    const showcaseServices = state.services.slice(0, 4);
    const upcomingSessions = state.trainingSessions.slice(0, 3).map((ses) => ({
      ses,
      prog: state.trainingPrograms.find((p) => p.id === ses.programId)
    })).filter((x) => x.prog);
    const samplePortfolios = state.portfolios.slice(0, 3);
    const latestArticles = state.articles.filter((a) => a.status === 'published').slice(0, 3);

    const heroProdA = activeProducts[0];
    const heroProdB = activeProducts[2];

    return `
      <!-- 01. HERO SECTION -->
      <section class="hero-section">
        <div class="container">
          <div class="hero-grid">
            <div class="hero-copy">
              <span class="section-eyebrow">${icon('sparkles', 14)} ${escapeHtml(state.settings.positioning)}</span>
              <h1 class="text-display">Solusi Digital untuk Ide yang Lebih Besar.</h1>
              <p class="hero-subtitle">
                Temukan produk digital, layanan kreatif, dan pelatihan yang membantu Anda belajar, berkarya, dan berkembang.
              </p>
              <div class="hero-actions">
                <a href="#/produk" class="btn btn-primary btn-lg">
                  ${icon('layers', 18)} Jelajahi Produk
                </a>
                <a href="#/pelatihan" class="btn btn-secondary btn-lg">
                  ${icon('graduation-cap', 18)} Lihat Pelatihan
                </a>
              </div>
              <div class="hero-metrics">
                <div class="hero-metric-item">
                  <strong>${activeProducts.length}+ Produk</strong>
                  <span>E-Book, Template & Lisensi (Contoh)</span>
                </div>
                <div class="hero-metric-item">
                  <strong>${state.services.length} Unit Jasa</strong>
                  <span>Paket Tetap & Custom</span>
                </div>
                <div class="hero-metric-item">
                  <strong>${state.trainingPrograms.length} Program</strong>
                  <span>Online, Cisarua & Bekasi</span>
                </div>
              </div>
            </div>

            <div class="hero-visual">
              <div class="floating-card top-right">
                <div class="mega-icon" style="background:var(--success-light);color:var(--success);">${icon('check-circle', 20)}</div>
                <div>
                  <div class="text-caption font-bold">Akses Terverifikasi</div>
                  <div class="text-caption text-muted">Unduhan & proyek terintegrasi</div>
                </div>
              </div>

              <div class="hero-laptop">
                <div class="laptop-topbar">
                  <div class="laptop-dots"><span></span><span></span><span></span></div>
                  <span class="text-caption font-semibold text-muted">nexora.demo / ekosistem</span>
                  <span class="badge badge-primary">Live Demo</span>
                </div>
                <div class="laptop-screen">
                  <div class="flex items-center justify-between gap-2">
                    <div>
                      <div class="text-caption text-muted font-semibold">Single Vendor Digital Commerce</div>
                      <div class="font-bold text-h4">Ekosistem Kerja & Belajar Terpadu</div>
                    </div>
                    <a href="#/jasa/custom" class="btn btn-outline btn-sm">Penawaran Custom</a>
                  </div>
                  <div class="laptop-mini-grid">
                    ${heroProdA ? `
                      <div class="laptop-mini-card">
                        <span class="badge badge-primary">${escapeHtml(heroProdA.category)}</span>
                        <div class="font-bold text-sm mt-2">${escapeHtml(heroProdA.name)}</div>
                        <div class="text-caption text-muted mt-1">${escapeHtml(heroProdA.fileFormat)}</div>
                        <div class="font-bold text-primary-brand mt-2">${formatIDR(heroProdA.price)}</div>
                      </div>
                    ` : ''}
                    ${heroProdB ? `
                      <div class="laptop-mini-card">
                        <span class="badge badge-accent">${escapeHtml(heroProdB.category)}</span>
                        <div class="font-bold text-sm mt-2">${escapeHtml(heroProdB.name)}</div>
                        <div class="text-caption text-muted mt-1">${escapeHtml(heroProdB.fileFormat)}</div>
                        <div class="font-bold text-primary-brand mt-2">${formatIDR(heroProdB.price)}</div>
                      </div>
                    ` : ''}
                  </div>
                  <div class="card mt-3" style="padding:12px 14px;background:var(--surface);">
                    <div class="flex items-center justify-between text-caption mb-1">
                      <span class="font-bold">Progres Layanan & Akademi (Simulasi)</span>
                      <span class="text-primary-brand font-bold">Terhubung Real-time</span>
                    </div>
                    <div class="progress-track"><div class="progress-fill" style="width:76%;"></div></div>
                  </div>
                </div>
              </div>

              <div class="floating-card bottom-left">
                <div class="mega-icon">${icon('briefcase', 20)}</div>
                <div>
                  <div class="text-caption font-bold">Jasa Paket & Custom</div>
                  <div class="text-caption text-muted">Alur brief hingga revisi jelas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 02. TIGA KATEGORI BISNIS -->
      <section class="section reveal">
        <div class="container">
          <div class="section-header centered">
            <span class="section-eyebrow">Ekosistem Terpadu</span>
            <h2 class="text-h2">Tiga Pilar Layanan dalam Satu Akun</h2>
            <p class="text-body text-secondary">NEXORA dirancang sebagai platform Single Vendor agar Anda tidak perlu berpindah-pindah sistem saat membeli aset digital, memesan jasa kreatif, atau mengikuti pelatihan.</p>
          </div>
          <div class="bento-3">
            <div class="pillar-card card-hover">
              <div class="pillar-icon" style="background:var(--primary-light);color:var(--primary);">${icon('layers', 24)}</div>
              <h3 class="text-h4">Produk Digital</h3>
              <p class="text-sm text-secondary">E-book praktis, aplikasi & platform, paket konten digital, template siap sunting, serta distribusi Akun Pro resmi dan berizin.</p>
              <a href="#/produk" class="btn btn-outline btn-sm mt-auto" style="align-self:flex-start;">Jelajahi Produk ${icon('arrow-right', 14)}</a>
            </div>
            <div class="pillar-card card-hover">
              <div class="pillar-icon" style="background:var(--accent-light);color:var(--accent);">${icon('briefcase', 24)}</div>
              <h3 class="text-h4">Jasa Digital</h3>
              <p class="text-sm text-secondary">Pembuatan website, operator streaming Zoom, editing video, editing konten, desain kreatif, hingga layanan proyek custom.</p>
              <a href="#/jasa" class="btn btn-outline btn-sm mt-auto" style="align-self:flex-start;">Lihat Jasa & Paket ${icon('arrow-right', 14)}</a>
            </div>
            <div class="pillar-card card-hover">
              <div class="pillar-icon" style="background:var(--success-light);color:var(--success);">${icon('graduation-cap', 24)}</div>
              <h3 class="text-h4">Pelatihan & Akademi</h3>
              <p class="text-sm text-secondary">Pelatihan offline Cisarua & Bekasi, Pelatihan Barista, Pelatihan AI TQN, Webinar AI, dan Workshop Digital dengan manajemen kuota.</p>
              <a href="#/pelatihan" class="btn btn-outline btn-sm mt-auto" style="align-self:flex-start;">Lihat Jadwal Pelatihan ${icon('arrow-right', 14)}</a>
            </div>
          </div>
        </div>
      </section>

      <!-- 03. PRODUK DIGITAL UNGGULAN -->
      <section class="section section-surface reveal">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-eyebrow">Katalog Pilihan</span>
              <h2 class="text-h2">Produk Digital Unggulan</h2>
            </div>
            <a href="#/produk" class="btn btn-secondary">Semua Produk (${activeProducts.length}) ${icon('arrow-right', 15)}</a>
          </div>
          <div class="grid-3">
            ${featuredProducts.map((p) => renderProductCard(p)).join('')}
          </div>
        </div>
      </section>

      <!-- 04. KATEGORI PRODUK POPULER -->
      <section class="section reveal">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-eyebrow">Kategori Utama</span>
              <h2 class="text-h2">Kategori Produk Digital</h2>
            </div>
          </div>
          <div class="grid-3">
            ${state.categories.map((cat) => {
              const count = activeProducts.filter((p) => p.category === cat.name).length;
              return `
                <a href="#/produk?cat=${encodeURIComponent(cat.name)}" class="card card-hover card-body flex items-start gap-3">
                  <div class="mega-icon">${icon('folder', 20)}</div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-h4">${escapeHtml(cat.name)}</h3>
                      <span class="badge badge-neutral">${count} item</span>
                    </div>
                    <p class="text-sm text-secondary mt-1">${escapeHtml(cat.description)}</p>
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- 05. SHOWCASE JASA DIGITAL -->
      <section class="section section-surface reveal">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-eyebrow accent">Layanan Kreatif & Teknis</span>
              <h2 class="text-h2">Showcase Jasa Digital</h2>
              <p class="text-sm text-secondary mt-1">Pilih paket terstruktur (Basic, Professional, Premium) atau ajukan penawaran custom.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <a href="#/jasa/custom" class="btn btn-outline">Minta Penawaran Custom</a>
              <a href="#/jasa" class="btn btn-primary">Semua Jasa (${state.services.length})</a>
            </div>
          </div>
          <div class="grid-4">
            ${showcaseServices.map((s) => renderServiceCard(s)).join('')}
          </div>
        </div>
      </section>

      <!-- 06. PELATIHAN MENDATANG -->
      <section class="section reveal">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-eyebrow">Akademi NEXORA</span>
              <h2 class="text-h2">Pelatihan Mendatang</h2>
            </div>
            <a href="#/pelatihan" class="btn btn-secondary">Semua Program & Jadwal ${icon('arrow-right', 15)}</a>
          </div>
          <div class="grid-3">
            ${upcomingSessions.map(({ ses, prog }) => {
              const avail = getSessionAvailability(ses);
              return `
                <article class="card card-hover card-body flex" style="flex-direction:column;gap:12px;">
                  <div class="flex items-center justify-between gap-2">
                    <span class="badge badge-accent">${escapeHtml(ses.mode)}</span>
                    <span class="badge ${avail.isFull ? 'badge-danger' : 'badge-success'}">${avail.isFull ? 'Kuota Penuh' : `Tersedia ${avail.remaining} Kursi`}</span>
                  </div>
                  <h3 class="text-h4">${escapeHtml(prog.title)}</h3>
                  <div class="text-sm font-semibold text-primary-brand">${escapeHtml(ses.title)}</div>
                  <div class="text-caption text-secondary flex items-center gap-1">${icon('calendar', 14)} ${formatDate(ses.date)} • ${escapeHtml(ses.timeLabel)}</div>
                  <div class="text-caption text-secondary flex items-center gap-1">${icon('map-pin', 14)} ${escapeHtml(ses.location)}</div>
                  <div class="card-footer">
                    <span class="price-tag">${formatIDR(prog.price)}</span>
                    <a href="#/pelatihan/detail/${escapeHtml(prog.id)}" class="btn btn-primary btn-sm">Lihat Sesi</a>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- 07. KEUNGGULAN NEXORA -->
      <section class="section section-surface reveal">
        <div class="container">
          <div class="section-header centered">
            <span class="section-eyebrow">Mengapa NEXORA</span>
            <h2 class="text-h2">Dirancang untuk Kejelasan Proses</h2>
          </div>
          <div class="grid-4">
            ${[
              ['shield', 'Single Vendor Terkontrol', 'Seluruh produk, jasa, dan pelatihan dikelola terpusat dengan standar kualitas konsisten.'],
              ['file-text', 'Snapshot Harga & Invoice', 'Nilai transaksi terkunci saat checkout beserta nomor invoice unik dan bukti verifikasi.'],
              ['sliders', 'Alur Paket & Custom Terpisah', 'Pesan langsung paket tetap dengan ruang lingkup jelas atau ajukan penawaran custom bertahap.'],
              ['check-circle', 'Verifikasi Pembayaran Tertib', 'Persetujuan transfer manual diaudit oleh Admin sebelum hak unduh atau proyek diaktifkan.']
            ].map(([ic, title, desc]) => `
              <div class="card card-body">
                <div class="mega-icon mb-3">${icon(ic, 20)}</div>
                <h3 class="text-h4">${title}</h3>
                <p class="text-sm text-secondary mt-2">${desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 08. PORTOFOLIO CONTOH -->
      <section class="section reveal">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-eyebrow">Studi Kasus Demonstrasi</span>
              <h2 class="text-h2">Portofolio Contoh</h2>
            </div>
            <a href="#/portofolio" class="btn btn-secondary">Lihat Semua Portofolio ${icon('arrow-right', 15)}</a>
          </div>
          <div class="grid-3">
            ${samplePortfolios.map((pt) => `
              <article class="card card-hover catalog-card">
                <a href="#/portofolio/detail/${escapeHtml(pt.id)}" class="card-thumb">
                  <img src="${pt.thumbnail}" alt="${escapeHtml(pt.title)}">
                  <div class="card-thumb-badge"><span class="badge badge-neutral">${escapeHtml(pt.category)}</span></div>
                </a>
                <div class="card-content">
                  <div class="text-caption text-muted">${escapeHtml(pt.client)}</div>
                  <a href="#/portofolio/detail/${escapeHtml(pt.id)}" class="card-title">${escapeHtml(pt.title)}</a>
                  <p class="card-desc">${escapeHtml(pt.summary)}</p>
                  <div class="card-footer">
                    <a href="#/portofolio/detail/${escapeHtml(pt.id)}" class="btn btn-ghost btn-sm text-primary-brand">Lihat Studi Kasus ${icon('arrow-right', 14)}</a>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 09. CARA KERJA NEXORA -->
      <section class="section section-surface reveal">
        <div class="container">
          <div class="section-header centered">
            <span class="section-eyebrow">Alur Simulasi</span>
            <h2 class="text-h2">Cara Kerja NEXORA</h2>
          </div>
          <div class="grid-4">
            ${[
              ['01', 'Pilih Produk, Jasa, atau Pelatihan', 'Telusuri katalog lengkap, bandingkan paket, atau cek ketersediaan kuota sesi.'],
              ['02', 'Checkout & Terima Invoice', 'Lengkapi data pemesanan dan dapatkan invoice unik dengan rincian harga terkunci.'],
              ['03', 'Unggah Bukti Transfer Demo', 'Lakukan simulasi transfer manual ke rekening demo dan unggah bukti untuk ditinjau.'],
              ['04', 'Verifikasi Admin & Akses Aktif', 'Setelah disetujui Admin, unduhan digital terbuka, proyek berjalan, atau kursi terkonfirmasi.']
            ].map(([step, title, desc]) => `
              <div class="card card-body">
                <span class="badge badge-primary">Langkah ${step}</span>
                <h3 class="text-h4 mt-3">${title}</h3>
                <p class="text-sm text-secondary mt-2">${desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 10. ARTIKEL TERBARU -->
      <section class="section reveal">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-eyebrow">Insight & Panduan</span>
              <h2 class="text-h2">Artikel Terbaru</h2>
            </div>
            <a href="#/artikel" class="btn btn-secondary">Semua Artikel (${state.articles.length}) ${icon('arrow-right', 15)}</a>
          </div>
          <div class="grid-3">
            ${latestArticles.map((a) => renderArticleCard(a)).join('')}
          </div>
        </div>
      </section>

      <!-- 11. FAQ SINGKAT -->
      <section class="section section-surface reveal">
        <div class="container" style="max-width:860px;">
          <div class="section-header centered">
            <span class="section-eyebrow">Pertanyaan Umum</span>
            <h2 class="text-h2">FAQ Singkat</h2>
          </div>
          ${renderAccordionList([
            { q: 'Apakah website ini memproses pembayaran nyata?', a: 'Tidak. Seluruh transaksi, rekening bank, unggah bukti, dan verifikasi pembayaran pada website ini adalah simulasi demonstrasi berbasis browser (LocalStorage).' },
            { q: 'Mengapa produk tidak langsung terbuka setelah mengunggah bukti bayar?', a: 'Sesuai aturan bisnis NEXORA, unggah bukti hanya mengubah status menjadi Menunggu Verifikasi. Persetujuan harus dilakukan melalui Dashboard Admin.' },
            { q: 'Apa perbedaan Jasa Paket Tetap dan Penawaran Custom?', a: 'Jasa Paket Tetap memiliki harga, estimasi waktu, dan batas revisi standar (Basic/Professional/Premium). Penawaran Custom dimulai dari formulir kebutuhan lalu Admin mengirimkan penawaran harga khusus.' },
            { q: 'Bagaimana cara menguji peran Pelanggan dan Admin dengan cepat?', a: 'Gunakan tombol mengambang "Mode Demo" di pojok kiri bawah atau masuk melalui halaman Masuk dengan tombol masuk cepat.' }
          ], 'home-faq')}
        </div>
      </section>

      <!-- 12. NEWSLETTER DEMO -->
      <section class="section reveal">
        <div class="container">
          <div class="card card-lg" style="background:linear-gradient(135deg, var(--surface) 0%, var(--primary-light) 100%);padding:36px;">
            <div class="grid-2 items-center">
              <div>
                <span class="badge badge-primary">Newsletter Demo</span>
                <h2 class="text-h2 mt-2">Dapatkan Pembaruan Produk & Jadwal Pelatihan</h2>
                <p class="text-body text-secondary mt-2">Simulasi pendaftaran newsletter akan tersimpan di modul Marketing & Content pada Dashboard Admin.</p>
              </div>
              <form id="home-newsletter-form" class="flex flex-wrap gap-2">
                <input type="email" id="home-newsletter-email" class="form-control" style="flex:1;min-width:220px;" placeholder="Masukkan email Anda (contoh@domain.com)" required>
                <button type="submit" class="btn btn-primary">Berlangganan Demo</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- 13. FINAL CTA -->
      <section class="section-sm reveal" style="padding-top:0;">
        <div class="container">
          <div class="card" style="background:var(--text-primary);color:#fff;padding:44px 32px;text-align:center;border:none;">
            <h2 class="text-h2" style="color:#fff;">Siap Menjelajahi Ekosistem NEXORA?</h2>
            <p class="text-body mt-2" style="color:#C2D0E3;max-width:620px;margin-inline:auto;">
              Coba simulasi pembelian produk digital, pemesanan jasa, pendaftaran pelatihan, hingga verifikasi di Dashboard Admin.
            </p>
            <div class="flex flex-wrap justify-center gap-3 mt-4">
              <a href="#/produk" class="btn btn-primary btn-lg">Mulai dari Katalog Produk</a>
              <a href="#/masuk" class="btn btn-secondary btn-lg">Masuk ke Dashboard Demo</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderAccordionList(items, groupId) {
    return items.map((item, idx) => `
      <div class="accordion-item ${idx === 0 ? 'open' : ''}" data-accordion-item>
        <button type="button" class="accordion-trigger" aria-expanded="${idx === 0 ? 'true' : 'false'}" data-accordion-trigger>
          <span>${escapeHtml(item.q)}</span>
          <span class="accordion-chevron">${icon('chevron-down', 18)}</span>
        </button>
        <div class="accordion-content" id="${escapeHtml(groupId)}-${idx}">${escapeHtml(item.a)}</div>
      </div>
    `).join('');
  }

  /* ---- PAGE 02: Katalog Produk Digital ---- */
  function renderProductsCatalogPage(route) {
    const qCat = route.params.get('cat');
    if (qCat && ui.catalog.category !== qCat) {
      ui.catalog.category = qCat;
      ui.catalog.page = 1;
    }

    const activeProducts = state.products.filter((p) => p.status === 'active');
    let filtered = activeProducts.filter((p) => {
      const q = ui.catalog.search.trim().toLowerCase();
      if (q && !(p.name.toLowerCase().includes(q) || p.shortDesc.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))) {
        return false;
      }
      if (ui.catalog.category !== 'all' && p.category !== ui.catalog.category) return false;
      if (ui.catalog.minPrice !== '' && p.price < Number(ui.catalog.minPrice)) return false;
      if (ui.catalog.maxPrice !== '' && p.price > Number(ui.catalog.maxPrice)) return false;
      return true;
    });

    if (ui.catalog.sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (ui.catalog.sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (ui.catalog.sort === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    const perPage = 6;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const page = Math.min(ui.catalog.page, totalPages);
    const paged = filtered.slice((page - 1) * perPage, page * perPage);
    const related = activeProducts.filter((p) => p.featured).slice(0, 3);

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Produk Digital' }])}
          <div class="section-header" style="margin-bottom:24px;">
            <div>
              <h1 class="text-h1">Katalog Produk Digital</h1>
              <p class="text-body text-secondary mt-1">E-book, aplikasi, konten digital, template siap pakai, dan akun pro resmi berizin.</p>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" class="icon-btn ${ui.catalog.view === 'grid' ? 'btn-primary' : ''}" data-catalog-view="grid" aria-label="Tampilan Grid">${icon('grid', 17)}</button>
              <button type="button" class="icon-btn ${ui.catalog.view === 'list' ? 'btn-primary' : ''}" data-catalog-view="list" aria-label="Tampilan List">${icon('list', 17)}</button>
            </div>
          </div>

          <div class="catalog-layout">
            <aside class="filter-sidebar" aria-label="Filter Produk">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-h4 flex items-center gap-2">${icon('filter', 17)} Filter</h2>
                <button type="button" class="btn btn-ghost btn-sm" id="reset-product-filters">Reset</button>
              </div>
              <div class="form-group">
                <label class="form-label" for="cat-search-input">Cari Produk</label>
                <input type="search" id="cat-search-input" class="form-control" placeholder="Nama atau kata kunci..." value="${escapeHtml(ui.catalog.search)}">
              </div>
              <div class="form-group">
                <label class="form-label" for="cat-category-select">Kategori</label>
                <select id="cat-category-select" class="form-select">
                  <option value="all">Semua Kategori</option>
                  ${state.categories.map((c) => `<option value="${escapeHtml(c.name)}" ${ui.catalog.category === c.name ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Rentang Harga (IDR)</label>
                <div class="grid-2" style="gap:8px;">
                  <input type="number" id="cat-min-price" class="form-control" placeholder="Min" value="${escapeHtml(ui.catalog.minPrice)}">
                  <input type="number" id="cat-max-price" class="form-control" placeholder="Maks" value="${escapeHtml(ui.catalog.maxPrice)}">
                </div>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="cat-sort-select">Urutkan</label>
                <select id="cat-sort-select" class="form-select">
                  <option value="popular" ${ui.catalog.sort === 'popular' ? 'selected' : ''}>Paling Populer</option>
                  <option value="newest" ${ui.catalog.sort === 'newest' ? 'selected' : ''}>Terbaru</option>
                  <option value="price-asc" ${ui.catalog.sort === 'price-asc' ? 'selected' : ''}>Harga Terendah</option>
                  <option value="price-desc" ${ui.catalog.sort === 'price-desc' ? 'selected' : ''}>Harga Tertinggi</option>
                </select>
              </div>
            </aside>

            <div>
              <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div class="text-sm text-secondary">Menampilkan <strong>${filtered.length}</strong> produk digital aktif</div>
                <div class="text-caption text-muted">Halaman ${page} dari ${totalPages}</div>
              </div>

              ${paged.length === 0 ? `
                <div class="state-box">
                  <div class="state-icon">${icon('search', 24)}</div>
                  <h3 class="text-h4">Produk tidak ditemukan</h3>
                  <p class="text-sm text-secondary mt-1 mb-3">Tidak ada produk yang cocok dengan filter atau kata kunci Anda.</p>
                  <button type="button" class="btn btn-primary btn-sm" id="empty-reset-product-filters">Tampilkan Semua Produk</button>
                </div>
              ` : `
                <div class="${ui.catalog.view === 'list' ? 'grid' : 'grid-2'}">
                  ${paged.map((p) => renderProductCard(p, ui.catalog.view === 'list')).join('')}
                </div>
                ${renderPagination(page, totalPages, 'data-catalog-page')}
              `}

              <div class="mt-6 pt-4" style="padding-top:32px;border-top:1px solid var(--border);">
                <h3 class="text-h3 mb-3">Produk Rekomendasi Lainnya</h3>
                <div class="grid-3">${related.map((p) => renderProductCard(p)).join('')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /* ---- PAGE 03: Detail Produk Digital ---- */
  function renderProductDetailPage(id) {
    const prod = state.products.find((p) => p.id === id);
    if (!prod) return render404Page();
    const archived = prod.status !== 'active';
    const related = state.products.filter((p) => p.status === 'active' && p.id !== prod.id && (p.category === prod.category || p.featured)).slice(0, 3);

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([
            { label: 'Produk Digital', href: '#/produk' },
            { label: prod.name }
          ])}

          ${archived ? `
            <div class="alert alert-danger mb-4">
              ${icon('alert-circle', 18)}
              <div><strong>Produk Diarsipkan:</strong> Produk ini tidak lagi dijual untuk transaksi baru, namun riwayat transaksi lama tetap tersimpan aman.</div>
            </div>
          ` : ''}

          <div class="detail-layout">
            <div>
              <div class="card mb-4">
                <img id="prod-main-img" src="${prod.gallery[0] || prod.thumbnail}" alt="${escapeHtml(prod.name)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;">
                <div class="flex flex-wrap items-center justify-between gap-2" style="padding:12px 16px;background:var(--surface);border-top:1px solid var(--border);">
                  <div class="flex gap-2">
                    ${prod.gallery.map((g, i) => `
                      <button type="button" class="btn btn-secondary btn-sm" data-gallery-thumb="${escapeHtml(g)}">Slide ${i + 1}</button>
                    `).join('')}
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" id="open-product-preview-btn">
                    ${icon('eye', 15)} Preview Produk
                  </button>
                </div>
              </div>

              <div class="card card-body mb-4">
                <h2 class="text-h3 mb-2">Deskripsi Produk</h2>
                <p class="text-body text-secondary">${escapeHtml(prod.description)}</p>
                <h3 class="text-h4 mt-4 mb-2">Keunggulan Utama</h3>
                <ul style="display:flex;flex-direction:column;gap:8px;">
                  ${prod.advantages.map((adv) => `<li class="flex items-start gap-2 text-sm text-secondary"><span class="text-success" style="margin-top:2px;">${icon('check-circle', 16)}</span><span>${escapeHtml(adv)}</span></li>`).join('')}
                </ul>
                <h3 class="text-h4 mt-4 mb-2">Isi Paket Produk</h3>
                <ul style="display:flex;flex-direction:column;gap:8px;">
                  ${prod.contents.map((c) => `<li class="flex items-start gap-2 text-sm text-secondary"><span class="text-primary-brand" style="margin-top:2px;">${icon('file-text', 16)}</span><span>${escapeHtml(c)}</span></li>`).join('')}
                </ul>
              </div>

              <div class="card card-body">
                <h3 class="text-h3 mb-3">Pertanyaan Seputar Produk</h3>
                ${renderAccordionList(prod.faqs, 'prod-faq')}
              </div>
            </div>

            <aside class="sticky-panel">
              <div class="card card-lg card-body">
                <div class="flex items-center justify-between gap-2">
                  <span class="badge badge-primary">${escapeHtml(prod.category)}</span>
                  ${prod.allowMultiUnit ? `<span class="badge badge-accent">Mendukung Multi-Unit</span>` : ''}
                </div>
                <h1 class="text-h2 mt-2">${escapeHtml(prod.name)}</h1>
                <div class="text-h2 text-primary-brand mt-3 tabular-nums">${formatIDR(prod.price)}</div>
                <p class="text-sm text-secondary mt-2">${escapeHtml(prod.shortDesc)}</p>

                <div class="card mt-4" style="padding:14px;background:var(--surface);">
                  <div class="flex justify-between text-sm mb-2"><span class="text-muted">Format File</span><strong>${escapeHtml(prod.fileFormat)}</strong></div>
                  <div class="flex justify-between text-sm mb-2"><span class="text-muted">Ukuran File</span><strong>${escapeHtml(prod.fileSize)}</strong></div>
                  <div class="flex justify-between text-sm"><span class="text-muted">Status Produk</span><span class="badge ${archived ? 'badge-danger' : 'badge-success'}">${archived ? 'Diarsipkan' : 'Tersedia'}</span></div>
                </div>

                <div class="mt-4" style="display:flex;flex-direction:column;gap:10px;">
                  <button type="button" class="btn btn-primary btn-lg w-full" data-buy-now="${escapeHtml(prod.id)}" ${archived ? 'disabled' : ''}>
                    ${icon('zap', 17)} Beli Sekarang
                  </button>
                  <button type="button" class="btn btn-outline btn-lg w-full" data-add-cart="${escapeHtml(prod.id)}" ${archived ? 'disabled' : ''}>
                    ${icon('shopping-bag', 17)} Tambah ke Keranjang
                  </button>
                </div>

                <div class="alert alert-info mt-4">
                  ${icon('shield', 18)}
                  <div class="text-caption"><strong>Ketentuan Lisensi:</strong> ${escapeHtml(prod.licenseTerms)}</div>
                </div>
              </div>
            </aside>
          </div>

          <div class="mt-6">
            <h2 class="text-h3 mb-3">Produk Terkait</h2>
            <div class="grid-3">${related.map((p) => renderProductCard(p)).join('')}</div>
          </div>
        </div>
      </section>
    `;
  }

  /* ---- PAGE 04: Katalog Jasa Digital ---- */
  function renderServicesCatalogPage() {
    const categories = ['all', ...Array.from(new Set(state.services.map((s) => s.category)))];
    let filtered = state.services.filter((s) => {
      const q = ui.servicesFilter.search.trim().toLowerCase();
      if (q && !(s.name.toLowerCase().includes(q) || s.shortDesc.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))) {
        return false;
      }
      if (ui.servicesFilter.category !== 'all' && s.category !== ui.servicesFilter.category) return false;
      return true;
    });

    if (ui.servicesFilter.sort === 'price-asc') filtered.sort((a, b) => a.startingPrice - b.startingPrice);
    else if (ui.servicesFilter.sort === 'price-desc') filtered.sort((a, b) => b.startingPrice - a.startingPrice);

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Jasa Digital' }])}
          <div class="section-header">
            <div>
              <h1 class="text-h1">Katalog Jasa Digital</h1>
              <p class="text-body text-secondary mt-1">Pilih paket layanan terstruktur atau ajukan permintaan proyek custom sesuai kebutuhan Anda.</p>
            </div>
            <a href="#/jasa/custom" class="btn btn-primary">${icon('sliders', 16)} Minta Penawaran Custom</a>
          </div>

          <div class="card card-body mb-4">
            <div class="grid-3" style="gap:14px;">
              <input type="search" id="srv-search-input" class="form-control" placeholder="Cari jasa (website, video, Zoom, desain...)" value="${escapeHtml(ui.servicesFilter.search)}">
              <select id="srv-category-select" class="form-select">
                ${categories.map((c) => `<option value="${escapeHtml(c)}" ${ui.servicesFilter.category === c ? 'selected' : ''}>${c === 'all' ? 'Semua Kategori Jasa' : escapeHtml(c)}</option>`).join('')}
              </select>
              <select id="srv-sort-select" class="form-select">
                <option value="popular" ${ui.servicesFilter.sort === 'popular' ? 'selected' : ''}>Urutan Default</option>
                <option value="price-asc" ${ui.servicesFilter.sort === 'price-asc' ? 'selected' : ''}>Harga Mulai Terendah</option>
                <option value="price-desc" ${ui.servicesFilter.sort === 'price-desc' ? 'selected' : ''}>Harga Mulai Tertinggi</option>
              </select>
            </div>
          </div>

          ${filtered.length === 0 ? `
            <div class="state-box">
              <div class="state-icon">${icon('briefcase', 24)}</div>
              <h3 class="text-h4">Jasa tidak ditemukan</h3>
              <p class="text-sm text-secondary mt-1">Ubah kata kunci pencarian atau pilih kategori lain.</p>
            </div>
          ` : `
            <div class="grid-3">${filtered.map((s) => renderServiceCard(s)).join('')}</div>
          `}
        </div>
      </section>
    `;
  }

  /* ---- PAGE 05: Detail Jasa Digital ---- */
  function renderServiceDetailPage(id) {
    const srv = state.services.find((s) => s.id === id);
    if (!srv) return render404Page();
    const pkgs = state.servicePackages.filter((p) => p.serviceId === srv.id && p.status === 'active');
    const relatedPortfolios = state.portfolios.slice(0, 2);

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Jasa Digital', href: '#/jasa' }, { label: srv.name }])}

          <div class="card card-lg mb-4">
            <div class="grid-2 items-center" style="padding:28px;">
              <div>
                <span class="badge badge-primary">${escapeHtml(srv.category)}</span>
                <h1 class="text-h1 mt-2">${escapeHtml(srv.name)}</h1>
                <p class="text-body text-secondary mt-2">${escapeHtml(srv.description)}</p>
                <div class="flex flex-wrap gap-4 mt-4 text-sm">
                  <span class="flex items-center gap-1 font-semibold">${icon('clock', 16)} Estimasi: ${escapeHtml(srv.estimateLabel)}</span>
                  <span class="flex items-center gap-1 font-semibold text-primary-brand">${icon('tag', 16)} Mulai ${formatIDR(srv.startingPrice)}</span>
                </div>
                <div class="flex flex-wrap gap-3 mt-4">
                  <a href="#/jasa/pesan/${escapeHtml(pkgs[1]?.id || pkgs[0]?.id || '')}" class="btn btn-primary">${icon('check-circle', 16)} Pilih Paket Populer</a>
                  <a href="#/jasa/custom?service=${encodeURIComponent(srv.name)}" class="btn btn-outline">${icon('sliders', 16)} Minta Penawaran Custom</a>
                </div>
              </div>
              <div>
                <img src="${srv.thumbnail}" alt="${escapeHtml(srv.name)}" style="border-radius:var(--radius-md);border:1px solid var(--border);width:100%;">
              </div>
            </div>
          </div>

          <div class="grid-2 mb-4">
            <div class="card card-body">
              <h2 class="text-h4 mb-2">Ruang Lingkup Pekerjaan</h2>
              <ul style="display:flex;flex-direction:column;gap:8px;">
                ${srv.scope.map((sc) => `<li class="flex items-start gap-2 text-sm text-secondary"><span class="text-primary-brand">${icon('check', 16)}</span><span>${escapeHtml(sc)}</span></li>`).join('')}
              </ul>
            </div>
            <div class="card card-body">
              <h2 class="text-h4 mb-2">Deliverable & Ketentuan Layanan</h2>
              <ul style="display:flex;flex-direction:column;gap:8px;">
                ${srv.deliverables.map((d) => `<li class="flex items-start gap-2 text-sm text-secondary"><span class="text-success">${icon('check-circle', 16)}</span><span>${escapeHtml(d)}</span></li>`).join('')}
              </ul>
              <p class="text-caption text-muted mt-3">${escapeHtml(srv.terms)}</p>
            </div>
          </div>

          <h2 class="text-h2 mt-6 mb-3">Pilihan Paket (Basic, Professional, Premium)</h2>
          <div class="grid-3 mb-4">
            ${pkgs.map((pk) => `
              <div class="card card-body flex" style="flex-direction:column;gap:12px;${pk.tier === 'Professional' ? 'border-color:var(--primary);box-shadow:var(--shadow-md);' : ''}">
                <div class="flex items-center justify-between">
                  <span class="badge ${pk.tier === 'Professional' ? 'badge-primary' : 'badge-neutral'}">Paket ${escapeHtml(pk.tier)}</span>
                  <span class="text-caption font-semibold">${pk.revisions}x Revisi</span>
                </div>
                <div class="text-h2 tabular-nums">${formatIDR(pk.price)}</div>
                <p class="text-sm text-secondary">${escapeHtml(pk.summary)}</p>
                <ul style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
                  ${pk.features.map((f) => `<li class="flex items-start gap-2 text-sm"><span class="text-success">${icon('check', 15)}</span><span>${escapeHtml(f)}</span></li>`).join('')}
                </ul>
                <a href="#/jasa/pesan/${escapeHtml(pk.id)}" class="btn ${pk.tier === 'Professional' ? 'btn-primary' : 'btn-outline'} w-full mt-auto">
                  Pilih Paket ${escapeHtml(pk.tier)}
                </a>
              </div>
            `).join('')}
          </div>

          <h3 class="text-h3 mt-6 mb-3">Perbandingan Paket</h3>
          <div class="table-responsive mb-4">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Aspek</th>
                  ${pkgs.map((pk) => `<th>${escapeHtml(pk.tier)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Harga Paket</strong></td>${pkgs.map((pk) => `<td class="font-bold text-primary-brand">${formatIDR(pk.price)}</td>`).join('')}</tr>
                <tr><td><strong>Estimasi Pengerjaan</strong></td>${pkgs.map((pk) => `<td>${pk.estimatedDays} hari kerja</td>`).join('')}</tr>
                <tr><td><strong>Batas Revisi</strong></td>${pkgs.map((pk) => `<td>${pk.revisions}x putaran revisi</td>`).join('')}</tr>
                <tr><td><strong>Konsultasi Brief</strong></td>${pkgs.map(() => `<td>Tersedia</td>`).join('')}</tr>
              </tbody>
            </table>
          </div>

          <div class="grid-2 mt-6">
            <div class="card card-body">
              <h3 class="text-h4 mb-3">Portofolio Contoh Terkait</h3>
              <div style="display:flex;flex-direction:column;gap:12px;">
                ${relatedPortfolios.map((pt) => `
                  <a href="#/portofolio/detail/${escapeHtml(pt.id)}" class="flex items-center gap-3 p-2" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;">
                    <img src="${pt.thumbnail}" alt="${escapeHtml(pt.title)}" style="width:84px;height:56px;object-fit:cover;border-radius:6px;">
                    <div>
                      <div class="font-bold text-sm">${escapeHtml(pt.title)}</div>
                      <div class="text-caption text-muted">${escapeHtml(pt.category)} • ${escapeHtml(pt.client)}</div>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>
            <div class="card card-body">
              <h3 class="text-h4 mb-3">FAQ Layanan</h3>
              ${renderAccordionList(srv.faqs, 'srv-faq')}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /* ---- PAGE 06: Pemesanan Paket Jasa ---- */
  function renderServicePackageOrderPage(packageId) {
    const pkg = state.servicePackages.find((p) => p.id === packageId);
    if (!pkg) return render404Page();
    const srv = state.services.find((s) => s.id === pkg.serviceId);
    const cust = state.currentRole === 'customer' && state.currentUser ? state.currentUser : null;

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([
            { label: 'Jasa Digital', href: '#/jasa' },
            { label: srv ? srv.name : 'Detail', href: `#/jasa/detail/${pkg.serviceId}` },
            { label: `Pesan Paket ${pkg.tier}` }
          ])}
          <h1 class="text-h1 mb-4">Pemesanan Paket Jasa</h1>

          <div class="detail-layout">
            <form id="service-package-order-form" class="card card-lg card-body" data-package-id="${escapeHtml(pkg.id)}">
              <h2 class="text-h3 mb-3">Detail Brief Proyek</h2>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="sp-name">Nama Pelanggan *</label>
                  <input type="text" id="sp-name" class="form-control" required value="${escapeHtml(cust ? cust.name : 'Raka Pratama')}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="sp-email">Email Kontak *</label>
                  <input type="email" id="sp-email" class="form-control" required value="${escapeHtml(cust ? cust.email : 'pelanggan@example.com')}">
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="sp-phone">Nomor Telepon / WhatsApp *</label>
                  <input type="text" id="sp-phone" class="form-control" required value="${escapeHtml(cust ? cust.phone : '0812-3456-7890')}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="sp-target">Target Waktu Selesai</label>
                  <input type="date" id="sp-target" class="form-control" value="${new Date(Date.now() + pkg.estimatedDays * 86400 * 1000).toISOString().slice(0, 10)}">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="sp-title">Nama Proyek *</label>
                <input type="text" id="sp-title" class="form-control" required placeholder="Contoh: Website Profil Usaha Nusantara" value="${escapeHtml(ui.prefillServiceBrief?.projectTitle || '')}">
              </div>
              <div class="form-group">
                <label class="form-label" for="sp-brief">Brief Proyek & Tujuan *</label>
                <textarea id="sp-brief" class="form-textarea" rows="4" required placeholder="Jelaskan gambaran proyek, target audiens, serta referensi gaya yang diinginkan...">${escapeHtml(ui.prefillServiceBrief?.brief || '')}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="sp-req">Kebutuhan Tambahan / Catatan</label>
                <textarea id="sp-req" class="form-textarea" rows="2" placeholder="Contoh: Butuh integrasi form kontak dan halaman FAQ">${escapeHtml(ui.prefillServiceBrief?.requirements || '')}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="sp-file">Lampiran Brief Opsional (Simulasi)</label>
                <input type="file" id="sp-file" class="form-control">
                <span class="form-hint">Nama file lampiran akan dicatat pada brief proyek.</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="sp-coupon">Kode Promo Simulasi (Opsional)</label>
                <input type="text" id="sp-coupon" class="form-control" placeholder="Contoh: KREATIF100K atau NEXORA10">
              </div>
              <label class="checkbox-row mb-4">
                <input type="checkbox" id="sp-agree" required checked>
                <span>Saya menyetujui ketentuan layanan paket (${pkg.revisions}x revisi) dan memahami bahwa ini adalah simulasi pemesanan.</span>
              </label>
              <button type="submit" class="btn btn-primary btn-lg w-full">Konfirmasi Pemesanan & Buat Invoice</button>
            </form>

            <aside class="sticky-panel">
              <div class="card card-lg card-body">
                <span class="badge badge-primary">Paket ${escapeHtml(pkg.tier)}</span>
                <h3 class="text-h4 mt-2">${escapeHtml(pkg.name)}</h3>
                <p class="text-sm text-secondary mt-1">${escapeHtml(pkg.summary)}</p>
                <hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">
                <div class="flex justify-between text-sm mb-2"><span class="text-muted">Estimasi</span><strong>${pkg.estimatedDays} hari kerja</strong></div>
                <div class="flex justify-between text-sm mb-2"><span class="text-muted">Batas Revisi</span><strong>${pkg.revisions}x putaran</strong></div>
                <div class="flex justify-between text-h4 mt-3"><span>Total Biaya</span><strong class="text-primary-brand">${formatIDR(pkg.price)}</strong></div>
                <div class="alert alert-info mt-4 text-caption">
                  ${icon('info', 16)}
                  <span>Setelah konfirmasi, invoice diterbitkan dan proyek masuk antrean setelah pembayaran diverifikasi Admin.</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    `;
  }

  /* ---- PAGE 07: Permintaan Penawaran Custom ---- */
  function renderCustomRequestPage(route) {
    const qSrv = route.params.get('service');
    if (qSrv) ui.customWizardData.serviceType = qSrv;
    const step = ui.customWizardStep;
    const d = ui.customWizardData;
    const cust = state.currentRole === 'customer' && state.currentUser ? state.currentUser : null;
    if (cust && !d.contactName) {
      d.contactName = cust.name;
      d.contactEmail = cust.email;
      d.contactPhone = cust.phone;
    }

    const needOptions = ['Desain UI/UX Khusus', 'Integrasi Katalog / Form', 'Produksi Konten Visual', 'Operator Streaming', 'Pelatihan Tim Internal'];

    return `
      <section class="section-sm">
        <div class="container" style="max-width:860px;">
          ${renderBreadcrumbs([{ label: 'Jasa Digital', href: '#/jasa' }, { label: 'Permintaan Penawaran Custom' }])}
          <h1 class="text-h1 mb-2">Permintaan Penawaran Custom</h1>
          <p class="text-body text-secondary mb-4">Alur berbeda dari paket tetap: sampaikan kebutuhan spesifik Anda, lalu Admin akan menyusun penawaran resmi untuk Anda setujui.</p>

          <div class="card card-body mb-4">
            <div class="grid-4" style="gap:10px;">
              ${[
                [1, '1. Jenis & Kebutuhan'],
                [2, '2. Deskripsi & Anggaran'],
                [3, '3. Kontak & Lampiran'],
                [4, '4. Review & Kirim']
              ].map(([num, label]) => `
                <div style="padding:10px 12px;border-radius:var(--radius-sm);background:${step === num ? 'var(--primary-light)' : step > num ? 'var(--success-light)' : 'var(--surface)'};color:${step === num ? 'var(--primary)' : step > num ? 'var(--success)' : 'var(--text-muted)'};font-weight:700;font-size:13px;">
                  ${label}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card card-lg card-body">
            ${step === 1 ? `
              <h2 class="text-h3 mb-3">Langkah 1: Pilih Jenis Jasa & Kebutuhan</h2>
              <div class="form-group">
                <label class="form-label" for="cw-service">Jenis Jasa Utama *</label>
                <select id="cw-service" class="form-select">
                  ${state.services.map((s) => `<option value="${escapeHtml(s.name)}" ${d.serviceType === s.name ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Komponen Kebutuhan (Pilih yang relevan)</label>
                <div class="grid-2" style="gap:10px;">
                  ${needOptions.map((opt) => `
                    <label class="checkbox-row card card-body" style="padding:12px;">
                      <input type="checkbox" class="cw-need-cb" value="${escapeHtml(opt)}" ${d.needs.includes(opt) ? 'checked' : ''}>
                      <span>${escapeHtml(opt)}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
              <div class="flex justify-end mt-4">
                <button type="button" class="btn btn-primary" data-cw-next="2">Lanjut ke Deskripsi ${icon('arrow-right', 15)}</button>
              </div>
            ` : step === 2 ? `
              <h2 class="text-h3 mb-3">Langkah 2: Deskripsi Proyek & Estimasi Anggaran</h2>
              <div class="form-group">
                <label class="form-label" for="cw-title">Judul Proyek *</label>
                <input type="text" id="cw-title" class="form-control" placeholder="Contoh: Portal Katalog Mitra & Microsite Event" value="${escapeHtml(d.projectTitle)}">
              </div>
              <div class="form-group">
                <label class="form-label" for="cw-desc">Deskripsi Lengkap Proyek *</label>
                <textarea id="cw-desc" class="form-textarea" rows="4" placeholder="Jelaskan latar belakang, fitur utama, dan target hasil...">${escapeHtml(d.description)}</textarea>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="cw-budget">Estimasi Anggaran</label>
                  <select id="cw-budget" class="form-select">
                    ${['Rp 2.000.000 – Rp 5.000.000', 'Rp 5.000.000 – Rp 15.000.000', 'Rp 15.000.000 – Rp 30.000.000', '> Rp 30.000.000'].map((b) => `<option value="${escapeHtml(b)}" ${d.budgetRange === b ? 'selected' : ''}>${escapeHtml(b)}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="cw-timeline">Target Waktu</label>
                  <select id="cw-timeline" class="form-select">
                    ${['1–2 Minggu', '3–4 Minggu', '1–2 Bulan', 'Fleksibel'].map((t) => `<option value="${escapeHtml(t)}" ${d.timeline === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="flex justify-between mt-4">
                <button type="button" class="btn btn-secondary" data-cw-prev="1">Kembali</button>
                <button type="button" class="btn btn-primary" data-cw-next="3">Lanjut ke Kontak ${icon('arrow-right', 15)}</button>
              </div>
            ` : step === 3 ? `
              <h2 class="text-h3 mb-3">Langkah 3: Informasi Kontak & Lampiran</h2>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="cw-cname">Nama Kontak *</label>
                  <input type="text" id="cw-cname" class="form-control" value="${escapeHtml(d.contactName || 'Raka Pratama')}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="cw-cemail">Email *</label>
                  <input type="email" id="cw-cemail" class="form-control" value="${escapeHtml(d.contactEmail || 'pelanggan@example.com')}">
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="cw-cphone">Telepon / WhatsApp *</label>
                  <input type="text" id="cw-cphone" class="form-control" value="${escapeHtml(d.contactPhone || '0812-3456-7890')}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="cw-file">Lampiran Referensi (Opsional)</label>
                  <input type="file" id="cw-file" class="form-control">
                </div>
              </div>
              <div class="flex justify-between mt-4">
                <button type="button" class="btn btn-secondary" data-cw-prev="2">Kembali</button>
                <button type="button" class="btn btn-primary" data-cw-next="4">Review Permintaan ${icon('arrow-right', 15)}</button>
              </div>
            ` : `
              <h2 class="text-h3 mb-3">Langkah 4: Tinjauan & Konfirmasi</h2>
              <div class="card card-body mb-4" style="background:var(--surface);">
                <div class="grid-2 text-sm" style="gap:12px;">
                  <div><span class="text-muted">Jenis Jasa:</span><br><strong>${escapeHtml(d.serviceType)}</strong></div>
                  <div><span class="text-muted">Judul Proyek:</span><br><strong>${escapeHtml(d.projectTitle)}</strong></div>
                  <div><span class="text-muted">Estimasi Anggaran:</span><br><strong>${escapeHtml(d.budgetRange)}</strong></div>
                  <div><span class="text-muted">Target Waktu:</span><br><strong>${escapeHtml(d.timeline)}</strong></div>
                  <div><span class="text-muted">Kontak:</span><br><strong>${escapeHtml(d.contactName)} (${escapeHtml(d.contactEmail)})</strong></div>
                  <div><span class="text-muted">Kebutuhan:</span><br><strong>${escapeHtml(d.needs.join(', ') || '-')}</strong></div>
                </div>
                <div class="mt-3 text-sm"><span class="text-muted">Deskripsi:</span><p class="mt-1">${escapeHtml(d.description)}</p></div>
              </div>
              <div class="flex justify-between">
                <button type="button" class="btn btn-secondary" data-cw-prev="3">Ubah Data</button>
                <button type="button" class="btn btn-primary btn-lg" id="cw-submit-btn">Kirim Permintaan Penawaran</button>
              </div>
            `}
          </div>
        </div>
      </section>
    `;
  }

  /* ---- PAGE 08: Katalog Pelatihan ---- */
  function renderTrainingsCatalogPage() {
    const locations = ['all', ...Array.from(new Set(state.trainingPrograms.map((p) => p.primaryLocation)))];
    const categories = ['all', ...Array.from(new Set(state.trainingPrograms.map((p) => p.category)))];

    const filtered = state.trainingPrograms.filter((p) => {
      const q = ui.trainingFilter.search.trim().toLowerCase();
      if (q && !(p.title.toLowerCase().includes(q) || p.shortDesc.toLowerCase().includes(q))) return false;
      if (ui.trainingFilter.mode !== 'all' && !p.mode.toLowerCase().includes(ui.trainingFilter.mode.toLowerCase())) return false;
      if (ui.trainingFilter.location !== 'all' && p.primaryLocation !== ui.trainingFilter.location) return false;
      if (ui.trainingFilter.category !== 'all' && p.category !== ui.trainingFilter.category) return false;
      if (ui.trainingFilter.maxPrice !== '' && p.price > Number(ui.trainingFilter.maxPrice)) return false;
      return true;
    });

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Pelatihan & Akademi' }])}
          <div class="section-header">
            <div>
              <h1 class="text-h1">Katalog Program Pelatihan</h1>
              <p class="text-body text-secondary mt-1">Kelas tatap muka Cisarua & Bekasi, Barista, AI TQN, Webinar AI, dan Workshop Digital.</p>
            </div>
          </div>

          <div class="card card-body mb-4">
            <div class="grid-4" style="gap:12px;">
              <input type="search" id="trn-search-input" class="form-control" placeholder="Cari program pelatihan..." value="${escapeHtml(ui.trainingFilter.search)}">
              <select id="trn-mode-select" class="form-select">
                <option value="all">Semua Mode (Online & Offline)</option>
                <option value="Offline" ${ui.trainingFilter.mode === 'Offline' ? 'selected' : ''}>Offline</option>
                <option value="Online" ${ui.trainingFilter.mode === 'Online' ? 'selected' : ''}>Online</option>
              </select>
              <select id="trn-loc-select" class="form-select">
                ${locations.map((l) => `<option value="${escapeHtml(l)}" ${ui.trainingFilter.location === l ? 'selected' : ''}>${l === 'all' ? 'Semua Lokasi' : escapeHtml(l)}</option>`).join('')}
              </select>
              <select id="trn-cat-select" class="form-select">
                ${categories.map((c) => `<option value="${escapeHtml(c)}" ${ui.trainingFilter.category === c ? 'selected' : ''}>${c === 'all' ? 'Semua Kategori' : escapeHtml(c)}</option>`).join('')}
              </select>
            </div>
          </div>

          ${filtered.length === 0 ? `
            <div class="state-box">
              <div class="state-icon">${icon('graduation-cap', 24)}</div>
              <h3 class="text-h4">Program tidak ditemukan</h3>
              <p class="text-sm text-secondary mt-1">Coba ubah filter lokasi atau mode pelatihan.</p>
            </div>
          ` : `
            <div class="grid-3">${filtered.map((p) => renderTrainingCard(p)).join('')}</div>
          `}

          <h2 class="text-h2 mt-6 mb-3">Jadwal Sesi Terdekat</h2>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Program & Sesi</th>
                  <th>Tanggal & Waktu</th>
                  <th>Lokasi</th>
                  <th>Kuota Tersisa</th>
                  <th>Harga</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${state.trainingSessions.map((ses) => {
                  const prog = state.trainingPrograms.find((p) => p.id === ses.programId);
                  if (!prog) return '';
                  const avail = getSessionAvailability(ses);
                  return `
                    <tr>
                      <td>
                        <div class="font-bold">${escapeHtml(prog.title)}</div>
                        <div class="text-caption text-muted">${escapeHtml(ses.title)}</div>
                      </td>
                      <td>
                        <div>${formatDate(ses.date)}</div>
                        <div class="text-caption text-muted">${escapeHtml(ses.timeLabel)}</div>
                      </td>
                      <td><span class="badge badge-neutral">${escapeHtml(ses.mode)}</span> ${escapeHtml(ses.location)}</td>
                      <td>
                        <span class="badge ${avail.isFull ? 'badge-danger' : 'badge-success'}">
                          ${avail.isFull ? 'Kuota Penuh (0)' : `${avail.remaining} / ${ses.quota} Kursi`}
                        </span>
                      </td>
                      <td class="font-bold">${formatIDR(prog.price)}</td>
                      <td>
                        ${avail.isFull
                          ? `<button type="button" class="btn btn-secondary btn-sm" disabled>Penuh</button>`
                          : `<a href="#/pelatihan/daftar/${escapeHtml(ses.id)}" class="btn btn-primary btn-sm">Daftar</a>`}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  /* ---- PAGE 09: Detail Pelatihan ---- */
  function renderTrainingDetailPage(id) {
    const prog = state.trainingPrograms.find((p) => p.id === id);
    if (!prog) return render404Page();
    const sessions = state.trainingSessions.filter((s) => s.programId === prog.id);
    const firstOpen = sessions.find((s) => !getSessionAvailability(s).isFull) || sessions[0];

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Pelatihan', href: '#/pelatihan' }, { label: prog.title }])}

          <div class="detail-layout">
            <div>
              <div class="card mb-4">
                <img src="${prog.thumbnail}" alt="${escapeHtml(prog.title)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;">
              </div>
              <div class="card card-body mb-4">
                <span class="badge badge-accent">${escapeHtml(prog.category)} • ${escapeHtml(prog.mode)}</span>
                <h1 class="text-h1 mt-2">${escapeHtml(prog.title)}</h1>
                <p class="text-body text-secondary mt-2">${escapeHtml(prog.description)}</p>
                <div class="alert alert-info mt-3">
                  ${icon('user', 17)}
                  <div><strong>Instruktur:</strong> ${escapeHtml(prog.instructor)}</div>
                </div>
                <h2 class="text-h4 mt-4 mb-2">Tujuan Pembelajaran</h2>
                <ul style="display:flex;flex-direction:column;gap:8px;">
                  ${prog.objectives.map((o) => `<li class="flex items-start gap-2 text-sm text-secondary"><span class="text-success">${icon('check-circle', 16)}</span><span>${escapeHtml(o)}</span></li>`).join('')}
                </ul>
                <h2 class="text-h4 mt-4 mb-2">Materi & Silabus</h2>
                <ul style="display:flex;flex-direction:column;gap:8px;">
                  ${prog.curriculum.map((m) => `<li class="flex items-start gap-2 text-sm text-secondary"><span class="text-primary-brand">${icon('file-text', 16)}</span><span>${escapeHtml(m)}</span></li>`).join('')}
                </ul>
                <div class="grid-2 mt-4">
                  <div class="card card-body" style="background:var(--surface);">
                    <h3 class="text-h4 mb-2">Fasilitas Peserta</h3>
                    <ul class="text-sm text-secondary" style="display:flex;flex-direction:column;gap:6px;">
                      ${prog.facilities.map((f) => `<li>• ${escapeHtml(f)}</li>`).join('')}
                    </ul>
                  </div>
                  <div class="card card-body" style="background:var(--surface);">
                    <h3 class="text-h4 mb-2">Persyaratan</h3>
                    <p class="text-sm text-secondary">${escapeHtml(prog.requirements)}</p>
                  </div>
                </div>
              </div>
              <div class="card card-body">
                <h3 class="text-h4 mb-3">FAQ Pelatihan</h3>
                ${renderAccordionList(prog.faqs, 'trn-faq')}
              </div>
            </div>

            <aside class="sticky-panel">
              <div class="card card-lg card-body">
                <div class="text-caption text-muted">Investasi Pelatihan</div>
                <div class="text-h1 text-primary-brand tabular-nums mt-1">${formatIDR(prog.price)}</div>
                <div class="text-sm text-secondary mt-1 mb-4">Lokasi utama: ${escapeHtml(prog.primaryLocation)}</div>

                <h3 class="text-h4 mb-2">Pilih Sesi Jadwal</h3>
                <div style="display:flex;flex-direction:column;gap:10px;" id="training-session-selector">
                  ${sessions.map((ses) => {
                    const avail = getSessionAvailability(ses);
                    const checked = firstOpen && firstOpen.id === ses.id && !avail.isFull;
                    return `
                      <label class="card card-body" style="padding:12px;cursor:${avail.isFull ? 'not-allowed' : 'pointer'};opacity:${avail.isFull ? '.65' : '1'};border-color:${checked ? 'var(--primary)' : 'var(--border)'};">
                        <div class="flex items-start gap-2">
                          <input type="radio" name="selected-session" value="${escapeHtml(ses.id)}" ${checked ? 'checked' : ''} ${avail.isFull ? 'disabled' : ''} style="margin-top:4px;accent-color:var(--primary);">
                          <div style="flex:1;">
                            <div class="font-bold text-sm">${escapeHtml(ses.title)}</div>
                            <div class="text-caption text-secondary">${formatDate(ses.date)} • ${escapeHtml(ses.timeLabel)}</div>
                            <div class="text-caption text-muted">${escapeHtml(ses.location)}</div>
                            <div class="mt-1">
                              <span class="badge ${avail.isFull ? 'badge-danger' : 'badge-success'}">
                                ${avail.isFull ? 'Sesi Penuh — Pendaftaran Ditutup' : `Sisa ${avail.remaining} dari ${ses.quota} kursi`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </label>
                    `;
                  }).join('')}
                </div>

                <button type="button" class="btn btn-primary btn-lg w-full mt-4" id="go-register-training-btn" ${!firstOpen || getSessionAvailability(firstOpen).isFull ? 'disabled' : ''}>
                  ${icon('graduation-cap', 18)} Daftar Sekarang
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    `;
  }

  /* ---- PAGE 10: Pendaftaran Pelatihan ---- */
  function renderTrainingRegistrationPage(sessionId) {
    const ses = state.trainingSessions.find((s) => s.id === sessionId);
    if (!ses) return render404Page();
    const prog = state.trainingPrograms.find((p) => p.id === ses.programId);
    const avail = getSessionAvailability(ses);
    const cust = state.currentRole === 'customer' && state.currentUser ? state.currentUser : null;

    if (avail.isFull) {
      return `
        <section class="section-sm">
          <div class="container" style="max-width:680px;">
            <div class="state-box">
              <div class="state-icon text-danger">${icon('alert-circle', 26)}</div>
              <h1 class="text-h2">Kuota Sesi Sudah Penuh</h1>
              <p class="text-body text-secondary mt-2 mb-4">Sesi ${escapeHtml(ses.title)} telah mencapai kapasitas maksimal (${ses.quota} peserta). Silakan pilih jadwal sesi lainnya.</p>
              <a href="#/pelatihan/detail/${escapeHtml(prog.id)}" class="btn btn-primary">Pilih Sesi Lain</a>
            </div>
          </div>
        </section>
      `;
    }

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([
            { label: 'Pelatihan', href: '#/pelatihan' },
            { label: prog.title, href: `#/pelatihan/detail/${prog.id}` },
            { label: 'Pendaftaran Peserta' }
          ])}
          <h1 class="text-h1 mb-4">Formulir Pendaftaran Pelatihan</h1>

          <div class="detail-layout">
            <form id="training-registration-form" class="card card-lg card-body" data-session-id="${escapeHtml(ses.id)}" data-unit-price="${prog.price}">
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="tr-name">Nama Lengkap Peserta *</label>
                  <input type="text" id="tr-name" class="form-control" required value="${escapeHtml(cust ? cust.name : 'Raka Pratama')}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="tr-email">Email Peserta *</label>
                  <input type="email" id="tr-email" class="form-control" required value="${escapeHtml(cust ? cust.email : 'pelanggan@example.com')}">
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="tr-phone">Nomor Telepon / WhatsApp *</label>
                  <input type="text" id="tr-phone" class="form-control" required value="${escapeHtml(cust ? cust.phone : '0812-3456-7890')}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="tr-seats">Jumlah Peserta (Maks. ${avail.remaining} kursi) *</label>
                  <input type="number" id="tr-seats" class="form-control" min="1" max="${avail.remaining}" value="1" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="tr-notes">Catatan Khusus / Kebutuhan Belajar</label>
                <textarea id="tr-notes" class="form-textarea" rows="2" placeholder="Opsional: info perangkat atau kebutuhan khusus"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="tr-coupon">Kode Promo Simulasi (Opsional)</label>
                <input type="text" id="tr-coupon" class="form-control" placeholder="Contoh: PELATIHAN15">
              </div>
              <div class="alert alert-warning mb-4 text-caption">
                ${icon('clock', 16)}
                <span>Kursi akan direservasi sementara selama 48 jam simulasi sambil menunggu pembayaran dan verifikasi Admin.</span>
              </div>
              <button type="submit" class="btn btn-primary btn-lg w-full">Reservasi Kursi & Buat Invoice</button>
            </form>

            <aside class="sticky-panel">
              <div class="card card-lg card-body">
                <span class="badge badge-accent">${escapeHtml(ses.mode)}</span>
                <h2 class="text-h4 mt-2">${escapeHtml(prog.title)}</h2>
                <div class="text-sm font-semibold text-primary-brand mt-1">${escapeHtml(ses.title)}</div>
                <hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">
                <div class="text-sm flex justify-between mb-2"><span class="text-muted">Tanggal</span><strong>${formatDate(ses.date)}</strong></div>
                <div class="text-sm flex justify-between mb-2"><span class="text-muted">Waktu</span><strong>${escapeHtml(ses.timeLabel)}</strong></div>
                <div class="text-sm flex justify-between mb-2"><span class="text-muted">Lokasi</span><strong>${escapeHtml(ses.location)}</strong></div>
                <div class="text-sm flex justify-between mb-2"><span class="text-muted">Kuota Tersisa</span><strong class="text-success">${avail.remaining} kursi</strong></div>
                <div class="text-h4 flex justify-between mt-3"><span>Estimasi Total</span><strong id="tr-total-preview" class="text-primary-brand">${formatIDR(prog.price)}</strong></div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------------------
     11. PUBLIC PAGES 11 – 22
     ------------------------------------------------------------------------ */
  function renderArticlesPage() {
    const published = state.articles.filter((a) => a.status === 'published');
    const featured = published.find((a) => a.featured) || published[0];
    const cats = ['all', ...Array.from(new Set(published.map((a) => a.category)))];

    const filtered = published.filter((a) => {
      const q = ui.articleFilter.search.trim().toLowerCase();
      if (q && !(a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q))) return false;
      if (ui.articleFilter.category !== 'all' && a.category !== ui.articleFilter.category) return false;
      return true;
    });

    const perPage = 6;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const page = Math.min(ui.articleFilter.page, totalPages);
    const paged = filtered.slice((page - 1) * perPage, page * perPage);

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Artikel & Insight' }])}
          <h1 class="text-h1 mb-2">Artikel & Insight</h1>
          <p class="text-body text-secondary mb-4">Pembahasan terstruktur seputar produk digital, layanan kreatif, dan pengembangan keterampilan.</p>

          ${featured ? `
            <div class="card card-lg mb-6">
              <div class="grid-2 items-center">
                <img src="${featured.cover}" alt="${escapeHtml(featured.title)}" style="width:100%;height:100%;min-height:260px;object-fit:cover;">
                <div class="card-body" style="padding:28px;">
                  <span class="badge badge-primary">Artikel Pilihan • ${escapeHtml(featured.category)}</span>
                  <h2 class="text-h2 mt-2">${escapeHtml(featured.title)}</h2>
                  <p class="text-body text-secondary mt-2">${escapeHtml(featured.excerpt)}</p>
                  <div class="text-caption text-muted mt-3">${escapeHtml(featured.author)} • ${formatDate(featured.publishedAt)} • ${featured.readMinutes} menit baca</div>
                  <a href="#/artikel/detail/${escapeHtml(featured.id)}" class="btn btn-primary mt-4">Baca Selengkapnya ${icon('arrow-right', 15)}</a>
                </div>
              </div>
            </div>
          ` : ''}

          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div class="flex flex-wrap gap-2">
              ${cats.map((c) => `
                <button type="button" class="tab-btn ${ui.articleFilter.category === c ? 'active' : ''}" data-art-cat="${escapeHtml(c)}">
                  ${c === 'all' ? 'Semua' : escapeHtml(c)}
                </button>
              `).join('')}
            </div>
            <input type="search" id="art-search-input" class="form-control" style="max-width:280px;" placeholder="Cari artikel..." value="${escapeHtml(ui.articleFilter.search)}">
          </div>

          ${paged.length === 0 ? `
            <div class="state-box">
              <div class="state-icon">${icon('file-text', 24)}</div>
              <h3 class="text-h4">Artikel tidak ditemukan</h3>
            </div>
          ` : `
            <div class="grid-3">${paged.map((a) => renderArticleCard(a)).join('')}</div>
            ${renderPagination(page, totalPages, 'data-art-page')}
          `}
        </div>
      </section>
    `;
  }

  function renderArticleDetailPage(id) {
    const art = state.articles.find((a) => a.id === id);
    if (!art) return render404Page();
    const related = state.articles.filter((a) => a.id !== art.id && a.status === 'published').slice(0, 3);

    return `
      <section class="section-sm">
        <div class="container" style="max-width:1040px;">
          ${renderBreadcrumbs([{ label: 'Artikel & Insight', href: '#/artikel' }, { label: art.title }])}
          <span class="badge badge-primary">${escapeHtml(art.category)}</span>
          <h1 class="text-h1 mt-2">${escapeHtml(art.title)}</h1>
          <div class="flex flex-wrap items-center justify-between gap-3 mt-3 mb-4 text-sm text-muted">
            <div>Oleh <strong>${escapeHtml(art.author)}</strong> • ${formatDate(art.publishedAt)} • ${art.readMinutes} menit baca</div>
            <div class="flex gap-2">
              <button type="button" class="btn btn-secondary btn-sm" data-copy-url>${icon('share', 14)} Salin Tautan Artikel</button>
            </div>
          </div>

          <div class="card mb-6">
            <img src="${art.cover}" alt="${escapeHtml(art.title)}" style="width:100%;max-height:420px;object-fit:cover;">
          </div>

          <div class="detail-layout">
            <article class="card card-lg card-body article-prose">
              <p style="font-size:17px;color:var(--text-primary);font-weight:500;">${escapeHtml(art.excerpt)}</p>
              ${art.sections.map((sec) => `
                <section id="${escapeHtml(sec.id)}">
                  <h2>${escapeHtml(sec.heading)}</h2>
                  <p>${escapeHtml(sec.body)}</p>
                  ${sec.bullets ? `<ul>${sec.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
                </section>
              `).join('')}
            </article>

            <aside class="sticky-panel">
              <div class="card card-body mb-4">
                <h3 class="text-h4 mb-2">Daftar Isi</h3>
                <ul style="display:flex;flex-direction:column;gap:8px;">
                  ${art.sections.map((sec, idx) => `
                    <li>
                      <button type="button" class="btn btn-ghost btn-sm w-full" style="justify-content:flex-start;text-align:left;white-space:normal;" data-scroll-target="${escapeHtml(sec.id)}">
                        ${idx + 1}. ${escapeHtml(sec.heading)}
                      </button>
                    </li>
                  `).join('')}
                </ul>
              </div>
              <div class="card card-body" style="background:var(--surface);">
                <h4 class="text-h4">Butuh Bantuan Implementasi?</h4>
                <p class="text-sm text-secondary mt-1 mb-3">Jelajahi template siap pakai atau layanan jasa digital NEXORA.</p>
                <a href="#/produk" class="btn btn-primary btn-sm w-full">Lihat Produk Terkait</a>
              </div>
            </aside>
          </div>

          <div class="mt-6">
            <h2 class="text-h3 mb-3">Artikel Terkait</h2>
            <div class="grid-3">${related.map((a) => renderArticleCard(a)).join('')}</div>
          </div>
        </div>
      </section>
    `;
  }

  function renderPortfoliosPage() {
    const cats = ['all', 'Website', 'Desain', 'Editing', 'Streaming'];
    const filtered = state.portfolios.filter((pt) =>
      pt.status === 'published' && (ui.portfolioFilter.category === 'all' || pt.category === ui.portfolioFilter.category)
    );

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Portofolio Contoh' }])}
          <div class="section-header">
            <div>
              <h1 class="text-h1">Portofolio Contoh</h1>
              <p class="text-body text-secondary mt-1">Contoh hasil pengerjaan website, desain kreatif, editing video, dan operator streaming Zoom.</p>
            </div>
            <a href="#/jasa/custom" class="btn btn-primary">Diskusikan Proyek Serupa</a>
          </div>

          <div class="tabs-nav">
            ${cats.map((c) => `
              <button type="button" class="tab-btn ${ui.portfolioFilter.category === c ? 'active' : ''}" data-port-cat="${escapeHtml(c)}">
                ${c === 'all' ? 'Semua Kategori' : escapeHtml(c)}
              </button>
            `).join('')}
          </div>

          <div class="grid-3">
            ${filtered.map((pt) => `
              <article class="card card-hover catalog-card">
                <a href="#/portofolio/detail/${escapeHtml(pt.id)}" class="card-thumb">
                  <img src="${pt.thumbnail}" alt="${escapeHtml(pt.title)}">
                  <div class="card-thumb-badge"><span class="badge badge-primary">${escapeHtml(pt.category)}</span></div>
                </a>
                <div class="card-content">
                  <div class="text-caption text-muted">${escapeHtml(pt.client)}</div>
                  <a href="#/portofolio/detail/${escapeHtml(pt.id)}" class="card-title">${escapeHtml(pt.title)}</a>
                  <p class="card-desc">${escapeHtml(pt.summary)}</p>
                  <div class="card-footer">
                    <a href="#/portofolio/detail/${escapeHtml(pt.id)}" class="btn btn-outline btn-sm">Lihat Detail Proyek</a>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderPortfolioDetailPage(id) {
    const pt = state.portfolios.find((p) => p.id === id);
    if (!pt) return render404Page();
    return `
      <section class="section-sm">
        <div class="container" style="max-width:1020px;">
          ${renderBreadcrumbs([{ label: 'Portofolio', href: '#/portofolio' }, { label: pt.title }])}
          <span class="badge badge-primary">${escapeHtml(pt.category)}</span>
          <h1 class="text-h1 mt-2">${escapeHtml(pt.title)}</h1>
          <p class="text-body text-secondary mt-2 mb-4">${escapeHtml(pt.client)} • Diselesaikan: ${formatDate(pt.completedAt)} (Data Contoh)</p>

          <div class="grid-2 mb-4">
            ${pt.gallery.map((g, i) => `
              <div class="card"><img src="${g}" alt="${escapeHtml(pt.title)} galeri ${i + 1}" style="width:100%;aspect-ratio:16/10;object-fit:cover;"></div>
            `).join('')}
          </div>

          <div class="grid-2">
            <div class="card card-body">
              <h2 class="text-h4 mb-2">Gambaran & Kebutuhan Proyek</h2>
              <p class="text-sm text-secondary mb-3">${escapeHtml(pt.needs)}</p>
              <h3 class="text-h4 mb-2">Pendekatan Pengerjaan</h3>
              <p class="text-sm text-secondary">${escapeHtml(pt.approach)}</p>
            </div>
            <div class="card card-body">
              <h2 class="text-h4 mb-2">Deliverable & Hasil Contoh</h2>
              <ul class="mb-3" style="display:flex;flex-direction:column;gap:8px;">
                ${pt.deliverables.map((d) => `<li class="flex items-start gap-2 text-sm"><span class="text-success">${icon('check-circle', 16)}</span><span>${escapeHtml(d)}</span></li>`).join('')}
              </ul>
              <div class="alert alert-success text-sm">${icon('award', 17)}<span>${escapeHtml(pt.outcome)}</span></div>
              <div class="flex gap-2 mt-4">
                <a href="#/jasa" class="btn btn-primary btn-sm">Lihat Paket Jasa</a>
                <a href="#/jasa/custom" class="btn btn-outline btn-sm">Minta Penawaran Custom</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderAboutPage() {
    const team = [
      ['Alya Wijaya', 'Lead Ecosystem & Operations (Contoh)', '#245BDB'],
      ['Rina Permata', 'Principal Product Designer (Contoh)', '#7657D8'],
      ['Hendrik Suryana', 'AI & Academy Director (Contoh)', '#16794C'],
      ['Bagus Santoso', 'Client Services & Delivery Lead (Contoh)', '#334155']
    ];
    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Tentang Kami' }])}
          <div class="card card-lg card-body mb-6" style="background:linear-gradient(135deg,#FFFFFF 0%,var(--surface) 100%);padding:36px;">
            <span class="section-eyebrow">${escapeHtml(state.settings.positioning)}</span>
            <h1 class="text-h1 mt-2">Tentang NEXORA</h1>
            <p class="text-body text-secondary mt-3" style="max-width:780px;">
              NEXORA adalah platform demonstrasi <strong>Single Vendor Digital Commerce</strong> yang memadukan tiga lini utama — Produk Digital, Jasa Digital, dan Pelatihan — dalam satu pengalaman pelanggan dan pengelolaan admin yang terintegrasi.
            </p>
          </div>

          <div class="grid-3 mb-6">
            <div class="card card-body"><h2 class="text-h4 mb-2">Visi</h2><p class="text-sm text-secondary">Menjadi ekosistem pertumbuhan digital yang terstruktur, mudah diakses, dan relevan bagi individu serta pelaku usaha di Indonesia.</p></div>
            <div class="card card-body"><h2 class="text-h4 mb-2">Misi</h2><p class="text-sm text-secondary">Menghadirkan aset digital siap pakai, eksekusi layanan kreatif yang terukur, dan program pelatihan aplikatif offline maupun online.</p></div>
            <div class="card card-body"><h2 class="text-h4 mb-2">Nilai Inti</h2><p class="text-sm text-secondary">Kejelasan ruang lingkup, integritas distribusi resmi, dokumentasi rapi, dan keberlanjutan pembelajaran.</p></div>
          </div>

          <div class="alert alert-info mb-6">
            ${icon('info', 18)}
            <div><strong>Cakupan Ekosistem MVP:</strong> Aktivitas affiliate AI, periklanan, pengembangan channel YouTube, dan produksi konten internal merupakan bagian dari pemasaran serta pengembangan bisnis NEXORA, bukan kategori transaksi utama pada MVP ini.</div>
          </div>

          <h2 class="text-h2 mb-3">Tim Ilustratif (Data Demonstrasi)</h2>
          <div class="grid-4">
            ${team.map(([name, role, color]) => `
              <div class="card card-body" style="text-align:center;">
                <img src="${createAvatarDataUri(name, color)}" alt="${escapeHtml(name)}" style="width:76px;height:76px;border-radius:50%;margin:0 auto 12px;">
                <h3 class="text-h4">${escapeHtml(name)}</h3>
                <p class="text-caption text-muted mt-1">${escapeHtml(role)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderContactPage() {
    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Kontak' }])}
          <h1 class="text-h1 mb-2">Hubungi NEXORA</h1>
          <p class="text-body text-secondary mb-4">Kirim pertanyaan demo melalui formulir atau gunakan kanal informasi contoh di bawah ini.</p>

          <div class="detail-layout">
            <form id="contact-demo-form" class="card card-lg card-body">
              <h2 class="text-h3 mb-3">Formulir Kontak Simulasi</h2>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="ct-name">Nama Lengkap *</label>
                  <input type="text" id="ct-name" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="ct-email">Email *</label>
                  <input type="email" id="ct-email" class="form-control" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="ct-topic">Topik Pertanyaan</label>
                <select id="ct-topic" class="form-select">
                  <option>Produk Digital & Lisensi</option>
                  <option>Jasa Paket Tetap / Penawaran Custom</option>
                  <option>Pendaftaran Pelatihan</option>
                  <option>Pembayaran & Verifikasi</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="ct-msg">Pesan *</label>
                <textarea id="ct-msg" class="form-textarea" rows="4" required placeholder="Tuliskan pertanyaan Anda..."></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Kirim Pesan Demo</button>
            </form>

            <div style="display:flex;flex-direction:column;gap:16px;">
              <div class="card card-body">
                <h3 class="text-h4 mb-3">Informasi Kontak Contoh</h3>
                <div class="text-sm flex flex-wrap gap-2 items-center mb-2">${icon('mail', 16)} <span>${escapeHtml(state.settings.contactEmail)}</span></div>
                <div class="text-sm flex flex-wrap gap-2 items-center mb-2">${icon('phone', 16)} <span>${escapeHtml(state.settings.contactPhone)}</span></div>
                <div class="text-sm flex flex-wrap gap-2 items-center mb-2">${icon('map-pin', 16)} <span>${escapeHtml(state.settings.contactAddress)}</span></div>
                <div class="text-sm flex flex-wrap gap-2 items-center">${icon('clock', 16)} <span>${escapeHtml(state.settings.operatingHours)}</span></div>
              </div>
              <div class="card card-body">
                <h3 class="text-h4 mb-2">FAQ Kontak Cepat</h3>
                ${renderAccordionList([
                  { q: 'Berapa lama respons simulasi pertanyaan?', a: 'Pada mode demo ini, pesan Anda langsung tersimpan ke daftar tiket bantuan di Dashboard Admin.' },
                  { q: 'Apakah lokasi Cisarua dan Bekasi menerima kunjungan langsung?', a: 'Keduanya ditampilkan sebagai lokasi contoh penyelenggaraan pelatihan tatap muka dalam demonstrasi.' }
                ], 'ct-faq')}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderHelpCenterPage() {
    const helpItems = [
      { cat: 'Transaksi & Pembayaran', q: 'Mengapa status saya masih Menunggu Verifikasi setelah mengunggah bukti?', a: 'Sesuai aturan simulasi, pengunggahan bukti tidak langsung menyetujui pembayaran. Buka Demo Control Center dan masuk sebagai Admin untuk menyetujui atau menolak bukti di menu Verifikasi Pembayaran.' },
      { cat: 'Transaksi & Pembayaran', q: 'Apa yang terjadi jika bukti pembayaran ditolak Admin?', a: 'Anda dapat melihat alasan penolakan pada halaman detail pembayaran dan langsung mengunggah ulang bukti transfer baru.' },
      { cat: 'Produk Digital', q: 'Di mana saya mengunduh file setelah pembayaran disetujui?', a: 'Buka Dashboard Pelanggan > Unduhan Digital. Tombol unduh menghasilkan file contoh melalui JavaScript Blob.' },
      { cat: 'Jasa Digital', q: 'Bagaimana cara kerja penawaran custom?', a: 'Kirim kebutuhan melalui halaman Permintaan Penawaran Custom. Admin membuat penawaran harga dan masa berlaku, lalu Anda menyetujuinya dari menu Penawaran Custom.' },
      { cat: 'Pelatihan', q: 'Bagaimana jika kuota sesi pelatihan sudah penuh?', a: 'Sesi dengan kuota penuh otomatis menonaktifkan tombol pendaftaran agar tidak terjadi kelebihan peserta.' }
    ];
    const cats = ['Semua', 'Transaksi & Pembayaran', 'Produk Digital', 'Jasa Digital', 'Pelatihan'];
    const filtered = helpItems.filter((h) => {
      const q = ui.helpSearch.trim().toLowerCase();
      if (ui.helpCategory !== 'Semua' && h.cat !== ui.helpCategory) return false;
      if (q && !(h.q.toLowerCase().includes(q) || h.a.toLowerCase().includes(q))) return false;
      return true;
    });

    return `
      <section class="section-sm">
        <div class="container" style="max-width:960px;">
          ${renderBreadcrumbs([{ label: 'Pusat Bantuan' }])}
          <h1 class="text-h1 mb-2">Pusat Bantuan NEXORA</h1>
          <p class="text-body text-secondary mb-4">Cari panduan alur simulasi atau kirim permintaan bantuan langsung ke tim demo.</p>

          <div class="card card-body mb-4">
            <input type="search" id="help-search-input" class="form-control mb-3" placeholder="Cari topik bantuan (misal: verifikasi, unduhan, kuota)..." value="${escapeHtml(ui.helpSearch)}">
            <div class="flex flex-wrap gap-2">
              ${cats.map((c) => `<button type="button" class="tab-btn ${ui.helpCategory === c ? 'active' : ''}" data-help-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
            </div>
          </div>

          <div class="mb-6">
            ${filtered.length === 0 ? `<div class="state-box"><h3 class="text-h4">Tidak ada FAQ yang cocok</h3></div>` : renderAccordionList(filtered, 'help-faq')}
          </div>

          <form id="help-ticket-form" class="card card-lg card-body">
            <h2 class="text-h3 mb-3">Formulir Permintaan Bantuan</h2>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="hlp-name">Nama *</label>
                <input type="text" id="hlp-name" class="form-control" required value="${escapeHtml(state.currentUser ? state.currentUser.name : '')}">
              </div>
              <div class="form-group">
                <label class="form-label" for="hlp-email">Email *</label>
                <input type="email" id="hlp-email" class="form-control" required value="${escapeHtml(state.currentUser ? state.currentUser.email : '')}">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="hlp-msg">Kendala atau Pertanyaan *</label>
              <textarea id="hlp-msg" class="form-textarea" rows="3" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Kirim Permintaan Bantuan</button>
          </form>
        </div>
      </section>
    `;
  }

  function renderLegalPolicyPage(kind) {
    const map = {
      privacy: {
        title: 'Kebijakan Privasi (Contoh Demonstrasi)',
        sections: [
          ['1. Ruang Lingkup Simulasi', 'Dokumen ini merupakan contoh tampilan Kebijakan Privasi dan belum merupakan kebijakan hukum final. Pada prototype ini, data formulir disimpan secara lokal pada LocalStorage browser pengguna.'],
          ['2. Data yang Disimulasikan', 'Nama, alamat email contoh, nomor kontak simulasi, catatan proyek, dan unggahan bukti transfer contoh digunakan semata-mata untuk memperagakan alur kerja aplikasi.'],
          ['3. Penghapusan Data', 'Anda dapat menghapus seluruh data simulasi kapan saja melalui tombol Reset Data Demo di Demo Control Center.']
        ]
      },
      terms: {
        title: 'Syarat & Ketentuan (Contoh Demonstrasi)',
        sections: [
          ['1. Status Prototype', 'Teks ini adalah contoh draf Syarat & Ketentuan untuk keperluan presentasi stakeholder dan belum merupakan dokumen legal mengikat.'],
          ['2. Aturan Produk, Jasa, dan Pelatihan', 'Harga transaksi dikunci saat checkout. Akses produk digital, antrean proyek jasa, dan konfirmasi kursi pelatihan aktif setelah proses verifikasi pembayaran simulasi oleh Admin.'],
          ['3. Larangan Transaksi Nyata', 'Jangan melakukan transfer uang sungguhan ke nomor rekening placeholder yang ditampilkan pada halaman pembayaran demo.']
        ]
      },
      refund: {
        title: 'Kebijakan Pengembalian Dana (Contoh Demonstrasi)',
        sections: [
          ['1. Catatan Kebijakan Contoh', 'Ketentuan di bawah ini adalah contoh ilustratif dan belum merupakan kebijakan hukum final untuk operasional komersial.'],
          ['2. Produk Digital', 'Produk digital yang telah dibuka akses unduhannya secara umum tidak dapat dibatalkan kecuali terjadi ketidaksesuaian file pada sistem.'],
          ['3. Jasa Digital & Pelatihan', 'Pembatalan jasa atau penjadwalan ulang sesi pelatihan tunduk pada status pengerjaan serta ketersediaan kuota sesi berikutnya.']
        ]
      }
    };
    const doc = map[kind] || map.privacy;
    return `
      <section class="section-sm">
        <div class="container" style="max-width:860px;">
          ${renderBreadcrumbs([{ label: doc.title }])}
          <div class="alert alert-warning mb-4">
            ${icon('alert-circle', 18)}
            <div><strong>Dokumen Contoh:</strong> Seluruh isi halaman ini merupakan teks contoh untuk demonstrasi prototype dan <strong>belum merupakan kebijakan hukum final</strong>.</div>
          </div>
          <div class="card card-lg card-body article-prose">
            <h1 class="text-h1 mb-4">${escapeHtml(doc.title)}</h1>
            ${doc.sections.map(([h, p]) => `<h2>${escapeHtml(h)}</h2><p>${escapeHtml(p)}</p>`).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderGlobalSearchPage(route) {
    const q = (route.params.get('q') || ui.searchQuery || '').trim();
    if (q) ui.searchQuery = q;
    const ql = q.toLowerCase();

    const prodRes = ql ? state.products.filter((p) => p.status === 'active' && (p.name.toLowerCase().includes(ql) || p.shortDesc.toLowerCase().includes(ql) || p.category.toLowerCase().includes(ql))) : [];
    const srvRes = ql ? state.services.filter((s) => s.name.toLowerCase().includes(ql) || s.shortDesc.toLowerCase().includes(ql)) : [];
    const trnRes = ql ? state.trainingPrograms.filter((t) => t.title.toLowerCase().includes(ql) || t.shortDesc.toLowerCase().includes(ql) || t.primaryLocation.toLowerCase().includes(ql)) : [];
    const artRes = ql ? state.articles.filter((a) => a.status === 'published' && (a.title.toLowerCase().includes(ql) || a.excerpt.toLowerCase().includes(ql))) : [];
    const total = prodRes.length + srvRes.length + trnRes.length + artRes.length;

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Hasil Pencarian Global' }])}
          <h1 class="text-h1 mb-2">Hasil Pencarian Global</h1>
          <form id="page-search-form" class="flex flex-wrap gap-2 mb-4" style="max-width:560px;">
            <input type="search" id="page-search-input" class="form-control" style="flex:1;" placeholder="Ketik kata kunci pencarian..." value="${escapeHtml(q)}">
            <button type="submit" class="btn btn-primary">${icon('search', 16)} Cari</button>
          </form>

          ${!ql ? `
            <div class="state-box"><h3 class="text-h4">Masukkan kata kunci pencarian</h3><p class="text-sm text-secondary mt-1">Cari produk digital, jasa kreatif, program pelatihan, atau artikel.</p></div>
          ` : total === 0 ? `
            <div class="state-box"><h3 class="text-h4">Tidak ada hasil untuk "${escapeHtml(q)}"</h3><p class="text-sm text-secondary mt-1">Coba kata kunci lain seperti "AI", "Website", "Template", atau "Barista".</p></div>
          ` : `
            <p class="text-sm text-secondary mb-4">Ditemukan <strong>${total}</strong> hasil untuk "<strong>${escapeHtml(q)}</strong>".</p>
            ${prodRes.length ? `<h2 class="text-h3 mb-3">Produk Digital (${prodRes.length})</h2><div class="grid-3 mb-6">${prodRes.map((p) => renderProductCard(p)).join('')}</div>` : ''}
            ${srvRes.length ? `<h2 class="text-h3 mb-3">Jasa Digital (${srvRes.length})</h2><div class="grid-3 mb-6">${srvRes.map((s) => renderServiceCard(s)).join('')}</div>` : ''}
            ${trnRes.length ? `<h2 class="text-h3 mb-3">Pelatihan (${trnRes.length})</h2><div class="grid-3 mb-6">${trnRes.map((t) => renderTrainingCard(t)).join('')}</div>` : ''}
            ${artRes.length ? `<h2 class="text-h3 mb-3">Artikel (${artRes.length})</h2><div class="grid-3">${artRes.map((a) => renderArticleCard(a)).join('')}</div>` : ''}
          `}
        </div>
      </section>
    `;
  }

  function render404Page() {
    return `
      <section class="section">
        <div class="container" style="max-width:640px;text-align:center;">
          <div class="card card-lg card-body" style="padding:48px 28px;">
            <span class="badge badge-primary" style="margin-inline:auto;">Error 404</span>
            <h1 class="text-display mt-3 text-primary-brand">404</h1>
            <h2 class="text-h2 mt-2">Halaman Tidak Ditemukan</h2>
            <p class="text-body text-secondary mt-2 mb-4">Rute yang Anda tuju tidak tersedia atau telah dipindahkan di dalam prototype NEXORA.</p>
            <div class="flex flex-wrap justify-center gap-2">
              <a href="#/" class="btn btn-primary">Kembali ke Beranda</a>
              <a href="#/produk" class="btn btn-secondary">Lihat Katalog Produk</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------------------
     12. AUTHENTICATION DEMO PAGES
     ------------------------------------------------------------------------ */
  function renderAuthPage(mode, route) {
    const redirect = route.params.get('redirect') || '';
    return `
      <section class="section">
        <div class="container" style="max-width:500px;">
          <div class="alert alert-info mb-4">
            ${icon('lock', 17)}
            <div class="text-caption"><strong>Simulasi Autentikasi Browser:</strong> Login ini hanya untuk demonstrasi peran dan tidak menyediakan keamanan produksi.</div>
          </div>

          <div class="card card-lg card-body">
            ${mode === 'login' ? `
              <h1 class="text-h2 mb-1">Masuk ke NEXORA</h1>
              <p class="text-sm text-secondary mb-4">Gunakan kredensial demo atau tombol masuk cepat di bawah.</p>
              <form id="auth-login-form" data-redirect="${escapeHtml(redirect)}">
                <div class="form-group">
                  <label class="form-label" for="lg-email">Email *</label>
                  <input type="email" id="lg-email" class="form-control" required value="pelanggan@example.com">
                </div>
                <div class="form-group">
                  <label class="form-label" for="lg-pass">Kata Sandi *</label>
                  <input type="password" id="lg-pass" class="form-control" required value="demo123">
                </div>
                <div class="flex justify-between items-center text-caption mb-4">
                  <a href="#/lupa-sandi" class="text-primary-brand font-semibold">Lupa kata sandi?</a>
                  <a href="#/daftar" class="text-primary-brand font-semibold">Daftar akun baru</a>
                </div>
                <button type="submit" class="btn btn-primary w-full">Masuk</button>
              </form>
              <hr style="border:none;border-top:1px solid var(--border);margin:20px 0;">
              <div class="text-caption font-bold text-muted mb-2">MASUK CEPAT AKUN DEMO</div>
              <div class="grid-2" style="gap:10px;">
                <button type="button" class="btn btn-outline btn-sm" id="quick-login-customer">${icon('user', 15)} Masuk Pelanggan</button>
                <button type="button" class="btn btn-secondary btn-sm" id="quick-login-admin">${icon('shield', 15)} Masuk Admin</button>
              </div>
              <div class="text-caption text-muted mt-3">
                Pelanggan: <code>pelanggan@example.com</code> / <code>demo123</code><br>
                Admin: <code>admin@example.com</code> / <code>demo123</code>
              </div>
            ` : mode === 'register' ? `
              <h1 class="text-h2 mb-1">Daftar Akun Demo</h1>
              <p class="text-sm text-secondary mb-4">Buat akun pelanggan simulasi baru yang tersimpan di LocalStorage.</p>
              <form id="auth-register-form">
                <div class="form-group"><label class="form-label" for="rg-name">Nama Lengkap *</label><input type="text" id="rg-name" class="form-control" required></div>
                <div class="form-group"><label class="form-label" for="rg-email">Email *</label><input type="email" id="rg-email" class="form-control" required></div>
                <div class="form-group"><label class="form-label" for="rg-phone">Nomor Telepon *</label><input type="text" id="rg-phone" class="form-control" required></div>
                <div class="form-group"><label class="form-label" for="rg-pass">Kata Sandi *</label><input type="password" id="rg-pass" class="form-control" required minlength="6"></div>
                <button type="submit" class="btn btn-primary w-full">Buat Akun & Lanjut Verifikasi</button>
              </form>
              <div class="text-sm text-center mt-4">Sudah punya akun? <a href="#/masuk" class="text-primary-brand font-semibold">Masuk</a></div>
            ` : mode === 'forgot' ? `
              <h1 class="text-h2 mb-1">Lupa Kata Sandi</h1>
              <p class="text-sm text-secondary mb-4">Simulasi permintaan tautan atur ulang kata sandi.</p>
              <form id="auth-forgot-form">
                <div class="form-group"><label class="form-label" for="fg-email">Email Terdaftar *</label><input type="email" id="fg-email" class="form-control" required value="pelanggan@example.com"></div>
                <button type="submit" class="btn btn-primary w-full">Kirim Tautan Reset Simulasi</button>
              </form>
              <div class="mt-3 text-sm"><a href="#/masuk" class="text-primary-brand font-semibold">Kembali ke halaman Masuk</a></div>
            ` : mode === 'reset' ? `
              <h1 class="text-h2 mb-1">Atur Ulang Kata Sandi</h1>
              <p class="text-sm text-secondary mb-4">Masukkan kata sandi baru untuk akun demo Anda.</p>
              <form id="auth-reset-form">
                <div class="form-group"><label class="form-label" for="rs-pass">Kata Sandi Baru *</label><input type="password" id="rs-pass" class="form-control" required minlength="6" value="demo123"></div>
                <button type="submit" class="btn btn-primary w-full">Simpan Kata Sandi Baru</button>
              </form>
            ` : `
              <h1 class="text-h2 mb-1">Verifikasi Akun Simulasi</h1>
              <p class="text-sm text-secondary mb-4">Klik tombol di bawah untuk menyimulasikan verifikasi email akun Anda.</p>
              <button type="button" class="btn btn-success w-full" id="verify-account-demo-btn">${icon('check-circle', 16)} Verifikasi Akun Sekarang</button>
            `}
          </div>
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------------------
     13. COMMERCE & MANUAL PAYMENT PAGES
     ------------------------------------------------------------------------ */
  function renderCartPage() {
    const rows = state.cart.map((c) => {
      const p = state.products.find((pr) => pr.id === c.productId);
      return p ? { ...c, product: p } : null;
    }).filter(Boolean);
    const selectedRows = rows.filter((r) => r.selected && r.product.status === 'active');
    const subtotal = selectedRows.reduce((s, r) => s + r.product.price * r.qty, 0);

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Keranjang Belanja' }])}
          <h1 class="text-h1 mb-4">Keranjang Belanja</h1>

          ${rows.length === 0 ? `
            <div class="state-box">
              <div class="state-icon">${icon('shopping-bag', 26)}</div>
              <h2 class="text-h3">Keranjang Belanja Kosong</h2>
              <p class="text-body text-secondary mt-1 mb-4">Tambahkan e-book, template, aplikasi, atau lisensi resmi dari katalog NEXORA.</p>
              <a href="#/produk" class="btn btn-primary">Jelajahi Produk Digital</a>
            </div>
          ` : `
            <div class="detail-layout">
              <div style="display:flex;flex-direction:column;gap:14px;">
                ${rows.map((r) => {
                  const archived = r.product.status !== 'active';
                  return `
                    <div class="card card-body flex flex-wrap items-center justify-between gap-4">
                      <div class="flex items-center gap-3" style="flex:1;min-width:240px;">
                        <input type="checkbox" ${r.selected && !archived ? 'checked' : ''} ${archived ? 'disabled' : ''} data-cart-toggle="${escapeHtml(r.id)}" style="width:18px;height:18px;accent-color:var(--primary);">
                        <img src="${r.product.thumbnail}" alt="${escapeHtml(r.product.name)}" style="width:88px;height:62px;object-fit:cover;border-radius:8px;border:1px solid var(--border);">
                        <div>
                          <a href="#/produk/detail/${escapeHtml(r.product.id)}" class="font-bold">${escapeHtml(r.product.name)}</a>
                          <div class="text-caption text-muted">${escapeHtml(r.product.category)} • ${escapeHtml(r.product.fileFormat)}</div>
                          <div class="font-bold text-primary-brand mt-1">${formatIDR(r.product.price)}</div>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        ${r.product.allowMultiUnit && !archived ? `
                          <div class="flex items-center gap-1">
                            <button type="button" class="icon-btn" style="width:32px;height:32px;" data-cart-qty="${escapeHtml(r.id)}" data-delta="-1">${icon('minus', 14)}</button>
                            <span class="font-bold" style="min-width:28px;text-align:center;">${r.qty}</span>
                            <button type="button" class="icon-btn" style="width:32px;height:32px;" data-cart-qty="${escapeHtml(r.id)}" data-delta="1">${icon('plus', 14)}</button>
                          </div>
                        ` : `<span class="badge badge-neutral">1 Lisensi</span>`}
                        <div class="font-bold tabular-nums" style="min-width:110px;text-align:right;">${formatIDR(r.product.price * r.qty)}</div>
                        <button type="button" class="btn btn-ghost btn-sm text-danger" data-cart-remove="${escapeHtml(r.id)}">${icon('trash', 16)}</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <aside class="sticky-panel">
                <div class="card card-lg card-body">
                  <h2 class="text-h4 mb-3">Ringkasan Keranjang</h2>
                  <div class="flex justify-between text-sm mb-2"><span class="text-muted">Item dipilih</span><strong>${selectedRows.length} produk</strong></div>
                  <div class="flex justify-between text-h3 mt-3 mb-4"><span>Subtotal</span><strong class="text-primary-brand tabular-nums">${formatIDR(subtotal)}</strong></div>
                  <button type="button" class="btn btn-primary btn-lg w-full" id="cart-proceed-checkout-btn" ${selectedRows.length === 0 ? 'disabled' : ''}>
                    Lanjut ke Checkout
                  </button>
                  <a href="#/produk" class="btn btn-secondary w-full mt-2">Tambah Produk Lain</a>
                </div>
              </aside>
            </div>
          `}
        </div>
      </section>
    `;
  }

  function renderCheckoutPage(route) {
    const qType = route.params.get('type');
    if (qType) ui.checkoutTab = qType;
    const tab = ui.checkoutTab;

    const selectedCart = state.cart
      .map((c) => ({ cart: c, product: state.products.find((p) => p.id === c.productId) }))
      .filter((x) => x.cart.selected && x.product && x.product.status === 'active');

    const subtotal = selectedCart.reduce((s, x) => s + x.product.price * x.cart.qty, 0);
    const couponInfo = calculateCouponDiscount(ui.appliedCouponCode, subtotal);
    const total = Math.max(0, subtotal - (couponInfo.valid ? couponInfo.discount : 0));
    const cust = state.currentRole === 'customer' && state.currentUser ? state.currentUser : state.customers[0];

    return `
      <section class="section-sm">
        <div class="container">
          ${renderBreadcrumbs([{ label: 'Keranjang', href: '#/keranjang' }, { label: 'Checkout' }])}
          <h1 class="text-h1 mb-2">Checkout Terpisah per Lini Bisnis</h1>
          <p class="text-body text-secondary mb-4">NEXORA memisahkan alur checkout Produk Digital, Jasa Digital, dan Pelatihan agar rincian pemenuhan tercatat jelas.</p>

          <div class="tabs-nav">
            <button type="button" class="tab-btn ${tab === 'product' ? 'active' : ''}" data-checkout-tab="product">Checkout Produk Digital</button>
            <button type="button" class="tab-btn ${tab === 'service' ? 'active' : ''}" data-checkout-tab="service">Checkout Jasa Digital</button>
            <button type="button" class="tab-btn ${tab === 'training' ? 'active' : ''}" data-checkout-tab="training">Checkout Pelatihan</button>
          </div>

          ${tab === 'product' ? (selectedCart.length === 0 ? `
            <div class="state-box">
              <h2 class="text-h4">Belum ada produk digital dipilih di keranjang</h2>
              <p class="text-sm text-secondary mt-1 mb-3">Pilih produk digital terlebih dahulu untuk menyelesaikan checkout produk.</p>
              <a href="#/produk" class="btn btn-primary btn-sm">Buka Katalog Produk</a>
            </div>
          ` : `
            <div class="detail-layout">
              <form id="checkout-product-form" class="card card-lg card-body">
                <h2 class="text-h3 mb-3">Informasi Pelanggan</h2>
                <div class="grid-2">
                  <div class="form-group"><label class="form-label" for="co-name">Nama Lengkap *</label><input type="text" id="co-name" class="form-control" required value="${escapeHtml(cust.name)}"></div>
                  <div class="form-group"><label class="form-label" for="co-email">Email Pengiriman Akses *</label><input type="email" id="co-email" class="form-control" required value="${escapeHtml(cust.email)}"></div>
                </div>
                <div class="form-group"><label class="form-label" for="co-phone">Nomor Telepon / WhatsApp *</label><input type="text" id="co-phone" class="form-control" required value="${escapeHtml(cust.phone)}"></div>

                <h3 class="text-h4 mt-4 mb-2">Kode Promo Simulasi</h3>
                <div class="flex gap-2 mb-3">
                  <input type="text" id="co-coupon-input" class="form-control" placeholder="Masukkan kode (misal: NEXORA10 atau HEMAT50K)" value="${escapeHtml(ui.appliedCouponCode)}">
                  <button type="button" class="btn btn-secondary" id="apply-coupon-btn">Terapkan</button>
                </div>
                ${ui.appliedCouponCode ? `<div class="text-caption ${couponInfo.valid ? 'text-success' : 'text-danger'} mb-3">${escapeHtml(couponInfo.message)}</div>` : ''}

                <label class="checkbox-row mb-4">
                  <input type="checkbox" id="co-terms" required checked>
                  <span>Saya menyetujui Syarat & Ketentuan (Contoh) serta memahami bahwa harga produk terkunci saat checkout.</span>
                </label>
                <button type="submit" class="btn btn-primary btn-lg w-full">Konfirmasi Checkout & Terbitkan Invoice</button>
              </form>

              <aside class="sticky-panel">
                <div class="card card-lg card-body">
                  <h2 class="text-h4 mb-3">Ringkasan Pesanan Produk</h2>
                  <div style="display:flex;flex-direction:column;gap:10px;">
                    ${selectedCart.map(({ cart, product }) => `
                      <div class="flex justify-between text-sm">
                        <span>${escapeHtml(product.name)} × ${cart.qty}</span>
                        <strong>${formatIDR(product.price * cart.qty)}</strong>
                      </div>
                    `).join('')}
                  </div>
                  <hr style="border:none;border-top:1px solid var(--border);margin:14px 0;">
                  <div class="flex justify-between text-sm mb-2"><span class="text-muted">Subtotal</span><span>${formatIDR(subtotal)}</span></div>
                  <div class="flex justify-between text-sm mb-2"><span class="text-muted">Diskon Simulasi</span><span class="text-success">-${formatIDR(couponInfo.valid ? couponInfo.discount : 0)}</span></div>
                  <div class="flex justify-between text-h3 mt-2"><span>Total Pembayaran</span><strong class="text-primary-brand tabular-nums">${formatIDR(total)}</strong></div>
                </div>
              </aside>
            </div>
          `) : tab === 'service' ? `
            <div class="card card-lg card-body">
              <h2 class="text-h3 mb-2">Checkout Jasa Digital</h2>
              <p class="text-body text-secondary mb-4">Pemesanan jasa memerlukan brief proyek (untuk Paket Tetap) atau persetujuan penawaran (untuk Jasa Custom).</p>
              <div class="flex flex-wrap gap-3">
                <a href="#/jasa" class="btn btn-primary">Pilih Paket Jasa Tetap</a>
                <a href="#/jasa/custom" class="btn btn-outline">Ajukan Penawaran Custom</a>
              </div>
            </div>
          ` : `
            <div class="card card-lg card-body">
              <h2 class="text-h3 mb-2">Checkout Pelatihan</h2>
              <p class="text-body text-secondary mb-4">Pendaftaran pelatihan memeriksa kuota sesi secara langsung dan melakukan reservasi kursi sementara.</p>
              <a href="#/pelatihan" class="btn btn-primary">Pilih Program & Sesi Pelatihan</a>
            </div>
          `}
        </div>
      </section>
    `;
  }

  function renderInvoicePage(invoiceId) {
    const inv = state.invoices.find((i) => i.id === invoiceId);
    if (!inv) return render404Page();
    const pay = state.payments.find((p) => p.invoiceId === inv.id);

    return `
      <section class="section-sm">
        <div class="container" style="max-width:860px;">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4 no-print">
            ${renderBreadcrumbs([{ label: 'Invoice', href: '#/akun/invoice' }, { label: inv.invoiceNo }])}
            <div class="flex gap-2">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.print()">${icon('printer', 15)} Cetak Invoice</button>
              ${pay ? `<a href="#/pembayaran/${escapeHtml(pay.id)}" class="btn btn-primary btn-sm">${icon('credit-card', 15)} Lihat / Bayar Transfer Demo</a>` : ''}
            </div>
          </div>

          <div class="card card-lg card-body" style="padding:36px;">
            <div class="flex flex-wrap justify-between items-start gap-4 mb-6" style="padding-bottom:20px;border-bottom:1px solid var(--border);">
              <div>
                <div class="brand-logo"><span class="brand-mark">${icon('layers', 18)}</span><span>NEXORA</span></div>
                <div class="text-caption text-muted mt-2">Dokumen Invoice Simulasi — Bukan Bukti Pajak/Transaksi Resmi</div>
              </div>
              <div style="text-align:right;">
                <span class="badge ${getStatusBadgeClass(inv.status)}">${escapeHtml(inv.status)}</span>
                <div class="text-h3 mt-2">${escapeHtml(inv.invoiceNo)}</div>
                <div class="text-caption text-muted">Order: ${escapeHtml(inv.orderNo)}</div>
                <div class="text-caption text-muted">Tanggal: ${formatDate(inv.issuedAt, true)}</div>
              </div>
            </div>

            <div class="grid-2 mb-6 text-sm">
              <div>
                <div class="text-caption text-muted font-bold">DITAGIHKAN KEPADA</div>
                <div class="font-bold mt-1">${escapeHtml(inv.customerName)}</div>
                <div class="text-secondary">${escapeHtml(inv.customerEmail)}</div>
                <div class="text-secondary">${escapeHtml(inv.customerPhone)}</div>
              </div>
              <div>
                <div class="text-caption text-muted font-bold">PENERIMA PEMBAYARAN DEMO</div>
                <div class="font-bold mt-1">${escapeHtml(state.settings.demoBank.accountHolder)}</div>
                <div class="text-secondary">${escapeHtml(state.settings.demoBank.bankName)}</div>
                <div class="text-secondary">${escapeHtml(state.settings.demoBank.accountNumber)}</div>
              </div>
            </div>

            <div class="table-responsive mb-4">
              <table class="data-table">
                <thead>
                  <tr><th>Deskripsi Item</th><th>Kategori</th><th>Harga Satuan</th><th>Qty</th><th style="text-align:right;">Subtotal</th></tr>
                </thead>
                <tbody>
                  ${inv.items.map((it) => `
                    <tr>
                      <td class="font-semibold">${escapeHtml(it.name)}</td>
                      <td>${escapeHtml(it.category)}</td>
                      <td>${formatIDR(it.unitPrice)}</td>
                      <td>${it.qty}</td>
                      <td style="text-align:right;" class="font-bold">${formatIDR(it.subtotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="max-width:340px;margin-left:auto;">
              <div class="flex justify-between text-sm mb-2"><span class="text-muted">Subtotal</span><span>${formatIDR(inv.subtotal)}</span></div>
              <div class="flex justify-between text-sm mb-2"><span class="text-muted">Diskon</span><span class="text-success">-${formatIDR(inv.discount || 0)}</span></div>
              <div class="flex justify-between text-h3 pt-2" style="border-top:1px solid var(--border);padding-top:10px;"><span>Total Tagihan</span><strong class="text-primary-brand tabular-nums">${formatIDR(inv.total)}</strong></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderPaymentPage(paymentId) {
    const pay = state.payments.find((p) => p.id === paymentId);
    if (!pay) return render404Page();
    const ord = state.orders.find((o) => o.id === pay.orderId);
    const canUpload = ['Menunggu Pembayaran', 'Pembayaran Ditolak'].includes(pay.status);

    return `
      <section class="section-sm">
        <div class="container" style="max-width:980px;">
          ${renderBreadcrumbs([{ label: 'Pembayaran', href: '#/akun/pembayaran' }, { label: pay.orderNo }])}

          <div class="alert alert-danger mb-4">
            ${icon('alert-circle', 20)}
            <div>
              <strong>REKENING DEMO — JANGAN MELAKUKAN TRANSFER SUNGGUHAN.</strong>
              <div class="text-caption mt-1">Halaman ini memperagakan instruksi transfer manual dan pengunggahan bukti pembayaran simulasi di browser.</div>
            </div>
          </div>

          <div class="detail-layout">
            <div>
              <div class="card card-lg card-body mb-4">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <div class="text-caption text-muted">Status Pembayaran Saat Ini</div>
                    <h1 class="text-h2">${escapeHtml(pay.orderNo)}</h1>
                  </div>
                  <span class="badge ${getStatusBadgeClass(pay.status)}" style="font-size:13px;padding:7px 14px;">${escapeHtml(pay.status)}</span>
                </div>

                ${pay.status === 'Menunggu Pembayaran' ? `
                  <div class="alert alert-warning mb-3">${icon('clock', 18)}<div>Silakan lakukan transfer simulasi sebelum <strong>${formatDate(pay.expiresAt, true)}</strong> lalu unggah bukti transfer di bawah.</div></div>
                ` : pay.status === 'Menunggu Verifikasi' ? `
                  <div class="alert alert-info mb-3">${icon('shield', 18)}<div><strong>Bukti sudah diterima.</strong> Unggahan bukti tidak otomatis menyetujui pembayaran. Silakan verifikasi melalui <strong>Dashboard Admin &gt; Verifikasi Pembayaran</strong>.</div></div>
                ` : pay.status === 'Pembayaran Ditolak' ? `
                  <div class="alert alert-danger mb-3">${icon('alert-circle', 18)}<div><strong>Pembayaran Ditolak:</strong> ${escapeHtml(pay.rejectionReason)}<br><span class="text-caption">Silakan unggah ulang bukti transfer yang benar di bawah ini.</span></div></div>
                ` : pay.status === 'Pembayaran Diverifikasi' ? `
                  <div class="alert alert-success mb-3">${icon('check-circle', 18)}<div><strong>Pembayaran Diverifikasi!</strong> Akses produk/layanan/pelatihan untuk pesanan ini sudah aktif.</div></div>
                ` : pay.status === 'Pembayaran Kedaluwarsa' ? `
                  <div class="alert alert-danger mb-3">${icon('clock', 18)}<div><strong>Pembayaran Kedaluwarsa.</strong> Batas waktu pembayaran telah lewat.</div></div>
                ` : `
                  <div class="alert alert-danger mb-3">${icon('x', 18)}<div><strong>Pesanan Dibatalkan.</strong> Transaksi ini tidak lagi diproses.</div></div>
                `}

                <h2 class="text-h4 mt-3 mb-2">Instruksi Transfer Manual (Demo)</h2>
                <div class="card card-body" style="background:var(--surface);">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-muted">Bank Tujuan</span>
                    <strong>${escapeHtml(state.settings.demoBank.bankName)}</strong>
                  </div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-muted">Nomor Rekening Demo</span>
                    <div class="flex items-center gap-2">
                      <code>${escapeHtml(state.settings.demoBank.accountNumber)}</code>
                      <button type="button" class="btn btn-secondary btn-sm" data-copy-text="${escapeHtml(state.settings.demoBank.accountNumber)}" data-copy-label="Nomor rekening demo">${icon('copy', 13)} Salin</button>
                    </div>
                  </div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-muted">Atas Nama</span>
                    <strong>${escapeHtml(state.settings.demoBank.accountHolder)}</strong>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-muted">Nominal Transfer</span>
                    <div class="flex items-center gap-2">
                      <strong class="text-h4 text-primary-brand">${formatIDR(pay.amount)}</strong>
                      <button type="button" class="btn btn-secondary btn-sm" data-copy-text="${pay.amount}" data-copy-label="Nominal transfer">${icon('copy', 13)} Salin</button>
                    </div>
                  </div>
                </div>

                <h3 class="text-h4 mt-4 mb-2">Panduan Pembayaran Singkat</h3>
                <ol class="text-sm text-secondary" style="padding-left:18px;list-style:decimal;display:flex;flex-direction:column;gap:4px;">
                  <li>Salin nomor rekening placeholder dan nominal tepat di atas.</li>
                  <li>Unggah tangkapan layar bukti transfer (JPG/PNG/WebP maks. 3 MB) atau gunakan tombol contoh bukti demo.</li>
                  <li>Masuk sebagai Admin melalui tombol <strong>Mode Demo</strong> untuk menyetujui atau menolak pembayaran ini.</li>
                </ol>
              </div>

              ${canUpload ? `
                <div class="card card-lg card-body">
                  <h2 class="text-h3 mb-2">${pay.status === 'Pembayaran Ditolak' ? 'Unggah Ulang Bukti Pembayaran' : 'Unggah Bukti Pembayaran'}</h2>
                  <div class="dropzone" id="payment-dropzone" tabindex="0" role="button" aria-label="Pilih atau seret gambar bukti pembayaran">
                    ${icon('upload', 28)}
                    <div class="font-bold mt-2">Seret file gambar ke sini atau klik untuk memilih</div>
                    <div class="text-caption text-muted mt-1">Format didukung: JPG, PNG, WebP (maks. 3 MB)</div>
                    <input type="file" id="payment-file-input" accept="image/png,image/jpeg,image/webp" style="display:none;">
                  </div>

                  <div class="flex flex-wrap gap-2 mt-3">
                    <button type="button" class="btn btn-outline btn-sm" id="use-sample-proof-btn">
                      ${icon('sparkles', 14)} Gunakan Contoh Bukti Transfer Demo
                    </button>
                  </div>

                  <div id="payment-preview-box" class="mt-4" style="display:${pay.proofImage ? 'block' : 'none'};">
                    <div class="text-caption font-bold mb-1">Preview Bukti Terpilih:</div>
                    <img id="payment-preview-img" src="${pay.proofImage || ''}" alt="Preview bukti transfer" style="max-height:240px;border-radius:10px;border:1px solid var(--border);">
                  </div>

                  <div class="form-group mt-4">
                    <label class="form-label" for="payment-note-input">Catatan Pelanggan (Opsional)</label>
                    <input type="text" id="payment-note-input" class="form-control" placeholder="Contoh: Transfer dari rekening demo a.n. Raka" value="${escapeHtml(pay.customerNote)}">
                  </div>

                  <button type="button" class="btn btn-primary btn-lg w-full" id="confirm-upload-proof-btn" data-payment-id="${escapeHtml(pay.id)}">
                    Konfirmasi Upload Bukti Pembayaran
                  </button>
                </div>
              ` : pay.proofImage ? `
                <div class="card card-body">
                  <h3 class="text-h4 mb-2">Bukti Pembayaran Terunggah</h3>
                  <img src="${pay.proofImage}" alt="Bukti pembayaran" style="max-height:260px;border-radius:10px;border:1px solid var(--border);">
                  ${pay.customerNote ? `<p class="text-sm text-secondary mt-2">Catatan: ${escapeHtml(pay.customerNote)}</p>` : ''}
                </div>
              ` : ''}
            </div>

            <aside class="sticky-panel">
              <div class="card card-lg card-body">
                <h3 class="text-h4 mb-3">Ringkasan Tagihan</h3>
                <div class="text-sm flex justify-between mb-2"><span class="text-muted">No. Invoice</span><a href="#/invoice/${escapeHtml(pay.invoiceId)}" class="text-primary-brand font-bold">${escapeHtml(pay.invoiceNo)}</a></div>
                <div class="text-sm flex justify-between mb-2"><span class="text-muted">Pelanggan</span><strong>${escapeHtml(pay.customerName)}</strong></div>
                <div class="text-sm flex justify-between mb-2"><span class="text-muted">Jenis</span><strong>${escapeHtml(pay.type)}</strong></div>
                ${ord ? `<div class="text-sm mt-2 mb-3 text-secondary">${escapeHtml(ord.summaryTitle)}</div>` : ''}
                <div class="flex justify-between text-h3 pt-2" style="border-top:1px solid var(--border);padding-top:12px;">
                  <span>Total</span>
                  <strong class="text-primary-brand">${formatIDR(pay.amount)}</strong>
                </div>
                <div class="mt-4 flex flex-wrap gap-2">
                  <a href="#/invoice/${escapeHtml(pay.invoiceId)}" class="btn btn-secondary btn-sm w-full">Lihat Invoice Lengkap</a>
                  ${pay.status === 'Pembayaran Diverifikasi' && pay.type === 'product' ? `<a href="#/akun/unduhan" class="btn btn-success btn-sm w-full">Buka Unduhan Digital</a>` : ''}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------------------
     14. CUSTOMER DASHBOARD (16 VIEWS)
     ------------------------------------------------------------------------ */
  function renderDashboardGuard(requiredRole) {
    const isCust = requiredRole === 'customer';
    return `
      <section class="section">
        <div class="container" style="max-width:540px;">
          <div class="card card-lg card-body" style="text-align:center;padding:36px;">
            <div class="state-icon">${icon(isCust ? 'user' : 'shield', 26)}</div>
            <h1 class="text-h2">${isCust ? 'Masuk ke Dashboard Pelanggan' : 'Akses Dashboard Admin'}</h1>
            <p class="text-body text-secondary mt-2 mb-4">
              ${isCust
                ? 'Silakan masuk menggunakan akun pelanggan demo untuk melihat pesanan, unduhan digital, proyek jasa, dan pelatihan Anda.'
                : 'Halaman ini khusus peran Admin Demo untuk mengelola katalog, verifikasi pembayaran, proyek jasa, dan laporan.'}
            </p>
            <div class="flex flex-wrap justify-center gap-2">
              <button type="button" class="btn btn-primary" data-demo-action="${isCust ? 'login-customer' : 'login-admin'}">
                Masuk Cepat sebagai ${isCust ? 'Pelanggan' : 'Admin'}
              </button>
              <a href="#/masuk" class="btn btn-secondary">Buka Halaman Masuk</a>
              <a href="#/" class="btn btn-ghost">Ke Website Publik</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderCustomerShell(route, contentHtml, pageTitle) {
    if (!state.currentUser || state.currentRole !== 'customer') {
      return renderPublicHeader(route) + `<main id="main-content">${renderDashboardGuard('customer')}</main>` + renderPublicFooter();
    }
    const p = route.path;
    const custId = state.currentUser.id;
    const unread = state.notifications.filter((n) => n.roleTarget === 'customer' && n.userId === custId && !n.read).length;

    const menu = [
      { href: '#/akun/dashboard', label: 'Ringkasan', ic: 'home' },
      { href: '#/akun/pesanan', label: 'Pesanan Saya', ic: 'shopping-bag' },
      { href: '#/akun/unduhan', label: 'Unduhan Digital', ic: 'download' },
      { href: '#/akun/proyek', label: 'Proyek Jasa', ic: 'briefcase' },
      { href: '#/akun/penawaran', label: 'Penawaran Custom', ic: 'sliders' },
      { href: '#/akun/pelatihan', label: 'Pelatihan Saya', ic: 'graduation-cap' },
      { href: '#/akun/invoice', label: 'Invoice', ic: 'file-text' },
      { href: '#/akun/pembayaran', label: 'Pembayaran', ic: 'credit-card' },
      { href: '#/akun/notifikasi', label: 'Notifikasi', ic: 'bell', badge: unread },
      { href: '#/akun/profil', label: 'Profil Saya', ic: 'user' },
      { href: '#/akun/pengaturan', label: 'Pengaturan Akun', ic: 'settings' },
      { href: '#/akun/bantuan', label: 'Bantuan', ic: 'help-circle' }
    ];

    return `
      <div class="demo-banner-strip no-print">MODE DEMO — Data simulasi, bukan transaksi nyata.</div>
      <div class="dashboard-shell ${ui.dashSidebarCollapsed ? 'collapsed' : ''}">
        <aside class="dash-sidebar ${ui.dashMobileOpen ? 'mobile-open' : ''} no-print" aria-label="Menu Dashboard Pelanggan">
          <div class="dash-sidebar-header">
            <a href="#/" class="brand-logo">
              <span class="brand-mark">${icon('layers', 18)}</span>
              <span class="brand-text-wrap"><span>NEXORA</span><span class="brand-sub">Panel Pelanggan</span></span>
            </a>
            <button type="button" class="icon-btn" id="toggle-dash-collapse" aria-label="Perkecil sidebar">${icon('menu', 17)}</button>
          </div>
          <div class="dash-nav-group" style="flex:1;">
            <div class="dash-nav-label">Menu Pelanggan</div>
            ${menu.map((m) => `
              <a href="${m.href}" class="dash-link ${p === m.href.slice(1) || (m.href !== '#/akun/dashboard' && p.startsWith(m.href.slice(1))) ? 'active' : ''}" data-close-dash-mobile>
                <span class="dash-link-main">${icon(m.ic, 16)}<span class="dash-link-text">${m.label}</span></span>
                ${m.badge ? `<span class="badge badge-primary dash-link-text">${m.badge}</span>` : ''}
              </a>
            `).join('')}
          </div>
          <div style="padding:12px;border-top:1px solid var(--border);">
            <a href="#/" class="dash-link">${icon('globe', 16)}<span class="dash-link-text">Website Publik</span></a>
            <button type="button" class="dash-link w-full text-danger" style="border:none;background:transparent;cursor:pointer;" data-action="logout">${icon('log-out', 16)}<span class="dash-link-text">Keluar</span></button>
          </div>
        </aside>

        <div class="dash-main">
          <header class="dash-topbar no-print">
            <div class="flex items-center gap-3">
              <button type="button" class="icon-btn dash-mobile-btn" id="open-dash-mobile" aria-label="Buka sidebar">${icon('menu', 18)}</button>
              <div>
                <div class="text-caption text-muted">Dashboard Pelanggan / ${escapeHtml(pageTitle)}</div>
                <div class="font-bold">${escapeHtml(pageTitle)}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="#/produk" class="btn btn-secondary btn-sm">Belanja Produk</a>
              <span class="badge badge-primary">${escapeHtml(state.currentUser.name)}</span>
            </div>
          </header>
          <main id="main-content" class="dash-content">${contentHtml}</main>
        </div>
      </div>
    `;
  }

  function renderCustomerPage(route) {
    if (!state.currentUser || state.currentRole !== 'customer') {
      return renderCustomerShell(route, '', 'Masuk');
    }
    const seg = route.segments[1] || 'dashboard';
    const subId = route.segments[2] || '';
    const custId = state.currentUser.id;
    const myOrders = state.orders.filter((o) => o.customerId === custId);
    const myPayments = state.payments.filter((p) => p.customerId === custId);
    const myInvoices = state.invoices.filter((i) => i.customerId === custId);
    const myProjects = state.projects.filter((p) => p.customerId === custId);
    const myQuotes = state.quotations.filter((q) => q.customerId === custId);
    const myReqs = state.customRequests.filter((r) => r.customerId === custId);
    const myEnrolls = state.enrollments.filter((e) => e.customerId === custId);

    // Collect unlocked digital downloads
    const unlockedDownloads = [];
    myOrders.filter((o) => o.type === 'product').forEach((ord) => {
      const pay = state.payments.find((p) => p.orderId === ord.id);
      if (pay && pay.status === 'Pembayaran Diverifikasi') {
        ord.items.forEach((it) => {
          const prod = state.products.find((pr) => pr.id === it.refId);
          unlockedDownloads.push({ ord, pay, item: it, prod });
        });
      }
    });

    if (seg === 'dashboard') {
      const activeOrders = myOrders.filter((o) => !['Selesai', 'Dibatalkan', 'Kedaluwarsa'].includes(o.status)).length;
      const runningProj = myProjects.filter((p) => p.status !== 'Selesai').length;
      const pendingVerify = myPayments.filter((p) => p.status === 'Menunggu Verifikasi').length;
      const myNotifs = state.notifications.filter((n) => n.roleTarget === 'customer' && n.userId === custId).slice(0, 5);
      const recs = state.products.filter((p) => p.status === 'active' && p.featured).slice(0, 3);

      return renderCustomerShell(route, `
        <div class="grid-4 mb-4" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">
          <div class="kpi-card"><div class="text-caption text-muted">Pesanan Aktif</div><div class="kpi-value text-primary-brand">${activeOrders}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Produk Tersedia Diunduh</div><div class="kpi-value text-success">${unlockedDownloads.length}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Proyek Jasa Berjalan</div><div class="kpi-value">${runningProj}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Pelatihan Terdaftar</div><div class="kpi-value">${myEnrolls.length}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Menunggu Verifikasi</div><div class="kpi-value text-warning">${pendingVerify}</div></div>
        </div>

        <div class="grid-2 mb-6">
          <div class="card card-body">
            <div class="flex justify-between items-center mb-3">
              <h2 class="text-h4">Aktivitas Terbaru</h2>
              <a href="#/akun/notifikasi" class="text-caption font-bold text-primary-brand">Semua Notifikasi</a>
            </div>
            ${myNotifs.length === 0 ? `<p class="text-sm text-muted">Belum ada aktivitas.</p>` : myNotifs.map((n) => `
              <a href="${escapeHtml(n.link)}" class="dropdown-item" style="padding:10px 0;">
                <span class="text-primary-brand">${icon('bell', 15)}</span>
                <div><div class="font-semibold text-sm">${escapeHtml(n.title)}</div><div class="text-caption text-muted">${escapeHtml(n.message)}</div></div>
              </a>
            `).join('')}
          </div>
          <div class="card card-body">
            <div class="flex justify-between items-center mb-3">
              <h2 class="text-h4">Pesanan Terakhir</h2>
              <a href="#/akun/pesanan" class="text-caption font-bold text-primary-brand">Lihat Semua</a>
            </div>
            ${myOrders.slice(0, 4).map((o) => `
              <div class="flex justify-between items-center py-2" style="padding:10px 0;border-bottom:1px solid var(--surface-alt);">
                <div>
                  <a href="#/akun/pesanan/${escapeHtml(o.id)}" class="font-bold text-sm text-primary-brand">${escapeHtml(o.orderNo)}</a>
                  <div class="text-caption text-muted">${escapeHtml(clampText(o.summaryTitle, 42))}</div>
                </div>
                <span class="badge ${getStatusBadgeClass(o.status)}">${escapeHtml(o.status)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <h2 class="text-h3 mb-3">Rekomendasi Produk untuk Anda</h2>
        <div class="grid-3">${recs.map((p) => renderProductCard(p)).join('')}</div>
      `, 'Ringkasan');
    }

    if (seg === 'pesanan' && subId) {
      const ord = myOrders.find((o) => o.id === subId);
      if (!ord) return renderCustomerShell(route, `<div class="state-box">Pesanan tidak ditemukan.</div>`, 'Detail Pesanan');
      const pay = state.payments.find((p) => p.orderId === ord.id);
      return renderCustomerShell(route, `
        <div class="mb-3"><a href="#/akun/pesanan" class="btn btn-secondary btn-sm">${icon('arrow-left', 14)} Kembali ke Pesanan</a></div>
        <div class="card card-lg card-body">
          <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div><h2 class="text-h2">${escapeHtml(ord.orderNo)}</h2><div class="text-sm text-muted">${formatDate(ord.createdAt, true)}</div></div>
            <span class="badge ${getStatusBadgeClass(pay ? pay.status : ord.status)}">${escapeHtml(pay ? pay.status : ord.status)}</span>
          </div>
          <div class="table-responsive mb-4">
            <table class="data-table">
              <thead><tr><th>Item</th><th>Kategori</th><th>Harga Snapshot</th><th>Qty</th><th>Subtotal</th></tr></thead>
              <tbody>
                ${ord.items.map((it) => `<tr><td class="font-semibold">${escapeHtml(it.name)}</td><td>${escapeHtml(it.category)}</td><td>${formatIDR(it.unitPrice)}</td><td>${it.qty}</td><td class="font-bold">${formatIDR(it.subtotal)}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="flex flex-wrap justify-between items-center gap-3">
            <div class="text-h4">Total: <strong class="text-primary-brand">${formatIDR(ord.total)}</strong></div>
            <div class="flex gap-2">
              <a href="#/invoice/${escapeHtml(ord.invoiceId)}" class="btn btn-secondary btn-sm">Lihat Invoice</a>
              ${pay ? `<a href="#/pembayaran/${escapeHtml(pay.id)}" class="btn btn-primary btn-sm">Detail / Unggah Bukti Pembayaran</a>` : ''}
            </div>
          </div>
        </div>
      `, `Detail ${ord.orderNo}`);
    }

    if (seg === 'pesanan') {
      return renderCustomerShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>No. Pesanan</th><th>Tanggal</th><th>Ringkasan</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${myOrders.length === 0 ? `<tr><td colspan="6" style="text-align:center;">Belum ada pesanan.</td></tr>` : myOrders.map((o) => {
                const pay = state.payments.find((p) => p.orderId === o.id);
                return `
                  <tr>
                    <td class="font-bold">${escapeHtml(o.orderNo)}</td>
                    <td>${formatDate(o.createdAt)}</td>
                    <td>${escapeHtml(clampText(o.summaryTitle, 45))}</td>
                    <td class="font-bold">${formatIDR(o.total)}</td>
                    <td><span class="badge ${getStatusBadgeClass(pay ? pay.status : o.status)}">${escapeHtml(pay ? pay.status : o.status)}</span></td>
                    <td class="flex gap-1">
                      <a href="#/akun/pesanan/${escapeHtml(o.id)}" class="btn btn-secondary btn-sm">Detail</a>
                      ${pay ? `<a href="#/pembayaran/${escapeHtml(pay.id)}" class="btn btn-outline btn-sm">Bayar</a>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `, 'Pesanan Saya');
    }

    if (seg === 'unduhan') {
      return renderCustomerShell(route, `
        <div class="alert alert-info mb-4">
          ${icon('download', 18)}
          <div>Produk digital hanya dapat diunduh setelah pembayaran berstatus <strong>Pembayaran Diverifikasi</strong> oleh Admin.</div>
        </div>
        ${unlockedDownloads.length === 0 ? `
          <div class="state-box">
            <h3 class="text-h4">Belum ada produk siap unduh</h3>
            <p class="text-sm text-secondary mt-1 mb-3">Selesaikan pembelian produk digital dan lakukan verifikasi pembayaran melalui Admin Demo.</p>
            <a href="#/produk" class="btn btn-primary btn-sm">Jelajahi Produk Digital</a>
          </div>
        ` : `
          <div class="grid-2">
            ${unlockedDownloads.map(({ ord, item, prod }) => `
              <div class="card card-body flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span class="badge badge-success">Terverifikasi</span>
                  <h3 class="text-h4 mt-2">${escapeHtml(item.name)}</h3>
                  <div class="text-caption text-muted">Order ${escapeHtml(ord.orderNo)} • ${prod ? escapeHtml(prod.fileFormat) : 'Paket Digital'}</div>
                </div>
                <button type="button" class="btn btn-primary btn-sm" data-download-blob="${escapeHtml(ord.id)}" data-product-id="${escapeHtml(item.refId)}">
                  ${icon('download', 15)} Unduh File (.txt)
                </button>
              </div>
            `).join('')}
          </div>
        `}
      `, 'Unduhan Digital');
    }

    if (seg === 'proyek' && subId) {
      const prj = myProjects.find((x) => x.id === subId);
      if (!prj) return renderCustomerShell(route, `<div class="state-box">Proyek tidak ditemukan.</div>`, 'Detail Proyek');
      return renderCustomerShell(route, `
        <div class="mb-3"><a href="#/akun/proyek" class="btn btn-secondary btn-sm">${icon('arrow-left', 14)} Kembali ke Proyek</a></div>
        <div class="detail-layout">
          <div class="card card-lg card-body">
            <div class="flex flex-wrap justify-between items-center gap-2 mb-3">
              <span class="badge ${getStatusBadgeClass(prj.status)}">${escapeHtml(prj.status)}</span>
              <span class="text-caption text-muted">Order: ${escapeHtml(prj.orderNo)}</span>
            </div>
            <h2 class="text-h2">${escapeHtml(prj.title)}</h2>
            <p class="text-sm text-primary-brand font-semibold mt-1">${escapeHtml(prj.serviceName)}</p>
            <div class="mt-4">
              <div class="flex justify-between text-sm mb-1"><span>Progres Pengerjaan</span><strong>${prj.progress}%</strong></div>
              <div class="progress-track"><div class="progress-fill" style="width:${prj.progress}%;"></div></div>
            </div>
            <h3 class="text-h4 mt-4 mb-2">Brief Proyek</h3>
            <p class="text-sm text-secondary" style="white-space:pre-line;">${escapeHtml(prj.brief)}</p>
            <h3 class="text-h4 mt-4 mb-2">Deliverable</h3>
            <ul style="display:flex;flex-direction:column;gap:6px;">
              ${prj.deliverables.map((d) => `<li class="flex items-center gap-2 text-sm"><span class="text-success">${icon('check', 15)}</span><span>${escapeHtml(d)}</span></li>`).join('')}
            </ul>
            <div class="alert alert-info mt-4 text-sm">${icon('file-text', 17)}<div><strong>Catatan Hasil Contoh:</strong> ${escapeHtml(prj.sampleOutputNote)}</div></div>

            ${['Menunggu Review', 'Dalam Pengerjaan'].includes(prj.status) ? `
              <form id="customer-revision-form" class="mt-4 pt-3" style="border-top:1px solid var(--border);padding-top:16px;" data-project-id="${escapeHtml(prj.id)}">
                <label class="form-label" for="cust-rev-note">Ajukan Catatan Revisi (Simulasi)</label>
                <div class="flex gap-2">
                  <input type="text" id="cust-rev-note" class="form-control" required placeholder="Tuliskan poin revisi yang diinginkan...">
                  <button type="submit" class="btn btn-outline">Kirim Revisi</button>
                </div>
              </form>
            ` : ''}
          </div>
          <div class="card card-body">
            <h3 class="text-h4 mb-3">Timeline Proyek</h3>
            <div class="timeline">
              ${prj.timeline.map((t) => `
                <div class="timeline-item">
                  <span class="timeline-dot"></span>
                  <div class="font-semibold text-sm">${escapeHtml(t.title)}</div>
                  <div class="text-caption text-muted">${formatDate(t.date, true)} • ${escapeHtml(t.by)}</div>
                </div>
              `).join('')}
            </div>
            <h3 class="text-h4 mt-4 mb-2">Riwayat Revisi (${prj.revisionHistory.length})</h3>
            ${prj.revisionHistory.length === 0 ? `<p class="text-caption text-muted">Belum ada catatan revisi.</p>` : prj.revisionHistory.map((r) => `
              <div class="card card-body mb-2" style="padding:10px;background:var(--surface);">
                <div class="text-sm">${escapeHtml(r.note)}</div>
                <div class="text-caption text-muted mt-1">${formatDate(r.date, true)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `, prj.title);
    }

    if (seg === 'proyek') {
      return renderCustomerShell(route, `
        <div class="grid-2">
          ${myProjects.length === 0 ? `<div class="state-box">Belum ada proyek jasa.</div>` : myProjects.map((prj) => `
            <div class="card card-body">
              <div class="flex justify-between items-center mb-2">
                <span class="badge ${getStatusBadgeClass(prj.status)}">${escapeHtml(prj.status)}</span>
                <span class="text-caption text-muted">${escapeHtml(prj.orderNo)}</span>
              </div>
              <h3 class="text-h4">${escapeHtml(prj.title)}</h3>
              <p class="text-caption text-secondary mt-1">${escapeHtml(prj.serviceName)}</p>
              <div class="mt-3">
                <div class="flex justify-between text-caption mb-1"><span>Progres</span><strong>${prj.progress}%</strong></div>
                <div class="progress-track"><div class="progress-fill" style="width:${prj.progress}%;"></div></div>
              </div>
              <a href="#/akun/proyek/${escapeHtml(prj.id)}" class="btn btn-outline btn-sm mt-3">Detail & Timeline</a>
            </div>
          `).join('')}
        </div>
      `, 'Proyek Jasa');
    }

    if (seg === 'penawaran' && subId) {
      const quo = myQuotes.find((q) => q.id === subId);
      if (!quo) return renderCustomerShell(route, `<div class="state-box">Penawaran tidak ditemukan.</div>`, 'Detail Penawaran');
      const req = state.customRequests.find((r) => r.id === quo.requestId);
      const isExpired = new Date(quo.validUntil).getTime() < Date.now() || quo.status === 'Kedaluwarsa';
      const canRespond = quo.status === 'Dikirim' && !isExpired;
      return renderCustomerShell(route, `
        <div class="mb-3"><a href="#/akun/penawaran" class="btn btn-secondary btn-sm">${icon('arrow-left', 14)} Kembali</a></div>
        <div class="card card-lg card-body">
          <div class="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div>
              <span class="badge badge-neutral">Versi ${quo.version}</span>
              <h2 class="text-h2 mt-1">${escapeHtml(quo.quotationNo)} — ${escapeHtml(quo.title)}</h2>
            </div>
            <span class="badge ${getStatusBadgeClass(isExpired && quo.status === 'Dikirim' ? 'Kedaluwarsa' : quo.status)}">${escapeHtml(isExpired && quo.status === 'Dikirim' ? 'Kedaluwarsa' : quo.status)}</span>
          </div>
          ${req ? `<p class="text-caption text-muted mb-3">Dari Permintaan: ${escapeHtml(req.requestNo)} (${escapeHtml(req.serviceType)})</p>` : ''}
          <div class="grid-3 mb-4">
            <div class="card card-body" style="background:var(--surface);"><div class="text-caption text-muted">Nilai Penawaran</div><div class="text-h3 text-primary-brand">${formatIDR(quo.price)}</div></div>
            <div class="card card-body" style="background:var(--surface);"><div class="text-caption text-muted">Estimasi Pengerjaan</div><div class="text-h3">${quo.estimatedDays} hari kerja</div></div>
            <div class="card card-body" style="background:var(--surface);"><div class="text-caption text-muted">Berlaku Hingga</div><div class="text-h4">${formatDate(quo.validUntil)}</div></div>
          </div>
          <h3 class="text-h4 mb-2">Ruang Lingkup Pekerjaan</h3>
          <p class="text-sm text-secondary mb-3">${escapeHtml(quo.scope)}</p>
          <h3 class="text-h4 mb-2">Deliverable</h3>
          <ul class="mb-4">${quo.deliverables.map((d) => `<li class="text-sm text-secondary">• ${escapeHtml(d)}</li>`).join('')}</ul>
          ${isExpired ? `<div class="alert alert-danger mb-3">${icon('clock', 17)}<div>Masa berlaku penawaran ini telah habis dan tidak dapat disetujui tanpa pembaruan versi oleh Admin.</div></div>` : ''}
          ${canRespond ? `
            <div class="flex flex-wrap gap-3">
              <button type="button" class="btn btn-success" data-quote-respond="${escapeHtml(quo.id)}" data-accept="true">${icon('check-circle', 16)} Setujui Penawaran & Buat Invoice</button>
              <button type="button" class="btn btn-danger" data-quote-respond="${escapeHtml(quo.id)}" data-accept="false">${icon('x', 16)} Tolak Penawaran</button>
            </div>
          ` : quo.orderId ? `
            <a href="#/akun/pesanan/${escapeHtml(quo.orderId)}" class="btn btn-primary btn-sm">Lihat Pesanan & Invoice Terkait</a>
          ` : ''}
        </div>
      `, quo.quotationNo);
    }

    if (seg === 'penawaran') {
      return renderCustomerShell(route, `
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-h3">Penawaran Custom & Permintaan Saya</h2>
          <a href="#/jasa/custom" class="btn btn-primary btn-sm">Ajukan Permintaan Baru</a>
        </div>
        <h3 class="text-h4 mb-2">Penawaran Harga dari Admin (${myQuotes.length})</h3>
        <div class="grid-2 mb-6">
          ${myQuotes.map((q) => {
            const exp = new Date(q.validUntil).getTime() < Date.now() && q.status === 'Dikirim';
            return `
              <div class="card card-body">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-bold text-primary-brand">${escapeHtml(q.quotationNo)} (v${q.version})</span>
                  <span class="badge ${getStatusBadgeClass(exp ? 'Kedaluwarsa' : q.status)}">${escapeHtml(exp ? 'Kedaluwarsa' : q.status)}</span>
                </div>
                <h4 class="text-h4">${escapeHtml(q.title)}</h4>
                <div class="text-h3 mt-2">${formatIDR(q.price)}</div>
                <div class="text-caption text-muted mt-1">Berlaku s/d ${formatDate(q.validUntil)}</div>
                <a href="#/akun/penawaran/${escapeHtml(q.id)}" class="btn btn-outline btn-sm mt-3">Buka Detail Penawaran</a>
              </div>
            `;
          }).join('')}
        </div>
        <h3 class="text-h4 mb-2">Riwayat Pengajuan Kebutuhan (${myReqs.length})</h3>
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>No. Permintaan</th><th>Proyek</th><th>Jasa</th><th>Anggaran</th><th>Status</th></tr></thead>
            <tbody>
              ${myReqs.map((r) => `<tr><td class="font-bold">${escapeHtml(r.requestNo)}</td><td>${escapeHtml(r.projectTitle)}</td><td>${escapeHtml(r.serviceType)}</td><td>${escapeHtml(r.budgetRange)}</td><td><span class="badge ${getStatusBadgeClass(r.status)}">${escapeHtml(r.status)}</span></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      `, 'Penawaran Custom');
    }

    if (seg === 'pelatihan' && subId) {
      const enr = myEnrolls.find((e) => e.id === subId);
      if (!enr) return renderCustomerShell(route, `<div class="state-box">Pendaftaran tidak ditemukan.</div>`, 'Detail Pendaftaran');
      const ses = state.trainingSessions.find((s) => s.id === enr.sessionId);
      const prog = state.trainingPrograms.find((p) => p.id === enr.programId);
      const pay = state.payments.find((p) => p.orderId === enr.orderId);
      return renderCustomerShell(route, `
        <div class="mb-3"><a href="#/akun/pelatihan" class="btn btn-secondary btn-sm">${icon('arrow-left', 14)} Kembali</a></div>
        <div class="card card-lg card-body">
          <div class="flex flex-wrap justify-between items-center gap-2 mb-3">
            <h2 class="text-h2">${escapeHtml(prog ? prog.title : 'Pelatihan')}</h2>
            <span class="badge ${getStatusBadgeClass(enr.status)}">${escapeHtml(enr.status)}</span>
          </div>
          <p class="text-sm text-primary-brand font-semibold mb-3">${escapeHtml(ses ? ses.title : '')}</p>
          <div class="grid-2 text-sm mb-4">
            <div><span class="text-muted">Peserta:</span> <strong>${escapeHtml(enr.participantName)} (${enr.seats} kursi)</strong></div>
            <div><span class="text-muted">Kontak:</span> <strong>${escapeHtml(enr.participantEmail)} • ${escapeHtml(enr.participantPhone)}</strong></div>
            <div><span class="text-muted">Jadwal:</span> <strong>${ses ? `${formatDate(ses.date)} (${ses.timeLabel})` : '-'}</strong></div>
            <div><span class="text-muted">Lokasi:</span> <strong>${escapeHtml(ses ? ses.location : '-')}</strong></div>
          </div>
          ${pay ? `<a href="#/pembayaran/${escapeHtml(pay.id)}" class="btn btn-primary btn-sm">Lihat Status Pembayaran (${escapeHtml(pay.status)})</a>` : ''}
        </div>
      `, 'Detail Pendaftaran');
    }

    if (seg === 'pelatihan') {
      return renderCustomerShell(route, `
        <div class="grid-2">
          ${myEnrolls.length === 0 ? `<div class="state-box">Belum ada pendaftaran pelatihan.</div>` : myEnrolls.map((e) => {
            const prog = state.trainingPrograms.find((p) => p.id === e.programId);
            const ses = state.trainingSessions.find((s) => s.id === e.sessionId);
            return `
              <div class="card card-body">
                <div class="flex justify-between items-center mb-2">
                  <span class="badge ${getStatusBadgeClass(e.status)}">${escapeHtml(e.status)}</span>
                  <span class="badge ${getStatusBadgeClass(e.paymentStatus)}">${escapeHtml(e.paymentStatus)}</span>
                </div>
                <h3 class="text-h4">${escapeHtml(prog ? prog.title : 'Program')}</h3>
                <div class="text-sm text-secondary mt-1">${escapeHtml(ses ? ses.title : '')}</div>
                <div class="text-caption text-muted mt-1">${ses ? `${formatDate(ses.date)} • ${escapeHtml(ses.location)}` : ''}</div>
                <div class="text-caption mt-2">Peserta: <strong>${escapeHtml(e.participantName)}</strong> (${e.seats} kursi)</div>
                <a href="#/akun/pelatihan/${escapeHtml(e.id)}" class="btn btn-outline btn-sm mt-3">Detail Pendaftaran</a>
              </div>
            `;
          }).join('')}
        </div>
      `, 'Pelatihan Saya');
    }

    if (seg === 'invoice') {
      return renderCustomerShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>No. Invoice</th><th>No. Pesanan</th><th>Tanggal</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${myInvoices.map((inv) => `
                <tr>
                  <td class="font-bold">${escapeHtml(inv.invoiceNo)}</td>
                  <td>${escapeHtml(inv.orderNo)}</td>
                  <td>${formatDate(inv.issuedAt)}</td>
                  <td class="font-bold">${formatIDR(inv.total)}</td>
                  <td><span class="badge ${getStatusBadgeClass(inv.status)}">${escapeHtml(inv.status)}</span></td>
                  <td><a href="#/invoice/${escapeHtml(inv.id)}" class="btn btn-secondary btn-sm">Buka & Cetak</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Invoice Saya');
    }

    if (seg === 'pembayaran') {
      return renderCustomerShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>No. Pesanan</th><th>Jenis</th><th>Nominal</th><th>Status Pembayaran</th><th>Catatan / Alasan</th><th>Aksi</th></tr></thead>
            <tbody>
              ${myPayments.map((pay) => `
                <tr>
                  <td class="font-bold">${escapeHtml(pay.orderNo)}</td>
                  <td>${escapeHtml(pay.type)}</td>
                  <td class="font-bold">${formatIDR(pay.amount)}</td>
                  <td><span class="badge ${getStatusBadgeClass(pay.status)}">${escapeHtml(pay.status)}</span></td>
                  <td class="text-caption">${pay.rejectionReason ? `<span class="text-danger">${escapeHtml(pay.rejectionReason)}</span>` : escapeHtml(pay.customerNote || '-')}</td>
                  <td><a href="#/pembayaran/${escapeHtml(pay.id)}" class="btn btn-primary btn-sm">${pay.status === 'Pembayaran Ditolak' ? 'Unggah Ulang' : 'Detail'}</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Pembayaran');
    }

    if (seg === 'notifikasi') {
      const notifs = state.notifications.filter((n) => n.roleTarget === 'customer' && n.userId === custId);
      return renderCustomerShell(route, `
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-h3">Notifikasi (${notifs.length})</h2>
          <button type="button" class="btn btn-secondary btn-sm" id="mark-all-read-btn">Tandai Semua Dibaca</button>
        </div>
        <div class="card">
          ${notifs.map((n) => `
            <a href="${escapeHtml(n.link)}" class="dropdown-item ${n.read ? '' : 'unread'}" data-read-notif="${escapeHtml(n.id)}">
              <span class="text-primary-brand">${icon('bell', 16)}</span>
              <div style="flex:1;">
                <div class="font-bold">${escapeHtml(n.title)}</div>
                <div class="text-sm text-secondary">${escapeHtml(n.message)}</div>
                <div class="text-caption text-muted mt-1">${formatDate(n.createdAt, true)}</div>
              </div>
            </a>
          `).join('')}
        </div>
      `, 'Notifikasi');
    }

    if (seg === 'profil') {
      return renderCustomerShell(route, `
        <form id="customer-profile-form" class="card card-lg card-body" style="max-width:680px;">
          <h2 class="text-h3 mb-3">Profil Pelanggan</h2>
          <div class="form-group"><label class="form-label" for="prof-name">Nama Lengkap *</label><input type="text" id="prof-name" class="form-control" required value="${escapeHtml(state.currentUser.name)}"></div>
          <div class="form-group"><label class="form-label" for="prof-email">Email *</label><input type="email" id="prof-email" class="form-control" required value="${escapeHtml(state.currentUser.email)}"></div>
          <div class="form-group"><label class="form-label" for="prof-phone">Nomor Telepon *</label><input type="text" id="prof-phone" class="form-control" required value="${escapeHtml(state.currentUser.phone || '')}"></div>
          <div class="form-group"><label class="form-label" for="prof-company">Instansi / Usaha (Opsional)</label><input type="text" id="prof-company" class="form-control" value="${escapeHtml(state.currentUser.company || '')}"></div>
          <button type="submit" class="btn btn-primary">Simpan Perubahan Profil</button>
        </form>
      `, 'Profil Saya');
    }

    if (seg === 'pengaturan') {
      const custRecord = state.customers.find((c) => c.id === custId);
      const prefs = custRecord?.preferences || { emailNotif: true, newsletter: true };
      return renderCustomerShell(route, `
        <form id="customer-prefs-form" class="card card-lg card-body" style="max-width:680px;">
          <h2 class="text-h3 mb-3">Pengaturan Preferensi Simulasi</h2>
          <label class="checkbox-row mb-3"><input type="checkbox" id="pref-email" ${prefs.emailNotif ? 'checked' : ''}><span>Terima notifikasi status pembayaran & proyek (simulasi)</span></label>
          <label class="checkbox-row mb-4"><input type="checkbox" id="pref-news" ${prefs.newsletter ? 'checked' : ''}><span>Berlangganan informasi pelatihan & produk terbaru</span></label>
          <button type="submit" class="btn btn-primary">Simpan Preferensi</button>
        </form>
      `, 'Pengaturan Akun');
    }

    // seg === 'bantuan'
    return renderCustomerShell(route, `
      <div class="card card-lg card-body">
        <h2 class="text-h3 mb-2">Bantuan Pelanggan</h2>
        <p class="text-sm text-secondary mb-4">Lihat panduan alur transaksi simulasi atau ajukan pertanyaan melalui Pusat Bantuan.</p>
        <div class="flex flex-wrap gap-2">
          <a href="#/bantuan" class="btn btn-primary btn-sm">Buka Pusat Bantuan</a>
          <a href="#/kontak" class="btn btn-secondary btn-sm">Hubungi Tim Demo</a>
        </div>
      </div>
    `, 'Bantuan');
  }

  /* ------------------------------------------------------------------------
     15. ADMIN DASHBOARD (OVERVIEW + COMMERCE + SERVICES + ACADEMY + CMS + MGMT)
     ------------------------------------------------------------------------ */
  function renderAdminShell(route, contentHtml, pageTitle) {
    if (!state.currentUser || state.currentRole !== 'admin') {
      return renderPublicHeader(route) + `<main id="main-content">${renderDashboardGuard('admin')}</main>` + renderPublicFooter();
    }
    const p = route.path;
    const pendingVerifyCount = state.payments.filter((x) => x.status === 'Menunggu Verifikasi').length;
    const unreadNotifs = state.notifications.filter((n) => n.roleTarget === 'admin' && !n.read);

    const groups = [
      {
        label: 'Overview',
        items: [
          ['#/admin/dashboard', 'Dashboard', 'bar-chart'],
          ['#/admin/aktivitas', 'Aktivitas Terbaru', 'clock']
        ]
      },
      {
        label: 'Commerce',
        items: [
          ['#/admin/produk', 'Produk Digital', 'layers'],
          ['#/admin/kategori-produk', 'Kategori Produk', 'folder'],
          ['#/admin/pesanan', 'Pesanan', 'shopping-bag'],
          ['#/admin/invoice', 'Invoice', 'file-text'],
          ['#/admin/pembayaran', 'Verifikasi Pembayaran', 'credit-card', pendingVerifyCount],
          ['#/admin/kupon', 'Kupon & Promosi', 'tag']
        ]
      },
      {
        label: 'Services',
        items: [
          ['#/admin/jasa', 'Jasa Digital', 'briefcase'],
          ['#/admin/paket-jasa', 'Paket Jasa', 'sliders'],
          ['#/admin/permintaan-custom', 'Permintaan Custom', 'mail'],
          ['#/admin/penawaran', 'Penawaran Harga', 'file-text'],
          ['#/admin/proyek', 'Proyek Jasa', 'zap']
        ]
      },
      {
        label: 'Academy',
        items: [
          ['#/admin/pelatihan', 'Program Pelatihan', 'graduation-cap'],
          ['#/admin/sesi-pelatihan', 'Jadwal & Sesi', 'calendar'],
          ['#/admin/lokasi-pelatihan', 'Lokasi Pelatihan', 'map-pin'],
          ['#/admin/pendaftaran-pelatihan', 'Pendaftaran', 'check-circle'],
          ['#/admin/peserta-pelatihan', 'Peserta', 'users']
        ]
      },
      {
        label: 'Marketing & Content',
        items: [
          ['#/admin/artikel', 'Artikel', 'file-text'],
          ['#/admin/kategori-artikel', 'Kategori Artikel', 'tag'],
          ['#/admin/banner', 'Banner', 'layout'],
          ['#/admin/portofolio', 'Portofolio', 'image'],
          ['#/admin/media', 'Media Library', 'folder'],
          ['#/admin/newsletter', 'Newsletter', 'mail']
        ]
      },
      {
        label: 'Management',
        items: [
          ['#/admin/pelanggan', 'Pelanggan', 'users'],
          ['#/admin/pengguna-admin', 'Pengguna Admin', 'shield'],
          ['#/admin/role', 'Role & Permission', 'lock'],
          ['#/admin/laporan', 'Laporan & CSV', 'bar-chart'],
          ['#/admin/audit-log', 'Audit Log', 'list'],
          ['#/admin/pengaturan', 'Pengaturan Website', 'settings']
        ]
      }
    ];

    return `
      <div class="demo-banner-strip no-print">MODE DEMO — Data simulasi, bukan transaksi nyata.</div>
      <div class="dashboard-shell ${ui.dashSidebarCollapsed ? 'collapsed' : ''}">
        <aside class="dash-sidebar ${ui.dashMobileOpen ? 'mobile-open' : ''} no-print" aria-label="Menu Admin NEXORA">
          <div class="dash-sidebar-header">
            <a href="#/admin/dashboard" class="brand-logo">
              <span class="brand-mark">${icon('shield', 18)}</span>
              <span class="brand-text-wrap"><span>NEXORA</span><span class="brand-sub">Admin Console</span></span>
            </a>
            <button type="button" class="icon-btn" id="toggle-dash-collapse" aria-label="Perkecil sidebar">${icon('menu', 17)}</button>
          </div>
          <div style="flex:1;overflow-y:auto;">
            ${groups.map((g) => `
              <div class="dash-nav-group">
                <div class="dash-nav-label">${g.label}</div>
                ${g.items.map(([href, label, ic, badge]) => `
                  <a href="${href}" class="dash-link ${p === href.slice(1) ? 'active' : ''}" data-close-dash-mobile>
                    <span class="dash-link-main">${icon(ic, 15)}<span class="dash-link-text">${label}</span></span>
                    ${badge ? `<span class="badge badge-warning dash-link-text">${badge}</span>` : ''}
                  </a>
                `).join('')}
              </div>
            `).join('')}
          </div>
          <div style="padding:12px;border-top:1px solid var(--border);">
            <a href="#/" class="dash-link">${icon('globe', 15)}<span class="dash-link-text">Website Publik</span></a>
            <button type="button" class="dash-link w-full text-danger" style="border:none;background:transparent;cursor:pointer;" data-action="logout">${icon('log-out', 15)}<span class="dash-link-text">Keluar</span></button>
          </div>
        </aside>

        <div class="dash-main">
          <header class="dash-topbar no-print">
            <div class="flex items-center gap-3">
              <button type="button" class="icon-btn dash-mobile-btn" id="open-dash-mobile" aria-label="Buka sidebar">${icon('menu', 18)}</button>
              <div>
                <div class="text-caption text-muted">Admin / ${escapeHtml(pageTitle)}</div>
                <div class="font-bold">${escapeHtml(pageTitle)}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="dropdown-wrap">
                <button type="button" class="icon-btn" id="notif-toggle-btn" aria-label="Notifikasi Admin">
                  ${icon('bell', 18)}
                  ${unreadNotifs.length > 0 ? `<span class="count-badge">${unreadNotifs.length}</span>` : ''}
                </button>
                ${ui.notifDropdownOpen ? `
                  <div class="dropdown-panel">
                    <div class="dropdown-header">
                      <span>Notifikasi Admin (${unreadNotifs.length} baru)</span>
                      <button type="button" class="btn btn-ghost btn-sm" id="mark-all-read-btn">Tandai Dibaca</button>
                    </div>
                    <div class="dropdown-list">
                      ${state.notifications.filter((n) => n.roleTarget === 'admin').slice(0, 6).map((n) => `
                        <a href="${escapeHtml(n.link)}" class="dropdown-item ${n.read ? '' : 'unread'}" data-read-notif="${escapeHtml(n.id)}">
                          <span class="text-primary-brand">${icon('bell', 14)}</span>
                          <div><div class="font-semibold">${escapeHtml(n.title)}</div><div class="text-caption text-secondary">${escapeHtml(n.message)}</div></div>
                        </a>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
              <span class="badge badge-primary">${escapeHtml(state.currentUser.name)}</span>
            </div>
          </header>
          <main id="main-content" class="dash-content">${contentHtml}</main>
        </div>
      </div>
    `;
  }

  function renderAdminOverviewCharts(stats) {
    const maxCat = Math.max(1, stats.revByCategory.product, stats.revByCategory.service, stats.revByCategory.training);
    const maxTopProd = Math.max(1, ...(stats.topProducts.map((x) => x[1])));
    const maxTrn = Math.max(1, ...(stats.trainingRank.map((x) => x.count)));

    // Simple SVG trend line across 6 sample simulation periods derived from current verified revenue
    const base = Math.max(1000000, Math.round(stats.verifiedRevenue / 4));
    const trendPts = [0.45, 0.62, 0.58, 0.78, 0.91, 1.0].map((m, idx) => ({
      label: ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'][idx],
      val: Math.round(base * m)
    }));
    const maxTrend = Math.max(...trendPts.map((p) => p.val));
    const polyPoints = trendPts.map((p, i) => `${36 + i * 76},${135 - Math.round((p.val / maxTrend) * 95)}`).join(' ');

    return `
      <div class="grid-2 mb-6">
        <div class="chart-card">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-h4">Tren Pendapatan Terverifikasi</h3>
            <span class="badge badge-neutral">Data Simulasi</span>
          </div>
          <svg viewBox="0 0 460 170" width="100%" height="170" role="img" aria-label="Grafik tren pendapatan simulasi">
            <line x1="26" y1="135" x2="440" y2="135" stroke="#DCE4EF" stroke-width="1"/>
            <line x1="26" y1="85" x2="440" y2="85" stroke="#EEF3FA" stroke-width="1"/>
            <line x1="26" y1="35" x2="440" y2="35" stroke="#EEF3FA" stroke-width="1"/>
            <polyline fill="none" stroke="#245BDB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${polyPoints}"/>
            ${trendPts.map((pt, i) => {
              const x = 36 + i * 76;
              const y = 135 - Math.round((pt.val / maxTrend) * 95);
              return `<circle cx="${x}" cy="${y}" r="5" fill="#FFFFFF" stroke="#245BDB" stroke-width="2.5"/><text x="${x}" y="156" text-anchor="middle" font-size="11" fill="#718096">${pt.label}</text>`;
            }).join('')}
          </svg>
        </div>

        <div class="chart-card">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-h4">Pendapatan per Kategori Bisnis</h3>
            <span class="badge badge-neutral">Data Simulasi</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px;">
            ${[
              ['Produk Digital', stats.revByCategory.product, 'var(--primary)'],
              ['Jasa Digital', stats.revByCategory.service, 'var(--accent)'],
              ['Pelatihan', stats.revByCategory.training, 'var(--success)']
            ].map(([label, val, color]) => `
              <div>
                <div class="flex justify-between text-sm mb-1"><span>${label}</span><strong>${formatIDR(val)}</strong></div>
                <div class="progress-track"><div class="progress-fill" style="width:${Math.round((val / maxCat) * 100)}%;background:${color};"></div></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="grid-3 mb-6">
        <div class="chart-card">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-h4">Status Pembayaran</h3>
            <span class="badge badge-neutral">Simulasi</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${Object.entries(stats.statusCounts).map(([st, cnt]) => `
              <div class="flex justify-between items-center text-sm">
                <span class="badge ${getStatusBadgeClass(st)}">${escapeHtml(st)}</span>
                <strong class="tabular-nums">${cnt}</strong>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="chart-card">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-h4">Produk Terpopuler</h3>
            <span class="badge badge-neutral">Simulasi</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${stats.topProducts.map(([name, qty]) => `
              <div>
                <div class="flex justify-between text-caption mb-1"><span>${escapeHtml(clampText(name, 26))}</span><strong>${qty} terjual</strong></div>
                <div class="progress-track"><div class="progress-fill" style="width:${Math.round((qty / maxTopProd) * 100)}%;"></div></div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="chart-card">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-h4">Peserta per Pelatihan</h3>
            <span class="badge badge-neutral">Simulasi</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${stats.trainingRank.slice(0, 5).map((tr) => `
              <div>
                <div class="flex justify-between text-caption mb-1"><span>${escapeHtml(clampText(tr.title, 26))}</span><strong>${tr.count} peserta</strong></div>
                <div class="progress-track"><div class="progress-fill" style="width:${Math.round((tr.count / maxTrn) * 100)}%;background:var(--success);"></div></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminPage(route) {
    if (!state.currentUser || state.currentRole !== 'admin') {
      return renderAdminShell(route, '', 'Admin');
    }
    const seg = route.segments[1] || 'dashboard';
    const stats = computeAnalytics();

    if (seg === 'dashboard') {
      return renderAdminShell(route, `
        <div class="alert alert-info mb-4">
          ${icon('bar-chart', 18)}
          <div>Seluruh angka pendapatan, metrik pesanan, dan grafik di bawah merupakan <strong>data simulasi demonstrasi</strong> yang diperbarui langsung dari state transaksi browser.</div>
        </div>
        <div class="grid-4 mb-6" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));">
          <div class="kpi-card"><div class="text-caption text-muted">Pendapatan Terverifikasi (Simulasi)</div><div class="kpi-value text-success">${formatIDR(stats.verifiedRevenue)}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Total Pesanan</div><div class="kpi-value">${stats.totalOrders}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Pelanggan</div><div class="kpi-value">${stats.totalCustomers}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Produk Aktif</div><div class="kpi-value">${stats.activeProducts}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Menunggu Verifikasi</div><div class="kpi-value text-warning">${stats.pendingVerificationCount}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Proyek Berjalan</div><div class="kpi-value text-primary-brand">${stats.runningProjects}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Peserta Pelatihan</div><div class="kpi-value">${stats.totalParticipants}</div></div>
        </div>

        ${renderAdminOverviewCharts(stats)}

        <div class="card card-body">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-h4">Pembayaran Menunggu Verifikasi Terbaru</h2>
            <a href="#/admin/pembayaran" class="btn btn-primary btn-sm">Kelola Verifikasi (${stats.pendingVerificationCount})</a>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th>No. Pesanan</th><th>Pelanggan</th><th>Jenis</th><th>Nominal</th><th>Aksi</th></tr></thead>
              <tbody>
                ${state.payments.filter((p) => p.status === 'Menunggu Verifikasi').slice(0, 5).map((p) => `
                  <tr>
                    <td class="font-bold">${escapeHtml(p.orderNo)}</td>
                    <td>${escapeHtml(p.customerName)}</td>
                    <td>${escapeHtml(p.type)}</td>
                    <td class="font-bold">${formatIDR(p.amount)}</td>
                    <td><button type="button" class="btn btn-primary btn-sm" data-admin-inspect-pay="${escapeHtml(p.id)}">Tinjau Bukti</button></td>
                  </tr>
                `).join('') || '<tr><td colspan="5">Tidak ada pembayaran menunggu verifikasi.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `, 'Dashboard Overview');
    }

    if (seg === 'aktivitas') {
      return renderAdminShell(route, `
        <div class="grid-2">
          <div class="card card-body">
            <h2 class="text-h4 mb-3">Aktivitas Audit Terbaru</h2>
            ${state.auditLogs.slice(0, 10).map((a) => `
              <div style="padding:10px 0;border-bottom:1px solid var(--surface-alt);">
                <div class="flex justify-between text-sm"><strong>${escapeHtml(a.action)}</strong><span class="text-caption text-muted">${formatDate(a.createdAt, true)}</span></div>
                <div class="text-caption text-secondary">${escapeHtml(a.detail)} (${escapeHtml(a.actor)})</div>
              </div>
            `).join('')}
          </div>
          <div class="card card-body">
            <h2 class="text-h4 mb-3">Tiket Bantuan & Pesan Masuk (${state.settings.cms.supportTickets.length})</h2>
            ${state.settings.cms.supportTickets.map((t) => `
              <div class="card card-body mb-2" style="background:var(--surface);">
                <div class="flex justify-between text-sm"><strong>${escapeHtml(t.name)} (${escapeHtml(t.topic)})</strong><span class="badge badge-success">${escapeHtml(t.status)}</span></div>
                <p class="text-sm text-secondary mt-1">${escapeHtml(t.message)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `, 'Aktivitas Terbaru');
    }

    if (seg === 'produk') {
      const f = ui.adminFilters;
      let list = state.products.filter((p) => {
        if (f.productSearch && !p.name.toLowerCase().includes(f.productSearch.toLowerCase())) return false;
        if (f.productCat !== 'all' && p.category !== f.productCat) return false;
        if (f.productStatus !== 'all' && p.status !== f.productStatus) return false;
        return true;
      });
      if (f.productSort === 'price-asc') list.sort((a, b) => a.price - b.price);
      else if (f.productSort === 'price-desc') list.sort((a, b) => b.price - a.price);
      else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const perPage = 8;
      const totalPages = Math.max(1, Math.ceil(list.length / perPage));
      const page = Math.min(f.productPage, totalPages);
      const paged = list.slice((page - 1) * perPage, page * perPage);

      return renderAdminShell(route, `
        <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div class="flex flex-wrap gap-2">
            <input type="search" id="adm-prod-search" class="form-control" style="width:220px;" placeholder="Cari produk..." value="${escapeHtml(f.productSearch)}">
            <select id="adm-prod-cat" class="form-select" style="width:180px;">
              <option value="all">Semua Kategori</option>
              ${state.categories.map((c) => `<option value="${escapeHtml(c.name)}" ${f.productCat === c.name ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
            </select>
            <select id="adm-prod-status" class="form-select" style="width:150px;">
              <option value="all">Semua Status</option>
              <option value="active" ${f.productStatus === 'active' ? 'selected' : ''}>Aktif</option>
              <option value="archived" ${f.productStatus === 'archived' ? 'selected' : ''}>Diarsipkan</option>
            </select>
          </div>
          <button type="button" class="btn btn-primary" id="adm-add-product-btn">${icon('plus', 16)} Tambah Produk</button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Produk</th><th>Kategori</th><th>Harga Katalog</th><th>Format</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${paged.map((p) => `
                <tr>
                  <td>
                    <div class="flex items-center gap-2">
                      <img src="${p.thumbnail}" alt="${escapeHtml(p.name)}" style="width:48px;height:34px;border-radius:6px;object-fit:cover;">
                      <div><div class="font-bold">${escapeHtml(p.name)}</div><div class="text-caption text-muted">${escapeHtml(p.id)}</div></div>
                    </div>
                  </td>
                  <td>${escapeHtml(p.category)}</td>
                  <td class="font-bold">${formatIDR(p.price)}</td>
                  <td>${escapeHtml(p.fileFormat)}</td>
                  <td><span class="badge ${getStatusBadgeClass(p.status)}">${p.status === 'active' ? 'Aktif' : 'Diarsipkan'}</span></td>
                  <td>
                    <div class="flex gap-1">
                      <a href="#/produk/detail/${escapeHtml(p.id)}" class="btn btn-ghost btn-sm" title="Lihat">${icon('eye', 15)}</a>
                      <button type="button" class="btn btn-secondary btn-sm" data-adm-edit-product="${escapeHtml(p.id)}">${icon('edit', 14)} Edit</button>
                      <button type="button" class="btn ${p.status === 'active' ? 'btn-outline' : 'btn-success'} btn-sm" data-adm-toggle-product="${escapeHtml(p.id)}">
                        ${p.status === 'active' ? 'Arsipkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${renderPagination(page, totalPages, 'data-adm-prod-page')}
      `, 'Manajemen Produk Digital');
    }

    if (seg === 'kategori-produk') {
      return renderAdminShell(route, `
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-h3">Kategori Produk (${state.categories.length})</h2>
          <button type="button" class="btn btn-primary btn-sm" id="adm-add-cat-btn">${icon('plus', 15)} Tambah Kategori</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Nama Kategori</th><th>Deskripsi</th><th>Jumlah Produk</th></tr></thead>
            <tbody>
              ${state.categories.map((c) => `
                <tr>
                  <td class="font-bold">${escapeHtml(c.name)}</td>
                  <td>${escapeHtml(c.description)}</td>
                  <td>${state.products.filter((p) => p.category === c.name).length} produk</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Kategori Produk');
    }

    if (seg === 'pesanan') {
      const f = ui.adminFilters;
      const list = state.orders.filter((o) => f.orderType === 'all' || o.type === f.orderType);
      return renderAdminShell(route, `
        <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div class="tabs-nav" style="border:none;margin:0;padding:0;">
            ${[['all', 'Semua'], ['product', 'Produk Digital'], ['service', 'Jasa Digital'], ['training', 'Pelatihan']].map(([v, l]) => `
              <button type="button" class="tab-btn ${f.orderType === v ? 'active' : ''}" data-adm-order-type="${v}">${l}</button>
            `).join('')}
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="export-csv-btn">${icon('download', 15)} Ekspor CSV</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>No. Pesanan</th><th>Pelanggan</th><th>Jenis</th><th>Ringkasan Item</th><th>Total (Snapshot)</th><th>Status Bayar</th><th>Aksi</th></tr></thead>
            <tbody>
              ${list.map((o) => {
                const pay = state.payments.find((p) => p.orderId === o.id);
                return `
                  <tr>
                    <td class="font-bold">${escapeHtml(o.orderNo)}</td>
                    <td>${escapeHtml(o.customerName)}</td>
                    <td><span class="badge badge-neutral">${escapeHtml(o.type)}</span></td>
                    <td>${escapeHtml(clampText(o.summaryTitle, 40))}</td>
                    <td class="font-bold">${formatIDR(o.total)}</td>
                    <td><span class="badge ${getStatusBadgeClass(pay ? pay.status : o.status)}">${escapeHtml(pay ? pay.status : o.status)}</span></td>
                    <td class="flex gap-1">
                      <a href="#/invoice/${escapeHtml(o.invoiceId)}" class="btn btn-secondary btn-sm">Invoice</a>
                      ${pay ? `<button type="button" class="btn btn-outline btn-sm" data-admin-inspect-pay="${escapeHtml(pay.id)}">Pembayaran</button>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `, 'Pesanan');
    }

    if (seg === 'invoice') {
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>No. Invoice</th><th>No. Pesanan</th><th>Pelanggan</th><th>Tanggal</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${state.invoices.map((inv) => `
                <tr>
                  <td class="font-bold">${escapeHtml(inv.invoiceNo)}</td>
                  <td>${escapeHtml(inv.orderNo)}</td>
                  <td>${escapeHtml(inv.customerName)}</td>
                  <td>${formatDate(inv.issuedAt)}</td>
                  <td class="font-bold">${formatIDR(inv.total)}</td>
                  <td><span class="badge ${getStatusBadgeClass(inv.status)}">${escapeHtml(inv.status)}</span></td>
                  <td><a href="#/invoice/${escapeHtml(inv.id)}" class="btn btn-secondary btn-sm">Buka Invoice</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Invoice');
    }

    if (seg === 'pembayaran') {
      const f = ui.adminFilters.paymentStatus;
      const list = state.payments.filter((p) => f === 'all' || p.status === f);
      const statuses = ['all', 'Menunggu Verifikasi', 'Menunggu Pembayaran', 'Pembayaran Diverifikasi', 'Pembayaran Ditolak', 'Pembayaran Kedaluwarsa', 'Pesanan Dibatalkan'];

      return renderAdminShell(route, `
        <div class="tabs-nav">
          ${statuses.map((st) => `
            <button type="button" class="tab-btn ${f === st ? 'active' : ''}" data-adm-pay-filter="${escapeHtml(st)}">
              ${st === 'all' ? `Semua (${state.payments.length})` : `${escapeHtml(st)} (${state.payments.filter((x) => x.status === st).length})`}
            </button>
          `).join('')}
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>No. Pesanan</th><th>Pelanggan</th><th>Jenis</th><th>Nominal</th><th>Tanggal</th><th>Bukti</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${list.map((p) => `
                <tr>
                  <td class="font-bold">${escapeHtml(p.orderNo)}</td>
                  <td>${escapeHtml(p.customerName)}</td>
                  <td>${escapeHtml(p.type)}</td>
                  <td class="font-bold">${formatIDR(p.amount)}</td>
                  <td>${formatDate(p.submittedAt || p.createdAt)}</td>
                  <td>${p.proofImage ? `<button type="button" class="btn btn-ghost btn-sm text-primary-brand" data-admin-inspect-pay="${escapeHtml(p.id)}">${icon('eye', 14)} Lihat Bukti</button>` : '<span class="text-muted">Belum ada</span>'}</td>
                  <td><span class="badge ${getStatusBadgeClass(p.status)}">${escapeHtml(p.status)}</span></td>
                  <td>
                    <button type="button" class="btn btn-primary btn-sm" data-admin-inspect-pay="${escapeHtml(p.id)}">
                      ${p.status === 'Menunggu Verifikasi' ? 'Verifikasi / Tolak' : 'Detail'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Verifikasi Pembayaran');
    }

    if (seg === 'kupon') {
      const coupons = state.settings.cms.coupons;
      return renderAdminShell(route, `
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-h3">Kupon & Promosi Simulasi</h2>
          <button type="button" class="btn btn-primary btn-sm" id="adm-add-coupon-btn">${icon('plus', 15)} Tambah Kupon</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Kode</th><th>Tipe</th><th>Nilai</th><th>Min. Belanja</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${coupons.map((c) => `
                <tr>
                  <td><strong><code>${escapeHtml(c.code)}</code></strong></td>
                  <td>${c.type === 'percent' ? 'Persentase' : 'Nominal Tetap'}</td>
                  <td>${c.type === 'percent' ? `${c.value}%` : formatIDR(c.value)}</td>
                  <td>${formatIDR(c.minSpend)}</td>
                  <td><span class="badge ${c.active ? 'badge-success' : 'badge-neutral'}">${c.active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td><button type="button" class="btn btn-secondary btn-sm" data-adm-toggle-coupon="${escapeHtml(c.id)}">${c.active ? 'Nonaktifkan' : 'Aktifkan'}</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Kupon & Promosi');
    }

    if (seg === 'jasa') {
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Jasa Digital</th><th>Kategori</th><th>Harga Mulai</th><th>Estimasi</th><th>Aksi</th></tr></thead>
            <tbody>
              ${state.services.map((s) => `
                <tr>
                  <td class="font-bold">${escapeHtml(s.name)}</td>
                  <td>${escapeHtml(s.category)}</td>
                  <td class="font-bold">${formatIDR(s.startingPrice)}</td>
                  <td>${escapeHtml(s.estimateLabel)}</td>
                  <td><button type="button" class="btn btn-secondary btn-sm" data-adm-edit-service="${escapeHtml(s.id)}">Edit Jasa</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Manajemen Jasa Digital');
    }

    if (seg === 'paket-jasa') {
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Nama Paket</th><th>Tier</th><th>Harga</th><th>Estimasi</th><th>Revisi</th><th>Aksi</th></tr></thead>
            <tbody>
              ${state.servicePackages.map((pk) => `
                <tr>
                  <td class="font-bold">${escapeHtml(pk.name)}</td>
                  <td><span class="badge badge-primary">${escapeHtml(pk.tier)}</span></td>
                  <td class="font-bold">${formatIDR(pk.price)}</td>
                  <td>${pk.estimatedDays} hari kerja</td>
                  <td>${pk.revisions}x</td>
                  <td><button type="button" class="btn btn-secondary btn-sm" data-adm-edit-pkg="${escapeHtml(pk.id)}">Ubah Harga/Revisi</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Paket Jasa');
    }

    if (seg === 'permintaan-custom') {
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>No.</th><th>Pelanggan</th><th>Proyek</th><th>Jasa & Anggaran</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${state.customRequests.map((r) => `
                <tr>
                  <td class="font-bold">${escapeHtml(r.requestNo)}</td>
                  <td>${escapeHtml(r.customerName)}<div class="text-caption text-muted">${escapeHtml(r.customerEmail)}</div></td>
                  <td><div class="font-semibold">${escapeHtml(r.projectTitle)}</div><div class="text-caption text-secondary">${escapeHtml(clampText(r.description, 60))}</div></td>
                  <td><div>${escapeHtml(r.serviceType)}</div><div class="text-caption text-muted">${escapeHtml(r.budgetRange)}</div></td>
                  <td><span class="badge ${getStatusBadgeClass(r.status)}">${escapeHtml(r.status)}</span></td>
                  <td><button type="button" class="btn btn-primary btn-sm" data-adm-create-quote="${escapeHtml(r.id)}">Buat Penawaran</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Permintaan Custom');
    }

    if (seg === 'penawaran') {
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>No. Penawaran</th><th>Pelanggan</th><th>Judul</th><th>Versi</th><th>Harga</th><th>Berlaku s/d</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${state.quotations.map((q) => `
                <tr>
                  <td class="font-bold">${escapeHtml(q.quotationNo)}</td>
                  <td>${escapeHtml(q.customerName)}</td>
                  <td>${escapeHtml(q.title)}</td>
                  <td>v${q.version}</td>
                  <td class="font-bold">${formatIDR(q.price)}</td>
                  <td>${formatDate(q.validUntil)}</td>
                  <td><span class="badge ${getStatusBadgeClass(q.status)}">${escapeHtml(q.status)}</span></td>
                  <td><button type="button" class="btn btn-secondary btn-sm" data-adm-revise-quote="${escapeHtml(q.id)}">Revisi Penawaran</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Penawaran Harga');
    }

    if (seg === 'proyek') {
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Proyek</th><th>Pelanggan</th><th>Status</th><th>Progres</th><th>Aksi</th></tr></thead>
            <tbody>
              ${state.projects.map((prj) => `
                <tr>
                  <td><div class="font-bold">${escapeHtml(prj.title)}</div><div class="text-caption text-muted">${escapeHtml(prj.orderNo)} • ${escapeHtml(prj.serviceName)}</div></td>
                  <td>${escapeHtml(prj.customerName)}</td>
                  <td><span class="badge ${getStatusBadgeClass(prj.status)}">${escapeHtml(prj.status)}</span></td>
                  <td><div class="font-bold text-sm">${prj.progress}%</div></td>
                  <td><button type="button" class="btn btn-primary btn-sm" data-adm-edit-project="${escapeHtml(prj.id)}">Update Status & Progres</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Proyek Jasa');
    }

    if (seg === 'pelatihan') {
      return renderAdminShell(route, `
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-h3">Program Pelatihan (${state.trainingPrograms.length})</h2>
          <button type="button" class="btn btn-primary btn-sm" id="adm-add-program-btn">${icon('plus', 15)} Tambah Program</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Program</th><th>Kategori</th><th>Mode</th><th>Lokasi</th><th>Harga</th><th>Aksi</th></tr></thead>
            <tbody>
              ${state.trainingPrograms.map((p) => `
                <tr>
                  <td class="font-bold">${escapeHtml(p.title)}</td>
                  <td>${escapeHtml(p.category)}</td>
                  <td><span class="badge badge-accent">${escapeHtml(p.mode)}</span></td>
                  <td>${escapeHtml(p.primaryLocation)}</td>
                  <td class="font-bold">${formatIDR(p.price)}</td>
                  <td><button type="button" class="btn btn-secondary btn-sm" data-adm-edit-program="${escapeHtml(p.id)}">Edit</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Program Pelatihan');
    }

    if (seg === 'sesi-pelatihan') {
      return renderAdminShell(route, `
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-h3">Jadwal & Sesi Pelatihan (${state.trainingSessions.length})</h2>
          <button type="button" class="btn btn-primary btn-sm" id="adm-add-session-btn">${icon('plus', 15)} Tambah Sesi</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Sesi</th><th>Program</th><th>Tanggal</th><th>Lokasi</th><th>Kuota / Terisi</th><th>Aksi</th></tr></thead>
            <tbody>
              ${state.trainingSessions.map((s) => {
                const prog = state.trainingPrograms.find((p) => p.id === s.programId);
                const avail = getSessionAvailability(s);
                return `
                  <tr>
                    <td class="font-bold">${escapeHtml(s.title)}</td>
                    <td>${escapeHtml(prog ? prog.title : '-')}</td>
                    <td>${formatDate(s.date)}</td>
                    <td>${escapeHtml(s.location)}</td>
                    <td><span class="badge ${avail.isFull ? 'badge-danger' : 'badge-success'}">${avail.used} / ${s.quota} (Sisa ${avail.remaining})</span></td>
                    <td><button type="button" class="btn btn-secondary btn-sm" data-adm-edit-session="${escapeHtml(s.id)}">Ubah Kuota</button></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `, 'Jadwal & Sesi');
    }

    if (seg === 'lokasi-pelatihan') {
      return renderAdminShell(route, `
        <div class="grid-3">
          ${state.settings.cms.locations.map((loc) => `
            <div class="card card-body">
              <span class="badge badge-primary">${escapeHtml(loc.type)}</span>
              <h3 class="text-h4 mt-2">${escapeHtml(loc.name)}</h3>
              <p class="text-sm text-secondary mt-1">${escapeHtml(loc.address)}</p>
              <div class="text-caption text-muted mt-2">Kapasitas contoh: ${loc.capacity} peserta</div>
            </div>
          `).join('')}
        </div>
      `, 'Lokasi Pelatihan');
    }

    if (seg === 'pendaftaran-pelatihan' || seg === 'peserta-pelatihan') {
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Peserta</th><th>Program & Sesi</th><th>Kursi</th><th>Status Bayar</th><th>Status Daftar</th><th>Aksi</th></tr></thead>
            <tbody>
              ${state.enrollments.map((e) => {
                const prog = state.trainingPrograms.find((p) => p.id === e.programId);
                const ses = state.trainingSessions.find((s) => s.id === e.sessionId);
                return `
                  <tr>
                    <td><div class="font-bold">${escapeHtml(e.participantName)}</div><div class="text-caption text-muted">${escapeHtml(e.participantEmail)}</div></td>
                    <td><div class="font-semibold">${escapeHtml(prog ? prog.title : '-')}</div><div class="text-caption text-muted">${escapeHtml(ses ? ses.title : '')}</div></td>
                    <td>${e.seats}</td>
                    <td><span class="badge ${getStatusBadgeClass(e.paymentStatus)}">${escapeHtml(e.paymentStatus)}</span></td>
                    <td><span class="badge ${getStatusBadgeClass(e.status)}">${escapeHtml(e.status)}</span></td>
                    <td class="flex gap-1">
                      ${e.status === 'Reservasi Sementara' ? `<button type="button" class="btn btn-outline btn-sm" data-adm-release-enroll="${escapeHtml(e.id)}">Lepas Kuota</button>` : ''}
                      ${e.status === 'Reservasi Sementara' || e.status === 'Perlu Penjadwalan Ulang' ? `<button type="button" class="btn btn-success btn-sm" data-adm-confirm-enroll="${escapeHtml(e.id)}">Konfirmasi</button>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `, seg === 'peserta-pelatihan' ? 'Daftar Peserta Pelatihan' : 'Pendaftaran Pelatihan');
    }

    if (seg === 'artikel') {
      return renderAdminShell(route, `
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-h3">Manajemen Artikel (${state.articles.length})</h2>
          <button type="button" class="btn btn-primary btn-sm" id="adm-add-article-btn">${icon('plus', 15)} Tambah Artikel</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Judul</th><th>Kategori</th><th>Penulis Contoh</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${state.articles.map((a) => `
                <tr>
                  <td class="font-bold">${escapeHtml(a.title)}</td>
                  <td>${escapeHtml(a.category)}</td>
                  <td>${escapeHtml(a.author)}</td>
                  <td><span class="badge ${getStatusBadgeClass(a.status)}">${a.status === 'published' ? 'Terbit' : 'Arsip'}</span></td>
                  <td class="flex gap-1">
                    <a href="#/artikel/detail/${escapeHtml(a.id)}" class="btn btn-ghost btn-sm">${icon('eye', 14)}</a>
                    <button type="button" class="btn btn-secondary btn-sm" data-adm-toggle-article="${escapeHtml(a.id)}">${a.status === 'published' ? 'Arsipkan' : 'Terbitkan'}</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Manajemen Artikel');
    }

    if (seg === 'kategori-artikel') {
      return renderAdminShell(route, `
        <div class="card card-body">
          <h2 class="text-h4 mb-3">Kategori Artikel</h2>
          <div class="flex flex-wrap gap-2">
            ${state.settings.cms.articleCategories.map((c) => `<span class="badge badge-primary" style="padding:8px 14px;font-size:13px;">${escapeHtml(c)}</span>`).join('')}
          </div>
        </div>
      `, 'Kategori Artikel');
    }

    if (seg === 'banner') {
      return renderAdminShell(route, `
        <div class="grid-3">
          ${state.settings.cms.banners.map((b) => `
            <div class="card card-body">
              <div class="flex justify-between items-center mb-2">
                <span class="badge badge-neutral">${escapeHtml(b.position)}</span>
                <span class="badge ${b.status === 'active' ? 'badge-success' : 'badge-danger'}">${b.status}</span>
              </div>
              <h3 class="text-h4">${escapeHtml(b.title)}</h3>
              <button type="button" class="btn btn-secondary btn-sm mt-3" data-adm-toggle-banner="${escapeHtml(b.id)}">${b.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</button>
            </div>
          `).join('')}
        </div>
      `, 'Banner Promosi');
    }

    if (seg === 'portofolio') {
      return renderAdminShell(route, `
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-h3">Portofolio Contoh (${state.portfolios.length})</h2>
          <button type="button" class="btn btn-primary btn-sm" id="adm-add-portfolio-btn">${icon('plus', 15)} Tambah Portofolio</button>
        </div>
        <div class="grid-3">
          ${state.portfolios.map((pt) => `
            <div class="card card-body">
              <img src="${pt.thumbnail}" alt="${escapeHtml(pt.title)}" style="border-radius:8px;margin-bottom:10px;">
              <span class="badge badge-primary">${escapeHtml(pt.category)}</span>
              <h3 class="text-h4 mt-2">${escapeHtml(pt.title)}</h3>
              <div class="flex gap-2 mt-3">
                <a href="#/portofolio/detail/${escapeHtml(pt.id)}" class="btn btn-secondary btn-sm">Lihat</a>
                <button type="button" class="btn btn-outline btn-sm" data-adm-toggle-port="${escapeHtml(pt.id)}">${pt.status === 'published' ? 'Arsipkan' : 'Terbitkan'}</button>
              </div>
            </div>
          `).join('')}
        </div>
      `, 'Portofolio');
    }

    if (seg === 'media') {
      const assets = state.products.slice(0, 6).map((p) => ({ name: p.name, src: p.thumbnail, tag: p.category }));
      return renderAdminShell(route, `
        <div class="grid-3">
          ${assets.map((m) => `
            <div class="card card-body">
              <img src="${m.src}" alt="${escapeHtml(m.name)}" style="border-radius:8px;margin-bottom:10px;">
              <div class="font-bold text-sm">${escapeHtml(m.name)}</div>
              <div class="text-caption text-muted">${escapeHtml(m.tag)} • SVG Asset Simulasi</div>
            </div>
          `).join('')}
        </div>
      `, 'Media Library');
    }

    if (seg === 'newsletter') {
      const list = state.settings.cms.newsletters;
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Email Pelanggan</th><th>Tanggal Berlangganan</th></tr></thead>
            <tbody>
              ${list.map((n) => `<tr><td class="font-semibold">${escapeHtml(n.email)}</td><td>${formatDate(n.subscribedAt, true)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      `, 'Pelanggan Newsletter');
    }

    if (seg === 'pelanggan') {
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Nama</th><th>Email</th><th>Telepon</th><th>Usaha / Instansi</th><th>Total Pesanan</th></tr></thead>
            <tbody>
              ${state.customers.map((c) => `
                <tr>
                  <td class="font-bold">${escapeHtml(c.name)}</td>
                  <td>${escapeHtml(c.email)}</td>
                  <td>${escapeHtml(c.phone)}</td>
                  <td>${escapeHtml(c.company || '-')}</td>
                  <td>${state.orders.filter((o) => o.customerId === c.id).length} pesanan</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Data Pelanggan');
    }

    if (seg === 'pengguna-admin') {
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Nama</th><th>Email</th><th>Role Simulasi</th><th>Status</th></tr></thead>
            <tbody>
              ${state.settings.cms.adminUsers.map((a) => `
                <tr><td class="font-bold">${escapeHtml(a.name)}</td><td>${escapeHtml(a.email)}</td><td><span class="badge badge-primary">${escapeHtml(a.roleName)}</span></td><td><span class="badge badge-success">Aktif</span></td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Pengguna Admin');
    }

    if (seg === 'role') {
      return renderAdminShell(route, `
        <div class="alert alert-warning mb-4">
          ${icon('alert-circle', 18)}
          <div><strong>Catatan Simulasi:</strong> Pengaturan role dan permission pada halaman ini adalah demonstrasi antarmuka browser dan <strong>bukan otorisasi keamanan backend production</strong>.</div>
        </div>
        <div class="grid-3">
          ${state.settings.cms.roles.map((r) => `
            <div class="card card-body">
              <h3 class="text-h4">${escapeHtml(r.name)}</h3>
              <p class="text-caption text-muted mt-1 mb-3">${escapeHtml(r.note)}</p>
              <ul style="display:flex;flex-direction:column;gap:6px;">
                ${r.permissions.map((perm) => `<li class="flex items-center gap-2 text-sm"><span class="text-success">${icon('check', 14)}</span><span>${escapeHtml(perm)}</span></li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      `, 'Role dan Permission');
    }

    if (seg === 'laporan') {
      const period = ui.adminFilters.reportPeriod;
      const cutoff = period === '7d' ? Date.now() - 7 * 86400 * 1000 : period === '30d' ? Date.now() - 30 * 86400 * 1000 : 0;
      const ordersInRange = state.orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
      const paysInRange = state.payments.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
      const verifiedInRange = paysInRange.filter((p) => p.status === 'Pembayaran Diverifikasi');
      const revInRange = verifiedInRange.reduce((s, p) => s + p.amount, 0);
      const pendingInRange = paysInRange.filter((p) => ['Menunggu Verifikasi', 'Menunggu Pembayaran'].includes(p.status));

      return renderAdminShell(route, `
        <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div class="flex items-center gap-2">
            <label class="form-label" style="margin:0;" for="adm-report-period">Periode:</label>
            <select id="adm-report-period" class="form-select" style="width:180px;">
              <option value="all" ${period === 'all' ? 'selected' : ''}>Semua Waktu</option>
              <option value="30d" ${period === '30d' ? 'selected' : ''}>30 Hari Terakhir</option>
              <option value="7d" ${period === '7d' ? 'selected' : ''}>7 Hari Terakhir</option>
            </select>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="export-csv-btn">${icon('download', 15)} Export CSV Simulasi</button>
        </div>

        <div class="grid-4 mb-6">
          <div class="kpi-card"><div class="text-caption text-muted">Pendapatan Terverifikasi</div><div class="kpi-value text-success">${formatIDR(revInRange)}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Transaksi Periode</div><div class="kpi-value">${ordersInRange.length}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Penjualan Produk / Jasa</div><div class="kpi-value">${ordersInRange.filter((o) => o.type === 'product').length} / ${ordersInRange.filter((o) => o.type === 'service').length}</div></div>
          <div class="kpi-card"><div class="text-caption text-muted">Pembayaran Tertunda</div><div class="kpi-value text-warning">${pendingInRange.length}</div></div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>No. Pesanan</th><th>Tanggal</th><th>Pelanggan</th><th>Jenis</th><th>Nominal</th><th>Status</th></tr></thead>
            <tbody>
              ${ordersInRange.map((o) => {
                const pay = state.payments.find((p) => p.orderId === o.id);
                return `<tr><td class="font-bold">${escapeHtml(o.orderNo)}</td><td>${formatDate(o.createdAt)}</td><td>${escapeHtml(o.customerName)}</td><td>${escapeHtml(o.type)}</td><td class="font-bold">${formatIDR(o.total)}</td><td><span class="badge ${getStatusBadgeClass(pay ? pay.status : o.status)}">${escapeHtml(pay ? pay.status : o.status)}</span></td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `, 'Laporan Simulasi');
    }

    if (seg === 'audit-log') {
      return renderAdminShell(route, `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Waktu</th><th>Aktor</th><th>Aksi</th><th>Target</th><th>Detail</th></tr></thead>
            <tbody>
              ${state.auditLogs.map((a) => `
                <tr>
                  <td style="white-space:nowrap;">${formatDate(a.createdAt, true)}</td>
                  <td class="font-semibold">${escapeHtml(a.actor)}</td>
                  <td><span class="badge badge-neutral">${escapeHtml(a.action)}</span></td>
                  <td><code>${escapeHtml(a.target)}</code></td>
                  <td>${escapeHtml(a.detail)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, 'Audit Log');
    }

    // seg === 'pengaturan'
    return renderAdminShell(route, `
      <form id="admin-settings-form" class="card card-lg card-body" style="max-width:760px;">
        <h2 class="text-h3 mb-3">Pengaturan Website & Rekening Demo</h2>
        <div class="grid-2">
          <div class="form-group"><label class="form-label" for="set-name">Nama Website</label><input type="text" id="set-name" class="form-control" value="${escapeHtml(state.settings.siteName)}"></div>
          <div class="form-group"><label class="form-label" for="set-tag">Tagline</label><input type="text" id="set-tag" class="form-control" value="${escapeHtml(state.settings.tagline)}"></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label" for="set-email">Email Kontak Contoh</label><input type="text" id="set-email" class="form-control" value="${escapeHtml(state.settings.contactEmail)}"></div>
          <div class="form-group"><label class="form-label" for="set-phone">Telepon Contoh</label><input type="text" id="set-phone" class="form-control" value="${escapeHtml(state.settings.contactPhone)}"></div>
        </div>
        <h3 class="text-h4 mt-3 mb-2">Rekening Demo (Placeholder)</h3>
        <div class="grid-3">
          <div class="form-group"><label class="form-label" for="set-bank">Bank Demo</label><input type="text" id="set-bank" class="form-control" value="${escapeHtml(state.settings.demoBank.bankName)}"></div>
          <div class="form-group"><label class="form-label" for="set-rek">No. Rekening Placeholder</label><input type="text" id="set-rek" class="form-control" value="${escapeHtml(state.settings.demoBank.accountNumber)}"></div>
          <div class="form-group"><label class="form-label" for="set-holder">Nama Penerima</label><input type="text" id="set-holder" class="form-control" value="${escapeHtml(state.settings.demoBank.accountHolder)}"></div>
        </div>
        <div class="form-group"><label class="form-label" for="set-footer">Informasi Footer</label><textarea id="set-footer" class="form-textarea" rows="2">${escapeHtml(state.settings.footerNote)}</textarea></div>
        <div class="flex flex-wrap gap-3">
          <button type="submit" class="btn btn-primary">Simpan Pengaturan</button>
          <button type="button" class="btn btn-danger" data-demo-action="reset">Reset Seluruh Data Demo</button>
        </div>
      </form>
    `, 'Pengaturan Website');
  }

  /* ------------------------------------------------------------------------
     16. ADMIN INTERACTIVE MODALS & DEMO CONTROL ACTIONS
     ------------------------------------------------------------------------ */
  function openPaymentInspectModal(paymentId) {
    const pay = state.payments.find((p) => p.id === paymentId);
    if (!pay) return;
    const ord = state.orders.find((o) => o.id === pay.orderId);
    const canDecide = pay.status === 'Menunggu Verifikasi' || pay.status === 'Menunggu Pembayaran';

    openModal({
      title: `Tinjau Pembayaran — ${pay.orderNo}`,
      size: 'lg',
      bodyHtml: `
        <div class="grid-2 mb-4">
          <div>
            <div class="text-caption text-muted">Pelanggan</div>
            <div class="font-bold">${escapeHtml(pay.customerName)}</div>
            <div class="text-caption text-muted mt-2">Jenis Transaksi</div>
            <div class="font-semibold">${escapeHtml(pay.type)} — ${escapeHtml(ord ? ord.summaryTitle : '')}</div>
            <div class="text-caption text-muted mt-2">Nominal Tagihan</div>
            <div class="text-h3 text-primary-brand">${formatIDR(pay.amount)}</div>
            <div class="text-caption text-muted mt-2">Status Saat Ini</div>
            <span class="badge ${getStatusBadgeClass(pay.status)} mt-1">${escapeHtml(pay.status)}</span>
            ${pay.customerNote ? `<div class="alert alert-info mt-3 text-caption">Catatan: ${escapeHtml(pay.customerNote)}</div>` : ''}
            ${pay.rejectionReason ? `<div class="alert alert-danger mt-3 text-caption">Alasan Penolakan: ${escapeHtml(pay.rejectionReason)}</div>` : ''}
          </div>
          <div>
            <div class="text-caption font-bold mb-2">Bukti Transfer Terunggah</div>
            ${pay.proofImage
              ? `<img src="${pay.proofImage}" alt="Bukti transfer ${escapeHtml(pay.orderNo)}" style="width:100%;max-height:260px;object-fit:contain;border:1px solid var(--border);border-radius:10px;background:var(--surface);">`
              : `<div class="state-box" style="padding:24px;">Pelanggan belum mengunggah bukti transfer.</div>`}
          </div>
        </div>
        ${canDecide ? `
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="adm-reject-reason">Alasan Penolakan (Wajib diisi jika menolak)</label>
            <textarea id="adm-reject-reason" class="form-textarea" rows="2" placeholder="Contoh: Nominal transfer belum sesuai atau bukti tidak terbaca jelas"></textarea>
          </div>
        ` : ''}
      `,
      footerHtml: canDecide ? `
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Tutup</button>
        <button type="button" class="btn btn-danger" id="adm-reject-pay-btn">Tolak Pembayaran</button>
        <button type="button" class="btn btn-success" id="adm-approve-pay-btn" ${!pay.proofImage ? 'title="Bukti belum diunggah"' : ''}>Setujui Pembayaran</button>
      ` : `<button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Tutup</button>`,
      onMount: () => {
        const approveBtn = document.getElementById('adm-approve-pay-btn');
        const rejectBtn = document.getElementById('adm-reject-pay-btn');
        if (approveBtn) {
          approveBtn.addEventListener('click', () => {
            openConfirmModal({
              title: 'Konfirmasi Persetujuan Pembayaran',
              message: `Setujui pembayaran ${pay.orderNo} senilai ${formatIDR(pay.amount)}? Hak akses pelanggan dan pendapatan terverifikasi akan diperbarui.`,
              confirmText: 'Ya, Setujui Sekarang',
              confirmClass: 'btn-success',
              onConfirm: () => verifyPayment(pay.id)
            });
          });
        }
        if (rejectBtn) {
          rejectBtn.addEventListener('click', () => {
            const reason = document.getElementById('adm-reject-reason').value;
            if (rejectPayment(pay.id, reason)) closeModal();
          });
        }
      }
    });
  }

  function openAdminProductModal(productId = null) {
    const existing = productId ? state.products.find((p) => p.id === productId) : null;
    openModal({
      title: existing ? `Edit Produk: ${existing.name}` : 'Tambah Produk Digital Baru',
      bodyHtml: `
        <form id="adm-product-form">
          <div class="form-group"><label class="form-label">Nama Produk *</label><input type="text" id="ap-name" class="form-control" required value="${escapeHtml(existing ? existing.name : '')}"></div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Kategori *</label>
              <select id="ap-cat" class="form-select">
                ${state.categories.map((c) => `<option value="${escapeHtml(c.name)}" ${existing && existing.category === c.name ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label class="form-label">Harga (IDR) *</label><input type="number" id="ap-price" class="form-control" min="0" required value="${existing ? existing.price : 199000}"></div>
          </div>
          <div class="grid-2">
            <div class="form-group"><label class="form-label">Format File</label><input type="text" id="ap-fmt" class="form-control" value="${escapeHtml(existing ? existing.fileFormat : 'PDF & ZIP')}"></div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="ap-status" class="form-select">
                <option value="active" ${!existing || existing.status === 'active' ? 'selected' : ''}>Aktif</option>
                <option value="archived" ${existing && existing.status === 'archived' ? 'selected' : ''}>Diarsipkan</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Deskripsi Singkat *</label><textarea id="ap-desc" class="form-textarea" rows="3" required>${escapeHtml(existing ? existing.shortDesc : '')}</textarea></div>
          <button type="submit" class="btn btn-primary w-full">${existing ? 'Simpan Perubahan' : 'Terbitkan Produk'}</button>
        </form>
      `,
      onMount: () => {
        document.getElementById('adm-product-form').addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('ap-name').value.trim();
          const category = document.getElementById('ap-cat').value;
          const price = Number(document.getElementById('ap-price').value) || 0;
          const fileFormat = document.getElementById('ap-fmt').value.trim() || 'Digital File';
          const status = document.getElementById('ap-status').value;
          const shortDesc = document.getElementById('ap-desc').value.trim();

          if (existing) {
            existing.name = name;
            existing.category = category;
            existing.price = price;
            existing.fileFormat = fileFormat;
            existing.status = status;
            existing.shortDesc = shortDesc;
            existing.description = shortDesc;
            existing.thumbnail = createArtworkDataUri({ type: existing.artType || 'product', title: name, subtitle: `${category} • ${fileFormat}`, badge: category, theme: existing.theme || 'blue', seed: 99 });
            addAuditLog('EDIT_PRODUK', existing.id, `Memperbarui produk "${name}" menjadi ${formatIDR(price)}. Transaksi lama tetap memakai snapshot harga.`);
            showToast('Produk diperbarui. Pesanan lama tetap mempertahankan harga sebelumnya.', 'success');
          } else {
            const newId = uid('prod');
            const thumb = createArtworkDataUri({ type: 'product', title: name, subtitle: `${category} • ${fileFormat}`, badge: category, theme: 'blue', seed: state.products.length + 5 });
            state.products.unshift({
              id: newId,
              name,
              category,
              price,
              fileFormat,
              fileSize: '15.0 MB',
              theme: 'blue',
              artType: 'product',
              featured: true,
              allowMultiUnit: category === 'Akun Pro Resmi',
              popularity: 95,
              shortDesc,
              description: shortDesc,
              advantages: ['Aset siap pakai di ekosistem NEXORA', 'Dokumentasi pemakaian ringkas'],
              contents: [`Paket utama ${name}`],
              licenseTerms: 'Lisensi penggunaan standar NEXORA.',
              licenseLimit: null,
              status,
              createdAt: new Date().toISOString(),
              thumbnail: thumb,
              gallery: [thumb],
              faqs: [{ q: 'Kapan file tersedia?', a: 'Tersedia setelah pembayaran diverifikasi Admin.' }]
            });
            addAuditLog('TAMBAH_PRODUK', newId, `Menambahkan produk baru "${name}" (${formatIDR(price)}).`);
            showToast(`Produk "${name}" berhasil ditambahkan ke katalog.`, 'success');
          }
          saveState();
          closeModal();
          rerenderActiveViews();
        });
      }
    });
  }

  function openAdminQuotationModal(requestId, existingQuoteId = null) {
    const req = state.customRequests.find((r) => r.id === requestId);
    const existing = existingQuoteId ? state.quotations.find((q) => q.id === existingQuoteId) : null;
    const targetReq = req || (existing ? state.customRequests.find((r) => r.id === existing.requestId) : null);
    if (!targetReq) return;

    openModal({
      title: existing ? `Revisi Penawaran ${existing.quotationNo}` : `Buat Penawaran untuk ${targetReq.requestNo}`,
      bodyHtml: `
        <form id="adm-quote-form">
          <div class="form-group"><label class="form-label">Judul Penawaran *</label><input type="text" id="aq-title" class="form-control" required value="${escapeHtml(existing ? existing.title : `Penawaran ${targetReq.projectTitle}`)}"></div>
          <div class="grid-3">
            <div class="form-group"><label class="form-label">Harga (IDR) *</label><input type="number" id="aq-price" class="form-control" required value="${existing ? existing.price : 6500000}"></div>
            <div class="form-group"><label class="form-label">Estimasi (Hari) *</label><input type="number" id="aq-days" class="form-control" required value="${existing ? existing.estimatedDays : 14}"></div>
            <div class="form-group"><label class="form-label">Berlaku (Hari) *</label><input type="number" id="aq-valid" class="form-control" required value="7"></div>
          </div>
          <div class="form-group"><label class="form-label">Ruang Lingkup Pekerjaan *</label><textarea id="aq-scope" class="form-textarea" rows="3" required>${escapeHtml(existing ? existing.scope : targetReq.description)}</textarea></div>
          <div class="form-group"><label class="form-label">Deliverable (1 per baris)</label><textarea id="aq-deliv" class="form-textarea" rows="3">${escapeHtml(existing ? existing.deliverables.join('\n') : 'Desain & implementasi utama\nPanduan pemakaian\n2x putaran revisi')}</textarea></div>
          <button type="submit" class="btn btn-primary w-full">Kirim Penawaran ke Pelanggan</button>
        </form>
      `,
      onMount: () => {
        document.getElementById('adm-quote-form').addEventListener('submit', (e) => {
          e.preventDefault();
          createOrReviseQuotation({
            requestId: targetReq.id,
            existingQuotationId: existing ? existing.id : null,
            title: document.getElementById('aq-title').value.trim(),
            price: document.getElementById('aq-price').value,
            estimatedDays: document.getElementById('aq-days').value,
            validDays: document.getElementById('aq-valid').value,
            scope: document.getElementById('aq-scope').value.trim(),
            deliverablesText: document.getElementById('aq-deliv').value
          });
          closeModal();
          showToast('Penawaran berhasil dikirim dan langsung terlihat di Dashboard Pelanggan.', 'success');
          rerenderActiveViews();
        });
      }
    });
  }

  function openAdminProjectModal(projectId) {
    const prj = state.projects.find((p) => p.id === projectId);
    if (!prj) return;
    const statuses = ['Menunggu Pembayaran', 'Dalam Antrean', 'Dalam Pengerjaan', 'Menunggu Review', 'Revisi', 'Selesai'];

    openModal({
      title: `Update Proyek — ${prj.title}`,
      bodyHtml: `
        <form id="adm-project-form">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Status Proyek</label>
              <select id="apj-status" class="form-select">
                ${statuses.map((s) => `<option value="${s}" ${prj.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label class="form-label">Progres (%)</label><input type="number" id="apj-prog" class="form-control" min="0" max="100" value="${prj.progress}"></div>
          </div>
          <div class="form-group"><label class="form-label">Catatan Hasil Contoh / Deliverable</label><textarea id="apj-note" class="form-textarea" rows="3">${escapeHtml(prj.sampleOutputNote)}</textarea></div>
          <div class="form-group"><label class="form-label">Tambah Entri Timeline (Opsional)</label><input type="text" id="apj-tl" class="form-control" placeholder="Contoh: Draft revisi #1 dikirim untuk review klien"></div>
          <button type="submit" class="btn btn-primary w-full">Simpan Pembaruan Proyek</button>
        </form>
      `,
      onMount: () => {
        document.getElementById('adm-project-form').addEventListener('submit', (e) => {
          e.preventDefault();
          prj.status = document.getElementById('apj-status').value;
          prj.progress = Math.min(100, Math.max(0, Number(document.getElementById('apj-prog').value) || 0));
          prj.sampleOutputNote = document.getElementById('apj-note').value.trim();
          const tl = document.getElementById('apj-tl').value.trim();
          if (tl) {
            prj.timeline.push({ date: new Date().toISOString(), title: tl, by: state.currentUser.name });
          } else {
            prj.timeline.push({ date: new Date().toISOString(), title: `Status diperbarui menjadi ${prj.status} (${prj.progress}%)`, by: state.currentUser.name });
          }
          addAuditLog('UPDATE_PROYEK', prj.id, `Status proyek ${prj.orderNo} diubah menjadi ${prj.status} (${prj.progress}%).`);
          pushNotification({
            userId: prj.customerId,
            roleTarget: 'customer',
            title: 'Pembaruan Proyek Jasa',
            message: `${prj.title}: status kini ${prj.status} (${prj.progress}%).`,
            link: `#/akun/proyek/${prj.id}`
          });
          saveState();
          closeModal();
          showToast('Proyek diperbarui dan tersinkronisasi ke Dashboard Pelanggan.', 'success');
          rerenderActiveViews();
        });
      }
    });
  }

  /* ---- Demo Control Center Scenarios ---- */
  function runDemoAction(action) {
    ui.demoPanelOpen = false;
    if (action === 'public') {
      navigate('#/');
    } else if (action === 'login-customer') {
      loginAsCustomer('pelanggan@example.com', 'demo123');
      navigate('#/akun/dashboard');
    } else if (action === 'login-admin') {
      loginAsAdmin('admin@example.com', 'demo123');
      navigate('#/admin/dashboard');
    } else if (action === 'sim-product') {
      loginAsCustomer('pelanggan@example.com', 'demo123', true);
      addToCart('prod-01', 1, false);
      ui.checkoutTab = 'product';
      showToast('Skenario 01: Produk ditambahkan. Selesaikan Checkout > Invoice > Upload Bukti > Setujui di Admin.', 'info', 5000);
      navigate('#/checkout?type=product');
    } else if (action === 'sim-service') {
      loginAsCustomer('pelanggan@example.com', 'demo123', true);
      ui.prefillServiceBrief = {
        projectTitle: 'Website Profil Usaha Nusantara (Simulasi)',
        brief: 'Pembuatan website company profile modern 5 halaman dengan formulir penawaran dan katalog layanan.',
        requirements: 'Responsif mobile & desktop, gaya Light Premium.'
      };
      showToast('Skenario 03: Formulir brief paket jasa terisi contoh. Konfirmasi untuk membuat invoice.', 'info', 5000);
      navigate('#/jasa/pesan/pkg-srv-01-professional');
    } else if (action === 'sim-custom') {
      loginAsCustomer('pelanggan@example.com', 'demo123', true);
      showToast('Skenario 04: Menampilkan penawaran custom aktif siap disetujui menjadi invoice.', 'info', 5000);
      navigate('#/akun/penawaran/quo-01');
    } else if (action === 'sim-training') {
      loginAsCustomer('pelanggan@example.com', 'demo123', true);
      showToast('Skenario 05: Pendaftaran Pelatihan AI TQN dengan kuota tersedia siap direservasi.', 'info', 5000);
      navigate('#/pelatihan/daftar/ses-01');
    } else if (action === 'sim-rejected') {
      loginAsCustomer('pelanggan@example.com', 'demo123', true);
      let rej = state.payments.find((p) => p.customerId === 'cust-01' && p.status === 'Pembayaran Ditolak');
      if (!rej) {
        const bundle = createOrderBundle({
          customer: state.customers[0],
          type: 'product',
          summaryTitle: 'Template Website UMKM (Simulasi Ditolak)',
          items: [{ refId: 'prod-03', name: 'Template Website UMKM', category: 'Template Digital', unitPrice: 299000, qty: 1, subtotal: 299000 }],
          subtotal: 299000
        });
        bundle.payment.status = 'Pembayaran Ditolak';
        bundle.payment.rejectionReason = 'Nominal pada bukti transfer tidak terbaca jelas (simulasi). Silakan unggah ulang bukti.';
        bundle.order.status = 'Perlu Unggah Ulang';
        saveState();
        rej = bundle.payment;
      }
      showToast('Skenario 02: Lihat alasan penolakan lalu unggah ulang bukti transfer demo.', 'warning', 5000);
      navigate(`#/pembayaran/${rej.id}`);
    } else if (action === 'reset') {
      openConfirmModal({
        title: 'Reset Seluruh Data Demo?',
        message: 'Semua perubahan pesanan, produk, verifikasi pembayaran, dan profil di LocalStorage akan dikembalikan ke dataset demo awal.',
        confirmText: 'Ya, Reset Data Demo',
        confirmClass: 'btn-danger',
        onConfirm: resetDemoState
      });
      return;
    }
    renderDemoControlCenter();
  }

  /* ------------------------------------------------------------------------
     17. MAIN ROUTER DISPATCH & RENDER ENGINE
     ------------------------------------------------------------------------ */
  function renderApp(scrollTop = true) {
    const root = document.getElementById('app-root');
    if (!root) return;
    const route = parseRoute();
    const s = route.segments;

    let html = '';
    if (route.path === '/' || route.path === '') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderHomePage()}</main>` + renderPublicFooter();
    } else if (s[0] === 'produk' && s[1] === 'detail' && s[2]) {
      html = renderPublicHeader(route) + `<main id="main-content">${renderProductDetailPage(s[2])}</main>` + renderPublicFooter();
    } else if (s[0] === 'produk') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderProductsCatalogPage(route)}</main>` + renderPublicFooter();
    } else if (s[0] === 'jasa' && s[1] === 'detail' && s[2]) {
      html = renderPublicHeader(route) + `<main id="main-content">${renderServiceDetailPage(s[2])}</main>` + renderPublicFooter();
    } else if (s[0] === 'jasa' && s[1] === 'pesan' && s[2]) {
      html = renderPublicHeader(route) + `<main id="main-content">${renderServicePackageOrderPage(s[2])}</main>` + renderPublicFooter();
    } else if (s[0] === 'jasa' && s[1] === 'custom') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderCustomRequestPage(route)}</main>` + renderPublicFooter();
    } else if (s[0] === 'jasa') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderServicesCatalogPage()}</main>` + renderPublicFooter();
    } else if (s[0] === 'pelatihan' && s[1] === 'detail' && s[2]) {
      html = renderPublicHeader(route) + `<main id="main-content">${renderTrainingDetailPage(s[2])}</main>` + renderPublicFooter();
    } else if (s[0] === 'pelatihan' && s[1] === 'daftar' && s[2]) {
      html = renderPublicHeader(route) + `<main id="main-content">${renderTrainingRegistrationPage(s[2])}</main>` + renderPublicFooter();
    } else if (s[0] === 'pelatihan') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderTrainingsCatalogPage()}</main>` + renderPublicFooter();
    } else if (s[0] === 'artikel' && s[1] === 'detail' && s[2]) {
      html = renderPublicHeader(route) + `<main id="main-content">${renderArticleDetailPage(s[2])}</main>` + renderPublicFooter();
    } else if (s[0] === 'artikel') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderArticlesPage()}</main>` + renderPublicFooter();
    } else if (s[0] === 'portofolio' && s[1] === 'detail' && s[2]) {
      html = renderPublicHeader(route) + `<main id="main-content">${renderPortfolioDetailPage(s[2])}</main>` + renderPublicFooter();
    } else if (s[0] === 'portofolio') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderPortfoliosPage()}</main>` + renderPublicFooter();
    } else if (s[0] === 'tentang') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderAboutPage()}</main>` + renderPublicFooter();
    } else if (s[0] === 'kontak') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderContactPage()}</main>` + renderPublicFooter();
    } else if (s[0] === 'bantuan') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderHelpCenterPage()}</main>` + renderPublicFooter();
    } else if (s[0] === 'kebijakan-privasi') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderLegalPolicyPage('privacy')}</main>` + renderPublicFooter();
    } else if (s[0] === 'syarat-ketentuan') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderLegalPolicyPage('terms')}</main>` + renderPublicFooter();
    } else if (s[0] === 'pengembalian-dana') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderLegalPolicyPage('refund')}</main>` + renderPublicFooter();
    } else if (s[0] === 'cari') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderGlobalSearchPage(route)}</main>` + renderPublicFooter();
    } else if (s[0] === 'masuk') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderAuthPage('login', route)}</main>` + renderPublicFooter();
    } else if (s[0] === 'daftar') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderAuthPage('register', route)}</main>` + renderPublicFooter();
    } else if (s[0] === 'lupa-sandi') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderAuthPage('forgot', route)}</main>` + renderPublicFooter();
    } else if (s[0] === 'reset-sandi') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderAuthPage('reset', route)}</main>` + renderPublicFooter();
    } else if (s[0] === 'verifikasi-akun') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderAuthPage('verify', route)}</main>` + renderPublicFooter();
    } else if (s[0] === 'keranjang') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderCartPage()}</main>` + renderPublicFooter();
    } else if (s[0] === 'checkout') {
      html = renderPublicHeader(route) + `<main id="main-content">${renderCheckoutPage(route)}</main>` + renderPublicFooter();
    } else if (s[0] === 'invoice' && s[1]) {
      html = renderPublicHeader(route) + `<main id="main-content">${renderInvoicePage(s[1])}</main>` + renderPublicFooter();
    } else if (s[0] === 'pembayaran' && s[1]) {
      html = renderPublicHeader(route) + `<main id="main-content">${renderPaymentPage(s[1])}</main>` + renderPublicFooter();
    } else if (s[0] === 'akun') {
      html = renderCustomerPage(route);
    } else if (s[0] === 'admin') {
      html = renderAdminPage(route);
    } else {
      html = renderPublicHeader(route) + `<main id="main-content">${render404Page()}</main>` + renderPublicFooter();
    }

    root.innerHTML = html;
    renderDemoControlCenter();
    bindViewInteractions();
    setupRevealObserver();
    if (scrollTop) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ------------------------------------------------------------------------
     18. INTERACTIVE EVENT BINDING, UPLOAD COMPRESSION & ANIMATIONS
     ------------------------------------------------------------------------ */
  function compressImageFile(file, callback) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.', 'danger');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 3 MB.', 'danger');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 720;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.72), file.name);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  let pendingProofUpload = { dataUrl: '', fileName: '' };

  function bindViewInteractions() {
    // Global search input & suggestions
    const searchInput = document.getElementById('global-search-input');
    const searchForm = document.getElementById('global-search-form');
    if (searchInput) {
      searchInput.addEventListener('focus', () => {
        if (!ui.searchFocused) {
          ui.searchFocused = true;
          if (ui.searchQuery.trim()) renderApp(false);
        }
      });
      searchInput.addEventListener('input', (e) => {
        ui.searchQuery = e.target.value;
        ui.searchFocused = true;
        renderApp(false);
        const nextInput = document.getElementById('global-search-input');
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
        }
      });
    }
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        ui.searchFocused = false;
        navigate(`#/cari?q=${encodeURIComponent(ui.searchQuery.trim())}`);
      });
    }

    const pageSearchForm = document.getElementById('page-search-form');
    if (pageSearchForm) {
      pageSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = document.getElementById('page-search-input').value.trim();
        ui.searchQuery = q;
        navigate(`#/cari?q=${encodeURIComponent(q)}`);
      });
    }

    // Catalog filters
    const catSearch = document.getElementById('cat-search-input');
    if (catSearch) {
      catSearch.addEventListener('input', (e) => {
        ui.catalog.search = e.target.value;
        ui.catalog.page = 1;
        renderApp(false);
        const el = document.getElementById('cat-search-input');
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      });
    }
    const catSelect = document.getElementById('cat-category-select');
    if (catSelect) catSelect.addEventListener('change', (e) => { ui.catalog.category = e.target.value; ui.catalog.page = 1; renderApp(false); });
    const catMin = document.getElementById('cat-min-price');
    if (catMin) catMin.addEventListener('change', (e) => { ui.catalog.minPrice = e.target.value; ui.catalog.page = 1; renderApp(false); });
    const catMax = document.getElementById('cat-max-price');
    if (catMax) catMax.addEventListener('change', (e) => { ui.catalog.maxPrice = e.target.value; ui.catalog.page = 1; renderApp(false); });
    const catSort = document.getElementById('cat-sort-select');
    if (catSort) catSort.addEventListener('change', (e) => { ui.catalog.sort = e.target.value; ui.catalog.page = 1; renderApp(false); });

    const resetProd = () => {
      ui.catalog = { ...ui.catalog, search: '', category: 'all', minPrice: '', maxPrice: '', sort: 'popular', page: 1 };
      navigate('#/produk');
    };
    document.getElementById('reset-product-filters')?.addEventListener('click', resetProd);
    document.getElementById('empty-reset-product-filters')?.addEventListener('click', resetProd);

    // Product Preview Modal
    document.getElementById('open-product-preview-btn')?.addEventListener('click', () => {
      const route = parseRoute();
      const prod = state.products.find((p) => p.id === route.segments[2]);
      if (!prod) return;
      openModal({
        title: `Preview Produk — ${prod.name}`,
        size: 'lg',
        bodyHtml: `
          <img src="${prod.gallery[1] || prod.thumbnail}" alt="${escapeHtml(prod.name)}" style="width:100%;border-radius:10px;border:1px solid var(--border);margin-bottom:16px;">
          <h4 class="text-h4 mb-2">Daftar Isi & Struktur Paket</h4>
          <ul style="display:flex;flex-direction:column;gap:8px;">
            ${prod.contents.map((c, i) => `<li class="text-sm">${i + 1}. ${escapeHtml(c)}</li>`).join('')}
          </ul>
          <p class="text-caption text-muted mt-3">Format: ${escapeHtml(prod.fileFormat)} (${escapeHtml(prod.fileSize)})</p>
        `
      });
    });

    // Services filter
    document.getElementById('srv-search-input')?.addEventListener('input', (e) => {
      ui.servicesFilter.search = e.target.value;
      renderApp(false);
      const el = document.getElementById('srv-search-input');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
    document.getElementById('srv-category-select')?.addEventListener('change', (e) => { ui.servicesFilter.category = e.target.value; renderApp(false); });
    document.getElementById('srv-sort-select')?.addEventListener('change', (e) => { ui.servicesFilter.sort = e.target.value; renderApp(false); });

    // Service Package Order Form
    const spForm = document.getElementById('service-package-order-form');
    if (spForm) {
      spForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pkgId = spForm.getAttribute('data-package-id');
        const pkg = state.servicePackages.find((p) => p.id === pkgId);
        if (!pkg) return;
        const fileEl = document.getElementById('sp-file');
        ui.prefillServiceBrief = null;
        submitServicePackageOrder(pkg, {
          customerName: document.getElementById('sp-name').value.trim(),
          customerEmail: document.getElementById('sp-email').value.trim(),
          customerPhone: document.getElementById('sp-phone').value.trim(),
          targetDate: document.getElementById('sp-target').value,
          projectTitle: document.getElementById('sp-title').value.trim(),
          brief: document.getElementById('sp-brief').value.trim(),
          requirements: document.getElementById('sp-req').value.trim(),
          attachmentName: fileEl && fileEl.files[0] ? fileEl.files[0].name : '',
          couponCode: document.getElementById('sp-coupon').value.trim()
        });
      });
    }

    // Custom Wizard Submit
    document.getElementById('cw-submit-btn')?.addEventListener('click', () => {
      const req = submitCustomRequest(ui.customWizardData);
      ui.customWizardStep = 1;
      ui.customWizardData.projectTitle = '';
      ui.customWizardData.description = '';
      ui.customWizardData.needs = [];
      showToast(`Permintaan ${req.requestNo} berhasil dikirim! Admin dapat meninjaunya di menu Permintaan Custom.`, 'success', 4500);
      navigate('#/akun/penawaran');
    });

    // Training filters & registration
    document.getElementById('trn-search-input')?.addEventListener('input', (e) => {
      ui.trainingFilter.search = e.target.value;
      renderApp(false);
      const el = document.getElementById('trn-search-input');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
    document.getElementById('trn-mode-select')?.addEventListener('change', (e) => { ui.trainingFilter.mode = e.target.value; renderApp(false); });
    document.getElementById('trn-loc-select')?.addEventListener('change', (e) => { ui.trainingFilter.location = e.target.value; renderApp(false); });
    document.getElementById('trn-cat-select')?.addEventListener('change', (e) => { ui.trainingFilter.category = e.target.value; renderApp(false); });

    document.getElementById('go-register-training-btn')?.addEventListener('click', () => {
      const sel = document.querySelector('input[name="selected-session"]:checked');
      if (!sel) {
        showToast('Pilih sesi pelatihan yang tersedia terlebih dahulu.', 'warning');
        return;
      }
      navigate(`#/pelatihan/daftar/${sel.value}`);
    });

    const trRegForm = document.getElementById('training-registration-form');
    if (trRegForm) {
      const seatsInput = document.getElementById('tr-seats');
      const unitPrice = Number(trRegForm.getAttribute('data-unit-price')) || 0;
      seatsInput?.addEventListener('input', () => {
        const q = Math.max(1, Number(seatsInput.value) || 1);
        const prev = document.getElementById('tr-total-preview');
        if (prev) prev.textContent = formatIDR(unitPrice * q);
      });
      trRegForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitTrainingRegistration(trRegForm.getAttribute('data-session-id'), {
          participantName: document.getElementById('tr-name').value.trim(),
          participantEmail: document.getElementById('tr-email').value.trim(),
          participantPhone: document.getElementById('tr-phone').value.trim(),
          seats: document.getElementById('tr-seats').value,
          notes: document.getElementById('tr-notes').value.trim(),
          couponCode: document.getElementById('tr-coupon').value.trim()
        });
      });
    }

    // Article & Help Search
    document.getElementById('art-search-input')?.addEventListener('input', (e) => {
      ui.articleFilter.search = e.target.value;
      ui.articleFilter.page = 1;
      renderApp(false);
      const el = document.getElementById('art-search-input');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
    document.getElementById('help-search-input')?.addEventListener('input', (e) => {
      ui.helpSearch = e.target.value;
      renderApp(false);
      const el = document.getElementById('help-search-input');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });

    // Newsletter, Contact, Help Ticket
    document.getElementById('home-newsletter-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('home-newsletter-email').value.trim();
      if (!isValidEmail(email)) return showToast('Format email tidak valid.', 'danger');
      state.settings.cms.newsletters.unshift({ id: uid('nws'), email, subscribedAt: new Date().toISOString() });
      saveState();
      e.target.reset();
      showToast('Terima kasih! Email Anda tercatat pada simulasi newsletter NEXORA.', 'success');
    });

    document.getElementById('contact-demo-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.settings.cms.supportTickets.unshift({
        id: uid('tkt'),
        name: document.getElementById('ct-name').value.trim(),
        email: document.getElementById('ct-email').value.trim(),
        topic: document.getElementById('ct-topic').value,
        message: document.getElementById('ct-msg').value.trim(),
        status: 'Baru',
        createdAt: new Date().toISOString()
      });
      saveState();
      e.target.reset();
      showToast('Pesan kontak simulasi terkirim dan muncul di Dashboard Admin.', 'success');
    });

    document.getElementById('help-ticket-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.settings.cms.supportTickets.unshift({
        id: uid('tkt'),
        name: document.getElementById('hlp-name').value.trim(),
        email: document.getElementById('hlp-email').value.trim(),
        topic: 'Pusat Bantuan',
        message: document.getElementById('hlp-msg').value.trim(),
        status: 'Baru',
        createdAt: new Date().toISOString()
      });
      saveState();
      e.target.reset();
      showToast('Permintaan bantuan simulasi berhasil dikirim.', 'success');
    });

    // Auth forms
    document.getElementById('auth-login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('lg-email').value.trim();
      const pass = document.getElementById('lg-pass').value;
      const redirect = e.target.getAttribute('data-redirect');
      const admRes = loginAsAdmin(email, pass, true);
      if (admRes.ok) {
        showToast('Masuk sebagai Admin Demo.', 'success');
        navigate(redirect || '#/admin/dashboard');
        return;
      }
      const custRes = loginAsCustomer(email, pass, true);
      if (custRes.ok) {
        showToast('Masuk sebagai Pelanggan Demo.', 'success');
        navigate(redirect || '#/akun/dashboard');
        return;
      }
      showToast('Email atau kata sandi tidak cocok pada akun demo.', 'danger');
    });
    document.getElementById('quick-login-customer')?.addEventListener('click', () => runDemoAction('login-customer'));
    document.getElementById('quick-login-admin')?.addEventListener('click', () => runDemoAction('login-admin'));

    document.getElementById('auth-register-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('rg-name').value.trim();
      const email = document.getElementById('rg-email').value.trim();
      const phone = document.getElementById('rg-phone').value.trim();
      const pass = document.getElementById('rg-pass').value;
      if (state.customers.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
        return showToast('Email sudah terdaftar pada data simulasi.', 'warning');
      }
      const newCust = {
        id: uid('cust'),
        name,
        email,
        phone,
        password: pass,
        company: '',
        role: 'customer',
        verified: false,
        preferences: { emailNotif: true, newsletter: true },
        createdAt: new Date().toISOString()
      };
      state.customers.unshift(newCust);
      loginAsCustomer(email, pass, true);
      saveState();
      showToast('Akun demo berhasil dibuat. Lanjutkan verifikasi simulasi.', 'success');
      navigate('#/verifikasi-akun');
    });

    document.getElementById('auth-forgot-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Tautan reset kata sandi simulasi dikirim! Mengarahkan ke halaman reset.', 'info');
      navigate('#/reset-sandi');
    });
    document.getElementById('auth-reset-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Kata sandi simulasi diperbarui. Silakan masuk.', 'success');
      navigate('#/masuk');
    });
    document.getElementById('verify-account-demo-btn')?.addEventListener('click', () => {
      if (state.currentUser && state.currentRole === 'customer') {
        const c = state.customers.find((x) => x.id === state.currentUser.id);
        if (c) c.verified = true;
        state.currentUser.verified = true;
        saveState();
      }
      showToast('Akun simulasi terverifikasi!', 'success');
      navigate('#/akun/dashboard');
    });

    // Cart & Checkout
    document.getElementById('cart-proceed-checkout-btn')?.addEventListener('click', startDigitalCheckout);
    document.getElementById('apply-coupon-btn')?.addEventListener('click', () => {
      ui.appliedCouponCode = document.getElementById('co-coupon-input').value.trim();
      renderApp(false);
    });
    document.getElementById('checkout-product-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      completeDigitalCheckoutForm({
        customerName: document.getElementById('co-name').value.trim(),
        customerEmail: document.getElementById('co-email').value.trim(),
        customerPhone: document.getElementById('co-phone').value.trim()
      });
    });

    // Manual Payment Upload & Drag-Drop
    const dropzone = document.getElementById('payment-dropzone');
    const fileInput = document.getElementById('payment-file-input');
    const confirmPayBtn = document.getElementById('confirm-upload-proof-btn');
    if (dropzone && fileInput) {
      pendingProofUpload = { dataUrl: '', fileName: '' };
      const applyPreview = (dataUrl, fileName) => {
        pendingProofUpload = { dataUrl, fileName };
        const box = document.getElementById('payment-preview-box');
        const img = document.getElementById('payment-preview-img');
        if (box && img) {
          img.src = dataUrl;
          box.style.display = 'block';
        }
      };
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
      dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          compressImageFile(e.dataTransfer.files[0], applyPreview);
        }
      });
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          compressImageFile(fileInput.files[0], applyPreview);
        }
      });
      document.getElementById('use-sample-proof-btn')?.addEventListener('click', () => {
        const payId = confirmPayBtn?.getAttribute('data-payment-id');
        const pay = state.payments.find((p) => p.id === payId);
        if (!pay) return;
        const uri = createSampleReceiptDataUri(pay.orderNo, pay.amount, pay.customerName, state.settings.demoBank.bankName);
        applyPreview(uri, `contoh-bukti-${pay.orderNo.toLowerCase()}.svg`);
        showToast('Contoh bukti transfer demo siap dikirim.', 'info');
      });
      confirmPayBtn?.addEventListener('click', () => {
        const payId = confirmPayBtn.getAttribute('data-payment-id');
        const pay = state.payments.find((p) => p.id === payId);
        const dataUrl = pendingProofUpload.dataUrl || (pay ? pay.proofImage : '');
        const note = document.getElementById('payment-note-input')?.value.trim() || '';
        uploadPaymentProof(payId, { imageDataUrl: dataUrl, fileName: pendingProofUpload.fileName, customerNote: note });
      });
    }

    // Customer Dashboard Forms
    document.getElementById('customer-revision-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const prjId = e.target.getAttribute('data-project-id');
      const prj = state.projects.find((p) => p.id === prjId);
      const note = document.getElementById('cust-rev-note').value.trim();
      if (!prj || !note) return;
      prj.status = 'Revisi';
      prj.revisionHistory.push({ date: new Date().toISOString(), note });
      prj.timeline.push({ date: new Date().toISOString(), title: `Pelanggan mengajukan revisi: ${note}`, by: state.currentUser.name });
      pushNotification({ userId: 'admin-01', roleTarget: 'admin', title: 'Revisi Proyek Diajukan', message: `${state.currentUser.name} mengajukan revisi pada ${prj.title}.`, link: '#/admin/proyek' });
      saveState();
      showToast('Catatan revisi terkirim ke Admin.', 'success');
      rerenderActiveViews();
    });

    document.getElementById('customer-profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('prof-name').value.trim();
      const email = document.getElementById('prof-email').value.trim();
      const phone = document.getElementById('prof-phone').value.trim();
      const company = document.getElementById('prof-company').value.trim();
      const rec = state.customers.find((c) => c.id === state.currentUser.id);
      if (rec) { rec.name = name; rec.email = email; rec.phone = phone; rec.company = company; }
      state.currentUser.name = name; state.currentUser.email = email; state.currentUser.phone = phone; state.currentUser.company = company;
      saveState();
      showToast('Profil pelanggan diperbarui.', 'success');
      rerenderActiveViews();
    });

    document.getElementById('customer-prefs-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const rec = state.customers.find((c) => c.id === state.currentUser.id);
      if (rec) {
        rec.preferences = {
          emailNotif: document.getElementById('pref-email').checked,
          newsletter: document.getElementById('pref-news').checked
        };
      }
      saveState();
      showToast('Preferensi akun disimpan.', 'success');
    });

    // Admin Filters & Forms
    document.getElementById('adm-prod-search')?.addEventListener('input', (e) => {
      ui.adminFilters.productSearch = e.target.value; ui.adminFilters.productPage = 1; renderApp(false);
      const el = document.getElementById('adm-prod-search'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
    document.getElementById('adm-prod-cat')?.addEventListener('change', (e) => { ui.adminFilters.productCat = e.target.value; ui.adminFilters.productPage = 1; renderApp(false); });
    document.getElementById('adm-prod-status')?.addEventListener('change', (e) => { ui.adminFilters.productStatus = e.target.value; ui.adminFilters.productPage = 1; renderApp(false); });
    document.getElementById('adm-add-product-btn')?.addEventListener('click', () => openAdminProductModal(null));
    document.getElementById('export-csv-btn')?.addEventListener('click', exportReportsCSV);
    document.getElementById('adm-report-period')?.addEventListener('change', (e) => { ui.adminFilters.reportPeriod = e.target.value; renderApp(false); });

    document.getElementById('adm-add-cat-btn')?.addEventListener('click', () => {
      openModal({
        title: 'Tambah Kategori Produk',
        bodyHtml: `<form id="adm-cat-form"><div class="form-group"><label class="form-label">Nama Kategori *</label><input type="text" id="ac-name" class="form-control" required></div><div class="form-group"><label class="form-label">Deskripsi *</label><textarea id="ac-desc" class="form-textarea" rows="2" required></textarea></div><button type="submit" class="btn btn-primary w-full">Simpan Kategori</button></form>`,
        onMount: () => {
          document.getElementById('adm-cat-form').addEventListener('submit', (ev) => {
            ev.preventDefault();
            const name = document.getElementById('ac-name').value.trim();
            state.categories.push({ id: uid('cat'), name, slug: slugify(name), description: document.getElementById('ac-desc').value.trim(), countLabel: 'Kategori Baru' });
            saveState(); closeModal(); showToast('Kategori ditambahkan.', 'success'); rerenderActiveViews();
          });
        }
      });
    });

    document.getElementById('adm-add-coupon-btn')?.addEventListener('click', () => {
      openModal({
        title: 'Tambah Kupon Promo Simulasi',
        bodyHtml: `<form id="adm-cpn-form"><div class="form-group"><label class="form-label">Kode Kupon *</label><input type="text" id="cp-code" class="form-control" required placeholder="PROMO20"></div><div class="grid-2"><div class="form-group"><label class="form-label">Tipe</label><select id="cp-type" class="form-select"><option value="percent">Persentase (%)</option><option value="fixed">Nominal (IDR)</option></select></div><div class="form-group"><label class="form-label">Nilai *</label><input type="number" id="cp-val" class="form-control" required value="15"></div></div><div class="form-group"><label class="form-label">Minimum Belanja (IDR)</label><input type="number" id="cp-min" class="form-control" value="100000"></div><button type="submit" class="btn btn-primary w-full">Aktifkan Kupon</button></form>`,
        onMount: () => {
          document.getElementById('adm-cpn-form').addEventListener('submit', (ev) => {
            ev.preventDefault();
            state.settings.cms.coupons.unshift({
              id: uid('cpn'), code: document.getElementById('cp-code').value.trim().toUpperCase(),
              type: document.getElementById('cp-type').value, value: Number(document.getElementById('cp-val').value) || 10,
              maxDiscount: 300000, minSpend: Number(document.getElementById('cp-min').value) || 0, active: true
            });
            saveState(); closeModal(); showToast('Kupon promo ditambahkan.', 'success'); rerenderActiveViews();
          });
        }
      });
    });

    document.getElementById('adm-add-article-btn')?.addEventListener('click', () => {
      openModal({
        title: 'Tambah Artikel Baru',
        bodyHtml: `<form id="adm-art-form"><div class="form-group"><label class="form-label">Judul Artikel *</label><input type="text" id="aa-title" class="form-control" required></div><div class="form-group"><label class="form-label">Kategori</label><select id="aa-cat" class="form-select">${state.settings.cms.articleCategories.map((c) => `<option>${escapeHtml(c)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Ringkasan *</label><textarea id="aa-exc" class="form-textarea" rows="3" required></textarea></div><button type="submit" class="btn btn-primary w-full">Terbitkan Artikel</button></form>`,
        onMount: () => {
          document.getElementById('adm-art-form').addEventListener('submit', (ev) => {
            ev.preventDefault();
            const title = document.getElementById('aa-title').value.trim();
            const cat = document.getElementById('aa-cat').value;
            const exc = document.getElementById('aa-exc').value.trim();
            state.articles.unshift({
              id: uid('art'), title, category: cat, author: `${state.currentUser.name} (Admin Demo)`, readMinutes: 5, theme: 'blue', featured: false, status: 'published', publishedAt: new Date().toISOString(), excerpt: exc,
              cover: createArtworkDataUri({ type: 'ebook', title, subtitle: cat, badge: 'INSIGHT NEXORA', theme: 'blue', seed: 510 }),
              sections: [{ id: 'sec-new-1', heading: 'Pembahasan Utama', body: exc }]
            });
            saveState(); closeModal(); showToast('Artikel baru diterbitkan.', 'success'); rerenderActiveViews();
          });
        }
      });
    });

    document.getElementById('adm-add-portfolio-btn')?.addEventListener('click', () => {
      openModal({
        title: 'Tambah Portofolio Contoh',
        bodyHtml: `<form id="adm-prt-form"><div class="form-group"><label class="form-label">Judul Proyek *</label><input type="text" id="pt-title" class="form-control" required></div><div class="form-group"><label class="form-label">Kategori</label><select id="pt-cat" class="form-select"><option>Website</option><option>Desain</option><option>Editing</option><option>Streaming</option></select></div><div class="form-group"><label class="form-label">Ringkasan *</label><textarea id="pt-sum" class="form-textarea" rows="2" required></textarea></div><button type="submit" class="btn btn-primary w-full">Simpan Portofolio</button></form>`,
        onMount: () => {
          document.getElementById('adm-prt-form').addEventListener('submit', (ev) => {
            ev.preventDefault();
            const title = document.getElementById('pt-title').value.trim();
            const cat = document.getElementById('pt-cat').value;
            const sum = document.getElementById('pt-sum').value.trim();
            const img = createArtworkDataUri({ type: 'portfolio', title, subtitle: cat, badge: 'PORTOFOLIO', theme: 'violet', seed: 610 });
            state.portfolios.unshift({ id: uid('prt'), title, category: cat, client: 'Klien Contoh Baru', theme: 'violet', summary: sum, status: 'published', completedAt: new Date().toISOString(), needs: sum, approach: 'Pendekatan bertahap dan review terstruktur.', deliverables: ['Deliverable Contoh'], outcome: 'Selesai sesuai jadwal demonstrasi.', thumbnail: img, gallery: [img] });
            saveState(); closeModal(); showToast('Portofolio baru ditambahkan.', 'success'); rerenderActiveViews();
          });
        }
      });
    });

    document.getElementById('adm-add-program-btn')?.addEventListener('click', () => {
      openModal({
        title: 'Tambah Program Pelatihan',
        bodyHtml: `<form id="adm-prog-form"><div class="form-group"><label class="form-label">Nama Program *</label><input type="text" id="prg-title" class="form-control" required></div><div class="grid-2"><div class="form-group"><label class="form-label">Mode</label><select id="prg-mode" class="form-select"><option>Offline</option><option>Online</option><option>Offline / Hybrid</option></select></div><div class="form-group"><label class="form-label">Harga (IDR)</label><input type="number" id="prg-price" class="form-control" value="500000" required></div></div><div class="form-group"><label class="form-label">Lokasi Utama</label><input type="text" id="prg-loc" class="form-control" value="Bekasi" required></div><button type="submit" class="btn btn-primary w-full">Simpan Program</button></form>`,
        onMount: () => {
          document.getElementById('adm-prog-form').addEventListener('submit', (ev) => {
            ev.preventDefault();
            const title = document.getElementById('prg-title').value.trim();
            const mode = document.getElementById('prg-mode').value;
            const loc = document.getElementById('prg-loc').value.trim();
            state.trainingPrograms.unshift({
              id: uid('trn'), title, category: 'Workshop Digital', mode, primaryLocation: loc, price: Number(document.getElementById('prg-price').value) || 500000, theme: 'blue',
              instructor: 'Tim Instruktur Contoh', shortDesc: `Program pelatihan ${title} (${mode}).`, description: `Program pelatihan ${title} di ${loc}.`,
              objectives: ['Pemahaman konsep dan praktik langsung'], curriculum: ['Sesi 1: Fondasi & Studi Kasus'], facilities: ['Modul & Sertifikat Simulasi'], requirements: 'Perangkat belajar pribadi.', faqs: [],
              thumbnail: createArtworkDataUri({ type: 'training', title, subtitle: `${mode} • ${loc}`, badge: 'AKADEMI', theme: 'blue', seed: 710 })
            });
            saveState(); closeModal(); showToast('Program pelatihan ditambahkan.', 'success'); rerenderActiveViews();
          });
        }
      });
    });

    document.getElementById('adm-add-session-btn')?.addEventListener('click', () => {
      openModal({
        title: 'Tambah Sesi Jadwal Pelatihan',
        bodyHtml: `<form id="adm-ses-form"><div class="form-group"><label class="form-label">Program</label><select id="ses-prog" class="form-select">${state.trainingPrograms.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.title)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Nama Sesi *</label><input type="text" id="ses-title" class="form-control" required placeholder="Batch Tambahan"></div><div class="grid-2"><div class="form-group"><label class="form-label">Tanggal *</label><input type="date" id="ses-date" class="form-control" required value="${new Date(Date.now() + 14 * 86400 * 1000).toISOString().slice(0, 10)}"></div><div class="form-group"><label class="form-label">Kuota *</label><input type="number" id="ses-quota" class="form-control" required value="20" min="1"></div></div><div class="form-group"><label class="form-label">Lokasi *</label><input type="text" id="ses-loc" class="form-control" required value="Online via Zoom"></div><button type="submit" class="btn btn-primary w-full">Simpan Sesi</button></form>`,
        onMount: () => {
          document.getElementById('adm-ses-form').addEventListener('submit', (ev) => {
            ev.preventDefault();
            state.trainingSessions.unshift({
              id: uid('ses'), programId: document.getElementById('ses-prog').value, title: document.getElementById('ses-title').value.trim(),
              mode: document.getElementById('ses-loc').value.toLowerCase().includes('zoom') ? 'Online' : 'Offline',
              location: document.getElementById('ses-loc').value.trim(), date: new Date(document.getElementById('ses-date').value).toISOString(),
              timeLabel: '09:00 – 16:00 WIB', quota: Number(document.getElementById('ses-quota').value) || 20, confirmedCount: 0, reservedCount: 0, status: 'open'
            });
            saveState(); closeModal(); showToast('Jadwal sesi baru ditambahkan.', 'success'); rerenderActiveViews();
          });
        }
      });
    });

    document.getElementById('admin-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.settings.siteName = document.getElementById('set-name').value.trim();
      state.settings.tagline = document.getElementById('set-tag').value.trim();
      state.settings.contactEmail = document.getElementById('set-email').value.trim();
      state.settings.contactPhone = document.getElementById('set-phone').value.trim();
      state.settings.demoBank.bankName = document.getElementById('set-bank').value.trim();
      state.settings.demoBank.accountNumber = document.getElementById('set-rek').value.trim();
      state.settings.demoBank.accountHolder = document.getElementById('set-holder').value.trim();
      state.settings.footerNote = document.getElementById('set-footer').value.trim();
      addAuditLog('UPDATE_PENGATURAN', 'settings', 'Memperbarui pengaturan website dan rekening demo.');
      saveState();
      showToast('Pengaturan website berhasil disimpan.', 'success');
      rerenderActiveViews();
    });
  }

  /* ---- Global Document Delegation (Single Listener) ---- */
  function setupGlobalDelegation() {
    document.addEventListener('click', (e) => {
      const target = e.target;

      // Close dropdowns when clicking outside
      if (!target.closest('.dropdown-wrap') && (ui.notifDropdownOpen || ui.profileDropdownOpen)) {
        ui.notifDropdownOpen = false;
        ui.profileDropdownOpen = false;
        renderApp(false);
        return;
      }
      if (!target.closest('#mega-menu-panel') && !target.closest('#mega-menu-trigger') && ui.megaMenuOpen) {
        ui.megaMenuOpen = false;
        document.getElementById('mega-menu-panel')?.classList.remove('open');
      }

      if (target.closest('[data-close-drawer]')) closeDrawer();
      if (target.closest('[data-close-mega]')) { ui.megaMenuOpen = false; document.getElementById('mega-menu-panel')?.classList.remove('open'); }
      if (target.closest('[data-close-dropdowns]')) { ui.notifDropdownOpen = false; ui.profileDropdownOpen = false; }
      if (target.closest('[data-clear-search-focus]')) { ui.searchFocused = false; }
      if (target.closest('[data-close-dash-mobile]')) { ui.dashMobileOpen = false; }

      if (target.closest('#dismiss-announcement-btn')) { ui.announcementDismissed = true; renderApp(false); return; }
      if (target.closest('#mega-menu-trigger')) { ui.megaMenuOpen = !ui.megaMenuOpen; document.getElementById('mega-menu-panel')?.classList.toggle('open', ui.megaMenuOpen); return; }
      if (target.closest('#open-cart-btn')) { openCartDrawer(); return; }
      if (target.closest('#open-mobile-nav-btn')) { openMobileNavDrawer(); return; }
      if (target.closest('#notif-toggle-btn')) { ui.notifDropdownOpen = !ui.notifDropdownOpen; ui.profileDropdownOpen = false; renderApp(false); return; }
      if (target.closest('#profile-toggle-btn')) { ui.profileDropdownOpen = !ui.profileDropdownOpen; ui.notifDropdownOpen = false; renderApp(false); return; }
      if (target.closest('#toggle-dash-collapse')) { ui.dashSidebarCollapsed = !ui.dashSidebarCollapsed; renderApp(false); return; }
      if (target.closest('#open-dash-mobile')) { ui.dashMobileOpen = !ui.dashMobileOpen; renderApp(false); return; }

      if (target.closest('#toggle-demo-panel-btn')) { ui.demoPanelOpen = !ui.demoPanelOpen; renderDemoControlCenter(); return; }
      if (target.closest('#close-demo-panel-btn')) { ui.demoPanelOpen = false; renderDemoControlCenter(); return; }

      const demoBtn = target.closest('[data-demo-action]');
      if (demoBtn) { runDemoAction(demoBtn.getAttribute('data-demo-action')); return; }

      if (target.closest('[data-action="logout"]')) { logoutDemo(); return; }

      if (target.closest('#mark-all-read-btn')) {
        getActiveNotifications().forEach((n) => { n.read = true; });
        saveState();
        renderApp(false);
        return;
      }
      const readNotif = target.closest('[data-read-notif]');
      if (readNotif) {
        const n = state.notifications.find((x) => x.id === readNotif.getAttribute('data-read-notif'));
        if (n) { n.read = true; saveState(); }
      }

      // Accordion
      const accTrigger = target.closest('[data-accordion-trigger]');
      if (accTrigger) {
        const item = accTrigger.closest('[data-accordion-item]');
        const isOpen = item.classList.toggle('open');
        accTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        return;
      }

      // Gallery thumbnail swap
      const galBtn = target.closest('[data-gallery-thumb]');
      if (galBtn) {
        const mainImg = document.getElementById('prod-main-img');
        if (mainImg) mainImg.src = galBtn.getAttribute('data-gallery-thumb');
        return;
      }

      // Copy helpers
      const copyBtn = target.closest('[data-copy-text]');
      if (copyBtn) { copyText(copyBtn.getAttribute('data-copy-text'), copyBtn.getAttribute('data-copy-label') || 'Teks'); return; }
      if (target.closest('[data-copy-url]')) { copyText(window.location.href, 'Tautan artikel'); return; }

      // Scroll to section (article TOC)
      const scrollBtn = target.closest('[data-scroll-target]');
      if (scrollBtn) {
        document.getElementById(scrollBtn.getAttribute('data-scroll-target'))?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Cart actions
      const addCartBtn = target.closest('[data-add-cart]');
      if (addCartBtn) { addToCart(addCartBtn.getAttribute('data-add-cart'), 1, true); return; }
      const buyNowBtn = target.closest('[data-buy-now]');
      if (buyNowBtn) { buyProductNow(buyNowBtn.getAttribute('data-buy-now')); return; }
      const cartQtyBtn = target.closest('[data-cart-qty]');
      if (cartQtyBtn) { updateCartQty(cartQtyBtn.getAttribute('data-cart-qty'), Number(cartQtyBtn.getAttribute('data-delta'))); return; }
      const cartRemBtn = target.closest('[data-cart-remove]');
      if (cartRemBtn) { removeFromCart(cartRemBtn.getAttribute('data-cart-remove')); return; }

      // View / Filter / Pagination buttons
      const viewBtn = target.closest('[data-catalog-view]');
      if (viewBtn) { ui.catalog.view = viewBtn.getAttribute('data-catalog-view'); renderApp(false); return; }
      const catPageBtn = target.closest('[data-catalog-page]');
      if (catPageBtn) { ui.catalog.page = Number(catPageBtn.getAttribute('data-catalog-page')); renderApp(true); return; }
      const artCatBtn = target.closest('[data-art-cat]');
      if (artCatBtn) { ui.articleFilter.category = artCatBtn.getAttribute('data-art-cat'); ui.articleFilter.page = 1; renderApp(false); return; }
      const artPageBtn = target.closest('[data-art-page]');
      if (artPageBtn) { ui.articleFilter.page = Number(artPageBtn.getAttribute('data-art-page')); renderApp(true); return; }
      const portCatBtn = target.closest('[data-port-cat]');
      if (portCatBtn) { ui.portfolioFilter.category = portCatBtn.getAttribute('data-port-cat'); renderApp(false); return; }
      const helpCatBtn = target.closest('[data-help-cat]');
      if (helpCatBtn) { ui.helpCategory = helpCatBtn.getAttribute('data-help-cat'); renderApp(false); return; }
      const coTabBtn = target.closest('[data-checkout-tab]');
      if (coTabBtn) { ui.checkoutTab = coTabBtn.getAttribute('data-checkout-tab'); renderApp(false); return; }

      // Custom Wizard Steps
      const cwNext = target.closest('[data-cw-next]');
      if (cwNext) {
        const nextStep = Number(cwNext.getAttribute('data-cw-next'));
        if (ui.customWizardStep === 1) {
          ui.customWizardData.serviceType = document.getElementById('cw-service').value;
          ui.customWizardData.needs = Array.from(document.querySelectorAll('.cw-need-cb:checked')).map((c) => c.value);
        } else if (ui.customWizardStep === 2) {
          const title = document.getElementById('cw-title').value.trim();
          const desc = document.getElementById('cw-desc').value.trim();
          if (!title || !desc) { showToast('Judul dan deskripsi proyek wajib diisi.', 'warning'); return; }
          ui.customWizardData.projectTitle = title;
          ui.customWizardData.description = desc;
          ui.customWizardData.budgetRange = document.getElementById('cw-budget').value;
          ui.customWizardData.timeline = document.getElementById('cw-timeline').value;
        } else if (ui.customWizardStep === 3) {
          const cn = document.getElementById('cw-cname').value.trim();
          const ce = document.getElementById('cw-cemail').value.trim();
          const cp = document.getElementById('cw-cphone').value.trim();
          if (!cn || !isValidEmail(ce) || !cp) { showToast('Lengkapi nama, email valid, dan nomor telepon.', 'warning'); return; }
          ui.customWizardData.contactName = cn;
          ui.customWizardData.contactEmail = ce;
          ui.customWizardData.contactPhone = cp;
          const fileEl = document.getElementById('cw-file');
          ui.customWizardData.attachmentName = fileEl && fileEl.files[0] ? fileEl.files[0].name : '';
        }
        ui.customWizardStep = nextStep;
        renderApp(true);
        return;
      }
      const cwPrev = target.closest('[data-cw-prev]');
      if (cwPrev) { ui.customWizardStep = Number(cwPrev.getAttribute('data-cw-prev')); renderApp(false); return; }

      // Blob Download & Quotation Respond
      const dlBtn = target.closest('[data-download-blob]');
      if (dlBtn) { downloadDigitalDeliverable(dlBtn.getAttribute('data-download-blob'), dlBtn.getAttribute('data-product-id')); return; }
      const qRespBtn = target.closest('[data-quote-respond]');
      if (qRespBtn) {
        const qId = qRespBtn.getAttribute('data-quote-respond');
        const accept = qRespBtn.getAttribute('data-accept') === 'true';
        openConfirmModal({
          title: accept ? 'Setujui Penawaran Custom?' : 'Tolak Penawaran Custom?',
          message: accept ? 'Invoice pembayaran akan langsung dibuat berdasarkan nilai penawaran ini.' : 'Penawaran akan ditandai ditolak.',
          confirmText: accept ? 'Setujui & Buat Invoice' : 'Tolak Penawaran',
          confirmClass: accept ? 'btn-success' : 'btn-danger',
          onConfirm: () => respondToQuotation(qId, accept)
        });
        return;
      }

      // Admin Actions
      const admPayInspect = target.closest('[data-admin-inspect-pay]');
      if (admPayInspect) { openPaymentInspectModal(admPayInspect.getAttribute('data-admin-inspect-pay')); return; }
      const admPayFilter = target.closest('[data-adm-pay-filter]');
      if (admPayFilter) { ui.adminFilters.paymentStatus = admPayFilter.getAttribute('data-adm-pay-filter'); renderApp(false); return; }
      const admOrdType = target.closest('[data-adm-order-type]');
      if (admOrdType) { ui.adminFilters.orderType = admOrdType.getAttribute('data-adm-order-type'); renderApp(false); return; }
      const admProdPage = target.closest('[data-adm-prod-page]');
      if (admProdPage) { ui.adminFilters.productPage = Number(admProdPage.getAttribute('data-adm-prod-page')); renderApp(false); return; }
      const admEditProd = target.closest('[data-adm-edit-product]');
      if (admEditProd) { openAdminProductModal(admEditProd.getAttribute('data-adm-edit-product')); return; }
      const admTogProd = target.closest('[data-adm-toggle-product]');
      if (admTogProd) {
        const prod = state.products.find((p) => p.id === admTogProd.getAttribute('data-adm-toggle-product'));
        if (prod) {
          prod.status = prod.status === 'active' ? 'archived' : 'active';
          addAuditLog(prod.status === 'active' ? 'AKTIFKAN_PRODUK' : 'ARSIP_PRODUK', prod.id, `${prod.name} diubah ke ${prod.status}.`);
          saveState();
          showToast(`Produk "${prod.name}" kini ${prod.status === 'active' ? 'Aktif' : 'Diarsipkan'}.`, 'info');
          rerenderActiveViews();
        }
        return;
      }
      const admTogCpn = target.closest('[data-adm-toggle-coupon]');
      if (admTogCpn) {
        const cpn = state.settings.cms.coupons.find((c) => c.id === admTogCpn.getAttribute('data-adm-toggle-coupon'));
        if (cpn) { cpn.active = !cpn.active; saveState(); rerenderActiveViews(); }
        return;
      }
      const admCreateQuo = target.closest('[data-adm-create-quote]');
      if (admCreateQuo) { openAdminQuotationModal(admCreateQuo.getAttribute('data-adm-create-quote'), null); return; }
      const admRevQuo = target.closest('[data-adm-revise-quote]');
      if (admRevQuo) {
        const q = state.quotations.find((x) => x.id === admRevQuo.getAttribute('data-adm-revise-quote'));
        if (q) openAdminQuotationModal(q.requestId, q.id);
        return;
      }
      const admEditPrj = target.closest('[data-adm-edit-project]');
      if (admEditPrj) { openAdminProjectModal(admEditPrj.getAttribute('data-adm-edit-project')); return; }
      const admEditPkg = target.closest('[data-adm-edit-pkg]');
      if (admEditPkg) {
        const pk = state.servicePackages.find((x) => x.id === admEditPkg.getAttribute('data-adm-edit-pkg'));
        if (!pk) return;
        openModal({
          title: `Edit Paket — ${pk.name}`,
          bodyHtml: `<form id="adm-pkg-form"><div class="form-group"><label class="form-label">Harga Paket (IDR)</label><input type="number" id="epk-price" class="form-control" value="${pk.price}" required></div><div class="grid-2"><div class="form-group"><label class="form-label">Estimasi (Hari)</label><input type="number" id="epk-days" class="form-control" value="${pk.estimatedDays}" required></div><div class="form-group"><label class="form-label">Batas Revisi</label><input type="number" id="epk-rev" class="form-control" value="${pk.revisions}" required></div></div><button type="submit" class="btn btn-primary w-full">Simpan Perubahan</button></form>`,
          onMount: () => {
            document.getElementById('adm-pkg-form').addEventListener('submit', (ev) => {
              ev.preventDefault();
              pk.price = Number(document.getElementById('epk-price').value) || pk.price;
              pk.estimatedDays = Number(document.getElementById('epk-days').value) || pk.estimatedDays;
              pk.revisions = Number(document.getElementById('epk-rev').value) || pk.revisions;
              saveState(); closeModal(); showToast('Paket jasa diperbarui.', 'success'); rerenderActiveViews();
            });
          }
        });
        return;
      }
      const admEditSrv = target.closest('[data-adm-edit-service]');
      if (admEditSrv) {
        const srv = state.services.find((x) => x.id === admEditSrv.getAttribute('data-adm-edit-service'));
        if (!srv) return;
        openModal({
          title: `Edit Jasa — ${srv.name}`,
          bodyHtml: `<form id="adm-srv-form"><div class="form-group"><label class="form-label">Nama Jasa</label><input type="text" id="esv-name" class="form-control" value="${escapeHtml(srv.name)}" required></div><div class="form-group"><label class="form-label">Harga Mulai (IDR)</label><input type="number" id="esv-price" class="form-control" value="${srv.startingPrice}" required></div><div class="form-group"><label class="form-label">Estimasi Label</label><input type="text" id="esv-est" class="form-control" value="${escapeHtml(srv.estimateLabel)}" required></div><button type="submit" class="btn btn-primary w-full">Simpan Jasa</button></form>`,
          onMount: () => {
            document.getElementById('adm-srv-form').addEventListener('submit', (ev) => {
              ev.preventDefault();
              srv.name = document.getElementById('esv-name').value.trim();
              srv.startingPrice = Number(document.getElementById('esv-price').value) || srv.startingPrice;
              srv.estimateLabel = document.getElementById('esv-est').value.trim();
              saveState(); closeModal(); showToast('Data jasa diperbarui.', 'success'); rerenderActiveViews();
            });
          }
        });
        return;
      }
      const admEditProg = target.closest('[data-adm-edit-program]');
      if (admEditProg) {
        const prg = state.trainingPrograms.find((x) => x.id === admEditProg.getAttribute('data-adm-edit-program'));
        if (!prg) return;
        openModal({
          title: `Edit Program — ${prg.title}`,
          bodyHtml: `<form id="adm-prg-edit-form"><div class="form-group"><label class="form-label">Judul Program</label><input type="text" id="epr-title" class="form-control" value="${escapeHtml(prg.title)}" required></div><div class="form-group"><label class="form-label">Harga (IDR)</label><input type="number" id="epr-price" class="form-control" value="${prg.price}" required></div><button type="submit" class="btn btn-primary w-full">Simpan</button></form>`,
          onMount: () => {
            document.getElementById('adm-prg-edit-form').addEventListener('submit', (ev) => {
              ev.preventDefault();
              prg.title = document.getElementById('epr-title').value.trim();
              prg.price = Number(document.getElementById('epr-price').value) || prg.price;
              saveState(); closeModal(); showToast('Program pelatihan diperbarui.', 'success'); rerenderActiveViews();
            });
          }
        });
        return;
      }
      const admEditSes = target.closest('[data-adm-edit-session]');
      if (admEditSes) {
        const ses = state.trainingSessions.find((x) => x.id === admEditSes.getAttribute('data-adm-edit-session'));
        if (!ses) return;
        openModal({
          title: `Ubah Kuota Sesi — ${ses.title}`,
          bodyHtml: `<form id="adm-ses-edit-form"><div class="form-group"><label class="form-label">Kuota Maksimal</label><input type="number" id="ese-quota" class="form-control" value="${ses.quota}" min="${ses.confirmedCount}" required></div><button type="submit" class="btn btn-primary w-full">Simpan Kuota</button></form>`,
          onMount: () => {
            document.getElementById('adm-ses-edit-form').addEventListener('submit', (ev) => {
              ev.preventDefault();
              ses.quota = Number(document.getElementById('ese-quota').value) || ses.quota;
              saveState(); closeModal(); showToast('Kuota sesi diperbarui.', 'success'); rerenderActiveViews();
            });
          }
        });
        return;
      }
      const admRelEnr = target.closest('[data-adm-release-enroll]');
      if (admRelEnr) { releaseExpiredTrainingReservation(admRelEnr.getAttribute('data-adm-release-enroll')); return; }
      const admConfEnr = target.closest('[data-adm-confirm-enroll]');
      if (admConfEnr) {
        const enr = state.enrollments.find((x) => x.id === admConfEnr.getAttribute('data-adm-confirm-enroll'));
        if (enr) {
          const ses = state.trainingSessions.find((s) => s.id === enr.sessionId);
          enr.status = 'Terkonfirmasi';
          if (ses) {
            ses.reservedCount = Math.max(0, ses.reservedCount - enr.seats);
            ses.confirmedCount += enr.seats;
          }
          saveState(); showToast('Pendaftaran peserta dikonfirmasi.', 'success'); rerenderActiveViews();
        }
        return;
      }
      const admTogArt = target.closest('[data-adm-toggle-article]');
      if (admTogArt) {
        const a = state.articles.find((x) => x.id === admTogArt.getAttribute('data-adm-toggle-article'));
        if (a) { a.status = a.status === 'published' ? 'archived' : 'published'; saveState(); rerenderActiveViews(); }
        return;
      }
      const admTogBanner = target.closest('[data-adm-toggle-banner]');
      if (admTogBanner) {
        const b = state.settings.cms.banners.find((x) => x.id === admTogBanner.getAttribute('data-adm-toggle-banner'));
        if (b) { b.status = b.status === 'active' ? 'inactive' : 'active'; saveState(); rerenderActiveViews(); }
        return;
      }
      const admTogPort = target.closest('[data-adm-toggle-port]');
      if (admTogPort) {
        const pt = state.portfolios.find((x) => x.id === admTogPort.getAttribute('data-adm-toggle-port'));
        if (pt) { pt.status = pt.status === 'published' ? 'archived' : 'published'; saveState(); rerenderActiveViews(); }
      }
    });

    document.addEventListener('change', (e) => {
      const cb = e.target.closest('[data-cart-toggle]');
      if (cb) {
        toggleCartItem(cb.getAttribute('data-cart-toggle'));
      }
    });
  }

  function setupRevealObserver() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in-view'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach((el) => obs.observe(el));
  }

  function setupScrollHelpers() {
    const backBtn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
      const header = document.getElementById('site-header');
      if (header) header.classList.toggle('scrolled', window.scrollY > 12);
      if (backBtn) backBtn.classList.toggle('visible', window.scrollY > 360);
    }, { passive: true });
    backBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ------------------------------------------------------------------------
     19. BOOTSTRAP
     ------------------------------------------------------------------------ */
  function initApp() {
    loadState();
    setupGlobalDelegation();
    setupScrollHelpers();
    window.addEventListener('hashchange', () => renderApp(true));
    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      renderApp(true);
    }
    if (ui.storageError) {
      showToast(ui.storageError, 'warning', 5500);
    }
  }

  // Expose safe inspection handle for QA verification in browser/Node
  window.NEXORA_APP = { state, resetDemoState, computeAnalytics };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
