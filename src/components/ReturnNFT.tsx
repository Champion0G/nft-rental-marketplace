import { useState } from "react";
import { useContractWrite, useWaitForTransaction } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/constants";
import Button from "../components/ui/Button";

const ReturnNFT = () => {
  const [tokenId, setTokenId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    write: returnNFT,
    isLoading: isWritePending,
    data: writeData,
  } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "returnNFT",
  });

  const { isLoading: isTransactionPending } = useWaitForTransaction({
    hash: writeData?.hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tokenId) {
      setError("Please enter a token ID");
      return;
    }

    try {
      returnNFT({
        args: [BigInt(tokenId)],
      });
    } catch (err) {
      console.error("Error returning NFT:", err);
      setError("Failed to return NFT");
    }
  };

  const isLoading = isWritePending || isTransactionPending;

  return (
    <div className="card">
      <h3 className="heading">Return NFT</h3>
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

        <Button
          type="submit"
          label={isLoading ? "Returning..." : "Return NFT"}
          disabled={isLoading}
          variant="primary"
          className="w-full"
        />
      </form>
    </div>
  );
};

export default ReturnNFT; 