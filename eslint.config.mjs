import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const eslintConfig = [
  // TypeScript defaults
  ...tseslint.configs.recommended,
  {
    name: "blueprint/custom-rules",
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    settings: {
      react: { version: "detect" },
      next: { rootDir: "." },
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/prefer-as-const": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-duplicate-type-constituents": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      
      // React rules
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
      "react/no-unescaped-entities": "off",
      "react/display-name": "warn",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      
      // Next.js rules
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      
      // General JavaScript rules
      "no-throw-literal": "error",
      "no-eval": "error",
      "eqeqeq": ["error", "allow-null"],
      "prefer-const": "error",
      "no-unused-vars": "off",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-debugger": "error",
      "no-empty": "warn",
      "no-case-declarations": "off",
      "no-fallthrough": ["error", { "commentPattern": "falls? through" }],
      "no-redeclare": "warn",
      "no-undef": "off",
      "no-unreachable": "warn",
      "no-useless-escape": "warn",
      "no-return-await": "error",
      "no-self-compare": "error",
      "no-duplicate-imports": "warn",
      "no-template-curly-in-string": "error",
    },
  },
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      "no-restricted-imports": ["warn", {
        "patterns": [{
          "group": ["@/lib/db", "@/lib/prisma", "@prisma/client"],
          "message": "Use services from '@/lib/services' instead."
        }]
      }],
    },
  },
  {
    files: ["src/lib/services/**/*.ts"],
    rules: {
      "no-restricted-imports": ["warn", {
        "patterns": [{
          "group": ["@prisma/client"],
          "message": "Consider using repositories from '@/lib/repositories' instead."
        }]
      }],
    },
  },
  {
    files: ["src/components/**/*.tsx", "src/app/(dashboard)/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [{
          "group": ["@/lib/db", "@/lib/prisma", "@/lib/repositories", "@/lib/services"],
          "message": "Components should not import backend code directly."
        }]
      }],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "examples/**",
      "skills",
      "src/__tests__/**",
      "e2e/**",
      "repo_*.json",
      "repo_*.md",
      "repo_files/**",
      "db/**",
      "jest.setup.ts",
      "prisma/seed.ts",
      "scripts/**"
    ]
  }
];

export default eslintConfig;
