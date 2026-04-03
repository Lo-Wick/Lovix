-- ============================================
-- CINESTREAM - Schéma Supabase
-- À exécuter dans : Supabase > SQL Editor
-- ============================================

-- 1. Table des films
CREATE TABLE IF NOT EXISTS movies (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  genre       TEXT NOT NULL,
  year        INTEGER NOT NULL,
  size        TEXT,
  description TEXT,
  poster_emoji TEXT DEFAULT '🎬',
  file_path   TEXT,          -- chemin dans Supabase Storage
  file_url    TEXT,          -- URL publique générée
  blocked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Activer RLS (Row Level Security)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- 3. Politique : lecture publique (films non bloqués)
CREATE POLICY "Lecture publique films non bloqués"
  ON movies FOR SELECT
  USING (blocked = FALSE);

-- 4. Politique : accès total pour le service_role (admin via backend)
--    Le frontend admin utilisera la clé service_role via une variable env
CREATE POLICY "Admin accès total"
  ON movies FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================
-- SUPABASE STORAGE
-- ============================================
-- Dans Supabase > Storage, créer un bucket nommé : "movies"
-- Paramètres du bucket :
--   - Public bucket : OUI (pour les téléchargements publics)
--   - Allowed MIME types : video/mp4, video/x-matroska, video/avi, video/webm

-- Politique Storage : lecture publique
-- (à créer dans Storage > Policies)
-- Policy name : "Lecture publique"
-- Operation : SELECT
-- Target roles : anon, authenticated
-- USING : bucket_id = 'movies'

-- Politique Storage : upload admin seulement
-- Policy name : "Upload admin"
-- Operation : INSERT
-- Target roles : authenticated  (ou service_role)
-- USING : bucket_id = 'movies'
