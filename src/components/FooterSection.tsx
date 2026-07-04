import { useState } from "react";
import { Shield, Github, Twitter, Linkedin, Mail, MapPin } from "lucide-react";

const FooterSection = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`📧 Terima kasih telah berlangganan!`);
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-border/50 bg-background/95">
      <div className="container mx-auto px-4 py-8">
        {/* Grid dengan proporsi 3:2:3:4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Brand: 3 kolom (25%) */}
          <div className="lg:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <Shield size={24} className="text-primary" />
              <span className="text-lg font-bold glow-text">GoFuzz</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI-Powered Web Security Scanner berbasis XGBoost dengan pendekatan
              fuzzing.
            </p>
            <div className="flex gap-2 pt-1">
              {[Github, Twitter, Linkedin, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-muted-foreground hover:text-primary"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Menu: 2 kolom (16.6%) */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Menu
            </h4>
            <ul className="space-y-1.5 text-sm">
              {["Beranda", "Tentang", "Dashboard", "Edukasi OWASP", "FAQ"].map(
                (item, i) => (
                  <li key={i}>
                    <a
                      href={`#${item.toLowerCase().replace(/\s/g, "")}`}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Fitur: 3 kolom (25%) */}
          <div className="lg:col-span-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Fitur
            </h4>
            <ul className="space-y-1.5 text-sm">
              {[
                "Upload CSV/XML",
                "Scan URL (50-490)",
                "Crawl dengan Katana",
                "Parse Burp Suite",
                "Export CSV/PDF",
              ].map((item, i) => (
                <li key={i} className="text-muted-foreground text-sm">
                  ✓ {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Langganan: 4 kolom (33.3%) */}
          <div className="lg:col-span-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Langganan
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Update fitur & tips keamanan.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-1.5">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="submit"
                className="glow-button px-3 py-1.5 text-sm whitespace-nowrap"
              >
                Kirim
              </button>
            </form>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Mail size={12} className="text-primary" />
                support@gofuzz.com
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin size={12} className="text-primary" />
                Politeknik Negeri Indramayu
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-4 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold text-primary">GoFuzz</span> — AI
            Cyber Security Scanner
          </p>
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
