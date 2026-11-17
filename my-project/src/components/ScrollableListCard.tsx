import { MdPlaylistAddCircle } from "react-icons/md";
import { LuClock3 } from "react-icons/lu";
import { useLocation } from "react-router-dom";
import type { Recipe } from "../types/Recipe";
import GenericButton from "./GenericButton";

type ScrollableListCardProps = {
  items: Recipe[]
  editState?: boolean
  selectedRecipeIds?: Set<string>
  onRecipeSelectionChange?: (recipeId: string, selected: boolean) => void
}

const EMPTY_SELECTED_RECIPE_IDS = new Set<string>();

// Shared table-cell spacing for recipe values and headers.
const tableCellClassName = "px-4 py-3";
// Shared border and spacing for column headers.
const tableHeaderCellClassName = `border-r border-app-border-table ${tableCellClassName}`;

export default function ScrollableListCard({
  items,
  editState,
  selectedRecipeIds = EMPTY_SELECTED_RECIPE_IDS,
  onRecipeSelectionChange,
}: ScrollableListCardProps) {
  const location = useLocation();

  return (
    <div className="recipe-scroll min-w-0 overflow-visible rounded border border-app-border bg-app-surface shadow-[0_1px_3px_rgba(120,80,40,0.12)]">
    <table className="w-full table-auto text-left text-app-ink">
      <thead className="bg-app-table-header text-xs uppercase tracking-wide text-app-muted">
        <tr>
          <th className={tableHeaderCellClassName}>Recept</th>
          <th className={tableHeaderCellClassName}>Ingredienser (antal)</th>
          <th className={tableHeaderCellClassName}>Tid</th>
          <th className={tableHeaderCellClassName}>Instruktioner</th>
          <th className={`w-36 min-w-[9rem] ${tableCellClassName}`}>{editState ? "Markera" : "Lägg till i lista"}</th>
      </tr>
      </thead>
        <tbody>
        {items.map((recipe) => (
          <tr key={recipe.id} className="border-b border-app-border-soft transition-colors duration-200 hover:bg-app-row-hover">
            <td className={tableCellClassName}>{recipe.name}</td>
            <td className={tableCellClassName}>{recipe.ingredients.length}</td>
            <td className={tableCellClassName}>
              <span className="inline-flex items-center gap-1 rounded-sm bg-app-time-surface px-2 py-1 text-sm text-app-time-text">
                <LuClock3 aria-hidden="true" className="text-xs" />
                {recipe.time || "—"}{recipe.time ? " min" : ""}
              </span>
            </td>
            <td className={tableCellClassName}>
              <GenericButton
                to={`/recept/${recipe.id}`}
                state={{ recipe, from: location.pathname }}
                variant="outline"
                label="Se hela receptet"
                className="w-fit rounded-sm normal-case"
              />
            </td>
            <td className={`w-36 min-w-[9rem] ${tableCellClassName}`}>
              <div className="grid place-items-center">
                <div
                  className={`col-start-1 row-start-1 transition-[opacity,transform] duration-200 ease-in-out ${
                    editState ? "pointer-events-none translate-y-1 opacity-0" : "translate-y-0 opacity-100"
                  }`}
                  aria-hidden={editState}
                >
                  <MdPlaylistAddCircle className="cursor-pointer text-3xl text-brand-olive transition-all duration-200 hover:scale-110 hover:text-brand-tomato" />
                </div>
                <label
                  className={`col-start-1 row-start-1 flex cursor-pointer items-center justify-center transition-[opacity,transform] duration-200 ease-in-out ${
                    editState ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
                  }`}
                  aria-hidden={!editState}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 cursor-pointer accent-action-danger"
                    checked={selectedRecipeIds.has(recipe.id)}
                    onChange={(event) => onRecipeSelectionChange?.(recipe.id, event.target.checked)}
                    disabled={!editState}
                    aria-label={`Markera ${recipe.name} för radering`}
                    tabIndex={editState ? 0 : -1}
                  />
                </label>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}
