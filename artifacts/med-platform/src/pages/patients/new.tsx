import { useLocation } from "wouter";
import { useCreatePatient, getGetPatientsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientForm } from "@/components/patient-form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NewPatient() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPatient = useCreatePatient({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Muvaffaqiyatli", description: "Bemor qo'shildi" });
        queryClient.invalidateQueries({ queryKey: getGetPatientsQueryKey() });
        setLocation(`/patients/${data.id}`);
      },
      onError: (err: any) => {
        toast({ title: "Xatolik", description: err.message || "Bemor qo'shishda xatolik", variant: "destructive" });
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yangi bemor</h1>
          <p className="text-muted-foreground">Tizimga yangi bemor qo'shish</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bemor ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm 
            onSubmit={(data) => createPatient.mutate({ data })}
            isSubmitting={createPatient.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
