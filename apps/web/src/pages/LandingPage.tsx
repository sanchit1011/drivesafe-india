import { Link } from 'react-router-dom';
import { Shield, Star, MapPin, Clock, Phone, ChevronRight, Car, User, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../features/auth/AuthContext';

const features = [
  { icon: Shield, title: 'Verified Drivers', desc: 'Police-verified, trained professional drivers for your safety.' },
  { icon: Star, title: 'Top Rated', desc: 'Consistently rated 4.8★ by thousands of satisfied customers.' },
  { icon: Clock, title: 'On Time', desc: 'Drivers arrive on time, every time. Punctuality is our promise.' },
  { icon: MapPin, title: 'Live Tracking', desc: 'Track your driver in real-time throughout the journey.' },
];

const steps = [
  { num: '01', title: 'Book a Driver', desc: 'Enter your pickup, drop location and choose a time.' },
  { num: '02', title: 'Driver Arrives', desc: 'A verified driver comes to you and drives your own car.' },
  { num: '03', title: 'Reach Safely', desc: 'Relax while your driver takes you safely to your destination.' },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'DRIVER') return '/driver';
    if (user?.role === 'ADMIN') return '/admin';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="page-container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Car size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">DriveSafe</span>
            <span className="hidden sm:inline text-xs font-medium text-primary bg-primary-50 px-2 py-0.5 rounded-full">India</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">How it works</a>
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Features</a>
            <a href="#safety" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Safety</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to={getDashboardLink()}>
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/login">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 bg-gradient-to-br from-dark-navy via-[#1a3a4c] to-dark-charcoal text-white min-h-[600px] flex items-center">
        <div className="page-container py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm font-medium px-4 py-2 rounded-full mb-6">
                <Shield size={14} className="text-primary" />
                India's Premium Designated Driver Service
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your car.<br />
                <span className="text-primary">Our driver.</span><br />
                You relax.
              </h1>
              <p className="text-white/70 text-lg mb-8 max-w-md">
                DriveSafe India provides professional, verified drivers to drive your own car safely to your destination. No cabs, no leaving your vehicle behind.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button size="lg" className="bg-primary hover:bg-primary-600 shadow-soft">
                    Book a Driver
                    <ChevronRight size={18} />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="secondary" size="lg" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                    How it works
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/10">
                {[['10K+', 'Happy Rides'], ['4.8★', 'Avg Rating'], ['500+', 'Verified Drivers']].map(([val, label]) => (
                  <div key={label}>
                    <p className="text-2xl font-bold text-white">{val}</p>
                    <p className="text-xs text-white/50">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero card mockup */}
            <div className="hidden lg:flex justify-center animate-slide-up">
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-2xl w-80">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                      <Car size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Driver on the way</p>
                      <p className="text-xs text-gray-400">Arriving in 6 min</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl h-32 mb-4 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-blue-50" />
                    <div className="relative text-center">
                      <MapPin size={24} className="text-primary mx-auto mb-1" />
                      <p className="text-xs text-gray-500 font-medium">Live Tracking</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">Arun Kumar</p>
                      <div className="flex items-center gap-1">
                        <Star size={11} fill="#F59E0B" className="text-yellow-400" />
                        <span className="text-xs text-gray-500">4.8 · 128 rides</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Phone size={14} className="text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  Safe Rides ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section bg-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">Simple Process</p>
            <h2 className="text-4xl font-bold text-gray-900">How DriveSafe Works</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">Three easy steps to get a professional driver for your car</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-2/3 w-1/3 h-px bg-primary-100" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
                  <span className="text-xl font-bold text-primary">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section bg-gray-50">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">Why Choose Us</p>
            <h2 className="text-4xl font-bold text-gray-900">Safe Rides, Every Time</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:shadow-card-hover transition-shadow duration-200">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="section bg-white">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-primary font-semibold text-sm mb-3 tracking-wide uppercase">Your Safety First</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-5">Ride with complete peace of mind</h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Every DriveSafe driver undergoes rigorous background checks, police verification, and training. We take your safety seriously so you can truly relax.
              </p>
              <div className="space-y-4">
                {[
                  'Police verified background check',
                  'Driving skills assessment',
                  'Real-time GPS tracking shared with contacts',
                  'SOS emergency feature in app',
                  'Fully insured rides',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-primary flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8 flex items-center justify-center min-h-64">
              <div className="text-center">
                <Shield size={64} className="text-primary mx-auto mb-4 opacity-80" />
                <p className="text-2xl font-bold text-gray-900">100% Verified</p>
                <p className="text-gray-500 text-sm mt-1">Every driver on our platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-primary">
        <div className="page-container text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready for a safe ride?</h2>
          <p className="text-white/80 text-lg mb-8">Book a professional designated driver in minutes.</p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 font-bold px-10">
              Book Now — It's Free to Join
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-navy text-white/60 py-10">
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Car size={13} className="text-white" />
            </div>
            <span className="font-bold text-white">DriveSafe India</span>
          </div>
          <p className="text-sm">© 2024 DriveSafe India. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
