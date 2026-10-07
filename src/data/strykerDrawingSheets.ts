/**
 * High-Fidelity Vector Drawings for Stryker 4938-5-004 (Rev AC)
 * HLRF Drill Bit - Sheets 1, 2, and 3
 * Matches the MBDVidia drawing layout, title blocks, and dimensions.
 */

export const STRYKER_SHEET_1_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1130" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI', Arial, sans-serif;">
  <defs>
    <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" stroke-width="0.5"/>
    </pattern>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0f172a" />
    </marker>
    <marker id="arrowRed" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#dc2626" />
    </marker>
  </defs>

  <rect width="1600" height="1130" fill="url(#gridPattern)" />

  <!-- Outer Drawing Border (A3 Standard) -->
  <rect x="25" y="25" width="1550" height="1080" fill="none" stroke="#0f172a" stroke-width="3" />
  <rect x="40" y="40" width="1520" height="1050" fill="none" stroke="#0f172a" stroke-width="1.5" />

  <!-- Drawing Header -->
  <text x="50" y="32" font-size="13" font-weight="bold" fill="#1e293b">Document Number: 4938-5-004</text>
  <text x="1100" y="32" font-size="13" font-weight="bold" fill="#1e293b">Windchill Revision: AC  State: Design Released</text>

  <!-- Zones (A, B, C, D / 1, 2, 3, 4) -->
  <g font-size="12" font-weight="bold" fill="#64748b" text-anchor="middle">
    <!-- Top & Bottom Numbers -->
    <text x="420" y="36">4</text><text x="800" y="36">3</text><text x="1180" y="36">2</text><text x="1540" y="36">1</text>
    <text x="420" y="1075">4</text><text x="800" y="1075">3</text><text x="1180" y="1075">2</text><text x="1540" y="1075">1</text>
    <!-- Left & Right Letters -->
    <text x="32" y="180">D</text><text x="32" y="440">C</text><text x="32" y="700">B</text><text x="32" y="960">A</text>
    <text x="1568" y="180">D</text><text x="1568" y="440">C</text><text x="1568" y="700">B</text><text x="1568" y="960">A</text>
  </g>

  <!-- Zone dividers -->
  <line x1="420" y1="25" x2="420" y2="40" stroke="#0f172a" stroke-width="1.5" />
  <line x1="800" y1="25" x2="800" y2="40" stroke="#0f172a" stroke-width="1.5" />
  <line x1="1180" y1="25" x2="1180" y2="40" stroke="#0f172a" stroke-width="1.5" />
  <line x1="25" y1="300" x2="40" y2="300" stroke="#0f172a" stroke-width="1.5" />
  <line x1="25" y1="560" x2="40" y2="560" stroke="#0f172a" stroke-width="1.5" />
  <line x1="25" y1="830" x2="40" y2="830" stroke="#0f172a" stroke-width="1.5" />

  <!-- MAIN DRILL BIT ELEVATION (ZONE D4 to D1) -->
  <g transform="translate(0, 0)">
    <!-- Center line -->
    <line x1="120" y1="260" x2="1480" y2="260" stroke="#ef4444" stroke-width="1" stroke-dasharray="14 4 3 4" opacity="0.75" />

    <!-- Drill Tip Profile (Left) -->
    <path d="M 120 260 L 155 230 L 175 230 L 180 235 L 210 235" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 120 260 L 155 290 L 175 290 L 180 285 L 210 285" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 155 230 L 155 290" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3" />

    <!-- Fluted Body (Helical Representation) -->
    <path d="M 210 235 L 680 235" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 210 285 L 680 285" fill="none" stroke="#0f172a" stroke-width="2.5" />
    
    <!-- Flute Helical lines -->
    <path d="M 230 235 C 280 250, 310 285, 360 285" fill="none" stroke="#334155" stroke-width="1.8" />
    <path d="M 330 235 C 380 250, 410 285, 460 285" fill="none" stroke="#334155" stroke-width="1.8" />
    <path d="M 430 235 C 480 250, 510 285, 560 285" fill="none" stroke="#334155" stroke-width="1.8" />
    <path d="M 530 235 C 580 250, 610 285, 660 285" fill="none" stroke="#334155" stroke-width="1.8" />

    <!-- Electropolish Area Hatch Pattern Callout -->
    <rect x="210" y="236" width="470" height="48" fill="#38bdf8" fill-opacity="0.08" stroke="#0284c7" stroke-width="0.5" stroke-dasharray="2 2" />
    <text x="320" y="215" font-size="12" font-weight="bold" fill="#0284c7">Electropolish Area shown (See Note 3)</text>

    <!-- Transition Shank Taper -->
    <path d="M 680 235 L 730 220 L 980 220" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 680 285 L 730 300 L 980 300" fill="none" stroke="#0f172a" stroke-width="2.5" />

    <!-- Central Precision Shank Ø6.15 -->
    <path d="M 980 210 L 1260 210" fill="none" stroke="#0f172a" stroke-width="3" />
    <path d="M 980 310 L 1260 310" fill="none" stroke="#0f172a" stroke-width="3" />
    <line x1="980" y1="210" x2="980" y2="310" stroke="#0f172a" stroke-width="2" />

    <!-- Shank Step Neck & Locking Groove -->
    <path d="M 1260 210 L 1280 218 L 1320 218 L 1330 210 L 1400 210 L 1400 230 L 1450 230 L 1450 290 L 1400 290 L 1400 310 L 1330 310 L 1320 302 L 1280 302 L 1260 310" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <!-- Drive end flat notch -->
    <rect x="1420" y="235" width="25" height="50" fill="#f8fafc" stroke="#0f172a" stroke-width="1.8" />
    <line x1="1445" y1="220" x2="1445" y2="300" stroke="#0f172a" stroke-width="2" />

    <!-- Dimension Lines on Elevation -->
    <!-- Dim: EP +/- 3 -->
    <line x1="210" y1="90" x2="680" y2="90" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="210" y1="80" x2="210" y2="235" stroke="#64748b" stroke-width="0.8" />
    <line x1="680" y1="80" x2="680" y2="235" stroke="#64748b" stroke-width="0.8" />
    <text x="445" y="82" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">EP ± 3</text>

    <!-- Dim: 50.8 +/- 1 -->
    <line x1="480" y1="285" x2="680" y2="285" stroke="#64748b" stroke-width="0.8" />
    <line x1="480" y1="270" x2="680" y2="270" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="580" y="265" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">50,8 ± 1</text>

    <!-- Dim: T +/- 0.5 -->
    <line x1="480" y1="240" x2="680" y2="240" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="580" y="235" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">T ± 0,5</text>

    <!-- Dim: Ø6.15 +/- 0.035 -->
    <line x1="1000" y1="190" x2="1000" y2="330" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="1005" y="270" font-size="14" font-weight="bold" fill="#0f172a" transform="rotate(-90 1005 270)">Ø 6,15 ±0,035 E</text>

    <!-- GD&T Feature Control Frame: Runout [ 0.035 E | A ] -->
    <g transform="translate(940, 140)">
      <rect x="0" y="0" width="130" height="28" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
      <line x1="30" y1="0" x2="30" y2="28" stroke="#0f172a" stroke-width="1.2" />
      <line x1="95" y1="0" x2="95" y2="28" stroke="#0f172a" stroke-width="1.2" />
      <!-- Runout Symbol -->
      <path d="M 8 20 L 18 8 L 22 12" fill="none" stroke="#0f172a" stroke-width="1.5" />
      <text x="35" y="19" font-size="13" font-weight="bold" fill="#0f172a">0,035 (E)</text>
      <text x="108" y="19" font-size="13" font-weight="bold" fill="#0f172a">A</text>
      <!-- Leader line pointing to Ø6.15 -->
      <line x1="65" y1="28" x2="65" y2="70" stroke="#0f172a" stroke-width="1.2" marker-end="url(#arrow)" />
    </g>

    <!-- Datum A Feature Symbol -->
    <g transform="translate(1000, 390)">
      <rect x="0" y="0" width="30" height="28" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
      <text x="9" y="20" font-size="15" font-weight="bold" fill="#0f172a">A</text>
      <line x1="15" y1="0" x2="15" y2="-40" stroke="#0f172a" stroke-width="1.5" />
      <polygon points="5,-40 25,-40 15,-50" fill="#0f172a" />
    </g>

    <!-- Shank Length Dims: 24+/-1, 29+/-0.5, 26+/-0.5, 17.5+/-1, 14.5+/-0.5, 2.5+/-0.5 -->
    <!-- 24 +/- 1 -->
    <line x1="1260" y1="80" x2="1400" y2="80" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="1330" y="72" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">24 ± 1</text>
    <line x1="1260" y1="70" x2="1260" y2="210" stroke="#64748b" stroke-width="0.8" />
    <line x1="1400" y1="70" x2="1400" y2="210" stroke="#64748b" stroke-width="0.8" />

    <!-- 29 +/- 0.5 -->
    <line x1="1280" y1="240" x2="1450" y2="240" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="1365" y="232" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">29 ± 0,5</text>

    <!-- 26 +/- 0.5 -->
    <line x1="1280" y1="275" x2="1420" y2="275" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="1350" y="268" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">26 ± 0,5</text>

    <!-- 17.5 +/- 1 -->
    <line x1="1450" y1="180" x2="1520" y2="180" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="1465" y="172" font-size="13" font-weight="bold" fill="#0f172a">17,5 ± 1</text>

    <!-- 14.5 +/- 0.5 -->
    <line x1="1450" y1="460" x2="1520" y2="460" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="1465" y="452" font-size="13" font-weight="bold" fill="#0f172a">14,5 ± 0,5</text>

    <!-- 2.5 +/- 0.5 -->
    <line x1="1400" y1="520" x2="1440" y2="520" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="1465" y="522" font-size="13" font-weight="bold" fill="#0f172a">2,5 ± 0,5</text>

    <!-- Overall Length L +/- 0.5 -->
    <line x1="120" y1="450" x2="1450" y2="450" stroke="#0f172a" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="120" y1="260" x2="120" y2="465" stroke="#64748b" stroke-width="0.8" />
    <line x1="1450" y1="290" x2="1450" y2="465" stroke="#64748b" stroke-width="0.8" />
    <text x="785" y="442" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">L ± 0,5</text>

    <!-- Reduced Shank F +/- 0.2 -->
    <line x1="210" y1="400" x2="730" y2="400" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="470" y="392" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">F ± 0,2</text>
  </g>

  <!-- SECTION A-A DETAIL (ZONE C4) -->
  <g transform="translate(140, 360)">
    <circle cx="80" cy="80" r="45" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
    <circle cx="80" cy="80" r="32" fill="#ffffff" stroke="#0f172a" stroke-width="1.8" stroke-dasharray="2 2" />
    <!-- Flute Cross Section Web -->
    <path d="M 45 65 Q 80 75 115 65 L 115 95 Q 80 85 45 95 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5" />
    <text x="80" y="150" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">A-A (5:1)</text>
    <text x="140" y="70" font-size="12" font-weight="bold" fill="#0f172a">WT ±0,075</text>
    <text x="140" y="100" font-size="12" fill="#64748b">(LW)</text>
    <text x="35" y="70" font-size="12" fill="#64748b">CD</text>
  </g>

  <!-- GENERAL DRAWING NOTES (ZONE B3) -->
  <g transform="translate(480, 710)">
    <rect x="-10" y="-15" width="460" height="95" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
    <text x="0" y="0" font-size="12" font-weight="bold" fill="#0f172a">NOTES:</text>
    <text x="0" y="18" font-size="11" font-weight="bold" fill="#0f172a">1. CUTTING EDGES MUST BE SHARP AND FREE OF BURRS.</text>
    <text x="0" y="34" font-size="11" fill="#1e293b">2. REPRESENTATION OF DRILL HELIX NOT BINDING.</text>
    <text x="18" y="48" font-size="11" fill="#1e293b">SEE TABLE FOR FURTHER DETAILS.</text>
    <text x="0" y="66" font-size="11" font-weight="bold" fill="#0284c7">3. ELECTROPOLISH BEFORE MICROGLASS BLAST</text>
  </g>

  <!-- SURFACE FINISH & PROCESS SPECIFICATIONS (ZONE B2/B1) -->
  <g transform="translate(980, 750)">
    <text x="0" y="0" font-size="13" font-weight="bold" fill="#0f172a">Ra 1,6</text>
    <path d="M -15 -8 L 0 -22 L 20 -22" fill="none" stroke="#0f172a" stroke-width="1.5" />
    <text x="0" y="24" font-size="11" fill="#334155">Microglass blast, Lasermarked, Passivated per ASTM A967</text>
    <text x="320" y="0" font-size="13" font-weight="bold" fill="#0284c7">= Ra 0,8 (Electropolish)</text>
  </g>

  <!-- LASERMARKING SPECIFICATION BOX (ZONE C1/B1) -->
  <g transform="translate(1120, 520)">
    <rect x="0" y="0" width="280" height="95" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
    <text x="10" y="20" font-size="12" font-weight="bold" fill="#0f172a">Lasermarking: Ø W</text>
    <text x="10" y="38" font-size="12" fill="#0f172a">Height: 2,0 ± 0,3</text>
    <text x="10" y="56" font-size="12" fill="#0f172a">Arial Font, Filled Black</text>
    <text x="10" y="78" font-size="11" fill="#64748b">Lasermarking as shown (Height: 2,5 ± 0,3)</text>
  </g>

  <!-- CONFIGURATION TABLE (ZONE A4 to A2) -->
  <g transform="translate(45, 600)">
    <rect x="0" y="0" width="375" height="465" fill="#ffffff" stroke="#0f172a" stroke-width="1.8" />
    
    <!-- Table Header Rows -->
    <line x1="0" y1="26" x2="375" y2="26" stroke="#0f172a" stroke-width="1.2" />
    <line x1="0" y1="52" x2="375" y2="52" stroke="#0f172a" stroke-width="1.2" />
    <line x1="0" y1="78" x2="375" y2="78" stroke="#0f172a" stroke-width="1.2" />
    <line x1="0" y1="104" x2="375" y2="104" stroke="#0f172a" stroke-width="1.2" />
    <line x1="0" y1="130" x2="375" y2="130" stroke="#0f172a" stroke-width="1.2" />
    <line x1="0" y1="156" x2="375" y2="156" stroke="#0f172a" stroke-width="1.2" />
    <line x1="0" y1="182" x2="375" y2="182" stroke="#0f172a" stroke-width="1.2" />
    <line x1="0" y1="208" x2="375" y2="208" stroke="#0f172a" stroke-width="1.2" />
    <line x1="0" y1="234" x2="375" y2="234" stroke="#0f172a" stroke-width="1.2" />
    <line x1="0" y1="260" x2="375" y2="260" stroke="#0f172a" stroke-width="1.5" />
    
    <line x1="200" y1="0" x2="200" y2="260" stroke="#0f172a" stroke-width="1.2" />

    <text x="8" y="18" font-size="11" font-weight="bold" fill="#0f172a">Cutting direction</text>
    <text x="210" y="18" font-size="11" font-weight="bold" fill="#0f172a">Right</text>

    <text x="8" y="44" font-size="11" font-weight="bold" fill="#0f172a">Number of cutting edges</text>
    <text x="210" y="44" font-size="11" font-weight="bold" fill="#0f172a">2</text>

    <text x="8" y="70" font-size="11" font-weight="bold" fill="#0f172a">Helix angle</text>
    <text x="210" y="70" font-size="11" font-weight="bold" fill="#0f172a">14° ± 2°</text>

    <text x="8" y="96" font-size="11" font-weight="bold" fill="#0f172a">Tip angle</text>
    <text x="210" y="96" font-size="11" font-weight="bold" fill="#0f172a">90° ± 5°</text>

    <text x="8" y="122" font-size="11" fill="#0f172a">Primary relief angle on tip</text>
    <text x="210" y="122" font-size="11" fill="#0f172a">30° ± 5°</text>

    <text x="8" y="148" font-size="11" fill="#0f172a">Step relief angle</text>
    <text x="210" y="148" font-size="11" fill="#0f172a">15° ± 5°</text>

    <text x="8" y="174" font-size="11" fill="#0f172a">Clearance diameter</text>
    <text x="210" y="174" font-size="11" fill="#0f172a">CD ± 0,1</text>

    <text x="8" y="200" font-size="11" fill="#0f172a">Land width</text>
    <text x="210" y="200" font-size="11" fill="#0f172a">LW</text>

    <text x="8" y="226" font-size="11" fill="#0f172a">Web thickness at tip</text>
    <text x="210" y="226" font-size="11" fill="#0f172a">WT ± 0,075</text>

    <text x="8" y="252" font-size="11" fill="#0f172a">Margin</text>
    <text x="210" y="252" font-size="11" fill="#0f172a">M</text>

    <!-- Part Numbers Grid -->
    <rect x="0" y="260" width="375" height="20" fill="#f1f5f9" stroke="#0f172a" stroke-width="1" />
    <text x="5" y="274" font-size="10" font-weight="bold" fill="#0f172a">PART NO.</text>
    <text x="75" y="274" font-size="10" font-weight="bold" fill="#0f172a">CD</text>
    <text x="105" y="274" font-size="10" font-weight="bold" fill="#0f172a">COLOR</text>
    <text x="150" y="274" font-size="10" font-weight="bold" fill="#0f172a">D</text>
    <text x="180" y="274" font-size="10" font-weight="bold" fill="#0f172a">EP</text>
    <text x="205" y="274" font-size="10" font-weight="bold" fill="#0f172a">F</text>
    <text x="230" y="274" font-size="10" font-weight="bold" fill="#0f172a">L</text>
    <text x="260" y="274" font-size="10" font-weight="bold" fill="#0f172a">M</text>
    <text x="285" y="274" font-size="10" font-weight="bold" fill="#0f172a">T</text>
    <text x="310" y="274" font-size="10" font-weight="bold" fill="#0f172a">WT</text>

    <!-- Row 1: 4938-5-004 -->
    <line x1="0" y1="305" x2="375" y2="305" stroke="#cbd5e1" stroke-width="0.8" />
    <text x="5" y="300" font-size="10" font-weight="bold" fill="#0284c7">4938-5-004</text>
    <text x="75" y="300" font-size="10" fill="#0f172a">2,7</text>
    <text x="105" y="300" font-size="10" fill="#2563eb">Blue</text>
    <text x="150" y="300" font-size="10" fill="#0f172a">0,40</text>
    <text x="180" y="300" font-size="10" fill="#0f172a">53</text>
    <text x="205" y="300" font-size="10" fill="#0f172a">54</text>
    <text x="230" y="300" font-size="10" fill="#0f172a">170</text>
    <text x="260" y="300" font-size="10" fill="#64748b">(0,35)</text>
    <text x="285" y="300" font-size="10" fill="#0f172a">60</text>
    <text x="310" y="300" font-size="10" fill="#0f172a">0,6</text>

    <!-- Row 2: 4938-5-005 -->
    <line x1="0" y1="330" x2="375" y2="330" stroke="#cbd5e1" stroke-width="0.8" />
    <text x="5" y="325" font-size="10" font-weight="bold" fill="#eab308">4938-5-005</text>
    <text x="75" y="325" font-size="10" fill="#0f172a">3,7</text>
    <text x="105" y="325" font-size="10" fill="#ca8a04">Yellow</text>
    <text x="150" y="325" font-size="10" fill="#0f172a">0,47</text>
    <text x="180" y="325" font-size="10" fill="#0f172a">55</text>
    <text x="205" y="325" font-size="10" fill="#0f172a">56</text>
    <text x="230" y="325" font-size="10" fill="#0f172a">170</text>
    <text x="260" y="325" font-size="10" fill="#64748b">(0,50)</text>
    <text x="285" y="325" font-size="10" fill="#0f172a">60</text>
    <text x="310" y="325" font-size="10" fill="#0f172a">0,8</text>

    <!-- Row 3: 4938-5-006 -->
    <line x1="0" y1="355" x2="375" y2="355" stroke="#cbd5e1" stroke-width="0.8" />
    <text x="5" y="350" font-size="10" font-weight="bold" fill="#dc2626">4938-5-006</text>
    <text x="75" y="350" font-size="10" fill="#0f172a">4,7</text>
    <text x="105" y="350" font-size="10" fill="#dc2626">Red</text>
    <text x="150" y="350" font-size="10" fill="#0f172a">0,54</text>
    <text x="180" y="350" font-size="10" fill="#0f172a">57</text>
    <text x="205" y="350" font-size="10" fill="#0f172a">58</text>
    <text x="230" y="350" font-size="10" fill="#0f172a">170</text>
    <text x="260" y="350" font-size="10" fill="#64748b">(0,65)</text>
    <text x="285" y="350" font-size="10" fill="#0f172a">60</text>
    <text x="310" y="350" font-size="10" fill="#0f172a">1,0</text>
  </g>

  <!-- STAMP TITLE BLOCK (ZONE A1) -->
  <g transform="translate(1220, 830)">
    <rect x="0" y="0" width="340" height="235" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
    <!-- Stryker logo text -->
    <text x="170" y="45" font-size="28" font-weight="900" letter-spacing="1" fill="#0f172a" text-anchor="middle">stryker</text>
    <line x1="0" y1="65" x2="340" y2="65" stroke="#0f172a" stroke-width="1.2" />

    <text x="15" y="80" font-size="10" fill="#64748b">TITLE</text>
    <text x="15" y="105" font-size="18" font-weight="bold" fill="#0f172a">HLRF Drill Bit</text>

    <line x1="0" y1="125" x2="340" y2="125" stroke="#0f172a" stroke-width="1.2" />
    <line x1="80" y1="125" x2="80" y2="175" stroke="#0f172a" stroke-width="1" />
    <line x1="260" y1="125" x2="260" y2="175" stroke="#0f172a" stroke-width="1" />

    <text x="15" y="142" font-size="10" fill="#64748b">SHEET</text>
    <text x="22" y="162" font-size="13" font-weight="bold" fill="#0f172a">1 OF 3</text>

    <text x="95" y="142" font-size="10" fill="#64748b">DRAWING NUMBER</text>
    <text x="110" y="162" font-size="16" font-weight="bold" fill="#0f172a">4938-5-004</text>

    <text x="280" y="142" font-size="10" fill="#64748b">REV</text>
    <text x="290" y="162" font-size="16" font-weight="bold" fill="#0284c7">AC</text>

    <line x1="0" y1="175" x2="340" y2="175" stroke="#0f172a" stroke-width="1.2" />
    <text x="15" y="195" font-size="11" font-weight="bold" fill="#0f172a">MATERIAL: 07.04.026 / 1.4542</text>
    <text x="15" y="215" font-size="11" font-weight="bold" fill="#0f172a">HARDNESS: 40-48HRC (392-486HV10) H900</text>
  </g>
</svg>`;

export const STRYKER_SHEET_2_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1130" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI', Arial, sans-serif;">
  <defs>
    <pattern id="gridPattern2" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" stroke-width="0.5"/>
    </pattern>
    <marker id="arrow2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0f172a" />
    </marker>
  </defs>

  <rect width="1600" height="1130" fill="url(#gridPattern2)" />

  <!-- Outer Drawing Border -->
  <rect x="25" y="25" width="1550" height="1080" fill="none" stroke="#0f172a" stroke-width="3" />
  <rect x="40" y="40" width="1520" height="1050" fill="none" stroke="#0f172a" stroke-width="1.5" />

  <!-- Drawing Header -->
  <text x="50" y="32" font-size="13" font-weight="bold" fill="#1e293b">Document Number: 4938-5-004</text>
  <text x="1100" y="32" font-size="13" font-weight="bold" fill="#1e293b">Windchill Revision: AC  State: Design Released</text>

  <!-- Zones -->
  <g font-size="12" font-weight="bold" fill="#64748b" text-anchor="middle">
    <text x="420" y="36">4</text><text x="800" y="36">3</text><text x="1180" y="36">2</text><text x="1540" y="36">1</text>
    <text x="32" y="180">D</text><text x="32" y="440">C</text><text x="32" y="700">B</text><text x="32" y="960">A</text>
  </g>

  <!-- DETAIL X (5:1) - TIP GEOMETRY (ZONE D4/D3) -->
  <g transform="translate(160, 80)">
    <text x="180" y="30" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">X (5:1)</text>
    <!-- Point Profile -->
    <path d="M 50 180 L 160 120 L 260 120 L 290 140 L 400 140" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 50 180 L 160 240 L 260 240 L 290 220 L 400 220" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <line x1="160" y1="120" x2="160" y2="240" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3" />
    
    <!-- Chamfer 45 +/- 2.5 deg -->
    <path d="M 320 80 L 360 80" stroke="#0f172a" stroke-width="1.2" />
    <text x="330" y="70" font-size="13" font-weight="bold" fill="#0f172a">45° ± 2,5°</text>

    <!-- Reference Tip Angle (90 deg) [Auto-classified Reference] -->
    <path d="M 90 155 Q 70 180 90 205" fill="none" stroke="#0f172a" stroke-width="1.2" />
    <text x="115" y="185" font-size="13" font-weight="bold" fill="#64748b">(90°)</text>

    <!-- Pilot Diameter Ø 1.2 -->
    <text x="10" y="185" font-size="13" font-weight="bold" fill="#0f172a">Ø 1,2</text>
    <line x1="50" y1="160" x2="50" y2="200" stroke="#0f172a" stroke-width="1.2" />
  </g>

  <!-- 3 CONFIGURATIONS: 4938-5-004, 4938-5-005, 4938-5-006 -->
  <!-- Config 1: 4938-5-004 (Ø 3.05 +0.05/-0.05) -->
  <g transform="translate(100, 360)">
    <text x="10" y="55" font-size="14" font-weight="bold" fill="#0284c7">4938-5-004</text>
    <text x="120" y="35" font-size="13" font-weight="bold" fill="#0f172a">Ø 3,05 +0,05 / -0,05 (E)</text>
    <rect x="260" y="20" width="80" height="24" fill="#ffffff" stroke="#0f172a" stroke-width="1.2" />
    <text x="270" y="37" font-size="12" font-weight="bold" fill="#0f172a">0,3  A</text>
    
    <!-- Drill shaft representation -->
    <line x1="380" y1="50" x2="1100" y2="50" stroke="#0f172a" stroke-width="2.2" />
    <line x1="380" y1="65" x2="1100" y2="65" stroke="#0f172a" stroke-width="2.2" />
    <!-- Scale depth markings 10, 20, 30, 40, 50, 60 -->
    <g font-size="10" fill="#475569">
      <text x="750" y="45">10</text><text x="800" y="45">20</text><text x="850" y="45">30</text><text x="900" y="45">40</text><text x="950" y="45">50</text><text x="1000" y="45">60</text>
    </g>
  </g>

  <!-- Config 2: 4938-5-005 (Ø 4.05 +0.05/-0.05) -->
  <g transform="translate(100, 500)">
    <text x="10" y="55" font-size="14" font-weight="bold" fill="#eab308">4938-5-005</text>
    <text x="120" y="35" font-size="13" font-weight="bold" fill="#0f172a">Ø 4,05 +0,05 / -0,05 (E)</text>
    <rect x="260" y="20" width="80" height="24" fill="#ffffff" stroke="#0f172a" stroke-width="1.2" />
    <text x="270" y="37" font-size="12" font-weight="bold" fill="#0f172a">0,3  A</text>

    <line x1="380" y1="48" x2="1100" y2="48" stroke="#0f172a" stroke-width="2.8" />
    <line x1="380" y1="68" x2="1100" y2="68" stroke="#0f172a" stroke-width="2.8" />
    <g font-size="10" fill="#475569">
      <text x="750" y="42">10</text><text x="800" y="42">20</text><text x="850" y="42">30</text><text x="900" y="42">40</text><text x="950" y="42">50</text><text x="1000" y="42">60</text>
    </g>
  </g>

  <!-- Config 3: 4938-5-006 (Ø 5.05 +0.05/-0.05) -->
  <g transform="translate(100, 640)">
    <text x="10" y="55" font-size="14" font-weight="bold" fill="#dc2626">4938-5-006</text>
    <text x="120" y="35" font-size="13" font-weight="bold" fill="#0f172a">Ø 5,05 +0,05 / -0,05 (E)</text>
    <rect x="260" y="20" width="80" height="24" fill="#ffffff" stroke="#0f172a" stroke-width="1.2" />
    <text x="270" y="37" font-size="12" font-weight="bold" fill="#0f172a">0,3  A</text>

    <line x1="380" y1="46" x2="1100" y2="46" stroke="#0f172a" stroke-width="3.4" />
    <line x1="380" y1="72" x2="1100" y2="72" stroke="#0f172a" stroke-width="3.4" />
    <g font-size="10" fill="#475569">
      <text x="750" y="40">10</text><text x="800" y="40">20</text><text x="850" y="40">30</text><text x="900" y="40">40</text><text x="950" y="40">50</text><text x="1000" y="40">60</text>
    </g>
  </g>

  <!-- Working Lengths: 75+/-0.3 & 60+/-0.5 -->
  <line x1="480" y1="330" x2="780" y2="330" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow2)" marker-end="url(#arrow2)" />
  <text x="630" y="322" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">75 ± 0,3</text>

  <line x1="780" y1="330" x2="1000" y2="330" stroke="#0f172a" stroke-width="1.2" marker-start="url(#arrow2)" marker-end="url(#arrow2)" />
  <text x="890" y="322" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">60 ± 0,5</text>

  <!-- Non-cumulative scale markings text -->
  <text x="500" y="780" font-size="14" font-weight="bold" fill="#0f172a">(12x) 5 ± 0,2</text>
  <text x="500" y="800" font-size="12" fill="#475569">Dimensions are non-cumulative</text>

  <!-- DETAIL Y (5:1) SHANK END (ZONE D2/D1) -->
  <g transform="translate(1000, 100)">
    <rect x="0" y="0" width="380" height="200" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2" />
    <text x="190" y="30" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">Y (5:1)</text>
    <!-- Detailed Drive Profile -->
    <path d="M 50 60 L 150 60 L 170 75 L 230 75 L 240 60 L 320 60 L 320 160 L 240 160 L 230 145 L 170 145 L 150 160 L 50 160 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
    <text x="95" y="115" font-size="16" font-weight="bold" fill="#475569">106</text>
    <text x="180" y="50" font-size="13" font-weight="bold" fill="#0f172a">2 ± 0,2</text>
    <text x="28" y="115" font-size="13" font-weight="bold" fill="#0f172a">Ø 5,15</text>
    <text x="240" y="45" font-size="12" fill="#0f172a">R1,5 ± 0,5</text>
    <text x="280" y="140" font-size="11" fill="#0f172a">2x R0,05 Max</text>
  </g>

  <!-- DETAIL B1 (2:1) SCALE MARKS (ZONE A2/A1) -->
  <g transform="translate(1120, 650)">
    <rect x="0" y="0" width="220" height="150" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" />
    <text x="110" y="25" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">B1 (2:1)</text>
    <line x1="40" y1="45" x2="40" y2="125" stroke="#0f172a" stroke-width="2" />
    <line x1="100" y1="45" x2="100" y2="125" stroke="#0f172a" stroke-width="2" />
    <text x="35" y="90" font-size="14" font-weight="bold" fill="#0f172a" transform="rotate(-90 35 90)">30</text>
    <text x="95" y="90" font-size="14" font-weight="bold" fill="#0f172a" transform="rotate(-90 95 90)">40</text>
    <text x="145" y="70" font-size="12" fill="#64748b">(4,5) Typ Both Sides</text>
    <text x="120" y="125" font-size="12" font-weight="bold" fill="#0f172a">0,4 ± 0,15 Typ</text>
    <text x="120" y="142" font-size="10" fill="#475569">Lasermark Both Sides</text>
  </g>

  <!-- TITLE BLOCK (ZONE A1) -->
  <g transform="translate(1220, 830)">
    <rect x="0" y="0" width="340" height="235" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
    <text x="170" y="45" font-size="28" font-weight="900" fill="#0f172a" text-anchor="middle">stryker</text>
    <line x1="0" y1="65" x2="340" y2="65" stroke="#0f172a" stroke-width="1.2" />
    <text x="15" y="105" font-size="18" font-weight="bold" fill="#0f172a">HLRF Drill Bit</text>
    <line x1="0" y1="125" x2="340" y2="125" stroke="#0f172a" stroke-width="1.2" />
    <text x="22" y="162" font-size="13" font-weight="bold" fill="#0f172a">2 OF 3</text>
    <text x="110" y="162" font-size="16" font-weight="bold" fill="#0f172a">4938-5-004</text>
    <text x="290" y="162" font-size="16" font-weight="bold" fill="#0284c7">AC</text>
  </g>
</svg>`;

export const STRYKER_SHEET_3_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1130" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI', Arial, sans-serif;">
  <defs>
    <pattern id="gridPattern3" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" stroke-width="0.5"/>
    </pattern>
    <marker id="arrow3" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0f172a" />
    </marker>
  </defs>

  <rect width="1600" height="1130" fill="url(#gridPattern3)" />
  <rect x="25" y="25" width="1550" height="1080" fill="none" stroke="#0f172a" stroke-width="3" />
  <rect x="40" y="40" width="1520" height="1050" fill="none" stroke="#0f172a" stroke-width="1.5" />

  <text x="50" y="32" font-size="13" font-weight="bold" fill="#1e293b">Document Number: 4938-5-004</text>
  <text x="1100" y="32" font-size="13" font-weight="bold" fill="#1e293b">Windchill Revision: AC  State: Design Released</text>

  <!-- Zones -->
  <g font-size="12" font-weight="bold" fill="#64748b" text-anchor="middle">
    <text x="420" y="36">4</text><text x="800" y="36">3</text><text x="1180" y="36">2</text><text x="1540" y="36">1</text>
    <text x="32" y="180">D</text><text x="32" y="440">C</text><text x="32" y="700">B</text><text x="32" y="960">A</text>
  </g>

  <!-- LONG SERIES CONFIGURATIONS: 4938-7-004, 4938-7-005, 4938-7-006 -->
  <!-- Dimension 125 +/- 0.3 & 90 +/- 0.5 -->
  <line x1="380" y1="130" x2="880" y2="130" stroke="#0f172a" stroke-width="1.5" marker-start="url(#arrow3)" marker-end="url(#arrow3)" />
  <text x="630" y="122" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">125 ± 0,3</text>

  <line x1="880" y1="130" x2="1240" y2="130" stroke="#0f172a" stroke-width="1.5" marker-start="url(#arrow3)" marker-end="url(#arrow3)" />
  <text x="1060" y="122" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">90 ± 0,5</text>

  <!-- Config 4938-7-004 -->
  <g transform="translate(100, 240)">
    <text x="10" y="55" font-size="14" font-weight="bold" fill="#0284c7">4938-7-004</text>
    <text x="120" y="35" font-size="13" font-weight="bold" fill="#0f172a">Ø 3,05 +0,05 / -0,05 (E)</text>
    <rect x="260" y="20" width="80" height="24" fill="#ffffff" stroke="#0f172a" stroke-width="1.2" />
    <text x="270" y="37" font-size="12" font-weight="bold" fill="#0f172a">0,3  A</text>

    <line x1="360" y1="50" x2="1320" y2="50" stroke="#0f172a" stroke-width="2.2" />
    <line x1="360" y1="65" x2="1320" y2="65" stroke="#0f172a" stroke-width="2.2" />
    <g font-size="10" fill="#475569">
      <text x="900" y="45">10</text><text x="950" y="45">20</text><text x="1000" y="45">30</text><text x="1050" y="45">40</text><text x="1100" y="45">50</text><text x="1150" y="45">60</text><text x="1200" y="45">70</text><text x="1250" y="45">80</text>
    </g>
  </g>

  <!-- Config 4938-7-005 -->
  <g transform="translate(100, 420)">
    <text x="10" y="55" font-size="14" font-weight="bold" fill="#eab308">4938-7-005</text>
    <text x="120" y="35" font-size="13" font-weight="bold" fill="#0f172a">Ø 4,05 +0,05 / -0,05 (E)</text>
    <rect x="260" y="20" width="80" height="24" fill="#ffffff" stroke="#0f172a" stroke-width="1.2" />
    <text x="270" y="37" font-size="12" font-weight="bold" fill="#0f172a">0,3  A</text>

    <line x1="360" y1="48" x2="1320" y2="48" stroke="#0f172a" stroke-width="2.8" />
    <line x1="360" y1="68" x2="1320" y2="68" stroke="#0f172a" stroke-width="2.8" />
    <g font-size="10" fill="#475569">
      <text x="900" y="42">10</text><text x="950" y="42">20</text><text x="1000" y="42">30</text><text x="1050" y="42">40</text><text x="1100" y="42">50</text><text x="1150" y="42">60</text><text x="1200" y="42">70</text><text x="1250" y="42">80</text>
    </g>
  </g>

  <!-- Config 4938-7-006 -->
  <g transform="translate(100, 600)">
    <text x="10" y="55" font-size="14" font-weight="bold" fill="#dc2626">4938-7-006</text>
    <text x="120" y="35" font-size="13" font-weight="bold" fill="#0f172a">Ø 5,05 +0,05 / -0,05 (E)</text>
    <rect x="260" y="20" width="80" height="24" fill="#ffffff" stroke="#0f172a" stroke-width="1.2" />
    <text x="270" y="37" font-size="12" font-weight="bold" fill="#0f172a">0,3  A</text>

    <line x1="360" y1="46" x2="1320" y2="46" stroke="#0f172a" stroke-width="3.4" />
    <line x1="360" y1="72" x2="1320" y2="72" stroke="#0f172a" stroke-width="3.4" />
    <g font-size="10" fill="#475569">
      <text x="900" y="40">10</text><text x="950" y="40">20</text><text x="1000" y="40">30</text><text x="1050" y="40">40</text><text x="1100" y="40">50</text><text x="1150" y="40">60</text><text x="1200" y="40">70</text><text x="1250" y="40">80</text>
    </g>
  </g>

  <text x="650" y="710" font-size="14" font-weight="bold" fill="#0f172a">(18x) 5 ± 0,2 Dimensions are non-cumulative</text>

  <!-- DETAIL B2 (2:1) -->
  <g transform="translate(900, 780)">
    <rect x="0" y="0" width="220" height="150" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" />
    <text x="110" y="25" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">B2 (2:1)</text>
    <line x1="40" y1="45" x2="40" y2="125" stroke="#0f172a" stroke-width="2" />
    <line x1="100" y1="45" x2="100" y2="125" stroke="#0f172a" stroke-width="2" />
    <text x="35" y="90" font-size="14" font-weight="bold" fill="#0f172a" transform="rotate(-90 35 90)">50</text>
    <text x="95" y="90" font-size="14" font-weight="bold" fill="#0f172a" transform="rotate(-90 95 90)">60</text>
    <text x="145" y="70" font-size="12" fill="#64748b">(4,5) Typ Both Sides</text>
    <text x="120" y="125" font-size="12" font-weight="bold" fill="#0f172a">0,4 ± 0,15 Typ</text>
  </g>

  <!-- TITLE BLOCK -->
  <g transform="translate(1220, 830)">
    <rect x="0" y="0" width="340" height="235" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
    <text x="170" y="45" font-size="28" font-weight="900" fill="#0f172a" text-anchor="middle">stryker</text>
    <line x1="0" y1="65" x2="340" y2="65" stroke="#0f172a" stroke-width="1.2" />
    <text x="15" y="105" font-size="18" font-weight="bold" fill="#0f172a">HLRF Drill Bit</text>
    <line x1="0" y1="125" x2="340" y2="125" stroke="#0f172a" stroke-width="1.2" />
    <text x="22" y="162" font-size="13" font-weight="bold" fill="#0f172a">3 OF 3</text>
    <text x="110" y="162" font-size="16" font-weight="bold" fill="#0f172a">4938-5-004</text>
    <text x="290" y="162" font-size="16" font-weight="bold" fill="#0284c7">AC</text>
  </g>
</svg>`;
