import Link from "next/link";
import Image from "next/image";
import { Car, Calendar, DollarSign, FileText, CheckCircle, Bell } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1D1D1C]">
      {/* Header */}
      <header className="border-b border-[#3A3A3A]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-0">
            <span className="text-2xl font-semibold text-white">AutoCare</span>
            <span className="text-2xl font-semibold text-[#D32F2F]">+</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2 text-white transition-all hover:shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-[#D32F2F] text-white rounded-lg transition-all hover:shadow-[0_0_20px_rgba(211,47,47,0.6)] hover:text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          Track Your Vehicle Maintenance with Ease
        </h1>
        <p className="text-xl text-[#B0B0B0] mb-8 max-w-2xl mx-auto">
          Keep your vehicles in top shape with AutoCare+. Track maintenance, set reminders, 
          and manage expenses all in one place.
        </p>
        <Link
          href="/register"
          className="inline-block px-8 py-4 bg-[#D32F2F] text-white text-lg font-semibold rounded-lg transition-all shadow-lg shadow-[#D32F2F]/20 hover:shadow-[0_0_30px_rgba(211,47,47,0.8)] hover:text-white"
        >
          Start Tracking Now
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything You Need to Maintain Your Vehicles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Car,
              title: 'Vehicle Management',
              description: 'Add and manage multiple vehicles with detailed records and documentation.'
            },
            {
              icon: FileText,
              title: 'Service Logging',
              description: 'Keep track of all maintenance and repairs with detailed logs and receipts.'
            },
            {
              icon: Bell,
              title: 'Smart Reminders',
              description: 'Never miss a service with automated reminders for upcoming maintenance.'
            },
            {
              icon: DollarSign,
              title: 'Expense Tracking',
              description: 'Monitor maintenance costs and get insights into your vehicle expenses.'
            },
            {
              icon: CheckCircle,
              title: 'Service History',
              description: 'Complete history of all maintenance and repairs for each vehicle.'
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-[#262626] border border-[#3A3A3A] rounded-xl p-6 hover:border-[#D32F2F]/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-[#D32F2F]/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[#D32F2F]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-[#B0B0B0]">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#262626] border-y border-[#3A3A3A]">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-[#B0B0B0] mb-8">
            Join thousands of vehicle owners who trust AutoCare+ for their maintenance tracking.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-[#D32F2F] text-white text-lg font-semibold rounded-lg transition-all shadow-lg shadow-[#D32F2F]/20 hover:shadow-[0_0_30px_rgba(211,47,47,0.8)] hover:text-white"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 text-center text-[#B0B0B0]">
        <p>© 2026 AutoCare+. All rights reserved.</p>
      </footer>
    </div>
  );
}
