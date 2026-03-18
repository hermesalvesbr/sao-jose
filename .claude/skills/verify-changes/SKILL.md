---
name: verify-changes
description: Verify that changes work correctly before marking work as complete. Use after any code modification to ensure correctness.
context: fork
agent: general-purpose
allowed-tools: Bash, Read, Grep
---

# Verification Skill

## Purpose

Systematically validate that code changes:
- Work as intended
- Don't break existing functionality
- Meet quality standards

## Instructions

### 1. Define Success Criteria

Before testing, clarify:
- What should the code do?
- How can we observe correct behavior?
- What edge cases matter?

### 2. Run Existing Tests

If tests exist:
```bash
npm run test
# or project-specific test command
```

If tests fail:
- Analyze failure reason
- Fix code OR update test (if test is wrong)
- Re-run until green

### 3. Add Tests for New Behavior

If no tests exist for changed code:
- Write a minimal test covering the change
- Run test to verify it passes
- Commit test with the code

### 4. Manual Verification

For UI or integration changes:
- Identify the user-facing behavior
- Describe steps to verify manually
- Run those steps or ask user to confirm

### 5. Check Related Code

Verify no collateral damage:
- Files that import the changed code
- Tests in related modules
- Integration points

### 6. Compare Before/After

For significant changes:
- What was the behavior before?
- What is the behavior after?
- Is the difference intentional?

---

## Verification Checklist

Before marking complete, confirm:

- [ ] Tests pass (existing + new)
- [ ] Logs inspected (no unexpected errors/warnings)
- [ ] Edge cases considered
- [ ] Related code unaffected
- [ ] Would a staff engineer approve this?

---

## Output Format

```markdown
## Verification Results

### Changes Verified
[Description of what was changed]

### Tests Run
- `test command`: PASS/FAIL
- New test `test-name.ts`: PASS/FAIL

### Manual Checks
- [ ] Behavior X confirmed
- [ ] Edge case Y handled

### Related Code
- file1.ts: No impact
- file2.ts: Updated accordingly

### Conclusion
[PASS] Changes are correct and safe to merge.
[FAIL] Issues found: [list]
```

---

## Principles

1. **Trust but verify**: Don't assume code works—prove it
2. **Test the interface, not the implementation**: Verify behavior, not internals
3. **Fail fast**: Catch problems before the user does
4. **Evidence over confidence**: Show test output, don't just claim "it works"
