# Skills Catalog

## Available Engineering Skills

### Analysis Skills

#### `/deep-research`
- **Purpose**: Research a topic thoroughly using multiple investigation strategies
- **When to use**: Exploring unfamiliar code, investigating bugs, understanding complex systems
- **Execution**: Runs in Explore agent subagent for isolated, thorough research
- **Tools**: Read, Grep, Glob, WebFetch, WebSearch

### Quality Skills

#### `/simplify-code`
- **Purpose**: Review changed code for reuse, quality, and efficiency, then fix issues
- **When to use**: After completing feature work or when code feels complex
- **Execution**: Reviews recent changes, applies simplification patterns
- **Tools**: Read, Edit, Grep, Glob

#### `/verify-changes`
- **Purpose**: Verify that changes work correctly before marking work complete
- **When to use**: After any code modification to ensure correctness
- **Execution**: Runs tests, checks related code, compares before/after
- **Tools**: Bash, Read, Grep

### Delivery Skills

#### `/fix-bug`
- **Purpose**: Investigate and fix bugs autonomously
- **When to use**: When a bug is reported or tests are failing
- **Execution**: Gathers context, forms hypotheses, identifies root cause, implements fix
- **Tools**: Read, Grep, Glob, Bash, Edit

---

## Skill Template

```markdown
---
name: skill-name
description: What this skill does and when to use it
context: fork (optional)
agent: Explore|Plan|general-purpose (optional)
allowed-tools: Read, Grep, Glob (optional)
disable-model-invocation: true (optional)
---

## Purpose

[Why this skill exists]

## Instructions

1. [Step-by-step instructions]
2. [Clear, actionable guidance]

## Additional Resources

- [Links to supporting files]
```

---

## Skill Categories

### Analysis Skills
- Code exploration
- Architecture review
- Dependency mapping

### Quality Skills
- Testing
- Code review
- Simplification

### Delivery Skills
- Feature implementation
- Bug fixing
- Refactoring

---

## Creating New Skills

1. Identify repeated reasoning patterns
2. Define clear trigger conditions
3. Write actionable instructions
4. Test skill effectiveness
5. Refine based on results
