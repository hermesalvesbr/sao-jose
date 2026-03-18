---
name: deep-research
description: Research a topic thoroughly using multiple investigation strategies. Use when exploring unfamiliar code, investigating bugs, or understanding complex systems.
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob, WebFetch, WebSearch
---

# Deep Research Skill

## Purpose

Conduct thorough, multi-strategy research on codebases, architectures, or technical problems.

## Instructions

### 1. Clarify the Research Goal

Before starting, ensure you understand:
- What is the core question or topic?
- What level of depth is needed?
- What would constitute a complete answer?

If the request is vague, ask clarifying questions.

### 2. Use Multiple Investigation Strategies

For codebase research, combine:

**Structural exploration:**
- Use `Glob` to find relevant files by pattern
- Use `Grep` to search for specific patterns, imports, or usages
- Map the file structure around the topic

**Deep reading:**
- Read key files in full, not just snippets
- Follow import chains to understand dependencies
- Look at tests to understand intended behavior

**Context gathering:**
- Check git history for recent changes
- Look at documentation and comments
- Search for related issues or discussions

**External knowledge:**
- Use WebSearch for patterns, best practices
- Use WebFetch for relevant documentation

### 3. Synthesize Findings

Organize research output as:

```markdown
## Summary

[2-3 sentence high-level answer]

## Key Findings

### Finding 1: [Title]
- Evidence: [file:line references]
- Implication: [what this means]

### Finding 2: [Title]
- ...

## Architecture/Flow

[Diagram or mental model]

## Open Questions

[What remains unclear or needs follow-up]

## Related Files

- path/to/file1.ts
- path/to/file2.ts
```

### 4. Provide Actionable Next Steps

After research, recommend:
- What should be done next?
- What risks or considerations exist?
- What additional information would help?

---

## Example Output Structure

When researching "How does authentication work?":

1. **Summary**: "Auth uses Directus JWT tokens stored in cookies, with a global middleware checking routes..."
2. **Key files**: `composables/useAuth.ts`, `middleware/auth.global.ts`
3. **Flow diagram**: Login → Token → Middleware → Protected Route
4. **Gaps**: "Token refresh mechanism unclear"

---

## Principles

- **Specificity over generality**: Always cite file:line
- **Evidence over assertion**: Show, don't tell
- **Depth over breadth**: Better to fully understand 3 files than skim 10
- **Mental models**: Help the user build accurate intuition
