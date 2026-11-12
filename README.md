# zoemachine.com → zoelegal.ai

The ZOE AI website moved to **https://zoelegal.ai** on 2026-11-12. Its code lives in the `Zoemachine/zoelegal.ai` repository.

This repository only keeps zoemachine.com (and www.zoemachine.com) forwarding visitors there:

- `index.html`, `book-demo.html`, `nda.html` forward to the matching page on zoelegal.ai, keeping any `?query` and `#section`.
- `404.html` forwards every other path to the same path on zoelegal.ai.
- `CNAME` keeps the custom domain zoemachine.com on this repository; removing it would take zoemachine.com offline.

Do not push website changes here; they go to `Zoemachine/zoelegal.ai`.
