"use client";
import { useEffect } from "react";
import { startEngine } from "../lib/engine";

export default function FartFinder() {
  useEffect(() => {
    const stop = startEngine();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return stop;
  }, []);

  return (
    <div className="app">
      <div className="tabs" role="tablist">
        <button className="tab" id="tab-hazmat" role="tab" aria-selected="true">☣ Hazmat</button>
        <button className="tab" id="tab-nurse" role="tab" aria-selected="false">✚ Nurse</button>
      </div>

      <div className="unit"><span id="unitName">Dept. of Atmospheric Integrity</span><b id="hzClock">UNIT 2</b></div>

      <div className="screen" id="screen">
        <div className="flash" />
        <div className="status" id="status">Air clean</div>
        <div className="sub" id="sub">&gt; standing by for reports_</div>
        <div className="readrow">
          <div className="read"><span id="l1">PPM</span><strong id="r1">0004</strong></div>
          <div className="read"><span id="l2">Level</span><strong id="r2">0</strong></div>
          <div className="read"><span id="l3">Permits</span><strong id="r3">NONE</strong></div>
        </div>
        <div className="stage" id="stage">
          <svg className="gauge" id="gauge" viewBox="0 0 300 170" aria-label="Gas gauge">
            <path d="M30 150 A120 120 0 0 1 270 150" fill="none" stroke="var(--line)" strokeWidth="16" />
            <path d="M30 150 A120 120 0 0 1 110 37" fill="none" stroke="#3a7d3a" strokeWidth="16" />
            <path d="M110 37 A120 120 0 0 1 210 40" fill="none" stroke="var(--hazard)" strokeWidth="16" />
            <path d="M210 40 A120 120 0 0 1 270 150" fill="none" stroke="var(--alarm)" strokeWidth="16" />
            <text className="gtxt" x="30" y="166" textAnchor="middle">CLEAN</text>
            <text className="gtxt" x="150" y="20" textAnchor="middle">TOOT</text>
            <text className="gtxt" x="270" y="166" textAnchor="middle">CODE BROWN</text>
            <g id="needle" transform="rotate(-80 150 150)">
              <line x1="150" y1="150" x2="150" y2="44" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
            </g>
            <circle cx="150" cy="150" r="10" fill="var(--ink)" />
          </svg>
          <canvas id="ecg" hidden />
        </div>
      </div>

      <div className="controls" id="controls" />
      <div className="hint" id="hint">Hold SCAN and point at a suspect</div>
    </div>
  );
}
