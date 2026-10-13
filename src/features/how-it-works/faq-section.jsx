"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { site } from "@/constants/site";
import styles from "@/app/how-it-works/page.module.css";

const questions = [
  { id: "introduction", question: `What is ${site.name}?`, answer: "Gemflow is an advanced algorithmic trading assistant designed to help you identify and act on momentum in the crypto market early. It aggregates data, filters out common rug pulls, and provides real-time alerts directly to you." },
  { id: "discovery", question: `How does ${site.name} find winning tokens?`, answer: "We use proprietary algorithms to analyze volume spikes, wallet behaviors, contract safety, and social sentiment across multiple chains in real-time, executing in milliseconds." },
  { id: "chains", question: `What chains does ${site.name} support?`, answer: "Currently, we fully support Solana, Ethereum, and Base. We are constantly evaluating and adding support for other high-volume networks based on liquidity trends and community demand." },
  { id: "subscription", question: "What’s included in the subscription?", answer: "A subscription gives you full access to the web dashboard, instant web alerts before they hit public trending, auto-buy configurations, and access to our private alpha community." },
];

export function FaqSection() {
  const [openQuestion, setOpenQuestion] = useState("subscription");

  return (
    <section className={styles.faqSection} aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently Asked Questions</h2>
      <div className={styles.faqList}>
        {questions.map(({ id, question, answer }) => {
          const isOpen = openQuestion === id;
          return (
            <div key={id} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ""}`}>
              <button id={`${id}-question`} type="button" className={styles.faqQuestion} aria-expanded={isOpen} aria-controls={`${id}-answer`} onClick={() => setOpenQuestion((current) => current === id ? null : id)}>
                <span>{question}</span>{isOpen ? <X size={23} aria-hidden="true" /> : <Plus size={25} aria-hidden="true" />}
              </button>
              <div id={`${id}-answer`} hidden={!isOpen} className={styles.faqAnswer} role="region" aria-labelledby={`${id}-question`}><p>{answer}</p></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
