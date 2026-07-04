import { ShieldCheck, Brain, Bug, FileDown, BookOpen, Activity } from "lucide-react";


const features = [
  {
    icon: ShieldCheck,
    title: "Vulnerability Detection",
    desc: "Mendeteksi indikasi kerentanan berdasarkan hasil fuzzing secara otomatis",
  },
  {
    icon: Brain,
    title: "Machine Learning Analysis",
    desc: "Mengklasifikasikan jenis serangan seperti SQL Injection dan XSS menggunakan model ML",
  },
  {
    icon: Bug,
    title: "Fuzzing Result Processing",
    desc: "Mendukung berbagai format file hasil Burp Suite seperti CSV dan XML",
  },
  {
    icon: BookOpen,
    title: "OWASP Security Education",
    desc: "Memberikan edukasi dan rekomendasi berdasarkan standar OWASP",
  },
  {
    icon: FileDown,
    title: "Export Report",
    desc: "Unduh hasil analisis dalam format CSV atau PDF untuk dokumentasi",
  },
  {
    icon: Activity,
    title: "Real-time Analysis",
    desc: "Menampilkan proses analisis secara langsung saat sistem memproses data fuzzing",
  },
];

const CoreSection = () => (
  <section id="features" className="section-padding gradient-bg">
    <div className="container mx-auto text-center">
      {/* TITLE */}
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        Core <span className="glow-text">Features</span>
      </h2>

      <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
        Sistem ini menggabungkan teknik fuzzing, machine learning, dan standar
        keamanan OWASP untuk memberikan analisis kerentanan secara otomatis dan
        akurat.
      </p>

      {/* GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f, i) => {
          const Icon = f.icon;

          return (
            <div
              key={i}
              className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl hover:scale-105 transition-all duration-300"
            >
              <div className="mb-4 flex justify-center">
                <Icon className="text-primary" size={40} />
              </div>

              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>

              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default CoreSection;
