import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local agent tooling, not application source. `ruflo init` drops ~40
    // helper scripts into .claude/, and they lint at 29 errors — none of them
    // ours and none of them fixable here. Without this, `npm run lint` never
    // returns clean again and stops being a signal about src/.
    ".claude/**",
  ]),
]);

export default eslintConfig;
