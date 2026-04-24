# The Reformer's Ward

An educational game about **Dorothea Dix** and the 19th-century American movement to reform the care of the mentally ill. You play the superintendent of an 1840s Massachusetts almshouse. Miss Dix is coming to inspect.

**Status:** M1 scaffold — engine boots, placeholder scene renders. Not yet playable.

Built for 8th-grade history classrooms. Runs in any modern browser; no install required.

## Running locally

Requires Node.js 20+.

```
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Building

```
npm run build
```

Output lands in `dist/`. GitHub Actions builds and deploys on every push to `main`.

## Project layout

```
src/
  main.ts              Boot + placeholder scene
  scenarios/           One JSON per scenario (v1 ships almshouse-1841)
    types.ts           TypeScript types for scenario data
  patients/            (future) patient condition templates
  actions/             (future) player action registry
  quotes/              (future) historical quote bank
```

## Historical sources

Content draws from Dorothea Dix's *Memorial to the Legislature of Massachusetts* (1843) and the broader record of 19th-century asylum reform. Patient names and families in the game are fictional; the conditions they depict are not.
