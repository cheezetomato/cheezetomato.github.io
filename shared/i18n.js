/*
 * Films.와 Games.가 함께 쓰는 언어 전환 (한국어 · English · 日本語)
 * - 페이지는 한국어로 그려지고, 고른 언어가 영어나 일본어면 화면에 보이는 글자만 바꿉니다.
 * - 입력칸 값, 저장되는 데이터, 직접 쓴 한줄평은 바꾸지 않습니다.
 * - 고른 언어는 localStorage('site-lang')에 저장되어 두 사이트가 함께 씁니다.
 */
(function () {
  'use strict';
  const LANGS = [['ko', '한국어'], ['en', 'English'], ['ja', '日本語']];
  const KEY = 'site-lang';
  let lang = 'ko';
  try { lang = localStorage.getItem(KEY) || 'ko'; } catch (e) { lang = 'ko'; }
  if (!LANGS.some(l => l[0] === lang)) lang = 'ko';
  const HANGUL = /[가-힣]/;
  const SKIP = 'script, style, textarea, input, select[data-i18n-skip], [data-i18n-skip], .review-text, .overlay-memo, #detail-memo, .tl-memo, .lang-pick';

  /* ---------- 정해진 문구 [한국어, English, 日本語] ---------- */
  const EXACT = {};
  const add = rows => rows.forEach(([ko, en, ja]) => { EXACT[ko] = { en, ja }; });

  add([
    // 공통
    ['로그인', 'Log in', 'ログイン'], ['로그아웃', 'Log out', 'ログアウト'], ['관리', 'Admin', '管理'],
    ['취소', 'Cancel', 'キャンセル'], ['저장', 'Save', '保存'], ['삭제', 'Delete', '削除'], ['수정', 'Edit', '編集'],
    ['닫기', 'Close', '閉じる'], ['이전 영화', 'Previous film', '前の映画'], ['다음 영화', 'Next film', '次の映画'], ['검색', 'Search', '検索'], ['검색 결과', 'Results', '検索結果'], ['확인 중', 'Checking…', '確認中…'],
    ['불러오는 중입니다', 'Loading…', '読み込み中…'], ['불러오는 중', 'Loading…', '読み込み中…'], ['검색 중입니다', 'Searching…', '検索中…'],
    ['전체', 'All', 'すべて'], ['전체 보기', 'See all', 'すべて見る'], ['이전', 'Previous', '前へ'], ['다음', 'Next', '次へ'],
    ['맨 위로', 'Back to top', 'トップへ'], ['만든 사람', 'Made by', '制作'], ['소스 코드', 'Source code', 'ソースコード'],
    ['데이터 출처', 'Data', 'データ提供'], ['바로가기', 'Links', 'リンク'], ['영화 기록장', 'Film diary', '映画の記録'],
    ['사이트 메뉴', 'Site menu', 'サイトメニュー'], ['영화 메뉴', 'Film menu', '映画メニュー'], ['영화 갤러리 첫 화면', 'Films home', 'Films ホーム'],
    ['내 영화 검색', 'Search my films', '映画を検索'], ['영화, 감독, 배우 검색', 'Search films, directors, cast', '映画・監督・俳優を検索'],
    ['날짜 미상', 'Unknown date', '日付不明'], ['제목 없음', 'Untitled', 'タイトルなし'], ['기록이 없습니다.', 'No records.', '記録がありません。'],
    ['Films. | 나의 영화 기록', 'Films. | My film diary', 'Films. | 私の映画記録'],
    // 국가, 장르
    ['한국', 'Korea', '韓国'], ['서양', 'Western', '欧米'], ['일본', 'Japan', '日本'], ['홍콩', 'Hong Kong', '香港'], ['기타', 'Other', 'その他'],
    // 관리자 메뉴
    ['+ 영화 기록', '+ Log a film', '+ 映画を記録'], ['+ 보고 싶은 영화', '+ Add to watchlist', '+ 観たい映画'],
    ['출연진 저장', 'Save cast', 'キャストを保存'], ['포스터 복구', 'Fix posters', 'ポスターを修復'], ['TMDB 연결', 'Link TMDB', 'TMDBと連携'],
    ['데이터 정리', 'Clean up data', 'データを整理'],
    // 첫 화면
    ['Recently watched', 'Recently watched', '最近観た映画'], ['Recent reviews', 'Recent reviews', '最近のレビュー'],
    ['Perfect 5.0', 'Perfect 5.0', '満点 5.0'], ['Watchlist', 'Watchlist', '観たい映画'], ['Diary', 'Diary', 'ダイアリー'],
    ['My directors', 'My directors', 'よく観る監督'], ['All films', 'All films', 'すべての映画'], ['By rating', 'By rating', '評価別'],
    ['통계 보기', 'See stats', '統計を見る'], ['재관람', 'Rewatch', '再鑑賞'], ['첫 관람', 'First watch', '初鑑賞'],
    // 전체 목록
    ['정렬', 'Sort', '並び替え'], ['장르', 'Genre', 'ジャンル'], ['국가', 'Country', '国'], ['초기화', 'Reset', 'リセット'],
    ['최근 본 순', 'Recently watched', '最近観た順'], ['평점 높은 순', 'Highest rated', '評価が高い順'], ['평점 낮은 순', 'Lowest rated', '評価が低い順'],
    ['개봉 최신순', 'Newest release', '公開が新しい順'], ['개봉 오래된 순', 'Oldest release', '公開が古い順'], ['제목순', 'Title', 'タイトル順'],
    ['전체 장르', 'All genres', 'すべてのジャンル'], ['전체 국가', 'All countries', 'すべての国'],
    ['조건에 맞는 영화가 없습니다.', 'No films match these filters.', '条件に合う映画がありません。'], ['페이지', 'Pages', 'ページ'],
    // 통계
    ['전체 기간', 'All time', '全期間'], ['번 관람', 'views', '回鑑賞'], ['본 영화', 'Films seen', '観た映画'], ['평균 평점', 'Avg. rating', '平均評価'],
    ['편', ' films', '本'], ['번', ' times', '回'],
    ['월별 관람', 'Views by month', '月別の鑑賞'], ['기간별 관람', 'Views by period', '期間別の鑑賞'], ['표로 보기', 'Show as table', '表で見る'],
    ['기간', 'Period', '期間'], ['편수', 'Count', '本数'], ['평점', 'Rating', '評価'], ['시대', 'Decade', '年代'], ['감독', 'Director', '監督'],
    ['★ 5.0을 준 영화', 'Rated ★ 5.0', '★5.0をつけた映画'], ['가장 많이 본 감독', 'Most-watched director', '最も観た監督'],
    ['가장 많이 본 장르', 'Most-watched genre', '最も観たジャンル'], ['가장 많이 본 달', 'Busiest month', '最も観た月'], ['가장 많이 본 해', 'Busiest year', '最も観た年'],
    ['평점 분포', 'Rating distribution', '評価の分布'], ['개봉 시대', 'Release decade', '公開年代'], ['많이 본 감독', 'Top directors', 'よく観た監督'],
    ['많이 본 장르', 'Top genres', 'よく観たジャンル'], ['여러 장르인 영화는 각각 셉니다', 'Films with several genres count in each', '複数ジャンルの映画はそれぞれ数えます'],
    ['이 기간의 기록이 없습니다.', 'No records for this period.', 'この期間の記録はありません。'],
    // 보고 싶은 영화
    ['+ 보고 싶은 영화 추가', '+ Add to watchlist', '+ 観たい映画を追加'], ['아직 담아둔 영화가 없습니다.', 'Your watchlist is empty.', 'まだ観たい映画はありません。'],
    ['보고 싶은 영화', 'Watchlist', '観たい映画'],
    // 검색
    ['찾는 영화가 없습니다.', 'No films found.', '映画が見つかりません。'], ['제목, 감독, 배우, 장르로 검색해 보세요.', 'Try a title, director, actor or genre.', 'タイトル・監督・俳優・ジャンルで検索してみてください。'],
    ['첫 화면으로', 'Back to home', 'ホームへ'], ['검색 결과가 없습니다.', 'No results.', '結果がありません。'],
    // 감독
    ['본 작품', 'Films', '作品数'], ['5.0 작품', 'Rated 5.0', '5.0の作品'], ['작품 연도', 'Years', '公開年'], ['평점순 작품', 'Films by rating', '評価順の作品'],
    ['이 감독의 기록을 찾지 못했습니다.', 'No records for this director.', 'この監督の記録が見つかりません。'],
    // 상세
    ['형식', 'Format', '形式'], ['시리즈', 'Series', 'シリーズ'], ['상태', 'Status', '状態'], ['최근 관람', 'Last watched', '最近の鑑賞'],
    ['관람일', 'Watched', '鑑賞日'], ['관람 횟수', 'Views', '鑑賞回数'], ['볼 수 있는 곳', 'Where to watch', '配信'],
    ['구독 서비스에는 없고 대여·구매만 가능', 'Rent or buy only', 'レンタル・購入のみ'], ['국내 서비스 없음', 'Not streaming in Korea', '韓国での配信なし'],
    ['정보를 불러오지 못했습니다', 'Couldn’t load', '読み込めませんでした'], ['다시 봤어요', 'Watched again', 'もう一度観た'], ['링크 복사', 'Copy link', 'リンクをコピー'],
    ['본 영화로 기록', 'Mark as watched', '観た映画に記録'], ['내 리뷰', 'My review', '私のレビュー'], ['관람 기록', 'Viewing history', '鑑賞履歴'],
    ['줄거리', 'Synopsis', 'あらすじ'], ['출연', 'Cast', '出演'], ['이 감독의 다른 작품', 'More from this director', 'この監督の他の作品'],
    ['기록된 한줄평이 없습니다.', 'No review yet.', 'レビューはまだありません。'], ['기록을 찾을 수 없습니다.', 'Record not found.', '記録が見つかりません。'],
    ['링크를 복사했습니다.', 'Link copied.', 'リンクをコピーしました。'], ['아래 링크를 복사하세요.', 'Copy this link.', 'このリンクをコピーしてください。'],
    // 기록 창
    ['영화 기록', 'Log a film', '映画を記録'], ['기록 수정', 'Edit entry', '記録を編集'], ['보고 싶은 영화 추가', 'Add to watchlist', '観たい映画を追加'],
    ['보고 싶은 영화 수정', 'Edit watchlist entry', '観たい映画を編集'], ['영화 찾기', 'Find a film', '映画を探す'], ['제목을 입력하세요', 'Enter a title', 'タイトルを入力'],
    ['제목', 'Title', 'タイトル'], ['연도', 'Year', '公開年'], ['본 날짜', 'Date watched', '鑑賞日'], ['리뷰', 'Review', 'レビュー'],
    ['스릴러/드라마', 'Thriller/Drama', 'スリラー/ドラマ'], ['목록에서 제거', 'Remove', 'リストから削除'], ['선택', 'Choose', '選択'],
    ['다시 본 기록', 'Rewatch', '再鑑賞'], ['다시 본 날짜', 'Date rewatched', '再鑑賞日'], ['이번 평점', 'This rating', '今回の評価'],
    ['이번 감상 (선택)', 'Notes (optional)', '今回の感想(任意)'], ['감상 (선택)', 'Notes (optional)', '感想(任意)'],
    ['대표 평점도 이 점수로 바꾸기', 'Also make this the main rating', '代表評価もこの点数にする'], ['관람 날짜', 'Date watched', '鑑賞日'],
    ['날짜 선택', 'Choose a date', '日付を選択'], ['오늘', 'Today', '今日'], ['연도와 월 고르기', 'Choose year and month', '年と月を選ぶ'],
    ['날짜 보기로 돌아가기', 'Back to days', '日付表示に戻る'], ['이전 달', 'Previous month', '前の月'], ['다음 달', 'Next month', '次の月'],
    ['이전 해', 'Previous year', '前の年'], ['다음 해', 'Next year', '次の年'],
    ['일', 'Su', '日'], ['월', 'Mo', '月'], ['화', 'Tu', '火'], ['수', 'We', '水'], ['목', 'Th', '木'], ['금', 'Fr', '金'], ['토', 'Sa', '土'],
    ['관리자 로그인', 'Admin login', '管理者ログイン'], ['이메일', 'Email', 'メール'], ['비밀번호', 'Password', 'パスワード'],
    // 알림
    ['저장했습니다.', 'Saved.', '保存しました。'], ['삭제했습니다.', 'Deleted.', '削除しました。'],
    ['저장하지 못했습니다. 로그인 상태를 확인해주세요.', 'Couldn’t save. Check that you are logged in.', '保存できませんでした。ログイン状態を確認してください。'],
    ['삭제하지 못했습니다. 로그인 상태를 확인해주세요.', 'Couldn’t delete. Check that you are logged in.', '削除できませんでした。ログイン状態を確認してください。'],
    ['삭제하지 못했습니다.', 'Couldn’t delete.', '削除できませんでした。'], ['평점을 골라주세요.', 'Choose a rating.', '評価を選んでください。'],
    ['날짜를 골라주세요.', 'Choose a date.', '日付を選んでください。'], ['본 날짜를 골라주세요.', 'Choose the date watched.', '鑑賞日を選んでください。'],
    ['영화 제목을 입력해주세요.', 'Enter the film title.', '映画のタイトルを入力してください。'], ['개봉 연도를 입력해주세요.', 'Enter the release year.', '公開年を入力してください。'],
    ['이미 보고 싶은 영화에 있습니다.', 'Already on your watchlist.', 'すでに観たい映画にあります。'], ['이미 본 영화로 기록되어 있습니다.', 'Already logged as watched.', 'すでに観た映画として記録されています。'],
    ['재관람을 기록했습니다.', 'Rewatch logged.', '再鑑賞を記録しました。'], ['회차 기록을 수정했습니다.', 'Viewing updated.', '鑑賞記録を更新しました。'],
    ['이 재관람 기록을 삭제할까요?', 'Delete this rewatch?', 'この再鑑賞の記録を削除しますか？'], ['로그인에 실패했습니다.', 'Login failed.', 'ログインに失敗しました。'],
    ['로그아웃할까요?', 'Log out?', 'ログアウトしますか？'], ['검색 중 오류가 발생했습니다.', 'Search failed.', '検索中にエラーが発生しました。'],
    ['데이터를 불러오지 못했습니다. 잠시 후 새로고침해주세요.', 'Couldn’t load data. Please refresh in a moment.', 'データを読み込めませんでした。しばらくしてから再読み込みしてください。'],
    ['포스터를 복구할까요?', 'Fix posters?', 'ポスターを修復しますか？'], ['모든 영화의 출연진이 저장되어 있습니다.', 'Cast is saved for every film.', 'すべての映画のキャストが保存されています。'],
    ['TMDB와 연결할까요? 줄거리와 출연진을 보여주는 데 필요합니다.', 'Link with TMDB? It is needed for synopses and cast.', 'TMDBと連携しますか？あらすじとキャストの表示に必要です。'],
    ['데이터를 정리할까요? 제목의 따옴표를 지우고 장르와 감독 표기를 통일합니다.', 'Clean up data? This removes quotes from titles and unifies genre and director names.', 'データを整理しますか？タイトルの引用符を消し、ジャンルと監督の表記を統一します。'],

    // ---------- Games ----------
    ['직접 만든 웹 게임입니다. 설치 없이 바로 할 수 있습니다.', 'Small web games I made. Play right in your browser.', '自作のウェブゲームです。インストール不要ですぐ遊べます。'],
    ['직접 만든 웹 게임: 사과 게임, 십이장기, 지뢰찾기', 'Web games: Apple Game, Sibi Janggi, Minesweeper', 'ウェブゲーム：りんごゲーム、十二将棋、マインスイーパー'],
    ['사과 게임', 'Apple Game', 'りんごゲーム'], ['십이장기', 'Sibi Janggi', '十二将棋'], ['지뢰찾기', 'Minesweeper', 'マインスイーパー'],
    ['숫자가 적힌 사과를 드래그로 묶어 합이 10이 되면 수확합니다. 120초 안에 180개를 모두 따는 게 목표입니다.', 'Drag a box around numbered apples. If they add up to 10, you harvest them. Try to pick all 180 in 120 seconds.', '数字の書かれたりんごをドラッグで囲み、合計が10になると収穫できます。120秒で180個すべて収穫するのが目標です。'],
    ['시간', 'Time', '時間'], ['120초', '120 s', '120秒'], ['조작', 'Controls', '操作'], ['마우스 드래그, PC 전용', 'Mouse drag, PC only', 'マウスでドラッグ（PC専用）'],
    ['최고 기록', 'Best', 'ベスト記録'], ['시작하기', 'Play', 'プレイ'], ['아직 없음', 'None yet', 'まだなし'],
    ['3×4 칸 판에서 말 네 개로 두는 미니 장기입니다. 상대 왕을 잡거나 내 왕이 상대 진영 끝에서 한 턴을 버티면 이깁니다.', 'A mini janggi on a 3×4 board with four pieces each. Win by capturing the enemy king or by keeping your king on the far row for a full turn.', '3×4の盤で4つの駒を使うミニ将棋です。相手の王を取るか、自分の王が相手陣の端で1ターン耐えれば勝ちです。'],
    ['인원', 'Players', '人数'], ['1~2명', '1–2', '1〜2人'], ['방식', 'Modes', 'モード'], ['한 기기 2인, AI 대전, 온라인 대전', 'Two on one device, vs AI, online', '1台で2人、AI対戦、オンライン対戦'],
    ['숫자를 단서로 지뢰가 없는 칸을 모두 엽니다. 항상 추리만으로 풀 수 있는 판이 나오고, 첫 클릭 주변은 안전합니다.', 'Use the numbers to open every safe square. Every board can be solved by logic alone, and your first click is always safe.', '数字を手がかりに地雷のないマスをすべて開けます。必ず推理だけで解ける盤が出て、最初のクリックの周りは安全です。'],
    ['난이도', 'Difficulty', '難易度'], ['초급, 중급, 고급, 최상급', 'Beginner, Intermediate, Expert, Master', '初級・中級・上級・超上級'],
    ['Films로 가기', 'Go to Films', 'Films へ'], ['숫자 사과 판 예시', 'Example apple board', 'りんご盤の例'], ['3×4 십이장기 판 예시', 'Example 3×4 board', '3×4盤の例'], ['지뢰찾기 판 예시', 'Example minesweeper board', 'マインスイーパー盤の例'],
    // 사과 게임
    ['합이 10이 되도록 사과를 묶어 120초 안에 180개를 모두 수확하세요.', 'Group apples that add up to 10 and harvest all 180 in 120 seconds.', '合計10になるようにりんごを囲み、120秒で180個すべて収穫しましょう。'],
    ['닉네임 입력 (최대 15자)', 'Nickname (up to 15)', 'ニックネーム（15文字まで）'], ['게임 시작', 'Start', 'スタート'], ['기록 확인', 'Records', '記録を見る'],
    ['기록', 'Records', '記録'], ['역대 TOP 10', 'All-time top 10', '歴代トップ10'], ['최근 기록 10', 'Latest 10', '最近の10件'], ['뒤로 가기', 'Back', '戻る'],
    ['명예의 전당', 'Hall of Fame', '殿堂入り'], ['축하합니다! 모든 사과를 수확했습니다.', 'Congratulations! You harvested every apple.', 'おめでとうございます！すべてのりんごを収穫しました。'],
    ['메인으로', 'Main menu', 'メインへ'], ['게임 종료', 'Game over', 'ゲーム終了'], ['님의 점수:', '’s score:', 'さんのスコア:'], ['다시 하기', 'Play again', 'もう一度'],
    ['플레이어:', 'Player:', 'プレイヤー:'], ['점수', 'Score', 'スコア'], ['시작!', 'Go!', 'スタート！'], ['클리어 타임 기록:', 'Clear time:', 'クリアタイム:'], ['남은 시간:', 'Time left:', '残り時間:'],
    ['데이터를 불러오는 중... ⏳', 'Loading…', '読み込み中…'], ['아직 기록이 없습니다.', 'No records yet.', 'まだ記録がありません。'], ['기록을 불러올 수 없습니다.', 'Couldn’t load records.', '記録を読み込めません。'],
    ['닉네임을 입력해주세요!', 'Please enter a nickname!', 'ニックネームを入力してください！'], ['개발 지원: Gemini', 'Development help: Gemini', '開発協力: Gemini'],
    // 십이장기
    ['3×4 판에서 두는 미니 장기', 'Mini janggi on a 3×4 board', '3×4の盤で指すミニ将棋'], ['둘이서 두기', 'Two players', '2人で対戦'], ['한 기기에서 번갈아', 'Take turns on one device', '1台で交互に'],
    ['AI와 두기', 'Play the AI', 'AIと対戦'], ['혼자', 'Solo', '1人'], ['친구와 온라인 대전', 'Play a friend online', '友達とオンライン対戦'], ['초대 링크 만들기', 'Create an invite link', '招待リンクを作成'],
    ['연결 중입니다... 잠시만 기다려주세요.', 'Connecting… please wait.', '接続中です…しばらくお待ちください。'], ['방이 생성되었습니다!', 'Room created!', '部屋を作成しました！'],
    ['아래 링크를 친구에게 보내주세요.', 'Send this link to a friend.', 'このリンクを友達に送ってください。'], ['장군!', 'Check!', '王手！'], ['금수!', 'Illegal move!', '禁じ手！'],
    ['P2 보유 말', 'P2 captures', 'P2の持ち駒'], ['P1 보유 말', 'P1 captures', 'P1の持ち駒'], ['적진 끝줄엔 바로 놓을 수 없습니다.', 'You can’t drop a piece on the far row.', '敵陣の端には直接置けません。'],
    ['적의 왕을 쟁취했습니다.', 'You captured the enemy king.', '敵の王を取りました。'], ['왕이 적진에서 턴을 무사히 버텨냈습니다.', 'The king held the far row for a full turn.', '王が敵陣で1ターン耐えきりました。'],
    ['상대에게 완벽한 외통수를 가했습니다.', 'Checkmate.', '詰みです。'],
    // 지뢰찾기
    ['추측 없이 모드: 숫자만 보고 끝까지 풀 수 있는 판이 나옵니다. 처음엔 표시된 칸을 눌러 시작하세요.', 'No-guess mode: every board can be solved from the numbers alone. Start by clicking the marked square.', '推測なしモード：数字だけで最後まで解ける盤が出ます。最初は印のついたマスをクリックしてください。'],
    ['초급', 'Beginner', '初級'], ['중급', 'Intermediate', '中級'], ['고급', 'Expert', '上級'], ['최상급', 'Master', '超上級'],
    ['게임으로 돌아가기', 'Back to game', 'ゲームに戻る'], ['클라우드에서 기록을 불러오는 중...', 'Loading records…', '記録を読み込み中…'],
    ['기록을 불러오지 못했습니다. DB 설정을 확인해주세요.', 'Couldn’t load records.', '記録を読み込めませんでした。']
  ]);

  const GENRE = {
    'SF': ['Sci-fi', 'SF'], '로맨스': ['Romance', 'ロマンス'], '드라마': ['Drama', 'ドラマ'], '액션': ['Action', 'アクション'],
    '애니메이션': ['Animation', 'アニメ'], '모험': ['Adventure', 'アドベンチャー'], '판타지': ['Fantasy', 'ファンタジー'], '범죄': ['Crime', '犯罪'],
    '느와르': ['Noir', 'ノワール'], '코미디': ['Comedy', 'コメディ'], '스릴러': ['Thriller', 'スリラー'], '미스터리': ['Mystery', 'ミステリー'],
    '사극': ['Period drama', '時代劇'], '전쟁': ['War', '戦争'], '공포': ['Horror', 'ホラー'], '오컬트': ['Occult', 'オカルト'], '역사': ['History', '歴史'],
    '뮤지컬': ['Musical', 'ミュージカル'], '음악': ['Music', '音楽'], '가족': ['Family', 'ファミリー'], '다큐멘터리': ['Documentary', 'ドキュメンタリー'],
    '서부': ['Western', '西部劇'], '스포츠': ['Sports', 'スポーツ'], '로맨틱코미디': ['Romantic comedy', 'ラブコメ'], '기타': ['Other', 'その他']
  };
  const genreWord = g => (GENRE[g] ? GENRE[g][lang === 'ja' ? 1 : 0] : null);

  /* ---------- 영화 제목과 사람 이름 (Films가 TMDB에서 받아 채움) ---------- */
  const NAMES = new Map();
  const name = s => NAMES.get(s) || s;

  /* ---------- 숫자가 들어가는 문구 ---------- */
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WD = { '일': ['Sun', '日'], '월': ['Mon', '月'], '화': ['Tue', '火'], '수': ['Wed', '水'], '목': ['Thu', '木'], '금': ['Fri', '金'], '토': ['Sat', '土'] };
  const films = n => (lang === 'ja' ? `${n}本` : `${n} ${+n === 1 ? 'film' : 'films'}`);
  const times = n => (lang === 'ja' ? `${n}回` : `${n}×`);
  const pick = (en, ja) => (lang === 'ja' ? ja : en);

  const RULES = [
    [/^(\d{4})년 (\d{1,2})월 (\d{1,2})일 (.)요일$/, m => pick(`${WD[m[4]][0]}, ${MON[m[2] - 1]} ${m[3]}, ${m[1]}`, `${m[1]}年${m[2]}月${m[3]}日（${WD[m[4]][1]}）`)],
    [/^(\d{4})년 (\d{1,2})월 (\d+)편$/, m => pick(`${MONTH[m[2] - 1]} ${m[1]}: ${m[3]}`, `${m[1]}年${m[2]}月 ${m[3]}本`)],
    [/^(\d{4})년 (\d{1,2})월에 본 영화 (\d+)편$/, m => pick(`${films(m[3])} in ${MONTH[m[2] - 1]} ${m[1]}`, `${m[1]}年${m[2]}月に観た映画 ${m[3]}本`)],
    [/^(\d{4})년 (\d{1,2})월$/, m => pick(`${MONTH[m[2] - 1]} ${m[1]}`, `${m[1]}年${m[2]}月`)],
    [/^(\d{4})년$/, m => pick(m[1], `${m[1]}年`)],
    [/^(\d{2})년$/, m => pick(`’${m[1]}`, `${m[1]}年`)],
    [/^(\d{1,2})월$/, m => pick(MON[m[1] - 1], `${m[1]}月`)],
    [/^(\d{4})년대$/, m => pick(`${m[1]}s`, `${m[1]}年代`)],
    [/^(\d{4})년 개봉$/, m => pick(`Released ${m[1]}`, `${m[1]}年公開`)],
    [/^(\d+)편$/, m => films(m[1])],
    [/^총 (\d+)편$/, m => pick(films(m[1]), `全${m[1]}本`)],
    [/^(\d+)편, 평균$/, m => pick(`${films(m[1])}, avg`, `${m[1]}本・平均`)],
    [/^(\d+)번$/, m => pick(`${m[1]} times`, `${m[1]}回`)],
    [/^(\d+)회$/, m => times(m[1])],
    [/^(.+) (\d+)회차 수정$/, m => pick(`Edit viewing ${m[2]}: ${name(m[1])}`, `${name(m[1])} ${m[2]}回目を編集`)],
    [/^(\d+)회차 수정$/, m => pick(`Edit viewing ${m[1]}`, `${m[1]}回目を編集`)],
    [/^나머지 (\d+)편 더 보기$/, m => pick(`See ${m[1]} more`, `残り${m[1]}本を見る`)],
    [/^가장 높게 준 평점 ★ ([\d.]+)$/, m => pick(`Highest rating ★ ${m[1]}`, `最高評価 ★${m[1]}`)],
    [/^(\d{4}\.\d{2}\.\d{2}) 재관람$/, m => pick(`${m[1]} rewatch`, `${m[1]} 再鑑賞`)],
    [/^(\d+)번째 영화$/, m => pick(`Film ${m[1]}`, `${m[1]}本目`)],
    [/^'(.+)' 검색 결과$/, m => pick(`Results for ‘${m[1]}’`, `「${m[1]}」の検索結果`)],
    [/^(.+) 다시 본 기록$/, m => pick(`Rewatch: ${name(m[1])}`, `${name(m[1])} の再鑑賞`)],
    [/^(.+)에서 볼 수 있음$/, m => pick(`Available on ${m[1]}`, `${m[1]}で視聴可能`)],
    [/^(.+), 평점 ([\d.]+)$/, m => pick(`${name(m[1])}, rated ${m[2]}`, `${name(m[1])}、評価 ${m[2]}`)],
    [/^(.+) 수정$/, m => pick(`Edit ${name(m[1])}`, `${name(m[1])}を編集`)],
    [/^감독 (.+)$/, m => pick(`Director: ${name(m[1])}`, `監督: ${name(m[1])}`)],
    [/^출연 (.+)$/, m => pick(`Cast: ${m[1]}`, `出演: ${m[1]}`)],
    [/^장르 (.+)$/, m => pick(`Genre: ${genreWord(m[1]) || m[1]}`, `ジャンル: ${genreWord(m[1]) || m[1]}`)],
    [/^국가 (.+)$/, m => pick(`Country: ${tr(m[1])}`, `国: ${tr(m[1])}`)],
    [/^(\d{4}|), (.+)$/, m => `${m[1]}, ${name(m[2])}`],
    [/^(.+) \| Films\.$/, m => `${name(m[1])} | Films.`],
    [/^([^.]+)\. (.+ \d+편(?:, .+ \d+편)*)$/, m => `${tr(m[1])}. ${m[2].split(', ').map(tr).join(', ')}`],
    [/^(.+) 감독$/, m => pick(`Dir. ${name(m[1])}`, `${name(m[1])} 監督`)],
    [/^(.+) {2}★ ([\d.]+) {2}(\d{4}-\d{2}-\d{2})$/, m => `${name(m[1])}  ★ ${m[2]}  ${m[3]}`],
    [/^(.+) \((\d+)\)$/, m => `${tr(m[1])} (${m[2]})`],
    [/^(.+) (\d+)편$/, m => pick(`${tr(m[1])}: ${m[2]}`, `${tr(m[1])} ${m[2]}本`)],
    [/^(.+) (\d+)번$/, m => pick(`${tr(m[1])}: ${m[2]}`, `${tr(m[1])} ${m[2]}回`)],
    // 게임
    [/^(.+) \| cheezetomato$/, m => `${tr(m[1])} | cheezetomato`],
    [/^(\d{1,2})월 (\d{1,2})일 (.)요일$/, m => pick(`${WD[m[3]][0]}, ${MON[m[1] - 1]} ${m[2]}`, `${m[1]}月${m[2]}日（${WD[m[3]][1]}）`)],
    [/^(\d+\.\d)점$/, m => pick(`${m[1]} stars`, `${m[1]}点`)],
    [/^(\d+)점 \((.+)\)$/, m => pick(`${m[1]} pts (${m[2]})`, `${m[1]}点（${m[2]}）`)],
    [/^(\d+)점$/, m => pick(`${m[1]} pts`, `${m[1]}点`)],
    [/^(\d+)위$/, m => pick(`#${m[1]}`, `${m[1]}位`)],
    [/^([\d.]+)초$/, m => pick(`${m[1]} s`, `${m[1]}秒`)],
    [/^(.+ [\d.]+초)((?:, .+ [\d.]+초)+)$/, m => [m[1], ...m[2].slice(2).split(', ')].map(tr).join(pick(', ', '、'))],
    [/^(초급|중급|고급|최상급) ([\d.]+)초$/, m => pick(`${tr(m[1])} ${m[2]} s`, `${tr(m[1])} ${m[2]}秒`)],
    [/^(.+) 최고 ([\d.]+)초$/, m => pick(`${tr(m[1])} best ${m[2]} s`, `${tr(m[1])} ベスト${m[2]}秒`)],
    [/^최고 (\d+)점$/, m => pick(`Best ${m[1]} pts`, `ベスト${m[1]}点`)],
    [/^Player (\d)의 턴(?: \((당신|상대)\))?$/, m => pick(`Player ${m[1]}’s turn${m[2] ? (m[2] === '당신' ? ' (you)' : ' (opponent)') : ''}`, `Player ${m[1]}の番${m[2] ? (m[2] === '당신' ? '（あなた）' : '（相手）') : ''}`)],
    [/^(P\d) (?:최종 )?승리!$/, m => pick(`${m[1]} wins!`, `${m[1]}の勝ち！`)],
    [/^(P\d) 패배$/, m => pick(`${m[1]} loses`, `${m[1]}の負け`)],
    [/^승리하셨습니다! 기록: (\d+)초$/, m => pick(`You win! Time: ${m[1]} s`, `クリア！記録: ${m[1]}秒`)],
    [/^기획: (.+)$/, m => { const who = m[1] === '그린토마토' ? pick('Green Tomato', 'グリーントマト') : m[1]; return pick(`Concept: ${who}`, `企画: ${who}`); }]
  ];

  // 장르 묶음: "스릴러/드라마", "로맨스, 드라마"
  function genreList(s) {
    const parts = s.split(/(\s*\/\s*|,\s*)/);
    const out = parts.map((p, i) => (i % 2 ? p : genreWord(p.trim())));
    return out.every(x => x != null) ? out.join('') : null;
  }

  // 영어로 된 제목 중 일본어로만 바꾸는 것 (Recently watched 등)
  const needs = v => !!v && (HANGUL.test(v) || (lang === 'ja' && EXACT[v.trim()] !== undefined));
  function tr(s) {
    if (lang === 'ko' || !needs(s)) return s;
    const t = s.trim();
    if (!HANGUL.test(t)) { const e = EXACT[t]; return e ? s.replace(t, e[lang]) : s; }
    let out = NAMES.has(t) ? NAMES.get(t) : (EXACT[t] ? EXACT[t][lang] : undefined);
    if (out === undefined) out = genreList(t) ?? undefined;
    if (out === undefined) {
      for (const [re, fn] of RULES) { const m = t.match(re); if (m) { out = fn(m); break; } }
    }
    if (out === undefined || out === null) return s;
    return s.replace(t, out);
  }
  // 줄바꿈이 있는 알림은 줄마다
  const trLines = s => String(s).split('\n').map(tr).join('\n');

  /* ---------- 화면 적용 ---------- */
  const ATTRS = ['placeholder', 'aria-label', 'title'];
  function skip(el) { return !!(el && el.closest && el.closest(SKIP)); }
  // 원래 한국어를 기억해 두고, 이름이 나중에 도착하면 원문에서 다시 번역
  const ORIG = new WeakMap(), LAST = new WeakMap();
  function source(key, v) {
    const last = LAST.get(key);
    return last !== undefined && v === last ? ORIG.get(key) : v;
  }
  function doText(node) {
    const v = node.nodeValue;
    const o = source(node, v);
    if (!needs(o) || skip(node.parentElement)) return;
    const t = tr(o);
    ORIG.set(node, o); LAST.set(node, t);
    if (t !== v) node.nodeValue = t;
  }
  const attrKeys = new WeakMap();
  // 입력칸 자체의 값은 안 건드리되, 안내 문구(placeholder)와 이름표는 바꿈
  const ATTR_SKIP = '[data-i18n-skip], .lang-pick';
  function doAttrs(el) {
    if (el.closest && el.closest(ATTR_SKIP)) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v == null) continue;
      let keys = attrKeys.get(el);
      if (!keys) { keys = {}; attrKeys.set(el, keys); }
      const key = keys[a] || (keys[a] = {});
      const o = source(key, v);
      if (!needs(o)) continue;
      const t = tr(o);
      ORIG.set(key, o); LAST.set(key, t);
      if (t !== v) el.setAttribute(a, t);
    }
  }
  function walk(root) {
    if (lang === 'ko' || !root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { doAttrs(root); if (skip(root) && !root.querySelector('[placeholder],[aria-label],[title]')) return; }
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function doTitle() { const t = tr(document.title); if (t !== document.title) document.title = t; }

  if (lang !== 'ko') {
    // 알림창도 바꿔서 보여주기
    const A = window.alert.bind(window), C = window.confirm.bind(window), P = window.prompt.bind(window);
    window.alert = msg => A(trLines(msg));
    window.confirm = msg => C(trLines(msg));
    window.prompt = (msg, d) => P(trLines(msg), d);
  }

  function start() {
    document.documentElement.lang = lang;
    renderPickers();
    if (lang === 'ko') return;
    walk(document.body); doTitle();
    new MutationObserver(list => {
      for (const r of list) {
        if (r.type === 'childList') r.addedNodes.forEach(walk);
        else if (r.type === 'characterData') doText(r.target);
        else if (r.type === 'attributes') doAttrs(r.target);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    const titleEl = document.querySelector('title');
    if (titleEl) new MutationObserver(doTitle).observe(titleEl, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- 언어 선택 ---------- */
  function renderPickers() {
    document.querySelectorAll('[data-lang-slot]').forEach(slot => {
      if (slot.dataset.ready) return;
      slot.dataset.ready = '1';
      slot.classList.add('lang-pick');
      slot.innerHTML = `<label><span>Language</span><select aria-label="Language">${LANGS.map(([k, n]) => `<option value="${k}"${k === lang ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
      slot.querySelector('select').addEventListener('change', e => {
        try { localStorage.setItem(KEY, e.target.value); } catch (err) { /* 저장 공간 없음 */ }
        location.reload();
      });
    });
  }

  window.I18N = {
    lang,
    tmdbLang: { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP' }[lang],
    t: tr,
    addNames(map) {
      let changed = false;
      for (const [k, v] of Object.entries(map)) { if (k && v && !HANGUL.test(v) && NAMES.get(k) !== v) { NAMES.set(k, v); changed = true; } }
      if (changed && lang !== 'ko' && document.body) { walk(document.body); doTitle(); }
    },
    refresh() { walk(document.body); doTitle(); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
