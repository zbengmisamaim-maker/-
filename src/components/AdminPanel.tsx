import confetti from 'canvas-confetti';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Plus, Trash2, BarChart3, Users, Calendar, PlusCircle, ArrowRight, Copy, ExternalLink, Check, Heart, Bookmark, Star } from "lucide-react";
import { Stats, Language, Survey, Favorite } from "../types";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allSurveys, setAllSurveys] = useState<Survey[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'surveys' | 'trash'>('dashboard');
  const [searchQuery, setSearchQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["פיצה", "סושי", "סלט"]);
  const [newLanguages, setNewLanguages] = useState<Language[]>(["he"]);
  const [isCreating, setIsCreating] = useState(false);
  const [appUrl, setAppUrl] = useState(window.location.origin);
  const [createdSurvey, setCreatedSurvey] = useState<Survey | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveToFavorites, setSaveToFavorites] = useState(false);

  useEffect(() => {
    console.log("AdminPanel mounted");
    loadStats();
    loadAllSurveys();
  }, []);

  const loadStats = async () => {
    try {
      // 1. Get active survey
      const { data: activeSurvey, error: surveyError } = await supabase
        .from("surveys")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (surveyError) throw surveyError;
      if (!activeSurvey) {
        setStats({ activeSurvey: null, daily: [], monthly: [], recentVotes: [] });
        return;
      }

      // 2. Get daily votes
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyVotes, error: dailyError } = await supabase
        .from("votes")
        .select("answer")
        .eq("survey_id", activeSurvey.id)
        .gte("created_at", `${today}T00:00:00`);

      if (dailyError) throw dailyError;

      // 3. Get monthly votes
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0,0,0,0);
      const { data: monthlyVotes, error: monthlyError } = await supabase
        .from("votes")
        .select("answer")
        .eq("survey_id", activeSurvey.id)
        .gte("created_at", firstOfMonth.toISOString());

      if (monthlyError) throw monthlyError;

      // 4. Get recent votes
      const { data: recentVotes, error: recentError } = await supabase
        .from("votes")
        .select("*")
        .eq("survey_id", activeSurvey.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      // Process daily/monthly maps
      const dailyMap: Record<string, number> = {};
      dailyVotes.forEach(v => dailyMap[v.answer] = (dailyMap[v.answer] || 0) + 1);
      const daily = Object.entries(dailyMap).map(([answer, count]) => ({ answer, count }));

      const monthlyMap: Record<string, number> = {};
      monthlyVotes.forEach(v => monthlyMap[v.answer] = (monthlyMap[v.answer] || 0) + 1);
      const monthly = Object.entries(monthlyMap).map(([answer, count]) => ({ answer, count }));

      setStats({ activeSurvey, daily, monthly, recentVotes: recentVotes || [] });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadAllSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAllSurveys(data || []);
    } catch (err) {
      setError("שגיאה בטעינת סקרים");
    }
  };

  const handleAddToFavorites = async (survey: Survey) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .insert([{
          name: survey.name || survey.question.substring(0, 50),
          question: survey.question,
          options: survey.options,
          languages: survey.languages,
        }]);
      if (error) throw error;
      alert("הסקר נוסף למועדפים בהצלחה!");
      loadStats();
    } catch (err) {
      setError("שגיאה בהוספה למועדפים");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק סקר זה? פעולה זו תעביר את הסקר לסל המחזור.")) return;
    try {
      const { error } = await supabase
        .from("surveys")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      loadAllSurveys();
      loadStats();
    } catch (err) {
      setError("שגיאה במחיקת סקר");
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const { error } = await supabase
        .from("surveys")
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
      loadAllSurveys();
      loadStats();
    } catch (err) {
      setError("שגיאה בשחזור סקר");
    }
  };

  const handleCreateSurvey = async () => {
    console.log("handleCreateSurvey called");
    if (!newQuestion || newOptions.length === 0) {
      alert("אנא מלא את שאלת הסקר ואת אפשרויות הבחירה.");
      return;
    }

    // Check limit
    const today = new Date().toISOString().split('T')[0];
    console.log("Checking limit for today:", today);
    const { count, error: countError } = await supabase
      .from("surveys")
      .select("*", { count: 'exact', head: true })
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);
    
    if (countError) {
      console.error("Error checking limit:", countError);
      setError("שגיאה בבדיקת מכסה: " + countError.message);
      return;
    }
    console.log("Current count:", count);
    if ((count || 0) >= 3) {
      alert("ניתן לרענן/ליצור סקר חדש עד 3 פעמים ביום בלבד.");
      return;
    }

    console.log("Inserting survey...");
    const { data, error } = await supabase
      .from("surveys")
      .insert([{
        name: newName || newQuestion.substring(0, 50),
        question: newQuestion,
        options: Array.isArray(newOptions) ? newOptions : [newOptions],
        languages: Array.isArray(newLanguages) ? newLanguages : [newLanguages],
      }])
      .select()
      .single();

    if (error) {
      console.error("Error inserting survey:", error);
      setError("שגיאה בשמירת הסקר: " + error.message);
      return;
    }
    console.log("Survey inserted:", data);

    if (saveToFavorites) {
      console.log("Saving to favorites...");
      await supabase
        .from("favorites")
        .insert([{
          name: newName || newQuestion.substring(0, 50),
          question: newQuestion,
          options: Array.isArray(newOptions) ? newOptions : [newOptions],
          languages: Array.isArray(newLanguages) ? newLanguages : [newLanguages],
        }]);
    }

    // Set the survey and generate the correct link
    setCreatedSurvey(data);
    setAppUrl(`${window.location.origin}/survey/${data.id}`);
    setNewName("");
    setNewQuestion("");
    setSaveToFavorites(false);
    loadStats();
    loadAllSurveys();
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleUseFavorite = (fav: Favorite) => {
    setNewName(fav.name);
    setNewQuestion(fav.question);
    setNewOptions(fav.options);
    setNewLanguages(fav.languages as Language[]);
    setIsCreating(true);
    setCreatedSurvey(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFavorite = async (id: number) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק סקר זה מהמועדפים?")) return;
    
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", id);
      if (error) throw error;
      loadStats();
    } catch (err) {
      setError("שגיאה במחיקת מועדף");
    }
  };

  const addOption = () => setNewOptions([...newOptions, ""]);
  const updateOption = (index: number, val: string) => {
    const updated = [...newOptions];
    updated[index] = val;
    setNewOptions(updated);
  };
  const removeOption = (index: number) => setNewOptions(newOptions.filter((_, i) => i !== index));

  const toggleLanguage = (lang: Language) => {
    if (newLanguages.includes(lang)) {
      if (newLanguages.length > 1) setNewLanguages(newLanguages.filter(l => l !== lang));
    } else {
      setNewLanguages([...newLanguages, lang]);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-3 bg-white rounded-2xl border border-black/5 hover:bg-black/5 transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-black/5">
            {[
              { id: 'dashboard', label: 'לוח בקרה' },
              { id: 'surveys', label: 'כל הסקרים' },
              { id: 'trash', label: 'סל מחזור' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-black text-white' : 'hover:bg-black/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            setIsCreating(!isCreating);
            setCreatedSurvey(null);
          }}
          className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-black/80 transition-all active:scale-95"
        >
          {isCreating ? <Trash2 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          {isCreating ? "ביטול" : "סקר חדש"}
        </button>
      </header>

      {error && (
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-red-600 font-bold flex flex-col items-center gap-2">
          <p>{error}</p>
          <button onClick={loadStats} className="text-sm underline">נסה שוב</button>
        </div>
      )}

      <AnimatePresence>
        {isCreating && !createdSurvey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-8 rounded-3xl border border-black/5 shadow-xl shadow-black/5 space-y-6 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-black/60">שם הסקר (לשימוש פנימי)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="למשל: סקר יום ראשון"
                  className="w-full p-4 bg-[#F8F9FA] rounded-2xl border border-black/5 focus:border-emerald-500 outline-none transition-all text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-black/60">שאלת הסקר</label>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="מה תרצו לאכול היום?"
                  className="w-full p-4 bg-[#F8F9FA] rounded-2xl border border-black/5 focus:border-emerald-500 outline-none transition-all text-lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-black/60">אפשרויות בחירה</label>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">טיפ: השתמש ב-| להפרדה בין עברית לרוסית (למשל: פיצה | Пицца)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {newOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="flex-1 p-3 bg-[#F8F9FA] rounded-xl border border-black/5 outline-none"
                    />
                    <button onClick={() => removeOption(i)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-black/10 rounded-xl text-black/40 hover:border-emerald-500 hover:text-emerald-500 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  הוסף אפשרות
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-black/60">שפות הסקר</label>
              <div className="flex gap-3">
                <button
                  onClick={() => toggleLanguage("he")}
                  className={`flex-1 p-4 rounded-2xl border font-bold transition-all ${
                    newLanguages.includes("he") ? "bg-emerald-500 text-white border-emerald-500" : "bg-white border-black/5 text-black/40"
                  }`}
                >
                  עברית
                </button>
                <button
                  onClick={() => toggleLanguage("ru")}
                  className={`flex-1 p-4 rounded-2xl border font-bold transition-all ${
                    newLanguages.includes("ru") ? "bg-emerald-500 text-white border-emerald-500" : "bg-white border-black/5 text-black/40"
                  }`}
                >
                  Русский
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={saveToFavorites} 
                  onChange={(e) => setSaveToFavorites(e.target.checked)}
                  className="w-5 h-5 rounded border-black/10 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-black/60 group-hover:text-black transition-colors">שמור במועדפים לשימוש חוזר</span>
              </label>
              <p className="text-xs text-black/40 bg-black/5 p-3 rounded-xl">
                <strong>מה זה מועדפים?</strong> מועדפים הם תבניות של סקרים שאתה אוהב. שמירה במועדפים מאפשרת לך להפעיל את אותו סקר שוב ושוב בימים שונים מבלי להקליד הכל מחדש. התוצאות של כל יום יישמרו בנפרד.
              </p>
            </div>

            <button
              onClick={handleCreateSurvey}
              className="w-full bg-emerald-600 text-white p-5 rounded-2xl font-bold text-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
            >
              שמור ופרסם סקר
            </button>
          </motion.div>
        )}

        {createdSurvey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 space-y-6"
          >
            <div className="flex items-center gap-3 text-emerald-700">
              <Check className="w-6 h-6" />
              <h2 className="text-xl font-bold">הסקר פורסם בהצלחה!</h2>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 space-y-4">
              <p className="text-sm font-bold text-black/40 uppercase tracking-wider">תצוגה מקדימה</p>
              <h3 className="text-2xl font-black">{createdSurvey.question}</h3>
              <div className="flex flex-wrap gap-2">
                {createdSurvey.options.map(opt => (
                  <span key={opt} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-bold text-sm border border-emerald-100">
                    {opt}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-black/60">קישור לסקר:</p>
              <div className="flex gap-2">
                <div className="flex-1 p-4 bg-white rounded-2xl border border-emerald-100 font-mono text-sm truncate">
                  {appUrl}
                </div>
                <button 
                  onClick={copyLink}
                  className="p-4 bg-white rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-colors text-emerald-600"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                <a 
                  href={appUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-4 bg-emerald-600 rounded-2xl text-white hover:bg-emerald-700 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            <button 
              onClick={() => {
                setIsCreating(false);
                setCreatedSurvey(null);
              }}
              className="text-emerald-600 font-bold hover:underline"
            >
              חזרה ללוח הבקרה
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'dashboard' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Survey Link Card */}
          <div className="lg:col-span-3 bg-gradient-to-r from-emerald-500 to-teal-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-500/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black">הסקר הפעיל שלך</h2>
              <p className="opacity-80">{stats?.activeSurvey?.question || "אין סקר פעיל"}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={loadStats}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all backdrop-blur-sm"
                title="רענן נתונים"
              >
                <PlusCircle className="w-5 h-5 rotate-45" />
              </button>
              <button 
                onClick={() => {
                  if (stats?.activeSurvey) {
                    navigator.clipboard.writeText(`${appUrl}/survey/${stats.activeSurvey.id}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl font-bold transition-all backdrop-blur-sm"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                העתק קישור
              </button>
              <a 
                href={stats?.activeSurvey ? `${appUrl}/survey/${stats.activeSurvey.id}` : appUrl}
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-2xl font-bold transition-all shadow-lg"
              >
                <ExternalLink className="w-5 h-5" />
                פתח סקר
              </a>
            </div>
          </div>

          {/* Daily Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-bold">תוצאות היום</h2>
              </div>
              <span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">חי</span>
            </div>
            
            <div className="h-[300px] w-full min-w-[300px]">
              {stats?.daily && stats.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.daily}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="answer" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: '#f8f9fa' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {stats.daily.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-black/20">אין נתונים להצגה</div>
              )}
            </div>
          </div>

          {/* Monthly Stats */}
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold">סטטיסטיקה חודשית</h2>
            </div>
            
            <div className="space-y-4">
              {stats?.monthly && stats.monthly.length > 0 ? (
                stats.monthly.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-white shadow-sm">
                        {i + 1}
                      </div>
                      <span className="font-bold">{item.answer}</span>
                    </div>
                    <span className="text-emerald-600 font-black">{item.count} פעמים</span>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-black/20">אין מספיק נתונים</p>
              )}
            </div>
          </div>

          {/* Recent Voters */}
          <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold">מצביעים אחרונים</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-black/40 text-sm border-b border-black/5">
                    <th className="pb-4 font-bold">שם העובד</th>
                    <th className="pb-4 font-bold">בחירה</th>
                    <th className="pb-4 font-bold">הערה</th>
                    <th className="pb-4 font-bold">זמן</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {stats?.recentVotes?.map((vote, i) => (
                    <tr key={i} className="group hover:bg-[#F8F9FA] transition-colors">
                      <td className="py-4 font-bold">{vote.employee_name}</td>
                      <td className="py-4">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold">
                          {vote.answer}
                        </span>
                      </td>
                      <td className="py-4 text-black/40 italic">{vote.other_text || "-"}</td>
                      <td className="py-4 text-sm text-black/30">
                        {new Date(vote.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Favorites Section */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-xl font-bold">סקרים שמורים (מועדפים)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats?.favorites && stats.favorites.length > 0 ? (
                stats.favorites.map((fav) => (
                  <motion.div 
                    key={fav.id}
                    whileHover={{ y: -4 }}
                    className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg leading-tight">{fav.name || fav.question}</h3>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">תבנית</span>
                      </div>
                      <p className="text-sm text-black/40 line-clamp-2">{fav.question}</p>
                      <div className="flex flex-wrap gap-1">
                        {fav.options.slice(0, 3).map(opt => (
                          <span key={opt} className="text-[10px] px-2 py-1 bg-black/5 rounded-full opacity-60">
                            {opt}
                          </span>
                        ))}
                        {fav.options.length > 3 && <span className="text-[10px] opacity-40">+{fav.options.length - 3}</span>}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4 border-t border-black/5">
                      <button 
                        onClick={() => handleUseFavorite(fav)}
                        className="flex-1 bg-emerald-50 text-emerald-700 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        השתמש שוב
                      </button>
                      <button 
                        onClick={() => handleDeleteFavorite(fav.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 bg-white rounded-3xl border border-dashed border-black/10 text-center space-y-2">
                  <Bookmark className="w-8 h-8 mx-auto opacity-10" />
                  <p className="text-black/30 font-medium">אין סקרים שמורים במועדפים</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'surveys' && (
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <input 
            type="text" 
            placeholder="חיפוש סקרים..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 bg-[#F8F9FA] rounded-2xl border border-black/5 outline-none"
          />
          <div className="space-y-4">
            {allSurveys.filter(s => !s.deleted_at && (s.name?.includes(searchQuery) || s.question.includes(searchQuery))).map(survey => (
              <div key={survey.id} className="flex justify-between items-center p-4 bg-[#F8F9FA] rounded-2xl">
                <span>{survey.name || survey.question}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleAddToFavorites(survey)} className="text-emerald-500 hover:text-emerald-600" title="הוסף למועדפים">
                    <Star className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(survey.id)} className="text-red-500 hover:text-red-600" title="מחק">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'trash' && (
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <div className="space-y-4">
            {allSurveys.filter(s => s.deleted_at).map(survey => (
              <div key={survey.id} className="flex justify-between items-center p-4 bg-[#F8F9FA] rounded-2xl">
                <div>
                  <span>{survey.name || survey.question}</span>
                  <p className="text-xs text-black/40">נוצר: {new Date(survey.created_at).toLocaleDateString()}, נמחק: {new Date(survey.deleted_at!).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleRestore(survey.id)} className="text-emerald-500">שחזר</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
