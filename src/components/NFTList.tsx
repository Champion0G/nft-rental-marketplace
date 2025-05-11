'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI, MOCK_TOKEN_ADDRESS, MOCK_TOKEN_ABI } from '@/config/contracts';
import { formatEther } from 'viem';
import WalletConnect from './WalletConnect';

interface NFT {
  id: number;
  isAvailable: boolean;
  rentalFee: bigint;
  rentalDuration: bigint;
}

export default function NFTList() {
  const { address, isConnected } = useAccount();
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(1);
  const [isApproving, setIsApproving] = useState(false);
  const [isRenting, setIsRenting] = useState(false);

  const { data: nfts = [] } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'getAllNFTs',
  });

  const { data: allowance } = useReadContract({
    address: MOCK_TOKEN_ADDRESS,
    abi: MOCK_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address as `0x${string}`, MARKETPLACE_ADDRESS] : undefined,
  });

  const { writeContract: approveToken } = useWriteContract();
  const { writeContract: rentNFT } = useWriteContract();

  const handleRentNFT = async (nft: NFT) => {
    if (!address) return;

    try {
      setSelectedNFT(nft.id);
      const totalCost = nft.rentalFee * BigInt(duration);

      if (allowance === undefined || allowance < totalCost) {
        setIsApproving(true);
        await approveToken({
          address: MOCK_TOKEN_ADDRESS,
          abi: MOCK_TOKEN_ABI,
          functionName: 'approve',
          args: [MARKETPLACE_ADDRESS, totalCost],
        });
        setIsApproving(false);
      }

      setIsRenting(true);
      await rentNFT({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'rentNFT',
        args: [BigInt(nft.id), BigInt(duration)],
      });
      setIsRenting(false);
      setSelectedNFT(null);
    } catch (error) {
      console.error('Error renting NFT:', error);
      setIsApproving(false);
      setIsRenting(false);
      setSelectedNFT(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-6">Connect Your Wallet</h1>
        <div className="max-w-md mx-auto">
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Available NFTs for Rent</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(nfts) && nfts.map((nft: NFT) => (
          <div key={nft.id} className="bg-white rounded-lg p-4 shadow-md">
            <div className="aspect-square bg-gray-200 rounded-md mb-4"></div>
            <h2 className="text-lg font-semibold mb-2">NFT #{nft.id}</h2>
            <p className="text-sm text-gray-600 mb-2">
              Rental Fee: {formatEther(nft.rentalFee)} MTK
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Duration: {nft.rentalDuration.toString()} days
            </p>
            {nft.isAvailable ? (
              <button
                onClick={() => handleRentNFT(nft)}
                disabled={isApproving || isRenting || selectedNFT === nft.id}
                className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {selectedNFT === nft.id
                  ? isApproving
                    ? 'Approving...'
                    : isRenting
                    ? 'Renting...'
                    : 'Processing...'
                  : 'Rent Now'}
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-gray-200 text-gray-500 rounded-md py-2 cursor-not-allowed"
              >
                Currently Rented
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 