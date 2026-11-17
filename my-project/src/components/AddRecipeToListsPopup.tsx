import { useEffect, useState } from "react";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useAuth } from "../context/useAuth";
import { addRecipesToList, getRecipeListsForUser } from "../services/lists";
import type { Recipe } from "../types/Recipe";
import type { RecipeList } from "../types/RecipeList";
import GenericButton from "./GenericButton";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";

type AddRecipeToListsPopupProps = {
  recipe: Recipe;
  onClose: () => void;
  onRecipesAdded: (listCount: number) => void;
};

export default function AddRecipeToListsPopup({
  recipe,
  onClose,
  onRecipesAdded,
}: AddRecipeToListsPopupProps) {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const userId = user?.id;
  const [lists, setLists] = useState<RecipeList[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const requestClose = () => setIsClosing(true);

  useEscapeKey(requestClose, !saving && !isClosing);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let isMounted = true;
    const fetchLists = async () => {
      try {
        if (!userId) {
          throw new Error("Du måste vara inloggad för att lägga till recept i listor.");
        }

        const userLists = await getRecipeListsForUser(userId);
        if (isMounted) {
          setLists(userLists);
        }
      } catch (error) {
        if (isMounted) {
          setLoadErrorMessage(error instanceof Error ? error.message : "Kunde inte hämta listorna.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchLists();
    return () => {
      isMounted = false;
    };
  }, [authLoading, userId]);

  const toggleList = (listId: string) => {
    setSaveErrorMessage(null);
    setSelectedListIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(listId)) {
        nextIds.delete(listId);
      } else {
        nextIds.add(listId);
      }
      return nextIds;
    });
  };

  const handleSave = async () => {
    if (!userId) {
      setSaveErrorMessage("Du måste vara inloggad för att lägga till recept i listor.");
      return;
    }
    if (selectedListIds.size === 0) {
      setSaveErrorMessage("Välj minst en lista.");
      return;
    }

    setSaving(true);
    setSaveErrorMessage(null);
    try {
      const selectedIds = [...selectedListIds];
      await Promise.all(
        selectedIds.map((listId) => addRecipesToList(listId, [recipe.id], userId)),
      );
      onRecipesAdded(selectedIds.length);
      requestClose();
    } catch (error) {
      setSaveErrorMessage(
        error instanceof Error ? error.message : "Kunde inte lägga till receptet i listorna.",
      );
    } finally {
      setSaving(false);
    }
  };

  const loadError = loadErrorMessage || authError;

  return (
    <Modal
      labelledBy="add-recipe-to-lists-title"
      className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-md bg-white p-4 shadow-lg sm:p-6"
      isClosing={isClosing}
      onCloseComplete={onClose}
    >
      <header className="shrink-0">
        <h2 id="add-recipe-to-lists-title" className="text-xl font-bold text-app-ink">
          Lägg till i sparade listor
        </h2>
        <p className="mt-1 text-app-muted">{recipe.name}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-md border border-app-border">
        {authLoading || loading ? (
          <LoadingSpinner label="Hämtar listor..." className="app-content-enter min-h-40" />
        ) : loadError ? (
          <p role="alert" className="p-4 text-action-danger-text">{loadError}</p>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-app-muted">Du har inga sparade listor ännu.</p>
            <GenericButton to="/mina-receptlistor" variant="outline" label="Skapa en lista" />
          </div>
        ) : (
          <ul>
            {lists.map((list) => (
              <li key={list.id ?? list.name} className="border-b border-app-border-soft last:border-b-0">
                <label
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${
                    list.id ? "cursor-pointer hover:bg-app-row-hover" : "cursor-not-allowed opacity-60"
                  }`}
                >
                  <span className="text-app-ink">{list.name}</span>
                  <input
                    type="checkbox"
                    checked={list.id ? selectedListIds.has(list.id) : false}
                    disabled={!list.id || saving}
                    onChange={() => {
                      if (list.id) {
                        toggleList(list.id);
                      }
                    }}
                    className="h-4 w-4 accent-action-create"
                    aria-label={`Lägg receptet i ${list.name}`}
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {saveErrorMessage && !loading && lists.length > 0 && (
        <p role="alert" className="text-action-danger-text">{saveErrorMessage}</p>
      )}

      <div className="flex shrink-0 justify-center gap-4">
        <GenericButton
          variant="neutral"
          label="Avbryt"
          onClick={requestClose}
          disabled={saving}
        />
        {lists.length > 0 && (
          <GenericButton
            label={saving ? "Sparar..." : "Lägg till"}
            onClick={handleSave}
            disabled={authLoading || loading || saving || selectedListIds.size === 0}
            disabledCursor={saving ? "wait" : undefined}
          />
        )}
      </div>
    </Modal>
  );
}
