import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Globe, User, Send, Calendar } from "lucide-react";
import { Survey, Language, TRANSLATIONS } from "../types";
import { Link, useParams } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "../lib/supabase";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SurveyPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [name, setName] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [otherText, setOtherText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "no-survey">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchSurvey = async () => {
      setStatus("loading");
      try {
        let query = supabase.from("surveys").select("*");
        if (id === 'active') {
          query = query.is("deleted_at", null).order("created_at", { ascending: false }).limit(1);
        } else {
          query = query.eq("id", id);
        }
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        if (!data) {
          setStatus("no-survey");
          return;
        }
        setSurvey(data);
        setStatus("idle");
        if (data.languages?.length === 1) {
          setSelectedLang(data.languages[0] as Language);
        } else if (data.languages?.length > 1) {
          setSelectedLang('he');
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message);
      }
    };
    fetchSurvey();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedOption || !survey) return;

    setStatus("loading");
    try {
      // Check if already voted today
      const today = new Date().toISOString().split('T')[0];
      const { data: existing, error: checkError } = await supabase
        .from("votes")
        .select("id")
        .eq("employee_name", name)
        .eq("survey_id", survey.id)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        setStatus("error");
        setErrorMessage("Already voted today");
        return;
      }

      const { error: insertError } = await supabase
        .from("votes")
        .insert([{
          survey_id: survey.id,
          employee_name: name,
          answer: selectedOption,
          other_text: selectedOption === "Other" ? otherText : null,
        }]);

      if (insertError) throw insertError;
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-black/40">
        <Globe className="w-12 h-12 mb-4 animate-pulse" />
        <p>טוען סקר... / Загрузка опроса...</p>
      </div>
    );
  }

  if (status === "no-survey") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-black/40 text-center space-y-4">
        <div className="bg-black/5 p-6 rounded-full">
          <Send className="w-12 h-12 opacity-20" />
        </div>
        <h2 className="text-2xl font-bold text-black">אין סקר פעיל כרגע</h2>
        <p>מנהל המערכת טרם פרסם סקר להיום.</p>
        <Link to="/admin" className="text-emerald-600 font-bold hover:underline">עבור לדף ניהול ליצירת סקר</Link>
      </div>
    );
  }

  if (status === "error" && !survey) {
    return (
      <div className="max-w-md mx-auto bg-red-50 p-8 rounded-3xl border border-red-100 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-600">אופס! משהו השתבש</h2>
        <p className="text-red-500">{errorMessage}</p>
        <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold">נסה שוב</button>
      </div>
    );
  }

  if (status === "success") {
    if (!survey || !survey.languages) return null;

    const isBilingual = (survey.languages?.length || 0) > 1;
    const t = TRANSLATIONS[selectedLang || 'he'];
    const t2 = TRANSLATIONS['ru'];
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl shadow-emerald-500/10 text-center border border-emerald-100"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {isBilingual ? `${t.success} / ${t2.success}` : t.success}
        </h2>
        <p className="text-black/50">
          {isBilingual ? "נתראה בארוחת הצהריים! / До встречи на обеде!" : "נתראה בארוחת הצהריים!"}
        </p>
      </motion.div>
    );
  }

  if (!survey || !survey.languages || !survey.options) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-black/40">
        <Globe className="w-12 h-12 mb-4 animate-pulse" />
        <p>טוען נתונים... / Загрузка данных...</p>
      </div>
    );
  }

  const isBilingual = (survey.languages?.length || 0) > 1;
  const t = TRANSLATIONS[selectedLang || 'he'];
  const t2 = TRANSLATIONS['ru'];
  const isRTL = selectedLang === 'he';

  const getLabel = (key: keyof typeof TRANSLATIONS['he']) => {
    if (isBilingual) return `${TRANSLATIONS['he'][key]} / ${TRANSLATIONS['ru'][key]}`;
    return TRANSLATIONS[selectedLang || 'he'][key];
  };

  const renderOptionText = (option: string) => {
    if (option.includes('|')) {
      const [he, ru] = option.split('|').map(s => s.trim());
      return (
        <div className="flex flex-col">
          <span className="text-lg font-bold">{he}</span>
          <span className="text-sm opacity-60 font-medium">{ru}</span>
        </div>
      );
    }
    return <span className="text-lg font-bold">{option}</span>;
  };

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center py-12 px-4">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-rose-100/50 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-amber-50/30 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl shadow-indigo-500/10 border-8 border-indigo-100 p-8 md:p-12 space-y-10 relative z-10",
          isRTL ? "text-right" : "text-left"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Decorative Inner Frame */}
        <div className="absolute inset-4 rounded-[2rem] border-2 border-indigo-50 pointer-events-none" />
        
        <header className="space-y-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">{getLabel('title')}</span>
              <h1 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight text-slate-900">
                {survey.question.endsWith('?') ? survey.question : `${survey.question}?`}
              </h1>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-2 text-slate-400 text-xs font-bold bg-slate-50 px-4 py-2 rounded-2xl border border-black/5">
                <Calendar className="w-3 h-3" />
                {getLabel('surveyDate')}: {new Date(survey.created_at).toLocaleDateString('he-IL')}
              </span>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Name Input */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest">
              <User className="w-4 h-4 text-indigo-500" />
              {getLabel('nameLabel')}
            </label>
            <div className="relative group">
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-6 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all text-xl font-bold placeholder:text-slate-300"
                placeholder={isBilingual ? "הכנס את שמך... / Введите ваше имя..." : (isRTL ? "הכנס את שמך..." : "Введите ваше имя...")}
              />
              <div className="absolute inset-0 rounded-3xl ring-4 ring-indigo-500/0 group-focus-within:ring-indigo-500/10 transition-all pointer-events-none" />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <label className="text-sm font-black text-slate-400 uppercase tracking-widest block">
              {getLabel('optionsLabel')}
            </label>
            <div className="grid grid-cols-1 gap-4">
              {survey.options.map((option, idx) => {
                const optionColors = [
                  "bg-indigo-600 border-indigo-600 shadow-indigo-600/20",
                  "bg-rose-600 border-rose-600 shadow-rose-600/20",
                  "bg-amber-600 border-amber-600 shadow-amber-600/20",
                  "bg-emerald-600 border-emerald-600 shadow-emerald-600/20",
                  "bg-violet-600 border-violet-600 shadow-violet-600/20",
                ];
                const activeColor = optionColors[idx % optionColors.length];

                return (
                  <label
                    key={option}
                    className={cn(
                      "relative flex items-center p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 group overflow-hidden",
                      selectedOption === option 
                        ? `${activeColor} text-white shadow-xl scale-[1.02]` 
                        : `bg-slate-50 border-transparent hover:border-indigo-200 hover:bg-indigo-50/50`
                    )}
                  >
                    <input
                      type="radio"
                      name="lunch-option"
                      value={option}
                      checked={selectedOption === option}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="sr-only"
                    />
                    
                    <div className="flex-1 relative z-10">
                      {renderOptionText(option)}
                    </div>

                    {selectedOption === option ? (
                      <motion.div 
                        layoutId="check" 
                        className={cn("relative z-10", isRTL ? "mr-4" : "ml-4")}
                      >
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      </motion.div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-indigo-300 transition-colors" />
                    )}
                  </label>
                );
              })}
              
              {/* Other Option */}
              <label
                className={cn(
                  "relative flex flex-col p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 group",
                  selectedOption === "Other" 
                    ? "bg-slate-800 text-white border-slate-800 shadow-xl shadow-slate-800/20 scale-[1.02]" 
                    : "bg-slate-50 border-transparent hover:border-indigo-200 hover:bg-indigo-50/50"
                )}
              >
                <div className="flex items-center justify-between w-full relative z-10">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="lunch-option"
                      value="Other"
                      checked={selectedOption === "Other"}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-lg font-bold">{getLabel('other')}</span>
                  </div>
                  {selectedOption !== "Other" && (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-emerald-300 transition-colors" />
                  )}
                </div>

                <AnimatePresence>
                  {selectedOption === "Other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden relative z-10"
                    >
                      <input
                        type="text"
                        required
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        className="w-full p-4 bg-white/20 rounded-2xl border border-white/30 outline-none placeholder:text-white/60 text-white font-bold"
                        placeholder={isBilingual ? "מה בא לך? / Что бы вы хотели?" : (isRTL ? "מה בא לך?" : "Что бы вы хотели?")}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>
            </div>
          </div>

          {status === "error" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-red-600 font-bold bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              {errorMessage === "Already voted today" ? getLabel('alreadyVoted') : errorMessage}
            </motion.div>
          )}

          <button
            disabled={status === "loading" || !name || !selectedOption}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white p-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-4 active:scale-[0.98] group"
          >
            {status === "loading" ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className={cn("w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform", isRTL && "rotate-180")} />
                {getLabel('submit')}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
