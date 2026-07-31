// ZYRIX — refined game-screen mockup. Same direction, tighter execution:
// deeper sky, horizon bloom, reflective track, consistent glow language,
// polished rider proportions, glass HUD.

const NEON = "#22E5FF";

const STARS = Array.from({ length: 42 }, (_, i) => ({
  x: ((i * 137.5) % 100),
  y: ((i * 61.8) % 34),
  s: 0.6 + ((i * 7) % 10) / 7,
  o: 0.15 + ((i * 13) % 10) / 16,
}));

export function RefinedNeon() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#03040C] select-none font-['Inter']">
      {/* ── Sky: deep gradient + nebula glow ── */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: "40%",
          background:
            "linear-gradient(180deg, #010209 0%, #060A1E 55%, #0A1430 85%, #0E2040 100%)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "50%", top: "26%", width: "140%", height: "34%",
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse at center, rgba(34,229,255,0.14) 0%, rgba(34,229,255,0.05) 40%, transparent 70%)",
        }}
      />
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#BFEFFF]"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }}
        />
      ))}

      {/* ── Horizon bloom line ── */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "39.4%", height: 3, background: NEON,
          boxShadow: `0 0 18px 4px rgba(34,229,255,0.55), 0 0 60px 16px rgba(34,229,255,0.22)`,
        }}
      />

      {/* ── Ground ── */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: "39.6%",
          background: "linear-gradient(180deg, #071226 0%, #050B1A 30%, #02050E 100%)",
        }}
      />

      {/* ── Track: rails, lanes, scroll grid, floor sheen ── */}
      <svg
        className="absolute inset-x-0"
        style={{ top: "39.6%", height: "60.4%", width: "100%" }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="railGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={NEON} stopOpacity="0.25" />
            <stop offset="1" stopColor={NEON} stopOpacity="1" />
          </linearGradient>
          <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={NEON} stopOpacity="0.10" />
            <stop offset="0.5" stopColor={NEON} stopOpacity="0.03" />
            <stop offset="1" stopColor={NEON} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* floor light bleed under horizon */}
        <rect x="0" y="0" width="100" height="26" fill="url(#sheen)" />
        {/* outer rails */}
        <path d="M50 0 L7 100" stroke="url(#railGlow)" strokeWidth="0.9" fill="none" />
        <path d="M50 0 L93 100" stroke="url(#railGlow)" strokeWidth="0.9" fill="none" />
        {/* lane dividers */}
        <path d="M50 0 L36 100" stroke={NEON} strokeWidth="0.28" opacity="0.30" fill="none" />
        <path d="M50 0 L64 100" stroke={NEON} strokeWidth="0.28" opacity="0.30" fill="none" />
        {/* scroll grid — spacing eases toward viewer */}
        {[7, 16, 28, 43, 61, 82].map((y, i) => (
          <line
            key={i}
            x1={50 - (43 * y) / 100}
            x2={50 + (43 * y) / 100}
            y1={y}
            y2={y}
            stroke={NEON}
            strokeWidth={0.14 + y * 0.004}
            opacity={0.08 + y * 0.0032}
          />
        ))}
        {/* rail reflections */}
        <path d="M7 100 L11 86" stroke={NEON} strokeWidth="1.6" opacity="0.10" fill="none" />
        <path d="M93 100 L89 86" stroke={NEON} strokeWidth="1.6" opacity="0.10" fill="none" />
      </svg>

      {/* ── Obstacle ahead (left lane) ── */}
      <div className="absolute" style={{ left: "27%", top: "56.5%" }}>
        <div
          style={{
            width: 34, height: 26, borderRadius: 4,
            background: "linear-gradient(180deg, #FF3D71 0%, #B3123F 100%)",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "0 0 16px 2px rgba(255,61,113,0.65), 0 8px 14px -4px rgba(255,61,113,0.4)",
          }}
        />
        <div style={{ width: 34, height: 6, marginTop: 2, borderRadius: "50%", background: "rgba(255,61,113,0.25)", filter: "blur(3px)" }} />
      </div>

      {/* ── Crystal run (right lane) ── */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${63 - i * 2.4}%`,
            top: `${63 - i * 8}%`,
            width: 15 - i * 3,
            height: 15 - i * 3,
            transform: "rotate(45deg)",
            borderRadius: 2,
            background: "linear-gradient(135deg, #9BF3FF 0%, #22E5FF 60%, #0FB3D6 100%)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 0 14px 3px rgba(34,229,255,0.7)",
          }}
        />
      ))}

      {/* ── Player: rider + hoverboard ── */}
      <div className="absolute" style={{ left: "50%", top: "71%", transform: "translateX(-50%) rotate(-1.5deg)" }}>
        <svg width="118" height="150" viewBox="0 0 100 128">
          <defs>
            <radialGradient id="core" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#DFFBFF" />
              <stop offset="0.45" stopColor={NEON} />
              <stop offset="1" stopColor={NEON} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="deck" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#141628" />
              <stop offset="1" stopColor="#080A16" />
            </linearGradient>
          </defs>

          {/* rider — legs, boots */}
          <path d="M43 70 Q38 86 30 97 L27 109 L39 111 L43 99 Q48 88 49 74 Z" fill="#0B0B12" />
          <path d="M57 70 Q62 86 70 97 L73 109 L61 111 L57 99 Q52 88 51 74 Z" fill="#0B0B12" />
          <path d="M24 107 L42 109 L41 115 L23 113 Z" fill="#23232E" />
          <path d="M76 107 L58 109 L59 115 L77 113 Z" fill="#23232E" />
          <path d="M43 72 Q38 88 31 100" stroke={NEON} strokeWidth="1.5" fill="none" opacity="0.9" />
          <path d="M57 72 Q62 88 69 100" stroke={NEON} strokeWidth="1.5" fill="none" opacity="0.9" />
          {/* arms */}
          <path d="M37 36 Q22 42 12 53 L16 60 Q28 50 41 46 Z" fill="#23232E" />
          <path d="M63 36 Q78 42 88 53 L84 60 Q72 50 59 46 Z" fill="#23232E" />
          <circle cx="14" cy="56.5" r="4.2" fill="#0B0B12" />
          <circle cx="86" cy="56.5" r="4.2" fill="#0B0B12" />
          <path d="M39 40 Q26 46 17 55" stroke={NEON} strokeWidth="1.2" fill="none" opacity="0.85" />
          <path d="M61 40 Q74 46 83 55" stroke={NEON} strokeWidth="1.2" fill="none" opacity="0.85" />
          {/* torso */}
          <path d="M38 32 Q50 27 62 32 L60 66 Q50 72 40 66 Z" fill="#0B0B12" stroke="#23232E" strokeWidth="1.4" />
          <path d="M50 34 L50 66" stroke={NEON} strokeWidth="1.5" opacity="0.9" />
          <path d="M40 37 L60 37" stroke={NEON} strokeWidth="1" opacity="0.7" />
          <path d="M42 62 L58 62" stroke={NEON} strokeWidth="1" opacity="0.7" />
          {/* energy core */}
          <circle cx="50" cy="47" r="10" fill="url(#core)" opacity="0.9" />
          <circle cx="50" cy="47" r="3.2" fill="#E9FDFF" />
          {/* helmet + visor */}
          <circle cx="50" cy="17" r="10.5" fill="#0B0B12" stroke="#23232E" strokeWidth="1.4" />
          <path d="M40 15.5 Q50 9.5 60 15.5" stroke={NEON} strokeWidth="2.4" fill="none" />
          <path d="M40.5 19 Q50 14 59.5 19" stroke="rgba(34,229,255,0.4)" strokeWidth="1.1" fill="none" />
          <path d="M46 26 L54 26 L53 31 L47 31 Z" fill="#23232E" />

          {/* hoverboard */}
          <path
            d="M8 118 Q6 106 20 104 L80 104 Q94 106 92 118 Q90 126 76 127 L24 127 Q10 126 8 118 Z"
            fill="url(#deck)" stroke={NEON} strokeWidth="1.8"
          />
          <path d="M20 109 L80 109" stroke={NEON} strokeWidth="2" opacity="0.85" strokeLinecap="round" />
          <path d="M32 119 L68 119" stroke="rgba(34,229,255,0.45)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>

        {/* energy rings + under-glow */}
        <div className="flex flex-col items-center" style={{ marginTop: -6 }}>
          {[0.85, 0.5, 0.22].map((o, i) => (
            <div
              key={i}
              style={{
                width: 62 + i * 22, height: 9 + i * 2, marginTop: i === 0 ? 0 : 2,
                borderRadius: "50%", border: `1.5px solid rgba(34,229,255,${o})`,
              }}
            />
          ))}
          <div
            style={{
              width: 84, height: 12, marginTop: 3, borderRadius: "50%",
              background: "rgba(34,229,255,0.35)", filter: "blur(6px)",
            }}
          />
        </div>
        {/* neon trail */}
        <div
          className="absolute left-1/2"
          style={{
            top: 176, width: 40, height: 78, transform: "translateX(-50%)",
            background: "linear-gradient(180deg, rgba(34,229,255,0.5) 0%, rgba(34,229,255,0) 100%)",
            borderRadius: "0 0 20px 20px", filter: "blur(1px)",
          }}
        />
      </div>

      {/* ── HUD: glass panels ── */}
      <div className="absolute inset-x-0 top-0 px-4 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div
              className="text-[30px] font-extrabold tracking-wide leading-none"
              style={{ color: NEON, textShadow: "0 0 16px rgba(34,229,255,0.75)" }}
            >
              1.2km
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div
                style={{
                  width: 11, height: 11, transform: "rotate(45deg)", borderRadius: 2,
                  background: "linear-gradient(135deg, #9BF3FF, #0FB3D6)",
                  boxShadow: "0 0 8px rgba(34,229,255,0.8)",
                }}
              />
              <span className="text-[13px] font-semibold text-[#9BF3FF]">47</span>
            </div>
          </div>

          <div
            className="rounded-xl px-4 py-1.5 text-[19px] font-bold tracking-[0.14em] text-white"
            style={{
              background: "rgba(6,10,24,0.55)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(34,229,255,0.22)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            8,420
          </div>

          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{
              background: "rgba(6,10,24,0.55)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <div className="flex gap-[3px]">
              <div className="h-3 w-[3px] rounded-sm bg-white" />
              <div className="h-3 w-[3px] rounded-sm bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Vignette for depth ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 75% at 50% 55%, transparent 55%, rgba(0,2,8,0.55) 100%)",
        }}
      />
    </div>
  );
}
