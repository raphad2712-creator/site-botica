/** Only allow cleanup of this user's own files in the profile bucket. */
export function caminhoFotoPerfil(url: unknown, supabaseUrl: string | undefined, userId: string) {
  if (typeof url !== "string" || !supabaseUrl) return null;
  try {
    const parsed = new URL(url);
    const base = new URL(supabaseUrl);
    const prefix = `/storage/v1/object/public/fotos-perfil/${userId}/`;
    if (parsed.origin !== base.origin || !parsed.pathname.startsWith(prefix)) return null;
    const name = decodeURIComponent(parsed.pathname.slice(prefix.length));
    if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(name)) return null;
    return `${userId}/${name}`;
  } catch { return null; }
}
