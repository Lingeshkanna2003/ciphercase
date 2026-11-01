# CipherCase

CipherCase is a small detective game that runs in your browser. Work through three original cases, examine evidence, compare suspect accounts, keep notes, and make a final accusation. Your progress stays in local storage on this device.

**Play:** [CipherCase on GitHub Pages](https://lingeshkanna2003.github.io/ciphercase/) · **Source:** [GitHub](https://github.com/Lingeshkanna2003/ciphercase)

## Run locally

Requirements: Node.js 22 or newer and npm.

```sh
npm install
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173`.

## Game features

- Three complete mysteries with four suspects, five evidence items, a timeline, contextual hints, and a written solution.
- Examine and revisit clues, log interviews, keep private notes, and use collected evidence to support an accusation.
- Story, Standard, and Expert modes. Hints and incorrect accusations affect the score; Story mode has no hint penalty.
- Local progress and case scores saved in this browser. No account or server is involved.
- Share a completed case with a link containing only its score, case, difficulty, hint count, and completion date. Notes are never included.
- Responsive layout, keyboard-visible focus, semantic form controls, and reduced-motion support.

## Project layout

```text
src/
  components/       Home, case workspace, header, and shared-result screens
  data/cases/       The three static case files (JSON)
  lib/              Deduction rules, local saves, sharing, and achievements
  types/            Shared TypeScript models
  styles.css        Responsive interface and motion styles
.github/workflows/  Type checks, tests, build, and GitHub Pages deployment
```

The accusation engine checks the named suspect and the selected method and motive clues against each case's solution. Only examined clues can be submitted. The same rules are covered by automated tests.

### Add or edit a case

Add a JSON file under `src/data/cases/` with a unique `id` and `caseNumber`, at least three suspects, four evidence items, and two hints. Set `answer.culpritId`, `answer.methodEvidenceId`, and `answer.motiveEvidenceId` to IDs in that file. `validateCaseFile` and the case engine tests check the references and verify the intended answer can close the case. Import the file in `src/data/cases/index.ts`, then add or update a test if the solution rules change.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

`npm run build:pages` creates a build with the `/ciphercase/` base path used by GitHub Pages.

## Deploy

### GitHub Pages

The workflow in `.github/workflows/pages.yml` runs type checks, tests, and the Pages build on every push to `main`, then deploys the site. Confirm the repository uses **Settings → Pages → Build and deployment → GitHub Actions**. The published site is available at [lingeshkanna2003.github.io/ciphercase](https://lingeshkanna2003.github.io/ciphercase/).

## Screenshots

To capture screenshots for this README, run the game locally with `npm run dev`, open the printed address in a desktop browser, and capture the home screen and an open case. Repeat at a mobile viewport to show the responsive layout. Save optimized PNGs in `docs/screenshots/`, then add them here, for example:

```md
![CipherCase case archive](docs/screenshots/home.png)
![Evidence investigation on mobile](docs/screenshots/mobile-case.png)
```

Screenshots should show real running screens and should not include private notes or browser account details.

## Privacy and cost

The game has no paid APIs, analytics, authentication, or hosted database. Case content is bundled as static JSON; notes and progress remain in the browser's local storage. Clearing site data clears that save. GitHub Pages serves static files, so the app has no metered application backend to operate.

## License

MIT. See [LICENSE](LICENSE).
