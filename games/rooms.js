/*
 * Games. 온라인 방 (대칭 퍼즐, 벽바둑, 십이장기가 같이 씀)
 * - 입구: 닉네임, 방 만들기(이름, 인원, 설정, 비공개) / 참가하기(공개 방 목록, 링크)
 * - 대기실: 자리, 강퇴, 게임 시작, 초대 링크, 채팅
 * - 채팅과 이모지는 게임 중에도 [data-chat] 상자에 나옴
 * - 방장이 판을 관리하고, 손님은 행동만 보냄
 *
 * const lobby = Lobby({
 *   game: 'wallgo', entry: 요소, waiting: 요소(main),
 *   max: [2, 3], min: 2, options: [{ key, label, choices: [[값, 이름]], def }],
 *   lateJoin(seat) → true면 게임 중에도 받음,
 *   onStart(api)        방장이 시작을 누름
 *   onAction(seat, a)   방장: 손님(또는 나)의 게임 행동
 *   onMessage(msg)      손님: 방장이 보낸 게임 메시지
 *   onLeave(seat, m)    방장: 누가 나감
 *   onJoin(seat, m)     방장: 누가 들어옴
 * })
 */
(function () {
  'use strict';
  const { esc, toast, dialog, db, Room, copy, savedName, saveName } = window.Kit;
  const COLL = 'gameRooms';
  const COLORS = ['빨강', '파랑', '노랑', '초록'];
  const EMOJI = ['👍', '😂', '😮', '😭', '🔥', '👏'];
  const go = '<span class="m-go" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></span>';

  window.Lobby = function (cfg) {
    const maxChoices = cfg.max || [2];
    const min = cfg.min || 2;
    let room = null, isHost = false, mySeat = -1, playing = false, kicked = false, beat = null;
    let info = { name: '', max: maxChoices[maxChoices.length - 1], priv: false, opts: {} };
    let members = [];
    const chatLog = [];
    const nameOf = seat => (members.find(m => m.seat === seat) || {}).name || COLORS[seat] || `${seat + 1}번`;

    /* ---------- 입구 그리기 ---------- */
    const E = cfg.entry;
    const optRows = (cfg.options || []).map(o => `<div class="field"><label>${esc(o.label)}</label><div class="seg" role="group" aria-label="${esc(o.label)}" data-opt="${o.key}">${o.choices.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === o.def}">${esc(l)}</button>`).join('')}</div></div>`).join('');
    E.innerHTML = `
      <div class="field"><label for="lb-nick">닉네임</label><input class="input" id="lb-nick" maxlength="12" autocomplete="nickname" placeholder="게임에서 쓸 이름"></div>
      <div class="panel lb-invited" hidden><p class="status">초대받은 방에 들어갑니다.</p><button class="btn btn-main" type="button" data-act="enter">입장하기</button></div>
      <div class="lb-choose">
        <div class="entry-tabs">
          <button class="mode-btn" type="button" data-tab="make" aria-pressed="true"><span class="m-name">방 만들기</span><span class="m-desc">방장이 되어 친구를 부릅니다</span></button>
          <button class="mode-btn" type="button" data-tab="join" aria-pressed="false"><span class="m-name">참가하기</span><span class="m-desc">열려 있는 방에 들어갑니다</span></button>
        </div>
        <div class="panel lb-make" style="margin-top:12px">
          <div class="field"><label for="lb-room">방 이름</label><input class="input" id="lb-room" maxlength="24" placeholder="비워 두면 '닉네임의 방'"></div>
          ${maxChoices.length > 1 ? `<div class="field"><label>최대 인원</label><div class="seg" role="group" aria-label="최대 인원" data-opt="__max">${maxChoices.map(n => `<button type="button" data-v="${n}" aria-pressed="${n === maxChoices[maxChoices.length - 1]}">${n}명</button>`).join('')}</div></div>` : ''}
          ${optRows}
          <label class="check"><input type="checkbox" class="lb-priv"> 비공개 방 <small>목록에 안 뜨고 링크로만 들어옵니다</small></label>
          <button class="btn btn-main" type="button" data-act="make">방 만들기</button>
        </div>
        <div class="panel lb-join" style="margin-top:12px" hidden>
          <div class="row"><b style="font-size:0.95rem">열린 방</b><span class="status lb-list-status" style="margin-left:auto"></span><button class="btn btn-quiet" type="button" data-act="refresh">새로고침</button></div>
          <ul class="room-list lb-list"></ul>
          <div class="row"><input class="input lb-code" placeholder="초대 링크 붙여넣기" aria-label="초대 링크"><button class="btn" type="button" data-act="code">들어가기</button></div>
        </div>
      </div>
      <p class="status lb-status" role="status"></p>`;
    const q = sel => E.querySelector(sel);
    q('#lb-nick').value = savedName().slice(0, 12);
    const pick = {};
    E.querySelectorAll('[data-opt]').forEach(seg => {
      const key = seg.dataset.opt;
      const def = seg.querySelector('[aria-pressed="true"]');
      pick[key] = def ? def.dataset.v : null;
      seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { pick[key] = b.dataset.v; seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
    });
    function status(msg, err) { const s = q('.lb-status'); s.textContent = msg; s.classList.toggle('err', !!err); }
    function nick() {
      const n = q('#lb-nick').value.trim().slice(0, 12);
      if (!n) { status('닉네임을 먼저 정해 주세요.', true); q('#lb-nick').focus(); return ''; }
      saveName(n); return n;
    }
    function tab(which) {
      E.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === which)));
      q('.lb-make').hidden = which !== 'make'; q('.lb-join').hidden = which !== 'join';
      if (which === 'join') loadRooms();
    }
    E.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => tab(b.dataset.tab)));
    E.querySelector('[data-act="make"]').addEventListener('click', create);
    E.querySelector('[data-act="refresh"]').addEventListener('click', loadRooms);
    E.querySelector('[data-act="code"]').addEventListener('click', () => {
      const v = q('.lb-code').value.trim(); if (!v) return;
      let id = v; try { id = new URL(v).searchParams.get('room') || v; } catch (e) { /* 코드만 붙여넣음 */ }
      join(id);
    });

    let listTimer = 0;
    async function loadRooms() {
      const ul = q('.lb-list');
      q('.lb-list-status').textContent = '불러오는 중';
      try {
        const all = await db.list(COLL);
        const live = all.filter(r => r.game === cfg.game && Date.now() - (r.ts || 0) < 45000).sort((a, b) => (a.playing - b.playing) || (b.ts - a.ts));
        ul.innerHTML = live.length ? live.map(r => {
          const full = r.count >= r.max;
          return `<li><span class="rn">${esc(r.name)}</span><span class="rh">방장 ${esc(r.host)}${r.note ? `, ${esc(r.note)}` : ''}</span><span class="rc${r.playing ? ' playing' : ''}">${r.playing ? '게임 중' : `${r.count}/${r.max}`}</span><button class="btn" type="button" data-room="${esc(r.id)}"${full || r.playing ? ' disabled' : ''}>참가</button></li>`;
        }).join('') : '<li class="empty" style="display:block;background:none">열린 방이 없습니다. 방을 만들어 보세요.</li>';
        ul.querySelectorAll('[data-room]').forEach(b => b.addEventListener('click', () => join(b.dataset.room)));
      } catch (e) {
        ul.innerHTML = '<li class="empty" style="display:block;background:none">방 목록을 불러오지 못했습니다. 초대 링크로 들어가 주세요.</li>';
      }
      q('.lb-list-status').textContent = '';
      clearTimeout(listTimer);
      listTimer = setTimeout(() => { if (!q('.lb-join').hidden && !cfg.entryScreen.hidden) loadRooms(); }, 8000);
    }

    /* ---------- 대기실 그리기 ---------- */
    const W = cfg.waiting;
    W.innerHTML = `
      <div class="wait-head">
        <h1><span class="lb-wname"></span><span class="tag lb-wtag"></span></h1>
        <div class="row"><input class="input lb-link" readonly aria-label="초대 링크" style="min-width:260px"><button class="btn" type="button" data-act="copy">링크 복사</button></div>
      </div>
      <section>
        <p class="status lb-opts" style="margin:0 0 12px"></p>
        <div class="slots lb-slots"></div>
        <div class="wait-foot">
          <button class="btn btn-main" type="button" data-act="start" hidden>게임 시작</button>
          <p class="status lb-wstatus"></p>
          <button class="btn btn-quiet" type="button" data-act="leave" style="margin-left:auto">나가기</button>
        </div>
      </section>
      <div class="chat" data-chat></div>`;
    const w = sel => W.querySelector(sel);
    w('[data-act="copy"]').addEventListener('click', () => copy(w('.lb-link').value));
    w('[data-act="leave"]').addEventListener('click', () => api.leave());
    w('[data-act="start"]').addEventListener('click', () => { if (isHost && members.length >= min) cfg.onStart && cfg.onStart(api); });

    function optText() {
      return (cfg.options || []).map(o => { const v = info.opts[o.key]; const c = o.choices.find(x => String(x[0]) === String(v)); return c ? `${o.label} ${c[1]}` : ''; }).filter(Boolean).join(', ');
    }
    function renderWaiting() {
      w('.lb-wname').textContent = info.name;
      w('.lb-wtag').textContent = info.priv ? '비공개' : '공개';
      w('.lb-opts').textContent = optText();
      w('.lb-opts').hidden = !optText();
      w('.lb-slots').innerHTML = Array.from({ length: info.max }, (_, seat) => {
        const m = members.find(x => x.seat === seat);
        if (!m) return `<div class="slot"><span class="who" style="color:var(--text-mute);font-weight:500;font-size:1rem">빈자리</span><span class="role">초대 링크로 들어올 수 있습니다</span></div>`;
        const kick = isHost && seat !== 0 ? `<button class="btn kick" type="button" data-kick="${seat}">강퇴</button>` : '';
        return `<div class="slot on s${seat}" data-seat="${seat}"><span class="who">${esc(m.name)}</span><span class="role"><span class="chip"></span>${seat === 0 ? '방장' : '참가자'}${seat === mySeat ? ', 나' : ''}</span>${kick}</div>`;
      }).join('');
      w('.lb-slots').querySelectorAll('[data-kick]').forEach(b => b.addEventListener('click', () => {
        const seat = +b.dataset.kick, m = members.find(x => x.seat === seat);
        if (m && confirm(`${m.name} 님을 내보낼까요?`)) room.kick(seat);
      }));
      const st = w('[data-act="start"]');
      st.hidden = !isHost; st.disabled = members.length < min;
      w('.lb-wstatus').textContent = isHost ? (members.length < min ? `${min}명 이상 모이면 시작할 수 있습니다.` : `${members.length}명이 모였습니다.`) : '방장이 시작하기를 기다리는 중입니다.';
    }

    /* ---------- 채팅 ---------- */
    function mountChats() {
      document.querySelectorAll('[data-chat]').forEach(box => {
        if (box.dataset.ready) return; box.dataset.ready = '1';
        box.innerHTML = `<h2>채팅</h2><div class="chat-log" aria-live="polite"></div><div class="emojis">${EMOJI.map(e => `<button type="button" data-e="${e}" aria-label="${e} 보내기">${e}</button>`).join('')}</div><form><input class="input" maxlength="120" placeholder="메시지 입력" aria-label="채팅 메시지"><button class="btn" type="submit">보내기</button></form>`;
        box.querySelector('form').addEventListener('submit', e => {
          e.preventDefault();
          const inp = box.querySelector('input'); const text = inp.value.trim(); if (!text) return;
          inp.value = ''; api.send({ k: 'chat', text });
        });
        box.querySelectorAll('[data-e]').forEach(b => b.addEventListener('click', () => api.send({ k: 'emoji', e: b.dataset.e })));
      });
      drawChat();
    }
    function addChat(m) { chatLog.push(m); if (chatLog.length > 80) chatLog.shift(); drawChat(); }
    function drawChat() {
      document.querySelectorAll('.chat-log').forEach(log => {
        log.innerHTML = '';
        chatLog.forEach(m => {
          const d = document.createElement('div');
          if (m.seat < 0) { d.className = 'm sys'; d.textContent = m.text; }
          else { d.className = `m s${m.seat}`; const b = document.createElement('b'); b.textContent = m.name; d.append(b, document.createTextNode(m.text)); }
          log.appendChild(d);
        });
        log.scrollTop = log.scrollHeight;
      });
    }
    function popEmoji(seat, e) {
      const els = [...document.querySelectorAll(`[data-seat="${seat}"]`)].filter(x => x.offsetParent !== null);
      const host = els[0]; if (!host) return;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      const f = document.createElement('span'); f.className = 'float-emoji'; f.textContent = e;
      host.appendChild(f); setTimeout(() => f.remove(), 2300);
    }
    function hostChat(seat, text) {
      if (!text) return;
      const m = { t: 'chat', seat, name: seat >= 0 ? nameOf(seat) : '', text };
      room && room.broadcast(m); addChat(m);
    }

    /* ---------- 방장 ---------- */
    async function publish() {
      if (!isHost || info.priv || !room || !room.peer || !room.peer.id) return;
      try { await db.merge(COLL, room.peer.id, { game: cfg.game, name: info.name, host: members[0] ? members[0].name : '', count: members.length, max: info.max, playing, note: optText(), ts: Date.now() }); }
      catch (e) { /* 목록 등록 실패: 링크로는 계속 들어올 수 있음 */ }
    }
    function unpublish() { if (isHost && !info.priv && room && room.peer && room.peer.id) db.del(COLL, room.peer.id).catch(() => {}); }
    function syncLobby() { if (room && isHost) room.broadcast({ t: 'lobby', info, members }); renderWaiting(); publish(); }

    function create() {
      const n = nick(); if (!n) return;
      if (!window.Peer) return status('온라인 연결 도구를 불러오지 못했습니다. 새로고침해 주세요.', true);
      const opts = {}; (cfg.options || []).forEach(o => { opts[o.key] = pick[o.key] != null ? pick[o.key] : o.def; });
      info = { name: q('#lb-room').value.trim().slice(0, 24) || `${n}의 방`, max: +(pick.__max || maxChoices[maxChoices.length - 1]), priv: q('.lb-priv').checked, opts };
      isHost = true; mySeat = 0; members = [{ seat: 0, name: n }];
      status('방을 만드는 중입니다…');
      room = Room.host({
        seats: info.max, name: n,
        onReady(r) {
          w('.lb-link').value = r.link;
          api.showWaiting(); hostChat(-1, '방을 만들었습니다. 링크를 보내 친구를 부르세요.');
          publish(); beat = setInterval(publish, 15000);
        },
        onJoin(seat, names) {
          if (playing && !(cfg.lateJoin && cfg.lateJoin(seat))) { room.sendTo(seat, { t: 'busy' }); room.kick(seat); return; }
          const nm = (names[seat] || '').trim() || COLORS[seat];
          members = members.filter(m => m.seat !== seat).concat({ seat, name: nm }).sort((a, b) => a.seat - b.seat);
          syncLobby(); hostChat(-1, `${nm} 님이 들어왔습니다.`);
          cfg.onJoin && cfg.onJoin(seat, { seat, name: nm });
        },
        onLeave(seat) {
          const m = members.find(x => x.seat === seat); if (!m) return;
          members = members.filter(x => x.seat !== seat);
          hostChat(-1, `${m.name} 님이 나갔습니다.`);
          syncLobby();
          cfg.onLeave && cfg.onLeave(seat, m);
        },
        onAction(seat, a) { handle(seat, a); },
        onError(e) { status(`연결 오류: ${e.type || e.message || e}`, true); }
      });
    }
    function handle(seat, a) {
      if (!a) return;
      if (a.k === 'chat') return hostChat(seat, String(a.text || '').slice(0, 120));
      if (a.k === 'emoji') { const e = String(a.e || '').slice(0, 4); room && room.broadcast({ t: 'emoji', seat, e }); popEmoji(seat, e); return; }
      cfg.onAction && cfg.onAction(seat, a);
    }

    /* ---------- 손님 ---------- */
    function join(id) {
      const n = nick(); if (!n) return;
      if (!window.Peer) return status('온라인 연결 도구를 불러오지 못했습니다. 새로고침해 주세요.', true);
      isHost = false;
      status('방에 들어가는 중입니다…');
      room = Room.join(id, {
        name: n,
        onMessage(msg) {
          if (msg.t === 'full') return status('자리가 다 찼습니다.', true);
          if (msg.t === 'busy') return status('이미 게임이 진행 중인 방입니다.', true);
          if (msg.t === 'kicked') { kicked = true; return; }
          if (msg.t === 'seat') { mySeat = msg.seat; const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('room', id); w('.lb-link').value = u.toString(); return; }
          if (msg.t === 'lobby') {
            info = msg.info; members = msg.members;
            if (!cfg.entryScreen.hidden) { api.showWaiting(); addChat({ seat: -1, text: `${info.name}에 들어왔습니다.` }); }
            renderWaiting(); return;
          }
          if (msg.t === 'chat') return addChat(msg);
          if (msg.t === 'emoji') return popEmoji(msg.seat, msg.e);
          cfg.onMessage && cfg.onMessage(msg);
        },
        onClose() {
          if (kicked) { dialog({ title: '방에서 나가게 되었습니다', text: '방장이 내보냈습니다.', actions: [{ label: '확인', main: true, onClick: () => location.replace(location.pathname) }] }); return; }
          if (!cfg.entryScreen.hidden) return status('방에 들어갈 수 없습니다.', true);
          dialog({ title: '연결이 끊겼습니다', text: '방장이 나갔거나 연결이 끊어졌습니다.', actions: [{ label: '처음으로', main: true, onClick: () => location.replace(location.pathname) }] });
        },
        onError(e) { status(e && e.type === 'peer-unavailable' ? '방을 찾을 수 없습니다. 방장이 나갔거나 링크가 틀렸습니다.' : `연결 오류: ${e.type || e.message || e}`, true); }
      });
    }

    const api = {
      get isHost() { return isHost; }, get mySeat() { return mySeat; }, get members() { return members; }, get info() { return info; }, get online() { return !!room; },
      nameOf, popEmoji, sys: text => addChat({ seat: -1, text }),
      send(a) { if (isHost) handle(mySeat, a); else room && room.send(a); },
      broadcast(msg) { if (isHost && room) room.broadcast(msg); },
      sendTo(seat, msg) { if (isHost && room) room.sendTo(seat, msg); },
      setPlaying(v) { playing = !!v; publish(); },
      showWaiting() { cfg.entryScreen.hidden = true; W.hidden = false; (cfg.otherScreens || []).forEach(x => { x.hidden = true; }); mountChats(); renderWaiting(); window.scrollTo(0, 0); },
      syncLobby,
      leave() { unpublish(); clearInterval(beat); if (room) room.close(); location.replace(location.pathname); },
      mountChats
    };
    window.addEventListener('pagehide', unpublish);

    const invited = new URLSearchParams(location.search).get('room');
    if (invited) {
      q('.lb-choose').hidden = true; q('.lb-invited').hidden = false;
      q('[data-act="enter"]').addEventListener('click', () => join(invited));
      cfg.onInvited && cfg.onInvited();
    }
    return api;
  };
})();
