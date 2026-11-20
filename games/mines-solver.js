/*
 * 지뢰찾기: 추리만으로 풀리는 판 만들기
 * - 무작위로 지뢰를 놓고, 사람처럼 추리하는 해결기로 첫 칸부터 끝까지 풀리는지 확인합니다.
 * - 쓰는 추리: 숫자 하나로 확정, 두 숫자 비교(부분집합), 남은 지뢰 수.
 * - 풀리는 판이 나올 때까지 다시 만듭니다.
 */
(function () {
  'use strict';

  function makeNeighbors(R, C) {
    const nb = new Array(R * C);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const list = [];
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        if (!a && !b) continue;
        const nr = r + a, nc = c + b;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C) list.push(nr * C + nc);
      }
      nb[r * C + c] = list;
    }
    return nb;
  }

  // mine: Uint8Array(R*C), start: 첫 칸 번호. 다 풀리면 true
  function solvable(R, C, M, mine, start, nb) {
    const N = R * C;
    const num = new Int8Array(N);
    for (let i = 0; i < N; i++) { let n = 0; for (const j of nb[i]) n += mine[j]; num[i] = n; }
    const st = new Uint8Array(N); // 0 모름, 1 열림, 2 지뢰 확정
    let opened = 0, flagged = 0;
    const goal = N - M;
    const stack = [];
    const open = i => {
      stack.push(i);
      while (stack.length) {
        const k = stack.pop();
        if (st[k]) continue;
        if (mine[k]) return false;
        st[k] = 1; opened++;
        if (!num[k]) for (const j of nb[k]) if (!st[j]) stack.push(j);
      }
      return true;
    };
    if (!open(start)) return false;
    let guard = 0;
    while (opened < goal && guard++ < N * 4) {
      let progress = false;
      // 1) 숫자 하나로
      for (let i = 0; i < N; i++) {
        if (st[i] !== 1 || !num[i]) continue;
        let unk = 0, fl = 0;
        for (const j of nb[i]) { if (!st[j]) unk++; else if (st[j] === 2) fl++; }
        if (!unk) continue;
        if (num[i] === fl) { for (const j of nb[i]) if (!st[j]) { if (!open(j)) return false; } progress = true; }
        else if (num[i] - fl === unk) { for (const j of nb[i]) if (!st[j]) { st[j] = 2; flagged++; } progress = true; }
      }
      if (progress) continue;
      // 2) 두 숫자 비교: A의 모르는 칸이 B의 모르는 칸에 다 들어 있으면
      const cons = [];
      for (let i = 0; i < N; i++) {
        if (st[i] !== 1 || !num[i]) continue;
        const u = []; let fl = 0;
        for (const j of nb[i]) { if (!st[j]) u.push(j); else if (st[j] === 2) fl++; }
        if (u.length) cons.push({ i, u, need: num[i] - fl });
      }
      const byCell = new Map();
      cons.forEach((c, k) => c.u.forEach(j => { if (!byCell.has(j)) byCell.set(j, []); byCell.get(j).push(k); }));
      outer: for (let a = 0; a < cons.length; a++) {
        const A = cons[a], near = new Set();
        A.u.forEach(j => byCell.get(j).forEach(k => { if (k !== a) near.add(k); }));
        for (const b of near) {
          const B = cons[b];
          if (A.u.length >= B.u.length) continue;
          const setB = new Set(B.u);
          if (!A.u.every(j => setB.has(j))) continue;
          const rest = B.u.filter(j => !A.u.includes(j)), m = B.need - A.need;
          if (m === 0) { for (const j of rest) if (!st[j]) { if (!open(j)) return false; } progress = true; break outer; }
          if (m === rest.length) { for (const j of rest) if (!st[j]) { st[j] = 2; flagged++; } progress = true; break outer; }
        }
      }
      if (progress) continue;
      // 3) 남은 지뢰 수
      let unknown = 0; for (let i = 0; i < N; i++) if (!st[i]) unknown++;
      if (M - flagged === 0) { for (let i = 0; i < N; i++) if (!st[i]) { if (!open(i)) return false; } continue; }
      if (M - flagged === unknown) { for (let i = 0; i < N; i++) if (!st[i]) { st[i] = 2; flagged++; } continue; }
      return false;
    }
    return opened === goal;
  }

  function randomMines(R, C, M, fr, fc) {
    const N = R * C, mine = new Uint8Array(N), free = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (Math.abs(r - fr) > 1 || Math.abs(c - fc) > 1) free.push(r * C + c);
    for (let k = 0; k < M; k++) { const x = k + Math.floor(Math.random() * (free.length - k)); [free[k], free[x]] = [free[x], free[k]]; mine[free[k]] = 1; }
    return mine;
  }

  // 시간을 나눠 가며 찾기 (화면이 멈추지 않게). 못 찾으면 null
  function generate(R, C, M, fr, fc, { budget = 6000, onTry } = {}) {
    const nb = makeNeighbors(R, C), start = fr * C + fc, t0 = performance.now();
    let tries = 0;
    return new Promise(resolve => {
      const step = () => {
        const until = performance.now() + 28;
        while (performance.now() < until) {
          tries++;
          const mine = randomMines(R, C, M, fr, fc);
          if (solvable(R, C, M, mine, start, nb)) return resolve({ mine, tries });
        }
        onTry && onTry(tries);
        if (performance.now() - t0 > budget) return resolve(null);
        setTimeout(step, 0);
      };
      step();
    });
  }

  window.MineGen = { generate, solvable, makeNeighbors, randomMines };
})();
