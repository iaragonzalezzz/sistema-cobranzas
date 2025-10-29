import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("No se encontraron variables SUPABASE_URL o SUPABASE_KEY");
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log(`Supabase inicializado con URL: ${SUPABASE_URL}`);