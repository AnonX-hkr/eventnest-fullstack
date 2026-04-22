import Link from "next/link";
import { ArrowLeft, FileText, Info, ShieldCheck, Zap } from "lucide-react";
import { notFound } from "next/navigation";

// ─── Default Content Map ──────────────────────────────────────────────────────
const CONTENT_MAP: Record<string, { title: string; category: string; icon: React.ElementType; content: React.ReactNode }> = {
  "about-us": {
    title: "About Us",
    category: "Company",
    icon: Info,
    content: (
      <>
        <p>EventNest is the modern platform for discovering, creating, and selling tickets to live experiences.</p>
        <p>Founded with the mission to bring people together through unforgettable events, we provide organizers with powerful tools to manage ticketing, while giving attendees a seamless way to find their next favorite experience.</p>
        <p>Our team is passionate about live events, technology, and creating communities.</p>
      </>
    ),
  },
  "careers": {
    title: "Careers",
    category: "Company",
    icon: Zap,
    content: (
      <>
        <p>Join the team that's redefining the event experience!</p>
        <p>We are always looking for passionate engineers, designers, and community builders. Currently, we are working fully remote and offer competitive benefits, flexible hours, and a culture of continuous learning.</p>
        <p>Check back soon for open positions or send your resume to <strong>careers@eventnest.dev</strong>.</p>
      </>
    ),
  },
  "press-media": {
    title: "Press & Media",
    category: "Company",
    icon: FileText,
    content: (
      <>
        <p>Welcome to the EventNest Press Room.</p>
        <p>Here you can find our latest press releases, brand guidelines, and media assets. For all press inquiries, please reach out to our media relations team at <strong>press@eventnest.dev</strong>.</p>
      </>
    ),
  },
  "blog": {
    title: "Blog",
    category: "Company",
    icon: FileText,
    content: (
      <>
        <p>Insights, updates, and stories from the EventNest team.</p>
        <p>Our blog is currently undergoing a revamp. Soon, we'll be sharing organizer tips, attendee guides, and behind-the-scenes looks at the technology powering EventNest. Stay tuned!</p>
      </>
    ),
  },
  "contact-us": {
    title: "Contact Us",
    category: "Company",
    icon: Info,
    content: (
      <>
        <p>We're here to help! Whether you're an organizer with a question about your event, or an attendee needing ticket support, our team is ready.</p>
        <p><strong>Email:</strong> support@eventnest.dev</p>
        <p><strong>Address:</strong> 548 Market St, San Francisco, CA 94104</p>
        <p>Our support hours are Monday-Friday, 9am-6pm PST.</p>
      </>
    ),
  },
  "help-center": {
    title: "Help Center",
    category: "Resources",
    icon: Info,
    content: (
      <>
        <p>Find answers to common questions about using EventNest.</p>
        <ul className="list-disc pl-5 space-y-2 mt-4">
          <li>How to purchase tickets</li>
          <li>How to get a refund</li>
          <li>Setting up your organizer profile</li>
          <li>Understanding ticket fees</li>
        </ul>
        <p className="mt-4">Need more help? <Link href="/info/contact-us" className="text-[#ff5a5f] hover:underline">Contact our support team</Link>.</p>
      </>
    ),
  },
  "for-organizers": {
    title: "For Organizers",
    category: "Resources",
    icon: Zap,
    content: (
      <>
        <p>Everything you need to run a successful event.</p>
        <p>EventNest provides industry-leading low fees (2.5% + $0.30 per ticket), powerful analytics, and seamless ticket scanning. Whether you're hosting a small meetup or a massive festival, our tools scale with you.</p>
        <p className="mt-4">
          <Link href="/create-event" className="px-4 py-2 bg-[#ff5a5f] text-white rounded-lg font-bold hover:bg-[#ff3d42] transition-colors">
            Start Creating Today
          </Link>
        </p>
      </>
    ),
  },
  "partner-program": {
    title: "Partner Program",
    category: "Resources",
    icon: Zap,
    content: (
      <>
        <p>Grow with EventNest through our Partner Program.</p>
        <p>We partner with venues, marketing agencies, and technology providers to offer enhanced services to our organizers. Partners receive revenue sharing, co-marketing opportunities, and dedicated support.</p>
      </>
    ),
  },
  "api-documentation": {
    title: "API Documentation",
    category: "Resources",
    icon: FileText,
    content: (
      <>
        <p>Build custom integrations with the EventNest API.</p>
        <p>Our RESTful API allows you to programmatically manage events, retrieve ticket orders, and sync data with your own CRM or marketing tools.</p>
        <p><em>Documentation portal coming Q3 2026.</em></p>
      </>
    ),
  },
  "status-page": {
    title: "System Status",
    category: "Resources",
    icon: ShieldCheck,
    content: (
      <>
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 font-bold">All Systems Operational</span>
        </div>
        <p>Current status of EventNest services:</p>
        <ul className="space-y-2 mt-4 text-white/70">
          <li className="flex justify-between border-b border-white/5 pb-2"><span>Web Application</span> <span className="text-emerald-400">Operational</span></li>
          <li className="flex justify-between border-b border-white/5 pb-2"><span>API Server</span> <span className="text-emerald-400">Operational</span></li>
          <li className="flex justify-between border-b border-white/5 pb-2"><span>Payment Processing</span> <span className="text-emerald-400">Operational</span></li>
          <li className="flex justify-between pb-2"><span>Ticket Scanning</span> <span className="text-emerald-400">Operational</span></li>
        </ul>
      </>
    ),
  },
  "privacy-policy": {
    title: "Privacy Policy",
    category: "Legal",
    icon: ShieldCheck,
    content: (
      <>
        <p><strong>Last Updated: April 22, 2026</strong></p>
        <p>Your privacy is important to us. This Privacy Policy explains how EventNest collects, uses, and protects your personal information.</p>
        <h3 className="text-lg font-bold text-white mt-6 mb-2">1. Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account, purchase a ticket, or communicate with us.</p>
        <h3 className="text-lg font-bold text-white mt-6 mb-2">2. How We Use Your Information</h3>
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
        <h3 className="text-lg font-bold text-white mt-6 mb-2">3. Information Sharing</h3>
        <p>When you purchase a ticket, we share your basic contact information with the event organizer so they can manage the event.</p>
      </>
    ),
  },
  "terms-of-service": {
    title: "Terms of Service",
    category: "Legal",
    icon: ShieldCheck,
    content: (
      <>
        <p><strong>Last Updated: April 22, 2026</strong></p>
        <p>Please read these Terms of Service carefully before using EventNest.</p>
        <h3 className="text-lg font-bold text-white mt-6 mb-2">1. Acceptance of Terms</h3>
        <p>By accessing or using our platform, you agree to be bound by these Terms.</p>
        <h3 className="text-lg font-bold text-white mt-6 mb-2">2. User Accounts</h3>
        <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account.</p>
        <h3 className="text-lg font-bold text-white mt-6 mb-2">3. Prohibited Conduct</h3>
        <p>You agree not to use EventNest for any illegal or unauthorized purpose, including selling fraudulent tickets or engaging in abusive behavior.</p>
      </>
    ),
  },
  "cookie-settings": {
    title: "Cookie Policy",
    category: "Legal",
    icon: ShieldCheck,
    content: (
      <>
        <p>We use cookies to improve your experience on EventNest.</p>
        <p>Cookies are small text files stored on your device that help us remember your preferences, analyze site traffic, and personalize content.</p>
        <div className="mt-6 p-5 bg-[#112240] rounded-xl border border-white/10">
          <h4 className="text-white font-bold mb-3">Manage Your Preferences</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked disabled className="w-4 h-4 accent-[#ff5a5f]" />
              <span className="text-white/80 text-sm">Essential Cookies (Required)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#ff5a5f]" />
              <span className="text-white/80 text-sm">Analytics & Performance</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#ff5a5f]" />
              <span className="text-white/80 text-sm">Marketing & Personalization</span>
            </label>
          </div>
          <button className="mt-5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-lg transition-colors">
            Save Preferences
          </button>
        </div>
      </>
    ),
  },
  "accessibility": {
    title: "Accessibility Statement",
    category: "Legal",
    icon: Info,
    content: (
      <>
        <p>EventNest is committed to ensuring digital accessibility for people with disabilities.</p>
        <p>We are continually improving the user experience for everyone and applying the relevant accessibility standards, including WCAG 2.1 AA guidelines.</p>
        <p>If you experience any difficulty using our platform, please contact us at <strong>accessibility@eventnest.dev</strong>.</p>
      </>
    ),
  },
  "refund-policy": {
    title: "Refund Policy",
    category: "Legal",
    icon: ShieldCheck,
    content: (
      <>
        <p>EventNest provides a platform for organizers to sell tickets. Our general refund policy is governed by the individual event organizer.</p>
        <h3 className="text-lg font-bold text-white mt-6 mb-2">Organizer Specific Policies</h3>
        <p>When purchasing a ticket, please review the organizer's specific refund policy (e.g., No Refunds, 1-Day, 7-Day, or 30-Day).</p>
        <h3 className="text-lg font-bold text-white mt-6 mb-2">Event Cancellations</h3>
        <p>If an event is cancelled by the organizer, you will receive a full refund, including service fees, automatically processed to your original payment method within 5-7 business days.</p>
      </>
    ),
  },
};

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageData = CONTENT_MAP[slug];

  if (!pageData) {
    notFound();
  }

  const { title, category, icon: Icon, content } = pageData;

  return (
    <div className="min-h-screen bg-[#0a1628] py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-semibold tracking-wider uppercase mb-4">
            {category}
          </span>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#ff5a5f]/15 flex items-center justify-center flex-shrink-0 border border-[#ff5a5f]/20">
              <Icon className="w-6 h-6 text-[#ff5a5f]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              {title}
            </h1>
          </div>
        </div>

        <div className="prose prose-invert prose-lg max-w-none text-white/70">
          {content}
        </div>
        
      </div>
    </div>
  );
}
