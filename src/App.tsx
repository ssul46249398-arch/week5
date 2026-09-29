/**
 * @license Apache-2.0
 * 바이브 카페 (Vibe Cafe) - 음료 주문서 및 주문 게시판 메인 컴포넌트
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  DRINK_MENU, 
  SIZE_OPTIONS, 
  EXTRA_OPTIONS, 
  INITIAL_ORDERS 
} from './data/cafeData';
import { CafeOrder, OrderFormState } from './types/cafe';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { OrderBoard } from './components/OrderBoard';
import {
  deleteCafeOrder,
  fetchCafeOrders,
  insertCafeOrder,
  isSupabaseConfigured,
  updateCafeOrderStatus,
} from './lib/supabase';
import { 
  Coffee, 
  RotateCcw, 
  ListOrdered, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle,
  ReceiptText,
  Database,
} from 'lucide-react';

// 초기 폼 상태 상수
const INITIAL_FORM_STATE: OrderFormState = {
  customerName: '',
  phoneNumber: '',
  selectedDrinkId: '',       // 음료 미선택 상태
  selectedSize: 'M',        // 기본 선택: M사이즈 (+500원)
  selectedOptions: [],      // 추가 옵션 없음
  quantity: 1,              // 기본 수량 1개
  specialRequests: '',      // 요청사항 없음
};

export default function App() {
  // [1] 폼 입력 상태 관리
  const [formData, setFormData] = useState<OrderFormState>(INITIAL_FORM_STATE);

  // [2] 유효성 검사 경고 메시지 상태 (이름 미입력, 음료 미선택)
  const [errorMessage, setErrorMessage] = useState<string>('');

  // [3] 주문 완료 성공 메시지 상태
  const [successMessage, setSuccessMessage] = useState<string>('');

  // [4] 누적 주문 게시판 목록 (localStorage 연동)
  const [orders, setOrders] = useState<CafeOrder[]>(() => {
    try {
      const saved = localStorage.getItem('vibe_cafe_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });
  const [connectionState, setConnectionState] = useState<'local' | 'connecting' | 'connected' | 'error'>(
    isSupabaseConfigured ? 'connecting' : 'local',
  );

  // [5] 뷰 전환 및 영수증 모달 상태
  const [activeTab, setActiveTab] = useState<'order' | 'board'>('order');
  const [receiptOrder, setReceiptOrder] = useState<CafeOrder | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isActive = true;
    fetchCafeOrders()
      .then((savedOrders) => {
        if (!isActive) return;
        setOrders(savedOrders);
        setConnectionState('connected');
      })
      .catch((error: unknown) => {
        console.error('Supabase 주문 조회 실패:', error);
        if (isActive) setConnectionState('error');
      });

    return () => {
      isActive = false;
    };
  }, []);

  // Supabase 미설정 시에만 주문 목록을 로컬 스토리지에 자동 저장
  useEffect(() => {
    if (isSupabaseConfigured) return;
    try {
      localStorage.setItem('vibe_cafe_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('로컬스토리지 저장 실패:', e);
    }
  }, [orders]);

  // [6] 선택된 음료 정보 검색
  const selectedDrink = useMemo(() => {
    return DRINK_MENU.find((item) => item.id === formData.selectedDrinkId) || null;
  }, [formData.selectedDrinkId]);

  // [7] 선택된 사이즈 정보 검색
  const selectedSizeOption = useMemo(() => {
    return SIZE_OPTIONS.find((s) => s.size === formData.selectedSize) || SIZE_OPTIONS[1];
  }, [formData.selectedSize]);

  // [8] 선택된 추가 옵션들의 추가금액 합계 계산
  const extraOptionsPrice = useMemo(() => {
    return formData.selectedOptions.reduce((total, optionId) => {
      const option = EXTRA_OPTIONS.find((opt) => opt.id === optionId);
      return total + (option ? option.price : 0);
    }, 0);
  }, [formData.selectedOptions]);

  // [9] 실시간 예상 금액 계산 (음료 기본가 + 사이즈 추가금 + 옵션 합계) * 수량
  // 음료를 아직 선택하지 않은 경우 사이즈/옵션 기본값만 보이거나 0원으로 산정
  const estimatedPrice = useMemo(() => {
    const baseDrinkPrice = selectedDrink ? selectedDrink.price : 0;
    const sizeExtra = selectedSizeOption.extraPrice;
    const singleCupPrice = baseDrinkPrice + sizeExtra + extraOptionsPrice;
    return singleCupPrice * formData.quantity;
  }, [selectedDrink, selectedSizeOption, extraOptionsPrice, formData.quantity]);

  // [10] 전화번호 입력 시 자동 하이픈 포맷팅 처리
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setFormData((prev) => ({ ...prev, phoneNumber: formatted }));
  };

  // [11] 추가 옵션 체크박스 토글 핸들러
  const handleOptionToggle = (optionId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedOptions.includes(optionId);
      const updated = exists
        ? prev.selectedOptions.filter((id) => id !== optionId)
        : [...prev.selectedOptions, optionId];
      return { ...prev, selectedOptions: updated };
    });
  };

  // [12] 수량 증감 핸들러 (최소 1, 최대 10)
  const handleQuantityChange = (newQty: number) => {
    const clamped = Math.max(1, Math.min(10, newQty));
    setFormData((prev) => ({ ...prev, quantity: clamped }));
  };

  // [13] 주문하기 버튼 클릭 처리
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 유효성 검사 1: 이름이 비어있으면 경고
    if (!formData.customerName.trim()) {
      setErrorMessage('이름을 입력해주세요');
      const nameInput = document.getElementById('customerName');
      nameInput?.focus();
      return;
    }

    // 유효성 검사 2: 음료를 선택하지 않았으면 경고
    if (!formData.selectedDrinkId || !selectedDrink) {
      setErrorMessage('음료를 선택해주세요');
      const drinkSelect = document.getElementById('drinkSelect');
      drinkSelect?.focus();
      return;
    }

    // 선택된 옵션 이름들 문자열 생성
    const selectedOptionNames = formData.selectedOptions
      .map((id) => EXTRA_OPTIONS.find((opt) => opt.id === id)?.name)
      .filter(Boolean) as string[];

    const optionsText = selectedOptionNames.length > 0 
      ? `(${selectedOptionNames.join(', ')}) ` 
      : '';

    // 주문 확인 메시지 구성:
    // "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문이 접수되었습니다!"
    const confirmationText = `${formData.customerName.trim()}님, ${selectedDrink.name} ${formData.selectedSize}사이즈 ${optionsText}${formData.quantity}잔, 총 ${estimatedPrice.toLocaleString()}원 주문이 접수되었습니다!`;
    
    // 새 주문 객체 생성 (Supabase cafe_menu 컬럼 구조와 매핑)
    let newOrder: CafeOrder = {
      id: `ORDER-${Date.now().toString().slice(-6)}`,
      customer_name: formData.customerName.trim(),
      phone_number: formData.phoneNumber.trim() || '연락처 없음',
      drink_name: selectedDrink.name,
      drink_price: selectedDrink.price,
      cup_size: formData.selectedSize,
      size_price: selectedSizeOption.extraPrice,
      extra_options: selectedOptionNames,
      extra_price: extraOptionsPrice,
      quantity: formData.quantity,
      total_price: estimatedPrice,
      special_requests: formData.specialRequests.trim(),
      status: '접수완료',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        newOrder = await insertCafeOrder(newOrder);
        setConnectionState('connected');
      } catch (error) {
        console.error('Supabase 주문 등록 실패:', error);
        setConnectionState('error');
        setErrorMessage('주문 저장에 실패했습니다. Supabase 설정과 테이블 권한을 확인해주세요.');
        return;
      }
    }

    // 주문 목록(게시판)에 새 주문 추가
    setOrders((prev) => [newOrder, ...prev]);
    setSuccessMessage(confirmationText);

    // 주문 완료 모달(영수증) 표시 준비
    setReceiptOrder(newOrder);

    // 성공 메시지 영역으로 부드럽게 스크롤
    setTimeout(() => {
      document.getElementById('confirmationMessage')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  // [14] 다시 작성 버튼 클릭 처리 (모든 입력과 금액 초기화)
  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // [15] 게시판에서 주문 상태 변경
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: CafeOrder['status']) => {
    if (isSupabaseConfigured) {
      try {
        await updateCafeOrderStatus(orderId, nextStatus);
      } catch (error) {
        console.error('Supabase 주문 상태 변경 실패:', error);
        setErrorMessage('주문 상태 변경에 실패했습니다. Supabase 권한을 확인해주세요.');
        return;
      }
    }
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
    );
  };

  // [16] 게시판에서 주문 삭제
  const handleDeleteOrder = async (orderId: string) => {
    if (isSupabaseConfigured) {
      try {
        await deleteCafeOrder(orderId);
      } catch (error) {
        console.error('Supabase 주문 삭제 실패:', error);
        setErrorMessage('주문 삭제에 실패했습니다. Supabase 권한을 확인해주세요.');
        return;
      }
    }
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#3e2723] py-8 px-4 flex flex-col items-center">
      {/* ============================================================== */}
      {/* 메인 컨테이너 (최대 너비 520px, 가운데 정렬) */}
      {/* ============================================================== */}
      <main className="w-full max-w-[520px] mx-auto space-y-5">

        <div className="flex items-center justify-center gap-1.5 text-xs text-[#6d4c41]">
          <Database className="w-3.5 h-3.5" />
          <span>
            {connectionState === 'connecting' && 'Supabase 연결 중'}
            {connectionState === 'connected' && 'Supabase 연결됨'}
            {connectionState === 'error' && 'Supabase 연결 오류'}
            {connectionState === 'local' && '로컬 저장 모드'}
          </span>
        </div>

        {/* 상단 탭 네비게이션 */}
        <div className="flex items-center justify-center text-xs px-1">
          <div className="flex items-center gap-1.5 p-1 bg-[#efebe9]/80 rounded-xl border border-[#d7ccc8]/70">
            <button
              onClick={() => setActiveTab('order')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'order'
                  ? 'bg-white text-[#6b4226] font-bold shadow-xs'
                  : 'text-[#6d4c41] hover:text-[#3e2723]'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>주문하기</span>
            </button>
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 relative ${
                activeTab === 'board'
                  ? 'bg-white text-[#6b4226] font-bold shadow-xs'
                  : 'text-[#6d4c41] hover:text-[#3e2723]'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>주문 게시판</span>
              {orders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-[#6b4226] text-white text-[10px] rounded-full">
                  {orders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* [페이지 상단 헤더] 카페 로고, 카페 이름, 부제 */}
        {/* ============================================================== */}
        <header className="text-center pt-2 pb-1 space-y-1">
          {/* 카페 로고: ☕ 이모지 크게 */}
          <div className="text-5xl inline-block transition-transform hover:scale-110 cursor-default select-none animate-bounce duration-1000">
            ☕
          </div>
          {/* 카페 이름: "바이브 카페" */}
          <h1 className="text-3xl font-extrabold tracking-tight text-[#4e342e]">
            바이브 카페
          </h1>
          {/* 부제: "당신의 하루에 바이브를 더하다" */}
          <p className="text-sm font-medium text-[#8d6e63]">
            당신의 하루에 바이브를 더하다
          </p>
        </header>

        {/* ============================================================== */}
        {/* 탭 1: 주문서 작성 폼 */}
        {/* ============================================================== */}
        {activeTab === 'order' && (
          <section aria-labelledby="order-form-title">
            <h2 id="order-form-title" className="sr-only">음료 주문서</h2>
            
            <form
              onSubmit={handleOrderSubmit}
              noValidate
              className="bg-[#ffffff] rounded-2xl p-6 shadow-sm border border-[#e0d6ce] space-y-5"
            >
              {/* 1. 이름 (필수, text) */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="customerName" 
                  className="block text-sm font-bold text-[#4e342e]"
                >
                  1. 주문자 성함 <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  value={formData.customerName}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, customerName: e.target.value }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="cafe-input text-sm text-[#3e2723] placeholder:text-[#a1887f]/70"
                />
              </div>

              {/* 2. 전화번호 (tel) */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="phoneNumber" 
                  className="block text-sm font-bold text-[#4e342e]"
                >
                  2. 전화번호
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  className="cafe-input text-sm text-[#3e2723] placeholder:text-[#a1887f]/70"
                />
              </div>

              {/* 3. 음료 선택 (드롭다운) */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="drinkSelect" 
                  className="block text-sm font-bold text-[#4e342e]"
                >
                  3. 음료 선택 <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  id="drinkSelect"
                  name="drinkSelect"
                  value={formData.selectedDrinkId}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, selectedDrinkId: e.target.value }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="cafe-input text-sm text-[#3e2723] cursor-pointer bg-white"
                >
                  <option value="">-- 음료를 선택해주세요 --</option>
                  {DRINK_MENU.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.price.toLocaleString()}원)
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. 사이즈 (라디오 버튼, 가로 배치) */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold text-[#4e342e]">
                  4. 사이즈 선택
                </legend>
                <div className="flex flex-row flex-wrap gap-4 items-center pt-0.5">
                  {SIZE_OPTIONS.map((opt) => (
                    <label
                      key={opt.size}
                      htmlFor={`size-${opt.size}`}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all select-none ${
                        formData.selectedSize === opt.size
                          ? 'border-[#6b4226] bg-[#f5ebe0] text-[#6b4226] font-bold shadow-xs'
                          : 'border-[#d7ccc8] bg-white text-[#5d4037] hover:bg-[#faf6f0]'
                      }`}
                    >
                      <input
                        type="radio"
                        id={`size-${opt.size}`}
                        name="cupSize"
                        value={opt.size}
                        checked={formData.selectedSize === opt.size}
                        onChange={() => setFormData((prev) => ({ ...prev, selectedSize: opt.size }))}
                        className="accent-[#6b4226] w-4 h-4 cursor-pointer"
                      />
                      <span>
                        {opt.label} (+{opt.extraPrice.toLocaleString()}원)
                        {opt.size === 'M' && ' [기본]'}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* 5. 추가 옵션 (체크박스, 가로 배치) */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold text-[#4e342e]">
                  5. 추가 옵션 (다중 선택 가능)
                </legend>
                <div className="flex flex-row flex-wrap gap-3 items-center pt-0.5">
                  {EXTRA_OPTIONS.map((opt) => {
                    const isChecked = formData.selectedOptions.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        htmlFor={`option-${opt.id}`}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs sm:text-sm cursor-pointer transition-all select-none ${
                          isChecked
                            ? 'border-[#6b4226] bg-[#f5ebe0] text-[#6b4226] font-semibold shadow-xs'
                            : 'border-[#d7ccc8] bg-white text-[#5d4037] hover:bg-[#faf6f0]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`option-${opt.id}`}
                          name="extraOptions"
                          value={opt.id}
                          checked={isChecked}
                          onChange={() => handleOptionToggle(opt.id)}
                          className="accent-[#6b4226] w-4 h-4 rounded cursor-pointer"
                        />
                        <span>
                          {opt.name} (+{opt.price.toLocaleString()}원)
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* 6. 수량 (number 타입, 최소 1, 최대 10, 기본값 1) */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="quantityInput" 
                  className="block text-sm font-bold text-[#4e342e]"
                >
                  6. 수량 (1 ~ 10잔)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(formData.quantity - 1)}
                    disabled={formData.quantity <= 1}
                    className="w-10 h-10 rounded-lg border border-[#d7ccc8] bg-[#fbf8f5] flex items-center justify-center text-[#5d4037] hover:bg-[#efebe9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label="수량 감소"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    id="quantityInput"
                    name="quantity"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="cafe-input text-center font-bold text-base w-24 text-[#3e2723]"
                  />

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(formData.quantity + 1)}
                    disabled={formData.quantity >= 10}
                    className="w-10 h-10 rounded-lg border border-[#d7ccc8] bg-[#fbf8f5] flex items-center justify-center text-[#5d4037] hover:bg-[#efebe9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label="수량 증가"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[#8d6e63]">잔</span>
                </div>
              </div>

              {/* 7. 요청사항 (textarea) */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="specialRequests" 
                  className="block text-sm font-bold text-[#4e342e]"
                >
                  7. 요청사항
                </label>
                <textarea
                  id="specialRequests"
                  name="specialRequests"
                  rows={2}
                  placeholder="예: 덜 달게 해주세요, 얼음 조금만 넣어주세요 등"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData((prev) => ({ ...prev, specialRequests: e.target.value }))}
                  className="cafe-input text-sm text-[#3e2723] placeholder:text-[#a1887f]/70 resize-none"
                />
              </div>

              {/* 유효성 검사 에러 알림 영역 */}
              {errorMessage && (
                <div 
                  role="alert"
                  className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ============================================================== */}
              {/* [예상 금액 표시 영역] 주문하기 버튼 바로 위에 큰 글씨(24px), 갈색, 굵게, 가운데 정렬 */}
              {/* ============================================================== */}
              <div className="pt-3 pb-1 border-t border-[#f0e8e0] text-center">
                <div className="text-xs font-medium text-[#8d6e63] mb-0.5">
                  {selectedDrink ? `${selectedDrink.name} ${formData.selectedSize}사이즈 × ${formData.quantity}잔` : '음료를 선택하면 금액이 실시간 계산됩니다'}
                </div>
                <div 
                  className="text-[24px] font-bold text-[#6b4226] tracking-tight"
                  aria-live="polite"
                >
                  예상 금액: {estimatedPrice.toLocaleString()}원
                </div>
              </div>

              {/* ============================================================== */}
              {/* 8. 주문하기 버튼 & 9. 다시 작성 버튼 */}
              {/* ============================================================== */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                {/* 8. 주문하기 버튼: 갈색 배경(#6b4226), 흰색 글씨, hover시 약간 밝게 */}
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-[#6b4226] text-white font-bold rounded-lg text-sm transition-colors hover:bg-[#7e4e2d] active:bg-[#57351e] shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Coffee className="w-4 h-4" />
                  <span>주문하기</span>
                </button>

                {/* 9. 다시 작성 버튼: 모든 입력과 금액 초기화 */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 px-4 bg-[#efebe9] text-[#5d4037] font-semibold rounded-lg text-sm transition-colors hover:bg-[#e0d6ce] active:bg-[#d7ccc8] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>다시 작성</span>
                </button>
              </div>

              {/* ============================================================== */}
              {/* [주문 확인 메시지 영역] 연두색 배경, 초록 글씨, 둥근 모서리 */}
              {/* ============================================================== */}
              {successMessage && (
                <div
                  id="confirmationMessage"
                  role="status"
                  className="p-4 bg-[#e8f5e9] border border-[#c8e6c9] text-[#2e7d32] rounded-[8px] text-sm font-semibold space-y-2 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#2e7d32] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{successMessage}</p>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#c8e6c9]/60">
                    <button
                      type="button"
                      onClick={() => setReceiptOrder(orders[0] || null)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#1b5e20] hover:underline cursor-pointer"
                    >
                      <ReceiptText className="w-3.5 h-3.5" /> 영수증 다시 보기
                    </button>
                    <span className="text-emerald-300">·</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('board')}
                      className="text-xs font-bold text-[#1b5e20] hover:underline cursor-pointer"
                    >
                      게시판에서 확인하기 &rarr;
                    </button>
                  </div>
                </div>
              )}
            </form>
          </section>
        )}

        {/* ============================================================== */}
        {/* 탭 2: 주문 현황 게시판 */}
        {/* ============================================================== */}
        {activeTab === 'board' && (
          <section aria-labelledby="board-title" className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 id="board-title" className="text-lg font-bold text-[#4e342e]">
                  실시간 주문 게시판
                </h2>
                <p className="text-xs text-[#8d6e63]">
                  바이브 카페 고객 주문 접수 현황 (총 {orders.length}건)
                </p>
              </div>
              <button
                onClick={() => setActiveTab('order')}
                className="text-xs font-semibold text-[#6b4226] bg-white border border-[#d7ccc8] px-3 py-1.5 rounded-lg hover:bg-[#faf6f0] cursor-pointer"
              >
                + 새 주문 작성
              </button>
            </div>

            <OrderBoard
              orders={orders}
              onSelectOrder={(order) => setReceiptOrder(order)}
              onUpdateStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onGoToOrderForm={() => setActiveTab('order')}
            />
          </section>
        )}

        {/* ============================================================== */}
        {/* 하단 푸터 */}
        {/* ============================================================== */}
        <footer className="pt-4 pb-8 text-center text-xs text-[#a1887f]">
          <p>
            © {new Date().getFullYear()} 바이브 카페 (Vibe Cafe). 따뜻한 하루를 선물합니다.
          </p>
        </footer>
      </main>

      {/* 주문 영수증 모달 */}
      <OrderReceiptModal
        order={receiptOrder}
        isOpen={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />
    </div>
  );
}

