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
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/no-unused-disable-directive": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-duplicate-type-constituents": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      
      // React rules
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      "react-compiler/react-compiler": "off",
      
      // Next.js rules
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      
      // General JavaScript rules
      "prefer-const": "off",
      "no-unused-vars": "off",
      "no-console": "off",
      "no-debugger": "off",
      "no-empty": "off",
      "no-irregular-whitespace": "off",
      "no-case-declarations": "off",
      "no-fallthrough": "off",
      "no-mixed-spaces-and-tabs": "off",
      "no-redeclare": "off",
      "no-undef": "off",
      "no-unreachable": "off",
      "no-useless-escape": "off",
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
