type TSection = {
  p: string;
  h2: string;
  content?: string;
};

type TConfig = {
  html: {
    title: string;
    fullName: string;
    email: string;
  };
  hero: {
    name: string;
    p: string[];
  };
  contact: {
    link: string;
    instagramLink: string;
    description: string;
  } & TSection;
  sections: {
    about: Required<TSection>;
    experience: TSection;
    feedbacks: TSection;
    works: Required<TSection>;
  };
};

export const config: TConfig = {
  html: {
    title: 'Vortex Gaming Cafe | Ahmedabad',
    fullName: 'Vortex Gaming Cafe',
    email: 'play@vortexgaming.in',
  },
  hero: {
    name: 'VORTEX',
    p: [
      "Ahmedabad's Premier PS5 Gaming Club & Cafe.",
      'No PS5 at home? No problem. The dream is here.',
    ],
  },
  contact: {
    p: 'Connect & Squad Up',
    h2: 'WhatsApp Community.',
    description:
      'Join the Ahmedabad console gaming circle. Find co-op partners, match up for tournaments, get first dibs on slot bookings, and stay updated on the latest PS5 arrivals at Vortex Lounge.',
    link: 'https://chat.whatsapp.com/E9RI7UrIL1w4qgcHI4XHyT',
    instagramLink: 'https://www.instagram.com/vortexgaming0608/',
  },
  sections: {
    about: {
      p: 'The Ultimate Gaming Sanctuary',
      h2: 'Experience Center.',
      content: `Welcome to Vortex Gaming Cafe, Ahmedabad's dedicated PS5 gaming cafe. Every station is built around the PlayStation 5, paired with a premium 120Hz 4K LED display for the smoothest, sharpest gaming experience the city has to offer. No distractions, no compromises, just pure next-gen console gaming in a sleek, air-conditioned cafe. Whether you're dropping into a FIFA match, grinding ranked in Call of Duty, or exploring an open world, Vortex is your arena.`,
    },
    experience: {
      p: 'Our Features & Lounge Milestones',
      h2: 'Lounge Setup Roadmap.',
    },
    feedbacks: {
      p: 'Hype from the Local Arena',
      h2: 'Gamer Feedbacks.',
    },
    works: {
      p: 'Ready to Play Game Library',
      h2: 'Available Games.',
      content: `Browse our curated library of top-tier multiplayer esports games, co-op adventures, open-world sandboxes, and adrenaline-pumping racing simulators, all preloaded and optimized for peak competitive performance.`,
    },
  },
};
