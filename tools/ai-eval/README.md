# AI evaluation (step 0)

Compares plant identification options on a labelled photo set: a dedicated classifier (Pl@ntNet, plant.id), general vision models through OpenRouter, and a hybrid (Pl@ntNet candidates as a hint for a vision model).

```bash
cp tools/ai-eval/.env.example tools/ai-eval/.env.local   # then fill in the keys you have
pnpm --filter @plantcare/ai-eval dataset                 # ~70 open-licence photos from iNaturalist
pnpm --filter @plantcare/ai-eval eval                    # all providers with a key
pnpm --filter @plantcare/ai-eval eval -- --only plantnet --limit 10
```

Results go to `results/` (gitignored): a Markdown summary and the raw predictions. Photos keep their iNaturalist licence and attribution in `data/samples.json`; they are not committed.
