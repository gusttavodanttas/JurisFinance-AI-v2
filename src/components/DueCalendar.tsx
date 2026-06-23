import React, { useState } from "react";
import { Transaction, TransactionType } from "../types";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface DueCalendarProps {
  transactions: Transaction[];
}

const PT_MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const PT_DAYS_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export default function DueCalendar({ transactions }: DueCalendarProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = now.toISOString().substring(0, 10);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  // Group PREVISTO transactions by date
  const byDate: Record<string, Transaction[]> = {};
  transactions.filter(t => t.status === "PREVISTO").forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = [];
    byDate[t.date].push(t);
  });

  const getDayStr = (d: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const selectedTxs = selectedDay ? (byDate[selectedDay] ?? []) : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-50 rounded-lg"><CalendarDays className="w-4 h-4 text-violet-500" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Calendário de Vencimentos</p>
            <p className="text-xs font-bold text-slate-700">{PT_MONTHS[viewMonth]} {viewYear}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {PT_DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Leading blanks */}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`blank-${i}`} />)}

        {/* Days */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dayStr = getDayStr(day);
          const txs = byDate[dayStr] ?? [];
          const hasRev = txs.some(t => t.type === TransactionType.REVENUE);
          const hasExp = txs.some(t => t.type === TransactionType.EXPENSE);
          const isToday = dayStr === todayStr;
          const isSelected = dayStr === selectedDay;
          const isOverdue = dayStr < todayStr && txs.length > 0;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : dayStr)}
              className={`relative flex flex-col items-center py-1.5 rounded-lg text-xs font-bold transition cursor-pointer
                ${isSelected ? "bg-violet-600 text-white" :
                  isToday ? "bg-violet-50 text-violet-700 ring-1 ring-violet-300" :
                  txs.length > 0 ? "hover:bg-slate-50 text-slate-700" : "text-slate-400 hover:bg-slate-50"}`}
            >
              <span className="text-[11px] leading-none">{day}</span>
              {txs.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasRev && <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? "bg-amber-500" : "bg-emerald-500"} ${isSelected ? "opacity-90" : ""}`} />}
                  {hasExp && <span className={`w-1.5 h-1.5 rounded-full bg-rose-500 ${isSelected ? "opacity-90" : ""}`} />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />A receber
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />A pagar
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Em atraso
        </span>
      </div>

      {/* Selected day detail */}
      {selectedDay && selectedTxs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {selectedDay.split("-").reverse().join("/")} · {selectedTxs.length} lançamento(s)
          </p>
          {selectedTxs.map(t => (
            <div key={t.id} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.type === TransactionType.REVENUE ? "bg-emerald-500" : "bg-rose-500"}`} />
              <span className="flex-1 text-xs text-slate-700 truncate">{t.description}</span>
              <span className={`text-xs font-bold font-mono shrink-0 ${t.type === TransactionType.REVENUE ? "text-emerald-600" : "text-rose-600"}`}>
                {t.type === TransactionType.REVENUE ? "+" : "-"}{formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {selectedDay && selectedTxs.length === 0 && (
        <p className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-100">Nenhum vencimento previsto em {selectedDay.split("-").reverse().join("/")}.</p>
      )}
    </div>
  );
}
