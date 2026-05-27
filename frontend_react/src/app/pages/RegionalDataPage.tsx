import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  Clock,
  MapPin,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { getRegionData, RegionData } from "../services/api";

const SEARCH_HISTORY_KEY = "regional-search-history";

const dummyRegionalData: RegionData[] = [
  { region: "수지구", avgPrice: 520, change: -2.1, riskScore: 72, transactions: 189 },
  { region: "기흥구", avgPrice: 480, change: -1.8, riskScore: 74, transactions: 245 },
  { region: "처인구", avgPrice: 420, change: 0.5, riskScore: 76, transactions: 156 },
  { region: "죽전동", avgPrice: 550, change: -2.3, riskScore: 71, transactions: 134 },
  { region: "구성동", avgPrice: 490, change: -1.2, riskScore: 73, transactions: 167 },
  { region: "동백동", avgPrice: 510, change: 0.8, riskScore: 77, transactions: 198 },
  { region: "신갈동", avgPrice: 470, change: -0.9, riskScore: 74, transactions: 145 },
  { region: "풍덕천동", avgPrice: 535, change: -1.5, riskScore: 72, transactions: 121 },
  { region: "상현동", avgPrice: 545, change: -0.7, riskScore: 75, transactions: 118 },
  { region: "보정동", avgPrice: 505, change: 0.3, riskScore: 76, transactions: 96 },
];

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

function mergeRegionData(apiData: RegionData[]) {
  const merged = new Map<string, RegionData>();

  for (const item of dummyRegionalData) {
    merged.set(item.region, item);
  }

  for (const item of apiData) {
    const fallback = merged.get(item.region);
    merged.set(item.region, {
      region: item.region,
      avgPrice: item.avgPrice || fallback?.avgPrice || 0,
      change: item.change || fallback?.change || 0,
      riskScore: item.riskScore || fallback?.riskScore || 75,
      transactions: item.transactions || fallback?.transactions || 0,
    });
  }

  return Array.from(merged.values());
}

function readSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history: string[]) {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
}

export function RegionalDataPage() {
  const [regionalData, setRegionalData] = useState<RegionData[]>(dummyRegionalData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    setSearchHistory(readSearchHistory());

    async function fetchData() {
      try {
        setLoading(true);
        const data = await getRegionData();
        setRegionalData(mergeRegionData(data));
      } catch (err) {
        console.error("지역 데이터 조회 실패:", err);
        setError("백엔드 데이터를 불러오지 못해 더미 데이터로 표시합니다.");
        setRegionalData(dummyRegionalData);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    const query = activeQuery.trim().toLowerCase();
    if (!query) {
      return regionalData;
    }

    return regionalData.filter((item) => item.region.toLowerCase().includes(query));
  }, [activeQuery, regionalData]);

  const totalTransactions = filteredData.reduce((sum, item) => sum + item.transactions, 0);
  const averagePrice =
    filteredData.length > 0
      ? Math.round(filteredData.reduce((sum, item) => sum + item.avgPrice, 0) / filteredData.length)
      : 0;
  const safestRegion = [...filteredData].sort((a, b) => b.riskScore - a.riskScore)[0];

  const handleSearch = (query = searchInput) => {
    const normalizedQuery = query.trim();
    setActiveQuery(normalizedQuery);
    setSearchInput(normalizedQuery);

    if (!normalizedQuery) {
      return;
    }

    const nextHistory = [
      normalizedQuery,
      ...searchHistory.filter((item) => item !== normalizedQuery),
    ].slice(0, 5);

    setSearchHistory(nextHistory);
    saveSearchHistory(nextHistory);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveQuery("");
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    saveSearchHistory([]);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">지역별 거래 데이터</h1>
          <p className="text-slate-600">용인시 주요 지역의 전세 시장 동향을 확인하세요</p>
        </div>

        <div className="bg-white border border-slate-200 p-6 shadow-sm mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="지역명으로 검색 (예: 수지구, 죽전동)"
                  className="w-full pl-12 pr-12 py-3 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label="검색어 지우기"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleSearch()}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                검색
              </button>
            </div>

            {searchHistory.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-slate-500 mr-1">
                  <Clock className="w-4 h-4" />
                  최근 검색
                </div>
                {searchHistory.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSearch(item)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm hover:bg-slate-200"
                  >
                    {item}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900"
                >
                  기록 삭제
                </button>
              </div>
            )}

            {activeQuery && (
              <div className="text-sm text-slate-600">
                `{activeQuery}` 검색 결과 {filteredData.length}건
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <p className="text-slate-600">데이터를 불러오는 중입니다.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-8">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-slate-900">거래 건수</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {totalTransactions.toLocaleString()}건
            </div>
            <p className="text-sm text-slate-500">
              {activeQuery ? "검색 결과 기준" : "표시 지역 합산"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-slate-900">평균 전세가</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{averagePrice}백만원</div>
            <p className="text-sm text-slate-500">표시 지역 평균</p>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-slate-900">가장 안전한 지역</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {safestRegion?.region || "-"}
            </div>
            <p className="text-sm text-slate-500">
              안전 점수 {safestRegion?.riskScore ?? 0}점
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">월별 거래 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} name="거래 건수" />
                <Line yAxisId="right" type="monotone" dataKey="avgPrice" stroke="#8b5cf6" strokeWidth={2} name="평균가(백만원)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">위험도 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {riskDistribution.map((item) => (
                <div key={item.range} className="text-center p-3 bg-slate-50">
                  <div className="text-2xl font-bold text-slate-900">{item.percentage}%</div>
                  <div className="text-xs text-slate-600 mt-1">{item.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
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
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">안전 점수</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">거래 건수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredData.map((data) => (
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
                      <div className={`inline-flex items-center gap-1 ${data.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {data.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="font-medium">{data.change > 0 ? "+" : ""}{data.change}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium ${
                        data.riskScore >= 75 ? "bg-green-100 text-green-700" :
                        data.riskScore >= 65 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {data.riskScore}점
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {data.transactions}건
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td className="px-6 py-10 text-center text-slate-500" colSpan={5}>
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 p-6">
          <h4 className="font-medium text-blue-900 mb-2">데이터 안내</h4>
          <p className="text-sm text-blue-700">
            백엔드 지역 요약 데이터와 화면 확인용 더미 데이터를 함께 표시합니다. 검색 기록은 현재 브라우저의 localStorage에 저장됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
