import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, RefreshCw, Gift, UserPlus, Award, TrendingUp } from "lucide-react";
import { formatEUR } from "@/lib/formatEUR";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  completed: { label: "Tamamlandı", color: "bg-blue-100 text-blue-700 border-blue-200" },
  rewarded: { label: "Ödüllendirildi", color: "bg-green-100 text-green-700 border-green-200" },
};

export function AdminReferrals() {
  const [search, setSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: referralsList, isLoading } = trpc.admin.getAllReferrals.useQuery();
  const { data: stats } = trpc.admin.getReferralStats.useQuery();

  const filtered = (referralsList || []).filter((r: any) => {
    if (!search) return true;
    return r.referrerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.referredName?.toLowerCase().includes(search.toLowerCase()) ||
      r.referralCode?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-7 h-7 text-orange-500" /> Referans Sistemi
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Davet ve referans istatistiklerini takip edin</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { utils.admin.getAllReferrals.invalidate(); utils.admin.getReferralStats.invalidate(); }} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Yenile
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-blue-600" /><span className="text-xs text-blue-600">Toplam</span></div><div className="text-2xl font-bold text-blue-700">{stats?.total || 0}</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><UserPlus className="w-4 h-4 text-yellow-600" /><span className="text-xs text-yellow-600">Bekleyen</span></div><div className="text-2xl font-bold text-yellow-700">{stats?.pending || 0}</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-100">
          <CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-indigo-600" /><span className="text-xs text-indigo-600">Tamamlanan</span></div><div className="text-2xl font-bold text-indigo-700">{stats?.completed || 0}</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Award className="w-4 h-4 text-green-600" /><span className="text-xs text-green-600">Ödüllendirilen</span></div><div className="text-2xl font-bold text-green-700">{stats?.rewarded || 0}</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Gift className="w-4 h-4 text-orange-600" /><span className="text-xs text-orange-600">Toplam Ödül</span></div><div className="text-2xl font-bold text-orange-700">{formatEUR(stats?.totalRewards || 0)}</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Referanslar</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="İsim veya kod ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-48 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Referans bulunamadı</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  <TableHead>Davet Eden</TableHead>
                  <TableHead>Davet Edilen</TableHead>
                  <TableHead>Referans Kodu</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Ödül</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => {
                  const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
                  return (
                    <TableRow key={r.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">{r.referrerName?.charAt(0) || "?"}</div>
                          <div><div className="text-sm font-medium">{r.referrerName}</div><div className="text-xs text-gray-400">{r.referrerEmail}</div></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold">{r.referredName?.charAt(0) || "?"}</div>
                          <div><div className="text-sm font-medium">{r.referredName}</div><div className="text-xs text-gray-400">{r.referredEmail}</div></div>
                        </div>
                      </TableCell>
                      <TableCell><span className="font-mono text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">{r.referralCode}</span></TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs ${st.color}`}>{st.label}</Badge></TableCell>
                      <TableCell className="font-semibold text-sm">{r.rewardAmount ? formatEUR(r.rewardAmount) : "—"}</TableCell>
                      <TableCell className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("tr-TR")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
