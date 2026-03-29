import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript rules - critical ones as error, others as warn
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/prefer-as-const": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-duplicate-type-constituents": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      
      // React rules - critical ones as error
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "warn",
      "react/prop-types": "off",
      "react-compiler/react-compiler": "off",
      
      // Next.js rules
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      
      // General JavaScript rules - critical ones as error
      "no-throw-literal": "error",
      "no-eval": "error",
      "eqeqeq": ["error", "allow-null"],
      "prefer-const": "error",
      "no-unused-vars": "off",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-debugger": "error",
      "no-empty": "warn",
      "no-irregular-whitespace": "warn",
      "no-case-declarations": "off",
      "no-fallthrough": ["error", { "commentPattern": "falls? through" }],
      "no-mixed-spaces-and-tabs": "warn",
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
  // ============================================
  // ARCHITECTURE PROTECTION RULES
  // These rules prevent layer leakage and maintain clean architecture
  // Using 'warn' instead of 'error' for gradual refactoring approach
  // ============================================
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      // Prevent direct Prisma imports in API routes - use services instead
      "no-restricted-imports": ["warn", {
        "patterns": [{
          "group": ["@/lib/db", "@/lib/prisma", "@prisma/client"],
          "message": "🚫 ARCHITECTURE VIOLATION: API routes should not import Prisma directly. Use services from '@/lib/services' instead."
        }]
      }],
    },
  },
  // ============================================
  // SERVICE LAYER RULES  
  // Services should use repositories, not Prisma directly (soft rule for now)
  // ============================================
  {
    files: ["src/lib/services/**/*.ts"],
    rules: {
      "no-restricted-imports": ["warn", {
        "patterns": [{
          "group": ["@prisma/client"],
          "message": "⚠️ Consider using repositories from '@/lib/repositories' instead of importing Prisma types directly."
        }]
      }],
    },
  },
  // ============================================
  // COMPONENT RULES
  // Components should not access backend directly
  // ============================================
  {
    files: ["src/components/**/*.tsx", "src/app/(dashboard)/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [{
          "group": ["@/lib/db", "@/lib/prisma", "@/lib/repositories", "@/lib/services"],
          "message": "🚫 ARCHITECTURE VIOLATION: Components should not import backend code directly. Use API routes or React Query hooks instead."
        }]
      }],
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills"]
  }
];

export default eslintConfig;
