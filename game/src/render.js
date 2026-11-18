// Canvas painting for Starkeeper: a night sky that warms into dawn, karst
// hills with a little observatory dome, and a glowing firefly-drone.
// Everything is drawn from state; the loop never draws anything else.
import { FIELD, GLARE, LEVELS_TO_DAWN, PALETTE, SHARD, STAR } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `rgb(${Math.round(lerp(ca[0], cb[0], t))}, ${Math.round(lerp(ca[1], cb[1], t))}, ${Math.round(
    lerp(ca[2], cb[2], t),
  )})`;
}

function skyColour(list, dawn) {
  const scaled = dawn * (list.length - 1);
  const i = Math.min(list.length - 2, Math.floor(scaled));
  return mixHex(list[i], list[i + 1], scaled - i);
}

function drawStarShape(ctx, x, y, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = rot + (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawCrescent(ctx, x, y, r, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(phase) * 0.2);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0.6, Math.PI * 2 - 0.4);
  ctx.arc(r * 0.45, -r * 0.25, r * 0.82, Math.PI * 0.9, Math.PI * 2.35, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let view = { scale: 1, ox: 0, oy: 0 };

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || FIELD.width;
    const h = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const scale = Math.min(w / FIELD.width, h / FIELD.height);
    view = { scale: scale * dpr, ox: (w * dpr - FIELD.width * scale * dpr) / 2, oy: (h * dpr - FIELD.height * scale * dpr) / 2 };
  }

  window.addEventListener('resize', resize);
  resize();

  function drawBackground(state) {
    const dawn = state.dawn ?? 0;
    const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    sky.addColorStop(0, skyColour(PALETTE.skyTop, dawn));
    sky.addColorStop(0.62, skyColour(PALETTE.skyBottom, dawn));
    sky.addColorStop(1, mixHex(PALETTE.ground, '#7a4a3a', dawn * 0.7));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    // The moon, high and small; it sinks as dawn comes.
    const moonY = lerp(96, 200, dawn);
    const moonX = FIELD.width - 170;
    ctx.save();
    ctx.globalAlpha = lerp(0.95, 0.35, dawn);
    const glow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 70);
    glow.addColorStop(0, 'rgba(255, 244, 200, 0.55)');
    glow.addColorStop(1, 'rgba(255, 244, 200, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(moonX - 70, moonY - 70, 140, 140);
    ctx.fillStyle = '#f7efc9';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(210, 198, 160, 0.7)';
    ctx.beginPath();
    ctx.arc(moonX - 9, moonY - 6, 6, 0, Math.PI * 2);
    ctx.arc(moonX + 10, moonY + 9, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Twinkling background stars fade out as the sky brightens.
    ctx.save();
    ctx.globalAlpha = lerp(1, 0.12, dawn);
    for (const s of state.sky) {
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(state.time * s.speed + s.phase));
      ctx.globalAlpha = lerp(1, 0.12, dawn) * tw;
      ctx.fillStyle = '#e8ecff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Two ridges of karst hills, and the little observatory on the far one.
    ctx.fillStyle = PALETTE.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    ctx.quadraticCurveTo(180, 520, 360, 585);
    ctx.quadraticCurveTo(560, 640, 760, 575);
    ctx.quadraticCurveTo(980, 520, 1120, 590);
    ctx.quadraticCurveTo(1210, 625, FIELD.width, 600);
    ctx.lineTo(FIELD.width, FIELD.groundY);
    ctx.closePath();
    ctx.fill();

    // Observatory dome on the far ridge.
    const domeX = 990;
    const domeY = 588;
    ctx.fillStyle = PALETTE.dome;
    ctx.fillRect(domeX - 26, domeY - 8, 52, 14);
    ctx.beginPath();
    ctx.arc(domeX, domeY - 8, 26, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.domeLight;
    ctx.fillRect(domeX - 4, domeY - 22, 8, 10);
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(state.time * 1.5);
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath();
    ctx.arc(domeX, domeY - 17, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = PALETTE.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    ctx.quadraticCurveTo(240, 610, 480, 636);
    ctx.quadraticCurveTo(820, 668, 1040, 632);
    ctx.quadraticCurveTo(1180, 612, FIELD.width, 640);
    ctx.lineTo(FIELD.width, FIELD.height);
    ctx.lineTo(0, FIELD.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    // Fireflies resting in the grass.
    ctx.save();
    for (let i = 0; i < 14; i += 1) {
      const gx = ((i * 173) % FIELD.width) + 20;
      const gy = FIELD.groundY + 14 + ((i * 37) % 52);
      ctx.globalAlpha = 0.25 + 0.45 * Math.abs(Math.sin(state.time * 1.1 + i * 1.7));
      ctx.fillStyle = '#cfe89a';
      ctx.beginPath();
      ctx.arc(gx, gy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEntities(state) {
    for (const s of state.stars) {
      if (!s.active) continue;
      ctx.save();
      ctx.translate(s.x, s.y);
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, STAR.radius * 2.4);
      glow.addColorStop(0, 'rgba(255, 217, 77, 0.5)');
      glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-STAR.radius * 2.4, -STAR.radius * 2.4, STAR.radius * 4.8, STAR.radius * 4.8);
      ctx.fillStyle = PALETTE.star;
      drawStarShape(ctx, 0, 0, STAR.radius, s.rot);
      ctx.fill();
      ctx.fillStyle = PALETTE.starCore;
      drawStarShape(ctx, 0, 0, STAR.radius * 0.5, s.rot);
      ctx.fill();
      ctx.restore();
    }

    for (const g of state.glares) {
      if (!g.active) continue;
      const pulse = 1 + 0.16 * Math.sin(g.pulse);
      ctx.save();
      ctx.translate(g.x, g.y);
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, GLARE.radius * 2.6);
      glow.addColorStop(0, 'rgba(255, 93, 143, 0.55)');
      glow.addColorStop(1, 'rgba(255, 93, 143, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-GLARE.radius * 2.6, -GLARE.radius * 2.6, GLARE.radius * 5.2, GLARE.radius * 5.2);
      ctx.fillStyle = PALETTE.glare;
      ctx.beginPath();
      ctx.arc(0, 0, GLARE.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.glareCore;
      ctx.beginPath();
      ctx.arc(0, 0, GLARE.radius * 0.45 * pulse, 0, Math.PI * 2);
      ctx.fill();
      // Harsh spikes: this is city glare, not starlight.
      ctx.strokeStyle = 'rgba(255, 93, 143, 0.85)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        const a = (i * Math.PI) / 2 + g.pulse * 0.2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * GLARE.radius * 1.1, Math.sin(a) * GLARE.radius * 1.1);
        ctx.lineTo(Math.cos(a) * GLARE.radius * 1.55, Math.sin(a) * GLARE.radius * 1.55);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const s of state.shards) {
      if (!s.active) continue;
      ctx.save();
      ctx.translate(s.x, s.y);
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, SHARD.radius * 2.4);
      glow.addColorStop(0, 'rgba(127, 231, 255, 0.5)');
      glow.addColorStop(1, 'rgba(127, 231, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-SHARD.radius * 2.4, -SHARD.radius * 2.4, SHARD.radius * 4.8, SHARD.radius * 4.8);
      ctx.fillStyle = PALETTE.shard;
      drawCrescent(ctx, 0, 0, SHARD.radius, s.phase);
      ctx.restore();
    }

    for (const pt of state.particles) {
      if (!pt.active) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.colour;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPlayer(state) {
    const p = state.player;
    const blink = p.invulnerable > 0 && Math.floor(state.time * 14) % 2 === 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (!blink) {
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 64);
      glow.addColorStop(0, 'rgba(255, 179, 71, 0.5)');
      glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-64, -64, 128, 128);

      // Wings, flapping.
      const flap = Math.sin(p.wing) * 0.5;
      ctx.fillStyle = 'rgba(220, 235, 255, 0.75)';
      ctx.save();
      ctx.rotate(-0.5 - flap * 0.4);
      ctx.beginPath();
      ctx.ellipse(-12, -14, 13, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.rotate(0.5 + flap * 0.4);
      ctx.beginPath();
      ctx.ellipse(12, -14, 13, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Body: a little firefly drone.
      ctx.fillStyle = '#3a2f18';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.player;
      ctx.beginPath();
      ctx.ellipse(0, 7, 11, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a2113';
      ctx.beginPath();
      ctx.arc(-5, -4, 2.4, 0, Math.PI * 2);
      ctx.arc(5, -4, 2.4, 0, Math.PI * 2);
      ctx.fill();
      // Antennae.
      ctx.strokeStyle = '#3a2f18';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -16);
      ctx.quadraticCurveTo(-12, -26, -16, -28);
      ctx.moveTo(6, -16);
      ctx.quadraticCurveTo(12, -26, 16, -28);
      ctx.stroke();
    }
    if (p.shield > 0) {
      ctx.strokeStyle = `rgba(127, 231, 255, ${0.55 + 0.35 * Math.sin(state.time * 6)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 32 + 2 * Math.sin(state.time * 6), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTexts(state) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 20px ' + 'system-ui, sans-serif';
    for (const t of state.texts) {
      if (!t.active) continue;
      ctx.globalAlpha = Math.min(1, t.life / 0.4);
      ctx.fillStyle = t.colour;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  function drawHud(state, screen) {
    const dawn = state.dawn ?? 0;
    ctx.save();
    // Top-left: score and best.
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = '800 30px system-ui, sans-serif';
    ctx.fillText(String(state.score).padStart(4, '0'), 24, 46);
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`BEST ${Math.max(state.best, state.score)}`, 26, 68);
    if (state.combo >= 2) {
      ctx.fillStyle = '#ffe9a8';
      ctx.font = '800 18px system-ui, sans-serif';
      ctx.fillText(`COMBO x${state.combo}`, 26, 94);
    }

    // Top-right: lives as glowing dots.
    for (let i = 0; i < 3; i += 1) {
      const x = FIELD.width - 34 - i * 34;
      ctx.save();
      if (i < state.lives) {
        const glow = ctx.createRadialGradient(x, 32, 2, x, 32, 20);
        glow.addColorStop(0, 'rgba(255, 179, 71, 0.6)');
        glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 20, 12, 40, 40);
        ctx.fillStyle = '#ffb347';
      } else {
        ctx.fillStyle = 'rgba(154, 163, 199, 0.35)';
      }
      ctx.beginPath();
      ctx.arc(x, 32, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(state.player.shield > 0 ? `SHIELD ${Math.ceil(state.player.shield)}s` : '', FIELD.width - 24, 62);

    // Bottom: level and the road to dawn.
    const barW = 340;
    const barX = (FIELD.width - barW) / 2;
    const barY = FIELD.height - 26;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(
      state.won ? 'DAWN HAS BROKEN' : `NIGHT ${state.level} / ${LEVELS_TO_DAWN} — TO DAWN`,
      FIELD.width / 2,
      barY - 10,
    );
    ctx.fillStyle = 'rgba(154, 163, 199, 0.3)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * dawn, 8, 4);
    ctx.fill();
    ctx.restore();

    if (screen === SCREEN_PAUSED) {
      panel('PAUSED', 'Take a breath. P or Esc to keep flying — M mutes the music.');
    }
  }

  function panel(title, lines) {
    ctx.save();
    ctx.fillStyle = PALETTE.panel;
    ctx.beginPath();
    ctx.roundRect(FIELD.width / 2 - 330, 150, 660, 380, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 217, 77, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.fillText(title, FIELD.width / 2, 225);
    ctx.font = '400 18px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.muted;
    const list = Array.isArray(lines) ? lines : [lines];
    list.forEach((line, i) => ctx.fillText(line, FIELD.width / 2, 275 + i * 30));
    ctx.restore();
  }

  function drawTitle(state) {
    drawBackground(state);
    // A few demo stars drift across the title so it feels alive.
    drawEntities(state);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd94d';
    ctx.font = '800 84px system-ui, sans-serif';
    ctx.fillText('STARKEEPER', FIELD.width / 2, 218);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText('Penjaga Langit Gelap · a dark-sky game from Gunungkidul', FIELD.width / 2, 258);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '400 18px system-ui, sans-serif';
    ctx.fillText('Catch the falling stars. Dodge the city glare. Survive six nights —', FIELD.width / 2, 330);
    ctx.fillText('until dawn breaks over the hills.', FIELD.width / 2, 356);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText('Move: WASD / arrows / mouse · Pause: P · Mute: M', FIELD.width / 2, 420);
    ctx.fillStyle = '#ffd94d';
    ctx.font = '800 22px system-ui, sans-serif';
    const pulse = 0.65 + 0.35 * Math.sin(state.time * 3);
    ctx.globalAlpha = pulse;
    ctx.fillText('Press Enter or click to fly', FIELD.width / 2, 478);
    ctx.globalAlpha = 1;
    if (state.best > 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '600 16px system-ui, sans-serif';
      ctx.fillText(`Best score: ${state.best}`, FIELD.width / 2, 516);
    }
    ctx.restore();
  }

  function drawOver(state, won) {
    drawBackground(state);
    drawEntities(state);
    if (won) {
      panel('DAWN BREAKS', [
        'Six nights survived — the sky over Gunungkidul is dark again,',
        'and every star you caught is still up there.',
        '',
        `Score ${state.score} · best combo x${state.bestCombo} · ${state.caught} stars caught`,
        '',
        'Press R or Enter to fly another night.',
      ]);
    } else {
      panel('THE SKY WENT DARK', [
        'The glare got you — but the stars are still falling.',
        '',
        `Score ${state.score} · best ${Math.max(state.best, state.score)} · best combo x${state.bestCombo}`,
        `${state.caught} stars caught · ${state.missed} slipped away`,
        '',
        'Press R or Enter to try again.',
      ]);
    }
  }

  function draw(state, screen) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    if (screen === SCREEN_TITLE) {
      drawTitle(state);
      return;
    }
    if (screen === SCREEN_OVER) {
      drawOver(state, false);
      return;
    }
    if (screen === SCREEN_WIN) {
      drawOver(state, true);
      return;
    }
    drawBackground(state);
    drawEntities(state);
    drawPlayer(state);
    drawTexts(state);
    drawHud(state, screen);
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 93, 143, ${state.flash * 0.45})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
  }

  return { draw, resize };
}
