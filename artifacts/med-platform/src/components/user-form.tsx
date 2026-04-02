import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { CreateUserRequestRole } from "@workspace/api-client-react";

const userSchema = z.object({
  name: z.string().min(2, "F.I.Sh ni kiriting"),
  username: z.string().min(4, "Username kamida 4 ta belgi bo'lishi kerak"),
  email: z.string().email("To'g'ri email kiriting").optional().or(z.literal("")),
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak").optional(),
  role: z.nativeEnum(CreateUserRequestRole),
  isActive: z.boolean().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  initialValues?: Partial<UserFormValues>;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}

export function UserForm({ initialValues, onSubmit, isSubmitting, isEdit }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialValues?.name || "",
      username: initialValues?.username || "",
      email: initialValues?.email || "",
      password: "",
      role: initialValues?.role as CreateUserRequestRole || CreateUserRequestRole.staff,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>F.I.Sh</FormLabel>
                <FormControl>
                  <Input placeholder="Toshmatov Eshmat" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="eshmat123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (ixtiyoriy)</FormLabel>
                <FormControl>
                  <Input placeholder="eshmat@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isEdit ? "Yangi parol (o'zgartirish uchun)" : "Parol"}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Rolni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CreateUserRequestRole.super_admin}>Super Admin</SelectItem>
                    <SelectItem value={CreateUserRequestRole.admin}>Admin</SelectItem>
                    <SelectItem value={CreateUserRequestRole.doctor}>Shifokor</SelectItem>
                    <SelectItem value={CreateUserRequestRole.staff}>Xodim</SelectItem>
                  </SelectContent>
                </Select>
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
