import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { NFT_ADDRESS, NFT_ABI } from '@/config/contracts';

export default function NFTBalance() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [tokenIds, setTokenIds] = useState<number[]>([]);

  const { data: balanceData } = useReadContract({
    address: NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'balanceOf',
    args: [address!],
    enabled: !!address,
  });

  useEffect(() => {
    const fetchTokenIds = async () => {
      if (!address || !balanceData) return;

      try {
        const balance = Number(balanceData);
        setBalance(balance);

        const ids: number[] = [];
        for (let i = 0; i < balance; i++) {
          const tokenId = await fetchTokenOfOwnerByIndex(i);
          if (tokenId !== null) {
            ids.push(tokenId);
          }
        }
        setTokenIds(ids);
      } catch (error) {
        console.error('Error fetching token IDs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenIds();
  }, [address, balanceData]);

  const fetchTokenOfOwnerByIndex = async (index: number) => {
    try {
      const result = await fetch(`/api/nft/token-of-owner/${address}/${index}`);
      const data = await result.json();
      return Number(data);
    } catch (error) {
      console.error('Error fetching token ID:', error);
      return null;
    }
  };

  if (!address || isLoading) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">Your NFTs</h3>

      {balance === 0 ? (
        <p className="text-gray-600">You don't own any NFTs yet</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Total NFTs: {balance}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tokenIds.map((tokenId) => (
              <div
                key={tokenId}
                className="p-2 bg-gray-50 rounded text-center"
              >
                <div className="text-sm font-medium">Token #{tokenId}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 