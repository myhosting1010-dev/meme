"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChartNoAxesColumnIncreasing, Check, ChevronDown, ChevronRight, ChevronUp, Clock, Flame, TrendingDown, X } from "lucide-react";
import styles from "./performance-modal.module.css";

const risks = ["Conservative", "Balanced", "Risky", "Ultra Risky"];

export function PerformanceModal({ className = "nav-item", onOpen }) {
  const dialog = useRef(null);
  const riskMenu = useRef(null);
  const [risk, setRisk] = useState("Ultra Risky");
  const [distributionOpen, setDistributionOpen] = useState(true);
  const [showCalls, setShowCalls] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    if (portalTarget) dialog.current.showModal();
  }, [portalTarget]);

  function open() {
    onOpen?.();
    if (portalTarget) dialog.current.showModal();
    else setPortalTarget(document.body);
  }

  return <>
    <button type="button" className={className} onClick={open}><ChartNoAxesColumnIncreasing size={19} aria-hidden="true" /><span>Performance</span></button>
    {portalTarget && createPortal(<dialog ref={dialog} className={styles.modal} aria-label="Performance" onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close(); }} onClose={() => { setShowCalls(false); riskMenu.current?.removeAttribute("open"); }}>
     
     <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">

     </div>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <details ref={riskMenu} className={styles.riskMenu}>
              <summary>{risk}<ChevronDown size={26} aria-hidden="true" /></summary>
              <div className={styles.options} role="group" aria-label="Risk level">{risks.map((option) => <button type="button" key={option} aria-pressed={risk === option} onClick={() => { setRisk(option); riskMenu.current.open = false; }}>{option}{risk === option && <Check size={20} aria-hidden="true" />}</button>)}</div>
            </details>
            <p className={styles.returns}><Flame size={21} aria-hidden="true" />Strong returns</p>
          </div>
          <div className={styles.actions}>
            <div className={styles.topActions}><label className={styles.period}><span className="sr-only">Performance period</span><select defaultValue="Monthly"><option>Monthly</option></select><ChevronDown size={17} aria-hidden="true" /></label><button type="button" className={styles.close} aria-label="Close performance" onClick={() => dialog.current.close()}><X size={25} /></button></div>
            <button type="button" className={styles.callsLink} aria-expanded={showCalls} onClick={() => setShowCalls(!showCalls)}>See all calls<ChevronRight size={19} aria-hidden="true" /></button>
          </div>
        </header>
        <div className={styles.body}>
          <div className={styles.metrics}>{[["100%", "2x+"], ["100%", "1.5x+"], ["100%", "1.2x+"], ["2.1x", "Avg"], ["2.1x", "Med"], ["1", "Calls"]].map(([value, label], index) => <div key={label}><strong className={index < 3 ? styles.positive : undefined}>{value}</strong><span>{label}{label === "Calls" && <><br />0.1/day</>}</span></div>)}</div>
          <div className={styles.stat}><span><Clock size={20} aria-hidden="true" />Average Time to Peak</span><strong>4h 30m</strong></div>
          <div className={styles.stat}><span><TrendingDown size={20} aria-hidden="true" />Average Drawdown</span><strong className={styles.negative}>-39.9%</strong></div>
          <div className={styles.panels}>
            <section className={styles.panel}><h2>Monthly Top Performers</h2><div className={styles.performer}><span>1</span><i aria-hidden="true">▲</i><div><strong>skew</strong><small>Skew</small></div><b>2.1x</b></div></section>
            <section className={styles.panel}><h2><button type="button" className={styles.distributionToggle} aria-expanded={distributionOpen} onClick={() => setDistributionOpen(!distributionOpen)}>Monthly Distribution{distributionOpen ? <ChevronUp size={21} /> : <ChevronDown size={21} />}</button></h2>{distributionOpen && <div className={styles.distribution}><span>2-3x</span><div /><strong>1</strong></div>}</section>
          </div>
          {showCalls && <section className={styles.callList} aria-label="All monthly calls"><h2>Monthly calls · {risk}</h2><div><span>skew <small>Skew</small></span><strong>2.1x</strong></div></section>}
         
        </div>
      </div>
    </dialog>, portalTarget)}
  </>;
}
