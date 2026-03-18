---
name: fix-bug
description: Investigate and fix bugs autonomously. Use when a bug is reported or tests are failing.
context: fork
agent: general-purpose
allowed-tools: Read, Grep, Glob, Bash, Edit
---

# Bug Fixing Skill

## Purpose

Autonomously investigate and resolve bugs without requiring step-by-step guidance from the user.

## Instructions

### 1. Gather Context

Collect information about the bug:
- Error messages or stack traces
- Steps to reproduce
- Expected vs actual behavior
- When did it start? (check git history)
- What changed recently?

If information is missing:
- Check test failures for clues
- Search logs for errors
- Look at recent commits for related changes

### 2. Form Hypotheses

Based on symptoms, generate hypotheses:
- "This looks like a null reference because..."
- "The race condition happens when..."
- "The type mismatch suggests..."

Prioritize by likelihood.

### 3. Investigate Systematically

For each hypothesis:
1. Find relevant code
2. Read the implementation
3. Trace the execution path
4. Confirm or rule out

Use `Read`, `Grep`, and `Glob` to navigate.

### 4. Identify Root Cause

Don't stop at symptoms. Ask "why" iteratively:
- "Why is this null?" → "Because the API didn't return data"
- "Why didn't the API return data?" → "Because the query has a bug"
- **Root cause**: Query logic error, not "null reference"

### 5. Implement Fix

Fix the root cause, not symptoms:
- Minimal change to resolve the issue
- No defensive hacks—fix the actual problem
- Preserve existing behavior where unchanged

### 6. Verify Fix

Before marking done:
- Reproduce the original bug
- Confirm fix resolves it
- Check no regressions in related code
- Add test if none exists

---

## Anti-Patterns to Avoid

**Don't:**
- Add random null checks without understanding why null
- Wrap errors without fixing the cause
- Blame "the framework" without investigation
- Make broad changes out of uncertainty

**Do:**
- Find the specific broken assumption
- Fix the smallest code path that solves the problem
- Understand why the bug occurred

---

## Output Format

```markdown
## Bug Fix Report

### Problem
[What was broken]

### Root Cause
[Why it was broken - specific code and logic]

### Investigation
1. [Step 1 - what I checked]
2. [Step 2 - what I found]
3. [Step 3 - hypothesis confirmed]

### Fix
[What changed, with file:line references]

### Verification
- [ ] Original bug no longer reproduces
- [ ] Related code unaffected
- [ ] Tests pass

### Prevention
[How to avoid similar bugs - update lessons.md if pattern emerges]
```

---

## Principles

1. **Root cause over symptoms**: Fix why, not what
2. **Minimal change**: Touch only what's broken
3. **Preserve correctness**: Don't fix one bug by creating another
4. **Learn and adapt**: Update lessons.md when patterns emerge
