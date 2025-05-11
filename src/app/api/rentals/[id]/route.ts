import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/config/contracts';

const client = createPublicClient({
  chain: hardhat,
  transport: http(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { error: 'Missing listing ID' },
      { status: 400 }
    );
  }

  try {
    const listingId = BigInt(id);

    const rental = await client.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'getRentalDetails',
      args: [listingId],
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // The rental data is returned as a tuple in a struct
    const [renter, startTime, endTime, totalFee, isActive] = rental as [string, bigint, bigint, bigint, boolean];

    return NextResponse.json({
      renter,
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      totalFee: totalFee.toString(),
      isActive,
    });
  } catch (error) {
    console.error('Error fetching rental:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental' },
      { status: 500 }
    );
  }
} 