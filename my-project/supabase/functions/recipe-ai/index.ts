import { GoogleGenAI } from "npm:@google/genai@2.32.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const maxRequestSize = 6 * 1024 * 1024;
const maxImageDataSize = 5_600_000;
const maxMessageLength = 3000;

const recipeChatInstruction = `
Du är en hjälpsam receptassistent. Svara alltid på svenska, tydligt och vänligt.
Hjälp till med recept, ingredienser, tillagning och matlagningstips.

Returnera alltid ett JSON-objekt enligt det angivna schemat:
- Om användaren ber om ett recept, returnera {"type":"recipe","recipe":{...}}.
  Receptet ska ha ett beskrivande namn, ingredienser som strängar med mängder,
  instruktioner som tydliga steg, tillagningstid i minuter som en sträng med
  endast siffror och portionsantal som heltal.
- För frågor, följdfrågor och andra svar som inte efterfrågar ett recept,
  returnera {"type":"message","message":"..."}.
- Lägg inte till markdown eller text utanför JSON-objektet.
`;

const recipeImageImportInstruction = `
Du är en receptextraherare. Du ska endast läsa och återge receptinformation som faktiskt syns i den bifogade bilden; skapa eller förbättra aldrig ett recept.

Identifiera först receptet i bilden:
- Om bilden innehåller ett tydligt avgränsat recept, extrahera bara det receptet.
- Om flera recept syns och ett är tydligt huvudrecept, extrahera bara huvudreceptet.
- Blanda aldrig ingredienser eller instruktioner från olika recept. Om det inte går att avgöra vilket recept som avses, lämna receptfälten tomma enligt reglerna nedan.
- Läs tryckt och handskriven text, flera spalter och fortsättning mellan sidor i den mån den är läsbar. Slå bara ihop fortsättningar när det tydligt är samma recept.

Återge titel och ingredienser så nära källan som möjligt. Behåll mängder, bråk, enheter och ingrediensordning; normalisera eller omvandla dem inte. Återge tillagningsstegen i rätt ordning och behåll deras innebörd. Översätt inte och komplettera inte förkortningar.

Gissa aldrig, dra inga slutsatser utifrån typiska recept och lägg inte till saknade ingredienser, mängder, enheter, tider, portioner eller steg. Om en del är oläslig ska du inte försöka rekonstruera den. För information som saknas eller inte går att läsa använder du tom sträng för namn eller tid, tomma arrayer för ingredienser eller instruktioner och 0 för portionsantal. Lämna endast det oläsliga fältet tomt när annan receptinformation går att läsa.

Returnera alltid enbart ett JSON-objekt enligt det angivna befintliga schemat: {"type":"recipe","recipe":{"name":"","ingredients":[],"instructions":[],"time":"","no_of_portions":0}}. Använd exakt fälten name (sträng), ingredients (array med strängar), instructions (array med strängar), time (sträng) och no_of_portions (heltal). Lägg inte till fält, förklaringar, Markdown eller text utanför JSON-objektet.
`;

const responseSchema = {
  type: "OBJECT",
  properties: {
    type: { type: "STRING", enum: ["message", "recipe"] },
    message: { type: "STRING", description: "Svar på svenska när type är message." },
    recipe: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        ingredients: { type: "ARRAY", items: { type: "STRING" } },
        instructions: { type: "ARRAY", items: { type: "STRING" } },
        time: { type: "STRING" },
        no_of_portions: { type: "INTEGER" },
      },
      required: ["name", "ingredients", "instructions", "time", "no_of_portions"],
      propertyOrdering: ["name", "ingredients", "instructions", "time", "no_of_portions"],
    },
  },
  required: ["type"],
  propertyOrdering: ["type", "message", "recipe"],
};

type GeneratedRecipe = {
  name: string;
  ingredients: string[];
  instructions: string[];
  time: string;
  no_of_portions: number;
};

type RecipeChatOutput =
  | { type: "message"; message: string }
  | { type: "recipe"; recipe: GeneratedRecipe };

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGeneratedRecipe(value: unknown): value is GeneratedRecipe {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    Array.isArray(value.ingredients) &&
    value.ingredients.every((ingredient) => typeof ingredient === "string") &&
    Array.isArray(value.instructions) &&
    value.instructions.every((instruction) => typeof instruction === "string") &&
    typeof value.time === "string" &&
    typeof value.no_of_portions === "number" &&
    Number.isInteger(value.no_of_portions)
  );
}

function parseRecipeChatOutput(text: string): RecipeChatOutput | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }
  if (value.type === "message" && typeof value.message === "string") {
    return { type: "message", message: value.message };
  }
  if (value.type === "recipe" && isGeneratedRecipe(value.recipe)) {
    return { type: "recipe", recipe: value.recipe };
  }

  return null;
}

async function verifyUser(request: Request): Promise<boolean> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }
  const accessToken = authorization.slice("Bearer ".length);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase authentication environment is not configured.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);
  return !error && Boolean(data.user);
}

function getGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Metoden stöds inte." }, 405);
  }

  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (contentLength > maxRequestSize) {
    return jsonResponse({ error: "Begäran är för stor." }, 413);
  }

  let userIsValid: boolean;
  try {
    userIsValid = await verifyUser(request);
  } catch (error) {
    console.error("Could not validate recipe AI caller:", error);
    return jsonResponse({ error: "Inloggningen kunde inte verifieras." }, 503);
  }
  if (!userIsValid) {
    return jsonResponse({ error: "Du måste vara inloggad för att använda AI-funktionerna." }, 401);
  }

  let requestData: unknown;
  try {
    const requestText = await request.text();
    if (requestText.length > maxRequestSize) {
      return jsonResponse({ error: "Begäran är för stor." }, 413);
    }
    requestData = JSON.parse(requestText);
  } catch {
    return jsonResponse({ error: "Begäran innehåller ogiltig JSON." }, 400);
  }

  if (!isRecord(requestData)) {
    return jsonResponse({ error: "Begäran har ett ogiltigt format." }, 400);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured for the recipe AI function.");
    return jsonResponse({ error: "AI-tjänsten är inte konfigurerad ännu." }, 503);
  }

  const model = Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest";
  try {
    const ai = getGeminiClient(apiKey);
    if (requestData.action === "chat") {
      const message =
        typeof requestData.message === "string" ? requestData.message.trim() : "";
      const previousInteractionId = requestData.previousInteractionId;
      if (!message || message.length > maxMessageLength) {
        return jsonResponse({ error: "Meddelandet måste innehålla högst 3000 tecken." }, 400);
      }
      if (
        previousInteractionId !== undefined &&
        (typeof previousInteractionId !== "string" || previousInteractionId.length > 256)
      ) {
        return jsonResponse({ error: "Konversationsreferensen är ogiltig." }, 400);
      }

      const interaction = await ai.interactions.create({
        model,
        input: message,
        previous_interaction_id: previousInteractionId,
        system_instruction: recipeChatInstruction,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: responseSchema,
        },
      });
      const output = interaction.output_text
        ? parseRecipeChatOutput(interaction.output_text.trim())
        : null;
      if (!output) {
        console.error("Gemini returned an invalid recipe chat response.");
        return jsonResponse({ error: "AI-tjänsten returnerade ett ogiltigt svar." }, 502);
      }

      return jsonResponse({ output, interactionId: interaction.id }, 200);
    }

    if (requestData.action === "image") {
      const imageData = requestData.imageData;
      if (
        requestData.mimeType !== "image/jpeg" ||
        typeof imageData !== "string" ||
        imageData.length === 0 ||
        imageData.length > maxImageDataSize ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(imageData)
      ) {
        return jsonResponse({ error: "Bildfilen är ogiltig eller för stor." }, 400);
      }
      try {
        atob(imageData);
      } catch {
        return jsonResponse({ error: "Bildfilen innehåller ogiltig data." }, 400);
      }

      const interaction = await ai.interactions.create({
        model,
        input: [
          { type: "text", text: "Extrahera receptinformationen från bilden." },
          { type: "image", data: imageData, mime_type: "image/jpeg" },
        ],
        system_instruction: recipeImageImportInstruction,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: responseSchema,
        },
      });
      const output = interaction.output_text
        ? parseRecipeChatOutput(interaction.output_text.trim())
        : null;
      if (!output || output.type !== "recipe") {
        console.error("Gemini could not return a valid recipe from the supplied image.");
        return jsonResponse({ error: "Inget recept kunde identifieras i bilden." }, 422);
      }

      return jsonResponse({ recipe: output.recipe }, 200);
    }

    return jsonResponse({ error: "Begäran har en okänd AI-åtgärd." }, 400);
  } catch (error) {
    console.error("Recipe AI request failed:", error);
    return jsonResponse({ error: "AI-tjänsten kunde inte behandla begäran. Försök igen." }, 502);
  }
});
