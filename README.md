# cheezetomato.github.io

cheezetomato의 개인 사이트입니다. GitHub Pages로 운영합니다.

| 사이트 | 주소 | 폴더 |
|---|---|---|
| Films. | https://cheezetomato.github.io/films/ | [`films/`](films/) |
| Games. | https://cheezetomato.github.io/games/ | [`games/`](games/) |

Films는 맨 아래 Language에서 한국어, English, 日本語를 고를 수 있습니다. 번역은 [`shared/i18n.js`](shared/i18n.js)에 있습니다. Games는 한국어로만 운영합니다.

## Films.

직접 본 영화의 별점과 한줄평, 다시 본 기록, 통계를 모아 둔 기록입니다.

- 영화 정보와 포스터는 [TMDB](https://www.themoviedb.org/), OTT 정보는 [JustWatch](https://www.justwatch.com/kr)에서 가져옵니다.
- 기록은 Firebase에 저장하고, 매주 월요일 GitHub Actions가 `backup` 브랜치에 백업합니다.

## Games.

| 게임 | 파일 | 내용 |
|---|---|---|
| 대칭 퍼즐 | [`games/symmetry.html`](games/symmetry.html) | 2~4인 온라인. 같은 조각으로 좌우 대칭을 먼저 만드는 3라운드 게임 |
| 벽바둑 | [`games/wallgo.html`](games/wallgo.html) | 2인/3인. 0~2칸 이동 후 벽 세우기, 한 기기 또는 온라인 |
| 사과 게임 | [`games/apple.html`](games/apple.html) | 합이 10이 되도록 사과를 묶어 120초 안에 수확 |
| 지뢰찾기 | [`games/minesweeper.html`](games/minesweeper.html) | 네 가지 난이도, 휴대폰에서는 길게 눌러 깃발 |
| 십이장기 | [`games/janggi.html`](games/janggi.html) | 3×4 판 미니 장기, AI 대전과 온라인 대전 |

- 공용 스타일과 도우미는 [`games/common.css`](games/common.css), [`games/common.js`](games/common.js)에 있습니다.
- 온라인 대전은 PeerJS로 브라우저끼리 직접 연결하고, 방을 만든 사람이 판을 관리합니다.
- 기록(사과 게임, 지뢰찾기)과 대칭 퍼즐의 공개 방 목록(`symRooms`)은 Films와 같은 Firebase에 저장합니다.
