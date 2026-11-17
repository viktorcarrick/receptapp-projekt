import { useLocation, useParams } from "react-router-dom";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useEffect, useState } from "react";
import type { Recipe } from "../types/Recipe";
import { getRecipeById } from "../services/recipes";
import GenericButton from "../components/GenericButton";
import LoadingSpinner from "../components/LoadingSpinner";

// Shared text color for recipe loading, metadata, and empty-state messages.
const recipeStatusTextClassName = "text-app-ink";

export default function SingleRecipePage() {
    const location = useLocation();
    const { recipeId } = useParams<{ recipeId: string }>();
    const routeState = location.state;
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const from =
        typeof routeState === "object" &&
        routeState !== null &&
        "from" in routeState &&
        (routeState.from === "/alla-recept" || routeState.from === "/mina-receptlistor")
            ? routeState.from
            : "/mina-receptlistor";

    useEffect(() => {
        let isMounted = true;

        const fetchRecipe = async () => {
            if (!recipeId) {
                setErrorMessage("Receptets ID saknas.");
                setLoading(false);
                return;
            }

            try {
                const fetchedRecipe = await getRecipeById(recipeId);
                if (isMounted) {
                    setRecipe(fetchedRecipe);
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(
                        error instanceof Error ? error.message : "Kunde inte hämta receptet."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void fetchRecipe();
        return () => {
            isMounted = false;
        };
    }, [recipeId]);

    return (
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
            <GenericButton
                to={from}
                variant="accent"
                label={from === "/alla-recept" ? "Tillbaka till alla recept" : "Tillbaka till mina listor"}
                icon={<IoMdArrowRoundBack aria-hidden="true" className="text-lg" />}
                className="w-fit"
            />

            {loading ? (
                <LoadingSpinner label="Hämtar recept..." className="app-content-enter min-h-40" />
            ) : errorMessage ? (
                <p role="alert" className="text-action-danger-text">{errorMessage}</p>
            ) : !recipe ? (
                <p className={recipeStatusTextClassName}>Receptet kunde inte hittas.</p>
            ) : (
                <article className="app-content-enter rounded-md border border-app-border bg-app-surface p-6 text-left shadow-[0_1px_3px_rgba(120,80,40,0.12)] sm:p-8">
                    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-4xl font-semibold text-app-ink">{recipe.name}</h1>
                            <p className={recipeStatusTextClassName}>{recipe.no_of_portions || "—"} port. {recipe.time || "—"} min</p>
                        </div>
                    </header>

                    <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                        <section>
                            <h2 className="mb-4 border-b border-app-border-soft py-2 text-2xl font-semibold text-app-ink">Ingredienser</h2>
                            <ul className="min-h-40 list-none space-y-2 rounded-md text-left text-app-ink">
                                {recipe.ingredients.map((ingredient, index) => (
                                    <li key={`${recipe.id}-ingredient-${index}`}>{ingredient}</li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <h2 className="mb-4 border-b border-app-border-soft py-2 text-2xl font-semibold text-app-ink">Instruktioner</h2>
                            <ol className="min-h-40 list-none space-y-3 rounded-md text-left text-app-ink">
                                {recipe.instructions.map((instruction, index) => (
                                    <li key={`${recipe.id}-instruction-${index}`}>{instruction}</li>
                                ))}
                            </ol>
                        </section>
                    </div>
                </article>
            )}
        </main>
    )
}