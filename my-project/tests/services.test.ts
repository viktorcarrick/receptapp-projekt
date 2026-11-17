import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Recipe } from "../src/types/Recipe";

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock("../src/lib/supabase", () => ({ supabase: supabaseMocks }));

import { getCurrentUser, requireCurrentUser, signOut } from "../src/services/auth";
import {
  addRecipesToList,
  createRecipeList,
  getRecipeCountsForLists,
  getRecipeListsForUser,
  getRandomRecipesForUser,
} from "../src/services/lists";
import {
  createRecipe,
  deleteRecipesForUser,
  getRecipeById,
} from "../src/services/recipes";

const makeRecipe = (id: string): Recipe => ({
  id,
  user_id: "user-1",
  name: `Recept ${id}`,
  ingredients: ["Tomat"],
  instructions: ["Koka."],
  time: "15",
  no_of_portions: 2,
});

function mockRecipeQuery(data: unknown, error: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  supabaseMocks.from.mockReturnValue({ select });
  return { select, eq, maybeSingle };
}

describe("recipe services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when a recipe id does not exist", async () => {
    mockRecipeQuery(null);

    await expect(getRecipeById("missing")).resolves.toBeNull();
    expect(supabaseMocks.from).toHaveBeenCalledWith("recipes");
  });

  it("creates a recipe with a generated id", async () => {
    const newRecipe = {
      user_id: "user-1",
      name: "Tomatsoppa",
      ingredients: ["Tomat"],
      instructions: ["Koka."],
      time: "15",
      no_of_portions: 2,
    };
    const id = "11111111-1111-4111-8111-111111111111";
    const insert = vi.fn().mockResolvedValue({ error: null });
    supabaseMocks.from.mockReturnValue({ insert });
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(id);

    await expect(createRecipe(newRecipe)).resolves.toEqual({ id, ...newRecipe });
    expect(insert).toHaveBeenCalledWith([{ id, ...newRecipe }]);
  });

  it("does not query Supabase when asked to delete no recipes", async () => {
    await expect(deleteRecipesForUser([], "user-1")).resolves.toBeUndefined();
    expect(supabaseMocks.from).not.toHaveBeenCalled();
  });

  it("reports when a bulk delete did not remove every requested recipe", async () => {
    const select = vi.fn().mockResolvedValue({ data: [{ id: "recipe-1" }], error: null });
    const eq = vi.fn().mockReturnValue({ select });
    const inQuery = vi.fn().mockReturnValue({ eq });
    const deleteQuery = vi.fn().mockReturnValue({ in: inQuery });
    supabaseMocks.from.mockReturnValue({ delete: deleteQuery });

    await expect(
      deleteRecipesForUser(["recipe-1", "recipe-2"], "user-1"),
    ).rejects.toThrow("Alla valda recept kunde inte raderas");
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});

describe("recipe-list services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects invalid random recipe counts before querying", async () => {
    await expect(getRandomRecipesForUser("user-1", 0)).rejects.toThrow(
      "Antalet recept måste vara ett positivt heltal.",
    );
    await expect(getRandomRecipesForUser("user-1", 1.5)).rejects.toThrow(
      "Antalet recept måste vara ett positivt heltal.",
    );
    expect(supabaseMocks.from).not.toHaveBeenCalled();
  });

  it("rejects random lists when the user has too few recipes", async () => {
    const eq = vi.fn().mockResolvedValue({ data: [makeRecipe("recipe-1")], error: null });
    const select = vi.fn().mockReturnValue({ eq });
    supabaseMocks.from.mockReturnValue({ select });

    await expect(getRandomRecipesForUser("user-1", 2)).rejects.toThrow(
      "Du har bara 1 recept, men valde 2.",
    );
  });

  it("returns the requested number of recipes from the user's collection", async () => {
    const recipes = [makeRecipe("one"), makeRecipe("two"), makeRecipe("three")];
    const eq = vi.fn().mockResolvedValue({ data: recipes, error: null });
    const select = vi.fn().mockReturnValue({ eq });
    supabaseMocks.from.mockReturnValue({ select });

    const result = await getRandomRecipesForUser("user-1", 2);

    expect(result).toHaveLength(2);
    expect(recipes.map(({ id }) => id)).toEqual(expect.arrayContaining(result.map(({ id }) => id)));
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns only the authenticated user's saved lists", async () => {
    const lists = [{ id: "list-1", name: "Favoriter", user_id: "user-1" }];
    const eq = vi.fn().mockResolvedValue({ data: lists, error: null });
    const select = vi.fn().mockReturnValue({ eq });
    supabaseMocks.from.mockReturnValue({ select });

    await expect(getRecipeListsForUser("user-1")).resolves.toEqual(lists);
    expect(supabaseMocks.from).toHaveBeenCalledWith("recipe_lists");
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("counts recipes per list and skips the query when no list ids are provided", async () => {
    await expect(getRecipeCountsForLists([], "user-1")).resolves.toEqual({});
    expect(supabaseMocks.from).not.toHaveBeenCalled();

    const eq = vi.fn().mockResolvedValue({
      data: [
        { recipe_list_id: "list-1" },
        { recipe_list_id: "list-1" },
        { recipe_list_id: "list-2" },
      ],
      error: null,
    });
    const inQuery = vi.fn().mockReturnValue({ eq });
    const select = vi.fn().mockReturnValue({ in: inQuery });
    supabaseMocks.from.mockReturnValue({ select });

    await expect(getRecipeCountsForLists(["list-1", "list-2"], "user-1")).resolves.toEqual({
      "list-1": 2,
      "list-2": 1,
    });
    expect(inQuery).toHaveBeenCalledWith("recipe_list_id", ["list-1", "list-2"]);
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("creates a saved list with a generated id", async () => {
    const newList = { name: "Favoriter", user_id: "user-1" };
    const id = "22222222-2222-4222-8222-222222222222";
    const insert = vi.fn().mockResolvedValue({ error: null });
    supabaseMocks.from.mockReturnValue({ insert });
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(id);

    await expect(createRecipeList(newList)).resolves.toEqual({ id, ...newList });
    expect(insert).toHaveBeenCalledWith([{ id, ...newList }]);
  });

  it("does not issue an upsert for an empty recipe selection", async () => {
    await expect(addRecipesToList("list-1", [], "user-1")).resolves.toBeUndefined();
    expect(supabaseMocks.from).not.toHaveBeenCalled();
  });

  it("upserts recipe-list links with duplicate protection and user ownership", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    supabaseMocks.from.mockReturnValue({ upsert });

    await expect(
      addRecipesToList("list-1", ["recipe-1", "recipe-2"], "user-1"),
    ).resolves.toBeUndefined();

    expect(supabaseMocks.from).toHaveBeenCalledWith("recipe_list_items");
    expect(upsert).toHaveBeenCalledWith(
      [
        { recipe_list_id: "list-1", recipe_id: "recipe-1", user_id: "user-1" },
        { recipe_list_id: "list-1", recipe_id: "recipe-2", user_id: "user-1" },
      ],
      { onConflict: "recipe_list_id,recipe_id,user_id", ignoreDuplicates: true },
    );
  });
});

describe("auth services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authenticated user", async () => {
    const user = { id: "user-1" };
    supabaseMocks.auth.getUser.mockResolvedValue({ data: { user }, error: null });

    await expect(getCurrentUser()).resolves.toEqual(user);
    await expect(requireCurrentUser("Sign in")).resolves.toEqual(user);
  });

  it("requires a user and propagates sign-out errors", async () => {
    supabaseMocks.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    supabaseMocks.auth.signOut.mockResolvedValue({ error: new Error("Sign-out failed") });

    await expect(requireCurrentUser("Sign in first")).rejects.toThrow("Sign in first");
    await expect(signOut()).rejects.toThrow("Sign-out failed");
  });
});
