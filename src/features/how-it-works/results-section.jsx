import { ArrowUp, CircleDollarSign, UserRound } from "lucide-react";
import styles from "@/app/how-it-works/page.module.css";

const testimonials = [
  { id: "wif", author: "AlphaSeeker", avatar: "👨🏾‍💼", quote: "Hit the WIF call instantly when the bot flagged abnormal volume. By far the cleanest UI and fastest scraping I've used on Solana. Rug protection saved me twice." },
  { id: "clawd", author: "Cryptoprenuia", avatar: "👨🏻‍💼", quote: "I recently took a fat L on 8 ETH. I used $150 for Trenchfun and traded with the remaining $190—now I'm sitting around 5.3 SOL. Genuinely grateful for this tool." },
  { id: "buttcoin", author: "Legz", avatar: "👨🏼‍⚕️", quote: "Trenchfun is the most legitimate trading tool I've ever seen for meme coins. It gives safe entry while allowing for 2x-100x multiples. 10/10 dev." },
];

function ResultCard({ type }) {
  if (type === "wif") return (
    <div className={`${styles.resultCard} ${styles.wifCard}`}>
      <div className={styles.resultMeta}><span>Solana network</span><time>2 days ago</time></div>
      <div className={styles.wifTitle}><h3>$WIF</h3><p>Dogwifhat</p></div>
      <div className={styles.wifGain}><i aria-hidden="true" />+412.5%</div>
      <div className={styles.entryExit}><div><span>Entry</span><strong>$0.021</strong></div><div><span>Exit</span><strong>$0.107</strong></div></div>
    </div>
  );
  if (type === "clawd") return (
    <div className={`${styles.resultCard} ${styles.clawdCard}`}>
      <div className={styles.mevx}>▲ MEVX</div><h3>CLAWD</h3><div className={styles.clawdGain}>+8,092.29%</div>
      <p className={styles.currentPnl}>Current PNL <strong>+134.72 SOL</strong></p><p className={styles.pnlDollars}>+$17.13K USD</p>
      <div className={styles.solBoxes}><div><span>Initial</span><strong>1.66 SOL</strong><small>~$211.68 USD</small></div><div><span>Worth</span><strong>136.38 SOL</strong><small>~$17.34K USD</small></div></div>
    </div>
  );
  return (
    <div className={`${styles.resultCard} ${styles.buttCard}`}>
      <span className={styles.pnlTag}>P&amp;L</span><h3>$BUTTCOIN</h3>
      <div className={styles.buttGain}><ArrowUp size={24} aria-hidden="true" />+109%</div>
      <div className={styles.profitValues}><span>Ξ +1.28</span><span>+$4,731.67</span></div>
      <div className={styles.bloom}><strong>● Bloom</strong><span>9Y5L...</span></div>
    </div>
  );
}

export function ResultsSection() {
  return (
    <section className={styles.results} aria-labelledby="results-heading">
      <div className={styles.resultsHeading}><h2 id="results-heading">Proven Results</h2><div className={styles.resultsBadges}><span><UserRound size={20} aria-hidden="true" />Used by 1,000+ traders</span><span className={styles.profitBadge}><CircleDollarSign size={20} aria-hidden="true" />$200K+ profit generated</span></div></div>
      <div className={styles.testimonialViewport} role="region" aria-label="Static result and testimonial examples from the reference screenshots" tabIndex={0}>
        <div className={styles.testimonialGrid}>{testimonials.map((testimonial) => <article className={styles.testimonial} key={testimonial.id}><ResultCard type={testimonial.id} /><figure><blockquote>{testimonial.quote}</blockquote><figcaption><span className={styles.authorAvatar} aria-hidden="true">{testimonial.avatar}</span><strong>{testimonial.author}</strong></figcaption></figure></article>)}</div>
      </div>
    </section>
  );
}
