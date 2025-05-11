import { useState } from "react";
import { useContractWrite, useWaitForTransaction } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/constants";
import { formatEther } from "../utils/format";
import Button from "../components/ui/Button";

interface RentNFTFormProps {
  tokenId: string;
  rentalFee: bigint;
}

const RentNFTForm = ({ tokenId, rentalFee }: RentNFTFormProps) => {
  const [duration, setDuration] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    write: rentNFT,
    isLoading: isWritePending,
    data: writeData,
  } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "rentNFT",
    value: rentalFee,
  });

  const { isLoading: isTransactionPending } = useWaitForTransaction({
    hash: writeData?.hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!duration) {
      setError("Please enter a rental duration");
      return;
    }

    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      rentNFT({
        args: [BigInt(tokenId), BigInt(duration), email],
      });
    } catch (err) {
      console.error("Error renting NFT:", err);
      setError("Failed to rent NFT");
    }
  };

  const isLoading = isWritePending || isTransactionPending;

  return (
    <div className="card">
      <h3 className="heading">Rent NFT</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="duration" className="label">
            Duration (in seconds)
          </label>
          <input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="input"
            placeholder="Enter rental duration"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="Enter your email"
            disabled={isLoading}
          />
          <p className="text-sm text-lightText/60 mt-1">
            You'll receive notifications about your rental status
          </p>
        </div>

        <div>
          <span className="text-sm text-lightText/60">Rental Fee</span>
          <p className="font-medium">{formatEther(rentalFee)} ETH</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <Button
          type="submit"
          label={isLoading ? "Processing..." : "Rent NFT"}
          disabled={isLoading}
          variant="primary"
          className="w-full"
        />
      </form>
    </div>
  );
};

export default RentNFTForm; 