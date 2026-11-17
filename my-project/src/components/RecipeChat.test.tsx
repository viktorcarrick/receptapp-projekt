import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RecipeChat from "./RecipeChat";
import { AuthContext } from "../context/authContext";

describe("RecipeChat", () => {
  it("disables chat and image-import launch buttons when no user is authenticated", () => {
    const markup = renderToStaticMarkup(
      <AuthContext.Provider value={{ user: null, isLoading: false, error: null }}>
        <RecipeChat onOpenChange={() => {}} onRecipeGenerated={() => {}} />
      </AuthContext.Provider>,
    );

    for (const label of ["Importera recept från bild", "Öppna receptchatten"]) {
      const button = markup.match(
        new RegExp(`<button(?=[^>]*aria-label="${label}")[^>]*>`),
      )?.[0];
      expect(button).toContain('disabled=""');
    }
  });
});
