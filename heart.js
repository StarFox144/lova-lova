// Heart of words — main component.

const { useState, useEffect, useMemo, useRef } = React;

const HEART_PATH = "M 400 690 C 200 540, 20 360, 20 200 C 20 92, 110 20, 220 20 C 304 20, 380 72, 400 162 C 420 72, 496 20, 580 20 C 690 20, 780 92, 780 200 C 780 360, 600 540, 400 690 Z";

// Border path — offset slightly outside, no closing kiss, starts at bottom for a satisfying draw
const BORDER_PATH = "M 400 700 C 200 552, 8 360, 8 196 C 8 84, 104 8, 220 8 C 308 8, 384 60, 400 152 C 416 60, 492 8, 580 8 C 696 8, 792 84, 792 196 C 792 360, 600 552, 400 700";

const PALETTES = [
  // [ink (text), bg, accent, bgHi]
  { name: "ardent",   ink: "#b71d3c", bg: "#faf4ee", accent: "#e23d5a", bgHi: "#fbe9e2" },
  { name: "noir",     ink: "#e23a55", bg: "#0d0a0c", accent: "#ff6b8a", bgHi: "#231419" },
  { name: "gilded",   ink: "#caa260", bg: "#1b0e12", accent: "#e3c084", bgHi: "#2c1820" },
  { name: "blush",    ink: "#c97a8b", bg: "#fbf3ee", accent: "#e9b3bd", bgHi: "#f9e3df" },
  { name: "ink",      ink: "#1a1a1a", bg: "#fbfaf7", accent: "#1a1a1a", bgHi: "#efece6" },
  { name: "violet",   ink: "#7d3aa3", bg: "#f6f1f8", accent: "#b07ad1", bgHi: "#ece1f1" },
];

const PHRASES = {
  "I love you":       "I love you",
  "Я тебе кохаю":     "Я тебе кохаю",
  "Te amo":           "Te amo",
  "Je t'aime":        "Je t'aime",
  "我爱你":           "我爱你",
};

// Detect dark theme preference
const getDefaultPalette = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'noir' : 'ardent';
  }
  return 'ardent';
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "phrase": "I love you",
  "paletteName": getDefaultPalette(),
  "density": 26,
  "fontStyle": "serif",
  "showOutline": true,
  "showBeat": true,
  "showPetals": true,
  "separator": " · "
}/*EDITMODE-END*/;

function Heart() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const palette = useMemo(
    () => PALETTES.find(p => p.name === t.paletteName) || PALETTES[0],
    [t.paletteName]
  );

  // Apply CSS vars on body
  useEffect(() => {
    const r = document.body;
    r.style.setProperty("--ink", palette.ink);
    r.style.setProperty("--bg", palette.bg);
    r.style.setProperty("--accent", palette.accent);
    r.style.setProperty("--bg-hi", palette.bgHi);
  }, [palette]);

  const phrase = (t.phrase || "I love you").trim();
  const sep = t.separator || " · ";
  const unit = phrase + sep;
  // long enough to span the heart width, will be clipped
  const longLine = unit.repeat(28);

  // Vertical layout: rows positioned across the heart, sizes scale with density
  const density = Math.max(8, Math.min(60, t.density | 0));
  
  // Adjust density for mobile for better rendering
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const adjustedDensity = isMobile && density > 30 ? Math.floor(density * 0.85) : density;
  
  const rows = useMemo(() => {
    const arr = [];
    const yStart = 50;
    const yEnd   = 668;
    const step   = (yEnd - yStart) / (adjustedDensity - 1);
    for (let i = 0; i < adjustedDensity; i++) {
      arr.push({ i, y: yStart + i * step });
    }
    return arr;
  }, [adjustedDensity]);

  const fontSize = Math.max(10, Math.min(40, 720 / adjustedDensity * 0.82));

  // Mark the “special” center row — slightly bigger, just the phrase, centered
  const centerIdx = Math.floor(adjustedDensity / 2);

  const fontClass =
    t.fontStyle === "script" ? "font-script" :
    t.fontStyle === "sans"   ? "font-sans"   :
                               "font-serif";

  // Letter spacing tuning per font
  const letterSpacing =
    t.fontStyle === "script" ? ".02em" :
    t.fontStyle === "sans"   ? ".04em" :
                               ".01em";

  return (
    <>
      <div className="heart-wrap" aria-label={`A heart composed of the words “${phrase}”`}>
        <svg className="heart-svg" viewBox="0 0 800 720" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="heart-clip">
              <path d={HEART_PATH} />
            </clipPath>
            <linearGradient id="row-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={palette.ink} stopOpacity="0.78" />
              <stop offset="50%"  stopColor={palette.ink} stopOpacity="1" />
              <stop offset="100%" stopColor={palette.accent} stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id="heart-inner" cx="50%" cy="42%" r="60%">
              <stop offset="0%"  stopColor={palette.bgHi} stopOpacity="1" />
              <stop offset="100%" stopColor={palette.bg}   stopOpacity="0" />
            </radialGradient>
            <path id="border-curve" d={BORDER_PATH} />
          </defs>

          <g className={t.showBeat ? "beat" : ""}>
            {/* soft inner glow */}
            <path d={HEART_PATH} fill="url(#heart-inner)" />

            {/* rows of text clipped to heart */}
            <g clipPath="url(#heart-clip)">
              {rows.map(({ i, y }) => {
                const isCenter = i === centerIdx;
                const op = isCenter ? 1 : 0.72 - Math.abs(i - centerIdx) * 0.008;
                const delay = (i / density) * 1.8 + 0.4;
                const text = isCenter ? phrase : longLine;
                const size = isCenter ? fontSize * 1.35 : fontSize;
                return (
                  <text
                    key={i}
                    x="400"
                    y={y}
                    textAnchor="middle"
                    className={`row ${fontClass}`}
                    fill="url(#row-grad)"
                    style={{
                      fontSize: `${size}px`,
                      letterSpacing,
                      animationDelay: `${delay}s`,
                      "--row-op": op,
                    }}
                  >
                    {text}
                  </text>
                );
              })}
            </g>

            {/* drawn outline */}
            {t.showOutline && (
              <path
                d={BORDER_PATH}
                className="outline"
                style={{ stroke: palette.ink }}
              />
            )}

            {/* phrase running along the border */}
            <text className={`border-text ${fontClass}`} fill={palette.ink} fontSize="13" opacity="0.45">
              <textPath href="#border-curve" startOffset="0">
                {(phrase + " ♥ ").repeat(14)}
              </textPath>
            </text>
          </g>
        </svg>
      </div>

      {t.showPetals && <Petals color={palette.accent} key={palette.name} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Words" />
        <TweakSelect
          label="Phrase"
          value={t.phrase}
          options={Object.keys(PHRASES)}
          onChange={(v) => setTweak("phrase", v)}
        />
        <TweakText
          label="Custom"
          value={t.phrase}
          onChange={(v) => setTweak("phrase", v)}
        />
        <TweakText
          label="Separator"
          value={t.separator}
          onChange={(v) => setTweak("separator", v)}
        />

        <TweakSection label="Style" />
        <TweakRadio
          label="Font"
          value={t.fontStyle}
          options={["serif", "script", "sans"]}
          onChange={(v) => setTweak("fontStyle", v)}
        />
        <TweakSelect
          label="Palette"
          value={t.paletteName}
          options={PALETTES.map(p => p.name)}
          onChange={(v) => setTweak("paletteName", v)}
        />

        <TweakSection label="Shape" />
        <TweakSlider
          label="Density"
          value={t.density}
          min={10} max={48} step={1}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakToggle
          label="Outline"
          value={t.showOutline}
          onChange={(v) => setTweak("showOutline", v)}
        />
        <TweakToggle
          label="Heartbeat"
          value={t.showBeat}
          onChange={(v) => setTweak("showBeat", v)}
        />
        <TweakToggle
          label="Petals"
          value={t.showPetals}
          onChange={(v) => setTweak("showPetals", v)}
        />
      </TweaksPanel>
    </>
  );
}

function Petals({ color }) {
  // pre-compute positions so they don't re-randomize every render
  const petals = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 14,
      duration: 10 + Math.random() * 10,
      size: 5 + Math.random() * 8,
      drift: (Math.random() - 0.5) * 60,
    }));
  }, []);
  return (
    <>
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: `${p.left}vw`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `translateX(${p.drift}px)`,
          }}
        />
      ))}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Heart />);
