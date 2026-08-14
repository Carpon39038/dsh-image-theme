import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['lib/**', 'node_modules/**', 'playground/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
)
