import { useCallback, useEffect, useState } from "react";
import CreateRecipeListPopup from "../components/CreateRecipeListPopup";
import AddRecipesToListPopup from "../components/AddRecipesToListPopup";
import RandomizeRecipeListPopup from "../components/RandomizeRecipeListPopup";
import type { RecipeList } from "../types/RecipeList";
import { getRecipeCountsForLists, getRecipeListsForUser } from "../services/lists";
import GenericButton from "../components/GenericButton";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/useAuth";

// Shared spacing for list table cells.
const tableCellClassName = "px-4 py-3";

export default function MyListsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const location = useLocation();
  const routeState = location.state;
  const requestedPopup =
    typeof routeState === "object" &&
    routeState !== null &&
    "popup" in routeState &&
    (routeState.popup === "create" || routeState.popup === "randomize")
      ? routeState.popup
      : null;
  const [showPopup, setShowPopup] = useState(requestedPopup === "create");
  const [randomizePopup, setRandomizePopup] = useState(requestedPopup === "randomize");
  const [selectedList, setSelectedList] = useState<RecipeList | null>(null);
  const [lists, setLists] = useState<RecipeList[]>([]);
  const [recipeCounts, setRecipeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    if (!userId) {
      throw new Error("Du måste vara inloggad för att se dina listor.");
    }
    const userLists = await getRecipeListsForUser(userId);
    const counts = await getRecipeCountsForLists(
      userLists.flatMap((list) => list.id ? [list.id] : []),
      userId
    );
    return { userLists, counts };
  }, [userId]);

  const refreshLists = useCallback(() => {
    setRefreshing(true);
    setErrorMessage(null);
    void loadLists().then(({ userLists, counts }) => {
      setLists(userLists);
      setRecipeCounts(counts);
    }).catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Kunde inte hämta listorna.");
    }).finally(() => {
      setRefreshing(false);
    });
  }, [loadLists]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    let isMounted = true;

    void loadLists().then(({ userLists, counts }) => {
      if (isMounted) {
        setLists(userLists);
        setRecipeCounts(counts);
      }
    }).catch((error: unknown) => {
      if (isMounted) {
        setErrorMessage(error instanceof Error ? error.message : "Kunde inte hämta listorna.");
      }
    }).finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [authLoading, loadLists]);

  return (
    <>
      {showPopup && (
        <CreateRecipeListPopup
          setShowPopup={setShowPopup}
          onListCreated={refreshLists}
        />
      )}
      {selectedList && (
        <AddRecipesToListPopup
          key={selectedList.id}
          list={selectedList}
          onClose={() => setSelectedList(null)}
          onRecipesAdded={refreshLists}
        />
      )}
      {randomizePopup && (
        <RandomizeRecipeListPopup
          setRandomizePopup={setRandomizePopup}
          onListCreated={refreshLists}
        />
      )}
      <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6 px-4">
        <section className="w-full min-w-0">
          <header className="flex flex-wrap items-center gap-4">
            <h3 className="min-w-0 flex-1 text-left text-4xl font-semibold text-app-ink">Sparade listor</h3>
            <div className="ml-auto flex flex-wrap justify-end gap-4">
              <GenericButton
                label="Skapa ny lista"
                className="h-10 w-32"
                onClick={() => setShowPopup(true)}
              />
              <GenericButton
                label="Slumpa lista"
                className="h-10 w-32"
                onClick={() => setRandomizePopup(true)}
              />
            </div>
          </header>
          {refreshing && (
            <LoadingSpinner label="Uppdaterar listor..." className="app-content-enter py-2 text-sm" />
          )}
        </section>
        <section className="w-full min-w-0 max-w-full">
          <div className="w-full max-w-full overflow-visible rounded border border-app-border bg-app-surface shadow-[0_1px_3px_rgba(120,80,40,0.12)]">
            <table className="w-full table-auto bg-app-surface text-left text-app-ink">
          <thead className="bg-app-table-header text-xs uppercase tracking-wide text-app-muted">
            <tr>
            <th className={`border-r border-app-border-table ${tableCellClassName}`}>Lista</th>
            <th className={`border-r border-app-border-table ${tableCellClassName}`}>Recept (antal)</th>
            </tr>
          </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} className={tableCellClassName}>
                    <LoadingSpinner label="Hämtar listor..." className="app-content-enter" />
                  </td>
                </tr>
              ) : errorMessage && lists.length === 0 ? (
                <tr><td role="alert" className={`${tableCellClassName} text-action-danger-text`}>{errorMessage}</td></tr>
              ) : (
                <>
                  {errorMessage && (
                    <tr><td colSpan={2} role="alert" className={`${tableCellClassName} text-action-danger-text`}>{errorMessage}</td></tr>
                  )}
                  {lists.length > 0 ? lists.map((list) => (
                  <tr
                    key={list.id ?? list.name}
                    className="app-content-enter cursor-pointer border-b border-app-border-soft transition-colors duration-200 hover:bg-app-row-hover"
                    onClick={() => setSelectedList(list)}
                  >
                    <td className={tableCellClassName}>
                      <GenericButton
                        variant="plain"
                        label={list.name}
                        className="w-full"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedList(list);
                        }}
                      />
                    </td>
                    <td className={tableCellClassName}>{list.id ? recipeCounts[list.id] ?? 0 : 0}</td>
                  </tr>
                  )) : !errorMessage && (
                    <tr><td className={tableCellClassName}>Du har inga sparade listor ännu.</td></tr>
                  )}
                </>
              )}
          </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  )
}
