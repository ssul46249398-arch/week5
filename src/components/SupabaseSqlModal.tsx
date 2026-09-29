/**
 * Supabase SQL 에디터용 쿼리 확인 및 원클릭 복사 모달 컴포넌트
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, X, Database, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import {
  SUPABASE_SQL_CREATE_TABLE,
  SUPABASE_SQL_INSERT_FAKE,
  SUPABASE_SQL_FULL_SCRIPT
} from '../data/cafeData';

interface SupabaseSqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSqlModal: React.FC<SupabaseSqlModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'create' | 'insert' | 'schema'>('all');

  if (!isOpen) return null;

  // 클립보드 복사 처리 함수
  const copyToClipboard = async (text: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-[#fffdfa] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#d7ccc8] flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#efebe9] bg-[#fbf8f5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6b4226]/10 flex items-center justify-center text-[#6b4226]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-[#3e2723]">
                Supabase SQL Editor 쿼리문
              </h2>
              <p className="text-xs text-[#8d6e63]">
                Supabase 대시보드 &gt; SQL Editor에 복사하여 즉시 실행하세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8d6e63] hover:text-[#3e2723] hover:bg-[#efebe9] rounded-lg transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-[#efebe9] bg-[#fdfbf7] px-6 pt-2 gap-2 text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'all'
                ? 'border-[#6b4226] text-[#6b4226] font-semibold'
                : 'border-transparent text-[#8d6e63] hover:text-[#5d4037]'
            }`}
          >
            전체 통합 스크립트
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'create'
                ? 'border-[#6b4226] text-[#6b4226] font-semibold'
                : 'border-transparent text-[#8d6e63] hover:text-[#5d4037]'
            }`}
          >
            1. 테이블 생성 (DDL)
          </button>
          <button
            onClick={() => setActiveTab('insert')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'insert'
                ? 'border-[#6b4226] text-[#6b4226] font-semibold'
                : 'border-transparent text-[#8d6e63] hover:text-[#5d4037]'
            }`}
          >
            2. 테스트 데이터 (INSERT)
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'schema'
                ? 'border-[#6b4226] text-[#6b4226] font-semibold'
                : 'border-transparent text-[#8d6e63] hover:text-[#5d4037]'
            }`}
          >
            3. 컬럼 구조표
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 가이드 안내 팁 박스 */}
          <div className="bg-[#f5ebe0] border border-[#d7ccc8] rounded-xl p-3.5 text-xs text-[#5d4037] flex items-start gap-2.5">
            <Terminal className="w-4 h-4 text-[#6b4226] mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-[#3e2723] mb-0.5">💡 Supabase에 적용하는 3단계 방법</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[#6d4c41]">
                <li>Supabase 프로젝트 접속 후 좌측 메뉴의 <strong>SQL Editor</strong>를 클릭합니다.</li>
                <li><strong>New Query</strong>를 누르고 아래 쿼리를 붙여넣습니다.</li>
                <li>우측 하단의 <strong>Run (Ctrl + Enter)</strong> 버튼을 누르면 <code className="bg-white/80 px-1 py-0.5 rounded text-[#6b4226]">cafe_menu</code> 테이블이 생성됩니다!</li>
              </ol>
            </div>
          </div>

          {/* 탭 1: 전체 스크립트 */}
          {activeTab === 'all' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5d4037] flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-[#6b4226]" />
                  cafe_menu 생성 + RLS 정책 + 1건 테스트 데이터
                </span>
                <button
                  onClick={() => copyToClipboard(SUPABASE_SQL_FULL_SCRIPT, 'all')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#6b4226] text-white rounded-lg hover:bg-[#7d4e2d] transition-colors shadow-xs cursor-pointer"
                >
                  {copiedSection === 'all' ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> 복사 완료!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> 쿼리 복사하기
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-[#2d2420] text-[#f7ede2] p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-[#3e2723]">
                {SUPABASE_SQL_FULL_SCRIPT}
              </pre>
            </div>
          )}

          {/* 탭 2: 테이블 생성 전용 */}
          {activeTab === 'create' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5d4037]">
                  테이블 생성 (CREATE TABLE cafe_menu)
                </span>
                <button
                  onClick={() => copyToClipboard(SUPABASE_SQL_CREATE_TABLE, 'create')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#6b4226] text-white rounded-lg hover:bg-[#7d4e2d] transition-colors cursor-pointer"
                >
                  {copiedSection === 'create' ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> 복사 완료!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> DDL 복사하기
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-[#2d2420] text-[#f7ede2] p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-[#3e2723]">
                {SUPABASE_SQL_CREATE_TABLE}
              </pre>
            </div>
          )}

          {/* 탭 3: 가짜 데이터 INSERT 전용 */}
          {activeTab === 'insert' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5d4037]">
                  1건의 테스트 가짜 데이터 (INSERT INTO cafe_menu)
                </span>
                <button
                  onClick={() => copyToClipboard(SUPABASE_SQL_INSERT_FAKE, 'insert')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#6b4226] text-white rounded-lg hover:bg-[#7d4e2d] transition-colors cursor-pointer"
                >
                  {copiedSection === 'insert' ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> 복사 완료!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> INSERT 쿼리 복사
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-[#2d2420] text-[#f7ede2] p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-[#3e2723]">
                {SUPABASE_SQL_INSERT_FAKE}
              </pre>
            </div>
          )}

          {/* 탭 4: 컬럼 상세 구조표 */}
          {activeTab === 'schema' && (
            <div className="overflow-hidden border border-[#e0d6ce] rounded-xl text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#f5ebe0] text-[#4e342e] font-semibold">
                  <tr>
                    <th className="p-2.5 border-b border-[#e0d6ce]">열 이름 (Column)</th>
                    <th className="p-2.5 border-b border-[#e0d6ce]">타입</th>
                    <th className="p-2.5 border-b border-[#e0d6ce]">주문서 매핑 설명</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee]">
                  <tr className="hover:bg-[#faf6f0]">
                    <td className="p-2.5 font-mono font-medium text-[#6b4226]">customer_name</td>
                    <td className="p-2.5 font-mono text-[#8d6e63]">TEXT (NOT NULL)</td>
                    <td className="p-2.5 text-[#4e342e]">주문자 성함 (필수 1번 항목)</td>
                  </tr>
                  <tr className="hover:bg-[#faf6f0]">
                    <td className="p-2.5 font-mono font-medium text-[#6b4226]">phone_number</td>
                    <td className="p-2.5 font-mono text-[#8d6e63]">TEXT</td>
                    <td className="p-2.5 text-[#4e342e]">전화번호 (2번 항목)</td>
                  </tr>
                  <tr className="hover:bg-[#faf6f0]">
                    <td className="p-2.5 font-mono font-medium text-[#6b4226]">drink_name</td>
                    <td className="p-2.5 font-mono text-[#8d6e63]">TEXT (NOT NULL)</td>
                    <td className="p-2.5 text-[#4e342e]">음료명 (3번 드롭다운)</td>
                  </tr>
                  <tr className="hover:bg-[#faf6f0]">
                    <td className="p-2.5 font-mono font-medium text-[#6b4226]">drink_price</td>
                    <td className="p-2.5 font-mono text-[#8d6e63]">INTEGER</td>
                    <td className="p-2.5 text-[#4e342e]">음료 기본 가격</td>
                  </tr>
                  <tr className="hover:bg-[#faf6f0]">
                    <td className="p-2.5 font-mono font-medium text-[#6b4226]">cup_size</td>
                    <td className="p-2.5 font-mono text-[#8d6e63]">TEXT</td>
                    <td className="p-2.5 text-[#4e342e]">사이즈 (4번 라디오: S, M, L)</td>
                  </tr>
                  <tr className="hover:bg-[#faf6f0]">
                    <td className="p-2.5 font-mono font-medium text-[#6b4226]">extra_options</td>
                    <td className="p-2.5 font-mono text-[#8d6e63]">TEXT[]</td>
                    <td className="p-2.5 text-[#4e342e]">추가 옵션 배열 (5번 체크박스)</td>
                  </tr>
                  <tr className="hover:bg-[#faf6f0]">
                    <td className="p-2.5 font-mono font-medium text-[#6b4226]">quantity</td>
                    <td className="p-2.5 font-mono text-[#8d6e63]">INTEGER (1~10)</td>
                    <td className="p-2.5 text-[#4e342e]">수량 (6번 항목)</td>
                  </tr>
                  <tr className="hover:bg-[#faf6f0]">
                    <td className="p-2.5 font-mono font-medium text-[#6b4226]">total_price</td>
                    <td className="p-2.5 font-mono text-[#8d6e63]">INTEGER</td>
                    <td className="p-2.5 text-[#4e342e]">총 계산 예상 금액</td>
                  </tr>
                  <tr className="hover:bg-[#faf6f0]">
                    <td className="p-2.5 font-mono font-medium text-[#6b4226]">special_requests</td>
                    <td className="p-2.5 font-mono text-[#8d6e63]">TEXT</td>
                    <td className="p-2.5 text-[#4e342e]">요청사항 (7번 textarea)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#efebe9] bg-[#fbf8f5]">
          <span className="text-xs text-[#8d6e63] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PostgreSQL 표준 쿼리 준수
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#5d4037] bg-[#efebe9] hover:bg-[#e0d6ce] rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
