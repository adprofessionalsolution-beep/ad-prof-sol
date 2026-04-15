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
  MessageCircle,
  LogOut,
  Lock,
  CheckCircle,
  Send,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { analyzeBidDocument, analyzeBidRate } from './services/gemini';
import { cn } from './lib/utils';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Tab = 'home' | 'analyzer' | 'rate-analyzer' | 'certificate' | 'escalation' | 'bankruptcy' | 'pricing' | 'tender-update' | 'blog' | 'admin';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  image?: string;
}

import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

interface UserData {
  uid?: string;
  name: string;
  email: string;
  whatsapp: string;
  password?: string;
  isAdmin?: boolean;
  plan?: string;
  status?: 'active' | 'cancelled';
  subscriptionEnd?: string;
  registrationDate?: string;
  role?: 'user' | 'admin';
  tenderSubscription?: {
    keywords: string;
    category: string;
    location: string;
    subscribedAt: string;
  };
}

interface TenderUpdate {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string;
  documentLink?: string;
  bidnumber?: string;
  department?: string;
  location?: string;
  filelink?: string;
}

function AdminDashboard() {
  const [clients, setClients] = useState<UserData[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [newBlog, setNewBlog] = useState({ title: '', content: '', image: '' });

  useEffect(() => {
    // Fetch clients from Firestore
    const unsubscribeClients = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }) as UserData);
      setClients(usersList.filter(u => u.role !== 'admin'));
    }, (error) => {
      console.error("Admin clients listener error:", error);
    });

    // Fetch blogs from Firestore
    const unsubscribeBlogs = onSnapshot(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')), (snapshot) => {
      const blogsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as BlogPost);
      setBlogs(blogsList);
    }, (error) => {
      console.error("Admin blogs listener error:", error);
    });

    // Load saved API key from Firestore
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'gemini'), (doc) => {
      if (doc.exists()) {
        setApiKey(doc.data().apiKey);
      }
    }, (error) => {
      console.error("Admin settings listener error:", error);
    });

    return () => {
      unsubscribeClients();
      unsubscribeBlogs();
      unsubscribeSettings();
    };
  }, []);

  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    try {
      await setDoc(doc(db, 'settings', 'gemini'), { apiKey }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving API key:", error);
      alert("Failed to save API key.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleAddBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const blogData = {
        title: newBlog.title,
        content: newBlog.content,
        image: newBlog.image,
        date: new Date().toLocaleDateString(),
        author: 'Admin',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'blogs'), blogData);
      setNewBlog({ title: '', content: '', image: '' });
      setShowBlogForm(false);
    } catch (error) {
      console.error("Error adding blog:", error);
      alert("Failed to add blog post.");
    }
  };

  const deleteBlog = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      try {
        await deleteDoc(doc(db, 'blogs', id));
      } catch (error) {
        console.error("Error deleting blog:", error);
        alert("Failed to delete blog post.");
      }
    }
  };

  const handleStatusChange = async (uid: string, action: 'cancel' | 'extend' | 'changePlan', newPlan?: string) => {
    const userToUpdate = clients.find(u => u.uid === uid);
    if (!userToUpdate) return;

    let updatedData: Partial<UserData> = {};
    if (action === 'cancel') {
      updatedData = { status: 'cancelled', plan: 'Free Plan' };
    } else if (action === 'extend') {
      const currentEnd = userToUpdate.subscriptionEnd ? new Date(userToUpdate.subscriptionEnd) : new Date();
      const daysToAdd = userToUpdate.plan === 'Yearly Plan' ? 365 : 30;
      const newEnd = new Date(currentEnd.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
      updatedData = { status: 'active', subscriptionEnd: newEnd };
    } else if (action === 'changePlan' && newPlan) {
      const regDate = userToUpdate.registrationDate ? new Date(userToUpdate.registrationDate) : new Date();
      const daysToAdd = newPlan === 'Yearly Plan' ? 365 : 30;
      const newEnd = new Date(regDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
      updatedData = { status: 'active', plan: newPlan, subscriptionEnd: newEnd };
    }

    try {
      await setDoc(doc(db, 'users', uid), updatedData, { merge: true });
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-slate-600">Manage client subscriptions, system settings, and blogs.</p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} className="text-sea-green" />
              <h3 className="font-bold text-slate-900">Gemini API Configuration</h3>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Gemini API Key"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-sea-green focus:ring-sea-green"
                />
              </div>
              <button 
                onClick={handleSaveApiKey}
                disabled={isSavingKey}
                className={cn(
                  "w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all shadow-md",
                  saveSuccess ? "bg-emerald-500" : "bg-slate-800 hover:bg-slate-900"
                )}
              >
                {isSavingKey ? 'Saving...' : saveSuccess ? 'Key Saved Successfully!' : 'Update API Key'}
              </button>
            </div>
          </div>

          <button 
            onClick={() => setShowBlogForm(!showBlogForm)}
            className="flex items-center justify-center gap-2 rounded-xl bg-sea-green py-3 font-bold text-white shadow-lg transition-all hover:bg-sea-green-dark"
          >
            <Plus size={20} />
            {showBlogForm ? 'Close Blog Editor' : 'Create New Blog Post'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showBlogForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden rounded-2xl border-2 border-sea-green bg-white p-6 shadow-xl"
          >
            <h3 className="mb-4 text-xl font-bold text-slate-900">New Blog Post</h3>
            <form onSubmit={handleAddBlog} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700">Title</label>
                  <input 
                    type="text" 
                    required
                    value={newBlog.title}
                    onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-sea-green focus:ring-sea-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Image URL (Optional)</label>
                  <input 
                    type="url" 
                    value={newBlog.image}
                    onChange={(e) => setNewBlog({ ...newBlog, image: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-sea-green focus:ring-sea-green"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Content</label>
                <textarea 
                  required
                  rows={4}
                  value={newBlog.content}
                  onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-sea-green focus:ring-sea-green"
                />
              </div>
              <button type="submit" className="rounded-xl bg-slate-800 px-8 py-2 font-bold text-white hover:bg-slate-900">Publish Post</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map(blog => (
          <div key={blog.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="font-bold text-slate-900">{blog.title}</h4>
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{blog.content}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{blog.date}</span>
              <button onClick={() => deleteBlog(blog.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Client Details</th>
                <th className="px-6 py-4 font-semibold">Registration Date</th>
                <th className="px-6 py-4 font-semibold">Plan</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Expires On</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No clients found.</td>
                </tr>
              ) : clients.map((client) => (
                <tr key={client.uid} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{client.name}</div>
                    <div className="text-xs text-slate-500">{client.email}</div>
                    <div className="text-xs text-slate-500">{client.whatsapp}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {client.registrationDate ? new Date(client.registrationDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset">
                      {client.plan || 'Free Plan'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", client.status === 'cancelled' ? "bg-red-50 text-red-700 ring-red-600/20" : "bg-green-50 text-green-700 ring-green-600/20")}>
                      {client.status === 'cancelled' ? 'Cancelled' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {client.subscriptionEnd ? new Date(client.subscriptionEnd).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                      <select 
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-sea-green"
                        onChange={(e) => handleStatusChange(client.uid!, 'changePlan', e.target.value)}
                        value={client.plan || 'Free Plan'}
                      >
                        <option value="Free Plan">Free Plan</option>
                        <option value="Pro Monthly">Pro Monthly</option>
                        <option value="Yearly Plan">Yearly Plan</option>
                      </select>
                      <button
                        onClick={() => handleStatusChange(client.uid!, 'extend')}
                        className="rounded-lg bg-sea-green px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600"
                      >
                        Extend Plan
                      </button>
                      <button
                        onClick={() => handleStatusChange(client.uid!, 'cancel')}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ADPSLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 360" className={className} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(0, 10)">
        {/* Left Leg - Left Half (Bright Green) */}
        <path d="M 200 20 L 60 220 L 95 220 L 200 65 Z" fill="#00cc44" />
        
        {/* Left Leg - Right Half (Medium Green) */}
        <path d="M 200 65 L 95 220 L 130 220 L 200 110 Z" fill="#00a651" />
        
        {/* Right Leg - Left Half (Dark Green) */}
        <path d="M 200 65 L 200 110 L 270 220 L 305 220 Z" fill="#00862d" />
        
        {/* Right Leg - Right Half (Darker Green) */}
        <path d="M 200 20 L 200 65 L 305 220 L 340 220 Z" fill="#006622" />

        {/* Crossbar Top Half (Bright Green) */}
        <path d="M 174.5 150 L 225.5 150 L 238.2 170 L 161.8 170 Z" fill="#00b33c" />
        
        {/* Crossbar Bottom Half (Dark Green) */}
        <path d="M 161.8 170 L 238.2 170 L 251 190 L 149 190 Z" fill="#007a27" />
        
        {/* Inner Shadow (Depth of the hole on the right side) */}
        <path d="M 200 110 L 200 150 L 225.5 150 Z" fill="#004d1a" />
      </g>
      
      {/* Text */}
      <text x="200" y="330" fontFamily="Arial, Helvetica, sans-serif" fontSize="100" fontWeight="900" fill="#00862d" textAnchor="middle" letterSpacing="4">ADPS</text>
    </svg>
  );
}

function BlogView() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')), (snapshot) => {
      const blogsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as BlogPost);
      setBlogs(blogsList);
    }, (error) => {
      console.error("BlogView listener error:", error);
    });
    return () => unsubscribe();
  }, []);

  if (selectedBlog) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <button 
          onClick={() => setSelectedBlog(null)}
          className="flex items-center gap-2 font-bold text-sea-green hover:underline"
        >
          <ChevronRight className="rotate-180" size={20} /> Back to Blogs
        </button>
        
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          {selectedBlog.image && (
            <img 
              src={selectedBlog.image} 
              alt={selectedBlog.title} 
              className="h-64 w-full object-cover md:h-96"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="p-6 md:p-12">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>{selectedBlog.date}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300"></span>
              <span>By {selectedBlog.author}</span>
            </div>
            <h1 className="mt-4 text-2xl font-black text-slate-900 md:text-5xl">{selectedBlog.title}</h1>
            <div className="mt-8 whitespace-pre-wrap text-base sm:text-lg leading-relaxed text-slate-600">
              {selectedBlog.content}
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      <div className="text-center">
        <h2 className="text-4xl font-black tracking-tight text-slate-900">Expert Insights & Updates</h2>
        <p className="mt-4 text-slate-500 text-lg">Stay updated with the latest trends in GeM and Government Tendering.</p>
      </div>

      {blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <FileText size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No blog posts yet</h3>
          <p className="mt-2 text-slate-500">Check back soon for expert articles and guides.</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog, idx) => (
            <motion.div 
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedBlog(blog)}
              className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all hover:border-sea-green/30 hover:shadow-xl"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                {blog.image ? (
                  <img 
                    src={blog.image} 
                    alt={blog.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <ImageIcon size={48} />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{blog.date}</span>
                </div>
                <h3 className="mt-3 text-xl font-bold text-slate-900 group-hover:text-sea-green transition-colors line-clamp-2">
                  {blog.title}
                </h3>
                <p className="mt-3 text-sm text-slate-500 line-clamp-3">
                  {blog.content}
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-sea-green">
                  Read More <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBidDocsOpen, setIsBidDocsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupMode, setSignupMode] = useState<'signup' | 'login' | 'admin'>('signup');
  const [showContact, setShowContact] = useState(false);
  const [tenderUpdates, setTenderUpdates] = useState<TenderUpdate[]>([]);
  const [isTendersLoading, setIsTendersLoading] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    let unsubscribeSettings: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          setUser({ ...userData, uid: firebaseUser.uid, isAdmin: userData.role === 'admin' || firebaseUser.email === 'anuscyberwork@gmail.com' });
        } else {
          // If user exists in Auth but not in Firestore (shouldn't happen with our flow but good to handle)
          setUser({ 
            uid: firebaseUser.uid, 
            email: firebaseUser.email || '', 
            name: firebaseUser.displayName || 'User',
            whatsapp: '',
            plan: 'Free Plan',
            status: 'active',
            isAdmin: firebaseUser.email === 'anuscyberwork@gmail.com'
          });
        }

        // Start settings listener only when authenticated
        if (!unsubscribeSettings) {
          unsubscribeSettings = onSnapshot(doc(db, 'settings', 'gemini'), (doc) => {
            if (doc.exists()) {
              setGeminiApiKey(doc.data().apiKey);
            }
          }, (error) => {
            console.error("Settings listener error:", error);
          });
        }
      } else {
        setUser(null);
        if (unsubscribeSettings) {
          unsubscribeSettings();
          unsubscribeSettings = null;
        }
      }
      setIsAuthReady(true);
    });

    return () => {
      if (unsubscribeSettings) unsubscribeSettings();
      unsubscribeAuth();
    };
  }, []);
  useEffect(() => {
    const now = new Date();
    const datePattern = /(\d{2})-(\d{2})-(\d{4})/;

    const filterExpired = (updates: TenderUpdate[]) => {
      return updates.filter(u => {
        const match = u.title.match(datePattern) || u.description.match(datePattern);
        if (match) {
          const [_, day, month, year] = match;
          const expiryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          expiryDate.setHours(23, 59, 59, 999);
          return now <= expiryDate;
        }
        return true;
      });
    };

    setIsTendersLoading(true);
    const unsubscribe = onSnapshot(query(collection(db, 'tenders'), orderBy('createdAt', 'desc')), (snapshot) => {
      const tendersList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as TenderUpdate);
      setTenderUpdates(filterExpired(tendersList));
      setIsTendersLoading(false);
    }, (error) => {
      console.error("Tenders listener error:", error);
      setIsTendersLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTabClick = (tab: Tab) => {
    console.log("Tab clicked:", tab);
    if (!user && tab !== 'home' && tab !== 'pricing' && tab !== 'tender-update' && tab !== 'blog') {
      setSignupMode('signup');
      setShowSignup(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleSignup = (data: UserData) => {
    setUser(data);
    setShowSignup(false);
  };

  const handleUpdateUser = async (updatedData: UserData) => {
    setUser(updatedData);
    if (updatedData.uid) {
      try {
        await setDoc(doc(db, 'users', updatedData.uid), updatedData, { merge: true });
      } catch (error) {
        console.error("Error updating user in Firestore:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setActiveTab('home');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const addTenderUpdate = async (update: Omit<TenderUpdate, 'id' | 'date'>) => {
    try {
      const tenderData = {
        ...update,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'tenders'), tenderData);
    } catch (error) {
      console.error("Error adding tender to Firestore:", error);
      alert("Failed to add tender update.");
    }
  };

  const deleteTenderUpdate = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tenders', id));
    } catch (error) {
      console.error("Error deleting tender from Firestore:", error);
      alert("Failed to delete tender update.");
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  if (!isAuthReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-sea-green" />
          <p className="font-bold text-slate-600">Loading ADPS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/message/44V2N2KT67HMO1" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all hover:scale-110 active:scale-95"
        title="Chat on WhatsApp"
      >
        <MessageCircle size={32} fill="currentColor" className="text-white" />
        <span className="absolute -top-2 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce">1</span>
      </a>

      <AnimatePresence>
        {showSignup && (
          <SignupModal 
            onSignup={handleSignup} 
            onClose={() => setShowSignup(false)} 
            initialMode={signupMode}
          />
        )}
        {showContact && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl z-10"
            >
              <ContactModal onClose={() => setShowContact(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div 
            className="flex cursor-pointer items-center gap-3"
            onClick={() => handleTabClick('home')}
          >
            <ADPSLogo className="h-12 w-12" />
            <span className="hidden text-xl font-black tracking-tighter text-slate-900 sm:block">
              A D <span className="text-sea-green">Professional Solution</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            <button 
              onClick={() => handleTabClick('home')}
              className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'home' ? "text-sea-green" : "text-slate-600")}
            >
              Home
            </button>
            <button 
              onClick={() => handleTabClick('analyzer')}
              className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'analyzer' ? "text-sea-green" : "text-slate-600")}
            >
              AI Bid Analyzer
            </button>
            <button 
              onClick={() => handleTabClick('rate-analyzer')}
              className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'rate-analyzer' ? "text-sea-green" : "text-slate-600")}
            >
              Bid Rate Analyzer
            </button>
            <button 
              onClick={() => handleTabClick('tender-update')}
              className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'tender-update' ? "text-sea-green" : "text-slate-600")}
            >
              Tender Update
            </button>
            <button 
              onClick={() => handleTabClick('blog')}
              className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'blog' ? "text-sea-green" : "text-slate-600")}
            >
              Blog
            </button>
            
            {/* Bid Documents Column */}
            <div className="flex flex-col gap-1.5 border-l-2 border-sea-green/20 pl-6 py-1">
              <button 
                onClick={() => setIsBidDocsOpen(!isBidDocsOpen)}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 hover:text-sea-green transition-colors"
              >
                Bid Documents
                <ChevronDown size={12} className={cn("transition-transform", isBidDocsOpen ? "rotate-180" : "")} />
              </button>
              <AnimatePresence>
                {isBidDocsOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-1.5 overflow-hidden"
                  >
                    <button 
                      onClick={() => handleTabClick('certificate')}
                      className={cn("text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-sea-green text-left", activeTab === 'certificate' ? "text-sea-green" : "text-slate-600")}
                    >
                      MII Certificate
                    </button>
                    <button 
                      onClick={() => handleTabClick('escalation')}
                      className={cn("text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-sea-green text-left", activeTab === 'escalation' ? "text-sea-green" : "text-slate-600")}
                    >
                      Escalation Matrix
                    </button>
                    <button 
                      onClick={() => handleTabClick('bankruptcy')}
                      className={cn("text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-sea-green text-left", activeTab === 'bankruptcy' ? "text-sea-green" : "text-slate-600")}
                    >
                      Non-bankruptcy
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => handleTabClick('pricing')}
              className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'pricing' ? "text-sea-green" : "text-slate-600")}
            >
              Pricing
            </button>
            <button 
              onClick={() => setShowContact(true)}
              className="text-sm font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-sea-green"
            >
              Contact Us
            </button>
            {user?.isAdmin && (
              <button 
                onClick={() => handleTabClick('admin')}
                className={cn("text-sm font-bold uppercase tracking-wider transition-colors hover:text-sea-green", activeTab === 'admin' ? "text-sea-green" : "text-slate-600")}
              >
                Admin
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-3 border-l border-slate-100 pl-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sea-green-light text-sea-green font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-slate-400">{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
                <button 
                  onClick={() => {
                    setSignupMode('login');
                    setShowSignup(true);
                  }}
                  className="text-sm font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-sea-green"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => {
                    setSignupMode('signup');
                    setShowSignup(true);
                  }}
                  className="rounded-xl bg-sea-green px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-opacity-90 hover:shadow-sea-green/20 active:scale-95"
                >
                  Sign Up
                </button>
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
                <button 
                  onClick={() => { handleTabClick('home'); setIsMenuOpen(false); }} 
                  className={cn(
                    "rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider transition-colors",
                    activeTab === 'home' ? "bg-sea-green text-white" : "text-slate-600 hover:bg-sea-green-light"
                  )}
                >
                  Home
                </button>
                <button 
                  onClick={() => { handleTabClick('analyzer'); setIsMenuOpen(false); }} 
                  className={cn(
                    "rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider transition-colors",
                    activeTab === 'analyzer' ? "bg-sea-green text-white" : "text-slate-600 hover:bg-sea-green-light"
                  )}
                >
                  AI Bid Analyzer
                </button>
                <button 
                  onClick={() => { handleTabClick('rate-analyzer'); setIsMenuOpen(false); }} 
                  className={cn(
                    "rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider transition-colors",
                    activeTab === 'rate-analyzer' ? "bg-sea-green text-white" : "text-slate-600 hover:bg-sea-green-light"
                  )}
                >
                  Bid Rate Analyzer
                </button>
                <button 
                  onClick={() => { handleTabClick('tender-update'); setIsMenuOpen(false); }} 
                  className={cn(
                    "rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider transition-colors",
                    activeTab === 'tender-update' ? "bg-sea-green text-white" : "text-slate-600 hover:bg-sea-green-light"
                  )}
                >
                  Tender Update
                </button>
                <button 
                  onClick={() => { handleTabClick('blog'); setIsMenuOpen(false); }} 
                  className={cn(
                    "rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider transition-colors",
                    activeTab === 'blog' ? "bg-sea-green text-white" : "text-slate-600 hover:bg-sea-green-light"
                  )}
                >
                  Blog
                </button>
                
                <div className="border-y border-sea-green-light py-2">
                  <button 
                    onClick={() => setIsBidDocsOpen(!isBidDocsOpen)}
                    className="flex w-full items-center justify-between px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-sea-green transition-colors"
                  >
                    Bid Documents
                    <ChevronDown size={14} className={cn("transition-transform", isBidDocsOpen ? "rotate-180" : "")} />
                  </button>
                  <AnimatePresence>
                    {isBidDocsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <button onClick={() => { handleTabClick('certificate'); setIsMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left font-bold text-slate-600 hover:bg-sea-green-light"><FileCheck size={18} /> MII Certificate</button>
                        <button onClick={() => { handleTabClick('escalation'); setIsMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left font-bold text-slate-600 hover:bg-sea-green-light"><Users size={18} /> Escalation Matrix</button>
                        <button onClick={() => { handleTabClick('bankruptcy'); setIsMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left font-bold text-slate-600 hover:bg-sea-green-light"><Scale size={18} /> Non-bankruptcy</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={() => { handleTabClick('pricing'); setIsMenuOpen(false); }} 
                  className={cn(
                    "rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider transition-colors",
                    activeTab === 'pricing' ? "bg-sea-green text-white" : "text-slate-600 hover:bg-sea-green-light"
                  )}
                >
                  Pricing
                </button>
                <button 
                  onClick={() => { setShowContact(true); setIsMenuOpen(false); }} 
                  className="rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-600 hover:bg-sea-green-light"
                >
                  Contact Us
                </button>
                {user ? (
                  <>
                    {user.isAdmin && (
                      <button onClick={() => { handleTabClick('admin'); setIsMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-600 hover:bg-sea-green-light">Admin</button>
                    )}
                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-sea-green-light p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sea-green text-white font-bold text-xl">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                          <p className="text-[10px] text-sea-green font-medium mt-1">{user.whatsapp}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-500 shadow-sm hover:bg-red-50 transition-colors"
                        title="Logout"
                      >
                        <LogOut size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 flex flex-col gap-3">
                    <button 
                      onClick={() => { setSignupMode('login'); setShowSignup(true); setIsMenuOpen(false); }}
                      className="rounded-xl border border-slate-200 py-4 text-center font-bold uppercase tracking-widest text-slate-600"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => { setSignupMode('signup'); setShowSignup(true); setIsMenuOpen(false); }}
                      className="rounded-xl bg-sea-green py-4 text-center font-black uppercase tracking-widest text-white shadow-lg"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'home' && <HomeView onServiceClick={(tab) => handleTabClick(tab)} />}
        {activeTab === 'analyzer' && (
          user?.isAdmin || user?.plan === 'Pro Monthly' || user?.plan === 'Yearly Plan' ? (
            <AnalyzerView user={user} apiKey={geminiApiKey} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Lock size={48} className="mb-4 text-slate-300" />
              <h2 className="text-2xl font-bold text-slate-900">Premium Feature</h2>
              <p className="mt-2 text-slate-500">Upgrade to Pro or Yearly plan to access AI Bid Analyzer.</p>
              <button onClick={() => handleTabClick('pricing')} className="mt-6 rounded-xl bg-sea-green px-6 py-3 font-bold text-white shadow-lg hover:bg-sea-green-dark">View Plans</button>
            </div>
          )
        )}
        {activeTab === 'rate-analyzer' && (
          user?.isAdmin || user?.plan === 'Pro Monthly' || user?.plan === 'Yearly Plan' ? (
            <BidRateAnalyzerView apiKey={geminiApiKey} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Lock size={48} className="mb-4 text-slate-300" />
              <h2 className="text-2xl font-bold text-slate-900">Premium Feature</h2>
              <p className="mt-2 text-slate-500">Upgrade to Pro or Yearly plan to access Bid Rate Analyzer.</p>
              <button onClick={() => handleTabClick('pricing')} className="mt-6 rounded-xl bg-sea-green px-6 py-3 font-bold text-white shadow-lg hover:bg-sea-green-dark">View Plans</button>
            </div>
          )
        )}
        {activeTab === 'tender-update' && (
          <TenderUpdateView 
            user={user} 
            updates={tenderUpdates} 
            onAddUpdate={addTenderUpdate} 
            onDeleteUpdate={deleteTenderUpdate}
            isLoadingTenders={isTendersLoading}
          />
        )}
        {activeTab === 'blog' && <BlogView />}
        {activeTab === 'certificate' && (
          user?.isAdmin || user?.plan === 'Pro Monthly' || user?.plan === 'Yearly Plan' ? (
            <CertificateView />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Lock size={48} className="mb-4 text-slate-300" />
              <h2 className="text-2xl font-bold text-slate-900">Premium Feature</h2>
              <p className="mt-2 text-slate-500">Upgrade to Pro or Yearly plan to access MII Certificate Generator.</p>
              <button onClick={() => handleTabClick('pricing')} className="mt-6 rounded-xl bg-sea-green px-6 py-3 font-bold text-white shadow-lg hover:bg-sea-green-dark">View Plans</button>
            </div>
          )
        )}
        {activeTab === 'escalation' && (
          user?.isAdmin || user?.plan === 'Pro Monthly' || user?.plan === 'Yearly Plan' ? (
            <EscalationView />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Lock size={48} className="mb-4 text-slate-300" />
              <h2 className="text-2xl font-bold text-slate-900">Premium Feature</h2>
              <p className="mt-2 text-slate-500">Upgrade to Pro or Yearly plan to access Escalation Matrix.</p>
              <button onClick={() => handleTabClick('pricing')} className="mt-6 rounded-xl bg-sea-green px-6 py-3 font-bold text-white shadow-lg hover:bg-sea-green-dark">View Plans</button>
            </div>
          )
        )}
        {activeTab === 'bankruptcy' && (
          user?.isAdmin || user?.plan === 'Pro Monthly' || user?.plan === 'Yearly Plan' ? (
            <NonBankruptcyView />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Lock size={48} className="mb-4 text-slate-300" />
              <h2 className="text-2xl font-bold text-slate-900">Premium Feature</h2>
              <p className="mt-2 text-slate-500">Upgrade to Pro or Yearly plan to access Non-bankruptcy Certificate.</p>
              <button onClick={() => handleTabClick('pricing')} className="mt-6 rounded-xl bg-sea-green px-6 py-3 font-bold text-white shadow-lg hover:bg-sea-green-dark">View Plans</button>
            </div>
          )
        )}
        {activeTab === 'pricing' && <PricingView user={user} onUpdateUser={handleUpdateUser} onLoginRequest={() => setShowSignup(true)} />}
        {activeTab === 'admin' && user?.isAdmin && <AdminDashboard />}
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
                <li>Email: adprofessionalsolution@gmail.com</li>
                <li>Address: North 24 Parganas, West Bengal, India, 743145</li>
                <li className="pt-2">
                  <a 
                    href="https://wa.me/message/44V2N2KT67HMO1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-bold text-sea-green hover:underline"
                  >
                    <MessageCircle size={16} fill="currentColor" />
                    WhatsApp Us
                  </a>
                </li>
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
      <section className="relative overflow-hidden rounded-3xl bg-sea-green-dark px-6 py-12 sm:px-8 sm:py-20 text-white">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sea-green/20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sea-green/20 blur-3xl"></div>
        
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-extrabold tracking-tight sm:text-6xl"
          >
            Empowering Your Business in <span className="text-sea-green-light">Government Tendering</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-base sm:text-lg text-sea-green-light/80"
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
              className="w-full sm:w-auto rounded-full bg-white px-8 py-4 font-bold text-sea-green-dark shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              View Subscription Plans
            </button>
            <button 
              onClick={() => onServiceClick('analyzer')}
              className="w-full sm:w-auto rounded-full border border-sea-green/40 bg-sea-green-dark/50 px-8 py-4 font-bold text-white backdrop-blur-sm transition-all hover:bg-sea-green active:scale-95"
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

      {/* Service Areas Section (SEO Optimized) */}
      <section className="border-t border-slate-100 pt-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Leading <span className="text-sea-green">GeM Consultant</span> in Kanchrapara & West Bengal
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-slate-500">
            A D Professional Solution is a premier GeM consultant based in <strong>Kanchrapara</strong>, North 24 Parganas. 
            We provide expert guidance for the <strong>GeM</strong> (Government e-Marketplace) portal and comprehensive 
            Government Tendering services across all districts of West Bengal.
          </p>
        </div>

        <div className="mt-12 rounded-3xl bg-slate-50 p-8 md:p-12">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Serving All Districts of West Bengal:</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[
              "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", 
              "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", 
              "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", 
              "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", 
              "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", 
              "Uttar Dinajpur"
            ].map((district) => (
              <div key={district} className="flex items-center gap-2 text-sm text-slate-600">
                <div className="h-1.5 w-1.5 rounded-full bg-sea-green"></div>
                {district}
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm leading-relaxed text-slate-500 italic">
            Whether you are looking for a GeM consultant in Kolkata, assistance with tenders in Howrah, 
            or catalog management in Siliguri, A D Professional Solution is here to help your business grow 
            through government procurement. Our Kanchrapara office serves as a hub for professional 
            consultation for vendors across the state.
          </p>
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

function ContactModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="relative bg-sea-green p-6 text-center text-white">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-white/80 hover:text-white"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black tracking-tight">Contact Us</h2>
      </div>

      <div className="w-full h-[500px] sm:h-[600px] bg-slate-50 relative">
        <iframe 
          src="https://docs.google.com/forms/d/e/1FAIpQLSddX0yFMdWoAVS2maMCEj4usU5s9cTKfqwAGx7352tfdn-9qg/viewform?embedded=true" 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          marginHeight={0} 
          marginWidth={0}
          title="Contact Us Form"
        >
          Loading…
        </iframe>
        
        <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 sm:px-6">
          <a 
            href="https://wa.me/message/44V2N2KT67HMO1" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 sm:gap-3 rounded-full bg-[#25D366] px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <MessageCircle size={20} fill="currentColor" />
            Chat with us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function SignupModal({ onSignup, onClose, initialMode = 'signup' }: { 
  onSignup: (data: UserData) => void, 
  onClose: () => void,
  initialMode?: 'signup' | 'login' | 'admin'
}) {
  const [isAdminMode, setIsAdminMode] = useState(initialMode === 'admin');
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: Code & New Password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    isAdmin: false,
    plan: 'Free Plan',
    status: 'active',
    subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    registrationDate: new Date().toISOString()
  });
  const [adminKey, setAdminKey] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();
      if (data.success) {
        setResetStep(2);
        alert('Reset code sent to your email.');
      } else {
        alert(data.error || 'Failed to send reset code.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: resetCode })
      });
      const data = await response.json();
      if (data.success) {
        // Update password in localStorage
        const users = JSON.parse(localStorage.getItem('ad_pro_users') || '[]');
        const userIndex = users.findIndex((u: UserData) => u.email === formData.email);
        
        if (userIndex !== -1) {
          users[userIndex].password = newPassword;
          localStorage.setItem('ad_pro_users', JSON.stringify(users));
          alert('Password reset successful. Please login with your new password.');
          setIsForgotMode(false);
          setIsLoginMode(true);
          setResetStep(1);
          setResetCode('');
          setNewPassword('');
        } else {
          alert('User not found in local records.');
        }
      } else {
        alert(data.error || 'Invalid or expired code.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminMode) {
      setIsLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password || '');
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          onSignup({ ...userDoc.data() as UserData, uid: userCredential.user.uid, isAdmin: true });
        } else if (formData.email === 'anuscyberwork@gmail.com' && adminKey === 'Memsaheb@93') {
          onSignup({ ...formData, name: 'Admin User', isAdmin: true });
        } else {
          alert('Not authorized as admin');
        }
      } catch (err: any) {
        if (formData.email === 'anuscyberwork@gmail.com' && adminKey === 'Memsaheb@93') {
          onSignup({ ...formData, name: 'Admin User', isAdmin: true });
        } else {
          alert(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    } else if (isLoginMode) {
      setIsLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password || '');
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          onSignup({ ...userDoc.data() as UserData, uid: userCredential.user.uid });
        } else {
          onSignup({ uid: userCredential.user.uid, email: userCredential.user.email || '', name: userCredential.user.displayName || 'User', whatsapp: '', plan: 'Free Plan', status: 'active' });
        }
      } catch (err: any) {
        alert(err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (formData.name && formData.email && formData.whatsapp && formData.password) {
        setIsLoading(true);
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          const userData = {
            uid: userCredential.user.uid,
            name: formData.name,
            email: formData.email,
            whatsapp: formData.whatsapp,
            plan: formData.plan || 'Free Plan',
            status: formData.status || 'active',
            expiresAt: formData.subscriptionEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            role: 'user'
          };
          await setDoc(doc(db, 'users', userCredential.user.uid), userData);
          
          try {
            await fetch('/api/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
            });
          } catch (err) {
            console.error('Error sending signup email', err);
          }

          onSignup(userData as any);
        } catch (err: any) {
          alert(err.message);
        } finally {
          setIsLoading(false);
        }
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
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl scrollbar-hide"
      >
        <div className={cn("relative p-8 text-center text-white transition-colors", isAdminMode ? "bg-slate-800" : "bg-sea-green")}>
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            {isAdminMode ? <ShieldCheck size={32} /> : <Users size={32} />}
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {isAdminMode ? 'Admin Portal' : isForgotMode ? 'Reset Password' : isLoginMode ? 'Welcome Back' : 'Welcome to A D Professional Solution'}
          </h2>
          <p className="mt-2 text-sea-green-light/80">
            {isAdminMode ? 'Enter your credentials to manage tenders' : isForgotMode ? 'Follow the steps to recover your account' : isLoginMode ? 'Please login to continue' : 'Please sign up to access all professional tools'}
          </p>
        </div>
        
        {isForgotMode ? (
          <form onSubmit={resetStep === 1 ? handleForgotPassword : handleResetPassword} className="space-y-6 p-8">
            {resetStep === 1 ? (
              <div className="space-y-4">
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
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sea-green py-4 font-bold text-white shadow-lg transition-all hover:bg-sea-green-dark active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Verification Code</label>
                  <input 
                    type="text" 
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sea-green py-4 font-bold text-white shadow-lg transition-all hover:bg-sea-green-dark active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            )}
            <button 
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setResetStep(1);
              }}
              className="w-full text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 p-8">
          {!isAdminMode ? (
            <div className="space-y-4">
              {!isLoginMode && (
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
              )}
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
              {!isLoginMode && (
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
              )}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Password</label>
                  {isLoginMode && (
                    <button 
                      type="button"
                      onClick={() => setIsForgotMode(true)}
                      className="text-[10px] font-bold text-sea-green hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Admin Email</label>
                  <button 
                    type="button"
                    onClick={() => setIsForgotMode(true)}
                    className="text-[10px] font-bold text-slate-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="adprofessionalsolution@gmail.com"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-800 focus:ring-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Admin Password</label>
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
            disabled={isLoading}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-lg transition-all active:scale-95",
              isAdminMode ? "bg-slate-800 hover:bg-slate-900" : "bg-sea-green hover:bg-sea-green-dark",
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            )}
          >
            {isLoading ? 'Processing...' : isAdminMode ? 'Login as Admin' : isLoginMode ? 'Login' : 'Get Started'}
            {!isLoading && <ChevronRight size={20} />}
          </button>
          
          <div className="flex flex-col items-center gap-3">
            {!isAdminMode && (
              <button 
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-xs font-bold text-sea-green hover:text-sea-green-dark"
              >
                {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </button>
            )}
            <button 
              type="button"
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setIsLoginMode(false);
                setIsForgotMode(false);
              }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              {isAdminMode ? 'Back to User Portal' : 'Admin Login'}
            </button>
          </div>
        </form>
      )}
      </motion.div>
    </motion.div>
  );
}

function TenderUpdateView({ user, updates, onAddUpdate, onDeleteUpdate, isLoadingTenders }: { 
  user: UserData | null, 
  updates: TenderUpdate[], 
  onAddUpdate: (update: Omit<TenderUpdate, 'id' | 'date'>) => void,
  onDeleteUpdate: (id: string) => void,
  isLoadingTenders: boolean
}) {
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: '', category: 'Goods', description: '', documentLink: '', location: '' });

  const districts = [
    "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", 
    "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", 
    "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", 
    "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", 
    "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", 
    "Uttar Dinajpur"
  ];

  useEffect(() => {
    if (user?.tenderSubscription) {
      setKeywords(user.tenderSubscription.keywords || '');
      setCategory(user.tenderSubscription.category || 'All');
      setLocation(user.tenderSubscription.location || 'All');
      setIsSubscribed(true);
    }
  }, [user]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to subscribe to updates.");
      return;
    }
    setIsLoading(true);
    try {
      const subscriptionData = {
        keywords,
        category,
        location,
        subscribedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid!), { tenderSubscription: subscriptionData }, { merge: true });
      setIsSubscribed(true);
    } catch (error) {
      console.error("Error subscribing:", error);
      alert("Failed to save subscription settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUpdate.title && newUpdate.description) {
      onAddUpdate(newUpdate);
      setNewUpdate({ title: '', category: 'Goods', description: '', documentLink: '', location: '' });
      setShowAdminForm(false);
    }
  };

  const openWhatsApp = () => {
    const emailText = user?.email ? ` My email is ${user.email}.` : '';
    const message = encodeURIComponent(`Hello A D Professional Solution, I want to receive tender updates for: ${keywords || 'All Tenders'} in category: ${category} and location: ${location}.${emailText}`);
    window.open(`https://wa.me/message/44V2N2KT67HMO1?text=${message}`, '_blank');
  };

  const filteredUpdates = updates.filter(u => {
    const categoryMatch = category === 'All' || u.category === category;
    const locationMatch = location === 'All' || u.location === location;
    const keywordMatch = !keywords || 
      u.title.toLowerCase().includes(keywords.toLowerCase()) || 
      u.description.toLowerCase().includes(keywords.toLowerCase());
    
    // Auto-delete (hide) logic: check for date in title or description (DD-MM-YYYY)
    const datePattern = /(\d{2})-(\d{2})-(\d{4})/;
    const titleMatch = u.title.match(datePattern);
    const descMatch = u.description.match(datePattern);
    const match = titleMatch || descMatch;
    
    let isExpired = false;
    if (match) {
      const [_, day, month, year] = match;
      const expiryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      expiryDate.setHours(23, 59, 59, 999);
      isExpired = new Date() > expiryDate;
    }

    return categoryMatch && locationMatch && keywordMatch && !isExpired;
  });

  const maskBidId = (text: string) => {
    if (!text) return text;
    // Matches patterns like GEM/2024/B/1234567 or GEM/2026/B/1234567
    // Improved regex to handle variations and ensure it catches the ID
    return text.replace(/GEM\/\d{4}\/[A-Z]\/\d+/gi, "GEM/2026/B/XXXXXXX");
  };

  const isUserLoggedIn = !!user && !!user.email;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-0">
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
                  <label className="block text-sm font-bold text-slate-700">Bid ID & Date</label>
                  <input 
                    type="text" 
                    required
                    value={newUpdate.title}
                    onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                    placeholder="e.g., GEM/2026/B/1234567 - 30 Mar 2026"
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
                <div>
                  <label className="block text-sm font-bold text-slate-700">Location</label>
                  <select 
                    value={newUpdate.location}
                    onChange={(e) => setNewUpdate({ ...newUpdate, location: e.target.value })}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                  >
                    <option value="">Select Location</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Document Link (Optional)</label>
                  <input 
                    type="url" 
                    value={newUpdate.documentLink}
                    onChange={(e) => setNewUpdate({ ...newUpdate, documentLink: e.target.value })}
                    placeholder="https://example.com/tender-doc.pdf"
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
                  />
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Updates Column - Now first on mobile */}
        <div className="order-1 lg:order-2 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Latest Tender Updates</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Clock size={14} />
              Last updated: Today
            </div>
          </div>

          <div className="space-y-4">
            {isLoadingTenders ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-6">
                  <div className="h-4 w-24 rounded bg-slate-200"></div>
                  <div className="mt-4 h-6 w-3/4 rounded bg-slate-200"></div>
                  <div className="mt-2 h-4 w-full rounded bg-slate-200"></div>
                </div>
              ))
            ) : filteredUpdates.length > 0 ? filteredUpdates.map((update) => (
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
                      {update.location && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                          {update.location}
                        </span>
                      )}
                      {update.bidnumber && (
                        <span className="text-[10px] font-bold text-slate-500">
                          ID: {isUserLoggedIn ? update.bidnumber : "GEM/2026/B/XXXXXXX"}
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-slate-400">
                        {update.date}
                      </span>
                    </div>
                    <h4 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-sea-green transition-colors">
                      {isUserLoggedIn ? update.title : maskBidId(update.title)}
                    </h4>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                      {isUserLoggedIn ? update.description : maskBidId(update.description)}
                    </p>
                    {update.documentLink && (
                      isUserLoggedIn ? (
                        <a 
                          href={update.documentLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-sea-green hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          Download tender document
                        </a>
                      ) : (
                        <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-slate-400">
                          <Lock size={16} /> Login to Download
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {user?.isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteUpdate(update.id);
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-400 transition-all hover:bg-red-500 hover:text-white"
                        title="Delete Tender"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-sea-green hover:text-white">
                      <ChevronRight size={20} />
                    </button>
                  </div>
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

        {/* Subscription Column - Now second on mobile */}
        <div className="order-2 lg:order-1 lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-6">
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
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Location</label>
                    <select 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-sea-green focus:ring-sea-green"
                    >
                      <option value="All">All Locations</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
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
      </div>
    </div>
  );
}

function AnalyzerView({ user, apiKey }: { user: UserData | null, apiKey: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) {
      const timer = setTimeout(() => {
        setFile(null);
        setResult(null);
        setError("Session expired. Uploaded document was deleted automatically after 10 minutes for security.");
      }, 10 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [file]);

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
      const analysis = await analyzeBidDocument(text, apiKey);
      setResult(analysis);
      
      // Save analysis to Firestore if user is logged in
      if (user?.uid) {
        try {
          await addDoc(collection(db, 'users', user.uid, 'analyses'), {
            fileName: file.name,
            timestamp: new Date().toISOString(),
            result: analysis
          });
        } catch (fsErr) {
          console.error("Error saving analysis to Firestore:", fsErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('429')) {
        setError("AI API quota exceeded. Please try again in a minute or check your API key billing details.");
      } else {
        setError(err.message || "An error occurred during analysis.");
      }
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

      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 sm:p-12 text-center transition-colors hover:border-sea-green/30">
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Analysis Result</h3>
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

function BidRateAnalyzerView({ apiKey }: { apiKey: string }) {
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [materialCost, setMaterialCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [profitMargin, setProfitMargin] = useState('');
  const [competitionLevel, setCompetitionLevel] = useState('Medium');
  const [projectDuration, setProjectDuration] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scopeOfWork) {
      const timer = setTimeout(() => {
        setScopeOfWork('');
        setResult(null);
        setError("Session expired. Uploaded document text was deleted automatically after 10 minutes for security.");
      }, 10 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [scopeOfWork]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Please upload a valid PDF file.");
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const text = await extractTextFromPDF(file);
      setScopeOfWork(text);
    } catch (err) {
      console.error("Error extracting text from PDF:", err);
      setError("Failed to extract text from the PDF. Please try pasting the text manually.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAnalyze = async () => {
    if (!scopeOfWork || !estimatedValue) {
      setError("Please provide both Scope of Work and Estimated Bid Value.");
      return;
    }
    
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const analysis = await analyzeBidRate(
        scopeOfWork, 
        estimatedValue,
        materialCost,
        laborCost,
        profitMargin,
        competitionLevel,
        projectDuration,
        apiKey
      );
      setResult(analysis);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('429')) {
        setError("AI API quota exceeded. Please try again in a minute or check your API key billing details.");
      } else {
        setError(err.message || "An error occurred during analysis.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Advanced Bid Rate Analyzer</h2>
        <p className="mt-2 text-slate-500">Provide detailed project estimates to get a highly accurate, competitive bidding strategy.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-700">Scope of Work <span className="text-red-500">*</span></label>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="flex items-center gap-1 text-xs font-bold text-sea-green hover:text-sea-green-dark disabled:opacity-50"
              >
                {isExtracting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {isExtracting ? 'Extracting...' : 'Upload PDF'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />
            </div>
            <textarea 
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              placeholder="Paste the detailed scope of work here or upload a PDF..."
              rows={4}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">Estimated Bid Value (₹) <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="e.g., 50,00,000"
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Project Duration (Months)</label>
              <input 
                type="text" 
                value={projectDuration}
                onChange={(e) => setProjectDuration(e.target.value)}
                placeholder="e.g., 6"
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">Material Cost (₹)</label>
              <input 
                type="text" 
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
                placeholder="e.g., 20,00,000"
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Labor Cost (₹)</label>
              <input 
                type="text" 
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="e.g., 15,00,000"
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">Target Profit Margin (%)</label>
              <input 
                type="text" 
                value={profitMargin}
                onChange={(e) => setProfitMargin(e.target.value)}
                placeholder="e.g., 15"
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Competition Level</label>
              <select
                value={competitionLevel}
                onChange={(e) => setCompetitionLevel(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sea-green focus:ring-sea-green"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !scopeOfWork || !estimatedValue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sea-green py-4 font-bold text-white shadow-lg transition-all hover:bg-sea-green-dark disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing Rate...
              </>
            ) : (
              <>
                <Calculator size={20} />
                Analyze Bid Rate
              </>
            )}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 lg:col-span-7">
          {result ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white p-6 shadow-sm border-l-4 border-sea-green">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recommended Bid Value</h3>
                  <p className="mt-2 text-2xl font-black text-slate-900">{result.recommendedBidValue}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-bold uppercase",
                      result.suggestion === 'Below' ? "bg-green-100 text-green-700" :
                      result.suggestion === 'Above' ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {result.suggestion} Estimated Value
                    </span>
                    <span className="text-xs font-bold text-slate-500">{result.percentageRange}</span>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cost Breakdown</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Materials:</span>
                      <span className="font-bold text-slate-700">{result.costBreakdown.materials}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Labor:</span>
                      <span className="font-bold text-slate-700">{result.costBreakdown.labor}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Overheads/Compliance:</span>
                      <span className="font-bold text-slate-700">{result.costBreakdown.overheadsAndCompliance}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-sea-green font-bold">Est. Profit:</span>
                      <span className="font-black text-sea-green">{result.costBreakdown.profit}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Competitive Strategy</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 font-medium">{result.competitiveStrategy}</p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Reasoning</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{result.reasoning}</p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Risk Factors & Hidden Costs</h3>
                <ul className="mt-3 space-y-2">
                  {result.riskFactors.map((risk: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
              <Calculator size={48} className="mb-4 text-slate-400" />
              <p className="text-sm font-medium text-slate-500">
                Enter the project details and costs<br/>to get an advanced, highly specific bidding suggestion.
              </p>
            </div>
          )}
        </div>
      </div>
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
    signature: null as string | null,
  });
  const [isPreview, setIsPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formData.letterhead || formData.signature) {
      const timer = setTimeout(() => {
        setFormData(prev => ({ ...prev, letterhead: null, signature: null }));
        alert("Session expired. Uploaded images were deleted automatically after 10 minutes for security.");
      }, 10 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.letterhead, formData.signature]);

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

            <div className="pt-12 flex justify-between items-end">
              <div>
                <p className="font-bold">
                  For : <span className="border-b border-slate-900 px-4">{formData.companyName || "_____________________"}</span>
                </p>
              </div>
              <div className="text-center space-y-2">
                {formData.signature ? (
                  <img src={formData.signature} alt="Signature" className="h-16 object-contain mx-auto" />
                ) : (
                  <div className="h-16 w-40 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs rounded-lg bg-slate-50 mx-auto">
                    Digital Signature Space
                  </div>
                )}
                <p className="font-bold text-sm">Authorized Signatory</p>
              </div>
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
          <div>
            <label className="block text-sm font-bold text-slate-700">Signature Image (Optional)</label>
            <div className="mt-1 flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
                <Upload size={16} />
                Upload Signature
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({...formData, signature: reader.result as string});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {formData.signature && (
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, signature: null})}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="mt-1 text-[10px] text-slate-400 italic">Upload an image of the authorized signature.</p>
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

function PricingView({ user, onUpdateUser, onLoginRequest }: { user: UserData | null, onUpdateUser: (user: UserData) => void, onLoginRequest: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [hasInitiatedPayment, setHasInitiatedPayment] = useState(false);
  const upiId = "9851334382@ptyes"; // Updated UPI ID
  const upiName = "A D professional Solution";

  const plans = [
    {
      name: "Free Plan",
      price: "0",
      period: "month",
      desc: "Essential updates for active GeM bidders.",
      features: [
        "GeM Upcoming Bid Updates"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro Monthly",
      price: "1999",
      period: "month",
      desc: "Advanced tools for professional bidding.",
      features: [
        "AI Bid Analysis (10/month)",
        "GeM Upcoming Bid Updates",
        "MII Certificate Generator",
        "Priority Email Support",
        "GeM Portal Consultation",
        "2 Bid perticipation by professional"
      ],
      cta: "Subscribe Pro",
      popular: true
    },
    {
      name: "Yearly Plan",
      price: "9999",
      period: "year",
      desc: "Maximum value for serious government contractors.",
      features: [
        "AI Bid Analysis (10/month)",
        "GeM Upcoming Bid Updates",
        "MII Certificate Generator",
        "Priority Email Support",
        "GeM Portal Consultation",
        "10 Bid perticipation by professional"
      ],
      cta: "Subscribe Yearly",
      popular: false
    }
  ];

  const handleSubscribe = (plan: any) => {
    if (!user) {
      onLoginRequest();
      return;
    }
    setSelectedPlan(plan);
    setHasInitiatedPayment(false);
  };

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple, Transparent Pricing</h2>
        <p className="mt-4 text-slate-500">Choose the plan that fits your business needs.</p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 md:gap-8 md:grid-cols-3">
        {plans.map((plan, i) => (
          <div 
            key={i}
            className={cn(
              "relative flex flex-col rounded-3xl border p-6 sm:p-8 transition-all",
              plan.popular ? "border-sea-green bg-white shadow-2xl md:scale-105 z-10" : "border-slate-200 bg-white shadow-sm"
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
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4">
                  <h3 className="mb-2 text-sm font-bold text-slate-900">{upiName}</h3>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${selectedPlan.price}&cu=INR&tn=Subscription%20for%20${selectedPlan.name}`)}`}
                    alt="UPI QR Code"
                    className="h-48 w-48 rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <p className="mt-4 text-xs font-bold text-slate-500 font-mono">UPI ID: {upiId}</p>
                  <p className="text-xs font-bold text-slate-500 font-mono">+91 87775 61824</p>
                </div>
                <p className="text-sm text-slate-500 text-center">
                  Scan this QR code using any UPI app (GPay, PhonePe, Paytm) to complete your subscription.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setHasInitiatedPayment(true);
                    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${selectedPlan.price}&cu=INR&tn=Subscription%20for%20${selectedPlan.name}`;
                    window.location.href = upiUrl;
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-sea-green py-3 text-sm font-bold text-white shadow-lg hover:bg-sea-green-dark"
                >
                  Pay via App
                </button>
                <button 
                  onClick={() => {
                    setSelectedPlan(null);
                    setHasInitiatedPayment(false);
                  }}
                  className="rounded-xl bg-sea-green-light py-3 text-sm font-bold text-sea-green hover:bg-sea-green/20"
                >
                  Cancel
                </button>
                {hasInitiatedPayment && (
                  <button 
                    onClick={async () => {
                      const regDate = user!.registrationDate ? new Date(user!.registrationDate) : new Date();
                      const daysToAdd = selectedPlan.name === 'Yearly Plan' ? 365 : 30;
                      const newEnd = new Date(regDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
                      await onUpdateUser({ ...user!, plan: selectedPlan.name, subscriptionEnd: newEnd });
                      setSelectedPlan(null);
                      setHasInitiatedPayment(false);
                      alert(`Successfully subscribed to ${selectedPlan.name}!`);
                    }}
                    className="col-span-2 mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800"
                  >
                    I have paid (Confirm)
                  </button>
                )}
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
  const [signature, setSignature] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const matrixRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (letterhead || signature) {
      const timer = setTimeout(() => {
        setLetterhead(null);
        setSignature(null);
        alert("Session expired. Uploaded images were deleted automatically after 10 minutes for security.");
      }, 10 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [letterhead, signature]);

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
            <div>
              <label className="block text-sm font-bold text-slate-700">Signature Image (Optional)</label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
                  <Upload size={16} />
                  Upload Signature
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSignature(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {signature && (
                  <button 
                    type="button"
                    onClick={() => setSignature(null)}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] text-slate-400 italic">Upload an image of the authorized signature.</p>
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

            <div className="mt-20 flex justify-between items-end pt-12">
              <div className="text-center space-y-2">
                {signature ? (
                  <img src={signature} alt="Signature" className="h-16 object-contain mx-auto" />
                ) : (
                  <div className="h-16 w-40 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs rounded-lg bg-slate-50 mx-auto">
                    Digital Signature Space
                  </div>
                )}
                <div className="mb-2 h-px w-40 bg-slate-300 mx-auto"></div>
                <p className="text-xs font-bold uppercase text-slate-400">Authorized Signatory</p>
              </div>
              <div className="text-center">
                <div className="mb-2 h-px w-40 bg-slate-300 mx-auto"></div>
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
    signature: null as string | null,
  });
  const [isExporting, setIsExporting] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formData.letterhead || formData.signature) {
      const timer = setTimeout(() => {
        setFormData(prev => ({ ...prev, letterhead: null, signature: null }));
        alert("Session expired. Uploaded images were deleted automatically after 10 minutes for security.");
      }, 10 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.letterhead, formData.signature]);

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
              <label className="block text-sm font-bold text-slate-700">Signature Image (Optional)</label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
                  <Upload size={16} />
                  Upload Signature
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({...formData, signature: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {formData.signature && (
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, signature: null})}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] text-slate-400 italic">Upload an image of the authorized signature.</p>
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
                <div className="text-center space-y-2">
                  {formData.signature ? (
                    <img src={formData.signature} alt="Signature" className="h-16 object-contain mx-auto" />
                  ) : (
                    <div className="h-16 w-48 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs rounded-lg bg-slate-50 mx-auto">
                      Digital Signature Space
                    </div>
                  )}
                  <div className="mb-2 h-px w-48 bg-slate-400 mx-auto"></div>
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
