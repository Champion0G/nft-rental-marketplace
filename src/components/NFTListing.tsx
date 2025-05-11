'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchBlockNumber } from 'wagmi';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI, MOCK_TOKEN_ADDRESS, MOCK_TOKEN_ABI } from '@/config/contracts';
import { formatEther } from 'viem';

interface NFTListingProps {
  listingId: number;
  nftContract: string;
  tokenId: number;
  rentalPricePerDay: bigint;
  maxRentDurationDays: number;
  lister: string;
  status: number;
  aiSuggestedPricePerDay: bigint;
  useAISuggestedPrice: boolean;
  minPriceLimit: bigint;
  maxPriceLimit: bigint;
  onRent?: () => void;
}

export default function NFTListing({
  listingId,
  nftContract,
  tokenId,
  rentalPricePerDay,
  maxRentDurationDays,
  lister,
  status,
  aiSuggestedPricePerDay,
  useAISuggestedPrice,
  minPriceLimit,
  maxPriceLimit,
  onRent
}: NFTListingProps) {
  const { address, isConnected } = useAccount();
  const [duration, setDuration] = useState<number>(1);
  const [isApproving, setIsApproving] = useState(false);
  const [isRenting, setIsRenting] = useState(false);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MOCK_TOKEN_ADDRESS,
    abi: MOCK_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address as `0x${string}`, MARKETPLACE_ADDRESS] : undefined,
  });

  // Watch for block changes to auto-refresh data
  useWatchBlockNumber({
    onBlockNumber() {
      refetchAllowance();
    },
  });

  const { data: rentalFee } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'calculateRentalFee',
    args: [useAISuggestedPrice ? aiSuggestedPricePerDay : rentalPricePerDay, BigInt(duration)],
  });

  const { writeContract: approveToken } = useWriteContract();
  const { writeContract: rentNFT } = useWriteContract();

  const handleRent = async () => {
    if (!address || duration <= 0 || !rentalFee) return;

    try {
      if (allowance === undefined || allowance < rentalFee) {
        setIsApproving(true);
        await approveToken({
          address: MOCK_TOKEN_ADDRESS,
          abi: MOCK_TOKEN_ABI,
          functionName: 'approve',
          args: [MARKETPLACE_ADDRESS, rentalFee],
        });
        await refetchAllowance();
        setIsApproving(false);
      }

      setIsRenting(true);
      await rentNFT({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'rentNFT',
        args: [BigInt(listingId), BigInt(duration)],
      });
      setIsRenting(false);
      onRent?.();
    } catch (error) {
      console.error('Error renting NFT:', error);
      setIsApproving(false);
      setIsRenting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-center text-gray-600">Please connect your wallet to rent NFTs</p>
      </div>
    );
  }

  const currentPrice = useAISuggestedPrice ? aiSuggestedPricePerDay : rentalPricePerDay;
  const isAvailable = status === 0; // ListingStatus.Available

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">NFT #{tokenId}</h3>
        <span className={`px-2 py-1 rounded text-sm ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isAvailable ? 'Available' : 'Rented'}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-500">Price per day: {formatEther(currentPrice)} MTK</p>
        <p className="text-sm text-gray-500">Max duration: {maxRentDurationDays} days</p>
        {useAISuggestedPrice && (
          <p className="text-sm text-gray-500">AI Suggested Price: {formatEther(aiSuggestedPricePerDay)} MTK</p>
        )}
      </div>

      {isAvailable && (
        <div className="space-y-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Rental Duration (days)
            </label>
            <input
              id="duration"
              type="number"
              min="1"
              max={maxRentDurationDays}
              value={duration}
              onChange={(e) => setDuration(Math.min(Number(e.target.value), maxRentDurationDays))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {rentalFee && (
            <p className="text-sm font-medium text-gray-900">
              Total Cost: {formatEther(rentalFee)} MTK
            </p>
          )}

          <button
            onClick={handleRent}
            disabled={isApproving || isRenting || duration <= 0 || duration > maxRentDurationDays}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isApproving ? 'Approving...' : isRenting ? 'Renting...' : 'Rent Now'}
          </button>
        </div>
      )}
    </div>
  );
} 