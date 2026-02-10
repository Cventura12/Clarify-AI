# Test Inputs

Use these inputs to validate the interpret + plan pipeline.

1. I applied to 4 jobs on Indeed this week and I need to follow up on a scholarship I submitted to the Jack Kent Cooke Foundation 12 days ago -- also my AP Lit assignment is due Friday on AP Classroom
2. I need to deal with my financial aid situation
3. I need to register for the AP Computer Science exam before the late deadline
4. I emailed Professor Williams about a recommendation letter 3 days ago and haven't heard back. I also applied to a software engineer role at Stripe on Indeed last Monday.
5. Complete the QuestBridge scholarship application. Deadline is in 18 days. I have my transcript but need a recommendation letter and my personal essay.

Run with live API calls:

```bash
npm run test:inputs
```

Run in dry mode (no API calls):

```bash
npm run test:inputs:dry
```

Outputs are written to `docs/test-results.json`.