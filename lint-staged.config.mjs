const typecheckCommand = "npm run typecheck";

export default {
  // Run once per commit (avoid concurrent duplicate typecheck runs).
  "**/*.{ts,tsx,mts,cts,js,mjs,cjs,json}": () => typecheckCommand,
};
