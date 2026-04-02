## Baseline test suite conventions

This fork’s tests are the **behavioral spec** for the eventual Rust rewrite.

### Test layers

- **Unit (`test/unit/`)**: pure or mostly-pure helpers. Prefer direct input/output assertions.
- **Contract (`test/contract/`)**: module-level behavioral invariants (registries, policy gates, caching).
- **Golden (`test/golden/`)**: snapshot-ish assertions around **observable CLI fast paths** (stdout / early dispatch), keeping everything **in-process** and hermetic via mocks.

### Writing new tests

- Prefer **hermetic** tests: no network, no real user secrets, no OS keychain.
- Use targeted mocks (module-level `vi.doMock`) instead of broad global patching.
- If the leaked tree references missing internal files, add the **smallest possible stub** under `src/` needed for resolution.
- Keep assertions focused on **observable behavior** (outputs, ordering, inclusion/exclusion, cache invalidation).

### Running

```bash
npm test
```

