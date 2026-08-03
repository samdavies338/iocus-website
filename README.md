# IOCUS website

IOCUS is a DIY casino table-hire service for parties, weddings, corporate events and charity nights. Customers hire ready-to-use blackjack, poker and roulette tables, then host the games themselves using the supplied equipment and guidance—no professional croupiers required.

## Live website

[View the current IOCUS website](https://iocus-events.samdavies338.chatgpt.site)

## The offer

Every table comes with its own chips, relevant cards or accessories, and clear instructions. Customers can choose from:

- **Single Table Package** — one complete game table for smaller parties or groups.
- **Casino Night Package** — two different game tables for a medium-sized event.
- **Full House Package** — blackjack, poker and roulette, starting from £200.

Individual tables can also be added to a package, subject to availability. A £250 refundable security deposit applies to confirmed hires. Collection is available by arrangement, while delivery and collection are quoted for each event.

## Website features

- Responsive launch page covering the three games and hire packages.
- Printed, digital and video hosting-guide information.
- Collection and delivery options.
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

- IOCUS supplies equipment and guidance, not croupiers or event staff.
- Available games are blackjack, poker and roulette only.
- Chips have no cash value and the equipment is not for real-money gambling.
- Final pricing, cancellation terms, access requirements and return arrangements are confirmed in the customer’s quote and hire agreement.
