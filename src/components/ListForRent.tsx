import React, { useState } from "react";
import { useWriteContract, useWatchContractEvent } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/constants";
import { parseEther } from "viem";

const ListForRent: React.FC = () => {
  const [tokenId, setTokenId] = useState<number>(0);
  const [rentalDuration, setRentalDuration] = useState<number>(0);
  const [rentalFee, setRentalFee] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { writeContract, isPending, error } = useWriteContract();

  // Watch for NFTListed events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    eventName: 'NFTListed',
    onLogs(logs) {
      setIsSuccess(true);
      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenId || !rentalDuration || !rentalFee) {
      alert("Please fill in all fields");
      return;
    }
    try {
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "listNFTForRent",
        args: [BigInt(tokenId), BigInt(rentalDuration), parseEther(rentalFee || "0")],
      });
    } catch (error) {
      console.error("Error listing NFT:", error);
      alert("Failed to list NFT. Please check console for details.");
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="heading">List NFT for Rent</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Token ID</label>
          <input
            type="number"
            placeholder="Enter Token ID"
            value={tokenId}
            onChange={(e) => setTokenId(Number(e.target.value))}
            className="input"
            min="0"
          />
        </div>
        <div>
          <label className="label">Rental Duration (in seconds)</label>
          <input
            type="number"
            placeholder="Enter duration in seconds"
            value={rentalDuration}
            onChange={(e) => setRentalDuration(Number(e.target.value))}
            className="input"
            min="0"
          />
        </div>
        <div>
          <label className="label">Rental Fee (in ETH)</label>
          <input
            type="text"
            placeholder="Enter rental fee in ETH"
            value={rentalFee}
            onChange={(e) => setRentalFee(e.target.value)}
            className="input"
            pattern="[0-9]*\.?[0-9]*"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isPending}
        >
          {isPending ? "Listing..." : "List NFT"}
        </button>
        {isSuccess && (
          <div className="success">
            NFT Listed Successfully!
          </div>
        )}
        {error && (
          <div className="error">
            {error.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default ListForRent; 