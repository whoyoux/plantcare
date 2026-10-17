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
