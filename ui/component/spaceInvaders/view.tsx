import React from 'react';
import './style.scss';

type Entity = { x: number; y: number; alive: boolean; row: number };
type Bullet = { x: number; y: number };
type ShieldBlock = { x: number; y: number; hp: number; col: number };

const CANVAS_W = 560;
const CANVAS_H = 480;
const PLAYER_W = 30;
const INVADER_W = 22;
const INVADER_H = 16;
const INVADER_COLS = 11;
const INVADER_ROWS = 6;
const INVADER_GAP_X = 16;
const INVADER_GAP_Y = 16;
const BULLET_SPEED = 9;
const INVADER_BULLET_SPEED = 4;
const BASE_MOVE_INTERVAL = 500;
const SHIELD_BLOCK = 6;

type Props = {
  onClose: () => void;
};

export default function SpaceInvaders({ onClose }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const stateRef = React.useRef({
    player: { x: CANVAS_W / 2 - PLAYER_W / 2 },
    bullets: [] as Bullet[],
    enemyBullets: [] as Bullet[],
    invaders: [] as Entity[],
    shields: [] as ShieldBlock[],
    dx: 1,
    moveTimer: 0,
    animFrame: 0,
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    win: false,
    keys: new Set<string>(),
    lastShot: 0,
    hitFlash: 0,
    ufo: null as { x: number; dir: number } | null,
    ufoTimer: 0,
  });

  function initGame(s: typeof stateRef.current) {
    s.invaders = [];
    s.shields = [];
    const startX = (CANVAS_W - INVADER_COLS * (INVADER_W + INVADER_GAP_X)) / 2;
    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        s.invaders.push({
          x: startX + col * (INVADER_W + INVADER_GAP_X),
          y: 40 + row * (INVADER_H + INVADER_GAP_Y),
          alive: true,
          row,
        });
      }
    }
    const shieldY = CANVAS_H - 110;
    const b = SHIELD_BLOCK;
    const shieldShape = [
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 1, 1, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
    ];
    const shieldW = shieldShape[0].length * b;
    const totalShieldsW = 4 * shieldW;
    const shieldGap = (CANVAS_W - totalShieldsW) / 5;
    for (let si = 0; si < 4; si++) {
      const sx = shieldGap + si * (shieldW + shieldGap);
      for (let r = 0; r < shieldShape.length; r++) {
        for (let c = 0; c < shieldShape[r].length; c++) {
          if (shieldShape[r][c]) {
            s.shields.push({ x: sx + c * b, y: shieldY + r * b, hp: 1, col: c });
          }
        }
      }
    }
  }

  React.useEffect(() => {
    initGame(stateRef.current);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      stateRef.current.keys.add(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => stateRef.current.keys.delete(e.key);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onClose]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame: number;
    let lastTime = 0;
    const primaryColor =
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#f7246a';
    const hexToRgb = (hex: string) => {
      const h = hex.replace('#', '');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    };
    const shieldGradient = (() => {
      const start = hexToRgb(primaryColor.startsWith('#') ? primaryColor : '#f7246a');
      const end = hexToRgb('#f77937');
      const steps = 8;
      return Array.from({ length: steps }, (_, i) => {
        const t = i / (steps - 1);
        const r = Math.round(start[0] + (end[0] - start[0]) * t);
        const g = Math.round(start[1] + (end[1] - start[1]) * t);
        const b = Math.round(start[2] + (end[2] - start[2]) * t);
        return `rgb(${r},${g},${b})`;
      });
    })();

    function update(dt: number) {
      const s = stateRef.current;
      if (s.gameOver || s.win) return;

      if (s.keys.has('ArrowLeft') || s.keys.has('a')) s.player.x -= 3;
      if (s.keys.has('ArrowRight') || s.keys.has('d')) s.player.x += 3;
      s.player.x = Math.max(0, Math.min(CANVAS_W - PLAYER_W, s.player.x));

      if (s.keys.has(' ') && s.bullets.length === 0) {
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 2, y: CANVAS_H - 40 });
      }

      s.bullets = s.bullets.filter((b) => {
        const prevY = b.y;
        b.y -= BULLET_SPEED;
        if (b.y < 0) return false;
        for (const inv of s.invaders) {
          if (inv.alive && b.x >= inv.x && b.x <= inv.x + INVADER_W && b.y >= inv.y && b.y <= inv.y + INVADER_H) {
            inv.alive = false;
            const rowScores = [30, 30, 20, 20, 10, 10];
            s.score += rowScores[inv.row] || 10;
            return false;
          }
        }
        for (const sh of s.shields) {
          if (sh.hp > 0 && b.x >= sh.x && b.x <= sh.x + SHIELD_BLOCK && prevY >= sh.y && b.y <= sh.y + SHIELD_BLOCK) {
            sh.hp--;
            return false;
          }
        }
        return true;
      });

      s.enemyBullets = s.enemyBullets.filter((b) => {
        const prevY = b.y;
        b.y += INVADER_BULLET_SPEED;
        if (b.y > CANVAS_H) return false;
        for (const sh of s.shields) {
          if (sh.hp > 0 && b.x >= sh.x && b.x <= sh.x + SHIELD_BLOCK && b.y >= sh.y && prevY <= sh.y + SHIELD_BLOCK) {
            sh.hp--;
            return false;
          }
        }
        if (b.x >= s.player.x && b.x <= s.player.x + PLAYER_W && b.y >= CANVAS_H - 30 && b.y <= CANVAS_H - 10) {
          s.lives--;
          s.hitFlash = 30;
          if (s.lives <= 0) s.gameOver = true;
          return false;
        }
        return true;
      });

      const aliveCount = s.invaders.filter((i) => i.alive).length;
      const totalCount = s.invaders.length;
      const speedFactor = 1 - (1 - aliveCount / totalCount) * 0.8;
      const moveInterval = BASE_MOVE_INTERVAL * Math.max(0.08, speedFactor);

      s.moveTimer += dt;
      if (s.moveTimer > moveInterval) {
        s.moveTimer = 0;
        s.animFrame = 1 - s.animFrame;
        let hitEdge = false;
        for (const inv of s.invaders) {
          if (!inv.alive) continue;
          if ((s.dx > 0 && inv.x + INVADER_W + 10 > CANVAS_W) || (s.dx < 0 && inv.x - 10 < 0)) {
            hitEdge = true;
            break;
          }
        }
        if (hitEdge) {
          s.dx = -s.dx;
          for (const inv of s.invaders) {
            if (inv.alive) inv.y += 16;
          }
        } else {
          for (const inv of s.invaders) {
            if (inv.alive) inv.x += s.dx * 12;
          }
        }

        const aliveInvaders = s.invaders.filter((i) => i.alive);
        const shootChance = Math.min(0.8, 0.3 + (1 - aliveInvaders.length / s.invaders.length) * 0.5);
        if (aliveInvaders.length > 0 && Math.random() < shootChance) {
          const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
          s.enemyBullets.push({ x: shooter.x + INVADER_W / 2, y: shooter.y + INVADER_H });
        }

        for (const inv of s.invaders) {
          if (inv.alive && inv.y + INVADER_H >= CANVAS_H - 30) {
            s.gameOver = true;
          }
        }
      }

      if (s.invaders.every((i) => !i.alive)) {
        s.level++;
        s.bullets = [];
        s.enemyBullets = [];
        s.dx = 1;
        s.moveTimer = 0;
        s.ufo = null;
        const startX = (CANVAS_W - INVADER_COLS * (INVADER_W + INVADER_GAP_X)) / 2;
        for (let row = 0; row < INVADER_ROWS; row++) {
          for (let col = 0; col < INVADER_COLS; col++) {
            const idx = row * INVADER_COLS + col;
            s.invaders[idx] = {
              x: startX + col * (INVADER_W + INVADER_GAP_X),
              y: 40 + row * (INVADER_H + INVADER_GAP_Y),
              alive: true,
              row,
            };
          }
        }
      }

      if (s.hitFlash > 0) s.hitFlash--;

      s.ufoTimer += dt;
      if (!s.ufo && s.ufoTimer > 15000 + Math.random() * 10000) {
        s.ufoTimer = 0;
        const dir = Math.random() < 0.5 ? 1 : -1;
        s.ufo = { x: dir > 0 ? -30 : CANVAS_W + 10, dir };
      }
      if (s.ufo) {
        s.ufo.x += s.ufo.dir * 2;
        if (s.ufo.x < -40 || s.ufo.x > CANVAS_W + 40) {
          s.ufo = null;
        } else {
          for (let i = s.bullets.length - 1; i >= 0; i--) {
            const b = s.bullets[i];
            if (b.x >= s.ufo.x && b.x <= s.ufo.x + 24 && b.y >= 16 && b.y <= 28) {
              s.score += 50 + Math.floor(Math.random() * 5) * 50;
              s.ufo = null;
              s.bullets.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    function draw() {
      if (!ctx) return;
      const s = stateRef.current;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      if (s.ufo) {
        ctx.fillStyle = '#f77937';
        ctx.fillRect(s.ufo.x + 6, 18, 12, 6);
        ctx.fillRect(s.ufo.x + 2, 22, 20, 4);
        ctx.fillRect(s.ufo.x, 24, 24, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(s.ufo.x + 4, 25, 3, 2);
        ctx.fillRect(s.ufo.x + 10, 25, 3, 2);
        ctx.fillRect(s.ufo.x + 16, 25, 3, 2);
      }

      const playerTint = s.hitFlash > 0 && s.hitFlash % 4 < 2;
      const px = s.player.x;
      const py = CANVAS_H - 44;
      const cx = px + PLAYER_W / 2;
      const p = 2;

      ctx.fillStyle = playerTint ? '#f44336' : '#ddd';
      const body = [
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1],
        [0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0],
      ];
      const bw = body[0].length;
      const ox = cx - (bw * p) / 2;
      for (let r = 0; r < body.length; r++) {
        for (let c = 0; c < bw; c++) {
          if (body[r][c]) {
            ctx.fillStyle = playerTint ? '#f44336' : '#ddd';
            ctx.fillRect(ox + c * p, py + r * p, p, p);
          }
        }
      }
      ctx.fillStyle = '#2d2053';
      const visor = [
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      ];
      for (let r = 0; r < visor.length; r++) {
        for (let c = 0; c < visor[r].length; c++) {
          if (visor[r][c]) ctx.fillRect(ox + c * p, py + (r + 1) * p, p, p);
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(ox + 7 * p, py + 2 * p, p * 2, p);

      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        const ix = inv.x;
        const iy = inv.y;
        const iw = INVADER_W;
        const ih = INVADER_H;

        const f = s.animFrame;
        const ap = 2;
        const sprites: Record<string, number[][]> = {
          squid0: [
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
          ],
          squid1: [
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
          ],
          crab0: [
            [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
            [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
          ],
          crab1: [
            [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
            [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
          ],
          octo0: [
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
            [0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
          ],
          octo1: [
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
          ],
        };
        const spriteKey = inv.row <= 1 ? `squid${f}` : inv.row <= 3 ? `crab${f}` : `octo${f}`;
        const sprite = sprites[spriteKey];
        if (sprite) {
          const sw = sprite[0].length;
          const sox = ix + (iw - sw * ap) / 2;
          for (let sr = 0; sr < sprite.length; sr++) {
            for (let sc = 0; sc < sw; sc++) {
              if (sprite[sr][sc]) {
                ctx.fillStyle = '#cc0000';
                ctx.fillRect(sox + sc * ap, iy + sr * ap, ap, ap);
              }
            }
          }
        }

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(ix + iw / 2 - 2, iy + 3);
        ctx.lineTo(ix + iw / 2 + 3, iy + ih / 2);
        ctx.lineTo(ix + iw / 2 - 2, iy + ih - 3);
        ctx.closePath();
        ctx.fill();
      }

      for (const sh of s.shields) {
        if (sh.hp <= 0) continue;
        ctx.fillStyle = shieldGradient[sh.col] || primaryColor;
        ctx.fillRect(sh.x, sh.y, SHIELD_BLOCK, SHIELD_BLOCK);
      }

      ctx.fillStyle = '#fff';
      for (const b of s.bullets) ctx.fillRect(b.x, b.y, 4, 10);

      ctx.fillStyle = '#f44336';
      for (const b of s.enemyBullets) ctx.fillRect(b.x, b.y, 4, 10);

      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(`Score: ${s.score}`, 10, 12);
      ctx.fillText(`Level: ${s.level}`, CANVAS_W / 2 - 30, 12);
      ctx.fillText(`Lives: ${s.lives}`, CANVAS_W - 70, 12);

      if (s.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#f44336';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 10);
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText(`Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 20);
        ctx.fillText('Press Space to restart', CANVAS_W / 2, CANVAS_H / 2 + 50);
        ctx.textAlign = 'start';
      }

      if (s.win) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2 - 10);
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText(`Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 20);
        ctx.fillText('Press Space to restart', CANVAS_W / 2, CANVAS_H / 2 + 50);
        ctx.textAlign = 'start';
      }
    }

    function loop(time: number) {
      const dt = lastTime ? time - lastTime : 16;
      lastTime = time;

      const s = stateRef.current;
      if ((s.gameOver || s.win) && s.keys.has(' ')) {
        s.gameOver = false;
        s.win = false;
        s.score = 0;
        s.lives = 3;
        s.level = 1;
        s.bullets = [];
        s.enemyBullets = [];
        s.dx = 1;
        s.moveTimer = 0;
        s.ufo = null;
        s.ufoTimer = 0;
        s.hitFlash = 0;
        s.player.x = CANVAS_W / 2 - PLAYER_W / 2;
        initGame(s);
        s.keys.delete(' ');
      }

      update(dt);
      draw();
      frame = requestAnimationFrame(loop);
    }

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="space-invaders__overlay" onClick={onClose}>
      <div className="space-invaders__modal" onClick={(e) => e.stopPropagation()}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="space-invaders__canvas" />
        <div className="space-invaders__controls">
          <span>{__('Arrow keys to move, Space to shoot, Esc to close')}</span>
        </div>
      </div>
    </div>
  );
}
