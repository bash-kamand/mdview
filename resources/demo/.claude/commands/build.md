# /build

Build the project and report errors.

## Usage

```
/build            # standard build
/build --watch    # watch mode, rebuild on changes
/build --clean    # clear cache before building
```

## On Failure

1. Read the full error output — don't guess
2. Check for type errors first (most common)
3. Check import resolution (missing deps, wrong paths)
4. Check for breaking changes in dependencies

Do not use `--no-verify` or skip type checking to make the build pass.
