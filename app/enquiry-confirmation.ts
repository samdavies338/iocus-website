import { formatLongEventDate, readGames } from "./enquiry-format";
import { escapeHtml } from "./enquiry-mail";
import { securityDepositPence } from "./package-terms";

type EventDetails = {
  name: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  packageName: string | null;
  games: string[] | string;
  venue: string;
  fulfilment: string | null;
};

type DetailRow = [label: string, value: string];
type Section = {
  title: string;
  rows?: DetailRow[];
  text?: string;
  items?: string[];
};

const website = "https://iocuscasino.com";
const list = new Intl.ListFormat("en-GB");
const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const questions = "If you have any questions, just reply to this email and we’ll be happy to help.";
const sectionHeading = "margin:0 0 12px;color:#735719;font-size:14px;line-height:1.4;letter-spacing:1.5px";
const bodyParagraph = "margin:0 0 16px";

function paragraph(value: string) {
  return `<p style="${bodyParagraph}">${escapeHtml(value).replaceAll("\n", "<br>")}</p>`;
}

function detailsTable(rows: DetailRow[]) {
  return `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;overflow-wrap:anywhere">
    ${rows.map(([label, value]) => `<tr>
      <th scope="row" align="left" valign="top" style="width:42%;padding:8px 10px 8px 0;border-bottom:1px solid #ded6c9;color:#35283b;font-size:14px;font-weight:700;line-height:1.4">${escapeHtml(label)}</th>
      <td valign="top" style="padding:8px 0;border-bottom:1px solid #ded6c9;font-size:14px;line-height:1.4">${escapeHtml(value).replaceAll("\n", "<br>")}</td>
    </tr>`).join("")}
  </table>`;
}

function sectionHtml(section: Section) {
  const title = `<h2 style="${sectionHeading}">${escapeHtml(section.title)}</h2>`;
  const copy = section.text ? paragraph(section.text) : "";
  if (section.rows) {
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;background:#f4eee4">
      <tr><td style="padding:16px;border-top:2px solid #d4aa42">
        ${title}${detailsTable(section.rows)}
        ${section.text ? `<p style="margin:12px 0 0;font-size:14px;color:#514458">${escapeHtml(section.text)}</p>` : ""}
      </td></tr>
    </table>`;
  }
  const items = section.items ? `<ul style="margin:0 0 20px;padding-left:22px">${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
  return title + copy + items;
}

function renderEmail(data: EventDetails, intro: string, sections: Section[], title?: string, note?: string) {
  const firstName = data.name.trim().split(/\s+/, 1)[0];
  const greeting = firstName ? `Hi ${firstName},` : "Hello,";
  const text = [
    "IOCUS CASINO\nHOST THE CASINO NIGHT YOURSELF.",
    title,
    greeting,
    intro,
    ...sections.map((section) => [
      section.title,
      section.rows?.map(([label, value]) => `${label}: ${value}`).join("\n"),
      section.items?.map((item) => `- ${item}`).join("\n"),
      section.text,
    ].filter(Boolean).join("\n")),
    note,
    `VISIT IOCUSCASINO.COM\n${website}`,
    questions,
    "Kind regards,\n\nTim\nIOCUS CASINO\nReady-to-use casino table hire. Hosted by you.",
    "Entertainment only. No real-money gambling.",
  ].filter(Boolean).join("\n\n");

  const html = `<!doctype html>
<html lang="en-GB">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4eee4;color:#1b1025;font:16px/1.55 Arial,sans-serif">
  <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="background:#f4eee4">
    <tr><td align="center" style="padding:20px 10px">
      <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="max-width:600px;background:#fffdf8">
        <tr><td align="center" style="padding:28px 18px;background:#1b1025;color:#fffdf8;border-bottom:3px solid #d4aa42">
          <div style="display:inline-block;border:2px dashed #d4aa42;border-radius:50%;width:32px;height:32px;line-height:32px;color:#f1d383;font-weight:700;margin-bottom:12px" aria-hidden="true">I</div>
          <h1 style="margin:0 0 8px;font-size:30px;line-height:1.15;letter-spacing:3px">IOCUS CASINO</h1>
          <p style="margin:0;font-size:12px;font-weight:700;font-style:italic;letter-spacing:1.4px">HOST THE CASINO NIGHT YOURSELF.</p>
        </td></tr>
        <tr><td style="padding:26px 24px">
          ${title ? `<h2 style="margin:0 0 14px;font-size:26px;line-height:1.2">${escapeHtml(title)}</h2>` : ""}
          <p style="${bodyParagraph}"><strong>${escapeHtml(greeting)}</strong></p>
          ${paragraph(intro)}
          ${sections.map(sectionHtml).join("")}
          ${note ? `<p style="background:#f4eee4;border-left:3px solid #d4aa42;padding:14px 16px">${escapeHtml(note).replaceAll("\n", "<br>")}</p>` : ""}
          <p style="margin:24px 0;text-align:center"><a href="${website}" style="display:inline-block;background:#1b1025;color:#fffdf8;padding:12px 18px;border-radius:22px;font-size:13px;font-weight:700;letter-spacing:.8px;text-decoration:none">VISIT IOCUSCASINO.COM</a></p>
          ${paragraph(questions)}
          ${paragraph("Kind regards,")}
          <p style="margin:0"><strong>Tim<br>IOCUS CASINO</strong><br><em>Ready-to-use casino table hire. Hosted by you.</em></p>
        </td></tr>
        <tr><td align="center" style="padding:18px;background:#1b1025;color:#fffdf8;font-size:13px">
          <a href="${website}" style="color:#f1d383">iocuscasino.com</a><br>
          <em>Entertainment only. No real-money gambling.</em>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { text, html };
}

function eventInfo(data: EventDetails) {
  const games = Array.isArray(data.games) ? data.games : readGames(data.games);
  const date = formatLongEventDate(data.eventDate);
  const guests = data.guestCount > 0 ? `Approximately ${data.guestCount}` : "To be confirmed";
  const tables = list.format(games) || "To be confirmed";
  const eventType = data.eventType.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  const fulfilment = data.fulfilment === "Collection" ? "Self-collection"
    : data.fulfilment === "Delivery quote" ? "Delivery requested" : "To be confirmed";
  return { games, date, guests, tables, eventType, fulfilment };
}

function money(value: number | null) {
  return value === null ? "To be confirmed" : currency.format(value / 100);
}

export function enquiryConfirmation(data: EventDetails, price: string) {
  const { games, date, guests, tables, eventType, fulfilment } = eventInfo(data);
  const soloGame = games.length === 1 ? games[0] : undefined;
  const event = soloGame ? `${soloGame} Night` : "casino night";
  const tableDescription = soloGame ? `one ${soloGame} table` : `${games.length} tables (${tables})`;
  return renderEmail(data, `Thank you for getting in touch with IOCUS Casino. We’d be delighted to help make your ${event} on ${date} a great night.`, [
    { title: "YOUR DETAILS", rows: [
      ["Event", eventType], ["Date", date], ["Guests", guests], ["Package", data.packageName ?? "To be confirmed"],
      ["Tables", tables], ["Venue", data.venue], ["Delivery/Collection", fulfilment],
    ] },
    { title: "YOUR CASINO NIGHT", text: `Your ${data.packageName} is ${price} and includes ${tableDescription}. IOCUS Casino is designed to let you host the casino night yourself. We supply ready-to-use tables, chips, equipment and straightforward printed hosting guides.` },
    { title: "NO CROUPIER. NO COMPLICATED SETUP.", text: "Just a brilliant night ready to play. You choose the hosts, set out the chips and let the games begin." },
    { title: "YOUR QUOTE", rows: [
      ["Package", price], ["Delivery & collection", data.fulfilment === "Collection" ? "£0.00" : "To be quoted"],
      ["Refundable security deposit", "£250"],
    ], text: "We’ll confirm availability and your final quote by email. No payment is due at this stage." },
  ]);
}

export function bookingConfirmation(data: EventDetails, packagePrice: number | null, deliveryFee: number | null, note: string) {
  const { date, eventType, guests, tables, fulfilment } = eventInfo(data);
  const total = packagePrice === null || deliveryFee === null ? null : packagePrice + deliveryFee + securityDepositPence;
  return {
    subject: `Iocus Casino booking confirmed for ${date}`,
    ...renderEmail(data, "Thank you for choosing IOCUS Casino. We’re pleased to confirm that your casino night is now booked.", [
      { title: "YOUR DETAILS", rows: [
        ["Event", eventType], ["Date", date], ["Venue", data.venue], ["Guests", guests],
        ["Package", data.packageName ?? "To be confirmed"], ["Tables", tables], ["Delivery/Collection", fulfilment],
      ] },
      { title: "WHAT’S INCLUDED", items: ["Ready-to-use casino tables", "Casino chips and equipment", "Cards and accessories where required", "Printed hosting guides"] },
      { title: "YOUR BOOKING", rows: [
        ["Package", money(packagePrice)], ["Delivery & collection", money(deliveryFee)],
        ["Refundable security deposit", money(securityDepositPence)], ["Total including deposit", money(total)],
      ], text: "We’ll be in touch to confirm payment and handover arrangements." },
      { title: "YOUR NIGHT. YOUR TABLES. YOUR RULES.", text: "Our simple guides show you how to set up and run the games, and guests can take turns being the host." },
    ], "Booking confirmed!", note),
  };
}

export function preEventReminder(data: EventDetails, delivery: string, collection: string) {
  const { date, guests, tables } = eventInfo(data);
  return {
    subject: `Your Iocus Casino event on ${date}`,
    ...renderEmail(data, `We’re getting in touch ahead of your event on ${date} to confirm the arrangements and help you get ready for your IOCUS Casino night.`, [
      { title: "YOUR DETAILS", rows: [
        ["Date", date], ["Venue", data.venue], ["Guests", guests], ["Tables", tables],
        ["Delivery", delivery || (data.fulfilment === "Collection" ? "Self-collection" : "To be arranged")],
        ["Collection", collection || "To be arranged"],
      ] },
      { title: "BEFORE YOUR GUESTS ARRIVE", items: [
        "Make sure there is enough space for the tables.",
        "Have a suitable area ready for the equipment.",
        "Keep the casino equipment together throughout the evening.",
        "Chips are for entertainment only and have no cash value.",
      ] },
      { title: "LET THE GAMES BEGIN!", text: "Your printed guides will take you through setup, rules and running each game. Most importantly, have fun!" },
      { title: "THE GAMES", text: tables },
    ], "Your casino night is nearly here!"),
  };
}
