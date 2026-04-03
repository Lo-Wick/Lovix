// src/supabaseClient.js
// --------------------------------------------
// Installe d'abord : npm install @supabase/supabase-js
// --------------------------------------------
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY

// Client public (lecture des films non bloqués)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Client admin (accès total, contourne RLS)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
