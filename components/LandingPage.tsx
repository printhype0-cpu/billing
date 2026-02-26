
import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, BarChart3, Users, ArrowRight, Smartphone, Globe, Cpu } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#0a0a0a] font-sans selection:bg-[#f65b13] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-[#f65b13] rounded-xl shadow-lg shadow-[#f65b13]/20">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-lg font-black tracking-tighter uppercase">Tech Wizardry</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <a href="#features" className="hover:text-[#f65b13] transition-colors">Features</a>
          <a href="#ecosystem" className="hover:text-[#f65b13] transition-colors">Ecosystem</a>
          <a href="#security" className="hover:text-[#f65b13] transition-colors">Security</a>
        </div>
        <button 
          onClick={onGetStarted}
          className="px-6 py-2.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#f65b13] transition-all active:scale-95"
        >
          Access Portal
        </button>
      </nav>

      <main>
        {/* Hero Section - Split Layout Pattern */}
        <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2 pt-20">
          <div className="p-10 lg:p-24 flex flex-col justify-center space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#f65b13]/10 rounded-full border border-[#f65b13]/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#f65b13] animate-pulse"></span>
                <span className="text-[10px] font-black text-[#f65b13] uppercase tracking-widest">Ecosystem v3.0 Live</span>
              </div>
              <h1 className="text-[12vw] lg:text-[112px] leading-[0.88] font-semibold tracking-tighter mb-8">
                COMMAND <br /> THE FUTURE.
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-md leading-relaxed">
                The ultimate neural-link for your retail empire. Real-time logistics, AI-driven HR, and predictive finance in one unified interface.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-10 py-6 bg-black text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-black/20 hover:bg-[#f65b13] transition-all flex items-center justify-center group"
              >
                Launch Console
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-black flex items-center justify-center text-[10px] font-black text-white">
                  +500
                </div>
              </div>
            </motion.div>
          </div>

          <div className="bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-10 lg:p-20">
            {/* Floating Feature Bubbles Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#f65b13_0%,transparent_70%)]"></div>
            </div>
            
            <div className="relative z-10 grid grid-cols-2 gap-6 w-full max-w-lg">
              <motion.div 
                whileHover={{ rotate: -2, scale: 1.05 }}
                className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-2xl rotate-[-6deg] flex flex-col justify-between aspect-square"
              >
                <div className="p-4 bg-orange-50 text-[#f65b13] rounded-2xl w-fit">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest mb-2">Predictive Analytics</h3>
                  <p className="text-xs text-slate-500 font-bold">Gemini-powered revenue forecasting.</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ rotate: 2, scale: 1.05 }}
                className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-2xl rotate-[4deg] mt-12 flex flex-col justify-between aspect-square"
              >
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit">
                  <Smartphone className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest mb-2">Device Lifecycle</h3>
                  <p className="text-xs text-slate-500 font-bold">End-to-end repair tracking system.</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ rotate: -4, scale: 1.05 }}
                className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-2xl rotate-[-2deg] -mt-6 flex flex-col justify-between aspect-square"
              >
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
                  <Globe className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest mb-2">Global Logistics</h3>
                  <p className="text-xs text-slate-500 font-bold">Multi-branch stock synchronization.</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ rotate: 6, scale: 1.05 }}
                className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-2xl rotate-[8deg] mt-6 flex flex-col justify-between aspect-square"
              >
                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl w-fit">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest mb-2">Neural Security</h3>
                  <p className="text-xs text-slate-500 font-bold">Role-based access & audit logs.</p>
                </div>
              </motion.div>
            </div>

            {/* Rail Text Pattern */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-12 opacity-20">
              <span className="writing-vertical-rl rotate-180 text-[10px] font-black uppercase tracking-[0.5em] text-white">INTELLIGENCE</span>
              <div className="w-px h-24 bg-white/20"></div>
              <span className="writing-vertical-rl rotate-180 text-[10px] font-black uppercase tracking-[0.5em] text-white">OPERATIONS</span>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-white border-y border-black/5">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Active Branches', value: '12+' },
              { label: 'Total Revenue', value: '₹4.2Cr' },
              { label: 'Daily Repairs', value: '150+' },
              { label: 'Uptime', value: '99.9%' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl lg:text-6xl font-black tracking-tighter mb-2">{stat.value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black tracking-tight mb-6 uppercase">Engineered for Scale</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">
              We've rebuilt the CRM from the ground up to handle the complexities of modern multi-branch retail operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: 'Inventory Matrix', 
                desc: 'Real-time stock tracking across all branches with automated reorder intelligence.',
                icon: BarChart3,
                color: 'bg-orange-50 text-[#f65b13]'
              },
              { 
                title: 'Human Capital', 
                desc: 'Streamlined onboarding, attendance tracking, and performance analytics.',
                icon: Users,
                color: 'bg-blue-50 text-blue-600'
              },
              { 
                title: 'Financial Core', 
                desc: 'GST-compliant invoicing, purchase order management, and deep sales insights.',
                icon: Zap,
                color: 'bg-emerald-50 text-emerald-600'
              }
            ].map((feature, i) => (
              <div key={i} className="p-10 bg-white rounded-[3rem] border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all group">
                <div className={`p-5 rounded-2xl w-fit mb-8 ${feature.color} group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-32">
          <div className="max-w-7xl mx-auto bg-[#0a0a0a] rounded-[4rem] p-12 lg:p-24 relative overflow-hidden text-center">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#f65b13]/20 blur-[100px]"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[100px]"></div>
            </div>
            
            <div className="relative z-10 space-y-10">
              <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase">Ready to upgrade <br /> your operations?</h2>
              <button 
                onClick={onGetStarted}
                className="px-12 py-8 bg-[#f65b13] text-white rounded-[2.5rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-[#f65b13]/30 hover:bg-white hover:text-black transition-all active:scale-95"
              >
                Access Console Now
              </button>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Enterprise Grade &bull; Secure &bull; AI Powered</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-black/5 text-center">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="p-1.5 bg-black rounded-lg">
            <Zap className="w-4 h-4 text-white fill-current" />
          </div>
          <span className="text-xs font-black tracking-tighter uppercase">Tech Wizardry</span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          &copy; 2024 Tech Wizardry Pvt Ltd &bull; Command Ecosystem v3.0
        </p>
        <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Developed by <a href="https://www.digitaladwords.co.in/" target="_blank" rel="noopener noreferrer" className="text-[#f65b13] hover:underline">Digital AdWords</a>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
