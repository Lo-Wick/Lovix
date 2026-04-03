// src/App.jsx
// Dépendances : npm install @supabase/supabase-js
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase clients ──────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY     = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY  = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const ADMIN_PASS   = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

const supabase      = createClient(SUPABASE_URL, ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Helpers ───────────────────────────────────────────────────────
const fmtSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1e6) return (bytes / 1e3).toFixed(0) + " KB";
  if (bytes < 1e9) return (bytes / 1e6).toFixed(1) + " MB";
  return (bytes / 1e9).toFixed(2) + " GB";
};

const EMOJIS = ["🎬","🎥","🦇","🚀","💼","💊","🏆","⚡","🔥","💫","🎭","🌊","🐉","👁️","🎪"];

// ── Styles réutilisables ──────────────────────────────────────────
const inp = {
  background: "#0d0d14", border: "1px solid #2a2a3a",
  borderRadius: 8, padding: "10px 14px", color: "#e8e0d0",
  fontFamily: "'Courier New', monospace", fontSize: 14,
  outline: "none", width: "100%", boxSizing: "border-box",
};

const btn = (bg, color, border = "none") => ({
  background: bg, color, border,
  borderRadius: 8, padding: "10px 18px",
  fontFamily: "'Courier New', monospace",
  fontWeight: "bold", fontSize: 13, cursor: "pointer",
  transition: "opacity 0.15s",
});

// ═════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView]               = useState("public"); // public | login | admin
  const [movies, setMovies]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [adminAuth, setAdminAuth]     = useState(false);
  const [adminPass, setAdminPass]     = useState("");
  const [authError, setAuthError]     = useState(false);
  const [notification, setNotif]      = useState(null);
  const [streamMovie, setStreamMovie] = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadPct, setUploadPct]     = useState(0);
  const [newMovie, setNewMovie]       = useState({
    title: "", genre: "", year: "", description: "", poster_emoji: "🎬",
  });
  const [fileToUpload, setFileToUpload] = useState(null);

  // ── Fetch movies ─────────────────────────────────────────────
  const fetchMovies = async (asAdmin = false) => {
    setLoading(true);
    const client = asAdmin ? supabaseAdmin : supabase;
    const query  = asAdmin
      ? client.from("movies").select("*").order("created_at", { ascending: false })
      : client.from("movies").select("*").eq("blocked", false).order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) { notify("Erreur chargement: " + error.message, "error"); }
    else setMovies(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMovies(adminAuth); }, [adminAuth]);

  // ── Notification ─────────────────────────────────────────────
  const notify = (msg, type = "success") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3500);
  };

  // ── Auth admin ───────────────────────────────────────────────
  const handleLogin = () => {
    if (adminPass === ADMIN_PASS) {
      setAdminAuth(true); setAuthError(false); setView("admin");
      fetchMovies(true);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setAdminAuth(false); setView("public"); setAdminPass("");
    fetchMovies(false);
  };

  // ── Upload + Ajout ───────────────────────────────────────────
  const handleAddMovie = async () => {
    if (!newMovie.title || !newMovie.genre || !newMovie.year) {
      notify("Titre, genre et année sont obligatoires", "error"); return;
    }
    if (!fileToUpload) {
      notify("Sélectionne un fichier vidéo", "error"); return;
    }

    setUploading(true); setUploadPct(0);

    // 1. Upload fichier dans Storage
    const ext      = fileToUpload.name.split(".").pop();
    const filePath = `${Date.now()}_${newMovie.title.replace(/\s+/g, "_")}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("movies")
      .upload(filePath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
      });

    if (upErr) {
      notify("Erreur upload: " + upErr.message, "error");
      setUploading(false); return;
    }

    setUploadPct(70);

    // 2. Récupérer l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from("movies")
      .getPublicUrl(filePath);

    setUploadPct(85);

    // 3. Insérer en base
    const { error: dbErr } = await supabaseAdmin.from("movies").insert({
      title:        newMovie.title,
      genre:        newMovie.genre,
      year:         parseInt(newMovie.year),
      description:  newMovie.description,
      poster_emoji: newMovie.poster_emoji,
      size:         fmtSize(fileToUpload.size),
      file_path:    filePath,
      file_url:     urlData.publicUrl,
      blocked:      false,
    });

    setUploadPct(100);

    if (dbErr) {
      notify("Erreur base de données: " + dbErr.message, "error");
    } else {
      notify(`"${newMovie.title}" ajouté avec succès ✓`);
      setNewMovie({ title: "", genre: "", year: "", description: "", poster_emoji: "🎬" });
      setFileToUpload(null);
      fetchMovies(true);
    }

    setUploading(false); setUploadPct(0);
  };

  // ── Supprimer ────────────────────────────────────────────────
  const handleDelete = async (movie) => {
    if (!window.confirm(`Supprimer "${movie.title}" définitivement ?`)) return;

    // Supprimer du Storage
    if (movie.file_path) {
      await supabaseAdmin.storage.from("movies").remove([movie.file_path]);
    }
    // Supprimer de la DB
    const { error } = await supabaseAdmin.from("movies").delete().eq("id", movie.id);
    if (error) notify("Erreur suppression: " + error.message, "error");
    else { notify(`"${movie.title}" supprimé ✓`); fetchMovies(true); }
  };

  // ── Bloquer / Débloquer ──────────────────────────────────────
  const handleToggleBlock = async (movie) => {
    const { error } = await supabaseAdmin
      .from("movies")
      .update({ blocked: !movie.blocked })
      .eq("id", movie.id);
    if (error) notify("Erreur: " + error.message, "error");
    else {
      notify(movie.blocked ? `"${movie.title}" débloqué ✓` : `"${movie.title}" bloqué 🔒`);
      fetchMovies(true);
    }
  };

  // ── Stream ───────────────────────────────────────────────────
  const handleStream = (movie) => {
    if (movie.blocked) { notify("Film bloqué par l'administrateur 🔒", "error"); return; }
    setStreamMovie(movie);
  };

  // ── Download ─────────────────────────────────────────────────
  const handleDownload = (movie) => {
    if (movie.blocked) { notify("Film bloqué par l'administrateur 🔒", "error"); return; }
    if (!movie.file_url) { notify("Fichier non disponible", "error"); return; }
    const a = document.createElement("a");
    a.href = movie.file_url;
    a.download = movie.title;
    a.click();
    notify(`Téléchargement de "${movie.title}" démarré ⬇️`);
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: "#09090f", fontFamily: "'Courier New', monospace", color: "#e8e0d0" }}>

      {/* ── Notification ── */}
      {notification && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: notification.type === "error" ? "#c0392b" : "#1e6b3a",
          color: "#fff", padding: "12px 22px", borderRadius: 8,
          fontWeight: "bold", fontSize: 14, boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
          animation: "popIn .25s ease",
        }}>
          {notification.msg}
        </div>
      )}

      {/* ── Modal Stream ── */}
      {streamMovie && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)",
          zIndex: 9000, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 20, padding: 24,
        }}>
          <div style={{ fontSize: 60 }}>{streamMovie.poster_emoji}</div>
          <div style={{ fontSize: 26, fontWeight: "bold", color: "#d4a843" }}>{streamMovie.title}</div>
          <div style={{ color: "#555", fontSize: 13 }}>{streamMovie.genre} · {streamMovie.year} · {streamMovie.size}</div>

          {streamMovie.file_url ? (
            <video
              src={streamMovie.file_url}
              controls
              autoPlay
              style={{ width: "min(800px, 90vw)", borderRadius: 12, border: "2px solid #2a2a3a", background: "#000" }}
            />
          ) : (
            <div style={{
              width: "min(800px, 90vw)", height: 400, background: "#111",
              border: "2px solid #2a2a3a", borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10,
            }}>
              <span style={{ fontSize: 48 }}>▶️</span>
              <span style={{ color: "#555", fontSize: 14 }}>Fichier non disponible</span>
            </div>
          )}

          <button onClick={() => setStreamMovie(null)} style={btn("#c0392b", "#fff")}>
            ✕ Fermer
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <header style={{
        background: "#0d0d14", borderBottom: "2px solid #d4a843",
        padding: "0 40px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>🎬</span>
          <span style={{ fontSize: 20, fontWeight: "bold", color: "#d4a843", letterSpacing: 3 }}>
            CINÉ<span style={{ color: "#e8e0d0" }}>STREAM</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["public", "admin"].map(v => (
            <button
              key={v}
              onClick={() => v === "admin" ? setView(adminAuth ? "admin" : "login") : (setView("public"), adminAuth && fetchMovies(false))}
              style={{
                ...btn(view === v || (v === "admin" && view === "login") ? "#d4a843" : "transparent",
                       view === v || (v === "admin" && view === "login") ? "#000" : "#666"),
                border: "1px solid " + (view === v ? "#d4a843" : "#2a2a3a"),
                fontSize: 12, letterSpacing: 1,
              }}
            >
              {v === "public" ? "🏠 PUBLIC" : "🔐 ADMIN"}
            </button>
          ))}
        </div>
      </header>

      {/* ══════════════ VUE PUBLIQUE ══════════════ */}
      {view === "public" && (
        <main style={{ padding: "40px" }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 30, color: "#d4a843", margin: 0, letterSpacing: 1 }}>Films Disponibles</h1>
            <p style={{ color: "#444", marginTop: 6, fontSize: 14 }}>
              {loading ? "Chargement..." : `${movies.length} film(s) disponibles`}
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: "#444", fontSize: 18 }}>
              ⏳ Chargement des films...
            </div>
          ) : movies.length === 0 ? (
            <div style={{ textAlign: "center", padding: 80, color: "#333", fontSize: 16 }}>
              Aucun film disponible pour le moment.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
              gap: 24,
            }}>
              {movies.map(movie => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onStream={handleStream}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* ══════════════ LOGIN ADMIN ══════════════ */}
      {view === "login" && (
        <main style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "calc(100vh - 64px)",
        }}>
          <div style={{
            background: "#0d0d14", border: "1px solid #1e1e2e",
            borderRadius: 16, padding: 48, width: 360,
            display: "flex", flexDirection: "column", gap: 18,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🔐</div>
              <h2 style={{ color: "#d4a843", margin: 0, fontSize: 22, letterSpacing: 2 }}>ACCÈS ADMIN</h2>
            </div>
            <input
              type="password"
              placeholder="Mot de passe..."
              value={adminPass}
              onChange={e => { setAdminPass(e.target.value); setAuthError(false); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ ...inp, border: "1px solid " + (authError ? "#c0392b" : "#2a2a3a") }}
            />
            {authError && (
              <p style={{ color: "#c0392b", margin: 0, fontSize: 13, textAlign: "center" }}>
                Mot de passe incorrect
              </p>
            )}
            <button onClick={handleLogin} style={{ ...btn("#d4a843", "#000"), padding: "14px", fontSize: 15 }}>
              Connexion
            </button>
          </div>
        </main>
      )}

      {/* ══════════════ PANNEAU ADMIN ══════════════ */}
      {view === "admin" && adminAuth && (
        <main style={{ padding: "40px" }}>
          {/* Header admin */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 26, color: "#d4a843", margin: 0, letterSpacing: 1 }}>Panneau Admin</h1>
              <p style={{ color: "#444", marginTop: 4, fontSize: 13 }}>
                {loading ? "..." : `${movies.length} films · ${movies.filter(m => m.blocked).length} bloqués`}
              </p>
            </div>
            <button onClick={handleLogout} style={btn("transparent", "#c0392b", "1px solid #c0392b")}>
              Déconnexion
            </button>
          </div>

          {/* ── Formulaire ajout ── */}
          <div style={{
            background: "#0d0d14", border: "1px solid #1e1e2e",
            borderRadius: 14, padding: 28, marginBottom: 36,
          }}>
            <h2 style={{ color: "#d4a843", margin: "0 0 20px", fontSize: 17 }}>➕ Ajouter un Film</h2>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input placeholder="Titre *" value={newMovie.title}
                onChange={e => setNewMovie({ ...newMovie, title: e.target.value })} style={inp} />
              <input placeholder="Genre *" value={newMovie.genre}
                onChange={e => setNewMovie({ ...newMovie, genre: e.target.value })} style={inp} />
              <input placeholder="Année *" value={newMovie.year} type="number"
                onChange={e => setNewMovie({ ...newMovie, year: e.target.value })} style={inp} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 12 }}>
              <input placeholder="Description (optionnel)" value={newMovie.description}
                onChange={e => setNewMovie({ ...newMovie, description: e.target.value })} style={inp} />
              <select value={newMovie.poster_emoji}
                onChange={e => setNewMovie({ ...newMovie, poster_emoji: e.target.value })}
                style={{ ...inp, width: "auto", cursor: "pointer" }}>
                {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* Upload fichier */}
            <div style={{
              border: "2px dashed #2a2a3a", borderRadius: 10, padding: 20,
              textAlign: "center", marginBottom: 16, cursor: "pointer",
              background: fileToUpload ? "#0a1a0a" : "transparent",
              transition: "background 0.2s",
            }}
              onClick={() => document.getElementById("fileInput").click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setFileToUpload(e.dataTransfer.files[0]); }}
            >
              <input
                id="fileInput" type="file"
                accept="video/mp4,video/x-matroska,video/avi,video/webm"
                style={{ display: "none" }}
                onChange={e => setFileToUpload(e.target.files[0])}
              />
              {fileToUpload ? (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                  <div style={{ color: "#4caf50", fontWeight: "bold" }}>{fileToUpload.name}</div>
                  <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>{fmtSize(fileToUpload.size)}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                  <div style={{ color: "#555" }}>Glisse ton fichier ici ou clique pour choisir</div>
                  <div style={{ color: "#333", fontSize: 12, marginTop: 4 }}>MP4, MKV, AVI, WEBM</div>
                </div>
              )}
            </div>

            {/* Barre de progression */}
            {uploading && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#888" }}>
                  <span>Upload en cours...</span>
                  <span>{uploadPct}%</span>
                </div>
                <div style={{ background: "#1e1e2e", borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: "#d4a843",
                    width: uploadPct + "%", transition: "width 0.3s ease",
                    borderRadius: 6,
                  }} />
                </div>
              </div>
            )}

            <button
              onClick={handleAddMovie}
              disabled={uploading}
              style={{
                ...btn(uploading ? "#333" : "#d4a843", uploading ? "#666" : "#000"),
                padding: "12px 32px", fontSize: 15,
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? "⏳ Upload en cours..." : "➕ Ajouter le film"}
            </button>
          </div>

          {/* ── Liste films admin ── */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#444" }}>⏳ Chargement...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {movies.map(movie => (
                <AdminMovieRow
                  key={movie.id}
                  movie={movie}
                  onDelete={handleDelete}
                  onToggleBlock={handleToggleBlock}
                />
              ))}
            </div>
          )}
        </main>
      )}

      <style>{`
        @keyframes popIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #3a3a4a; }
        select option { background: #0d0d14; color: #e8e0d0; }
        button:hover { opacity: 0.85; }
        input:focus, select:focus { border-color: #d4a843 !important; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: #0d0d14; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 3px; }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Composant : Carte film publique
// ══════════════════════════════════════════════════════════════════
function MovieCard({ movie, onStream, onDownload }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: "#0d0d14",
        border: "1px solid " + (hovered && !movie.blocked ? "#d4a843" : "#1e1e2e"),
        borderRadius: 14, overflow: "hidden",
        transform: hovered && !movie.blocked ? "translateY(-4px)" : "none",
        boxShadow: hovered && !movie.blocked ? "0 12px 40px rgba(212,168,67,0.12)" : "none",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <div style={{
        height: 150, background: "#060610",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 68, position: "relative",
      }}>
        {movie.poster_emoji}
        {movie.blocked && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span style={{ fontSize: 34 }}>🔒</span>
            <span style={{ color: "#c0392b", fontSize: 11, fontWeight: "bold", letterSpacing: 2 }}>BLOQUÉ</span>
          </div>
        )}
      </div>

      {/* Infos */}
      <div style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, color: movie.blocked ? "#444" : "#e8e0d0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {movie.title}
        </h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {[movie.genre, movie.year, movie.size].filter(Boolean).map((tag, i) => (
            <span key={i} style={{ background: "#131320", padding: "2px 9px", borderRadius: 20, fontSize: 11, color: "#555" }}>
              {tag}
            </span>
          ))}
        </div>
        {movie.description && (
          <p style={{ color: "#444", fontSize: 12, margin: "0 0 12px", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {movie.description}
          </p>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onStream(movie)}
            style={{
              flex: 1, background: movie.blocked ? "#131320" : "#d4a843",
              color: movie.blocked ? "#333" : "#000",
              border: "none", borderRadius: 8, padding: "10px 0",
              fontFamily: "inherit", fontWeight: "bold", fontSize: 13,
              cursor: movie.blocked ? "not-allowed" : "pointer",
            }}
          >
            ▶ Regarder
          </button>
          <button
            onClick={() => onDownload(movie)}
            style={{
              flex: 1, background: "transparent",
              color: movie.blocked ? "#2a2a2a" : "#666",
              border: "1px solid " + (movie.blocked ? "#1a1a1a" : "#2a2a3a"),
              borderRadius: 8, padding: "10px 0",
              fontFamily: "inherit", fontWeight: "bold", fontSize: 13,
              cursor: movie.blocked ? "not-allowed" : "pointer",
            }}
          >
            ⬇ Télécharger
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Composant : Ligne film admin
// ══════════════════════════════════════════════════════════════════
function AdminMovieRow({ movie, onDelete, onToggleBlock }) {
  return (
    <div style={{
      background: "#0d0d14",
      border: "1px solid " + (movie.blocked ? "#3a1a1a" : "#1e1e2e"),
      borderRadius: 12, padding: "14px 20px",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <span style={{ fontSize: 32, flexShrink: 0 }}>{movie.poster_emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "bold", fontSize: 16, color: movie.blocked ? "#555" : "#e8e0d0" }}>
          {movie.title}
          {movie.blocked && (
            <span style={{ marginLeft: 10, fontSize: 11, color: "#c0392b",
              background: "#3a0a0a", padding: "2px 8px", borderRadius: 4, letterSpacing: 1 }}>
              BLOQUÉ
            </span>
          )}
        </div>
        <div style={{ color: "#444", fontSize: 12, marginTop: 3 }}>
          {[movie.genre, movie.year, movie.size].filter(Boolean).join(" · ")}
        </div>
        {movie.file_path && (
          <div style={{ color: "#2a2a4a", fontSize: 11, marginTop: 2, fontFamily: "monospace" }}>
            📁 {movie.file_path}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onToggleBlock(movie)}
          style={{
            background: movie.blocked ? "#0a2a0a" : "#2a0a0a",
            color: movie.blocked ? "#4caf50" : "#c0392b",
            border: "1px solid " + (movie.blocked ? "#4caf5033" : "#c0392b44"),
            borderRadius: 8, padding: "8px 16px",
            fontFamily: "inherit", fontSize: 13, cursor: "pointer", fontWeight: "bold",
          }}
        >
          {movie.blocked ? "🔓 Débloquer" : "🔒 Bloquer"}
        </button>
        <button
          onClick={() => onDelete(movie)}
          style={{
            background: "#1a0505", color: "#c0392b",
            border: "1px solid #c0392b33",
            borderRadius: 8, padding: "8px 14px",
            fontFamily: "inherit", fontSize: 13, cursor: "pointer",
          }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}
