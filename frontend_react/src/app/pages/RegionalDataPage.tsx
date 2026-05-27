import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, Clock, DollarSign, MapPin, Search, X } from "lucide-react";

const SEARCH_HISTORY_KEY = "regional-search-history";

type AreaBandStat = {
  band: string;
  avgDeposit: number;
  transactionCount: number;
};

type MonthlyTrendPoint = {
  month: string;
  avgDeposit: number;
  transactionCount: number;
};

type RegionStat = {
  region: string;
  avgDeposit: number;
  avgMonthlyRent: number;
  transactions: number;
  jeonseCount: number;
  monthlyRentCount: number;
  areaBands: AreaBandStat[];
  monthlyTrend: MonthlyTrendPoint[];
};

type AreaSummary = {
  band: string;
  avgDeposit: number;
  transactionCount: number;
};

const BAND_ORDER = ["20㎡ 이하", "20~30㎡", "30~40㎡", "40㎡ 초과"];

const dummyRegionalData: RegionStat[] = [
  {
    region: "수지구",
    avgDeposit: 520_000_000,
    avgMonthlyRent: 1_250_000,
    transactions: 189,
    jeonseCount: 138,
    monthlyRentCount: 51,
    areaBands: [
      { band: "20㎡ 이하", avgDeposit: 320_000_000, transactionCount: 24 },
      { band: "20~30㎡", avgDeposit: 410_000_000, transactionCount: 49 },
      { band: "30~40㎡", avgDeposit: 540_000_000, transactionCount: 62 },
      { band: "40㎡ 초과", avgDeposit: 690_000_000, transactionCount: 54 },
    ],
    monthlyTrend: [
      { month: "2025-01", avgDeposit: 505_000_000, transactionCount: 28 },
      { month: "2025-02", avgDeposit: 510_000_000, transactionCount: 31 },
      { month: "2025-03", avgDeposit: 515_000_000, transactionCount: 33 },
      { month: "2025-04", avgDeposit: 522_000_000, transactionCount: 31 },
      { month: "2025-05", avgDeposit: 528_000_000, transactionCount: 32 },
      { month: "2025-06", avgDeposit: 525_000_000, transactionCount: 34 },
    ],
  },
  {
    region: "기흥구",
    avgDeposit: 480_000_000,
    avgMonthlyRent: 1_150_000,
    transactions: 245,
    jeonseCount: 171,
    monthlyRentCount: 74,
    areaBands: [
      { band: "20㎡ 이하", avgDeposit: 300_000_000, transactionCount: 31 },
      { band: "20~30㎡", avgDeposit: 385_000_000, transactionCount: 61 },
      { band: "30~40㎡", avgDeposit: 495_000_000, transactionCount: 83 },
      { band: "40㎡ 초과", avgDeposit: 640_000_000, transactionCount: 70 },
    ],
    monthlyTrend: [
      { month: "2025-01", avgDeposit: 470_000_000, transactionCount: 35 },
      { month: "2025-02", avgDeposit: 475_000_000, transactionCount: 37 },
      { month: "2025-03", avgDeposit: 482_000_000, transactionCount: 40 },
      { month: "2025-04", avgDeposit: 486_000_000, transactionCount: 42 },
      { month: "2025-05", avgDeposit: 488_000_000, transactionCount: 45 },
      { month: "2025-06", avgDeposit: 484_000_000, transactionCount: 46 },
    ],
  },
  {
    region: "처인구",
    avgDeposit: 420_000_000,
    avgMonthlyRent: 980_000,
    transactions: 156,
    jeonseCount: 102,
    monthlyRentCount: 54,
    areaBands: [
      { band: "20㎡ 이하", avgDeposit: 250_000_000, transactionCount: 28 },
      { band: "20~30㎡", avgDeposit: 335_000_000, transactionCount: 44 },
      { band: "30~40㎡", avgDeposit: 440_000_000, transactionCount: 47 },
      { band: "40㎡ 초과", avgDeposit: 585_000_000, transactionCount: 37 },
    ],
    monthlyTrend: [
      { month: "2025-01", avgDeposit: 410_000_000, transactionCount: 22 },
      { month: "2025-02", avgDeposit: 414_000_000, transactionCount: 24 },
      { month: "2025-03", avgDeposit: 418_000_000, transactionCount: 26 },
      { month: "2025-04", avgDeposit: 421_000_000, transactionCount: 28 },
      { month: "2025-05", avgDeposit: 425_000_000, transactionCount: 27 },
      { month: "2025-06", avgDeposit: 423_000_000, transactionCount: 29 },
    ],
  },
  {
    region: "죽전동",
    avgDeposit: 550_000_000,
    avgMonthlyRent: 1_380_000,
    transactions: 134,
    jeonseCount: 98,
    monthlyRentCount: 36,
    areaBands: [
      { band: "20㎡ 이하", avgDeposit: 355_000_000, transactionCount: 17 },
      { band: "20~30㎡", avgDeposit: 440_000_000, transactionCount: 35 },
      { band: "30~40㎡", avgDeposit: 575_000_000, transactionCount: 46 },
      { band: "40㎡ 초과", avgDeposit: 740_000_000, transactionCount: 36 },
    ],
    monthlyTrend: [
      { month: "2025-01", avgDeposit: 540_000_000, transactionCount: 18 },
      { month: "2025-02", avgDeposit: 545_000_000, transactionCount: 20 },
      { month: "2025-03", avgDeposit: 548_000_000, transactionCount: 23 },
      { month: "2025-04", avgDeposit: 553_000_000, transactionCount: 22 },
      { month: "2025-05", avgDeposit: 556_000_000, transactionCount: 24 },
      { month: "2025-06", avgDeposit: 552_000_000, transactionCount: 27 },
    ],
  },
  {
    region: "동백동",
    avgDeposit: 510_000_000,
    avgMonthlyRent: 1_220_000,
    transactions: 198,
    jeonseCount: 136,
    monthlyRentCount: 62,
    areaBands: [
      { band: "20㎡ 이하", avgDeposit: 315_000_000, transactionCount: 22 },
      { band: "20~30㎡", avgDeposit: 405_000_000, transactionCount: 53 },
      { band: "30~40㎡", avgDeposit: 525_000_000, transactionCount: 71 },
      { band: "40㎡ 초과", avgDeposit: 690_000_000, transactionCount: 52 },
    ],
    monthlyTrend: [
      { month: "2025-01", avgDeposit: 500_000_000, transactionCount: 29 },
      { month: "2025-02", avgDeposit: 503_000_000, transactionCount: 30 },
      { month: "2025-03", avgDeposit: 509_000_000, transactionCount: 31 },
      { month: "2025-04", avgDeposit: 512_000_000, transactionCount: 34 },
      { month: "2025-05", avgDeposit: 515_000_000, transactionCount: 36 },
      { month: "2025-06", avgDeposit: 514_000_000, transactionCount: 38 },
    ],
  },
  {
    region: "상현동",
    avgDeposit: 545_000_000,
    avgMonthlyRent: 1_310_000,
    transactions: 118,
    jeonseCount: 85,
    monthlyRentCount: 33,
    areaBands: [
      { band: "20㎡ 이하", avgDeposit: 340_000_000, transactionCount: 14 },
      { band: "20~30㎡", avgDeposit: 425_000_000, transactionCount: 29 },
      { band: "30~40㎡", avgDeposit: 560_000_000, transactionCount: 40 },
      { band: "40㎡ 초과", avgDeposit: 730_000_000, transactionCount: 35 },
    ],
    monthlyTrend: [
      { month: "2025-01", avgDeposit: 535_000_000, transactionCount: 16 },
      { month: "2025-02", avgDeposit: 538_000_000, transactionCount: 17 },
      { month: "2025-03", avgDeposit: 542_000_000, transactionCount: 18 },
      { month: "2025-04", avgDeposit: 546_000_000, transactionCount: 21 },
      { month: "2025-05", avgDeposit: 548_000_000, transactionCount: 22 },
      { month: "2025-06", avgDeposit: 546_000_000, transactionCount: 24 },
    ],
  },
];

function formatMoney(value: number): string {
  const amount = Number.isFinite(value) ? Math.abs(value) : 0;
  const sign = value < 0 ? "-" : "";

  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000);
    const remainderManwon = Math.round((amount % 100_000_000) / 10_000);
    return `${sign}${eok}억${remainderManwon > 0 ? ` ${remainderManwon.toLocaleString("ko-KR")}만원` : ""}`;
  }

  return `${sign}${Math.round(amount / 10_000).toLocaleString("ko-KR")}만원`;
}

function formatAreaLabel(label: string): string {
  if (label.includes("평")) {
    return label;
  }

  return label;
}

function formatPriceChange(prevValue: number, nextValue: number): string {
  if (!Number.isFinite(prevValue) || prevValue <= 0 || !Number.isFinite(nextValue)) {
    return "-";
  }

  const diff = nextValue - prevValue;
  const rate = (Math.abs(diff) / prevValue) * 100;
  const direction = diff >= 0 ? "상승" : "하락";
  return `${direction} ${rate.toFixed(1)}%`;
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

function compareBandOrder(a: string, b: string) {
  return BAND_ORDER.indexOf(a) - BAND_ORDER.indexOf(b);
}

export function RegionalDataPage() {
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    setSearchHistory(readSearchHistory());
  }, []);

  const filteredData = useMemo(() => {
    const query = activeQuery.trim().toLowerCase();
    if (!query) {
      return dummyRegionalData;
    }

    return dummyRegionalData.filter((item) => item.region.toLowerCase().includes(query));
  }, [activeQuery]);

  const aggregates = useMemo(() => {
    const totalTransactions = filteredData.reduce((sum, item) => sum + item.transactions, 0);
    const totalDeposit = filteredData.reduce((sum, item) => sum + item.avgDeposit * item.transactions, 0);
    const totalMonthlyRent = filteredData.reduce((sum, item) => sum + item.avgMonthlyRent * item.transactions, 0);
    const totalJeonse = filteredData.reduce((sum, item) => sum + item.jeonseCount, 0);
    const totalMonthlyRentCount = filteredData.reduce((sum, item) => sum + item.monthlyRentCount, 0);

    const bandMap = new Map<string, AreaSummary>();
    const monthMap = new Map<string, { month: string; avgDeposit: number; transactionCount: number }>();

    filteredData.forEach((item) => {
      item.areaBands.forEach((band) => {
        const current = bandMap.get(band.band);
        if (!current) {
          bandMap.set(band.band, {
            band: band.band,
            avgDeposit: band.avgDeposit * band.transactionCount,
            transactionCount: band.transactionCount,
          });
          return;
        }

        current.avgDeposit += band.avgDeposit * band.transactionCount;
        current.transactionCount += band.transactionCount;
      });

      item.monthlyTrend.forEach((point) => {
        const current = monthMap.get(point.month);
        if (!current) {
          monthMap.set(point.month, {
            month: point.month,
            avgDeposit: point.avgDeposit * point.transactionCount,
            transactionCount: point.transactionCount,
          });
          return;
        }

        current.avgDeposit += point.avgDeposit * point.transactionCount;
        current.transactionCount += point.transactionCount;
      });
    });

    const areaBands = Array.from(bandMap.values())
      .map((item) => ({
        band: item.band,
        avgDeposit: item.transactionCount > 0 ? Math.round(item.avgDeposit / item.transactionCount) : 0,
        transactionCount: item.transactionCount,
      }))
      .sort((a, b) => compareBandOrder(a.band, b.band));

    const monthlyTrend = Array.from(monthMap.values())
      .map((item) => ({
        month: item.month,
        avgDeposit: item.transactionCount > 0 ? Math.round(item.avgDeposit / item.transactionCount) : 0,
        transactionCount: item.transactionCount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const topRegion = [...filteredData].sort((a, b) => b.transactions - a.transactions)[0];
    const topAreaBand = [...areaBands].sort((a, b) => b.transactionCount - a.transactionCount)[0];
    const jeonseRatio = totalTransactions > 0 ? (totalJeonse / totalTransactions) * 100 : 0;
    const monthlyRatio = totalTransactions > 0 ? (totalMonthlyRentCount / totalTransactions) * 100 : 0;
    const averageDeposit =
      totalTransactions > 0 ? Math.round(totalDeposit / totalTransactions) : 0;
    const averageMonthlyRent =
      totalTransactions > 0 ? Math.round(totalMonthlyRent / totalTransactions) : 0;

    return {
      totalTransactions,
      averageDeposit,
      averageMonthlyRent,
      totalJeonse,
      totalMonthlyRentCount,
      jeonseRatio,
      monthlyRatio,
      topRegion,
      topAreaBand,
      areaBands,
      monthlyTrend,
    };
  }, [filteredData]);

  const ratioData = useMemo(
    () => [
      { name: "전세", value: aggregates.totalJeonse, color: "#2563eb" },
      { name: "월세", value: aggregates.totalMonthlyRentCount, color: "#f97316" },
    ],
    [aggregates.totalJeonse, aggregates.totalMonthlyRentCount]
  );

  const handleSearch = (query = searchInput) => {
    const normalized = query.trim();
    setActiveQuery(normalized);
    setSearchInput(normalized);

    if (!normalized) {
      return;
    }

    const nextHistory = [normalized, ...searchHistory.filter((item) => item !== normalized)].slice(0, 5);
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">지역 분석 데이터</h1>
          <p className="text-slate-600">
            샘플 데이터를 기준으로 지역별 평균 전세가, 평수별 거래가, 전세/월세 비율, 월별 거래 흐름을 한 화면에서
            확인할 수 있도록 구성했습니다.
          </p>
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
                  placeholder="지역명 검색 예: 수지구, 기흥구, 동백동"
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
                `{activeQuery}` 검색 결과 {filteredData.length}개 지역이 표시됩니다.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-slate-900">평균 보증금</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{formatMoney(aggregates.averageDeposit)}</div>
            <p className="text-sm text-slate-500">검색된 지역 기준 가중 평균</p>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-medium text-slate-900">전세 비율</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {aggregates.jeonseRatio.toFixed(1)}%
            </div>
            <p className="text-sm text-slate-500">
              전세 {aggregates.totalJeonse.toLocaleString("ko-KR")}건 / 전체 {aggregates.totalTransactions.toLocaleString("ko-KR")}건
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-medium text-slate-900">월세 비율</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {aggregates.monthlyRatio.toFixed(1)}%
            </div>
            <p className="text-sm text-slate-500">
              월세 {aggregates.totalMonthlyRentCount.toLocaleString("ko-KR")}건 / 전체 {aggregates.totalTransactions.toLocaleString("ko-KR")}건
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-slate-900">가장 거래 많은 지역</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {aggregates.topRegion?.region || "-"}
            </div>
            <p className="text-sm text-slate-500">
              거래 {aggregates.topRegion?.transactions.toLocaleString("ko-KR") ?? 0}건
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">월별 거래 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={aggregates.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  tickFormatter={(value) => formatMoney(Number(value))}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  formatter={(value, name) => {
                    if (name === "평균 전세가") {
                      return [formatMoney(Number(value)), name];
                    }
                    return [Number(value).toLocaleString("ko-KR"), name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="transactionCount"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="거래 건수"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgDeposit"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  name="평균 전세가"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">전세 / 월세 비율</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ratioData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {ratioData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => Number(value).toLocaleString("ko-KR")} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {ratioData.map((item) => (
                <div key={item.name} className="text-center p-3 bg-slate-50">
                  <div className="text-2xl font-bold text-slate-900">{item.value.toLocaleString("ko-KR")}건</div>
                  <div className="text-xs text-slate-600 mt-1">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">면적별 보증금</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aggregates.areaBands}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="band"
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  tickFormatter={(value) => formatAreaLabel(String(value))}
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(value) => formatMoney(Number(value))} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  formatter={(value, name) => {
                    if (name === "평균 보증금") {
                      return [formatMoney(Number(value)), name];
                    }
                    return [Number(value).toLocaleString("ko-KR"), name];
                  }}
                />
                <Bar dataKey="avgDeposit" fill="#0ea5e9" radius={[8, 8, 0, 0]} name="평균 보증금" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-slate-600">
              가장 거래가 많은 면적 구간은{" "}
              <span className="font-semibold text-slate-900">
                {formatAreaLabel(aggregates.topAreaBand?.band || "-")}
              </span>
              입니다.
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">면적대별 거래 요약</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">면적 구간</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-900">평균 보증금</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-900">거래 건수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {aggregates.areaBands.map((item) => (
                    <tr key={item.band} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900">{formatAreaLabel(item.band)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {formatMoney(item.avgDeposit)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {item.transactionCount.toLocaleString("ko-KR")}건
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">평균 보증금</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">평균 월세</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">전세/월세 비율</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">가격 변동</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">거래 건수</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">주요 면적대</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredData.map((item) => {
                  const topBand = [...item.areaBands].sort((a, b) => b.transactionCount - a.transactionCount)[0];
                  const ratio = item.transactions > 0 ? (item.jeonseCount / item.transactions) * 100 : 0;
                  const trendValue = item.monthlyTrend;
                  const latestTrend = trendValue[trendValue.length - 1];
                  const previousTrend = trendValue[trendValue.length - 2];
                  const priceChange = formatPriceChange(previousTrend?.avgDeposit ?? 0, latestTrend?.avgDeposit ?? 0);

                  return (
                    <tr key={item.region} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{item.region}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        {formatMoney(item.avgDeposit)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">
                        {formatMoney(item.avgMonthlyRent)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700">
                          전세 {ratio.toFixed(1)}% / 월세 {(100 - ratio).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">
                        {priceChange}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">
                        {item.transactions.toLocaleString("ko-KR")}건
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">
                        {formatAreaLabel(topBand?.band || "-")} · {formatMoney(topBand?.avgDeposit || 0)}
                      </td>
                    </tr>
                  );
                })}
                {filteredData.length === 0 && (
                  <tr>
                    <td className="px-6 py-10 text-center text-slate-500" colSpan={7}>
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
            현재 화면은 지역 분석 구조를 먼저 보여주기 위한 샘플 데이터 기반 대시보드입니다. 다음 단계에서는 CSV 원천
            데이터를 DB에 적재하고, 시군구 / 계약면적 / 전월세구분 / 계약년월 기준 집계로 교체하면 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
