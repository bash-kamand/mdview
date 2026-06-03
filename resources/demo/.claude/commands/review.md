# /review

Review the current diff for correctness bugs, simplifications, and cleanups.

## Usage

```
/review           # medium effort — high-confidence findings only
/review high      # broader coverage, may include uncertain findings
/review ultra     # deep multi-agent cloud review
```

## What It Checks

- **Correctness** — logic bugs, off-by-one errors, null handling
- **Simplification** — duplicate code, premature abstractions
- **Efficiency** — unnecessary re-renders, N+1 queries
- **Conventions** — consistent with the rest of the codebase

## Notes

Does not check test coverage — use `/test` for that.
Does not fix anything automatically — use `--fix` flag to apply changes.
