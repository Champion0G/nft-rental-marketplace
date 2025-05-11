import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/config/contracts';

const client = createPublicClient({
  chain: hardhat,
  transport: http(),
});

export async function GET(request: NextRequest) {
  try {
    // First check if the contract is deployed
    const code = await client.getBytecode({ address: MARKETPLACE_ADDRESS });
    if (!code) {
      return NextResponse.json(
        { error: 'Contract not deployed. Please run `npx hardhat run scripts/deploy.js --network localhost`' },
        { status: 500 }
      );
    }

    const listings = [];
    // For demo purposes, check listings 0-4
    for (let i = 0; i < 5; i++) {
      try {
        const listing = await client.readContract({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          functionName: 'getListingDetails',
          args: [BigInt(i)],
        }) as [string, bigint, string, bigint, bigint, number, bigint, boolean, bigint, bigint];

        // Skip if the listing is empty (address(0))
        if (listing[0] === '0x0000000000000000000000000000000000000000') {
          continue;
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

        listings.push({
          listingId: i,
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
        console.error(`Error fetching listing ${i}:`, error);
        // Just skip this listing and continue with the next one
        continue;
      }
    }

    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings. Make sure the Hardhat node is running and contracts are deployed.' },
      { status: 500 }
    );
  }
} 