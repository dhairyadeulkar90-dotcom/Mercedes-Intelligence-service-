export interface CarColor {
  name: string;
  hex: string;
  price: string;
  metallic: boolean;
  roughness: number;
  metalness: number;
}

export interface WheelOption {
  id: string;
  name: string;
  size: string;
  style: string;
}

export interface CarModel {
  id: string;
  name: string;
  tagline: string;
  type: 'sports' | 'electric' | 'suv';
  price: string;
  colors: CarColor[];
  wheels: WheelOption[];
  specs: {
    acceleration: string; // 0-100 km/h
    topSpeed: string;
    power: string;
    rangeOrTorque: string; // Electric range or torque for ICE
    engine: string;
  };
  highlights: string[];
}

export interface TestDriveBooking {
  id: string;
  carModelId: string;
  carModelName: string;
  colorName: string;
  wheelName: string;
  fullName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  location: string;
  createdAt: string;
  status: 'confirmed' | 'pending' | 'completed';
}

export const SHOWROOM_LOCATIONS = [
  { id: 'mb_bkc', name: 'Mercedes-Benz BKC Flagship Showroom', city: 'Mumbai, MH' },
  { id: 'del_vk', name: 'Mercedes-Benz AMG Vasant Kunj Center', city: 'New Delhi, DL' },
  { id: 'blr_in', name: 'Mercedes-Benz Indiranagar EV Atelier', city: 'Bengaluru, KA' },
  { id: 'chn_ecr', name: 'Mercedes-Benz ECR Elite Showroom', city: 'Chennai, TN' },
  { id: 'hyd_jh', name: 'Mercedes-Benz Jubilee Hills Showcase', city: 'Hyderabad, TS' },
];

export const CAR_MODELS: CarModel[] = [
  {
    id: 'amg_gt',
    name: 'Mercedes-AMG GT Coupe',
    tagline: 'High-performance engineering raw thrills',
    type: 'sports',
    price: '₹1,46,87,650',
    colors: [
      { name: 'Patagonia Red Metallic', hex: '#8a0011', price: '₹1,00,200', metallic: true, roughness: 0.15, metalness: 0.85 },
      { name: 'AMG Green Hell Magno', hex: '#215c2d', price: '₹2,92,250', metallic: false, roughness: 0.6, metalness: 0.2 },
      { name: 'Obsidian Black Metallic', hex: '#0a0a0a', price: 'Standard', metallic: true, roughness: 0.1, metalness: 0.9 },
      { name: 'Iridium Silver Metallic', hex: '#999e9f', price: 'Standard', metallic: true, roughness: 0.2, metalness: 0.95 },
    ],
    wheels: [
      { id: 'w_amg_1', name: '21" AMG Matte Black Forged Multi-Spoke', size: '21 inch', style: 'Forged' },
      { id: 'w_amg_2', name: '20" Coupe Platinum Aerodynamic', size: '20 inch', style: 'Aerodynamic' },
    ],
    specs: {
      acceleration: '3.1s',
      topSpeed: '315 km/h',
      power: '577 hp',
      rangeOrTorque: '800 Nm Torque',
      engine: 'AMG 4.0L V8 Biturbo',
    },
    highlights: [
      'Active Aerodynamics with extensible spoiler',
      'Handcrafted AMG 4.0L V8 Dry-Sump Engine',
      'AMG RIDE CONTROL sport suspension',
      'High-performance ceramic composite brakes',
    ],
  },
  {
    id: 'eqs',
    name: 'Mercedes-EQ EQS Sedan',
    tagline: 'The pinnacle of luxury electric mobility',
    type: 'electric',
    price: '₹87,17,400',
    colors: [
      { name: 'Sodalite Blue Metallic', hex: '#112244', price: '₹70,975', metallic: true, roughness: 0.12, metalness: 0.8 },
      { name: 'Diamond White Bright', hex: '#eef2f5', price: '₹1,25,250', metallic: true, roughness: 0.1, metalness: 0.75 },
      { name: 'Obsidian Black Metallic', hex: '#0a0a0a', price: 'Standard', metallic: true, roughness: 0.1, metalness: 0.9 },
      { name: 'Selenite Grey Metallic', hex: '#4b4d4f', price: 'Standard', metallic: true, roughness: 0.18, metalness: 0.88 },
    ],
    wheels: [
      { id: 'w_eqs_1', name: '22" EQ Multispoke Aero with Black Accents', size: '22 inch', style: 'Electric Aero' },
      { id: 'w_eqs_2', name: '21" Classic Premium Luxury Spoke', size: '21 inch', style: 'Luxury Spoke' },
    ],
    specs: {
      acceleration: '4.1s',
      topSpeed: '210 km/h',
      power: '516 hp',
      rangeOrTorque: '675 km (WLTP)',
      engine: 'Dual AMG Electric Motors',
    },
    highlights: [
      'Revolutionary MBUX Hyperscreen (56-inch glass panel)',
      'Acoustic comfort suite with near-silent electric drive',
      'Rear-axle steering with 10-degree turning angle',
      'HEPA filtration air cabin purification system',
    ],
  },
  {
    id: 'g_wagon',
    name: 'Mercedes-Benz G-Class AMG G 63',
    tagline: 'Unequaled luxury meets ultimate off-road legacy',
    type: 'suv',
    price: '₹1,52,80,500',
    colors: [
      { name: 'Monza Grey Magno', hex: '#636569', price: '₹2,33,800', metallic: false, roughness: 0.55, metalness: 0.3 },
      { name: 'Classic Sand Gloss', hex: '#bdaf91', price: '₹1,50,300', metallic: false, roughness: 0.2, metalness: 0.1 },
      { name: 'Obsidian Black Metallic', hex: '#0a0a0a', price: 'Standard', metallic: true, roughness: 0.1, metalness: 0.9 },
      { name: 'Polar White Solid', hex: '#f7f9fa', price: 'Standard', metallic: false, roughness: 0.15, metalness: 0.1 },
    ],
    wheels: [
      { id: 'w_g_1', name: '22" Forged Monoblock Edition Matte Black', size: '22 inch', style: 'Monoblock' },
      { id: 'w_g_2', name: '21" twin 5-spoke offroad alloys', size: '21 inch', style: 'Offroad' },
    ],
    specs: {
      acceleration: '4.5s',
      topSpeed: '220 km/h',
      power: '577 hp',
      rangeOrTorque: '850 Nm @ 2,500 rpm',
      engine: 'Handcrafted AMG 4.0L V8 Biturbo',
    },
    highlights: [
      'Iconic Three Differential Locks mechanical setup',
      'AMG-specific exhaust valves with sidepipe exits',
      'Burmester® Surround Sound Premium System',
      'Extremely rigid passenger cell box frame construction',
    ],
  },
];
