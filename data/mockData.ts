export interface Event {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  city: string;
  date: string;
  time: string;
  imageUrl: string;
  category: "Music" | "Arts" | "Business" | "Sports" | "Food" | "Technology";
  featured: boolean;
  ticketsAvailable: number;
  organizer: string;
}

export const events: Event[] = [
  {
    id: "1",
    title: "Neon Pulse Music Festival",
    description:
      "A three-day outdoor music festival featuring the world's top electronic and indie artists across four stages. Immerse yourself in a vibrant atmosphere with art installations, gourmet food vendors, and unforgettable performances under the stars. This is the event of the year you cannot afford to miss.",
    price: 149,
    location: "Riverside Amphitheatre, Los Angeles",
    city: "Los Angeles",
    date: "2026-06-14",
    time: "4:00 PM",
    imageUrl:
      "https://images.unsplash.com/photo-1501386761578-eaa54b8f8a48?w=1200&q=80",
    category: "Music",
    featured: true,
    ticketsAvailable: 320,
    organizer: "PulseEvents Co.",
  },
  {
    id: "2",
    title: "Future of AI Summit 2026",
    description:
      "Join 2,000+ founders, engineers, and investors for two days of keynotes, workshops, and networking sessions focused on the next wave of artificial intelligence. Hear from the builders shaping tomorrow's technology and discover how to position your business for the AI era.",
    price: 399,
    location: "Moscone Center, San Francisco",
    city: "San Francisco",
    date: "2026-07-22",
    time: "9:00 AM",
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
    category: "Technology",
    featured: true,
    ticketsAvailable: 85,
    organizer: "TechForward Inc.",
  },
  {
    id: "3",
    title: "Brooklyn Abstract Art Fair",
    description:
      "Celebrate contemporary and abstract art from over 60 independent artists and galleries. The fair includes live painting demonstrations, curator-led tours, and a collector's preview evening. An unmissable experience for art lovers and collectors alike in the heart of Brooklyn.",
    price: 25,
    location: "Industry City, Brooklyn",
    city: "New York",
    date: "2026-05-30",
    time: "11:00 AM",
    imageUrl:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&q=80",
    category: "Arts",
    featured: true,
    ticketsAvailable: 500,
    organizer: "Brooklyn Arts Collective",
  },
  {
    id: "4",
    title: "Global Entrepreneurs Forum",
    description:
      "A premier business conference connecting startup founders, VCs, and Fortune 500 executives. Attend roundtables, pitch competitions, and one-on-one mentorship sessions. Walk away with actionable strategies, new partnerships, and the funding connections you need to scale.",
    price: 299,
    location: "McCormick Place, Chicago",
    city: "Chicago",
    date: "2026-08-10",
    time: "8:30 AM",
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",
    category: "Business",
    featured: false,
    ticketsAvailable: 210,
    organizer: "Nexus Business Group",
  },
  {
    id: "5",
    title: "Jazz & Soul Under the Stars",
    description:
      "An intimate evening of live jazz, soul, and R&B performed by Grammy-nominated musicians in an open-air garden setting. Enjoy curated cocktails, gourmet small plates, and a night of music that moves you. Dress code: smart casual. Limited seating — book early.",
    price: 75,
    location: "Rooftop Garden, New Orleans",
    city: "New Orleans",
    date: "2026-06-05",
    time: "7:00 PM",
    imageUrl:
      "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&q=80",
    category: "Music",
    featured: true,
    ticketsAvailable: 60,
    organizer: "SoulSounds Productions",
  },
  {
    id: "6",
    title: "Ultra City Marathon 2026",
    description:
      "Run through the iconic streets of Miami in this certified 26.2-mile marathon. Whether you're a first-timer or a seasoned runner, our pacers, hydration stations, and cheering crowds will carry you to the finish line. T-shirts, medals, and a post-race party included.",
    price: 55,
    location: "Bayfront Park, Miami",
    city: "Miami",
    date: "2026-09-20",
    time: "6:00 AM",
    imageUrl:
      "https://images.unsplash.com/photo-1502904550040-7534597429ae?w=1200&q=80",
    category: "Sports",
    featured: false,
    ticketsAvailable: 1200,
    organizer: "RunCity Athletics",
  },
  {
    id: "7",
    title: "Taste of the World Food Festival",
    description:
      "Sample dishes from over 40 countries prepared by top chefs and street food masters. The festival features cooking competitions, masterclasses, artisan market stalls, and a children's cooking zone. Rain or shine — held under a giant festival pavilion. Bring your appetite!",
    price: 18,
    location: "Golden Gate Park, San Francisco",
    city: "San Francisco",
    date: "2026-07-04",
    time: "12:00 PM",
    imageUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80",
    category: "Food",
    featured: false,
    ticketsAvailable: 750,
    organizer: "WorldFlavors Events",
  },
  {
    id: "8",
    title: "Modern Dance & Movement Showcase",
    description:
      "An electric evening showcasing cutting-edge contemporary dance companies from across North America. Featuring world premieres, audience Q&A sessions with choreographers, and a post-show reception. The perfect blend of athletic artistry and raw emotion on stage.",
    price: 45,
    location: "Lincoln Center, New York",
    city: "New York",
    date: "2026-05-18",
    time: "8:00 PM",
    imageUrl:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?w=1200&q=80",
    category: "Arts",
    featured: false,
    ticketsAvailable: 180,
    organizer: "MotionWorks NYC",
  },
];
