import { useLocation } from "wouter";
import { useCreateUser, getGetUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/user-form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NewUser() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUser = useCreateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Muvaffaqiyatli", description: "Foydalanuvchi qo'shildi" });
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
        setLocation("/users");
      },
      onError: (err: any) => {
        toast({ title: "Xatolik", description: err.message || "Qo'shishda xatolik", variant: "destructive" });
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yangi foydalanuvchi</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foydalanuvchi ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm 
            onSubmit={(data) => createUser.mutate({ data })}
            isSubmitting={createUser.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
