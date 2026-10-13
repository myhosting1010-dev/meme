import { X } from "lucide-react";
import { site } from "@/constants/site";
import styles from "@/app/how-it-works/page.module.css";

export function PageFooter() {
  return (
    <footer className={styles.pageFooter}>
      <div className={styles.footerContent}>
        <p>© 2026 {site.name}. All rights reserved.</p>
        <nav aria-label="Footer navigation"><a href="#how-it-works">Terms</a><a href="#how-it-works">Privacy</a></nav>
        <a href="#how-it-works" className={styles.footerSocial} aria-label="Community, stays on this page"><X size={25} aria-hidden="true" /></a>
      </div>
    </footer>
  );
}
