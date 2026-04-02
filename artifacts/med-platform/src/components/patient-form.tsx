import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { CreatePatientRequest } from "@workspace/api-client-react";

const patientSchema = z.object({
  fullName: z.string().min(2, "F.I.Sh ni to'liq kiriting"),
  passport: z.string().length(9, "Pasport seriyasi va raqami 9 ta belgidan iborat bo'lishi kerak"),
  jshshir: z.string().length(14, "JSHSHIR 14 xonali son bo'lishi kerak"),
  birthDate: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional(),
  workplace: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  initialValues?: Partial<PatientFormValues>;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function PatientForm({ initialValues, onSubmit, isSubmitting }: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: initialValues?.fullName || "",
      passport: initialValues?.passport || "",
      jshshir: initialValues?.jshshir || "",
      birthDate: initialValues?.birthDate ? initialValues.birthDate.split('T')[0] : "",
      phone: initialValues?.phone || "",
      address: initialValues?.address || "",
      workplace: initialValues?.workplace || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => {
        onSubmit({
          ...data,
          birthDate: data.birthDate || "-",
          phone: data.phone || "-",
          address: data.address || "-",
          workplace: data.workplace || "-"
        });
      })} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>F.I.Sh</FormLabel>
                <FormControl>
                  <Input placeholder="Eshmatov Toshmat Eshmat o'g'li" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="passport"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pasport (Seriya va raqam)</FormLabel>
                <FormControl>
                  <Input placeholder="AA1234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jshshir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>JSHSHIR (PINFL)</FormLabel>
                <FormControl>
                  <Input placeholder="12345678901234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tug'ilgan sana</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon raqam</FormLabel>
                <FormControl>
                  <Input placeholder="+998901234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yashash joyi</FormLabel>
                <FormControl>
                  <Input placeholder="Viloyat, shahar, tuman, ko'cha, uy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workplace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ish yoki o'qish joyi (ixtiyoriy)</FormLabel>
                <FormControl>
                  <Input placeholder="MCHJ, zavod, maktab va h.k." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Saqlash
          </Button>
        </div>
      </form>
    </Form>
  );
}
