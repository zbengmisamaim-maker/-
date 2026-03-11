import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Plus, Trash2, BarChart3, Users, Calendar, PlusCircle, ArrowRight, Copy, ExternalLink, Check, Heart, Bookmark, Star } from "lucide-react";
import { Stats, Language, Survey, Favorite } from "../types";
import { Link } from "react-router-dom";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["פיצה", "סושי", "סלט"]);
  const [newLanguages, setNewLanguages] = useState<Language[]>(["he"]);
  const [isCreating, setIsCreating] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const [createdSurvey, setCreatedSurvey] = useState<Survey | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveToFavorites, setSaveToFavorites] = useState(false);

  useEffect(() => {
    loadStats();
    fetch("/api/config")
      .then(res => res.json())
      .then(data => {
        if (data && data.appUrl) {
          setAppUrl(data.appUrl);
        }
      })
      .catch(() => setError("לא ניתן לטעון הגדרות שרת"));
  }, []);

  const loadStats = () => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("שגיאה בטעינת נתונים מ-Supabase. וודא שהטבלאות קיימות והמפתח תקין.");
        return res.json();
      })
      .then(setStats)
      .catch(err => setError(err.message));
  };

  const handleCreateSurvey = async () => {
    if (!newQuestion || newOptions.length === 0) return;

    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: newQuestion,
        options: newOptions,
        languages: newLanguages,
        saveToFavorites: saveToFavorites,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setCreatedSurvey(data);
      setNewQuestion("");
      setSaveToFavorites(false);
      loadStats();
    }
  };

  const handleUseFavorite = (fav: Favorite) => {
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
      const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadStats();
      }
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
          <div>
            <h1 className="text-3xl font-black tracking-tight">לוח בקרה למנהל</h1>
            <p className="text-black/40">נהל סקרים וצפה בסטטיסטיקות בזמן אמת</p>
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

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={saveToFavorites} 
                  onChange={(e) => setSaveToFavorites(e.target.checked)}
                  className="w-5 h-5 rounded border-black/10 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-black/60 group-hover:text-black transition-colors">שמור במועדפים לשימוש חוזר</span>
              </label>
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

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Survey Link Card */}
          <div className="lg:col-span-3 bg-gradient-to-r from-emerald-500 to-teal-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-500/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black">הסקר הפעיל שלך</h2>
              <p className="opacity-80">{stats?.activeSurvey?.question || "אין סקר פעיל"}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={copyLink}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl font-bold transition-all backdrop-blur-sm"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                העתק קישור
              </button>
              <a 
                href={appUrl} 
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
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="answer" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8f9fa' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {stats?.daily?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
                      <h3 className="font-bold text-lg leading-tight">{fav.question}</h3>
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
    </div>
  );
}
