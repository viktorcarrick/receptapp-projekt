import type { Recipe } from "../types/Recipe";

/** Receptfält som Gemini kan generera och fylla i i receptformuläret. */
export type GeneratedRecipe = Pick<
  Recipe,
  "name" | "ingredients" | "instructions" | "time" | "no_of_portions"
>;

/** Möjliga strukturerade svar från Gemini: vanligt meddelande eller recept. */
export type RecipeChatOutput =
  | { type: "message"; message: string }
  | { type: "recipe"; recipe: GeneratedRecipe };

/** Gemini-svaret tillsammans med ID:t som används för fortsatt kontext. */
export type RecipeChatResponse = {
  output: RecipeChatOutput;
  interactionId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isGeneratedRecipe(value: unknown): value is GeneratedRecipe {
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

export function isRecipeChatOutput(value: unknown): value is RecipeChatOutput {
  if (!isRecord(value)) {
    return false;
  }

  if (value.type === "message") {
    return typeof value.message === "string";
  }

  return value.type === "recipe" && isGeneratedRecipe(value.recipe);
}

export function isRecipeChatResponse(value: unknown): value is RecipeChatResponse {
  return (
    isRecord(value) &&
    isRecipeChatOutput(value.output) &&
    typeof value.interactionId === "string" &&
    value.interactionId.length > 0
  );
}

export function isRecipeExtractionResponse(
  value: unknown,
): value is { recipe: GeneratedRecipe } {
  return isRecord(value) && isGeneratedRecipe(value.recipe);
}
