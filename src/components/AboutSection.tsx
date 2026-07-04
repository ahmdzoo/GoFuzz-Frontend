import {
  Shield,
  Zap,
  Brain,
  Lock,
  BarChart3,
  FileSearch,
  ChevronRight,
} from "lucide-react";

const AboutSection = () => {
  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Detection",
      description:
        "Menggunakan machine learning untuk mendeteksi pola serangan canggih termasuk SQL Injection, XSS, dan Path Traversal.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Analysis",
      description:
        "Hasil analisis instan dengan feedback langsung, tanpa perlu menunggu lama.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "OWASP Top 10",
      description:
        "Berdasarkan standar keamanan OWASP Top 10, memastikan cakupan kerentanan yang komprehensif.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Visual Dashboard",
      description:
        "Dashboard interaktif dengan grafik distribusi serangan dan rekomendasi perbaikan.",
    },
    {
      icon: <FileSearch className="w-6 h-6" />,
      title: "Multi-Format Support",
      description:
        "Support file CSV, XML, dan scan URL langsung untuk fleksibilitas maksimal.",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Privacy First",
      description:
        "Data tidak disimpan di server, file langsung diproses dan dihapus setelah analisis.",
    },
  ];

  const stats = [
    { value: "98%", label: "Detection Accuracy" },
    { value: "15+", label: "Attack Types" },
    { value: "< 1s", label: "Avg Response Time" },
    { value: "24/7", label: "Available" },
  ];

  return (
    <section id="about" className="section-padding relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-bg pointer-events-none" />

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Why Choose Us
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Advanced <span className="glow-text">AI Security</span> Scanner
          </h2>

          <p className="text-lg text-muted-foreground">
            Lindungi aplikasi web Anda dengan teknologi AI canggih yang
            mendeteksi kerentanan keamanan sebelum dieksploitasi oleh penyerang.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300"
            >
              <div className="text-3xl md:text-4xl font-bold glow-text mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="glass-card p-6 rounded-xl hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <div className="text-primary">{feature.icon}</div>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="glass-card p-8 rounded-xl">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold mb-3">How It Works</h3>
            <p className="text-muted-foreground">
              Proses analisis keamanan dalam 3 langkah sederhana
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                1
              </div>
              <h4 className="font-semibold mb-2">Upload / Input URL</h4>
              <p className="text-sm text-muted-foreground">
                Upload file CSV/XML atau masukkan URL target untuk di-scan
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                2
              </div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Sistem menganalisis payload menggunakan model machine learning
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                3
              </div>
              <h4 className="font-semibold mb-2">Get Report</h4>
              <p className="text-sm text-muted-foreground">
                Dapatkan hasil analisis lengkap dengan rekomendasi perbaikan
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-10">
            <a
              href="#home"
              className="inline-flex items-center gap-2 glow-button"
            >
              Start Scanning Now
              <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
