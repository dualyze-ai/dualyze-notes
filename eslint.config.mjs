import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import obsidianPlugin from 'eslint-plugin-obsidianmd';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json' }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'obsidianmd': obsidianPlugin,
    },
    rules: {
      ...obsidianPlugin.configs.recommended.rules,
    },
    settings: {
      obsidianmd: { minAppVersion: '0.15.0' }
    }
  }
];
