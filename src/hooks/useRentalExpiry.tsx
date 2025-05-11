import { useEffect, useState } from "react";
import { useContractRead } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/constants";
import { sendRentalExpiryEmail } from "../utils/sendEmail";

interface ExpiringRental {
  tokenId: number;
  renter: string;
  renterEmail: string;
  remainingTime: number;
}

interface RentalData {
  renter: string;
  renterEmail: string;
  startTime: bigint;
  duration: bigint;
  rentalFee: bigint;
  isRented: boolean;
}

interface NotificationState {
  [key: number]: boolean; // tokenId -> hasBeenNotified
}

export const useRentalExpiry = (expiryThreshold: number = 600) => {
  const [expiringRentals, setExpiringRentals] = useState<ExpiringRental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifiedTokens, setNotifiedTokens] = useState<NotificationState>({});

  const { data: lastTokenId } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "lastTokenId",
  }) as { data: bigint | undefined };

  const checkExpirations = async () => {
    if (!lastTokenId) return;

    setIsLoading(true);
    setError(null);

    try {
      const expiring: ExpiringRental[] = [];
      const now = Math.floor(Date.now() / 1000);
      const notificationThreshold = 600; // 10 minutes

      // Fetch rentals in parallel using Promise.all
      const rentalPromises = Array.from({ length: Number(lastTokenId) }, (_, i) => i + 1).map(
        async (tokenId) => {
          try {
            const rental = (await readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: CONTRACT_ABI,
              functionName: "getRentalData",
              args: [BigInt(tokenId)],
            })) as RentalData;

            if (rental.isRented) {
              const startTime = Number(rental.startTime);
              const duration = Number(rental.duration);
              const endTime = startTime + duration;
              const remainingTime = endTime - now;

              // Check if rental is expiring within the threshold
              if (remainingTime > 0 && remainingTime <= expiryThreshold) {
                const rentalInfo = {
                  tokenId,
                  renter: rental.renter,
                  renterEmail: rental.renterEmail,
                  remainingTime,
                };
                expiring.push(rentalInfo);

                // Send notification if within notification threshold and not already notified
                if (
                  remainingTime <= notificationThreshold &&
                  !notifiedTokens[tokenId] &&
                  rental.renterEmail
                ) {
                  const emailSent = await sendRentalExpiryEmail({
                    to: rental.renterEmail,
                    tokenId,
                    remainingTime,
                    renter: rental.renter,
                  });

                  if (emailSent) {
                    setNotifiedTokens((prev) => ({ ...prev, [tokenId]: true }));
                  }
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching rental data for token ${tokenId}:`, err);
          }
        }
      );

      await Promise.all(rentalPromises);
      setExpiringRentals(expiring);
    } catch (err) {
      console.error("Error checking expirations:", err);
      setError("Failed to check rental expirations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (lastTokenId) {
      checkExpirations();

      // Check expirations every minute
      const interval = setInterval(checkExpirations, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [lastTokenId, expiryThreshold]);

  return {
    expiringRentals,
    isLoading,
    error,
    checkExpirations,
  };
}; 