/**
 * 카페 감성 주문 영수증 모달 컴포넌트
 * @license Apache-2.0
 */

import React from 'react';
import { X, Printer, Coffee, CheckCircle } from 'lucide-react';
import { CafeOrder } from '../types/cafe';

interface OrderReceiptModalProps {
  order: CafeOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const formattedDate = new Date(order.created_at).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-[#fffdfa] w-full max-w-sm rounded-2xl shadow-2xl border border-[#d7ccc8] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* 상단 닫기 */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-[#efebe9] bg-[#fbf8f5]">
          <span className="text-xs font-semibold text-[#8d6e63] flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            주문 접수 완료
          </span>
          <button
            onClick={onClose}
            className="text-[#8d6e63] hover:text-[#3e2723] p-1 rounded-md"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 영수증 종이 느낌 본문 */}
        <div className="p-6 font-mono text-xs text-[#3e2723] space-y-4 bg-white relative">
          {/* 상단 카페 로고 */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#bcaaa4]">
            <div className="text-2xl">☕</div>
            <div className="text-base font-bold tracking-wider text-[#4e342e]">바이브 카페 (Vibe Cafe)</div>
            <div className="text-[11px] text-[#8d6e63]">당신의 하루에 바이브를 더하다</div>
            <div className="text-[10px] text-[#a1887f]">주문번호: {order.id}</div>
            <div className="text-[10px] text-[#a1887f]">{formattedDate}</div>
          </div>

          {/* 고객 정보 */}
          <div className="space-y-1 pb-3 border-b border-dashed border-[#bcaaa4]">
            <div className="flex justify-between">
              <span className="text-[#8d6e63]">주문자:</span>
              <span className="font-semibold">{order.customer_name} 님</span>
            </div>
            {order.phone_number && (
              <div className="flex justify-between">
                <span className="text-[#8d6e63]">연락처:</span>
                <span>{order.phone_number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#8d6e63]">상태:</span>
              <span className="text-emerald-700 font-bold">{order.status}</span>
            </div>
          </div>

          {/* 주문 내역 상세 */}
          <div className="space-y-2 pb-3 border-b border-dashed border-[#bcaaa4]">
            <div className="flex justify-between font-semibold text-[#4e342e]">
              <span>품명 / 옵션</span>
              <span>수량 / 금액</span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-[#3e2723]">{order.drink_name} ({order.cup_size})</div>
                <div className="text-[11px] text-[#8d6e63]">
                  기본 {(order.drink_price).toLocaleString()}원
                  {order.size_price > 0 && ` + 사이즈 ${(order.size_price).toLocaleString()}원`}
                </div>
                {order.extra_options.length > 0 && (
                  <div className="text-[11px] text-[#6b4226] mt-0.5">
                    옵션: {order.extra_options.join(', ')} (+{order.extra_price.toLocaleString()}원)
                  </div>
                )}
              </div>
              <div className="text-right">
                <div>{order.quantity}잔</div>
                <div className="font-semibold text-[#6b4226]">
                  {order.total_price.toLocaleString()}원
                </div>
              </div>
            </div>

            {order.special_requests && (
              <div className="bg-[#faf6f0] p-2 rounded text-[11px] mt-2 text-[#5d4037]">
                <strong>요청:</strong> {order.special_requests}
              </div>
            )}
          </div>

          {/* 최종 결제 합계 */}
          <div className="pt-1 flex justify-between items-baseline text-sm font-bold text-[#3e2723]">
            <span>총 결제 금액</span>
            <span className="text-lg text-[#6b4226]">
              {order.total_price.toLocaleString()}원
            </span>
          </div>

          {/* 영수증 하단 바코드 느낌 */}
          <div className="pt-2 text-center text-[#8d6e63] space-y-1">
            <div className="tracking-[0.25em] text-[10px] text-[#a1887f]">||| | |||| | |||||| || | |||</div>
            <p className="text-[10px]">바이브 카페를 찾아주셔서 감사합니다!</p>
          </div>
        </div>

        {/* 푸터 액션 */}
        <div className="flex gap-2 p-3 bg-[#fbf8f5] border-t border-[#efebe9]">
          <button
            onClick={() => window.print()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#5d4037] bg-white border border-[#d7ccc8] rounded-xl hover:bg-[#faf6f0] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> 영수증 인쇄
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#6b4226] rounded-xl hover:bg-[#7d4e2d] cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
