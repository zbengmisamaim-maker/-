import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Get App URL for links
  app.get("/api/config", (req, res) => {
    res.json({ appUrl: process.env.APP_URL || "http://localhost:3000" });
  });

  // Create a new survey
  app.post("/api/surveys", async (req, res) => {
    const { name, question, options, languages, saveToFavorites } = req.body;
    try {
      const { data, error } = await supabase
        .from("surveys")
        .insert([{ name, question, options, languages }])
        .select()
        .single();
      
      if (error) throw error;

      if (saveToFavorites) {
        await supabase
          .from("favorites")
          .insert([{ name: name || question.substring(0, 50), question, options, languages }]);
      }

      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create survey" });
    }
  });

  // Favorites Endpoints
  app.get("/api/favorites", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    const { name, question, options, languages } = req.body;
    try {
      const { data, error } = await supabase
        .from("favorites")
        .insert([{ name, question, options, languages }])
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save favorite" });
    }
  });

  app.delete("/api/favorites/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete favorite" });
    }
  });

  // Get active survey (the latest one, not deleted)
  app.get("/api/surveys/active", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return res.status(404).json({ error: "No active survey found" });
      
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch survey" });
    }
  });

  // Get survey by ID
  app.get("/api/surveys/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch survey" });
    }
  });

  // Get all surveys (with filters)
  app.get("/api/surveys", async (req, res) => {
    const { includeDeleted } = req.query;
    try {
      let query = supabase.from("surveys").select("*").order("created_at", { ascending: false });
      if (includeDeleted !== 'true') {
        query = query.is("deleted_at", null);
      }
      const { data, error } = await query;
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch surveys" });
    }
  });

  // Get count of surveys created today
  app.get("/api/surveys/count-today", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from("surveys")
        .select("*", { count: 'exact', head: true })
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);
      
      if (error) throw error;
      res.json({ count: count || 0 });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch count" });
    }
  });

  // Soft Delete survey
  app.delete("/api/surveys/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase
        .from("surveys")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete survey" });
    }
  });

  // Restore survey
  app.post("/api/surveys/:id/restore", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase
        .from("surveys")
        .update({ deleted_at: null })
        .eq("id", id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to restore survey" });
    }
  });

  // Submit a vote
  app.post("/api/votes", async (req, res) => {
    const { surveyId, employeeName, answer, otherText } = req.body;
    
    try {
      // Check if already voted today (Supabase query)
      const today = new Date().toISOString().split('T')[0];
      const { data: existing, error: checkError } = await supabase
        .from("votes")
        .select("id")
        .eq("employee_name", employeeName)
        .eq("survey_id", surveyId)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        return res.status(400).json({ error: "Already voted today" });
      }

      const { error: insertError } = await supabase
        .from("votes")
        .insert([{ survey_id: surveyId, employee_name: employeeName, answer, other_text: otherText || null }]);

      if (insertError) throw insertError;
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to submit vote" });
    }
  });

  // Get stats for admin
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const { data: activeSurvey, error: surveyError } = await supabase
        .from("surveys")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (surveyError && surveyError.code !== 'PGRST116') throw surveyError;
      if (!activeSurvey) return res.json({ daily: [], monthly: [], recentVotes: [] });

      const today = new Date().toISOString().split('T')[0];

      // Daily results
      const { data: dailyVotes, error: dailyError } = await supabase
        .from("votes")
        .select("answer")
        .eq("survey_id", activeSurvey.id)
        .gte("created_at", `${today}T00:00:00`);

      if (dailyError) throw dailyError;

      const dailyMap: Record<string, number> = {};
      dailyVotes.forEach(v => {
        dailyMap[v.answer] = (dailyMap[v.answer] || 0) + 1;
      });
      const daily = Object.entries(dailyMap).map(([answer, count]) => ({ answer, count }));

      // Monthly results
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0,0,0,0);

      const { data: monthlyVotes, error: monthlyError } = await supabase
        .from("votes")
        .select("answer")
        .gte("created_at", firstOfMonth.toISOString());

      if (monthlyError) throw monthlyError;

      const monthlyMap: Record<string, number> = {};
      monthlyVotes.forEach(v => {
        monthlyMap[v.answer] = (monthlyMap[v.answer] || 0) + 1;
      });
      const monthly = Object.entries(monthlyMap)
        .map(([answer, count]) => ({ answer, count }))
        .sort((a, b) => b.count - a.count);

      // Recent votes
      const { data: recentVotes, error: recentError } = await supabase
        .from("votes")
        .select("*")
        .eq("survey_id", activeSurvey.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (recentError) throw recentError;

      // Favorites
      const { data: favorites, error: favError } = await supabase
        .from("favorites")
        .select("*")
        .order("created_at", { ascending: false });

      res.json({ daily, monthly, recentVotes, activeSurvey, favorites: favorites || [] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
