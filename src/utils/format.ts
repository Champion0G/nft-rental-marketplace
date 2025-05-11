import { formatEther as formatEtherWei } from "viem";

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTime(seconds: number): string {
  if (seconds <= 0) return "Expired";

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  // If less than a minute, show seconds
  if (parts.length === 0) {
    return `${Math.max(0, Math.floor(seconds))}s`;
  }

  return parts.join(" ");
}

export function formatEther(wei: bigint): string {
  const formatted = formatEtherWei(wei);
  // Remove trailing zeros after decimal point
  return formatted.replace(/\.?0+$/, "");
} 