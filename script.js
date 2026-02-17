document.addEventListener('DOMContentLoaded', function () {

  const canvas = document.getElementById('evoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const photo = new Image();
  photo.src = 'images/nohamcvphoto.png';
  let photoReady = false;
  photo.onload = function () { photoReady = true; };

  const stages = [
    { 
      period: 'Primaire',
      langs: [{ label: '🟠 Scratch', cls: 'scratch' }],
      quote: '\"Déplacer un sprite, c\'est déjà coder.\"',
      size: 0.30,
      color: '#ffa040',
      filter: { sepia: 0.8, brightness: 0.7,  saturate: 0.3 },
      img: 'images/stage-primaire.png'
    },
    { 
      period: 'Collège',
      langs: [{ label: '🐍 Python', cls: 'python' }],
      quote: '\"Les boucles, les fonctions, la logique.\"',
      size: 0.42,
      color: '#4d9de0',
      filter: { sepia: 0.5, brightness: 0.85, saturate: 0.6 },
      img: 'images/stage-college.png'
    },
    { 
      period: 'Lycée STI2D',
      langs: [{ label: '🐍 Python', cls: 'python' }, { label: '⚙️ C++', cls: 'cpp' }],
      quote: '\"La mémoire, le bas niveau, tout change.\"',
      size: 0.56,
      color: '#7eb8d4',
      filter: { sepia: 0.2, brightness: 0.95, saturate: 0.85 },
      img: 'images/stage-lycee.png'
    },
    { 
      period: 'BUT Informatique',
      langs: [{ label: '⚙️ C++', cls: 'cpp' }, { label: '☕ Java', cls: 'java' }],
      quote: '\"From scratch. Comprendre chaque couche.\"',
      size: 0.72,
      color: '#7eb8d4',
      filter: { sepia: 0, brightness: 1, saturate: 1 },
      img: 'images/nohamcvphoto.png'
    }
  ];

  const stagePositions = [0.08, 0.34, 0.61, 0.88];
  let posX = stagePositions[0];
  const speed = 0.0008;
  let currentStage = 0;
  let paused = true;
  let t = 0;
  let dpr = 1;

  const btn = document.createElement('button');
  btn.id = 'evo-btn';
  btn.textContent = 'Suivant →';
  document.querySelector('.evo-info-box').after(btn);

  btn.addEventListener('click', function () {
    if (currentStage < stages.length - 1) {
      paused = false;
      btn.disabled = true;
      btn.textContent = '...';
    }
  });

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function updateInfoBox(idx) {
    const box      = document.querySelector('.evo-info-box');
    const periodEl = document.querySelector('.evo-info-period');
    const langsEl  = document.querySelector('.evo-info-langs');
    const quoteEl  = document.querySelector('.evo-info-quote');
    if (!box || !periodEl || !langsEl || !quoteEl) return;

    box.style.opacity = '0';
    setTimeout(function () {
      const s = stages[idx];
      periodEl.textContent = s.period;
      langsEl.innerHTML = s.langs.map(function (l) {
        return '<span class="evo-lang ' + l.cls + '">' + l.label + '</span>';
      }).join('');
      quoteEl.textContent = s.quote;
      box.style.opacity = '1';

      if (idx < stages.length - 1) {
        btn.textContent = 'Suivant →';
        btn.disabled = false;
      } else {
        btn.textContent = '🎓 Arrivé !';
        btn.disabled = true;
      }
      loadStagePhoto(idx);
    }, 300);
  }

  function loadStagePhoto(idx) {
    const s = stages[idx];
    if (!s || !s.img) { photoReady = false; return; }
    photoReady = false;
    photo.onload = function () { photoReady = true; };
    photo.src = s.img;
  }

  function getScale() {
    for (let i = 0; i < stagePositions.length - 1; i++) {
      if (posX >= stagePositions[i] && posX < stagePositions[i + 1]) {
        const p = (posX - stagePositions[i]) / (stagePositions[i + 1] - stagePositions[i]);
        return stages[i].size + (stages[i + 1].size - stages[i].size) * p;
      }
    }
    return stages[stages.length - 1].size;
  }

  function getColor() {
    for (let i = 0; i < stagePositions.length - 1; i++) {
      if (posX >= stagePositions[i] && posX < stagePositions[i + 1]) return stages[i].color;
    }
    return stages[stages.length - 1].color;
  }

  function getCurrentFilter() {
    for (let i = 0; i < stagePositions.length - 1; i++) {
      if (posX >= stagePositions[i] && posX < stagePositions[i + 1]) {
        const p = (posX - stagePositions[i]) / (stagePositions[i + 1] - stagePositions[i]);
        const a = stages[i].filter;
        const b = stages[i + 1].filter;
        return {
          sepia:      a.sepia      + (b.sepia      - a.sepia)      * p,
          brightness: a.brightness + (b.brightness - a.brightness) * p,
          saturate:   a.saturate   + (b.saturate   - a.saturate)   * p
        };
      }
    }
    return stages[stages.length - 1].filter;
  }

  function drawHead(cx, cy, r, color, filterObj) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.stroke();
  }

  function drawLeg(hipX, hipY, thighAngle, shinAngle, thighLen, shinLen, footLen, lw, color) {
    const kneeX  = hipX + Math.sin(thighAngle) * thighLen;
    const kneeY  = hipY + Math.cos(thighAngle) * thighLen;
    const ankleX = kneeX + Math.sin(shinAngle) * shinLen;
    const ankleY = kneeY + Math.cos(shinAngle) * shinLen;
    const footX  = ankleX + footLen;
    const footY  = ankleY;

    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(hipX,   hipY);   ctx.lineTo(kneeX,  kneeY);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(kneeX,  kneeY);  ctx.lineTo(ankleX, ankleY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ankleX, ankleY); ctx.lineTo(footX,  footY);  ctx.stroke();
  }

  function drawArm(shoulderX, shoulderY, upperAngle, upperLen, lw, color) {
    const handX  = shoulderX + Math.sin(upperAngle) * upperLen;
    const handY  = shoulderY + Math.cos(upperAngle) * upperLen;

    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(handX, handY);
    ctx.stroke();
  }

  function drawStickman(W, H, scale, color, walkT, isWalking) {
    const groundY  = H * 0.82;
    const px       = posX * W;
    const u        = scale * H;

    const headR    = u * 0.14;
    const bodyH    = u * 0.22;
    const thighLen = u * 0.16;
    const shinLen  = u * 0.15;
    const footLen  = u * 0.08;
    const upperArm = u * 0.14;
    const foreArm  = u * 0.11;
    const lw       = Math.max(2, u * 0.03);

    const phase  = isWalking ? walkT * 5.5 : 0;

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    
    const maxThigh = 0.45;
    const thighL = clamp(Math.sin(phase) * maxThigh, -maxThigh, maxThigh);
    const thighR = clamp(-Math.sin(phase) * maxThigh, -maxThigh, maxThigh);
    
    const kneeBendMag = Math.abs(Math.sin(phase)) * 0.5;
    const shinL = clamp(thighL + (thighL > 0 ? -kneeBendMag : kneeBendMag), -1.0, 1.0);
    const shinR = clamp(thighR + (thighR > 0 ? -kneeBendMag : kneeBendMag), -1.0, 1.0);
    
    const pelvisY = Math.cos(phase) * u * 0.008;
    
    const hipYBase = groundY - thighLen - shinLen;
    const hipY = hipYBase + pelvisY;
    const hipX = px;
    
    const shoulderX = px + Math.sin(phase) * u * 0.008;
    const shoulderY = hipY - bodyH;
    
    const neckLen = Math.max(2, headR * 0.28);
    const headCY = shoulderY - neckLen - headR;
    
    const maxArm = 0.32;
    const armPhaseOffset = Math.PI / 4; // décalage pour alterner les bras
    const upperL = clamp(-Math.sin(phase + armPhaseOffset) * maxArm, -maxArm, maxArm);
    const upperR = clamp(Math.sin(phase + armPhaseOffset) * maxArm, -maxArm, maxArm);

    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    const shoulderWidth = u * 0.14;
    const hipWidth = u * 0.10;
    
    const lShoulderX = shoulderX - shoulderWidth / 2.2;
    const rShoulderX = shoulderX + shoulderWidth / 2.2;
    const shoulderAttachY = shoulderY;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * 1.2;
    ctx.beginPath();
    ctx.moveTo(shoulderX - shoulderWidth/2, shoulderY);
    ctx.lineTo(hipX - hipWidth/2, hipY);
    ctx.lineTo(hipX + hipWidth/2, hipY);
    ctx.lineTo(shoulderX + shoulderWidth/2, shoulderY);
    ctx.closePath();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(shoulderX - shoulderWidth/2, shoulderY);
    ctx.lineTo(shoulderX + shoulderWidth/2, shoulderY);
    ctx.lineWidth = lw * 1.5;
    ctx.stroke();

    // Draw legs first
    drawLeg(hipX, hipY, thighL, thighL + shinL, thighLen, shinLen, footLen, lw * 0.75, color);
    drawLeg(hipX, hipY, thighR, thighR + shinR, thighLen, shinLen, footLen, lw, color);

    // Draw head and body
    drawHead(shoulderX, headCY, headR, color, getCurrentFilter());

    // Draw both arms in front of body
    drawArm(lShoulderX, shoulderAttachY, upperL, upperArm + foreArm, lw * 0.75, color);
    drawArm(rShoulderX, shoulderAttachY, upperR, upperArm + foreArm, lw, color);
    
    const lHandX = lShoulderX + Math.sin(upperL) * (upperArm + foreArm);
    const lHandY = shoulderAttachY + Math.cos(upperL) * (upperArm + foreArm);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lHandX, lHandY, Math.max(1.5, u * 0.035), 0, Math.PI * 2);
    ctx.fill();
    
    const rHandX = rShoulderX + Math.sin(upperR) * (upperArm + foreArm);
    const rHandY = shoulderAttachY + Math.cos(upperR) * (upperArm + foreArm);
    ctx.beginPath();
    ctx.arc(rHandX, rHandY, Math.max(1.5, u * 0.035), 0, Math.PI * 2);
    ctx.fill();
    
    const lFootX = hipX + Math.sin(thighL) * thighLen + Math.sin(thighL + shinL) * shinLen;
    const lFootY = hipY + Math.cos(thighL) * thighLen + Math.cos(thighL + shinL) * shinLen;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * 1.1;
    ctx.beginPath();
    ctx.moveTo(lFootX, lFootY);
    ctx.lineTo(lFootX + Math.cos(thighL + shinL) * footLen, lFootY + Math.sin(thighL + shinL) * footLen);
    ctx.stroke();
    
    const rFootX = hipX + Math.sin(thighR) * thighLen + Math.sin(thighR + shinR) * shinLen;
    const rFootY = hipY + Math.cos(thighR) * thighLen + Math.cos(thighR + shinR) * shinLen;
    ctx.beginPath();
    ctx.moveTo(rFootX, rFootY);
    ctx.lineTo(rFootX + Math.cos(thighR + shinR) * footLen, rFootY + Math.sin(thighR + shinR) * footLen);
    ctx.stroke();
  }

  function drawGround(W, H) {
    const groundY = H * 0.82;

    ctx.strokeStyle = 'rgba(86,132,163,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    stagePositions.forEach(function (p, i) {
      const x = p * W;

      if (i < stagePositions.length - 1) {
        const x2 = stagePositions[i + 1] * W;
        let progress = 0;
        if (i < currentStage) progress = 1;
        else if (i === currentStage) progress = Math.min(1, (posX - p) / (stagePositions[i + 1] - p));
        if (progress > 0) {
          ctx.beginPath();
          ctx.moveTo(x, groundY);
          ctx.lineTo(x + (x2 - x) * progress, groundY);
          ctx.strokeStyle = stages[i].color;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      const reached = i <= currentStage;
      ctx.beginPath();
      ctx.arc(x, groundY, reached ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = reached ? stages[i].color : 'rgba(86,132,163,0.25)';
      ctx.fill();

      if (i === currentStage && paused) {
        ctx.beginPath();
        ctx.arc(x, groundY, 11 + Math.sin(t * 3) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = stages[i].color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = reached ? stages[i].color : 'rgba(138,154,181,0.35)';
      ctx.font = 'bold ' + Math.max(11, W * 0.012) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(['Primaire', 'Collège', 'Lycée', 'BUT'][i], x, groundY + 22);
    });
  }

  updateInfoBox(0);

  function loop() {
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);
    t += 0.016;

    if (!paused) {
      posX += speed;
      const nextIdx = currentStage + 1;
      if (nextIdx < stagePositions.length && posX >= stagePositions[nextIdx]) {
        posX = stagePositions[nextIdx];
        currentStage = nextIdx;
        paused = true;
        updateInfoBox(currentStage);
      }
    }

    drawGround(W, H);
    drawStickman(W, H, getScale(), getColor(), t, !paused);

    requestAnimationFrame(loop);
  }

  loop();
});
