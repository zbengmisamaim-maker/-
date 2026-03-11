import React from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Utensils, ArrowLeft, ArrowRight, Sparkles, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function LandingPage() {
  const [activeSurveyId, setActiveSurveyId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchActiveSurvey = async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("id")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!error && data) setActiveSurveyId(data.id);
    };
    fetchActiveSurvey();
  }, []);

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-200/20 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-orange-200/20 rounded-full blur-[120px]" 
        />
      </div>

      <div className="relative z-10 space-y-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1 
          }}
          className="mx-auto w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 flex items-center justify-center border border-emerald-50 relative group"
        >
          <Utensils className="w-12 h-12 md:w-16 md:h-16 text-emerald-600 group-hover:rotate-12 transition-transform duration-500" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-orange-400 fill-orange-400" />
          </motion.div>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9]">
              מה אוכלים <br />
              <span className="text-indigo-600 relative">
                היום?
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="text-2xl md:text-3xl font-black text-slate-300 uppercase tracking-widest pt-4">
              Что едим сегодня?
            </p>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-slate-500 font-medium max-w-xl mx-auto leading-relaxed"
          >
            הצטרפו לסקר היומי והשפיעו על בחירת ארוחת הצהריים של הצוות <br />
            <span className="opacity-60 italic text-base">Присоединяйтесь к опросу и выберите обед для команды</span>
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <Link
            to={activeSurveyId ? `/survey/${activeSurveyId}` : "#"}
            className="group relative inline-flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-indigo-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative bg-indigo-600 text-white px-10 py-6 rounded-[2rem] font-black text-2xl shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
              <span>למילוי הסקר</span>
              <div className="w-px h-8 bg-white/20 mx-2" />
              <span className="text-lg opacity-80">Пройти опрос</span>
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
            </div>
          </Link>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-6 text-slate-400 text-xs font-black uppercase tracking-[0.3em]"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>מהיר וקל</span>
            </div>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>השפעה מיידית</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
