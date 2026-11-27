import { formatLongEventDate } from "./enquiry-format";
import { escapeHtml } from "./enquiry-mail";

type ConfirmationDetails = {
  name: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  packageName: string;
  games: string[];
  venue: string;
  fulfilment: string;
};

const website = "https://iocuscasino.com";
const list = new Intl.ListFormat("en-GB");
const sectionHeading = "margin:0 0 12px;color:#735719;font-size:14px;line-height:1.4;letter-spacing:1.5px";
const bodyParagraph = "margin:0 0 16px";

function detailsTable(rows: [string, string][]) {
  return `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;overflow-wrap:anywhere">
    ${rows.map(([label, value]) => `<tr>
      <th scope="row" align="left" valign="top" style="width:42%;padding:8px 10px 8px 0;border-bottom:1px solid #ded6c9;color:#35283b;font-size:14px;font-weight:700;line-height:1.4">${escapeHtml(label)}</th>
      <td valign="top" style="padding:8px 0;border-bottom:1px solid #ded6c9;font-size:14px;line-height:1.4">${escapeHtml(value)}</td>
    </tr>`).join("")}
  </table>`;
}

export function enquiryConfirmation(data: ConfirmationDetails, price: string) {
  const firstName = data.name.split(/\s+/, 1)[0];
  const date = formatLongEventDate(data.eventDate);
  const soloGame = data.games.length === 1 ? data.games[0] : undefined;
  const event = soloGame ? `${soloGame} Night` : "casino night";
  const tables = list.format(data.games);
  const tableDescription = soloGame ? `one ${soloGame} table` : `${data.games.length} tables (${tables})`;
  const collection = data.fulfilment === "Collection";
  const details: [string, string][] = [
    ["Event", data.eventType.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())],
    ["Date", date],
    ["Guests", data.guestCount > 0 ? `Approximately ${data.guestCount}` : "To be confirmed"],
    ["Package", data.packageName],
    ["Tables", tables],
    ["Venue", data.venue],
    ["Delivery/Collection", collection ? "COLLECTION" : "DELIVERY REQUESTED"],
  ];
  const quote: [string, string][] = [
    ["Package", price],
    ["Delivery & collection", collection ? "£0.00" : "To be quoted"],
    ["Refundable security deposit", "£250"],
  ];
  const welcome = `Thank you for getting in touch with IOCUS Casino. We’d be delighted to help make your ${event} on ${date} a great night.`;
  const packageSummary = `Your ${data.packageName} is ${price} and includes ${tableDescription}.`;
  const kit = "IOCUS Casino is designed to let you host the casino night yourself. We supply ready-to-use tables, chips, equipment and straightforward printed hosting guides.";
  const play = "Just a brilliant night ready to play. You choose the hosts, set out the chips and let the games begin.";
  const pending = "We’ll confirm availability and your final quote by email. No payment is due at this stage.";
  const questions = "If you have any questions, just reply to this email and we’ll be happy to help.";
  const textRows = (rows: [string, string][]) => rows.map(([label, value]) => `${label}: ${value}`).join("\n");

  const text = [
    "IOCUS CASINO\nHOST THE CASINO NIGHT YOURSELF.\n♠ ♦ ♣ ♥",
    `Hi ${firstName},\n\n${welcome}`,
    `YOUR DETAILS\n${textRows(details)}`,
    `YOUR CASINO NIGHT\n${packageSummary} ${kit}`,
    `NO CROUPIER. NO COMPLICATED SETUP.\n${play}`,
    `YOUR QUOTE\n${textRows(quote)}\n\n${pending}`,
    `VISIT IOCUSCASINO.COM\n${website}`,
    questions,
    "Kind regards,\n\nTim\nIOCUS CASINO\nReady-to-use casino table hire. Hosted by you.",
    `♠ ♦ ♣\n${website}\nEntertainment only. No real-money gambling.`,
  ].join("\n\n");

  const html = `<!doctype html>
<html lang="en-GB">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4eee4;color:#1b1025;font:16px/1.55 Arial,sans-serif">
  <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="background:#f4eee4">
    <tr><td align="center" style="padding:20px 10px">
      <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="max-width:600px;background:#fffdf8">
        <tr><td align="center" style="padding:30px 18px;background:#1b1025;color:#fffdf8;border-bottom:3px solid #d4aa42">
          <h1 style="margin:0 0 8px;font-size:30px;line-height:1.15;letter-spacing:3px">IOCUS CASINO</h1>
          <p style="margin:0;font-size:12px;font-weight:700;font-style:italic;letter-spacing:1.4px">HOST THE CASINO NIGHT YOURSELF.</p>
          <p aria-hidden="true" style="margin:12px 0 0;color:#f1d383;font-size:21px;letter-spacing:6px">♠ ♦ ♣ ♥</p>
        </td></tr>
        <tr><td style="padding:26px 24px">
          <p style="${bodyParagraph}"><strong>Hi ${escapeHtml(firstName)},</strong></p>
          <p style="${bodyParagraph}">Thank you for getting in touch with <strong>IOCUS Casino</strong>. We’d be delighted to help make your <strong>${escapeHtml(event)} on ${escapeHtml(date)}</strong> a great night.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;background:#f4eee4">
            <tr><td style="padding:16px;border-top:2px solid #d4aa42">
              <h2 style="${sectionHeading}">🎰 YOUR DETAILS</h2>
              ${detailsTable(details)}
            </td></tr>
          </table>
          <h2 style="${sectionHeading}">YOUR CASINO NIGHT</h2>
          <p style="${bodyParagraph}">Your <strong>${escapeHtml(data.packageName)}</strong> is <strong>${escapeHtml(price)}</strong> and includes <strong>${escapeHtml(tableDescription)}</strong>. IOCUS Casino is designed to let <strong>you host the casino night yourself</strong>. We supply ready-to-use tables, chips, equipment and straightforward printed hosting guides.</p>
          <h2 style="${sectionHeading}">NO CROUPIER. NO COMPLICATED SETUP.</h2>
          <p style="${bodyParagraph}">${play}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;background:#f4eee4">
            <tr><td style="padding:16px;border-top:2px solid #d4aa42">
              <h2 style="${sectionHeading}">YOUR QUOTE</h2>
              ${detailsTable(quote)}
              <p style="margin:12px 0 0;font-size:14px;color:#514458">${pending}</p>
            </td></tr>
          </table>
          <p style="margin:24px 0;text-align:center"><a href="${website}" style="display:inline-block;background:#1b1025;color:#fffdf8;padding:12px 18px;border-radius:22px;font-size:13px;font-weight:700;letter-spacing:.8px;text-decoration:none">VISIT IOCUSCASINO.COM</a></p>
          <p style="${bodyParagraph}">${questions}</p>
          <p style="${bodyParagraph}">Kind regards,</p>
          <p style="margin:0"><strong>Tim<br>IOCUS CASINO</strong><br><em>Ready-to-use casino table hire. Hosted by you.</em></p>
        </td></tr>
        <tr><td align="center" style="padding:18px;background:#1b1025;color:#fffdf8;font-size:13px">
          <span aria-hidden="true" style="color:#f1d383;font-size:17px;letter-spacing:4px">♠ ♦ ♣</span><br>
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
