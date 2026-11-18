// Staged scenes for screenshots: ?shot=start|play|win|end (with &seed=N).
// Each one arranges the world by hand, paints it twice, and the loop then
// sets window.__shotReady so a screenshot tool knows the frame is settled.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

function placeStar(world, x, y, vy) {
  for (const s of world.state.stars) {
    if (s.active) continue;
    s.active = true;
    s.x = x;
    s.y = y;
    s.vy = vy;
    s.swayPhase = 0.4;
    s.swaySpeed = 1.2;
    s.rot = 0.5;
    s.rotSpeed = 0.4;
    return;
  }
}

function placeGlare(world, x, y, vy) {
  for (const g of world.state.glares) {
    if (g.active) continue;
    g.active = true;
    g.x = x;
    g.y = y;
    g.vy = vy;
    g.vx = 12;
    g.pulse = 0.8;
    return;
  }
}

function placeShard(world, x, y) {
  for (const s of world.state.shards) {
    if (s.active) continue;
    s.active = true;
    s.x = x;
    s.y = y;
    s.vy = 120;
    s.phase = 0.6;
    return;
  }
}

function placeBurst(world, x, y, colour, count) {
  let made = 0;
  for (const p of world.state.particles) {
    if (made >= count) break;
    if (p.active) continue;
    const angle = (made / count) * Math.PI * 2;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * 160;
    p.vy = Math.sin(angle) * 160;
    p.life = 0.6;
    p.maxLife = 0.6;
    p.size = 3.5;
    p.colour = colour;
    made += 1;
  }
}

export function stageShot(name, world) {
  const s = world.state;
  world.reset();
  s.time = 4.2;
  s.best = 1840;
  if (name === 'start') {
    // A quiet title sky with a few stars already falling.
    placeStar(world, 300, 210, 150);
    placeStar(world, 620, 150, 150);
    placeStar(world, 940, 260, 150);
    placeStar(world, 1120, 130, 150);
    placeGlare(world, 820, 330, 185);
    return { screen: SCREEN_TITLE, best: s.best };
  }
  if (name === 'win') {
    s.won = true;
    s.score = 3420;
    s.caught = 96;
    s.bestCombo = 14;
    s.level = 6;
    s.dawn = 1;
    s.player.x = 640;
    s.player.y = 480;
    placeStar(world, 420, 200, 150);
    placeStar(world, 860, 170, 150);
    placeBurst(world, 640, 430, '#ffd94d', 26);
    return { screen: SCREEN_WIN, best: s.best };
  }
  if (name === 'end') {
    s.over = true;
    s.lives = 0;
    s.score = 1270;
    s.caught = 41;
    s.missed = 9;
    s.bestCombo = 7;
    s.level = 4;
    s.dawn = 0.52;
    s.player.x = 640;
    s.player.y = 470;
    s.player.invulnerable = 0;
    placeGlare(world, 640, 420, 185);
    placeStar(world, 380, 240, 150);
    placeStar(world, 900, 300, 150);
    placeBurst(world, 640, 470, '#ff5d8f', 20);
    return { screen: SCREEN_OVER, best: s.best };
  }
  // play: a busy mid-game moment on night 3, combo running, shield up.
  s.score = 1250;
  s.combo = 6;
  s.bestCombo = 9;
  s.caught = 38;
  s.level = 3;
  s.levelTime = 11;
  s.dawn = 0.35;
  s.player.x = 640;
  s.player.y = 470;
  s.player.shield = 5;
  placeStar(world, 520, 300, 170);
  placeStar(world, 700, 210, 170);
  placeStar(world, 790, 380, 170);
  placeStar(world, 430, 150, 170);
  placeStar(world, 980, 260, 170);
  placeStar(world, 240, 330, 170);
  placeGlare(world, 560, 180, 210);
  placeGlare(world, 880, 420, 210);
  placeGlare(world, 180, 220, 210);
  placeShard(world, 1020, 180);
  placeBurst(world, 640, 400, '#ffd94d', 12);
  return { screen: SCREEN_PLAY, best: s.best };
}
