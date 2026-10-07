/**
 * High-fidelity vector engineering drawings for DFM testing across revisions.
 * Clean drawing view with Title Block, Front Elevation, Section A-A, Detail B, and Mounting Pad.
 * Note: Drawing zones removed per user requirement.
 */

export const SAMPLE_DRAWING_REV_A_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%" style="background-color: #f8fafc; font-family: monospace, sans-serif;">
  <defs>
    <pattern id="gridRevA" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="0.75"/>
    </pattern>
    <marker id="arrowRevA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b"/>
    </marker>
    <marker id="arrowRevARed" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626"/>
    </marker>
    <pattern id="hatchA" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#cbd5e1" stroke-width="1.5" />
    </pattern>
  </defs>

  <!-- Background Grid -->
  <rect width="100%" height="100%" fill="#ffffff" />
  <rect width="100%" height="100%" fill="url(#gridRevA)" />

  <!-- Drawing Border & Title Block -->
  <rect x="30" y="30" width="1140" height="740" fill="none" stroke="#0f172a" stroke-width="2.5"/>
  <rect x="40" y="40" width="1120" height="720" fill="none" stroke="#334155" stroke-width="1.5"/>

  <!-- Title Block Bottom Right -->
  <g transform="translate(780, 640)">
    <rect x="0" y="0" width="380" height="120" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
    <line x1="0" y1="30" x2="380" y2="30" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="0" y1="60" x2="380" y2="60" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="0" y1="90" x2="380" y2="90" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="200" y1="0" x2="200" y2="60" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="270" y1="60" x2="270" y2="120" stroke="#0f172a" stroke-width="1.5"/>
    
    <text x="10" y="20" font-size="11" font-weight="bold" fill="#0f172a">PART: VALVE ACTUATOR HOUSING</text>
    <text x="210" y="20" font-size="11" font-weight="bold" fill="#0f172a">DWG NO: AO-4820-D</text>
    <text x="10" y="50" font-size="10" fill="#475569">STAGE: CONCEPT DESIGN (EARLY DFM)</text>
    <text x="210" y="50" font-size="12" font-weight="bold" fill="#b91c1c">REVISION: REV 0.1</text>
    <text x="10" y="80" font-size="9" fill="#475569">MATERIAL: AL 6061-T651</text>
    <text x="280" y="80" font-size="9" fill="#475569">UNITS: mm [METRIC]</text>
    <text x="10" y="108" font-size="9" fill="#475569">GEN. TOL: ISO 2768-mK</text>
    <text x="280" y="108" font-size="9" font-weight="bold" fill="#b91c1c">STATUS: DFM LOOP 1</text>
  </g>

  <!-- VIEW 1: FRONT ELEVATION -->
  <g id="front-elevation">
    <text x="220" y="85" font-size="13" font-weight="bold" fill="#0f172a">VIEW 1: FRONT ELEVATION</text>
    <text x="220" y="100" font-size="10" fill="#64748b">SCALE 1:1</text>
    
    <!-- Outer Profile -->
    <rect x="120" y="130" width="220" height="180" rx="8" fill="#f1f5f9" stroke="#0f172a" stroke-width="2.5"/>
    
    <!-- Flange mounting ears -->
    <rect x="80" y="170" width="40" height="100" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>
    <circle cx="100" cy="195" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <circle cx="100" cy="245" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>

    <rect x="340" y="170" width="40" height="100" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>
    <circle cx="360" cy="195" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <circle cx="360" cy="245" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>

    <!-- Central Bore on Front View -->
    <circle cx="230" cy="220" r="50" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <circle cx="230" cy="220" r="32" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.8" stroke-dasharray="4 2"/>
    
    <!-- Centerlines -->
    <line x1="160" y1="220" x2="300" y2="220" stroke="#dc2626" stroke-width="1" stroke-dasharray="12 3 3 3"/>
    <line x1="230" y1="150" x2="230" y2="290" stroke="#dc2626" stroke-width="1" stroke-dasharray="12 3 3 3"/>

    <!-- Reference Dimension: Width (220.0) REF -->
    <line x1="120" y1="120" x2="340" y2="120" stroke="#64748b" stroke-width="1.2" marker-start="url(#arrowRevA)" marker-end="url(#arrowRevA)"/>
    <text x="230" y="115" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">(220.0) REF</text>
    
    <!-- Dimension: Bore Diameter Ø64 H6 (Original tight tolerance) -->
    <line x1="230" y1="220" x2="310" y2="160" stroke="#1e293b" stroke-width="1.2" marker-start="url(#arrowRevA)"/>
    <text x="315" y="158" font-size="11" font-weight="bold" fill="#b91c1c">Ø 64.0 H6 (+0.016 / 0)</text>
  </g>

  <!-- VIEW 2: SECTION A-A -->
  <g id="section-a-a">
    <text x="560" y="85" font-size="13" font-weight="bold" fill="#0f172a">VIEW 2: SECTION A-A</text>
    <text x="560" y="100" font-size="10" fill="#64748b">INTERNAL CAVITY</text>
    
    <!-- Section Cut Body with Hatching -->
    <path d="M 460 140 L 700 140 L 700 300 L 460 300 Z" fill="url(#hatchA)" stroke="#0f172a" stroke-width="2"/>
    
    <!-- Internal Stepped Cavity -->
    <path d="M 490 140 L 490 200 L 530 200 L 530 270 L 630 270 L 630 200 L 670 200 L 670 140 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    
    <!-- Sharp Corners (Tooling issue in Rev A) -->
    <circle cx="530" cy="270" r="3" fill="#ef4444"/>
    <circle cx="630" cy="270" r="3" fill="#ef4444"/>
    <text x="645" y="265" font-size="10" font-weight="bold" fill="#dc2626">R 0.5 (SHARP BLIND)</text>

    <!-- Wall Thickness Callout (1.8mm thin wall concern) -->
    <line x1="460" y1="230" x2="490" y2="230" stroke="#dc2626" stroke-width="1.5" marker-start="url(#arrowRevARed)" marker-end="url(#arrowRevARed)"/>
    <text x="475" y="222" font-size="10" font-weight="bold" fill="#dc2626" text-anchor="middle">1.8 ± 0.08</text>

    <!-- Depth 160mm dimension -->
    <line x1="720" y1="140" x2="720" y2="300" stroke="#1e293b" stroke-width="1.2" marker-start="url(#arrowRevA)" marker-end="url(#arrowRevA)"/>
    <text x="735" y="225" font-size="11" font-weight="bold" fill="#1e293b">160.0 ± 0.15</text>
  </g>

  <!-- VIEW 3: BOTTOM MOUNTING BOSSES -->
  <g id="view-bottom" transform="translate(100, 390)">
    <text x="120" y="30" font-size="13" font-weight="bold" fill="#0f172a">VIEW 3: ACTUATOR MOUNTING PAD</text>
    
    <rect x="60" y="65" width="220" height="110" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
    
    <!-- Recessed Counterbores -->
    <circle cx="110" cy="120" r="18" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5"/>
    <circle cx="110" cy="120" r="9" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    <circle cx="230" cy="120" r="18" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5"/>
    <circle cx="230" cy="120" r="9" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    
    <!-- Surface finish symbol -->
    <path d="M 40 100 L 50 125 L 70 125" fill="none" stroke="#0f172a" stroke-width="1.5"/>
    <text x="46" y="95" font-size="10" font-weight="bold" fill="#b91c1c">Ra 0.4 µm (GRIND)</text>
    
    <text x="170" y="165" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">2x M8x1.25 - 6H THRU</text>
  </g>

  <!-- Watermark: REV 0.1 -->
  <text x="450" y="650" font-size="34" font-weight="bold" fill="#fecaca" opacity="0.6">REV 0.1 (INITIAL DFM LOOP)</text>
</svg>`;

export const SAMPLE_DRAWING_REV_B_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%" style="background-color: #f8fafc; font-family: monospace, sans-serif;">
  <defs>
    <pattern id="gridRevB" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="0.75"/>
    </pattern>
    <marker id="arrowRevB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b"/>
    </marker>
    <marker id="arrowRevBGreen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#15803d"/>
    </marker>
    <pattern id="hatchB" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#cbd5e1" stroke-width="1.5" />
    </pattern>
  </defs>

  <!-- Background Grid -->
  <rect width="100%" height="100%" fill="#ffffff" />
  <rect width="100%" height="100%" fill="url(#gridRevB)" />

  <!-- Drawing Border & Title Block -->
  <rect x="30" y="30" width="1140" height="740" fill="none" stroke="#0f172a" stroke-width="2.5"/>
  <rect x="40" y="40" width="1120" height="720" fill="none" stroke="#334155" stroke-width="1.5"/>

  <!-- Title Block Bottom Right -->
  <g transform="translate(780, 640)">
    <rect x="0" y="0" width="380" height="120" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
    <line x1="0" y1="30" x2="380" y2="30" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="0" y1="60" x2="380" y2="60" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="0" y1="90" x2="380" y2="90" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="200" y1="0" x2="200" y2="60" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="270" y1="60" x2="270" y2="120" stroke="#0f172a" stroke-width="1.5"/>
    
    <text x="10" y="20" font-size="11" font-weight="bold" fill="#0f172a">PART: VALVE ACTUATOR HOUSING</text>
    <text x="210" y="20" font-size="11" font-weight="bold" fill="#0f172a">DWG NO: AO-4820-D</text>
    <text x="10" y="50" font-size="10" fill="#475569">STAGE: TOOLING DFM LOOP 2</text>
    <text x="210" y="50" font-size="12" font-weight="bold" fill="#0284c7">REVISION: REV 0.2</text>
    <text x="10" y="80" font-size="9" fill="#475569">ECN: ECN-2026-084</text>
    <text x="280" y="80" font-size="9" fill="#475569">UNITS: mm [METRIC]</text>
    <text x="10" y="108" font-size="9" fill="#475569">GEN. TOL: ISO 2768-mK</text>
    <text x="280" y="108" font-size="9" font-weight="bold" fill="#15803d">STATUS: DFM LOOP 2</text>
  </g>

  <!-- VIEW 1: FRONT ELEVATION (UPDATED WITH RELAXED BORE H7) -->
  <g id="front-elevation-b">
    <text x="220" y="85" font-size="13" font-weight="bold" fill="#0f172a">VIEW 1: FRONT ELEVATION [REV 0.2]</text>
    <text x="220" y="100" font-size="10" fill="#15803d">RELAXED TOLERANCE APPLIED</text>
    
    <rect x="120" y="130" width="220" height="180" rx="8" fill="#f1f5f9" stroke="#0f172a" stroke-width="2.5"/>
    
    <!-- Ears -->
    <rect x="80" y="170" width="40" height="100" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>
    <circle cx="100" cy="195" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <circle cx="100" cy="245" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>

    <rect x="340" y="170" width="40" height="100" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>
    <circle cx="360" cy="195" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <circle cx="360" cy="245" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>

    <!-- Central Bore on Front View -->
    <circle cx="230" cy="220" r="50" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <circle cx="230" cy="220" r="32" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.8" stroke-dasharray="4 2"/>
    
    <!-- Centerlines -->
    <line x1="160" y1="220" x2="300" y2="220" stroke="#dc2626" stroke-width="1" stroke-dasharray="12 3 3 3"/>
    <line x1="230" y1="150" x2="230" y2="290" stroke="#dc2626" stroke-width="1" stroke-dasharray="12 3 3 3"/>

    <!-- Reference Dimension: Width (220.0) REF -->
    <line x1="120" y1="120" x2="340" y2="120" stroke="#64748b" stroke-width="1.2" marker-start="url(#arrowRevB)" marker-end="url(#arrowRevB)"/>
    <text x="230" y="115" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">(220.0) REF</text>
    
    <!-- UPDATED: Bore Diameter Ø64 H7 (Relaxed from H6 as requested by AO!) -->
    <line x1="230" y1="220" x2="310" y2="160" stroke="#15803d" stroke-width="1.5" marker-start="url(#arrowRevBGreen)"/>
    <rect x="310" y="145" width="165" height="20" fill="#dcfce7" stroke="#15803d" stroke-width="1"/>
    <text x="315" y="159" font-size="11" font-weight="bold" fill="#15803d">Ø 64.0 H7 (+0.030 / 0) [OK]</text>
  </g>

  <!-- VIEW 2: SECTION A-A [REV 0.2] -->
  <g id="section-a-a-b">
    <text x="560" y="85" font-size="13" font-weight="bold" fill="#0f172a">VIEW 2: SECTION A-A [REV 0.2]</text>
    <text x="560" y="100" font-size="10" fill="#15803d">INCREASED RADIUS R2.5 &amp; WALL 2.4mm</text>
    
    <!-- Section Cut Body -->
    <path d="M 460 140 L 700 140 L 700 300 L 460 300 Z" fill="url(#hatchB)" stroke="#0f172a" stroke-width="2"/>
    
    <!-- Internal Stepped Cavity - UPDATED with Radiused Corners R2.5 -->
    <path d="M 490 140 L 490 200 L 530 200 Q 532 265 538 270 L 622 270 Q 628 265 630 200 L 670 200 L 670 140 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    
    <!-- Corner Radius R2.5 (Fixed) -->
    <circle cx="536" cy="265" r="5" fill="#22c55e" opacity="0.3"/>
    <rect x="640" y="252" width="95" height="18" fill="#dcfce7" stroke="#15803d" stroke-width="1"/>
    <text x="645" y="265" font-size="10" font-weight="bold" fill="#15803d">R 2.50 (TOOLING OK)</text>

    <!-- Wall Thickness Callout (Increased from 1.8mm to 2.4mm as requested by AO!) -->
    <line x1="454" y1="230" x2="490" y2="230" stroke="#15803d" stroke-width="1.5" marker-start="url(#arrowRevBGreen)" marker-end="url(#arrowRevBGreen)"/>
    <rect x="440" y="212" width="70" height="16" fill="#dcfce7" stroke="#15803d" stroke-width="1"/>
    <text x="475" y="224" font-size="10" font-weight="bold" fill="#15803d" text-anchor="middle">2.4 ± 0.15</text>
  </g>

  <!-- VIEW 3: BOTTOM MOUNTING BOSSES [REV 0.2] -->
  <g id="view-bottom-b" transform="translate(100, 390)">
    <text x="120" y="30" font-size="13" font-weight="bold" fill="#0f172a">VIEW 3: ACTUATOR MOUNTING PAD [REV 0.2]</text>
    
    <rect x="60" y="65" width="220" height="110" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
    
    <circle cx="110" cy="120" r="18" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5"/>
    <circle cx="110" cy="120" r="9" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    <circle cx="230" cy="120" r="18" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5"/>
    <circle cx="230" cy="120" r="9" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    
    <!-- Surface finish relaxed from Ra 0.4 to Ra 0.8 -->
    <path d="M 40 100 L 50 125 L 70 125" fill="none" stroke="#15803d" stroke-width="1.5"/>
    <rect x="44" y="82" width="110" height="16" fill="#dcfce7" stroke="#15803d" stroke-width="1"/>
    <text x="48" y="94" font-size="10" font-weight="bold" fill="#15803d">Ra 0.8 µm (MILL)</text>
  </g>

  <!-- Watermark: REV 0.2 -->
  <text x="450" y="650" font-size="34" font-weight="bold" fill="#bfdbfe" opacity="0.6">REV 0.2 (DFM LOOP 2 - REVISED)</text>
</svg>`;
