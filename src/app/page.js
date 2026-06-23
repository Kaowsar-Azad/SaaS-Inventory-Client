"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  FiBox, 
  FiTrendingUp, 
  FiLayers, 
  FiUsers, 
  FiPercent, 
  FiShield, 
  FiArrowRight, 
  FiZap,
  FiMapPin,
  FiBell,
  FiCheck,
  FiStar,
  FiBarChart2,
  FiPackage,
  FiMail
} from "react-icons/fi";
import { FaGithub, FaTwitter, FaLinkedin, FaFacebook } from "react-icons/fa";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { y: 28, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 85,
        damping: 14
      }
    }
  };

  const features = [
    {
      icon: <FiLayers className="w-5 h-5 text-indigo-600" />,
      title: "Strict Multi-Tenancy",
      desc: "Robust company-wise database isolation guarantees absolute data privacy and security for every business on the platform.",
      color: "bg-indigo-50 border-indigo-100",
      accent: "group-hover:border-indigo-300"
    },
    {
      icon: <FiTrendingUp className="w-5 h-5 text-emerald-600" />,
      title: "Real-time Analytics",
      desc: "Track total products, stock values, sales, purchases, and low-stock items with a live, interactive dashboard.",
      color: "bg-emerald-50 border-emerald-100",
      accent: "group-hover:border-emerald-300"
    },
    {
      icon: <FiBox className="w-5 h-5 text-sky-600" />,
      title: "Variant & SKU Generator",
      desc: "Manage product variants (size, color) and auto-generate barcodes and SKUs at scale with bulk import/export.",
      color: "bg-sky-50 border-sky-100",
      accent: "group-hover:border-sky-300"
    },
    {
      icon: <FiMapPin className="w-5 h-5 text-rose-600" />,
      title: "Multi-Warehouse Transfers",
      desc: "Monitor stock across multiple warehouses and handle physical stock transfers and adjustments seamlessly.",
      color: "bg-rose-50 border-rose-100",
      accent: "group-hover:border-rose-300"
    },
    {
      icon: <FiBell className="w-5 h-5 text-amber-600" />,
      title: "Automated Low Stock Alerts",
      desc: "Instant restock alerts and daily summary reports delivered straight to your email using SMTP automation.",
      color: "bg-amber-50 border-amber-100",
      accent: "group-hover:border-amber-300"
    },
    {
      icon: <FiPercent className="w-5 h-5 text-purple-600" />,
      title: "Stripe-Powered Billing",
      desc: "Transparent monthly and yearly subscription plans with instant payment processing via Stripe integration.",
      color: "bg-purple-50 border-purple-100",
      accent: "group-hover:border-purple-300"
    },
    {
      icon: <FiUsers className="w-5 h-5 text-pink-600" />,
      title: "Customer & Loyalty CRM",
      desc: "Rich customer profiles, purchase histories, loyalty programs, and due tracking built directly into your workflow.",
      color: "bg-pink-50 border-pink-100",
      accent: "group-hover:border-pink-300"
    },
    {
      icon: <FiShield className="w-5 h-5 text-teal-600" />,
      title: "Role-Based Access Control",
      desc: "Assign granular permissions per user and role. Keep sensitive data protected with audit trails and controls.",
      color: "bg-teal-50 border-teal-100",
      accent: "group-hover:border-teal-300"
    },
    {
      icon: <FiBarChart2 className="w-5 h-5 text-orange-600" />,
      title: "Detailed Reporting Suite",
      desc: "Generate sales, purchase, inventory, and profit/loss reports in seconds. Export to Excel or PDF for easy sharing.",
      color: "bg-orange-50 border-orange-100",
      accent: "group-hover:border-orange-300"
    }
  ];

  const plans = [
    {
      name: "Monthly Plan",
      price: "$10",
      period: "/ monthly",
      desc: "Affordable monthly commitment to run operations.",
      features: [
        "Unlimited Inventory Products",
        "WhatsApp Notification Alerts",
        "Automatic Mail Invoices & Backups"
      ],
      cta: "Get Started",
      href: "/register",
      highlight: false,
      badge: null
    },
    {
      name: "Yearly Plan",
      price: "$100",
      period: "/ yearly",
      desc: "Complete yearly savings with continuous access.",
      features: [
        "All Monthly Plan features included",
        "Get 2 months free ($20 savings)",
        "Priority developer support status"
      ],
      cta: "Get Started",
      href: "/register",
      highlight: true,
      badge: "SAVE 17% (2 MONTHS FREE)"
    }
  ];

  const stats = [
    { value: "12,000+", label: "Products Tracked" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "50+", label: "Companies Served" },
    { value: "3x", label: "Average ROI" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-white text-slate-800 flex flex-col font-sans overflow-x-hidden relative selection:bg-indigo-500 selection:text-white">
      
      {/* Premium Ambient Glow Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-5%] w-[45vw] aspect-square bg-gradient-to-tr from-indigo-500/12 to-purple-500/12 rounded-full blur-[140px]" />
        <div className="absolute top-[25vh] right-[-5%] w-[40vw] aspect-square bg-gradient-to-br from-sky-400/12 to-blue-500/12 rounded-full blur-[140px]" />
        <div className="absolute top-[15vh] left-[20vw] w-[50vw] h-[30vh] bg-gradient-to-r from-violet-500/8 via-fuchsia-500/6 to-pink-500/8 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40vw] aspect-square bg-emerald-500/6 rounded-full blur-[130px]" />
      </div>

      {/* Grid Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.35] pointer-events-none -z-10" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle 80% at 50% 15%, black 50%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle 80% at 50% 15%, black 50%, transparent 100%)'
        }}
      />

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 w-full backdrop-blur-md bg-white/70 border-b border-slate-200/20 z-50 transition-all duration-300">
        <nav className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-300">
              <FiBox className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 tracking-tight group-hover:opacity-90 transition-opacity">
              SaaS Inventory
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#footer" className="hover:text-indigo-600 transition-colors">Company</a>
          </div>

          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full transition-all duration-300"
            >
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-bold rounded-full text-slate-700 border border-slate-200 hover:border-indigo-500/30 hover:bg-slate-50 transition-colors cursor-pointer block"
              >
                Login
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <Link
                href="/register"
                className="px-5 py-2.5 text-sm font-bold rounded-full text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 bg-[length:200%_auto] hover:bg-right transition-[background-position] duration-500 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer block"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </nav>
      </header>

      {/* ===== HERO SECTION ===== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-16 pb-28 z-10">
        <motion.div 
          className="text-center space-y-8 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-slate-900"
          >
            Smart Inventory Management{" "}
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500">
              Built for Modern Businesses
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            variants={itemVariants}
            className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Supercharge your business with real-time stock levels, automated SKU & barcode generation, multi-warehouse transfers, and smart notification alerts — all in one secure, multi-tenant cloud platform.
          </motion.p>

          {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-3">
              <motion.div
                className="w-full sm:w-auto relative group rounded-full overflow-hidden cursor-pointer border border-slate-200/80 hover:border-indigo-500/40 bg-white shadow-sm hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300"
                whileHover="hover"
                initial="initial"
                whileTap={{ scale: 0.98 }}
                variants={{
                  hover: {
                    scale: 1.03,
                    transition: { duration: 0.3 }
                  }
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 via-blue-50/20 to-sky-50/30 -z-0 opacity-0"
                  variants={{
                    hover: {
                      opacity: 1,
                      transition: { duration: 0.4 }
                    }
                  }}
                />
                <motion.div
                  className="absolute top-0 bottom-0 left-0 w-[40%] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent skew-x-12 -z-0 pointer-events-none"
                  variants={{
                    initial: { x: "-150%" },
                    hover: {
                      x: "300%",
                      transition: {
                        repeat: Infinity,
                        repeatDelay: 0.2,
                        duration: 1.4,
                        ease: "easeInOut"
                      }
                    }
                  }}
                />
                <Link
                  href="/login"
                  className="relative z-10 w-full px-8 py-4 text-base font-bold text-slate-700 group-hover:text-indigo-700 flex items-center justify-center transition-colors duration-300 cursor-pointer"
                >
                  <span>Sign In to Workspace</span>
                </Link>
              </motion.div>

              <div className="text-sm font-medium text-slate-400 px-2 hidden sm:block">or</div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <Link
                  href="/register"
                  className="w-full px-8 py-4 text-base font-bold rounded-full text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 bg-[length:200%_auto] hover:bg-right transition-[background-position] duration-500 shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2 group cursor-pointer"
                >
                  <span>Get Started</span>
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
            <p className="text-sm text-slate-500 font-medium sm:hidden pt-2">
              Or create your account
            </p>

          {/* Social Proof Trust Bar */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-x-8 gap-y-3 pt-4">
            {[
              { icon: <FiShield className="w-3.5 h-3.5 text-emerald-500" />, text: "SOC2 Compliant" },
              { icon: <FiZap className="w-3.5 h-3.5 text-amber-500" />, text: "99.9% Uptime" },
              { icon: <FiStar className="w-3.5 h-3.5 text-indigo-500" />, text: "4.9/5 Rating" },
              { icon: <FiUsers className="w-3.5 h-3.5 text-sky-500" />, text: "50+ Companies" },
            ].map((item, i) => (
              <div key={i} className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Mock Dashboard Showcase */}
          <motion.div 
            variants={itemVariants}
            className="pt-10 max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-md p-4 shadow-2xl shadow-indigo-500/5 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-slate-300 transition-all duration-500">
              
              {/* Browser Header Bar */}
              <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
                <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <div className="ml-4 flex-1 px-3 py-1 rounded-md bg-slate-50 text-[10px] text-slate-400 font-mono max-w-xs">
                  https://saas-inventory-client.vercel.app/dashboard
                </div>
              </div>

              {/* Mock Dashboard Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-left">
                
                {/* Stats Cards */}
                {[
                  { label: "Total Products", value: "1,482", change: "↑ 12% this month", icon: <FiBox className="w-3.5 h-3.5 text-indigo-500" />, good: true },
                  { label: "Total Revenue", value: "$48,290", change: "↑ 24% net margin", icon: <FiTrendingUp className="w-3.5 h-3.5 text-emerald-500" />, good: true },
                  { label: "Low Stock Warnings", value: "0", change: "All levels healthy", icon: <FiBell className="w-3.5 h-3.5 text-amber-500" />, good: true },
                ].map((card, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{card.label}</span>
                      {card.icon}
                    </div>
                    <p className="text-xl font-black text-slate-900">{card.value}</p>
                    <p className={`text-[9px] font-bold ${card.good ? "text-emerald-600" : "text-rose-500"}`}>{card.change}</p>
                  </div>
                ))}

                {/* Chart Mock */}
                <div className="col-span-1 md:col-span-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Business Revenue & Purchases Overview</span>
                    <div className="flex space-x-3 text-[9px] text-slate-500 font-semibold">
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-indigo-600 mr-1.5" />Sales</span>
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-sky-400 mr-1.5" />Purchases</span>
                    </div>
                  </div>
                  
                  <svg className="w-full h-28 text-indigo-600" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M0 80 Q 50 20, 100 50 T 200 10 T 300 70 T 400 30 L 400 100 L 0 100 Z" 
                      fill="url(#chartGrad)" 
                    />
                    <path 
                      d="M0 80 Q 50 20, 100 50 T 200 10 T 300 70 T 400 30" 
                      fill="none" 
                      stroke="#4f46e5" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />
                    <path 
                      d="M0 90 Q 50 60, 100 80 T 200 40 T 300 85 T 400 60" 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* ===== STATS BAND ===== */}
      <section className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 py-14">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-white text-center">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 80 }}
              className="space-y-1"
            >
              <p className="text-3xl sm:text-4xl font-black tracking-tight">{s.value}</p>
              <p className="text-sm text-indigo-100 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="w-full bg-white border-y border-slate-200/80 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold">
              <FiPackage className="w-3.5 h-3.5" />
              <span>Platform Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Engineered For Modern Commerce
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
              A comprehensive feature set designed to help modern businesses track stock, handle billing, and isolate multi-tenant data seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                className={`group p-6 sm:p-7 rounded-2xl bg-slate-50/60 border border-slate-200/60 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 space-y-4 ${f.accent}`}
                whileHover={{ y: -4 }}
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 100, damping: 16 }}
              >
                <div className={`p-3 rounded-xl w-fit border ${f.color} transition-all duration-300 group-hover:scale-110`}>
                  {f.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-950 tracking-tight">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="w-full py-24 bg-gradient-to-b from-slate-50/80 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-xs font-bold">
              <FiPercent className="w-3.5 h-3.5" />
              <span>Simple Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Plans That Scale With You
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-base leading-relaxed">
              Start free. Scale when you&apos;re ready. No hidden fees, no lock-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 80 }}
                className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
                  plan.highlight
                    ? "border-indigo-400/60 bg-gradient-to-b from-indigo-600 to-blue-700 text-white shadow-2xl shadow-indigo-500/20 scale-[1.02]"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100"
                } p-7`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-2 mb-6">
                  <h3 className={`text-base font-bold ${plan.highlight ? "text-indigo-100" : "text-slate-500"}`}>{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-black ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                    <span className={`text-sm font-medium mb-1 ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>{plan.period}</span>
                  </div>
                  <p className={`text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>{plan.desc}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start space-x-2.5 text-sm">
                      <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.highlight ? "bg-white/20" : "bg-emerald-50"}`}>
                        <FiCheck className={`w-2.5 h-2.5 ${plan.highlight ? "text-white" : "text-emerald-600"}`} />
                      </div>
                      <span className={plan.highlight ? "text-indigo-100" : "text-slate-600"}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all duration-300 block ${
                    plan.highlight
                      ? "bg-white text-indigo-700 hover:bg-indigo-50 shadow-md"
                      : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-lg hover:shadow-indigo-500/20"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="footer" className="w-full bg-slate-950 text-slate-400 pt-16 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6">

          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/60">
            
            {/* Brand Column */}
            <div className="space-y-5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl shadow-md shadow-indigo-500/20">
                  <FiBox className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">SaaS Inventory</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                A next-generation multi-tenant inventory management platform built for modern businesses. Track, manage, and scale — all from one powerful dashboard.
              </p>
              
              {/* Social Icons */}
              <div className="flex space-x-3 pt-2">
                {[
                  { icon: <FaTwitter className="w-4 h-4" />, label: "Twitter", href: "#", color: "hover:text-sky-400 hover:bg-sky-400/10" },
                  { icon: <FaLinkedin className="w-4 h-4" />, label: "LinkedIn", href: "#", color: "hover:text-blue-500 hover:bg-blue-500/10" },
                  { icon: <FaGithub className="w-4 h-4" />, label: "GitHub", href: "#", color: "hover:text-white hover:bg-white/10" },
                  { icon: <FaFacebook className="w-4 h-4" />, label: "Facebook", href: "#", color: "hover:text-blue-600 hover:bg-blue-600/10" },
                ].map((s, i) => (
                  <Link
                    key={i}
                    href={s.href}
                    aria-label={s.label}
                    className={`p-2 rounded-xl text-slate-500 bg-slate-900 border border-slate-800/80 transition-all duration-300 ${s.color}`}
                  >
                    {s.icon}
                  </Link>
                ))}
              </div>
            </div>

            {/* Platform Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Platform</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Sign In", href: "/login" },
                  { label: "Create Account", href: "/register" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Core Features</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Multi-Tenant Isolation", href: "#features" },
                  { label: "Real-time Analytics", href: "#features" },
                  { label: "SKU & Barcode Generator", href: "#features" },
                  { label: "Warehouse Transfers", href: "#features" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Support Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Legal & Support</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Service", href: "#" },
                  { label: "Cookie Settings", href: "#" },
                  { label: "Contact Support", href: "#footer" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Copyright Bar */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-md">
                <FiBox className="w-3 h-3 text-white" />
              </div>
              <p>© {new Date().getFullYear()} SaaS Inventory Management. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
