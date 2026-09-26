import { useState } from "react";
import type { AuditLogRecord, AuditActionType } from "./types";
import {
  Search,
  Download,
  Printer,
  CheckCircle2,
  FileText,
  KeyRound,
  RotateCcw,
  Tag,
  DollarSign,
  Lock,
} from "lucide-react";
import { downloadCsv, printReportPdf } from "@/lib/export-utils";

interface AdminAuditLogsViewProps {
  auditLogs: AuditLogRecord[];
}

export function AdminAuditLogsView({ auditLogs = [] }: AdminAuditLogsViewProps) {
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    const matchesSearch =
      log.details.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details.reason && log.details.reason.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  // KPI Calculations
  const todayLogsCount = auditLogs.filter((l) => l.date === "24 Sep 2026").length;
  const voidCount = auditLogs.filter((l) => l.action === "VOID_ORDER").length;
  const priceChangesCount = auditLogs.filter((l) => l.action === "MENU_PRICE_CHANGE").length;
  const pinResetsCount = auditLogs.filter((l) => l.action === "STAFF_PIN_RESET").length;

  const handleExportCsv = () => {
    downloadCsv({
      filename: `macmood-audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
      headers: [
        "ID Log",
        "Waktu",
        "Tanggal",
        "Tipe Aksi",
        "Pelaksana",
        "Role",
        "Entitas Target",
        "Rincian Perubahan",
        "Nilai Sebelum",
        "Nilai Sesudah",
        "Alasan / Keterangan",
      ],
      rows: filteredLogs.map((log) => [
        log.id,
        log.time,
        log.date,
        log.action,
        log.performedBy,
        log.userRole,
        log.entityId,
        log.details.title,
        log.details.before ?? "-",
        log.details.after ?? "-",
        log.details.reason ?? "-",
      ]),
    });
    setExportNotice("File CSV data audit log keamanan berhasil diunduh.");
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportPdf = () => {
    printReportPdf({
      title: "Laporan Log Audit Aktivitas & Keamanan Sistem",
      subtitle:
        "Rekaman kronologis tak terhapus atas perubahan harga, otorisasi void nota, reset PIN staf, dan verifikasi shift",
      meta: [
        { label: "Total Log Tercatat", value: `${filteredLogs.length} Aktivitas` },
        { label: "Filter Aksi", value: actionFilter },
        { label: "Waktu Cetak", value: new Date().toLocaleString("id-ID") },
        { label: "Otorisator", value: "Muhammad Afrizal (Business Owner)" },
      ],
      tables: [
        {
          title: "Daftar Audit Trail",
          headers: ["Waktu & Tanggal", "Tipe Aksi", "Pelaksana", "Rincian & Snapshot", "Alasan"],
          rows: filteredLogs.map((log) => [
            `${log.time} · ${log.date}`,
            log.action,
            `${log.performedBy} (${log.userRole.toUpperCase()})`,
            `${log.details.title}${log.details.before ? `\n(Sebelum: ${log.details.before} -> Sesudah: ${log.details.after})` : ""}`,
            log.details.reason ?? "-",
          ]),
        },
      ],
    });
    setExportNotice("Dokumen PDF audit log keamanan siap dicetak / disimpan.");
    setTimeout(() => setExportNotice(null), 3000);
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case "VOID_ORDER":
        return {
          icon: RotateCcw,
          label: "Otorisasi Void",
          classes: "bg-brand-coral-500/10 text-brand-coral-600 border-brand-coral-500/20",
        };
      case "MENU_PRICE_CHANGE":
        return {
          icon: Tag,
          label: "Ubah Harga Menu",
          classes: "bg-brand-yellow-500/15 text-brand-yellow-700 border-brand-yellow-500/30",
        };
      case "STAFF_PIN_RESET":
        return {
          icon: KeyRound,
          label: "Reset PIN Staf",
          classes: "bg-brand-green-900/10 text-brand-green-950 border-brand-green-900/20",
        };
      case "SHIFT_FORCE_CLOSE":
        return {
          icon: CheckCircle2,
          label: "Verifikasi Shift",
          classes: "bg-brand-green-800/15 text-brand-green-900 border-brand-green-800/25",
        };
      case "EXPENSE_RECORDED":
        return {
          icon: DollarSign,
          label: "Kas Kecil",
          classes: "bg-brand-cream-200 text-brand-green-950 border-brand-green-900/15",
        };
      default:
        return {
          icon: FileText,
          label: "Aktivitas Sistem",
          classes: "bg-neutral-100 text-neutral-700 border-neutral-200",
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-green-900/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-green-800 uppercase tracking-widest block flex items-center gap-1.5">
              <Lock className="size-3.5 text-brand-green-800" />
              Sistem Keamanan & Audit Trail (Tabel AUDIT_LOGS)
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-green-950">
            Log Audit Aktivitas & Keamanan Outlet
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Rekaman kronologis tak terhapus atas perubahan harga, pembatalan/void pesanan, reset PIN staf, dan persetujuan shift.
          </p>
        </div>

        {/* Action Buttons: Dual Export CSV & PDF */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-brand-cream-100/60 text-brand-green-950 text-xs font-bold rounded-2xl border border-brand-green-900/20 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-green-950 hover:bg-brand-green-900 text-brand-cream-50 text-xs font-bold rounded-2xl border border-brand-green-900 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="size-3.5" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-brand-green-900/10 border border-brand-green-900/20 text-brand-green-950 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-brand-green-800 flex-shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Log */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Total Log Tercatat</span>
            <span className="size-8 rounded-xl bg-brand-cream-100 text-brand-green-950 flex items-center justify-center">
              <FileText className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-2xl text-brand-green-950">
            {auditLogs.length} <span className="text-xs font-normal text-neutral-500">peristiwa</span>
          </div>
          <div className="text-[11px] text-neutral-500">
            {todayLogsCount} aktivitas dicatat hari ini
          </div>
        </div>

        {/* KPI 2: Otorisasi Void Nota */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Otorisasi Void Owner</span>
            <span className="size-8 rounded-xl bg-brand-coral-500/10 text-brand-coral-600 flex items-center justify-center">
              <RotateCcw className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-2xl text-brand-coral-600">
            {voidCount} <span className="text-xs font-normal text-neutral-500">transaksi</span>
          </div>
          <div className="text-[11px] text-neutral-500">
            Wajib menyertakan alasan pembatalan
          </div>
        </div>

        {/* KPI 3: Perubahan Harga Menu */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Perubahan Harga Menu</span>
            <span className="size-8 rounded-xl bg-brand-yellow-500/15 text-brand-yellow-700 flex items-center justify-center">
              <Tag className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-2xl text-brand-green-950">
            {priceChangesCount} <span className="text-xs font-normal text-neutral-500">kali</span>
          </div>
          <div className="text-[11px] text-neutral-500">
            Snapshot harga lama tersimpan aman
          </div>
        </div>

        {/* KPI 4: Keamanan PIN Staf */}
        <div className="p-5 rounded-3xl bg-brand-green-950 text-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-brand-cream-100/70">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-yellow-400">Rotasi PIN Staf</span>
            <span className="size-8 rounded-xl bg-white/10 text-brand-yellow-400 flex items-center justify-center">
              <KeyRound className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-2xl text-brand-yellow-400">
            {pinResetsCount} <span className="text-xs font-normal text-brand-cream-100/70">reset</span>
          </div>
          <div className="text-[11px] text-brand-cream-100/80">
            Proteksi akses tablet kasir outlet
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-brand-green-900/10 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aktivitas, pelaksana, atau alasan..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-brand-green-900 rounded-xl text-xs outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-neutral-500 whitespace-nowrap">Filter Aksi:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Aksi ({auditLogs.length})</option>
            <option value="VOID_ORDER">Otorisasi Void Pesanan</option>
            <option value="MENU_PRICE_CHANGE">Perubahan Harga Menu</option>
            <option value="STAFF_PIN_RESET">Reset PIN Staf</option>
            <option value="SHIFT_FORCE_CLOSE">Verifikasi Shift Kasir</option>
            <option value="EXPENSE_RECORDED">Pencatatan Kas Kecil</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200/80 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 sm:px-6">Waktu & Tanggal</th>
                <th className="py-3.5 px-4">Tipe Aksi</th>
                <th className="py-3.5 px-4">Pelaksana (User & Role)</th>
                <th className="py-3.5 px-4">Rincian Perubahan</th>
                <th className="py-3.5 px-4 sm:px-6">Alasan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.action);
                const BadgeIcon = badge.icon;

                return (
                  <tr key={log.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                      <span className="font-bold text-neutral-900 block">{log.time}</span>
                      <span className="text-neutral-500">{log.date}</span>
                    </td>

                    {/* Action Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.classes}`}
                      >
                        <BadgeIcon className="size-3" />
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    {/* Performed By */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-brand-cream-200 text-brand-green-950 font-bold text-[10px] flex items-center justify-center">
                          {log.performedBy.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-neutral-900 font-semibold block">{log.performedBy}</strong>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                              log.userRole === "owner"
                                ? "bg-brand-yellow-500/15 text-brand-yellow-700 border-brand-yellow-500/30"
                                : "bg-brand-green-900/10 text-brand-green-950 border-brand-green-900/20"
                            }`}
                          >
                            {log.userRole}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Details: Before & After */}
                    <td className="py-3.5 px-4 max-w-md">
                      <strong className="text-neutral-900 font-bold block mb-1">
                        {log.details.title}
                      </strong>
                      {(log.details.before || log.details.after) && (
                        <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200/80 font-mono text-[10px] space-y-0.5">
                          {log.details.before && (
                            <div className="text-brand-coral-600 flex items-center gap-1">
                              <span className="font-bold">Sebelum:</span> {log.details.before}
                            </div>
                          )}
                          {log.details.after && (
                            <div className="text-brand-green-900 flex items-center gap-1">
                              <span className="font-bold">Sesudah:</span> {log.details.after}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 sm:px-6 text-neutral-600 text-[11px] leading-relaxed">
                      {log.details.reason ? (
                        <span className="bg-brand-cream-50 px-2.5 py-1 rounded-xl border border-brand-green-900/10 block">
                          &ldquo;{log.details.reason}&rdquo;
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
