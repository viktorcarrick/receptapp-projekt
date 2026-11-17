import { describe, expect, it } from "vitest";
import {
  isGeneratedRecipe,
  isRecipeChatOutput,
  isRecipeChatResponse,
  isRecipeExtractionResponse,
} from "./recipeAIResponse";

const validRecipe = {
  name: "Tomatsoppa",
  ingredients: ["Tomater", "Lök"],
  instructions: ["Koka ihop."],
  time: "25",
  no_of_portions: 4,
};

describe("recipe AI response validation", () => {
  it("accepts a chat message with an interaction id", () => {
    expect(
      isRecipeChatResponse({
        output: { type: "message", message: "Hej!" },
        interactionId: "interaction-123",
      }),
    ).toBe(true);
  });

  it("accepts a well-formed generated recipe", () => {
    expect(isGeneratedRecipe(validRecipe)).toBe(true);
    expect(isRecipeChatOutput({ type: "recipe", recipe: validRecipe })).toBe(true);
    expect(isRecipeExtractionResponse({ recipe: validRecipe })).toBe(true);
  });

  it("rejects malformed or incomplete responses", () => {
    expect(isGeneratedRecipe({ ...validRecipe, no_of_portions: 2.5 })).toBe(false);
    expect(isGeneratedRecipe({ ...validRecipe, ingredients: ["Tomater", 4] })).toBe(false);
    expect(isRecipeChatOutput({ type: "recipe", recipe: { name: "Saknas fält" } })).toBe(false);
    expect(isRecipeChatResponse({ output: { type: "message", message: "Hej!" }, interactionId: "" })).toBe(false);
    expect(isRecipeExtractionResponse({ recipe: null })).toBe(false);
  });
});
