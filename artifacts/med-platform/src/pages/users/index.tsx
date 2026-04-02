import { useState } from "react";
import { useGetUsers, useDeleteUser, getGetUsersQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Trash2, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@workspace/api-client-react";

export default function UsersList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const limit = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetUsers({
    search: debouncedSearch || undefined,
    page,
    limit,
  });

  const deleteUser = useDeleteUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Muvaffaqiyatli", description: "Foydalanuvchi o'chirildi" });
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Xatolik", description: err.message || "O'chirishda xatolik yuz berdi", variant: "destructive" });
      }
    }
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin": return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>;
      case "admin": return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>;
      case "doctor": return <Badge className="bg-teal-100 text-teal-800 border-teal-200">Shifokor</Badge>;
      case "staff": return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Xodim</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  if (user?.role !== UserRole.super_admin && user?.role !== UserRole.admin) {
    return <div className="p-8 text-center text-red-500 font-medium">Bu sahifaga kirish huquqingiz yo'q</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foydalanuvchilar</h1>
          <p className="text-muted-foreground">Tizim foydalanuvchilarini boshqarish</p>
        </div>
        <Link href="/users/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Yangi foydalanuvchi
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="F.I.Sh yoki username bo'yicha..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : data?.users && data.users.length > 0 ? (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>F.I.Sh</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Holati</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead className="text-right">Harakatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>
                          {u.isActive ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Faol</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Faol emas</Badge>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(u.createdAt), "dd.MM.yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/users/${u.id}/edit`}>
                              <Button variant="ghost" size="icon">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Haqiqatan ham o'chirmoqchimisiz?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu amalni ortga qaytarib bo'lmaydi.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteUser.mutate({ id: u.id })}
                                  >
                                    O'chirish
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div className="text-sm text-muted-foreground">
                  Jami: {data.total} ta
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" /> Oldingi
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * limit >= data.total}>
                    Keyingi <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-md">Ma'lumot topilmadi</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
