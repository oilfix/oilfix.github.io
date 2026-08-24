# OILFIX 공식 홈페이지

GitHub Pages에 바로 올릴 수 있는 정적 웹사이트입니다.

## 파일 구성

- `index.html` : 사이트 본문
- `styles.css` : 디자인 / 모바일 대응 / 애니메이션
- `script.js` : 메뉴 / 지원 팝업 / 스크롤 효과 / BGM
- `site-config.js` : 지원서 링크 등 자주 바꿀 설정
- `assets/logo.svg` : 로고
- `assets/favicon.svg` : 브라우저 아이콘
- `assets/oilfix-bgm.mp3` : 자체 생성된 짧은 무가사 BGM

## 1. 지원서 주소 연결

`site-config.js` 파일을 열고 다음 부분에 실제 주소를 넣습니다.

```js
applicationUrl: "https://forms.gle/여기에-주소",
```

구글폼, 디스코드 지원 페이지, 별도 지원 사이트 등 HTTPS 주소라면 연결 가능합니다.

## 2. GitHub Pages 배포

1. GitHub에서 새 저장소를 만듭니다.
2. 이 폴더 안의 파일을 전부 저장소 최상위에 업로드합니다.
3. 저장소 `Settings` → `Pages`로 이동합니다.
4. `Build and deployment` → `Source`를 `Deploy from a branch`로 선택합니다.
5. Branch를 `main`, 폴더를 `/(root)`로 설정하고 저장합니다.
6. 잠시 후 Pages 주소가 생성됩니다.

저장소 이름을 `사용자아이디.github.io`로 만들면 루트 주소로 운영할 수 있습니다.
일반 저장소명(`oilfix` 등)을 쓰면 보통 `https://사용자아이디.github.io/oilfix/` 형태입니다.

## 3. 내용 수정

텍스트는 대부분 `index.html`에서 검색 후 바꾸면 됩니다.

추천 검색어:
- `20만원 / 1L`
- `CURRENT CREW`
- `대표이사`
- `등록 사유`
- `지원서 OPEN`

## 4. BGM 교체

원하는 MP3를 `assets/oilfix-bgm.mp3` 이름으로 덮어쓰면 됩니다.
브라우저 정책상 BGM은 방문자가 `BGM ON` 버튼을 눌러야 재생됩니다.

## 주의

GitHub Pages에 올린 내용은 인터넷에 공개될 수 있으므로 개인정보, 비밀번호, 관리자 토큰,
Discord 봇 토큰 같은 민감한 값은 절대 HTML/JS 파일에 넣지 마세요.


## OILFIX 자체 지원서 페이지

`apply.html`이 추가되었습니다. 메인 홈페이지의 `지원서 OPEN` 버튼은 자동으로 이 페이지로 이동합니다.

지원서 접수 내용을 실제로 저장하려면:

1. Google Sheets에서 새 스프레드시트를 만듭니다.
2. `확장 프로그램` → `Apps Script`를 엽니다.
3. 이 ZIP에 포함된 `google-apps-script.gs` 내용을 전부 붙여넣습니다.
4. Apps Script에서 `배포` → `새 배포` → `웹 앱`을 선택합니다.
5. 실행 사용자는 `나`, 액세스 권한은 지원자가 사용할 수 있도록 `모든 사용자`로 설정합니다.
6. 배포 후 생성된 `https://script.google.com/macros/s/.../exec` 주소를 복사합니다.
7. `site-config.js`에서 아래 항목에 붙여넣습니다.

```js
applicationEndpoint: "https://script.google.com/macros/s/여기에주소/exec",
```

이후 제출된 지원서는 Google Sheet의 `지원서` 시트에 행 단위로 자동 저장됩니다.

> 주의: Google 계정 및 Apps Script 배포 권한은 사이트 소유자가 직접 승인해야 합니다.
