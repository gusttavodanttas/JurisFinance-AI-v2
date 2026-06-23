import { useEffect, useState } from "react";
import { Transaction, PriorityBill } from "../types";
import { getUserFinancials, saveUserFinancials } from "../lib/financeDb";

type SyncStatus = "synced" | "syncing" | "error" | "offline";

interface UseCloudSyncOptions {
  isAuthenticated: boolean;
  transactions: Transaction[];
  priorityBills: PriorityBill[];
  setTransactions: (fn: (prev: Transaction[]) => Transaction[]) => void;
  setPriorityBills: (fn: (prev: PriorityBill[]) => PriorityBill[]) => void;
}

export function useCloudSync({
  isAuthenticated,
  transactions,
  priorityBills,
  setTransactions,
  setPriorityBills,
}: UseCloudSyncOptions): { isLoadingCloud: boolean; syncStatus: SyncStatus } {
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

  // Fetch cloud data on login
  useEffect(() => {
    if (!isAuthenticated) return;
    const email = sessionStorage.getItem("gd_auth_email");
    if (!email) return;

    const fetchCloudData = async () => {
      setIsLoadingCloud(true);
      setSyncStatus("syncing");
      try {
        const cloudData = await getUserFinancials(email);
        if (cloudData) {
          setTransactions(() => cloudData.transactions || []);
          setPriorityBills(() => cloudData.priorityBills || []);
        } else {
          await saveUserFinancials(email, { transactions, priorityBills });
        }
        setSyncStatus("synced");
      } catch {
        setSyncStatus("error");
      } finally {
        setIsLoadingCloud(false);
      }
    };

    fetchCloudData();
  }, [isAuthenticated]);

  // Debounced sync to cloud (1s after changes)
  useEffect(() => {
    if (isLoadingCloud) return;
    const email = sessionStorage.getItem("gd_auth_email");
    if (!email || !isAuthenticated) return;

    const handler = setTimeout(async () => {
      setSyncStatus("syncing");
      const success = await saveUserFinancials(email, { transactions, priorityBills });
      setSyncStatus(success ? "synced" : "error");
    }, 1000);

    return () => clearTimeout(handler);
  }, [transactions, priorityBills, isAuthenticated, isLoadingCloud]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setSyncStatus("synced");
    const handleOffline = () => setSyncStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isLoadingCloud, syncStatus };
}
