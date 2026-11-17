import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import type { Recipe } from "../types/Recipe";
import type { RecipeList } from "../types/RecipeList";
import { addRecipesToList, getRecipeIdsForList } from "../services/lists";
import { getRecipesForUser } from "../services/recipes";
import { useEscapeKey } from "../hooks/useEscapeKey";
import GenericButton from "./GenericButton";
import Modal from "./Modal";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../context/useAuth";

type AddRecipesToListPopupProps = {
  list: RecipeList;
  onClose: () => void;
  onRecipesAdded: () => void;
};

export default function AddRecipesToListPopup({
  list,
  onClose,
  onRecipesAdded,
}: AddRecipesToListPopupProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [existingRecipeIds, setExistingRecipeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const userId = user?.id;
  const requestClose = () => setIsClosing(true);

  useEscapeKey(requestClose, !saving && !isClosing);

  const listRecipes = recipes.filter((recipe) => existingRecipeIds.has(recipe.id));

  useEffect(() => {
    if (authLoading) {
      return;
    }
    let isMounted = true;

    const fetchRecipes = async () => {
      try {
        if (!list.id) {
          throw new Error("Listan saknar ett giltigt ID.");
        }
        if (!userId) {
          throw new Error("Du måste vara inloggad för att lägga till recept.");
        }

        const [userRecipes, recipeIds] = await Promise.all([
          getRecipesForUser(userId),
          getRecipeIdsForList(list.id, userId),
        ]);
        if (isMounted) {
          setRecipes(userRecipes);
          setExistingRecipeIds(new Set(recipeIds));
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Kunde inte hämta recepten.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchRecipes();
    return () => {
      isMounted = false;
    };
  }, [authLoading, list.id, userId]);

  const toggleRecipe = (recipeId: string) => {
    setSelectedRecipeIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(recipeId)) {
        nextIds.delete(recipeId);
      } else {
        nextIds.add(recipeId);
      }
      return nextIds;
    });
  };

  const handleSave = async () => {
    if (!list.id) {
      setErrorMessage("Listan saknar ett giltigt ID.");
      return;
    }
    if (!userId) {
      setErrorMessage("Du måste vara inloggad för att lägga till recept.");
      return;
    }
    if (selectedRecipeIds.size === 0) {
      setErrorMessage("Välj minst ett recept att lägga till.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      await addRecipesToList(list.id, [...selectedRecipeIds], userId);
      onRecipesAdded();
      requestClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunde inte lägga till recepten.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      labelledBy="recipes-in-list-title"
      className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-md bg-white p-4 shadow-lg sm:p-6"
      isClosing={isClosing}
      onCloseComplete={onClose}
    >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="recipes-in-list-title" className="text-xl font-bold text-app-ink">{list.name}</h2>
            <p className="mt-1 text-app-muted">
              {isEditing ? "Välj recept att lägga till i listan." : "Recept i listan"}
            </p>
          </div>
          {!loading && !errorMessage && (
            <GenericButton
              variant="olive"
              label={isEditing ? "Visa recept" : "Redigera lista"}
              onClick={() => setIsEditing((editing) => !editing)}
              disabled={saving}
            />
          )}
        </div>

        <div className="min-h-0 max-h-[calc(100dvh-16rem)] flex-1 overflow-y-auto overscroll-contain rounded-md border border-app-border">
          {authLoading || loading ? (
            <LoadingSpinner label="Hämtar recept..." className="app-content-enter min-h-40" />
          ) : (errorMessage || authError) && recipes.length === 0 ? (
            <p role="alert" className="p-4 text-action-danger-text">{errorMessage || authError}</p>
          ) : isEditing ? (
            recipes.length === 0 ? (
              <p className="p-4 text-app-ink">Du har inga recept att lägga till ännu.</p>
            ) : (
              recipes.map((recipe) => {
                const alreadyAdded = existingRecipeIds.has(recipe.id);
                return (
                  <label
                    key={recipe.id}
                    className="flex cursor-pointer items-center justify-between border-b border-app-border-soft px-4 py-3 last:border-b-0 hover:bg-app-row-hover"
                  >
                    <span className="text-app-ink">
                      {recipe.name}
                      {alreadyAdded && <span className="ml-2 text-sm text-app-muted">Redan i listan</span>}
                    </span>
                    <input
                      type="checkbox"
                      checked={alreadyAdded || selectedRecipeIds.has(recipe.id)}
                      disabled={alreadyAdded}
                      onChange={() => toggleRecipe(recipe.id)}
                      className="h-4 w-4 accent-action-create"
                    />
                  </label>
                );
              })
            )
          ) : listRecipes.length === 0 ? (
            <p className="p-4 text-app-muted">Listan innehåller inga recept ännu.</p>
          ) : (
            <ul>
              {listRecipes.map((recipe) => (
                <li key={recipe.id} className="border-b border-app-border-soft last:border-b-0">
                  <NavLink
                    to={`/recept/${recipe.id}`}
                    state={{ recipe, from: "/mina-receptlistor" }}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-app-ink transition-colors hover:bg-app-row-hover"
                  >
                    <span className="font-medium">{recipe.name}</span>
                    <span className="text-sm text-app-muted">
                      {recipe.ingredients.length} ingredienser · {recipe.time || "—"} min
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>

        {(errorMessage || authError) && recipes.length > 0 && (
          <p role="alert" className="text-action-danger-text">{errorMessage || authError}</p>
        )}

        <div className="flex shrink-0 flex-row justify-center gap-4">
          <GenericButton
            variant="danger"
            label="Stäng"
            onClick={requestClose}
            disabled={saving}
          />
          {isEditing && (
            <GenericButton
              variant="create"
              label={saving ? "Sparar..." : "Spara"}
              onClick={handleSave}
              disabled={authLoading || loading || saving || selectedRecipeIds.size === 0}
            />
          )}
        </div>
    </Modal>
  );
}
