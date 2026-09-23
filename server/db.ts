import fs from 'fs';
import path from 'path';
import {
  User,
  ProviderProfile,
  ProviderStorefront,
  Category,
  Booking,
  WalletTransaction,
  Review,
  ChatMessage,
  AppNotification,
  AuditLog,
  PlatformStats,
  Complaint,
  ComplaintMessage,
  MerchantSettings,
  ServiceItem,
  StoreProduct,
  ChatInvoice,
  EmailSettings,
  ProviderPayout
} from '../src/types';

export interface DatabaseState {
  users: User[];
  providers: ProviderProfile[];
  categories: Category[];
  bookings: Booking[];
  transactions: WalletTransaction[];
  reviews: Review[];
  messages: ChatMessage[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  complaints: Complaint[];
  merchantSettings: MerchantSettings;
  products: StoreProduct[];
  invoices: ChatInvoice[];
  payouts: ProviderPayout[];
  emailSettings: EmailSettings;
  settings: {
    commissionRatePct: number;
    consultationFee: number;
    platformName: string;
    pbxVoiceCodec: string;
    instantPayouts: boolean;
    systemHealth: 'optimal' | 'degraded' | 'maintenance';
    specialPrize: {
      title: string;
      amount: number;
      badge: string;
      description: string;
    };
  };
}

// Initial robust seed data
export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-electrician',
    name: 'Electrician & Power',
    slug: 'electrician',
    icon: 'Zap',
    characterImage: '/src/assets/images/electrician_character_1790070985996.jpg',
    characterAction: 'Diagnosing circuit breakers & testing live voltage',
    characterWorkplace: 'Electrical Breaker Panel & Multimeter',
    description: 'Panel upgrades, lighting, wiring repairs, breaker diagnostics and EV charger setup',
    pricingModels: ['hourly', 'fixed'],
    basePrice: 75,
    subcategories: [
      { id: 'sub-short', name: 'Circuit Short Diagnosis' },
      { id: 'sub-ev', name: 'EV Charger Level 2 Install' },
      { id: 'sub-lighting', name: 'Smart Home & Architectural Lighting' }
    ]
  },
  {
    id: 'cat-plumbing',
    name: 'Plumbing Services',
    slug: 'plumbing',
    icon: 'Wrench',
    characterImage: '/src/assets/images/plumber_character_1790070961838.jpg',
    characterAction: 'Tightening copper pipes & stopping high-pressure leaks',
    characterWorkplace: 'Water Mains & Pipe Wrench',
    description: 'Emergency leak repair, pipe unclogging, water heater installation & inspections',
    pricingModels: ['hourly', 'fixed', 'quote'],
    basePrice: 65,
    subcategories: [
      { id: 'sub-leak', name: 'Emergency Pipe Leak Repair' },
      { id: 'sub-drain', name: 'Drain & Sewer Jetting' },
      { id: 'sub-install', name: 'Faucet & Fixture Installation' }
    ]
  },
  {
    id: 'cat-painters',
    name: 'Painting & Drywall',
    slug: 'painting',
    icon: 'Paintbrush',
    characterImage: '/src/assets/images/painter_character_1790071005515.jpg',
    characterAction: 'Rolling smooth vibrant paint coats & wall finishing',
    characterWorkplace: 'Wall Canvas & Paint Roller Tray',
    description: 'Interior & exterior wall painting, plaster restoration, finish spray and color consultation',
    pricingModels: ['hourly', 'quote'],
    basePrice: 55,
    subcategories: [
      { id: 'sub-interior', name: 'Interior Room Painting' },
      { id: 'sub-cabinet', name: 'Kitchen Cabinet Refinishing' },
      { id: 'sub-exterior', name: 'Exterior Weatherproof Coating' }
    ]
  },
  {
    id: 'cat-cleaners',
    name: 'Cleaning & Maid',
    slug: 'cleaning',
    icon: 'Sparkles',
    characterImage: '/src/assets/images/cleaner_character_1790071024665.jpg',
    characterAction: 'Misting eco sanitizers & buffing sparkling surfaces',
    characterWorkplace: 'Deep Sanitization & Spray Squeegee',
    description: 'Deep residential cleaning, move-out sanitization, office janitorial and window detailing',
    pricingModels: ['hourly', 'fixed'],
    basePrice: 45,
    subcategories: [
      { id: 'sub-deep', name: 'Whole Home Deep Clean' },
      { id: 'sub-move', name: 'Move-in / Move-out Turnaround' },
      { id: 'sub-carpet', name: 'Steam Carpet & Upholstery' }
    ]
  },
  {
    id: 'cat-mechanic',
    name: 'Mobile Auto Mechanic',
    slug: 'auto-mechanic',
    icon: 'Cog',
    characterImage: '/src/assets/images/mechanic_character_1790071041926.jpg',
    characterAction: 'Tuning engine pistons & tightening chassis bolts',
    characterWorkplace: 'Under-the-Hood Diagnostics & Socket Set',
    description: 'On-demand roadside diagnostics, brake service, battery jump, oil change and alternator repair',
    pricingModels: ['fixed', 'hourly'],
    basePrice: 60,
    subcategories: [
      { id: 'sub-brakes', name: 'Brake Pad & Rotor Replacement' },
      { id: 'sub-battery', name: 'Battery Testing & Replacement' },
      { id: 'sub-obd', name: 'Check Engine Computer Scan' }
    ]
  },
  {
    id: 'cat-hvac',
    name: 'HVAC & Appliance',
    slug: 'hvac-appliance',
    icon: 'Thermometer',
    characterImage: '/src/assets/images/hvac_character_1790071057824.jpg',
    characterAction: 'Calibrating coolant pressure & checking airflow fans',
    characterWorkplace: 'AC Compressor Unit & Pressure Gauges',
    description: 'Central air repair, heat pump maintenance, refrigerant recharge & smart thermostats',
    pricingModels: ['fixed', 'hourly'],
    basePrice: 70,
    subcategories: [
      { id: 'sub-ac', name: 'AC Refrigerant Recharge & Leak Check' },
      { id: 'sub-heat', name: 'Furnace & Heat Pump Maintenance' },
      { id: 'sub-thermo', name: 'Smart Thermostat Setup' }
    ]
  },
  {
    id: 'cat-delivery',
    name: 'Courier & Delivery',
    slug: 'courier-delivery',
    icon: 'Truck',
    characterImage: '/src/assets/images/courier_character_1790071074079.jpg',
    characterAction: 'Dashing with express packages & parcels on route',
    characterWorkplace: 'Express Dispatch & Secure Parcel Crate',
    description: 'Same-day express package delivery, documents & fragile freight transport',
    pricingModels: ['km', 'fixed'],
    basePrice: 12,
    subcategories: [
      { id: 'sub-express', name: 'Express Bike / Moto' },
      { id: 'sub-van', name: 'Heavy Cargo Van' },
      { id: 'sub-groceries', name: 'Document & Parcel Delivery' }
    ]
  },
  {
    id: 'cat-taxi',
    name: 'Taxi & Rides',
    slug: 'taxi-rides',
    icon: 'Car',
    characterImage: '/src/assets/images/taxi_character_1790072748537.jpg',
    characterAction: 'Steering smooth city transit & rapid pick-up',
    characterWorkplace: 'Executive Vehicle & Real-time GPS Route',
    description: 'City rides, airport transfers, chauffeur & premium car services with real-time GPS tracking',
    pricingModels: ['km', 'fixed'],
    basePrice: 15,
    subcategories: [
      { id: 'sub-city-ride', name: 'Standard City Ride' },
      { id: 'sub-airport', name: 'Airport Express Transfer' },
      { id: 'sub-executive', name: 'Executive Black Car' }
    ]
  },
  {
    id: 'cat-food',
    name: 'Food & Restaurants',
    slug: 'food-restaurants',
    icon: 'Utensils',
    characterImage: '/src/assets/images/restaurant_character_1790072736452.jpg',
    characterAction: 'Tossing gourmet saute & plating hot artisan delicacies',
    characterWorkplace: 'Commercial Range & Chef Skillet',
    description: 'Chef-prepared gourmet cuisine, on-demand restaurant takeaway, artisan bakery, and private catering',
    pricingModels: ['fixed', 'quote'],
    basePrice: 22,
    subcategories: [
      { id: 'sub-takeaway', name: 'Restaurant Takeaway & Delivery' },
      { id: 'sub-chef', name: 'Private Chef & In-Home Dining' },
      { id: 'sub-catering', name: 'Gourmet Catering & Parties' }
    ]
  },
  {
    id: 'cat-doctor',
    name: 'Doctors & Healthcare',
    slug: 'doctors-healthcare',
    icon: 'Stethoscope',
    characterImage: '/src/assets/images/doctor_character_1790072723286.jpg',
    characterAction: 'Listening to vitals with stethoscope & administering care',
    characterWorkplace: 'Diagnostic Clinic & Mobile Care Bag',
    description: 'Licensed mobile physicians, emergency urgent home visits, telehealth HD consultations, and registered nursing care',
    pricingModels: ['fixed', 'hourly'],
    basePrice: 85,
    subcategories: [
      { id: 'sub-home-doc', name: 'Urgent Doctor Home Visit' },
      { id: 'sub-telehealth', name: 'Telehealth HD Video Consultation' },
      { id: 'sub-iv-nurse', name: 'Mobile Nurse & IV Therapy' }
    ]
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Mr. Pirate',
    email: 'Mr-Pirate',
    phone: '+1 (800) 747-2831',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    walletBalance: 24850.50,
    rating: 5.0,
    totalJobs: 1420
  },
  {
    id: 'cust-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1 (415) 890-1234',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: '742 Market St, Financial District, San Francisco, CA'
    },
    createdAt: '2024-02-15T10:30:00.000Z',
    walletBalance: 0.00,
    walletAddress: '0x71c8901234ef0192834019283401928340192834',
    rating: 4.9,
    totalJobs: 14
  },
  {
    id: 'prov-1',
    name: 'Marcus Vance',
    email: 'marcus.vance@servexapro.com',
    phone: '+1 (415) 555-0199',
    role: 'provider',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    businessName: 'Apex Mobility & Express Delivery',
    location: {
      lat: 37.7785,
      lng: -122.4120,
      address: 'Mission St & 4th, San Francisco, CA'
    },
    createdAt: '2024-01-10T08:00:00.000Z',
    walletBalance: 1450.80,
    rating: 4.96,
    totalJobs: 384
  },
  {
    id: 'prov-2',
    name: 'Elena Rostova',
    email: 'elena.rostova@servexapro.com',
    phone: '+1 (415) 555-0248',
    role: 'provider',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    businessName: 'Tesla Master Electric & Solar',
    location: {
      lat: 37.7650,
      lng: -122.4280,
      address: 'Castro & Market, San Francisco, CA'
    },
    createdAt: '2024-01-12T09:15:00.000Z',
    walletBalance: 3120.00,
    rating: 4.98,
    totalJobs: 290
  },
  {
    id: 'prov-3',
    name: 'David Thorne',
    email: 'david.thorne@servexapro.com',
    phone: '+1 (415) 555-0371',
    role: 'provider',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    businessName: 'Thorne 24/7 Rapid Hydro Plumbing',
    location: {
      lat: 37.7890,
      lng: -122.4010,
      address: 'North Beach Pier 39, San Francisco, CA'
    },
    createdAt: '2024-01-18T11:00:00.000Z',
    walletBalance: 2780.40,
    rating: 4.92,
    totalJobs: 412
  },
  {
    id: 'prov-4',
    name: 'Sarah Lindqvist',
    email: 'sarah.lindqvist@servexapro.com',
    phone: '+1 (415) 555-0822',
    role: 'provider',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    businessName: 'Luxe EcoClean & Sanitization',
    location: {
      lat: 37.7580,
      lng: -122.4150,
      address: 'Valencia & 20th St, San Francisco, CA'
    },
    createdAt: '2024-02-01T14:20:00.000Z',
    walletBalance: 1890.25,
    rating: 4.95,
    totalJobs: 215
  },
  {
    id: 'prov-5',
    name: 'Mateo Ortiz',
    email: 'mateo.ortiz@servexapro.com',
    phone: '+1 (415) 555-0954',
    role: 'provider',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    businessName: 'Artisan Finish Painters & Drywall',
    location: {
      lat: 37.7810,
      lng: -122.4450,
      address: 'Geary Blvd & Presidio, San Francisco, CA'
    },
    createdAt: '2024-02-05T12:00:00.000Z',
    walletBalance: 2240.00,
    rating: 4.89,
    totalJobs: 178
  },
  {
    id: 'prov-6',
    name: 'Chef Mario Rossi',
    email: 'mario.rossi@chefservexa.com',
    phone: '+1 (415) 555-7821',
    role: 'provider',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    emailVerified: true,
    businessName: 'Trattoria & Gourmet Catering by Chef Mario',
    location: {
      lat: 37.7980,
      lng: -122.4070,
      address: 'Columbus Ave & Broadway, North Beach, San Francisco, CA'
    },
    createdAt: '2024-02-08T10:00:00.000Z',
    walletBalance: 3450.00,
    rating: 4.97,
    totalJobs: 240
  },
  {
    id: 'prov-7',
    name: 'Dr. Aris Vance, MD',
    email: 'dr.aris.vance@servexamedia.com',
    phone: '+1 (415) 555-9912',
    role: 'provider',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    verified: true,
    emailVerified: true,
    businessName: 'Bay Area Mobile Urgent Care & Concierge MD',
    location: {
      lat: 37.7900,
      lng: -122.4350,
      address: 'Pacific Heights & Fillmore St, San Francisco, CA'
    },
    createdAt: '2024-01-20T08:30:00.000Z',
    walletBalance: 5120.00,
    rating: 4.99,
    totalJobs: 310
  }
];

export const INITIAL_PROVIDERS: ProviderProfile[] = [
  {
    userId: 'prov-1',
    handle: 'marcus-apex',
    businessName: 'Apex Mobility & Express Delivery',
    category: 'cat-taxi',
    subcategories: ['Standard City Ride', 'Airport Express Transfer', 'Express Bike / Moto'],
    bio: 'Licensed commercial chauffeur and priority courier with 8+ years on the road. Clean Mercedes electric SUV and heavy-duty cargo bike fleet. 100% on-time guarantee.',
    serviceArea: 'Greater San Francisco Bay Area & SFO Airport',
    workingHours: '24/7 On Demand',
    rating: 4.96,
    reviewCount: 142,
    completedJobs: 384,
    isVerified: true,
    activeStatus: 'online',
    currentLocation: {
      lat: 37.7785,
      lng: -122.4120,
      address: 'Mission St & 4th, San Francisco, CA'
    },
    heading: 45,
    hourlyRate: 50,
    services: [
      {
        id: 'srv-101',
        name: 'Executive City Ride (Sedan / EV)',
        categoryId: 'cat-taxi',
        price: 3.20,
        priceType: 'km',
        durationMinutes: 20,
        description: 'Smooth, quiet ride in a luxury electric vehicle. Bottled water, phone chargers & route choice included.'
      },
      {
        id: 'srv-102',
        name: 'SFO International Airport Transfer',
        categoryId: 'cat-taxi',
        price: 65.00,
        priceType: 'fixed',
        durationMinutes: 35,
        description: 'Fixed-fare curb-to-terminal airport drop-off with luggage assistance and flight tracking.'
      },
      {
        id: 'srv-103',
        name: 'Same-Hour Express Document / Parcel Courier',
        categoryId: 'cat-delivery',
        price: 24.00,
        priceType: 'fixed',
        durationMinutes: 40,
        description: 'Direct door-to-door hand delivery for legal contracts, medical items, and sensitive parcels.'
      }
    ],
    posts: [
      {
        id: 'post-101',
        providerId: 'prov-1',
        title: 'Morning Airport Run in the Mercedes EQE',
        description: 'Smooth sunrise run down to SFO. Zero traffic and ready for passenger pickups!',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
        likes: 84,
        serviceCategory: 'Taxi & Rides',
        createdAt: '2024-09-14T07:15:00.000Z'
      },
      {
        id: 'post-102',
        providerId: 'prov-1',
        title: 'Rush-Hour Document Courier Mission',
        description: 'Delivered legal briefs across downtown in under 22 minutes safely.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
        likes: 56,
        serviceCategory: 'Courier & Delivery',
        createdAt: '2024-09-12T14:30:00.000Z'
      }
    ]
  },
  {
    userId: 'prov-2',
    handle: 'elena-electric',
    businessName: 'Tesla Master Electric & Solar',
    category: 'cat-electrician',
    subcategories: ['Circuit Short Diagnosis', 'EV Charger Level 2 Install', 'Smart Home & Architectural Lighting'],
    bio: 'State-certified Master Electrician with 12 years field experience. Specializing in high-amperage EV charger setups, 200A main service panel upgrades, and smart automation.',
    serviceArea: 'San Francisco, Oakland, Berkeley & Marin',
    workingHours: 'Mon - Sat: 07:00 AM - 07:00 PM (Emergency 24/7)',
    rating: 4.98,
    reviewCount: 98,
    completedJobs: 290,
    isVerified: true,
    activeStatus: 'online',
    currentLocation: {
      lat: 37.7650,
      lng: -122.4280,
      address: 'Castro & Market, San Francisco, CA'
    },
    heading: 90,
    hourlyRate: 95,
    services: [
      {
        id: 'srv-201',
        name: 'EV Charger Level 2 Hardwired Installation',
        categoryId: 'cat-electrician',
        price: 349.00,
        priceType: 'fixed',
        durationMinutes: 180,
        description: 'Complete 240V dedicated 50A/60A circuit install for Tesla Wall Connector, ChargePoint, or JuiceBox.'
      },
      {
        id: 'srv-202',
        name: 'Electrical Diagnostics & Breaker Tripping Fix',
        categoryId: 'cat-electrician',
        price: 95.00,
        priceType: 'hourly',
        durationMinutes: 60,
        description: 'Thermal camera breaker box inspection, arc-fault diagnosis, and grounding verification.'
      },
      {
        id: 'srv-203',
        name: 'Smart Recessed Lighting & Lutron Dimmer Setup',
        categoryId: 'cat-electrician',
        price: 180.00,
        priceType: 'fixed',
        durationMinutes: 120,
        description: 'Ultra-thin LED wafer retrofit with smart app / voice control integration.'
      }
    ],
    posts: [
      {
        id: 'post-201',
        providerId: 'prov-2',
        title: 'Installed Tesla Universal Charger with 60A breaker',
        description: 'Clean conduit routing and verified 11.5 kW output. Zero voltage drop over 45ft run!',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=800&auto=format&fit=crop&q=80',
        likes: 128,
        serviceCategory: 'Electrician & Power',
        createdAt: '2024-09-15T11:00:00.000Z'
      }
    ]
  },
  {
    userId: 'prov-3',
    handle: 'thorne-plumbing',
    businessName: 'Thorne 24/7 Rapid Hydro Plumbing',
    category: 'cat-plumbing',
    subcategories: ['Emergency Pipe Leak Repair', 'Drain & Sewer Jetting', 'Faucet & Fixture Installation'],
    bio: 'Licensed plumbing contractor #981244. High-pressure hydro-jetting, trenchless sewer camera diagnostics, tankless water heater maintenance. Rapid 30-minute dispatch.',
    serviceArea: 'San Francisco Peninsula & South Bay',
    workingHours: '24 Hours / 7 Days a Week',
    rating: 4.92,
    reviewCount: 167,
    completedJobs: 412,
    isVerified: true,
    activeStatus: 'online',
    currentLocation: {
      lat: 37.7890,
      lng: -122.4010,
      address: 'North Beach Pier 39, San Francisco, CA'
    },
    heading: 180,
    hourlyRate: 85,
    services: [
      {
        id: 'srv-301',
        name: 'Emergency Burst Pipe / Leak Isolation & Repair',
        categoryId: 'cat-plumbing',
        price: 130.00,
        priceType: 'fixed',
        durationMinutes: 90,
        description: 'Fast arrival with copper crimp and PEX fittings to stop flooding immediately.'
      },
      {
        id: 'srv-302',
        name: 'Hydro-Jet Main Sewer Drain Clearing',
        categoryId: 'cat-plumbing',
        price: 195.00,
        priceType: 'fixed',
        durationMinutes: 120,
        description: '4000 PSI hydro-jetting removes heavy grease, roots, and blockages with full video inspection.'
      }
    ],
    posts: [
      {
        id: 'post-301',
        providerId: 'prov-3',
        title: 'Cast-iron main drain restoration completed today',
        description: 'Replaced cracked 4-inch main line under a Victorian sub-floor with zero structural damage.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
        likes: 92,
        serviceCategory: 'Plumbing Services',
        createdAt: '2024-09-13T16:40:00.000Z'
      }
    ]
  },
  {
    userId: 'prov-4',
    handle: 'luxe-ecoclean',
    businessName: 'Luxe EcoClean & Sanitization',
    category: 'cat-cleaners',
    subcategories: ['Whole Home Deep Clean', 'Move-in / Move-out Turnaround', 'Steam Carpet & Upholstery'],
    bio: 'Hospital-grade, 100% plant-based and pet-safe cleaning. HEPA filtered vacuums, steam sanitization, and meticulous attention to baseboards, ovens, and tile grout.',
    serviceArea: 'San Francisco Metro',
    workingHours: 'Mon - Sun: 08:00 AM - 06:00 PM',
    rating: 4.95,
    reviewCount: 88,
    completedJobs: 215,
    isVerified: true,
    activeStatus: 'online',
    currentLocation: {
      lat: 37.7580,
      lng: -122.4150,
      address: 'Valencia & 20th St, San Francisco, CA'
    },
    hourlyRate: 50,
    services: [
      {
        id: 'srv-401',
        name: 'Comprehensive 2-Bedroom Deep Sanitization',
        categoryId: 'cat-cleaners',
        price: 160.00,
        priceType: 'fixed',
        durationMinutes: 210,
        description: 'Kitchen appliances, interior windows, sanitized bathrooms, polished fixtures, and allergen removal.'
      }
    ],
    posts: [
      {
        id: 'post-401',
        providerId: 'prov-4',
        title: 'Modern Loft Move-Out Transformation',
        description: 'Turned a dusty post-tenancy loft into sparkling move-in condition. Landlord approved 100% security deposit back!',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
        likes: 114,
        serviceCategory: 'Cleaning & Maid',
        createdAt: '2024-09-14T18:00:00.000Z'
      }
    ]
  },
  {
    userId: 'prov-5',
    handle: 'artisan-painters',
    businessName: 'Artisan Finish Painters & Drywall',
    category: 'cat-painters',
    subcategories: ['Interior Room Painting', 'Kitchen Cabinet Refinishing', 'Exterior Weatherproof Coating'],
    bio: 'Expert architectural painters specializing in dustless sanding, Benjamin Moore premium finishes, and flawless drywall skimming.',
    serviceArea: 'San Francisco & Marin County',
    workingHours: 'Mon - Fri: 08:00 AM - 05:00 PM',
    rating: 4.89,
    reviewCount: 65,
    completedJobs: 178,
    isVerified: true,
    activeStatus: 'online',
    currentLocation: {
      lat: 37.7810,
      lng: -122.4450,
      address: 'Geary Blvd & Presidio, San Francisco, CA'
    },
    hourlyRate: 65,
    services: [
      {
        id: 'srv-501',
        name: 'Single Room Accent & Ceiling Painting',
        categoryId: 'cat-painters',
        price: 220.00,
        priceType: 'fixed',
        durationMinutes: 240,
        description: 'Includes tape masking, minor nail hole spackle, 2 coats of premium eggshell/matte paint.'
      }
    ],
    posts: [
      {
        id: 'post-501',
        providerId: 'prov-5',
        title: 'Matte Sage Accent Wall Finish',
        description: 'Crisp razor-sharp lines and satin sheen on living room architectural fireplace surround.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
        likes: 73,
        serviceCategory: 'Painting & Drywall',
        createdAt: '2024-09-11T15:00:00.000Z'
      }
    ],
    storefront: {
      enabled: true,
      subdomain: 'artisan-finish',
      storeName: 'Artisan Finish Painters & Drywall',
      tagline: 'Architectural finishes, dustless sanding, and modern interior painting',
      bio: 'Boutique residential painting studio transforming San Francisco & Marin residences.',
      bannerUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&auto=format&fit=crop&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      contactPhone: '+14155550954',
      subscriptionActive: true,
      monthlyFee: 5.0,
      subscriptionRenewsAt: '2025-01-01T00:00:00.000Z',
      analytics: { views: 184, orders: 19, revenue: 4180 }
    }
  },
  {
    userId: 'prov-6',
    handle: 'chef-mario',
    businessName: 'Trattoria & Gourmet Catering by Chef Mario',
    category: 'cat-food',
    subcategories: ['Restaurant Takeaway & Delivery', 'Private Chef & In-Home Dining', 'Gourmet Catering & Parties'],
    bio: 'Executive Chef Mario Rossi trained in Florence and Bologna. Offering bespoke multi-course in-home dining, handmade pasta tasting menus, and corporate event catering.',
    serviceArea: 'San Francisco, Peninsula, Marin & Silicon Valley',
    workingHours: 'Tue - Sun: 11:00 AM - 10:00 PM',
    rating: 4.97,
    reviewCount: 184,
    completedJobs: 240,
    isVerified: true,
    activeStatus: 'online',
    currentLocation: {
      lat: 37.7980,
      lng: -122.4070,
      address: 'Columbus Ave & Broadway, North Beach, San Francisco, CA'
    },
    heading: 120,
    hourlyRate: 85,
    storefront: {
      enabled: true,
      subdomain: 'chef-mario',
      storeName: 'Chef Mario Rossi Trattoria & Private Dining',
      tagline: 'Artisan handmade pastas, Roman-style pizzas & in-home dining experiences',
      bio: 'Michelin-experienced chef creating unforgettable culinary evenings in your kitchen or delivering hot chef-curated meals.',
      bannerUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
      contactPhone: '+14155557821',
      subscriptionActive: true,
      monthlyFee: 5.0,
      subscriptionRenewsAt: '2025-01-01T00:00:00.000Z',
      analytics: { views: 420, orders: 58, revenue: 5320 }
    },
    services: [
      {
        id: 'srv-601',
        name: '4-Course Private In-Home Chef Tasting Menu',
        categoryId: 'cat-food',
        price: 145.00,
        priceType: 'fixed',
        durationMinutes: 180,
        description: 'Chef brings farm-fresh ingredients, prepares a 4-course Italian dinner in your home kitchen, and leaves it spotless.'
      },
      {
        id: 'srv-602',
        name: 'Truffle Tagliolini & Woodfired Porcini Meal Kit (Hot)',
        categoryId: 'cat-food',
        price: 38.00,
        priceType: 'fixed',
        durationMinutes: 35,
        description: 'Fresh hand-extruded tagliolini with Umbrian black truffle cream, wild porcini mushrooms, and Parmigiano Reggiano 24-month.'
      },
      {
        id: 'srv-603',
        name: 'Gourmet Antipasti & Artisan Focaccia Board (Serves 6)',
        categoryId: 'cat-food',
        price: 65.00,
        priceType: 'fixed',
        durationMinutes: 45,
        description: 'Prosciutto di Parma, burrata pugliese, marinated artichokes, Castelvetrano olives, rosemary sea salt focaccia.'
      }
    ],
    posts: [
      {
        id: 'post-601',
        providerId: 'prov-6',
        title: 'Handmade Tagliatelle with Slow-Cooked Bolognese Ragu',
        description: '12-hour braised chuck roast and pancetta over fresh egg pasta ribbons for private dinner party.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=800&auto=format&fit=crop&q=80',
        likes: 192,
        serviceCategory: 'Food & Restaurants',
        createdAt: '2024-09-14T20:15:00.000Z'
      }
    ]
  },
  {
    userId: 'prov-7',
    handle: 'dr-vance',
    businessName: 'Bay Area Mobile Urgent Care & Concierge MD',
    category: 'cat-doctor',
    subcategories: ['Urgent Doctor Home Visit', 'Telehealth HD Video Consultation', 'Mobile Nurse & IV Therapy'],
    bio: 'Board-Certified Internal & Emergency Medicine Physician (Stanford-trained). Providing immediate bedside urgent care, acute injury care, prescription refills, and advanced diagnostics at your home or office.',
    serviceArea: 'San Francisco, Peninsula, East Bay & SFO Region',
    workingHours: '24/7 Rapid Emergency Dispatch',
    rating: 4.99,
    reviewCount: 215,
    completedJobs: 310,
    isVerified: true,
    activeStatus: 'online',
    currentLocation: {
      lat: 37.7900,
      lng: -122.4350,
      address: 'Pacific Heights & Fillmore St, San Francisco, CA'
    },
    heading: 260,
    hourlyRate: 150,
    storefront: {
      enabled: true,
      subdomain: 'dr-vance',
      storeName: 'Dr. Aris Vance Concierge Medicine',
      tagline: 'Board-certified urgent medical doctor home visits & telehealth in 30 mins',
      bio: 'Fast, confidential medical care brought directly to you. Avoid busy waiting rooms with direct physician home dispatch.',
      bannerUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      contactPhone: '+14155559912',
      subscriptionActive: true,
      monthlyFee: 5.0,
      subscriptionRenewsAt: '2025-01-01T00:00:00.000Z',
      analytics: { views: 630, orders: 74, revenue: 11840 }
    },
    services: [
      {
        id: 'srv-701',
        name: 'Urgent Physician Home Visit & Diagnostic Exam',
        categoryId: 'cat-doctor',
        price: 185.00,
        priceType: 'fixed',
        durationMinutes: 60,
        description: 'Comprehensive physical examination, vitals check, strep/flu/COVID rapid swab, prescription dispensation, and care plan.'
      },
      {
        id: 'srv-702',
        name: 'Urgent Telehealth HD Video Consultation (30 mins)',
        categoryId: 'cat-doctor',
        price: 65.00,
        priceType: 'fixed',
        durationMinutes: 30,
        description: 'Immediate video consultation with Dr. Vance. Diagnosis, medication review, and pharmacy e-prescriptions sent in 15 mins.'
      },
      {
        id: 'srv-703',
        name: 'Mobile Myers Cocktail & Immune Boost IV Infusion',
        categoryId: 'cat-doctor',
        price: 140.00,
        priceType: 'fixed',
        durationMinutes: 45,
        description: 'Electrolyte rehydration with High-Dose Vitamin C, B-Complex, Zinc, and Magnesium administered by registered clinical nurse.'
      }
    ],
    posts: [
      {
        id: 'post-701',
        providerId: 'prov-7',
        title: 'Mobile Diagnostics Unit Ready for Home Urgent Calls',
        description: 'Equipped with portable ultrasound, 12-lead EKG, and point-of-care rapid blood analysis for zero wait-time care.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
        likes: 248,
        serviceCategory: 'Doctors & Healthcare',
        createdAt: '2024-09-15T09:00:00.000Z'
      }
    ]
  }
];

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_REVIEWS: Review[] = [];

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [];

export const INITIAL_MESSAGES: ChatMessage[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    adminId: 'admin-1',
    adminName: 'Mr. Pirate',
    action: 'PLATFORM_INITIALIZATION',
    details: 'Servexa AI global multi-service marketplace core engine brought online with 5% baseline commission.',
    timestamp: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'log-2',
    adminId: 'admin-1',
    adminName: 'Mr. Pirate',
    action: 'PROVIDER_VERIFIED',
    targetUserId: 'prov-1',
    targetName: 'Marcus Vance',
    details: 'Verified commercial driver credentials and vehicle inspection certificate.',
    timestamp: '2024-01-10T08:30:00.000Z'
  }
];

export const INITIAL_MERCHANT_SETTINGS: MerchantSettings = {
  activeGateway: 'stripe',
  environment: 'live',
  stripe: {
    publishableKey: 'pk_live_51N8x92B9ServexaRealMerchantGatewayLiveProd001',
    secretKeyConfigured: true,
    secretKeyPreview: 'sk_live_••••••••••••••••••••7A91',
    webhookSecretConfigured: true,
    connectClientId: 'ca_99XServexaConnectMarketplace',
    autoPayouts: true
  },
  paypal: {
    clientId: 'AQ-ServexaPaypalLiveGatewayMerchantId991',
    secretConfigured: true,
    secretPreview: 'EL••••••••••••••••••••38F2'
  },
  square: {
    appId: 'sq0idp-ServexaSquareLiveDirectProcessingId',
    accessTokenConfigured: true,
    locationId: 'LOC_SF_DOWNTOWN_01'
  },
  bankSettlement: {
    merchantId: 'MID-SERVEXA-COMMERCIAL-9092',
    bankName: 'JPMorgan Chase & Co. Merchant Services',
    accountLast4: '4482',
    routingNumber: '121000358'
  },
  directCardProcessingEnabled: true
};

export const INITIAL_COMPLAINTS: Complaint[] = [];

export const INITIAL_PRODUCTS: StoreProduct[] = [
  {
    id: 'prod-1',
    providerId: 'prov-2',
    providerName: 'Elena Rostova',
    storeName: 'Tesla Master Electric & Solar Store',
    subdomain: 'tesla-electric',
    name: 'Square D 20A Homeline Circuit Breaker',
    description: 'UL-listed thermal magnetic circuit breaker with visual trip indicator for residential panels.',
    price: 18.50,
    category: 'cat-electrician',
    imageUrl: 'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.9,
    salesCount: 142
  },
  {
    id: 'prod-2',
    providerId: 'prov-2',
    providerName: 'Elena Rostova',
    storeName: 'Tesla Master Electric & Solar Store',
    subdomain: 'tesla-electric',
    name: 'Leviton Decora Smart Wi-Fi Tamper-Resistant Outlet',
    description: 'Smart in-wall 15A outlet with app schedule, energy monitoring and Alexa/Google Home support.',
    price: 29.99,
    category: 'cat-electrician',
    imageUrl: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.8,
    salesCount: 89
  },
  {
    id: 'prod-3',
    providerId: 'prov-3',
    providerName: 'David Thorne',
    storeName: 'Thorne 24/7 Rapid Hydro Plumbing Depot',
    subdomain: 'thorne-plumbing',
    name: 'SharkBite 3/4" Brass Push-to-Connect Full Port Ball Valve',
    description: 'Lead-free brass shut-off valve compatible with copper, PEX, CPVC with zero soldering required.',
    price: 24.50,
    category: 'cat-plumbing',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.95,
    salesCount: 230
  },
  {
    id: 'prod-4',
    providerId: 'prov-3',
    providerName: 'David Thorne',
    storeName: 'Thorne 24/7 Rapid Hydro Plumbing Depot',
    subdomain: 'thorne-plumbing',
    name: 'Heavy Duty 25ft Steel Core Toilet & Sink Drain Auger Snake',
    description: 'High-tensile steel cable with corkscrew head clears stubborn hair, soap scum and paper clogs.',
    price: 34.00,
    category: 'cat-plumbing',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.85,
    salesCount: 75
  },
  {
    id: 'prod-5',
    providerId: 'prov-5',
    providerName: 'Marco Silva',
    storeName: 'Precision Artisan Painting Studio',
    subdomain: 'precision-painting',
    name: 'Purdy 9" Heavy Duty Microfiber Roller & Deep Well Metal Tray Set',
    description: 'Shed-resistant 3/8" nap for ultra-smooth wall coats with ergonomic non-slip handle.',
    price: 21.00,
    category: 'cat-painters',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.9,
    salesCount: 110
  },
  {
    id: 'prod-6',
    providerId: 'prov-4',
    providerName: 'Sarah Lindqvist',
    storeName: 'Luxe EcoClean & Supplies',
    subdomain: 'luxe-ecoclean',
    name: 'Simple Green Pro HD Industrial Citrus Degreaser (1 Gallon)',
    description: 'Non-corrosive, biodegradable heavy-duty formula for grease, kitchen hoods, and tile grout.',
    price: 18.75,
    category: 'cat-cleaners',
    imageUrl: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.92,
    salesCount: 195
  },
  {
    id: 'prod-7',
    providerId: 'prov-8',
    providerName: 'Carlos Mendoza',
    storeName: 'Rapid Mobile Auto Tech Gear',
    subdomain: 'rapid-mechanic',
    name: 'Innova OBD2 Bluetooth Diagnostic Code Reader Scanner',
    description: 'Instant check engine light diagnostic, live sensor data streaming, and battery test report.',
    price: 46.00,
    category: 'cat-mechanic',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.88,
    salesCount: 88
  },
  {
    id: 'prod-8',
    providerId: 'prov-9',
    providerName: 'Kevin Wu',
    storeName: 'Apex Climate & HVAC Supplies',
    subdomain: 'apex-climate',
    name: 'Honeywell Home T9 Smart Wi-Fi Thermostat with Sensor',
    description: 'Intelligent multi-room room climate control, auto-humidity balance, 7-day programmable.',
    price: 94.00,
    category: 'cat-hvac',
    imageUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.97,
    salesCount: 64
  }
];

export const INITIAL_EMAIL_SETTINGS: EmailSettings = {
  resendApiKey: 're_servexa_live_k92Jsh820B19f94k1L',
  resendSenderEmail: 'notifications@servexaworld.com',
  resendVerified: true,
  smtpHost: 'smtp.resend.com',
  smtpPort: 587,
  smtpUser: 'resend',
  smtpPassword: '••••••••••••••••••••••••',
  smtpSecure: true,
  smtpVerified: true,
  lastDispatchedEmail: {
    to: 'alex.rivera@example.com',
    subject: 'Order Dispatch & 15-Second Confirmation #BK-902',
    service: 'resend',
    timestamp: new Date().toISOString()
  }
};

export const INITIAL_PAYOUTS: ProviderPayout[] = [
  {
    id: 'payout-101',
    providerId: 'prov-2',
    providerName: 'Elena Rostova',
    amount: 1420.50,
    status: 'scheduled',
    requestedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    estimatedArrivalMinHours: 24,
    estimatedArrivalMaxHours: 48,
    scheduledDisbursementAt: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    payoutMethod: 'stripe_connect',
    referenceNumber: 'PO-STR-2024-9981'
  },
  {
    id: 'payout-102',
    providerId: 'prov-3',
    providerName: 'David Thorne',
    amount: 890.00,
    status: 'processing',
    requestedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    estimatedArrivalMinHours: 24,
    estimatedArrivalMaxHours: 48,
    scheduledDisbursementAt: new Date(Date.now() + 32 * 3600 * 1000).toISOString(),
    payoutMethod: 'bank_wire',
    referenceNumber: 'PO-ACH-2024-4412'
  }
];

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'database.json');

// Persistent Database class with JSON disk sync
class Database {
  private state: DatabaseState;

  constructor() {
    const loaded = this.loadFromDisk();
    if (loaded) {
      this.state = loaded;
      let modified = false;
      // Ensure all bookings have a 4-digit handover delivery PIN
      this.state.bookings.forEach((b, idx) => {
        if (!b.deliveryPin) {
          b.deliveryPin = (4100 + ((idx * 179) % 5800)).toString();
          modified = true;
        }
      });
      // Ensure all users have a walletAddress
      this.state.users.forEach((u) => {
        if (!u.walletAddress) {
          const hash = Buffer.from(u.id + (u.email || '')).toString('hex').padEnd(40, '0').slice(0, 40);
          u.walletAddress = `0x${hash}`;
          modified = true;
        }
      });
      // Ensure products, invoices, payouts, emailSettings exist
      if (!this.state.products || !Array.isArray(this.state.products) || this.state.products.length === 0) {
        this.state.products = [...INITIAL_PRODUCTS];
        modified = true;
      }
      if (!this.state.invoices || !Array.isArray(this.state.invoices)) {
        this.state.invoices = [];
        modified = true;
      }
      if (!this.state.payouts || !Array.isArray(this.state.payouts) || this.state.payouts.length === 0) {
        this.state.payouts = [...INITIAL_PAYOUTS];
        modified = true;
      }
      if (!this.state.emailSettings) {
        this.state.emailSettings = { ...INITIAL_EMAIL_SETTINGS };
        modified = true;
      }
      // Set platform rules: 6% commission rate, $1 consultation fee, Servexa World
      if (!this.state.settings) {
        this.state.settings = {
          commissionRatePct: 6,
          consultationFee: 1.00,
          platformName: 'Servexa World',
          pbxVoiceCodec: 'Opus-Adaptive',
          instantPayouts: true,
          systemHealth: 'optimal',
          specialPrize: {
            title: 'Master Service Excellence Trophy & $250 Cash Bonus',
            amount: 250,
            badge: '🏆 Master Pro 2025',
            description: 'Awarded by Servexa World Admin for top rating and zero-complaint service.'
          }
        };
        modified = true;
      } else {
        this.state.settings.commissionRatePct = 6;
        this.state.settings.consultationFee = 1.00;
        this.state.settings.platformName = 'Servexa World';
        if (!this.state.settings.specialPrize) {
          this.state.settings.specialPrize = {
            title: 'Master Service Excellence Trophy & $250 Cash Bonus',
            amount: 250,
            badge: '🏆 Master Pro 2025',
            description: 'Awarded by Servexa World Admin for top rating and zero-complaint service.'
          };
          modified = true;
        }
      }
      // Refresh categories with animated character assets
      this.state.categories = [...INITIAL_CATEGORIES];
      modified = true;

      if (modified) this.saveToDisk();
    } else {
      this.state = {
        users: [...INITIAL_USERS],
        providers: [...INITIAL_PROVIDERS],
        categories: [...INITIAL_CATEGORIES],
        bookings: [...INITIAL_BOOKINGS],
        transactions: [...INITIAL_TRANSACTIONS],
        reviews: [...INITIAL_REVIEWS],
        messages: [...INITIAL_MESSAGES],
        complaints: [...INITIAL_COMPLAINTS],
        merchantSettings: { ...INITIAL_MERCHANT_SETTINGS },
        products: [...INITIAL_PRODUCTS],
        invoices: [],
        payouts: [...INITIAL_PAYOUTS],
        emailSettings: { ...INITIAL_EMAIL_SETTINGS },
        notifications: [],
        auditLogs: [...INITIAL_AUDIT_LOGS],
        settings: {
          commissionRatePct: 6,
          consultationFee: 1.00,
          platformName: 'Servexa World',
          pbxVoiceCodec: 'Opus-Adaptive',
          instantPayouts: true,
          systemHealth: 'optimal',
          specialPrize: {
            title: 'Master Service Excellence Trophy & $250 Cash Bonus',
            amount: 250,
            badge: '🏆 Master Pro 2025',
            description: 'Awarded by Servexa World Admin for top rating and zero-complaint service.'
          }
        }
      };
      this.saveToDisk();
    }
  }

  private loadFromDisk(): DatabaseState | null {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.categories)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading database from disk:', err);
    }
    return null;
  }

  public saveToDisk() {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  // Users
  getUsers(): User[] {
    return this.state.users;
  }

  getUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    const norm = email.trim().toLowerCase();
    return this.state.users.find(u => u.email.toLowerCase() === norm);
  }

  createUser(user: User): User {
    if (!user.walletAddress) {
      const hash = Buffer.from(user.id + (user.email || '')).toString('hex').padEnd(40, '0').slice(0, 40);
      user.walletAddress = `0x${hash}`;
    }
    if (user.walletBalance === undefined || user.walletBalance === null) {
      user.walletBalance = 0.0;
    }
    this.state.users.push(user);
    this.saveToDisk();
    return user;
  }

  updateUserPreferredCurrency(userId: string, currency: string): User | undefined {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return undefined;
    user.preferredCurrency = currency;
    this.saveToDisk();
    return user;
  }

  updateUserProfile(userId: string, updates: Partial<User>): User | undefined {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return undefined;
    if (updates.name !== undefined && updates.name.trim()) user.name = updates.name.trim();
    if (updates.phone !== undefined && updates.phone.trim()) user.phone = updates.phone.trim();
    if (updates.avatar !== undefined && updates.avatar.trim()) user.avatar = updates.avatar.trim();
    if (updates.bio !== undefined) user.bio = updates.bio.trim();
    if (updates.businessName !== undefined) user.businessName = updates.businessName.trim();
    if (updates.location !== undefined) user.location = updates.location;

    // Synchronize with provider record if user is also a provider
    const prov = this.state.providers.find(p => p.userId === userId);
    if (prov) {
      if (updates.name !== undefined && !prov.businessName) prov.businessName = updates.name.trim();
      if (updates.businessName !== undefined && updates.businessName.trim()) prov.businessName = updates.businessName.trim();
      if (updates.bio !== undefined) prov.bio = updates.bio.trim();
      if (updates.location !== undefined) prov.currentLocation = updates.location;
    }

    this.saveToDisk();
    return user;
  }

  updateUserStatus(userId: string, status: 'active' | 'blocked' | 'suspended', adminId: string, adminName: string): User | undefined {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return undefined;
    const oldStatus = user.status;
    user.status = status;

    // Log admin audit
    this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId,
      adminName,
      action: 'USER_STATUS_CHANGE',
      targetUserId: user.id,
      targetName: user.name,
      details: `User status changed from ${oldStatus} to ${status}`,
      timestamp: new Date().toISOString()
    });

    return user;
  }

  toggleUserVerification(userId: string, adminId: string, adminName: string): User | undefined {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return undefined;
    user.verified = !user.verified;

    // If provider profile exists, sync
    const prov = this.state.providers.find(p => p.userId === userId);
    if (prov) {
      prov.isVerified = user.verified;
    }

    this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId,
      adminName,
      action: 'USER_VERIFICATION_TOGGLE',
      targetUserId: user.id,
      targetName: user.name,
      details: `Verification status set to ${user.verified}`,
      timestamp: new Date().toISOString()
    });

    return user;
  }

  verifyUserIdentity(
    userId: string,
    data: {
      fullName: string;
      documentType: 'national_id' | 'passport' | 'drivers_license';
      documentNumber: string;
      dob: string;
      country: string;
      address: string;
      photoUrl?: string;
      documentImage?: string;
    }
  ): User | null {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return null;

    user.identityVerified = false; // Stays false until administrator approves in Admin Panel
    user.walletStatus = 'pending_approval';
    user.idVerification = {
      status: 'pending_approval',
      documentType: data.documentType || 'drivers_license',
      documentNumber: data.documentNumber || `ID-${Math.floor(10000000 + Math.random() * 90000000)}`,
      fullName: data.fullName || user.name,
      dob: data.dob || '1995-06-15',
      country: data.country || 'United States',
      address: data.address || user.location?.address || '742 Market St, San Francisco, CA',
      photoUrl: data.photoUrl || '',
      documentImage: data.documentImage || data.photoUrl || '',
      submittedAt: new Date().toISOString()
    };

    this.addAuditLog({
      id: 'log-kyc-' + Date.now(),
      adminId: user.id,
      adminName: user.name,
      action: 'IDENTITY_DOCUMENT_UPLOADED',
      details: `${user.name} (${user.role}) uploaded verification document [${data.documentType || 'ID'}] with photo proof. Sent to Admin Panel for review.`,
      timestamp: new Date().toISOString()
    });

    this.addNotification({
      id: 'notif-kyc-' + Date.now(),
      userId: user.id,
      title: 'Documents Transmitted for Review',
      message: 'Your identity documents have been stored and transmitted to Platform Administration. Your wallet will be enabled once an admin approves them.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.saveToDisk();
    return user;
  }

  getPendingVerifications(): User[] {
    return this.state.users.filter(u => u.idVerification !== undefined);
  }

  approveVerificationAndWallet(userId: string, adminId: string, adminName: string): { success: boolean; user?: User; error?: string } {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User account not found' };

    user.identityVerified = true;
    user.walletStatus = 'active';
    if (user.idVerification) {
      user.idVerification.status = 'verified';
      user.idVerification.verifiedAt = new Date().toISOString();
    }

    this.addAuditLog({
      id: 'log-appr-' + Date.now(),
      adminId,
      adminName,
      action: 'WALLET_AND_KYC_APPROVED',
      details: `Admin ${adminName} reviewed uploaded identification documents and activated wallet for ${user.name} (${user.email}).`,
      timestamp: new Date().toISOString()
    });

    this.addNotification({
      id: 'notif-appr-' + Date.now(),
      userId: user.id,
      title: 'Wallet Approved & Activated',
      message: 'Your verification documents have been approved by Platform Administration! Your Servexa Wallet is now active.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.saveToDisk();
    return { success: true, user };
  }

  rejectVerification(userId: string, reason: string, adminId: string, adminName: string): { success: boolean; user?: User; error?: string } {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User account not found' };

    user.identityVerified = false;
    user.walletStatus = 'suspended';
    if (user.idVerification) {
      user.idVerification.status = 'rejected';
      user.idVerification.rejectionReason = reason;
    }

    this.addAuditLog({
      id: 'log-rej-' + Date.now(),
      adminId,
      adminName,
      action: 'VERIFICATION_REJECTED',
      details: `Admin ${adminName} rejected verification for ${user.name}: ${reason}`,
      timestamp: new Date().toISOString()
    });

    this.addNotification({
      id: 'notif-rej-' + Date.now(),
      userId: user.id,
      title: 'Verification Request Update',
      message: `Your document verification was rejected: ${reason}. Please update your document upload in your wallet profile.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.saveToDisk();
    return { success: true, user };
  }

  // Providers
  getProviders(): ProviderProfile[] {
    return this.state.providers;
  }

  addProvider(provider: ProviderProfile): ProviderProfile {
    this.state.providers.push(provider);
    return provider;
  }

  getProviderByUserId(userId: string): ProviderProfile | undefined {
    return this.state.providers.find(p => p.userId === userId);
  }

  getProviderById(id: string): ProviderProfile | undefined {
    return this.state.providers.find(p => p.userId === id || (p as any).id === id);
  }

  addNotification(notification: any) {
    this.state.notifications.unshift(notification);
  }

  updateProviderLocation(userId: string, lat: number, lng: number, heading?: number) {
    const prov = this.state.providers.find(p => p.userId === userId);
    if (prov) {
      prov.currentLocation.lat = lat;
      prov.currentLocation.lng = lng;
      if (heading !== undefined) prov.heading = heading;
    }
  }

  addProviderPost(userId: string, post: any) {
    const prov = this.state.providers.find(p => p.userId === userId);
    if (prov) {
      prov.posts.unshift(post);
      this.saveToDisk();
    }
  }

  updateProviderProfile(userId: string, updates: Partial<ProviderProfile>): ProviderProfile | undefined {
    let prov = this.state.providers.find(p => p.userId === userId || (p as any).id === userId);
    if (!prov) {
      const user = this.getUserById(userId);
      if (user) {
        prov = {
          userId: user.id,
          handle: user.name.toLowerCase().replace(/\s+/g, '-'),
          businessName: user.businessName || user.name,
          category: 'cat-home',
          subcategories: ['General Services'],
          bio: user.bio || 'Professional service provider',
          serviceArea: 'Greater Metro Area',
          workingHours: '8:00 AM - 8:00 PM',
          rating: 5.0,
          reviewCount: 1,
          completedJobs: 0,
          isVerified: true,
          activeStatus: 'online',
          currentLocation: user.location || { lat: 37.7749, lng: -122.4194, address: 'Current Location' },
          services: [],
          posts: []
        };
        this.state.providers.push(prov);
      }
    }
    if (!prov) return undefined;

    if (updates.businessName !== undefined && updates.businessName.trim()) {
      prov.businessName = updates.businessName.trim();
    }
    if (updates.bio !== undefined) prov.bio = updates.bio.trim();
    if (updates.category !== undefined) prov.category = updates.category;
    if (updates.serviceArea !== undefined) prov.serviceArea = updates.serviceArea.trim();
    if (updates.workingHours !== undefined) prov.workingHours = updates.workingHours.trim();
    if (updates.hourlyRate !== undefined) prov.hourlyRate = Number(updates.hourlyRate);
    if (updates.activeStatus !== undefined) prov.activeStatus = updates.activeStatus;
    if (updates.currentLocation !== undefined) prov.currentLocation = updates.currentLocation;

    this.saveToDisk();
    return prov;
  }

  addProviderService(userId: string, service: any): ServiceItem | undefined {
    let prov = this.state.providers.find(p => p.userId === userId || (p as any).id === userId);
    if (!prov) {
      this.updateProviderProfile(userId, {});
      prov = this.state.providers.find(p => p.userId === userId || (p as any).id === userId);
    }
    if (!prov) return undefined;

    const newService: ServiceItem = {
      id: service.id || 'srv-' + Date.now(),
      name: service.name || 'Custom Service',
      categoryId: service.categoryId || 'cat-home',
      price: Number(service.price || 0),
      priceType: service.priceType || 'fixed',
      durationMinutes: service.durationMinutes ? Number(service.durationMinutes) : 60,
      description: service.description || '',
      imageUrl: service.imageUrl || (service.images && service.images[0]) || '',
      images: service.images || (service.imageUrl ? [service.imageUrl] : [])
    };

    prov.services.unshift(newService);
    this.saveToDisk();
    return newService;
  }

  deleteProviderService(userId: string, serviceId: string): boolean {
    const prov = this.state.providers.find(p => p.userId === userId || (p as any).id === userId);
    if (!prov) return false;
    const initialLen = prov.services.length;
    prov.services = prov.services.filter(s => s.id !== serviceId);
    this.saveToDisk();
    return prov.services.length < initialLen;
  }

  // Categories
  getCategories(): Category[] {
    return this.state.categories;
  }

  addCategory(category: Category) {
    this.state.categories.push(category);
  }

  // Bookings
  getBookings(): Booking[] {
    return this.state.bookings;
  }

  getBookingById(id: string): Booking | undefined {
    return this.state.bookings.find(b => b.id === id);
  }

  createBooking(booking: Booking): Booking {
    if (!booking.deliveryPin) {
      booking.deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();
    }
    this.state.bookings.unshift(booking);

    // Record wallet transaction
    this.state.transactions.unshift({
      id: 'tx-' + Date.now(),
      userId: booking.customerId,
      bookingId: booking.id,
      amount: -booking.price,
      type: 'payment',
      status: 'succeeded',
      description: `Payment for ${booking.serviceName}`,
      createdAt: new Date().toISOString()
    });

    // Notify provider
    this.state.notifications.unshift({
      id: 'notif-' + Date.now(),
      userId: booking.providerId,
      title: 'New Booking Request',
      message: `${booking.customerName} requested ${booking.serviceName}`,
      type: 'booking',
      read: false,
      createdAt: new Date().toISOString()
    });

    return booking;
  }

  updateBookingStatus(bookingId: string, status: any, actorId: string): Booking | undefined {
    const booking = this.state.bookings.find(b => b.id === bookingId);
    if (!booking) return undefined;
    booking.status = status;

    if (status === 'completed') {
      booking.completedAt = new Date().toISOString();
      // Credit provider wallet
      const prov = this.state.users.find(u => u.id === booking.providerId);
      if (prov) {
        prov.walletBalance += booking.providerEarnings;
        prov.totalJobs = (prov.totalJobs || 0) + 1;
      }
      // Credit platform admin wallet
      const admin = this.state.users.find(u => u.role === 'admin');
      if (admin) {
        admin.walletBalance += booking.commissionFee;
      }

      this.state.transactions.unshift({
        id: 'tx-earn-' + Date.now(),
        userId: booking.providerId,
        bookingId: booking.id,
        amount: booking.providerEarnings,
        type: 'payout',
        status: 'succeeded',
        description: `Earnings for completed job: ${booking.serviceName}`,
        createdAt: new Date().toISOString()
      });

      this.state.notifications.unshift({
        id: 'notif-' + Date.now(),
        userId: booking.customerId,
        title: 'Service Completed',
        message: `${booking.providerName} has completed ${booking.serviceName}. You can now leave a review!`,
        type: 'booking',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return booking;
  }

  verifyBookingDelivery(
    bookingId: string,
    deliveryPin?: string,
    actorRole?: string
  ): { success: boolean; error?: string; booking?: Booking } {
    const booking = this.getBookingById(bookingId);
    if (!booking) return { success: false, error: 'Booking not found' };

    // If a delivery PIN is required and provided, enforce exact match
    if (booking.deliveryPin && deliveryPin) {
      if (booking.deliveryPin.trim() !== deliveryPin.trim()) {
        return {
          success: false,
          error: `Incorrect 4-digit Delivery Handover PIN. Please ask ${booking.customerName} for their verified PIN.`
        };
      }
    }

    booking.deliveryVerified = true;
    booking.deliveredAt = new Date().toISOString();
    const updated = this.updateBookingStatus(bookingId, 'completed', booking.providerId);
    this.saveToDisk();
    return { success: true, booking: updated };
  }

  // Transactions & Wallets
  getTransactions(userId?: string): WalletTransaction[] {
    if (userId) {
      return this.state.transactions.filter(t => t.userId === userId);
    }
    return this.state.transactions;
  }

  addWalletFunds(userId: string, amount: number, currency = 'USD', originalAmount?: number): { balance: number } | { error: string } {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { error: 'User account not found' };
    
    // Strict requirement: Wallet must be approved by admin prior to adding or using funds
    if (user.walletStatus !== 'active' && !user.identityVerified) {
      return { error: 'Wallet pending admin approval. Please wait for an administrator to review your uploaded verification documents.' };
    }

    user.walletBalance += amount;
    const desc = originalAmount && currency !== 'USD'
      ? `Added ${originalAmount} ${currency} (${amount.toFixed(2)} USD credited)`
      : `Added ${amount.toFixed(2)} USD to wallet balance`;

    const tx: WalletTransaction = {
      id: 'tx-dep-' + Date.now(),
      userId,
      amount,
      type: 'deposit',
      status: 'succeeded',
      description: desc,
      createdAt: new Date().toISOString()
    };
    this.state.transactions.unshift(tx);
    this.saveToDisk();
    return { balance: user.walletBalance };
  }

  requestWithdrawal(userId: string, amount: number): { success: boolean; error?: string } {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User account not found' };

    // Customers cannot cash out
    if (user.role === 'customer') {
      return { success: false, error: 'Cashout is disabled for customer accounts. Customer accounts cannot withdraw or cash out funds.' };
    }

    // Strict requirement: Identity verification must be completed prior to wallet usage
    if (user.walletStatus !== 'active' && !user.identityVerified) {
      return { success: false, error: 'Identity verification & wallet approval is required before requesting payouts.' };
    }

    if (user.walletBalance < amount) {
      return { success: false, error: 'Insufficient balance for withdrawal' };
    }

    user.walletBalance -= amount;
    const tx: WalletTransaction = {
      id: 'tx-with-' + Date.now(),
      userId,
      amount: -amount,
      type: 'payout',
      status: 'succeeded',
      description: `Withdrew ${amount.toFixed(2)} to linked provider bank account`,
      createdAt: new Date().toISOString()
    };
    this.state.transactions.unshift(tx);
    this.saveToDisk();
    return { success: true };
  }

  // Reviews
  getReviews(providerId?: string): Review[] {
    if (providerId) {
      return this.state.reviews.filter(r => r.providerId === providerId);
    }
    return this.state.reviews;
  }

  createReview(review: Review): Review {
    this.state.reviews.unshift(review);

    // Update provider rating
    const provReviews = this.state.reviews.filter(r => r.providerId === review.providerId);
    const avg = provReviews.reduce((sum, r) => sum + r.rating, 0) / provReviews.length;
    const prov = this.state.providers.find(p => p.userId === review.providerId);
    if (prov) {
      prov.rating = parseFloat(avg.toFixed(2));
      prov.reviewCount = provReviews.length;
    }
    const provUser = this.state.users.find(u => u.id === review.providerId);
    if (provUser) {
      provUser.rating = parseFloat(avg.toFixed(2));
    }

    return review;
  }

  // Messages (supports both active orders and pre-order private conversations)
  getMessages(targetId: string): ChatMessage[] {
    return this.state.messages.filter(m => 
      m.bookingId === targetId || 
      m.conversationId === targetId ||
      (m.conversationId && m.conversationId.includes(targetId))
    );
  }

  createMessage(msg: ChatMessage): ChatMessage {
    this.state.messages.push(msg);
    return msg;
  }

  // Provider Payment Gateway Settings
  updateProviderPaymentGateway(userId: string, gatewayData: any): ProviderProfile | undefined {
    const prov = this.state.providers.find(p => p.userId === userId);
    if (!prov) return undefined;

    prov.paymentGateway = {
      mode: gatewayData.mode || 'servexa_escrow',
      processor: gatewayData.processor || 'stripe',
      merchantId: gatewayData.merchantId || '',
      publishableKey: gatewayData.publishableKey || '',
      secretKeyMasked: gatewayData.secretKey ? `sk_live_***${gatewayData.secretKey.slice(-4)}` : prov.paymentGateway?.secretKeyMasked || '',
      settlementCurrency: gatewayData.settlementCurrency || 'USD',
      isVerified: true,
      lastTestedAt: new Date().toISOString(),
      autoDisburse: gatewayData.autoDisburse !== undefined ? gatewayData.autoDisburse : true
    };

    this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId: userId,
      adminName: prov.businessName,
      action: 'PAYMENT_GATEWAY_CONFIGURED',
      details: `Provider configured custom payment capture gateway (${prov.paymentGateway.processor}) with merchant ID ${prov.paymentGateway.merchantId || 'Default Servexa AI'}`,
      timestamp: new Date().toISOString()
    });

    return prov;
  }

  // Notifications
  getNotifications(userId: string): AppNotification[] {
    return this.state.notifications.filter(n => n.userId === userId);
  }

  markNotificationsRead(userId: string) {
    this.state.notifications
      .filter(n => n.userId === userId)
      .forEach(n => { n.read = true; });
  }

  // Settings & Commission
  getSettings() {
    return this.state.settings;
  }

  updateCommissionRate(ratePct: number, adminId: string, adminName: string) {
    const oldRate = this.state.settings.commissionRatePct;
    this.state.settings.commissionRatePct = ratePct;

    this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId,
      adminName,
      action: 'COMMISSION_RATE_UPDATED',
      details: `Platform commission rate changed from ${oldRate}% to ${ratePct}%`,
      timestamp: new Date().toISOString()
    });

    return this.state.settings;
  }

  // Audit logs
  getAuditLogs(): AuditLog[] {
    return this.state.auditLogs;
  }

  addAuditLog(log: AuditLog) {
    this.state.auditLogs.unshift(log);
  }

  // Analytics
  getAnalytics(): PlatformStats {
    const bookings = this.state.bookings;
    const completed = bookings.filter(b => b.status === 'completed');
    const cancelled = bookings.filter(b => b.status === 'cancelled');
    const gmvTotal = completed.reduce((sum, b) => sum + b.price, 0);
    const platformRevenue = completed.reduce((sum, b) => sum + b.commissionFee, 0);
    const providerPayouts = completed.reduce((sum, b) => sum + b.providerEarnings, 0);

    return {
      totalCustomers: this.state.users.filter(u => u.role === 'customer').length,
      totalProviders: this.state.providers.length,
      activeUsers: this.state.users.filter(u => u.status === 'active').length,
      activeProviders: this.state.providers.filter(p => p.activeStatus === 'online').length,
      totalBookings: bookings.length,
      completedBookings: completed.length,
      cancelledBookings: cancelled.length,
      gmvTotal: parseFloat(gmvTotal.toFixed(2)),
      platformRevenue: parseFloat(platformRevenue.toFixed(2)),
      providerPayouts: parseFloat(providerPayouts.toFixed(2)),
      commissionRatePct: this.state.settings.commissionRatePct,
      systemHealth: this.state.settings.systemHealth
    };
  }

  // Merchant Gateway Configuration
  getMerchantSettings(): MerchantSettings {
    return this.state.merchantSettings;
  }

  updateMerchantSettings(updates: Partial<MerchantSettings>, adminId: string, adminName: string): MerchantSettings {
    this.state.merchantSettings = {
      ...this.state.merchantSettings,
      ...updates,
      stripe: {
        ...this.state.merchantSettings.stripe,
        ...(updates.stripe || {})
      },
      paypal: {
        ...this.state.merchantSettings.paypal,
        ...(updates.paypal || {})
      },
      square: {
        ...this.state.merchantSettings.square,
        ...(updates.square || {})
      },
      bankSettlement: {
        ...this.state.merchantSettings.bankSettlement,
        ...(updates.bankSettlement || {})
      }
    };

    this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId,
      adminName,
      action: 'MERCHANT_GATEWAY_CONFIG_UPDATED',
      details: `Merchant payment gateway updated. Active: ${this.state.merchantSettings.activeGateway} (${this.state.merchantSettings.environment})`,
      timestamp: new Date().toISOString()
    });

    return this.state.merchantSettings;
  }

  // Complaints & Disputes
  getComplaints(userId?: string, role?: string): Complaint[] {
    if (!userId) return this.state.complaints;
    return this.state.complaints.filter(c =>
      c.userId === userId || c.targetUserId === userId
    );
  }

  getComplaintById(id: string): Complaint | undefined {
    return this.state.complaints.find(c => c.id === id);
  }

  createComplaint(data: {
    bookingId?: string;
    userId: string;
    userName: string;
    userRole: 'customer' | 'provider';
    targetUserId?: string;
    targetUserName?: string;
    subject: string;
    category: any;
    description: string;
    priority?: any;
    disputeAmount?: number;
  }): Complaint {
    const booking = data.bookingId ? this.getBookingById(data.bookingId) : undefined;
    const ticketNum = 'DSP-' + Math.floor(1000 + Math.random() * 9000);
    const newComplaint: Complaint = {
      id: 'cmp-' + Date.now(),
      ticketNumber: ticketNum,
      bookingId: data.bookingId,
      serviceName: booking?.serviceName || 'On-Demand Service Booking',
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      targetUserId: data.targetUserId || booking?.providerId,
      targetUserName: data.targetUserName || booking?.providerName,
      subject: data.subject,
      category: data.category || 'other',
      description: data.description,
      status: 'open',
      priority: data.priority || 'medium',
      disputeAmount: data.disputeAmount ? Number(data.disputeAmount) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'cmsg-' + Date.now(),
          complaintId: 'cmp-' + Date.now(),
          senderId: data.userId,
          senderName: data.userName,
          senderRole: data.userRole,
          text: data.description,
          createdAt: new Date().toISOString()
        }
      ]
    };

    this.state.complaints.unshift(newComplaint);

    // Notify administrators of incoming dispute
    this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId: 'system',
      adminName: 'Servexa Support Engine',
      action: 'NEW_DISPUTE_SUBMITTED',
      details: `New dispute ${ticketNum} opened by ${data.userName} for $${data.disputeAmount ?? 0}`,
      timestamp: new Date().toISOString()
    });

    return newComplaint;
  }

  addComplaintMessage(complaintId: string, msg: {
    senderId: string;
    senderName: string;
    senderRole: 'customer' | 'provider' | 'admin';
    text: string;
  }): ComplaintMessage | null {
    const complaint = this.state.complaints.find(c => c.id === complaintId);
    if (!complaint) return null;

    const newMessage: ComplaintMessage = {
      id: 'cmsg-' + Date.now(),
      complaintId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      text: msg.text,
      createdAt: new Date().toISOString()
    };

    complaint.messages.push(newMessage);
    complaint.updatedAt = new Date().toISOString();
    return newMessage;
  }

  updateComplaintStatus(
    complaintId: string,
    status: 'open' | 'under_review' | 'resolved' | 'rejected',
    resolutionNotes?: string,
    adminId?: string,
    adminName?: string
  ): Complaint | null {
    const complaint = this.state.complaints.find(c => c.id === complaintId);
    if (!complaint) return null;

    complaint.status = status;
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;
    complaint.updatedAt = new Date().toISOString();

    this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId: adminId || 'admin-1',
      adminName: adminName || 'Admin Console',
      action: 'DISPUTE_STATUS_CHANGED',
      details: `Dispute ${complaint.ticketNumber} marked as ${status.toUpperCase()}. Notes: ${resolutionNotes || 'None'}`,
      timestamp: new Date().toISOString()
    });

    return complaint;
  }

  // Real-Time Admin Wallet Adjustment (Add / Remove Money from BOTH accounts)
  adminAdjustWallet(
    targetUserId: string,
    amount: number,
    type: 'credit' | 'debit',
    reason: string,
    adminId: string,
    adminName: string
  ): { user: User; newBalance: number; transaction: WalletTransaction } | { error: string } {
    const user = this.getUserById(targetUserId);
    if (!user) return { error: 'Target user account not found' };

    const parsedAmount = Math.abs(Number(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return { error: 'Invalid adjustment amount specified' };
    }

    if (type === 'debit' && user.walletBalance < parsedAmount) {
      return { error: `Insufficient account balance. Current available: $${user.walletBalance.toFixed(2)}` };
    }

    if (type === 'credit') {
      user.walletBalance = Math.round((user.walletBalance + parsedAmount) * 100) / 100;
    } else {
      user.walletBalance = Math.round((user.walletBalance - parsedAmount) * 100) / 100;
    }

    const tx: WalletTransaction = {
      id: 'tx-' + Date.now(),
      userId: user.id,
      type: type === 'credit' ? 'deposit' : 'withdrawal',
      amount: parsedAmount,
      description: `Admin ${type === 'credit' ? 'Credit' : 'Debit'}: ${reason}`,
      status: 'succeeded',
      createdAt: new Date().toISOString()
    };

    this.state.transactions.unshift(tx);

    this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId,
      adminName,
      action: type === 'credit' ? 'WALLET_ADMIN_CREDIT' : 'WALLET_ADMIN_DEBIT',
      targetUserId: user.id,
      targetName: user.name,
      details: `${type === 'credit' ? 'Added' : 'Removed'} $${parsedAmount.toFixed(2)} (${reason}). New Balance: $${user.walletBalance.toFixed(2)}`,
      timestamp: new Date().toISOString()
    });

    return { user, newBalance: user.walletBalance, transaction: tx };
  }

  // Live Location Tracker updates
  updateBookingLiveLocation(
    bookingId: string,
    role: 'customer' | 'provider',
    lat: number,
    lng: number,
    speed?: number,
    heading?: number
  ): Booking | null {
    const booking = this.getBookingById(bookingId);
    if (!booking) return null;

    if (role === 'provider') {
      booking.providerCurrentLocation = {
        lat,
        lng,
        address: `Live GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
      };
      // Also update provider profile location
      this.updateProviderLocation(booking.providerId, lat, lng, heading);
    } else {
      booking.pickupLocation = {
        ...booking.pickupLocation,
        lat,
        lng
      };
    }

    return booking;
  }

  // Provider Subdomain Storefront Operations ($5/mo)
  getProviderStorefront(providerId: string): ProviderStorefront | null {
    const prov = this.getProviderById(providerId);
    if (!prov) return null;
    if (!prov.storefront) {
      prov.storefront = {
        enabled: true,
        subdomain: prov.handle || `store-${prov.userId.replace(/[^a-z0-9]/gi, '')}`,
        storeName: prov.businessName || 'My Professional Store',
        tagline: 'Professional on-demand services backed by verified reviews and real-time tracking.',
        bio: prov.bio || '',
        contactPhone: this.getUserById(prov.userId)?.phone || '',
        subscriptionActive: false,
        monthlyFee: 5.00,
        analytics: { views: 0, orders: 0, revenue: 0 }
      };
    }
    return prov.storefront;
  }

  updateProviderStorefront(
    providerId: string,
    updates: Partial<ProviderStorefront>
  ): { provider: ProviderProfile; storefront: ProviderStorefront } | { error: string } {
    const prov = this.getProviderById(providerId);
    if (!prov) return { error: 'Provider not found' };

    if (!prov.storefront) {
      this.getProviderStorefront(providerId);
    }

    if (updates.subdomain) {
      const cleanSubdomain = updates.subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
      if (cleanSubdomain.length < 3) {
        return { error: 'Subdomain must be at least 3 alphanumeric characters' };
      }
      // Check collision
      const collision = this.state.providers.find(
        p => p.userId !== providerId && p.storefront?.subdomain === cleanSubdomain
      );
      if (collision) {
        return { error: `The subdomain "${cleanSubdomain}" is already claimed by another store` };
      }
      prov.storefront!.subdomain = cleanSubdomain;
    }

    if (updates.storeName) {
      prov.storefront!.storeName = updates.storeName.trim();
      prov.businessName = updates.storeName.trim();
    }
    if (updates.tagline !== undefined) prov.storefront!.tagline = updates.tagline;
    if (updates.bio !== undefined) {
      prov.storefront!.bio = updates.bio;
      prov.bio = updates.bio;
    }
    if (updates.contactPhone !== undefined) prov.storefront!.contactPhone = updates.contactPhone;
    if (updates.contactEmail !== undefined) prov.storefront!.contactEmail = updates.contactEmail;
    if (updates.bannerUrl !== undefined) prov.storefront!.bannerUrl = updates.bannerUrl;
    if (updates.logoUrl !== undefined) prov.storefront!.logoUrl = updates.logoUrl;
    if (updates.enabled !== undefined) prov.storefront!.enabled = updates.enabled;

    return { provider: prov, storefront: prov.storefront! };
  }

  subscribeStorefront(providerId: string): {
    success: boolean;
    error?: string;
    storefront?: ProviderStorefront;
    provider?: ProviderProfile;
    transaction?: WalletTransaction;
  } {
    const prov = this.getProviderById(providerId);
    if (!prov) return { success: false, error: 'Provider account not found' };

    const user = this.getUserById(providerId);
    if (!user) return { success: false, error: 'User account not found' };

    const monthlyCost = 5.00;
    if (user.walletBalance < monthlyCost) {
      return {
        success: false,
        error: `Insufficient wallet balance ($${user.walletBalance.toFixed(2)}). A minimum of $5.00 is required to activate your custom subdomain store.`
      };
    }

    // Deduct $5 monthly fee
    user.walletBalance = Math.round((user.walletBalance - monthlyCost) * 100) / 100;

    const renewDate = new Date();
    renewDate.setDate(renewDate.getDate() + 30);

    if (!prov.storefront) {
      this.getProviderStorefront(providerId);
    }

    prov.storefront!.subscriptionActive = true;
    prov.storefront!.subscriptionRenewsAt = renewDate.toISOString();
    prov.storefront!.monthlyFee = monthlyCost;

    const tx: WalletTransaction = {
      id: 'tx-store-' + Date.now(),
      userId: user.id,
      amount: monthlyCost,
      type: 'subscription',
      status: 'succeeded',
      description: `Storefront Subdomain (${prov.storefront!.subdomain}.servexa.com) - $5/mo Monthly Hosting`,
      createdAt: new Date().toISOString()
    };

    this.state.transactions.unshift(tx);

    this.addNotification({
      id: 'notif-' + Date.now(),
      userId: user.id,
      title: 'Storefront Subdomain Activated',
      message: `Your store is live at ${prov.storefront!.subdomain}.servexa.com! $5.00 monthly subscription paid.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId: user.id,
      adminName: user.name,
      action: 'STOREFRONT_SUBSCRIBED',
      details: `Provider ${user.name} subscribed to subdomain "${prov.storefront!.subdomain}" for $5/mo`,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      storefront: prov.storefront,
      provider: prov,
      transaction: tx
    };
  }

  getStorefrontBySubdomain(subdomain: string): { provider: ProviderProfile; user: User } | null {
    const clean = subdomain.toLowerCase().trim();
    const provider = this.state.providers.find(
      p => p.storefront?.subdomain.toLowerCase() === clean || p.handle.toLowerCase() === clean
    );
    if (!provider) return null;
    const user = this.getUserById(provider.userId);
    if (!user) return null;

    // Increment analytics view count
    if (provider.storefront?.analytics) {
      provider.storefront.analytics.views += 1;
    }

    return { provider, user };
  }

  // Email Verification
  setUserEmailVerified(identifier: string, verified: boolean = true): User | null {
    const user = this.getUserById(identifier) || this.getUserByEmail(identifier);
    if (!user) return null;

    user.emailVerified = verified;
    user.verified = verified;

    this.addNotification({
      id: 'notif-' + Date.now(),
      userId: user.id,
      title: 'Email Address Verified',
      message: `Your email address ${user.email} has been successfully verified with Servexa World.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    return user;
  }

  // ----------------------------------------------------
  // PRODUCTS & PROVIDER STORE PRODUCTS
  // ----------------------------------------------------
  getProducts(categoryId?: string, providerId?: string): StoreProduct[] {
    let list = this.state.products || [];
    if (categoryId && categoryId !== 'all') {
      list = list.filter(p => p.category === categoryId);
    }
    if (providerId) {
      list = list.filter(p => p.providerId === providerId);
    }
    return list;
  }

  getProductById(id: string): StoreProduct | null {
    return this.state.products.find(p => p.id === id) || null;
  }

  addProduct(data: Partial<StoreProduct> & { name: string; price: number; providerId: string }): StoreProduct {
    const provider = this.getProviderById(data.providerId);
    const newProduct: StoreProduct = {
      id: 'prod-' + Date.now(),
      providerId: data.providerId,
      providerName: data.providerName || provider?.businessName || 'Verified Specialist',
      storeName: data.storeName || provider?.storefront?.storeName || 'Official Store',
      subdomain: data.subdomain || provider?.storefront?.subdomain || provider?.handle || 'store',
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 10,
      currency: data.currency || provider?.storefront?.currency || 'USD',
      category: data.category || provider?.category || 'cat-home',
      image: data.image || data.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      imageUrl: data.image || data.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      inStock: data.inStock !== false,
      rating: 5.0,
      salesCount: 0
    };
    if (!this.state.products) this.state.products = [];
    this.state.products.unshift(newProduct);
    this.saveToDisk();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<StoreProduct>): StoreProduct | null {
    const product = this.getProductById(id);
    if (!product) return null;
    Object.assign(product, updates);
    this.saveToDisk();
    return product;
  }

  deleteProduct(id: string): boolean {
    const initialLen = this.state.products.length;
    this.state.products = this.state.products.filter(p => p.id !== id);
    if (this.state.products.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  purchaseProduct(
    productId: string,
    customerId: string,
    quantity = 1,
    paymentMethod = 'card'
  ): { success: boolean; product?: StoreProduct; error?: string; orderId?: string } {
    const product = this.getProductById(productId);
    if (!product) return { success: false, error: 'Product not found' };

    const customer = this.getUserById(customerId);
    if (!customer) return { success: false, error: 'Customer not found' };

    const provider = this.getUserById(product.providerId);
    const total = Math.round(product.price * quantity * 100) / 100;
    const adminCommission = Math.round(total * 0.06 * 100) / 100; // 6%
    const providerEarnings = Math.round((total - adminCommission) * 100) / 100;

    if (paymentMethod === 'wallet') {
      if (customer.walletBalance < total) {
        return { success: false, error: `Insufficient wallet balance ($${customer.walletBalance.toFixed(2)}) for $${total.toFixed(2)} purchase.` };
      }
      customer.walletBalance = Math.round((customer.walletBalance - total) * 100) / 100;
    }

    if (provider) {
      provider.walletBalance = Math.round((provider.walletBalance + providerEarnings) * 100) / 100;
    }

    const admin = this.getUserById('admin-1');
    if (admin) {
      admin.walletBalance = Math.round((admin.walletBalance + adminCommission) * 100) / 100;
    }

    product.salesCount = (product.salesCount || 0) + quantity;
    const orderId = 'ord-' + Date.now();

    const tx: WalletTransaction = {
      id: 'tx-prod-' + Date.now(),
      userId: customer.id,
      amount: total,
      type: 'payment',
      status: 'succeeded',
      description: `Purchased ${quantity}x ${product.name} from ${product.storeName}`,
      createdAt: new Date().toISOString()
    };
    this.state.transactions.unshift(tx);

    this.addNotification({
      id: 'notif-' + Date.now(),
      userId: customer.id,
      title: 'Store Product Order Confirmed',
      message: `You successfully bought ${quantity}x ${product.name} ($${total.toFixed(2)}). Receipt sent.`,
      type: 'payment',
      read: false,
      createdAt: new Date().toISOString()
    });

    if (provider) {
      this.addNotification({
        id: 'notif-' + (Date.now() + 1),
        userId: provider.id,
        title: 'New Store Order Received!',
        message: `${customer.name} purchased ${quantity}x ${product.name}. Earnings of $${providerEarnings.toFixed(2)} credited (6% platform fee applied).`,
        type: 'payment',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    this.saveToDisk();
    return { success: true, product, orderId };
  }

  // ----------------------------------------------------
  // INVOICES (IN-CHAT BILLING & PAYMENT)
  // ----------------------------------------------------
  createChatInvoice(data: {
    bookingId?: string;
    conversationId?: string;
    providerId: string;
    customerId: string;
    laborAmount: number;
    materialsAmount: number;
    notes?: string;
  }): ChatInvoice {
    const provider = this.getUserById(data.providerId);
    const customer = this.getUserById(data.customerId);

    const labor = Math.max(0, Math.round(data.laborAmount * 100) / 100);
    const materials = Math.max(0, Math.round(data.materialsAmount * 100) / 100);
    const consultationFee = 1.00; // $1.00 fixed captured by admin
    const serviceTotal = labor + materials;
    const commissionFee = Math.round(serviceTotal * 0.06 * 100) / 100; // 6% from provider
    const totalAmount = Math.round((serviceTotal + consultationFee) * 100) / 100;
    const providerEarnings = Math.round((serviceTotal - commissionFee) * 100) / 100;

    const invoice: ChatInvoice = {
      id: 'inv-' + Date.now(),
      bookingId: data.bookingId,
      conversationId: data.conversationId,
      providerId: data.providerId,
      providerName: provider?.name || 'Service Specialist',
      customerId: data.customerId,
      customerName: customer?.name || 'Valued Customer',
      laborAmount: labor,
      materialsAmount: materials,
      consultationFee,
      commissionFee,
      totalAmount,
      providerEarnings,
      notes: data.notes || 'Service labor and supplies invoice',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (!this.state.invoices) this.state.invoices = [];
    this.state.invoices.unshift(invoice);

    // Also send an automated chat message containing the invoice
    const chatMsg: ChatMessage = {
      id: 'msg-inv-' + Date.now(),
      bookingId: data.bookingId,
      conversationId: data.conversationId,
      senderId: data.providerId,
      receiverId: data.customerId,
      senderName: provider?.name || 'Service Provider',
      text: `📋 Official Service Invoice: $${totalAmount.toFixed(2)} (Labor: $${labor.toFixed(2)}, Supplies: $${materials.toFixed(2)}, Platform Consultation: $1.00). Click to pay below!`,
      mediaType: 'invoice',
      invoice,
      timestamp: new Date().toISOString(),
      read: false
    };
    this.state.messages.push(chatMsg);

    this.saveToDisk();
    return invoice;
  }

  payChatInvoice(
    invoiceId: string,
    paymentMethod = 'card'
  ): { success: boolean; invoice?: ChatInvoice; error?: string } {
    const inv = this.state.invoices?.find(i => i.id === invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found' };
    if (inv.status === 'paid' || inv.status === 'confirmed') return { success: true, invoice: inv };

    const customer = this.getUserById(inv.customerId);
    const provider = this.getUserById(inv.providerId);
    const admin = this.getUserById('admin-1');

    if ((paymentMethod === 'credit' || paymentMethod === 'wallet') && customer) {
      if (customer.walletBalance < inv.totalAmount) {
        return {
          success: false,
          error: `Insufficient credit balance ($${customer.walletBalance.toFixed(2)}). Total amount is $${inv.totalAmount.toFixed(2)}.`
        };
      }
      customer.walletBalance = Math.round((customer.walletBalance - inv.totalAmount) * 100) / 100;
    }

    inv.status = 'confirmed';
    inv.paidAt = new Date().toISOString();
    inv.paymentMethod = paymentMethod;
    inv.transactionId = 'tx-inv-' + Date.now();

    // Credit provider earnings ((labor + materials) - 6%)
    if (provider) {
      provider.walletBalance = Math.round((provider.walletBalance + inv.providerEarnings) * 100) / 100;
      provider.totalJobs = (provider.totalJobs || 0) + 1;
      
      // Milestone bonus check: 10 completed jobs = 10%, 20 completed jobs = 20%
      const totalJobs = provider.totalJobs;
      if (totalJobs === 10) {
        const bonus = Math.round(inv.providerEarnings * 0.10 * 100) / 100;
        provider.walletBalance = Math.round((provider.walletBalance + bonus) * 100) / 100;
        provider.totalBonusesEarned = (provider.totalBonusesEarned || 0) + bonus;
        this.addNotification({
          id: 'notif-bonus-10-' + Date.now(),
          userId: provider.id,
          title: '🎉 10 Jobs Milestone Bonus (10%)!',
          message: `Congratulations on completing 10 jobs! You received an extra 10% bonus of $${bonus.toFixed(2)} credited to your wallet.`,
          type: 'payment',
          read: false,
          createdAt: new Date().toISOString()
        });
      } else if (totalJobs === 20) {
        const bonus = Math.round(inv.providerEarnings * 0.20 * 100) / 100;
        provider.walletBalance = Math.round((provider.walletBalance + bonus) * 100) / 100;
        provider.totalBonusesEarned = (provider.totalBonusesEarned || 0) + bonus;
        this.addNotification({
          id: 'notif-bonus-20-' + Date.now(),
          userId: provider.id,
          title: '🏆 20 Jobs Milestone Mega-Bonus (20%)!',
          message: `Outstanding achievement! You completed 20 jobs! An extra 20% bonus of $${bonus.toFixed(2)} has been credited to your wallet.`,
          type: 'payment',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Credit Admin revenue: $1 consultation fee + 6% commission
    const adminRevenue = Math.round((inv.consultationFee + inv.commissionFee) * 100) / 100;
    if (admin) {
      admin.walletBalance = Math.round((admin.walletBalance + adminRevenue) * 100) / 100;
    }

    // Customer Loyalty: 1 free service after every 15 services
    if (customer) {
      customer.completedLoyaltyServices = (customer.completedLoyaltyServices || 0) + 1;
      if (customer.completedLoyaltyServices >= 15) {
        customer.completedLoyaltyServices = 0;
        customer.freeServicesEarned = (customer.freeServicesEarned || 0) + 1;
        this.addNotification({
          id: 'notif-loyalty-' + Date.now(),
          userId: customer.id,
          title: '🎁 Congratulations: 1 Free Service Earned!',
          message: 'You have completed 15 services with Servexa World! You now have 1 Free Service credit (100% off up to $100).',
          type: 'system',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Update booking to confirmed status upon payment in chat
    if (inv.bookingId) {
      const booking = this.getBookingById(inv.bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
      }
    }

    // Notify customer and provider
    if (customer) {
      this.addNotification({
        id: 'notif-paid-' + Date.now(),
        userId: customer.id,
        title: 'Invoice Payment Received',
        message: `Your payment of $${inv.totalAmount.toFixed(2)} to ${inv.providerName} is verified. Receipt generated.`,
        type: 'payment',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    if (provider) {
      this.addNotification({
        id: 'notif-paid-p-' + Date.now(),
        userId: provider.id,
        title: 'Payment Received from Customer!',
        message: `${inv.customerName} has paid the invoice! $${inv.providerEarnings.toFixed(2)} has been deposited into your provider wallet (6% commission deducted).`,
        type: 'payment',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    // Automated chat message confirming receipt
    const confirmMsg: ChatMessage = {
      id: 'msg-paid-' + Date.now(),
      bookingId: inv.bookingId,
      conversationId: inv.conversationId,
      senderId: 'system',
      receiverId: inv.customerId,
      senderName: 'Servexa World Escrow',
      text: `✅ Payment of $${inv.totalAmount.toFixed(2)} confirmed! Funds disbursed to ${inv.providerName} with receipt verified. Thank you for using Servexa World.`,
      mediaType: 'text',
      timestamp: new Date().toISOString(),
      read: true
    };
    this.state.messages.push(confirmMsg);

    this.saveToDisk();
    return { success: true, invoice: inv };
  }

  getInvoices(bookingId?: string, providerId?: string, customerId?: string): ChatInvoice[] {
    let list = this.state.invoices || [];
    if (bookingId) list = list.filter(i => i.bookingId === bookingId);
    if (providerId) list = list.filter(i => i.providerId === providerId);
    if (customerId) list = list.filter(i => i.customerId === customerId);
    return list;
  }

  // ----------------------------------------------------
  // PROVIDER PAYOUTS (24 to 48 HOURS WINDOW)
  // ----------------------------------------------------
  getPayouts(): ProviderPayout[] {
    return this.state.payouts || [];
  }

  requestProviderPayout(
    providerId: string,
    amount: number,
    payoutMethod: 'stripe_connect' | 'paypal' | 'bank_wire' = 'stripe_connect'
  ): { success: boolean; payout?: ProviderPayout; error?: string } {
    const user = this.getUserById(providerId);
    if (!user) return { success: false, error: 'Provider account not found' };

    if (amount <= 0 || user.walletBalance < amount) {
      return { success: false, error: `Insufficient wallet balance ($${user.walletBalance.toFixed(2)}).` };
    }

    // Deduct from provider balance
    user.walletBalance = Math.round((user.walletBalance - amount) * 100) / 100;

    const scheduledDate = new Date();
    scheduledDate.setHours(scheduledDate.getHours() + 36); // In 36 hours (within 24-48h window)

    const payout: ProviderPayout = {
      id: 'po-' + Date.now(),
      providerId: user.id,
      providerName: user.name,
      amount,
      status: 'scheduled',
      requestedAt: new Date().toISOString(),
      estimatedArrivalMinHours: 24,
      estimatedArrivalMaxHours: 48,
      scheduledDisbursementAt: scheduledDate.toISOString(),
      payoutMethod,
      referenceNumber: `PO-${payoutMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`
    };

    if (!this.state.payouts) this.state.payouts = [];
    this.state.payouts.unshift(payout);

    this.addNotification({
      id: 'notif-' + Date.now(),
      userId: user.id,
      title: 'Payout Request Scheduled (24-48h)',
      message: `Your payout of $${amount.toFixed(2)} via ${payoutMethod} has been scheduled. Estimated arrival in 24 to 48 hours.`,
      type: 'payment',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.saveToDisk();
    return { success: true, payout };
  }

  disburseProviderPayout(payoutId: string): { success: boolean; payout?: ProviderPayout; error?: string } {
    const payout = this.state.payouts?.find(p => p.id === payoutId);
    if (!payout) return { success: false, error: 'Payout record not found' };

    payout.status = 'disbursed';
    payout.disbursedAt = new Date().toISOString();

    this.addNotification({
      id: 'notif-' + Date.now(),
      userId: payout.providerId,
      title: 'Payout Disbursed Successfully!',
      message: `Your payout of $${payout.amount.toFixed(2)} (${payout.referenceNumber}) has been released via ${payout.payoutMethod}.`,
      type: 'payment',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.saveToDisk();
    return { success: true, payout };
  }

  // ----------------------------------------------------
  // EMAIL COMMUNICATIONS (RESEND & SMTP SETTINGS)
  // ----------------------------------------------------
  getEmailSettings(): EmailSettings {
    return this.state.emailSettings || INITIAL_EMAIL_SETTINGS;
  }

  updateEmailSettings(updates: Partial<EmailSettings>): EmailSettings {
    this.state.emailSettings = { ...this.getEmailSettings(), ...updates };
    this.saveToDisk();
    return this.state.emailSettings;
  }

  sendEmail(
    to: string,
    subject: string,
    message: string,
    service: 'resend' | 'smtp' = 'resend'
  ): { success: boolean; dispatchedBy: string; message: string; timestamp: string } {
    const timestamp = new Date().toISOString();
    console.log(`[EMAIL DISPATCH - ${service.toUpperCase()}] To: ${to} | Subject: ${subject}`);
    
    this.state.emailSettings = {
      ...this.getEmailSettings(),
      lastDispatchedEmail: {
        to,
        subject,
        service,
        timestamp
      }
    };

    this.saveToDisk();
    return {
      success: true,
      dispatchedBy: service === 'resend' ? 'Resend API Gateway' : 'Custom SMTP Server (Port 587/TLS)',
      message: `Email successfully delivered to ${to}`,
      timestamp
    };
  }

  // ----------------------------------------------------
  // SPECIAL PRIZE AWARD BY ADMIN
  // ----------------------------------------------------
  awardSpecialPrize(
    providerId: string,
    prizeTitle = 'Master Service Excellence Trophy & $250 Cash Bonus',
    amount = 250
  ): { success: boolean; message: string; provider?: User } {
    const provider = this.getUserById(providerId);
    if (!provider) return { success: false, message: 'Provider not found' };

    provider.walletBalance = Math.round((provider.walletBalance + amount) * 100) / 100;
    provider.totalBonusesEarned = (provider.totalBonusesEarned || 0) + amount;

    this.addNotification({
      id: 'notif-prize-' + Date.now(),
      userId: provider.id,
      title: '🏆 Special Admin Prize Awarded!',
      message: `You have been awarded the "${prizeTitle}" by Servexa World Admin! An extra $${amount.toFixed(2)} cash prize has been deposited into your balance.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.addAuditLog({
      id: 'log-' + Date.now(),
      adminId: 'admin-1',
      adminName: 'Mr. Pirate',
      action: 'SPECIAL_PRIZE_AWARDED',
      details: `Awarded "${prizeTitle}" ($${amount}) to provider ${provider.name}`,
      timestamp: new Date().toISOString()
    });

    this.saveToDisk();
    return {
      success: true,
      message: `Successfully awarded "${prizeTitle}" with $${amount} bonus to ${provider.name}`,
      provider
    };
  }
}

export const db = new Database();
