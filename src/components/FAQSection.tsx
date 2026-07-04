// components/FAQSection.tsx
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Apa itu AI Cyber Security Scanner?",
    answer:
      "AI Cyber Security Scanner adalah alat analisis keamanan berbasis AI yang dapat mendeteksi kerentanan seperti SQL Injection, XSS, Path Traversal, dan lainnya dari file atau URL yang Anda upload.",
  },
  {
    question: "Format file apa saja yang didukung?",
    answer:
      "Saat ini mendukung file CSV dan XML. File CSV harus berisi kolom 'payload' (wajib), 'status', dan 'length' (opsional). File XML harus mengikuti struktur Burp Suite / ZAP.",
  },
  {
    question: "Apakah data saya disimpan di server?",
    answer:
      "Tidak. Semua analisis dilakukan secara real-time dan data tidak disimpan di server. File Anda hanya diproses saat scan dan langsung dihapus setelahnya.",
  },
  {
    question: "Seberapa akurat deteksi kerentanan ini?",
    answer:
      "Scanner menggunakan model machine learning yang dilatih dengan ribuan sample payload + rule-based detection. Akurasi mencapai 85-95% tergantung jenis serangan, namun tetap disarankan untuk melakukan verifikasi manual.",
  },
  {
    question: "Apakah bisa digunakan untuk scan website production?",
    answer:
      "Sangat disarankan untuk menggunakan environment testing/staging. Scan pada production bisa menyebabkan gangguan performa atau berpotensi merusak data jika menggunakan payload berbahaya.",
  },
  {
    question: "Bagaimana cara menginterpretasikan hasil scan?",
    answer:
      "Hasil scan menunjukkan: 🟢 Safe (aman), 🟡 Check Needed (perlu dicek), 🟠 Suspicious (mencurigakan), 🔴 Vulnerable (rentan). Dashboard menyediakan rekomendasi perbaikan untuk setiap kerentanan.",
  },
  {
    question: "Apakah ada biaya untuk menggunakan scanner ini?",
    answer:
      "Saat ini masih gratis untuk penggunaan non-komersial. Untuk enterprise dan penggunaan komersial, silakan hubungi tim kami.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="section-padding">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Frequently Asked <span className="glow-text">Questions</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Temukan jawaban untuk pertanyaan umum tentang AI Security Scanner
        </p>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="glass-card rounded-xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-primary/5 transition-colors"
              >
                <span className="font-semibold text-base md:text-lg">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="text-primary shrink-0 ml-4" size={20} />
                ) : (
                  <ChevronDown
                    className="text-primary shrink-0 ml-4"
                    size={20}
                  />
                )}
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-4 pt-0 text-muted-foreground border-t border-border/50">
                  <p className="pt-3">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-muted-foreground">
            Masih ada pertanyaan?{" "}
            <a href="#" className="text-primary hover:underline">
              Hubungi tim support
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
