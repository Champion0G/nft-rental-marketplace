import React, { useState, useEffect } from "react";
import { useContractRead, useContractWrite, useWaitForTransaction } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/constants";
import { formatEther } from "viem";
import Button from "./ui/Button";

const RentNFT: React.FC = () => {
  const [tokenId, setTokenId] = useState<number>(0);
  const [duration, setDuration] = useState<number>(1); // Default 1 day
  const [rentalFee, setRentalFee] = useState<bigint>(BigInt(0));

  // Calculate rental fee based on duration
  const { data: calculatedFee } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "calculateRentalFee",
    args: [BigInt(tokenId), BigInt(duration * 24 * 60 * 60)], // Convert days to seconds
    watch: true,
    enabled: tokenId > 0 && duration > 0,
  });

  // Update rental fee when calculated fee changes
  useEffect(() => {
    if (calculatedFee && typeof calculatedFee === 'bigint') {
      setRentalFee(calculatedFee);
    }
  }, [calculatedFee]);

  const { write, data } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "rentNFT",
  });

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const handleRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenId || !duration) {
      alert("Please enter both token ID and duration");
      return;
    }
    try {
      write?.({
        args: [BigInt(tokenId), BigInt(duration * 24 * 60 * 60)],
        value: rentalFee,
      });
    } catch (error) {
      console.error("Error renting NFT:", error);
      alert("Failed to rent NFT. Please check console for details.");
    }
  };

  const formatDurationPrice = (fee: bigint): string => {
    return formatEther(fee);
  };

  return (
    <div className="card">
      <h2 className="heading">Rent NFT</h2>
      <form onSubmit={handleRent} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Token ID</label>
          <input
            type="number"
            placeholder="Enter Token ID"
            value={tokenId}
            onChange={(e) => setTokenId(Number(e.target.value))}
            className="input-field"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duration (days)</label>
          <input
            type="number"
            placeholder="Enter rental duration in days"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="input-field"
            min="1"
          />
        </div>
        {rentalFee > 0 && (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-accent font-mono">
              Rental Fee: {formatDurationPrice(rentalFee)} ETH
            </p>
            {duration >= 3 && duration < 7 && (
              <p className="text-sm text-lightText/80 mt-1">
                🎉 10% discount applied for 3+ days rental!
              </p>
            )}
            {duration >= 7 && (
              <p className="text-sm text-lightText/80 mt-1">
                🎉 20% discount applied for 7+ days rental!
              </p>
            )}
          </div>
        )}
        <Button
          type="submit"
          label={isLoading ? "Processing..." : "Rent NFT"}
          disabled={isLoading || !write || rentalFee <= 0}
          isLoading={isLoading}
          variant="primary"
          className="w-full"
        />
        {isSuccess && (
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
            NFT rented successfully!
          </div>
        )}
      </form>
    </div>
  );
};

export default RentNFT; 