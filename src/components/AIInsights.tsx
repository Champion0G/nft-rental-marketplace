'use client';

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/config/contracts';
import { formatEther } from 'viem';

interface AIInsightsProps {
  listingId: number;
}

export default function AIInsights({ listingId }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(true);

  const { data: aiData } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'getAIData',
    args: [BigInt(listingId)],
  });

  useEffect(() => {
    if (aiData !== undefined) {
      setIsLoading(false);
    }
  }, [aiData]);

  if (isLoading || !aiData) {
    return null;
  }

  const [suggestedPrice, nftScore] = aiData;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-500">AI Insights</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Suggested Price</div>
          <div className="text-sm font-medium">{formatEther(suggestedPrice)} MTK/day</div>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">NFT Score</div>
          <div className="text-sm font-medium">{nftScore.toString()}/100</div>
        </div>
      </div>
    </div>
  );
} 