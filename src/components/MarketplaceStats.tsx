import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/config/contracts';
import { formatEther } from 'viem';

export default function MarketplaceStats() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(true);

  const { data: stats } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'getStats',
  });

  useEffect(() => {
    if (stats) {
      setIsLoading(false);
    }
  }, [stats]);

  if (!address || isLoading) {
    return null;
  }

  const [
    totalListings,
    activeListings,
    totalRentals,
    activeRentals,
    totalVolume,
    totalFees,
  ] = stats as [number, number, number, number, bigint, bigint];

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">Marketplace Statistics</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Total Listings</div>
          <div className="text-xl font-semibold">{totalListings}</div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Active Listings</div>
          <div className="text-xl font-semibold">{activeListings}</div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Total Rentals</div>
          <div className="text-xl font-semibold">{totalRentals}</div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Active Rentals</div>
          <div className="text-xl font-semibold">{activeRentals}</div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Total Volume</div>
          <div className="text-xl font-semibold">{formatEther(totalVolume)} ETH</div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Total Fees</div>
          <div className="text-xl font-semibold">{formatEther(totalFees)} ETH</div>
        </div>
      </div>
    </div>
  );
} 