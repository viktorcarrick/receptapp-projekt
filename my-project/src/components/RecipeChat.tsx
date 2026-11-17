import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { BsRobot } from "react-icons/bs";
import { LuScanText } from "react-icons/lu";
import { useEscapeKey } from "../hooks/useEscapeKey";
import {
  extractRecipeFromImage,
  sendRecipeChatMessage,
  type GeneratedRecipe,
} from "../services/gemini";
import { useAuth } from "../context/useAuth";

// Shared layout and typography for chat message bubbles.
const chatBubbleClassName = "w-fit max-w-[85%] rounded-lg px-3 py-2 text-sm";
// Shared disabled appearance for buttons that are temporarily unavailable.
const disabledButtonClassName = "disabled:cursor-not-allowed disabled:opacity-60";

type RecipeChatProps = {
  onOpenChange: (isOpen: boolean) => void;
  onRecipeGenerated: (recipe: GeneratedRecipe) => void;
};

type ChatMessage =
  | { type: "user"; text: string }
  | { type: "message"; text: string }
  | { type: "recipe"; recipe: GeneratedRecipe };

export default function RecipeChat({ onOpenChange, onRecipeGenerated }: RecipeChatProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [previousInteractionId, setPreviousInteractionId] = useState<string>();
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrorMessage, setImportErrorMessage] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const importMenuRef = useRef<HTMLElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const aiControlsDisabled = authLoading || !user;

  const changeOpenState = (open: boolean) => {
    setIsOpen(open);
    setIsImportMenuOpen(false);
    onOpenChange(open);
  };

  useEscapeKey(() => changeOpenState(false), isOpen);

  useEffect(() => {
    if (!isImportMenuOpen) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        !(target instanceof Node) ||
        importMenuRef.current?.contains(target) ||
        importButtonRef.current?.contains(target)
      ) {
        return;
      }

      setIsImportMenuOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [isImportMenuOpen]);

  const checkUser = (): boolean => {
    if (authLoading) {
      setErrorMessage("Inloggningen kontrolleras. Försök igen om en stund.");
      return false;
    }

    if (!user) {
      setErrorMessage("Du måste logga in för att prata med mig!");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;

    const previousMessages = messages;
    setErrorMessage("");
    setIsSending(true);

    try {
      if (!checkUser()) {
        return;
      }

      setMessages([...previousMessages, { type: "user", text: message }]);
      setDraft("");
      const response = await sendRecipeChatMessage(message, previousInteractionId);
      if (response.output.type === "recipe") {
        onRecipeGenerated(response.output.recipe);
      }
      setMessages((currentMessages) => [
        ...currentMessages,
        response.output.type === "recipe"
          ? { type: "recipe", recipe: response.output.recipe }
          : { type: "message", text: response.output.message },
      ]);
      setPreviousInteractionId(response.interactionId);
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      setMessages(previousMessages);
      setDraft(message);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Meddelandet kunde inte skickas. Försök igen.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isImporting) return;

    setImportErrorMessage("");
    setIsImporting(true);
    try {
      if (authLoading) {
        setImportErrorMessage("Inloggningen kontrolleras. Försök igen om en stund.");
        return;
      }
      if (!user) {
        setImportErrorMessage("Du måste logga in för att importera ett recept.");
        return;
      }

      const recipe = await extractRecipeFromImage(file);
      onRecipeGenerated(recipe);
      setIsImportMenuOpen(false);
    } catch (error) {
      console.error("Error importing recipe image:", error);
      setImportErrorMessage(
        error instanceof Error ? error.message : "Bilden kunde inte tolkas. Försök igen.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Ta foto av recept"
        disabled={aiControlsDisabled || isImporting}
        onChange={(event) => void handleImageSelected(event)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Välj receptbild från bildgalleriet"
        disabled={aiControlsDisabled || isImporting}
        onChange={(event) => void handleImageSelected(event)}
      />
      {isOpen && (
        <section
          aria-label="Chatt med roboten"
          className="fixed bottom-24 right-4 z-60 flex h-[min(28rem,calc(100vh-8rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-app-border bg-app-surface text-left shadow-xl lg:bottom-4 lg:right-4"
        >
          <header className="flex items-center justify-between bg-brand-forest px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <BsRobot aria-hidden="true" className="text-xl" />
              <h2 className="m-0 text-lg font-semibold">Botlas Ekstedt</h2>
            </div>
            <button
              type="button"
              aria-label="Stäng chatten"
              className="rounded p-1 text-xl leading-none hover:bg-white/20 cursor-pointer"
              onClick={() => changeOpenState(false)}
            >
              &times;
            </button>
          </header>
          <div aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            <p className={`${chatBubbleClassName} self-start bg-app-canvas text-app-ink`}>
              Hej! Vad vill du laga idag?
            </p>
            {messages.map((message, index) => (
              message.type === "recipe" ? (
                <div
                  key={`${index}-recipe-${message.recipe.name}`}
                  className="w-full rounded-lg border border-app-border-soft bg-app-canvas p-3 text-sm text-app-ink"
                >
                  <p className="font-semibold">{message.recipe.name}</p>
                  <p className="mt-1 text-app-muted">
                    {message.recipe.no_of_portions} port. · {message.recipe.time}
                  </p>
                  <p className="mt-2 text-app-subtle">
                    Receptet har fyllts i formuläret. Granska det innan du sparar.
                  </p>
                </div>
              ) : (
                <p
                  key={`${index}-${message.type}-${message.text}`}
                  className={`${chatBubbleClassName} ${
                    message.type === "user"
                      ? "self-end bg-brand-tomato text-white"
                      : "self-start bg-app-canvas text-app-ink"
                  }`}
                >
                  {message.text}
                </p>
              )
            ))}
            {isSending && (
              <p className={`${chatBubbleClassName} self-start bg-app-canvas text-app-muted`}>
                Bläddrar i kokboken...
              </p>
            )}
            {errorMessage && (
              <p role="alert" className={`${chatBubbleClassName} self-start bg-red-50 text-action-danger`}>
                {errorMessage}
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-app-border-soft p-3">
            <input
              aria-label="Skriv ett meddelande"
              className="min-w-0 flex-1 rounded-md border border-app-border px-3 py-2 text-sm text-app-ink outline-none focus:border-brand-tomato focus:ring-2 focus:ring-brand-tomato/20 disabled:cursor-not-allowed disabled:bg-app-canvas"
              placeholder="Skriv ett meddelande..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={isSending || aiControlsDisabled}
            />
            <button
              type="submit"
              className={`rounded-md bg-brand-tomato px-3 py-2 text-sm font-medium text-white hover:bg-brand-tomato-hover ${disabledButtonClassName}`}
              disabled={isSending || !draft.trim() || aiControlsDisabled}
            >
              {isSending ? "Skickar..." : "Skicka"}
            </button>
          </form>
        </section>
      )}
      {!isOpen && (
        <>
          {isImportMenuOpen && (
            <section
              ref={importMenuRef}
              aria-label="Importera recept från bild"
              className="fixed right-4 bottom-52 z-60 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border border-app-border bg-app-surface p-4 text-left shadow-xl"
            >
              <h2 className="m-0 text-base font-semibold text-app-ink">
                Importera recept från bild
              </h2>
              <button
                ref={importButtonRef}
                type="button"
                className={`rounded-md bg-brand-tomato px-4 py-3 text-sm font-medium text-white hover:bg-brand-tomato-hover enabled:cursor-pointer ${disabledButtonClassName}`}
                onClick={() => cameraInputRef.current?.click()}
                disabled={isImporting || aiControlsDisabled}
              >
                Ta foto
              </button>
              <button
                type="button"
                className={`rounded-md border border-app-border px-4 py-3 text-sm font-medium text-app-ink hover:bg-app-canvas enabled:cursor-pointer ${disabledButtonClassName}`}
                onClick={() => galleryInputRef.current?.click()}
                disabled={isImporting || aiControlsDisabled}
              >
                Välj från bildgalleriet
              </button>
              {isImporting && (
                <p role="status" className="m-0 text-sm text-app-muted">
                  Läser och tolkar receptbilden....
                </p>
              )}
              {importErrorMessage && (
                <p role="alert" className="m-0 text-sm text-action-danger">
                  {importErrorMessage}
                </p>
              )}
            </section>
          )}
          <button
            type="button"
            aria-label="Importera recept från bild"
            aria-expanded={isImportMenuOpen}
            aria-haspopup="true"
            onClick={() => {
              setImportErrorMessage("");
              setIsImportMenuOpen((open) => !open);
            }}
            disabled={isImporting || aiControlsDisabled}
            className="fixed bottom-28 right-4 z-60 flex h-20 w-20 items-center justify-center rounded-full bg-brand-tomato text-white shadow-lg transition-transform hover:scale-105 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LuScanText aria-hidden="true" className="text-5xl" />
          </button>
          <button
            type="button"
            aria-label="Öppna receptchatten"
            aria-expanded={isOpen}
            onClick={() => changeOpenState(true)}
            disabled={aiControlsDisabled}
            className="fixed bottom-4 right-4 z-60 flex h-20 w-20 items-center justify-center rounded-full bg-brand-forest text-white shadow-lg transition-transform hover:scale-105 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BsRobot aria-hidden="true" className="text-5xl" />
          </button>
        </>
      )}
    </>
  );
}
