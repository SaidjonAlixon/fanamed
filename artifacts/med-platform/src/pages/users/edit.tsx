import { useLocation, useParams } from "wouter";
import { useGetUser, useUpdateUser, getGetUserQueryKey, getGetUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/user-form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function EditUser() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetUser(Number(id), {
    query: { enabled: !!id, queryKey: getGetUserQueryKey(Number(id)) }
  });

  const updateUser = useUpdateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Muvaffaqiyatli", description: "Foydalanuvchi yangilandi" });
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(Number(id)) });
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
        setLocation("/users");
      },
      onError: (err: any) => {
        toast({ title: "Xatolik", description: err.message || "Yangilashda xatolik", variant: "destructive" });
      }
    }
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foydalanuvchini tahrirlash</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foydalanuvchi ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm 
            initialValues={user}
            isEdit
            onSubmit={(data) => {
              const payload = { ...data };
              if (!payload.password) delete payload.password;
              updateUser.mutate({ id: Number(id), data: payload });
            }}
            isSubmitting={updateUser.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
