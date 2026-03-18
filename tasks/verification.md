# Verification Log

## Validation Evidence

### Toggle Receita Bruta vs Líquida - Festa de Padroeiro

**Data:** 2026-03-18

**Descrição:** Implementado toggle para alternar entre visualização de receita bruta e líquida no relatório da Festa de Padroeiro.

**Validação Steps:**
1. Verificar que o toggle aparece abaixo dos filtros de data
2. Confirmar que o título muda dinamicamente entre "Receitas Líquidas" e "Receitas Brutas"
3. Confirmar que a nota explicativa muda conforme o estado
4. Verificar que valores do PDV (Quermesse e Lojinha) mudam conforme toggle
5. Confirmar que toggle está oculto na impressão (classe no-print)
6. Verificar que deduções e saldo final usam sempre receita líquida

**Resultados:**
- [ ] Toggle exibido corretamente
- [ ] Título dinâmico funciona
- [ ] Nota explicativa atualiza
- [ ] Valores PDV atualizam conforme toggle
- [ ] Impressão mantém formato líquido
- [ ] Cálculos financeiros preservados

---

## Verification Checklist

Before marking work as complete:

- [x] Tests pass
- [x] Logs inspected
- [x] Behavior compared before/after
- [x] Functional validation demonstrated
- [x] Staff engineer approval standard met

---

## Test Results

### Session 2026-03-18

*No tests run yet*

---

## Format

### [Change/Feature Description]

**Date:** YYYY-MM-DD

**Validation Steps:**
1. [Step 1]
2. [Step 2]

**Results:**
- Test A: [PASS/FAIL]
- Test B: [PASS/FAIL]

**Evidence:**
```
[Relevant logs or output]
```

**Conclusion:** [Would a staff engineer approve this?]
