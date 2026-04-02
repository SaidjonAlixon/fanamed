import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetPatient, 
  useSubmitPatient, 
  useApproveMedicalRecord, 
  useUpdateMedicalRecord,
  useRejectMedicalRecord, 
  useGeneratePdf,
  generatePdf,
  useGetDoctors,
  getGetPatientQueryKey,
  useDeletePatient
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  Loader2, 
  Download, 
  Printer, 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  MapPin, 
  Briefcase, 
  Phone, 
  Calendar, 
  Hash 
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { UserRole, MedicalRecordDecision } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";

const approveSchema = z.object({
  chairmanId: z.string().min(1, "Raisni tanlang"),
  checkDate: z.string().min(1, "Ko'rik sanasini tanlang"),
  nextCheckDate: z.string().min(1, "Amal qilish muddatini tanlang"),
  decision: z.nativeEnum(MedicalRecordDecision)
});

const rejectSchema = z.object({
  reason: z.string().min(1, "Rad etish sababini kiriting")
});

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const patientId = Number(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const { data: patient, isLoading } = useGetPatient(patientId, {
    query: { enabled: !!patientId, queryKey: getGetPatientQueryKey(patientId) }
  });

  const { data: doctorsData } = useGetDoctors();
  const doctors = doctorsData?.doctors || [];

  const submitPatient = useSubmitPatient({
    mutation: {
      onSuccess: () => {
        toast({ title: "Muvaffaqiyatli", description: "Bemor ko'rikka yuborildi" });
        queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
      },
      onError: (err: any) => {
        toast({ title: "Xatolik", description: err.message || "Yuborishda xatolik", variant: "destructive" });
      }
    }
  });

  const approveRecord = useApproveMedicalRecord({
    mutation: {
      onSuccess: () => {
        toast({ title: "Muvaffaqiyatli", description: "Tibbiy ko'rik tasdiqlandi" });
        setIsApproveOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
      },
      onError: (err: any) => {
        toast({ title: "Xatolik", description: err.message || "Tasdiqlashda xatolik", variant: "destructive" });
      }
    }
  });

  const updateMedicalRecord = useUpdateMedicalRecord({
    mutation: {
      onSuccess: () => {
        toast({ title: "Muvaffaqiyatli", description: "Tibbiy ko'rik ma'lumotlari yangilandi" });
        setIsApproveOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
      },
      onError: (err: any) => {
        toast({ title: "Xatolik", description: err.message || "Yangilashda xatolik", variant: "destructive" });
      }
    }
  });

  const rejectRecord = useRejectMedicalRecord({
    mutation: {
      onSuccess: () => {
        toast({ title: "Muvaffaqiyatli", description: "Tibbiy ko'rik rad etildi" });
        setIsRejectOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
      },
      onError: (err: any) => {
        toast({ title: "Xatolik", description: err.message || "Rad etishda xatolik", variant: "destructive" });
      }
    }
  });

  const deletePatient = useDeletePatient({
    mutation: {
      onSuccess: () => {
        toast({ title: "Muvaffaqiyatli", description: "Bemor ma'lumotlari o'chirildi" });
        setLocation("/patients");
      },
      onError: (err: any) => {
        toast({ title: "Xatolik", description: err.message || "O'chirishda xatolik", variant: "destructive" });
      }
    }
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const handleGeneratePdf = async () => {
    if (!record?.id) return;
    setIsGeneratingPdf(true);
    try {
      const data = await generatePdf(record.id);
      window.open(data.pdfUrl, '_blank');
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "PDF yaratishda xatolik", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const approveForm = useForm<z.infer<typeof approveSchema>>({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      decision: MedicalRecordDecision.allowed,
      checkDate: new Date(new Date().getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 16), // Tashkent Time Adjustment (UTC+5)
      nextCheckDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    }
  });

  const rejectForm = useForm<z.infer<typeof rejectSchema>>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" }
  });

  const handleEditRecord = () => {
    if (!record) return;
    approveForm.reset({
      chairmanId: record.chairmanId?.toString() || "",
      checkDate: record.checkDate || new Date(new Date().getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 16),
      nextCheckDate: record.nextCheckDate ? new Date(record.nextCheckDate).toISOString().split('T')[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      decision: record.decision as MedicalRecordDecision
    });
    setTimeout(() => setIsApproveOpen(true), 50);
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!patient) return <div className="text-center py-12 text-muted-foreground border rounded-md">Bemor topilmadi</div>;

  const record = patient.medicalRecord;
  const canApproveReject = patient.status === "pending" && (user?.role === UserRole.doctor || user?.role === UserRole.admin || user?.role === UserRole.super_admin);
  const canGeneratePdf = patient.status === "approved";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/patients">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{patient.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={patient.status} />
              <span className="text-sm text-muted-foreground">Ro'yxatga olingan: {format(new Date(patient.createdAt), "dd.MM.yyyy")}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canApproveReject && (
            <div className="flex items-center gap-2">
              <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-semibold">Rad etish</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tibbiy ko'rikni rad etish</DialogTitle>
                    <DialogDescription>Bemorning tibbiy ko'rigini rad etish sababini kiriting</DialogDescription>
                  </DialogHeader>
                  <Form {...rejectForm}>
                    <form onSubmit={rejectForm.handleSubmit((data) => {
                      if (!record?.id) return;
                      rejectRecord.mutate({ id: record.id, data });
                    })} className="space-y-4">
                      <FormField
                        control={rejectForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sabab</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Qon tahlili natijalari qoniqarsiz..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsRejectOpen(false)}>Bekor qilish</Button>
                        <Button type="submit" variant="destructive" className="bg-red-600 hover:bg-red-700" disabled={rejectRecord.isPending}>
                          {rejectRecord.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Rad etish
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={() => {
                approveForm.reset({
                  decision: MedicalRecordDecision.allowed,
                  checkDate: new Date(new Date().getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 16),
                  nextCheckDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
                });
                setIsApproveOpen(true);
              }}>Tasdiqlash</Button>
            </div>
          )}

          <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{patient.status === "approved" ? "Tibbiy ko'rikni tahrirlash" : "Tibbiy ko'rikni tasdiqlash"}</DialogTitle>
              </DialogHeader>
              <Form {...approveForm}>
                <form onSubmit={approveForm.handleSubmit((data) => {
                  if (!record?.id) return;
                  
                  const payload = {
                    doctorId: user?.id,
                    chairmanId: Number(data.chairmanId),
                    checkDate: data.checkDate.replace('T', ' '),
                    nextCheckDate: data.nextCheckDate,
                    decision: data.decision
                  };
                  
                  if (patient.status === "approved") {
                    updateMedicalRecord.mutate({ id: record.id, data: payload });
                  } else {
                    approveRecord.mutate({ id: record.id, data: payload });
                  }
                })} className="space-y-4">
                  <FormField
                    control={approveForm.control}
                    name="chairmanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rais</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Raisni tanlang" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {doctors.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={approveForm.control}
                      name="checkDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ko'rik sanasi va vaqti</FormLabel>
                          <FormControl><Input type="datetime-local" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={approveForm.control}
                      name="nextCheckDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amal qilish muddati</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={approveForm.control}
                    name="decision"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Xulosa</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={MedicalRecordDecision.allowed} />
                              </FormControl>
                              <FormLabel className="font-normal text-green-700">Ishlashga ruxsat berildi</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={MedicalRecordDecision.not_allowed} />
                              </FormControl>
                              <FormLabel className="font-normal text-red-700">Ruxsat berilmadi</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsApproveOpen(false)}>Bekor qilish</Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={approveRecord.isPending || updateMedicalRecord.isPending}>
                      {(approveRecord.isPending || updateMedicalRecord.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Tasdiqlash
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {canGeneratePdf && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleEditRecord} className="border-blue-200 hover:bg-blue-50 text-blue-700">
                O'zgartirish
              </Button>
              <Button variant="outline" onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                PDF yuklab olish
              </Button>
            </div>
          )}
          
          {(user?.role === UserRole.staff || user?.role === UserRole.admin || user?.role === UserRole.super_admin) && (
            <div className="flex gap-2">
              <Link href={`/patients/${patientId}/edit`}>
                <Button variant="secondary">Tahrirlash</Button>
              </Link>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20">
                    <Trash2 className="mr-2 h-4 w-4" />
                    O'chirish
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Haqiqatan ham o'chirmoqchimisiz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu amal ortga qaytarilmaydi. Bemorning barcha ma'lumotlari va tibbiy ko'rik tarixi butunlay o'chiriladi.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deletePatient.mutate({ id: patientId })}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      O'chirish
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Shaxsiy ma'lumotlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {patient.photoUrl && (
              <div className="flex justify-center mb-6">
                <img src={patient.photoUrl} alt="Patient" className="w-32 h-32 rounded-full object-cover border-4 border-muted" />
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">F.I.Sh</div>
                  <div className="font-semibold text-slate-900">{patient.fullName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pasport / JSHSHIR</div>
                  <div className="font-semibold text-slate-800">{patient.passport} / {patient.jshshir}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tug'ilgan sana</div>
                  <div className="font-semibold text-slate-800">{format(new Date(patient.birthDate), "dd.MM.yyyy")}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Telefon</div>
                  <div className="font-semibold text-slate-800">{patient.phone}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                <MapPin className="h-4 w-4 text-primary mt-1" />
                <div>
                  <div className="text-xs font-medium text-primary/70 uppercase tracking-wider">Yashash joyi</div>
                  <div className="font-semibold text-slate-900">{(patient as any).address || "-"}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                <Briefcase className="h-4 w-4 text-primary mt-1" />
                <div>
                  <div className="text-xs font-medium text-primary/70 uppercase tracking-wider">Ish yoki o'qish joyi</div>
                  <div className="font-semibold text-slate-900">{(patient as any).workplace || "-"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Tibbiy ko'rik varaqasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!record ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/30">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p>Tibbiy ko'rik varaqasi shakllantirilmagan</p>
                {patient.status === "draft" && <p className="text-sm mt-1">Ko'rikka yuborish tugmasini bosing</p>}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Ko'rik holati</div>
                    <StatusBadge status={record.status} />
                  </div>
                  {record.uuid && (
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Hujjat ID</div>
                      <div className="font-mono text-sm break-all">{record.uuid}</div>
                    </div>
                  )}
                </div>

                {record.status === "rejected" && record.rejectionReason && (
                  <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <div className="font-semibold mb-1 flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Rad etish sababi:
                    </div>
                    <p>{record.rejectionReason}</p>
                  </div>
                )}

                {record.status === "approved" && (
                  <div className="space-y-6">
                    <div className="p-6 bg-white border-2 border-primary/20 rounded-xl shadow-sm">
                      <div className="text-center mb-6">
                        <div className="text-lg font-bold text-primary mb-2">TIBBIY KO'RIK XULOSASI</div>
                        {record.decision === "allowed" ? (
                          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 font-bold rounded-lg border-2 border-green-500 text-xl tracking-wide uppercase">
                            ✅ Ishlashga ruxsat berildi
                          </div>
                        ) : (
                          <div className="inline-block px-4 py-2 bg-red-100 text-red-800 font-bold rounded-lg border-2 border-red-500 text-xl tracking-wide uppercase">
                            ❌ Ruxsat berilmadi
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm text-muted-foreground">Shifokor</div>
                          <div className="font-semibold border-b pb-1">{record.doctorName || "Biriktirilmagan"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Komissiya raisi</div>
                          <div className="font-semibold border-b pb-1">{record.chairmanName || "Biriktirilmagan"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Ko'rik sanasi</div>
                          <div className="font-semibold">{record.checkDate ? format(new Date(record.checkDate), "dd.MM.yyyy") : "-"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Amal qilish muddati</div>
                          <div className="font-semibold">{record.nextCheckDate ? format(new Date(record.nextCheckDate), "dd.MM.yyyy") : "-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
