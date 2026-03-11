import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Coffee, Settings, Utensils } from "lucide-react";
import SurveyPage from "./components/SurveyPage";
import AdminPanel from "./components/AdminPanel";
import LandingPage from "./components/LandingPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-emerald-100">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-black/5 px-4 py-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-emerald-600 p-2.5 rounded-2xl group-hover:rotate-12 transition-all shadow-lg shadow-emerald-600/20">
                <Utensils className="text-white w-5 h-5" />
              </div>
              <span className="font-black text-2xl tracking-tighter">LunchPoll</span>
            </Link>
            
            <div className="flex gap-3">
              <Link 
                to="/admin" 
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl hover:bg-black/5 transition-all text-sm font-bold border border-transparent hover:border-black/5"
              >
                <Settings className="w-4 h-4" />
                <span>ניהול</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/survey" element={<SurveyPage />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </AnimatePresence>
        </main>

        <footer className="py-8 text-center text-black/40 text-sm">
          <p>© 2026 LunchPoll System • Built for Teams</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
