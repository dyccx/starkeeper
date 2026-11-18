// Keyboard + mouse + touch input, read once per frame by the loop.
// Arrow keys / WASD steer the drone; the mouse (or a finger) is a target the
// drone chases while the pointer is down or moving. Enter/Space confirms,
// P or Escape pauses, M mutes, R restarts from an end screen.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_RESTART = 'restart';

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  ' ': ACTION_CONFIRM,
  p: ACTION_PAUSE,
  P: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  m: ACTION_MUTE,
  M: ACTION_MUTE,
  r: ACTION_RESTART,
  R: ACTION_RESTART,
};

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const pointer = { x: null, y: null, down: false, active: false };

  function toLocal(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  function onKeyDown(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!event.repeat) {
      keys.add(event.key);
      const action = KEY_ACTIONS[event.key];
      if (action) pressed.add(action);
    }
  }

  function onKeyUp(event) {
    keys.delete(event.key);
  }

  function onPointerDown(event) {
    const at = toLocal(event);
    pointer.x = at.x;
    pointer.y = at.y;
    pointer.down = true;
    pointer.active = true;
    canvas.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!pointer.down) return;
    const at = toLocal(event);
    pointer.x = at.x;
    pointer.y = at.y;
  }

  function onPointerUp() {
    pointer.down = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  return {
    /** -1/0/1 steering on each axis from the held keys. */
    steer() {
      const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
      const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
      const up = keys.has('ArrowUp') || keys.has('w') || keys.has('W');
      const down = keys.has('ArrowDown') || keys.has('s') || keys.has('S');
      return { x: (right ? 1 : 0) - (left ? 1 : 0), y: (down ? 1 : 0) - (up ? 1 : 0) };
    },
    pointer,
    /** True once per physical press; the loop drains it every frame. */
    consume(action) {
      if (pressed.has(action)) {
        pressed.delete(action);
        return true;
      }
      return false;
    },
    /** A click / tap anywhere counts as a confirm, for touch players. */
    consumeTap() {
      if (pointer.down) {
        pointer.down = false;
        return true;
      }
      return false;
    },
  };
}
