// data/owaspData.ts

export const owaspMap: Record<string, any> = {
  // 1. SQL Injection
  "SQL Injection": {
    title: "SQL Injection",
    desc: "Serangan yang menyisipkan query SQL malicious melalui input user untuk memanipulasi database.",
    impact:
      "Pencurian data, modifikasi data, bypass autentikasi, bahkan eksekusi perintah sistem.",
    mitigation: [
      "Gunakan parameterized queries / prepared statements",
      "Validasi dan sanitasi semua input user",
      "Gunakan ORM (Object Relational Mapping)",
      "Batasi privilege database (least privilege)",
      "Gunakan stored procedures dengan aman",
      "Hindari dynamic query generation",
    ],
  },

  // 2. Command Injection (BARU!)
  "Command Injection": {
    title: "Command Injection",
    desc: "Serangan yang mengeksekusi perintah sistem operasi melalui input yang tidak divalidasi.",
    impact:
      "Eksekusi perintah berbahaya, akses sistem, pencurian data, reverse shell, hingga full system compromise.",
    mitigation: [
      "Hindari fungsi system(), exec(), shell_exec(), passthru()",
      "Gunakan allowlist untuk perintah yang diizinkan",
      "Escape semua input yang digunakan dalam perintah sistem",
      "Gunakan API yang lebih aman daripada shell commands",
      "Terapkan prinsip least privilege untuk proses aplikasi",
      "Validasi input dengan regex ketat",
    ],
  },

  // 3. Cross-Site Scripting (XSS)
  "Cross-Site Scripting (XSS)": {
    title: "Cross-Site Scripting (XSS)",
    desc: "Serangan yang menyisipkan script malicious ke halaman web yang dilihat user lain.",
    impact:
      "Pencurian cookie session, defacement website, redirect ke situs berbahaya, keylogging.",
    mitigation: [
      "Sanitasi output (encode karakter HTML)",
      "Gunakan Content Security Policy (CSP)",
      "Validasi input pada server side",
      "Gunakan HttpOnly flag pada cookie",
      "Escape karakter spesial seperti <, >, &, \", '",
      "Gunakan DOMPurify atau library sanitasi",
    ],
  },

  // 4. XSS (alias)
  XSS: {
    title: "Cross-Site Scripting (XSS)",
    desc: "Serangan yang menyisipkan script malicious ke halaman web yang dilihat user lain.",
    impact:
      "Pencurian cookie session, defacement website, redirect ke situs berbahaya, keylogging.",
    mitigation: [
      "Sanitasi output (encode karakter HTML)",
      "Gunakan Content Security Policy (CSP)",
      "Validasi input pada server side",
      "Gunakan HttpOnly flag pada cookie",
      "Escape karakter spesial seperti <, >, &, \", '",
      "Gunakan DOMPurify atau library sanitasi",
    ],
  },

  // 5. Path Traversal
  "Path Traversal": {
    title: "Path Traversal",
    desc: "Serangan yang memanipulasi path file untuk mengakses file di luar direktori yang diizinkan.",
    impact:
      "Akses file sensitif (config, password, source code), information disclosure, credential theft.",
    mitigation: [
      "Validasi dan normalisasi path",
      "Gunakan whitelist untuk file yang diizinkan",
      "Jangan gunakan input user langsung ke filesystem",
      "Gunakan chroot jail atau container isolation",
      "Batasi akses file dengan permission yang ketat",
      "Gunakan basename() untuk ekstrak nama file",
    ],
  },

  // 6. Normal
  Normal: {
    title: "Normal / Safe Payload",
    desc: "Payload ini tidak terdeteksi memiliki pola serangan berbahaya.",
    impact: "Tidak ada dampak negatif terhadap keamanan.",
    mitigation: [
      "Tetap terapkan security best practices",
      "Lakukan monitoring secara berkala",
      "Update library dan dependencies",
      "Gunakan HTTPS untuk semua komunikasi",
      "Implementasi rate limiting",
      "Lakukan security audit rutin",
    ],
  },
};

// Default untuk attack yang tidak dikenal
export const getOwaspData = (attack: string) => {
  // Cek langsung
  if (owaspMap[attack]) return owaspMap[attack];

  // Cek case insensitive
  const lowerAttack = attack.toLowerCase();
  for (const key of Object.keys(owaspMap)) {
    if (key.toLowerCase() === lowerAttack) {
      return owaspMap[key];
    }
  }

  // Fallback
  return {
    title: attack,
    desc: "Kerentanan ini terdeteksi dalam scan anda. Segera lakukan mitigasi sesuai rekomendasi.",
    impact: "Potensi kerentanan keamanan yang perlu segera ditangani.",
    mitigation: [
      "Review kode pada endpoint yang teridentifikasi",
      "Implementasikan input validation",
      "Gunakan security headers",
      "Lakukan penetration testing berkala",
      "Konsultasikan dengan tim keamanan",
    ],
  };
};
