import type {
  TNavLink,
  TService,
  TTechnology,
  TExperience,
  TTestimonial,
  TProject,
} from '../types';

import {
  javascript,
  typescript,
  html,
  css,
  reactjs,
  redux,
  tailwind,
  nodejs,
  mongodb,
  meta,
  starbucks,
  tesla,
  shopify,
  ps5_gaming_card,
  badge_pc,
  badge_ps5,
  badge_vr,
  badge_esports,
} from '../assets';

export const navLinks: TNavLink[] = [
  {
    id: 'gallery',
    title: 'Gaming Zones',
  },
  {
    id: 'games',
    title: 'Game Library',
  },
  {
    id: 'reviews',
    title: 'Reviews',
  },
  {
    id: 'contact',
    title: 'Join Us',
  },
];

const services: TService[] = [
  {
    title: 'PS5 Console Gaming',
    icon: badge_ps5,
  },
  {
    title: '4K 120Hz LED Displays',
    icon: badge_esports,
  },
  {
    title: 'Multiplayer & Co-Op',
    icon: badge_pc,
  },
  {
    title: 'Hourly Booking Slots',
    icon: badge_vr,
  },
];

const technologies: TTechnology[] = [
  {
    name: 'PlayStation 5',
    icon: html,
  },
  {
    name: 'DualSense Controller',
    icon: css,
  },
  {
    name: '4K 120Hz LED Display',
    icon: javascript,
  },
  {
    name: 'EA Sports FC 26',
    icon: typescript,
  },
  {
    name: 'WWE 2K Series',
    icon: reactjs,
  },
  {
    name: 'GTA V / GTA VI',
    icon: redux,
  },
  {
    name: 'Mortal Kombat 1',
    icon: tailwind,
  },
  {
    name: 'Call of Duty',
    icon: nodejs,
  },
  {
    name: 'Uncharted Series',
    icon: mongodb,
  },
];

const experiences: TExperience[] = [
  {
    title: 'Phase 1: Venue & Interior Setup',
    companyName: 'Ahmedabad Location',
    icon: starbucks,
    iconBg: '#915eff',
    date: 'July 2026',
    points: [
      'Secured a premium commercial space in the heart of Ahmedabad city.',
      'Designed a dark, neon-lit cyberpunk interior with RGB accent lighting throughout.',
      'Set up dedicated, acoustically isolated PS5 stations with comfortable seating.',
    ],
  },
  {
    title: 'Phase 2: Console & Display Procurement',
    companyName: 'Hardware Setup',
    icon: tesla,
    iconBg: '#00f0ff',
    date: 'August 2026 (In Progress)',
    points: [
      'Acquired PlayStation 5 consoles with DualSense controllers for every station.',
      'Installed premium 120Hz 4K LED TVs — delivering crystal-clear, ultra-smooth gameplay.',
      'Configured all stations for local multiplayer, co-op, and competitive 1v1 sessions.',
    ],
  },
  {
    title: 'Phase 3: Game Library & Memberships',
    companyName: 'Content & Packages',
    icon: shopify,
    iconBg: '#ff007f',
    date: 'September 2026 (Upcoming)',
    points: [
      'Loading 20+ top PS5 titles — FIFA, WWE, GTA V, Mortal Kombat, Uncharted, and more.',
      'Launching hourly booking packages, group deals, and monthly membership tiers.',
      'Setting up online pre-booking via the Vortex web app for seamless slot reservations.',
    ],
  },
  {
    title: 'Phase 4: Grand Opening Championship',
    companyName: 'Launch Event',
    icon: meta,
    iconBg: '#ffaa00',
    date: 'October 2026 (Launch)',
    points: [
      'Grand opening event welcoming all gamers across Ahmedabad.',
      'Inaugural Vortex EA Sports FC 26 & WWE 2K25 local tournament with prize pool.',
      'Opening public bookings, group packages, and loyalty membership registrations.',
    ],
  },
];

const testimonials: TTestimonial[] = [
  {
    testimonial:
      'Finally a proper PS5 spot in Ahmedabad! The 4K displays are stunning and the DualSense haptics feel incredible. Played FIFA for 3 hours straight — worth every rupee.',
    name: 'Aarav Mehta',
    designation: 'FIFA Enthusiast',
    company: 'Local Gamer',
    image: 'https://randomuser.me/api/portraits/men/4.jpg',
  },
  {
    testimonial:
      "Brought my whole squad for a WWE 2K session. 4 players, one screen, pure chaos — exactly what we needed. The vibe is unmatched. We're coming back every weekend.",
    name: 'Priya Shah',
    designation: 'Casual Gamer',
    company: 'Regular Member',
    image: 'https://randomuser.me/api/portraits/women/5.jpg',
  },
  {
    testimonial:
      "GTA V on a 4K 120Hz display with a PS5? That's not gaming, that's an experience. Vortex is the best thing to happen to Ahmedabad's gaming scene.",
    name: 'Kabir Patel',
    designation: 'Console Gamer',
    company: 'Weekend Regular',
    image: 'https://randomuser.me/api/portraits/men/6.jpg',
  },
];

const projects: TProject[] = [
  {
    name: 'EA Sports FC 26',
    description:
      'The ultimate football experience on PS5. Challenge your friends to intense local multiplayer matchups on our 4K 120Hz displays with buttery-smooth 120fps gameplay.',
    tags: [
      {
        name: 'PlayStation 5',
        color: 'blue-text-gradient',
      },
      {
        name: 'Local Multiplayer',
        color: 'green-text-gradient',
      },
      {
        name: 'Sports / Football',
        color: 'pink-text-gradient',
      },
    ],
    image: ps5_gaming_card,
    sourceCodeLink: 'https://www.ea.com/games/ea-sports-fc',
    gameplayVideoId: 'pB7t_9zP918',
  },
  {
    name: 'WWE 2K25',
    description:
      'Step into the ring with the most realistic wrestling game ever made. Four-player splitscreen brawls hit different on our giant 4K LED displays.',
    tags: [
      {
        name: 'Fighting / Sports',
        color: 'blue-text-gradient',
      },
      {
        name: '4-Player Local',
        color: 'green-text-gradient',
      },
      {
        name: 'PlayStation 5',
        color: 'pink-text-gradient',
      },
    ],
    image:
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=800&auto=format&fit=crop',
    sourceCodeLink: 'https://wwe.2k.com/2k25/',
    gameplayVideoId: 'P-kH9PClHMI',
  },
  {
    name: 'Grand Theft Auto V',
    description:
      'Explore the sprawling world of Los Santos in stunning 4K on PS5. Go heist-crazy with friends in GTA Online or dive into the legendary story mode.',
    tags: [
      {
        name: 'Open World',
        color: 'blue-text-gradient',
      },
      {
        name: 'Action-Adventure',
        color: 'green-text-gradient',
      },
      {
        name: 'PlayStation 5',
        color: 'pink-text-gradient',
      },
    ],
    image:
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=800&auto=format&fit=crop',
    sourceCodeLink: 'https://www.rockstargames.com/gta-v',
    gameplayVideoId: 'QdBZY2fkU-0',
  },
  {
    name: 'Mortal Kombat 1',
    description:
      'Brutal, cinematic, and visually jaw-dropping on 4K. Challenge a friend to intense 1v1 showdowns with the full PS5 roster on our dedicated fighting stations.',
    tags: [
      {
        name: 'Fighting',
        color: 'blue-text-gradient',
      },
      {
        name: '1v1 PvP',
        color: 'green-text-gradient',
      },
      {
        name: 'PlayStation 5',
        color: 'pink-text-gradient',
      },
    ],
    image:
      'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800&auto=format&fit=crop',
    sourceCodeLink: 'https://www.mortalkombat.com/',
    gameplayVideoId: 'K84jO4nE_Qk',
  },
];

export { services, technologies, experiences, testimonials, projects };
