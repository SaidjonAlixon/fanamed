import { createRequire } from "module";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const PDFDocument = require("pdfkit");

import { Router, type IRouter } from "express";
import { db, medicalRecordsTable, patientsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find logo file across different deployment environments
function findLogoPath(): string | null {
  const candidates = [
    join(__dirname, "..", "logo_fanamed.jpeg"),   // Railway: next to dist/
    join(process.cwd(), "logo_fanamed.jpeg"),      // Railway: cwd
    join(process.cwd(), "artifacts", "api-server", "logo_fanamed.jpeg"),
    join(process.cwd(), "logo_rasmlar", "logo_fanamed.jpeg"), // Vercel/static build: repo root asset
    "c:/Users/Saidmuhammadalixon/Desktop/nasafmed/logo_rasmlar/logo_fanamed.jpeg", // Windows dev
  ];
  return candidates.find(p => existsSync(p)) || null;
}

function findUnicodeFontPath(weight: "normal" | "bold"): string | null {
  const candidates = weight === "bold"
    ? [
        join(__dirname, "..", "assets", "fonts", "NotoSans-Bold.ttf"),
        join(__dirname, "..", "assets", "fonts", "DejaVuSans-Bold.ttf"),
        join(__dirname, "..", "assets", "fonts", "arialbd.ttf"),
        join(process.cwd(), "artifacts", "api-server", "assets", "fonts", "NotoSans-Bold.ttf"),
        join(process.cwd(), "artifacts", "api-server", "assets", "fonts", "DejaVuSans-Bold.ttf"),
        join(process.cwd(), "artifacts", "api-server", "assets", "fonts", "arialbd.ttf"),
        join(process.cwd(), "assets", "fonts", "NotoSans-Bold.ttf"),
        join(process.cwd(), "assets", "fonts", "DejaVuSans-Bold.ttf"),
        join(process.cwd(), "assets", "fonts", "arialbd.ttf"),
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/tahomabd.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
      ]
    : [
        join(__dirname, "..", "assets", "fonts", "NotoSans-Regular.ttf"),
        join(__dirname, "..", "assets", "fonts", "DejaVuSans.ttf"),
        join(__dirname, "..", "assets", "fonts", "arial.ttf"),
        join(process.cwd(), "artifacts", "api-server", "assets", "fonts", "NotoSans-Regular.ttf"),
        join(process.cwd(), "artifacts", "api-server", "assets", "fonts", "DejaVuSans.ttf"),
        join(process.cwd(), "artifacts", "api-server", "assets", "fonts", "arial.ttf"),
        join(process.cwd(), "assets", "fonts", "NotoSans-Regular.ttf"),
        join(process.cwd(), "assets", "fonts", "DejaVuSans.ttf"),
        join(process.cwd(), "assets", "fonts", "arial.ttf"),
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/tahoma.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
      ];

  return candidates.find((p) => existsSync(p)) || null;
}

const router: IRouter = Router();

function formatDateDMY(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

function formatDateTimeDMY(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const ddmmyyyy = formatDateDMY(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${ddmmyyyy} ${hh}:${min}`;
}

function buildSafePdfFilename(fullName: string): { ascii: string; utf8: string } {
  const compact = fullName.trim().replace(/\s+/g, "_");
  const asciiOnly = compact
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return {
    ascii: asciiOnly || "malumotnoma",
    utf8: encodeURIComponent(compact || "malumotnoma"),
  };
}

function cyrillicScore(value: string): number {
  // Cyrillic + Uzbek apostrophe chars commonly used in names/addresses.
  const matches = value.match(/[А-Яа-яЁёЎўҚқҒғҲҳʼ‘’]/g);
  return matches ? matches.length : 0;
}

function decodeAsLatin1Utf8(value: string): string {
  return Buffer.from(value, "latin1").toString("utf8");
}

function decodeAsWindows1251(value: string): string {
  const bytes = Uint8Array.from([...value].map((ch) => ch.charCodeAt(0) & 0xff));
  return new TextDecoder("windows-1251").decode(bytes);
}

function normalizePdfText(value: string | null | undefined): string {
  if (!value) return "-";
  const original = String(value);

  const candidates = [original];
  try {
    candidates.push(decodeAsLatin1Utf8(original));
  } catch {}
  try {
    candidates.push(decodeAsWindows1251(original));
  } catch {}

  let best = original;
  let bestScore = cyrillicScore(original);
  for (const candidate of candidates) {
    const score = cyrillicScore(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

router.get("/:uuid", async (req, res): Promise<void> => {
  const { uuid } = req.params;

  try {
    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.uuid, uuid)).limit(1);
    const record = records[0];

    if (!record) {
      res.status(404).json({ error: "Not found", message: "Hujjat topilmadi" });
      return;
    }

    const patients = await db.select().from(patientsTable).where(eq(patientsTable.id, record.patientId)).limit(1);
    const patient = patients[0];

    if (!patient) {
        res.status(404).json({ error: "Not found", message: "Bemor topilmadi" });
        return;
    }

    let chairmanName = "Biriktirilmagan";
    if (record.chairmanId) {
      const chairmen = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, record.chairmanId)).limit(1);
      chairmanName = chairmen[0]?.name || chairmanName;
    }

    // Generate PDF with Times New Roman
    const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
    });

    // Prefer Unicode-capable fonts for Cyrillic names; fallback to PDF built-ins.
    const unicodeNormalFontPath = findUnicodeFontPath("normal");
    const unicodeBoldFontPath = findUnicodeFontPath("bold");
    const normalFont = unicodeNormalFontPath || "Times-Roman";
    const boldFont = unicodeBoldFontPath || "Times-Bold";
    if (!unicodeNormalFontPath || !unicodeBoldFontPath) {
      req.log.warn(
        { unicodeNormalFontPath, unicodeBoldFontPath, cwd: process.cwd(), __dirname },
        "Unicode font fallback to Times-Roman/Times-Bold",
      );
    }

    doc.registerFont("DocFont-Normal", normalFont);
    doc.registerFont("DocFont-Bold", boldFont);
    doc.font("DocFont-Normal");
    
    const normalizedFullName = normalizePdfText(patient.fullName);
    const normalizedAddress = normalizePdfText((patient as any).address || "-");
    const normalizedWorkplace = normalizePdfText((patient as any).workplace || "-");
    const normalizedChairmanName = normalizePdfText(chairmanName);
    const safeFilename = buildSafePdfFilename(normalizedFullName);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="malumotnoma_${safeFilename.ascii}.pdf"; filename*=UTF-8''malumotnoma_${safeFilename.utf8}.pdf`,
    );
    // Avoid stale PDFs being cached by browsers/CDNs during rapid iteration.
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    doc.pipe(res);

    // Header Section
    doc.rect(0, 0, 595, 10).fill('#0284c7'); // Top colored bar
    
    doc.fontSize(12).font("DocFont-Bold").fillColor('#1f2937');
    doc.text('"FANA MED" TIBBIY KO\'RIK', 50, 45, { width: 300 });
    doc.fontSize(10).font("DocFont-Normal").text('MAS\'ULIYATI CHEKLANGAN JAMIYATI', 50, 65);

    // Logo — dynamically found across platforms
    const logoPath = findLogoPath();
    if (logoPath) {
        try {
            doc.image(logoPath, 430, 30, { width: 120 });
        } catch (e) {
            console.error("Logo rendering error", e);
        }
    }

    doc.moveDown(5);
    
    const fullWidth = doc.page.width - 100;

    // Centered Title Block
    doc.rect(50, 115, fullWidth, 60).fill('#f8fafc'); // Light subtle background
    doc.fillColor('#64748b').fontSize(10).font("DocFont-Normal").text('Tibbiy ko\'rikdan o\'tkazish natijalari bo\'yicha', 50, 125, { align: 'center', width: fullWidth });
    doc.fillColor('#1e293b').fontSize(18).font("DocFont-Bold").text('MA\'LUMOTNOMA', 50, 140, { align: 'center', width: fullWidth });
    const docNumber = record.verifyCode?.padEnd(9, '0').substring(0, 9) || Math.floor(100000000 + Math.random() * 899999999).toString();
    // Use "Nº" instead of "№" because built-in PDF fonts can render "№" incorrectly.
    doc.fillColor('#0284c7').fontSize(12).text(`Nº FA ${docNumber}`, 50, 160, { align: 'center', width: fullWidth });
    
    doc.moveDown(3);

    // Patient Name Header
    doc.fillColor('#1e3a8a').fontSize(14).font("DocFont-Bold").text(normalizedFullName.toUpperCase(), 50, 210);
    doc.moveTo(50, 230).lineTo(545, 230).lineWidth(2).stroke('#0284c7');

    // Table Logic - Modern Look
    const startY = 245;
    const rowHeight = 30;
    const col1Width = 180;
    const col2Width = 315;

    const rows = [
        { label: 'JSHSHIR', value: patient.jshshir },
        { label: 'Pasport / ID-karta', value: patient.passport },
        { label: 'Tug\'ilgan sana', value: formatDateDMY(patient.birthDate) },
        { label: 'Yashash joyi', value: normalizedAddress }, // Cast to any because of current TypeScript types
        { label: 'Ish / o\'qish joyi', value: normalizedWorkplace },
        // Prefer explicit checkDate; fallback to createdAt to show time
        { label: 'Tibbiy ko\'rik sanasi', value: formatDateTimeDMY(record.checkDate || record.createdAt) },
    ];

    rows.forEach((row, index) => {
        const y = startY + (index * rowHeight);
        
        // Modern borderless rows with light background
        if (index % 2 === 0) {
            doc.rect(50, y, 495, rowHeight).fill('#f1f5f9');
        }

        doc.fillColor('#475569').font("DocFont-Normal").fontSize(11).text(row.label, 60, y + 10);
        doc.fillColor('#0f172a').font("DocFont-Bold").text(row.value, 50 + col1Width + 10, y + 10);
    });

    const tableEndY = startY + (rows.length * rowHeight);

    // Conclusion Section
    doc.moveDown(3);
    
    // Conclusion Header with accent
    doc.rect(50, tableEndY + 40, fullWidth, 25).fill('#e0f2fe');
    doc.fillColor('#0369a1').fontSize(12).font("DocFont-Bold").text('XULOSA', 50, tableEndY + 47, { align: 'center', width: fullWidth });
    
    const resultY = tableEndY + 80;
    const label = 'Tibbiy ko\'rik natijalari bo\'yicha:';
    doc.fillColor('#1e293b').fontSize(12).font("DocFont-Normal").text(label, 50, resultY);
    
    const decisionText = record.decision === 'allowed' ? 'Ishlashga ruxsat beriladi' : 'Ishlashga ruxsat berilmadi';
    const stampColor = record.decision === 'allowed' ? '#059669' : '#dc2626';
    
    // Calculate position for the stamp
    const labelWidth = doc.widthOfString(label);
    const stampX = 50 + labelWidth + 20; 
    const stampWidth = 190;
    const stampHeight = 25;

    // Stamp-like rectangle
    doc.lineWidth(2.5).strokeColor(stampColor).rect(stampX, resultY - 6, stampWidth, stampHeight).stroke();
    doc.fillColor(stampColor).fontSize(11).font("DocFont-Bold").text(decisionText.toUpperCase(), stampX, resultY, { 
      align: 'center', 
      width: stampWidth 
    });

    doc.moveDown(3);
    
    const footerY = doc.y + 20;
    doc.fillColor('#475569').fontSize(11).font("DocFont-Normal").text('Ushbu ma\'lumotnomaning amal qilish muddati:', 50, footerY);
    doc.fillColor('#0f172a').font("DocFont-Bold").text(record.nextCheckDate ? `${formatDateDMY(record.nextCheckDate)} gacha` : '-', 350, footerY, { align: 'right', width: 195 });

    doc.moveDown(1.5);
    const chairmanY = doc.y;
    doc.fillColor('#475569').font("DocFont-Normal").text('Komissiya raisi F.I.O:', 50, chairmanY);
    doc.fillColor('#0f172a').font("DocFont-Bold").text(normalizedChairmanName, 350, chairmanY, { align: 'right', width: 195 });

    // Bottom verification section at fixed absolute positions
    const bottomAreaY = 645;

    // Separator line
    doc.moveTo(50, bottomAreaY - 10).lineTo(545, bottomAreaY - 10).lineWidth(1).stroke('#e2e8f0');

    // Left: QR Code
    if (record.qrCode) {
        try {
            const base64Data = record.qrCode.split(',')[1];
            const imgBuffer = Buffer.from(base64Data, 'base64');
            doc.image(imgBuffer, 50, bottomAreaY, { width: 105 });
        } catch (e) {
            console.error("QR Code rendering error", e);
        }
    }

    // Right: Verification info — all at absolute Y positions
    const verifyX = 170;

    doc.fillColor('#0f172a').fontSize(11).font("DocFont-Bold")
       .text("Hujjat haqiqiyligini tekshirish:", verifyX, bottomAreaY + 5, { lineBreak: false });

    doc.fillColor('#475569').fontSize(9).font("DocFont-Normal")
       .text("1. QR-kodni skaner qiling yoki quyidagi saytga o'ting:", verifyX, bottomAreaY + 22, { lineBreak: false });
    doc.fillColor('#0284c7').fontSize(9).font("DocFont-Bold")
       .text("fanamed.uz/verify", verifyX + 8, bottomAreaY + 34, { lineBreak: false });

    doc.fillColor('#475569').fontSize(9).font("DocFont-Normal")
       .text("2. Quyidagi tekshirish kodini kiriting:", verifyX, bottomAreaY + 50, { lineBreak: false });

    // Verification Code box
    const codeBoxX = verifyX + 8;
    const codeBoxY = bottomAreaY + 63;
    doc.rect(codeBoxX, codeBoxY, 185, 36).fill('#eff6ff').stroke('#0284c7');
    doc.fillColor('#0c4a6e').fontSize(26).font("DocFont-Bold")
       .text(record.verifyCode || '------', codeBoxX, codeBoxY + 5, { width: 185, align: 'center', lineBreak: false });

    // Item 3 — two lines, NO lineBreak to prevent page jump
    const item3Y = codeBoxY + 43;
    doc.fillColor('#64748b').fontSize(7.5).font("DocFont-Normal")
       .text("3. QR-kod skaner qilinganda, ushbu hujjatning nusxasi \"FANA MED TIBBIY KO'RIK\" MCHJning rasmiy", verifyX + 8, item3Y, { lineBreak: false });
    doc.fillColor('#64748b').fontSize(7.5).font("DocFont-Normal")
       .text("   axborot resursidan fanamed.uz domeni orqali generatsiya qilinadigan tibbiy ma'lumotnoma.", verifyX + 8, item3Y + 11, { lineBreak: false });

    // Blue bottom bar — drawn LAST to avoid triggering a new page
    doc.rect(0, 832, 595, 10).fill('#0284c7');

    doc.end();





  } catch (err) {
    console.error("PDF generation error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
