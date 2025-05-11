'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/config/contracts';
import { formatEther } from 'viem';

interface ActiveRental {
  listingId: number;
  tokenId: number;
  endTime: string;
  totalFee: string;
}

export default function ActiveRentals() {
  const { address } = useAccount();
  const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState<Record<number, boolean>>({});

  const fetchRentalDetails = async (listingId: number) => {
    try {
      const result = await fetch(`/api/rentals/${listingId}`);
      const data = await result.json();
      if (!result.ok) {
        throw new Error(data.error || 'Failed to fetch rental details');
      }
      return data;
    } catch (error) {
      console.error('Error fetching rental details:', error);
      return null;
    }
  };

  const fetchListingDetails = async (listingId: number) => {
    try {
      const result = await fetch(`/api/listings/${listingId}`);
      const data = await result.json();
      if (!result.ok) {
        throw new Error(data.error || 'Failed to fetch listing details');
      }
      return data;
    } catch (error) {
      console.error('Error fetching listing details:', error);
      return null;
    }
  };

  const checkListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rentals: ActiveRental[] = [];
      for (let i = 0; i < 5; i++) {
        const rental = await fetchRentalDetails(i);
        if (rental && rental.isActive && rental.renter === address) {
          const listing = await fetchListingDetails(i);
          if (listing) {
            rentals.push({
              listingId: i,
              tokenId: Number(listing[1]), // Convert BigInt to number
              endTime: rental.endTime,
              totalFee: rental.totalFee,
            });
          }
        }
      }
      setActiveRentals(rentals);
    } catch (err) {
      console.error('Error checking listings:', err);
      setError('Failed to fetch active rentals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // For demo purposes, check listings 0-4
  useEffect(() => {
    if (address) {
      checkListings();
    }
  }, [address]);

  const { writeContract } = useWriteContract();

  const handleReturn = async (listingId: number) => {
    if (!address) return;

    try {
      setIsReturning({ ...isReturning, [listingId]: true });
      await writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'endRental',
        args: [BigInt(listingId)],
      });
      setActiveRentals(activeRentals.filter(rental => rental.listingId !== listingId));
    } catch (error) {
      console.error('Error returning NFT:', error);
    } finally {
      setIsReturning({ ...isReturning, [listingId]: false });
    }
  };

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Active Rentals</h1>
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">Please connect your wallet to view your active rentals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Active Rentals</h1>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading active rentals...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => {
              if (address) {
                checkListings();
              }
            }}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      ) : activeRentals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">You have no active rentals</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeRentals.map((rental) => (
            <div key={rental.listingId} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold">NFT #{rental.tokenId}</h3>
                <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                  Active
                </span>
              </div>

              <div className="space-y-2">
                <p>End Time: {new Date(Number(rental.endTime) * 1000).toLocaleString()}</p>
                <p>Total Fee: {formatEther(BigInt(rental.totalFee))} ETH</p>
              </div>

              <button
                onClick={() => handleReturn(rental.listingId)}
                disabled={isReturning[rental.listingId]}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isReturning[rental.listingId] ? 'Returning...' : 'Return NFT'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 