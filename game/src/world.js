// The simulation: one firefly-drone, falling stars to catch, glare orbs to
// dodge, moon shards for a shield — and a night that slowly turns to dawn.
// Pure state in, events out; rendering lives in render.js.
import {
  COMBO_BONUS,
  FIELD,
  GLARE,
  LEVELS_TO_DAWN,
  LEVEL_SECONDS,
  LIVES,
  PLAYER,
  POOL_SIZE,
  SHARD,
  STAR,
} from './config.js';

export const EVENT_CATCH = 'catch';
export const EVENT_HIT = 'hit';
export const EVENT_SHIELD_HIT = 'shield-hit';
export const EVENT_SHARD = 'shard';
export const EVENT_LEVEL = 'level';
export const EVENT_DAWN = 'dawn';
export const EVENT_OVER = 'over';
export const EVENT_MISS = 'miss';

function makePool(kind, size) {
  const items = [];
  for (let i = 0; i < size; i += 1) items.push({ kind, active: false });
  return items;
}

export function createWorld(random) {
  const state = {
    time: 0,
    level: 1,
    levelTime: 0,
    score: 0,
    best: 0,
    combo: 0,
    bestCombo: 0,
    lives: LIVES,
    caught: 0,
    missed: 0,
    over: false,
    won: false,
    shake: 0,
    flash: 0,
    player: {
      x: FIELD.width / 2,
      y: FIELD.height - 150,
      vx: 0,
      vy: 0,
      invulnerable: 0,
      shield: 0,
      wing: 0,
      trail: 0,
    },
    stars: makePool('star', POOL_SIZE),
    glares: makePool('glare', POOL_SIZE),
    shards: makePool('shard', 8),
    particles: makePool('particle', 96),
    texts: makePool('text', 24),
    starTimer: 0.6,
    glareTimer: 1.4,
    shardTimer: SHARD.interval,
    // The background sky: seeded twinkles and two hill ridges.
    sky: [],
    events: [],
  };

  for (let i = 0; i < 130; i += 1) {
    state.sky.push({
      x: random.range(0, FIELD.width),
      y: random.range(0, 430),
      r: random.range(0.6, 2.1),
      phase: random.range(0, Math.PI * 2),
      speed: random.range(0.6, 2.4),
    });
  }

  function spawn(list, make) {
    for (const item of list) {
      if (item.active) continue;
      make(item);
      item.active = true;
      return item;
    }
    return null;
  }

  function burst(x, y, colour, count, speed) {
    let made = 0;
    for (const p of state.particles) {
      if (made >= count) break;
      if (p.active) continue;
      const angle = random.range(0, Math.PI * 2);
      const v = random.range(speed * 0.3, speed);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * v;
      p.vy = Math.sin(angle) * v - 40;
      p.life = random.range(0.35, 0.8);
      p.maxLife = p.life;
      p.size = random.range(2, 5);
      p.colour = colour;
      made += 1;
    }
  }

  function floatText(x, y, text, colour) {
    for (const t of state.texts) {
      if (t.active) continue;
      t.active = true;
      t.x = x;
      t.y = y;
      t.text = text;
      t.colour = colour;
      t.life = 0.9;
      return;
    }
  }

  function spawnStar() {
    const level = state.level;
    spawn(state.stars, (s) => {
      s.x = random.range(40, FIELD.width - 40);
      s.y = -20;
      s.vy = STAR.speed + STAR.speedPerLevel * (level - 1) + random.range(-15, 55);
      s.swayPhase = random.range(0, Math.PI * 2);
      s.swaySpeed = random.range(0.8, 1.8);
      s.rot = random.range(0, Math.PI * 2);
      s.rotSpeed = random.range(-1.2, 1.2);
    });
  }

  function spawnGlare() {
    const level = state.level;
    spawn(state.glares, (g) => {
      g.x = random.range(50, FIELD.width - 50);
      g.y = -24;
      g.vy = GLARE.speed + GLARE.speedPerLevel * (level - 1) + random.range(-10, 60);
      g.vx = random.range(-30, 30);
      g.pulse = random.range(0, Math.PI * 2);
    });
  }

  function spawnShard() {
    spawn(state.shards, (s) => {
      s.x = random.range(60, FIELD.width - 60);
      s.y = -20;
      s.vy = SHARD.speed;
      s.phase = random.range(0, Math.PI * 2);
    });
  }

  function resetRun() {
    state.time = 0;
    state.level = 1;
    state.levelTime = 0;
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.lives = LIVES;
    state.caught = 0;
    state.missed = 0;
    state.over = false;
    state.won = false;
    state.shake = 0;
    state.flash = 0;
    state.player.x = FIELD.width / 2;
    state.player.y = FIELD.height - 150;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.invulnerable = 0;
    state.player.shield = 0;
    for (const list of [state.stars, state.glares, state.shards, state.particles, state.texts]) {
      for (const item of list) item.active = false;
    }
    state.starTimer = 0.5;
    state.glareTimer = 1.2;
    state.shardTimer = SHARD.interval;
  }

  function hitPlayer() {
    const p = state.player;
    if (p.invulnerable > 0) return;
    if (p.shield > 0) {
      p.shield = 0;
      p.invulnerable = PLAYER.invulnerable;
      state.shake = 7;
      state.events.push({ type: EVENT_SHIELD_HIT });
      burst(p.x, p.y, '#7fe7ff', 18, 260);
      return;
    }
    state.lives -= 1;
    state.combo = 0;
    p.invulnerable = PLAYER.invulnerable;
    state.shake = 13;
    state.flash = 0.55;
    state.events.push({ type: EVENT_HIT });
    burst(p.x, p.y, '#ff5d8f', 26, 320);
    if (state.lives <= 0) {
      state.over = true;
      state.events.push({ type: EVENT_OVER });
    }
  }

  function catchStar(s) {
    s.active = false;
    state.caught += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const gained = STAR.points + COMBO_BONUS * (state.combo - 1);
    state.score += gained;
    state.events.push({ type: EVENT_CATCH, combo: state.combo });
    burst(s.x, s.y, '#ffd94d', 14, 220);
    floatText(s.x, s.y - 14, `+${gained}`, state.combo >= 5 ? '#ffe9a8' : '#ffd94d');
    if (state.combo > 0 && state.combo % 10 === 0) {
      floatText(state.player.x, state.player.y - 44, `${state.combo} IN A ROW!`, '#fff6c8');
    }
  }

  function update(dt, steer, pointer) {
    state.time += dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 1.6);

    // Night deepens into dawn: 0 at level 1, 1 when the last level ends.
    const progress = Math.min(
      1,
      ((state.level - 1) * LEVEL_SECONDS + state.levelTime) / (LEVELS_TO_DAWN * LEVEL_SECONDS),
    );
    state.dawn = progress;

    if (!state.over && !state.won) {
      state.levelTime += dt;
      if (state.levelTime >= LEVEL_SECONDS) {
        state.levelTime -= LEVEL_SECONDS;
        if (state.level >= LEVELS_TO_DAWN) {
          state.won = true;
          state.events.push({ type: EVENT_DAWN });
          burst(state.player.x, state.player.y - 20, '#ffd94d', 40, 340);
        } else {
          state.level += 1;
          state.events.push({ type: EVENT_LEVEL, level: state.level });
        }
      }
    }

    const p = state.player;
    p.wing += dt * (steer.x !== 0 || steer.y !== 0 || pointer.down ? 34 : 20);
    p.trail -= dt;
    if (p.invulnerable > 0) p.invulnerable -= dt;
    if (p.shield > 0) p.shield -= dt;

    // Steering: keys set a velocity; the pointer is a target to chase.
    let tx = 0;
    let ty = 0;
    if (steer.x !== 0 || steer.y !== 0) {
      const len = Math.hypot(steer.x, steer.y) || 1;
      tx = (steer.x / len) * PLAYER.speed;
      ty = (steer.y / len) * PLAYER.speed;
      pointer.active = false;
    } else if (pointer.active && pointer.x !== null) {
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        const sp = Math.min(PLAYER.speed * 1.15, dist * 6);
        tx = (dx / dist) * sp;
        ty = (dy / dist) * sp;
      }
    }
    const k = Math.min(1, PLAYER.accel * dt);
    p.vx += (tx - p.vx) * k;
    p.vy += (ty - p.vy) * k;
    p.x = Math.max(24, Math.min(FIELD.width - 24, p.x + p.vx * dt));
    p.y = Math.max(90, Math.min(FIELD.groundY - 30, p.y + p.vy * dt));
    if (Math.hypot(p.vx, p.vy) > 60 && p.trail <= 0) {
      p.trail = 0.03;
      burst(p.x, p.y + 10, '#ffb347', 1, 30);
    }

    if (!state.over && !state.won) {
      state.starTimer -= dt;
      state.glareTimer -= dt;
      state.shardTimer -= dt;
      const starInterval = Math.max(
        STAR.minInterval,
        STAR.interval * Math.pow(STAR.intervalScale, state.level - 1),
      );
      if (state.starTimer <= 0) {
        spawnStar();
        state.starTimer = starInterval * random.range(0.75, 1.25);
      }
      const glareInterval = Math.max(
        GLARE.minInterval,
        GLARE.interval * Math.pow(GLARE.intervalScale, state.level - 1),
      );
      if (state.glareTimer <= 0) {
        spawnGlare();
        state.glareTimer = glareInterval * random.range(0.8, 1.3);
      }
      if (state.shardTimer <= 0) {
        spawnShard();
        state.shardTimer = SHARD.interval + random.range(-SHARD.intervalJitter, SHARD.intervalJitter);
      }
    }

    for (const s of state.stars) {
      if (!s.active) continue;
      s.y += s.vy * dt;
      s.swayPhase += s.swaySpeed * dt;
      s.rot += s.rotSpeed * dt;
      s.x += Math.sin(s.swayPhase) * STAR.sway * dt;
      const dx = s.x - p.x;
      const dy = s.y - p.y;
      if (Math.hypot(dx, dy) < PLAYER.radius + STAR.radius && !state.over && !state.won) {
        catchStar(s);
        continue;
      }
      if (s.y > FIELD.groundY + 20) {
        s.active = false;
        if (!state.over && !state.won) {
          state.missed += 1;
          if (state.combo >= 3) floatText(s.x, FIELD.groundY - 30, 'combo lost', '#9aa3c7');
          state.combo = 0;
          state.events.push({ type: EVENT_MISS });
        }
      }
    }

    for (const g of state.glares) {
      if (!g.active) continue;
      g.y += g.vy * dt;
      g.x += g.vx * dt;
      g.pulse += dt * 5;
      if (g.x < 30 || g.x > FIELD.width - 30) g.vx *= -1;
      const dx = g.x - p.x;
      const dy = g.y - p.y;
      if (Math.hypot(dx, dy) < PLAYER.radius + GLARE.radius - 4 && !state.over && !state.won) {
        g.active = false;
        hitPlayer();
        continue;
      }
      if (g.y > FIELD.groundY + 24) g.active = false;
    }

    for (const s of state.shards) {
      if (!s.active) continue;
      s.y += s.vy * dt;
      s.phase += dt * 2.4;
      s.x += Math.sin(s.phase) * 22 * dt;
      const dx = s.x - p.x;
      const dy = s.y - p.y;
      if (Math.hypot(dx, dy) < PLAYER.radius + SHARD.radius && !state.over && !state.won) {
        s.active = false;
        p.shield = PLAYER.shieldSeconds;
        state.events.push({ type: EVENT_SHARD });
        burst(s.x, s.y, '#7fe7ff', 20, 260);
        floatText(s.x, s.y - 16, 'SHIELD!', '#7fe7ff');
        continue;
      }
      if (s.y > FIELD.groundY + 20) s.active = false;
    }

    for (const pt of state.particles) {
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.active = false;
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 160 * dt;
    }

    for (const t of state.texts) {
      if (!t.active) continue;
      t.life -= dt;
      t.y -= 34 * dt;
      if (t.life <= 0) t.active = false;
    }
  }

  return {
    state,
    update,
    reset: resetRun,
    drainEvents() {
      return state.events.splice(0, state.events.length);
    },
  };
}
