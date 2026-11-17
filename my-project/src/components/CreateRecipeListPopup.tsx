import type { Dispatch, SetStateAction } from "react";
import { createRecipeList } from "../services/lists";
import { useState } from "react";
import { useEscapeKey } from "../hooks/useEscapeKey";
import GenericButton from "./GenericButton";
import Modal from "./Modal";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../context/useAuth";
type CreateRecipeListPopupProps = {
  setShowPopup: Dispatch<SetStateAction<boolean>>;
  onListCreated: () => void;
};

export default function CreateRecipeListPopup({ setShowPopup, onListCreated }: CreateRecipeListPopupProps) {
  const [listName, setListName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const { user, isLoading: loadingUser, error: authError } = useAuth();
  const visibleAuthError = authError || (!loadingUser && !user
    ? "Du måste vara inloggad för att skapa en lista."
    : null);
  const requestClose = () => setIsClosing(true);
  useEscapeKey(requestClose, !saving && !isClosing);

  const handleCreateList = async () => {
    if (!user) {
      setErrorMessage("Du måste vara inloggad för att skapa en lista.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      await createRecipeList({
        name: listName,
        user_id: user.id,
      });
      onListCreated();
      requestClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunde inte skapa listan.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      labelledBy="create-recipe-list-title"
      className="flex w-full max-w-lg flex-col gap-4 rounded-md bg-white p-6 shadow-lg"
      isClosing={isClosing}
      onCloseComplete={() => setShowPopup(false)}
    >
        <h2 id="create-recipe-list-title" className="text-xl font-bold text-app-ink">Skapa ny lista</h2>
        <p className="text-app-ink">Ange namn på din nya receptlista:</p>
        {loadingUser && <LoadingSpinner label="Kontrollerar inloggning..." className="py-2 text-sm" />}
        {(errorMessage || visibleAuthError) && (
          <p role="alert" className="text-sm text-action-danger-text">{errorMessage || visibleAuthError}</p>
        )}
        <input
          type="text"
          placeholder="Listnamn"
          className="mt-2 w-full rounded-md border border-app-border px-4 py-2 text-app-ink focus:outline-none focus:ring-2 focus:ring-brand-olive"
          onChange={(e) => setListName(e.target.value)}
        />
        <div className="flex flex-row justify-center gap-4">
          <GenericButton
            variant="danger"
            label="Tillbaka"
            className="self-center"
            onClick={requestClose}
            disabled={saving}
          />
          <GenericButton
            variant="create"
            label={saving ? "Sparar..." : "Spara"}
            className="self-center"
            onClick={handleCreateList}
            disabled={loadingUser || !user || saving || !listName.trim()}
            disabledCursor={saving ? "wait" : undefined}
          />
        </div>
    </Modal>
  );
}