// ============================================================================
// SIMULADOR DE FUSÃO NUCLEAR — MODO 1: COLISÃO & BARREIRA DE COULOMB
// ============================================================================

const FUSION_FUELS = {
  DT: {
    id: 'DT',
    name: 'Deutério + Trítio (D-T)',
    projectile: { symbol: 'H', alias: 'Deutério (²H)', Z: 1, A: 2 },
    target: { symbol: 'H', alias: 'Trítio (³H)', Z: 1, A: 3 },
    compound: { symbol: 'He', Z: 2, A: 5 },
    thresholdTempMC: 100, // 100 Milhões K (≈ 100 Milhões °C) para vencer a Barreira de Coulomb
    barrierMeV: 0.4,
    description:
      'A reação Deutério + Trítio é a mais promissora na Terra (usada no ITER e no NIF). Em ~100 a 150 milhões de Kelvin (MK), os núcleos vencem a Barreira de Coulomb, a Força Forte os une e geram Hélio-4 + 1 nêutron ultraenergético (17,6 MeV)!',
    pathways: [
      {
        id: 'dt_he4_n',
        label: 'Hélio-4 (3,5 MeV) + 1 Nêutron (14,1 MeV) → 17,6 MeV',
        heavy: { symbol: 'He', name: 'Hélio-4 (Partícula α)', Z: 2, A: 4, energyMeV: 3.5 },
        light: { symbol: 'n', name: 'Nêutron Rápido', Z: 0, A: 1, isNeutron: true, energyMeV: 14.1 },
        totalEnergyMeV: 17.6
      }
    ]
  },

  DD: {
    id: 'DD',
    name: 'Deutério + Deutério (D-D)',
    projectile: { symbol: 'H', alias: 'Deutério (²H)', Z: 1, A: 2 },
    target: { symbol: 'H', alias: 'Deutério (²H)', Z: 1, A: 2 },
    compound: { symbol: 'He', Z: 2, A: 4 },
    thresholdTempMC: 115, // Exige temperatura um pouco maior que D-T
    barrierMeV: 0.45,
    description:
      'O Deutério é abundante na água do mar! Dois núcleos de Deutério podem se fundir por duas rotas (50% cada): formando Hélio-3 + 1 nêutron (3,3 MeV) ou formando Trítio + 1 próton (4,0 MeV).',
    pathways: [
      {
        id: 'dd_he3_n',
        label: 'Ramo 1 (50%): Hélio-3 + 1 Nêutron → 3,3 MeV',
        heavy: { symbol: 'He', name: 'Hélio-3', Z: 2, A: 3, energyMeV: 0.82 },
        light: { symbol: 'n', name: 'Nêutron Livre', Z: 0, A: 1, isNeutron: true, energyMeV: 2.45 },
        totalEnergyMeV: 3.27
      },
      {
        id: 'dd_t_p',
        label: 'Ramo 2 (50%): Trítio (³H) + 1 Próton (p⁺) → 4,0 MeV',
        heavy: { symbol: 'H', name: 'Trítio (³H)', Z: 1, A: 3, energyMeV: 1.01 },
        light: { symbol: 'p⁺', name: 'Próton Rápido', Z: 1, A: 1, isNeutron: false, energyMeV: 3.02 },
        totalEnergyMeV: 4.03
      }
    ]
  },

  DHe3: {
    id: 'DHe3',
    name: 'Deutério + Hélio-3 (D-³He)',
    projectile: { symbol: 'H', alias: 'Deutério (²H)', Z: 1, A: 2 },
    target: { symbol: 'He', alias: 'Hélio-3 (³He)', Z: 2, A: 3 },
    compound: { symbol: 'Li', Z: 3, A: 5 },
    thresholdTempMC: 135, // Hélio-3 tem 2 prótons (+2), logo a Barreira de Coulomb é o dobro!
    barrierMeV: 0.8,
    description:
      'Fusão Aneutrônica (sem nêutrons radioativos)! Como o Hélio-3 possui 2 prótons (+2), a repulsão elétrica da Barreira de Coulomb é o DOBRO, exigindo temperaturas acima de 135 milhões de Kelvin (MK)!',
    pathways: [
      {
        id: 'dhe3_he4_p',
        label: 'Hélio-4 (3,6 MeV) + 1 Próton (14,7 MeV) → 18,3 MeV',
        heavy: { symbol: 'He', name: 'Hélio-4 (Partícula α)', Z: 2, A: 4, energyMeV: 3.6 },
        light: { symbol: 'p⁺', name: 'Próton Energético', Z: 1, A: 1, isNeutron: false, energyMeV: 14.7 },
        totalEnergyMeV: 18.3
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
  mode: 'collision', // 'collision' | 'reactor'
  selectedFuelKey: 'DT',
  selectedPathwayIndex: '0',
  activePathway: null,
  plasmaTempMC: 150, // 10 to 160 Milhões K (MK)
  aimAngleDeg: 0,    // -35 to +35 degrees
  simSpeed: 1.0,
  paused: false,

  // Phase: 'idle' | 'approaching' | 'repelled' | 'fusing' | 'fused'
  phase: 'idle',
  phaseTimer: 0,
  projectileCluster: null,
  targetCluster: null,
  compoundCluster: null,
  products: [],
  shockwaves: [],

  // Mode 2 State: Tokamak (Magnetic) vs. Laser Inertial (NIF)
  reactor: {
    tech: 'tokamak', // 'tokamak' | 'laser'
    magFieldTesla: 13.0, // 0 to 15 T (ITER = 13 T)
    heatingPowerMW: 50,  // 10 to 70 MW (ITER = 50 MW -> 500 MW fusion, Q=10)
    lithiumBlanketOn: true,
    quenched: false,
    fusionEventsCount: 0,
    tritiumBredCount: 0,
    tokamakIons: [],
    tokamakParticles: [],
    blanketFlashes: [],

    // Laser Inertial (NIF) state
    laserEnergyMJ: 2.05, // 0.5 to 2.5 MJ (NIF 2022 = 2.05 MJ -> 3.15 MJ, Q_alvo = 1.54)
    laserSymmetryPct: 100, // 50 to 100%
    laserPhase: 'idle', // 'idle' | 'lasers_firing' | 'imploding' | 'ignited' | 'expanding'
    laserTimer: 0,
    capsuleRadius: 48,
    shotYieldMJ: 0,
    shotQTarget: 0,
    shotQGlobal: 0,
    laserProducts: []
  }
};

// DOM Elements
const canvasWrapper = document.getElementById('canvasWrapper');
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const modeTabs = document.getElementById('modeTabs');
const collisionModeControls = document.getElementById('collisionModeControls');
const reactorModeControls = document.getElementById('reactorModeControls');
const fuelSelector = document.getElementById('fuelSelector');
const pathwaySelect = document.getElementById('pathwaySelect');
const pathwayStaticBox = document.getElementById('pathwayStaticBox');
const pathwayHint = document.getElementById('pathwayHint');
const tempSlider = document.getElementById('tempSlider');
const tempInput = document.getElementById('tempInput');
const tempPresetChips = document.getElementById('tempPresetChips');
const aimSlider = document.getElementById('aimSlider');
const aimValueLabel = document.getElementById('aimValueLabel');
const speedSlider = document.getElementById('speedSlider');
const speedValueLabel = document.getElementById('speedValueLabel');
const fireBtn = document.getElementById('fireBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// Mode 2 DOM Elements
const reactorTechToggle = document.getElementById('reactorTechToggle');
const reactorTechHint = document.getElementById('reactorTechHint');
const tokamakSliders = document.getElementById('tokamakSliders');
const laserSliders = document.getElementById('laserSliders');
const magFieldSlider = document.getElementById('magFieldSlider');
const magFieldLabel = document.getElementById('magFieldLabel');
const magPresetChips = document.getElementById('magPresetChips');
const heatingPowerSlider = document.getElementById('heatingPowerSlider');
const heatingPowerLabel = document.getElementById('heatingPowerLabel');
const heatPresetChips = document.getElementById('heatPresetChips');
const lithiumToggleBtn = document.getElementById('lithiumToggleBtn');
const laserEnergySlider = document.getElementById('laserEnergySlider');
const laserEnergyLabel = document.getElementById('laserEnergyLabel');
const laserPresetChips = document.getElementById('laserPresetChips');
const laserSymSlider = document.getElementById('laserSymSlider');
const laserSymLabel = document.getElementById('laserSymLabel');
const reactorActionBtn = document.getElementById('reactorActionBtn');
const reactorPauseBtn = document.getElementById('reactorPauseBtn');
const reactorResetBtn = document.getElementById('reactorResetBtn');

// Telemetry DOM Elements
const appSubtitle = document.getElementById('appSubtitle');
const stageStatusBadge = document.getElementById('stageStatusBadge');
const stageLegend = document.getElementById('stageLegend');
const reactionStepper = document.getElementById('reactionStepper');
const rightTitle1 = document.getElementById('rightTitle1');
const rightTitle2 = document.getElementById('rightTitle2');
const rightTitle3 = document.getElementById('rightTitle3');
const rightTitle4 = document.getElementById('rightTitle4');
const metricLabel1 = document.getElementById('metricLabel1');
const metricLabel2 = document.getElementById('metricLabel2');
const metricLabel3 = document.getElementById('metricLabel3');
const metricLabel4 = document.getElementById('metricLabel4');
const equationDisplay = document.getElementById('equationDisplay');
const explanationText = document.getElementById('explanationText');
const metricTemp = document.getElementById('metricTemp');
const metricEnergy = document.getElementById('metricEnergy');
const metricBarrier = document.getElementById('metricBarrier');
const metricConservation = document.getElementById('metricConservation');
const productsList = document.getElementById('productsList');

// Logical stage coordinate system (720 x 460)
const STAGE = {
  width: 720,
  height: 460,
  gunX: 100,
  gunY: 252,
  targetX: 468,
  targetY: 252,
  coulombRadius: 136,
  strongForceRadius: 46,
  scale: 1,
  offsetX: 0,
  offsetY: 0
};

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
  [pauseBtn, reactorPauseBtn].forEach(btn => {
    if (btn) {
      btn.classList.toggle('paused', state.paused);
      btn.textContent = state.paused ? '▶ Continuar' : '⏸ Pausar';
    }
  });
}

function togglePause() {
  setPaused(!state.paused);
}

function setStepActive(stepIndex) {
  const steps = reactionStepper.querySelectorAll('.step');
  steps.forEach((el, idx) => {
    el.classList.toggle('active', idx === stepIndex);
  });
}

// Build exact, symmetrical nucleon arrangement for light nuclei (A = 1..5)
function buildLightNucleusOffsets(Z, A, sphereRadius = 11) {
  const nucleons = [];
  const types = [];
  for (let i = 0; i < Z; i++) types.push(true);       // Protons
  for (let i = 0; i < A - Z; i++) types.push(false);  // Neutrons

  if (A === 1) {
    nucleons.push({ dx: 0, dy: 0, isProton: types[0], r: sphereRadius });
  } else if (A === 2) {
    const d = sphereRadius * 0.88;
    nucleons.push({ dx: -d, dy: 0, isProton: true, r: sphereRadius });
    nucleons.push({ dx: d, dy: 0, isProton: false, r: sphereRadius });
  } else if (A === 3) {
    // Upright symmetric triangle: top nucleon at (0, -R), bottom two level at (+-dx, +dy)
    const ringR = sphereRadius * 0.95;
    const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
    // Put singleton nucleon at the top apex so the triangle is 100% left-right symmetrical!
    const orderedTypes = Z === 1 ? [true, false, false] : [false, true, true];
    for (let i = 0; i < 3; i++) {
      nucleons.push({
        dx: Math.cos(angles[i]) * ringR,
        dy: Math.sin(angles[i]) * ringR,
        isProton: orderedTypes[i],
        r: sphereRadius
      });
    }
  } else {
    const ringR = sphereRadius * (A === 4 ? 1.02 : 1.15);
    const orderedTypes = A === 4 ? [true, false, true, false] : types;
    for (let i = 0; i < A; i++) {
      const ang = (i * Math.PI * 2) / A - Math.PI / 2;
      nucleons.push({
        dx: Math.cos(ang) * ringR,
        dy: Math.sin(ang) * ringR,
        isProton: orderedTypes[i],
        r: sphereRadius
      });
    }
  }
  return nucleons;
}

function populatePathways() {
  const fuel = FUSION_FUELS[state.selectedFuelKey];
  pathwaySelect.innerHTML = '';

  if (fuel.pathways.length > 1) {
    // Multiple routes (Deutério + Deutério): show selectable dropdown!
    if (pathwayStaticBox) pathwayStaticBox.classList.add('hidden');
    pathwaySelect.classList.remove('hidden');

    const randOpt = document.createElement('option');
    randOpt.value = 'random';
    randOpt.textContent = '🎲 Sorteio Quântico (50% / 50%)';
    pathwaySelect.appendChild(randOpt);

    fuel.pathways.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = p.label;
      pathwaySelect.appendChild(opt);
    });

    state.selectedPathwayIndex = 'random';
    if (pathwayHint) {
      pathwayHint.textContent = 'O Deutério + Deutério possui 2 rotas equiprováveis (50% cada): escolha uma ou deixe no sorteio!';
    }
  } else {
    // Only 1 route (D-T and D-He3): hide dropdown and show static informative box without clipping!
    pathwaySelect.classList.add('hidden');
    if (pathwayStaticBox) {
      pathwayStaticBox.classList.remove('hidden');
      const pw = fuel.pathways[0];
      pathwayStaticBox.textContent = `${toSuper(pw.heavy.A)}${pw.heavy.symbol} (${pw.heavy.energyMeV} MeV) + 1 ${pw.light.symbol} (${pw.light.energyMeV} MeV) → ${pw.totalEnergyMeV} MeV`;
    }
    state.selectedPathwayIndex = '0';
    if (pathwayHint) {
      pathwayHint.textContent = 'Esta reação possui rota única de fusão nuclear.';
    }
  }
}

function chooseActivePathway() {
  const fuel = FUSION_FUELS[state.selectedFuelKey];
  if (state.selectedPathwayIndex === 'random') {
    return fuel.pathways[Math.floor(Math.random() * fuel.pathways.length)];
  }
  return fuel.pathways[Number(state.selectedPathwayIndex)] || fuel.pathways[0];
}

function resetCollision() {
  setPaused(false);
  state.phase = 'idle';
  state.phaseTimer = 0;
  state.products = [];
  state.shockwaves = [];
  state.compoundCluster = null;

  const fuel = FUSION_FUELS[state.selectedFuelKey];
  state.activePathway = chooseActivePathway();

  state.projectileCluster = {
    x: STAGE.gunX + 46,
    y: STAGE.gunY,
    vx: 0,
    vy: 0,
    Z: fuel.projectile.Z,
    A: fuel.projectile.A,
    symbol: fuel.projectile.symbol,
    alias: fuel.projectile.alias,
    nucleons: buildLightNucleusOffsets(fuel.projectile.Z, fuel.projectile.A, 10),
    trail: []
  };

  state.targetCluster = {
    x: STAGE.targetX,
    y: STAGE.targetY,
    Z: fuel.target.Z,
    A: fuel.target.A,
    symbol: fuel.target.symbol,
    alias: fuel.target.alias,
    nucleons: buildLightNucleusOffsets(fuel.target.Z, fuel.target.A, 11)
  };

  setStepActive(0);
  updateIdleTelemetry();
}

function canOvercomeBarrier() {
  const fuel = FUSION_FUELS[state.selectedFuelKey];
  const tempOk = state.plasmaTempMC >= fuel.thresholdTempMC;
  const aimOk = Math.abs(state.aimAngleDeg) <= 13;
  return { tempOk, aimOk, willFuse: tempOk && aimOk };
}

function updateIdleTelemetry() {
  const fuel = FUSION_FUELS[state.selectedFuelKey];
  const pw = state.activePathway || chooseActivePathway();
  const check = canOvercomeBarrier();

  fireBtn.textContent = '🔥 DISPARAR';

  if (check.willFuse) {
    stageStatusBadge.textContent = `Plasma a ${state.plasmaTempMC} MK: Energia suficiente para Fusão!`;
    metricBarrier.textContent = '✅ Vence a Barreira';
    metricBarrier.style.color = '#34d399';
  } else if (!check.tempOk) {
    stageStatusBadge.textContent = `Plasma Frio (${state.plasmaTempMC} MK < ${fuel.thresholdTempMC} MK): Barreira vai repelir!`;
    metricBarrier.textContent = '❌ Repulsão Elétrica';
    metricBarrier.style.color = '#fb7185';
  } else {
    stageStatusBadge.textContent = `Mira Descentralizada (${state.aimAngleDeg}°): Disparo vai desviar!`;
    metricBarrier.textContent = '⚠️ Desvio Lateral';
    metricBarrier.style.color = '#fbbf24';
  }

  metricTemp.textContent = `${state.plasmaTempMC} / ${fuel.thresholdTempMC} MK`;
  metricEnergy.textContent = '0.0 MeV';
  const totalIn = fuel.projectile.A + fuel.target.A;
  metricConservation.textContent = `${fuel.projectile.A} + ${fuel.target.A} = ${totalIn}`;

  equationDisplay.innerHTML =
    nuclideHTML(fuel.projectile.A, fuel.projectile.Z, fuel.projectile.symbol, { variant: 'highlight' }) +
    OP_PLUS +
    nuclideHTML(fuel.target.A, fuel.target.Z, fuel.target.symbol, { variant: 'highlight' }) +
    OP_ARROW +
    nuclideHTML(fuel.compound.A, fuel.compound.Z, fuel.compound.symbol, { excited: true, variant: 'unstable' }) +
    OP_ARROW +
    nuclideHTML(pw.heavy.A, pw.heavy.Z, pw.heavy.symbol) +
    OP_PLUS +
    nuclideHTML(pw.light.A, pw.light.Z, pw.light.symbol) +
    OP_PLUS +
    `<span class="eq-energy">${pw.totalEnergyMeV} MeV</span>`;

  explanationText.textContent = fuel.description;
  productsList.innerHTML = `<div class="empty-products">Dispare o núcleo para testar a Barreira de Coulomb.</div>`;
}

function fireProjectile() {
  setPaused(false);
  if (state.phase !== 'idle') {
    resetCollision();
  }

  state.activePathway = chooseActivePathway();
  state.phase = 'approaching';
  state.phaseTimer = 0;
  setStepActive(1);

  // Speed scales with square root of plasma temperature (v ∝ √T)
  const speed = 2.6 + (state.plasmaTempMC / 150) * 5.2;
  const rad = (state.aimAngleDeg * Math.PI) / 180;
  const aimRad = rad * 0.36;

  state.projectileCluster.x = STAGE.gunX + 46;
  state.projectileCluster.y = STAGE.gunY;
  state.projectileCluster.vx = Math.cos(aimRad) * speed;
  state.projectileCluster.vy = Math.sin(aimRad) * speed;
  state.projectileCluster.trail = [];

  stageStatusBadge.textContent = `Núcleo de ${state.projectileCluster.alias} disparado a ${state.plasmaTempMC} Milhões K (MK)...`;
}

function triggerStrongForceFusion() {
  const fuel = FUSION_FUELS[state.selectedFuelKey];
  state.phase = 'fusing';
  state.phaseTimer = 0;
  setStepActive(3);

  state.compoundCluster = {
    x: STAGE.targetX,
    y: STAGE.targetY,
    Z: fuel.compound.Z,
    A: fuel.compound.A,
    symbol: fuel.compound.symbol,
    nucleons: buildLightNucleusOffsets(fuel.compound.Z, fuel.compound.A, 11)
  };

  state.shockwaves.push({
    x: STAGE.targetX,
    y: STAGE.targetY,
    r: 12,
    maxR: 95,
    color: 'rgba(16, 185, 129, 0.9)',
    alpha: 1
  });

  stageStatusBadge.textContent = `🧲 Força Nuclear Forte Ativada! Formando ${toSuper(fuel.compound.A)}${fuel.compound.symbol}*`;
  explanationText.textContent =
    `A energia cinética extrema (${state.plasmaTempMC} MK) furou a Barreira de Coulomb! A curtíssima distância, a Força Nuclear Forte ("supercola") venceu a repulsão elétrica e uniu os dois núcleos!`;
}

function triggerFusionProductsRelease() {
  const fuel = FUSION_FUELS[state.selectedFuelKey];
  const pw = state.activePathway;
  state.phase = 'fused';
  state.phaseTimer = 0;
  setStepActive(4);

  // Heavy product (e.g. He-4) recoils down-right, light product (e.g. fast neutron) shoots up-right
  state.products = [
    {
      ...pw.heavy,
      x: STAGE.targetX,
      y: STAGE.targetY,
      vx: 1.55,
      vy: 0.95,
      nucleons: buildLightNucleusOffsets(pw.heavy.Z, pw.heavy.A, 10.5),
      trail: []
    },
    {
      ...pw.light,
      x: STAGE.targetX,
      y: STAGE.targetY,
      vx: 3.8,
      vy: -1.75,
      nucleons: buildLightNucleusOffsets(pw.light.Z, pw.light.A, 9.0),
      trail: []
    }
  ];

  state.shockwaves.push(
    { x: STAGE.targetX, y: STAGE.targetY, r: 10, maxR: 190, color: 'rgba(250, 204, 21, 0.95)', alpha: 1 },
    { x: STAGE.targetX, y: STAGE.targetY, r: 5, maxR: 130, color: 'rgba(245, 158, 11, 0.85)', alpha: 1 }
  );

  stageStatusBadge.textContent = `☀️ Fusão Completa! +${pw.totalEnergyMeV} MeV liberados!`;
  metricEnergy.textContent = `${pw.totalEnergyMeV.toFixed(1)} MeV`;
  metricBarrier.textContent = '☀️ Ignição Atingida!';
  metricBarrier.style.color = '#facc15';
  metricConservation.textContent = `${fuel.projectile.A}+${fuel.target.A} = ${pw.heavy.A}+${pw.light.A}`;

  equationDisplay.innerHTML =
    nuclideHTML(fuel.projectile.A, fuel.projectile.Z, fuel.projectile.symbol) +
    OP_PLUS +
    nuclideHTML(fuel.target.A, fuel.target.Z, fuel.target.symbol) +
    OP_ARROW +
    nuclideHTML(pw.heavy.A, pw.heavy.Z, pw.heavy.symbol, { variant: 'highlight' }) +
    OP_PLUS +
    nuclideHTML(pw.light.A, pw.light.Z, pw.light.symbol, { variant: 'highlight' }) +
    OP_PLUS +
    `<span class="eq-energy">+${pw.totalEnergyMeV} MeV</span>`;

  explanationText.textContent =
    `Fusão concluída! O defeito de massa (E = Δmc²) liberou ${pw.totalEnergyMeV} MeV de energia cinética, divididos entre o ${pw.heavy.name} (${pw.heavy.energyMeV} MeV) e o ${pw.light.name} (${pw.light.energyMeV} MeV)!`;

  productsList.innerHTML = `
    <div class="product-item fragment-heavy">
      <div>
        <strong>${toSuper(pw.heavy.A)}${pw.heavy.symbol} — ${pw.heavy.name}</strong>
        <div style="font-size:0.62rem;color:#94a3b8">${pw.heavy.Z} prótons, ${pw.heavy.A - pw.heavy.Z} nêutrons (Mantém o plasma quente)</div>
      </div>
      <span class="value-pill">+${pw.heavy.energyMeV} MeV</span>
    </div>
    <div class="product-item fragment-light">
      <div>
        <strong>${toSuper(pw.light.A)}${pw.light.symbol} — ${pw.light.name}</strong>
        <div style="font-size:0.62rem;color:#94a3b8">${pw.light.isNeutron ? 'Sai do plasma p/ gerar vapor e Trítio' : 'Partícula carregada de alta energia'}</div>
      </div>
      <span class="value-pill">+${pw.light.energyMeV} MeV</span>
    </div>
  `;

  fireBtn.textContent = '🔥 NOVO DISPARO';
}

function updateSimulation() {
  if (state.paused) return;
  if (state.mode === 'reactor') {
    updateReactorSimulation();
    return;
  }
  const dt = state.simSpeed;
  state.phaseTimer += dt;

  // Expand shockwaves
  for (let i = state.shockwaves.length - 1; i >= 0; i--) {
    const s = state.shockwaves[i];
    s.r += 3.6 * dt;
    s.alpha = Math.max(0, 1 - s.r / s.maxR);
    if (s.alpha <= 0) state.shockwaves.splice(i, 1);
  }

  if (state.phase === 'approaching' && state.projectileCluster) {
    const p = state.projectileCluster;
    const fuel = FUSION_FUELS[state.selectedFuelKey];

    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 22) p.trail.shift();

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const dx = p.x - STAGE.targetX;
    const dy = p.y - STAGE.targetY;
    const dist = Math.hypot(dx, dy);

    // Inside Coulomb Barrier Zone (dist < 135): Electrostatic repulsion slows or deflects the projectile!
    if (dist < STAGE.coulombRadius + 15) {
      setStepActive(2);
      const check = canOvercomeBarrier();

      if (check.willFuse) {
        // Has enough thermal energy to climb the barrier, slowing down slightly until hitting Strong Force radius!
        if (dist > STAGE.strongForceRadius) {
          const speedMag = Math.hypot(p.vx, p.vy);
          if (speedMag > 2.2) {
            p.vx *= Math.pow(0.988, dt);
            p.vy *= Math.pow(0.988, dt);
          }
        } else {
          // Pierced into Strong Nuclear Force range!
          triggerStrongForceFusion();
          return;
        }
      } else {
        // Insufficient temperature OR off-center aim: Coulomb repulsion pushes it back!
        const minTurnDist = check.tempOk
          ? STAGE.strongForceRadius + 14
          : STAGE.strongForceRadius + 12 + ((fuel.thresholdTempMC - state.plasmaTempMC) / fuel.thresholdTempMC) * 58;

        const repulseStrength = 0.36 * dt;
        p.vx += (dx / Math.max(20, dist)) * repulseStrength;
        p.vy += ((Math.abs(dy) < 4 ? (state.aimAngleDeg >= 0 ? 0.45 : -0.45) : dy / dist) * repulseStrength * 1.35);

        if (dist <= minTurnDist || p.vx <= 0.15) {
          state.phase = 'repelled';
          state.phaseTimer = 0;
          // Bounce away from Coulomb barrier
          const bounceAng = Math.atan2(dy || (state.aimAngleDeg >= 0 ? 18 : -18), dx);
          const bounceSpd = 3.2;
          p.vx = Math.cos(bounceAng) * bounceSpd;
          p.vy = Math.sin(bounceAng) * bounceSpd;

          state.shockwaves.push({
            x: STAGE.targetX + Math.cos(bounceAng) * (dist * 0.5),
            y: STAGE.targetY + Math.sin(bounceAng) * (dist * 0.5),
            r: 8,
            maxR: 75,
            color: 'rgba(244, 63, 94, 0.9)',
            alpha: 1
          });

          stageStatusBadge.textContent = `⚡ Repelido pela Barreira de Coulomb! (${state.plasmaTempMC} MK < ${fuel.thresholdTempMC} MK)`;
          equationDisplay.innerHTML =
            nuclideHTML(fuel.projectile.A, fuel.projectile.Z, fuel.projectile.symbol) +
            OP_PLUS +
            nuclideHTML(fuel.target.A, fuel.target.Z, fuel.target.symbol) +
            OP_ARROW +
            `<span class="eq-energy" style="color:#fb7185;border-color:#fb7185">⚡ Repulsão de Coulomb (Sem Fusão)</span>`;

          explanationText.textContent = !check.tempOk
            ? `A ${state.plasmaTempMC} Milhões K (MK), os núcleos não têm velocidade suficiente! A repulsão elétrica entre as cargas positivas (+ ↔ +) freou e arremessou o núcleo de volta antes que a Força Forte pudesse agir. Aumente para pelo menos ${fuel.thresholdTempMC} MK!`
            : `O disparo foi muito inclinado (${state.aimAngleDeg}°)! A repulsão elétrica desviou o núcleo lateralmente antes de tocar na zona da Força Forte. Mire mais perto de 0°!`;

          fireBtn.textContent = '🔥 TENTAR NOVAMENTE';
        }
      }
    }

    if (p.x > STAGE.width - 25 || p.y < 25 || p.y > STAGE.height - 25) {
      state.phase = 'repelled';
      fireBtn.textContent = '🔥 TENTAR NOVAMENTE';
    }
  }

  if (state.phase === 'repelled' && state.projectileCluster) {
    const p = state.projectileCluster;
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 22) p.trail.shift();
    p.x = Math.max(35, Math.min(STAGE.width - 35, p.x + p.vx * dt));
    p.y = Math.max(35, Math.min(STAGE.height - 35, p.y + p.vy * dt));
    p.vx *= Math.pow(0.96, dt);
    p.vy *= Math.pow(0.96, dt);
  }

  if (state.phase === 'fusing') {
    if (state.phaseTimer > 48) {
      triggerFusionProductsRelease();
    }
  }

  if (state.phase === 'fused') {
    state.products.forEach(prod => {
      if (Math.hypot(prod.vx, prod.vy) > 0.15) {
        prod.trail.push({ x: prod.x, y: prod.y });
        if (prod.trail.length > 22) prod.trail.shift();
      }
      prod.x = Math.max(45, Math.min(STAGE.width - 55, prod.x + prod.vx * dt));
      prod.y = Math.max(45, Math.min(STAGE.height - 55, prod.y + prod.vy * dt));
      prod.vx *= Math.pow(0.968, dt);
      prod.vy *= Math.pow(0.968, dt);
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

  if (state.mode === 'reactor') {
    renderReactorCanvas(renderTime);
  } else {
    renderCollisionCanvas(renderTime);
  }

  if (state.paused) {
    ctx.save();
    ctx.fillStyle = 'rgba(12, 8, 23, 0.85)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(STAGE.width / 2 - 90, 52, 180, 28, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11.5px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ SIMULAÇÃO PAUSADA', STAGE.width / 2, 70);
    ctx.restore();
  }

  ctx.restore();
}

function renderCollisionCanvas(renderTime) {
  // 1. Top Thermal Energy vs Coulomb Barrier Bar on Canvas
  drawTemperatureBarrierBar();

  // 2. Plasma Accelerator Gun on the left
  drawPlasmaInjector();

  // 3. Draw Coulomb Barrier & Strong Force Wells around Target (when not yet split into products)
  if (state.phase !== 'fused') {
    drawCoulombAndStrongForceZones(renderTime);
  }

  // 4. Draw Shockwaves
  state.shockwaves.forEach(s => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = s.alpha;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  });

  // 5. Draw Nuclei depending on phase
  if (state.phase === 'idle' || state.phase === 'approaching' || state.phase === 'repelled') {
    if (state.targetCluster) {
      drawLightNucleusCluster(
        state.targetCluster.x,
        state.targetCluster.y,
        state.targetCluster.nucleons,
        `${toSuper(state.targetCluster.A)}${state.targetCluster.symbol} — ${state.targetCluster.alias}`,
        `${state.targetCluster.Z} Próton(s) • ${state.targetCluster.A - state.targetCluster.Z} Nêutron(s)`,
        renderTime,
        1.0
      );
    }

    if (state.projectileCluster) {
      drawClusterTrail(state.projectileCluster.trail, 'rgba(251, 191, 36, 0.48)');
      drawLightNucleusCluster(
        state.projectileCluster.x,
        state.projectileCluster.y,
        state.projectileCluster.nucleons,
        `${toSuper(state.projectileCluster.A)}${state.projectileCluster.symbol}`,
        '',
        renderTime,
        1.2,
        true
      );
    }
  } else if (state.phase === 'fusing' && state.compoundCluster) {
    // Glowing excited compound nucleus (e.g. ⁵He*) held by Strong Force!
    ctx.save();
    const grad = ctx.createRadialGradient(
      STAGE.targetX, STAGE.targetY, 6,
      STAGE.targetX, STAGE.targetY, 72
    );
    grad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
    grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(STAGE.targetX, STAGE.targetY, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawLightNucleusCluster(
      state.compoundCluster.x,
      state.compoundCluster.y,
      state.compoundCluster.nucleons,
      `${toSuper(state.compoundCluster.A)}${state.compoundCluster.symbol}* (Fusão pela Força Forte!)`,
      `${state.compoundCluster.Z} Prótons + ${state.compoundCluster.A - state.compoundCluster.Z} Nêutrons Unidos`,
      renderTime,
      3.5
    );
  } else if (state.phase === 'fused') {
    state.products.forEach(prod => {
      const trailCol = prod.isNeutron ? 'rgba(34, 211, 238, 0.5)' : 'rgba(250, 204, 21, 0.5)';
      drawClusterTrail(prod.trail, trailCol);
      drawLightNucleusCluster(
        prod.x,
        prod.y,
        prod.nucleons,
        `${toSuper(prod.A)}${prod.symbol} (${prod.name})`,
        `+${prod.energyMeV} MeV`,
        renderTime,
        1.1
      );
    });
  }
}

function drawTemperatureBarrierBar() {
  const fuel = FUSION_FUELS[state.selectedFuelKey];
  const barX = 165;
  const barY = 16;
  const barW = 390;
  const barH = 18;

  const pct = Math.min(1, state.plasmaTempMC / 160);
  const threshPct = fuel.thresholdTempMC / 160;
  const isEnough = state.plasmaTempMC >= fuel.thresholdTempMC;

  ctx.save();
  ctx.fillStyle = 'rgba(12, 8, 23, 0.78)';
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 9);
  ctx.fill();
  ctx.stroke();

  // Fill bar
  const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  fillGrad.addColorStop(0, '#38bdf8');
  fillGrad.addColorStop(0.5, '#f59e0b');
  fillGrad.addColorStop(1, '#10b981');
  ctx.fillStyle = fillGrad;
  ctx.beginPath();
  ctx.roundRect(barX + 2, barY + 2, Math.max(8, (barW - 4) * pct), barH - 4, 7);
  ctx.fill();

  // Threshold marker line
  const tx = barX + barW * threshPct;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx, barY - 3);
  ctx.lineTo(tx, barY + barH + 3);
  ctx.stroke();

  ctx.fillStyle = isEnough ? '#34d399' : '#fda4af';
  ctx.font = 'bold 10.5px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Temperatura: ${state.plasmaTempMC} MK (Milhões K)  |  Mínimo p/ Vencer Barreira (${fuel.id}): ${fuel.thresholdTempMC} MK`,
    barX + barW / 2,
    barY + 31
  );
  ctx.restore();
}

function drawPlasmaInjector() {
  const rad = (state.aimAngleDeg * Math.PI) / 180;
  const aimRad = rad * 0.36;

  // Aim line
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(STAGE.gunX + 36, STAGE.gunY);
  ctx.lineTo(
    STAGE.gunX + 36 + Math.cos(aimRad) * 440,
    STAGE.gunY + Math.sin(aimRad) * 440
  );
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.restore();

  // Injector body
  ctx.save();
  ctx.translate(STAGE.gunX, STAGE.gunY);
  ctx.rotate(aimRad);

  ctx.fillStyle = '#1e1b2e';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-34, -18, 72, 36, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#facc15';
  ctx.fillRect(26, -10, 7, 20);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#fcd34d';
  ctx.font = '600 11.5px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText('Injetor de Plasma (²H)', STAGE.gunX, STAGE.gunY + 38);
  ctx.restore();
}

function drawCanvasPillLabel(text, cx, cy, textColor, borderColor = 'rgba(255, 255, 255, 0.14)', font = '600 11px Segoe UI') {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const metrics = ctx.measureText(text);
  const padX = 10;
  const boxW = metrics.width + padX * 2;
  const boxH = 20;

  ctx.fillStyle = 'rgba(12, 8, 23, 0.82)';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
}

function drawCoulombAndStrongForceZones(timestamp) {
  const pulse = (Math.sin(timestamp * 0.004) + 1) * 0.5;

  ctx.save();
  // 1. Outer Coulomb Repulsion Field (Red/Rose dashed rings)
  const coulombGrad = ctx.createRadialGradient(
    STAGE.targetX, STAGE.targetY, STAGE.strongForceRadius,
    STAGE.targetX, STAGE.targetY, STAGE.coulombRadius
  );
  coulombGrad.addColorStop(0, 'rgba(244, 63, 94, 0.14)');
  coulombGrad.addColorStop(1, 'rgba(244, 63, 94, 0.02)');
  ctx.fillStyle = coulombGrad;
  ctx.beginPath();
  ctx.arc(STAGE.targetX, STAGE.targetY, STAGE.coulombRadius, 0, Math.PI * 2);
  ctx.fill();

  for (const r of [94, STAGE.coulombRadius]) {
    ctx.beginPath();
    ctx.arc(STAGE.targetX, STAGE.targetY, r + pulse * 2.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.34)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  // Outer label well above the Coulomb barrier ring
  drawCanvasPillLabel(
    '⚡ Barreira de Coulomb (Repulsão Elétrica + ↔ +)',
    STAGE.targetX,
    STAGE.targetY - STAGE.coulombRadius - 15,
    '#fda4af',
    'rgba(244, 63, 94, 0.42)',
    '600 11px Segoe UI'
  );

  // 2. Inner Strong Nuclear Force Well ("Supercola" de Curtíssimo Alcance)
  ctx.beginPath();
  ctx.arc(STAGE.targetX, STAGE.targetY, STAGE.strongForceRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.82)';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Inner label comfortably centered in the gap between Coulomb outer ring and Strong Force inner ring
  drawCanvasPillLabel(
    '🧲 Força Nuclear Forte (Atração)',
    STAGE.targetX,
    STAGE.targetY - STAGE.strongForceRadius - 22,
    '#6ee7b7',
    'rgba(52, 211, 153, 0.45)',
    '600 10.5px Segoe UI'
  );
  ctx.restore();
}

function drawClusterTrail(trail, color) {
  if (!trail || trail.length < 2) return;
  ctx.save();
  ctx.beginPath();
  trail.forEach((pt, idx) => {
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.restore();
}

function drawLightNucleusCluster(cx, cy, nucleons, titleLabel, subLabel, timestamp, vibAmp = 1.0, compactLabel = false) {
  const t = timestamp * 0.005;
  // Subtle symmetrical radial breathing so clusters never tilt crookedly
  const breath = 1 + Math.sin(t * 2.2) * 0.035 * vibAmp;

  nucleons.forEach(n => {
    const x = cx + n.dx * breath;
    const y = cy + n.dy * breath;

    ctx.save();
    // Smooth 3D spherical radial gradient (no separate off-center circle dot to clash with text)
    const grad = ctx.createRadialGradient(
      x - n.r * 0.28,
      y - n.r * 0.28,
      n.r * 0.1,
      x,
      y,
      n.r
    );
    if (n.isProton) {
      grad.addColorStop(0, '#fda4af');
      grad.addColorStop(0.45, '#f43f5e');
      grad.addColorStop(1, '#be123c');
    } else {
      grad.addColorStop(0, '#bae6fd');
      grad.addColorStop(0.45, '#0ea5e9');
      grad.addColorStop(1, '#0369a1');
    }

    ctx.beginPath();
    ctx.arc(x, y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = n.isProton ? 'rgba(244, 63, 94, 0.65)' : 'rgba(34, 211, 238, 0.65)';
    ctx.shadowBlur = 7;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Perfectly centered + or 0 sign inside nucleon sphere
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.isProton ? '+' : '0', x, y + 0.5);
    ctx.restore();
  });

  if (titleLabel) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelY = compactLabel ? cy - 26 : cy + 68;
    drawCanvasPillLabel(
      titleLabel,
      cx,
      labelY,
      '#ffffff',
      'rgba(192, 132, 252, 0.32)',
      compactLabel ? 'bold 11.5px Segoe UI' : 'bold 12.5px Segoe UI'
    );

    if (subLabel) {
      ctx.fillStyle = '#fcd34d';
      ctx.font = '600 11px Segoe UI';
      ctx.fillText(subLabel, cx, labelY + 20);
    }
    ctx.restore();
  }
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

// ============================================================================
// MODO 2: USINAS DE FUSÃO — TOKAMAK (ITER) VS. LASER INERCIAL (NIF) E FATOR Q
// ============================================================================

const REACTOR_CENTER = { x: 360, y: 256 };

function computeTokamakMetrics() {
  const rx = state.reactor;
  const fuel = FUSION_FUELS[state.selectedFuelKey];
  if (rx.quenched || rx.magFieldTesla < 3.0) {
    return {
      qTarget: 0,
      qGlobal: 0,
      fusionPowerMW: 0,
      gridDrawMW: Math.round(rx.heatingPowerMW * 2.2 + rx.magFieldTesla * 4),
      confined: false
    };
  }

  // Reactivity factor by fuel: D-T is reference (1.0), D-D is ~0.18, D-He3 is ~0.32 at 150 MK
  const fuelFactor = state.selectedFuelKey === 'DT' ? 1.0 : state.selectedFuelKey === 'DHe3' ? 0.35 : 0.22;

  // Magnetic confinement quality (scales steeply up to 13 T ITER design)
  const bNorm = Math.pow(Math.min(15, rx.magFieldTesla) / 13.0, 1.65);

  // Heating factor (peaks around 50 MW ITER design for Q_alvo = 10.0)
  const pIn = rx.heatingPowerMW;
  const heatEfficiency = pIn <= 50 ? Math.pow(pIn / 50, 1.1) : 1.0 + (pIn - 50) * 0.008;

  const qTarget = Number((10.0 * fuelFactor * bNorm * heatEfficiency).toFixed(2));
  const fusionPowerMW = Number((pIn * qTarget).toFixed(1));
  // Plant electrical grid draw (cryogenics, coils, injectors ~ 3x heating power)
  const gridDrawMW = Math.round(pIn * 3.0);
  const qGlobal = Number((fusionPowerMW / gridDrawMW).toFixed(2));

  return {
    qTarget,
    qGlobal,
    fusionPowerMW,
    gridDrawMW,
    confined: true
  };
}

function computeLaserMetrics() {
  const rx = state.reactor;
  const fuelFactor = state.selectedFuelKey === 'DT' ? 1.0 : state.selectedFuelKey === 'DHe3' ? 0.32 : 0.2;
  const eLaser = rx.laserEnergyMJ;
  const symNorm = Math.pow(rx.laserSymmetryPct / 100, 2.8);

  // NIF Dec 2022 milestone: 2.05 MJ laser @ 100% symmetry with D-T => 3.15 MJ fusion (Q_alvo = 1.54)
  let qTarget = 0;
  if (eLaser >= 1.75 && rx.laserSymmetryPct >= 85 && state.selectedFuelKey === 'DT') {
    qTarget = 1.54 * Math.pow(eLaser / 2.05, 1.85) * symNorm;
  } else {
    qTarget = 0.65 * Math.pow(eLaser / 2.05, 1.4) * symNorm * fuelFactor;
  }

  qTarget = Number(Math.max(0.02, qTarget).toFixed(2));
  const yieldMJ = Number((eLaser * qTarget).toFixed(2));
  const gridDrawMJ = Math.round((eLaser / 2.05) * 300); // ~300 MJ from electrical grid for 2.05 MJ UV laser!
  const qGlobal = Number((yieldMJ / gridDrawMJ).toFixed(4));

  return {
    qTarget,
    qGlobal,
    yieldMJ,
    gridDrawMJ,
    ignited: qTarget >= 1.0
  };
}

function initReactorMode() {
  setPaused(false);
  const rx = state.reactor;
  rx.quenched = rx.magFieldTesla < 3.0;
  rx.fusionEventsCount = 0;
  rx.tritiumBredCount = 0;
  rx.tokamakParticles = [];
  rx.blanketFlashes = [];
  rx.laserPhase = 'idle';
  rx.laserTimer = 0;
  rx.capsuleRadius = 48;
  rx.laserProducts = [];

  // Populate 36 orbiting plasma ions inside the Tokamak torus (r = 68..128)
  rx.tokamakIons = [];
  for (let i = 0; i < 36; i++) {
    const isTarget = i % 2 === 1;
    const baseR = 72 + (i % 5) * 12;
    const angle = (i / 36) * Math.PI * 2;
    rx.tokamakIons.push({
      angle,
      baseR,
      r: baseR,
      angSpeed: (0.018 + (i % 4) * 0.004) * (i % 3 === 0 ? -1 : 1),
      wobblePhase: i * 1.1,
      isTarget,
      flashTimer: 0
    });
  }

  updateReactorUIControls();
  updateReactorTelemetry();
}

function updateReactorUIControls() {
  const rx = state.reactor;
  const isTokamak = rx.tech === 'tokamak';

  if (reactorTechToggle) {
    reactorTechToggle.querySelectorAll('.tech-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tech === rx.tech);
    });
  }

  if (tokamakSliders) tokamakSliders.classList.toggle('hidden', !isTokamak);
  if (laserSliders) laserSliders.classList.toggle('hidden', isTokamak);

  if (reactorTechHint) {
    reactorTechHint.textContent = isTokamak
      ? 'Gaiola magnética invisível mantém o plasma a 150 MK levitando sem tocar nas paredes.'
      : '192 feixes de laser implodem uma cápsula de D-T do tamanho de um grão de pimenta.';
  }

  if (reactorActionBtn) {
    if (isTokamak) {
      reactorActionBtn.textContent = rx.quenched ? '⚡ RELIGAR (13 T)' : '⚠️ FALHA (0 T)';
    } else {
      reactorActionBtn.textContent =
        rx.laserPhase === 'idle' ? '⚡ DISPARAR LASERS' : '⚡ NOVO DISPARO';
    }
  }

  // Update bottom stepper labels for Mode 2
  const steps = reactionStepper.querySelectorAll('.step');
  if (isTokamak) {
    const labels = [
      '1. Vácuo Toroidal',
      '2. Gaiola Magnética (13 T)',
      '3. Plasma a 150 MK',
      '4. Fusão (Q_alvo = 10)',
      '5. Manta ⁶Li → Gera ³H'
    ];
    steps.forEach((s, i) => {
      if (labels[i]) s.textContent = labels[i];
    });
    if (rx.quenched) setStepActive(0);
    else if (rx.lithiumBlanketOn && state.selectedFuelKey === 'DT') setStepActive(4);
    else setStepActive(3);
  } else {
    const labels = [
      '1. Cápsula D-T (2 mm)',
      '2. 192 Feixes Laser',
      '3. Ablação & Implosão',
      '4. Ignição Estelar',
      '5. Q_alvo = 1,54 (NIF!)'
    ];
    steps.forEach((s, i) => {
      if (labels[i]) s.textContent = labels[i];
    });
    const phaseMap = { idle: 0, lasers_firing: 1, imploding: 2, ignited: 3, expanding: 4 };
    setStepActive(phaseMap[rx.laserPhase] ?? 0);
  }
}

function updateReactorTelemetry() {
  if (state.mode !== 'reactor') return;
  const rx = state.reactor;
  const fuel = FUSION_FUELS[state.selectedFuelKey];
  const pw = fuel.pathways[0];

  rightTitle1.textContent =
    rx.tech === 'tokamak' && rx.lithiumBlanketOn && state.selectedFuelKey === 'DT'
      ? 'Fusão D-T + Reprodução de Trítio (⁶Li)'
      : 'Equação Nuclear na Usina';

  rightTitle2.textContent =
    rx.tech === 'tokamak'
      ? 'Confinamento Magnético & Segurança'
      : 'Confinamento Inercial (NIF) & Fator Q';

  rightTitle3.textContent = 'Balanço Energético (Q_alvo vs. Q_global)';
  rightTitle4.textContent = 'Ciclo de Combustível & Engenharia';

  metricLabel1.textContent = rx.tech === 'tokamak' ? 'Potência Injetada / Rede' : 'Laser Injetado / Rede';
  metricLabel2.textContent = rx.tech === 'tokamak' ? 'Potência de Fusão' : 'Energia de Fusão';
  metricLabel3.textContent = 'Fator Q_alvo (Plasma)';
  metricLabel4.textContent = 'Fator Q_global (Usina)';

  if (rx.tech === 'tokamak') {
    const m = computeTokamakMetrics();

    if (rx.lithiumBlanketOn && state.selectedFuelKey === 'DT') {
      equationDisplay.innerHTML =
        nuclideHTML(1, 0, 'n', { variant: 'highlight' }) +
        OP_PLUS +
        nuclideHTML(6, 3, 'Li', { variant: 'highlight' }) +
        OP_ARROW +
        nuclideHTML(4, 2, 'He') +
        OP_PLUS +
        nuclideHTML(3, 1, 'H', { variant: 'unstable' }) +
        OP_PLUS +
        `<span class="eq-energy">+4.8 MeV (Recicla ³H!)</span>`;
    } else {
      equationDisplay.innerHTML =
        nuclideHTML(fuel.projectile.A, fuel.projectile.Z, fuel.projectile.symbol, { variant: 'highlight' }) +
        OP_PLUS +
        nuclideHTML(fuel.target.A, fuel.target.Z, fuel.target.symbol, { variant: 'highlight' }) +
        OP_ARROW +
        nuclideHTML(pw.heavy.A, pw.heavy.Z, pw.heavy.symbol) +
        OP_PLUS +
        nuclideHTML(pw.light.A, pw.light.Z, pw.light.symbol) +
        OP_PLUS +
        `<span class="eq-energy">${pw.totalEnergyMeV} MeV</span>`;
    }

    metricTemp.textContent = `${rx.heatingPowerMW} MW | Rede: ${m.gridDrawMW} MW`;
    metricEnergy.textContent = `${m.fusionPowerMW} MW`;
    metricBarrier.textContent = `Q_alvo = ${m.qTarget.toFixed(2)}`;
    metricBarrier.style.color = m.qTarget >= 1 ? '#34d399' : '#fb7185';
    metricConservation.textContent = `Q_global ≈ ${m.qGlobal.toFixed(2)}`;
    metricConservation.style.color = m.qGlobal >= 1 ? '#facc15' : '#cbd5e1';

    if (rx.quenched) {
      stageStatusBadge.textContent = '❄️ Falha Magnética (0 T): Plasma Esfriou em Milissegundos (Zero Meltdown!)';
      explanationText.textContent =
        'SEGURANÇA PASSIVA TOTAL: Sem o campo magnético dos ímãs supercondutores, o ~1 grama de plasma toca a parede fria, perde calor instantaneamente e a reação se apaga sozinha como uma vela! Não existe risco de explosão ou derretimento (Meltdown).';
    } else if (rx.lithiumBlanketOn && state.selectedFuelKey === 'DT') {
      stageStatusBadge.textContent = `🧲 Tokamak Ativo (${rx.magFieldTesla} T) • Q_alvo = ${m.qTarget} • Manta de Lítio Reciclando Trítio!`;
      explanationText.textContent =
        'O Trítio (³H) quase não existe na natureza! Por isso, o Tokamak reveste suas paredes com Lítio (⁶Li): o nêutron de 14,1 MeV escapa do ímã, bate na manta de Lítio e produz Hélio-4 + um novo átomo de Trítio (³H) que realimenta o plasma!';
    } else {
      stageStatusBadge.textContent = `🧲 Tokamak Ativo (${rx.magFieldTesla} T) • Potência de Fusão: ${m.fusionPowerMW} MW (Q_alvo = ${m.qTarget})`;
      explanationText.textContent =
        'No Tokamak (como o ITER na França), ímãs supercondutores criam uma "garrafa magnética invisível" em formato de rosca (toroide). O plasma a 150 MK levita no centro sem derreter as paredes metálicas!';
    }

    productsList.innerHTML = `
      <div class="product-item fragment-heavy">
        <div>
          <strong>🧲 Confinamento Magnético (${rx.magFieldTesla.toFixed(1)} Tesla)</strong>
          <div style="font-size:0.61rem;color:#94a3b8">${rx.quenched ? 'Desligado — Plasma apagado com segurança' : `Fusão contínua (${rx.fusionEventsCount} reações)`}</div>
        </div>
        <span class="value-pill">${rx.quenched ? 'Apagado' : 'Estável'}</span>
      </div>
      <div class="product-item fragment-light">
        <div>
          <strong>🧱 Manta Reprodutora de Lítio (⁶Li)</strong>
          <div style="font-size:0.61rem;color:#94a3b8">${
            state.selectedFuelKey !== 'DT'
              ? 'Requer ciclo D-T (nêutrons de 14,1 MeV)'
              : rx.lithiumBlanketOn
              ? `Ativa: ${rx.tritiumBredCount} átomos de Trítio (³H) fabricados!`
              : 'Desativada: Nêutrons apenas aquecem a parede'
          }</div>
        </div>
        <span class="value-pill">${rx.lithiumBlanketOn && state.selectedFuelKey === 'DT' ? '+³H Ativo' : 'Off'}</span>
      </div>
    `;
  } else {
    // Laser Inertial (NIF) Telemetry
    const m = computeLaserMetrics();

    equationDisplay.innerHTML =
      nuclideHTML(fuel.projectile.A, fuel.projectile.Z, fuel.projectile.symbol, { variant: 'highlight' }) +
      OP_PLUS +
      nuclideHTML(fuel.target.A, fuel.target.Z, fuel.target.symbol, { variant: 'highlight' }) +
      OP_ARROW +
      nuclideHTML(pw.heavy.A, pw.heavy.Z, pw.heavy.symbol) +
      OP_PLUS +
      nuclideHTML(pw.light.A, pw.light.Z, pw.light.symbol) +
      OP_PLUS +
      `<span class="eq-energy">${m.yieldMJ} MJ (Q_alvo = ${m.qTarget})</span>`;

    metricTemp.textContent = `${rx.laserEnergyMJ.toFixed(2)} MJ | Rede: ${m.gridDrawMJ} MJ`;
    metricEnergy.textContent = `${m.yieldMJ.toFixed(2)} MJ`;
    metricBarrier.textContent = `Q_alvo = ${m.qTarget.toFixed(2)}`;
    metricBarrier.style.color = m.qTarget >= 1 ? '#34d399' : '#fb7185';
    metricConservation.textContent = `Q_global ≈ ${m.qGlobal.toFixed(2)}`;
    metricConservation.style.color = '#fbbf24';

    if (rx.laserPhase === 'idle') {
      stageStatusBadge.textContent = `⚡ NIF Pronto: 192 Lasers (${rx.laserEnergyMJ.toFixed(2)} MJ) apontados para a cápsula`;
      explanationText.textContent =
        'No Confinamento Inercial (NIF, EUA), 192 feixes de laser bombardeiam uma cápsula do tamanho de um grão de pimenta. Em Dez/2022, 2,05 MJ de laser geraram 3,15 MJ de fusão (Q_alvo = 1,54), mas gastando ~300 MJ da rede elétrica (Q_global ≈ 0,01)!';
    } else if (rx.laserPhase === 'lasers_firing' || rx.laserPhase === 'imploding') {
      stageStatusBadge.textContent = '⚡ Implosão Inercial: Camada externa explode p/ fora e comprime o núcleo!';
      explanationText.textContent =
        'Como um foguete esférico invertido, a camada externa da cápsula vaporiza para fora (ablação), fazendo o combustível D-T implodir para dentro a 400 km/s até atingir 100x a densidade do chumbo!';
    } else {
      stageStatusBadge.textContent = m.ignited
        ? `☀️ IGNIÇÃO ATINGIDA! ${rx.laserEnergyMJ.toFixed(2)} MJ → ${m.yieldMJ.toFixed(2)} MJ (Q_alvo = ${m.qTarget} > 1!)`
        : `⚠️ Compressão Insuficiente: Gerou ${m.yieldMJ.toFixed(2)} MJ (Q_alvo = ${m.qTarget} < 1)`;
      explanationText.textContent = m.ignited
        ? `MARCO HISTÓRICO (Q_alvo = ${m.qTarget}): A cápsula liberou mais energia (${m.yieldMJ} MJ) do que a luz laser que entrou (${rx.laserEnergyMJ} MJ)! Porém, os bancos de capacitores puxaram ~${m.gridDrawMJ} MJ da tomada (Q_global ≈ ${m.qGlobal.toFixed(2)}).`
        : `Sem energia ou simetria suficiente nos 192 lasers, a cápsula não atingiu a pressão estelar necessária para ignição autossustentada (Q_alvo < 1). Use 2,05 MJ e 100% de simetria!`;
    }

    productsList.innerHTML = `
      <div class="product-item fragment-heavy">
        <div>
          <strong>🎯 Fator Q_alvo (Física da Cápsula)</strong>
          <div style="font-size:0.61rem;color:#94a3b8">${m.yieldMJ} MJ gerados / ${rx.laserEnergyMJ} MJ de luz laser</div>
        </div>
        <span class="value-pill" style="color:${m.qTarget >= 1 ? '#34d399' : '#fb7185'}">Q = ${m.qTarget}</span>
      </div>
      <div class="product-item fragment-light">
        <div>
          <strong>🔌 Fator Q_global (Engenharia da Usina)</strong>
          <div style="font-size:0.61rem;color:#94a3b8">${m.yieldMJ} MJ gerados / ~${m.gridDrawMJ} MJ da rede elétrica</div>
        </div>
        <span class="value-pill" style="color:#fbbf24">Q ≈ ${m.qGlobal.toFixed(2)}</span>
      </div>
    `;
  }
}

function triggerLaserShot() {
  setPaused(false);
  const rx = state.reactor;
  rx.tech = 'laser';
  rx.laserPhase = 'lasers_firing';
  rx.laserTimer = 0;
  rx.capsuleRadius = 48;
  rx.laserProducts = [];
  state.shockwaves = [];
  updateReactorUIControls();
  updateReactorTelemetry();
}

function updateReactorSimulation() {
  const dt = state.simSpeed;
  const rx = state.reactor;

  // Update shockwaves
  for (let i = state.shockwaves.length - 1; i >= 0; i--) {
    const s = state.shockwaves[i];
    s.r += 3.5 * dt;
    s.alpha = Math.max(0, 1 - s.r / s.maxR);
    if (s.alpha <= 0) state.shockwaves.splice(i, 1);
  }

  if (rx.tech === 'tokamak') {
    const m = computeTokamakMetrics();
    const speedMult = m.confined ? 0.8 + (rx.heatingPowerMW / 50) * 0.7 : 0.15;

    rx.tokamakIons.forEach(ion => {
      ion.angle += ion.angSpeed * speedMult * dt;
      if (ion.flashTimer > 0) ion.flashTimer = Math.max(0, ion.flashTimer - dt);

      if (rx.quenched) {
        // Drift outward to touch cold wall and stop
        ion.r = Math.min(138, ion.r + 0.85 * dt);
      } else {
        // Confined tightly inside magnetic bottle!
        const spread = Math.max(4, (15 - rx.magFieldTesla) * 1.4);
        ion.r = ion.baseR + Math.sin(ion.angle * 3 + ion.wobblePhase) * spread;
      }
    });

    // Spawn continuous fusion events inside Tokamak plasma
    if (m.confined && Math.random() < 0.055 * (m.qTarget / 10) * dt) {
      const randAng = Math.random() * Math.PI * 2;
      const randR = 82 + Math.random() * 34;
      const fx = REACTOR_CENTER.x + Math.cos(randAng) * randR;
      const fy = REACTOR_CENTER.y + Math.sin(randAng) * randR;

      rx.fusionEventsCount++;
      state.shockwaves.push({
        x: fx,
        y: fy,
        r: 4,
        maxR: 26,
        color: 'rgba(250, 204, 21, 0.85)',
        alpha: 1
      });

      const isAneutronic = state.selectedFuelKey === 'DHe3';
      if (!isAneutronic) {
        // Emit fast neutron (0 charge -> crosses magnetic field lines straight to the outer wall!)
        const outAng = randAng + (Math.random() - 0.5) * 0.4;
        rx.tokamakParticles.push({
          type: 'neutron',
          x: fx,
          y: fy,
          vx: Math.cos(outAng) * 3.4,
          vy: Math.sin(outAng) * 3.4
        });
      }
      if (rx.fusionEventsCount % 3 === 0) {
        updateReactorTelemetry();
      }
    }

    // Update flying neutrons & bred tritium particles
    for (let i = rx.tokamakParticles.length - 1; i >= 0; i--) {
      const p = rx.tokamakParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const dist = Math.hypot(p.x - REACTOR_CENTER.x, p.y - REACTOR_CENTER.y);

      if (p.type === 'neutron' && dist >= 165) {
        // Hit the outer Lithium-6 blanket wall!
        const hitAng = Math.atan2(p.y - REACTOR_CENTER.y, p.x - REACTOR_CENTER.x);
        if (rx.lithiumBlanketOn && state.selectedFuelKey === 'DT') {
          rx.tritiumBredCount++;
          rx.blanketFlashes.push({
            angle: hitAng,
            alpha: 1.0
          });
          // Spawn a newly bred Tritium (³H) atom heading back into the plasma!
          rx.tokamakParticles.push({
            type: 'tritium',
            x: p.x,
            y: p.y,
            vx: -Math.cos(hitAng) * 2.2,
            vy: -Math.sin(hitAng) * 2.2
          });
          updateReactorTelemetry();
        }
        rx.tokamakParticles.splice(i, 1);
      } else if (p.type === 'tritium' && dist <= 105) {
        // Absorbed into the toroidal plasma core!
        rx.tokamakParticles.splice(i, 1);
      } else if (dist > 220) {
        rx.tokamakParticles.splice(i, 1);
      }
    }

    // Decay blanket flashes
    for (let i = rx.blanketFlashes.length - 1; i >= 0; i--) {
      rx.blanketFlashes[i].alpha -= 0.03 * dt;
      if (rx.blanketFlashes[i].alpha <= 0) rx.blanketFlashes.splice(i, 1);
    }
  } else {
    // Laser Inertial (NIF) state machine
    rx.laserTimer += dt;
    if (rx.laserPhase === 'lasers_firing' && rx.laserTimer > 38) {
      rx.laserPhase = 'imploding';
      rx.laserTimer = 0;
      updateReactorUIControls();
      updateReactorTelemetry();
    } else if (rx.laserPhase === 'imploding') {
      rx.capsuleRadius = Math.max(10, 48 - (rx.laserTimer / 45) * 38);
      if (rx.laserTimer > 45) {
        rx.laserPhase = 'ignited';
        rx.laserTimer = 0;
        const m = computeLaserMetrics();
        state.shockwaves.push(
          {
            x: REACTOR_CENTER.x,
            y: REACTOR_CENTER.y,
            r: 8,
            maxR: m.ignited ? 185 : 95,
            color: m.ignited ? 'rgba(250, 204, 21, 0.95)' : 'rgba(244, 63, 94, 0.85)',
            alpha: 1
          },
          {
            x: REACTOR_CENTER.x,
            y: REACTOR_CENTER.y,
            r: 4,
            maxR: m.ignited ? 135 : 65,
            color: 'rgba(52, 211, 153, 0.85)',
            alpha: 1
          }
        );

        // Spawn radially expanding fusion products
        const count = m.ignited ? 20 : 8;
        for (let i = 0; i < count; i++) {
          const ang = (i / count) * Math.PI * 2;
          const isNeutron = i % 2 === 0 && state.selectedFuelKey !== 'DHe3';
          const spd = isNeutron ? 3.4 : 2.1;
          rx.laserProducts.push({
            x: REACTOR_CENTER.x,
            y: REACTOR_CENTER.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            isNeutron
          });
        }
        updateReactorUIControls();
        updateReactorTelemetry();
      }
    } else if (rx.laserPhase === 'ignited' && rx.laserTimer > 28) {
      rx.laserPhase = 'expanding';
      rx.laserTimer = 0;
      updateReactorUIControls();
      updateReactorTelemetry();
    } else if (rx.laserPhase === 'expanding') {
      rx.laserProducts.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      });
    }
  }
}

function renderReactorCanvas(renderTime) {
  drawQFactorTopBar();

  if (state.reactor.tech === 'tokamak') {
    renderTokamakChamber(renderTime);
  } else {
    renderLaserNIFChamber(renderTime);
  }

  // Render expanding shockwaves on top
  state.shockwaves.forEach(s => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = s.alpha;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  });
}

function drawQFactorTopBar() {
  const rx = state.reactor;
  const isTokamak = rx.tech === 'tokamak';
  const m = isTokamak ? computeTokamakMetrics() : computeLaserMetrics();

  const barX = 115;
  const barY = 14;
  const barW = 490;
  const barH = 18;

  // Map Q_alvo onto [0..1] where Q=1.0 is at 35% of the bar and Q=10 is at 92%
  const qVal = m.qTarget;
  const qPct = qVal <= 1.0 ? (qVal / 1.0) * 0.35 : Math.min(1, 0.35 + ((qVal - 1.0) / 10.0) * 0.62);
  const breakevenX = barX + barW * 0.35;

  ctx.save();
  ctx.fillStyle = 'rgba(12, 8, 23, 0.82)';
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 9);
  ctx.fill();
  ctx.stroke();

  const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  fillGrad.addColorStop(0, '#fb7185');
  fillGrad.addColorStop(0.35, '#facc15');
  fillGrad.addColorStop(1, '#10b981');
  ctx.fillStyle = fillGrad;
  ctx.beginPath();
  ctx.roundRect(barX + 2, barY + 2, Math.max(8, (barW - 4) * qPct), barH - 4, 7);
  ctx.fill();

  // Breakeven Q = 1.0 marker
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(breakevenX, barY - 3);
  ctx.lineTo(breakevenX, barY + barH + 3);
  ctx.stroke();

  ctx.fillStyle = qVal >= 1.0 ? '#34d399' : '#fda4af';
  ctx.font = 'bold 10.5px Segoe UI';
  ctx.textAlign = 'center';
  const summaryText = isTokamak
    ? `Fator Q_alvo (Plasma): ${qVal.toFixed(2)}  |  Meta de Ignição: Q ≥ 1.0  |  Q_global (Usina): ≈ ${m.qGlobal.toFixed(2)}`
    : `Fator Q_alvo (Cápsula NIF): ${qVal.toFixed(2)}  |  Meta: Q ≥ 1.0  |  Q_global (Rede 300 MJ): ≈ ${m.qGlobal.toFixed(2)}`;
  ctx.fillText(summaryText, barX + barW / 2, barY + 31);
  ctx.restore();
}

function renderTokamakChamber(timestamp) {
  const rx = state.reactor;
  const cx = REACTOR_CENTER.x;
  const cy = REACTOR_CENTER.y;
  const pulse = (Math.sin(timestamp * 0.005) + 1) * 0.5;

  ctx.save();

  // 1. Outer Lithium-6 Breeding Blanket Wall (r = 162..178)
  ctx.beginPath();
  ctx.arc(cx, cy, 174, 0, Math.PI * 2);
  ctx.arc(cx, cy, 156, 0, Math.PI * 2, true);
  ctx.fillStyle =
    rx.lithiumBlanketOn && state.selectedFuelKey === 'DT'
      ? 'rgba(16, 185, 129, 0.18)'
      : 'rgba(71, 85, 105, 0.22)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 174, 0, Math.PI * 2);
  ctx.strokeStyle =
    rx.lithiumBlanketOn && state.selectedFuelKey === 'DT'
      ? 'rgba(52, 211, 153, 0.75)'
      : 'rgba(148, 163, 184, 0.45)';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Draw Lithium blanket reaction flashes
  rx.blanketFlashes.forEach(f => {
    const fx = cx + Math.cos(f.angle) * 165;
    const fy = cy + Math.sin(f.angle) * 165;
    ctx.beginPath();
    ctx.arc(fx, fy, 12, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(52, 211, 153, ${f.alpha * 0.7})`;
    ctx.fill();
  });

  // 2. Toroidal Plasma Glow (r = 55..148)
  const plasmaGrad = ctx.createRadialGradient(cx, cy, 52, cx, cy, 150);
  if (rx.quenched) {
    plasmaGrad.addColorStop(0, 'rgba(30, 41, 59, 0.1)');
    plasmaGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
    plasmaGrad.addColorStop(1, 'rgba(15, 23, 42, 0.2)');
  } else {
    plasmaGrad.addColorStop(0, 'rgba(12, 8, 23, 0.1)');
    plasmaGrad.addColorStop(0.48, `rgba(245, 158, 11, ${0.28 + pulse * 0.08})`);
    plasmaGrad.addColorStop(0.75, 'rgba(236, 72, 153, 0.22)');
    plasmaGrad.addColorStop(1, 'rgba(12, 8, 23, 0.05)');
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 152, 0, Math.PI * 2);
  ctx.arc(cx, cy, 48, 0, Math.PI * 2, true);
  ctx.fillStyle = plasmaGrad;
  ctx.fill();

  // 3. Magnetic Field Lines ("Garrafa Magnética Invisível")
  if (!rx.quenched && rx.magFieldTesla > 0) {
    const fieldAlpha = Math.min(0.65, (rx.magFieldTesla / 13) * 0.55);
    for (const r of [72, 98, 124]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${fieldAlpha})`;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // 4. 12 Radial Superconducting Toroidal Field Coils (Ímãs Supercondutores)
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const x1 = cx + Math.cos(ang) * 48;
    const y1 = cy + Math.sin(ang) * 48;
    const x2 = cx + Math.cos(ang) * 155;
    const y2 = cy + Math.sin(ang) * 155;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = rx.quenched ? 'rgba(100, 116, 139, 0.35)' : 'rgba(56, 189, 248, 0.32)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }

  // 5. Inner Solenoid Core of the Torus (Rosca Central)
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#130d24';
  ctx.fill();
  ctx.strokeStyle = rx.quenched ? '#475569' : '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = rx.quenched ? '#94a3b8' : '#bae6fd';
  ctx.font = 'bold 10px Segoe UI';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Ímã Central', cx, cy - 6);
  ctx.fillText(`${rx.magFieldTesla.toFixed(1)} Tesla`, cx, cy + 8);

  // 6. Orbiting Plasma Ions (D and T / He3)
  rx.tokamakIons.forEach(ion => {
    const ix = cx + Math.cos(ion.angle) * ion.r;
    const iy = cy + Math.sin(ion.angle) * ion.r;
    ctx.beginPath();
    ctx.arc(ix, iy, 4.8, 0, Math.PI * 2);
    if (rx.quenched) {
      ctx.fillStyle = '#64748b';
    } else {
      ctx.fillStyle = ion.isTarget ? '#f43f5e' : '#fbbf24';
      ctx.shadowColor = ion.isTarget ? '#f43f5e' : '#fbbf24';
      ctx.shadowBlur = 6;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // 7. Escaping Fast Neutrons & Newly Bred Tritium (³H) Particles
  rx.tokamakParticles.forEach(p => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.type === 'neutron' ? 5.2 : 6.0, 0, Math.PI * 2);
    ctx.fillStyle = p.type === 'neutron' ? '#22d3ee' : '#10b981';
    ctx.shadowColor = p.type === 'neutron' ? '#22d3ee' : '#10b981';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(p.type === 'neutron' ? 'n⁰' : '³H', p.x, p.y - 8);
    ctx.restore();
  });

  // 8. Labels above and below Tokamak
  drawCanvasPillLabel(
    rx.lithiumBlanketOn && state.selectedFuelKey === 'DT'
      ? '🧱 Parede Reprodutora de Lítio (⁶Li): Nêutrons geram novo Trítio (³H)!'
      : '🧱 Parede do Vaso de Vácuo do Tokamak',
    cx,
    cy - 190,
    rx.lithiumBlanketOn && state.selectedFuelKey === 'DT' ? '#6ee7b7' : '#cbd5e1',
    'rgba(52, 211, 153, 0.4)',
    '600 10.5px Segoe UI'
  );

  drawCanvasPillLabel(
    rx.quenched
      ? '❄️ Falha Magnética: Plasma tocou a parede fria e apagou sem Meltdown!'
      : `🧲 Tokamak (ITER): Plasma a 150 MK confinado por ${rx.magFieldTesla.toFixed(1)} T`,
    cx,
    cy + 190,
    rx.quenched ? '#93c5fd' : '#fde047',
    rx.quenched ? 'rgba(56, 189, 248, 0.45)' : 'rgba(250, 204, 21, 0.45)',
    'bold 11px Segoe UI'
  );

  ctx.restore();
}

function renderLaserNIFChamber(timestamp) {
  const rx = state.reactor;
  const cx = REACTOR_CENTER.x;
  const cy = REACTOR_CENTER.y;
  const m = computeLaserMetrics();

  ctx.save();

  // 1. Spherical NIF Target Chamber (r = 172)
  ctx.beginPath();
  ctx.arc(cx, cy, 172, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.38)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 2. 16 Laser Beam Ports around the chamber (representing the 192 NIF Laser Beams)
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const px = cx + Math.cos(ang) * 172;
    const py = cy + Math.sin(ang) * 172;

    // Laser emitter nozzle
    ctx.beginPath();
    ctx.arc(px, py, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // Active Laser Beams during 'lasers_firing' and 'imploding'
    if (rx.laserPhase === 'lasers_firing' || rx.laserPhase === 'imploding') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(
        cx + Math.cos(ang) * rx.capsuleRadius,
        cy + Math.sin(ang) * rx.capsuleRadius
      );
      ctx.strokeStyle = rx.laserPhase === 'lasers_firing' ? 'rgba(56, 189, 248, 0.85)' : 'rgba(192, 132, 252, 0.65)';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }
  }

  // 3. Central Gold Hohlraum Cylinder outline
  ctx.save();
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
  ctx.fillStyle = 'rgba(250, 204, 21, 0.06)';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.roundRect(cx - 68, cy - 68, 136, 136, 16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. Peppercorn-sized Fuel Capsule (Cápsula D-T)
  const capR = rx.capsuleRadius;
  const capGrad = ctx.createRadialGradient(cx - capR * 0.25, cy - capR * 0.25, 2, cx, cy, capR);
  if (rx.laserPhase === 'ignited') {
    capGrad.addColorStop(0, '#ffffff');
    capGrad.addColorStop(0.5, '#facc15');
    capGrad.addColorStop(1, '#f43f5e');
  } else {
    capGrad.addColorStop(0, '#bae6fd');
    capGrad.addColorStop(0.6, '#0284c7');
    capGrad.addColorStop(1, '#1e3a8a');
  }

  ctx.beginPath();
  ctx.arc(cx, cy, capR, 0, Math.PI * 2);
  ctx.fillStyle = capGrad;
  ctx.shadowColor = rx.laserPhase === 'ignited' ? '#facc15' : '#38bdf8';
  ctx.shadowBlur = rx.laserPhase === 'ignited' ? 28 : 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Segoe UI';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (capR >= 24) {
    ctx.fillText(`Cápsula ${state.selectedFuelKey}`, cx, cy);
  }

  // 5. Expanding fusion products after ignition
  if (rx.laserPhase === 'ignited' || rx.laserPhase === 'expanding') {
    rx.laserProducts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isNeutron ? 4.8 : 6.2, 0, Math.PI * 2);
      ctx.fillStyle = p.isNeutron ? '#22d3ee' : '#facc15';
      ctx.fill();
    });
  }

  // 6. Informative Pills above and below Chamber
  drawCanvasPillLabel(
    `⚡ Confinamento Inercial (NIF): 192 Feixes Laser (${rx.laserEnergyMJ.toFixed(2)} MJ) • Rede Elétrica: ~${m.gridDrawMJ} MJ`,
    cx,
    cy - 190,
    '#bae6fd',
    'rgba(56, 189, 248, 0.42)',
    '600 10.5px Segoe UI'
  );

  const bottomText =
    rx.laserPhase === 'idle'
      ? 'Clique em "⚡ DISPARAR 192 LASERS" para implodir a cápsula!'
      : `Resultado do Pulso: ${rx.laserEnergyMJ.toFixed(2)} MJ Laser → ${m.yieldMJ.toFixed(2)} MJ Fusão (Q_alvo = ${m.qTarget} | Q_global ≈ ${m.qGlobal.toFixed(2)})`;

  drawCanvasPillLabel(
    bottomText,
    cx,
    cy + 190,
    m.ignited ? '#fde047' : '#fda4af',
    m.ignited ? 'rgba(250, 204, 21, 0.45)' : 'rgba(244, 63, 94, 0.45)',
    'bold 11px Segoe UI'
  );

  ctx.restore();
}

function switchMode(newMode) {
  if (newMode !== 'collision' && newMode !== 'reactor') return;
  state.mode = newMode;

  if (modeTabs) {
    modeTabs.querySelectorAll('.mode-tab').forEach(btn => {
      const isSelected = btn.dataset.mode === newMode;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', String(isSelected));
    });
  }

  if (collisionModeControls) collisionModeControls.classList.toggle('hidden', newMode !== 'collision');
  if (reactorModeControls) reactorModeControls.classList.toggle('hidden', newMode !== 'reactor');

  if (newMode === 'collision') {
    if (appSubtitle) {
      appSubtitle.innerHTML = 'Física do Sol na Terra &bull; Barreira de Coulomb vs. Força Nuclear Forte';
    }
    rightTitle1.textContent = 'Equação da Fusão Nuclear';
    rightTitle2.textContent = 'Barreira de Coulomb vs. Força Forte';
    rightTitle3.textContent = 'Balanço Térmico e Nuclear';
    rightTitle4.textContent = 'Produtos e Partilha de Energia';
    metricLabel1.textContent = 'Temp. Atual / Mínima';
    metricLabel2.textContent = 'Energia Liberada (Q)';
    metricLabel3.textContent = 'Status da Barreira';
    metricLabel4.textContent = 'Conservação de Massa';

    const steps = reactionStepper.querySelectorAll('.step');
    const colLabels = [
      '1. Núcleos Separados',
      '2. Disparo Térmico',
      '3. Barreira de Coulomb',
      '4. Força Forte (União!)',
      '5. Hélio + Energia'
    ];
    steps.forEach((s, i) => {
      if (colLabels[i]) s.textContent = colLabels[i];
    });

    resetCollision();
  } else {
    if (appSubtitle) {
      appSubtitle.innerHTML = 'Confinamento Magnético (Tokamak / ITER) vs. Inercial a Laser (NIF) &bull; Fator Q';
    }
    initReactorMode();
  }
}

// ============================================================================
// UI EVENT LISTENERS
// ============================================================================

if (modeTabs) {
  modeTabs.addEventListener('click', e => {
    const tab = e.target.closest('.mode-tab');
    if (!tab || tab.disabled) return;
    switchMode(tab.dataset.mode);
  });
}

function setPlasmaTemp(rawVal) {
  const val = Math.max(10, Math.min(160, Math.round(Number(rawVal) || 150)));
  state.plasmaTempMC = val;
  if (tempSlider) tempSlider.value = String(val);
  if (tempInput) tempInput.value = String(val);
  if (tempPresetChips) {
    tempPresetChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.temp) === val);
    });
  }
  if (state.phase === 'idle') {
    updateIdleTelemetry();
  }
}

fuelSelector.addEventListener('click', e => {
  const card = e.target.closest('.fuel-card');
  if (!card) return;
  fuelSelector.querySelectorAll('.fuel-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');

  state.selectedFuelKey = card.dataset.fuel;
  populatePathways();
  if (state.mode === 'reactor') {
    initReactorMode();
  } else {
    resetCollision();
  }
});

pathwaySelect.addEventListener('change', e => {
  state.selectedPathwayIndex = e.target.value;
  state.activePathway = chooseActivePathway();
  if (state.phase === 'idle') {
    updateIdleTelemetry();
  }
});

if (tempSlider) {
  tempSlider.addEventListener('input', e => {
    setPlasmaTemp(e.target.value);
  });
}

if (tempInput) {
  tempInput.addEventListener('change', e => {
    setPlasmaTemp(e.target.value);
  });
  tempInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') setPlasmaTemp(e.target.value);
  });
}

if (tempPresetChips) {
  tempPresetChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    setPlasmaTemp(btn.dataset.temp);
  });
}

const aimPresetChips = document.getElementById('aimPresetChips');
const speedPresetChips = document.getElementById('speedPresetChips');
const laserSymPresetChips = document.getElementById('laserSymPresetChips');

function setAimAngle(rawVal) {
  const val = Math.max(-35, Math.min(35, Math.round(Number(rawVal) || 0)));
  state.aimAngleDeg = val;
  if (aimSlider) aimSlider.value = String(val);
  if (aimValueLabel) {
    aimValueLabel.textContent = val === 0 ? 'Frontal (0°)' : `${val > 0 ? '+' : ''}${val}°`;
  }
  if (aimPresetChips) {
    aimPresetChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.aim) === val);
    });
  }
  if (state.phase === 'idle') {
    updateIdleTelemetry();
  }
}

if (aimSlider) {
  aimSlider.addEventListener('input', e => setAimAngle(e.target.value));
}
if (aimPresetChips) {
  aimPresetChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (btn) setAimAngle(btn.dataset.aim);
  });
}

function setSimSpeed(rawVal) {
  const val = Math.max(0.25, Math.min(1.5, Number(rawVal) || 1.0));
  state.simSpeed = val;
  if (speedSlider) speedSlider.value = String(val);
  if (speedValueLabel) {
    speedValueLabel.textContent = val === 1 ? '1.0x (Normal)' : `${val.toFixed(2)}x`;
  }
  if (speedPresetChips) {
    speedPresetChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.classList.toggle('active', Math.abs(Number(btn.dataset.speed) - val) < 0.01);
    });
  }
}

if (speedSlider) {
  speedSlider.addEventListener('input', e => setSimSpeed(e.target.value));
}
if (speedPresetChips) {
  speedPresetChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (btn) setSimSpeed(btn.dataset.speed);
  });
}

// Mode 2 Listeners
if (reactorTechToggle) {
  reactorTechToggle.addEventListener('click', e => {
    const btn = e.target.closest('.tech-btn');
    if (!btn) return;
    state.reactor.tech = btn.dataset.tech;
    initReactorMode();
  });
}

function setMagField(rawVal) {
  const val = Math.max(0, Math.min(15, Number(rawVal) || 0));
  state.reactor.magFieldTesla = val;
  state.reactor.quenched = val < 3.0;
  if (magFieldSlider) magFieldSlider.value = String(val);
  if (magFieldLabel) {
    magFieldLabel.textContent =
      val === 0 ? '0.0 T (Falha!)' : val === 13 ? '13.0 T (ITER)' : `${val.toFixed(1)} T`;
  }
  if (magPresetChips) {
    magPresetChips.querySelectorAll('.chip-btn').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.mag) === val);
    });
  }
  updateReactorUIControls();
  updateReactorTelemetry();
}

if (magFieldSlider) {
  magFieldSlider.addEventListener('input', e => setMagField(e.target.value));
}
if (magPresetChips) {
  magPresetChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (btn) setMagField(btn.dataset.mag);
  });
}

function setHeatingPower(rawVal) {
  const val = Math.max(10, Math.min(70, Number(rawVal) || 50));
  state.reactor.heatingPowerMW = val;
  if (heatingPowerSlider) heatingPowerSlider.value = String(val);
  if (heatingPowerLabel) heatingPowerLabel.textContent = `${val} MW`;
  if (heatPresetChips) {
    heatPresetChips.querySelectorAll('.chip-btn').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.heat) === val);
    });
  }
  updateReactorTelemetry();
}

if (heatingPowerSlider) {
  heatingPowerSlider.addEventListener('input', e => setHeatingPower(e.target.value));
}
if (heatPresetChips) {
  heatPresetChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (btn) setHeatingPower(btn.dataset.heat);
  });
}

if (lithiumToggleBtn) {
  lithiumToggleBtn.addEventListener('click', () => {
    state.reactor.lithiumBlanketOn = !state.reactor.lithiumBlanketOn;
    lithiumToggleBtn.classList.toggle('active', state.reactor.lithiumBlanketOn);
    lithiumToggleBtn.textContent = state.reactor.lithiumBlanketOn
      ? '🧱 Ativada (Gera ³H)'
      : '🧱 Desativada';
    updateReactorUIControls();
    updateReactorTelemetry();
  });
}

function setLaserEnergy(rawVal) {
  const val = Math.max(0.5, Math.min(2.5, Number(rawVal) || 2.05));
  state.reactor.laserEnergyMJ = val;
  if (laserEnergySlider) laserEnergySlider.value = String(val);
  if (laserEnergyLabel) {
    laserEnergyLabel.textContent = Math.abs(val - 2.05) < 0.01 ? '2.05 MJ (NIF)' : `${val.toFixed(2)} MJ`;
  }
  if (laserPresetChips) {
    laserPresetChips.querySelectorAll('.chip-btn').forEach(b => {
      b.classList.toggle('active', Math.abs(Number(b.dataset.laser) - val) < 0.01);
    });
  }
  updateReactorTelemetry();
}

if (laserEnergySlider) {
  laserEnergySlider.addEventListener('input', e => setLaserEnergy(e.target.value));
}
if (laserPresetChips) {
  laserPresetChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (btn) setLaserEnergy(btn.dataset.laser);
  });
}

function setLaserSymmetry(rawVal) {
  const val = Math.max(50, Math.min(100, Math.round(Number(rawVal) || 100)));
  state.reactor.laserSymmetryPct = val;
  if (laserSymSlider) laserSymSlider.value = String(val);
  if (laserSymLabel) {
    laserSymLabel.textContent = val === 100 ? '100% (Esférica)' : `${val}%`;
  }
  if (laserSymPresetChips) {
    laserSymPresetChips.querySelectorAll('.chip-btn').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.sym) === val);
    });
  }
  updateReactorTelemetry();
}

if (laserSymSlider) {
  laserSymSlider.addEventListener('input', e => setLaserSymmetry(e.target.value));
}
if (laserSymPresetChips) {
  laserSymPresetChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (btn) setLaserSymmetry(btn.dataset.sym);
  });
}

if (reactorActionBtn) {
  reactorActionBtn.addEventListener('click', () => {
    if (state.reactor.tech === 'tokamak') {
      if (state.reactor.quenched) {
        setMagField(13);
      } else {
        setMagField(0);
      }
    } else {
      triggerLaserShot();
    }
  });
}

if (reactorPauseBtn) {
  reactorPauseBtn.addEventListener('click', () => togglePause());
}

if (reactorResetBtn) {
  reactorResetBtn.addEventListener('click', () => {
    if (state.reactor.tech === 'tokamak') {
      setMagField(13);
      setHeatingPower(50);
    } else {
      setLaserEnergy(2.05);
      setLaserSymmetry(100);
    }
    initReactorMode();
  });
}

canvas.addEventListener('click', e => {
  if (state.mode === 'reactor') {
    if (state.reactor.tech === 'laser') {
      triggerLaserShot();
    }
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const clickY = (e.clientY - rect.top - STAGE.offsetY) / STAGE.scale;
  const dy = clickY - STAGE.gunY;
  const approxAngle = Math.max(-35, Math.min(35, Math.round(dy / 3.6)));
  setAimAngle(approxAngle);

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
  resetCollision();
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

// Initialize
resizeCanvas();
populatePathways();
resetCollision();

const initParams = new URLSearchParams(window.location.search);
const requestedTech = initParams.get('tech');
if (requestedTech === 'tokamak' || requestedTech === 'laser') {
  state.reactor.tech = requestedTech;
}
const requestedMode = initParams.get('mode');
if (requestedMode === 'reactor' || requestedMode === 'collision') {
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
