import { supabase } from "../lib/supabase";
import {
  isRecipeChatResponse,
  isRecipeExtractionResponse,
  type GeneratedRecipe,
  type RecipeChatResponse,
} from "./recipeAIResponse";

export type { GeneratedRecipe, RecipeChatOutput, RecipeChatResponse } from "./recipeAIResponse";

type RecipeAIRequest =
  | { action: "chat"; message: string; previousInteractionId?: string }
  | { action: "image"; mimeType: "image/jpeg"; imageData: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Skickar en autentiserad begäran till Edge Function och översätter dess
 * felrespons till ett användbart felmeddelande.
 */
async function invokeRecipeAI(body: RecipeAIRequest): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke<unknown>("recipe-ai", { body });

  if (error) {
    let message = error.message;
    if (error.context instanceof Response) {
      try {
        const responseBody: unknown = await error.context.clone().json();
        if (
          isRecord(responseBody) &&
          typeof responseBody.error === "string" &&
          responseBody.error.length > 0
        ) {
          message = responseBody.error;
        }
      } catch {
        // Keep the Functions client's explicit error when the response is not JSON.
      }
    }
    throw new Error(message);
  }

  if (data === null) {
    throw new Error("AI-tjänsten returnerade inget svar.");
  }

  return data;
}

/**
 * Skickar ett meddelande till receptchatten. Recept sparas inte automatiskt.
 */
export async function sendRecipeChatMessage(
  message: string,
  previousInteractionId?: string,
): Promise<RecipeChatResponse> {
  const response = await invokeRecipeAI({
    action: "chat",
    message,
    previousInteractionId,
  });

  if (!isRecipeChatResponse(response)) {
    throw new Error("AI-tjänsten returnerade ett svar i ett oväntat format.");
  }

  return response;
}

/** Extraherar ett recept från en bild via den autentiserade Edge Function. */
export async function extractRecipeFromImage(file: File): Promise<GeneratedRecipe> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Välj en bildfil för att importera receptet.");
  }

  const image = await optimizeRecipeImage(file);
  if (image.size > 4 * 1024 * 1024) {
    throw new Error("Bilden är för stor för att importera. Prova en mindre bild.");
  }

  const imageData = await readBlobAsBase64(image);
  const response = await invokeRecipeAI({
    action: "image",
    mimeType: "image/jpeg",
    imageData,
  });

  if (!isRecipeExtractionResponse(response)) {
    throw new Error("AI-tjänsten returnerade ett recept i ett oväntat format.");
  }

  const recipe = response.recipe;
  if (!recipe.name && recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
    throw new Error("Kunde inte identifiera ett enskilt läsbart recept i bilden.");
  }

  return recipe;
}

async function optimizeRecipeImage(file: File): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Bilden kunde inte läsas. Prova en annan bild."));
      image.src = imageUrl;
    });

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("Bilden saknar läsbart bildinnehåll.");
    }

    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Bilden kunde inte förberedas för import.");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) {
      throw new Error("Bilden kunde inte komprimeras för import.");
    }

    return blob;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function readBlobAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Bilddata kunde inte läsas."));
        return;
      }

      const base64 = reader.result.split(",", 2)[1];
      if (!base64) {
        reject(new Error("Bilddata saknas."));
        return;
      }

      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Bilddata kunde inte läsas."));
    reader.readAsDataURL(blob);
  });
}
