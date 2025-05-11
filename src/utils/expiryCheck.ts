import { readContract, writeContract } from "@wagmi/core";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./constants";
import { BigNumber } from "ethers";
import { sendExpiryNotification } from "./email";

interface RentalData {
  renter: string;
  startTime: number;
  duration: number;
  renterEmail?: string;
}

interface ExpiringRental {
  tokenId: string;
  renter: string;
  remainingTime: number;
  renterEmail?: string;
}

export async function getExpiringRentals(timeWindow: number = 3600): Promise<ExpiringRental[]> {
  try {
    const expiringRentals = (await readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "getExpiringRentals",
      args: [timeWindow],
    })) as BigNumber[];

    const rentalsData = [];
    for (const tokenId of expiringRentals) {
      const rental = (await readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "getRentalData",
        args: [tokenId],
      })) as RentalData;

      const remainingTime = rental.startTime + rental.duration - Math.floor(Date.now() / 1000);
      
      // Send email notification if email is available
      if (rental.renterEmail && remainingTime > 0) {
        await sendExpiryNotification(
          rental.renterEmail,
          tokenId.toString(),
          remainingTime,
          rental.renter
        );
      }

      rentalsData.push({
        tokenId: tokenId.toString(),
        renter: rental.renter,
        remainingTime,
        renterEmail: rental.renterEmail,
      });
    }

    return rentalsData;
  } catch (error) {
    console.error("Error fetching expiring rentals:", error);
    return [];
  }
}

export async function checkExpiredRentals(batchSize: number = 10): Promise<void> {
  try {
    const lastTokenId = (await readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "lastTokenId",
    })) as BigNumber;

    // Process in batches to avoid gas limits
    for (let startId = 1; startId <= lastTokenId.toNumber(); startId += batchSize) {
      const endId = Math.min(startId + batchSize - 1, lastTokenId.toNumber());
      
      await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "batchCheckExpiredRentals",
        args: [startId, endId],
      });
      
      console.log(`Checked rentals from ID ${startId} to ${endId}`);
    }
  } catch (error) {
    console.error("Error checking expired rentals:", error);
  }
} 