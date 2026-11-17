import ScrollableListCard from "../components/ScrollableListCard";
import { FaSearch } from "react-icons/fa";
import { useEffect, useState } from "react";
import type { Recipe } from "../types/Recipe";
import { deleteRecipesForUser, getRecipesForUser } from "../services/recipes";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { IoTrashBin } from "react-icons/io5";
import GenericButton from "../components/GenericButton";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/useAuth";
import AddRecipeToListsPopup from "../components/AddRecipeToListsPopup";

export default function AllRecipesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editListMode, setEditListMode] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isClosingDeleteConfirmation, setIsClosingDeleteConfirmation] = useState(false);
  const [deletingRecipes, setDeletingRecipes] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [recipeForLists, setRecipeForLists] = useState<Recipe | null>(null);
  const [listSuccessMessage, setListSuccessMessage] = useState<string | null>(null);

  const requestCloseDeleteConfirmation = () => setIsClosingDeleteConfirmation(true);
  useEscapeKey(
    requestCloseDeleteConfirmation,
    showDeleteConfirmation && !deletingRecipes && !isClosingDeleteConfirmation
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }
    let isMounted = true;

    const fetchRecipes = async () => {
      try {
        if (!userId) {
          throw new Error("Du måste vara inloggad för att se dina recept.");
        }

        const userRecipes = await getRecipesForUser(userId);
        if (isMounted) {
          setRecipes(userRecipes);
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
  }, [authLoading, userId]);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleToggleEditMode = () => {
    setEditListMode((isEditing) => !isEditing);
    setSelectedRecipeIds(new Set());
    setDeleteErrorMessage(null);
  }

  const handleRecipeSelectionChange = (recipeId: string, selected: boolean) => {
    setSelectedRecipeIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (selected) {
        nextIds.add(recipeId);
      } else {
        nextIds.delete(recipeId);
      }
      return nextIds;
    });
  }

  const handleDeleteSelectedRecipes = async () => {
    if (selectedRecipeIds.size === 0) {
      return;
    }

    setDeletingRecipes(true);
    setDeleteErrorMessage(null);
    try {
      if (!userId) {
        throw new Error("Du måste vara inloggad för att radera recept.");
      }

      const recipeIds = [...selectedRecipeIds];
      await deleteRecipesForUser(recipeIds, userId);
      const deletedRecipeIds = new Set(recipeIds);
      setRecipes((currentRecipes) => currentRecipes.filter((recipe) => !deletedRecipeIds.has(recipe.id)));
      setSelectedRecipeIds(new Set());
      requestCloseDeleteConfirmation();
    } catch (error) {
      setDeleteErrorMessage(error instanceof Error ? error.message : "Kunde inte radera recepten.");
    } finally {
      setDeletingRecipes(false);
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-full flex-col gap-4 px-4">
      <section className="flex w-full min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-semibold text-app-ink">Alla recept</h1>
          <div className="flex flex-wrap items-center justify-end gap-4">
            {!editListMode && (
              <GenericButton
                to="/lagg-till-recept"
                label="Lägg till recept"
                className="h-10 w-32"
              />
            )}
            {editListMode && (
              <GenericButton
                variant="danger"
                label={`Radera recept${selectedRecipeIds.size > 0 ? ` (${selectedRecipeIds.size})` : ""}`}
                icon={<IoTrashBin aria-hidden="true" />}
                className="h-10"
                onClick={() => {
                  setDeleteErrorMessage(null);
                  setIsClosingDeleteConfirmation(false);
                  setShowDeleteConfirmation(true);
                }}
                disabled={selectedRecipeIds.size === 0}
              />
            )}
            <GenericButton
              variant= "accent"
              label={editListMode ? "Avsluta" : "Välj recept"}
              className="h-10 w-32"
              onClick={handleToggleEditMode}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md text-sm font-medium text-app-ink">
          <FaSearch className="scale-x-[-1]" />
          <span>Hitta ett recept</span>
        </div>
        <input
          className="w-full rounded-md bg-white/90 px-3 py-2 text-app-subtle outline-1 -outline-offset-1 outline-brand-olive focus:outline-2 focus:-outline-offset-2 focus:outline-brand-tomato"
          type="text"
          placeholder="Sök recept..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {listSuccessMessage && (
          <p role="status" className="text-sm text-app-ink">
            {listSuccessMessage}
          </p>
        )}
      </section>
      <section className="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-visible">
        {loading ? (
          <LoadingSpinner label="Hämtar recept..." className="app-content-enter min-h-40" />
        ) : errorMessage ? (
          <p role="alert" className="text-action-danger-text">{errorMessage}</p>
        ) : filteredRecipes.length > 0 ? (
          <div className="app-content-enter">
            <ScrollableListCard
              items={filteredRecipes}
              editState={editListMode}
              selectedRecipeIds={selectedRecipeIds}
              onRecipeSelectionChange={handleRecipeSelectionChange}
              onAddToList={(recipe) => {
                setListSuccessMessage(null);
                setRecipeForLists(recipe);
              }}
            />
          </div>
        ) : (
          <p className="text-app-ink">
            {recipes.length === 0 ? "Du har inga sparade recept ännu." : "Inga recept matchar sökningen."}
          </p>
        )}
      </section>
      {showDeleteConfirmation && (
        <Modal
          labelledBy="delete-recipes-title"
          className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-app-canvas p-6 text-left text-app-ink shadow-xl"
          isClosing={isClosingDeleteConfirmation}
          onCloseComplete={() => setShowDeleteConfirmation(false)}
        >
          <h2 id="delete-recipes-title" className="text-xl font-semibold">
            Radera valda recept?
          </h2>
          <p>
            Är du säker på att du vill radera{" "}
            {selectedRecipeIds.size === 1 ? "det här receptet" : `${selectedRecipeIds.size} valda recept`}?
            {" "}Åtgärden går inte att ångra.
          </p>
          {deleteErrorMessage && (
            <p role="alert" className="text-sm text-action-danger-text">{deleteErrorMessage}</p>
          )}
          <div className="flex justify-end gap-3">
            <GenericButton
              variant="neutral"
              label="Avbryt"
              onClick={requestCloseDeleteConfirmation}
              disabled={deletingRecipes}
            />
            <GenericButton
              variant="danger"
              label={deletingRecipes ? "Raderar..." : "Radera recept"}
              icon={<IoTrashBin aria-hidden="true" />}
              onClick={handleDeleteSelectedRecipes}
              disabled={deletingRecipes}
              disabledCursor="wait"
            />
          </div>
        </Modal>
      )}
      {recipeForLists && (
        <AddRecipeToListsPopup
          key={recipeForLists.id}
          recipe={recipeForLists}
          onClose={() => setRecipeForLists(null)}
          onRecipesAdded={(listCount) => {
            const listLabel = listCount === 1 ? "lista" : "listor";
            setListSuccessMessage(`Receptet lades till i ${listCount} ${listLabel}.`);
          }}
        />
      )}
    </div>
  )
}
