import { useState } from "react";

const initialMovies = [
  { id: 1, title: "Inception", genre: "Sci-Fi", year: 2010, size: "2.1 GB", poster: "🎬", blocked: false, url: "#" },
  { id: 2, title: "The Dark Knight", genre: "Action", year: 2008, size: "1.8 GB", poster: "🦇", blocked: false, url: "#" },
  { id: 3, title: "Interstellar", genre: "Sci-Fi", year: 2014, size: "2.5 GB", poster: "🚀", blocked: true, url: "#" },
  { id: 4, title: "Pulp Fiction", genre: "Crime", year: 1994, size: "1.4 GB", poster: "💼", blocked: false, url: "#" },
  { id: 5, title: "The Matrix", genre: "Sci-Fi", year: 1999, size: "1.6 GB", poster: "💊", blocked: false, url: "#" },
];

export default function App() {
  const [movies, setMovies] = useState(initialMovies);
  const [view, setView] = useState("public"); // "public" | "admin"
  const [adminPass, setAdminPass] = useState("");
  const [adminAuth, setAdminAuth] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [newMovie, setNewMovie] = useState({ title: "", genre: "", year: "", size: "", poster: "🎥", url: "" });
  const [notification, setNotification] = useState(null);
  const [streamingMovie, setStreamingMovie] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAdminLogin = () => {
    if (adminPass === "admin123") {
      setAdminAuth(true);
      setAuthError(false);
      setView("admin");
    } else {
      setAuthError(true);
    }
  };

  const handleDelete = (id) => {
    setMovies(movies.filter(m => m.id !== id));
    notify("Film supprimé ✓");
  };

  const handleToggleBlock = (id) => {
    setMovies(movies.map(m => m.id === id ? { ...m, blocked: !m.blocked } : m));
    const movie = movies.find(m => m.id === id);
    notify(movie.blocked ? `"${movie.title}" débloqué ✓` : `"${movie.title}" bloqué 🔒`);
  };

  const handleAddMovie = () => {
    if (!newMovie.title || !newMovie.genre || !newMovie.year) {
      notify("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }
    const movie = {
      ...newMovie,
      id: Date.now(),
      year: parseInt(newMovie.year),
      blocked: false,
      url: newMovie.url || "#",
    };
    setMovies([...movies, movie]);
    setNewMovie({ title: "", genre: "", year: "", size: "", poster: "🎥", url: "" });
    notify(`"${movie.title}" ajouté ✓`);
  };

  const handleStream = (movie) => {
    if (movie.blocked) {
      notify("Ce film est bloqué par l'administrateur 🔒", "error");
      return;
    }
    setStreamingMovie(movie);
  };

  const handleDownload = (movie) => {
    if (movie.blocked) {
      notify("Ce film est bloqué par l'administrateur 🔒", "error");
      return;
    }
    notify(`Téléchargement de "${movie.title}" en cours... ⬇️`);
  };

  const emojis = ["🎬", "🎥", "🦇", "🚀", "💼", "💊", "🏆", "⚡", "🔥", "💫", "🎭", "🌊"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Courier New', monospace",
      color: "#e8e8e8",
    }}>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: notification.type === "error" ? "#ff3b30" : "#1a8a4a",
          color: "#fff", padding: "12px 20px", borderRadius: 8,
          fontWeight: "bold", fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          animation: "slideIn 0.3s ease",
        }}>
          {notification.msg}
        </div>
      )}

      {/* Stream Modal */}
      {streamingMovie && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9000,
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20,
        }}>
          <div style={{ fontSize: 80 }}>{streamingMovie.poster}</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#e8c96b" }}>{streamingMovie.title}</div>
          <div style={{
            width: 640, height: 360, background: "#111", border: "2px solid #333",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12,
          }}>
            <div style={{ fontSize: 48 }}>▶️</div>
            <div style={{ color: "#888", fontSize: 14 }}>Lecteur vidéo — {streamingMovie.title}</div>
            <div style={{ color: "#555", fontSize: 12 }}>({streamingMovie.year} · {streamingMovie.genre} · {streamingMovie.size})</div>
          </div>
          <button
            onClick={() => setStreamingMovie(null)}
            style={{
              background: "#ff3b30", color: "#fff", border: "none",
              padding: "12px 32px", borderRadius: 8, fontSize: 16,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ✕ Fermer
          </button>
        </div>
      )}

      {/* Header */}
      <header style={{
        background: "#12121a",
        borderBottom: "2px solid #e8c96b",
        padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🎬</span>
          <span style={{ fontSize: 22, fontWeight: "bold", color: "#e8c96b", letterSpacing: 2 }}>CINÉ<span style={{ color: "#fff" }}>STREAM</span></span>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setView("public")}
            style={{
              background: view === "public" ? "#e8c96b" : "transparent",
              color: view === "public" ? "#000" : "#888",
              border: "1px solid " + (view === "public" ? "#e8c96b" : "#333"),
              padding: "8px 20px", borderRadius: 6, cursor: "pointer",
              fontFamily: "inherit", fontWeight: "bold", fontSize: 13,
            }}
          >
            🏠 PUBLIC
          </button>
          <button
            onClick={() => setView(adminAuth ? "admin" : "login")}
            style={{
              background: view === "admin" ? "#e8c96b" : "transparent",
              color: view === "admin" ? "#000" : "#888",
              border: "1px solid " + (view === "admin" ? "#e8c96b" : "#333"),
              padding: "8px 20px", borderRadius: 6, cursor: "pointer",
              fontFamily: "inherit", fontWeight: "bold", fontSize: 13,
            }}
          >
            🔐 ADMIN
          </button>
        </nav>
      </header>

      {/* PUBLIC VIEW */}
      {view === "public" && (
        <main style={{ padding: "40px" }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, color: "#e8c96b", margin: 0, letterSpacing: 1 }}>Films Disponibles</h1>
            <p style={{ color: "#555", marginTop: 8 }}>{movies.filter(m => !m.blocked).length} film(s) disponibles</p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 24,
          }}>
            {movies.map(movie => (
              <div key={movie.id} style={{
                background: "#12121a",
                border: "1px solid " + (movie.blocked ? "#ff3b3033" : "#1e1e2e"),
                borderRadius: 12,
                overflow: "hidden",
                opacity: movie.blocked ? 0.5 : 1,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => { if (!movie.blocked) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(232,201,107,0.15)"; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                {/* Poster */}
                <div style={{
                  height: 160,
                  background: movie.blocked ? "#1a0a0a" : "#0d1117",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 72, position: "relative",
                }}>
                  {movie.poster}
                  {movie.blocked && (
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexDirection: "column", gap: 6,
                    }}>
                      <span style={{ fontSize: 36 }}>🔒</span>
                      <span style={{ color: "#ff3b30", fontSize: 12, fontWeight: "bold" }}>BLOQUÉ</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: 18, color: movie.blocked ? "#555" : "#fff" }}>{movie.title}</h3>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ background: "#1e1e2e", padding: "2px 10px", borderRadius: 20, fontSize: 12, color: "#888" }}>{movie.genre}</span>
                    <span style={{ background: "#1e1e2e", padding: "2px 10px", borderRadius: 20, fontSize: 12, color: "#888" }}>{movie.year}</span>
                    <span style={{ background: "#1e1e2e", padding: "2px 10px", borderRadius: 20, fontSize: 12, color: "#888" }}>{movie.size}</span>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button
                      onClick={() => handleStream(movie)}
                      style={{
                        flex: 1,
                        background: movie.blocked ? "#1a1a1a" : "#e8c96b",
                        color: movie.blocked ? "#444" : "#000",
                        border: "none", borderRadius: 8, padding: "10px 0",
                        fontFamily: "inherit", fontWeight: "bold", fontSize: 13,
                        cursor: movie.blocked ? "not-allowed" : "pointer",
                      }}
                    >
                      ▶ Regarder
                    </button>
                    <button
                      onClick={() => handleDownload(movie)}
                      style={{
                        flex: 1,
                        background: "transparent",
                        color: movie.blocked ? "#333" : "#888",
                        border: "1px solid " + (movie.blocked ? "#222" : "#333"),
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
            ))}
          </div>
        </main>
      )}

      {/* LOGIN VIEW */}
      {view === "login" && (
        <main style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "calc(100vh - 64px)",
        }}>
          <div style={{
            background: "#12121a", border: "1px solid #1e1e2e",
            borderRadius: 16, padding: "48px", width: 360,
            display: "flex", flexDirection: "column", gap: 20,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
              <h2 style={{ color: "#e8c96b", margin: 0, fontSize: 24 }}>Accès Admin</h2>
              <p style={{ color: "#555", fontSize: 13, marginTop: 8 }}>Entrez votre mot de passe</p>
            </div>
            <input
              type="password"
              placeholder="Mot de passe..."
              value={adminPass}
              onChange={e => { setAdminPass(e.target.value); setAuthError(false); }}
              onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
              style={{
                background: "#0a0a0f", border: "1px solid " + (authError ? "#ff3b30" : "#333"),
                borderRadius: 8, padding: "12px 16px", color: "#fff",
                fontFamily: "inherit", fontSize: 15, outline: "none",
              }}
            />
            {authError && <p style={{ color: "#ff3b30", margin: 0, fontSize: 13, textAlign: "center" }}>Mot de passe incorrect</p>}
            <button
              onClick={handleAdminLogin}
              style={{
                background: "#e8c96b", color: "#000", border: "none",
                borderRadius: 8, padding: "14px", fontFamily: "inherit",
                fontWeight: "bold", fontSize: 16, cursor: "pointer",
              }}
            >
              Se connecter
            </button>
            <p style={{ color: "#444", fontSize: 11, textAlign: "center", margin: 0 }}>
              (démo: admin123)
            </p>
          </div>
        </main>
      )}

      {/* ADMIN VIEW */}
      {view === "admin" && adminAuth && (
        <main style={{ padding: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 28, color: "#e8c96b", margin: 0 }}>Panneau Admin</h1>
              <p style={{ color: "#555", marginTop: 4 }}>{movies.length} films · {movies.filter(m => m.blocked).length} bloqués</p>
            </div>
            <button
              onClick={() => { setAdminAuth(false); setView("login"); setAdminPass(""); }}
              style={{
                background: "transparent", color: "#ff3b30",
                border: "1px solid #ff3b30", borderRadius: 8,
                padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
              }}
            >
              Déconnexion
            </button>
          </div>

          {/* Add Movie Form */}
          <div style={{
            background: "#12121a", border: "1px solid #1e1e2e",
            borderRadius: 12, padding: 28, marginBottom: 32,
          }}>
            <h2 style={{ color: "#e8c96b", margin: "0 0 20px", fontSize: 18 }}>➕ Ajouter un Film</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input
                placeholder="Titre *"
                value={newMovie.title}
                onChange={e => setNewMovie({ ...newMovie, title: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="Genre *"
                value={newMovie.genre}
                onChange={e => setNewMovie({ ...newMovie, genre: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="Année *"
                value={newMovie.year}
                onChange={e => setNewMovie({ ...newMovie, year: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <input
                placeholder="Taille (ex: 1.5 GB)"
                value={newMovie.size}
                onChange={e => setNewMovie({ ...newMovie, size: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="URL du fichier"
                value={newMovie.url}
                onChange={e => setNewMovie({ ...newMovie, url: e.target.value })}
                style={inputStyle}
              />
              <select
                value={newMovie.poster}
                onChange={e => setNewMovie({ ...newMovie, poster: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {emojis.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <button
              onClick={handleAddMovie}
              style={{
                background: "#e8c96b", color: "#000", border: "none",
                borderRadius: 8, padding: "12px 32px",
                fontFamily: "inherit", fontWeight: "bold", fontSize: 15, cursor: "pointer",
              }}
            >
              ➕ Ajouter
            </button>
          </div>

          {/* Movie List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {movies.map(movie => (
              <div key={movie.id} style={{
                background: "#12121a",
                border: "1px solid " + (movie.blocked ? "#ff3b3044" : "#1e1e2e"),
                borderRadius: 12, padding: "16px 24px",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <span style={{ fontSize: 36 }}>{movie.poster}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: 17, color: movie.blocked ? "#666" : "#fff" }}>
                    {movie.title}
                    {movie.blocked && <span style={{ marginLeft: 10, fontSize: 12, color: "#ff3b30", background: "#ff3b3022", padding: "2px 8px", borderRadius: 4 }}>BLOQUÉ</span>}
                  </div>
                  <div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>{movie.genre} · {movie.year} · {movie.size}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleToggleBlock(movie.id)}
                    style={{
                      background: movie.blocked ? "#1a3a1a" : "#3a1a1a",
                      color: movie.blocked ? "#4caf50" : "#ff3b30",
                      border: "1px solid " + (movie.blocked ? "#4caf5044" : "#ff3b3044"),
                      borderRadius: 8, padding: "8px 16px",
                      fontFamily: "inherit", fontSize: 13, cursor: "pointer", fontWeight: "bold",
                    }}
                  >
                    {movie.blocked ? "🔓 Débloquer" : "🔒 Bloquer"}
                  </button>
                  <button
                    onClick={() => handleDelete(movie.id)}
                    style={{
                      background: "#1a0a0a", color: "#ff3b30",
                      border: "1px solid #ff3b3033",
                      borderRadius: 8, padding: "8px 16px",
                      fontFamily: "inherit", fontSize: 13, cursor: "pointer", fontWeight: "bold",
                    }}
                  >
                    🗑 Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        * { box-sizing: border-box; }
        input::placeholder { color: #444; }
        select option { background: #12121a; }
      `}</style>
    </div>
  );
}

const inputStyle = {
  background: "#0a0a0f",
  border: "1px solid #333",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#fff",
  fontFamily: "'Courier New', monospace",
  fontSize: 14,
  outline: "none",
  width: "100%",
};
