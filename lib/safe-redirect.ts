/** Accept only local paths; URL parsers treat backslashes as slashes. */
export function destinoLocal(value: string | null | undefined, fallback = "/minha-conta") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value)) return fallback;
  try {
    const base = "https://botica.invalid";
    const url = new URL(value, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch { return fallback; }
}
