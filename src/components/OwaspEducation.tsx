import { useScan } from "../context/ScanContext";
import { getOwaspData } from "../data/owaspData";

const OwaspEducation = () => {
  const { result } = useScan();

  if (!result || result.length === 0) {
    return (
      <section id="owasp" className="section-padding">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-center mb-12">
            OWASP <span className="glow-text">Security Education</span>
          </h2>
          <div className="glass-card p-8 rounded-xl max-w-2xl mx-auto">
            <p className="text-muted-foreground">
              Belum ada hasil scan. Silakan upload file atau scan URL terlebih
              dahulu di section Home.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const attacks = [...new Set(result.map((r) => r.attack_type || r.attack))];
  const cardCount = attacks.length;
  const totalCards = attacks.length;

  // Hitung pembagian card agar rata
  const getGridLayout = () => {
    if (totalCards === 1) return "grid-cols-1 max-w-2xl mx-auto";
    if (totalCards === 2) return "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto";
    if (totalCards === 3) return "grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto";
    if (totalCards === 4) return "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto";
    if (totalCards === 5) {
      // 5 card: kita atur manual pakai flex wrap agar tidak ada kosong
      return "flex flex-wrap justify-center gap-6 max-w-6xl mx-auto";
    }
    if (totalCards >= 6)
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto";
  };

  // Untuk 5 card, kita render manual dengan flex
  if (totalCards === 5) {
    return (
      <section id="owasp" className="section-padding">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            OWASP <span className="glow-text">Security Education</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Pelajari tentang kerentanan yang terdeteksi ({cardCount} jenis) dan
            cara pencegahannya
          </p>

          {/* 5 CARD: 3 card baris pertama, 2 card baris kedua - CENTER */}
          <div className="max-w-6xl mx-auto">
            {/* Baris 1: 3 card */}
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              {attacks.slice(0, 3).map((attack, i) => {
                const data = getOwaspData(attack);
                return (
                  <div
                    key={i}
                    className="w-full sm:w-[calc(33.333%-16px)] min-w-[280px] max-w-[400px] glass-card p-6 rounded-xl hover:shadow-lg transition-all duration-300 group flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-all shrink-0">
                        <span className="text-xl">
                          {attack === "SQL Injection" && "💉"}
                          {attack === "XSS" && "📝"}
                          {attack === "Path Traversal" && "📂"}
                          {attack === "Time-Based Injection" && "⏱️"}
                          {attack === "Normal" && "✅"}
                          {![
                            "SQL Injection",
                            "XSS",
                            "Path Traversal",
                            "Time-Based Injection",
                            "Normal",
                          ].includes(attack) && "⚠️"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-primary">
                        {data.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {data.desc}
                    </p>
                    <div className="mb-4 p-3 rounded-lg bg-red-500/5 border-l-3 border-red-500">
                      <p className="text-xs font-semibold text-red-400 mb-1">
                        ⚠️ Dampak:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.impact}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-green-400 mb-2">
                        🛡️ Mitigasi:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1.5">
                        {data.mitigation.map((m: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary text-xs">▸</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Baris 2: 2 card - DI TENGAH AGAR RATA */}
            <div className="flex flex-wrap justify-center gap-6">
              {attacks.slice(3, 5).map((attack, i) => {
                const data = getOwaspData(attack);
                return (
                  <div
                    key={i}
                    className="w-full sm:w-[calc(50%-12px)] min-w-[280px] max-w-[400px] glass-card p-6 rounded-xl hover:shadow-lg transition-all duration-300 group flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-all shrink-0">
                        <span className="text-xl">
                          {attack === "SQL Injection" && "💉"}
                          {attack === "XSS" && "📝"}
                          {attack === "Path Traversal" && "📂"}
                          {attack === "Time-Based Injection" && "⏱️"}
                          {attack === "Normal" && "✅"}
                          {![
                            "SQL Injection",
                            "XSS",
                            "Path Traversal",
                            "Time-Based Injection",
                            "Normal",
                          ].includes(attack) && "⚠️"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-primary">
                        {data.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {data.desc}
                    </p>
                    <div className="mb-4 p-3 rounded-lg bg-red-500/5 border-l-3 border-red-500">
                      <p className="text-xs font-semibold text-red-400 mb-1">
                        ⚠️ Dampak:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.impact}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-green-400 mb-2">
                        🛡️ Mitigasi:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1.5">
                        {data.mitigation.map((m: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary text-xs">▸</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>
              💡 {cardCount} jenis kerentanan terdeteksi. Pelajari mitigasi
              masing-masing di atas.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Untuk jumlah card lainnya (1,2,3,4,6+)
  return (
    <section id="owasp" className="section-padding">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          OWASP <span className="glow-text">Security Education</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Pelajari tentang kerentanan yang terdeteksi ({cardCount} jenis) dan
          cara pencegahannya
        </p>

        <div className={getGridLayout()}>
          <div className={`grid ${getGridLayout()}`}>
            {attacks.map((attack, i) => {
              const data = getOwaspData(attack);

              return (
                <div
                  key={i}
                  className="glass-card p-6 rounded-xl hover:shadow-lg transition-all duration-300 group h-full flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-all shrink-0">
                      <span className="text-xl">
                        {attack === "SQL Injection" && "💉"}
                        {attack === "XSS" && "📝"}
                        {attack === "Path Traversal" && "📂"}
                        {attack === "Time-Based Injection" && "⏱️"}
                        {attack === "Normal" && "✅"}
                        {![
                          "SQL Injection",
                          "XSS",
                          "Path Traversal",
                          "Time-Based Injection",
                          "Normal",
                        ].includes(attack) && "⚠️"}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-primary">
                      {data.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {data.desc}
                  </p>
                  <div className="mb-4 p-3 rounded-lg bg-red-500/5 border-l-3 border-red-500">
                    <p className="text-xs font-semibold text-red-400 mb-1">
                      ⚠️ Dampak:
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.impact}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-400 mb-2">
                      🛡️ Mitigasi:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                      {data.mitigation.map((m: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary text-xs">▸</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            💡 {cardCount} jenis kerentanan terdeteksi. Pelajari mitigasi
            masing-masing di atas.
          </p>
        </div>
      </div>
    </section>
  );
};

export default OwaspEducation;
