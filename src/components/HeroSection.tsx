import { useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import { useScan } from "@/context/ScanContext";
import { Upload, Globe, Shield, FileText, Loader2, Hash } from "lucide-react";
import { attackToSeverity } from "@/lib/constants";

interface ScanItem {
  attack?: string;
  attack_type?: string;
  vulnerability?: string;
  payload?: string;
  status?: string | number;
  length?: string | number;
  confidence?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const parameterExamples = [
  { name: "q", desc: "Search query (paling umum)", example: "?q=' OR 1=1 --", risks: "SQL Injection, XSS" },
  { name: "id", desc: "ID parameter", example: "?id=1", risks: "SQL Injection, IDOR" },
  { name: "search", desc: "Search query", example: "?search=test", risks: "SQL Injection, XSS" },
  { name: "sort", desc: "Sort/Order by", example: "?sort=name", risks: "SQL Injection (ORDER BY)" },
  { name: "file", desc: "File download", example: "?file=report.pdf", risks: "Path Traversal, LFI" },
  { name: "redirect", desc: "Redirect URL", example: "?redirect=home", risks: "Open Redirect, SSRF" },
  { name: "email", desc: "Email parameter", example: "?email=admin@test.com", risks: "SQL Injection, NoSQL" },
  { name: "username", desc: "Username parameter", example: "?username=admin", risks: "SQL Injection, Auth Bypass" },
  { name: "page", desc: "Pagination", example: "?page=1", risks: "SQL Injection, Path Traversal" },
  { name: "category", desc: "Category filter", example: "?category=electronics", risks: "SQL Injection" },
];

const HeroSection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [parsing, setParsing] = useState(false); // State untuk parsing
  const [param, setParam] = useState("q");
  const [showParamModal, setShowParamModal] = useState(false);
  const [detectedParams, setDetectedParams] = useState<string[]>([]);
  const [detectingParams, setDetectingParams] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [crawledEndpoints, setCrawledEndpoints] = useState<string[]>([]);
  const [crawledParams, setCrawledParams] = useState<string[]>([]);
  const [payloadLimit, setPayloadLimit] = useState<number>(50);
  const [scanLoading, setScanLoading] = useState(false);
  const [showCrawled, setShowCrawled] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [crawlTotal, setCrawlTotal] = useState(0);
  const [crawlTotalParams, setCrawlTotalParams] = useState(0);

  const { setResult } = useScan();

  const formatToVulnerabilities = (data: ScanItem[]) => {
    if (!Array.isArray(data)) return [];

    const formattedData = data.map((item, index) => ({
      id: index + 1,
      attack_type: item.attack || item.attack_type || "Unknown",
      severity: item.vulnerability || getSeverityFromAttack(item.attack),
      description: `Payload: ${item.payload?.substring(0, 100)}${item.payload?.length > 100 ? "..." : ""}`,
      recommendation: getRecommendation(item.attack, item.vulnerability),
      payload: item.payload,
      status: item.status,
      length: item.length,
      confidence: item.confidence || 0, // 🔴 TAMBAHKAN
      raw_vulnerability:
        item.vulnerability || getDefaultVulnerability(item.attack),
    }));

    console.log("✅ formattedData:", formattedData);
    window.__vulnerabilities = formattedData;

    return formattedData;
  };

  const getSeverityFromAttack = attackToSeverity;
  const getDefaultVulnerability = attackToSeverity;

  // ============ UPDATED: Rekomendasi berdasarkan attack type ============
  const getRecommendation = (attack: string, vulnerability: string) => {
    // SQL Injection
    if (attack === "SQL Injection") {
      return "Gunakan parameterized queries / prepared statements, input validation, escape karakter spesial, dan terapkan least privilege pada database";
    }

    // Command Injection (BARU!)
    if (attack === "Command Injection") {
      return "Hindari fungsi system(), exec(), shell_exec(), passthru(). Gunakan allowlist perintah, escape input, dan gunakan API yang lebih aman";
    }

    // XSS
    if (attack === "Cross-Site Scripting (XSS)" || attack === "XSS") {
      return "Sanitasi output, gunakan CSP headers, encode karakter HTML, dan gunakan HttpOnly cookie flag";
    }

    // Path Traversal
    if (attack === "Path Traversal") {
      return "Validasi path, gunakan whitelist, hindari input user langsung ke filesystem, dan gunakan basename()";
    }

    // Normal
    if (attack === "Normal") {
      return "Payload ini aman, tetap terapkan security best practices secara berkala";
    }

    // Berdasarkan vulnerability
    if (vulnerability === "🔴 Vulnerable") {
      return "Segera lakukan patch dan review keamanan pada endpoint ini, prioritaskan perbaikan";
    }
    if (vulnerability === "🟠 Suspicious") {
      return "Periksa lebih lanjut, mungkin ada indikasi serangan. Lakukan analisis mendalam";
    }
    if (vulnerability === "🟡 Check Needed") {
      return "Lakukan pengecekan manual pada endpoint yang teridentifikasi";
    }

    // Default
    return "Lakukan security review, implementasi input validation, dan terapkan security best practices secara berkala";
  };

  const handleAnalyze = async () => {
    if (!file) return alert("Upload file dulu!");

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log("Raw response dari backend:", data);

      const formattedData = formatToVulnerabilities(data);
      console.log("Data setelah diformat:", formattedData);

      setResult(formattedData);
      window.location.hash = "#dashboard";
    } catch (error) {
      console.error(error);
      alert("Backend error!");
    }

    setLoading(false);
  };

  // 🔴 TARUH FUNGSI FORMAT TIME DI SINI!
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleScanURL = async () => {
    if (!url) return alert("Masukkan URL!");

    setScanLoading(true);
    const startTime = Date.now();
    setScanStartTime(startTime);
    setElapsedTime(0);
    setEstimatedTime(0);

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // Estimasi: 1 payload ≈ 500ms (0.5 detik)
      const estimatedTotal = Math.ceil(payloadLimit * 0.5);
      const remaining = Math.max(0, estimatedTotal - elapsed);
      setEstimatedTime(remaining);
    }, 1000);

    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url,
          param: param,
          limit: payloadLimit,
        }),
      });

      const data = await res.json();

      clearInterval(timer);

      console.log("Raw response scan:", data);

      const formattedData = formatToVulnerabilities(data);
      console.log("Data scan setelah diformat:", formattedData);

      setResult(formattedData);
      window.location.hash = "#dashboard";
    } catch (error) {
      console.error(error);
      clearInterval(timer);
      alert("Scan gagal! Pastikan backend running.");
    }

    setScanLoading(false);
    setScanStartTime(null);
    setElapsedTime(0);
    setEstimatedTime(0);
  };

  const handleCrawl = async () => {
    if (!url) return alert("Masukkan URL dulu!");

    setCrawling(true);
    try {
      const res = await fetch(`${API_BASE}/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      console.log("🔍 HASIL CRAWL:", data);

      setCrawlTotal(data.count || 0);
      setCrawlTotalParams(data.total_params || data.params?.length || 0);

      // ==========================================================
      // 🔴🔴🔴 TAMPILIN PESAN DARI BACKEND KALO ADA
      // ==========================================================
      if (data.message) {
        alert(data.message);
      }

      // Kalo emang gak ada endpoint, kita kosongin aja
      if (data.count === 0) {
        setCrawledEndpoints([]);
        setCrawledParams([]);
        setShowCrawled(false);
        setCrawling(false);
        return;
      }

      setCrawledEndpoints(data.endpoints || []);
      setCrawledParams(data.params || []);
      setShowCrawled(true);

      if (data.params && data.params.length > 0) {
        setParam(data.params[0]);
      }
    } catch (error) {
      console.error(error);
      alert("Crawl gagal!");
    }
    setCrawling(false);
  };

  // 🔴 FUNGSI DETEKSI PARAMETER
  const detectParameters = async () => {
    if (!url) {
      alert("Masukkan URL dulu!");
      return;
    }

    setDetectingParams(true);
    try {
      const res = await fetch(`${API_BASE}/detect-params`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setDetectedParams(data.params || []);
    } catch (error) {
      console.error(error);
      alert("Gagal deteksi parameter!");
    }
    setDetectingParams(false);
  };

  const handleParseBurp = async () => {
    if (!file) {
      alert("Pilih file Burp (XML/CSV) dulu!");
      return;
    }

    setParsing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/parse-burp`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Download file hasil parsing
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "parsed_output.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        alert(
          "✅ File berhasil diparsing!\n\nFile parsed_output.csv sudah didownload.\n\nUpload file tersebut ke Analyze File untuk melihat hasil.",
        );
      } else {
        const error = await res.json();
        alert(`❌ Gagal parsing: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error parsing:", error);
      alert(
        "❌ Backend error! Pastikan backend running di port 5000 dan sudah menambahkan endpoint /parse-burp",
      );
    }

    setParsing(false);
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center section-padding pt-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          className="w-full h-full object-cover"
          alt="Hero background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background" />
      </div>

      {/* Efek glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/30 mb-6">
          <Shield size={16} className="text-primary" />
          <span className="text-xs font-medium text-primary">
            AI-Powered Security Scanner
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
          AI Cyber Security
          <br />
          Scanner
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Detect vulnerabilities in your web applications with advanced AI
          technology. Upload file or scan URL to get comprehensive security
          analysis.
        </p>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("file")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-200 ${
              activeTab === "file"
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-background/50 hover:bg-background/80 text-muted-foreground border border-border"
            }`}
          >
            <Upload size={18} />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-200 ${
              activeTab === "url"
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-background/50 hover:bg-background/80 text-muted-foreground border border-border"
            }`}
          >
            <Globe size={18} />
            Scan URL
          </button>
        </div>

        {/* File Upload Card */}
        {activeTab === "file" && (
          <div className="glass-card p-8 rounded-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <FileText size={40} className="text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">
                  Upload File untuk Analisis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Support CSV, XML, TXT format
                </p>
              </div>

              {/* Upload file input */}
              <label className="w-full max-w-md cursor-pointer">
                <div
                  className={`border-2 border-dashed rounded-xl p-6 transition-all ${
                    file
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".csv,.xml,.txt"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload
                      size={24}
                      className={
                        file ? "text-primary" : "text-muted-foreground"
                      }
                    />
                    <p className="text-sm">
                      {file ? file.name : "Click atau drag file untuk upload"}
                    </p>
                    {file && (
                      <span className="text-xs text-primary">
                        ✓ File siap diproses
                      </span>
                    )}
                  </div>
                </div>
              </label>

              {/* Tombol aksi: Analyze dan Parse Burp */}
              <div className="flex gap-3 w-full max-w-md">
                {/* Tombol Analyze File */}
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !file}
                  className="flex-1 glow-button px-8 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      Analyze File
                    </>
                  )}
                </button>

                {/* Tombol Parse Burp (BARU!) */}
                <button
                  onClick={handleParseBurp}
                  disabled={parsing || !file}
                  className="flex-1 px-8 py-3 rounded-lg flex items-center justify-center gap-2 bg-secondary/20 hover:bg-secondary/30 border border-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {parsing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Parse Burp
                    </>
                  )}
                </button>
              </div>

              {/* Informasi tambahan */}
              <p className="text-xs text-muted-foreground mt-2">
                Parse Burp: konversi file Burp XML/CSV ke format standar, lalu
                download hasilnya.
                <br />
                Upload hasil parsing ke Analyze File untuk analisis
                vulnerability.
              </p>
            </div>
          </div>
        )}

        {/* URL Scan Card */}
        {/* URL Scan Card */}
        {/* URL Scan Card */}
        {activeTab === "url" && (
          <div className="glass-card p-8 rounded-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Globe size={40} className="text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">Scan URL Target</h3>
                <p className="text-sm text-muted-foreground">
                  Masukkan URL dan parameter untuk di-scan
                </p>
              </div>

              <div className="w-full max-w-md space-y-3">
                {/* URL INPUT + CRAWL */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="https://example.com/api/users"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none text-sm transition-all placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    onClick={handleCrawl}
                    disabled={crawling || !url}
                    className="px-4 py-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {crawling ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Crawl"
                    )}
                  </button>
                </div>

                {/* PARAMETER INPUT + BUTTONS */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Parameter (contoh: q, id, search)"
                      value={param}
                      onChange={(e) => setParam(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none text-sm transition-all placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    onClick={detectParameters}
                    disabled={detectingParams || !url}
                    className="px-3 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {detectingParams ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Deteksi"
                    )}
                  </button>
                  <button
                    onClick={() => setShowParamModal(true)}
                    className="px-3 py-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border text-muted-foreground text-sm font-medium transition-all whitespace-nowrap"
                  >
                    Contoh
                  </button>
                </div>

                {/* DETEKSI PARAMETER RESULTS */}
                {detectedParams.length > 0 && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-medium text-primary">
                      Parameter Terdeteksi
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {detectedParams.map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setParam(p);
                            setDetectedParams([]);
                          }}
                          className="px-3 py-1 text-xs rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Klik parameter untuk menggunakannya
                    </p>
                  </div>
                )}

                {/* JUMLAH PAYLOAD - PILL BUTTONS */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">
                    Jumlah Payload
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 50, label: "50", desc: "Cepat" },
                      { value: 100, label: "100", desc: "Sedang" },
                      { value: 200, label: "200", desc: "Lengkap" },
                      { value: 490, label: "490", desc: "Maksimal" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setPayloadLimit(option.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          payloadLimit === option.value
                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                            : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border"
                        }`}
                      >
                        {option.label}
                        <span className="text-[10px] ml-1 opacity-70">
                          {option.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Semakin banyak payload, semakin lama proses scan
                  </p>
                </div>

                {/* CRAWL RESULTS */}
                {crawledEndpoints.length > 0 && (
                  <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-purple-400">
                        {crawledEndpoints.length} Endpoint Ditemukan
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Menampilkan {Math.min(crawledEndpoints.length, 10)} dari{" "}
                        {crawlTotal}
                        {crawlTotalParams > 0 &&
                          ` · ${crawlTotalParams} parameter`}
                      </p>
                    </div>

                    {/* 🔴 DIUBAH: 1 PER BARIS, FULL TEXT */}
                    <div className="flex flex-col gap-1">
                      {crawledEndpoints.slice(0, 10).map((ep, idx) => {
                        const match = ep.match(/\?(.+?)=/);
                        const paramName = match ? match[1] : "?";
                        const baseUrl = ep.split("?")[0];
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setParam(paramName);
                              setUrl(baseUrl);
                              setCrawledEndpoints([]);
                            }}
                            className="text-xs bg-purple-500/20 hover:bg-purple-500/40 px-3 py-1.5 rounded text-purple-300 transition-colors text-left hover:text-purple-100 w-full"
                            title={ep}
                          >
                            {ep}
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-2">
                      Klik salah satu endpoint untuk menggunakannya
                    </p>
                  </div>
                )}

                {/* SCAN BUTTON */}
                <button
                  onClick={handleScanURL}
                  disabled={scanLoading || !url}
                  className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {scanLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Scanning {payloadLimit} payload...
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      Start Scan
                    </>
                  )}
                </button>

                {/* LOADING PROGRESS */}
                {scanLoading && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Loader2
                        size={20}
                        className="animate-spin text-primary mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary">
                          Scanning {payloadLimit} payload
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTime(elapsedTime)} elapsed
                          {estimatedTime > 0 &&
                            ` · ~${formatTime(estimatedTime)} remaining`}
                        </p>
                        <div className="w-full h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min((elapsedTime / (payloadLimit * 0.5)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          Mohon tunggu, proses ini memakan waktu sekitar{" "}
                          {Math.ceil((payloadLimit * 0.5) / 60)} menit
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* FOOTER INFO */}
                <p className="text-[10px] text-muted-foreground text-center">
                  Parameter akan diuji dengan{" "}
                  <span className="font-medium text-foreground">
                    {payloadLimit} payload
                  </span>{" "}
                  dari file{" "}
                  <code className="px-1 py-0.5 bg-secondary rounded text-[10px]">
                    payload.txt
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🔴🔴🔴 MODAL HARUS DI LUAR activeTab === "url"! 🔴🔴🔴 */}
        {showParamModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto border border-border shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  Contoh Parameter yang Sering Diuji
                </h3>
                <button
                  onClick={() => setShowParamModal(false)}
                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Daftar Parameter */}
              <div className="space-y-3">
                {parameterExamples.map((paramItem, idx) => (
                  <div
                    key={idx}
                    className="border border-border/50 rounded-lg p-3 hover:border-primary/30 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-primary text-sm">
                          {paramItem.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {paramItem.desc}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setParam(paramItem.name);
                          setShowParamModal(false);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Pakai
                      </button>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      Contoh:{" "}
                      <span className="text-foreground">
                        {paramItem.example}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Rentan terhadap:{" "}
                      <span className="text-yellow-400">{paramItem.risks}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="mt-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-xs font-semibold text-primary mb-2">
                      Tips Penggunaan Parameter:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-primary text-[10px] mt-0.5">
                          ▸
                        </span>
                        <span>
                          Parameter paling umum:{" "}
                          <strong className="text-foreground">q</strong>,{" "}
                          <strong className="text-foreground">id</strong>,{" "}
                          <strong className="text-foreground">search</strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary text-[10px] mt-0.5">
                          ▸
                        </span>
                        <span>
                          Mulai dengan parameter yang menerima input pengguna
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary text-[10px] mt-0.5">
                          ▸
                        </span>
                        <span>
                          Sistem akan menguji{" "}
                          <strong className="text-foreground">
                            490 payload
                          </strong>{" "}
                          dari file{" "}
                          <code className="px-1.5 py-0.5 bg-secondary/50 rounded text-[10px] text-foreground font-mono">
                            payload.txt
                          </code>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary text-[10px] mt-0.5">
                          ▸
                        </span>
                        <span>
                          Parameter yang tidak valid akan otomatis diabaikan
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tombol Tutup */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowParamModal(false)}
                  className="glow-button px-6 py-2 text-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {(loading || parsing) && (
          <div className="mt-6 animate-pulse">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 size={20} className="animate-spin" />
              <span>
                {parsing
                  ? "Parsing file Burp..."
                  : "Processing security analysis..."}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
