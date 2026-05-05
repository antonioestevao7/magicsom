// Search utilities — query normalization & optimization
import { supabase } from "@/integrations/supabase/client";
import { Track } from "@/types/track";

/** Normaliza query: lowercase, remove acentos (NFD), trim, colapsa espaços */
export function normalizeQuery(query: string): string {
  return query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacríticos
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Heurísticas para enriquecer a query antes de enviar ao backend/IA */
const HEURISTICS: Array<{ match: RegExp; add: string }> = [
  { match: /\banos?\s*(\d{2})\b/, add: "$1s music" }, // "anos 80" -> "80s music"
  { match: /\btriste(s)?\b/, add: "sad songs" },
  { match: /\bfeliz(es)?\b/, add: "happy songs" },
  { match: /\blouvor(es)?\b|\bgospel\b|\badoracao\b/, add: "gospel music" },
  { match: /\brelaxante(s)?\b|\brelax\b/, add: "relaxing music" },
  { match: /\bestudar\b|\bestudo\b/, add: "study music lofi" },
  { match: /\bdormir\b|\bsono\b/, add: "sleep music" },
  { match: /\btreino\b|\bmalhar\b|\bacademia\b/, add: "workout music" },
  { match: /\bromantic[ao]s?\b|\bamor\b/, add: "romantic songs" },
  { match: /\bsertanej[ao]\b/, add: "sertanejo" },
  { match: /\bfunk\b/, add: "funk brasileiro" },
];

export function optimizeQuery(query: string): string {
  const norm = normalizeQuery(query);
  if (!norm) return "";
  const additions: string[] = [];
  for (const { match, add } of HEURISTICS) {
    const m = norm.match(match);
    if (m) {
      // expand $1 etc.
      const expanded = add.replace(/\$(\d+)/g, (_, i) => m[Number(i)] ?? "");
      if (!norm.includes(expanded)) additions.push(expanded);
    }
  }
  return [norm, ...additions].join(" ").trim();
}

/** Chama a edge function com a query otimizada */
export async function searchMusic(rawQuery: string): Promise<{
  results: Track[];
  smartQuery: string;
  optimized: string;
}> {
  const optimized = optimizeQuery(rawQuery);
  if (!optimized) return { results: [], smartQuery: "", optimized: "" };

  const { data, error } = await supabase.functions.invoke("search-music", {
    body: { query: optimized },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return {
    results: (data?.results ?? []) as Track[],
    smartQuery: data?.smartQuery ?? optimized,
    optimized,
  };
}

/** Debounce genérico */
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => {
    if (t) clearTimeout(t);
  };
  return debounced as T & { cancel: () => void };
}
