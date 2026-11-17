import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/Recipe";

type NewRecipe = Omit<Recipe, "id">;

/** Hämtar ett recept via ID, eller null om det inte finns. */
export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
    const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

/** Hämtar alla recept som tillhör användaren. */
export async function getRecipesForUser(userId: string): Promise<Recipe[]> {
    const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    return data;
}

/** Skapar ett recept med ett nytt ID och returnerar det. */
export async function createRecipe(recipe: NewRecipe): Promise<Recipe> {
    const newRecipe: Recipe = {
        id: crypto.randomUUID(),
        ...recipe,
    };

    const { error } = await supabase
        .from("recipes")
        .insert([newRecipe]);

    if (error) {
        throw error;
    }

    return newRecipe;
}

/** Raderar angivna recept som tillhör användaren. Kastar ett fel om inte alla kunde raderas. */
export async function deleteRecipesForUser(recipeIds: string[], userId: string): Promise<void> {
    if (recipeIds.length === 0) {
        return;
    }

    const { data, error } = await supabase
        .from("recipes")
        .delete()
        .in("id", recipeIds)
        .eq("user_id", userId)
        .select("id");

    if (error) {
        throw error;
    }

    if (data.length !== recipeIds.length) {
        throw new Error("Alla valda recept kunde inte raderas. Uppdatera sidan och försök igen.");
    }
}
