# Iocus Casino website

Iocus Casino is a DIY casino table-hire service for parties, weddings, corporate events and charity nights in East Devon. Customers hire ready-to-use blackjack, poker and roulette tables, then host the games themselves using the supplied equipment and printed guidance—no professional croupiers required.

## Live website

[View the current IOCUS website](https://iocus-events.samdavies338.chatgpt.site)

## The offer

Every table comes with its own chips, relevant cards or accessories, and clear instructions. Customers can choose from:

- **Single Package — £95** — one complete game table, 500 chips and a printed guide.
- **Night Package — £160** — two different game tables, 1,000 chips and printed guides.
- **Full House Package — £200** — blackjack, poker and roulette, 1,000 chips and full printed guides.

Additional chips can be hired in batches of 500 for £25. Party size determines the recommended number of tables and chips. A £250 refundable security deposit applies to every hire. Collection is available by arrangement in East Devon, while delivery and collection in the East Devon area are quoted for each event.

## Website features

- Responsive launch page covering the three games and hire packages.
- Printed hosting-guide information.
- East Devon collection and quoted delivery options.
- Frequently asked questions and key hire terms.
- Enquiry form with package, table, event and fulfilment choices.
- Persistent enquiry storage using Cloudflare D1.
- Private production deployment through OpenAI Sites.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

## Validation and database changes

```bash
npm run build
npm run db:generate
```

Database definitions live in `db/schema.ts`, with generated migrations stored in `drizzle/`.

## Important business rules

- Iocus Casino supplies equipment and guidance, not croupiers or event staff.
- Available games are blackjack, poker and roulette only.
- Chips have no cash value and the equipment is not for real-money gambling.
- Final pricing, cancellation terms, access requirements and return arrangements are confirmed in the customer’s quote and hire agreement.
