const typecheckCommand = "npm run typecheck";

export default {
  "{app,scripts}/**/*.{ts,tsx,mts,cts,js,mjs,cjs}": () => typecheckCommand,
  "{react-router.config.ts,vite.config.ts,tsconfig.json,package.json}": () => typecheckCommand,
};
