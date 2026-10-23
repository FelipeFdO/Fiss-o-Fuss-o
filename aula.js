// ============================================================================
// APRESENTAÇÃO INTERATIVA & SIMULADORES — FISSÃO E FUSÃO NUCLEAR (aula.js)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. GERADOR DE QR CODE SVG NATIVO (ISO/IEC 18004 - Byte Mode, ECC Level L)
//    Funciona 100% offline e online, gerando SVG vetorial nítido para projetor
// ----------------------------------------------------------------------------
const QRGenerator = (() => {
  // GF(256) math for Reed-Solomon Error Correction (primitive polynomial 0x11d)
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

  function gfMul(a, b) {
    return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
  }

  function rsGeneratorPoly(degree) {
    let poly = new Uint8Array([1]);
    for (let i = 0; i < degree; i++) {
      const next = new Uint8Array(poly.length + 1);
      const root = EXP[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], root);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    const gen = rsGeneratorPoly(ecLen);
    const rem = new Uint8Array(ecLen);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ rem[0];
      rem.copyWithin(0, 1);
      rem[ecLen - 1] = 0;
      if (factor !== 0) {
        for (let j = 0; j < ecLen; j++) {
          rem[j] ^= gfMul(gen[j + 1], factor);
        }
      }
    }
    return rem;
  }

  // Version table for ECC Level L (versions 1 to 6, single block)
  const VERSIONS = [
    null,
    { size: 21, totalCodewords: 26, ecCodewords: 7, align: [] },
    { size: 25, totalCodewords: 44, ecCodewords: 10, align: [6, 18] },
    { size: 29, totalCodewords: 70, ecCodewords: 15, align: [6, 22] },
    { size: 33, totalCodewords: 100, ecCodewords: 20, align: [6, 26] },
    { size: 37, totalCodewords: 134, ecCodewords: 26, align: [6, 30] },
    { size: 41, totalCodewords: 172, ecCodewords: 18, blocks: 2, align: [6, 34] }
  ];

  function pickVersion(byteLen) {
    for (let v = 1; v <= 5; v++) {
      const cap = VERSIONS[v].totalCodewords - VERSIONS[v].ecCodewords - 2;
      if (byteLen <= cap) return v;
    }
    return 5;
  }

  function encodeData(text) {
    const bytes = new TextEncoder().encode(text);
    const ver = pickVersion(bytes.length);
    const info = VERSIONS[ver];
    const dataCwCount = info.totalCodewords - info.ecCodewords;

    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    };

    // Byte mode indicator (0100) + character count (8 bits for v1-9)
    pushBits(0b0100, 4);
    pushBits(bytes.length, 8);
    for (let i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);

    // Terminator
    const maxBits = dataCwCount * 8;
    for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const dataCodewords = new Uint8Array(dataCwCount);
    for (let i = 0; i < bits.length / 8; i++) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
      dataCodewords[i] = b;
    }

    const pads = [0xec, 0x11];
    let padIdx = 0;
    for (let i = bits.length / 8; i < dataCwCount; i++) {
      dataCodewords[i] = pads[padIdx % 2];
      padIdx++;
    }

    const ecCodewords = rsEncode(dataCodewords, info.ecCodewords);
    const allCodewords = new Uint8Array(info.totalCodewords);
    allCodewords.set(dataCodewords, 0);
    allCodewords.set(ecCodewords, dataCwCount);

    return { ver, info, allCodewords };
  }

  function buildMatrix(text) {
    const { info, allCodewords } = encodeData(text);
    const N = info.size;
    const grid = Array.from({ length: N }, () => new Int8Array(N)); // 0=unset, 1=white, 2=black
    const reserved = Array.from({ length: N }, () => new Uint8Array(N));

    const setModule = (r, c, dark, isFunc = true) => {
      if (r < 0 || r >= N || c < 0 || c >= N) return;
      grid[r][c] = dark ? 2 : 1;
      if (isFunc) reserved[r][c] = 1;
    };

    const drawFinder = (r0, c0) => {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const r = r0 + dr;
          const c = c0 + dc;
          if (r < 0 || r >= N || c < 0 || c >= N) continue;
          const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
          const onRing = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          setModule(r, c, inOuter && (onRing || inCore), true);
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, N - 7);
    drawFinder(N - 7, 0);

    // Timing patterns
    for (let i = 8; i < N - 8; i++) {
      setModule(6, i, i % 2 === 0, true);
      setModule(i, 6, i % 2 === 0, true);
    }

    // Alignment patterns
    if (info.align.length > 0) {
      for (const ar of info.align) {
        for (const ac of info.align) {
          if (
            (ar < 9 && ac < 9) ||
            (ar < 9 && ac > N - 10) ||
            (ar > N - 10 && ac < 9)
          ) {
            continue;
          }
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
              setModule(ar + dr, ac + dc, dark, true);
            }
          }
        }
      }
    }

    // Dark module & reserve format info areas
    setModule(N - 8, 8, true, true);
    for (let i = 0; i < 9; i++) {
      if (!reserved[8][i]) reserved[8][i] = 1;
      if (!reserved[i][8]) reserved[i][8] = 1;
    }
    for (let i = 0; i < 8; i++) {
      reserved[8][N - 1 - i] = 1;
      reserved[N - 1 - i][8] = 1;
    }

    // Place data bits in upward/downward 2-column zig-zag
    const dataBits = [];
    for (let i = 0; i < allCodewords.length; i++) {
      for (let b = 7; b >= 0; b--) dataBits.push((allCodewords[i] >> b) & 1);
    }

    let bitIdx = 0;
    let upward = true;
    for (let rightCol = N - 1; rightCol >= 1; rightCol -= 2) {
      if (rightCol === 6) rightCol = 5; // skip vertical timing column
      for (let step = 0; step < N; step++) {
        const r = upward ? N - 1 - step : step;
        for (let dc = 0; dc < 2; dc++) {
          const c = rightCol - dc;
          if (!reserved[r][c]) {
            const dark = bitIdx < dataBits.length ? dataBits[bitIdx++] === 1 : false;
            // Apply Mask 0: (r + c) % 2 === 0
            const maskedDark = (r + c) % 2 === 0 ? !dark : dark;
            grid[r][c] = maskedDark ? 2 : 1;
          }
        }
      }
      upward = !upward;
    }

    // Format string for ECC Level L (01) + Mask 0 (000) -> 0x77c4
    const formatBits = 0x77c4;
    const fBits = [];
    for (let i = 0; i < 15; i++) fBits.push((formatBits >> i) & 1);

    // Around top-left finder
    const tlCoords = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    for (let i = 0; i < 15; i++) {
      const [r, c] = tlCoords[i];
      grid[r][c] = fBits[14 - i] ? 2 : 1;
    }
    // Bottom-left & Top-right
    for (let i = 0; i < 7; i++) {
      grid[N - 1 - i][8] = fBits[14 - i] ? 2 : 1;
    }
    for (let i = 7; i < 15; i++) {
      grid[8][N - 15 + i] = fBits[14 - i] ? 2 : 1;
    }

    return { N, grid };
  }

  function toSVG(url) {
    const { N, grid } = buildMatrix(url);
    const margin = 2;
    const total = N + margin * 2;
    let path = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c] === 2) {
          path += `M${c + margin},${r + margin}h1v1h-1z`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" aria-label="QR Code para ${url}">
      <rect width="${total}" height="${total}" fill="#ffffff"/>
      <path d="${path}" fill="#0c0817"/>
    </svg>`;
  }

  return { toSVG };
})();

// ----------------------------------------------------------------------------
// 2. CONTROLE DE NAVEGAÇÃO DOS SLIDES, TEMAS E MODAIS (<dialog>)
// ----------------------------------------------------------------------------
const slides = Array.from(document.querySelectorAll('.slide'));
const blockJumpBtns = Array.from(document.querySelectorAll('.block-jump-btn'));
const prevSlideBtn = document.getElementById('prevSlideBtn');
const nextSlideBtn = document.getElementById('nextSlideBtn');
const slideDotsContainer = document.getElementById('slideDots');
const slideCounterText = document.getElementById('slideCounterText');
const viewModeToggleBtn = document.getElementById('viewModeToggleBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const themePicker = document.getElementById('themePicker');

let currentSlideIndex = 0;
let isScrollMode = false;
let currentTheme = 'purple';

// Create Slide Dots
slides.forEach((_, idx) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = `slide-dot${idx === 0 ? ' active' : ''}`;
  dot.textContent = String(idx + 1);
  dot.title = `Ir para o Slide ${idx + 1}`;
  dot.addEventListener('click', () => goToSlide(idx));
  slideDotsContainer.appendChild(dot);
});

function goToSlide(targetIdx) {
  const idx = Math.max(0, Math.min(slides.length - 1, Number(targetIdx) || 0));
  currentSlideIndex = idx;

  if (isScrollMode) {
    slides[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
  }

  // Update footer dots and buttons
  const dots = slideDotsContainer.querySelectorAll('.slide-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));

  if (prevSlideBtn) prevSlideBtn.disabled = idx === 0;
  if (nextSlideBtn) nextSlideBtn.disabled = idx === slides.length - 1;
  if (slideCounterText) {
    slideCounterText.innerHTML = `Slide ${idx + 1} de ${slides.length} &bull; Use &larr; &rarr; para navegar`;
  }

  // Update top block pill highlight
  blockJumpBtns.forEach(btn => {
    const bSlide = Number(btn.dataset.targetSlide);
    let active = false;
    if (bSlide === 0 && idx === 0) active = true;
    else if (bSlide === 1 && idx >= 1 && idx <= 3) active = true;
    else if (bSlide === 4 && idx >= 4 && idx <= 5) active = true;
    else if (bSlide === 6 && idx >= 6 && idx <= 7) active = true;
    else if (bSlide === 8 && idx === 8) active = true;
    btn.classList.toggle('active', active);
  });

  // Resize canvases on active slide
  requestAnimationFrame(resizeAllSlideCanvases);

  // Update URL search param without reload
  try {
    const url = new URL(window.location);
    url.searchParams.set('slide', String(idx + 1));
    window.history.replaceState({}, '', url);
  } catch (err) {}
}

if (prevSlideBtn) prevSlideBtn.addEventListener('click', () => goToSlide(currentSlideIndex - 1));
if (nextSlideBtn) nextSlideBtn.addEventListener('click', () => goToSlide(currentSlideIndex + 1));

blockJumpBtns.forEach(btn => {
  btn.addEventListener('click', () => goToSlide(Number(btn.dataset.targetSlide)));
});

document.querySelectorAll('[data-goto-slide]').forEach(el => {
  el.addEventListener('click', () => goToSlide(Number(el.dataset.gotoSlide)));
});

// Toggle Slide Mode vs Scroll (Handout) Mode
if (viewModeToggleBtn) {
  viewModeToggleBtn.addEventListener('click', () => {
    isScrollMode = !isScrollMode;
    document.body.classList.toggle('scroll-mode', isScrollMode);
    viewModeToggleBtn.innerHTML = isScrollMode ? '📽️ Modo Slides' : '📖 Modo Apostila';
    requestAnimationFrame(resizeAllSlideCanvases);
  });
}

// Fullscreen toggle
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });
}

// Theme Switcher
if (themePicker) {
  themePicker.addEventListener('click', e => {
    const swatch = e.target.closest('.theme-swatch');
    if (!swatch) return;
    themePicker.querySelectorAll('.theme-swatch').forEach(b => b.classList.remove('active'));
    swatch.classList.add('active');
    currentTheme = swatch.dataset.theme;
    document.documentElement.dataset.theme = currentTheme;
  });
}

// Keyboard Shortcuts for Slide Presentation
window.addEventListener('keydown', e => {
  const modalOpen =
    document.getElementById('simModal')?.open ||
    document.getElementById('qrModal')?.open;
  if (modalOpen || isScrollMode) return;

  const tag = document.activeElement?.tagName;
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;

  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    e.preventDefault();
    if (currentSlideIndex < slides.length - 1) goToSlide(currentSlideIndex + 1);
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    if (currentSlideIndex > 0) goToSlide(currentSlideIndex - 1);
  }
});

// Render all QR Codes and wire up QR Zoom Modal
const qrModal = document.getElementById('qrModal');
const qrModalTitle = document.getElementById('qrModalTitle');
const qrModalLargeBox = document.getElementById('qrModalLargeBox');
const qrModalUrlText = document.getElementById('qrModalUrlText');
const closeQrModalBtn = document.getElementById('closeQrModalBtn');

document.querySelectorAll('.qr-box[data-qr-url]').forEach(box => {
  const url = box.dataset.qrUrl;
  const label = box.dataset.qrLabel || 'Acesse pelo Celular';
  const svgMarkup = QRGenerator.toSVG(url);
  box.innerHTML = svgMarkup;

  box.addEventListener('click', () => {
    if (!qrModal) return;
    qrModalTitle.textContent = label;
    qrModalLargeBox.innerHTML = svgMarkup;
    qrModalUrlText.textContent = url;
    qrModal.showModal();
  });
});

if (closeQrModalBtn && qrModal) {
  closeQrModalBtn.addEventListener('click', () => qrModal.close());
  qrModal.addEventListener('click', e => {
    if (e.target === qrModal) qrModal.close();
  });
}

// Wire up Embedded Simulator Modal (<dialog>)
const simModal = document.getElementById('simModal');
const simModalTitle = document.getElementById('simModalTitle');
const simModalIframe = document.getElementById('simModalIframe');
const simModalExternalLink = document.getElementById('simModalExternalLink');
const closeSimModalBtn = document.getElementById('closeSimModalBtn');

document.querySelectorAll('[data-open-sim]').forEach(btn => {
  btn.addEventListener('click', () => {
    const baseUrl = btn.dataset.openSim;
    const title = btn.dataset.simTitle || 'Simulador Nuclear Interativo';
    const sep = baseUrl.includes('?') ? '&' : '?';
    const fullUrl = `${baseUrl}${sep}theme=${currentTheme}`;

    simModalTitle.textContent = title;
    simModalExternalLink.href = fullUrl;
    simModalIframe.src = fullUrl;
    simModal.showModal();
  });
});

function closeSimModal() {
  if (!simModal) return;
  simModal.close();
  simModalIframe.src = 'about:blank';
}

if (closeSimModalBtn && simModal) {
  closeSimModalBtn.addEventListener('click', closeSimModal);
  simModal.addEventListener('close', () => {
    simModalIframe.src = 'about:blank';
  });
  simModal.addEventListener('click', e => {
    if (e.target === simModal) closeSimModal();
  });
}

// ----------------------------------------------------------------------------
// 3. SIMULADOR SLIDE 2: CICLO DO URÂNIO NO BRASIL & ULTRACENTRÍFUGA (INB)
// ----------------------------------------------------------------------------
const centrifugeCanvas = document.getElementById('centrifugeCanvas');
const cCtx = centrifugeCanvas ? centrifugeCanvas.getContext('2d') : null;

const centrifugeState = {
  step: 2, // 0: Caetité, 1: Yellowcake, 2: Resende Ultracentrífuga, 3: Pastilha Angra
  enrichmentPct: 4.0,
  rpm: 55000,
  angle: 0,
  particles: []
};

const BRAZIL_STEP_TEXTS = [
  '<strong>💡 1. Mineração em Caetité (BA):</strong> Extração da <em>uraninita</em> pela INB. Minério bruto com 99,3% de ²³⁸U e apenas 0,7% do isótopo físsil ²³⁵U.',
  '<strong>💡 2. Concentrado Yellowcake (U₃O₈):</strong> Tratado com ácido, forma o pó amarelo ("bolo amarelo"). Ainda com 0,7% de ²³⁵U, insuficiente para usinas.',
  '<strong>💡 3. Ultracentrífugas em Resende (RJ):</strong> Convertido no gás UF₆ a ~60.000 RPM. O ²³⁸U (pesado) vai para a borda e o ²³⁵U (físsil) vai ao centro!',
  '<strong>💡 4. Pastilha Combustível (Angra 1 e 2):</strong> UO₂ cerâmico a 3%–5% de ²³⁵U. Uma única pastilha de 1 cm gera a mesma energia de 1 tonelada de carvão!'
];

function initCentrifugeParticles() {
  centrifugeState.particles = [];
  const total = 85;
  for (let i = 0; i < total; i++) {
    const isU235 = (i / total) * 100 < Math.max(4, centrifugeState.enrichmentPct * 0.85 + 6);
    centrifugeState.particles.push({
      isU235,
      theta: Math.random() * Math.PI * 2,
      normR: 0.15 + Math.random() * 0.78,
      speedOffset: 0.85 + Math.random() * 0.3
    });
  }
}
initCentrifugeParticles();

function updateCentrifugeUI() {
  const badge = document.getElementById('centrifugeStatusBadge');
  const rpmLabel = document.getElementById('centrifugeRpmLabel');
  const rpmSlider = document.getElementById('centrifugeRpmSlider');
  if (rpmLabel) rpmLabel.textContent = `${centrifugeState.rpm.toLocaleString('pt-BR')} RPM`;
  if (rpmSlider) rpmSlider.value = String(centrifugeState.rpm);

  let gradeName = 'Urânio Natural (Yellowcake)';
  if (centrifugeState.enrichmentPct >= 80) gradeName = 'Grau Militar (Bomba)';
  else if (centrifugeState.enrichmentPct >= 15) gradeName = 'Propulsão Naval (Submarino)';
  else if (centrifugeState.enrichmentPct >= 2.5) gradeName = 'Reator Comercial (Angra / Resende)';

  if (badge) {
    badge.textContent = `²³⁵U: ${centrifugeState.enrichmentPct.toFixed(1)}% (${gradeName})`;
  }
  initCentrifugeParticles();
}

document.getElementById('brazilCycleSteps')?.addEventListener('click', e => {
  const btn = e.target.closest('.cycle-step-btn');
  if (!btn) return;
  document.querySelectorAll('#brazilCycleSteps .cycle-step-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const step = Number(btn.dataset.step);
  centrifugeState.step = step;

  const expBox = document.getElementById('cycleStepExplanation');
  if (expBox && BRAZIL_STEP_TEXTS[step]) {
    expBox.innerHTML = BRAZIL_STEP_TEXTS[step];
  }

  if (step === 0 || step === 1) {
    centrifugeState.enrichmentPct = 0.7;
    centrifugeState.rpm = step === 0 ? 0 : 12000;
  } else if (step === 2) {
    centrifugeState.enrichmentPct = 4.0;
    centrifugeState.rpm = 55000;
  } else if (step === 3) {
    centrifugeState.enrichmentPct = 4.5;
    centrifugeState.rpm = 60000;
  }
  updateCentrifugeUI();
});

document.getElementById('enrichmentPresetBtns')?.addEventListener('click', e => {
  const btn = e.target.closest('.pill-btn');
  if (!btn) return;
  document.querySelectorAll('#enrichmentPresetBtns .pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  centrifugeState.enrichmentPct = Number(btn.dataset.enrich);
  centrifugeState.rpm = Number(btn.dataset.rpm);
  updateCentrifugeUI();
});

document.getElementById('centrifugeRpmSlider')?.addEventListener('input', e => {
  centrifugeState.rpm = Number(e.target.value);
  // Adjust effective enrichment smoothly based on RPM if in centrifuge mode
  if (centrifugeState.rpm < 5000) centrifugeState.enrichmentPct = 0.7;
  else if (centrifugeState.rpm <= 60000) {
    centrifugeState.enrichmentPct = +(0.7 + ((centrifugeState.rpm - 5000) / 55000) * 4.3).toFixed(1);
  } else {
    centrifugeState.enrichmentPct = +(5.0 + ((centrifugeState.rpm - 60000) / 15000) * 85.0).toFixed(1);
  }
  updateCentrifugeUI();
});

function renderCentrifugeCanvas() {
  if (!cCtx || !centrifugeCanvas) return;
  const W = centrifugeCanvas.width;
  const H = centrifugeCanvas.height;
  if (W === 0 || H === 0) return;

  cCtx.clearRect(0, 0, W, H);

  const spinFactor = centrifugeState.rpm / 60000;
  centrifugeState.angle += 0.025 + spinFactor * 0.14;

  // Center rotor circle (Top-down cross-section of Ultracentrifuge)
  const cx = W * 0.33;
  const cy = H * 0.47;
  const maxR = Math.min(W * 0.22, H * 0.30);

  // Outer casing glow
  cCtx.save();
  cCtx.beginPath();
  cCtx.arc(cx, cy, maxR + 10, 0, Math.PI * 2);
  cCtx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
  cCtx.lineWidth = 6;
  cCtx.stroke();

  // Spinning rotor ring
  cCtx.beginPath();
  cCtx.arc(cx, cy, maxR, 0, Math.PI * 2);
  cCtx.fillStyle = 'rgba(12, 8, 23, 0.85)';
  cCtx.fill();
  cCtx.lineWidth = 3;
  cCtx.strokeStyle = '#38bdf8';
  cCtx.setLineDash([14, 8]);
  cCtx.lineDashOffset = -centrifugeState.angle * 22;
  cCtx.stroke();
  cCtx.setLineDash([]);

  // Central extraction scoop zone (enriched U-235 core)
  const coreR = maxR * 0.36;
  cCtx.beginPath();
  cCtx.arc(cx, cy, coreR, 0, Math.PI * 2);
  cCtx.fillStyle = 'rgba(34, 211, 238, 0.12)';
  cCtx.fill();
  cCtx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
  cCtx.lineWidth = 1.5;
  cCtx.stroke();

  // Update & draw gas particles (UF6)
  centrifugeState.particles.forEach(p => {
    p.theta += (0.015 + spinFactor * 0.09) * p.speedOffset;
    // Centrifugal separation: U-238 (heavier) migrates outward; U-235 (lighter) migrates toward core
    const targetR = p.isU235
      ? 0.12 + (1 - Math.min(1, spinFactor)) * 0.55 + Math.sin(p.theta * 3) * 0.08
      : 0.88 - (1 - Math.min(1, spinFactor)) * 0.42 + Math.cos(p.theta * 2) * 0.06;
    p.normR += (targetR - p.normR) * 0.04;

    const r = p.normR * (maxR - 8);
    const px = cx + Math.cos(p.theta) * r;
    const py = cy + Math.sin(p.theta) * r;

    cCtx.beginPath();
    cCtx.arc(px, py, p.isU235 ? 4.8 : 4.0, 0, Math.PI * 2);
    if (p.isU235) {
      cCtx.fillStyle = '#22d3ee';
      cCtx.shadowColor = '#22d3ee';
      cCtx.shadowBlur = 8;
    } else {
      cCtx.fillStyle = '#6366f1';
      cCtx.shadowBlur = 0;
    }
    cCtx.fill();
    cCtx.shadowBlur = 0;
  });

  // Rotor labels
  cCtx.fillStyle = '#f8fafc';
  cCtx.font = 'bold 12px Segoe UI';
  cCtx.textAlign = 'center';
  cCtx.fillText('Rotor da Ultracentrífuga (UF₆)', cx, cy - maxR - 15);
  cCtx.font = 'bold 11px Segoe UI';
  cCtx.fillStyle = '#22d3ee';
  cCtx.fillText('Centro: ²³⁵U (Leve / Físsil)', cx, cy + maxR + 20);
  cCtx.fillStyle = '#a5b4fc';
  cCtx.fillText('Borda: ²³⁸U (Pesado / 99,3%)', cx, cy + maxR + 35);

  // Right Side: Isotopic Composition Bars & Brazilian Cycle Status
  const rx = W * 0.64;
  const rw = W * 0.31;
  const ry = H * 0.16;

  cCtx.textAlign = 'left';
  cCtx.fillStyle = '#f8fafc';
  cCtx.font = 'bold 13px Segoe UI';
  cCtx.fillText('Proporção Isotópica Obtida:', rx, ry);

  const u235Pct = centrifugeState.enrichmentPct;
  const u238Pct = +(100 - u235Pct).toFixed(1);

  // U-235 Bar
  const barY1 = ry + 18;
  cCtx.fillStyle = '#22d3ee';
  cCtx.font = 'bold 12px Segoe UI';
  cCtx.fillText(`²³⁵U (Físsil): ${u235Pct.toFixed(1)}%`, rx, barY1);
  cCtx.fillStyle = 'rgba(255,255,255,0.08)';
  cCtx.fillRect(rx, barY1 + 7, rw, 16);
  cCtx.fillStyle = '#22d3ee';
  cCtx.fillRect(rx, barY1 + 7, Math.max(4, (u235Pct / 100) * rw), 16);

  // U-238 Bar
  const barY2 = barY1 + 44;
  cCtx.fillStyle = '#818cf8';
  cCtx.fillText(`²³⁸U (Inerte): ${u238Pct.toFixed(1)}%`, rx, barY2);
  cCtx.fillStyle = 'rgba(255,255,255,0.08)';
  cCtx.fillRect(rx, barY2 + 7, rw, 16);
  cCtx.fillStyle = '#6366f1';
  cCtx.fillRect(rx, barY2 + 7, (u238Pct / 100) * rw, 16);

  // Application Box
  const boxY = barY2 + 42;
  cCtx.fillStyle = 'rgba(31, 22, 58, 0.85)';
  cCtx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
  cCtx.lineWidth = 1.2;
  cCtx.beginPath();
  cCtx.roundRect(rx, boxY, rw, 84, 10);
  cCtx.fill();
  cCtx.stroke();

  cCtx.fillStyle = '#facc15';
  cCtx.font = 'bold 11.5px Segoe UI';
  let appTitle = '🟡 Minério / Yellowcake (Natural)';
  let appLine1 = 'Apenas 7 em cada 1000 átomos são';
  let appLine2 = '²³⁵U. Insuficiente para Angra!';
  if (u235Pct >= 80) {
    appTitle = '💣 Grau Militar (>90% ²³⁵U)';
    appLine1 = 'Reação explosiva descontrolada.';
    appLine2 = 'Proibido pela Constituição Brasileira!';
  } else if (u235Pct >= 15) {
    appTitle = '⚓ Grau Naval (~20% ²³⁵U)';
    appLine1 = 'Usado em reatores compactos de';
    appLine2 = 'submarinos nucleares e pesquisa.';
  } else if (u235Pct >= 2.5) {
    appTitle = '🏭 Combustível PWR (Angra 1 e 2)';
    appLine1 = 'Meta da INB em Resende (3% a 5%):';
    appLine2 = 'Ideal para reação controlada segura!';
  }
  cCtx.fillText(appTitle, rx + 10, boxY + 22);
  cCtx.fillStyle = '#e2e8f0';
  cCtx.font = '11px Segoe UI';
  cCtx.fillText(appLine1, rx + 10, boxY + 44);
  cCtx.fillText(appLine2, rx + 10, boxY + 62);
  cCtx.restore();
}

// ----------------------------------------------------------------------------
// 4. SIMULADOR SLIDE 3: ANIMAÇÃO EM LOOPING DA FISSÃO E REAÇÃO EM CADEIA
// ----------------------------------------------------------------------------
const fissionLoopCanvas = document.getElementById('fissionLoopCanvas');
const flCtx = fissionLoopCanvas ? fissionLoopCanvas.getContext('2d') : null;

const fissionLoopState = {
  mode: 'cascade', // 'cascade' | 'single'
  timer: 0
};

document.getElementById('fissionLoopModeBtns')?.addEventListener('click', e => {
  const btn = e.target.closest('.pill-btn');
  if (!btn) return;
  document.querySelectorAll('#fissionLoopModeBtns .pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  fissionLoopState.mode = btn.dataset.flmode;
  fissionLoopState.timer = 0;
});

document.getElementById('fissionLoopRestartBtn')?.addEventListener('click', () => {
  fissionLoopState.timer = 0;
});

function renderFissionLoopCanvas() {
  if (!flCtx || !fissionLoopCanvas) return;
  const W = fissionLoopCanvas.width;
  const H = fissionLoopCanvas.height;
  if (W === 0 || H === 0) return;

  flCtx.clearRect(0, 0, W, H);
  fissionLoopState.timer = (fissionLoopState.timer + 1) % 320;
  const t = fissionLoopState.timer;

  const badge = document.getElementById('fissionLoopGenBadge');

  if (fissionLoopState.mode === 'single') {
    // Detailed single U-235 atom splitting loop
    const cx = W * 0.52;
    const cy = H * 0.5;

    if (t < 75) {
      if (badge) badge.textContent = '1. Nêutron Lento colide com ²³⁵U';
      const nx = W * 0.1 + (cx - 28 - W * 0.1) * (t / 75);
      // Draw U-235
      flCtx.beginPath();
      flCtx.arc(cx, cy, 28, 0, Math.PI * 2);
      flCtx.fillStyle = '#38bdf8';
      flCtx.fill();
      flCtx.fillStyle = '#ffffff';
      flCtx.font = 'bold 13px Segoe UI';
      flCtx.textAlign = 'center';
      flCtx.fillText('²³⁵U', cx, cy + 5);

      // Incoming thermal neutron
      flCtx.beginPath();
      flCtx.arc(nx, cy, 7, 0, Math.PI * 2);
      flCtx.fillStyle = '#22d3ee';
      flCtx.fill();
      flCtx.fillText('n⁰ lento', nx, cy - 14);
    } else if (t < 130) {
      if (badge) badge.textContent = '2. Núcleo Instável ²³⁶U* (Gota Líquida)';
      const p = (t - 75) / 55;
      const stretch = 1 + p * 0.65;
      flCtx.save();
      flCtx.translate(cx, cy);
      flCtx.scale(stretch, 1 / Math.sqrt(stretch));
      flCtx.beginPath();
      flCtx.arc(0, 0, 30, 0, Math.PI * 2);
      flCtx.fillStyle = '#a855f7';
      flCtx.fill();
      flCtx.restore();
      flCtx.fillStyle = '#ffffff';
      flCtx.font = 'bold 13px Segoe UI';
      flCtx.textAlign = 'center';
      flCtx.fillText('²³⁶U* (Instável)', cx, cy - 36);
    } else {
      if (badge) badge.textContent = '3. Cisão: ¹⁴¹Ba + ⁹²Kr + 3 n⁰ + 200 MeV (E = mc²)';
      const p = (t - 130) / 190;
      const dist = p * Math.min(W * 0.34, 150);

      // Energy flash
      if (p < 0.35) {
        flCtx.beginPath();
        flCtx.arc(cx, cy, 20 + p * 180, 0, Math.PI * 2);
        flCtx.strokeStyle = `rgba(250, 204, 21, ${1 - p / 0.35})`;
        flCtx.lineWidth = 4;
        flCtx.stroke();
      }

      // Barium-141 & Krypton-92
      flCtx.beginPath();
      flCtx.arc(cx - dist * 0.5, cy - dist * 0.6, 22, 0, Math.PI * 2);
      flCtx.fillStyle = '#a855f7';
      flCtx.fill();
      flCtx.fillStyle = '#ffffff';
      flCtx.font = 'bold 11px Segoe UI';
      flCtx.textAlign = 'center';
      flCtx.fillText('¹⁴¹Ba', cx - dist * 0.5, cy - dist * 0.6 + 4);

      flCtx.beginPath();
      flCtx.arc(cx - dist * 0.4, cy + dist * 0.65, 18, 0, Math.PI * 2);
      flCtx.fillStyle = '#10b981';
      flCtx.fill();
      flCtx.fillStyle = '#ffffff';
      flCtx.fillText('⁹²Kr', cx - dist * 0.4, cy + dist * 0.65 + 4);

      // 3 Emitted Neutrons
      [-0.45, 0, 0.45].forEach((ang, idx) => {
        const nx = cx + Math.cos(ang) * dist * 1.35;
        const ny = cy + Math.sin(ang) * dist * 1.1;
        flCtx.beginPath();
        flCtx.arc(nx, ny, 6.5, 0, Math.PI * 2);
        flCtx.fillStyle = '#22d3ee';
        flCtx.fill();
        flCtx.fillStyle = '#7dd3fc';
        flCtx.fillText(`n⁰ #${idx + 1}`, nx + 18, ny + 4);
      });
    }
    return;
  }

  // Mode 'cascade': 1 -> 3 -> 9 Chain Reaction Tree
  const xGen = [W * 0.2, W * 0.5, W * 0.8];
  const yGen0 = [H * 0.5];
  const yGen1 = [H * 0.22, H * 0.5, H * 0.78];
  const yGen2 = [
    H * 0.11, H * 0.22, H * 0.33,
    H * 0.42, H * 0.50, H * 0.58,
    H * 0.67, H * 0.78, H * 0.89
  ];

  const drawNucleus = (x, y, r, split, label) => {
    flCtx.save();
    if (!split) {
      flCtx.beginPath();
      flCtx.arc(x, y, r, 0, Math.PI * 2);
      flCtx.fillStyle = '#38bdf8';
      flCtx.fill();
      if (label) {
        flCtx.fillStyle = '#ffffff';
        flCtx.font = 'bold 10px Segoe UI';
        flCtx.textAlign = 'center';
        flCtx.fillText(label, x, y + 3.5);
      }
    } else {
      // Split fragments (Ba + Kr) + golden flash
      flCtx.beginPath();
      flCtx.arc(x - r * 0.55, y - r * 0.45, r * 0.68, 0, Math.PI * 2);
      flCtx.fillStyle = '#a855f7';
      flCtx.fill();
      flCtx.beginPath();
      flCtx.arc(x + r * 0.55, y + r * 0.45, r * 0.58, 0, Math.PI * 2);
      flCtx.fillStyle = '#10b981';
      flCtx.fill();
    }
    flCtx.restore();
  };

  // Phase timings:
  // 0..60: neutron hits Gen 0
  // 60..145: 3 neutrons travel Gen 0 -> Gen 1
  // 145..230: 9 neutrons travel Gen 1 -> Gen 2
  // 230..320: Gen 2 splits & energy wave
  if (badge) {
    if (t < 60) badge.textContent = '1 Nêutron Inicial dispara a Fissão';
    else if (t < 145) badge.textContent = '1ª Geração: 3 Novos Nêutrons Ejetados';
    else if (t < 230) badge.textContent = '2ª Geração: 9 Nêutrons em Cascata!';
    else badge.textContent = 'Reação em Cadeia Exponencial (3ⁿ) + Energia!';
  }

  // Incoming trigger neutron
  if (t < 60) {
    const p = t / 60;
    const nx = W * 0.04 + (xGen[0] - W * 0.04) * p;
    flCtx.beginPath();
    flCtx.arc(nx, yGen0[0], 5.5, 0, Math.PI * 2);
    flCtx.fillStyle = '#22d3ee';
    flCtx.fill();
  }

  // Gen 0 -> Gen 1 lines & neutrons
  if (t >= 60) {
    const p = Math.min(1, (t - 60) / 85);
    yGen1.forEach(ty => {
      flCtx.beginPath();
      flCtx.moveTo(xGen[0], yGen0[0]);
      flCtx.lineTo(xGen[0] + (xGen[1] - xGen[0]) * p, yGen0[0] + (ty - yGen0[0]) * p);
      flCtx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      flCtx.lineWidth = 2;
      flCtx.stroke();

      if (p < 1) {
        flCtx.beginPath();
        flCtx.arc(
          xGen[0] + (xGen[1] - xGen[0]) * p,
          yGen0[0] + (ty - yGen0[0]) * p,
          5,
          0,
          Math.PI * 2
        );
        flCtx.fillStyle = '#22d3ee';
        flCtx.fill();
      }
    });
  }

  // Gen 1 -> Gen 2 lines & neutrons
  if (t >= 145) {
    const p = Math.min(1, (t - 145) / 85);
    yGen1.forEach((sy, idx) => {
      for (let k = 0; k < 3; k++) {
        const ty = yGen2[idx * 3 + k];
        flCtx.beginPath();
        flCtx.moveTo(xGen[1], sy);
        flCtx.lineTo(xGen[1] + (xGen[2] - xGen[1]) * p, sy + (ty - sy) * p);
        flCtx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
        flCtx.lineWidth = 1.6;
        flCtx.stroke();

        if (p < 1) {
          flCtx.beginPath();
          flCtx.arc(
            xGen[1] + (xGen[2] - xGen[1]) * p,
            sy + (ty - sy) * p,
            4.5,
            0,
            Math.PI * 2
          );
          flCtx.fillStyle = '#22d3ee';
          flCtx.fill();
        }
      }
    });
  }

  // Draw nuclei
  drawNucleus(xGen[0], yGen0[0], 19, t >= 60, '²³⁵U');
  yGen1.forEach(y => drawNucleus(xGen[1], y, 16, t >= 145, '²³⁵U'));
  yGen2.forEach(y => drawNucleus(xGen[2], y, 11.5, t >= 230, ''));
}

// ----------------------------------------------------------------------------
// 5. SIMULADOR SLIDE 4: PROTEÇÃO RADIOLÓGICA (ATENUAÇÃO DE BARREIRA - PÁG. 5)
// ----------------------------------------------------------------------------
const shieldCanvas = document.getElementById('shieldCanvas');
const sCtx = shieldCanvas ? shieldCanvas.getContext('2d') : null;

const shieldState = {
  particleType: 'all', // 'alpha' | 'beta' | 'gamma' | 'neutron' | 'all'
  material: 'lead',    // 'paper' | 'aluminum' | 'water' | 'lead' | 'concrete'
  thicknessPct: 65,    // 10 to 100
  particles: [],
  spawnTimer: 0
};

const SHIELD_MATERIALS = {
  paper: {
    name: 'Folha de Papel',
    color: '#e2e8f0',
    border: '#94a3b8',
    // Transmission fraction at thicknessPct (0..1)
    calcTrans: (type, th) => {
      if (type === 'alpha') return 0; // Blocked by paper!
      if (type === 'beta') return Math.max(0.55, 0.92 - th * 0.25);
      if (type === 'gamma') return 0.99;
      if (type === 'neutron') return 0.99;
      return 1;
    }
  },
  aluminum: {
    name: 'Placa de Alumínio',
    color: '#64748b',
    border: '#cbd5e1',
    calcTrans: (type, th) => {
      if (type === 'alpha') return 0;
      if (type === 'beta') return th >= 0.25 ? 0 : Math.max(0, 1 - th * 4);
      if (type === 'gamma') return Math.exp(-0.45 * th);
      if (type === 'neutron') return Math.exp(-0.25 * th);
      return 1;
    }
  },
  water: {
    name: 'Tanque de Água (H₂O)',
    color: 'rgba(14, 165, 233, 0.45)',
    border: '#38bdf8',
    calcTrans: (type, th) => {
      if (type === 'alpha') return 0;
      if (type === 'beta') return th >= 0.3 ? 0 : Math.max(0, 1 - th * 3.5);
      // Gamma requires wide limits of water (exponential attenuation)
      if (type === 'gamma') return Math.exp(-1.55 * th);
      // Water is rich in Hydrogen -> excellent neutron moderator/shield!
      if (type === 'neutron') return Math.exp(-3.4 * th);
      return 1;
    }
  },
  lead: {
    name: 'Blindagem de Chumbo (Pb)',
    color: '#334155',
    border: '#94a3b8',
    calcTrans: (type, th) => {
      if (type === 'alpha') return 0;
      if (type === 'beta') return 0;
      // Lead blocks Gamma in narrow limits (strong exponential attenuation)
      if (type === 'gamma') return Math.exp(-5.2 * th);
      // Fast neutrons pass partially through pure lead (heavy nuclei don't slow neutrons well)
      if (type === 'neutron') return Math.exp(-1.1 * th);
      return 1;
    }
  },
  concrete: {
    name: 'Concreto Armado (Blindagem Biológica)',
    color: '#475569',
    border: '#a8a29e',
    calcTrans: (type, th) => {
      if (type === 'alpha') return 0;
      if (type === 'beta') return 0;
      if (type === 'gamma') return Math.exp(-4.2 * th);
      if (type === 'neutron') return Math.exp(-4.5 * th);
      return 1;
    }
  }
};

function updateShieldUI() {
  const th = shieldState.thicknessPct / 100;
  const mat = SHIELD_MATERIALS[shieldState.material];
  const label = document.getElementById('shieldThicknessLabel');
  if (label) label.textContent = `${shieldState.thicknessPct}% Espessura`;

  const badge = document.getElementById('shieldTransmissionBadge');
  if (badge && mat) {
    if (shieldState.particleType === 'all') {
      const tGamma = Math.round(mat.calcTrans('gamma', th) * 100);
      const tNeutron = Math.round(mat.calcTrans('neutron', th) * 100);
      badge.textContent = `${mat.name} → γ: ${tGamma}% | n⁰: ${tNeutron}% passam`;
    } else {
      const tVal = Math.round(mat.calcTrans(shieldState.particleType, th) * 100);
      badge.textContent =
        tVal <= 2
          ? `Transmissão: ${tVal}% (Blindagem Eficaz!)`
          : `Transmissão: ${tVal}% (Atravessa a Barreira!)`;
    }
  }
}

document.getElementById('shieldParticleBtns')?.addEventListener('click', e => {
  const btn = e.target.closest('.pill-btn');
  if (!btn) return;
  document.querySelectorAll('#shieldParticleBtns .pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  shieldState.particleType = btn.dataset.part;
  shieldState.particles = [];
  updateShieldUI();
});

document.getElementById('shieldMaterialBtns')?.addEventListener('click', e => {
  const btn = e.target.closest('.pill-btn');
  if (!btn) return;
  document.querySelectorAll('#shieldMaterialBtns .pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  shieldState.material = btn.dataset.mat;
  updateShieldUI();
});

document.getElementById('shieldThicknessSlider')?.addEventListener('input', e => {
  shieldState.thicknessPct = Number(e.target.value);
  updateShieldUI();
});

function renderShieldCanvas() {
  if (!sCtx || !shieldCanvas) return;
  const W = shieldCanvas.width;
  const H = shieldCanvas.height;
  if (W === 0 || H === 0) return;

  sCtx.clearRect(0, 0, W, H);

  const thNorm = shieldState.thicknessPct / 100;
  const mat = SHIELD_MATERIALS[shieldState.material];

  const sourceX = W * 0.11;
  const barrierStartX = W * 0.40;
  const barrierWidth = 18 + thNorm * (W * 0.22);
  const barrierEndX = barrierStartX + barrierWidth;
  const detectorX = W * 0.78;

  // Spawn particles
  shieldState.spawnTimer++;
  if (shieldState.spawnTimer % 7 === 0) {
    const types =
      shieldState.particleType === 'all'
        ? ['alpha', 'beta', 'gamma', 'neutron']
        : [shieldState.particleType];

    types.forEach((t, idx) => {
      const laneY =
        shieldState.particleType === 'all'
          ? H * (0.23 + idx * 0.18) + (Math.random() - 0.5) * 10
          : H * 0.5 + (Math.random() - 0.5) * (H * 0.42);

      const transProb = mat.calcTrans(t, thNorm);
      const passes = Math.random() < transProb;
      const stopX = passes
        ? detectorX + 10
        : barrierStartX + Math.random() * Math.max(10, barrierWidth * 0.88);

      shieldState.particles.push({
        type: t,
        x: sourceX + 18,
        y: laneY,
        vx: t === 'gamma' ? 5.2 : t === 'beta' ? 4.4 : t === 'neutron' ? 3.8 : 2.7,
        passes,
        transProb,
        stopX,
        alpha: 1.0,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  // Draw Barrier in Center
  sCtx.save();
  sCtx.fillStyle = mat.color;
  sCtx.strokeStyle = mat.border;
  sCtx.lineWidth = 2;
  sCtx.beginPath();
  sCtx.roundRect(barrierStartX, H * 0.1, barrierWidth, H * 0.8, 8);
  sCtx.fill();
  sCtx.stroke();

  sCtx.fillStyle = '#ffffff';
  sCtx.font = 'bold 12px Segoe UI';
  sCtx.textAlign = 'center';
  sCtx.fillText(mat.name, barrierStartX + barrierWidth / 2, H * 0.07);

  // Draw Emitter Source on Left
  sCtx.fillStyle = '#1e1b4b';
  sCtx.strokeStyle = '#c084fc';
  sCtx.lineWidth = 2;
  sCtx.beginPath();
  sCtx.roundRect(sourceX - 28, H * 0.14, 46, H * 0.72, 10);
  sCtx.fill();
  sCtx.stroke();

  sCtx.fillStyle = '#facc15';
  sCtx.font = 'bold 11px Segoe UI';
  sCtx.fillText('☢️ Fonte', sourceX - 5, H * 0.08);

  // Update & draw particles
  for (let i = shieldState.particles.length - 1; i >= 0; i--) {
    const p = shieldState.particles[i];
    p.x += p.vx;

    if (!p.passes && p.x >= p.stopX) {
      p.alpha -= 0.12;
      p.x = p.stopX;
    } else if (p.passes && p.x > barrierStartX) {
      // Reduce opacity inside/after barrier proportional to exponential attenuation
      p.alpha = Math.max(0.28, 0.35 + p.transProb * 0.65);
    }

    if (p.alpha <= 0 || p.x >= detectorX) {
      shieldState.particles.splice(i, 1);
      continue;
    }

    sCtx.save();
    sCtx.globalAlpha = p.alpha;
    if (p.type === 'alpha') {
      sCtx.beginPath();
      sCtx.arc(p.x, p.y, 7.5, 0, Math.PI * 2);
      sCtx.fillStyle = '#f43f5e';
      sCtx.fill();
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 9px Segoe UI';
      sCtx.fillText('α', p.x, p.y + 3);
    } else if (p.type === 'beta') {
      sCtx.beginPath();
      sCtx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      sCtx.fillStyle = '#38bdf8';
      sCtx.fill();
      sCtx.fillStyle = '#bae6fd';
      sCtx.font = 'bold 9px Segoe UI';
      sCtx.fillText('β⁻', p.x, p.y - 7);
    } else if (p.type === 'gamma') {
      // Wavy photon packet
      sCtx.beginPath();
      for (let dx = -12; dx <= 12; dx += 2) {
        const wy = p.y + Math.sin((p.x + dx) * 0.25 + p.phase) * 5;
        if (dx === -12) sCtx.moveTo(p.x + dx, wy);
        else sCtx.lineTo(p.x + dx, wy);
      }
      sCtx.strokeStyle = '#facc15';
      sCtx.lineWidth = 2.4;
      sCtx.stroke();
    } else if (p.type === 'neutron') {
      sCtx.beginPath();
      sCtx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      sCtx.fillStyle = '#22d3ee';
      sCtx.fill();
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 9px Segoe UI';
      sCtx.fillText('n⁰', p.x, p.y - 8);
    }
    sCtx.restore();
  }

  // Draw Detector Panel on Right (Transmission meters per radiation type)
  const panelW = W * 0.2;
  sCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  sCtx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  sCtx.lineWidth = 1.5;
  sCtx.beginPath();
  sCtx.roundRect(detectorX, H * 0.12, panelW, H * 0.76, 10);
  sCtx.fill();
  sCtx.stroke();

  sCtx.fillStyle = '#f8fafc';
  sCtx.font = 'bold 11px Segoe UI';
  sCtx.textAlign = 'center';
  sCtx.fillText('Detector Geiger', detectorX + panelW / 2, H * 0.2);

  const items = [
    { key: 'alpha', label: 'Alfa (α)', color: '#f43f5e' },
    { key: 'beta', label: 'Beta (β⁻)', color: '#38bdf8' },
    { key: 'gamma', label: 'Gama (γ)', color: '#facc15' },
    { key: 'neutron', label: 'Nêutron (n⁰)', color: '#22d3ee' }
  ];

  sCtx.textAlign = 'left';
  items.forEach((it, idx) => {
    const iy = H * (0.31 + idx * 0.14);
    const pct = Math.round(mat.calcTrans(it.key, thNorm) * 100);
    sCtx.fillStyle = it.color;
    sCtx.font = 'bold 10.5px Segoe UI';
    sCtx.fillText(`${it.label}: ${pct}%`, detectorX + 8, iy);

    sCtx.fillStyle = 'rgba(255,255,255,0.1)';
    sCtx.fillRect(detectorX + 8, iy + 5, panelW - 16, 8);
    sCtx.fillStyle = it.color;
    sCtx.fillRect(detectorX + 8, iy + 5, ((panelW - 16) * pct) / 100, 8);
  });

  sCtx.restore();
}

// ----------------------------------------------------------------------------
// 6. SIMULADOR SLIDE 6: DIAGRAMA ANIMADO PWR (ANGRA) VS. BWR VS. SUBMARINO
// ----------------------------------------------------------------------------
const reactorDiagramCanvas = document.getElementById('reactorDiagramCanvas');
const rdCtx = reactorDiagramCanvas ? reactorDiagramCanvas.getContext('2d') : null;

const reactorDiagramState = {
  type: 'pwr', // 'pwr' | 'bwr' | 'sub'
  powerPct: 80,
  highlightIsolation: true,
  flowPhase: 0
};

document.getElementById('reactorTypeBtns')?.addEventListener('click', e => {
  const btn = e.target.closest('.pill-btn');
  if (!btn) return;
  document.querySelectorAll('#reactorTypeBtns .pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  reactorDiagramState.type = btn.dataset.rtype;

  const badge = document.getElementById('reactorCircuitBadge');
  if (badge) {
    if (reactorDiagramState.type === 'pwr') {
      badge.textContent = 'PWR (Angra): 2 Circuitos Isolados (150 atm, >300 °C sem ferver)';
    } else if (reactorDiagramState.type === 'bwr') {
      badge.textContent = 'BWR: 1 Circuito Único (Água do núcleo ferve e vai à turbina)';
    } else {
      badge.textContent = 'Submarino PWR: Sem ar, gera Propulsão + Eletrólise (O₂) + Água';
    }
  }
});

document.getElementById('diagramPowerSlider')?.addEventListener('input', e => {
  reactorDiagramState.powerPct = Number(e.target.value);
  const lbl = document.getElementById('diagramPowerLabel');
  if (lbl) lbl.textContent = `${reactorDiagramState.powerPct}% Potência`;
});

document.getElementById('highlightIsolationBtn')?.addEventListener('click', e => {
  reactorDiagramState.highlightIsolation = !reactorDiagramState.highlightIsolation;
  e.currentTarget.classList.toggle('active', reactorDiagramState.highlightIsolation);
});

function renderReactorDiagramCanvas() {
  if (!rdCtx || !reactorDiagramCanvas) return;
  const W = reactorDiagramCanvas.width;
  const H = reactorDiagramCanvas.height;
  if (W === 0 || H === 0) return;

  rdCtx.clearRect(0, 0, W, H);
  const pwrNorm = reactorDiagramState.powerPct / 100;
  reactorDiagramState.flowPhase = (reactorDiagramState.flowPhase + 0.6 + pwrNorm * 2.4) % 40;

  const type = reactorDiagramState.type;

  // Draw Containment Building Dome (Left side)
  const domeX = W * 0.05;
  const domeW = type === 'bwr' ? W * 0.34 : W * 0.44;
  const domeY = H * 0.13;
  const domeH = H * 0.74;

  rdCtx.save();
  rdCtx.fillStyle = 'rgba(30, 41, 59, 0.55)';
  rdCtx.strokeStyle = reactorDiagramState.highlightIsolation ? '#10b981' : 'rgba(148, 163, 184, 0.45)';
  rdCtx.lineWidth = reactorDiagramState.highlightIsolation ? 3 : 2;
  rdCtx.beginPath();
  rdCtx.roundRect(domeX, domeY, domeW, domeH, [24, 24, 10, 10]);
  rdCtx.fill();
  rdCtx.stroke();

  rdCtx.fillStyle = '#86efac';
  rdCtx.font = 'bold 11px Segoe UI';
  rdCtx.textAlign = 'center';
  rdCtx.fillText(
    type === 'sub' ? 'Casco Pressurizado (Compartimento do Reator)' : 'Edifício de Contenção (Concreto + Aço)',
    domeX + domeW / 2,
    domeY - 7
  );

  // Reactor Vessel (Core)
  const coreX = domeX + 22;
  const coreY = domeY + 38;
  const coreW = 82;
  const coreH = domeH - 64;

  rdCtx.fillStyle = '#0f172a';
  rdCtx.strokeStyle = '#f43f5e';
  rdCtx.lineWidth = 2.5;
  rdCtx.beginPath();
  rdCtx.roundRect(coreX, coreY, coreW, coreH, 14);
  rdCtx.fill();
  rdCtx.stroke();

  // Fuel rods & Control rods inside core
  const rodInsert = 1 - pwrNorm; // 100% power = rods lifted
  for (let i = 0; i < 3; i++) {
    const rx = coreX + 16 + i * 21;
    // Fuel rod (glowing orange/red)
    rdCtx.fillStyle = `rgba(249, 115, 22, ${0.35 + pwrNorm * 0.65})`;
    rdCtx.fillRect(rx, coreY + 32, 8, coreH - 44);
    // Control rod (Boro/Cádmio entering from top)
    rdCtx.fillStyle = '#94a3b8';
    rdCtx.fillRect(rx - 1, coreY + 6, 10, 16 + rodInsert * (coreH - 50));
  }

  rdCtx.fillStyle = '#ffffff';
  rdCtx.font = 'bold 10.5px Segoe UI';
  rdCtx.fillText('Núcleo ²³⁵U', coreX + coreW / 2, coreY + coreH + 15);

  if (type === 'pwr' || type === 'sub') {
    // Steam Generator (Gerador de Vapor) inside Containment
    const sgX = coreX + coreW + 42;
    const sgY = coreY - 4;
    const sgW = 86;
    const sgH = coreH + 4;

    // Secondary water inside Steam Generator
    rdCtx.fillStyle = 'rgba(14, 165, 233, 0.22)';
    rdCtx.strokeStyle = '#38bdf8';
    rdCtx.lineWidth = 2;
    rdCtx.beginPath();
    rdCtx.roundRect(sgX, sgY, sgW, sgH, 14);
    rdCtx.fill();
    rdCtx.stroke();

    // Primary Loop Pipes (150 atm, 315 °C liquid water - Red/Orange)
    rdCtx.strokeStyle = '#f43f5e';
    rdCtx.lineWidth = 6.5;
    rdCtx.beginPath();
    // Hot leg (Core -> Steam Generator U-tubes)
    rdCtx.moveTo(coreX + coreW, coreY + 28);
    rdCtx.lineTo(sgX + 24, coreY + 28);
    rdCtx.lineTo(sgX + 24, coreY + coreH - 28);
    // Cold leg return
    rdCtx.lineTo(coreX + coreW, coreY + coreH - 28);
    rdCtx.stroke();

    // Animated flow dashes on Primary Loop
    rdCtx.strokeStyle = '#fde047';
    rdCtx.lineWidth = 3;
    rdCtx.setLineDash([6, 10]);
    rdCtx.lineDashOffset = -reactorDiagramState.flowPhase;
    rdCtx.stroke();
    rdCtx.setLineDash([]);

    rdCtx.fillStyle = '#fda4af';
    rdCtx.font = 'bold 10px Segoe UI';
    rdCtx.fillText('1º Circuito (150 atm)', sgX + sgW / 2, sgY + sgH + 15);
    rdCtx.fillStyle = '#bae6fd';
    rdCtx.fillText('Gerador de Vapor', sgX + sgW / 2, sgY + 15);

    // Secondary Loop (Clean Steam -> Turbine -> Condenser)
    const turbX = W * 0.61;
    const turbY = H * 0.34;

    // Steam pipe (SG top -> Turbine)
    rdCtx.strokeStyle = '#38bdf8';
    rdCtx.lineWidth = 5.5;
    rdCtx.beginPath();
    rdCtx.moveTo(sgX + sgW / 2, sgY);
    rdCtx.lineTo(sgX + sgW / 2, domeY + 12);
    rdCtx.lineTo(turbX, domeY + 12);
    rdCtx.lineTo(turbX, turbY - 26);
    // Return condensed water pipe
    rdCtx.moveTo(turbX, turbY + 26);
    rdCtx.lineTo(turbX, domeY + domeH - 32);
    rdCtx.lineTo(sgX + sgW, domeY + domeH - 32);
    rdCtx.stroke();

    rdCtx.strokeStyle = '#ffffff';
    rdCtx.lineWidth = 2.5;
    rdCtx.setLineDash([6, 12]);
    rdCtx.lineDashOffset = -reactorDiagramState.flowPhase;
    rdCtx.stroke();
    rdCtx.setLineDash([]);

    // Isolation Highlight Banner
    if (reactorDiagramState.highlightIsolation) {
      const banX = W * 0.50;
      const banY = H * 0.72;
      const banW = W * 0.47;
      const banH = 46;

      // Solid background so the pipe behind doesn't clash with text
      rdCtx.fillStyle = '#0b1120';
      rdCtx.beginPath();
      rdCtx.roundRect(banX, banY, banW, banH, 8);
      rdCtx.fill();

      rdCtx.fillStyle = 'rgba(16, 185, 129, 0.16)';
      rdCtx.strokeStyle = '#10b981';
      rdCtx.lineWidth = 1.5;
      rdCtx.beginPath();
      rdCtx.roundRect(banX, banY, banW, banH, 8);
      rdCtx.fill();
      rdCtx.stroke();

      rdCtx.fillStyle = '#6ee7b7';
      rdCtx.font = 'bold 10.5px Segoe UI';
      rdCtx.fillText('🛡️ Isolamento Total: A água radioativa do 1º circuito', banX + banW / 2, banY + 18);
      rdCtx.fillText('NUNCA toca na turbina nem na água do mar!', banX + banW / 2, banY + 34);
    }

    // Draw Turbine + Generator (or Submarine Propeller + O2 Electrolysis)
    drawTurbineAndOutput(rdCtx, turbX, turbY, W, H, type, pwrNorm, reactorDiagramState.flowPhase);
  } else {
    // BWR: 1 Single Direct Circuit (Boiling inside Reactor Vessel -> Direct to Turbine)
    const turbX = W * 0.58;
    const turbY = H * 0.35;

    rdCtx.strokeStyle = '#f59e0b';
    rdCtx.lineWidth = 5.5;
    rdCtx.beginPath();
    rdCtx.moveTo(coreX + coreW / 2, coreY);
    rdCtx.lineTo(coreX + coreW / 2, domeY + 14);
    rdCtx.lineTo(turbX, domeY + 14);
    rdCtx.lineTo(turbX, turbY - 26);
    // Return line directly to core
    rdCtx.moveTo(turbX, turbY + 26);
    rdCtx.lineTo(turbX, domeY + domeH - 32);
    rdCtx.lineTo(coreX + coreW, domeY + domeH - 32);
    rdCtx.stroke();

    rdCtx.strokeStyle = '#fef08a';
    rdCtx.lineWidth = 2.5;
    rdCtx.setLineDash([6, 12]);
    rdCtx.lineDashOffset = -reactorDiagramState.flowPhase;
    rdCtx.stroke();
    rdCtx.setLineDash([]);

    if (reactorDiagramState.highlightIsolation) {
      const banX = W * 0.44;
      const banY = H * 0.72;
      const banW = W * 0.53;
      const banH = 46;

      // Solid background so the pipe behind doesn't clash with text
      rdCtx.fillStyle = '#0b1120';
      rdCtx.beginPath();
      rdCtx.roundRect(banX, banY, banW, banH, 8);
      rdCtx.fill();

      rdCtx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      rdCtx.strokeStyle = '#f59e0b';
      rdCtx.lineWidth = 1.5;
      rdCtx.beginPath();
      rdCtx.roundRect(banX, banY, banW, banH, 8);
      rdCtx.fill();
      rdCtx.stroke();

      rdCtx.fillStyle = '#fde68a';
      rdCtx.font = 'bold 10.5px Segoe UI';
      rdCtx.fillText('⚠️ BWR (1 Circuito): O vapor que ferve no núcleo vai', banX + banW / 2, banY + 18);
      rdCtx.fillText('direto à turbina (exige blindagem radiológica na turbina!)', banX + banW / 2, banY + 34);
    }

    drawTurbineAndOutput(rdCtx, turbX, turbY, W, H, 'bwr', pwrNorm, reactorDiagramState.flowPhase);
  }

  rdCtx.restore();
}

function drawTurbineAndOutput(ctx, turbX, turbY, W, H, type, pwrNorm, phase) {
  // Spinning Turbine
  ctx.save();
  ctx.beginPath();
  ctx.arc(turbX, turbY, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = type === 'bwr' ? '#f59e0b' : '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.fill();
  ctx.stroke();

  // Turbine blades
  ctx.translate(turbX, turbY);
  ctx.rotate((phase / 40) * Math.PI * 2);
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-2, -22, 4, 44);
  }
  ctx.restore();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText('Turbina a Vapor', turbX, turbY - 34);

  // Generator / Submarine systems on the right
  const genX = W * 0.81;
  const boxW = 126;
  const boxH = 56;
  const boxLeft = genX - boxW / 2;
  const boxTop = turbY - boxH / 2;

  // Shaft from turbine to generator
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(turbX + 26, turbY);
  ctx.lineTo(boxLeft, turbY);
  ctx.stroke();

  // Generator Box
  ctx.fillStyle = '#1e1b4b';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxLeft, boxTop, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  if (type === 'sub') {
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px Segoe UI';
    ctx.fillText('⚓ Hélice + Gerador', genX, turbY - 6);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px Segoe UI';
    ctx.fillText('Eletrólise O₂ + Água', genX, turbY + 12);
  } else {
    const mw = Math.round(pwrNorm * 1350);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px Segoe UI';
    ctx.fillText('⚡ Gerador Elétrico', genX, turbY - 6);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 12.5px Segoe UI';
    ctx.fillText(`${mw} MW`, genX, turbY + 13);
  }
}

// ----------------------------------------------------------------------------
// 7. SIMULADOR SLIDE 7: GRÁFICO INTERATIVO DA BARREIRA DE COULOMB (PÁG. 5)
// ----------------------------------------------------------------------------
const coulombPlotCanvas = document.getElementById('coulombPlotCanvas');
const cpCtx = coulombPlotCanvas ? coulombPlotCanvas.getContext('2d') : null;

const coulombPlotState = {
  tempMC: 150, // 0 to 200 Milhões °C
  animPhase: 0
};

// Quantum tunneling + Maxwell-Boltzmann reactivity curve (0..100%)
function calcFusionProbability(tempMC) {
  if (tempMC <= 5) return 0;
  // Smooth S-curve rising past 50M °C, crossing ignition around 100M °C, peaking around 150-180M °C
  const norm = 1 / (1 + Math.exp(-(tempMC - 95) / 22));
  return Math.min(98, Math.max(0.5, norm * 100));
}

function updateCoulombPlotUI() {
  const t = coulombPlotState.tempMC;
  const slider = document.getElementById('coulombTempSlider');
  const label = document.getElementById('coulombTempLabel');
  const badge = document.getElementById('coulombPlotStatusBadge');

  if (slider) slider.value = String(t);
  if (label) label.textContent = `${t} M°C`;

  document.querySelectorAll('#coulombTempPresets .pill-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.ctemp) === t);
  });

  if (badge) {
    if (t < 50) {
      badge.textContent = `${t} M°C: Repulsão Eletrostática (Barreira de Coulomb Bloqueia!)`;
      badge.style.color = '#fda4af';
    } else if (t < 100) {
      badge.textContent = `${t} M°C: Tunelamento Quântico Parcial (Abaixo da Ignição)`;
      badge.style.color = '#fde047';
    } else {
      badge.textContent = `${t} M°C: Ignição Plasmática Ativa! (Força Forte Vence)`;
      badge.style.color = '#6ee7b7';
    }
  }
}

document.getElementById('coulombTempSlider')?.addEventListener('input', e => {
  coulombPlotState.tempMC = Number(e.target.value);
  updateCoulombPlotUI();
});

document.getElementById('coulombTempPresets')?.addEventListener('click', e => {
  const btn = e.target.closest('.pill-btn');
  if (!btn) return;
  coulombPlotState.tempMC = Number(btn.dataset.ctemp);
  updateCoulombPlotUI();
});

// Allow clicking directly on the plot to set temperature
if (coulombPlotCanvas) {
  coulombPlotCanvas.addEventListener('click', e => {
    const rect = coulombPlotCanvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (coulombPlotCanvas.width / rect.width);
    const padL = 54;
    const padR = 26;
    const plotW = coulombPlotCanvas.width - padL - padR;
    if (clickX >= padL && clickX <= padL + plotW) {
      const ratio = (clickX - padL) / plotW;
      coulombPlotState.tempMC = Math.round((ratio * 200) / 5) * 5;
      updateCoulombPlotUI();
    }
  });
}

function renderCoulombPlotCanvas() {
  if (!cpCtx || !coulombPlotCanvas) return;
  const W = coulombPlotCanvas.width;
  const H = coulombPlotCanvas.height;
  if (W === 0 || H === 0) return;

  const T = coulombPlotState.tempMC;
  const prob = calcFusionProbability(T);
  coulombPlotState.animPhase = (coulombPlotState.animPhase + 1.2 + (T / 200) * 2.5) % 100;

  // High-contrast, accessible dark background (no orange washout!)
  cpCtx.save();
  cpCtx.fillStyle = '#090614';
  cpCtx.fillRect(0, 0, W, H);

  // Top Strip: Virtual Particle Collision Animation (D + T vs Coulomb Barrier)
  const stripH = Math.max(58, H * 0.25);
  cpCtx.fillStyle = T >= 100 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 27, 75, 0.55)';
  cpCtx.strokeStyle = T >= 100 ? '#10b981' : 'rgba(148, 163, 184, 0.3)';
  cpCtx.lineWidth = 1.5;
  cpCtx.beginPath();
  cpCtx.roundRect(12, 8, W - 24, stripH, 8);
  cpCtx.fill();
  cpCtx.stroke();

  const targetX = W * 0.74;
  const centerY = 8 + stripH * 0.62;
  const pNorm = coulombPlotState.animPhase / 100;

  // Coulomb Barrier Potential Repulsion Ring around Target
  cpCtx.beginPath();
  cpCtx.arc(targetX, centerY, 21, 0, Math.PI * 2);
  cpCtx.strokeStyle = T >= 100 ? '#34d399' : '#fb7185';
  cpCtx.setLineDash([4, 4]);
  cpCtx.lineWidth = 2;
  cpCtx.stroke();
  cpCtx.setLineDash([]);

  // Projectile path (Repels below 50M °C, fuses above 100M °C)
  let projX;
  let projY = centerY;
  const fusesThisCycle = T >= 100 || (T >= 50 && prob > 25);

  if (!fusesThisCycle) {
    const turnX = targetX - 28 - (50 - Math.min(50, T)) * 0.5;
    if (pNorm < 0.55) {
      projX = W * 0.14 + (turnX - W * 0.14) * (pNorm / 0.55);
    } else {
      const backP = (pNorm - 0.55) / 0.45;
      projX = turnX - backP * 85;
      projY = centerY - Math.sin(backP * Math.PI) * 14;
    }
  } else {
    if (pNorm < 0.65) {
      projX = W * 0.14 + (targetX - W * 0.14) * (pNorm / 0.65);
    } else {
      projX = targetX;
      const flashR = ((pNorm - 0.65) / 0.35) * 30;
      cpCtx.beginPath();
      cpCtx.arc(targetX, centerY, flashR, 0, Math.PI * 2);
      cpCtx.strokeStyle = '#38bdf8';
      cpCtx.lineWidth = 3;
      cpCtx.stroke();
    }
  }

  // Draw Target (³H) & Projectile (²H)
  cpCtx.beginPath();
  cpCtx.arc(targetX, centerY, 11, 0, Math.PI * 2);
  cpCtx.fillStyle = '#a855f7';
  cpCtx.fill();
  cpCtx.strokeStyle = '#ffffff';
  cpCtx.lineWidth = 1.5;
  cpCtx.stroke();
  cpCtx.fillStyle = '#ffffff';
  cpCtx.font = 'bold 10px Segoe UI';
  cpCtx.textAlign = 'center';
  cpCtx.fillText('³H', targetX, centerY + 3.5);

  cpCtx.beginPath();
  cpCtx.arc(projX, projY, 9.5, 0, Math.PI * 2);
  cpCtx.fillStyle = '#0ea5e9';
  cpCtx.fill();
  cpCtx.strokeStyle = '#ffffff';
  cpCtx.lineWidth = 1.5;
  cpCtx.stroke();
  cpCtx.fillStyle = '#ffffff';
  cpCtx.fillText('²H', projX, projY + 3.5);

  cpCtx.textAlign = 'left';
  cpCtx.fillStyle = T >= 100 ? '#6ee7b7' : T >= 50 ? '#fde047' : '#fda4af';
  cpCtx.font = 'bold 11px Segoe UI';
  cpCtx.fillText(
    T < 50
      ? '❌ Abaixo de 50 M°C: A Barreira de Coulomb repele o núcleo!'
      : T < 100
      ? '⚡ 50 a 100 M°C: Tunelamento Quântico Parcial'
      : '🔥 Acima de 100 M°C: Ignição Plasmática Ativa! Fusão D+T → ⁴He + n⁰ (17,6 MeV)',
    22,
    24
  );

  // Main Plot Area: X (0 to 200 M°C) vs Y (Probabilidade de Fusão / Curva de Tunelamento)
  const padL = 52;
  const padR = 24;
  const padT = stripH + 22;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const x50 = padL + (50 / 200) * plotW;
  const ignX = padL + (100 / 200) * plotW;

  // 3 Distinct High-Contrast Regime Zones
  // Zone 1: 0-50 M°C (Repulsion)
  cpCtx.fillStyle = 'rgba(244, 63, 94, 0.06)';
  cpCtx.fillRect(padL, padT, x50 - padL, plotH);

  // Zone 2: 50-100 M°C (Tunneling)
  cpCtx.fillStyle = 'rgba(168, 85, 247, 0.07)';
  cpCtx.fillRect(x50, padT, ignX - x50, plotH);

  // Zone 3: 100-200 M°C (Plasma Ignition) — Crisp Emerald/Teal tint, keeping background dark
  cpCtx.fillStyle = T >= 100 ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.06)';
  cpCtx.fillRect(ignX, padT, padL + plotW - ignX, plotH);

  // Horizontal grid lines (25%, 50%, 75%, 100%)
  cpCtx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  cpCtx.lineWidth = 1;
  [25, 50, 75, 100].forEach(pct => {
    const gy = padT + plotH - (pct / 100) * plotH;
    cpCtx.beginPath();
    cpCtx.moveTo(padL, gy);
    cpCtx.lineTo(padL + plotW, gy);
    cpCtx.stroke();
  });

  // Threshold vertical line at 100 M°C (Ignition)
  cpCtx.beginPath();
  cpCtx.moveTo(ignX, padT);
  cpCtx.lineTo(ignX, padT + plotH);
  cpCtx.strokeStyle = T >= 100 ? '#10b981' : 'rgba(52, 211, 153, 0.55)';
  cpCtx.lineWidth = 2;
  cpCtx.setLineDash([5, 5]);
  cpCtx.stroke();
  cpCtx.setLineDash([]);

  cpCtx.fillStyle = '#6ee7b7';
  cpCtx.font = 'bold 10.5px Segoe UI';
  cpCtx.textAlign = 'center';
  cpCtx.fillText('Limiar de Ignição (100 M°C)', ignX, padT + 13);

  // Axes
  cpCtx.strokeStyle = '#94a3b8';
  cpCtx.lineWidth = 1.8;
  cpCtx.beginPath();
  cpCtx.moveTo(padL, padT);
  cpCtx.lineTo(padL, padT + plotH);
  cpCtx.lineTo(padL + plotW, padT + plotH);
  cpCtx.stroke();

  // Area fill under the curve
  cpCtx.beginPath();
  cpCtx.moveTo(padL, padT + plotH);
  for (let tx = 0; tx <= 200; tx += 2) {
    const px = padL + (tx / 200) * plotW;
    const py = padT + plotH - (calcFusionProbability(tx) / 100) * plotH;
    cpCtx.lineTo(px, py);
  }
  cpCtx.lineTo(padL + plotW, padT + plotH);
  cpCtx.closePath();
  cpCtx.fillStyle = 'rgba(56, 189, 248, 0.12)';
  cpCtx.fill();

  // Draw Tunneling / Fusion Probability Curve with Dark Outline + Bright Cyan Stroke
  cpCtx.beginPath();
  for (let tx = 0; tx <= 200; tx += 2) {
    const px = padL + (tx / 200) * plotW;
    const py = padT + plotH - (calcFusionProbability(tx) / 100) * plotH;
    if (tx === 0) cpCtx.moveTo(px, py);
    else cpCtx.lineTo(px, py);
  }
  cpCtx.strokeStyle = '#090614';
  cpCtx.lineWidth = 6.5;
  cpCtx.stroke();

  cpCtx.strokeStyle = '#38bdf8';
  cpCtx.lineWidth = 3.5;
  cpCtx.stroke();

  // Current Operating Point Crosshairs & Marker (High Contrast!)
  const curX = padL + (T / 200) * plotW;
  const curY = padT + plotH - (prob / 100) * plotH;

  cpCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  cpCtx.lineWidth = 1.2;
  cpCtx.setLineDash([3, 3]);
  cpCtx.beginPath();
  cpCtx.moveTo(curX, curY);
  cpCtx.lineTo(curX, padT + plotH);
  cpCtx.moveTo(padL, curY);
  cpCtx.lineTo(curX, curY);
  cpCtx.stroke();
  cpCtx.setLineDash([]);

  // Outer white halo ring + distinct inner color
  const markerColor = T >= 100 ? '#10b981' : T >= 50 ? '#a855f7' : '#f43f5e';
  cpCtx.beginPath();
  cpCtx.arc(curX, curY, 8.5, 0, Math.PI * 2);
  cpCtx.fillStyle = markerColor;
  cpCtx.fill();
  cpCtx.lineWidth = 3;
  cpCtx.strokeStyle = '#ffffff';
  cpCtx.stroke();

  // High-contrast dark pill callout box for current point
  const calloutText = `${T} M°C • ${prob.toFixed(0)}%`;
  cpCtx.font = 'bold 11.5px Segoe UI';
  const textW = cpCtx.measureText(calloutText).width + 16;
  const boxX = curX > W * 0.72 ? curX - textW - 12 : curX + 12;
  const boxY = Math.max(padT + 4, Math.min(padT + plotH - 28, curY - 13));

  cpCtx.fillStyle = 'rgba(9, 6, 20, 0.94)';
  cpCtx.strokeStyle = '#ffffff';
  cpCtx.lineWidth = 1.5;
  cpCtx.beginPath();
  cpCtx.roundRect(boxX, boxY, textW, 24, 6);
  cpCtx.fill();
  cpCtx.stroke();

  cpCtx.fillStyle = '#ffffff';
  cpCtx.textAlign = 'center';
  cpCtx.fillText(calloutText, boxX + textW / 2, boxY + 16);

  // Axis Labels
  cpCtx.textAlign = 'center';
  cpCtx.fillStyle = '#cbd5e1';
  cpCtx.font = '10.5px Segoe UI';
  [0, 50, 100, 150, 200].forEach(val => {
    const x = padL + (val / 200) * plotW;
    cpCtx.fillText(`${val} M°C`, x, padT + plotH + 15);
  });
  cpCtx.fillStyle = '#f8fafc';
  cpCtx.font = 'bold 11px Segoe UI';
  cpCtx.fillText('Eixo X: Temperatura do Plasma (Milhões °C)', padL + plotW / 2, H - 5);

  cpCtx.save();
  cpCtx.translate(16, padT + plotH / 2);
  cpCtx.rotate(-Math.PI / 2);
  cpCtx.fillText('Probabilidade de Fusão (%)', 0, 0);
  cpCtx.restore();

  cpCtx.restore();
}

// ----------------------------------------------------------------------------
// 8. ENQUETE DO DEBATE FINAL (SLIDE 9)
// ----------------------------------------------------------------------------
const pollVotes = { opt1: 0, opt2: 0, opt3: 0 };

function updatePollDisplay() {
  const total = pollVotes.opt1 + pollVotes.opt2 + pollVotes.opt3;
  ['opt1', 'opt2', 'opt3'].forEach((key, idx) => {
    const count = pollVotes[key];
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const fill = document.getElementById(`pollFill${idx + 1}`);
    const label = document.getElementById(`pollCount${idx + 1}`);
    if (fill) fill.style.width = `${pct}%`;
    if (label) label.textContent = `${count} (${pct}%)`;
  });
}

document.getElementById('classroomPoll')?.addEventListener('click', e => {
  const btn = e.target.closest('.poll-btn');
  if (!btn) return;
  const key = btn.dataset.vote;
  if (key in pollVotes) {
    pollVotes[key]++;
    updatePollDisplay();
  }
});

document.getElementById('resetPollBtn')?.addEventListener('click', () => {
  pollVotes.opt1 = 0;
  pollVotes.opt2 = 0;
  pollVotes.opt3 = 0;
  updatePollDisplay();
});

// ----------------------------------------------------------------------------
// 9. REDIMENSIONAMENTO PROPORCIONAL E LOOP DE ANIMAÇÃO DOS SLIDES
// ----------------------------------------------------------------------------
function resizeAllSlideCanvases() {
  const canvases = [
    centrifugeCanvas,
    fissionLoopCanvas,
    shieldCanvas,
    reactorDiagramCanvas,
    coulombPlotCanvas
  ];
  canvases.forEach(c => {
    if (!c) return;
    const parent = c.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      c.width = Math.floor(rect.width);
      c.height = Math.floor(rect.height);
    }
  });
}

window.addEventListener('resize', resizeAllSlideCanvases);
resizeAllSlideCanvases();
updateCentrifugeUI();
updateShieldUI();
updateCoulombPlotUI();

// Check initial slide from URL
const initialUrlParams = new URLSearchParams(window.location.search);
const initialHashMatch = window.location.hash.match(/slide=(\d+)/);
let startSlide = 0;
if (initialUrlParams.has('slide')) {
  startSlide = parseInt(initialUrlParams.get('slide'), 10) - 1;
} else if (initialHashMatch) {
  startSlide = parseInt(initialHashMatch[1], 10) - 1;
}
if (!isNaN(startSlide) && startSlide > 0 && startSlide < slides.length) {
  goToSlide(startSlide);
}

function animateSlideVisuals() {
  // Only render canvases that are visible (active slide or scroll mode)
  if (isScrollMode || currentSlideIndex === 1) renderCentrifugeCanvas();
  if (isScrollMode || currentSlideIndex === 2) renderFissionLoopCanvas();
  if (isScrollMode || currentSlideIndex === 3) renderShieldCanvas();
  if (isScrollMode || currentSlideIndex === 5) renderReactorDiagramCanvas();
  if (isScrollMode || currentSlideIndex === 6) renderCoulombPlotCanvas();

  requestAnimationFrame(animateSlideVisuals);
}
requestAnimationFrame(animateSlideVisuals);
