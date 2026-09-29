/**
 * 카페 주문 현황 게시판 컴포넌트
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { CafeOrder } from '../types/cafe';
import { Clock, Coffee, Eye, Trash2, ArrowRight } from 'lucide-react';

interface OrderBoardProps {
  orders: CafeOrder[];
  onSelectOrder: (order: CafeOrder) => void;
  onUpdateStatus: (orderId: string, nextStatus: CafeOrder['status']) => void;
  onDeleteOrder: (orderId: string) => void;
  onGoToOrderForm: () => void;
}

export const OrderBoard: React.FC<OrderBoardProps> = ({
  orders,
  onSelectOrder,
  onUpdateStatus,
  onDeleteOrder,
  onGoToOrderForm,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 상태 순서
  const statusCycle: Record<CafeOrder['status'], CafeOrder['status']> = {
    '접수완료': '제조중',
    '제조중': '픽업대기',
    '픽업대기': '완료',
    '완료': '접수완료',
  };

  // 상태별 색상 매핑
  const statusStyles: Record<CafeOrder['status'], string> = {
    '접수완료': 'bg-amber-100 text-amber-800 border-amber-300',
    '제조중': 'bg-blue-100 text-blue-800 border-blue-300',
    '픽업대기': 'bg-purple-100 text-purple-800 border-purple-300',
    '완료': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  return (
    <div className="space-y-4">
      {/* 게시판 상단 상태 필터 탭 */}
      <div className="flex items-center justify-between pb-2 border-b border-[#e0d6ce]">
        <div className="flex items-center gap-1 overflow-x-auto text-xs py-1">
          {['all', '접수완료', '제조중', '픽업대기', '완료'].map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setFilterStatus(statusKey)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === statusKey
                  ? 'bg-[#6b4226] text-white shadow-xs'
                  : 'bg-white text-[#6d4c41] hover:bg-[#f5ebe0]'
              }`}
            >
              {statusKey === 'all' ? `전체 (${orders.length})` : statusKey}
            </button>
          ))}
        </div>
      </div>

      {/* 주문 목록 카드들 */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#d7ccc8] p-6 space-y-3">
          <Coffee className="w-10 h-10 text-[#bcaaa4] mx-auto" />
          <p className="text-sm font-medium text-[#8d6e63]">
            {filterStatus === 'all'
              ? '아직 접수된 주문이 없습니다.'
              : `'${filterStatus}' 상태의 주문이 없습니다.`}
          </p>
          <button
            onClick={onGoToOrderForm}
            className="text-xs font-semibold text-white bg-[#6b4226] px-4 py-2 rounded-lg hover:bg-[#7d4e2d] transition-colors cursor-pointer"
          >
            첫 음료 주문하러 가기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const timeAgo = formatTimeAgo(order.created_at);
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-[#e0d6ce] p-4 shadow-xs hover:border-[#6b4226]/40 transition-all space-y-3"
              >
                {/* 상단: 고객명 + 시간 + 상태 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#3e2723]">
                      {order.customer_name} 님
                    </span>
                    <span className="text-xs text-[#8d6e63] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#a1887f]" />
                      {timeAgo}
                    </span>
                  </div>

                  {/* 상태 변경 버튼 */}
                  <button
                    onClick={() => onUpdateStatus(order.id, statusCycle[order.status])}
                    title="클릭하여 다음 상태로 변경"
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all hover:scale-105 cursor-pointer flex items-center gap-1 ${
                      statusStyles[order.status]
                    }`}
                  >
                    <span>{order.status}</span>
                    <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                  </button>
                </div>

                {/* 주문 품목 및 가격 */}
                <div className="bg-[#faf6f0] rounded-lg p-2.5 text-xs text-[#5d4037] flex items-start justify-between">
                  <div>
                    <div className="font-bold text-[#3e2723] text-sm flex items-center gap-1.5">
                      <span>☕</span>
                      <span>{order.drink_name} ({order.cup_size}사이즈)</span>
                      <span className="text-[#8d6e63] text-xs font-normal">× {order.quantity}잔</span>
                    </div>

                    {order.extra_options.length > 0 && (
                      <div className="text-[11px] text-[#8d6e63] mt-1">
                        추가옵션: <span className="text-[#6b4226] font-medium">{order.extra_options.join(', ')}</span>
                      </div>
                    )}

                    {order.special_requests && (
                      <div className="text-[11px] text-[#795548] mt-1 bg-white/70 px-2 py-0.5 rounded">
                        요청: {order.special_requests}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-[#6b4226]">
                      {order.total_price.toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* 카드 하단 액션 버튼들 */}
                <div className="flex items-center justify-between pt-1 border-t border-[#f5ebe0] text-xs">
                  <span className="text-[11px] text-[#a1887f]">
                    {order.phone_number || '연락처 미등록'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="text-[#6b4226] hover:text-[#4e342e] font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-[#faf6f0] cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> 영수증
                    </button>
                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 cursor-pointer"
                      title="주문 내역 삭제"
                      aria-label="주문 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 시간 경과 도우미 함수
function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return new Date(isoString).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  } catch {
    return '최근';
  }
}
