// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between five screens:
// title, play, paused, win and game over.
//
// ?seed=N fixes the falling pattern. ?shot=start|play|win|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CATCH, EVENT_DAWN, EVENT_HIT, EVENT_LEVEL, EVENT_OVER, EVENT_SHARD, EVENT_SHIELD_HIT } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit.
  }
}

function announce(text) {
  status.textContent = text;
}

function runShot(name) {
  const scene = stageShot(name, world);
  world.state.best = scene.best;
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  world.state.best = best;
  let accumulator = 0;
  let last = performance.now();

  function handleEvents() {
    for (const event of world.drainEvents()) {
      if (event.type === EVENT_CATCH) {
        audio.catchStar(event.combo);
        if (world.state.score > best) {
          best = world.state.score;
          world.state.best = best;
          saveBest(best);
        }
      } else if (event.type === EVENT_HIT) {
        audio.hit();
        announce(`Ouch — glare! ${world.state.lives} ${world.state.lives === 1 ? 'life' : 'lives'} left.`);
      } else if (event.type === EVENT_SHIELD_HIT) {
        audio.shieldBreak();
        announce('Your shield took the hit!');
      } else if (event.type === EVENT_SHARD) {
        audio.shard();
        announce('Moon shard! Shield up for 8 seconds.');
      } else if (event.type === EVENT_LEVEL) {
        audio.levelUp();
        announce(`Night ${event.level} — the sky gets busier.`);
      } else if (event.type === EVENT_DAWN) {
        audio.dawn();
        screen = SCREEN_WIN;
        announce(`Dawn breaks! Final score ${world.state.score}.`);
      } else if (event.type === EVENT_OVER) {
        audio.gameOver();
        screen = SCREEN_OVER;
        announce(`Game over. Score ${world.state.score}, best ${Math.max(best, world.state.score)}.`);
      }
    }
  }

  function startRun() {
    audio.unlock();
    world.reset();
    world.state.best = best;
    screen = SCREEN_PLAY;
    announce('Flying! Catch stars, dodge the pink glare.');
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;

    if (input.consume(ACTION_MUTE)) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }

    if (screen === SCREEN_TITLE) {
      world.state.time += elapsed;
      if (input.consume(ACTION_CONFIRM) || input.consumeTap()) startRun();
    } else if (screen === SCREEN_PLAY) {
      if (input.consume(ACTION_PAUSE)) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else {
        accumulator += elapsed;
        while (accumulator >= STEP) {
          world.update(STEP, input.steer(), input.pointer);
          accumulator -= STEP;
        }
        handleEvents();
      }
    } else if (screen === SCREEN_PAUSED) {
      if (input.consume(ACTION_PAUSE) || input.consume(ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Back to flying.');
      }
    } else if (screen === SCREEN_OVER || screen === SCREEN_WIN) {
      world.state.time += elapsed;
      if (input.consume(ACTION_RESTART) || input.consume(ACTION_CONFIRM) || input.consumeTap()) {
        startRun();
      }
    }

    renderer.draw(world.state, screen);
  }

  announce('Starkeeper. Press Enter or click to fly.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
