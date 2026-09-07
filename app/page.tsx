import Link from 'next/link';
import {
  Map, Calculator, Sprout, Scale, BarChart2, Wifi
} from 'lucide-react';

const MODULES = [
  {
    href: '/dashboard',
    icon: Map,
    title: 'Water Stress Dashboard',
    desc: 'District-level interactive map showing groundwater stress index across India with live IoT sensor overlay.',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    iconBg: 'bg-blue-100',
  },
  {
    href: '/calculator',
    icon: Calculator,
    title: 'Water Footprint Calculator',
    desc: 'Calculate your daily virtual water consumption based on diet, lifestyle, and agricultural activities.',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    iconBg: 'bg-cyan-100',
  },
  {
    href: '/irrigation',
    icon: Sprout,
    title: 'Irrigation Advisor',
    desc: 'Get optimised irrigation method recommendations for your crop, soil type and land size — with water and cost savings.',
    color: 'bg-green-50 border-green-200 text-green-700',
    iconBg: 'bg-green-100',
  },
  {
    href: '/legal',
    icon: Scale,
    title: 'Legal Compliance Checker',
    desc: 'Check state-wise water laws, borewell permits, and rainwater harvesting mandates for your property.',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    iconBg: 'bg-purple-100',
  },
  {
    href: '/simulator',
    icon: BarChart2,
    title: 'Policy Economics Simulator',
    desc: 'Explore the impact of water tariffs, subsidies and allocations on demand, equity and utility revenue.',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    iconBg: 'bg-orange-100',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-aqua-900 via-aqua-800 to-aqua-600 text-white py-24 px-4">
        <div className="container mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-aqua-200 text-sm font-medium bg-aqua-800/50 px-3 py-1 rounded-full border border-aqua-700">
            <Wifi className="h-3.5 w-3.5" />
            IoT-powered · Real-time · Open Data
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            AquaIQ — Integrated Water<br />Resource Intelligence
          </h1>
          <p className="text-aqua-100 text-lg max-w-xl mx-auto">
            Combining real-time ESP32 sensor data with national open datasets to give you a unified
            view of water stress, usage, irrigation, compliance and policy economics.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="bg-white text-aqua-800 font-semibold px-6 py-3 rounded-lg hover:bg-aqua-50 transition-colors"
            >
              Open Dashboard
            </Link>
            <Link
              href="/calculator"
              className="border border-aqua-400 text-white px-6 py-3 rounded-lg hover:bg-aqua-700 transition-colors"
            >
              Calculate My Footprint
            </Link>
          </div>
        </div>

        {/* Decorative wave */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="hsl(var(--background))" />
        </svg>
      </section>

      {/* Module cards */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">Five Intelligence Modules</h2>
        <p className="text-muted-foreground text-center text-sm mb-10">
          Each module works standalone — or together with live ESP32 sensor data.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`group rounded-xl border p-5 hover:shadow-md transition-all ${m.color}`}
            >
              <div className={`inline-flex p-2 rounded-lg mb-3 ${m.iconBg}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base mb-1 group-hover:underline">{m.title}</h3>
              <p className="text-sm opacity-80 leading-relaxed">{m.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Data sources strip */}
      <section className="bg-muted/40 border-t py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-4">
            Powered by open datasets
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            {['CGWB', 'WRI Aqueduct', 'FAO AQUASTAT', 'IMD', 'IWMI', 'data.gov.in', 'India Code'].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
