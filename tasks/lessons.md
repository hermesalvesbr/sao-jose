# Lessons Learned

## Mistake Patterns & Prevention Rules

### Toggle/switch sempre deve respeitar contexto de impressão

**What happened:** Ao adicionar toggle para receita bruta/líquida, era necessário garantir que a impressão mantivesse o formato padrão (líquido).

**Root cause:** Relatórios impressos devem seguir formato diocesano padrão, sem opções de visualização.

**Prevention rule:** Sempre adicionar classe `no-print` em controles de UI que alteram visualização em relatórios destinados à impressão.

**How to apply:** Em telas de relatório com botão de imprimir/PDF, verificar se todos os controles de visualização (toggles, switches, filtros) estão ocultos na impressão.

---

### Calcular bruto vs líquido requer separação clara de responsabilidades

**What happened:** Implementação de receita bruta e líquida no mesmo cálculo poderia causar confusão.

**Root cause:** É melhor calcular ambos os valores (bruto e líquido) de uma vez e selecionar qual exibir via computed property.

**Prevention rule:** Separar cálculo de exibição - compute todos os valores, selecione qual mostrar baseado no estado do toggle.

**How to apply:**
1. Calcule `lojinhaBruto`, `lojinhaLiquido`, `quermesseBruto`, `quermesseLiquido` no mesmo computed
2. Use `revenueLines` para selecionar qual valor exibir baseado em `mostrarReceitaBruta`
3. Mantenha cálculos financeiros (deduções, saldo) sempre usando valor líquido

---

## Format

Each lesson follows this structure:

### [Title describing the mistake pattern]

**What happened:** [Description of the incident]

**Root cause:** [Why it happened]

**Prevention rule:** [Actionable rule to prevent recurrence]

**How to apply:** [When/where this rule kicks in]

---

## Categories

- Architecture
- Testing
- Code Review
- Debugging
- Communication
