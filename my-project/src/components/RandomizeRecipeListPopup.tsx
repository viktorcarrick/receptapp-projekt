import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { addRecipesToList, createRecipeList, getRandomRecipesForUser } from "../services/lists";
import { useEscapeKey } from "../hooks/useEscapeKey";
import GenericButton from "./GenericButton";
import Modal from "./Modal";
import { useAuth } from "../context/useAuth";

type RandomizeRecipeListPopupProps = {
  setRandomizePopup: Dispatch<SetStateAction<boolean>>;
  onListCreated: () => void;
};

export default function RandomizeRecipeListPopup({
  setRandomizePopup,
  onListCreated,
}: RandomizeRecipeListPopupProps) {
  const [listName, setListName] = useState("");
  const [recipeCount, setRecipeCount] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const visibleAuthError = authError || (!authLoading && !user
    ? "Du måste vara inloggad för att skapa en lista."
    : null);
  const requestClose = () => setIsClosing(true);

  useEscapeKey(requestClose, !saving && !isClosing);

  const handleRandomize = async () => {
    const count = Number(recipeCount);
    if (!listName.trim()) {
      setErrorMessage("Ange ett namn på listan.");
      return;
    }
    if (!Number.isInteger(count) || count < 1) {
      setErrorMessage("Ange ett positivt heltal för antal recept.");
      return;
    }
    if (!user) {
      setErrorMessage("Du måste vara inloggad för att skapa en lista.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    let listWasCreated = false;

    try {
      const recipes = await getRandomRecipesForUser(user.id, count);
      const recipeList = await createRecipeList({
        name: listName.trim(),
        user_id: user.id,
      });
      listWasCreated = true;

      if (!recipeList.id) {
        throw new Error("Listan skapades utan ett giltigt ID.");
      }

      await addRecipesToList(
        recipeList.id,
        recipes.map((recipe) => recipe.id),
        user.id
      );

      onListCreated();
      requestClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ett oväntat fel inträffade.";
      if (listWasCreated) {
        onListCreated();
        setErrorMessage(`Listan skapades, men recepten kunde inte läggas till: ${message}`);
      } else {
        setErrorMessage(`Kunde inte skapa en slumpad receptlista: ${message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      labelledBy="randomize-list-title"
      className="flex w-full max-w-lg flex-col gap-3 rounded-md bg-app-surface p-5 shadow-lg"
      isClosing={isClosing}
      onCloseComplete={() => setRandomizePopup(false)}
    >
      <h2 id="randomize-list-title" className="text-xl font-bold text-app-ink">Slumpa lista</h2>
      <label htmlFor="random-list-name" className="text-app-ink">
          Ange namn på din nya receptlista:
        </label>
        <input
          id="random-list-name"
          type="text"
          placeholder="Listnamn"
          value={listName}
          onChange={(event) => setListName(event.target.value)}
          className="w-full rounded-md border border-app-border px-4 py-2 text-app-ink focus:outline-none focus:ring-2 focus:ring-brand-olive"
        />
        <div className="flex items-center gap-3 text-app-ink">
          <label htmlFor="random-recipe-count">Antal recept:</label>
          <input
            id="random-recipe-count"
            type="number"
            min="1"
            step="1"
            placeholder="0"
            value={recipeCount}
            onChange={(event) => setRecipeCount(event.target.value)}
            className="w-20 rounded-md border border-app-border px-3 py-2 text-app-ink focus:outline-none focus:ring-2 focus:ring-brand-olive"
          />
        </div>
        {(errorMessage || visibleAuthError) && (
          <p role="alert" className="text-sm text-action-danger-text">{errorMessage || visibleAuthError}</p>
        )}
        <div className="flex justify-center gap-4 pt-1">
          <GenericButton
            variant="danger"
            label="Avbryt"
            onClick={requestClose}
            disabled={saving}
          />
          <GenericButton
            variant="create"
            label={saving ? "Skapar..." : "Slumpa"}
            onClick={handleRandomize}
            disabled={authLoading || !user || saving}
          />
        </div>
    </Modal>
  );
}