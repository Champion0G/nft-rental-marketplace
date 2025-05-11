import { useState } from "react";
import { useContractRead } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/constants";
import { formatTime } from "../utils/format";
import Button from "./ui/Button";

interface RentalData {
  startTime: bigint;
  duration: bigint;
  renter: string;
  renterEmail: string;
}

const CheckExpiry = () => {
  const [tokenId, setTokenId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    data: rentalData,
    isLoading,
    refetch,
  } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRentalData",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    enabled: Boolean(tokenId),
  }) as { data: RentalData | undefined; isLoading: boolean; refetch: () => Promise<any> };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tokenId) {
      setError("Please enter a token ID");
      return;
    }

    try {
      await refetch();
    } catch (err) {
      console.error("Error checking expiry:", err);
      setError("Failed to check expiry");
    }
  };

  const calculateRemainingTime = () => {
    if (!rentalData) return null;
    const startTime = Number(rentalData.startTime);
    const duration = Number(rentalData.duration);
    const endTime = startTime + duration;
    const now = Math.floor(Date.now() / 1000);
    return endTime - now;
  };

  const remainingTime = calculateRemainingTime();
  const isExpired = remainingTime !== null && remainingTime <= 0;

  return (
    <div className="card">
      <h3 className="heading">Check Rental Expiry</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tokenId" className="label">
            Token ID
          </label>
          <input
            id="tokenId"
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="input"
            placeholder="Enter token ID"
            disabled={isLoading}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {rentalData && (
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-lightText/80">Status</p>
            {isExpired ? (
              <p className="text-red-400 font-medium">Rental has expired</p>
            ) : remainingTime ? (
              <p className="text-accent font-medium">
                Time remaining: {formatTime(remainingTime)}
              </p>
            ) : (
              <p className="text-lightText/60">Not currently rented</p>
            )}
          </div>
        )}

        <Button
          type="submit"
          label={isLoading ? "Checking..." : "Check Expiry"}
          disabled={isLoading}
          variant="primary"
          className="w-full"
        />
      </form>
    </div>
  );
};

export default CheckExpiry; 