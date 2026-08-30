"use client";

import { useRouter } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  return <button className="outline-button" onClick={async () => {
    await criarClienteSupabase().auth.signOut();
    localStorage.removeItem("botica-carrinho");
    localStorage.removeItem("botica-favoritos");
    router.replace("/");
    window.location.replace("/");
  }}>SAIR</button>;
}
