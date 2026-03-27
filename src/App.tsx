/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  ShieldCheck, 
  ShoppingCart, 
  Upload, 
  Search, 
  CheckCircle2, 
  Download, 
  CreditCard, 
  ChevronRight, 
  Menu, 
  X,
  QrCode,
  Loader2,
  Calendar,
  Clock,
  IndianRupee,
  Building2,
  Briefcase,
  Globe,
  Award,
  Users,
  Plus,
  Trash2,
  Scale,
  FileWarning,
  Image as ImageIcon,
  ChevronDown,
  FileCheck,
  Bell,
  MessageCircle
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { analyzeBidDocument } from './services/gemini';
import { cn } from './lib/utils';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Tab = 'home' | 'analyzer' | 'certificate' | 'escalation' | 'bankruptcy' | 'pricing' | 'tender-update';

interface UserData {
  name: string;
  email: string;
  whatsapp: string;
  isAdmin?: boolean;
}

interface TenderUpdate {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [tenderUpdates, setTenderUpdates] = useState<TenderUpdate[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('ad_pro_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setShowSignup(true);
    }

    const savedUpdates = localStorage.getItem('ad_pro_tender_updates');
    if (savedUpdates) {
      setTenderUpdates(JSON.parse(savedUpdates));
    } else {
      // Initial sample updates
      const initialUpdates = [
        { id: '1', title: 'Solar Power Plant Installation - Gujarat', category: 'Works', date: '2026-03-20', description: 'New tender for 50MW solar plant installation in Kutch region.' },
        { id: '2', title: 'IT Infrastructure Upgrade - Delhi Metro', category: 'Services', date: '2026-03-19', description: 'Maintenance and upgrade of network infrastructure for Phase 4.' }
      ];
      setTenderUpdates(initialUpdates);
      localStorage.setItem('ad_pro_tender_updates', JSON.stringify(initialUpdates));
    }
  }, []);

  const handleSignup = (data: UserData) => {
    localStorage.setItem('ad_pro_user', JSON.stringify(data));
    setUser(data);
    setShowSignup(false);
  };

  const addTenderUpdate = (update: Omit<TenderUpdate, 'id' | 'date'>) => {
    const newUpdate: TenderUpdate = {
      ...update,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0]
    };
    const updatedList = [newUpdate, ...tenderUpdates];
    setTenderUpdates(updatedList);
    localStorage.setItem('ad_pro_tender_updates', JSON.stringify(updatedList));
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <AnimatePresence>
        {showSignup && (
          <SignupModal onSignup={handleSignup} />
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div 
            className="flex cursor-pointer items-center gap-3"
            onClick={() => setActiveTab('home')}
          >
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-sea-green text-white shadow-lg">
              {/* Pyramid A Logo */}
              <svg viewBox="0 0 100 100" className="h-8 w-8 fill-current">
                <path d="M50 15 L85 85 L15 85 Z" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
                <path d="M35 55 L65 55" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tighter text-sea-green">
              A D PROFESSIONAL SOLUTION
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            <button 
              onClick={() => setActiveTab('home')}
              className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'home' ? "text-sea-green" : "text-slate-600")}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('analyzer')}
              className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'analyzer' ? "text-sea-green" : "text-slate-600")}
            >
              AI Bid Analyzer
            </button>
            <button 
              onClick={() => setActiveTab('tender-update')}
              className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'tender-update' ? "text-sea-green" : "text-slate-600")}
            >
              Tender Update
            </button>
            
            {/* Bid Documents Column */}
            <div className="flex flex-col gap-1.5 border-l-2 border-sea-green/20 pl-6 py-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Bid Documents</span>
              <button 
                onClick={() => setActiveTab('certificate')}
                className={cn("text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-sea-green text-left", activeTab === 'certificate' ? "text-sea-green" : "text-slate-600")}
              >
                MII Certificate
              </button>
              <button 
                onClick={() => setActiveTab('escalation')}
                className={cn("text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-sea-green text-left", activeTab === 'escalation' ? "text-sea-green" : "text-slate-600")}
              >
                Escalation Matrix
              </button>
              <button 
                onClick={() => setActiveTab('bankruptcy')}
                className={cn("text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-sea-green text-left", activeTab === 'bankruptcy' ? "text-sea-green" : "text-slate-600")}
              >
                Non-bankruptcy
              </button>
            </div>

            <button 
              onClick={() => setActiveTab('pricing')}
              className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'pricing' ? "text-sea-green" : "text-slate-600")}
            >
              Pricing
            </button>
            <button 
              onClick={() => setActiveTab('pricing')}
              className="rounded-xl bg-sea-green px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-opacity-90 hover:shadow-sea-green/20 active:scale-95"
            >
              Get Started
            </button>

            {user && (
              <div className="flex items-center gap-3 border-l border-slate-100 pl-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sea-green-light text-sea-green font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-slate-400">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-100 bg-white md:hidden"
            >
              <div className="flex flex-col gap-2 p-4">
                <button onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-600 hover:bg-sea-green-light">Home</button>
                <button onClick={() => { setActiveTab('analyzer'); setIsMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-600 hover:bg-sea-green-light">AI Bid Analyzer</button>
                <button onClick={() => { setActiveTab('tender-update'); setIsMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-600 hover:bg-sea-green-light">Tender Update</button>
                
                <div className="border-y border-sea-green-light py-2">
                  <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Bid Documents</p>
                  <button onClick={() => { setActiveTab('certificate'); setIsMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left font-bold text-slate-600 hover:bg-sea-green-light"><FileCheck size={18} /> MII Certificate</button>
                  <button onClick={() => { setActiveTab('escalation'); setIsMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left font-bold text-slate-600 hover:bg-sea-green-light"><Users size={18} /> Escalation Matrix</button>
                  <button onClick={() => { setActiveTab('bankruptcy'); setIsMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left font-bold text-slate-600 hover:bg-sea-green-light"><Scale size={18} /> Non-bankruptcy</button>
                </div>
                <button onClick={() => { setActiveTab('pricing'); setIsMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-600 hover:bg-sea-green-light">Pricing</button>
                <button onClick={() => { setActiveTab('pricing'); setIsMenuOpen(false); }} className="mt-2 rounded-xl bg-sea-green py-4 text-center font-black uppercase tracking-widest text-white shadow-lg">Get Started</button>
                
                {user && (
                  <div className="mt-4 flex items-center gap-4 rounded-2xl bg-sea-green-light p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sea-green text-white font-bold text-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      <p className="text-[10px] text-sea-green font-medium mt-1">{user.whatsapp}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'home' && <HomeView onServiceClick={(tab) => setActiveTab(tab)} />}
        {activeTab === 'analyzer' && <AnalyzerView />}
        {activeTab === 'tender-update' && <TenderUpdateView user={user} updates={tenderUpdates} onAddUpdate={addTenderUpdate} />}
        {activeTab === 'certificate' && <CertificateView />}
        {activeTab === 'escalation' && <EscalationView />}
        {activeTab === 'bankruptcy' && <NonBankruptcyView />}
        {activeTab === 'pricing' && <PricingView />}
      </main>

      <footer className="mt-20 border-t border-slate-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sea-green text-white">
                  <svg viewBox="0 0 100 100" className="h-6 w-6 fill-current">
                    <path d="M50 15 L85 85 L15 85 Z" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
                    <path d="M35 55 L65 55" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-xl font-black tracking-tighter text-sea-green uppercase">A D Professional Solution</span>
              </div>
              <p className="mt-6 max-w-xs text-sm font-medium leading-relaxed text-slate-500">
                Your trusted partner for Government Tendering and GeM Portal services. 
                We simplify complex processes with expertise and AI technology.
              </p>
            </div>
            <div>
              <h4 className="font-bold">Services</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li>GeM Registration</li>
                <li>Catalog Management</li>
                <li>Bid Participation</li>
                <li>MII Certification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold">Contact</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li>Email: info@adprofessionals.com</li>
                <li>Phone: +91 98765 43210</li>
                <li>Address: New Delhi, India</li>
              </ul>
            </div>
          </div>
          <div className="mt-16 border-t border-slate-50 pt-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            © 2026 A D Professional Solution. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomeView({ onServiceClick }: { onServiceClick: (tab: Tab) => void }) {
  const services = [
    {
      title: "GeM Registration",
      desc: "Complete assistance in registering your business on the Government e-Marketplace portal.",
      icon: <Building2 className="text-sea-green" />,
    },
    {
      title: "Catalog Management",
      desc: "Expert catalog making and product uploading to ensure maximum visibility for your products.",
      icon: <ShoppingCart className="text-sea-green" />,
    },
    {
      title: "Bid Participation",
      desc: "End-to-end support for participating in GeM bids, from document prep to final submission.",
      icon: <Briefcase className="text-sea-green" />,
    },
    {
      title: "AI Bid Analysis",
      desc: "Upload tender PDFs and let our AI identify all required documents instantly.",
      icon: <Search className="text-sea-green" />,
      action: () => onServiceClick('analyzer')
    },
    {
      title: "MII Certificate",
      desc: "Generate 'Make in India' self-certification documents for your specific bids.",
      icon: <Award className="text-sea-green" />,
      action: () => onServiceClick('certificate')
    },
    {
      title: "Escalation Matrix",
      desc: "Create professional Service Support Escalation Matrix for your tender submissions.",
      icon: <Users className="text-sea-green" />,
      action: () => onServiceClick('escalation')
    },
    {
      title: "Non-bankruptcy",
      desc: "Generate certification declaring your firm is not under liquidation or bankrupt.",
      icon: <FileWarning className="text-sea-green" />,
      action: () => onServiceClick('bankruptcy')
    },
    {
      title: "Tender Update",
      desc: "Get real-time tender notifications directly on your WhatsApp number.",
      icon: <MessageCircle className="text-sea-green" />,
      action: () => onServiceClick('tender-update')
    },
    {
      title: "Govt. Tendering",
      desc: "Comprehensive solutions for all types of government tenders across various sectors.",
      icon: <Globe className="text-sea-green" />,
    }
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-sea-green-dark px-8 py-20 text-white">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sea-green/20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sea-green/20 blur-3xl"></div>
        
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight sm:text-6xl"
          >
            Empowering Your Business in <span className="text-sea-green-light">Government Tendering</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg text-sea-green-light/80"
          >
            Expert GeM Portal services, AI-powered bid analysis, and professional consultation to help you win more government contracts.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <button 
              onClick={() => onServiceClick('pricing')}
              className="rounded-full bg-white px-8 py-4 font-bold text-sea-green-dark shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              View Subscription Plans
            </button>
            <button 
              onClick={() => onServiceClick('analyzer')}
              className="rounded-full border border-sea-green/40 bg-sea-green-dark/50 px-8 py-4 font-bold text-white backdrop-blur-sm transition-all hover:bg-sea-green active:scale-95"
            >
              Try AI Bid Analyzer
            </button>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Our Professional Services</h2>
          <p className="mt-4 text-slate-500">Comprehensive solutions for all your GeM and Tendering needs.</p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-sea-green/20 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sea-green-light transition-colors group-hover:bg-sea-green/10">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{service.title}</h3>
              <p className="mt-2 flex-grow text-sm leading-relaxed text-slate-500">{service.desc}</p>
              {service.action && (
                <button 
                  onClick={service.action}
                  className="mt-6 flex items-center gap-1 text-sm font-bold text-sea-green hover:underline"
                >
                  Try Now <ChevronRight size={16} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="rounded-3xl bg-sea-green-light p-8 md:p-16">          <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Why Choose A D Professional Solution?</h2>
            <div className="mt-8 space-y-6">
              {[
                { title: "Expert Knowledge", desc: "Years of experience in navigating complex government portals." },
                { title: "AI-Powered Efficiency", desc: "Save hours of manual document review with our bid analyzer." },
                { title: "End-to-End Support", desc: "From registration to bid submission, we handle it all." },
                { title: "Affordable Pricing", desc: "Premium services at a fraction of the cost of traditional consultants." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sea-green text-white">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-2xl bg-sea-green-light shadow-2xl">
              <img 
                src="https://picsum.photos/seed/business/800/800" 
                alt="Professional Business" 
                className="h-full w-full object-cover mix-blend-multiply opacity-80"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sea-green-light text-sea-green">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-xs font-medium text-slate-500">Compliance Guaranteed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SignupModal({ onSignup }: { onSignup: (data: UserData) => void }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    name: '',
    email: '',
    whatsapp: '',
    isAdmin: false
  });
  const [adminKey, setAdminKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminMode) {
      if (adminKey === 'admin123') { // Simple hardcoded key for demo
        onSignup({ ...formData, name: 'Admin User', isAdmin: true });
      } else {
        alert('Invalid Admin Key');
      }
    } else {
      if (formData.name && formData.email && formData.whatsapp) {
        onSignup(formData);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className={cn("p-8 text-center text-white transition-colors", isAdminMode ? "bg-slate-800" : "bg-sea-green")}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            {isAdminMode ? <ShieldCheck size={32} /> : <Users size={32} />}
          </div>
          <h2 className="text-2xl font-black tracking-tight">{isAdminMode ? 'Admin Portal' : 'Welcome to A D Pro'}</h2>
          <p className="mt-2 text-sea-green-light/80">{isAdminMode ? 'Enter your credentials to manage tenders' : 'Please sign up to access all professional tools'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          {!isAdminMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">WhatsApp Number</label>
                <input 
                  type="tel" 
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Admin Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@adpro.com"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-800 focus:ring-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Admin Access Key</label>
                <input 
                  type="password" 
                  required
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-800 focus:ring-slate-800"
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-lg transition-all active:scale-95",
              isAdminMode ? "bg-slate-800 hover:bg-slate-900" : "bg-sea-green hover:bg-sea-green-dark"
            )}
          >
            {isAdminMode ? 'Login as Admin' : 'Get Started'}
            <ChevronRight size={20} />
          </button>
          
          <div className="text-center">
            <button 
              type="button"
              onClick={() => setIsAdminMode(!isAdminMode)}
              className="text-xs font-bold text-slate-400 hover:text-sea-green"
            >
              {isAdminMode ? 'Back to User Signup' : 'Admin Login'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function TenderUpdateView({ user, updates, onAddUpdate }: { user: UserData | null, updates: TenderUpdate[], onAddUpdate: (update: Omit<TenderUpdate, 'id' | 'date'>) => void }) {
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('All');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: '', category: 'Goods', description: '' });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubscribed(true);
    }, 1500);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUpdate.title && newUpdate.description) {
      onAddUpdate(newUpdate);
      setNewUpdate({ title: '', category: 'Goods', description: '' });
      setShowAdminForm(false);
    }
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(`Hello A D Pro, I want to receive tender updates for: ${keywords || 'All Tenders'} in category: ${category}. My email is ${user?.email}.`);
    window.open(`https://wa.me/919876543210?text=${message}`, '_blank');
  };

  const filteredUpdates = category === 'All' ? updates : updates.filter(u => u.category === category);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-sea-green-light text-sea-green shadow-lg"
        >
          <Bell size={40} />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Tender Update Service</h2>
        <p className="mt-4 text-slate-500">Get real-time tender notifications directly on your WhatsApp number: <span className="font-bold text-sea-green">{user?.whatsapp || 'N/A'}</span></p>
        
        {user?.isAdmin && (
          <button 
            onClick={() => setShowAdminForm(!showAdminForm)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-slate-900"
          >
            <Plus size={18} />
            {showAdminForm ? 'Close Admin Panel' : 'Post New Tender Update'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAdminForm && user?.isAdmin && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl border-2 border-slate-800 bg-white p-8 shadow-xl"
          >
            <h3 className="mb-6 text-xl font-bold text-slate-900">Post New Tender Update (Admin Only)</h3>
            <form onSubmit={handleAdminSubmit} className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700">Tender Title</label>
                  <input 
                    type="text" 
                    required
                    value={newUpdate.title}
                    onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                    placeholder="e.g., Highway Construction - NH1"
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Category</label>
                  <select 
                    value={newUpdate.category}
                    onChange={(e) => setNewUpdate({ ...newUpdate, category: e.target.value })}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                  >
                    <option value="Goods">Goods</option>
                    <option value="Services">Services</option>
                    <option value="Works">Works</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700">Description</label>
                  <textarea 
                    required
                    value={newUpdate.description}
                    onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
                    placeholder="Enter tender details..."
                    rows={4}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                  />
                </div>
                <button 
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-4 font-bold text-white shadow-lg transition-all hover:bg-slate-900"
                >
                  Post Update
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Subscription Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Subscription Settings</h3>
              {!isSubscribed ? (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Keywords</label>
                    <input 
                      type="text" 
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="Solar, IT, etc."
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-sea-green focus:ring-sea-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-sea-green focus:ring-sea-green"
                    >
                      <option value="All">All Categories</option>
                      <option value="Goods">Goods</option>
                      <option value="Services">Services</option>
                      <option value="Works">Works</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sea-green py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-sea-green-dark disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    {isLoading ? 'Activating...' : 'Activate Updates'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-sea-green text-white">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Updates Active</p>
                  <button onClick={() => setIsSubscribed(false)} className="mt-2 text-[10px] font-bold text-sea-green hover:underline">Change Settings</button>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-sea-green p-6 text-white shadow-lg">
              <MessageCircle className="mb-4" size={24} />
              <h4 className="font-bold">WhatsApp Support</h4>
              <p className="mt-2 text-xs text-sea-green-light/90">Chat directly with our tender experts for custom requirements.</p>
              <button 
                onClick={openWhatsApp}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-xs font-bold text-sea-green transition-all hover:bg-sea-green-light"
              >
                Chat Now
              </button>
            </div>
          </div>
        </div>

        {/* Updates Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Latest Tender Updates</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Clock size={14} />
              Last updated: Today
            </div>
          </div>

          <div className="space-y-4">
            {filteredUpdates.length > 0 ? filteredUpdates.map((update) => (
              <motion.div 
                key={update.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-sea-green/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-sea-green-light px-2 py-0.5 text-[10px] font-bold text-sea-green uppercase">
                        {update.category}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {update.date}
                      </span>
                    </div>
                    <h4 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-sea-green transition-colors">
                      {update.title}
                    </h4>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                      {update.description}
                    </p>
                  </div>
                  <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-sea-green hover:text-white">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-300">
                  <Bell size={48} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">No updates found</h4>
                <p className="text-sm text-slate-500">Try changing your category filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyzerView() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!resultRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(resultRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bid_Analysis_${file?.name.replace('.pdf', '') || 'Result'}.pdf`);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    // Extract text from first 10 pages to stay within reasonable limits
    const numPages = Math.min(pdf.numPages, 10);
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const text = await extractTextFromPDF(file);
      const analysis = await analyzeBidDocument(text);
      setResult(analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">AI Bid Document Analyzer</h2>
        <p className="mt-2 text-slate-500">Upload your tender or bid PDF to instantly identify required documents and compliance points.</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center transition-colors hover:border-sea-green/30">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />
        
        {!file ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sea-green-light text-sea-green">
              <Upload size={32} />
            </div>
            <div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-lg font-bold text-sea-green hover:underline"
              >
                Click to upload
              </button>
              <p className="text-sm text-slate-400">or drag and drop your PDF here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-4 rounded-xl bg-sea-green-light p-4">
              <FileText className="text-sea-green" size={32} />
              <div className="text-left">
                <div className="font-bold text-slate-900">{file.name}</div>
                <div className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="ml-4 text-slate-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sea-green py-4 font-bold text-white shadow-lg transition-all hover:bg-sea-green-dark disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Analyze Bid Document
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {result && (
        <motion.div 
          ref={resultRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Key Deadlines & EMD */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sea-green-light text-sea-green">
                <IndianRupee size={20} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">EMD Details</h4>
              <p className="mt-1 text-sm font-bold text-slate-900">{result.emdDetails}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sea-green-light text-sea-green">
                <Clock size={20} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical Deadline</h4>
              <p className="mt-1 text-sm font-bold text-slate-900">{result.technicalDeadline}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sea-green-light text-sea-green">
                <Calendar size={20} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Price Deadline</h4>
              <p className="mt-1 text-sm font-bold text-slate-900">{result.priceDeadline}</p>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900">Analysis Result</h3>
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 text-sm font-bold text-sea-green disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Download size={16} />
                )}
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="text-sea-green" size={20} />
                  Summary
                </h4>
                <p className="text-sm leading-relaxed text-slate-600">{result.summary}</p>
              </div>

              <div>
                <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <FileText className="text-sea-green" size={20} />
                  Required Documents
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {result.requiredDocuments.map((doc: any, i: number) => (
                    <div key={i} className="rounded-xl bg-sea-green-light p-4">
                      <div className="font-bold text-slate-900">{doc.document}</div>
                      <div className="mt-1 text-xs text-slate-500">{doc.reason}</div>
                    </div>
                  ))}
                </div>
              </div>

              {result.additionalDos && result.additionalDos.length > 0 && (
                <div>
                  <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="text-sea-green" size={20} />
                    Additional Dos (from ATC)
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {result.additionalDos.map((doItem: any, i: number) => (
                      <div key={i} className="rounded-xl border border-sea-green/20 bg-sea-green-light p-4">
                        <div className="font-bold text-slate-900">{doItem.instruction}</div>
                        <div className="mt-1 text-xs text-slate-500">{doItem.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function CertificateView() {
  const [formData, setFormData] = useState({
    companyName: '',
    bidNumber: '',
    localContent: '50',
    location: '',
    letterhead: null as string | null,
  });
  const [isPreview, setIsPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(certificateRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MII_Certificate_${formData.companyName.replace(/\s+/g, '_') || 'Result'}.pdf`);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isPreview) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setIsPreview(false)}
            className="text-sm font-bold text-sea-green hover:underline"
          >
            ← Back to Edit
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 rounded-lg bg-sea-green px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-sea-green-dark disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            {isDownloading ? 'Downloading...' : 'Download Certificate'}
          </button>
        </div>

        <div id="certificate" ref={certificateRef} className="relative aspect-[210/297] w-full overflow-hidden border border-slate-200 bg-white p-12 shadow-2xl sm:p-16">
          {/* Letterhead */}
          {formData.letterhead && (
            <div className="mb-8 flex justify-center border-b border-slate-100 pb-8">
              <img 
                src={formData.letterhead} 
                alt="Letterhead" 
                className="max-h-32 w-full object-contain"
              />
            </div>
          )}

          {/* Background Logo */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none">
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Make_In_India.png/1200px-Make_In_India.png" 
              alt="Make In India Logo" 
              className="w-3/4 grayscale"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="relative z-10 space-y-8 text-slate-900">
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold underline underline-offset-4">
                Self-Certification under preference to Make in India order
              </h1>
              <p className="text-sm font-medium">
                (Refer Clause No. 2.8 & 3.4.4 of ITT)
              </p>
              <h2 className="text-2xl font-bold tracking-widest pt-4">
                CERTIFICATE
              </h2>
            </div>

            <div className="text-justify leading-relaxed space-y-6">
              <p>
                In line with Government Public Procurement Order No. P-45021/2/2017-PP (BE-II) dated 
                04.06.2020 and its amendments, we hereby certify that we M/s <span className="font-bold border-b border-slate-900 px-2">{formData.companyName || "________________"}</span> are local 
                supplier meeting the requirement of minimum local content i.e., <span className="font-bold border-b border-slate-900 px-2">{formData.localContent}%</span> as defined in above orders 
                for the material against Bid No: <span className="font-bold border-b border-slate-900 px-2">{formData.bidNumber || "_________________"}</span>
              </p>

              <div className="space-y-2">
                <p>Details of location at which local value addition will be made as follows:</p>
                <div className="min-h-[60px] border-b border-slate-300 pb-1 font-bold">
                  {formData.location || "______________________________________________________________________"}
                </div>
              </div>

              <p className="text-sm">
                We also understand, false declarations will be in breach of the code of integrity under rule 
                175(1)(i)(h) of the General Financial Rules for which a bidder or its successors can be debarred 
                for up to two years as per Rule 151(iii) of the General Financial Rules along with such other 
                actions as may be permissible under law.
              </p>
            </div>

            <div className="pt-12">
              <p className="font-bold">
                For : <span className="border-b border-slate-900 px-4">{formData.companyName || "_____________________"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">MII Certificate Generator</h2>
        <p className="mt-2 text-slate-500">Generate a professional 'Make in India' self-certification for your GeM bids in seconds.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsPreview(true); }}>
          <div>
            <label className="block text-sm font-bold text-slate-700">Company Name</label>
            <input 
              type="text" 
              required
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              placeholder="Enter your registered company name"
              className="mt-1 block w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-sea-green focus:ring-sea-green"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">Letterhead (Optional)</label>
            <div className="mt-1 flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-sea-green-light px-4 py-2 text-sm font-medium text-slate-600 hover:bg-sea-green/10">
                <ImageIcon size={18} />
                <span>Upload Image</span>
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({...formData, letterhead: reader.result as string});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {formData.letterhead && (
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, letterhead: null})}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="mt-1 text-[10px] text-slate-400 italic">Upload your company letterhead to appear at the top of the certificate.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">Bid Number</label>
            <input 
              type="text" 
              required
              value={formData.bidNumber}
              onChange={(e) => setFormData({...formData, bidNumber: e.target.value})}
              placeholder="e.g. GEM/2026/B/1234567"
              className="mt-1 block w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-sea-green focus:ring-sea-green"
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-slate-700">Local Content (%)</label>
              <input 
                type="number" 
                required
                min="0"
                max="100"
                value={formData.localContent}
                onChange={(e) => setFormData({...formData, localContent: e.target.value})}
                className="mt-1 block w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-sea-green focus:ring-sea-green"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Location of Value Addition</label>
              <input 
                type="text" 
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g. Noida, Uttar Pradesh"
                className="mt-1 block w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-sea-green focus:ring-sea-green"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full rounded-xl bg-sea-green py-4 font-bold text-white shadow-lg transition-all hover:bg-sea-green-dark active:scale-95"
          >
            Generate Preview
          </button>
        </form>
      </div>
    </div>
  );
}

function PricingView() {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const upiId = "anuscyberwork@okaxis"; // Placeholder UPI ID

  const plans = [
    {
      name: "Basic Monthly",
      price: "99",
      period: "month",
      desc: "Essential updates for active GeM bidders.",
      features: [
        "GeM Upcoming Bid Updates",
        "MII Certificate Generator",
        "Email Support",
        "GeM Portal Consultation"
      ],
      cta: "Subscribe Basic",
      popular: false
    },
    {
      name: "Pro Monthly",
      price: "149",
      period: "month",
      desc: "Advanced tools for professional bidding.",
      features: [
        "AI Bid Analysis (10/month)",
        "GeM Upcoming Bid Updates",
        "MII Certificate Generator",
        "Priority Email Support",
        "GeM Portal Consultation"
      ],
      cta: "Subscribe Pro",
      popular: true
    },
    {
      name: "Yearly Plan",
      price: "999",
      period: "year",
      desc: "Maximum value for serious government contractors.",
      features: [
        "AI Bid Analysis (10/month)",
        "GeM Upcoming Bid Updates",
        "MII Certificate Generator",
        "Priority Email Support",
        "GeM Portal Consultation"
      ],
      cta: "Subscribe Yearly",
      popular: false
    }
  ];

  const handleSubscribe = (plan: any) => {
    setSelectedPlan(plan);
    // Generate UPI URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=GeM%20Bid%20Analyzer&am=${plan.price}&cu=INR&tn=Subscription%20for%20${plan.name}`;
    
    // On mobile, this will open the UPI app directly
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = upiUrl;
    }
  };

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple, Transparent Pricing</h2>
        <p className="mt-4 text-slate-500">Choose the plan that fits your business needs.</p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        {plans.map((plan, i) => (
          <div 
            key={i}
            className={cn(
              "relative flex flex-col rounded-3xl border p-8 transition-all",
              plan.popular ? "border-sea-green bg-white shadow-2xl scale-105 z-10" : "border-slate-200 bg-white shadow-sm"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-sea-green px-4 py-1 text-xs font-bold text-white uppercase tracking-widest">
                Most Popular
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-slate-500">{plan.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">₹{plan.price}</span>
                <span className="text-slate-500">/{plan.period}</span>
              </div>
            </div>
            <ul className="mb-8 flex-grow space-y-4">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="text-sea-green" size={18} />
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleSubscribe(plan)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-4 font-bold transition-all active:scale-95",
                plan.popular ? "bg-sea-green text-white shadow-lg hover:bg-sea-green-dark" : "bg-sea-green-light text-sea-green hover:bg-sea-green/20"
              )}
            >
              <CreditCard size={20} />
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Modal for Desktop */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Complete Payment</h3>
              <button 
                onClick={() => setSelectedPlan(null)}
                className="rounded-full p-2 hover:bg-sea-green-light"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6 text-center">
              <div className="rounded-2xl bg-sea-green-light p-6">
                <p className="text-sm text-slate-500">You are subscribing to</p>
                <p className="text-2xl font-black text-sea-green">{selectedPlan.name}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">₹{selectedPlan.price}</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4">
                  {/* QR Code Placeholder */}
                  <div className="text-center">
                    <QrCode size={64} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-xs text-slate-400 font-mono">{upiId}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  Scan this QR code using any UPI app (GPay, PhonePe, Paytm) to complete your subscription.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    const upiUrl = `upi://pay?pa=${upiId}&pn=GeM%20Bid%20Analyzer&am=${selectedPlan.price}&cu=INR&tn=Subscription%20for%20${selectedPlan.name}`;
                    window.location.href = upiUrl;
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-sea-green py-3 text-sm font-bold text-white shadow-lg hover:bg-sea-green-dark"
                >
                  Pay via App
                </button>
                <button 
                  onClick={() => setSelectedPlan(null)}
                  className="rounded-xl bg-sea-green-light py-3 text-sm font-bold text-sea-green hover:bg-sea-green/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl rounded-2xl bg-sea-green-light p-6 text-center">
        <p className="text-sm text-sea-green">
          <strong>Need a custom solution?</strong> We offer enterprise-grade services for large corporations. 
          <button className="ml-2 font-bold underline">Contact our sales team</button>
        </p>
      </div>
    </div>
  );
}

function EscalationView() {
  const [matrix, setMatrix] = useState([
    { id: 1, name: '', designation: '', mobile: '', email: '', level: 'Level 1' },
    { id: 2, name: '', designation: '', mobile: '', email: '', level: 'Level 2' },
    { id: 3, name: '', designation: '', mobile: '', email: '', level: 'Level 3' },
  ]);
  const [companyName, setCompanyName] = useState('');
  const [letterhead, setLetterhead] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const matrixRef = useRef<HTMLDivElement>(null);

  const addRow = () => {
    const nextLevel = matrix.length + 1;
    setMatrix([...matrix, { 
      id: nextLevel, 
      name: '', 
      designation: '', 
      mobile: '', 
      email: '', 
      level: `Level ${nextLevel}` 
    }]);
  };

  const removeRow = (id: number) => {
    if (matrix.length <= 1) return;
    setMatrix(matrix.filter(row => row.id !== id));
  };

  const updateRow = (id: number, field: string, value: string) => {
    setMatrix(matrix.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleExport = async () => {
    if (!matrixRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(matrixRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Escalation_Matrix_${companyName.replace(/\s+/g, '_') || 'Result'}.pdf`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Service Support Escalation Matrix</h2>
        <p className="mt-4 text-slate-500">Create a professional support hierarchy for your bid documents.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-slate-700">Company Name</label>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-sea-green focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Letterhead (Optional)</label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-sea-green-light px-4 py-2 text-sm font-medium text-slate-600 hover:bg-sea-green/10">
                  <ImageIcon size={18} />
                  <span>Upload Image</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setLetterhead(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {letterhead && (
                  <button 
                    type="button"
                    onClick={() => setLetterhead(null)}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] text-slate-400 italic">Upload your company letterhead to appear at the top of the matrix.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-sea-green-light">
                <th className="px-4 py-3 font-bold text-slate-700">Sl No.</th>
                <th className="px-4 py-3 font-bold text-slate-700">Escalation Level</th>
                <th className="px-4 py-3 font-bold text-slate-700">Name</th>
                <th className="px-4 py-3 font-bold text-slate-700">Designation</th>
                <th className="px-4 py-3 font-bold text-slate-700">Mobile No.</th>
                <th className="px-4 py-3 font-bold text-slate-700">Email ID</th>
                <th className="px-4 py-3 font-bold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrix.map((row, index) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={row.level}
                      onChange={(e) => updateRow(row.id, 'level', e.target.value)}
                      className="w-full rounded-lg border border-slate-100 px-2 py-1 text-sm focus:border-sea-green"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={row.name}
                      onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                      placeholder="Full Name"
                      className="w-full rounded-lg border border-slate-100 px-2 py-1 text-sm focus:border-sea-green"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={row.designation}
                      onChange={(e) => updateRow(row.id, 'designation', e.target.value)}
                      placeholder="Designation"
                      className="w-full rounded-lg border border-slate-100 px-2 py-1 text-sm focus:border-sea-green"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={row.mobile}
                      onChange={(e) => updateRow(row.id, 'mobile', e.target.value)}
                      placeholder="Mobile No."
                      className="w-full rounded-lg border border-slate-100 px-2 py-1 text-sm focus:border-sea-green"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="email" 
                      value={row.email}
                      onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                      placeholder="Email ID"
                      className="w-full rounded-lg border border-slate-100 px-2 py-1 text-sm focus:border-sea-green"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => removeRow(row.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button 
            onClick={addRow}
            className="flex items-center gap-2 rounded-xl border border-sea-green/20 bg-sea-green-light px-6 py-3 text-sm font-bold text-sea-green hover:bg-sea-green/10"
          >
            <Plus size={18} /> Add Escalation Level
          </button>
          
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-sea-green px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-sea-green-dark disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-sea-green-light px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Document Preview</h3>
        </div>
        
        <div className="p-8 sm:p-12 bg-white aspect-[210/297] w-full overflow-y-auto" ref={matrixRef}>
          <div className="mx-auto max-w-4xl space-y-12">
            {letterhead && (
              <div className="mb-8 flex justify-center border-b border-slate-100 pb-8">
                <img 
                  src={letterhead} 
                  alt="Letterhead" 
                  className="max-h-32 w-full object-contain"
                />
              </div>
            )}
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Service Support Escalation Matrix</h1>
              {companyName && (
                <p className="mt-2 text-lg font-semibold text-sea-green">{companyName}</p>
              )}
              <div className="mx-auto mt-4 h-1 w-24 bg-sea-green"></div>
            </div>

            <div className="space-y-6">
              <p className="text-sm leading-relaxed text-slate-600">
                The following matrix outlines the escalation procedure for service support related to the bid. 
                Our team is committed to providing timely and effective resolution to any technical or operational issues.
              </p>

              <table className="w-full border-collapse border border-slate-300 text-sm">
                <thead>
                  <tr className="bg-sea-green-light">
                    <th className="border border-slate-300 px-4 py-3 font-bold text-slate-900">Sl No.</th>
                    <th className="border border-slate-300 px-4 py-3 font-bold text-slate-900">Escalation Level</th>
                    <th className="border border-slate-300 px-4 py-3 font-bold text-slate-900">Name</th>
                    <th className="border border-slate-300 px-4 py-3 font-bold text-slate-900">Designation</th>
                    <th className="border border-slate-300 px-4 py-3 font-bold text-slate-900">Mobile No.</th>
                    <th className="border border-slate-300 px-4 py-3 font-bold text-slate-900">Email ID</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, index) => (
                    <tr key={row.id}>
                      <td className="border border-slate-300 px-4 py-3 text-center">{index + 1}</td>
                      <td className="border border-slate-300 px-4 py-3 font-medium">{row.level || `Level ${index + 1}`}</td>
                      <td className="border border-slate-300 px-4 py-3">{row.name || '-'}</td>
                      <td className="border border-slate-300 px-4 py-3">{row.designation || '-'}</td>
                      <td className="border border-slate-300 px-4 py-3">{row.mobile || '-'}</td>
                      <td className="border border-slate-300 px-4 py-3">{row.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-20 flex justify-between pt-12">
              <div className="text-center">
                <div className="mb-2 h-px w-40 bg-slate-300"></div>
                <p className="text-xs font-bold uppercase text-slate-400">Authorized Signatory</p>
              </div>
              <div className="text-center">
                <div className="mb-2 h-px w-40 bg-slate-300"></div>
                <p className="text-xs font-bold uppercase text-slate-400">Company Seal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NonBankruptcyView() {
  const [formData, setFormData] = useState({
    name: '',
    designation: 'Proprietor',
    firmName: '',
    officeAddress: '',
    bidNumber: '',
    letterhead: null as string | null,
  });
  const [isExporting, setIsExporting] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(documentRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Non_Bankruptcy_Undertaking_${formData.bidNumber || 'Result'}.pdf`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Non-bankruptcy Undertaking</h2>
        <p className="mt-4 text-slate-500">Certify that your firm is not under liquidation or bankrupt.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-slate-900">Enter Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your full name"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-sea-green focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Letterhead (Optional)</label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-sea-green-light px-4 py-2 text-sm font-medium text-slate-600 hover:bg-sea-green/10">
                  <ImageIcon size={18} />
                  <span>Upload Image</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({...formData, letterhead: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {formData.letterhead && (
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, letterhead: null})}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] text-slate-400 italic">Upload your company letterhead to appear at the top of the undertaking.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Designation</label>
              <select 
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-sea-green focus:outline-none"
              >
                <option value="Proprietor">Proprietor</option>
                <option value="Partner">Partner</option>
                <option value="Director">Director</option>
                <option value="Authorized Signatory">Authorized Signatory</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Firm Name</label>
              <input 
                type="text" 
                value={formData.firmName}
                onChange={(e) => setFormData({...formData, firmName: e.target.value})}
                placeholder="Enter your firm name"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-sea-green focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Registered Office Address</label>
              <textarea 
                value={formData.officeAddress}
                onChange={(e) => setFormData({...formData, officeAddress: e.target.value})}
                placeholder="Enter complete office address"
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-sea-green focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Bid Number</label>
              <input 
                type="text" 
                value={formData.bidNumber}
                onChange={(e) => setFormData({...formData, bidNumber: e.target.value})}
                placeholder="Enter GeM Bid Number"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-sea-green focus:outline-none"
              />
            </div>
            
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sea-green py-4 font-bold text-white shadow-lg transition-all hover:bg-sea-green-dark disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              {isExporting ? 'Generating PDF...' : 'Download Undertaking PDF'}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="bg-sea-green-light px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Document Preview</h3>
          </div>
          
          <div className="p-8 bg-white aspect-[210/297] w-full overflow-y-auto" ref={documentRef}>
            <div className="mx-auto max-w-2xl space-y-12 border border-slate-100 p-8 shadow-sm">
              {formData.letterhead && (
                <div className="mb-8 flex justify-center border-b border-slate-100 pb-8">
                  <img 
                    src={formData.letterhead} 
                    alt="Letterhead" 
                    className="max-h-32 w-full object-contain"
                  />
                </div>
              )}
              <div className="text-center">
                <h1 className="text-xl font-bold uppercase tracking-widest text-slate-900 underline decoration-sea-green underline-offset-8">
                  Non-bankruptcy Undertaking
                </h1>
              </div>

              <div className="space-y-8 text-justify text-sm leading-relaxed text-slate-800">
                <p>
                  I, <span className="font-bold border-b border-slate-300 px-2">{formData.name || '__________________'}</span>, 
                  <span className="font-bold px-2">{formData.designation}</span> of the firm, 
                  <span className="font-bold border-b border-slate-300 px-2">{formData.firmName || '______________(Firm Name)'}</span>, 
                  having Regd. Office at <span className="font-bold border-b border-slate-300 px-2">{formData.officeAddress || '________________(office Address)'}</span>, 
                  do hereby declare and confirm that 
                  <span className="font-bold italic"> “NEITHER OUR FIRM ARE UNDER LIQUIDATION, COURT RECEIVERSHIP OR SIMILAR PROCEEDINGS OR BANKRUPT” </span> 
                  in connection to the Bid Number : <span className="font-bold border-b border-slate-300 px-2">{formData.bidNumber || '______________'}</span>
                </p>
              </div>

              <div className="mt-24 flex flex-col items-end space-y-2 pt-12">
                <div className="text-center">
                  <div className="mb-2 h-px w-48 bg-slate-400"></div>
                  <p className="text-xs font-bold uppercase text-slate-500">Authorized Signatory</p>
                  <p className="text-[10px] text-slate-400 mt-1">(With Company Seal)</p>
                </div>
              </div>

              <div className="mt-12 flex justify-between text-[10px] text-slate-400">
                <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
                <p>Place: {formData.officeAddress?.split(',').pop()?.trim() || '________________'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
