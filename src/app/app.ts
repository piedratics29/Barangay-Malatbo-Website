import {
  ChangeDetectionStrategy,
  Component,
  AfterViewInit,
  OnDestroy,
  OnInit,
  ElementRef,
  HostListener,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import {isPlatformBrowser, CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';

export interface Official {
  id: number;
  name: string;
  role: string;
  committee: string;
  photoUrl: string;
  fallbackColor: string;
  initials: string;
  email: string;
}

export interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: 'Announcements' | 'Health' | 'Infrastructure' | 'Livelihood';
  readTime: string;
  icon: string;
}

export interface ProjectItem {
  id: number;
  title: string;
  description: string;
  status: 'Completed' | 'In Progress' | 'Planning';
  progress: number;
  sitio: string;
  cost: string;
}

export interface TourismItem {
  id: number;
  title: string;
  description: string;
  location: string;
  photoUrl: string;
  alt: string;
}

export interface RequestReceipt {
  referenceId: string;
  fullName: string;
  serviceType: string;
  purok: string;
  purpose: string;
  fee: string;
  dateRequested: string;
  pickupDate: string;
  status: 'Pending Verification' | 'Approved' | 'Ready for Pickup';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private revealObserver?: IntersectionObserver;
  private countUpAnimation?: number;
  private lastScrollY = 0;

  // Core visual states
  isBrowser = signal(false);
  scrolledDown = signal(false);
  headerSticky = signal(false);
  activeSection = signal('home');
  mobileMenuOpen = signal(false);

  // Stats signals
  stats = [
    {label: 'Total Population', count: 1420, current: 0, suffix: '+'},
    {label: 'Active Households', count: 350, current: 0, suffix: ''},
    {label: 'Registered Sitios / Puroks', count: 7, current: 0, suffix: ''},
    {label: 'Ongoing Programs', count: 12, current: 0, suffix: '+'},
  ];

  // News active filter
  newsFilter = signal<string>('All');
  selectedNewsItem = signal<NewsItem | null>(null);

  // Projects active filter
  projectFilter = signal<string>('All');

  // Interactive selectors
  selectedOfficial = signal<Official | null>(null);
  selectedTourismItem = signal<TourismItem | null>(null);

  // Forms
  certificateForm!: FormGroup;
  contactForm!: FormGroup;

  // Requests Tracking
  submissionLoading = signal(false);
  submittedRequest = signal<RequestReceipt | null>(null);
  puroks = [
    'Purok 1 (Centrum)',
    'Purok 2 (Sapa)',
    'Purok 3 (Manga)',
    'Purok 4 (Crossing)',
    'Purok 5 (Cogon)',
    'Purok 6 (Kawayan)',
    'Purok 7 (Mahogany)',
  ];

  // Feedback/Inquiries logs (locally persisted in browser session for realistic CRM tracking)
  feedbackLogs = signal<
    {
      id: string;
      name: string;
      subject: string;
      message: string;
      date: string;
      status: string;
      adminReply: string;
    }[]
  >([]);
  contactSubmitted = signal(false);

  // Image load helper tracking fallbacks
  brokenImages = signal<Record<string, boolean>>({});

  // Assets mapped to attachments
  logoUrl = 'LOGO.png';

  officials: Official[] = [
    {
      id: 0,
      name: 'Hon. Roberto A. Esmedina',
      role: 'Punong Barangay (Barangay Captain)',
      committee:
        'Committee Chairman on General Services, Peace & Order, and Executive Administration.',
      photoUrl: 'Captain.png',
      fallbackColor: 'bg-indigo-900 text-yellow-400',
      initials: 'RE',
      email: 'cap.robertesmedina@malatbo.gov.ph',
    },
    {
      id: 1,
      name: 'Hon. Glendale Rodriguez',
      role: 'Barangay Kagawad (Councilor)',
      committee: 'Chairman: Committee on Finance, Appropriations & Budget.',
      photoUrl: 'kagawad1.png',
      fallbackColor: 'bg-emerald-800 text-teal-100',
      initials: 'GR',
      email: 'kag.glendalerodriguez@malatbo.gov.ph',
    },
    {
      id: 2,
      name: 'Hon. Jelson Cedeño',
      role: 'Barangay Kagawad (Councilor)',
      committee: 'Chairman: Committee on Infrastructure, Public Works & Utilities.',
      photoUrl: 'kagawad2.png',
      fallbackColor: 'bg-blue-800 text-blue-100',
      initials: 'JC',
      email: 'kag.jelsoncedeño@malatbo.gov.ph',
    },
    {
      id: 3,
      name: 'Hon. Pedrita Vilar',
      role: 'Barangay Kagawad (Councilor)',
      committee: 'Chairwoman: Committee on Health, Sanitation & Social Welfare.',
      photoUrl: 'kagawad3.png',
      fallbackColor: 'bg-rose-800 text-rose-100',
      initials: 'PV',
      email: 'kag.pedritavilar@malatbo.gov.ph',
    },
    {
      id: 4,
      name: 'Hon. Anecita Montecalbo',
      role: 'Barangay Kagawad (Councilor)',
      committee: 'Chairwoman: Committee on Education, Culture, Women & Family Affairs.',
      photoUrl: 'kagawad4.png',
      fallbackColor: 'bg-purple-800 text-purple-100',
      initials: 'AM',
      email: 'kag.anecitamontecalbo@malatbo.gov.ph',
    },
    {
      id: 5,
      name: 'Hon. Eddie Montecalvo',
      role: 'Barangay Kagawad (Councilor)',
      committee: 'Chairman: Committee on Agriculture, Livelihood, & Cooperatives.',
      photoUrl: 'kagawad5.png',
      fallbackColor: 'bg-cyan-800 text-cyan-100',
      initials: 'EM',
      email: 'kag.eddiemontecalvo@malatbo.gov.ph',
    },
    {
      id: 6,
      name: 'Hon. Cesar Singco',
      role: 'Barangay Kagawad (Councilor)',
      committee: 'Chairman: Committee on Environmental Protection & Climate Action.',
      photoUrl: 'kagawad6.png',
      fallbackColor: 'bg-amber-800 text-amber-100',
      initials: 'CS',
      email: 'kag.cesarsingco@malatbo.gov.ph',
    },
    {
      id: 7,
      name: 'Hon. Noel Sariño',
      role: 'Barangay Kagawad (Councilor)',
      committee: 'Chairman: Committee on Rules, Privileges, Laws, and Human Rights.',
      photoUrl: 'kagawad7.png',
      fallbackColor: 'bg-slate-800 text-slate-100',
      initials: 'NS',
      email: 'kag.noelsariño@malatbo.gov.ph',
    },
    {
      id: 8,
      name: 'Hon. Niño Acosta',
      role: 'SK Chairperson (Youth Representative)',
      committee:
        'Chairman: Committee on Youth & Sports Development; Advocator for digital literacy.',
      photoUrl: 'sk chairman.png',
      fallbackColor: 'bg-pink-800 text-pink-100',
      initials: 'NA',
      email: 'sk.ninoacosta@malatbo.gov.ph',
    },
    {
      id: 9,
      name: 'Ms. Jezamine Magalso',
      role: 'Barangay Secretary',
      committee:
        'Head of Administrative Services, Civic Registry, and Document Archival Operations.',
      photoUrl: 'secretary.png',
      fallbackColor: 'bg-teal-900 text-teal-200',
      initials: 'JM',
      email: 'sec.jezaminemagalso@malatbo.gov.ph',
    },
  ];

  news: NewsItem[] = [
    {
      id: 1,
      title: 'Barangay Hall Complex Transitioned to 100% Solar Energy Grid',
      excerpt:
        'In keeping with Malatbo’s future-ready mandate, the official municipal hall and local clinic are now powered fully by green micro-grids.',
      content:
        'Barangay Malatbo makes history as one of the first micro-grids in Ginatilan, Cebu to run its public administrative buildings completely on clean solar radiation. The recently finished project features twenty-four 450W solar photovon panels and a smart modular lithium storage battery bank. This green system ensures un-interrupted public service operations during typhoons and grid failures, while slashing the barangay’s electric tariffs by over 75%. All savings will be re-routed to community medicine budgets.',
      date: 'June 10, 2026',
      category: 'Announcements',
      readTime: '4 min read',
      icon: 'solar_power',
    },
    {
      id: 2,
      title: 'Critical Health Outreach: Free Tele-Diagnostic Camp Scheduled',
      excerpt:
        'Our local Health Station launches a comprehensive wellness caravan in Purok 4 providing medical laboratory tracking.',
      content:
        'To empower the health and wellness profiles of families in our outer sitios, the Barangay Council of Malatbo, in partnership with Cebu Provincial Health, is hosting a Free Wellness and Advanced Diagnostic Caravan on June 22, 2026. Services include complete blood chemistry panels, ECG tests, pediatric checkups, and free supply of maintenance prescription medicines. To promote accessibility for our senior residents, free round-trip shuttle transportation will be organized across all seven Puroks.',
      date: 'June 12, 2026',
      category: 'Health',
      readTime: '3 min read',
      icon: 'health_and_safety',
    },
    {
      id: 3,
      title: 'Sitio Upper Malatbo Concreting Work Phase 2 Officially Initiated',
      excerpt:
        'Department of Public Works and Highways approves initial funding for complete agricultural highway linking Sitio Manga to outer plains.',
      content:
        'The long-awaited farm-to-market highway connecting Purok 3 (Manga) and the upland copra plains has broken ground. Phase 2 extends a thick 230mm reinforced roadbed specifically constructed to support coconut transport haulers. This 1.2-kilometer connection includes custom safety concrete drainage channels to prevent water logging and landslides during rain-monsoons, supporting over 120 copra farming families.',
      date: 'May 28, 2026',
      category: 'Infrastructure',
      readTime: '5 min read',
      icon: 'engineering',
    },
    {
      id: 4,
      title: 'Digital Livelihood Program Launched: E-Commerce for Artisans',
      excerpt:
        'In coordination with SK Malatbo, youth and local farmers acquire digital platforms to market sweet copra crafts directly.',
      content:
        'Sponsored by the Sangguniang Kabataan and local agricultural cooperatives, a weekend workshop is introduced to guide our residents in selling agricultural products (e.g. coco-nectar, sweet copra flakes, and woven crafts) online. The program handles mobile digital photography, basic branding, and onboarding onto popular digital marketplaces. High-speed Wi-Fi hubs at the Barangay Hall will are now designated open-access for native merchant transactions.',
      date: 'May 15, 2026',
      category: 'Livelihood',
      readTime: '4 min read',
      icon: 'devices_other',
    },
  ];

  projects: ProjectItem[] = [
    {
      id: 1,
      title: 'Decentralized Smart Solar Streetlighting',
      description:
        'Acquisition and grid assembly of 120 autonomous solar-powered LED lamps with high-sensitivity motion triggers and weather-proof lithium enclosures. Designed to keep agricultural trails safe after twilight.',
      status: 'Completed',
      progress: 100,
      sitio: 'Purok 1 through 7',
      cost: '₱450,000.00',
    },
    {
      id: 2,
      title: 'Sitio Crossing Modern Spill-Bridge Reconstruction',
      description:
        'Heavy construction of a durable, elevated reinforced spillway bridge spanning the river connection. Eliminates flash flood blockages and isolates during standard tropical storm surges.',
      status: 'In Progress',
      progress: 85,
      sitio: 'Purok 4 (Crossing)',
      cost: '₱820,000.00',
    },
    {
      id: 3,
      title: 'Barangay Telemedicine & Diagnostics Annex',
      description:
        'Building addition to our health center featuring modern automated blood chemistry analysers, ECG, and a high-speed fiber diagnostic server linked to provincial hospital specialist physicians.',
      status: 'Planning',
      progress: 15,
      sitio: 'Purok 1 (Centrum)',
      cost: '₱600,000.00',
    },
    {
      id: 4,
      title: 'Barangay Multi-Purpose Canopy & Court Roofing',
      description:
        'Successful reconstruction and steel truss truss-canopy weather-proofing of our community court, housing evacuation modules, sports events, farmer assemblies, and government transparency sessions.',
      status: 'Completed',
      progress: 100,
      sitio: 'Purok 1 (Centrum)',
      cost: '₱1,200,000.00',
    },
  ];

  tourism: TourismItem[] = [
    {
      id: 1,
      title: 'Malatbo Three-Tiered Falls',
      description:
        'An enchanting hidden paradise featuring multi-tiered turquoise mineral pools and cold waterfalls fed by deep tropical mountain aquifers, shaded beautifully under centuries-old rainforest foliage.',
      location: 'Upland Sitio Forest Reserve, Barangay Malatbo',
      photoUrl:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop',
      alt: 'Lush tropical waterfalls',
    },
    {
      id: 2,
      title: 'Mount Malatbo Scenic Overlook',
      description:
        'The highest geographical height in Ginatilan, providing panoramic 360-degree scenery of the Tañon Strait, rolling coastal coconut hills, and the distant volcanic peaks of Negros Island.',
      location: 'Sitio Mahogany Heights, Barangay Malatbo',
      photoUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop',
      alt: 'Mountain overlook scenery',
    },
    {
      id: 3,
      title: 'Lush Sweet Copra Farming Trails',
      description:
        'A beautiful, fully organized agro-tourism walking trail looping through hectares of heritage coconut orchards. Visitors observe traditional copra smoke-drying and sample fresh coco-nectar.',
      location: 'Sitio Manga, Barangay Malatbo',
      photoUrl:
        'https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=1000&auto=format&fit=crop',
      alt: 'Coconut groves',
    },
    {
      id: 4,
      title: 'Historic San Jose Stone Chapel',
      description:
        'A beautifully preserved 19th-century Spanish-era stone-and-timber sanctuary. Features ornate hardwood carvings made by original barangay ancestors, standing as a beacon of cultural trust and history.',
      location: 'Sitio Centrum, Barangay Malatbo',
      photoUrl:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000&auto=format&fit=crop',
      alt: 'Historical stone chapel',
    },
  ];

  filteredNews = computed(() => {
    const filterValue = this.newsFilter();
    if (filterValue === 'All') {
      return this.news;
    }
    return this.news.filter((item) => item.category === filterValue);
  });

  filteredProjects = computed(() => {
    const filterValue = this.projectFilter();
    if (filterValue === 'All') {
      return this.projects;
    }
    return this.projects.filter((item) => item.status === filterValue);
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.isBrowser.set(true);
      this.loadSavedData();
      this.triggerCountUp();
    }

    // Initialize Certificate Request Form
    this.certificateForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(4)]],
      purok: ['', Validators.required],
      serviceType: ['', Validators.required],
      purpose: ['', [Validators.required, Validators.minLength(10)]],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9+ ]{10,14}$/)]],
      requirementsUpload: [''],
    });

    // Initialize Contact Form
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      purok: [''],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(15)]],
    });
  }

  ngAfterViewInit() {
    if (!this.isBrowser()) {
      return;
    }

    this.lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    window.setTimeout(() => this.prepareScrollReveals());
  }

  ngOnDestroy() {
    this.revealObserver?.disconnect();

    if (this.countUpAnimation) {
      cancelAnimationFrame(this.countUpAnimation);
    }
  }

  loadSavedData() {
    try {
      const savedRequests = localStorage.getItem('malatbo_requests');
      if (savedRequests) {
        // We can load requests if needed, but for user demo, we let them create live ones!
      }
      const savedFeedback = localStorage.getItem('malatbo_feedback_logs');
      if (savedFeedback) {
        this.feedbackLogs.set(JSON.parse(savedFeedback));
      } else {
        // Prepopulate with a mock history for premium feedback feel
        const prepopulated = [
          {
            id: 'REF-88910',
            name: 'Resident Feedback',
            subject: 'Street light repair request in Purok 5',
            message:
              'Good day! The newly installed solar lamp near the banana grove has flickering motion sensors. Respectfully requesting technical assistance.',
            date: 'June 13, 2026',
            status: 'Assigned to Tech Crew',
            adminReply: 'Noted! The technical monitoring unit will inspect the node on June 15.',
          },
        ];
        this.feedbackLogs.set(prepopulated);
        localStorage.setItem('malatbo_feedback_logs', JSON.stringify(prepopulated));
      }
    } catch (e) {
      console.warn('Storage failed:', e);
    }
  }

  // Active navigation highlight detection
  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isBrowser()) {
      return;
    }

    const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollDelta = scrollPos - this.lastScrollY;
    const isScrollingDown = scrollDelta > 4;
    const isScrollingUp = scrollDelta < -12;

    this.scrolledDown.set(scrollPos > 60);

    if (scrollPos <= 8) {
      this.headerSticky.set(false);
    } else if (isScrollingDown) {
      this.headerSticky.set(scrollPos > 16);
    } else if (isScrollingUp) {
      this.headerSticky.set(false);
    }

    this.lastScrollY = scrollPos;

    // Scan sections to find currently active section
    const secNames = [
      'home',
      'about',
      'officials',
      'services',
      'news',
      'projects',
      'tourism',
      'contact',
    ];
    for (const sec of secNames) {
      const el = document.getElementById(sec);
      if (el) {
        const top = el.offsetTop - 120;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          this.activeSection.set(sec);
          break;
        }
      }
    }
  }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(event: PointerEvent) {
    if (!this.isBrowser()) {
      return;
    }

    this.host.nativeElement.style.setProperty('--cursor-x', `${event.clientX}px`);
    this.host.nativeElement.style.setProperty('--cursor-y', `${event.clientY}px`);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((open) => !open);
  }

  scrollToSection(secId: string) {
    if (!this.isBrowser()) {
      return;
    }
    const el = document.getElementById(secId);
    if (el) {
      const yOffset = -80; // offset navbar
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      this.headerSticky.set(true);
      window.scrollTo({top: y, behavior: 'smooth'});
      this.activeSection.set(secId);
      this.mobileMenuOpen.set(false);
    }
  }

  scrollToTop() {
    if (!this.isBrowser()) {
      return;
    }

    window.scrollTo({top: 0, behavior: 'smooth'});
    this.activeSection.set('home');
    this.mobileMenuOpen.set(false);
  }

  triggerCountUp() {
    const duration = 1600;
    const start = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      this.stats = this.stats.map((s) => {
        const currentCount = Math.floor(s.count * easedProgress);
        return {
          ...s,
          current: currentCount > s.count ? s.count : currentCount,
        };
      });

      if (progress < 1) {
        this.countUpAnimation = requestAnimationFrame(animate);
      } else {
        this.stats = this.stats.map((s) => ({...s, current: s.count}));
      }
    };

    this.countUpAnimation = requestAnimationFrame(animate);
  }

  private prepareScrollReveals() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const selectors = [
      'section:not(#home) > div',
      'section:not(#home) h2',
      'section:not(#home) .grid > *',
      'section:not(#home) form',
      'footer > div',
    ];
    const revealTargets = Array.from(
      this.host.nativeElement.querySelectorAll(selectors.join(',')),
    ).filter((target): target is HTMLElement => target instanceof HTMLElement);

    revealTargets.forEach((target, index) => {
      target.classList.add('reveal-on-scroll');
      target.style.setProperty('--reveal-delay', `${Math.min(index % 8, 6) * 70}ms`);

      if (prefersReducedMotion) {
        target.classList.add('is-visible');
      }
    });

    if (prefersReducedMotion) {
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.revealObserver?.unobserve(entry.target);
          }
        });
      },
      {rootMargin: '0px 0px -12% 0px', threshold: 0.12},
    );

    revealTargets.forEach((target) => this.revealObserver?.observe(target));
  }

  onPhotoError(itemType: string, id: number) {
    // Set broken flag so template falls back to vector initials
    const key = `${itemType}_${id}`;
    this.brokenImages.update((prev) => ({...prev, [key]: true}));
  }

  isImageBroken(itemType: string, id: number): boolean {
    return !!this.brokenImages()[`${itemType}_${id}`];
  }

  submitCertificateRequest() {
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      return;
    }

    this.submissionLoading.set(true);

    // Simulate backend processing
    setTimeout(() => {
      const formVals = this.certificateForm.value;
      const refId = `BM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const prices: Record<string, string> = {
        'Barangay Clearance': '₱50.00',
        'Certificate of Indigency': 'Free (Civic Welfare)',
        'Barangay Residency Certificate': '₱30.00',
        'Business Permit': '₱150.00',
      };

      const requestedDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      // Pickup dates are typically 1-2 business days
      const pickupDateObj = new Date();
      pickupDateObj.setDate(pickupDateObj.getDate() + 1);
      const pickupDate = pickupDateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      const receipt: RequestReceipt = {
        referenceId: refId,
        fullName: formVals.fullName,
        serviceType: formVals.serviceType,
        purok: formVals.purok,
        purpose: formVals.purpose,
        fee: prices[formVals.serviceType] || '₱0.00',
        dateRequested: requestedDate,
        pickupDate,
        status: 'Pending Verification',
      };

      this.submittedRequest.set(receipt);
      this.submissionLoading.set(false);

      // Save to client storage (safely)
      if (isPlatformBrowser(this.platformId)) {
        try {
          const existing = localStorage.getItem('malatbo_requests');
          const list = existing ? JSON.parse(existing) : [];
          list.unshift(receipt);
          localStorage.setItem('malatbo_requests', JSON.stringify(list));
        } catch (e) {
          console.warn('LocalStorage save failed:', e);
        }
      }
    }, 1200);
  }

  submitContact() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const val = this.contactForm.value;
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const newLog = {
      id: `REF-${Math.floor(10000 + Math.random() * 90000)}`,
      name: val.name,
      subject: val.subject,
      message: val.message,
      date: dateStr,
      status: 'Received by Desk Officer',
      adminReply:
        'Thank you for your feedback. Our administrative staff is reviewing your request.',
    };

    this.feedbackLogs.update((logs) => [newLog, ...logs]);

    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('malatbo_feedback_logs', JSON.stringify(this.feedbackLogs()));
      } catch (e) {
        console.warn('Feedback save failed:', e);
      }
    }

    this.contactSubmitted.set(true);
    this.contactForm.reset();

    setTimeout(() => {
      this.contactSubmitted.set(false);
    }, 5000);
  }

  resetRequest() {
    this.submittedRequest.set(null);
    this.certificateForm.reset();
  }

  printReceipt() {
    if (!this.isBrowser()) {
      return;
    }
    window.print();
  }
}
