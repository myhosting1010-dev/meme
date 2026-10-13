import { Globe, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { site } from "@/constants/site";
import styles from "@/app/how-it-works/page.module.css";

const features = [
  { title: "Beat Everyone to Gems", description: "Catch organic tokens as soon as they show momentum, before they hit public scanners.", icon: Zap },
  { title: "Avoid Rugs Automatically", description: "Our contract scanner automatically filters rugs with adaptive scam and honeypot detection.", icon: ShieldCheck },
  { title: "Performance Tracking", description: "Win rates, medians, and multipliers tracked daily with full un-edited transparency.", icon: TrendingUp },
];

export function FeaturesSection() {
  return (
    <>
      <section className={styles.featuresSection} aria-labelledby="features-heading">
        <div className={styles.featuresHeading}>
          <h2 id="features-heading">How {site.name} Gives You the Edge</h2>
          <p>Advanced filtering, rug filtration, and full transparency. Built to help you win and simplify<br className={styles.desktopBreak} /> the game.</p>
        </div>
        <div className={styles.featureGrid}>
          {features.map(({ title, description, icon: Icon }) => (
            <article className={styles.featureCard} key={title}>
              <div className={styles.featureIcon} aria-hidden="true"><Icon size={34} strokeWidth={2.2} /></div>
              <h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.platformSection} aria-labelledby="platform-heading">
        <div className={styles.platformPanel}>
          <h2 id="platform-heading">Cut the noise, anywhere</h2>
          <p className={styles.platformTagline}>One Platform. Every device.</p>
          <div className={styles.platformIcon} aria-hidden="true"><Globe size={29} strokeWidth={2.2} /></div>
          <h3>Web App</h3><p className={styles.platformCaption}>Full dashboard</p>
        </div>
      </section>
    </>
  );
}
