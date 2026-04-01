import { useState } from "react";
import { useGetPatients } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Loader2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { GetPatientsStatus } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function PatientsList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState<GetPatientsStatus | "all">("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useGetPatients({
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bemorlar</h1>
          <p className="text-muted-foreground">Tizimdagi barcha bemorlar ro'yxati</p>
        </div>
        <Link href="/patients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yangi bemor qo'shish
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="F.I.Sh, pasport yoki JSHSHIR bo'yicha qidiruv..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={status} onValueChange={(val: any) => { setStatus(val); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Holatni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="draft">Qoralama</SelectItem>
                  <SelectItem value="pending">Kutilyapti</SelectItem>
                  <SelectItem value="approved">Tasdiqlangan</SelectItem>
                  <SelectItem value="rejected">Rad etilgan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : data?.patients && data.patients.length > 0 ? (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>F.I.Sh</TableHead>
                      <TableHead>Pasport</TableHead>
                      <TableHead>JSHSHIR</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Holati</TableHead>
                      <TableHead>Yaratilgan sana</TableHead>
                      <TableHead className="text-right">Harakatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.fullName}</TableCell>
                        <TableCell>{patient.passport}</TableCell>
                        <TableCell>{patient.jshshir}</TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>
                          <StatusBadge status={patient.status} />
                        </TableCell>
                        <TableCell>{format(new Date(patient.createdAt), "dd.MM.yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/patients/${patient.id}`}>
                            <Button variant="ghost" size="sm">Batafsil</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Jami: {data.total} ta bemor
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Oldingi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= data.total}
                  >
                    Keyingi
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-md">
              Bemorlar topilmadi
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
