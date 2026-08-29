import { createClient } from "@supabase/supabase-js";

export function criarClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("SUPABASE_ADMIN_NAO_CONFIGURADO");
  return createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
}
