import { useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { IoTrashBin } from "react-icons/io5";
import { useEditableList } from "../hooks/useEditableList";
import { createRecipe } from "../services/recipes";
import GenericButton from "../components/GenericButton";
import RecipeChat from "../components/RecipeChat";
import type { GeneratedRecipe } from "../services/gemini";
import { useNavigate } from "react-router-dom";
import { BsRobot } from "react-icons/bs";
import { LuScanText } from "react-icons/lu";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/useAuth";
const inputClassName = "w-full rounded-md border border-app-border bg-white px-3 py-2 text-app-ink placeholder:text-app-muted outline-none focus:border-brand-tomato focus:ring-2 focus:ring-brand-tomato/20";
const listEditorClassName = "mt-4 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center";
// Shared typography and layout for recipe detail labels.
const recipeFieldLabelClassName = "flex flex-col gap-2 text-lg font-semibold text-app-ink";

type RecipeItemEditorProps = {
    title: string;
    placeholder: string;
    list: ReturnType<typeof useEditableList>;
};

function RecipeItemEditor({ title, placeholder, list }: RecipeItemEditorProps) {
    return (
        <section className="min-w-0">
            <h2 className="mb-4 border-b border-app-border-soft py-2 text-2xl font-semibold text-app-ink">
                {title}
            </h2>
            <div className={listEditorClassName}>
                <input
                    className={inputClassName}
                    type="text"
                    placeholder={placeholder}
                    value={list.inputValue}
                    onChange={(event) => list.setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            list.handleAddItem();
                        }
                    }}
                />
                <GenericButton
                    label="Lägg till"
                    className="min-w-32"
                    onClick={list.handleAddItem}
                />
            </div>
            <ul className="min-h-40 list-none space-y-2 rounded-md text-left text-app-ink">
                {list.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3">
                        <span>{item.value}</span>
                        <button
                            type="button"
                            aria-label={`Ta bort ${item.value}`}
                            className="shrink-0 text-app-ink hover:text-action-danger-text"
                            onClick={() => list.handleRemoveItem(item.id)}
                        >
                            <IoTrashBin className="cursor-pointer" aria-hidden="true" />
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function AddRecipePage() {
    const navigate = useNavigate();
    const [recipeName, setRecipeName] = useState("");
    const [time, setTime] = useState("");
    const [noOfPortions, setNoOfPortions] = useState(0);
    const { user, isLoading: authLoading, error: authError } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const ingredientList = useEditableList();
    const instructionsList = useEditableList();
    const handleRecipeGenerated = (recipe: GeneratedRecipe) => {
        setRecipeName(recipe.name);
        setTime(recipe.time);
        setNoOfPortions(recipe.no_of_portions);
        ingredientList.setValues(recipe.ingredients);
        instructionsList.setValues(recipe.instructions);
    };
    const handleSaveRecipe = async () => {
        if (!user) {
            setSaveError("Du måste vara inloggad för att spara ett recept.");
            return;
        }

        const recipe = {
            user_id: user.id,
            name: recipeName,
            ingredients: ingredientList.items.map((item) => item.value),
            instructions: instructionsList.items.map((item) => item.value),
            time: time,
            no_of_portions: noOfPortions,
        };

        setSaving(true);
        setSaveError(null);
        try {
            await createRecipe(recipe);
            clearForm();
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : "Kunde inte spara receptet.");
        } finally {
            setSaving(false);
        }
    }

    const clearForm = () => {
        setRecipeName("");
        setTime("");
        setNoOfPortions(0);
        ingredientList.setValues([]);
        instructionsList.setValues([]);
        navigate("/alla-recept");
    };
  return (
    <div className="mx-auto flex min-h-full w-full min-w-0 flex-1 flex-col">
      <article className={`mx-auto w-full max-w-6xl flex-1 rounded-md border border-app-border bg-app-surface p-5 text-left shadow-[0_1px_3px_rgba(120,80,40,0.12)] transition-[width] duration-200 ease-out sm:p-8 ${chatOpen ? "lg:w-[calc(100%_-_22rem)] lg:flex-none" : "lg:w-[calc(100%_-_8rem)] lg:flex-none"}`}>
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-app-border-soft pb-5">
          <div>
            <h1 className="m-0 text-4xl font-semibold text-app-ink">Lägg till recept</h1>
            <p className="mt-2 text-sm text-app-muted">Fyll i manuellt, generera det med Botlas <BsRobot className="inline-block align-middle text-lg" aria-hidden="true" /> eller importera ett fysiskt recept med <LuScanText className="inline-block align-middle text-lg" aria-hidden="true" />.</p>
          </div>
          <GenericButton
            to="/alla-recept"
            variant="accent"
            label="Tillbaka"
            icon={<IoMdArrowRoundBack aria-hidden="true" className="text-lg" />}
          />
        </header>
        {authLoading && <LoadingSpinner label="Kontrollerar inloggning..." className="app-content-enter py-3" />}
        {!authLoading && (authError || !user) && (
          <p role="alert" className="mb-4 text-action-danger-text">
            {authError || "Du måste vara inloggad för att spara ett recept."}
          </p>
        )}
        {saveError && <p role="alert" className="mb-4 text-action-danger-text">{saveError}</p>}

        <div className="grid gap-6 md:grid-cols-2">
          <label className={`${recipeFieldLabelClassName} md:col-span-2`}>
            Namn
            <input
              className={inputClassName}
              type="text"
              placeholder="Receptnamn"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
            />
          </label>
          <label className={recipeFieldLabelClassName}>
            Tid (minuter)
            <input
              className={`${inputClassName} max-w-40`}
              type="text"
              placeholder="00:00"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <label className={recipeFieldLabelClassName}>
            Portioner
            <input
              className={`${inputClassName} max-w-40`}
              type="number"
              placeholder="Antal"
              value={noOfPortions}
              onChange={(e) => setNoOfPortions(parseInt(e.target.value) || 0)}
            />
          </label>
        </div>

        <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-2">
          <RecipeItemEditor
            title="Ingredienser"
            placeholder="Lägg till en ingrediens"
            list={ingredientList}
          />
          <RecipeItemEditor
            title="Instruktioner"
            placeholder="Lägg till en instruktion"
            list={instructionsList}
          />
        </div>

        <GenericButton
          label={saving ? "Sparar..." : "Spara recept"}
          className="mt-8 min-h-11 w-full text-base"
          onClick={handleSaveRecipe}
          disabled={authLoading || !user || saving}
          disabledCursor={saving ? "wait" : undefined}
        />
      </article>
      <RecipeChat
        onOpenChange={setChatOpen}
        onRecipeGenerated={handleRecipeGenerated}
      />
    </div>
  )
}
