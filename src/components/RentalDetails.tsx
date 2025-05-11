import { useContractRead } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/constants";
import { formatAddress } from "../utils/format";

interface RentalDetailsProps {
  tokenId: number;
}

interface RentalData {
  renter: string;
  startTime: bigint;
  duration: bigint;
  rentalFee: bigint;
  isRented: boolean;
}

const RentalDetails = ({ tokenId }: RentalDetailsProps) => {
  const { data: rental, isLoading } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "getRentalData",
    args: [BigInt(tokenId)],
  }) as { data: RentalData | undefined; isLoading: boolean };

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-secondary/50 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-secondary/50 rounded"></div>
          <div className="h-4 bg-secondary/50 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="card">
        <h3 className="heading">Rental Details</h3>
        <p className="text-lightText/60">No rental data found for Token #{tokenId}</p>
      </div>
    );
  }

  const isRented = rental.isRented;
  const renter = rental.renter;
  const startTime = Number(rental.startTime);
  const duration = Number(rental.duration);
  const rentalFee = Number(rental.rentalFee) / 1e18; // Convert from wei to ETH

  return (
    <div className="card">
      <h3 className="heading mb-4">Rental Details</h3>
      <div className="space-y-3">
        <div>
          <span className="text-sm text-lightText/60">Status</span>
          <p className="font-medium">
            {isRented ? (
              <span className="text-green-400">Currently Rented</span>
            ) : (
              <span className="text-yellow-400">Available</span>
            )}
          </p>
        </div>

        {isRented && (
          <>
            <div>
              <span className="text-sm text-lightText/60">Renter</span>
              <p className="font-medium font-mono">{formatAddress(renter)}</p>
            </div>
            <div>
              <span className="text-sm text-lightText/60">Start Time</span>
              <p className="font-medium">
                {new Date(startTime * 1000).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-lightText/60">Duration</span>
              <p className="font-medium">{duration / (24 * 60 * 60)} days</p>
            </div>
          </>
        )}

        <div>
          <span className="text-sm text-lightText/60">Rental Fee</span>
          <p className="font-medium">{rentalFee.toFixed(6)} ETH per day</p>
        </div>
      </div>
    </div>
  );
};

export default RentalDetails; 