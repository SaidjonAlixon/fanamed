import { useLocation, useParams } from "wouter";
import { useGetPatient, useUpdatePatient, getGetPatientQueryKey, getGetPatientsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientForm } from "@/components/patient-form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function EditPatient() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patient, isLoading } = useGetPatient(Number(id), {
    query: { enabled: !!id, queryKey: getGetPatientQueryKey(Number(id)) }
  });

  const updatePatient = useUpdatePatient({
    mutation: {
      onSuccess: () => {
        toast({ title: "Muvaffaqiyatli", description: "Bemor ma'lumotlari yangilandi" });
        queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(Number(id)) });
        queryClient.invalidateQueries({ queryKey: getGetPatientsQueryKey() });
        setLocation(`/patients/${id}`);
      },
      onError: (err: any) => {
        toast({ title: "Xatolik", description: err.message || "Yangilashda xatolik", variant: "destructive" });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/patients/${id}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bemor ma'lumotlarini tahrirlash</h1>
          <p className="text-muted-foreground">{patient.fullName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bemor ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm 
            initialValues={patient}
            onSubmit={(data) => updatePatient.mutate({ id: Number(id), data })}
            isSubmitting={updatePatient.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
