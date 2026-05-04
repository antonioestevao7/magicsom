import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    // Step 1: Use AI to interpret the user's intent and produce a clean YouTube search query
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente que transforma pedidos de música em uma query otimizada para buscar no YouTube. Retorne APENAS a query, sem aspas, sem explicação. Adicione 'official audio' ou 'official music video' quando fizer sentido. Se o usuário pedir um gênero/humor (ex: 'músicas tristes anos 80'), sugira termos específicos.",
          },
          { role: "user", content: query },
        ],
      }),
    });

    let smartQuery = query;
    if (aiResp.ok) {
      const aiData = await aiResp.json();
      smartQuery = aiData.choices?.[0]?.message?.content?.trim() || query;
    } else if (aiResp.status === 429 || aiResp.status === 402) {
      // graceful fallback
      smartQuery = query;
    }

    // Step 2: Scrape YouTube search results (no API key needed)
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(smartQuery)}`;
    const ytResp = await fetch(ytUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await ytResp.text();

    // Extract ytInitialData JSON
    const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
    if (!match) {
      return new Response(JSON.stringify({ results: [], smartQuery }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(match[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
        ?.contents?.[0]?.itemSectionRenderer?.contents || [];

    const results = contents
      .filter((c: any) => c.videoRenderer)
      .slice(0, 20)
      .map((c: any) => {
        const v = c.videoRenderer;
        return {
          id: v.videoId,
          title: v.title?.runs?.[0]?.text || "",
          channel: v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || "",
          thumbnail:
            v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
            `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          duration: v.lengthText?.simpleText || "",
          views: v.viewCountText?.simpleText || "",
        };
      });

    return new Response(JSON.stringify({ results, smartQuery }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-music error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
