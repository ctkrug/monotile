import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        localStorage: "readonly",
        Blob: "readonly",
        URL: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URLSearchParams: "readonly",
        navigator: "readonly",
      },
    },
  },
  {
    files: ["src/test/**"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        performance: "readonly",
      },
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
];
