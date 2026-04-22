// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "out/**",
      "dist/**",
      "release/**",
      "build/icons/**",
      "coverage/**",
      "**/*.d.ts",
      "postcss.config.js",
      "tailwind.config.js",
    ],
  },

  // Base JS + TS recommended rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // TypeScript-aware rules for all TS/TSX
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      eqeqeq: ["error", "smart"],
    },
  },

  // Main process (Node runtime)
  {
    files: ["src/main/**/*.{ts,tsx}", "electron.vite.config.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Preload (mixed Node + browser)
  {
    files: ["src/main/preload.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },

  // Renderer (browser runtime) + React rules
  {
    files: ["src/renderer/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/no-unknown-property": [
        "error",
        {
          ignore: [
            "allowpopups",
            "partition",
            "useragent",
            "disablewebsecurity",
            "enableblinkfeatures",
            "disableblinkfeatures",
            "webpreferences",
            "plugins",
            "httpreferrer",
            "nodeintegration",
            "nodeintegrationinsubframes",
            "blinkfeatures",
          ],
        },
      ],
    },
  },

  // Prettier compat must come last — disables style rules that conflict with Prettier
  prettier,
);
