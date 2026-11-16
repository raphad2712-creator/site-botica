import type { SupabaseClient, User } from "@supabase/supabase-js";
import { segurancaBancoPronta } from "@/lib/launch-readiness";

// A função no perfil não basta: exige e-mail confirmado e autorizado no servidor.
export async function usuarioAdminAutorizado(user: User | null, supabase: SupabaseClient) {
  const emailAutorizado = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!user?.email_confirmed_at || !emailAutorizado || user.email?.toLowerCase() !== emailAutorizado) return false;
  if (!await segurancaBancoPronta()) return false;
  const { data, error } = await supabase.from("perfis").select("funcao").eq("id", user.id).maybeSingle();
  return !error && data?.funcao === "admin";
}
