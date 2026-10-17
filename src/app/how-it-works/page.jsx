import { MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { site } from "@/constants/site";
import styles from "./page.module.css";
import { ResultsSection } from "@/features/how-it-works/results-section";
import { FeaturesSection } from "@/features/how-it-works/features-section";
import { FaqSection } from "@/features/how-it-works/faq-section";
import { PageFooter } from "@/features/how-it-works/page-footer";

export const metadata = { title: `How It Works | ${site.name}` };

const samePage = "#how-it-works";
const calls = [
  { name: "Penguin", value: "8,441x", color: "#292d57" },
  { name: "Dogwork", value: "2,362x", color: "#432443" },
  { name: "Punch", value: "2,219x", color: "#453e28" },
  { name: "Wojak", value: "1,339x", color: "#282e3e" },
];

export default function HowItWorks() {
  return (
    <div className={styles.page}>
      <a href="#how-it-works" className="skip-link">Skip to contents</a>
      <header className={styles.header}>
        <a href={samePage} className={styles.brand}><img className={styles.brandLogo} src="/trenchfun-logo.png" alt={site.name} /></a>
        <nav className={styles.navigation} aria-label="How it works navigation">
          <a href={samePage} className={styles.trending}>Trending</a>
          <a href={samePage} className={styles.active}>Results</a>
          <a href={samePage}>Features</a>
          <a href={samePage}>FAQs</a>
          <a href={samePage} aria-label="Community"><X size={27} aria-hidden="true" /></a>
        </nav>
        <div className={styles.actions}><a href={samePage} className={styles.performance}>Performance</a><Link href="/" className={styles.trade}>Trade Now</Link></div>
      </header>
      <main id="how-it-works" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="how-it-works-title">
          <h1 id="how-it-works-title">Be First To The<br />Next Big Play</h1>
          <p>The most advanced algorithmic trading assistant for detecting momentum,<br className={styles.desktopBreak} /> avoiding rugs, and securing alpha in real-time.</p>
          <a href={samePage} className={styles.earlyAccess}>Get Early Access</a>
        </section>
        <section className={styles.preview} aria-label="Static interface preview from the supplied screenshot, not live trading results">
          <div className={styles.messageWindow}>
            <div className={styles.windowBar} aria-hidden="true"><i /><i /><i /></div>
            <div className={styles.messageBody}>
              <div className={styles.senderAvatar} aria-hidden="true">▲</div>
              <div className={styles.messageContent}>
                <div className={styles.sender}><strong>{site.name}</strong><span>Just now</span></div>
                <div className={styles.callCard}><div className={styles.callHeading}><span>New call detected</span><span className={styles.live}><i />Live</span></div><h2>$BUTTCOIN</h2></div>
              </div>
            </div>
            <div className={styles.messagePlaceholder} aria-hidden="true"><span /><div><i /><p /></div></div>
          </div>
          <div className={styles.topCalls}>
            <h2>Top calls today</h2>
            <div className={styles.callGrid}>{calls.map((call) => <div key={call.name} className={styles.smallCall}><span className={styles.tokenSwatch} style={{ background: call.color }} aria-hidden="true" /><div><h3>{call.name}</h3><p>{call.value}</p></div></div>)}</div>
            <div className={styles.accuracy}>
              <h3>Historical accuracy</h3><strong>57%</strong><p>hit 2x+</p>
              <div className={styles.accuracySplit}><div><strong>71%</strong><span>Hit 1.5x+</span></div><div><strong>94%</strong><span>Hit 1.2x+</span></div></div>
            </div>
          </div>
        </section>
        <ResultsSection />
        <FeaturesSection />
        <FaqSection />
      </main>
      <PageFooter />
      <a href={samePage} className={styles.chat} aria-label="Community, stays on this page"><MessageSquare size={28} aria-hidden="true" /></a>
    </div>
  );
}
