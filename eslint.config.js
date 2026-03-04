import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
  ignores: ['scripts/**', 'eslint_report.json', 'schema_dump.json', 'PROGRESS.md', 'docs/**'],
}, {
  files: ['**/*.vue'],
  rules: {
    'vue/valid-v-slot': ['error', { allowModifiers: true }],
  },
})
