import { useParams } from "wouter";
import { useGetVerifyInfo, useVerifyCode } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import type { VerifyResult } from "@workspace/api-client-react";

export default function VerifyPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);

  const { data: info, isLoading: infoLoading, isError } = useGetVerifyInfo(uuid || "", {
    query: { enabled: !!uuid, retry: false, queryKey: [`/api/verify/${uuid || ""}`] }
  });

  const verifyCode = useVerifyCode({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
      }
    }
  });

  const handleVerify = () => {
    if (code.length === 6 && uuid) {
      verifyCode.mutate({ uuid, data: { code } });
    }
  };

  if (infoLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !info?.found) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-destructive/20">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-destructive">Hujjat topilmadi</h1>
            <p className="text-muted-foreground">Kiritilgan UUID bo'yicha tibbiy ko'rik varaqasi tizimdan topilmadi yoki yaroqsiz holatga kelgan.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10 bg-white">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Tibbiy hujjatni tekshirish</CardTitle>
          <CardDescription className="text-base mt-2">
            Tekshirish uchun ma'lumotnomada taqdim etilgan QR-kod yonidagi 6 xonali raqamni kiriting
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {!result ? (
            <div className="space-y-6 flex flex-col items-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="w-12 h-14 text-lg border-2" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-lg border-2" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-lg border-2" />
                  <InputOTPSlot index={3} className="w-12 h-14 text-lg border-2" />
                  <InputOTPSlot index={4} className="w-12 h-14 text-lg border-2" />
                  <InputOTPSlot index={5} className="w-12 h-14 text-lg border-2" />
                </InputOTPGroup>
              </InputOTP>

              <Button 
                className="w-full h-12 text-lg font-medium" 
                onClick={handleVerify}
                disabled={code.length !== 6 || verifyCode.isPending}
              >
                {verifyCode.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Tasdiqlash
              </Button>
              
              {verifyCode.isError && (
                <p className="text-destructive font-medium">Noto'g'ri kod kiritildi</p>
              )}
            </div>
          ) : result.valid && result.patient && result.medicalRecord ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="font-bold text-green-800 text-lg">Hujjat tasdiqlandi</h3>
                <p className="text-green-700 text-sm">Ushbu hujjat haqiqiy va tizim ro'yxatidan o'tgan</p>
              </div>

              <div className="space-y-4 text-sm bg-muted/30 p-4 rounded-lg border">
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">F.I.Sh:</span>
                  <span className="col-span-2 font-bold">{result.patient.fullName}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Pasport:</span>
                  <span className="col-span-2 font-semibold">{result.patient.passport}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Ko'rik sanasi:</span>
                  <span className="col-span-2 font-semibold">
                    {result.medicalRecord.checkDate ? format(new Date(result.medicalRecord.checkDate), "dd.MM.yyyy HH:mm") : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Amal qilish muddati:</span>
                  <span className="col-span-2 font-semibold">
                    {result.medicalRecord.nextCheckDate ? `${format(new Date(result.medicalRecord.nextCheckDate), "dd.MM.yyyy")} gacha` : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Shifokor:</span>
                  <span className="col-span-2 font-semibold">{result.medicalRecord.doctorName || "-"}</span>
                </div>
              </div>

              <div className="text-center mt-6 pt-4 border-t">
                <div className="text-sm font-medium text-muted-foreground mb-2">TIBBIY XULOSA</div>
                {result.medicalRecord.decision === "allowed" ? (
                  <div className="inline-block px-6 py-3 bg-green-100 text-green-800 font-bold rounded-lg border-2 border-green-500 text-xl tracking-wide uppercase shadow-sm">
                    ✅ Ishlashga ruxsat berildi
                  </div>
                ) : (
                  <div className="inline-block px-6 py-3 bg-red-100 text-red-800 font-bold rounded-lg border-2 border-red-500 text-xl tracking-wide uppercase shadow-sm">
                    ❌ Ruxsat berilmadi
                  </div>
                )}
              </div>

              <div className="pt-2">
                <a
                  href={`/api/pdf/${uuid}`}
                  className="flex items-center justify-center w-full h-12 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PDFni yuklab olish
                </a>
              </div>
            </div>
          ) : (
             <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                <h3 className="font-bold text-red-800 text-lg">Hujjat bekor qilingan</h3>
                <p className="text-red-700 text-sm mt-2">{result.message || "Tizimda xatolik"}</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
