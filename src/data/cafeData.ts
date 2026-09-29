/**
 * 바이브 카페 기초 데이터 및 Supabase SQL 쿼리 정의
 * @license Apache-2.0
 */

import { MenuItem, SizeOption, ExtraOption, CafeOrder } from '../types/cafe';

// [1] 음료 메뉴 목록 (요청사항 기준 5종)
export const DRINK_MENU: MenuItem[] = [
  { id: 'americano', name: '아메리카노', price: 3500, category: 'coffee', description: '깊고 진한 에스프레소와 깔끔한 물의 조화' },
  { id: 'latte', name: '카페라떼', price: 4000, category: 'coffee', description: '풍부한 에스프레소에 부드러운 스팀밀크' },
  { id: 'mocha', name: '카페모카', price: 4500, category: 'coffee', description: '진한 초콜릿과 에스프레소, 부드러운 우유의 달콤한 만남' },
  { id: 'vanilla', name: '바닐라라떼', price: 4500, category: 'coffee', description: '천연 바닐라빈 시럽이 어우러진 향긋하고 달콤한 라떼' },
  { id: 'greentea', name: '녹차라떼', price: 4500, category: 'tea', description: '제주 유기농 녹차의 깊고 쌉싸름한 풍미와 우유' },
];

// [2] 사이즈 옵션 (M이 기본 선택)
export const SIZE_OPTIONS: SizeOption[] = [
  { size: 'S', label: 'S', extraPrice: 0 },
  { size: 'M', label: 'M', extraPrice: 500 },
  { size: 'L', label: 'L', extraPrice: 1000 },
];

// [3] 추가 옵션 목록
export const EXTRA_OPTIONS: ExtraOption[] = [
  { id: 'shot', name: '샷 추가', price: 500 },
  { id: 'cream', name: '크림 추가', price: 500 },
  { id: 'syrup', name: '시럽 추가', price: 300 },
  { id: 'decaf', name: '디카페인', price: 0 },
];

// [4] 초기 테스트용 가짜 주문 데이터 (게시판 확인용)
export const INITIAL_ORDERS: CafeOrder[] = [
  {
    id: 'ORDER-20260928-01',
    customer_name: '홍길동',
    phone_number: '010-1234-5678',
    drink_name: '카페라떼',
    drink_price: 4000,
    cup_size: 'M',
    size_price: 500,
    extra_options: ['샷 추가'],
    extra_price: 500,
    quantity: 1,
    total_price: 5000,
    special_requests: '우유 뜨겁게 데워주세요.',
    status: '완료',
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'ORDER-20260928-02',
    customer_name: '김바이브',
    phone_number: '010-9876-5432',
    drink_name: '바닐라라떼',
    drink_price: 4500,
    cup_size: 'L',
    size_price: 1000,
    extra_options: ['샷 추가', '크림 추가'],
    extra_price: 1000,
    quantity: 2,
    total_price: 13000,
    special_requests: '얼음 많이 넣어주세요!',
    status: '제조중',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'ORDER-20260928-03',
    customer_name: '이아영',
    phone_number: '010-5555-7777',
    drink_name: '녹차라떼',
    drink_price: 4500,
    cup_size: 'M',
    size_price: 500,
    extra_options: ['디카페인'],
    extra_price: 0,
    quantity: 1,
    total_price: 5000,
    special_requests: '덜 달게 부탁드립니다.',
    status: '접수완료',
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
];

// [5] Supabase SQL 에디터에 바로 붙여넣을 수 있는 DDL & DML 쿼리 모음
export const SUPABASE_SQL_CREATE_TABLE = `-- ==============================================================
-- 1. [Supabase] cafe_menu 테이블 생성 쿼리 (주문서 항목 기반)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.cafe_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),              -- 고유 주문 ID (UUID 자동 생성)
    customer_name TEXT NOT NULL,                               -- 고객 이름 (필수)
    phone_number TEXT,                                         -- 전화번호 (선택)
    drink_name TEXT NOT NULL,                                  -- 선택 음료 이름 (예: 아메리카노, 카페라떼)
    drink_price INTEGER NOT NULL DEFAULT 0,                    -- 음료 기본 가격 (원)
    cup_size TEXT NOT NULL DEFAULT 'M',                        -- 컵 사이즈 ('S', 'M', 'L')
    size_price INTEGER NOT NULL DEFAULT 0,                     -- 사이즈 추가 금액 (원)
    extra_options TEXT[] DEFAULT '{}',                         -- 추가 옵션 배열 (예: ['샷 추가', '크림 추가'])
    extra_price INTEGER NOT NULL DEFAULT 0,                    -- 추가 옵션 금액 합계 (원)
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 10), -- 수량 (1~10)
    total_price INTEGER NOT NULL DEFAULT 0,                    -- 총 결제/예상 금액 (원)
    special_requests TEXT,                                     -- 고객 요청사항
    status TEXT NOT NULL DEFAULT '접수완료',                    -- 주문 상태 ('접수완료', '제조중', '픽업대기', '완료')
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()) -- 주문 접수 일시
);

-- 테이블 및 컬럼 코멘트 등록 (가독성 향상)
COMMENT ON TABLE public.cafe_menu IS '바이브 카페 주문서 및 주문 내역 테이블';
COMMENT ON COLUMN public.cafe_menu.customer_name IS '주문자 성함 (필수 입력값)';
COMMENT ON COLUMN public.cafe_menu.phone_number IS '연락처';
COMMENT ON COLUMN public.cafe_menu.drink_name IS '주문 음료 명칭';
COMMENT ON COLUMN public.cafe_menu.cup_size IS '컵 사이즈 (S, M, L)';
COMMENT ON COLUMN public.cafe_menu.extra_options IS '선택된 추가 옵션 리스트';
COMMENT ON COLUMN public.cafe_menu.total_price IS '최종 계산된 총 주문 금액';

-- 조회 성능 최적화를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cafe_menu_created_at ON public.cafe_menu (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cafe_menu_status ON public.cafe_menu (status);`;

export const SUPABASE_SQL_INSERT_FAKE = `-- ==============================================================
-- 2. [Supabase] 테스트용 1건의 가짜 데이터 INSERT 쿼리
-- ==============================================================
INSERT INTO public.cafe_menu (
    customer_name,
    phone_number,
    drink_name,
    drink_price,
    cup_size,
    size_price,
    extra_options,
    extra_price,
    quantity,
    total_price,
    special_requests,
    status
) VALUES (
    '홍길동',
    '010-1234-5678',
    '카페라떼',
    4000,
    'M',
    500,
    ARRAY['샷 추가'],
    500,
    1,
    5000,
    '우유 뜨겁게 데워주세요.',
    '접수완료'
);`;

export const SUPABASE_SQL_FULL_SCRIPT = `-- ==============================================================
-- [바이브 카페] Supabase SQL Editor 실행용 전체 스크립트
-- ==============================================================

-- 1. cafe_menu 테이블 생성
CREATE TABLE IF NOT EXISTS public.cafe_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    phone_number TEXT,
    drink_name TEXT NOT NULL,
    drink_price INTEGER NOT NULL DEFAULT 0,
    cup_size TEXT NOT NULL DEFAULT 'M',
    size_price INTEGER NOT NULL DEFAULT 0,
    extra_options TEXT[] DEFAULT '{}',
    extra_price INTEGER NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 10),
    total_price INTEGER NOT NULL DEFAULT 0,
    special_requests TEXT,
    status TEXT NOT NULL DEFAULT '접수완료',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. 인덱스 설정
CREATE INDEX IF NOT EXISTS idx_cafe_menu_created_at ON public.cafe_menu (created_at DESC);

-- 3. Row Level Security(RLS) 활성화 및 공용 읽기/쓰기 정책 (개발/테스트용)
ALTER TABLE public.cafe_menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "누구나 주문 등록 가능" ON public.cafe_menu;
DROP POLICY IF EXISTS "누구나 주문 조회 가능" ON public.cafe_menu;
DROP POLICY IF EXISTS "누구나 주문 상태 변경 가능" ON public.cafe_menu;
DROP POLICY IF EXISTS "누구나 주문 삭제 가능" ON public.cafe_menu;

CREATE POLICY "누구나 주문 등록 가능" ON public.cafe_menu
    FOR INSERT WITH CHECK (true);

CREATE POLICY "누구나 주문 조회 가능" ON public.cafe_menu
    FOR SELECT USING (true);

CREATE POLICY "누구나 주문 상태 변경 가능" ON public.cafe_menu
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "누구나 주문 삭제 가능" ON public.cafe_menu
  FOR DELETE USING (true);

-- 4. 테스트용 1건 가짜 데이터 추가
INSERT INTO public.cafe_menu (
    customer_name,
    phone_number,
    drink_name,
    drink_price,
    cup_size,
    size_price,
    extra_options,
    extra_price,
    quantity,
    total_price,
    special_requests,
    status
) VALUES (
    '홍길동',
    '010-1234-5678',
    '카페라떼',
    4000,
    'M',
    500,
    ARRAY['샷 추가'],
    500,
    1,
    5000,
    '우유 뜨겁게 데워주세요.',
    '접수완료'
);

-- 5. 데이터 확인 조회
SELECT * FROM public.cafe_menu ORDER BY created_at DESC;
`;
