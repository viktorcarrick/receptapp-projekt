# Matrepot

Matrepot är en svensk receptapp för att samla recept, skapa veckans receptlistor och få hjälp att ta fram recept med AI. Projektet är byggt som en responsiv React-app och använder Supabase för inloggning och data.

**Demo:** publiceringslänk läggs till när GitHub Pages-repot är konfigurerat.

## Funktioner

- Google-inloggning och personliga recept via Supabase Auth.
- Skapa, visa och organisera recept i listor.
- Slumpa fram en receptlista för måltidsplanering.
- Receptassistent som kan skapa recept och läsa recept från en bild.
- Responsiv layout med svenskt gränssnitt.

## Teknik och struktur

- React, TypeScript, Vite och Tailwind CSS.
- Supabase Auth och databas; åtkomst till användardata ska skyddas med Row Level Security (RLS).
- Supabase Edge Function `recipe-ai` anropar Gemini. Gemini-nyckeln finns på serversidan och exponeras inte i klientbygget.
- `HashRouter` gör att undersidor fungerar vid direktladdning på GitHub Pages.

## Kom igång lokalt

Kräver Node.js 22 och npm.

```sh
npm ci
```

Kopiera `.env.example` till `.env` och fyll i Supabase-projektets URL och anon/publishable key. Dessa är klientkonfiguration; databasbehörighet måste fortsatt upprätthållas med RLS.

```sh
npm run dev
```

## Supabase och AI-konfiguration

1. Skapa ett Supabase-projekt och konfigurera Auth, Google-provider och RLS-policies för tabellerna.
2. Lägg till den lokala utvecklingsadressen och den slutliga Pages-adressen i Supabase Auths URL Configuration. För en projektsida är callback-adressen `https://<owner>.github.io/<repository>/` (utan hash-fragment).
3. Installera och logga in med Supabase CLI, länka projektet och spara Gemini-nyckeln som en Edge Function secret:

   ```sh
   supabase login
   supabase link --project-ref <project-ref>
   supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>
   supabase secrets set GEMINI_MODEL=gemini-flash-latest
   supabase functions deploy recipe-ai
   ```

`GEMINI_API_KEY` får aldrig läggas i en `VITE_*`-variabel, `.env.example` eller GitHub Pages-byggmiljön. Vite bäddar in `VITE_*`-värden i den publika klienten. Edge Function kräver en giltig Supabase-användarsession.

## GitHub Pages-publicering

Workflowen [pages.yml](./.github/workflows/pages.yml) kör lint, test och produktionsbygge vid pull requests och publicerar `main` till GitHub Pages. Vite läser `GITHUB_REPOSITORY` i Actions och sätter automatiskt projektets baspath; skapa därför Pages-deployment från det avsedda repot.

I GitHub-repot:

1. Välj **Settings → Pages → Build and deployment → GitHub Actions**.
2. Publicera till `main`. Pull requests verifieras men publiceras inte.
3. Lägg till den publicerade URL:en i Supabase Auths redirect allow-list och Google OAuth-konfiguration.
4. Verifiera att RLS-policies är aktiva och testa inloggning, direktladdning/navigering, receptdata och AI-funktioner på den publicerade sidan.

## Kvalitetskommandon

```sh
npm run lint
npm test
npm run build
```

## Säkerhet och drift

- Supabase anon/publishable key är avsedd för klienten; RLS måste begränsa åtkomst till användarens data.
- Gemini-nyckeln lagras som Supabase Edge Function secret och ska roteras om den någon gång råkar publiceras.
- En Pages-deployment kräver ett externt Supabase-projekt, konfigurerade OAuth-redirects och RLS. Dessa inställningar kan inte verifieras från enbart källkoden.
- Skärmbilder och en fungerande demo-URL läggs till efter att repot och Pages-deployment har skapats.
