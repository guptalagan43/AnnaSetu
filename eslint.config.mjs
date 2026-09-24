import nextPlugin from "eslint-config-next";

export default [
  ...nextPlugin,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
    },
  },
];