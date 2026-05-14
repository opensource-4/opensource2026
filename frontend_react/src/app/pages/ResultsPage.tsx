import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle, CheckCircle, AlertCircle, TrendingDown, Home, DollarSign, Shield, Download, Share2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { AnalysisResult } from "../services/api";

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // 백엔드에서 받은 분석 결과 데이터 가져오기
  const analysisResult = location.state?.analysisResult as AnalysisResult | undefined;
  const formData = location.state?.formData;

  // 데이터가 없으면 분석 페이지로 리다이렉트
  useEffect(() => {
    if (!analysisResult) {
      alert("분석 결과가 없습니다. 먼저 분석을 진행해주세요.");
      navigate("/analyze");
    }
  }, [analysisResult, navigate]);

  // 백엔드 데이터가 없으면 기본값 사용 (혹시 모를 에러 방지)
  const riskLevel = analysisResult?.riskLevel || "주의";
  const recoveryRate = analysisResult?.recoveryRate || 60;
  const depositAmount = analysisResult?.depositAmount || 500000000;
  const recoverableAmount = analysisResult?.recoverableAmount || 300000000;
  const expectedAuctionPrice = analysisResult?.expectedAuctionPrice || 650000000;

  const priceHistory = [
    { month: "2023-01", price: 720 },
    { month: "2023-04", price: 710 },
    { month: "2023-07", price: 695 },
    { month: "2023-10", price: 680 },
    { month: "2024-01", price: 670 },
    { month: "2024-04", price: 665 },
    { month: "2024-07", price: 660 },
    { month: "2024-10", price: 655 },
    { month: "2025-01", price: 650 },
  ];

  // 차트 데이터 계산
  const pieData = [
    { name: "회수 가능", value: recoverableAmount / 1000000, color: "#22c55e" }, // 백만원 단위
    { name: "회수 불가능", value: (depositAmount - recoverableAmount) / 1000000, color: "#ef4444" },
  ];

  const getRiskColor = () => {
    if (riskLevel === "안전") return "text-green-600 bg-green-50 border-green-200";
    if (riskLevel === "주의") return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getRiskIcon = () => {
    if (riskLevel === "안전") return <CheckCircle className="w-6 h-6" />;
    if (riskLevel === "주의") return <AlertCircle className="w-6 h-6" />;
    return <AlertTriangle className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">AI 위험도 분석 결과</h1>
              <p className="text-slate-600">
                {formData?.address || "경기도 용인시 수지구 풍덕천동 1234"} • {formData?.buildingType || "단독"} {formData?.area ? `${formData.area}㎡` : "84㎡"}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                <Share2 className="w-4 h-4" />
                공유
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                PDF 다운로드
              </button>
            </div>
          </div>
        </div>

        {/* Risk Level Card */}
        <div className={`rounded-2xl border p-8 mb-8 ${getRiskColor()}`}>
          <div className="flex items-start gap-4">
            {getRiskIcon()}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">위험도: {riskLevel}</h2>
              <p className="text-lg mb-4">
                경매 시 보증금의 약 <strong>{recoveryRate}%</strong> 회수 가능할 것으로 예상됩니다
              </p>
              <div className="bg-white/50 rounded-xl p-4 border border-current">
                <p className="text-sm">
                  {riskLevel === "주의" && "현재 시세로는 보증금 전액 회수가 어려울 수 있습니다. 추가 보증 보험 가입을 검토하세요."}
                  {riskLevel === "안전" && "보증금 회수에 큰 문제가 없을 것으로 예상됩니다."}
                  {riskLevel === "위험" && "보증금 회수가 매우 어려울 수 있습니다. 계약을 재고하시거나 보증금 감액을 권장합니다."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-slate-900">예상 경매가</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {(expectedAuctionPrice / 100000000).toFixed(1)}억원
            </div>
            <p className="text-sm text-slate-500">최근 실거래가 기준</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-slate-900">회수 가능 금액</h3>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {(recoverableAmount / 100000000).toFixed(1)}억원
            </div>
            <p className="text-sm text-slate-500">보증금 {depositAmount / 100000000}억원 중</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-slate-900">회수 가능 비율</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {recoveryRate}%
            </div>
            <p className="text-sm text-slate-500">AI 예측 결과</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recovery Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">보증금 회수 분석</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  key="recovery-pie"
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}백만원`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}백만원`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-slate-700">회수 가능</span>
                <span className="font-semibold text-green-600">3.0억원</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-slate-700">회수 불가능</span>
                <span className="font-semibold text-red-600">2.0억원</span>
              </div>
            </div>
          </div>

          {/* Price Trend */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">실거래가 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value) => [`${value}백만원`, '실거래가']}
                />
                <Area key="price-area" type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <TrendingDown className="w-4 h-4 text-red-500" />
              최근 2년간 약 9.7% 하락
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-8">
          <h3 className="font-semibold text-slate-900 mb-6 text-xl">상세 분석</h3>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-slate-900 mb-3">권리관계 분석</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">예상 경매가 (낙찰가율 80% 적용)</span>
                  <span className="font-semibold text-slate-900">{(expectedAuctionPrice / 100000000).toFixed(1)}억원</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">근저당 설정액</span>
                  <span className="font-semibold text-red-600">-{((analysisResult?.mortgageAmount || 300000000) / 100000000).toFixed(1)}억원</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">선순위 세입자 보증금</span>
                  <span className="font-semibold text-red-600">-{((analysisResult?.priorTenantsAmount || 50000000) / 100000000).toFixed(1)}억원</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">경매 비용 (약 2%)</span>
                  <span className="font-semibold text-red-600">-{((analysisResult?.auctionCost || 13000000) / 100000000).toFixed(2)}억원</span>
                </div>
                <div className="border-t-2 border-slate-300 pt-3">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <span className="font-semibold text-slate-900">예상 회수 가능 금액</span>
                    <span className="text-2xl font-bold text-blue-600">{(recoverableAmount / 100000000).toFixed(1)}억원</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-3">AI 위험 요인</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-amber-900 mb-1">시세 하락 추세</h5>
                    <p className="text-sm text-amber-700">최근 2년간 지속적인 가격 하락이 관찰되고 있습니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-amber-900 mb-1">높은 근저당 비율</h5>
                    <p className="text-sm text-amber-700">예상 경매가 대비 근저당 비율이 46%로 다소 높습니다</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-3">안전 조치 권장사항</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-900 mb-1">전세보증보험 가입</h5>
                    <p className="text-sm text-blue-700">HUG 전세보증보험 가입을 통해 최대 9천만원까지 추가 보호 가능</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-900 mb-1">보증금 감액 협상</h5>
                    <p className="text-sm text-blue-700">가능하다면 보증금을 4억원 이하로 낮추는 것을 권장합니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-900 mb-1">정기 모니터링</h5>
                    <p className="text-sm text-blue-700">3개월마다 시세 변화를 확인하여 위험도를 재평가하세요</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
          <h4 className="font-medium text-slate-900 mb-2">분석 결과 안내</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>본 분석 결과는 AI 예측 모델과 공개된 실거래가 데이터를 기반으로 산출되었습니다</li>
            <li>실제 경매가는 시장 상황, 물건 상태 등에 따라 달라질 수 있습니다</li>
            <li>최종 계약 전 반드시 법무사 또는 변호사와 상담하시기 바랍니다</li>
            <li>본 서비스는 법적 효력이 없으며, 참고 자료로만 활용하시기 바랍니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
