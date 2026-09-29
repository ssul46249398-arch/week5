/**
 * 바이브 카페 타입 정의
 * @license Apache-2.0
 */

// 음료 메뉴 아이템 인터페이스
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'coffee' | 'latte' | 'tea';
  description?: string;
}

// 컵 사이즈 정의 (S: 0원, M: +500원 기본, L: +1,000원)
export type CupSize = 'S' | 'M' | 'L';

export interface SizeOption {
  size: CupSize;
  label: string;
  extraPrice: number;
}

// 추가 옵션 정의
export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

// 주문서 폼 상태 인터페이스
export interface OrderFormState {
  customerName: string;
  phoneNumber: string;
  selectedDrinkId: string;
  selectedSize: CupSize;
  selectedOptions: string[]; // 추가 옵션 id 배열
  quantity: number;
  specialRequests: string;
}

// 접수된 주문 데이터 인터페이스 (Supabase cafe_menu 테이블 구조와 일치)
export interface CafeOrder {
  id: string;
  customer_name: string;      // 이름 (필수)
  phone_number: string;       // 전화번호
  drink_name: string;         // 음료 이름
  drink_price: number;        // 음료 기본가
  cup_size: CupSize;          // 사이즈 (S, M, L)
  size_price: number;         // 사이즈 추가금
  extra_options: string[];    // 선택된 추가 옵션 목록
  extra_price: number;        // 옵션 추가금 합계
  quantity: number;           // 수량 (1~10)
  total_price: number;        // 총 결제 금액
  special_requests: string;   // 요청사항
  status: '접수완료' | '제조중' | '픽업대기' | '완료'; // 주문 상태
  created_at: string;         // 주문 접수 시간 (ISO 문자열)
}
