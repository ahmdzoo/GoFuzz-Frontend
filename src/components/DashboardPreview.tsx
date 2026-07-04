import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  BarChart3,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useScan, type VulnerabilityItem } from "@/context/ScanContext";
import { severityToLevel } from "@/lib/constants";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface jsPDFWithTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

type MenuType = "dashboard" | "analyzer" | "insight" | "report";

const DashboardPreview = () => {
  const [activeMenu, setActiveMenu] = useState<MenuType>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [insightSeverityFilter, setInsightSeverityFilter] =
    useState<string>("all");

  const { result, setResult } = useScan();

  const vulnerabilitiesList = Array.isArray(result) ? result : [];


  const totalPayloads = vulnerabilitiesList.length;
  const vulnerableCount = vulnerabilitiesList.filter(
    (v) => v.raw_vulnerability === "🔴 Vulnerable",
  ).length;
  const suspiciousCount = vulnerabilitiesList.filter(
    (v) =>
      v.raw_vulnerability === "🟠 Suspicious" ||
      v.raw_vulnerability === "🟡 Check Needed",
  ).length;
  const safeCount = vulnerabilitiesList.filter(
    (v) => v.raw_vulnerability === "🟢 Safe",
  ).length;

  const attackDistribution: Record<string, number> = {};
  vulnerabilitiesList.forEach((v) => {
    let key = v.attack_type || "Normal";

    // 🔴 FIX: Jika key = "Suspicious", coba deteksi ulang
    if (key === "Suspicious") {
      const payload = v.payload?.toLowerCase() || "";
      if (
        payload.includes("or 1=1") ||
        payload.includes("union") ||
        payload.includes("--")
      ) {
        key = "SQL Injection";
      } else if (
        payload.includes("<script") ||
        payload.includes("alert(") ||
        payload.includes("onerror")
      ) {
        key = "Cross-Site Scripting (XSS)";
      } else if (payload.includes("../") || payload.includes("etc/passwd")) {
        key = "Path Traversal";
      } else if (
        payload.includes(";") ||
        payload.includes("&&") ||
        payload.includes("whoami")
      ) {
        key = "Command Injection";
      } else {
        // 🔴 FIX: Jika tidak terdeteksi, ubah ke "Normal"
        key = "Normal";
      }
    }

    attackDistribution[key] = (attackDistribution[key] || 0) + 1;
  });
  console.log("🔍 attackDistribution FINAL:", attackDistribution);

  const topAttack =
    Object.entries(attackDistribution).sort(
      (a: [string, number], b: [string, number]) => b[1] - a[1],
    )[0]?.[0] || "-";

  // ============================================
  // FILTER & SORTIR DATA
  // ============================================
  const filteredData = vulnerabilitiesList.filter((item) => {
    const matchesSearch =
      item.attack_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Normalisasi severity untuk filter
    let severityLevel = "Medium";
    const raw = item.raw_vulnerability || item.severity || "";

    if (raw === "🔴 Vulnerable" || raw === "Vulnerable") {
      severityLevel = "High";
    } else if (
      raw === "🟠 Suspicious" ||
      raw === "Suspicious" ||
      raw === "🟡 Check Needed" ||
      raw === "Check Needed"
    ) {
      severityLevel = "Medium";
    } else if (raw === "🟢 Safe" || raw === "Safe") {
      severityLevel = "Low";
    } else {
      // Fallback berdasarkan attack type
      if (
        item.attack_type === "SQL Injection" ||
        item.attack_type === "Command Injection"
      ) {
        severityLevel = "High";
      } else if (item.attack_type === "Normal") {
        severityLevel = "Low";
      } else {
        severityLevel = "Medium";
      }
    }

    const matchesSeverity =
      filterSeverity === "all" || severityLevel === filterSeverity;

    return matchesSearch && matchesSeverity;
  });

  // 🔴 SORTIR: Prioritaskan Vulnerable → Suspicious → Check Needed → Safe
  const sortedData = [...filteredData].sort((a, b) => {
    const priority: Record<string, number> = {
      "🔴 Vulnerable": 1,
      Vulnerable: 1,
      "🟠 Suspicious": 2,
      Suspicious: 2,
      "🟡 Check Needed": 3,
      "Check Needed": 3,
      "🟢 Safe": 4,
      Safe: 4,
    };

    const aRaw = a.raw_vulnerability || a.severity || "";
    const bRaw = b.raw_vulnerability || b.severity || "";

    const aPriority = priority[aRaw] || 5;
    const bPriority = priority[bRaw] || 5;

    return aPriority - bPriority;
  });

  const exportToCSV = (data: VulnerabilityItem[], filename: string) => {
    if (data.length === 0) {
      alert("Tidak ada data untuk di-export!");
      return;
    }

    const headers = [
      "ID",
      "Attack Type",
      "Severity",
      "Payload",
      "Status",
      "Recommendation",
    ];
    const rows = data.map((item) => [
      item.id,
      item.attack_type,
      item.raw_vulnerability || item.severity,
      `"${(item.payload || "").replace(/"/g, '""')}"`,
      item.status || "-",
      `"${item.recommendation.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetScan = () => {
    if (confirm("Reset semua hasil analisis?")) {
      setResult([]);
      setActiveMenu("dashboard");
      setSearchTerm("");
      setFilterSeverity("all");
    }
  };

  const menuItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
    { id: "analyzer" as const, label: "Analyzer", icon: Activity },
    { id: "insight" as const, label: "Insight", icon: ShieldAlert },
    { id: "report" as const, label: "Report", icon: FileText },
  ];

  // ============ RENDER DASHBOARD ============
  const renderDashboard = () => {
    const hasData = vulnerabilitiesList.length > 0;

    // 🔴 FUNGSI WARNA YANG SUDAH DIPERBAIKI
    const getAttackColor = (attack: string, index: number) => {
      const colors: Record<string, string> = {
        "SQL Injection": "from-red-500 to-red-600",
        "Command Injection": "from-pink-500 to-pink-600",
        "Cross-Site Scripting (XSS)": "from-orange-500 to-orange-600",
        XSS: "from-orange-500 to-orange-600",
        "Path Traversal": "from-yellow-500 to-yellow-600",
        Normal: "from-green-500 to-green-600",
      };
      // Fallback kalau ada attack type lain
      return colors[attack] || "from-gray-500 to-gray-600";
    };

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">Total Payload</p>
            <h3 className="text-2xl font-bold glow-text">{totalPayloads}</h3>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">Vulnerable</p>
            <h3 className="text-2xl font-bold text-red-400">
              {vulnerableCount}
            </h3>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">Suspicious</p>
            <h3 className="text-2xl font-bold text-yellow-400">
              {suspiciousCount}
            </h3>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">Safe</p>
            <h3 className="text-2xl font-bold text-green-400">{safeCount}</h3>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Attack Distribution
              </p>
              <h4 className="text-lg font-semibold mt-1">
                Distribusi Serangan per Tipe
              </h4>
            </div>
            {hasData && (
              <button
                onClick={() =>
                  exportToCSV(vulnerabilitiesList, "attack_distribution")
                }
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Download size={12} />
                Export Data
              </button>
            )}
          </div>

          {hasData ? (
            <div>
              <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
                {/* PIE CHART */}
                <div className="relative w-48 h-48">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    {(() => {
                      const keys = Object.keys(attackDistribution).filter(
                        (key) => attackDistribution[key] > 0,
                      );

                      // 🔴 KALAU CUMA 1 KATEGORI, GAMBAR LINGKARAN PENUH!
                      if (keys.length === 1) {
                        const key = keys[0];
                        const colorMap: Record<string, string> = {
                          "SQL Injection": "#ef4444",
                          "Command Injection": "#ec4899",
                          "Cross-Site Scripting (XSS)": "#f97316",
                          XSS: "#f97316",
                          "Path Traversal": "#eab308",
                          Normal: "#22c55e",
                        };
                        const color = colorMap[key] || "#3b82f6";

                        return (
                          <circle
                            cx="50"
                            cy="50"
                            r="23"
                            fill="none"
                            stroke={color}
                            strokeWidth="16"
                            strokeLinecap="round"
                            onClick={() => setSelectedCategory(key)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        );
                      }

                      // 🔴 KALAU LEBIH DARI 1, PAKAI PATH SEPERTI BIASA
                      return keys.reduce(
                        (acc: { offset: number; paths: React.ReactNode[] }, key: string, idx: number) => {
                          const value = attackDistribution[key];
                          const angle = (value / totalPayloads) * 360;
                          const startAngle = acc.offset;
                          const endAngle = startAngle + angle;
                          const startRad = (startAngle * Math.PI) / 180;
                          const endRad = (endAngle * Math.PI) / 180;
                          const x1 = 50 + 35 * Math.cos(startRad);
                          const y1 = 50 + 35 * Math.sin(startRad);
                          const x2 = 50 + 35 * Math.cos(endRad);
                          const y2 = 50 + 35 * Math.sin(endRad);
                          const largeArc = angle > 180 ? 1 : 0;

                          const colorMap: Record<string, string> = {
                            "SQL Injection": "#ef4444",
                            "Command Injection": "#ec4899",
                            "Cross-Site Scripting (XSS)": "#f97316",
                            XSS: "#f97316",
                            "Path Traversal": "#eab308",
                            Normal: "#22c55e",
                          };
                          const color = colorMap[key] || "#3b82f6";

                          acc.paths.push(
                            <path
                              key={key}
                              d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={color}
                              className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                              onClick={() => setSelectedCategory(key)}
                            />,
                          );
                          acc.offset = endAngle;
                          return acc;
                        },
                        { paths: [] as JSX.Element[], offset: 0 },
                      ).paths;
                    })()}

                    {/* 🔴 LINGKARAN TENGAH (BIAR JADI DONUT) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="23"
                      fill="#1e1e2e"
                      stroke="#2a2a3a"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{totalPayloads}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>

                {/* LEGEND */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys(attackDistribution)
                    .filter((key) => attackDistribution[key] > 0)
                    .map((key, idx) => {
                      const val = attackDistribution[key];
                      const persen = (val / totalPayloads) * 100;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all"
                          onClick={() => setSelectedCategory(key)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full bg-gradient-to-r ${getAttackColor(
                                key,
                                idx,
                              )}`}
                            />
                            <span className="text-sm font-medium">{key}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{val}</span>
                            <span className="text-xs text-muted-foreground">
                              ({persen.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* DETAIL PER ATTACK TYPE (PROGRESS BAR) */}
              <div className="space-y-3 mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  Detail per Attack Type
                </p>
                {Object.keys(attackDistribution)
                  .filter((key) => attackDistribution[key] > 0)
                  .map((key, idx) => {
                    const val = attackDistribution[key];
                    const persen = (val / totalPayloads) * 100;
                    return (
                      <div key={key} className="group">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">
                            {key === "Cross-Site Scripting (XSS)" ? "XSS" : key}
                          </span>
                          <span>
                            {val} payload ({persen.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-8 bg-primary/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getAttackColor(
                              key,
                              idx,
                            )} rounded-full flex items-center px-3 text-xs text-white font-medium transition-all duration-500 group-hover:opacity-90`}
                            style={{ width: `${persen}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-muted-foreground flex-col gap-3">
              <BarChart3 size={48} className="opacity-30" />
              <p>
                📊 Belum ada data. Scan file atau URL untuk melihat hasil
                analisis.
              </p>
            </div>
          )}
        </div>

        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground mb-2">AI Insight</p>
          <p className="text-sm">
            {hasData ? (
              <>
                Dari {totalPayloads} payload yang dianalisis, ditemukan{" "}
                {vulnerableCount} payload yang berpotensi berbahaya. Serangan
                terbanyak adalah{" "}
                <span className="text-primary font-semibold">{topAttack}</span>.
              </>
            ) : (
              "🔍 Silakan upload file atau scan URL untuk memulai analisis keamanan."
            )}
          </p>
        </div>
      </>
    );
  };

  // ============ RENDER ANALYZER ============
  // UPDATED: getSeverityBadge dengan parameter attack type
  const getSeverityBadge = (vulnerability: string, attackType?: string) => {
    const raw = vulnerability || "";

    if (raw.includes("Vulnerable") || raw === "🔴 Vulnerable") {
      return "bg-red-400/20 text-red-400";
    }
    if (raw.includes("Suspicious") || raw === "🟠 Suspicious") {
      return "bg-yellow-400/20 text-yellow-400";
    }
    if (raw.includes("Check Needed") || raw === "🟡 Check Needed") {
      return "bg-orange-400/20 text-orange-400";
    }
    if (raw.includes("Safe") || raw === "🟢 Safe") {
      return "bg-green-400/20 text-green-400";
    }

    // Fallback berdasarkan attack type
    if (attackType === "SQL Injection" || attackType === "Command Injection") {
      return "bg-red-400/20 text-red-400";
    }
    if (attackType === "Normal") {
      return "bg-green-400/20 text-green-400";
    }
    return "bg-gray-400/20 text-gray-400";
  };

  // Fungsi untuk mendapatkan display vulnerability
  const getDisplayVulnerability = (item: VulnerabilityItem) => {
    if (item.raw_vulnerability) return item.raw_vulnerability;

    if (item.attack_type === "SQL Injection") return "🔴 Vulnerable";
    if (item.attack_type === "Command Injection") return "🔴 Vulnerable";
    if (item.attack_type === "Cross-Site Scripting (XSS)")
      return "🟠 Suspicious";
    if (item.attack_type === "XSS") return "🟠 Suspicious";
    if (item.attack_type === "Path Traversal") return "🟠 Suspicious";
    if (item.attack_type === "Normal") return "🟢 Safe";
    return "⚪ Unknown";
  };

  const renderAnalyzer = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h3 className="text-xl font-bold glow-text">Security Analyzer</h3>
          <button
            onClick={() => exportToCSV(filteredData, "vulnerability_analysis")}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <Search size={16} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search attacks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1"
              disabled={vulnerabilitiesList.length === 0}
            />
          </div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-black/20 rounded-lg px-3 py-2 text-sm outline-none"
            disabled={vulnerabilitiesList.length === 0}
          >
            <option value="all">All Severity</option>
            <option value="High">High (🔴 Vulnerable)</option>
            <option value="Medium">Medium (🟠 Suspicious)</option>
            <option value="Low">Low (🟢 Safe)</option>
          </select>
        </div>

        {vulnerabilitiesList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50">
                <tr className="text-left">
                  <th className="pb-3 px-4">#</th>
                  <th className="pb-3 px-4">Attack Type</th>
                  <th className="pb-3 px-4">Vulnerability</th>
                  <th className="pb-3 px-4">Payload</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Length</th> {/* ← TAMBAH */}
                  <th className="pb-3 px-4">Confidence</th> {/* 🔴 TAMBAHKAN */}
                  <th className="pb-3 px-4">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/30 hover:bg-primary/5"
                  >
                    <td className="py-3 px-4">{item.id}</td>
                    <td className="py-3 px-4 font-medium">
                      {item.attack_type}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getSeverityBadge(item.raw_vulnerability, item.attack_type)}`}
                      >
                        {getDisplayVulnerability(item)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative group">
                        <p className="text-xs font-mono cursor-help break-words max-w-xs">
                          {item.payload?.substring(0, 60)}...
                        </p>
                        <div className="absolute z-50 hidden group-hover:block bg-black/95 text-white text-xs rounded-lg p-3 max-w-md -mt-8 left-0 shadow-xl border border-primary/30">
                          <p className="font-semibold mb-1 text-primary">
                            📦 Payload:
                          </p>
                          <p className="break-all font-mono">{item.payload}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-mono ${
                          item.status >= 500
                            ? "bg-red-400/20 text-red-400"
                            : item.status >= 400
                              ? "bg-yellow-400/20 text-yellow-400"
                              : item.status === 200
                                ? "bg-green-400/20 text-green-400"
                                : "bg-gray-400/20 text-gray-400"
                        }`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>
                    {/* 🔴 KOLOM LENGTH */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-mono ${
                          parseInt(item.length) > 1000
                            ? "bg-orange-400/20 text-orange-400 font-bold"
                            : "bg-blue-400/20 text-blue-400"
                        }`}
                      >
                        {item.length || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-primary/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.confidence > 80
                                ? "bg-green-500"
                                : item.confidence > 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono">
                          {item.confidence || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative group">
                        <p className="text-sm cursor-help break-words max-w-xs">
                          {item.recommendation.length > 60
                            ? item.recommendation.substring(0, 60) + "..."
                            : item.recommendation}
                        </p>
                        <div className="absolute z-50 hidden group-hover:block bg-black/95 text-white text-xs rounded-lg p-3 min-w-[280px] max-w-md bottom-full left-0 mb-2 shadow-xl border border-primary/30">
                          <p className="font-semibold mb-1 text-primary">
                            💡 Recommendation:
                          </p>
                          <p>{item.recommendation}</p>
                          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-black/95 rotate-45 border-r border-b border-primary/30"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data yang sesuai dengan filter
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-2">📭 Belum ada data vulnerabilitas</p>
            <p className="text-sm">
              Silakan scan URL atau upload file terlebih dahulu
            </p>
          </div>
        )}
      </div>
    );
  };

  // ============ RENDER INSIGHT ============
  const renderInsight = () => {
    let filteredInsight = vulnerabilitiesList;

    if (selectedCategory !== "all") {
      filteredInsight = filteredInsight.filter(
        (v) => v.attack_type === selectedCategory,
      );
    }

    if (insightSeverityFilter !== "all") {
      filteredInsight = filteredInsight.filter((v) => {
        if (insightSeverityFilter === "vulnerable") {
          return v.raw_vulnerability === "🔴 Vulnerable";
        }
        if (insightSeverityFilter === "suspicious") {
          return v.raw_vulnerability === "🟠 Suspicious";
        }
        if (insightSeverityFilter === "check") {
          return v.raw_vulnerability === "🟡 Check Needed";
        }
        if (insightSeverityFilter === "safe") {
          return v.raw_vulnerability === "🟢 Safe";
        }
        return true;
      });
    }

    const categories = [
      "all",
      ...new Set(vulnerabilitiesList.map((v) => v.attack_type)),
    ];

    const severityCounts = {
      vulnerable: vulnerabilitiesList.filter(
        (v) => v.raw_vulnerability === "🔴 Vulnerable",
      ).length,
      suspicious: vulnerabilitiesList.filter(
        (v) => v.raw_vulnerability === "🟠 Suspicious",
      ).length,
      check: vulnerabilitiesList.filter(
        (v) => v.raw_vulnerability === "🟡 Check Needed",
      ).length,
      safe: vulnerabilitiesList.filter((v) => v.raw_vulnerability === "🟢 Safe")
        .length,
    };

    const getSeverityColor = (vulnerability: string) => {
      if (vulnerability === "🔴 Vulnerable")
        return "border-red-400/30 bg-red-400/5";
      if (vulnerability === "🟠 Suspicious")
        return "border-yellow-400/30 bg-yellow-400/5";
      if (vulnerability === "🟡 Check Needed")
        return "border-orange-400/30 bg-orange-400/5";
      return "border-green-400/30 bg-green-400/5";
    };

    const getIcon = (vulnerability: string) => {
      if (vulnerability === "🔴 Vulnerable")
        return <AlertTriangle size={20} className="text-red-400" />;
      if (vulnerability === "🟠 Suspicious")
        return <ShieldAlert size={20} className="text-yellow-400" />;
      if (vulnerability === "🟡 Check Needed")
        return <ShieldAlert size={20} className="text-orange-400" />;
      return <ShieldCheck size={20} className="text-green-400" />;
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold glow-text flex items-center gap-2">
              <BookOpen size={24} />
              Security Education
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Pelajari tentang kerentanan dan cara pencegahannya
            </p>
          </div>
          <button
            onClick={() => exportToCSV(filteredInsight, "security_insights")}
            disabled={filteredInsight.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <Download size={16} /> Export Insights
          </button>
        </div>

        {vulnerabilitiesList.length > 0 ? (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Filter by Severity:
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setInsightSeverityFilter("all")}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${insightSeverityFilter === "all" ? "bg-primary text-white" : "bg-primary/10 hover:bg-primary/20 text-muted-foreground"}`}
                  >
                    All ({vulnerabilitiesList.length})
                  </button>
                  <button
                    onClick={() => setInsightSeverityFilter("vulnerable")}
                    className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 ${insightSeverityFilter === "vulnerable" ? "bg-red-500 text-white" : "bg-red-500/20 hover:bg-red-500/30 text-red-400"}`}
                  >
                    <AlertTriangle size={12} /> Vulnerable (
                    {severityCounts.vulnerable})
                  </button>
                  <button
                    onClick={() => setInsightSeverityFilter("suspicious")}
                    className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 ${insightSeverityFilter === "suspicious" ? "bg-yellow-500 text-black" : "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"}`}
                  >
                    <ShieldAlert size={12} /> Suspicious (
                    {severityCounts.suspicious})
                  </button>
                  <button
                    onClick={() => setInsightSeverityFilter("check")}
                    className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 ${insightSeverityFilter === "check" ? "bg-orange-500 text-white" : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-400"}`}
                  >
                    <ShieldAlert size={12} /> Check Needed (
                    {severityCounts.check})
                  </button>
                  <button
                    onClick={() => setInsightSeverityFilter("safe")}
                    className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 ${insightSeverityFilter === "safe" ? "bg-green-500 text-white" : "bg-green-500/20 hover:bg-green-500/30 text-green-400"}`}
                  >
                    <ShieldCheck size={12} /> Safe ({severityCounts.safe})
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Filter by Attack Type:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${selectedCategory === cat ? "bg-primary text-white" : "bg-primary/10 hover:bg-primary/20"}`}
                    >
                      {cat === "all" ? "All Types" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {(selectedCategory !== "all" ||
                insightSeverityFilter !== "all") && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    Active filters:
                  </span>
                  {selectedCategory !== "all" && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary">
                      {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className="ml-1 hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {insightSeverityFilter !== "all" && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary">
                      {insightSeverityFilter === "vulnerable" &&
                        "🔴 Vulnerable"}
                      {insightSeverityFilter === "suspicious" &&
                        "🟠 Suspicious"}
                      {insightSeverityFilter === "check" && "🟡 Check Needed"}
                      {insightSeverityFilter === "safe" && "🟢 Safe"}
                      <button
                        onClick={() => setInsightSeverityFilter("all")}
                        className="ml-1 hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setInsightSeverityFilter("all");
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredInsight.length} of {vulnerabilitiesList.length}{" "}
              vulnerabilities
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInsight.map((item) => (
                <div
                  key={item.id}
                  className={`glass-card p-4 rounded-xl border-l-4 ${getSeverityColor(item.raw_vulnerability)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getIcon(item.raw_vulnerability)}
                      <h4 className="font-bold">{item.attack_type}</h4>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${item.raw_vulnerability === "🔴 Vulnerable" ? "bg-red-400/20 text-red-400" : item.raw_vulnerability === "🟠 Suspicious" ? "bg-yellow-400/20 text-yellow-400" : item.raw_vulnerability === "🟡 Check Needed" ? "bg-orange-400/20 text-orange-400" : "bg-green-400/20 text-green-400"}`}
                    >
                      {item.raw_vulnerability || getDisplayVulnerability(item)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    <span className="font-semibold">Payload:</span>{" "}
                    {item.payload?.substring(0, 100)}...
                  </p>
                  <div className="bg-black/20 rounded-lg p-3 mb-2">
                    <p className="text-xs font-semibold mb-1">
                      📝 Rekomendasi:
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.recommendation}
                    </p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1">
                      🛡️ Tips Pencegahan:
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.attack_type === "SQL Injection" &&
                        "Gunakan parameterized queries, input validation, dan principle of least privilege untuk database."}
                      {item.attack_type === "Command Injection" &&
                        "Hindari fungsi system(), exec(), shell_exec(). Gunakan allowlist perintah, escape input, dan gunakan API yang lebih aman."}
                      {(item.attack_type === "Cross-Site Scripting (XSS)" ||
                        item.attack_type === "XSS") &&
                        "Gunakan sanitasi output, CSP headers, dan encode karakter HTML."}
                      {item.attack_type === "Path Traversal" &&
                        "Validasi path, gunakan whitelist, dan hindari input user langsung ke filesystem."}
                      {item.attack_type === "Normal" &&
                        "Payload ini aman, tetap terapkan security best practices secara umum."}
                      {![
                        "SQL Injection",
                        "Command Injection",
                        "Cross-Site Scripting (XSS)",
                        "XSS",
                        "Path Traversal",
                        "Normal",
                      ].includes(item.attack_type) &&
                        "Lakukan security review berkala dan implementasi defense in depth."}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredInsight.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Tidak ada data yang sesuai dengan filter</p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setInsightSeverityFilter("all");
                  }}
                  className="mt-2 text-primary hover:underline text-sm"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
            <p>Belum ada data vulnerabilitas untuk ditampilkan</p>
            <p className="text-sm mt-1">
              Silakan scan URL atau upload file terlebih dahulu
            </p>
          </div>
        )}
      </div>
    );
  };

  // ============ RENDER REPORT ============
  const renderReport = () => {
    const hasData = vulnerabilitiesList.length > 0;

    const highRiskItems = vulnerabilitiesList.filter(
      (v) => v.raw_vulnerability === "🔴 Vulnerable",
    );
    const mediumRiskItems = vulnerabilitiesList.filter(
      (v) => v.raw_vulnerability === "🟠 Suspicious",
    );
    const checkNeededItems = vulnerabilitiesList.filter(
      (v) => v.raw_vulnerability === "🟡 Check Needed",
    );
    const safeItems = vulnerabilitiesList.filter(
      (v) => v.raw_vulnerability === "🟢 Safe",
    );

    const attackTypeCount: Record<string, number> = {};
    vulnerabilitiesList.forEach((v) => {
      attackTypeCount[v.attack_type] =
        (attackTypeCount[v.attack_type] || 0) + 1;
    });
    const topAttacks = Object.entries(attackTypeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const dangerousPayloads = highRiskItems
      .map((v) => v.payload)
      .filter((p) => p);

    const exportToPDF = () => {
      try {
        const doc = new jsPDF();
        let yPos = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFontSize(20);
        doc.setTextColor(33, 33, 33);
        doc.setFont("helvetica", "bold");
        doc.text("SECURITY REPORT", pageWidth / 2, yPos, { align: "center" });

        yPos += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          yPos,
          { align: "center" },
        );

        yPos += 10;
        doc.setDrawColor(59, 130, 246);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 8;

        const cardWidth = (pageWidth - 45) / 4;

        doc.setFillColor(240, 248, 255);
        doc.roundedRect(15, yPos, cardWidth, 30, 3, 3, "F");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Total Scan", 15 + cardWidth / 2, yPos + 10, {
          align: "center",
        });
        doc.setFontSize(16);
        doc.setTextColor(59, 130, 246);
        doc.setFont("helvetica", "bold");
        doc.text(`${totalPayloads}`, 15 + cardWidth / 2, yPos + 25, {
          align: "center",
        });

        doc.setFillColor(254, 242, 242);
        doc.roundedRect(20 + cardWidth, yPos, cardWidth, 30, 3, 3, "F");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text("Critical", 20 + cardWidth + cardWidth / 2, yPos + 10, {
          align: "center",
        });
        doc.setFontSize(16);
        doc.setTextColor(239, 68, 68);
        doc.setFont("helvetica", "bold");
        doc.text(
          `${highRiskItems.length}`,
          20 + cardWidth + cardWidth / 2,
          yPos + 25,
          { align: "center" },
        );

        doc.setFillColor(255, 247, 237);
        doc.roundedRect(25 + cardWidth * 2, yPos, cardWidth, 30, 3, 3, "F");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text("High", 25 + cardWidth * 2 + cardWidth / 2, yPos + 10, {
          align: "center",
        });
        doc.setFontSize(16);
        doc.setTextColor(249, 115, 22);
        doc.setFont("helvetica", "bold");
        doc.text(
          `${mediumRiskItems.length}`,
          25 + cardWidth * 2 + cardWidth / 2,
          yPos + 25,
          { align: "center" },
        );

        doc.setFillColor(240, 253, 244);
        doc.roundedRect(30 + cardWidth * 3, yPos, cardWidth, 30, 3, 3, "F");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text("Safe", 30 + cardWidth * 3 + cardWidth / 2, yPos + 10, {
          align: "center",
        });
        doc.setFontSize(16);
        doc.setTextColor(34, 197, 94);
        doc.setFont("helvetica", "bold");
        doc.text(
          `${safeItems.length}`,
          30 + cardWidth * 3 + cardWidth / 2,
          yPos + 25,
          { align: "center" },
        );

        yPos += 40;

        doc.setFontSize(11);
        doc.setTextColor(33, 33, 33);
        doc.setFont("helvetica", "bold");
        doc.text("Executive Summary", 15, yPos);

        yPos += 6;
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");
        const summaryText = `Dari ${totalPayloads} payload yang dianalisis, ditemukan ${highRiskItems.length} kerentanan kritis (Vulnerable), ${mediumRiskItems.length} kerentanan tinggi (Suspicious), dan ${safeItems.length} payload aman (Safe).`;
        const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 30);
        doc.text(splitSummary, 15, yPos);
        yPos += splitSummary.length * 5 + 8;

        doc.setFontSize(10);
        doc.setTextColor(33, 33, 33);
        doc.setFont("helvetica", "bold");
        doc.text("Vulnerability Distribution", 15, yPos);

        autoTable(doc, {
          startY: yPos + 5,
          head: [["Severity", "Count", "Percentage", "Status"]],
          body: [
            [
              "[!] Critical (Vulnerable)",
              highRiskItems.length.toString(),
              `${Math.round((highRiskItems.length / totalPayloads) * 100)}%`,
              "Urgent",
            ],
            [
              "[~] High (Suspicious)",
              mediumRiskItems.length.toString(),
              `${Math.round((mediumRiskItems.length / totalPayloads) * 100)}%`,
              "High Priority",
            ],
            [
              "[?] Check Needed",
              checkNeededItems.length.toString(),
              `${Math.round((checkNeededItems.length / totalPayloads) * 100)}%`,
              "Review",
            ],
            [
              "[v] Safe",
              safeItems.length.toString(),
              `${Math.round((safeItems.length / totalPayloads) * 100)}%`,
              "Monitor",
            ],
          ],
          theme: "striped",
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8 },
          margin: { left: 15, right: 15 },
        });

        yPos = (doc as jsPDFWithTable).lastAutoTable!.finalY + 10;

        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(33, 33, 33);
        doc.setFont("helvetica", "bold");
        doc.text("Top Attack Types", 15, yPos);

        const attackBody = topAttacks.map(([attack, count]) => [
          attack,
          count.toString(),
          `${Math.round(((count as number) / totalPayloads) * 100)}%`,
        ]);

        autoTable(doc, {
          startY: yPos + 5,
          head: [["Attack Type", "Count", "Percentage"]],
          body: attackBody,
          theme: "striped",
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8 },
          margin: { left: 15, right: 15 },
        });

        yPos = (doc as jsPDFWithTable).lastAutoTable!.finalY + 10;

        if (dangerousPayloads.length > 0) {
          if (yPos > 210) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(10);
          doc.setTextColor(33, 33, 33);
          doc.setFont("helvetica", "bold");
          doc.text("Critical Payload Examples", 15, yPos);

          const payloadBody = dangerousPayloads
            .slice(0, 5)
            .map((payload) => [
              payload?.substring(0, 55) + (payload?.length > 55 ? "..." : ""),
              "CRITICAL",
            ]);

          autoTable(doc, {
            startY: yPos + 5,
            head: [["Payload", "Severity"]],
            body: payloadBody,
            theme: "striped",
            headStyles: {
              fillColor: [239, 68, 68],
              textColor: [255, 255, 255],
              fontSize: 9,
              fontStyle: "bold",
            },
            bodyStyles: { fontSize: 7 },
            margin: { left: 15, right: 15 },
          });

          yPos = (doc as jsPDFWithTable).lastAutoTable!.finalY + 10;
        }

        if (yPos > 230) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(33, 33, 33);
        doc.setFont("helvetica", "bold");
        doc.text("Recommendations", 15, yPos);

        yPos += 6;
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");

        const recs = [];
        if (highRiskItems.length > 0) {
          recs.push(
            `[!] Segera perbaiki ${highRiskItems.length} kerentanan kritis (Vulnerable)`,
          );
        }
        if (mediumRiskItems.length > 0) {
          recs.push(
            `[~] Investigasi ${mediumRiskItems.length} payload mencurigakan (Suspicious)`,
          );
        }
        recs.push("[*] Implementasikan input validation untuk semua form");
        recs.push(
          "[*] Gunakan parameterized queries untuk mencegah SQL Injection",
        );
        recs.push("[*] Terapkan Content Security Policy (CSP) headers");

        recs.forEach((rec) => {
          doc.text(rec, 15, yPos);
          yPos += 5;
        });

        yPos += 5;

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          "AI Security Scanner - Confidential Report",
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" },
        );

        doc.save(
          `Security_Report_${new Date().toISOString().split("T")[0]}.pdf`,
        );
        console.log("PDF berhasil di-download!");
      } catch (error) {
        console.error("Error:", error);
        alert("Gagal export PDF: " + error);
      }
    };

    const getPriorityRecommendations = () => {
      const recommendations = [];
      if (highRiskItems.length > 0) {
        recommendations.push({
          level: "critical",
          title: "Kerentanan Kritis",
          action: `Segera perbaiki ${highRiskItems.length} payload dengan status Vulnerable`,
          details: highRiskItems
            .slice(0, 3)
            .map((v) => `${v.attack_type}: ${v.payload?.substring(0, 50)}...`),
        });
      }
      if (mediumRiskItems.length > 0) {
        recommendations.push({
          level: "high",
          title: "Kerentanan Menengah",
          action: `Investigasi ${mediumRiskItems.length} payload dengan status Suspicious`,
          details: mediumRiskItems
            .slice(0, 3)
            .map((v) => `${v.attack_type}: ${v.payload?.substring(0, 50)}...`),
        });
      }
      if (checkNeededItems.length > 0) {
        recommendations.push({
          level: "medium",
          title: "Perlu Verifikasi",
          action: `Lakukan pengecekan manual pada ${checkNeededItems.length} payload`,
          details: checkNeededItems
            .slice(0, 3)
            .map((v) => `${v.attack_type}: ${v.payload?.substring(0, 50)}...`),
        });
      }
      return recommendations;
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h3 className="text-xl font-bold glow-text flex items-center gap-2">
            <FileText size={24} />
            Security Report
          </h3>
          <button
            onClick={() => {
              console.log("Tombol diklik");
              exportToPDF();
            }}
            disabled={!hasData}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Export PDF Report
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">Total Scan</p>
            <h3 className="text-2xl font-bold glow-text">{totalPayloads}</h3>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              Critical (Vulnerable)
            </p>
            <h3 className="text-2xl font-bold text-red-400">{vulnerableCount}</h3>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">High (Suspicious)</p>
            <h3 className="text-2xl font-bold text-orange-400">
              {suspiciousCount}
            </h3>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">Low (Safe)</p>
            <h3 className="text-2xl font-bold text-green-400">{safeCount}</h3>
          </div>
        </div>

        {hasData && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-red-400" />
              <h4 className="font-bold text-lg">
                Highlight Utama Permasalahan
              </h4>
            </div>

            <div className="glass-card p-5 rounded-xl mb-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-l-4 border-red-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    📊 Ringkasan Eksekutif
                  </p>
                  <p className="text-base font-semibold">
                    Dari{" "}
                    <span className="text-primary font-bold">
                      {totalPayloads}
                    </span>{" "}
                    payload yang dianalisis, ditemukan{" "}
                    <span className="text-red-400 font-bold">
                      {highRiskItems.length} kerentanan kritis
                    </span>
                    ,
                    <span className="text-orange-400 font-bold">
                      {" "}
                      {mediumRiskItems.length} kerentanan tinggi
                    </span>
                    , dan{" "}
                    <span className="text-yellow-400 font-bold">
                      {" "}
                      {checkNeededItems.length} perlu verifikasi
                    </span>
                    .
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="text-center px-3 py-1 rounded-lg bg-red-500/20">
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                    <p className="text-xl font-bold text-red-400">
                      {Math.round((highRiskItems.length / totalPayloads) * 100)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="glass-card p-4 rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">
                  🎯 Top Attack Types
                </p>
                <div className="space-y-2">
                  {topAttacks.map(([attack, count], idx) => (
                    <div
                      key={attack}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-red-400" : idx === 1 ? "bg-orange-400" : "bg-yellow-400"}`}
                        />
                        <span className="text-sm">{attack}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${idx === 0 ? "bg-red-400" : idx === 1 ? "bg-orange-400" : "bg-yellow-400"}`}
                            style={{
                              width: `${((count as number) / totalPayloads) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono">
                          {count} payload
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {dangerousPayloads.length > 0 && (
                <div className="glass-card p-4 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">
                    ⚠️ Contoh Payload Berbahaya
                  </p>
                  <div className="space-y-2">
                    {dangerousPayloads.slice(0, 2).map((payload, idx) => (
                      <div key={idx} className="bg-red-500/10 rounded-lg p-2">
                        <p className="text-xs font-mono break-all text-red-300">
                          {payload?.substring(0, 80)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card p-4 rounded-xl">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ShieldAlert size={16} />
                Rekomendasi Prioritas Berdasarkan Temuan
              </p>
              <div className="space-y-3">
                {getPriorityRecommendations().map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${
                      rec.level === "critical"
                        ? "border-red-500 bg-red-500/5"
                        : rec.level === "high"
                          ? "border-orange-500 bg-orange-500/5"
                          : "border-yellow-500 bg-yellow-500/5"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p
                          className={`font-semibold text-sm ${
                            rec.level === "critical"
                              ? "text-red-400"
                              : rec.level === "high"
                                ? "text-orange-400"
                                : "text-yellow-400"
                          }`}
                        >
                          {rec.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rec.action}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          rec.level === "critical"
                            ? "bg-red-500/20 text-red-400"
                            : rec.level === "high"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {rec.level === "critical"
                          ? "Critical"
                          : rec.level === "high"
                            ? "High"
                            : "Medium"}
                      </span>
                    </div>
                    {rec.details.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <p className="text-xs text-muted-foreground mb-1">
                          Detail:
                        </p>
                        <ul className="text-xs list-disc list-inside space-y-0.5 text-muted-foreground">
                          {rec.details.map((detail, i) => (
                            <li key={i}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs font-semibold mb-2">
                  📋 General Security Recommendations:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Implementasikan input validation untuk semua form</li>
                  <li>
                    Gunakan parameterized queries untuk mencegah SQL Injection
                  </li>
                  <li>
                    Terapkan Content Security Policy (CSP) headers untuk
                    mencegah XSS
                  </li>
                  <li>
                    Lakukan security review berkala dan penetration testing
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card p-4 rounded-xl mt-4">
          <h4 className="font-semibold mb-3">Executive Summary</h4>
          {hasData ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Berdasarkan analisis keamanan yang dilakukan, ditemukan{" "}
                <span className="text-red-400 font-semibold">
                  {vulnerableCount} payload dengan status 🔴 Vulnerable
                </span>
                ,
                <span className="text-orange-400 font-semibold">
                  {" "}
                  {suspiciousCount} payload dengan status 🟠 Suspicious
                </span>
                , dan{" "}
                <span className="text-green-400 font-semibold">
                  {" "}
                  {safeCount} payload dengan status 🟢 Safe
                </span>
                .
                {vulnerableCount > 0 &&
                  " Risiko utama berasal dari SQL Injection, Command Injection, dan XSS attacks yang membutuhkan penanganan segera."}
              </p>
              <h4 className="font-semibold mb-3 mt-4">Rekomendasi Prioritas</h4>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                {vulnerableCount > 0 && (
                  <li className="text-red-400/80">
                    🔴 Segera investigasi dan perbaiki {vulnerableCount} payload yang
                    terdeteksi Vulnerable
                  </li>
                )}
                {suspiciousCount > 0 && (
                  <li className="text-orange-400/80">
                    🟠 Lakukan penanganan pada {suspiciousCount} payload yang
                    mencurigakan
                  </li>
                )}
                <li>✅ Implementasikan input validation untuk semua form</li>
                <li>
                  ✅ Gunakan parameterized queries untuk mencegah SQL Injection
                </li>
                <li>
                  ✅ Hindari fungsi system() untuk mencegah Command Injection
                </li>
                <li>
                  ✅ Terapkan Content Security Policy (CSP) headers untuk
                  mencegah XSS
                </li>
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada data laporan. Silakan lakukan scan terlebih dahulu.
            </p>
          )}
        </div>
      </div>
    );
  };

  // ============ MAIN RENDER ============
  return (
    <section id="dashboard" className="section-padding">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Analysis <span className="glow-text">Dashboard</span>
          </h2>
          {vulnerabilitiesList.length > 0 && (
            <button
              onClick={resetScan}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-red-400 transition-colors"
            >
              <RefreshCw size={16} /> Reset
            </button>
          )}
        </div>

        <div className="glass-card overflow-hidden rounded-2xl max-w-6xl mx-auto relative">
          <div className="flex min-h-[520px]">
            <div
              className={`${isSidebarOpen ? "w-64" : "w-20"} transition-all duration-300 ease-in-out border-r border-border/50 p-4 flex flex-col gap-2 relative`}
            >
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute -right-3 top-6 bg-primary rounded-full p-1 shadow-lg z-10"
              >
                {isSidebarOpen ? (
                  <ChevronLeft size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
              <span
                className={`text-sm font-bold glow-text mb-4 ${!isSidebarOpen && "text-center"}`}
              >
                {isSidebarOpen ? "Go Fuzzing" : "GoFuzz"}
              </span>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-primary/5"} ${!isSidebarOpen && "justify-center px-2"}`}
                  >
                    <Icon size={18} />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {activeMenu === "dashboard" && renderDashboard()}
              {activeMenu === "analyzer" && renderAnalyzer()}
              {activeMenu === "insight" && renderInsight()}
              {activeMenu === "report" && renderReport()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
