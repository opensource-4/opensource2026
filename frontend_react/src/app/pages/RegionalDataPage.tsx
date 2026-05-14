import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MapPin, TrendingUp, TrendingDown, Building2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { getRegionData, RegionData } from "../services/api";

export function RegionalDataPage() {
  // 백엔드에서 지역 데이터 가져오기
  const [regionalData, setRegionalData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 페이지 로드 시 백엔드에서 데이터 가져오기
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 백엔드 API 호출
        const data = await getRegionData();
        setRegionalData(data);
      } catch (err) {
        console.error("지역 데이터 조회 실패:", err);
        setError("지역 데이터를 불러오지 못했습니다.");
        // 에러 시 기본 데이터 사용
        setRegionalData([
          { region: "수지구", avgPrice: 520, change: -2.1, riskScore: 72, transactions: 189 },
          { region: "기흥구", avgPrice: 480, change: -1.8, riskScore: 74, transactions: 245 },
          { region: "처인구", avgPrice: 420, change: 0.5, riskScore: 76, transactions: 156 },
          { region: "분당구", avgPrice: 680, change: -3.5, riskScore: 68, transactions: 312 },
          { region: "죽전동", avgPrice: 550, change: -2.3, riskScore: 71, transactions: 134 },
          { region: "구성동", avgPrice: 490, change: -1.2, riskScore: 73, transactions: 167 },
          { region: "동백동", avgPrice: 510, change: 0.8, riskScore: 77, transactions: 198 },
          { region: "신갈동", avgPrice: 470, change: -0.9, riskScore: 74, transactions: 145 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []); // 빈 배열 = 컴포넌트 마운트 시 한 번만 실행

  const monthlyTrend = [
    { month: "2024-06", transactions: 1234, avgPrice: 650 },
    { month: "2024-07", transactions: 1456, avgPrice: 645 },
    { month: "2024-08", transactions: 1589, avgPrice: 642 },
    { month: "2024-09", transactions: 1423, avgPrice: 638 },
    { month: "2024-10", transactions: 1678, avgPrice: 635 },
    { month: "2024-11", transactions: 1512, avgPrice: 632 },
    { month: "2024-12", transactions: 1389, avgPrice: 628 },
    { month: "2025-01", transactions: 1654, avgPrice: 625 },
  ];

  const riskDistribution = [
    { range: "안전", count: 892, percentage: 45 },
    { range: "주의", count: 734, percentage: 37 },
    { range: "위험", count: 356, percentage: 18 },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">지역별 거래 데이터</h1>
          <p className="text-slate-600">용인시 주요 지역의 전세 시장 동향을 한눈에 확인하세요</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="지역명으로 검색 (예: 수지구, 기흥구)"
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              검색
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-slate-600">데이터를 불러오는 중...</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-slate-900">전체 거래량</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">1,654건</div>
            <p className="text-sm text-slate-500">최근 1개월 기준</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-slate-900">평균 전세가</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">6.25억원</div>
            <p className="text-sm text-red-500">전월 대비 -1.1%</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-slate-900">가장 안전한 지역</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">동백동</div>
            <p className="text-sm text-slate-500">안전도 점수 77점</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">월별 거래 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Line key="transactions-line" yAxisId="left" type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} name="거래량" />
                <Line key="avgPrice-line" yAxisId="right" type="monotone" dataKey="avgPrice" stroke="#8b5cf6" strokeWidth={2} name="평균가(백만원)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">위험도 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar key="count-bar" dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{riskDistribution[0].percentage}%</div>
                <div className="text-xs text-slate-600 mt-1">안전</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{riskDistribution[1].percentage}%</div>
                <div className="text-xs text-slate-600 mt-1">주의</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{riskDistribution[2].percentage}%</div>
                <div className="text-xs text-slate-600 mt-1">위험</div>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">지역별 상세 정보</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">지역</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">평균 전세가</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">변동률</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">안전도</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">거래량</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {regionalData.map((data) => (
                  <tr key={data.region} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-900">{data.region}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {data.avgPrice}백만원
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`inline-flex items-center gap-1 ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="font-medium">{data.change > 0 ? '+' : ''}{data.change}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        data.riskScore >= 75 ? 'bg-green-100 text-green-700' :
                        data.riskScore >= 65 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {data.riskScore}점
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {data.transactions}건
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-medium text-blue-900 mb-2">데이터 출처</h4>
          <p className="text-sm text-blue-700">
            국토교통부 실거래가 공개시스템 및 전세안심분석 AI 분석 모델 기반 (2026년 5월 업데이트)
          </p>
        </div>
      </div>
    </div>
  );
}
