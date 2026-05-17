import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sprout, Layers, BarChart2, Thermometer, Bot, ArrowRight, Leaf, Droplets, Sun, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const ROTATING_WORDS = ["Design", "Monitor", "Grow", "Understand", "Optimize", "Scale"];

const FEATURES = [
  {
    icon: Layers,
    title: "Visual Farm Builder",
    desc: "Drag-and-drop canvas to design your vertical racks, towers, and A-frames with pixel-perfect precision.",
  },
  {
    icon: BarChart2,
    title: "Plant Analytics",
    desc: "Track growth stages, health scores, and measurements for every plant module over time.",
  },
  {
    icon: Thermometer,
    title: "Environment Monitoring",
    desc: "Log temperature, humidity, CO₂, pH, airflow, and light intensity — all in one place.",
  },
  {
    icon: Bot,
    title: "AI Farm Assistant",
    desc: "Ask questions about your farm and get expert advice based on your real live data.",
  },
];

const BENEFITS = [
  "No hardware required — works with any farm setup",
  "Built for vertical rack, tower, and A-frame systems",
  "Track plant health with photo journals and logs",
  "AI assistant that knows your farm inside-out",
];

function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative text-primary" style={{ minWidth: "220px" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="inline-block"
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Landing() {
  const handleLogin = () => {
    base44.auth.redirectToLogin("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Sprout className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">AgriForce</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogin}>Log In</Button>
            <Button size="sm" onClick={handleLogin} className="gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 sm:py-36 relative overflow-hidden">
        {/* subtle bg blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Leaf className="w-3.5 h-3.5" />
            Vertical Farming, Simplified
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight max-w-3xl">
            <RotatingWord />{" "}
            <span className="block sm:inline">your vertical farm</span>
          </h1>

          <p className="text-muted-foreground text-lg sm:text-xl mt-6 max-w-xl leading-relaxed">
            AgriForce is the all-in-one digital toolkit for vertical farmers — from layout design
            to plant health tracking and AI-powered insights.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-10">
            <Button size="lg" onClick={handleLogin} className="gap-2 px-8 text-base h-12">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleLogin} className="gap-2 px-8 text-base h-12">
              Log In
            </Button>
          </div>

          <ul className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-muted-foreground">
            {["Free to get started", "No credit card needed", "All farm types supported"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card border-t border-border py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
              Everything your farm needs
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              A complete platform built specifically for the demands of modern vertical farming.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-background border border-border rounded-xl p-6 flex gap-4 hover:border-primary/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-base mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight mb-4">
              Built for real farms, not spreadsheets
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Stop managing your farm with scattered notes and guesswork. AgriForce gives you a live digital twin that reflects your actual setup.
            </p>
            <ul className="space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Layers, label: "Farm Types", value: "3" },
              { icon: Droplets, label: "Env. Metrics", value: "6+" },
              { icon: Sun, label: "AI-Powered", value: "100%" },
              { icon: Leaf, label: "Plant Tracking", value: "∞" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-card border border-border rounded-xl p-5 text-center">
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-heading text-3xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 px-4 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
          Ready to grow smarter?
        </h2>
        <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto text-lg">
          Join AgriForce and start building your digital farm today.
        </p>
        <Button size="lg" variant="secondary" onClick={handleLogin} className="gap-2 px-10 text-base h-12">
          Get Started Free <ArrowRight className="w-4 h-4" />
        </Button>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AgriForce · Vertical Farm Design Tool
      </footer>
    </div>
  );
}