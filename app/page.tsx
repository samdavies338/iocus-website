"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const games = [
  { suit: "♠", name: "Blackjack", kicker: "Beat the dealer", includes: "Blackjack table, card shoe, cards, chips and quick-start guide.", tone: "black" },
  { suit: "♦", name: "Poker", kicker: "Play your hand", includes: "Poker table, dealer button, cards, chips and game-format guide.", tone: "red" },
  { suit: "●", name: "Roulette", kicker: "Place your bets", includes: "Roulette table, wheel, ball, rake, chips and betting guide.", tone: "gold" },
];

const packages = [
  { id: "single", number: "01", name: "Single Table", price: "From £95", label: "Small but mighty", description: "One game table with all the accessories, chips and clear instructions you need. A great fit for house parties and smaller groups.", includes: ["Choose any one game", "Complete table kit", "Printed + digital guide"] },
  { id: "casino", number: "02", name: "Casino Night", price: "From £150", label: "The crowd-pleaser", description: "Two different game tables with enough chips and equipment to keep a medium-sized event moving all evening.", includes: ["Choose any two games", "Two complete table kits", "Video hosting guides"] },
  { id: "full", number: "03", name: "Full House", price: "From £200", label: "The full experience", description: "All three available tables and their equipment for larger parties, weddings and corporate events.", includes: ["Blackjack, poker + roulette", "All equipment included", "Best value package"] },
];

const faqs = [
  ["Do you provide a croupier?", "No. IOCUS is deliberately self-service. We provide ready-to-use tables, all the equipment and straightforward hosting guides so you or a guest can run each game with confidence."],
  ["Do we play for real money?", "No. The chips are for entertainment only and have no cash value. You can create your own prize format, but no real-money gambling takes place."],
  ["What comes with each table?", "Every table comes with its own chips and accessories. Blackjack and poker include cards; roulette includes the wheel, ball and rake. Every game also includes printed and digital instructions."],
  ["Can I add another table?", "Yes. Individual tables can be added to a package, subject to availability. Tell us what you have in mind and we’ll include it in the quote."],
  ["How do collection and delivery work?", "Collection is available by arrangement. Delivery and collection can also be quoted based on your venue, access and timings."],
  ["Is there a deposit?", "Yes. A £250 refundable security deposit is taken for each hire and returned after the equipment has been checked back in safely."],
];

export default function Home() {
  const [selectedGames, setSelectedGames] = useState<string[]>(["Blackjack", "Poker", "Roulette"]);
  const [guestCount, setGuestCount] = useState(40);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const toggleGame = (game: string) => setSelectedGames((current) => current.includes(game) ? current.filter((item) => item !== game) : [...current, game]);

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(form.entries()), games: selectedGames, guestCount }) });
      if (!response.ok) throw new Error("Unable to send");
      setStatus("success");
      event.currentTarget.reset();
      setSelectedGames(["Blackjack", "Poker", "Roulette"]);
      setGuestCount(40);
    } catch { setStatus("error"); }
  }

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="#home" aria-label="IOCUS home"><span className="chip-mark">I</span><span>IOCUS</span></Link>
        <nav aria-label="Main navigation"><Link href="#how">How it works</Link><Link href="#packages">Games & packages</Link><Link href="#guides">Hosting guides</Link><Link href="#faqs">FAQs</Link><Link className="nav-cta" href="#enquire">Enquire <span>↗</span></Link></nav>
      </header>

      <section className="hero" id="home">
        <div className="felt-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> DIY casino table hire</p>
          <h1>Host the casino night <em>yourself.</em></h1>
          <p className="hero-intro">Three classic table games. All the equipment. Simple guides that show you exactly what to do. No croupiers, no complicated setup—just a brilliant night ready to play.</p>
          <div className="hero-actions"><Link className="primary-btn" href="#packages">Choose your package <span>↗</span></Link><Link className="text-link" href="#how">See how it works <span>↓</span></Link></div>
          <div className="trust-row"><span>✓ Tables & accessories included</span><span>✓ Printed, digital & video guides</span><span>✓ From £200 for all three tables</span></div>
        </div>
        <div className="table-stack" aria-label="Available games">
          <article className="game-ticket ticket-one"><span>♠</span><small>01</small><strong>BLACKJACK</strong><b>READY TO PLAY</b></article>
          <article className="game-ticket ticket-two"><span>♦</span><small>02</small><strong>POKER</strong><b>READY TO PLAY</b></article>
          <article className="game-ticket ticket-three"><span>●</span><small>03</small><strong>ROULETTE</strong><b>READY TO PLAY</b></article>
        </div>
        <div className="self-hosted-stamp">100%<br /><strong>SELF-HOSTED</strong></div>
      </section>

      <section className="ticker" aria-label="What is included"><span>TABLES</span><b>◆</b><span>CHIPS</span><b>◆</b><span>CARDS & ACCESSORIES</span><b>◆</b><span>HOSTING GUIDES</span><b>◆</b><span>NO CROUPIER NEEDED</span></section>

      <section className="how section" id="how">
        <div className="section-heading"><div><p className="eyebrow dark"><span /> How it works</p><h2>A complete casino night.<br /><em>You’re the host.</em></h2></div><p>We supply the physical setup and the know-how. You supply the people, the venue and the energy.</p></div>
        <div className="steps-grid">
          <article><b>01</b><span className="step-icon">♣</span><h3>Pick your tables</h3><p>Choose one, two or all three games. Add another table if your guest list needs it.</p></article>
          <article><b>02</b><span className="step-icon">▣</span><h3>Collect or arrange delivery</h3><p>Collect your package by arrangement, or ask for a delivery quote based on your venue and timings.</p></article>
          <article><b>03</b><span className="step-icon">▶</span><h3>Learn in minutes</h3><p>Use the printed instructions, digital reference and video guides to get every table running.</p></article>
          <article><b>04</b><span className="step-icon">★</span><h3>Host your night</h3><p>Set out the chips, choose your hosts and play. No professional croupier is required.</p></article>
        </div>
      </section>

      <section className="games section-dark" id="games">
        <div className="section-heading light"><div><p className="eyebrow"><span /> Three tables. Endless competition.</p><h2>The games everyone<br /><em>wants to play.</em></h2></div><p>Every game arrives as its own ready-to-use table kit, with the right chips, cards or accessories and a clear guide.</p></div>
        <div className="games-grid">{games.map((game) => <article className={`game-card ${game.tone}`} key={game.name}><div className="game-card-top"><span>{game.suit}</span><small>IOCUS TABLE GAME</small></div><p>{game.kicker}</p><h3>{game.name}</h3><div className="game-includes"><b>IN YOUR KIT</b><span>{game.includes}</span></div></article>)}</div>
      </section>

      <section className="packages section" id="packages">
        <div className="section-heading"><div><p className="eyebrow dark"><span /> Packages & prices</p><h2>Choose your<br /><em>starting hand.</em></h2></div><p>Simple starting prices for the equipment hire. A refundable £250 security deposit applies, and delivery is quoted separately.</p></div>
        <div className="package-grid">{packages.map((item) => <article className={`package-card ${item.id === "casino" ? "featured" : ""}`} key={item.id}>{item.id === "casino" && <span className="popular">EXPECTED FAVOURITE</span>}<div className="package-top"><b>{item.number}</b><span>{item.label}</span></div><h3>{item.name}<br />Package</h3><strong className="package-price">{item.price}</strong><p>{item.description}</p><ul>{item.includes.map((line) => <li key={line}>✓ {line}</li>)}</ul><Link href="#enquire">Enquire about this package <span>↗</span></Link></article>)}</div>
        <div className="price-note"><span>＋</span><div><strong>Need another table?</strong><p>Individual blackjack, poker or roulette tables can be added to a package, subject to availability. We’ll price additions in your quote.</p></div></div>
      </section>

      <section className="guides section-dark" id="guides">
        <div className="guide-copy"><p className="eyebrow"><span /> Hosting guides</p><h2>Never dealt a hand?<br /><em>No problem.</em></h2><p>IOCUS is designed for first-time hosts. Every hire comes with three layers of guidance so you can learn the basics before the event and keep a quick reference beside each table.</p><Link className="primary-btn" href="#enquire">Ask about a package <span>↗</span></Link></div>
        <div className="guide-list"><article><span>01</span><div><h3>Printed table guides</h3><p>Quick rules, setup diagrams and the order of play—kept beside each table during the event.</p></div></article><article><span>02</span><div><h3>Digital instructions</h3><p>Mobile-friendly guides you can share with anyone helping to run blackjack, poker or roulette.</p></div></article><article><span>03</span><div><h3>Video walkthroughs</h3><p>Short videos covering setup, hosting, common questions and how to keep each game moving.</p></div></article></div>
      </section>

      <section className="logistics section" id="delivery">
        <div className="section-heading"><div><p className="eyebrow dark"><span /> Collection & delivery</p><h2>Get the tables<br /><em>your way.</em></h2></div></div>
        <div className="logistics-grid"><article><span>01</span><h3>Collection</h3><p>Collect and return your package at arranged times. We’ll confirm the collection point and loading details with your booking.</p><b>Included by arrangement</b></article><article><span>02</span><h3>Delivery & collection</h3><p>We can quote for delivery and collection based on your postcode, access, package size and event timings.</p><b>Quoted for your event</b></article></div>
      </section>

      <section className="faqs section" id="faqs"><div className="faq-title"><p className="eyebrow dark"><span /> Frequently asked</p><h2>Good to<br /><em>know.</em></h2></div><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{question}</span><b>＋</b></summary><p>{answer}</p></details>)}</div></section>

      <section className="terms section-dark" id="terms"><div><p className="eyebrow"><span /> Hire terms</p><h2>Clear rules.<br /><em>No surprises.</em></h2></div><div className="terms-grid"><article><b>£250</b><h3>Refundable deposit</h3><p>Returned after all hired equipment is checked back in safely and in the agreed condition.</p></article><article><b>01</b><h3>Care of equipment</h3><p>The hirer is responsible for loss or damage beyond reasonable wear while the package is in their care.</p></article><article><b>18+</b><h3>Entertainment only</h3><p>IOCUS equipment is for social entertainment. Chips have no cash value and must not be used for real-money gambling.</p></article><article><b>✓</b><h3>Booking agreement</h3><p>Dates, payment, cancellation, access and return arrangements are confirmed in the quote and final hire agreement.</p></article></div><p className="terms-note">Full terms and conditions are supplied before a booking is confirmed.</p></section>

      <section className="enquiry section" id="enquire">
        <div className="enquiry-intro"><p className="eyebrow dark"><span /> Plan your DIY casino night</p><h2>Tell us what’s<br /><em>on the cards.</em></h2><p>Choose a package, games and collection option. We’ll confirm availability and send a tailored quote. No payment or commitment at this stage.</p><div className="deposit-callout"><span>£250</span><p><strong>Refundable security deposit</strong><br />Taken with confirmed bookings and returned after the equipment is checked back in.</p></div></div>
        <form className="enquiry-form" onSubmit={submitEnquiry}>
          <div className="form-head"><span>ENQUIRY DETAILS</span><small>Usually takes 2 minutes</small></div>
          <fieldset><legend>Which package are you considering?</legend><div className="package-options">{packages.map((item) => <label className="radio-card" key={item.id}><input type="radio" name="packageName" value={item.name} required /><span><b>{item.name}</b><small>{item.price}</small></span></label>)}</div></fieldset>
          <fieldset><legend>Which tables interest you?</legend><div className="game-options">{games.map((game) => <button type="button" className={selectedGames.includes(game.name) ? "selected" : ""} onClick={() => toggleGame(game.name)} key={game.name}><span>{selectedGames.includes(game.name) ? "✓" : "+"}</span>{game.name}</button>)}</div></fieldset>
          <div className="form-row"><label>Event type<select name="eventType" required defaultValue=""><option value="" disabled>Select one</option><option>House party</option><option>Wedding</option><option>Corporate event</option><option>Charity event</option><option>Other</option></select></label><label>Event date<input type="date" name="eventDate" required /></label></div>
          <label>Venue or postcode<input type="text" name="venue" placeholder="e.g. Guildford, GU1" required /></label>
          <div className="guest-control"><span><strong>Estimated guests</strong><small>A rough number is absolutely fine</small></span><div><button type="button" onClick={() => setGuestCount(Math.max(10, guestCount - 10))} aria-label="Reduce guest count">−</button><output>{guestCount}</output><button type="button" onClick={() => setGuestCount(guestCount + 10)} aria-label="Increase guest count">+</button></div></div>
          <fieldset><legend>How would you like to receive the tables?</legend><div className="option-grid"><label className="radio-card"><input type="radio" name="fulfilment" value="Collection" required /><span>Collection</span></label><label className="radio-card"><input type="radio" name="fulfilment" value="Delivery quote" required /><span>Quote for delivery</span></label></div></fieldset>
          <label>Anything else we should know?<textarea name="notes" rows={3} placeholder="Timings, access, extra tables or questions…" /></label>
          <div className="form-row"><label>Your name<input type="text" name="name" autoComplete="name" required /></label><label>Phone number<input type="tel" name="phone" autoComplete="tel" required /></label></div>
          <label>Email address<input type="email" name="email" autoComplete="email" required /></label>
          <label className="consent"><input type="checkbox" required /><span>I understand that a £250 refundable deposit applies and agree to be contacted about this enquiry.</span></label>
          <button className="submit-btn" type="submit" disabled={status === "sending" || selectedGames.length === 0}>{status === "sending" ? "Sending…" : "Request my quote"}<span>↗</span></button>
          <p className="form-status" aria-live="polite">{status === "success" && "Thanks — your enquiry is in. We’ll be in touch with availability and a quote."}{status === "error" && "Something went wrong. Please try again."}{status === "idle" && "No payment yet — we’ll confirm availability and pricing first."}</p>
        </form>
      </section>

      <footer><div className="brand"><span className="chip-mark">I</span><span>IOCUS</span></div><p>Ready-to-use casino table hire. Hosted by you.</p><div><Link href="#how">How it works</Link><Link href="#packages">Packages</Link><Link href="#guides">Guides</Link><Link href="#faqs">FAQs</Link><Link href="#terms">Terms</Link></div><small>© 2026 IOCUS. Entertainment only. No real-money gambling.</small></footer>
    </main>
  );
}
