# Results

## 2026-10-17: 70 photos, 35 species

Everyday iNaturalist photos: potted plants from cultivated observations, garden and wild plants from research-grade ones. Only vision models were run (no Pl@ntNet or plant.id keys yet).

| Provider                          | Species (top 1) | Species (top 3) | Genus   | Median    | p90       | Cost / 1000 photos |
| --------------------------------- | --------------- | --------------- | ------- | --------- | --------- | ------------------ |
| google/gemini-3.8-flash           | 97%             | 99%             | 99%     | 6.6 s     | 10.3 s    | $3.32              |
| **google/gemini-3.8-flash (low)** | **97%**         | **100%**        | **99%** | **4.7 s** | **7.1 s** | **$2.47**          |
| google/gemini-3.5-flash-lite      | 90%             | 99%             | 96%     | 2.0 s     | 2.5 s     | $1.12              |
| openai/gpt-5.6-luna (low)         | 79%             | 89%             | 84%     | 3.9 s     | 5.7 s     | $0.65              |
| anthropic/claude-haiku-5.5        | 84%             | 91%             | 91%     | 4.9 s     | 6.1 s     | $0.47              |
| anthropic/claude-sonnet-5.5       | n/a             |                 |         |           |           | $8.01              |

Claude Sonnet 5.5 ran out of OpenRouter credits halfway (36 of 70 failed), so its numbers are not comparable.

**Choice:** Gemini 3.8 Flash with low reasoning effort. Same accuracy as the default effort, about 30% faster and cheaper. Gemini 3.5 Flash Lite is the fallback if cost or latency matter more than the last 7 points of accuracy.

## 2026-10-17: prompt v2 and look-alike herbs

Prompt v2 (in `packages/shared`) asks the model to describe the visible diagnostic traits and the look-alikes it ruled out (`analysis`, written before the name) and to keep confidence at or below 0.6 when the photo can't separate two species. Added 10 easily confused species (mints, lemon balm, catnip, oregano, thyme, sage, parsley, coriander, white dead-nettle), 3 photos each.

| Set                     | Model                  | Prompt v1 | Prompt v2 |
| ----------------------- | ---------------------- | --------- | --------- |
| Look-alikes (30 photos) | Gemini 3.8 Flash (low) | 83%       | 80%       |
| Everything (100 photos) | Gemini 3.8 Flash (low) | 90%       | 91%       |

Look-alikes, prompt v2, other models: Gemini 4 Argon (low) 87% (10 s, $9.08/1000), Claude Sonnet 5.5 80% ($13.06/1000), Gemini 3.8 Flash default effort 77%, GPT-5.6 Terra (low) 40%.

Prompt v2 doesn't change accuracy measurably, but it lowers confidence where species really are ambiguous (e.g. peppermint: 0.55 instead of 0.85) and gives an explanation. About 7 in 100 answers are still wrong with confidence ≥ 0.8, mostly between species of the same genus. Next lever: a dedicated classifier (Pl@ntNet) as a hint for the model.

## 2026-10-18: toxicity for cats, dogs and people

The prompt now also asks for `toxicity` (safe / mild / toxic / unknown per cats, dogs and people, plus a one-sentence note), with levels defined by the worst likely effect and examples drawn from the ASPCA lists. Gemini 3.8 Flash (low), 100 photos: species accuracy 92% (unchanged within noise), about $0.0004 more per photo ($3.65 per 1000) and about 0.5 s slower.

Checked by hand against the ASPCA lists for all 45 species: no plant the ASPCA lists as toxic came back "safe" for cats or dogs except one of three catnip and parsley photos. Without the level definitions the same species often switched between "mild" and "toxic" across photos (Epipremnum, Philodendron, Spathiphyllum) and lemon balm and catnip came back "safe"; with them 41 of 45 species get the same answer on every photo.
