---
name: simplify-code
description: Review changed code for reuse, quality, and efficiency, then fix any issues found. Use after completing feature work or when code feels complex.
context: fork
agent: general-purpose
allowed-tools: Read, Edit, Grep, Glob
---

# Code Simplification Skill

## Purpose

Systematically review and improve code quality by identifying:
- Duplication that can be extracted
- Complexity that can be simplified
- Abstractions that are premature or leaky
- Opportunities for better naming or structure

## Instructions

### 1. Identify Changed Files

First, determine what code to review:
- Ask user which files to focus on, OR
- Use `git diff --name-only HEAD~1` to see recent changes, OR
- Review files the user has been working on

### 2. Apply the Rule of Three

Look for duplication:
- **One occurrence**: Leave it
- **Two occurrences**: Consider extraction, but wait
- **Three+ occurrences**: Extract into shared utility

When extracting:
- Choose a clear, descriptive name
- Place in appropriate location (utils/, composables/, components/)
- Ensure single responsibility

### 3. Check for Complexity Smells

For each changed file, look for:

**Over-engineering:**
- Interfaces/types with single implementations
- Generics where concrete types would do
- Configuration for non-configurable things
- Factory patterns for singleton usage

**Premature optimization:**
- Memoization without performance problems
- Caching without cache invalidation strategy
- Complex state management for simple data

**Leaky abstractions:**
- Components that expose implementation details
- Functions with catch-all parameters
- Types that could be more specific

### 4. Apply Simplification Patterns

**For each smell, apply:**

| Smell | Simplification |
|-------|----------------|
| Unused abstraction | Remove it completely |
| Duplicated logic | Extract to named function |
| Complex conditional | Extract to boolean function with clear name |
| Deep nesting | Early returns or guard clauses |
| Large component | Split by responsibility |
| Catch-all props | Specific, typed props |

### 5. Make Changes Incrementally

For each improvement:
1. Explain what you're changing and why
2. Apply the change
3. Verify it doesn't break existing behavior

### 6. Know When to Stop

**Do simplify:**
- Obvious duplication (3+ occurrences)
- Unused code (dead code, unused types)
- Over-engineered simple logic

**Don't refactor:**
- Code that works and is clear
- Code pending functional changes
- Code at system boundaries (APIs, UI)

---

## Output Format

After review, provide:

```markdown
## Simplification Review

### Files Reviewed
- file1.ts: [summary]
- file2.vue: [summary]

### Changes Made

#### 1. [Change title]
**Before:** [what it was]
**After:** [what it is]
**Why:** [rationale]

#### 2. [Change title]
...

### Recommendations
[Things to consider but didn't implement]
```

---

## Principles

1. **Three strikes and you refactor**: Duplication is OK until it's not
2. **Delete first, simplify second**: Unused code should be removed, not improved
3. **Clarity over cleverness**: Simple, obvious code beats elegant, obscure code
4. **Working code is sacred**: Don't break functionality for purity
