import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/config/contracts';

const client = createPublicClient({
  chain: hardhat,
  transport: http(),
});

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json(
      { error: 'Missing listing ID' },
      { status: 400 }
    );
  }

  try {
    const listingId = BigInt(id);

    // First check if the contract is deployed
    const code = await client.getBytecode({ address: MARKETPLACE_ADDRESS });
    if (!code) {
      return NextResponse.json(
        { error: 'Contract not deployed. Please run `npx hardhat run scripts/deploy.js --network localhost`' },
        { status: 500 }
      );
    }

    const listing = await client.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'getListingDetails',
      args: [listingId],
    }) as [string, bigint, string, bigint, bigint, number, bigint, boolean, bigint, bigint];

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    const [
      nftContract,
      tokenId,
      lister,
      rentalPricePerDay,
      maxRentDurationDays,
      status,
      aiSuggestedPricePerDay,
      useAISuggestedPrice,
      minPriceLimit,
      maxPriceLimit
    ] = listing;

    return NextResponse.json({
      nftContract,
      tokenId: tokenId.toString(),
      lister,
      rentalPricePerDay: rentalPricePerDay.toString(),
      maxRentDurationDays: maxRentDurationDays.toString(),
      status,
      aiSuggestedPricePerDay: aiSuggestedPricePerDay.toString(),
      useAISuggestedPrice,
      minPriceLimit: minPriceLimit.toString(),
      maxPriceLimit: maxPriceLimit.toString()
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing. Make sure the Hardhat node is running and contracts are deployed.' },
      { status: 500 }
    );
  }
} 