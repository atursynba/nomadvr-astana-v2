/**
 * NomadVR Astana — Interactive VR Tourism Showcase
 * AI Feature: Web Speech API voice intent recognition + speech synthesis
 * Fallback: Tour stop cards, hotkeys (1-4, N, V), buttons & gaze/click hotspots
 */

const landingScreen = document.getElementById("landing-screen");
const hud = document.getElementById("hud");
const aiStatus = document.getElementById("ai-status");
const sceneStateLabel = document.getElementById("scene-state");
const sceneHeadingEl = document.getElementById("scene-heading");
const activeSummaryEl = document.getElementById("active-summary");
const fpsBadge = document.getElementById("fps-badge");
const captionBox = document.getElementById("caption-box");
const voiceCheckbox = document.getElementById("enable-voice-checkbox");

const sceneEl = document.getElementById("vr-scene");
const skyEl = document.getElementById("sky");
const groundEl = document.getElementById("ground");
const ambientLightEl = document.getElementById("ambient-light");
const sunLightEl = document.getElementById("sun-light");
const worldLabelEl = document.getElementById("world-label");
const offerGroup = document.getElementById("offer-group");
const hubHaloEl = document.getElementById("hub-halo");

let isNight = false;
let currentStop = 1; // 1: Promenade, 2: Khan Shatyr, 3: Baiterek, 4: Pyramid + Tour Offer
let recognition = null;
let voiceSupported = false;
let fpsLoopStarted = false;

const streetLamps = [];
const towerWindows = [];
const nightStars = [];

const TOUR_STOPS = {
  1: {
    code: "01 · Promenade",
    heading: "Nur-Zhol Central Promenade",
    badge: "Stop 01 / 04",
    headline: "01 / CENTRAL PROMENADE\n(Gaze or click any monument to inspect)",
    script: "Stop 01: Nur-Zhol Boulevard. Around you stand Khan Shatyr on the left, Baiterek on the right, and the Pyramid ahead."
  },
  2: {
    code: "02 · Khan Shatyr",
    heading: "Khan Shatyr Entertainment Center",
    badge: "Stop 02 / 04",
    headline: "02 / KHAN SHATYR\n150m tensile tent landmark in Astana",
    script: "Stop 02: Khan Shatyr on your left is a landmark 150-meter tensile tent featuring indoor gardens, shops, and leisure zones."
  },
  3: {
    code: "03 · Baiterek",
    heading: "Baiterek Monument & Left Bank",
    badge: "Stop 03 / 04",
    headline: "03 / BAITEREK MONUMENT\nGolden sphere & panoramic viewpoint",
    script: "Stop 03: Baiterek on your right rises 105 meters and symbolizes the Samruk legend and the tree of life."
  },
  4: {
    code: "04 · Pyramid & Offer",
    heading: "Palace of Peace & 48h Tour Pass",
    badge: "Stop 04 / 04",
    headline: "04 / PYRAMID & TOUR OFFER\nPreview the 48-hour Astana itinerary ahead",
    script: "Stop 04: Palace of Peace and Reconciliation. Check the floating 48-hour Astana Discovery Pass ahead before booking."
  }
};

function setCaption(text) {
  captionBox.textContent = `[Astana Guide]: ${text}`;
}

function speakAndCaption(text, readAloud = true) {
  setCaption(text);
  if (readAloud && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    msg.rate = 0.96;
    window.speechSynthesis.speak(msg);
  }
}

function updateSummaryBadge() {
  const cfg = TOUR_STOPS[currentStop];
  const timeLabel = isNight ? "Night Lights" : "Daylight";
  activeSummaryEl.textContent = `Selected: ${cfg.code} · ${timeLabel}`;
}

function setLighting(nightMode, announce = true) {
  isNight = nightMode;
  if (isNight) {
    skyEl.setAttribute("color", "#050814");
    groundEl.setAttribute("color", "#172033");
    sceneEl.setAttribute("fog", "type: exponential; color: #050814; density: 0.015");
    ambientLightEl.setAttribute("light", "type: ambient; color: #64748b; intensity: 0.45");
    sunLightEl.setAttribute("light", "type: directional; color: #38bdf8; intensity: 1.3");
    worldLabelEl.setAttribute("color", "#f8fafc");
    if (hubHaloEl) {
      hubHaloEl.setAttribute("color", "#38bdf8");
    }
    streetLamps.forEach((lamp) => {
      lamp.setAttribute("color", "#fde047");
      lamp.setAttribute("material", "emissive: #facc15; emissiveIntensity: 0.95");
    });
    towerWindows.forEach((win) => {
      win.setAttribute("color", "#38bdf8");
      win.setAttribute("material", "emissive: #0284c7; emissiveIntensity: 0.75");
    });
    nightStars.forEach((star) => star.setAttribute("visible", "true"));
    if (announce) {
      speakAndCaption("Evening illumination enabled: boulevard lamps, stars, and skyline accents are now glowing.");
    }
  } else {
    skyEl.setAttribute("color", "#7dd3fc");
    groundEl.setAttribute("color", "#cbd5e1");
    sceneEl.setAttribute("fog", "type: exponential; color: #bae6fd; density: 0.012");
    ambientLightEl.setAttribute("light", "type: ambient; color: #ffffff; intensity: 0.85");
    sunLightEl.setAttribute("light", "type: directional; color: #fffbeb; intensity: 1.2");
    worldLabelEl.setAttribute("color", "#0f172a");
    if (hubHaloEl) {
      hubHaloEl.setAttribute("color", "#facc15");
    }
    streetLamps.forEach((lamp) => {
      lamp.setAttribute("color", "#e2e8f0");
      lamp.setAttribute("material", "emissive: #000000; emissiveIntensity: 0");
    });
    towerWindows.forEach((win) => {
      win.setAttribute("color", "#bae6fd");
      win.setAttribute("material", "emissive: #000000; emissiveIntensity: 0");
    });
    nightStars.forEach((star) => star.setAttribute("visible", "false"));
    if (announce) {
      speakAndCaption("Daylight mode enabled across Astana's Nur-Zhol boulevard.");
    }
  }
  updateSummaryBadge();
}

function goToStop(stopNumber) {
  currentStop = stopNumber > 4 ? 1 : stopNumber;
  const cfg = TOUR_STOPS[currentStop];

  sceneHeadingEl.textContent = cfg.heading;
  sceneStateLabel.textContent = cfg.badge;
  worldLabelEl.setAttribute("value", cfg.headline);
  offerGroup.setAttribute("visible", currentStop === 4 ? "true" : "false");

  document.querySelectorAll(".stop-card").forEach((card) => {
    const idx = Number(card.getAttribute("data-stop"));
    card.classList.toggle("active", idx === currentStop);
  });

  updateSummaryBadge();
  speakAndCaption(cfg.script);
}

// 1. Interactive Landmark Hotspot
AFRAME.registerComponent("landmark-hotspot", {
  schema: {
    stop: { type: "number", default: 1 }
  },
  init: function () {
    this.el.addEventListener("click", () => {
      if (currentStop === this.data.stop) {
        setLighting(!isNight, true);
      } else {
        goToStop(this.data.stop);
      }
    });
  }
});

// 2. Rich Boulevard Environment: Promenade, Curbs, Lawns, Trees, Benches, Lamps, Skyline & Stars
AFRAME.registerComponent("astana-boulevard-rich", {
  init: function () {
    const root = this.el;

    const walk = document.createElement("a-plane");
    walk.setAttribute("rotation", "-90 0 0");
    walk.setAttribute("position", "0 0.01 -2.5");
    walk.setAttribute("width", "4.8");
    walk.setAttribute("height", "32");
    walk.setAttribute("color", "#94a3b8");
    root.appendChild(walk);

    [-2.42, 2.42].forEach((xCurb) => {
      const curb = document.createElement("a-box");
      curb.setAttribute("position", `${xCurb} 0.04 -2.5`);
      curb.setAttribute("width", "0.12");
      curb.setAttribute("height", "0.08");
      curb.setAttribute("depth", "32");
      curb.setAttribute("color", "#64748b");
      root.appendChild(curb);
    });

    [-4.1, 4.1].forEach((xLawn) => {
      const lawn = document.createElement("a-plane");
      lawn.setAttribute("rotation", "-90 0 0");
      lawn.setAttribute("position", `${xLawn} 0.015 -2.5`);
      lawn.setAttribute("width", "3.2");
      lawn.setAttribute("height", "30");
      lawn.setAttribute("color", "#15803d");
      root.appendChild(lawn);

      for (let zBed = 2.5; zBed >= -9.5; zBed -= 4) {
        const bed = document.createElement("a-box");
        bed.setAttribute("position", `${xLawn > 0 ? 3.2 : -3.2} 0.06 ${zBed}`);
        bed.setAttribute("width", "0.7");
        bed.setAttribute("height", "0.12");
        bed.setAttribute("depth", "1.6");
        bed.setAttribute("color", "#a16207");
        root.appendChild(bed);
      }
    });

    [-5.1, 5.1].forEach((xTree) => {
      for (let zTree = 3.5; zTree >= -10.5; zTree -= 3.5) {
        const trunk = document.createElement("a-cylinder");
        trunk.setAttribute("position", `${xTree} 0.55 ${zTree}`);
        trunk.setAttribute("radius", "0.07");
        trunk.setAttribute("height", "1.1");
        trunk.setAttribute("color", "#78350f");
        root.appendChild(trunk);

        const crown = document.createElement("a-dodecahedron");
        crown.setAttribute("position", `${xTree} 1.45 ${zTree}`);
        crown.setAttribute("radius", "0.58");
        crown.setAttribute("color", "#16a34a");
        root.appendChild(crown);
      }
    });

    [-1.95, 1.95].forEach((xBench) => {
      [-1.0, -4.5, -8.0].forEach((zBench) => {
        const seat = document.createElement("a-box");
        seat.setAttribute("position", `${xBench} 0.28 ${zBench}`);
        seat.setAttribute("width", "0.45");
        seat.setAttribute("height", "0.08");
        seat.setAttribute("depth", "1.2");
        seat.setAttribute("color", "#92400e");
        root.appendChild(seat);
      });
    });

    [-2.55, 2.55].forEach((xLamp) => {
      for (let zLamp = 3.2; zLamp >= -10.0; zLamp -= 3.3) {
        const pole = document.createElement("a-cylinder");
        pole.setAttribute("position", `${xLamp} 0.95 ${zLamp}`);
        pole.setAttribute("radius", "0.03");
        pole.setAttribute("height", "1.9");
        pole.setAttribute("color", "#334155");
        root.appendChild(pole);

        const bulb = document.createElement("a-sphere");
        bulb.setAttribute("position", `${xLamp} 1.95 ${zLamp}`);
        bulb.setAttribute("radius", "0.12");
        bulb.setAttribute("color", "#e2e8f0");
        streetLamps.push(bulb);
        root.appendChild(bulb);
      }
    });

    const towers = [
      { x: -13.5, z: -16, w: 2.4, h: 10.0, d: 2.4, c: "#475569" },
      { x: -9.8, z: -18, w: 2.0, h: 13.0, d: 2.0, c: "#334155" },
      { x: -6.2, z: -19, w: 2.6, h: 8.8, d: 2.2, c: "#475569" },
      { x: 6.2, z: -19, w: 2.4, h: 11.5, d: 2.2, c: "#334155" },
      { x: 9.8, z: -17, w: 2.8, h: 14.2, d: 2.5, c: "#1e293b" },
      { x: 13.6, z: -16, w: 2.2, h: 9.6, d: 2.2, c: "#475569" }
    ];

    towers.forEach((t) => {
      const box = document.createElement("a-box");
      box.setAttribute("position", `${t.x} ${t.h / 2} ${t.z}`);
      box.setAttribute("width", t.w);
      box.setAttribute("height", t.h);
      box.setAttribute("depth", t.d);
      box.setAttribute("color", t.c);
      root.appendChild(box);

      const strip = document.createElement("a-box");
      strip.setAttribute("position", `${t.x} ${t.h * 0.55} ${t.z + t.d / 2 + 0.03}`);
      strip.setAttribute("width", "0.22");
      strip.setAttribute("height", t.h * 0.72);
      strip.setAttribute("depth", "0.04");
      strip.setAttribute("color", "#bae6fd");
      towerWindows.push(strip);
      root.appendChild(strip);
    });

    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const radius = 26 + (i % 4) * 4;
      const yStar = 8 + (i % 6) * 2.5;
      const star = document.createElement("a-sphere");
      star.setAttribute("position", `${Math.cos(angle) * radius} ${yStar} ${Math.sin(angle) * radius - 6}`);
      star.setAttribute("radius", "0.14");
      star.setAttribute("color", "#fef9c3");
      star.setAttribute("visible", "false");
      nightStars.push(star);
      root.appendChild(star);
    }
  }
});

// 3. Detailed Procedural Baiterek
AFRAME.registerComponent("astana-baiterek-rich", {
  init: function () {
    const root = this.el;

    const step1 = document.createElement("a-cylinder");
    step1.setAttribute("position", "0 0.06 0");
    step1.setAttribute("radius", "1.15");
    step1.setAttribute("height", "0.12");
    step1.setAttribute("color", "#1e293b");
    root.appendChild(step1);

    const step2 = document.createElement("a-cylinder");
    step2.setAttribute("position", "0 0.16 0");
    step2.setAttribute("radius", "0.85");
    step2.setAttribute("height", "0.1");
    step2.setAttribute("color", "#475569");
    root.appendChild(step2);

    const shaft = document.createElement("a-cylinder");
    shaft.setAttribute("position", "0 1.12 0");
    shaft.setAttribute("radius", "0.15");
    shaft.setAttribute("height", "1.85");
    shaft.setAttribute("color", "#f8fafc");
    root.appendChild(shaft);

    [0, 72, 144, 216, 288].forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      const strut = document.createElement("a-cylinder");
      strut.setAttribute("position", `${Math.cos(rad) * 0.25} 1.0 ${Math.sin(rad) * 0.25}`);
      strut.setAttribute("radius", "0.036");
      strut.setAttribute("height", "1.65");
      strut.setAttribute("color", "#94a3b8");
      strut.setAttribute("rotation", `${Math.sin(rad) * 8} 0 ${-Math.cos(rad) * 8}`);
      root.appendChild(strut);
    });

    const crown = document.createElement("a-torus");
    crown.setAttribute("position", "0 2.08 0");
    crown.setAttribute("radius", "0.36");
    crown.setAttribute("radius-tubular", "0.032");
    crown.setAttribute("rotation", "90 0 0");
    crown.setAttribute("color", "#eab308");
    root.appendChild(crown);

    const sphereGroup = document.createElement("a-entity");
    sphereGroup.setAttribute("position", "0 2.46 0");
    sphereGroup.setAttribute("animation", "property: rotation; to: 0 360 0; loop: true; dur: 9500; easing: linear");

    const sphere = document.createElement("a-sphere");
    sphere.setAttribute("radius", "0.4");
    sphere.setAttribute("color", "#facc15");
    sphere.setAttribute("material", "metalness: 0.45; roughness: 0.2");
    sphereGroup.appendChild(sphere);

    const orbitRing = document.createElement("a-torus");
    orbitRing.setAttribute("radius", "0.54");
    orbitRing.setAttribute("radius-tubular", "0.014");
    orbitRing.setAttribute("rotation", "70 20 0");
    orbitRing.setAttribute("color", "#fef08a");
    sphereGroup.appendChild(orbitRing);

    root.appendChild(sphereGroup);

    const tag = document.createElement("a-text");
    tag.setAttribute("value", "03 · BAITEREK");
    tag.setAttribute("position", "0 3.18 0");
    tag.setAttribute("align", "center");
    tag.setAttribute("color", "#eab308");
    tag.setAttribute("width", "4.2");
    root.appendChild(tag);
  }
});

// 4. Detailed Procedural Khan Shatyr
AFRAME.registerComponent("astana-khan-shatyr-rich", {
  init: function () {
    const root = this.el;

    const podium = document.createElement("a-cylinder");
    podium.setAttribute("position", "0 0.12 0");
    podium.setAttribute("radius", "1.45");
    podium.setAttribute("height", "0.24");
    podium.setAttribute("color", "#334155");
    root.appendChild(podium);

    const baseRing = document.createElement("a-torus");
    baseRing.setAttribute("position", "0 0.25 0");
    baseRing.setAttribute("radius", "1.28");
    baseRing.setAttribute("radius-tubular", "0.03");
    baseRing.setAttribute("rotation", "90 0 0");
    baseRing.setAttribute("color", "#38bdf8");
    root.appendChild(baseRing);

    const tent = document.createElement("a-cone");
    tent.setAttribute("position", "0 1.3 0");
    tent.setAttribute("radius-bottom", "1.28");
    tent.setAttribute("radius-top", "0.06");
    tent.setAttribute("height", "2.15");
    tent.setAttribute("rotation", "0 0 -10");
    tent.setAttribute("color", "#bae6fd");
    tent.setAttribute("material", "opacity: 0.78; transparent: true; roughness: 0.2");
    root.appendChild(tent);

    const spire = document.createElement("a-cylinder");
    spire.setAttribute("position", "0.23 2.55 0");
    spire.setAttribute("radius", "0.025");
    spire.setAttribute("height", "0.72");
    spire.setAttribute("rotation", "0 0 -10");
    spire.setAttribute("color", "#f8fafc");
    root.appendChild(spire);

    const tag = document.createElement("a-text");
    tag.setAttribute("value", "02 · KHAN SHATYR");
    tag.setAttribute("position", "0 3.12 0");
    tag.setAttribute("align", "center");
    tag.setAttribute("color", "#38bdf8");
    tag.setAttribute("width", "4.2");
    root.appendChild(tag);
  }
});

// 5. Detailed Procedural Pyramid of Peace & Reconciliation
AFRAME.registerComponent("astana-pyramid-rich", {
  init: function () {
    const root = this.el;

    const base = document.createElement("a-box");
    base.setAttribute("position", "0 0.14 0");
    base.setAttribute("width", "2.75");
    base.setAttribute("height", "0.28");
    base.setAttribute("depth", "2.75");
    base.setAttribute("color", "#334155");
    root.appendChild(base);

    const pyramid = document.createElement("a-cone");
    pyramid.setAttribute("position", "0 1.36 0");
    pyramid.setAttribute("segments-radial", "4");
    pyramid.setAttribute("radius-bottom", "1.72");
    pyramid.setAttribute("radius-top", "0.02");
    pyramid.setAttribute("height", "2.15");
    pyramid.setAttribute("rotation", "0 45 0");
    pyramid.setAttribute("color", "#94a3b8");
    pyramid.setAttribute("material", "metalness: 0.35; roughness: 0.25");
    root.appendChild(pyramid);

    const apex = document.createElement("a-cone");
    apex.setAttribute("position", "0 2.18 0");
    apex.setAttribute("segments-radial", "4");
    apex.setAttribute("radius-bottom", "0.45");
    apex.setAttribute("radius-top", "0.01");
    apex.setAttribute("height", "0.58");
    apex.setAttribute("rotation", "0 45 0");
    apex.setAttribute("color", "#fde047");
    apex.setAttribute("material", "emissive: #eab308; emissiveIntensity: 0.4");
    root.appendChild(apex);

    const tag = document.createElement("a-text");
    tag.setAttribute("value", "04 · PYRAMID OF PEACE");
    tag.setAttribute("position", "0 2.95 0");
    tag.setAttribute("align", "center");
    tag.setAttribute("color", "#fde047");
    tag.setAttribute("width", "4.4");
    root.appendChild(tag);
  }
});

// 6. Speech Recognition Setup (AI Feature)
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceSupported = false;
    aiStatus.textContent = "Voice AI: Unsupported (Fallback active)";
    return false;
  }

  voiceSupported = true;
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    aiStatus.textContent = "Voice AI: Listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    aiStatus.textContent = `Voice AI: "${transcript}"`;

    if (transcript.includes("night") || transcript.includes("dark") || transcript.includes("ночь")) {
      setLighting(true, true);
    } else if (transcript.includes("day") || transcript.includes("light") || transcript.includes("день")) {
      setLighting(false, true);
    } else if (transcript.includes("khan") || transcript.includes("tent") || transcript.includes("шатыр") || transcript.includes("two")) {
      goToStop(2);
    } else if (transcript.includes("baiterek") || transcript.includes("tower") || transcript.includes("байтерек") || transcript.includes("three")) {
      goToStop(3);
    } else if (transcript.includes("pyramid") || transcript.includes("offer") || transcript.includes("пирамида") || transcript.includes("four")) {
      goToStop(4);
    } else if (transcript.includes("next") || transcript.includes("дальше")) {
      goToStop(currentStop + 1);
    } else if (transcript.includes("home") || transcript.includes("promenade") || transcript.includes("one")) {
      goToStop(1);
    } else {
      speakAndCaption(`Heard "${transcript}". Try "khan shatyr", "baiterek", "pyramid", "night", or "next".`);
    }
  };

  recognition.onerror = (event) => {
    aiStatus.textContent = `Voice AI: Fallback (${event.error})`;
    setCaption("Voice recognition unavailable or denied. Click a stop card or use keys 1–4 / buttons.");
  };

  recognition.onend = () => {
    if (aiStatus.textContent.startsWith("Voice AI: Listening")) {
      aiStatus.textContent = "Voice AI: Ready";
    }
  };

  return true;
}

function triggerVoiceCommand() {
  if (!voiceSupported && !initSpeechRecognition()) {
    setCaption("Speech API not supported in this browser. Use the stop cards or buttons.");
    return;
  }
  try {
    recognition.start();
  } catch (e) {
    setCaption("Microphone is already listening or busy.");
  }
}

// 7. FPS Monitor (Required for README & Report §5)
let frames = 0;
let lastMark = performance.now();
function startFpsLoop() {
  if (fpsLoopStarted) return;
  fpsLoopStarted = true;
  function tick() {
    frames++;
    const now = performance.now();
    if (now - lastMark >= 1000) {
      fpsBadge.textContent = `FPS: ${frames}`;
      frames = 0;
      lastMark = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// 8. Launch Selected Mode from Hub Cards
function enterTourMode(mode) {
  landingScreen.style.display = "none";
  hud.style.display = "flex";

  if (voiceCheckbox.checked) {
    const ok = initSpeechRecognition();
    if (ok) {
      aiStatus.textContent = "Voice AI: Ready (Press V or Speak Command)";
      try { recognition.start(); } catch (e) {}
    }
  } else {
    aiStatus.textContent = "Mode: Fallback (Cards, Keys & Gaze)";
  }

  if (mode === "night") {
    setLighting(true, false);
    goToStop(3);
  } else if (mode === "offer") {
    setLighting(false, false);
    goToStop(4);
  } else {
    setLighting(false, false);
    goToStop(1);
  }

  startFpsLoop();
}

document.querySelectorAll("[data-start-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    enterTourMode(btn.getAttribute("data-start-mode"));
  });
});

// 9. Stop Cards & Action Buttons
document.querySelectorAll(".stop-card").forEach((card) => {
  card.addEventListener("click", () => {
    goToStop(Number(card.getAttribute("data-stop")));
  });
});

document.getElementById("btn-voice-cmd").addEventListener("click", triggerVoiceCommand);

document.getElementById("btn-lighting").addEventListener("click", () => {
  setLighting(!isNight, true);
});

document.getElementById("btn-next-stop").addEventListener("click", () => {
  goToStop(currentStop + 1);
});

document.getElementById("btn-narration").addEventListener("click", () => {
  const currentText = captionBox.textContent.replace(/^\[Astana Guide\]:\s*/, "");
  speakAndCaption(currentText, true);
});

document.getElementById("btn-fullscreen").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
});

document.getElementById("btn-hub").addEventListener("click", () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  hud.style.display = "none";
  landingScreen.style.display = "flex";
});

// 10. Keyboard Shortcuts (1-4 stops, N day/night, V voice command)
window.addEventListener("keydown", (e) => {
  if (landingScreen.style.display !== "none") return;
  if (e.key === "1") goToStop(1);
  else if (e.key === "2") goToStop(2);
  else if (e.key === "3") goToStop(3);
  else if (e.key === "4") goToStop(4);
  else if (e.key.toLowerCase() === "n") setLighting(!isNight, true);
  else if (e.key.toLowerCase() === "v") triggerVoiceCommand();
});
