import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState(user?.username ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!currentPassword) {
      toast({ title: "Xatolik", description: "Joriy parolni kiriting", variant: "destructive" });
      return;
    }
    if (!newUsername && !newPassword) {
      toast({ title: "Xatolik", description: "Yangi login yoki parol kiriting", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const resp = await fetch("/api/auth/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        toast({ title: "Xatolik", description: data?.message || "Saqlashda xatolik", variant: "destructive" });
        return;
      }

      toast({ title: "Muvaffaqiyatli", description: "Login/parol yangilandi. Qayta kiring." });
      setLocation("/login");
    } catch (e: any) {
      toast({ title: "Xatolik", description: e?.message || "Tarmoq xatosi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sozlamalar</h1>
        <p className="text-sm text-muted-foreground">Login va parolni o'zgartirish</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Login / Parolni o'zgartirish</CardTitle>
          <CardDescription>
            O'zgartirgandan keyin sessiya bekor qilinadi va faqat yangi login/parol bilan qayta kira olasiz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <div className="text-sm font-medium">Joriy parol</div>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={showCurrentPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Yangi login (ixtiyoriy)</div>
            <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="admin" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Yangi parol (ixtiyoriy)</div>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="kamida 6 ta belgi"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={showNewPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

