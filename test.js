import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

console.log("Probando conexión con Supabase...");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const test = async () => {
  const { data, error } = await supabase.from("clientes").select("*");
  console.log("DATA:", data);
  console.log("ERROR:", error);
};

test();
