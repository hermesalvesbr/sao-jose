import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
  ignores: ['scripts/**', 'eslint_report.json', 'schema_dump.json'],
})
