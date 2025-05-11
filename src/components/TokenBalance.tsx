'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchBlockNumber } from 'wagmi';
import { MOCK_TOKEN_ADDRESS, MOCK_TOKEN_ABI, MARKETPLACE_ADDRESS } from '@/config/contracts';
import { formatEther, parseEther } from 'viem';

export default function TokenBalance() {
  const { address } = useAccount();
  const [isMinting, setIsMinting] = useState(false);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: MOCK_TOKEN_ADDRESS,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MOCK_TOKEN_ADDRESS,
    abi: MOCK_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, MARKETPLACE_ADDRESS] : undefined,
  });

  // Watch for block changes to auto-refresh data
  useWatchBlockNumber({
    onBlockNumber() {
      refetchBalance();
      refetchAllowance();
    },
  });

  const { writeContract } = useWriteContract();

  const handleMint = async () => {
    if (!address) return;

    try {
      setIsMinting(true);
      await writeContract({
        address: MOCK_TOKEN_ADDRESS,
        abi: MOCK_TOKEN_ABI,
        functionName: 'mint',
        args: [address, parseEther('1000')], // Mint 1000 MTK tokens
      });
      await refetchBalance();
      setIsMinting(false);
    } catch (error) {
      console.error('Error minting tokens:', error);
      setIsMinting(false);
    }
  };

  const handleApprove = async () => {
    if (!address) return;

    try {
      setIsMinting(true); // Reuse the loading state
      await writeContract({
        address: MOCK_TOKEN_ADDRESS,
        abi: MOCK_TOKEN_ABI,
        functionName: 'approve',
        args: [MARKETPLACE_ADDRESS, parseEther('100000')], // Approve a large amount
      });
      await refetchAllowance();
      setIsMinting(false);
    } catch (error) {
      console.error('Error approving tokens:', error);
      setIsMinting(false);
    }
  };

  if (!address) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-center text-gray-600">Please connect your wallet to view token balance</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">MTK Balance</h3>
      <p className="text-2xl font-bold mb-4">{balance ? formatEther(balance) : '0'} MTK</p>
      <div className="space-y-2">
        <button
          onClick={handleMint}
          disabled={isMinting}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isMinting ? 'Minting...' : 'Get 1000 MTK'}
        </button>
        {allowance !== undefined && allowance < parseEther('1000') && (
          <button
            onClick={handleApprove}
            disabled={isMinting}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isMinting ? 'Approving...' : 'Approve MTK for Marketplace'}
          </button>
        )}
      </div>
    </div>
  );
} 