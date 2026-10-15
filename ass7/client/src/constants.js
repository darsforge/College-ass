export const CATEGORIES = ["Food", "Transport", "Education", "Shopping", "Bills", "Entertainment", "Health", "Other"];

export const COLORS = {
  Food: "#e8704a",
  Transport: "#3b82c4",
  Education: "#5b4bb7",
  Shopping: "#d6578f",
  Bills: "#4a5568",
  Entertainment: "#e0a82e",
  Health: "#2f9e75",
  Other: "#8a94a6",
};

export const rupees = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const compact = (n) => (n >= 100000 ? (n / 100000).toFixed(1) + "L" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(Math.round(n)));

export const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const monthLabel = (ym, style = "short") => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: style,
    ...(style === "long" ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
};
