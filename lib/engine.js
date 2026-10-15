// All the sound, gauge and heart-monitor logic. Runs in the browser only.
export function startEngine() {
  const $ = (id) => document.getElementById(id);
  let mode = "hazmat", ac = null, master = null, raf = 0, wakeLock = null, dead = false;

  /* ---------- AUDIO ---------- */
  function audio() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
      } catch (e) {}
    }
    if (ac && ac.state === "suspended") ac.resume();
    keepAwake();
    return ac;
  }
  async function keepAwake() {
    try { if (!wakeLock && "wakeLock" in navigator) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => (wakeLock = null)); } } catch (e) {}
  }
  function beep(freq = 1400, dur = 0.06, type = "square", vol = 0.25) {
    if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function fart() {
    if (!audio()) return;
    const t = ac.currentTime, dur = 0.7 + Math.random() * 1.1, base = 55 + Math.random() * 45;
    const o = ac.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(base * 1.3, t); o.frequency.exponentialRampToValueAtTime(base * 0.75, t + dur);
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 14 + Math.random() * 16; lg.gain.value = base * 0.45; lfo.connect(lg); lg.connect(o.frequency);
    const n = ac.createBufferSource(), buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = buf;
    const nf = ac.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 180; nf.Q.value = 1.2;
    const ng = ac.createGain(); ng.gain.value = 0.35;
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 520; f.Q.value = 6;
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9, t + 0.03);
    for (let s = 0.1; s < dur - 0.1; s += 0.12) g.gain.linearRampToValueAtTime(0.45 + Math.random() * 0.5, t + s);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f); n.connect(nf); nf.connect(ng); ng.connect(f); f.connect(g); g.connect(master);
    o.start(t); lfo.start(t); n.start(t); o.stop(t + dur); lfo.stop(t + dur); n.stop(t + dur);
  }
  function zap() {
    if (!audio()) return;
    const t = ac.currentTime, n = ac.createBufferSource(), buf = ac.createBuffer(1, ac.sampleRate * 0.45, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = buf; const g = ac.createGain(); g.gain.value = 0.7; n.connect(g); g.connect(master); n.start(t);
    beep(160, 0.35, "sawtooth", 0.4);
  }

  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const screen = $("screen"), status = $("status"), sub = $("sub"), controls = $("controls"), hint = $("hint");

  function bindHold(btn, start, stop) {
    btn.addEventListener("pointerdown", start);
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, stop));
    btn.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") start(e); });
    btn.addEventListener("keyup", stop);
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /* ---------- HAZMAT ---------- */
  const compounds = ["pork dumpling residue", "egg sulfide + hint of Sunkist", "Greek salad, heavy onion", "chopped cheese, 2 days old", "oat milk betrayal", "halal cart white sauce", "Cheez-It concentrate", "protein shake (vanilla)", "unregistered burrito", "dog park runoff?"];
  let lvl = 4, target = 4, scanning = false, lastBeep = 0, hzAlarm = false;
  const hzLabel = (v) => (v < 20 ? ["Air clean", 0] : v < 45 ? ["Level 1 toot", 1] : v < 75 ? ["Level 2 toot", 2] : ["Code brown", 3]);
  function hzTick(now) {
    if (scanning) target = Math.min(100, target + 0.55 + Math.random() * 0.6);
    else target = Math.max(3, target - 0.35);
    lvl += (target - lvl) * 0.08 + (Math.random() - 0.5) * 1.4; lvl = Math.max(0, Math.min(100, lvl));
    $("needle").setAttribute("transform", `rotate(${-80 + lvl * 1.6} 150 150)`);
    const [lab, n] = hzLabel(lvl); status.textContent = lab; $("r2").textContent = n;
    $("r1").textContent = String(Math.round(lvl * lvl * 0.9 + 3)).padStart(4, "0");
    const alarm = lvl >= 75; screen.classList.toggle("alarm", alarm);
    if (alarm && !hzAlarm) sub.textContent = "> detected: " + pick(compounds) + "_";
    hzAlarm = alarm;
    const gap = 1100 - lvl * 10.2;
    if (ac && (scanning || lvl > 20) && now - lastBeep > gap) { lastBeep = now; beep(800 + lvl * 12, 0.05); }
  }
  function hzControls() {
    controls.innerHTML = `
      <button class="btn primary" id="scan">Scan suspect<small>hold to sniff</small></button>
      <button class="btn" id="clear">Clear<small>you're free to go</small></button>
      <button class="btn" id="toot">Toot<small>evidence</small></button>`;
    const s = $("scan");
    const start = (e) => { e.preventDefault(); if (scanning) return; audio(); scanning = true; s.classList.add("active"); sub.textContent = "> sniffing..._"; };
    const stop = () => {
      if (!scanning) return; scanning = false; s.classList.remove("active");
      if (lvl < 75) sub.textContent = lvl >= 45 ? "> trace amounts. suspicious._" : "> reading inconclusive_";
    };
    bindHold(s, start, stop);
    $("clear").onclick = () => { audio(); target = 2; lvl = Math.min(lvl, 30); sub.textContent = "> reading clean. have a nice day, citizen_"; beep(1600, 0.08); setTimeout(() => beep(2100, 0.12), 110); };
    $("toot").onclick = () => { fart(); target = 100; sub.textContent = "> detected: " + pick(compounds) + "_"; };
    $("l1").textContent = "PPM"; $("l2").textContent = "Level"; $("l3").textContent = "Permits"; $("r3").textContent = "NONE";
    hint.textContent = "Hold SCAN and point at a suspect";
  }

  /* ---------- NURSE ---------- */
  const dx = ["acute situationship", "left-on-read syndrome", "chronic ex-texting", "post-breakup bangs (stage 2)", "swiping fatigue", "\"we're just talking\" fever", "unrequited crush, inoperable", "ghosting trauma, mild", "heart of gold, slightly dented", "dating app burnout"];
  const cv = $("ecg"), cx = cv.getContext("2d");
  let bpm = 72, bpmTarget = 72, flat = false, phase = 0, xPos = 0, lastY = null, flatTone = null, scanningH = false, lastT = performance.now(), rWasHigh = false;
  const css = (v) => getComputedStyle(document.body).getPropertyValue(v);
  function sizeCanvas() {
    const r = $("stage").getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.fillStyle = css("--panel"); cx.fillRect(0, 0, r.width, r.height);
    xPos = 0; lastY = null;
  }
  function ecgY(p) {
    if (p < 0.08) return 0;
    if (p < 0.16) return Math.sin(((p - 0.08) / 0.08) * Math.PI) * 0.12;
    if (p < 0.2) return 0;
    if (p < 0.22) return -0.15;
    if (p < 0.25) return 1;
    if (p < 0.28) return -0.3;
    if (p < 0.36) return 0;
    if (p < 0.5) return Math.sin(((p - 0.36) / 0.14) * Math.PI) * 0.22;
    return 0;
  }
  function nurseTick(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (scanningH) bpmTarget = Math.min(185, bpmTarget + 1.2); else if (!flat) bpmTarget += (72 - bpmTarget) * 0.01;
    bpm += (bpmTarget - bpm) * 0.05;
    const r = $("stage").getBoundingClientRect(), w = r.width, h = r.height, mid = h * 0.58, amp = h * 0.42, speed = w / 3.2;
    const steps = Math.max(1, Math.round(speed * dt)), panel = css("--panel"), ecg = css("--ecg");
    for (let i = 0; i < steps; i++) {
      if (!flat) phase += bpm / 60 / speed;
      if (phase >= 1) phase -= 1;
      const v = flat ? 0 : ecgY(phase), y = mid - v * amp;
      if (v > 0.9 && !rWasHigh) { rWasHigh = true; beep(980, 0.07, "sine", 0.3); }
      if (v < 0.5) rWasHigh = false;
      cx.fillStyle = panel; cx.fillRect(xPos + 1, 0, 14, h);
      cx.strokeStyle = ecg; cx.lineWidth = 2.5; cx.lineCap = "round";
      cx.beginPath(); cx.moveTo(xPos, lastY ?? y); cx.lineTo(xPos + 1, y); cx.stroke();
      lastY = y; xPos += 1; if (xPos > w) { xPos = 0; lastY = null; }
    }
    $("r1").textContent = flat ? "000" : String(Math.round(bpm)).padStart(3, "0");
    $("r2").textContent = flat ? "--" : (bpm > 140 ? 78 : bpm > 100 ? 88 : 97) + "%";
  }
  function setFlat(on) {
    flat = on; screen.classList.toggle("alarm", on);
    if (flatTone) { try { flatTone.stop(); } catch (e) {} flatTone = null; }
    if (on && audio()) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine"; o.frequency.value = 980; g.gain.value = 0.25; o.connect(g); g.connect(master); o.start(); flatTone = o;
    }
  }
  function nurseControls() {
    controls.innerHTML = `
      <button class="btn primary" id="hscan">Scan heart<small>hold to check for heartbreak</small></button>
      <button class="btn" id="fl">Flatline<small>after you say her name</small></button>
      <button class="btn" id="shock">Clear!<small>shock / revive</small></button>`;
    const s = $("hscan");
    const start = (e) => { e.preventDefault(); if (scanningH || flat) return; audio(); scanningH = true; s.classList.add("active"); status.textContent = "Scanning..."; sub.textContent = "> say their name..._"; };
    const stop = () => {
      if (!scanningH) return; scanningH = false; s.classList.remove("active");
      status.textContent = bpm > 130 ? "Heartbreak" : "Stable-ish"; sub.textContent = "> dx: " + pick(dx) + "_"; $("r3").textContent = bpm > 130 ? "CRIT" : "FAIR";
    };
    bindHold(s, start, stop);
    $("fl").onclick = () => { audio(); setFlat(true); status.textContent = "Flatline"; sub.textContent = "> patient saw the ex at the dog park_"; $("r3").textContent = "DEAD"; };
    $("shock").onclick = () => { audio(); zap(); setFlat(false); bpm = 150; bpmTarget = 150; status.textContent = "We got 'em back"; sub.textContent = "> rx: block number, drink water_"; $("r3").textContent = "LIVE"; };
    $("l1").textContent = "BPM"; $("l2").textContent = "SpO₂"; $("l3").textContent = "Prognosis"; $("r3").textContent = "FAIR";
    status.textContent = "Stable-ish"; sub.textContent = "> dispatched: reports of heartbreak_";
    hint.textContent = "Hold SCAN over their chest";
  }

  /* ---------- MODES ---------- */
  function setMode(m) {
    mode = m; document.body.dataset.mode = m;
    $("tab-hazmat").setAttribute("aria-selected", m === "hazmat"); $("tab-nurse").setAttribute("aria-selected", m === "nurse");
    $("unitName").textContent = m === "hazmat" ? "Dept. of Atmospheric Integrity" : "Cardiac Feelings Unit";
    $("hzClock").textContent = m === "hazmat" ? "UNIT 2" : "ER 4";
    screen.classList.remove("alarm"); setFlat(false); scanning = false; scanningH = false;
    $("gauge").hidden = m !== "hazmat"; cv.hidden = m !== "nurse";
    if (m === "hazmat") { hzControls(); lvl = 4; target = 4; status.textContent = "Air clean"; sub.textContent = "> standing by for reports_"; }
    else { requestAnimationFrame(sizeCanvas); bpm = 72; bpmTarget = 72; lastT = performance.now(); nurseControls(); }
  }
  $("tab-hazmat").onclick = () => setMode("hazmat");
  $("tab-nurse").onclick = () => setMode("nurse");
  const onResize = () => { if (mode === "nurse") sizeCanvas(); };
  const onVis = () => { if (document.visibilityState === "visible" && ac) keepAwake(); };
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVis);
  function loop(now) { if (dead) return; if (mode === "hazmat") hzTick(now); else nurseTick(now); raf = requestAnimationFrame(loop); }
  setMode("hazmat"); raf = requestAnimationFrame(loop);

  return () => {
    dead = true; cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVis);
    try { flatTone && flatTone.stop(); } catch (e) {}
    try { wakeLock && wakeLock.release(); } catch (e) {}
    try { ac && ac.close(); } catch (e) {}
  };
}
