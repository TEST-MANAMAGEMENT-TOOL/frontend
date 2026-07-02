import React, { useState, useEffect } from "react";
import { Menu, Search, ArrowRight, CheckCircle, Users, BarChart3, Palette, Code, Monitor, X, Star, Zap, Shield, Target, Sparkles, TrendingUp, Globe, Rocket, Brain, Eye } from "lucide-react";
import GeminiChatbot from "../components/GeminiChatbot"; // Import the GeminiChatbot component

const navItems = [
  { 
    name: "Products", 
    href: "#features",
    dropdown: [
      { name: "Smart Test Management", href: "#features" },
      { name: "Advanced Bug Tracking", href: "#features" },
      { name: "Predictive Analytics", href: "#features" }
    ]
  },
  { 
    name: "Solutions", 
    href: "#features",
    dropdown: [
      { name: "Accelerate Release Cycles", href: "#benefits" },
      { name: "Enhance Team Collaboration", href: "#benefits" },
      { name: "Scale Without Limits", href: "#benefits" }
    ]
  },
  {
    name: "Why Us",
    href: "#benefits",
    megaDropdown: [
      { title: "Accelerate Release Velocity", desc: "Slash testing cycles by up to 60% with intelligent automation", href: "#benefits" },
      { title: "Enhance Team Collaboration", desc: "Break down silos with unified dashboards and real-time sync", href: "#benefits" },
      { title: "Scale Without Limits", desc: "Enterprise-grade infrastructure that grows with you", href: "#benefits" },
      { title: "Powerful Testing Solutions", desc: "Comprehensive suite of intelligent testing tools", href: "#features" },
      { title: "Customer Success Stories", desc: "Join thousands of teams that trust our platform", href: "#benefits" },
      { title: "Professional Support", desc: "Expert consultation and 24/7 assistance", href: "#contact" },
    ]
  },
  { 
    name: "Platform", 
    href: "#features",
    dropdown: [
      { name: "Testing Dashboard", href: "#features" },
      { name: "Quality Metrics", href: "#features" },
      { name: "Team Analytics", href: "#benefits" }
    ]
  },
  { 
    name: "Contact", 
    href: "#contact",
    dropdown: [
      { name: "Get in Touch", href: "#contact" },
      { name: "Schedule Demo", href: "#contact" },
      { name: "Enterprise Sales", href: "#contact" }
    ]
  },
];

const categories = [
  { name: "Software", icon: Code, color: "bg-gradient-to-br from-purple-500 to-pink-500", iconColor: "text-white", delay: "0ms" },
  { name: "Product management", icon: CheckCircle, color: "bg-gradient-to-br from-yellow-400 to-orange-500", iconColor: "text-white", delay: "100ms" },
  { name: "Marketing", icon: BarChart3, color: "bg-gradient-to-br from-blue-500 to-cyan-400", iconColor: "text-white", delay: "200ms" },
  { name: "Project management", icon: Monitor, color: "bg-gradient-to-br from-green-500 to-emerald-400", iconColor: "text-white", delay: "300ms" },
  { name: "Design", icon: Palette, color: "bg-gradient-to-br from-pink-500 to-rose-400", iconColor: "text-white", delay: "400ms" },
  { name: "IT", icon: Users, color: "bg-gradient-to-br from-indigo-500 to-purple-500", iconColor: "text-white", delay: "500ms" },
];

export default function LandingPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  
  const user = { name: "User Demo" };
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : "";

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close drawer on outside click
  React.useEffect(() => {
    if (!drawerOpen) return;
    const handleClick = (e) => {
      if (e.target.closest('.drawer') || e.target.closest('.hamburger')) return;
      setDrawerOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [drawerOpen]);

  const toggleDropdown = (itemName) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName);
  };

  const navigateToAuth = (page) => {
    if (page === 'login') {
      window.location.href = '/login';
    } else if (page === 'signup') {
      window.location.href = '/signup';
    }
  };

  const scrollToSection = (href) => {
    if (href && href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }
    setDrawerOpen(false);
    setActiveDropdown(null);
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const message = form.message.value;
    const whatsappMsg = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nMessage: ${message}`);
    window.open(`https://wa.me/254748163492?text=${whatsappMsg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-x-hidden relative">
      {/* Dynamic background with moving gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl transform transition-transform duration-1000 ease-out"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
        <div 
          className="absolute w-64 h-64 bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 rounded-full blur-2xl"
          style={{
            right: mousePosition.x / 10,
            bottom: mousePosition.y / 10,
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full blur-xl animate-pulse" />
      </div>

      {/* Glassmorphism Navigation */}
      <nav className="w-full bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center px-4 py-3 z-50 sticky top-0">
        {searchOpen ? (
          <div className="fixed top-0 left-0 w-full h-20 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center transition-all duration-500 border-b border-white/10">
            <div className="w-full max-w-2xl flex items-center px-6">
              <input
                type="text"
                placeholder="Search the future of testing..."
                className="w-full h-12 px-5 text-lg rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-xl"
                autoFocus
              />
              <button className="ml-4 text-white/60 hover:text-white p-2 transition-colors duration-300" onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Navigation */}
            <div className="flex items-center justify-between w-full lg:hidden">
              <div className="flex items-center gap-3">
                <button 
                  className="hamburger p-2 rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm" 
                  onClick={() => setDrawerOpen(true)} 
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">KiwamiTestCloud</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSearchOpen(true)} 
                  className="p-2 rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-white/80" />
                </button>
                <div className="w-9 h-9 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-semibold text-sm shadow-lg">
                  {initials || "U"}
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-between w-full max-w-7xl mx-auto">
              {/* Logo Section */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://i.postimg.cc/59gWSxjX/image.png" 
                    alt="KiwamiTestCloud Logo" 
                    className="w-12 h-12 rounded-2xl shadow-xl object-cover"
                  />
    <div className="flex flex-col">
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        KiwamiTestCloud
      </span>
      <span className="text-xs text-white/60 font-medium tracking-wide">
        NEXT-GEN QA PLATFORM
      </span>
    </div>
  </div>
</div>
              
              {/* Navigation Menu */}
              <div className="flex items-center gap-1">
                {navItems.map(item => (
                  <div key={item.name} className="relative group">
                    <button 
                      className="text-white/80 font-medium px-4 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 text-sm backdrop-blur-sm"
                      onClick={() => item.href ? scrollToSection(item.href) : null}
                    >
                      {item.name}
                    </button>
                    {item.megaDropdown ? (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl mt-2 p-6 min-w-[700px] hidden group-hover:flex flex-wrap gap-6 z-30">
                        {item.megaDropdown.map((opt, idx) => (
                          <div 
                            key={opt.title} 
                            className="w-1/3 p-4 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                            onClick={() => scrollToSection(opt.href)}
                          >
                            <div className="font-semibold text-white mb-2 flex items-center gap-2">
                              {opt.title}
                              {idx === 0 && (
                                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold px-2 py-1 rounded-full">HOT</span>
                              )}
                            </div>
                            <div className="text-sm text-white/70 leading-relaxed">{opt.desc}</div>
                          </div>
                        ))}
                      </div>
                    ) : item.dropdown ? (
                      <div className="absolute left-0 top-full bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl mt-2 min-w-[180px] hidden group-hover:block z-20 py-2">
                        {item.dropdown.map(opt => (
                          <div 
                            key={opt.name} 
                            className="px-4 py-3 hover:bg-white/10 cursor-pointer text-white/80 hover:text-white transition-all duration-300 text-sm"
                            onClick={() => scrollToSection(opt.href)}
                          >
                            {opt.name}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              
              {/* Right Section */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSearchOpen(true)} 
                  className="p-2 rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-white/80" />
                </button>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => navigateToAuth('login')}
                    className="px-4 py-2 text-white/80 font-medium hover:text-white transition-all duration-300 text-sm"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => navigateToAuth('signup')}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    Get Started
                  </button>
                </div>
                
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-semibold text-sm shadow-xl">
                  {initials || ""}
                </div>
              </div>
            </div>

            {/* Enhanced Mobile Drawer */}
            <div
              className={`drawer fixed top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-2xl shadow-2xl z-50 transform transition-transform duration-500 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-white/20`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">KiwamiTestCloud</span>
                      <span className="text-xs text-white/60 font-medium">NEXT-GEN QA</span>
                    </div>
                  </div>
                  <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-white/10 transition-all duration-300">
                    <X className="w-5 h-5 text-white/80" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-2">
                    {navItems.map(item => (
                      <div key={item.name}>
                        <button
                          className="w-full text-left text-white/80 font-medium px-4 py-3 hover:bg-white/10 rounded-xl flex items-center justify-between transition-all duration-300 backdrop-blur-sm"
                          onClick={() => item.href ? scrollToSection(item.href) : toggleDropdown(item.name)}
                        >
                          <span className="text-sm">{item.name}</span>
                          {(item.dropdown || item.megaDropdown) && (
                            <div className={`w-5 h-5 flex items-center justify-center text-white/60 transform transition-transform duration-300 ${activeDropdown === item.name ? 'rotate-180' : ''}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          )}
                        </button>
                        {activeDropdown === item.name && (
                          <div className="pl-4 mt-2 space-y-1 border-l-2 border-white/20">
                            {item.dropdown?.map(opt => (
                              <button 
                                key={opt.name} 
                                onClick={() => scrollToSection(opt.href)}
                                className="block w-full text-left text-white/70 hover:text-white py-2 px-3 text-sm rounded-lg transition-all duration-300 hover:bg-white/10"
                              >
                                {opt.name}
                              </button>
                            ))}
                            {item.megaDropdown?.map(opt => (
                              <button 
                                key={opt.title} 
                                onClick={() => scrollToSection(opt.href)}
                                className="block w-full text-left text-white/70 hover:text-white py-2 px-3 text-sm rounded-lg transition-all duration-300 hover:bg-white/10"
                              >
                                {opt.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-6 border-t border-white/20 bg-white/5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-semibold text-sm shadow-lg">
                      {initials || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">Welcome back!</div>
                      <div className="text-xs text-white/60">Premium Account</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigateToAuth('login')}
                      className="flex-1 px-3 py-2 text-white/80 font-medium hover:text-white transition-all duration-300 text-sm"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => navigateToAuth('signup')}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm shadow-lg"
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {drawerOpen && (
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-500 ease-out lg:hidden"
                onClick={() => setDrawerOpen(false)}
              />
            )}
          </>
        )}
      </nav>

      {/* Revolutionary Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Animated title with floating elements */}
          <div className="relative mb-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 leading-tight relative">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                KiwamiTestCloud:
              </span>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent opacity-20 blur-sm animate-pulse delay-500">
                KiwamiTestCloud:
              </div>
            </h1>
            
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight relative">
              from <span className="relative inline-block">
                <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">bugs</span>
                <svg className="absolute -bottom-4 left-0 w-full h-6" viewBox="0 0 300 24" fill="none">
                  <path 
                    d="M5 18C100 8, 200 8, 295 18" 
                    stroke="url(#gradient)" 
                    strokeWidth="6" 
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FCD34D" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                </svg>
              </span> to <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">dreams</span>
              
              {/* Floating particles */}
              <div className="absolute -top-10 -right-10 w-4 h-4 bg-blue-400 rounded-full animate-bounce delay-300"></div>
              <div className="absolute top-5 -left-8 w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-700"></div>
              <div className="absolute -bottom-5 right-20 w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-1000"></div>
            </h2>
          </div>

          {/* Futuristic CTA Button */}
          <div className="mb-16">
            <button 
              onClick={() => navigateToAuth('login')}
              className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white font-bold px-12 py-6 rounded-full text-xl transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-cyan-500/25 flex items-center gap-3 mx-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              <div className="relative z-10 flex items-center gap-3">
                <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                Launch Your Future
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </button>
          </div>

          {/* Enhanced Category Icons with 3D effect */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-5xl mx-auto">
            {categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <div 
                  key={category.name} 
                  className="flex flex-col items-center group cursor-pointer transform transition-all duration-500 hover:scale-125 hover:-translate-y-4"
                  style={{
                    animationDelay: category.delay,
                    animation: 'fadeInUp 0.8s ease-out forwards'
                  }}
                >
                  <div className={`w-20 h-20 ${category.color} rounded-3xl flex items-center justify-center mb-4 group-hover:shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-500 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <IconComponent className={`w-10 h-10 ${category.iconColor} relative z-10 group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                  <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors duration-300">
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Enhanced Login Link */}
          <div className="mt-16">
            <p className="text-white/70 text-lg">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigateToAuth('login')}
                className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text hover:from-blue-300 hover:to-cyan-300 font-semibold hover:underline transition-all duration-300"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Next-Gen Features Section */}
      <section id="features" className="py-32 px-6 relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, #3B82F6 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8">
              <Brain className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-semibold">AI-POWERED SOLUTIONS</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Powerful Testing
              </span>
              <br />
              <span className="text-white">Solutions</span>
            </h2>
            <p className="text-xl text-white/70 max-w-4xl mx-auto leading-relaxed">
              Transform your development workflow with our revolutionary suite of intelligent testing tools designed for teams who refuse to compromise on excellence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 mb-20">
            {/* Enhanced Test Management Card */}
            <div className="group relative bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-xl p-10 rounded-3xl border border-white/20 hover:border-blue-400/50 transition-all duration-700 transform hover:-translate-y-6 hover:rotate-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
              <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl group-hover:blur-xl transition-all duration-700"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-6 group-hover:text-blue-300 transition-colors duration-500">
                  Smart Test Management
                </h3>
                <p className="text-white/70 leading-relaxed mb-8 text-lg">
                  Orchestrate your entire testing lifecycle with AI-powered organization, intelligent test case generation, and automated execution flows that adapt to your workflow.
                </p>
                <div className="flex items-center justify-center text-blue-400 font-bold group-hover:text-blue-300 transition-colors duration-500">
                  <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                  AI-Powered Intelligence
                </div>
              </div>
            </div>
            
            {/* Enhanced Bug Tracking Card */}
            <div className="group relative bg-gradient-to-br from-emerald-900/50 to-green-900/50 backdrop-blur-xl p-10 rounded-3xl border border-white/20 hover:border-emerald-400/50 transition-all duration-700 transform hover:-translate-y-6 hover:-rotate-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-600/10 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
              <div className="absolute bottom-4 left-4 w-28 h-28 bg-gradient-to-tr from-emerald-400/20 to-green-400/20 rounded-full blur-2xl group-hover:blur-xl transition-all duration-700"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl group-hover:shadow-emerald-500/50 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12">
                  <Shield className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-6 group-hover:text-emerald-300 transition-colors duration-500">
                  Advanced Bug Tracking
                </h3>
                <p className="text-white/70 leading-relaxed mb-8 text-lg">
                  Experience next-generation issue management with automated severity classification, intelligent routing, and predictive resolution timelines powered by machine learning.
                </p>
                <div className="flex items-center justify-center text-emerald-400 font-bold group-hover:text-emerald-300 transition-colors duration-500">
                  <Zap className="w-5 h-5 mr-2 animate-bounce" />
                  Lightning Fast Detection
                </div>
              </div>
            </div>
            
            {/* Enhanced Analytics Card */}
            <div className="group relative bg-gradient-to-br from-purple-900/50 to-violet-900/50 backdrop-blur-xl p-10 rounded-3xl border border-white/20 hover:border-purple-400/50 transition-all duration-700 transform hover:-translate-y-6 hover:rotate-1 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-violet-600/10 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
              <div className="absolute top-4 left-4 w-36 h-36 bg-gradient-to-bl from-purple-400/20 to-violet-400/20 rounded-full blur-2xl group-hover:blur-xl transition-all duration-700"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl group-hover:shadow-purple-500/50 transition-all duration-700 group-hover:scale-110">
                  <TrendingUp className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-6 group-hover:text-purple-300 transition-colors duration-500">
                  Predictive Analytics
                </h3>
                <p className="text-white/70 leading-relaxed mb-8 text-lg">
                  Unlock actionable insights with real-time dashboards, predictive quality metrics, and comprehensive reporting that transforms data into strategic advantage.
                </p>
                <div className="flex items-center justify-center text-purple-400 font-bold group-hover:text-purple-300 transition-colors duration-500">
                  <Target className="w-5 h-5 mr-2 animate-spin" />
                  Data-Driven Insights
                </div>
              </div>
            </div>
          </div>

          {/* Revolutionary Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "10K+", label: "Active Teams", color: "from-blue-400 to-cyan-400", icon: Users },
              { number: "50M+", label: "Tests Executed", color: "from-emerald-400 to-green-400", icon: Zap },
              { number: "99.9%", label: "Uptime SLA", color: "from-purple-400 to-violet-400", icon: Shield },
              { number: "40%", label: "Faster Releases", color: "from-orange-400 to-red-400", icon: Rocket }
            ].map((stat, idx) => (
              <div key={idx} className="group bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105 transform">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className={`text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300`}>
                  {stat.number}
                </div>
                <div className="text-white/70 font-semibold group-hover:text-white transition-colors duration-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revolutionary Benefits Section */}
      <section id="benefits" className="py-32 px-6 relative overflow-hidden">
        {/* Animated mesh background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mesh" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 90 0 L 100 10 L 100 90 L 90 100 L 10 100 L 0 90 L 0 10 Z" 
                      fill="none" stroke="url(#gradient-mesh)" strokeWidth="0.5"/>
              </pattern>
              <linearGradient id="gradient-mesh">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#mesh)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8">
              <Star className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold">REVOLUTIONARY PLATFORM</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
              <span className="text-white">Why Teams Choose</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                KiwamiTestCloud
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-4xl mx-auto leading-relaxed">
              Join thousands of forward-thinking teams that have revolutionized their testing processes and achieved unprecedented quality outcomes in the modern development landscape.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Enhanced Benefits List */}
            <div className="space-y-10">
              {[
                {
                  number: "01",
                  title: "Accelerate Release Velocity",
                  description: "Slash testing cycles by up to 60% with intelligent automation, parallel execution, and streamlined workflows that scale with your most ambitious projects.",
                  color: "from-blue-500 to-cyan-500",
                  icon: Rocket,
                  bgGlow: "group-hover:shadow-blue-500/25"
                },
                {
                  number: "02", 
                  title: "Enhance Team Collaboration",
                  description: "Break down organizational silos with unified dashboards, real-time notifications, and seamless integrations that keep QA, Dev, and Product teams perfectly synchronized.",
                  color: "from-emerald-500 to-teal-500",
                  icon: Users,
                  bgGlow: "group-hover:shadow-emerald-500/25"
                },
                {
                  number: "03",
                  title: "Scale Without Limits",
                  description: "Built on enterprise-grade infrastructure that grows with you — from startup MVPs to enterprise-scale applications handling millions of concurrent users.",
                  color: "from-purple-500 to-violet-500",
                  icon: Globe,
                  bgGlow: "group-hover:shadow-purple-500/25"
                }
              ].map((benefit, idx) => (
                <div key={idx} className={`group flex items-start gap-6 p-8 rounded-3xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-700 cursor-pointer transform hover:-translate-y-2 ${benefit.bgGlow} hover:shadow-2xl`}>
                  <div className="relative">
                    <div className={`w-20 h-20 bg-gradient-to-r ${benefit.color} rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-2xl group-hover:shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <span className="relative z-10">{benefit.number}</span>
                    </div>
                    <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r ${benefit.color} rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-500 delay-200`}>
                      <benefit.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-black text-white mb-4 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500">
                      {benefit.title}
                    </h3>
                    <p className="text-white/70 leading-relaxed text-lg group-hover:text-white/90 transition-colors duration-500">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Revolutionary Testimonial Card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-12 rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 rounded-full blur-2xl animate-pulse delay-1000"></div>
                
                <div className="relative z-10">
                  <img 
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                    alt="Team collaboration" 
                    className="w-full h-80 object-cover rounded-3xl mb-10 shadow-2xl hover:shadow-blue-500/25 transition-all duration-700 transform hover:scale-105"
                  />
                  
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl p-10 rounded-3xl border border-white/30 relative">
                    {/* Floating quote icon */}
                    <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                      <Star className="w-6 h-6 text-white fill-current animate-spin" />
                    </div>
                    
                    <p className="text-white font-medium text-xl italic mb-8 leading-relaxed">
                      "KiwamiTestCloud has completely transformed our quality assurance process. We've reduced critical bugs in production by 78% and accelerated our release cycles by 45%. It's not just a tool—it's our competitive advantage in the market."
                    </p>
                    
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-xl">
                        SJ
                      </div>
                      <div>
                        <p className="font-black text-white text-xl">Sarah Johnson</p>
                        <p className="text-white/70 font-semibold">Senior QA Lead, TechCorp Solutions</p>
                      </div>
                    </div>
                    
                    {/* Enhanced rating stars */}
                    <div className="flex items-center gap-2 mt-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 100}ms`}} />
                      ))}
                      <span className="ml-3 text-white/80 font-bold text-lg">5.0 Excellence Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ultimate CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Dynamic background with animated waves */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20"></div>
          <svg className="absolute bottom-0 left-0 w-full h-64" viewBox="0 0 1200 320" preserveAspectRatio="none">
            <path fill="url(#wave-gradient)" fillOpacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,117.3C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
              <animateTransform attributeName="transform" type="translate" values="0 0;50 0;0 0" dur="10s" repeatCount="indefinite"/>
            </path>
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm border border-yellow-400/30 rounded-full px-6 py-2 mb-8">
              <Eye className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="text-yellow-400 font-semibold">THE FUTURE IS HERE</span>
            </div>
          </div>
          
          <h2 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
            <span className="text-white">Ready to Transform Your</span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              Testing Universe?
            </span>
          </h2>
          <p className="text-2xl text-white/80 mb-16 max-w-4xl mx-auto leading-relaxed font-medium">
            Join the revolution of intelligent testing. Experience the future of quality assurance with our cutting-edge platform trusted by industry leaders worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-16">
            <button 
              onClick={() => navigateToAuth('signup')}
              className="group relative bg-white text-black font-black px-16 py-6 rounded-full text-xl transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-white/25 flex items-center justify-center gap-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex items-center gap-4 group-hover:text-white transition-colors duration-500">
                <Sparkles className="w-7 h-7 group-hover:animate-spin" />
                Start Free Trial
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </button>
            <button 
              onClick={() => scrollToSection('#contact')}
              className="group bg-transparent border-4 border-white text-white font-black px-16 py-6 rounded-full text-xl transition-all duration-500 transform hover:scale-110 hover:bg-white hover:text-black flex items-center justify-center gap-4 shadow-xl hover:shadow-2xl"
            >
              <Monitor className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
              Schedule Demo
            </button>
          </div>
          
          {/* Enhanced Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Shield, text: "SOC 2 Type II Compliant", subtext: "Enterprise Security" },
              { icon: Zap, text: "99.99% Uptime SLA", subtext: "Always Available" },
              { icon: Users, text: "10K+ Happy Teams", subtext: "Worldwide Trust" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-4 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">{item.text}</div>
                  <div className="text-white/60 text-sm">{item.subtext}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ultra-Modern Contact Section */}
      <section className="py-32 px-4 sm:px-6 relative overflow-hidden" id="contact">
        {/* Holographic background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-cyan-900/30"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8">
              <Globe className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-emerald-400 font-semibold">GLOBAL REACH</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-8">
              <span className="text-white">Let's Start a</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Conversation
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Ready to revolutionize your testing process? Our global team of experts is here to help you get started on your transformation journey.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 md:p-16 border border-white/20 relative overflow-hidden">
            {/* Floating elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <h3 className="text-4xl font-black text-white mb-8 bg-gradient-to-r from-white to-white/80 bg-clip-text">Get in Touch</h3>
                <p className="text-white/70 mb-10 text-xl leading-relaxed">
                  Have questions about our platform? Want to see how we can help your team? Fill out the form and we'll connect with you via WhatsApp for a personalized consultation.
                </p>
                
                <div className="space-y-8 mb-12">
                  {[
                    { icon: Globe, title: "Global Headquarters", desc: "Nairobi, Kenya", color: "from-blue-500 to-cyan-500" },
                    { icon: Monitor, title: "Digital Support", desc: "info@kiwamitestcloud.com", color: "from-emerald-500 to-green-500", href: "mailto:info@kiwamitestcloud.com" },
                    { icon: Users, title: "Direct Contact", desc: "0748 163 492", color: "from-purple-500 to-violet-500", href: "tel:+254748163492" }
                  ].map((contact, idx) => (
                    <div key={idx} className="flex items-center gap-6 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105">
                      <div className={`w-16 h-16 bg-gradient-to-r ${contact.color} rounded-2xl flex items-center justify-center shadow-xl`}>
                        <contact.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-white text-lg">{contact.title}</p>
                        {contact.href ? (
                          <a href={contact.href} className="text-white/80 hover:text-white font-semibold hover:underline transition-colors duration-300 text-lg">
                            {contact.desc}
                          </a>
                        ) : (
                          <p className="text-white/80 font-semibold text-lg">{contact.desc}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <form className="space-y-8" onSubmit={handleWhatsAppSubmit}>
                  <div>
                    <input 
                      name="name" 
                      type="text" 
                      placeholder="Your Full Name" 
                      required 
                      className="w-full border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 text-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <input 
                      name="email" 
                      type="email" 
                      placeholder="Your Email Address" 
                      required 
                      className="w-full border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 text-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <textarea 
                      name="message" 
                      placeholder="Tell us about your testing challenges and goals..." 
                      rows={5} 
                      required 
                      className="w-full border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 text-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 text-white font-black py-6 rounded-2xl hover:from-green-600 hover:via-emerald-600 hover:to-cyan-600 transition-all duration-500 text-xl shadow-2xl hover:shadow-emerald-500/50 transform hover:scale-105 flex items-center justify-center gap-4 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <svg className="w-8 h-8 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                    </svg>
                    <span className="relative z-10">Send to WhatsApp</span>
                  </button>
                </form>
              </div>
              
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-3xl blur-2xl animate-pulse"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?auto=format&fit=crop&w=500&q=80" 
                    alt="Customer support team" 
                    className="relative w-96 h-96 lg:w-[500px] lg:h-[500px] object-cover rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute -bottom-8 -right-8 bg-gradient-to-r from-emerald-500 to-cyan-500 p-8 rounded-3xl shadow-2xl border-4 border-white/20 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                      <span className="font-black text-white text-lg">We're online!</span>
                    </div>
                    <p className="text-white/80 font-semibold mt-2">Average response: 30 minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ultra-Modern Footer */}
      <footer className="bg-black/95 backdrop-blur-xl border-t border-white/20 text-white py-16 px-4 sm:px-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-emerald-500 to-cyan-500 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    KiwamiTestCloud
                  </h3>
                  <p className="text-white/60 font-semibold">NEXT-GENERATION QA PLATFORM</p>
                </div>
              </div>
              <p className="text-white/70 text-lg leading-relaxed mb-6 max-w-md">
                Empowering teams worldwide with intelligent testing solutions that transform bugs into dreams and visions into reality.
              </p>
              <div className="flex items-center gap-4">
                <div className="text-white/60">
                  <p className="font-semibold">&copy; {new Date().getFullYear()} KiwamiTestCloud</p>
                  <p className="text-sm">All rights reserved worldwide</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-black text-white mb-6">Quick Access</h4>
              <div className="space-y-4">
                {[
                  { name: "Products", action: () => scrollToSection('#features') },
                  { name: "Solutions", action: () => scrollToSection('#features') },
                  { name: "Why Us", action: () => scrollToSection('#benefits') },
                  { name: "Platform", action: () => scrollToSection('#features') }
                ].map((link) => (
                  <button 
                    key={link.name}
                    onClick={link.action}
                    className="block text-white/70 hover:text-white font-semibold transition-colors duration-300 hover:translate-x-2 transform text-left"
                  >
                    {link.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-xl font-black text-white mb-6">Get Connected</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <span className="text-white/70 font-semibold">Nairobi, Kenya</span>
                </div>
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-emerald-400" />
                  <a href="mailto:info@kiwamitestcloud.com" className="text-white/70 hover:text-emerald-400 font-semibold transition-colors duration-300">
                    info@kiwamitestcloud.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <a href="tel:+254748163492" className="text-white/70 hover:text-purple-400 font-semibold transition-colors duration-300">
                    0748 163 492
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-white/60">
                <button onClick={() => scrollToSection('#contact')} className="hover:text-white transition-colors duration-300 font-medium">
                  Contact
                </button>
                <button onClick={() => navigateToAuth('login')} className="hover:text-blue-400 transition-colors duration-300 font-medium">
                  Sign In
                </button>
                <button onClick={() => navigateToAuth('signup')} className="hover:text-purple-400 transition-colors duration-300 font-medium">
                  Get Started
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-white/60">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Kiwami TestCloud</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
      <GeminiChatbot />
    </div>
  );
}
