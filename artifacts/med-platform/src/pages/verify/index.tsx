import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_URL || "";

type VerifyResult = {
  valid: boolean;
  patient?: { fullName: string; passport: string; jshshir: string; birthDate: string };
  medicalRecord?: { uuid?: string; checkDate?: string; decision?: string; nextCheckDate?: string; chairmanName?: string; doctorName?: string };
  message?: string;
};

export default function VerifyStandalone() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API_BASE}/api/verify/by-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.message || "Noto'g'ri kod kiritildi");
      } else {
        setResult(data);
      }
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)" }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-sky-100">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-3">
          <img
            src="/logo_fanamed.jpeg"
            alt="FANA MED"
            className="h-12 w-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div className="text-base font-bold text-sky-900 leading-tight">"FANA MED" TIBBIY KO'RIK</div>
            <div className="text-xs text-sky-600">MAS'ULIYATI CHEKLANGAN JAMIYATI</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {!result ? (
            <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
              {/* Title */}
              <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-8 py-6 text-center">
                <ShieldCheck className="h-12 w-12 text-white/90 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-white">Tekshirish kodini kiriting!</h1>
                <p className="text-sky-100 text-sm mt-2">
                  Hujjat haqiqiyligini tekshirish uchun PDF'dagi 6 xonali kodni kiriting
                </p>
              </div>

              <div className="px-8 py-8 flex flex-col items-center gap-6">
                {/* OTP input */}
                <InputOTP maxLength={6} value={code} onChange={(val) => { setCode(val); setError(""); }}>
                  <InputOTPGroup className="gap-2">
                    {[0,1,2,3,4,5].map(i => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="w-12 h-14 text-xl font-bold border-2 border-sky-200 rounded-lg focus:border-sky-500 focus:ring-sky-500"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {error && (
                  <div className="w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button
                  className="w-full h-12 text-base font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md transition-all"
                  onClick={handleVerify}
                  disabled={code.length !== 6 || loading}
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Tasdiqlash
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  Hujjat raqami PDF hujjatning pastki qismida joylashgan
                </p>
              </div>
            </div>
          ) : result.valid && result.patient && result.medicalRecord ? (
            <div className="bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 text-center">
                <CheckCircle2 className="h-14 w-14 text-white mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-white">Hujjat tasdiqlandi!</h2>
                <p className="text-green-100 text-sm mt-1">Ushbu hujjat haqiqiy va tizimda ro'yxatdan o'tgan</p>
              </div>

              <div className="px-6 py-6 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm border-b pb-3">
                  <span className="text-gray-500">F.I.Sh:</span>
                  <span className="font-bold text-gray-900">{result.patient.fullName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm border-b pb-3">
                  <span className="text-gray-500">Pasport:</span>
                  <span className="font-semibold">{result.patient.passport}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm border-b pb-3">
                  <span className="text-gray-500">Ko'rik sanasi:</span>
                  <span className="font-semibold">{(result.medicalRecord.checkDate || "-").replace("T", " ")}</span>
                </div>
                {result.medicalRecord.nextCheckDate && (
                  <div className="grid grid-cols-2 gap-2 text-sm border-b pb-3">
                    <span className="text-gray-500">Keyingi ko'rik:</span>
                    <span className="font-semibold">{result.medicalRecord.nextCheckDate}</span>
                  </div>
                )}
                {result.medicalRecord.chairmanName && (
                  <div className="grid grid-cols-2 gap-2 text-sm border-b pb-3">
                    <span className="text-gray-500">Komissiya raisi:</span>
                    <span className="font-semibold">{result.medicalRecord.chairmanName}</span>
                  </div>
                )}

                <div className="text-center pt-4">
                  <div className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-widest">Tibbiy xulosa</div>
                  {result.medicalRecord.decision === "allowed" ? (
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 font-bold rounded-xl border-2 border-green-400 text-lg shadow">
                      ✅ Ishlashga ruxsat berildi
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-100 text-red-800 font-bold rounded-xl border-2 border-red-400 text-lg shadow">
                      ❌ Ruxsat berilmadi
                    </div>
                  )}
                </div>

                {result.medicalRecord.uuid && (
                  <div className="pt-4">
                    <a
                      href={`${API_BASE}/api/pdf/${result.medicalRecord.uuid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-md transition-all text-base"
                    >
                      📄 PDF nusxasini yuklab olish
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-700">{result?.message || "Hujjat topilmadi"}</h2>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-gray-400 border-t border-gray-100 bg-white">
        © {new Date().getFullYear()} "FANA MED" TIBBIY KO'RIK MCHJ · fanamed.uz
      </div>
    </div>
  );
}
