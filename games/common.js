/*
 * Games. 공용 도우미
 * - Kit.toast / Kit.dialog: 알림 띠와 결과 창
 * - Kit.db: Firestore 기록 읽기/쓰기 (REST, SDK 없이)
 * - Kit.Room: 친구와 온라인 대전 (PeerJS, 방장이 판을 관리)
 */
(function () {
  'use strict';
  const T = s => (window.I18N ? window.I18N.t(s) : s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 알림 띠 ---------- */
  let toastEl, toastTimer;
  function toast(msg, ms = 2200) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  /* ---------- 결과 창 ---------- */
  // dialog({ title, text, html, actions: [{ label, main, onClick }] })
  function dialog({ title, text = '', html = '', actions = [{ label: '닫기' }] }) {
    const d = document.createElement('dialog');
    d.className = 'dialog';
    d.innerHTML = `<div class="dialog-body"><h2></h2>${text ? '<p></p>' : ''}${html}</div><div class="dialog-actions"></div>`;
    d.querySelector('h2').textContent = title;
    if (text) d.querySelector('p').textContent = text;
    const row = d.querySelector('.dialog-actions');
    actions.forEach(a => {
      const b = document.createElement('button');
      b.className = 'btn' + (a.main ? ' btn-main' : '');
      b.textContent = a.label;
      b.addEventListener('click', () => { d.close(); a.onClick && a.onClick(); });
      row.appendChild(b);
    });
    d.addEventListener('close', () => setTimeout(() => d.remove(), 50));
    document.body.appendChild(d);
    d.showModal();
    const main = row.querySelector('.btn-main') || row.querySelector('button');
    main && main.focus();
    return d;
  }

  /* ---------- Firestore (REST) ---------- */
  const PROJECT = 'my-first-page-931dd';
  const KEY = 'AIzaSyC1hcxeEpsGo-N75xyPxWb7RuTjspvpzNw';
  const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
  const plain = v => {
    if (!v) return null;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('stringValue' in v) return v.stringValue;
    if ('booleanValue' in v) return v.booleanValue;
    return null;
  };
  const wrap = v => (typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) });
  const fieldsOf = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, wrap(v)]));
  const docOf = d => ({ id: decodeURIComponent(d.name.split('/').pop()), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, plain(v)])) });

  const db = {
    async list(col, pageSize = 300) {
      const out = []; let token = '';
      for (let i = 0; i < 20; i++) {
        const r = await fetch(`${BASE}/${col}?pageSize=${pageSize}&key=${KEY}${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`);
        if (!r.ok) throw new Error(`load ${r.status}`);
        const j = await r.json();
        (j.documents || []).forEach(d => out.push(docOf(d)));
        token = j.nextPageToken; if (!token) break;
      }
      return out;
    },
    // 정렬해서 몇 개만: query('appleRecords', 'score', 'DESCENDING', 10)
    async query(col, field, dir, limit) {
      const body = { structuredQuery: { from: [{ collectionId: col }], orderBy: [{ field: { fieldPath: field }, direction: dir }], limit } };
      const r = await fetch(`${BASE}:runQuery?key=${KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`load ${r.status}`);
      return (await r.json()).filter(x => x.document).map(x => docOf(x.document));
    },
    async get(col, id) {
      const r = await fetch(`${BASE}/${col}/${encodeURIComponent(id)}?key=${KEY}`);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`load ${r.status}`);
      return docOf(await r.json());
    },
    async add(col, obj) {
      const r = await fetch(`${BASE}/${col}?key=${KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: fieldsOf(obj) }) });
      if (!r.ok) throw new Error(`save ${r.status}`);
    },
    async del(col, id) {
      await fetch(`${BASE}/${col}/${encodeURIComponent(id)}?key=${KEY}`, { method: 'DELETE', keepalive: true });
    },
    async merge(col, id, obj) {
      const mask = Object.keys(obj).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
      const r = await fetch(`${BASE}/${col}/${encodeURIComponent(id)}?${mask}&key=${KEY}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: fieldsOf(obj) }) });
      if (!r.ok) throw new Error(`save ${r.status}`);
    }
  };

  /* ---------- 이름 기억 ---------- */
  const NAME_KEY = 'games-name';
  const savedName = () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; } };
  const saveName = n => { try { localStorage.setItem(NAME_KEY, n); } catch (e) { /* 저장 공간 없음 */ } };

  /* ---------- 온라인 대전 ----------
   * 방장(seat 0)이 판 상태를 가지고, 손님은 '행동'만 보냅니다.
   * host:  const room = Kit.Room.host({ seats, onJoin(list), onAction(seat, action), onLeave(seat) })
   *        room.link, room.broadcast(msg), room.sendTo(seat, msg)
   * guest: const room = Kit.Room.join(id, { onMessage(msg), onClose() }); room.send(msg)
   */
  const PEER_OPTS = { debug: 0 };
  const Room = {
    host({ seats, name, onReady, onJoin, onAction, onLeave, onError }) {
      const peer = new window.Peer(undefined, PEER_OPTS);
      const conns = new Array(seats).fill(null);
      const names = new Array(seats).fill(''); names[0] = name || '';
      const room = {
        peer, link: '', seats, names,
        get count() { return 1 + conns.filter(Boolean).length; },
        broadcast(msg) { conns.forEach(c => c && c.open && c.send(msg)); },
        sendTo(seat, msg) { const c = conns[seat]; c && c.open && c.send(msg); },
        kick(seat) { const c = conns[seat]; if (!c) return; c.open && c.send({ t: 'kicked' }); setTimeout(() => { try { c.close(); } catch (e) { /* 이미 닫힘 */ } }, 250); },
        close() { try { peer.destroy(); } catch (e) { /* 이미 닫힘 */ } }
      };
      peer.on('open', id => {
        const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('room', id);
        room.link = u.toString();
        onReady && onReady(room);
      });
      peer.on('connection', c => {
        c.on('open', () => {
          const seat = conns.findIndex((x, i) => i > 0 && !x);
          if (seat < 0) { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); return; }
          conns[seat] = c; names[seat] = String((c.metadata && c.metadata.name) || '').slice(0, 15);
          c.send({ t: 'seat', seat, seats });
          onJoin && onJoin(seat, names.slice(), conns.map((x, i) => i === 0 || !!x));
        });
        c.on('data', msg => {
          const seat = conns.indexOf(c);
          if (seat > 0 && msg && msg.t === 'act') onAction && onAction(seat, msg.a);
        });
        c.on('close', () => {
          const seat = conns.indexOf(c);
          if (seat > 0) { conns[seat] = null; names[seat] = ''; onLeave && onLeave(seat, names.slice(), conns.map((x, i) => i === 0 || !!x)); }
        });
      });
      peer.on('error', e => onError && onError(e));
      return room;
    },
    join(id, { name, onMessage, onClose, onError }) {
      const peer = new window.Peer(undefined, PEER_OPTS);
      const room = { peer, conn: null, send(a) { room.conn && room.conn.open && room.conn.send({ t: 'act', a }); }, close() { try { peer.destroy(); } catch (e) { /* 이미 닫힘 */ } } };
      peer.on('open', () => {
        const c = peer.connect(id, { reliable: true, metadata: { name } });
        room.conn = c;
        c.on('data', msg => onMessage && onMessage(msg));
        c.on('close', () => onClose && onClose());
        c.on('error', e => onError && onError(e));
      });
      peer.on('error', e => onError && onError(e));
      return room;
    }
  };

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast(T('링크를 복사했습니다.')); }
    catch (e) { toast(T('링크를 길게 눌러 복사하세요.')); }
  }

  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.Kit = { T, esc, toast, dialog, db, Room, copy, savedName, saveName, reduceMotion };
})();
