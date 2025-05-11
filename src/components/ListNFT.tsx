'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI, NFT_ADDRESS } from '@/config/contracts';
import { parseEther } from 'viem';

interface ListNFTProps {
  onList?: () => void;
}

export default function ListNFT({ onList }: ListNFTProps) {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [maxDuration, setMaxDuration] = useState('30');
  const [useAI, setUseAI] = useState(false);
  const [minPrice, setMinPrice] = useState('0.005');
  const [maxPrice, setMaxPrice] = useState('0.05');
  const [isListing, setIsListing] = useState(false);

  const { writeContract } = useWriteContract();

  const handleList = async () => {
    if (!address || !tokenId || !pricePerDay || !maxDuration) return;

    try {
      setIsListing(true);
      await writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'listNFT',
        args: [
          NFT_ADDRESS,
          BigInt(tokenId),
          parseEther(pricePerDay),
          BigInt(maxDuration),
          useAI,
          parseEther(minPrice),
          parseEther(maxPrice),
        ],
      });
      setIsListing(false);
      setTokenId('');
      setPricePerDay('');
      setMaxDuration('30');
      setUseAI(false);
      setMinPrice('0.005');
      setMaxPrice('0.05');
      onList?.();
    } catch (error) {
      console.error('Error listing NFT:', error);
      setIsListing(false);
    }
  };

  if (!address) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-center text-gray-600">Please connect your wallet to list NFTs</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">List NFT for Rent</h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700">
            Token ID
          </label>
          <input
            id="tokenId"
            type="number"
            min="0"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter token ID"
          />
        </div>

        <div>
          <label htmlFor="pricePerDay" className="block text-sm font-medium text-gray-700">
            Price per Day (MTK)
          </label>
          <input
            id="pricePerDay"
            type="number"
            min="0"
            step="0.001"
            value={pricePerDay}
            onChange={(e) => setPricePerDay(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter price per day in MTK"
          />
        </div>

        <div>
          <label htmlFor="maxDuration" className="block text-sm font-medium text-gray-700">
            Maximum Rental Duration (days)
          </label>
          <input
            id="maxDuration"
            type="number"
            min="1"
            value={maxDuration}
            onChange={(e) => setMaxDuration(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter maximum rental duration"
          />
        </div>

        <div className="flex items-center">
          <input
            id="useAI"
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="useAI" className="ml-2 block text-sm text-gray-900">
            Use AI Suggested Price
          </label>
        </div>

        {useAI && (
          <>
            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">
                Minimum Price (MTK)
              </label>
              <input
                id="minPrice"
                type="number"
                min="0"
                step="0.001"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter minimum price"
              />
            </div>

            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">
                Maximum Price (MTK)
              </label>
              <input
                id="maxPrice"
                type="number"
                min="0"
                step="0.001"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter maximum price"
              />
            </div>
          </>
        )}

        <button
          onClick={handleList}
          disabled={isListing || !tokenId || !pricePerDay || !maxDuration}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isListing ? 'Listing...' : 'List NFT'}
        </button>
      </div>
    </div>
  );
} 