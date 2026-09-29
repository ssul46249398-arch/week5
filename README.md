<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# 바이브 카페 주문 게시판

## Supabase 연결

1. `src/data/cafeData.ts`의 전체 SQL 스크립트를 Supabase 프로젝트의 SQL Editor에서 실행합니다.
2. 프로젝트 API 설정에서 Project URL과 anon/publishable key를 확인합니다.
3. `.env.example`을 `.env.local`로 복사하고 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 값을 입력합니다.
4. 개발 서버를 재시작합니다.

환경 변수가 없으면 앱은 기존처럼 브라우저의 `localStorage`에 주문을 저장합니다.
현재 SQL 스크립트의 공개 RLS 정책은 데모/개발용입니다. 인증 없이 누구나 주문 조회, 변경, 삭제가 가능하므로 실제 고객 전화번호를 저장하는 운영 환경에서는 인증 및 사용자별 RLS 정책으로 교체해야 합니다.

## 로컬 실행

Node.js 설치 후 `npm install` 및 `npm run dev`를 실행합니다.
