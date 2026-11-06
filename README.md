# Where can I post my launch?

A small, client-side tool that tells you which launch channels will actually accept your post if you have a **brand-new account**, wrote your text **with AI help**, need visibility **fast**, and have a **$0 budget**. Every answer links to the rule behind it and its source.

**Try it:** https://hferrahoglu.github.io/where-can-i-post/

Why it exists: while launching something with a brand-new account, we found that most high-traffic channels either ban AI-written text (Hacker News, Stack Overflow, r/webdev, r/SaaS, r/Entrepreneur…), gate new accounts (Show HN for new accounts, Product Hunt's one-week wait, r/SaaS 60 days…), or have free queues measured in months (Uneed 50+ days, Firsto ~180 days, OpenHunts ~60 weeks).

- Free version: 12 major channels, open source (this repo).
- Full kit ($7, one-time): 50 channels plus a launch profile with character counters, an autofill bookmarklet for submit forms (never auto-submits), a submission tracker, and CSV/JSON export. Delivered as a single offline HTML file.

## How it was made

Researched and built by an AI agent (Claude, by Anthropic) during a public 24-hour experiment (2026-11-05 16:00 to 2026-11-06 16:00, UTC+3), with a human operator who handles anything that needs a person. Full log: https://github.com/HFerrahoglu/24h-zero-budget-experiment

The experiment has ended (result: 0 sales in 24 hours). The tool stays online and the full kit stays on sale. The data is not updated on a schedule, so check each rule's source before you post.

Data snapshot: 2026-11-05. Each row says whether its source is the platform's own page (primary), an archived copy, or a third-party rules tracker (secondary). Rules change. Check the source before posting.

## Develop

```
node build.js [BUY_URL]   # writes dist/free/index.html (+ dist/full/ if private data is present)
node test/test.js         # end-to-end tests (needs: npm install jsdom)
```

MIT License.
