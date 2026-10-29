import Link from "next/link";
import { Car, DollarSign, FileText, CheckCircle, Bell } from "lucide-react";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <AnimatedBackground />

      <div className="relative z-10">
      {/* Header */}
      <header className="border-b border-line">
        {/* Mobile adjustment: responsive container spacing for header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-0">
            <span className="text-2xl font-semibold text-ink">AutoCare</span>
            <span className="text-2xl font-semibold text-accent">+</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink mb-6">
          Track Your Vehicle Maintenance with Ease
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-muted mb-8 max-w-2xl mx-auto">
          Keep your vehicles in top shape with AutoCare+. Track maintenance, set reminders, 
          and manage expenses all in one place.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 bg-accent text-onAccent text-lg font-semibold rounded-lg transition-all shadow-lg shadow-accent/20 hover:bg-accentHover hover:text-onAccent"
        >
          Start Tracking Now
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink text-center mb-10 sm:mb-12">
          Everything You Need to Maintain Your Vehicles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Car,
              title: "Vehicle Management",
              description: "Add and manage multiple vehicles with detailed records and documentation.",
            },
            {
              icon: FileText,
              title: "Service Logging",
              description: "Keep track of all maintenance and repairs with detailed logs and receipts.",
            },
            {
              icon: Bell,
              title: "Smart Reminders",
              description: "Never miss a service with automated reminders for upcoming maintenance.",
            },
            {
              icon: DollarSign,
              title: "Expense Tracking",
              description: "Monitor maintenance costs and get insights into your vehicle expenses.",
            },
            {
              icon: CheckCircle,
              title: "Service History",
              description: "Complete history of all maintenance and repairs for each vehicle.",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-surface border border-line rounded-xl p-6 hover:border-accent/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-ink mb-2">{feature.title}</h3>
              <p className="text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center text-muted">
        <p>© 2026 AutoCare+. All rights reserved.</p>
      </footer>
      </div>
    </div>
  );
}
