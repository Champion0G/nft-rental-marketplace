import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { NFT_ADDRESS, NFT_ABI } from '@/config/contracts';

const client = createPublicClient({
  chain: hardhat,
  transport: http(),
});

export async function GET(
  request: Request,
  { params }: { params: { address: string; index: string } }
) {
  try {
    const tokenId = await client.readContract({
      address: NFT_ADDRESS,
      abi: NFT_ABI,
      functionName: 'tokenOfOwnerByIndex',
      args: [params.address as `0x${string}`, BigInt(parseInt(params.index))],
    });

    return NextResponse.json(tokenId);
  } catch (error) {
    console.error('Error fetching token ID:', error);
    return NextResponse.json({ error: 'Failed to fetch token ID' }, { status: 500 });
  }
} 