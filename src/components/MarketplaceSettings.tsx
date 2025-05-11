import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/config/contracts';

export default function MarketplaceSettings() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newFeePercentage, setNewFeePercentage] = useState('');
  const [newAIOracle, setNewAIOracle] = useState('');

  const { data: settings } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'getSettings',
  });

  const { writeContract } = useWriteContract();

  useEffect(() => {
    if (settings) {
      const [feePercentage, aiOracle] = settings as [number, `0x${string}`];
      setNewFeePercentage(feePercentage.toString());
      setNewAIOracle(aiOracle);
      setIsLoading(false);
    }
  }, [settings]);

  const handleUpdateFee = async () => {
    if (!address || !newFeePercentage) return;

    try {
      setIsUpdating(true);
      await writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'setMarketplaceFeePercentage',
        args: [BigInt(parseFloat(newFeePercentage) * 100)], // Convert to basis points
      });
    } catch (error) {
      console.error('Error updating fee:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAIOracle = async () => {
    if (!address || !newAIOracle) return;

    try {
      setIsUpdating(true);
      await writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'setAIOracle',
        args: [newAIOracle as `0x${string}`],
      });
    } catch (error) {
      console.error('Error updating AI oracle:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!address || isLoading) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">Marketplace Settings</h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="feePercentage" className="block text-sm font-medium text-gray-700">
            Marketplace Fee (%)
          </label>
          <div className="mt-1 flex space-x-2">
            <input
              id="feePercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={newFeePercentage}
              onChange={(e) => setNewFeePercentage(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter fee percentage"
            />
            <button
              onClick={handleUpdateFee}
              disabled={isUpdating}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Update
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="aiOracle" className="block text-sm font-medium text-gray-700">
            AI Oracle Address
          </label>
          <div className="mt-1 flex space-x-2">
            <input
              id="aiOracle"
              type="text"
              value={newAIOracle}
              onChange={(e) => setNewAIOracle(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter AI oracle address"
            />
            <button
              onClick={handleUpdateAIOracle}
              disabled={isUpdating}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 