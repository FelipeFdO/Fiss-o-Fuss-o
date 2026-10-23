// ============================================================================
// SIMULADOR DE FISSÃO NUCLEAR — MODO 1 (ÁTOMO ÚNICO) & MODO 2 (REATOR EM CADEIA)
// ============================================================================

const FUELS = {
  U235: {
    id: 'U235',
    name: 'Urânio-235',
    symbol: 'U',
    Z: 92,
    A: 235,
    compoundA: 236,
    type: 'fissile',
    color: '#38bdf8',
    description:
      'O Urânio-235 é um isótopo físsil natural. Ao absorver um nêutron lento (térmico), torna-se ²³⁶U* altamente instável e se divide em dois núcleos menores mais 2 ou 3 nêutrons.',
    pathways: [
      {
        id: 'ba_kr',
        label: 'Bário-141 + Criptônio-92 + 3 nêutrons (Clássica)',
        heavy: { symbol: 'Ba', name: 'Bário-141', Z: 56, A: 141, color: '#a855f7' },
        light: { symbol: 'Kr', name: 'Criptônio-92', Z: 36, A: 92, color: '#10b981' },
        neutrons: 3,
        energyMeV: 200.4
      },
      {
        id: 'xe_sr',
        label: 'Xenônio-140 + Estrôncio-94 + 2 nêutrons',
        heavy: { symbol: 'Xe', name: 'Xenônio-140', Z: 54, A: 140, color: '#8b5cf6' },
        light: { symbol: 'Sr', name: 'Estrôncio-94', Z: 38, A: 94, color: '#14b8a6' },
        neutrons: 2,
        energyMeV: 198.5
      },
      {
        id: 'cs_rb',
        label: 'Césio-137 + Rubídio-96 + 3 nêutrons',
        heavy: { symbol: 'Cs', name: 'Césio-137', Z: 55, A: 137, color: '#ec4899' },
        light: { symbol: 'Rb', name: 'Rubídio-96', Z: 37, A: 96, color: '#22c55e' },
        neutrons: 3,
        energyMeV: 195.8
      },
      {
        id: 'te_zr',
        label: 'Telúrio-135 + Zircônio-99 + 2 nêutrons',
        heavy: { symbol: 'Te', name: 'Telúrio-135', Z: 52, A: 135, color: '#f97316' },
        light: { symbol: 'Zr', name: 'Zircônio-99', Z: 40, A: 99, color: '#06b6d4' },
        neutrons: 2,
        energyMeV: 197.2
      }
    ]
  },

  Pu239: {
    id: 'Pu239',
    name: 'Plutônio-239',
    symbol: 'Pu',
    Z: 94,
    A: 239,
    compoundA: 240,
    type: 'fissile',
    color: '#a855f7',
    description:
      'O Plutônio-239 é produzido em reatores a partir do Urânio-238. Possui alta probabilidade de fissão e libera ainda mais energia média por divisão (~207 MeV).',
    pathways: [
      {
        id: 'xe_zr',
        label: 'Xenônio-134 + Zircônio-103 + 3 nêutrons',
        heavy: { symbol: 'Xe', name: 'Xenônio-134', Z: 54, A: 134, color: '#a855f7' },
        light: { symbol: 'Zr', name: 'Zircônio-103', Z: 40, A: 103, color: '#10b981' },
        neutrons: 3,
        energyMeV: 207.1
      },
      {
        id: 'ba_mo',
        label: 'Bário-142 + Molibdênio-95 + 3 nêutrons',
        heavy: { symbol: 'Ba', name: 'Bário-142', Z: 56, A: 142, color: '#d946ef' },
        light: { symbol: 'Mo', name: 'Molibdênio-95', Z: 42, A: 95, color: '#14b8a6' },
        neutrons: 3,
        energyMeV: 210.4
      },
      {
        id: 'cs_nb',
        label: 'Césio-140 + Nióbio-97 + 3 nêutrons',
        heavy: { symbol: 'Cs', name: 'Césio-140', Z: 55, A: 140, color: '#f43f5e' },
        light: { symbol: 'Nb', name: 'Nióbio-97', Z: 41, A: 97, color: '#22c55e' },
        neutrons: 3,
        energyMeV: 205.6
      }
    ]
  },

  Th232: {
    id: 'Th232',
    name: 'Tório-232',
    symbol: 'Th',
    Z: 90,
    A: 232,
    compoundA: 233,
    type: 'fertile',
    color: '#f59e0b',
    description:
      'O Tório-232 é FÉRTIL! No 1º disparo, absorve 1 nêutron e sofre dois decaimentos Beta (β⁻), virando Protactínio-233 e depois Urânio-233 (²³³U). No 2º disparo, o ²³³U sofre fissão!',
    pathways: [
      {
        id: 'xe_sr_u233',
        label: 'Xenônio-137 + Estrôncio-94 + 3 nêutrons (via ²³³U)',
        heavy: { symbol: 'Xe', name: 'Xenônio-137', Z: 54, A: 137, color: '#a855f7' },
        light: { symbol: 'Sr', name: 'Estrôncio-94', Z: 38, A: 94, color: '#10b981' },
        neutrons: 3,
        energyMeV: 197.9
      },
      {
        id: 'ba_kr_u233',
        label: 'Bário-140 + Criptônio-91 + 3 nêutrons (via ²³³U)',
        heavy: { symbol: 'Ba', name: 'Bário-140', Z: 56, A: 140, color: '#ec4899' },
        light: { symbol: 'Kr', name: 'Criptônio-91', Z: 36, A: 91, color: '#06b6d4' },
        neutrons: 3,
        energyMeV: 199.2
      },
      {
        id: 'cs_rb_u233',
        label: 'Césio-138 + Rubídio-93 + 3 nêutrons (via ²³³U)',
        heavy: { symbol: 'Cs', name: 'Césio-138', Z: 55, A: 138, color: '#f97316' },
        light: { symbol: 'Rb', name: 'Rubídio-93', Z: 37, A: 93, color: '#22c55e' },
        neutrons: 3,
        energyMeV: 196.4
      }
    ]
  }
};

const SUPERSCRIPTS = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
};
function toSuper(num) {
  return String(num).split('').map(c => SUPERSCRIPTS[c] || c).join('');
}

function nuclideHTML(A, Z, sym, options = {}) {
  const { coeff = '', excited = false, variant = '' } = options;
  const cls = ['nuclide', variant].filter(Boolean).join(' ');
  const coeffSpan = coeff ? `<span class="coeff">${coeff}</span>` : '';
  const star = excited ? '*' : '';
  return `
    <span class="${cls}">
      ${coeffSpan}
      <span class="sup-sub">
        <span>${A}</span>
        <span>${Z}</span>
      </span>
      <span class="sym">${sym}${star}</span>
    </span>
  `;
}

const OP_PLUS = `<span class="eq-op">+</span>`;
const OP_ARROW = `<span class="eq-arrow">&rarr;</span>`;

// Application State
const state = {
  mode: 'single',            // 'single' | 'chain'
  selectedFuelKey: 'U235',
  selectedPathwayIndex: 'random',
  activePathway: null,
  projectileType: 'neutron', // 'neutron' | 'proton'
  energyLevel: 1,            // 1: Thermal, 2: Epithermal, 3: Fast
  aimAngleDeg: 0,            // -45 to +45 degrees
  simSpeed: 1.0,             // 0.25x to 1.5x
  paused: false,

  thoriumTransmutedToU233: false,

  // Single Atom Mode State
  phase: 'idle',
  phaseTimer: 0,
  nucleons: [],
  projectile: null,
  fragments: [],
  emittedNeutrons: [],
  betaParticles: [],
  gammaWaves: [],

  // Mode 2: Chain Reaction Reactor State
  chain: {
    atomCount: 50,
    enrichment: 100,          // % of fissile atoms (100% default for clear PhET-style critical mass demo)
    controlRodInsertion: 25,  // 0..100%
    moderatorOn: true,
    autoRegulate: false,      // Automatic criticality controller (k_ef = 1) + continuous fuel reload
    autoCooldown: 0,
    atoms: [],
    neutrons: [],
    fragments: [],
    sparks: [],
    fissionCount: 0,
    totalEnergyMeV: 0,
    absorbedByRods: 0,
    transmutedCount: 0,
    maxGeneration: 0,
    kEffective: 0,
    recentLogs: []
  }
};

// DOM Elements
const canvasWrapper = document.getElementById('canvasWrapper');
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const appSubtitle = document.getElementById('appSubtitle');
const modeTabs = document.getElementById('modeTabs');
const singleModeControls = document.getElementById('singleModeControls');
const chainModeControls = document.getElementById('chainModeControls');
const fuelGroupTitle = document.getElementById('fuelGroupTitle');
const fuelSelector = document.getElementById('fuelSelector');
const pathwaySelect = document.getElementById('pathwaySelect');
const projectileSelector = document.getElementById('projectileSelector');
const projectileHint = document.getElementById('projectileHint');
const energySlider = document.getElementById('energySlider');
const energyValueLabel = document.getElementById('energyValueLabel');
const aimSlider = document.getElementById('aimSlider');
const aimValueLabel = document.getElementById('aimValueLabel');
const speedSlider = document.getElementById('speedSlider');
const speedValueLabel = document.getElementById('speedValueLabel');
const fireBtn = document.getElementById('fireBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// Chain Mode DOM Elements
const atomCountSlider = document.getElementById('atomCountSlider');
const atomCountInput = document.getElementById('atomCountInput');
const atomPresetChips = document.getElementById('atomPresetChips');
const enrichmentSlider = document.getElementById('enrichmentSlider');
const enrichmentLabel = document.getElementById('enrichmentLabel');
const autoRegulatorSelector = document.getElementById('autoRegulatorSelector');
const autoModeBadge = document.getElementById('autoModeBadge');
const rodsSlider = document.getElementById('rodsSlider');
const rodsValueLabel = document.getElementById('rodsValueLabel');
const moderatorSelector = document.getElementById('moderatorSelector');
const chainSpeedSlider = document.getElementById('chainSpeedSlider');
const chainSpeedLabel = document.getElementById('chainSpeedLabel');
const scramBtn = document.getElementById('scramBtn');
const fireChainBtn = document.getElementById('fireChainBtn');
const pauseChainBtn = document.getElementById('pauseChainBtn');
const resetChainBtn = document.getElementById('resetChainBtn');

// Telemetry & Stage Elements
const stageStatusBadge = document.getElementById('stageStatusBadge');
const stageLegend = document.getElementById('stageLegend');
const reactionStepper = document.getElementById('reactionStepper');
const rightTitle1 = document.getElementById('rightTitle1');
const rightTitle2 = document.getElementById('rightTitle2');
const rightTitle3 = document.getElementById('rightTitle3');
const rightTitle4 = document.getElementById('rightTitle4');
const equationDisplay = document.getElementById('equationDisplay');
const explanationText = document.getElementById('explanationText');
const metricLabel1 = document.getElementById('metricLabel1');
const metricLabel2 = document.getElementById('metricLabel2');
const metricLabel3 = document.getElementById('metricLabel3');
const metricLabel4 = document.getElementById('metricLabel4');
const metricNucleus = document.getElementById('metricNucleus');
const metricEnergy = document.getElementById('metricEnergy');
const metricNeutronsOut = document.getElementById('metricNeutronsOut');
const metricConservation = document.getElementById('metricConservation');
const productsList = document.getElementById('productsList');

// Logical stage coordinate system (720 x 460)
const STAGE = {
  width: 720,
  height: 460,
  gunX: 95,
  gunY: 230,
  targetX: 430,
  targetY: 230,
  scale: 1,
  offsetX: 0,
  offsetY: 0
};

// Control Rod X positions inside the reactor core
const CONTROL_ROD_X = [235, 355, 475, 595];

function resizeCanvas() {
  const rect = canvasWrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));

  const scaleX = rect.width / STAGE.width;
  const scaleY = rect.height / STAGE.height;
  STAGE.scale = Math.min(scaleX, scaleY);
  STAGE.offsetX = (rect.width - STAGE.width * STAGE.scale) * 0.5;
  STAGE.offsetY = (rect.height - STAGE.height * STAGE.scale) * 0.5;
}

window.addEventListener('resize', resizeCanvas);
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(resizeCanvas).observe(canvasWrapper);
}

function setPaused(pausedState) {
  state.paused = pausedState;
  [pauseBtn, pauseChainBtn].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle('paused', state.paused);
    btn.textContent = state.paused ? '▶ Continuar' : '⏸ Pausar';
  });
}

function togglePause() {
  setPaused(!state.paused);
}

// ============================================================================
// MODE SWITCHING (1. ÁTOMO ÚNICO <-> 2. REATOR EM CADEIA)
// ============================================================================

function switchMode(newMode) {
  state.mode = newMode;
  setPaused(false);

  modeTabs.querySelectorAll('.mode-tab').forEach(tab => {
    const active = tab.dataset.mode === newMode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  if (newMode === 'single') {
    singleModeControls.classList.remove('hidden');
    chainModeControls.classList.add('hidden');
    appSubtitle.innerHTML = 'Física Nuclear Interativa &bull; Modelo da Gota Líquida';
    fuelGroupTitle.textContent = '1. Combustível Nuclear (Alvo)';

    stageLegend.innerHTML = `
      <span><i class="dot proton-dot"></i> Prótons (+)</span>
      <span><i class="dot neutron-dot"></i> Nêutrons (0)</span>
      <span><i class="dot gamma-dot"></i> Energia (γ)</span>
    `;

    reactionStepper.innerHTML = `
      <div class="step active" data-step="0">1. Alvo Estável</div>
      <div class="step" data-step="1">2. Disparo</div>
      <div class="step" data-step="2">3. Núcleo Composto</div>
      <div class="step" data-step="3">4. Gota Líquida</div>
      <div class="step" data-step="4">5. Cisão e Produtos</div>
    `;

    rightTitle1.textContent = 'Equação da Reação Nuclear';
    rightTitle2.textContent = 'O que está acontecendo?';
    rightTitle3.textContent = 'Balanço de Partículas e Energia';
    rightTitle4.textContent = 'Fragmentos e Subprodutos';
    metricLabel1.textContent = 'Núcleo Atual';
    metricLabel2.textContent = 'Energia Liberada (Q)';
    metricLabel3.textContent = 'Nêutrons Emitidos';
    metricLabel4.textContent = 'Conservação de Massa';

    resetAtom(false);
  } else {
    singleModeControls.classList.add('hidden');
    chainModeControls.classList.remove('hidden');
    appSubtitle.innerHTML = 'Simulação de Reator Nuclear &bull; Reação em Cadeia e Controle de Criticidade';
    fuelGroupTitle.textContent = '1. Combustível do Reator';

    stageLegend.innerHTML = `
      <span><i class="dot" style="background:#38bdf8"></i> Físsil</span>
      <span><i class="dot" style="background:#f59e0b"></i> Fértil (²³²Th/²³⁸U)</span>
      <span><i class="dot neutron-dot"></i> Nêutrons</span>
      <span><i class="dot" style="background:#f43f5e"></i> Barras (Boro)</span>
    `;

    reactionStepper.innerHTML = `
      <div class="step active" data-step="0">1. Reator Pronto</div>
      <div class="step" data-step="1">2. Injeção (1ª Ger.)</div>
      <div class="step" data-step="2">3. Subcrítico (k &lt; 1)</div>
      <div class="step" data-step="3">4. Crítico Estável (k &approx; 1)</div>
      <div class="step" data-step="4">5. Supercrítico (k &gt; 1)</div>
    `;

    rightTitle1.textContent = 'Estado de Multiplicação (k_ef)';
    rightTitle2.textContent = 'Dinâmica do Núcleo do Reator';
    rightTitle3.textContent = 'Telemetria da Reação em Cadeia';
    rightTitle4.textContent = 'Registro de Fissões em Cadeia';
    metricLabel1.textContent = 'Átomos Fissionados';
    metricLabel2.textContent = 'Energia Total Gerada';
    metricLabel3.textContent = 'Nêutrons (Ativos | Absorv.)';
    metricLabel4.textContent = 'Geração da Cadeia';

    resetChainReactor();
  }
}

// ============================================================================
// MODO 1: LABORATÓRIO DE ÁTOMO ÚNICO
// ============================================================================

function buildNucleons(Z, A) {
  const list = [];
  const visualCount = 84;
  const protonRatio = Z / A;

  for (let i = 0; i < visualCount; i++) {
    const frac = i / visualCount;
    const r = Math.sqrt(frac) * 48;
    const theta = i * 2.399963229728653;
    const isProton = (i * protonRatio) % 1 < protonRatio;

    list.push({
      baseR: r,
      baseTheta: theta,
      isProton,
      phaseOffset: Math.random() * Math.PI * 2,
      jitterSpeed: 1.5 + Math.random() * 1.5,
      radius: 6.4,
      lobe: Math.cos(theta) < 0.12 ? -1 : 1
    });
  }
  return list;
}

function getCurrentTargetInfo() {
  const fuel = FUELS[state.selectedFuelKey];
  if (fuel.id === 'Th232' && state.thoriumTransmutedToU233) {
    return {
      symbol: 'U',
      name: 'Urânio-233 (Gerado do Tório)',
      Z: 92,
      A: 233,
      compoundA: 234,
      isTransmutedU233: true
    };
  }
  return {
    symbol: fuel.symbol,
    name: fuel.name,
    Z: fuel.Z,
    A: fuel.A,
    compoundA: fuel.compoundA,
    isTransmutedU233: false
  };
}

function populatePathways() {
  const fuel = FUELS[state.selectedFuelKey];
  pathwaySelect.innerHTML = '';

  const randomOpt = document.createElement('option');
  randomOpt.value = 'random';
  randomOpt.textContent = '🎲 Sorteio Realista (Qualquer divisão)';
  pathwaySelect.appendChild(randomOpt);

  fuel.pathways.forEach((p, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = p.label;
    pathwaySelect.appendChild(opt);
  });

  state.selectedPathwayIndex = 'random';
}

function chooseActivePathway() {
  const fuel = FUELS[state.selectedFuelKey];
  if (state.selectedPathwayIndex === 'random') {
    const idx = Math.floor(Math.random() * fuel.pathways.length);
    return fuel.pathways[idx];
  }
  return fuel.pathways[Number(state.selectedPathwayIndex)] || fuel.pathways[0];
}

function setStepActive(stepIndex) {
  const steps = reactionStepper.querySelectorAll('.step');
  steps.forEach((el, idx) => {
    el.classList.toggle('active', idx === stepIndex);
  });
}

function resetAtom(preserveThoriumU233 = false) {
  if (!preserveThoriumU233) {
    state.thoriumTransmutedToU233 = false;
  }

  setPaused(false);
  state.phase = 'idle';
  state.phaseTimer = 0;
  state.projectile = null;
  state.fragments = [];
  state.emittedNeutrons = [];
  state.betaParticles = [];
  state.gammaWaves = [];

  const target = getCurrentTargetInfo();
  state.nucleons = buildNucleons(target.Z, target.A);

  setStepActive(0);
  updateIdleTelemetry();
}

function updateIdleTelemetry() {
  if (state.mode !== 'single') return;
  const fuel = FUELS[state.selectedFuelKey];
  const target = getCurrentTargetInfo();
  const N = target.A - target.Z;
  const previewPathway = chooseActivePathway();

  metricNucleus.textContent = `${toSuper(target.A)}${target.symbol} (${target.Z}p, ${N}n)`;
  metricEnergy.textContent = '0.0 MeV';
  metricNeutronsOut.textContent = '0';
  metricConservation.textContent = `${target.A} = ${target.A}`;

  if (fuel.id === 'Th232' && !state.thoriumTransmutedToU233) {
    fireBtn.textContent = '🎯 1º DISPARO: ²³²Th';
    stageStatusBadge.textContent = 'Alvo Fértil: Tório-232 (Aguardando 1º Nêutron)';
    equationDisplay.innerHTML =
      nuclideHTML(1, 0, 'n') +
      OP_PLUS +
      nuclideHTML(232, 90, 'Th') +
      OP_ARROW +
      nuclideHTML(233, 90, 'Th', { excited: true, variant: 'unstable' }) +
      OP_ARROW +
      nuclideHTML(233, 91, 'Pa') +
      OP_ARROW +
      nuclideHTML(233, 92, 'U', { variant: 'highlight' }) +
      OP_PLUS +
      `<span class="eq-energy">2 β⁻</span>`;
    explanationText.textContent = fuel.description;
  } else if (fuel.id === 'Th232' && state.thoriumTransmutedToU233) {
    fireBtn.textContent = '💥 2º DISPARO: ²³³U';
    stageStatusBadge.textContent = 'Alvo Pronto: Urânio-233 Físsil!';
    equationDisplay.innerHTML =
      nuclideHTML(1, 0, 'n') +
      OP_PLUS +
      nuclideHTML(233, 92, 'U', { variant: 'highlight' }) +
      OP_ARROW +
      nuclideHTML(234, 92, 'U', { excited: true, variant: 'unstable' }) +
      OP_ARROW +
      nuclideHTML(previewPathway.heavy.A, previewPathway.heavy.Z, previewPathway.heavy.symbol) +
      OP_PLUS +
      nuclideHTML(previewPathway.light.A, previewPathway.light.Z, previewPathway.light.symbol) +
      OP_PLUS +
      nuclideHTML(1, 0, 'n', { coeff: previewPathway.neutrons });
    explanationText.textContent =
      'O Tório-232 absorveu o primeiro nêutron e emitiu 2 partículas Beta (β⁻), transformando-se em Urânio-233 (²³³U)! Dispare mais um nêutron para fissioná-lo.';
  } else {
    fireBtn.textContent = '🎯 DISPARAR';
    stageStatusBadge.textContent = `Alvo Estável: ${target.name}`;
    equationDisplay.innerHTML =
      nuclideHTML(1, 0, 'n') +
      OP_PLUS +
      nuclideHTML(target.A, target.Z, target.symbol, { variant: 'highlight' }) +
      OP_ARROW +
      nuclideHTML(target.compoundA, target.Z, target.symbol, { excited: true, variant: 'unstable' }) +
      OP_ARROW +
      `<span class="eq-energy">Fragmentos + Energia</span>`;
    explanationText.textContent = fuel.description;
  }

  productsList.innerHTML = `<div class="empty-products">Dispare uma partícula para ver os produtos gerados.</div>`;
}

function fireProjectile() {
  setPaused(false);
  if (state.phase === 'scission' || state.phase === 'deflected') {
    resetAtom(false);
  }
  if (state.phase !== 'idle') return;

  state.activePathway = chooseActivePathway();
  state.phase = 'approaching';
  state.phaseTimer = 0;
  setStepActive(1);

  const speedMap = { 1: 4.0, 2: 6.5, 3: 9.8 };
  const baseSpeed = speedMap[state.energyLevel] || 4.0;
  const rad = (state.aimAngleDeg * Math.PI) / 180;
  const aimRad = rad * 0.34;

  state.projectile = {
    x: STAGE.gunX + 40,
    y: STAGE.gunY,
    vx: Math.cos(aimRad) * baseSpeed,
    vy: Math.sin(aimRad) * baseSpeed,
    type: state.projectileType,
    trail: []
  };

  stageStatusBadge.textContent =
    state.projectileType === 'neutron'
      ? 'Nêutron em trajetória de colisão...'
      : 'Próton disparado contra a Barreira de Coulomb...';
}

function handleNuclearImpact() {
  const fuel = FUELS[state.selectedFuelKey];
  const target = getCurrentTargetInfo();

  if (state.projectileType === 'proton') {
    state.phase = 'deflected';
    state.phaseTimer = 0;
    stageStatusBadge.textContent = 'Repulsão Eletrostática (Barreira de Coulomb)!';
    equationDisplay.innerHTML =
      nuclideHTML(1, 1, 'p⁺') +
      OP_PLUS +
      nuclideHTML(target.A, target.Z, target.symbol) +
      OP_ARROW +
      `<span class="eq-energy">Desvio Eletrostático (Sem Fissão)</span>`;
    explanationText.textContent =
      'Como o Próton tem carga positiva (+1) e o núcleo possui dezenas de prótons positivos, a repulsão elétrica (Barreira de Coulomb) desvia o próton! Por isso usamos NÊUTRONS (carga zero) na fissão.';
    return;
  }

  if (fuel.id === 'Th232' && !state.thoriumTransmutedToU233) {
    state.phase = 'transmuting';
    state.phaseTimer = 0;
    state.projectile = null;
    setStepActive(2);
    stageStatusBadge.textContent = 'Transmutação: ²³²Th → ²³³Th* → ²³³Pa → ²³³U';
    equationDisplay.innerHTML =
      nuclideHTML(1, 0, 'n') +
      OP_PLUS +
      nuclideHTML(232, 90, 'Th') +
      OP_ARROW +
      nuclideHTML(233, 91, 'Pa') +
      OP_PLUS +
      `<span class="eq-energy">β⁻</span>` +
      OP_ARROW +
      nuclideHTML(233, 92, 'U', { variant: 'highlight' }) +
      OP_PLUS +
      `<span class="eq-energy">2 β⁻</span>`;
    explanationText.textContent =
      'O Tório-232 absorveu o nêutron virando ²³³Th. Dois nêutrons do núcleo convertem-se em prótons emitindo 2 elétrons rápidos (β⁻), transformando o núcleo em Urânio-233 físsil!';

    state.betaParticles = [
      { x: STAGE.targetX, y: STAGE.targetY, vx: 4.0, vy: -3.2, label: 'β⁻ (e⁻)' },
      { x: STAGE.targetX, y: STAGE.targetY, vx: 3.4, vy: 3.6, label: 'β⁻ (e⁻)' }
    ];
    state.gammaWaves.push({ x: STAGE.targetX, y: STAGE.targetY, r: 10, maxR: 135, alpha: 1 });
    return;
  }

  state.phase = 'compound';
  state.phaseTimer = 0;
  state.projectile = null;
  setStepActive(2);

  stageStatusBadge.textContent = `Núcleo Composto Excitado: ${toSuper(target.compoundA)}${target.symbol}*`;
  equationDisplay.innerHTML =
    nuclideHTML(1, 0, 'n') +
    OP_PLUS +
    nuclideHTML(target.A, target.Z, target.symbol) +
    OP_ARROW +
    nuclideHTML(target.compoundA, target.Z, target.symbol, { excited: true, variant: 'unstable' });
  explanationText.textContent =
    `O nêutron foi capturado! O núcleo composto ${toSuper(target.compoundA)}${target.symbol}* vibra intensamente com excesso de energia (~6,5 MeV).`;
}

function triggerScission() {
  state.phase = 'scission';
  state.phaseTimer = 0;
  setStepActive(4);

  const target = getCurrentTargetInfo();
  const pw = state.activePathway;

  state.fragments = [
    {
      ...pw.heavy,
      x: STAGE.targetX - 34,
      y: STAGE.targetY - 12,
      vx: -2.0,
      vy: -0.95,
      radius: 32,
      nucleons: buildFragmentNucleons(pw.heavy.Z, pw.heavy.A, 31)
    },
    {
      ...pw.light,
      x: STAGE.targetX + 20,
      y: STAGE.targetY + 14,
      vx: 1.55,
      vy: 1.15,
      radius: 26,
      nucleons: buildFragmentNucleons(pw.light.Z, pw.light.A, 25)
    }
  ];

  state.emittedNeutrons = [];
  const angles = pw.neutrons === 3 ? [-0.52, -0.04, 0.46] : [-0.36, 0.36];
  angles.forEach((ang, i) => {
    const spd = 4.6 + i * 0.25;
    state.emittedNeutrons.push({
      index: i + 1,
      x: STAGE.targetX,
      y: STAGE.targetY,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      trail: []
    });
  });

  state.gammaWaves.push(
    { x: STAGE.targetX, y: STAGE.targetY, r: 10, maxR: 220, alpha: 1.0 },
    { x: STAGE.targetX, y: STAGE.targetY, r: 4, maxR: 160, alpha: 0.85 }
  );

  stageStatusBadge.textContent = `Cisão Completa! +${pw.energyMeV} MeV (${pw.neutrons} nêutrons emitidos)`;
  equationDisplay.innerHTML =
    nuclideHTML(1, 0, 'n') +
    OP_PLUS +
    nuclideHTML(target.A, target.Z, target.symbol) +
    OP_ARROW +
    nuclideHTML(target.compoundA, target.Z, target.symbol, { excited: true, variant: 'unstable' }) +
    OP_ARROW +
    nuclideHTML(pw.heavy.A, pw.heavy.Z, pw.heavy.symbol, { variant: 'highlight' }) +
    OP_PLUS +
    nuclideHTML(pw.light.A, pw.light.Z, pw.light.symbol, { variant: 'highlight' }) +
    OP_PLUS +
    nuclideHTML(1, 0, 'n', { coeff: pw.neutrons }) +
    OP_PLUS +
    `<span class="eq-energy">${pw.energyMeV} MeV</span>`;

  explanationText.textContent =
    `O "pescoço" da gota líquida se rompeu! A repulsão elétrica arremessa o ${pw.heavy.name} e o ${pw.light.name} em sentidos opostos, liberando ${pw.neutrons} novos nêutrons livres (visíveis à direita) e ${pw.energyMeV} MeV de energia.`;

  metricNucleus.textContent = `${toSuper(pw.heavy.A)}${pw.heavy.symbol} + ${toSuper(pw.light.A)}${pw.light.symbol}`;
  metricEnergy.textContent = `${pw.energyMeV.toFixed(1)} MeV`;
  metricNeutronsOut.textContent = `${pw.neutrons} nêutrons livres`;
  const totalOut = pw.heavy.A + pw.light.A + pw.neutrons;
  metricConservation.textContent = `${target.A}+1 = ${totalOut} (${pw.heavy.A}+${pw.light.A}+${pw.neutrons})`;

  productsList.innerHTML = `
    <div class="product-item fragment-heavy">
      <div>
        <strong>${toSuper(pw.heavy.A)}${pw.heavy.symbol} — ${pw.heavy.name}</strong>
        <div style="font-size:0.68rem;color:#94a3b8">${pw.heavy.Z} prótons, ${pw.heavy.A - pw.heavy.Z} nêutrons</div>
      </div>
      <span class="tag tag-fissile">Pesado</span>
    </div>
    <div class="product-item fragment-light">
      <div>
        <strong>${toSuper(pw.light.A)}${pw.light.symbol} — ${pw.light.name}</strong>
        <div style="font-size:0.68rem;color:#94a3b8">${pw.light.Z} prótons, ${pw.light.A - pw.light.Z} nêutrons</div>
      </div>
      <span class="tag tag-fissile">Leve</span>
    </div>
    <div class="product-item neutron-item">
      <div>
        <strong>${pw.neutrons} Nêutrons Livres (¹₀n)</strong>
        <div style="font-size:0.68rem;color:#94a3b8">Mantêm a reação em cadeia</div>
      </div>
      <span class="value-pill">+${pw.energyMeV} MeV</span>
    </div>
  `;

  fireBtn.textContent = '🎯 NOVO DISPARO';
}

function buildFragmentNucleons(Z, A, maxVisualRadius) {
  const count = Math.round(maxVisualRadius * 1.25);
  const ratio = Z / A;
  const arr = [];
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(i / count) * maxVisualRadius;
    const theta = i * 2.3999632;
    arr.push({
      r,
      theta,
      isProton: (i * ratio) % 1 < ratio
    });
  }
  return arr;
}

// ============================================================================
// MODO 2: REATOR EM CADEIA (CORE ENGINE — ATÉ 150 ÁTOMOS & PILOTO AUTOMÁTICO)
// ============================================================================

function getAtomVisualRadius(count) {
  if (count <= 30) return 14.0;
  if (count <= 60) return 11.8;
  if (count <= 105) return 9.4;
  return 7.8; // 106 to 150 atoms
}

function resetChainReactor() {
  setPaused(false);
  const ch = state.chain;
  ch.atoms = [];
  ch.neutrons = [];
  ch.fragments = [];
  ch.sparks = [];
  ch.fissionCount = 0;
  ch.totalEnergyMeV = 0;
  ch.absorbedByRods = 0;
  ch.transmutedCount = 0;
  ch.maxGeneration = 0;
  ch.kEffective = 0;
  ch.recentLogs = [];
  ch.autoCooldown = 0;
  state.gammaWaves = [];

  const count = Math.max(5, Math.min(150, ch.atomCount));
  const fuel = FUELS[state.selectedFuelKey];
  const baseRadius = getAtomVisualRadius(count);

  // Calculate grid cols/rows to distribute atoms evenly across the reactor core (x: 152..680, y: 52..408)
  const cols = Math.max(2, Math.round(Math.sqrt(count * 1.48)));
  const rows = Math.ceil(count / cols);
  const startX = 154;
  const endX = 680;
  const startY = 52;
  const endY = 408;
  const stepX = cols > 1 ? (endX - startX) / (cols - 1) : 0;
  const stepY = rows > 1 ? (endY - startY) / (rows - 1) : 0;

  let created = 0;
  for (let r = 0; r < rows && created < count; r++) {
    for (let c = 0; c < cols && created < count; c++) {
      let x = cols > 1
        ? startX + c * stepX + (r % 2 === 1 ? stepX * 0.18 : -stepX * 0.1)
        : 415 + (Math.random() - 0.5) * 80;
      let y = rows > 1
        ? startY + r * stepY + (Math.random() - 0.5) * Math.min(8, stepY * 0.22)
        : 230;

      // Keep clear of Boron Control Rod guide columns
      CONTROL_ROD_X.forEach(rx => {
        const minGap = baseRadius + 8;
        if (Math.abs(x - rx) < minGap) {
          x += x < rx ? -(minGap - Math.abs(x - rx)) : (minGap - Math.abs(x - rx));
        }
      });

      const isEnrichedRoll = (created / count) * 100 < ch.enrichment;
      let isotope = fuel.id;
      let isFissile = true;
      let label = `${toSuper(fuel.A)}${fuel.symbol}`;
      let compoundLabel = `${toSuper(fuel.compoundA)}${fuel.symbol}*`;

      if (fuel.id === 'Th232') {
        if (isEnrichedRoll) {
          isotope = 'U233';
          isFissile = true;
          label = '²³³U';
          compoundLabel = '²³⁴U*';
        } else {
          isotope = 'Th232';
          isFissile = false;
          label = '²³²Th';
          compoundLabel = '²³³Th*';
        }
      } else {
        if (!isEnrichedRoll) {
          isotope = 'U238';
          isFissile = false;
          label = '²³⁸U';
          compoundLabel = '²³⁹U*';
        }
      }

      ch.atoms.push({
        id: created + 1,
        x: Math.max(144, Math.min(686, x)),
        y: Math.max(44, Math.min(416, y)),
        radius: baseRadius,
        baseIsotope: isotope,
        baseIsFissile: isFissile,
        baseLabel: label,
        baseCompoundLabel: compoundLabel,
        isotope,
        isFissile,
        label,
        compoundLabel,
        excited: false,
        excitedTimer: 0,
        pendingGen: 1,
        fissioned: false,
        respawnTimer: 0,
        pulsePhase: Math.random() * Math.PI * 2
      });
      created++;
    }
  }

  // Shuffle fissile/fertile positions so they are well mixed in the core
  for (let i = ch.atoms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const props = ['isotope', 'isFissile', 'label', 'compoundLabel', 'baseIsotope', 'baseIsFissile', 'baseLabel', 'baseCompoundLabel'];
    props.forEach(p => {
      const tmp = ch.atoms[i][p];
      ch.atoms[i][p] = ch.atoms[j][p];
      ch.atoms[j][p] = tmp;
    });
  }

  setStepActive(0);
  updateChainTelemetry();
}

// Strict inner boundaries of the Reactor Core Vessel (box: x=130..700, y=26..434)
const CORE_BOUNDS = {
  left: 136,
  right: 694,
  top: 32,
  bottom: 428
};

function injectChainNeutron(targetY = STAGE.gunY) {
  setPaused(false);
  const ch = state.chain;

  // If all fissile atoms were already consumed in Manual mode, reset automatically first
  const remainingFissile = ch.atoms.filter(a => !a.fissioned && a.isFissile).length;
  if (!ch.autoRegulate && ch.fissionCount > 0 && remainingFissile === 0 && ch.neutrons.length === 0) {
    resetChainReactor();
  }

  // Spawn right inside the left wall of the reactor vessel (x = 136) so it never flies outside the atom area!
  const spawnX = CORE_BOUNDS.left + 2;
  const spawnY = STAGE.gunY;

  // Aim toward the nearest intact atom near targetY so the 1st shot reliably initiates a collision
  let aimAngle = (Math.random() - 0.5) * 0.2;
  const candidates = ch.atoms.filter(a => !a.fissioned && !a.excited);
  if (candidates.length > 0) {
    candidates.sort((a, b) => Math.hypot(a.x - 180, a.y - targetY) - Math.hypot(b.x - 180, b.y - targetY));
    const firstTarget = candidates[0];
    aimAngle = Math.atan2(firstTarget.y - spawnY, Math.max(12, firstTarget.x - spawnX));
  }

  // Starter neutron is injected as a thermal neutron (slow, high capture cross-section)
  const speed = 2.1;
  ch.neutrons.push({
    x: spawnX,
    y: spawnY,
    vx: Math.cos(aimAngle) * speed,
    vy: Math.sin(aimAngle) * speed,
    isFast: false,
    age: 0,
    bounces: 0,
    generation: 1,
    trail: []
  });

  if (ch.maxGeneration < 1) ch.maxGeneration = 1;
  setStepActive(1);
  updateChainTelemetry();
}

function triggerChainAtomFission(atom, incomingGen) {
  const ch = state.chain;
  const fuel = FUELS[state.selectedFuelKey];
  const pw = fuel.pathways[Math.floor(Math.random() * fuel.pathways.length)];

  atom.excited = false;
  atom.fissioned = true;
  atom.respawnTimer = ch.autoRegulate ? 165 : 0; // In Auto Mode, fuel assembly replenishes after ~2.7s
  ch.fissionCount++;
  ch.totalEnergyMeV += pw.energyMeV;

  // Create 2 local daughter fragments (e.g., Ba-141 + Kr-92) flying apart with realistic damping
  const splitAngle = Math.random() * Math.PI * 2;
  ch.fragments.push(
    {
      x: atom.x,
      y: atom.y,
      vx: Math.cos(splitAngle) * 1.1,
      vy: Math.sin(splitAngle) * 1.1,
      sym: `${toSuper(pw.heavy.A)}${pw.heavy.symbol}`,
      color: '#a855f7',
      life: 140
    },
    {
      x: atom.x,
      y: atom.y,
      vx: -Math.cos(splitAngle) * 1.2,
      vy: -Math.sin(splitAngle) * 1.2,
      sym: `${toSuper(pw.light.A)}${pw.light.symbol}`,
      color: '#10b981',
      life: 140
    }
  );

  // Expanding gamma flash
  state.gammaWaves.push({
    x: atom.x,
    y: atom.y,
    r: 5,
    maxR: 56,
    alpha: 0.9
  });

  // Emit 2 or 3 prompt FAST neutrons for the next generation (as described on Page 2 of the PDF!)
  const nextGen = incomingGen + 1;
  if (nextGen > ch.maxGeneration) ch.maxGeneration = nextGen;

  const baseAngle = Math.random() * Math.PI * 2;
  for (let i = 0; i < pw.neutrons; i++) {
    const ang = baseAngle + (i * (Math.PI * 2)) / pw.neutrons + (Math.random() - 0.5) * 0.4;
    const fastSpeed = 2.85 + Math.random() * 0.35;
    const nx = Math.max(CORE_BOUNDS.left + 2, Math.min(CORE_BOUNDS.right - 2, atom.x + Math.cos(ang) * (atom.radius * 0.5)));
    const ny = Math.max(CORE_BOUNDS.top + 2, Math.min(CORE_BOUNDS.bottom - 2, atom.y + Math.sin(ang) * (atom.radius * 0.5)));
    ch.neutrons.push({
      x: nx,
      y: ny,
      vx: Math.cos(ang) * fastSpeed,
      vy: Math.sin(ang) * fastSpeed,
      isFast: true, // Born fast! Moderator will slow it down into a thermal neutron
      age: 0,
      bounces: 0,
      generation: nextGen,
      trail: []
    });
  }

  // Add to recent fission logs
  ch.recentLogs.unshift({
    gen: incomingGen,
    parent: atom.label,
    heavy: `${toSuper(pw.heavy.A)}${pw.heavy.symbol}`,
    light: `${toSuper(pw.light.A)}${pw.light.symbol}`,
    neutrons: pw.neutrons,
    energy: pw.energyMeV
  });
  if (ch.recentLogs.length > 5) ch.recentLogs.pop();

  updateChainTelemetry();
}

function updateAutoRegulator(dt) {
  const ch = state.chain;
  if (!ch.autoRegulate) return;

  // 1. Continuous Fuel Replenishment (simulating continuous commercial reactor operation)
  for (const atom of ch.atoms) {
    if (atom.fissioned) {
      atom.respawnTimer -= dt;
      if (atom.respawnTimer <= 0) {
        atom.fissioned = false;
        atom.excited = false;
        atom.isotope = atom.baseIsotope;
        atom.isFissile = atom.baseIsFissile;
        atom.label = atom.baseLabel;
        atom.compoundLabel = atom.baseCompoundLabel;
        ch.sparks.push({ x: atom.x, y: atom.y, r: 2, maxR: 16, color: '#38bdf8', alpha: 0.7 });
      }
    }
  }

  // 2. Automatic Control Rod PID Regulator to hold k_ef = 1.00 (steady 4-6 active neutrons)
  const excitedCount = ch.atoms.filter(a => a.excited).length;
  const targetActivity = 5; // Ideal steady-state neutron flux for k_ef = 1.00
  const activeActivity = ch.neutrons.length + excitedCount * 1.8;

  const error = activeActivity - targetActivity;
  let newRodPos = ch.controlRodInsertion + error * 0.32 * dt;
  newRodPos = Math.max(12, Math.min(88, newRodPos));

  if (Math.abs(newRodPos - ch.controlRodInsertion) >= 0.05) {
    ch.controlRodInsertion = Number(newRodPos.toFixed(1));
    if (rodsSlider) rodsSlider.value = String(Math.round(ch.controlRodInsertion));
    if (rodsValueLabel) rodsValueLabel.textContent = `${Math.round(ch.controlRodInsertion)}% (Auto)`;
  }

  // Active Soluble Boron / Control Rod trim in Auto Mode so even 100-150 atoms stay strictly at k_ef = 1.00!
  if (ch.neutrons.length > 7 && Math.random() < 0.25 * dt) {
    const popped = ch.neutrons.pop();
    if (popped) {
      ch.absorbedByRods++;
      ch.sparks.push({ x: popped.x, y: popped.y, r: 2, maxR: 18, color: '#f43f5e', alpha: 0.9 });
    }
  }

  // 3. Auto-inject starter neutron if reaction dies out completely
  if (ch.neutrons.length === 0 && excitedCount === 0) {
    ch.autoCooldown += dt;
    if (ch.autoCooldown > 30) {
      ch.autoCooldown = 0;
      injectChainNeutron(STAGE.gunY + (Math.random() - 0.5) * 140);
    }
  } else {
    ch.autoCooldown = 0;
  }
}

function updateChainSimulation(dt) {
  const ch = state.chain;

  // Run Auto-Regulator if enabled
  updateAutoRegulator(dt);

  // Update excited compound nuclei (e.g. ²³⁶U* vibrating intensely before splitting, as in PDF Page 2!)
  for (const atom of ch.atoms) {
    if (atom.excited && !atom.fissioned) {
      atom.excitedTimer -= dt;
      if (atom.excitedTimer <= 0) {
        triggerChainAtomFission(atom, atom.pendingGen);
      }
    }
  }

  const rodBottomY = 30 + (ch.controlRodInsertion / 100) * 395;

  // Move active neutrons
  for (let i = ch.neutrons.length - 1; i >= 0; i--) {
    const n = ch.neutrons[i];
    n.age += dt;
    n.trail.push({ x: n.x, y: n.y });
    if (n.trail.length > 13) n.trail.shift();

    n.x += n.vx * dt;
    n.y += n.vy * dt;

    // Water/Graphite Moderator decelerates fast neutrons into thermal (slow) neutrons!
    if (ch.moderatorOn && n.isFast) {
      const spd = Math.hypot(n.vx, n.vy);
      if (spd > 1.9) {
        n.vx *= Math.pow(0.97, dt);
        n.vy *= Math.pow(0.97, dt);
      } else {
        n.isFast = false;
      }
      if (n.age > 17) {
        n.isFast = false;
      }
    }

    // 1. Check collision with Boron/Cadmium Control Rods (plus soluble Boron absorption when rods > 35%)
    let hitRod = false;
    const rodHalfWidth = ch.atoms.length >= 90 ? 11.5 : 9.0;
    for (const rx of CONTROL_ROD_X) {
      if (n.y <= rodBottomY && Math.abs(n.x - rx) <= rodHalfWidth) {
        hitRod = true;
        break;
      }
    }
    if (!hitRod && ch.controlRodInsertion >= 40 && n.age > 10) {
      // Distributed Boron control bank absorption proportional to rod insertion depth
      const boronProb = ((ch.controlRodInsertion - 35) / 65) * 0.028 * dt;
      if (Math.random() < boronProb) {
        hitRod = true;
      }
    }
    if (hitRod) {
      ch.absorbedByRods++;
      ch.sparks.push({ x: n.x, y: n.y, r: 2, maxR: 20, color: '#f43f5e', alpha: 1 });
      ch.neutrons.splice(i, 1);
      updateChainTelemetry();
      continue;
    }

    // 2. STRICT CONTAINMENT INSIDE THE ATOM AREA (CORE_BOUNDS: x=136..694, y=32..428)
    // Neutrons NEVER leave the reactor vessel box!
    let hitWall = false;
    if (n.x <= CORE_BOUNDS.left) {
      n.x = CORE_BOUNDS.left;
      n.vx = Math.abs(n.vx);
      hitWall = true;
    } else if (n.x >= CORE_BOUNDS.right) {
      n.x = CORE_BOUNDS.right;
      n.vx = -Math.abs(n.vx);
      hitWall = true;
    }
    if (n.y <= CORE_BOUNDS.top) {
      n.y = CORE_BOUNDS.top;
      n.vy = Math.abs(n.vy);
      hitWall = true;
    } else if (n.y >= CORE_BOUNDS.bottom) {
      n.y = CORE_BOUNDS.bottom;
      n.vy = -Math.abs(n.vy);
      hitWall = true;
    }

    if (hitWall) {
      n.bounces = (n.bounces || 0) + 1;
      // In dispersed/subcritical cores (<=22 atoms) or without moderator, hitting the vessel wall absorbs the neutron
      // right on the inner border so the subcritical reaction dies out WITHOUT any neutron ever leaving the box!
      const wallAbsorbProb = ch.atomCount <= 22 ? 0.78 : (!ch.moderatorOn ? 0.65 : (n.bounces >= 3 ? 0.75 : 0.25));
      if (Math.random() < wallAbsorbProb || n.age > 240) {
        ch.sparks.push({ x: n.x, y: n.y, r: 2, maxR: 15, color: '#64748b', alpha: 0.85 });
        ch.neutrons.splice(i, 1);
        updateChainTelemetry();
        continue;
      }
    }

    // 3. Check collision with Reactor Core Atoms
    let consumed = false;
    for (const atom of ch.atoms) {
      if (atom.fissioned || atom.excited) continue;
      const captureRadius = atom.radius + (ch.moderatorOn ? 3.2 : 0.8);
      const dist = Math.hypot(n.x - atom.x, n.y - atom.y);

      if (dist <= captureRadius) {
        if (atom.isFissile) {
          // Without moderator, fast neutrons have low fission cross-section in U-235 (PDF Page 2 & Page 6 Q2!)
          if (!ch.moderatorOn && n.isFast && Math.random() < 0.72) {
            const ang = Math.atan2(n.y - atom.y, n.x - atom.x) + (Math.random() - 0.5) * 0.5;
            const spd = Math.hypot(n.vx, n.vy);
            n.vx = Math.cos(ang) * spd;
            n.vy = Math.sin(ang) * spd;
            n.x = Math.max(CORE_BOUNDS.left, Math.min(CORE_BOUNDS.right, atom.x + Math.cos(ang) * (captureRadius + 2)));
            n.y = Math.max(CORE_BOUNDS.top, Math.min(CORE_BOUNDS.bottom, atom.y + Math.sin(ang) * (captureRadius + 2)));
            continue;
          }

          // Neutron absorbed! Atom transitions to excited state (e.g. U-236*) and vibrates before splitting!
          atom.excited = true;
          atom.excitedTimer = 26;
          atom.pendingGen = n.generation;
          ch.sparks.push({ x: atom.x, y: atom.y, r: 3, maxR: atom.radius + 12, color: '#facc15', alpha: 0.95 });
          consumed = true;
          updateChainTelemetry();
          break;
        } else if (atom.isotope === 'Th232') {
          atom.isotope = 'U233';
          atom.isFissile = true;
          atom.label = '²³³U';
          atom.compoundLabel = '²³⁴U*';
          ch.transmutedCount++;
          ch.sparks.push({ x: atom.x, y: atom.y, r: 4, maxR: 28, color: '#fde047', alpha: 1 });
          consumed = true;
          updateChainTelemetry();
          break;
        } else {
          if (Math.random() < 0.65) {
            atom.isotope = 'Pu239';
            atom.isFissile = true;
            atom.label = '²³⁹Pu';
            atom.compoundLabel = '²⁴⁰Pu*';
            ch.transmutedCount++;
            ch.sparks.push({ x: atom.x, y: atom.y, r: 4, maxR: 26, color: '#a855f7', alpha: 1 });
            consumed = true;
            updateChainTelemetry();
            break;
          } else {
            const ang = Math.atan2(n.y - atom.y, n.x - atom.x);
            const spd = Math.hypot(n.vx, n.vy);
            n.vx = Math.cos(ang) * spd;
            n.vy = Math.sin(ang) * spd;
          }
        }
      }
    }

    if (consumed) {
      ch.neutrons.splice(i, 1);
      continue;
    }
  }

  // Move daughter fragments locally, strictly clamped inside CORE_BOUNDS
  for (let i = ch.fragments.length - 1; i >= 0; i--) {
    const f = ch.fragments[i];
    f.x = Math.max(CORE_BOUNDS.left + 4, Math.min(CORE_BOUNDS.right - 4, f.x + f.vx * dt));
    f.y = Math.max(CORE_BOUNDS.top + 8, Math.min(CORE_BOUNDS.bottom - 4, f.y + f.vy * dt));
    f.vx *= Math.pow(0.92, dt);
    f.vy *= Math.pow(0.92, dt);
    if (ch.autoRegulate) {
      f.life -= dt;
      if (f.life <= 0) ch.fragments.splice(i, 1);
    }
  }

  // Expand absorption/transmutation sparks
  for (let i = ch.sparks.length - 1; i >= 0; i--) {
    const s = ch.sparks[i];
    s.r += 1.6 * dt;
    s.alpha = Math.max(0, 1 - s.r / s.maxR);
    if (s.alpha <= 0) ch.sparks.splice(i, 1);
  }
}

function estimateKeffective() {
  const ch = state.chain;
  if (ch.autoRegulate && (ch.neutrons.length > 0 || ch.atoms.some(a => a.excited))) {
    const excitedCount = ch.atoms.filter(a => a.excited).length;
    const active = ch.neutrons.length + excitedCount;
    return Math.max(0.96, Math.min(1.04, 0.98 + (active - 5) * 0.01));
  }
  const intactFissile = ch.atoms.filter(a => !a.fissioned && a.isFissile).length;
  const massFactor = Math.pow(intactFissile / 30, 0.65);
  const rodFactor = 1 - (ch.controlRodInsertion / 100) * 0.94;
  const modFactor = ch.moderatorOn ? 1.28 : 0.42;
  const nu = state.selectedFuelKey === 'Pu239' ? 2.85 : 2.45;
  const k = Math.max(0, massFactor * rodFactor * modFactor * (nu / 2.35));
  return k;
}

function updateChainTelemetry() {
  if (state.mode !== 'chain') return;
  const ch = state.chain;
  const k = estimateKeffective();
  ch.kEffective = k;

  let regimeText = 'Crítico Estável (k ≈ 1)';
  let regimeColor = '#34d399';
  if (k < 0.88) {
    regimeText = 'Subcrítico (Reação Apaga)';
    regimeColor = '#38bdf8';
    if (ch.fissionCount > 0) setStepActive(2);
  } else if (k <= 1.15) {
    regimeText = ch.autoRegulate ? 'Auto-Regulado (Criticidade = 1)' : 'Crítico Controlado (Estável)';
    regimeColor = '#34d399';
    if (ch.fissionCount > 0) setStepActive(3);
  } else {
    regimeText = 'Supercrítico (Exponencial!)';
    regimeColor = '#f43f5e';
    if (ch.fissionCount > 0) setStepActive(4);
  }

  const excitedCount = ch.atoms.filter(a => a.excited).length;
  stageStatusBadge.textContent =
    ch.neutrons.length > 0 || excitedCount > 0
      ? `${ch.autoRegulate ? '🤖 Auto (k≈1) | ' : ''}Ativos: ${ch.neutrons.length} n⁰ ${excitedCount > 0 ? `+ ${excitedCount} excitado(s)` : ''} | k_ef ≈ ${k.toFixed(2)}`
      : `Reator em Espera (${ch.atoms.length} núcleos) | k_ef ≈ ${k.toFixed(2)}`;

  equationDisplay.innerHTML = `
    <span class="nuclide highlight"><span class="sym">k<sub>ef</sub> &approx; ${k.toFixed(2)}</span></span>
    <span class="eq-arrow">&bull;</span>
    <span class="eq-energy" style="color:${regimeColor};border-color:${regimeColor}">${regimeText}</span>
  `;

  if (ch.autoRegulate) {
    explanationText.textContent =
      `🤖 PILOTO AUTOMÁTICO ATIVO: O computador da usina regula as barras de Boro/Cádmio (${Math.round(ch.controlRodInsertion)}%) e repõe os núcleos consumidos para manter a reação constante em k_ef ≈ 1,00 (como em uma usina PWR/BWR/SMR!).`;
  } else if (!ch.moderatorOn) {
    explanationText.textContent =
      `⚠️ SEM MODERADOR: Os nêutrons ejetados saem rápidos (âmbar)! Como o ²³⁵U só captura nêutrons lentos (térmicos) com eficiência, a maioria bate ou passa direto sem fissionar.`;
  } else if (ch.atomCount <= 22) {
    explanationText.textContent =
      `📉 ABAIXO DA MASSA CRÍTICA (${ch.atomCount} átomos): Como os núcleos estão muito dispersos, os nêutrons colidem com a blindagem do vaso sem achar outros átomos e a reação apaga.`;
  } else {
    explanationText.textContent =
      `Barras em ${Math.round(ch.controlRodInsertion)}% (${ch.absorbedByRods} n⁰ absorvidos). ` +
      `Ao absorver um nêutron lento, o núcleo vira ${state.selectedFuelKey === 'U235' ? '²³⁶U*' : 'núcleo excitado'}, vibra intensamente e se rompe liberando 2 a 3 novos nêutrons!`;
  }

  const intactCount = ch.atoms.filter(a => !a.fissioned).length;
  metricNucleus.textContent = `${ch.fissionCount} fissões (${intactCount}/${ch.atoms.length})`;
  metricEnergy.textContent = `${ch.totalEnergyMeV.toFixed(1)} MeV`;
  metricNeutronsOut.textContent = `${ch.neutrons.length} ativos | ${ch.absorbedByRods} abs.`;
  metricConservation.textContent = `${ch.maxGeneration}ª Geração`;

  if (ch.recentLogs.length === 0) {
    productsList.innerHTML = `<div class="empty-products">Injete um nêutron ou ative o modo "🤖 Auto (k = 1)".</div>`;
  } else {
    productsList.innerHTML = ch.recentLogs
      .map(
        log => `
      <div class="product-item fragment-heavy">
        <div>
          <strong>${log.gen}ª Ger: ${log.parent} &rarr; ${log.heavy} + ${log.light} + ${log.neutrons}n</strong>
        </div>
        <span class="value-pill">+${log.energy} MeV</span>
      </div>
    `
      )
      .join('');
  }
}

// ============================================================================
// MAIN UPDATE & RENDER DISPATCHER
// ============================================================================

function updateSimulation() {
  if (state.paused) return;
  const dt = state.simSpeed;

  // Expand Gamma Waves (shared by both modes)
  for (let i = state.gammaWaves.length - 1; i >= 0; i--) {
    const g = state.gammaWaves[i];
    g.r += 4.0 * dt;
    g.alpha = Math.max(0, 1 - g.r / g.maxR);
    if (g.alpha <= 0) state.gammaWaves.splice(i, 1);
  }

  if (state.mode === 'chain') {
    updateChainSimulation(dt);
    return;
  }

  // Mode 1: Single Atom Simulation
  state.phaseTimer += dt;

  if (state.phase === 'approaching' && state.projectile) {
    const p = state.projectile;
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 18) p.trail.shift();

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const dx = p.x - STAGE.targetX;
    const dy = p.y - STAGE.targetY;
    const dist = Math.hypot(dx, dy);

    if (p.type === 'proton' && dist < 115) {
      const force = 240 / Math.max(dist * dist, 850);
      p.vx += (dx / dist) * force * dt * 14;
      p.vy += ((dy === 0 ? -1 : dy / dist) * force * dt * 18);

      if (p.vx < 0 || Math.abs(p.y - STAGE.targetY) > 70 || p.x > STAGE.targetX - 35) {
        handleNuclearImpact();
      }
    } else if (p.type === 'neutron' && dist <= 48) {
      handleNuclearImpact();
    } else if (p.x > STAGE.width + 30 || p.y < -30 || p.y > STAGE.height + 30) {
      state.phase = 'deflected';
      stageStatusBadge.textContent = 'Disparo passou fora do núcleo';
      explanationText.textContent =
        'O ângulo de mira foi muito aberto e o nêutron passou longe do núcleo! Ajuste a mira mais perto de 0° e dispare novamente.';
      fireBtn.textContent = '🎯 TENTAR NOVAMENTE';
    }
  }

  if (state.phase === 'deflected' && state.projectile) {
    const p = state.projectile;
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 20) p.trail.shift();
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    fireBtn.textContent = '🎯 NOVO DISPARO';
  }

  if (state.phase === 'compound' && state.phaseTimer > 40) {
    state.phase = 'deforming';
    state.phaseTimer = 0;
    setStepActive(3);
    stageStatusBadge.textContent = 'Deformação: Modelo da Gota Líquida';
    explanationText.textContent =
      'O núcleo oscila como uma gota líquida! Quando os dois lóbulos se afastam e formam um "pescoço", a repulsão elétrica vence a força nuclear forte.';
  }

  if (state.phase === 'deforming' && state.phaseTimer > 64) {
    triggerScission();
  }

  if (state.phase === 'transmuting') {
    state.betaParticles.forEach(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    });
    if (state.phaseTimer > 72) {
      state.thoriumTransmutedToU233 = true;
      resetAtom(true);
    }
  }

  if (state.phase === 'scission') {
    state.fragments.forEach(f => {
      f.x = Math.max(55, Math.min(STAGE.width - 55, f.x + f.vx * dt));
      f.y = Math.max(55, Math.min(STAGE.height - 65, f.y + f.vy * dt));
      f.vx *= Math.pow(0.972, dt);
      f.vy *= Math.pow(0.972, dt);
    });

    state.emittedNeutrons.forEach(n => {
      if (Math.hypot(n.vx, n.vy) > 0.15) {
        n.trail.push({ x: n.x, y: n.y });
        if (n.trail.length > 22) n.trail.shift();
      }
      n.x = Math.max(30, Math.min(STAGE.width - 34, n.x + n.vx * dt));
      n.y = Math.max(30, Math.min(STAGE.height - 30, n.y + n.vy * dt));
      n.vx *= Math.pow(0.972, dt);
      n.vy *= Math.pow(0.972, dt);
    });
  }
}

let frozenTimestamp = 0;

function renderCanvas(timestamp) {
  if (!state.paused) {
    frozenTimestamp = timestamp;
  }
  const renderTime = frozenTimestamp;

  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackgroundGrid(dpr);

  ctx.save();
  ctx.translate(STAGE.offsetX * dpr, STAGE.offsetY * dpr);
  ctx.scale(STAGE.scale * dpr, STAGE.scale * dpr);

  if (state.mode === 'chain') {
    renderChainReactorCanvas(renderTime);
  } else {
    renderSingleAtomCanvas(renderTime);
  }

  // Paused Overlay Badge on Canvas
  if (state.paused) {
    ctx.save();
    ctx.fillStyle = 'rgba(12, 8, 23, 0.82)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(STAGE.width / 2 - 90, 14, 180, 30, 15);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ SIMULAÇÃO PAUSADA', STAGE.width / 2, 33);
    ctx.restore();
  }

  ctx.restore();
}

function renderSingleAtomCanvas(renderTime) {
  drawAimGuideAndCannon();

  if (state.projectileType === 'proton' && state.phase !== 'scission') {
    drawCoulombBarrier(renderTime);
  }

  state.gammaWaves.forEach(g => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(250, 204, 21, ${g.alpha})`;
    ctx.lineWidth = 2.8;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.restore();
  });

  if (state.phase !== 'scission') {
    drawMainNucleus(renderTime);
  } else {
    drawFissionFragments(renderTime);
  }

  if (state.projectile) {
    drawProjectile(state.projectile);
  }

  state.emittedNeutrons.forEach(n => {
    drawEmittedNeutron(n);
  });

  state.betaParticles.forEach(b => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px Segoe UI';
    ctx.fillText(b.label, b.x + 10, b.y - 6);
    ctx.restore();
  });
}

function renderChainReactorCanvas(renderTime) {
  const ch = state.chain;

  // 1. Moderator Cherenkov Glow inside Reactor Vessel
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(130, 26, 570, 408, 16);
  if (ch.moderatorOn) {
    ctx.fillStyle = 'rgba(14, 165, 233, 0.06)';
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();

  // 2. Left Neutron Injector Nozzle (Docked flush onto the left wall x=130 of the Reactor Vessel!)
  ctx.save();
  ctx.translate(100, STAGE.gunY);
  ctx.fillStyle = '#1e1b2e';
  ctx.strokeStyle = '#6d28d9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-30, -15, 60, 30, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(24, -8, 6, 16);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#c4b5fd';
  ctx.font = '600 11px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText('Injetor (n⁰)', 98, STAGE.gunY + 32);
  ctx.restore();

  // 3. Draw Control Rods descending from top of reactor vessel
  const rodBottomY = 30 + (ch.controlRodInsertion / 100) * 395;
  CONTROL_ROD_X.forEach((rx, idx) => {
    ctx.save();
    // Guide tube
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(rx, 30);
    ctx.lineTo(rx, 425);
    ctx.stroke();

    // Active Boron/Cadmium Absorber Rod
    if (ch.controlRodInsertion > 0) {
      const grad = ctx.createLinearGradient(rx - 6, 0, rx + 6, 0);
      grad.addColorStop(0, '#be123c');
      grad.addColorStop(0.5, '#f43f5e');
      grad.addColorStop(1, '#881337');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(rx - 6, 26, 12, rodBottomY - 26, 4);
      ctx.fill();
      ctx.stroke();
    }

    if (idx === 0) {
      ctx.fillStyle = '#fda4af';
      ctx.font = '600 10px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(`Barras (${Math.round(ch.controlRodInsertion)}%)`, rx, 20);
    }
    ctx.restore();
  });

  // 4. Draw Gamma Waves
  state.gammaWaves.forEach(g => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(250, 204, 21, ${g.alpha})`;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  });

  // 5. Draw Daughter Fragments from fissioned atoms
  ch.fragments.forEach(f => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(f.x, f.y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 8.5px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(f.sym, f.x, f.y - 7);
    ctx.restore();
  });

  // 6. Draw Intact & Excited Reactor Core Atoms (5 to 150 atoms)
  const denseMode = ch.atoms.length > 75;
  ch.atoms.forEach(atom => {
    if (atom.fissioned) return;

    let jitterX = 0;
    let jitterY = 0;
    let r = atom.radius;

    if (atom.excited) {
      // Intense vibration of the excited compound nucleus (e.g. ²³⁶U*) right before splitting!
      jitterX = Math.sin(renderTime * 0.08 + atom.pulsePhase) * 2.4;
      jitterY = Math.cos(renderTime * 0.095 + atom.pulsePhase) * 2.4;
      r = atom.radius * 1.15;
    } else {
      const wobble = Math.sin(renderTime * 0.004 + atom.pulsePhase) * 0.6;
      r = atom.radius + wobble;
    }

    const ax = atom.x + jitterX;
    const ay = atom.y + jitterY;

    ctx.save();
    ctx.beginPath();
    ctx.arc(ax, ay, r, 0, Math.PI * 2);
    if (atom.excited) {
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 14;
    } else if (atom.isFissile) {
      const col = atom.isotope === 'Pu239' ? '#a855f7' : atom.isotope === 'U233' ? '#10b981' : '#0284c7';
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = denseMode ? 5 : 8;
    } else {
      ctx.fillStyle = '#b45309'; // Fertile Th-232 or U-238
    }
    ctx.fill();

    // Mini proton/neutron core dots
    const dotOff = Math.max(1.8, r * 0.22);
    const dotR = Math.max(1.8, r * 0.23);
    ctx.beginPath();
    ctx.arc(ax - dotOff, ay - dotOff * 0.7, dotR, 0, Math.PI * 2);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ax + dotOff, ay + dotOff * 0.7, dotR, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // Isotope label (shows e.g. ²³⁶U* in gold while excited!)
    ctx.fillStyle = atom.excited ? '#fef08a' : '#ffffff';
    ctx.font = denseMode ? 'bold 8.5px Segoe UI' : 'bold 10px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(atom.excited ? atom.compoundLabel : atom.label, ax, ay + r + (denseMode ? 9 : 11));
    ctx.restore();
  });

  // 7. Draw Active Neutrons in Flight (Fast vs Thermal visual cue)
  ch.neutrons.forEach(n => {
    if (n.trail.length > 1) {
      ctx.save();
      ctx.beginPath();
      n.trail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.strokeStyle = n.isFast ? 'rgba(251, 191, 36, 0.5)' : 'rgba(34, 211, 238, 0.45)';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(n.x, n.y, 5.2, 0, Math.PI * 2);
    ctx.fillStyle = n.isFast ? '#fbbf24' : '#22d3ee';
    ctx.shadowColor = n.isFast ? '#fbbf24' : '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  });

  // 8. Draw Sparks (Rod Absorption / Transmutation / Excitation)
  ch.sparks.forEach(s => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = s.alpha;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });
}

function drawBackgroundGrid(dpr) {
  ctx.save();
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.05)';
  ctx.lineWidth = 1;
  const step = 42 * dpr;
  for (let x = 0; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAimGuideAndCannon() {
  const rad = (state.aimAngleDeg * Math.PI) / 180;
  const aimRad = rad * 0.34;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(STAGE.gunX + 34, STAGE.gunY);
  ctx.lineTo(
    STAGE.gunX + 34 + Math.cos(aimRad) * 460,
    STAGE.gunY + Math.sin(aimRad) * 460
  );
  ctx.strokeStyle =
    state.projectileType === 'neutron'
      ? 'rgba(34, 211, 238, 0.25)'
      : 'rgba(244, 63, 94, 0.28)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(STAGE.gunX, STAGE.gunY);
  ctx.rotate(aimRad);

  ctx.fillStyle = '#1e1b2e';
  ctx.strokeStyle = '#6d28d9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-34, -17, 70, 34, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = state.projectileType === 'neutron' ? '#22d3ee' : '#f43f5e';
  ctx.fillRect(25, -9, 7, 18);

  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#c4b5fd';
  ctx.font = '600 12px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(
    state.projectileType === 'neutron' ? 'Canhão de Nêutrons (n⁰)' : 'Canhão de Prótons (p⁺)',
    STAGE.gunX,
    STAGE.gunY + 38
  );
  ctx.restore();
}

function drawCoulombBarrier(timestamp) {
  const pulse = (Math.sin(timestamp * 0.004) + 1) * 0.5;
  ctx.save();
  for (let r of [76, 100]) {
    ctx.beginPath();
    ctx.arc(STAGE.targetX, STAGE.targetY, r + pulse * 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(244, 63, 94, 0.85)';
  ctx.font = '600 11.5px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ Barreira de Coulomb (+ Repulsão Elétrica +)', STAGE.targetX, STAGE.targetY - 112);
  ctx.restore();
}

function drawMainNucleus(timestamp) {
  const target = getCurrentTargetInfo();
  const t = timestamp * 0.005;

  let vibAmp = 1.1;
  if (state.phase === 'compound') vibAmp = 4.0;
  if (state.phase === 'deforming') vibAmp = 3.2;
  if (state.phase === 'transmuting') vibAmp = 3.0;

  const deformProg = state.phase === 'deforming' ? Math.min(1, state.phaseTimer / 64) : 0;

  ctx.save();
  const glowRadius = 70 + deformProg * 26;
  const grad = ctx.createRadialGradient(
    STAGE.targetX, STAGE.targetY, 10,
    STAGE.targetX, STAGE.targetY, glowRadius
  );
  const glowColor =
    state.phase === 'compound' || state.phase === 'deforming'
      ? 'rgba(250, 204, 21, 0.22)'
      : 'rgba(192, 132, 252, 0.18)';
  grad.addColorStop(0, glowColor);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(STAGE.targetX, STAGE.targetY, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (deformProg > 0.15) {
    const sep = deformProg * 42;
    const neckHeight = Math.max(4, 30 * (1 - deformProg * 0.88));
    ctx.save();
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.beginPath();
    ctx.ellipse(STAGE.targetX, STAGE.targetY, sep, neckHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  state.nucleons.forEach(n => {
    const wobbleR = n.baseR + Math.sin(t * n.jitterSpeed + n.phaseOffset) * vibAmp;
    let x = STAGE.targetX + Math.cos(n.baseTheta) * wobbleR;
    let y = STAGE.targetY + Math.sin(n.baseTheta) * wobbleR;

    if (deformProg > 0) {
      const lobeShift = n.lobe * deformProg * 38;
      x += lobeShift;
      y = STAGE.targetY + (y - STAGE.targetY) * (1 - deformProg * 0.22);
    }

    drawNucleonSphere(x, y, n.radius, n.isProton);
  });

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px Segoe UI';
  const labelTitle =
    state.phase === 'compound' || state.phase === 'deforming'
      ? `${toSuper(target.compoundA)}${target.symbol}* (Núcleo Composto Instável)`
      : `${toSuper(target.A)}${target.symbol} — ${target.name}`;
  ctx.fillText(labelTitle, STAGE.targetX, STAGE.targetY + 80);

  ctx.fillStyle = '#c4b5fd';
  ctx.font = '12.5px Segoe UI';
  ctx.fillText(
    `${target.Z} Prótons  •  ${target.A - target.Z} Nêutrons`,
    STAGE.targetX,
    STAGE.targetY + 98
  );
  ctx.restore();
}

function drawFissionFragments(timestamp) {
  const t = timestamp * 0.006;

  state.fragments.forEach(frag => {
    ctx.save();
    const grad = ctx.createRadialGradient(frag.x, frag.y, 4, frag.x, frag.y, frag.radius + 16);
    grad.addColorStop(0, 'rgba(250, 204, 21, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(frag.x, frag.y, frag.radius + 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    frag.nucleons.forEach((n, idx) => {
      const r = n.r + Math.sin(t + idx) * 1.0;
      const nx = frag.x + Math.cos(n.theta) * r;
      const ny = frag.y + Math.sin(n.theta) * r;
      drawNucleonSphere(nx, ny, 5.6, n.isProton);
    });

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText(`${toSuper(frag.A)}${frag.symbol} (${frag.name})`, frag.x, frag.y + frag.radius + 20);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Segoe UI';
    ctx.fillText(`${frag.Z}p • ${frag.A - frag.Z}n`, frag.x, frag.y + frag.radius + 36);
    ctx.restore();
  });
}

function drawNucleonSphere(x, y, radius, isProton) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = isProton ? '#f43f5e' : '#0ea5e9';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = isProton ? '#fda4af' : '#bae6fd';
  ctx.fill();
  ctx.restore();
}

function drawProjectile(p) {
  const isNeutron = p.type === 'neutron';
  const color = isNeutron ? '#22d3ee' : '#f43f5e';

  if (p.trail.length > 1) {
    ctx.save();
    ctx.beginPath();
    p.trail.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = isNeutron ? 'rgba(34, 211, 238, 0.45)' : 'rgba(244, 63, 94, 0.5)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, 8.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(isNeutron ? 'n⁰' : 'p⁺', p.x, p.y - 13);
  ctx.restore();
}

function drawEmittedNeutron(n) {
  if (n.trail.length > 1) {
    ctx.save();
    ctx.beginPath();
    n.trail.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = 2.8;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#22d3ee';
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 12;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11.5px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(`¹₀n #${n.index}`, n.x, n.y - 13);
  ctx.restore();
}

// ============================================================================
// UI EVENT LISTENERS
// ============================================================================

modeTabs.addEventListener('click', e => {
  const tab = e.target.closest('.mode-tab');
  if (!tab) return;
  switchMode(tab.dataset.mode);
});

fuelSelector.addEventListener('click', e => {
  const card = e.target.closest('.fuel-card');
  if (!card) return;

  fuelSelector.querySelectorAll('.fuel-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');

  state.selectedFuelKey = card.dataset.fuel;
  populatePathways();

  if (state.mode === 'single') {
    resetAtom(false);
  } else {
    resetChainReactor();
  }
});

pathwaySelect.addEventListener('change', e => {
  state.selectedPathwayIndex = e.target.value;
  if (state.phase === 'idle') {
    updateIdleTelemetry();
  }
});

projectileSelector.addEventListener('click', e => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;

  projectileSelector.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  state.projectileType = btn.dataset.projectile;
  if (state.projectileType === 'neutron') {
    projectileHint.textContent =
      'Sem carga elétrica (n⁰): entra no núcleo sem sofrer repulsão.';
  } else {
    projectileHint.textContent =
      'Carga positiva (p⁺): repelido pela Barreira de Coulomb do núcleo!';
  }
});

energySlider.addEventListener('input', e => {
  state.energyLevel = Number(e.target.value);
  const labels = {
    1: 'Térmico (Lento)',
    2: 'Epitérmico (Médio)',
    3: 'Rápido (2 MeV)'
  };
  energyValueLabel.textContent = labels[state.energyLevel];
});

aimSlider.addEventListener('input', e => {
  state.aimAngleDeg = Number(e.target.value);
  aimValueLabel.textContent =
    state.aimAngleDeg === 0
      ? 'Centro (0°)'
      : `${state.aimAngleDeg > 0 ? '+' : ''}${state.aimAngleDeg}°`;
});

speedSlider.addEventListener('input', e => {
  state.simSpeed = Number(e.target.value);
  const txt = state.simSpeed === 1 ? '1.0x (Normal)' : `${state.simSpeed.toFixed(2)}x`;
  speedValueLabel.textContent = txt;
  if (chainSpeedSlider) {
    chainSpeedSlider.value = String(state.simSpeed);
    chainSpeedLabel.textContent = txt;
  }
});

// Chain Mode Controls Listeners
function setChainAtomCount(rawVal) {
  const val = Math.max(5, Math.min(150, Math.round(Number(rawVal) || 50)));
  state.chain.atomCount = val;
  if (atomCountSlider) atomCountSlider.value = String(val);
  if (atomCountInput) atomCountInput.value = String(val);
  if (atomPresetChips) {
    atomPresetChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.count) === val);
    });
  }
  resetChainReactor();
}

function setAutoRegulatorMode(enabled) {
  state.chain.autoRegulate = enabled;
  if (autoRegulatorSelector) {
    autoRegulatorSelector.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', (btn.dataset.auto === 'on') === enabled);
    });
  }
  if (autoModeBadge) {
    autoModeBadge.textContent = enabled ? '🤖 Auto (k ≈ 1)' : 'Manual';
  }
  if (enabled) {
    // Ensure moderator is on and rods start around 28% for smooth self-regulation
    if (state.chain.controlRodInsertion > 75) {
      state.chain.controlRodInsertion = 28;
      if (rodsSlider) rodsSlider.value = '28';
    }
    // Restore any fissioned atoms and kick off reaction if none active
    state.chain.atoms.forEach(a => {
      if (a.fissioned) a.respawnTimer = Math.random() * 40 + 10;
    });
    if (state.chain.neutrons.length === 0 && !state.chain.atoms.some(a => a.excited)) {
      injectChainNeutron();
    }
  } else {
    if (rodsValueLabel) {
      rodsValueLabel.textContent = `${Math.round(state.chain.controlRodInsertion)}% Inseridas`;
    }
  }
  updateChainTelemetry();
}

if (atomCountSlider) {
  atomCountSlider.addEventListener('input', e => {
    setChainAtomCount(e.target.value);
  });
}

if (atomCountInput) {
  atomCountInput.addEventListener('change', e => {
    setChainAtomCount(e.target.value);
  });
  atomCountInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      setChainAtomCount(e.target.value);
    }
  });
}

if (atomPresetChips) {
  atomPresetChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    setChainAtomCount(btn.dataset.count);
  });
}

if (enrichmentSlider) {
  enrichmentSlider.addEventListener('input', e => {
    state.chain.enrichment = Number(e.target.value);
    enrichmentLabel.textContent = `${state.chain.enrichment}% Físsil`;
    resetChainReactor();
  });
}

if (autoRegulatorSelector) {
  autoRegulatorSelector.addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    setAutoRegulatorMode(btn.dataset.auto === 'on');
  });
}

if (rodsSlider) {
  rodsSlider.addEventListener('input', e => {
    if (state.chain.autoRegulate) {
      setAutoRegulatorMode(false);
    }
    state.chain.controlRodInsertion = Number(e.target.value);
    rodsValueLabel.textContent = `${state.chain.controlRodInsertion}% Inseridas`;
    updateChainTelemetry();
  });
}

if (moderatorSelector) {
  moderatorSelector.addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    moderatorSelector.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.chain.moderatorOn = btn.dataset.mod === 'on';
    updateChainTelemetry();
  });
}

if (chainSpeedSlider) {
  chainSpeedSlider.addEventListener('input', e => {
    state.simSpeed = Number(e.target.value);
    const txt = `${state.simSpeed.toFixed(1)}x`;
    chainSpeedLabel.textContent = txt;
    speedSlider.value = String(state.simSpeed);
    speedValueLabel.textContent = state.simSpeed === 1 ? '1.0x (Normal)' : `${state.simSpeed.toFixed(2)}x`;
  });
}

if (scramBtn) {
  scramBtn.addEventListener('click', () => {
    if (state.chain.autoRegulate) {
      setAutoRegulatorMode(false);
    }
    state.chain.controlRodInsertion = 100;
    rodsSlider.value = '100';
    rodsValueLabel.textContent = '100% (SCRAM!)';
    updateChainTelemetry();
  });
}

if (fireChainBtn) {
  fireChainBtn.addEventListener('click', () => {
    injectChainNeutron();
  });
}

if (pauseChainBtn) {
  pauseChainBtn.addEventListener('click', () => {
    togglePause();
  });
}

if (resetChainBtn) {
  resetChainBtn.addEventListener('click', () => {
    resetChainReactor();
  });
}

// Canvas Click Handler (Works in both Single Mode and Chain Mode!)
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const clickY = (e.clientY - rect.top - STAGE.offsetY) / STAGE.scale;

  if (state.mode === 'chain') {
    injectChainNeutron(clickY);
    return;
  }

  const dy = clickY - STAGE.gunY;
  const approxAngle = Math.max(-45, Math.min(45, Math.round(dy / 3.4)));
  state.aimAngleDeg = approxAngle;
  aimSlider.value = String(approxAngle);
  aimValueLabel.textContent =
    approxAngle === 0 ? 'Centro (0°)' : `${approxAngle > 0 ? '+' : ''}${approxAngle}°`;

  fireProjectile();
});

fireBtn.addEventListener('click', () => {
  fireProjectile();
});

if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    togglePause();
  });
}

window.addEventListener('keydown', e => {
  if (e.code === 'Space' && !['BUTTON', 'SELECT', 'INPUT'].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    togglePause();
  }
});

resetBtn.addEventListener('click', () => {
  resetAtom(false);
});

const themePicker = document.getElementById('themePicker');
if (themePicker) {
  themePicker.addEventListener('click', e => {
    const btn = e.target.closest('.theme-swatch');
    if (!btn) return;
    themePicker.querySelectorAll('.theme-swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.documentElement.dataset.theme = btn.dataset.theme;
  });
}

// Initialize simulation
resizeCanvas();
populatePathways();
resetAtom(false);

const initParams = new URLSearchParams(window.location.search);
const requestedMode = initParams.get('mode');
if (requestedMode === 'chain' || requestedMode === 'single') {
  switchMode(requestedMode);
}
const requestedTheme = initParams.get('theme');
if (requestedTheme && themePicker) {
  const swatch = themePicker.querySelector(`[data-theme="${requestedTheme}"]`);
  if (swatch) swatch.click();
}

function loop(timestamp) {
  updateSimulation();
  renderCanvas(timestamp);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
