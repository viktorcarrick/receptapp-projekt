import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/Recipe";
import type { RecipeList } from "../types/RecipeList";

type NewRecipeList = Omit<RecipeList, "id">;

/** Hämtar ett slumpmässigt urval av användarens recept. Kastar fel om antalet är ogiltigt eller recepten är för få. */
export async function getRandomRecipesForUser(userId: string, count: number): Promise<Recipe[]> {
    if (!Number.isInteger(count) || count < 1) {
        throw new Error("Antalet recept måste vara ett positivt heltal.");
    }

    const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    if (data.length < count) {
        throw new Error(`Du har bara ${data.length} recept, men valde ${count}.`);
    }

    const shuffledRecipes = [...data];
    for (let index = shuffledRecipes.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledRecipes[index], shuffledRecipes[randomIndex]] = [
            shuffledRecipes[randomIndex],
            shuffledRecipes[index],
        ];
    }

    return shuffledRecipes.slice(0, count);
}

/** Hämtar användarens receptlistor. */
export async function getRecipeListsForUser(userId: string): Promise<RecipeList[]> {
    const { data, error } = await supabase
        .from("recipe_lists")
        .select("*")
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    return data;
}

/** Hämtar ID:n för recepten i en lista som tillhör användaren. */
export async function getRecipeIdsForList(recipeListId: string, userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from("recipe_list_items")
        .select("recipe_id")
        .eq("recipe_list_id", recipeListId)
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    return data.map(({ recipe_id }) => recipe_id);
}

/** Hämtar antalet recept per lista. Returnerar ett tomt objekt om inga list-ID:n anges. */
export async function getRecipeCountsForLists(
    recipeListIds: string[],
    userId: string
): Promise<Record<string, number>> {
    if (recipeListIds.length === 0) {
        return {};
    }

    const { data, error } = await supabase
        .from("recipe_list_items")
        .select("recipe_list_id")
        .in("recipe_list_id", recipeListIds)
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    return data.reduce<Record<string, number>>((counts, { recipe_list_id }) => {
        counts[recipe_list_id] = (counts[recipe_list_id] ?? 0) + 1;
        return counts;
    }, {});
}

/** Lägger till recept i en lista och ignorerar kopplingar som redan finns. */
export async function addRecipesToList(recipeListId: string, recipeIds: string[], userId: string): Promise<void> {
    if (recipeIds.length === 0) {
        return;
    }

    const { error } = await supabase
        .from("recipe_list_items")
        .upsert(
            recipeIds.map((recipeId) => ({
                recipe_list_id: recipeListId,
                recipe_id: recipeId,
                user_id: userId,
            })),
            { onConflict: "recipe_list_id,recipe_id,user_id", ignoreDuplicates: true }
        );

    if (error) {
        throw error;
    }
}

/** Skapar en receptlista med ett nytt ID och returnerar den. */
export async function createRecipeList(recipeList: NewRecipeList): Promise<RecipeList> {
    const newRecipeList: RecipeList = {
        id: crypto.randomUUID(),
        ...recipeList,
    };

    const { error } = await supabase
        .from("recipe_lists")
        .insert([newRecipeList]);

    if (error) {
        throw error;
    }

    return newRecipeList;
}
