"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const games = [
  { suit: "♠", name: "Blackjack", kicker: "Beat the dealer", includes: "Blackjack table, card shoe, cards, chips and quick-start guide.", tone: "black" },
  { suit: "♦", name: "Poker", kicker: "Play your hand", includes: "Poker table, dealer button, cards, chips and game-format guide.", tone: "red" },
  { suit: "●", name: "Roulette", kicker: "Place your bets", includes: "Roulette table, wheel, ball, rake, chips and betting guide.", tone: "gold" },
];

const packages = [
  { id: "single", name: "Single", price: "£95", label: "For smaller gatherings", description: "One ready-to-use game table with its accessories, chips and a clear printed guide.", includes: ["Choose any one game", "500 chips included", "Accessories + printed guide"] },
  { id: "night", name: "Night", price: "£160", label: "The crowd-pleaser", description: "Two different game tables with enough chips and equipment for a medium-sized event.", includes: ["Choose any two games", "1,000 chips included", "Printed hosting guides"] },
  { id: "full", name: "Full House", price: "£200", label: "The full experience", description: "All three available tables and their equipment for larger parties, weddings and corporate events.", includes: ["Blackjack, poker + roulette", "1,000 chips included", "Full printed guides"] },
];

const faqs = [
  ["Do you provide a croupier?", "No. IOCUS is deliberately self-service. We provide ready-to-use tables, all the equipment and straightforward hosting guides so you or a guest can run each game with confidence."],
  ["Do we play for real money?", "No. The chips are for entertainment only and have no cash value. You can create your own prize format, but no real-money gambling takes place."],
  ["What comes with each table?", "Every table comes with its own chips and accessories. Blackjack and poker include cards; roulette includes the wheel, ball and rake. Clear printed instructions are included too."],
  ["How many tables and chips will I need?", "That depends on your party size and the type of event. Tell us your estimated guest count and we’ll help you choose the right package and chip quantity."],
  ["Can I hire more chips?", "Yes. Additional chips can be hired in batches of 500 for £25 per batch."],
  ["How do collection and delivery work?", "Collection is available by arrangement in East Devon. Delivery and collection within the East Devon area can also be quoted based on your venue, access and timings."],
  ["Is there a deposit?", "Yes. A £250 refundable deposit is required for every hire. Our aim is to return it in full once the equipment is returned and checked; normal wear and tear will not affect it."],
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
        <Link className="brand" href="#home" aria-label="Iocus Casino home"><span className="chip-mark">I</span><span>IOCUS CASINO</span></Link>
        <nav aria-label="Main navigation"><Link href="#how">How it works</Link><Link href="#packages">Games & packages</Link><Link href="#guides">Hosting guides</Link><Link href="#faqs">FAQs</Link><Link className="nav-cta" href="#enquire">Enquire <span>↗</span></Link></nav>
      </header>

      <section className="hero" id="home">
        <div className="felt-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> DIY casino table hire in East Devon</p>
          <h1>Host the casino night <em>yourself.</em></h1>
          <p className="hero-intro">Three classic table games. All the equipment. Simple guides that show you exactly what to do. No croupiers, no complicated setup—just a brilliant night ready to play.</p>
          <div className="hero-actions"><Link className="primary-btn" href="#packages">Choose your package <span>↗</span></Link><Link className="text-link" href="#how">See how it works <span>↓</span></Link></div>
          <div className="trust-row"><span>✓ Tables & accessories included</span><span>✓ Printed hosting guides</span><span>✓ £200 for all three tables</span></div>
        </div>
        <div className="table-stack" aria-label="Available games">
          <article className="game-ticket ticket-one"><span>♠</span><strong>BLACKJACK</strong><b>READY TO PLAY</b></article>
          <article className="game-ticket ticket-two"><span>♦</span><strong>POKER</strong><b>READY TO PLAY</b></article>
          <article className="game-ticket ticket-three"><span>●</span><strong>ROULETTE</strong><b>READY TO PLAY</b></article>
        </div>
        <div className="self-hosted-stamp">100%<br /><strong>SELF-HOSTED</strong></div>
      </section>

      <section className="ticker" aria-label="What is included"><span>TABLES</span><b>◆</b><span>CHIPS</span><b>◆</b><span>CARDS & ACCESSORIES</span><b>◆</b><span>HOSTING GUIDES</span><b>◆</b><span>NO CROUPIER NEEDED</span></section>

      <section className="how section" id="how">
        <div className="section-heading"><div><p className="eyebrow dark"><span /> How it works</p><h2>A complete casino night.<br /><em>You’re the host.</em></h2></div><p>We supply the physical setup and the know-how. You supply the people, the venue and the energy.</p></div>
        <div className="steps-grid">
          <article><span className="step-icon">♣</span><h3>Pick your tables</h3><p>Your party size helps determine how many tables and chips you’ll need. Choose one, two or all three games.</p></article>
          <article><span className="step-icon">▣</span><h3>Collect or arrange delivery</h3><p>Collect in East Devon by arrangement, or ask for a delivery quote for your venue.</p></article>
          <article><span className="step-icon">☰</span><h3>Learn in minutes</h3><p>Use the clear printed setup and game guides to get every table running.</p></article>
          <article><span className="step-icon">★</span><h3>Host your night</h3><p>Set out the chips, choose your hosts and play. No professional croupier is required.</p></article>
        </div>
      </section>

      <section className="games section-dark" id="games">
        <div className="section-heading light"><div><p className="eyebrow"><span /> Three tables. Endless competition.</p><h2>The games everyone<br /><em>wants to play.</em></h2></div><p>Every game arrives as its own ready-to-use table kit, with the right chips, cards or accessories and a clear guide.</p></div>
        <div className="games-grid">{games.map((game) => <article className={`game-card ${game.tone}`} key={game.name}><div className="game-card-top"><span>{game.suit}</span><small>IOCUS TABLE GAME</small></div><p>{game.kicker}</p><h3>{game.name}</h3><div className="game-includes"><b>IN YOUR KIT</b><span>{game.includes}</span></div></article>)}</div>
      </section>

      <section className="packages section" id="packages">
        <div className="section-heading"><div><p className="eyebrow dark"><span /> Packages & prices</p><h2>Choose your<br /><em>starting hand.</em></h2></div><p>Clear prices for the equipment hire. A refundable £250 security deposit applies, and delivery is quoted separately.</p></div>
        <div className="package-grid">{packages.map((item) => <article className={`package-card ${item.id === "night" ? "featured" : ""}`} key={item.id}>{item.id === "night" && <span className="popular">EXPECTED FAVOURITE</span>}<div className="package-top"><span>{item.label}</span></div><h3>{item.name}<br />Package</h3><strong className="package-price">{item.price}</strong><p>{item.description}</p><ul>{item.includes.map((line) => <li key={line}>✓ {line}</li>)}</ul><Link href="#enquire">Enquire about this package <span>↗</span></Link></article>)}</div>
        <div className="price-note"><span>＋</span><div><strong>Need more chips?</strong><p>Additional chips can be hired in batches of 500 for £25. Your party size will help determine the number of tables and chips you need.</p></div></div>
      </section>

      <section className="guides section-dark" id="guides">
        <div className="guide-copy"><p className="eyebrow"><span /> Hosting guides</p><h2>Never dealt a hand?<br /><em>No problem.</em></h2><p>Iocus Casino is designed for first-time hosts. Every hire includes clear printed guidance you can read before the event and keep beside each table while you play.</p><Link className="primary-btn" href="#enquire">Ask about a package <span>↗</span></Link></div>
        <div className="guide-list"><article><div><h3>Quick-start setup</h3><p>Simple steps for setting up the table, accessories and chips before guests arrive.</p></div></article><article><div><h3>Printed game rules</h3><p>Easy-to-follow rules and the order of play for blackjack, poker and roulette.</p></div></article><article><div><h3>Host tips</h3><p>Practical guidance for explaining each game and keeping the evening moving.</p></div></article></div>
      </section>

      <section className="logistics section" id="delivery">
        <div className="section-heading"><div><p className="eyebrow dark"><span /> Collection & delivery</p><h2>Get the tables<br /><em>your way.</em></h2></div></div>
        <div className="logistics-grid"><article><h3>Collect in East Devon</h3><p>Collect and return your package at arranged times. We’ll confirm the collection point and loading details with your booking.</p><b>Included by arrangement</b></article><article><h3>Delivery across East Devon</h3><p>We can quote for delivery and collection based on your postcode, access, package size and event timings.</p><b>Quoted for your event</b></article><article><h3>Coming from further away?</h3><p>Please still get in touch. Longer-distance delivery or a convenient meeting point may be possible for an additional charge, subject to availability.</p><b>Ask us what’s possible</b></article></div>
      </section>

      <section className="faqs section" id="faqs"><div className="faq-title"><p className="eyebrow dark"><span /> Frequently asked</p><h2>Good to<br /><em>know.</em></h2></div><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{question}</span><b>＋</b></summary><p>{answer}</p></details>)}</div></section>

      <section className="enquiry section" id="enquire">
        <div className="enquiry-intro"><p className="eyebrow dark"><span /> Plan your DIY casino night</p><h2>Tell us what’s<br /><em>on the cards.</em></h2><p>Choose a package, games and collection option. We’ll confirm availability and send a tailored quote. No payment or commitment at this stage.</p><div className="deposit-callout"><span>£250</span><p><strong>Refundable security deposit</strong><br />Taken with confirmed bookings and returned after the equipment is checked back in.</p></div></div>
        <form className="enquiry-form" onSubmit={submitEnquiry}>
          <div className="form-head"><span>ENQUIRY DETAILS</span><small>Usually takes 2 minutes</small></div>
          <fieldset><legend>Which package are you considering?</legend><div className="package-options">{packages.map((item) => <label className="radio-card" key={item.id}><input type="radio" name="packageName" value={`${item.name} Package`} required /><span><b>{item.name} Package</b><small>{item.price}</small></span></label>)}</div></fieldset>
          <fieldset><legend>Which tables interest you?</legend><div className="game-options">{games.map((game) => <button type="button" className={selectedGames.includes(game.name) ? "selected" : ""} onClick={() => toggleGame(game.name)} key={game.name}><span>{selectedGames.includes(game.name) ? "✓" : "+"}</span>{game.name}</button>)}</div></fieldset>
          <div className="form-row"><label>Event type<select name="eventType" required defaultValue=""><option value="" disabled>Select one</option><option>House party</option><option>Wedding</option><option>Corporate event</option><option>Charity event</option><option>Other</option></select></label><label>Event date<input type="date" name="eventDate" required /></label></div>
          <label>Venue or postcode<input type="text" name="venue" placeholder="e.g. Exmouth, EX8" required /></label>
          <div className="guest-control"><span><strong>Estimated guests</strong><small>A rough number is absolutely fine</small></span><div><button type="button" onClick={() => setGuestCount(Math.max(10, guestCount - 10))} aria-label="Reduce guest count">−</button><output>{guestCount}</output><button type="button" onClick={() => setGuestCount(guestCount + 10)} aria-label="Increase guest count">+</button></div></div>
          <fieldset><legend>How would you like to receive the tables?</legend><div className="option-grid"><label className="radio-card"><input type="radio" name="fulfilment" value="Collection" required /><span>Collection</span></label><label className="radio-card"><input type="radio" name="fulfilment" value="Delivery quote" required /><span>Quote for delivery</span></label></div></fieldset>
          <label>Anything else we should know?<textarea name="notes" rows={3} placeholder="Timings, access, extra tables or questions…" /></label>
          <div className="form-row"><label>Your name<input type="text" name="name" autoComplete="name" required /></label><label>Phone number<input type="tel" name="phone" autoComplete="tel" required /></label></div>
          <label>Email address<input type="email" name="email" autoComplete="email" required /></label>
          <aside className="hire-information" id="hire-information"><h3>Important hire information</h3><p>A £250 refundable deposit is required for every hire. Our aim is to return the full deposit when the hired tables are returned. While the tables are in your care, please look after them as though they were your own.</p><p>We understand that normal wear and tear happens and this will not affect your deposit. Damage caused by carelessness will need to be made right through repair or replacement. If damage occurs, please contact us as soon as possible so we can advise on the best way to resolve it.</p></aside>
          <label className="consent"><input type="checkbox" required /><span>I have read and understand the important hire information, including the £250 refundable deposit, and agree to be contacted about this enquiry.</span></label>
          <button className="submit-btn" type="submit" disabled={status === "sending" || selectedGames.length === 0}>{status === "sending" ? "Sending…" : "Request my quote"}<span>↗</span></button>
          <p className="form-status" aria-live="polite">{status === "success" && "Thanks — your enquiry is in. We’ll be in touch with availability and a quote."}{status === "error" && "Something went wrong. Please try again."}{status === "idle" && "No payment yet — we’ll confirm availability and pricing first."}</p>
        </form>
      </section>

      <footer><div className="brand"><span className="chip-mark">I</span><span>IOCUS CASINO</span></div><p>Ready-to-use casino table hire. Hosted by you.</p><div><Link href="#how">How it works</Link><Link href="#packages">Packages</Link><Link href="#guides">Guides</Link><Link href="#faqs">FAQs</Link><Link href="#hire-information">Hire information</Link></div><small>© 2026 Iocus Casino. Entertainment only. No real-money gambling.</small></footer>
    </main>
  );
}
