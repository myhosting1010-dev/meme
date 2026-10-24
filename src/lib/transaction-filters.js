export const transactionTabs = [
  { value: "all", label: "All transactions" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "other", label: "Other" },
];
export function transactionTypeFilter(type = "all") {
  if (!transactionTabs.some((tab) => tab.value === type)) throw new Error("Invalid transaction type.");
  return type === "all" ? {} : type === "other" ? { type: { $nin: ["deposit", "withdrawal"] } } : { type };
}
