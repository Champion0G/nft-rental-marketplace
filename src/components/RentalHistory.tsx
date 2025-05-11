'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

interface RentalHistoryItem {
  listingId: number;
  tokenId: bigint;
  startTime: bigint;
  endTime: bigint;
  totalFee: bigint;
  isActive: boolean;
}

export default function RentalHistory() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<RentalHistoryItem[]>([]);

  useEffect(() => {
    const fetchRentalHistory = async () => {
      if (!address) return;

      try {
        // For demo purposes, check listings 0-4
        const rentals: RentalHistoryItem[] = [];
        for (let i = 0; i < 5; i++) {
          const response = await fetch(`/api/rentals/${i}`);
          const rental = await response.json();
          if (rental && rental.renter === address) {
            const listingResponse = await fetch(`/api/listings/${i}`);
            const listing = await listingResponse.json();
            if (listing) {
              rentals.push({
                listingId: i,
                tokenId: BigInt(listing.tokenId),
                startTime: BigInt(rental.startTime),
                endTime: BigInt(rental.endTime),
                totalFee: BigInt(rental.totalFee),
                isActive: rental.isActive,
              });
            }
          }
        }
        setHistory(rentals);
      } catch (error) {
        console.error('Error fetching rental history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentalHistory();
  }, [address]);

  if (!address || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Rental History</h1>
        <div className="text-center py-8">
          {!address ? (
            <p className="text-lg text-gray-600">Please connect your wallet to view your rental history</p>
          ) : (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading rental history...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Rental History</h1>
      {history.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">No rental history found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((rental) => (
            <div key={rental.listingId} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">NFT #{rental.tokenId.toString()}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Start: {new Date(Number(rental.startTime) * 1000).toLocaleString()}</p>
                <p>End: {new Date(Number(rental.endTime) * 1000).toLocaleString()}</p>
                <p>Total Fee: {formatEther(rental.totalFee)} MTK</p>
                <p className={`font-semibold ${rental.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {rental.isActive ? 'Active' : 'Ended'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 