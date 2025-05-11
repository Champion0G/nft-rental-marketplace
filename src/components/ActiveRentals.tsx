import { useRentalExpiry } from "../hooks/useRentalExpiry";
import { formatAddress, formatTime } from "../utils/format";
import Button from "../components/ui/Button";

const ActiveRentals = () => {
  const { expiringRentals: rentals, isLoading, error, checkExpirations } = useRentalExpiry(Infinity); // No expiry threshold

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

  if (error) {
    return (
      <div className="card">
        <h3 className="heading">Active Rentals</h3>
        <div className="text-red-400 text-sm">{error}</div>
        <Button
          label="Retry"
          onClick={checkExpirations}
          variant="secondary"
          className="mt-2"
        />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="heading mb-0">Active Rentals</h3>
        <Button
          label="Refresh"
          onClick={checkExpirations}
          variant="secondary"
          className="text-sm px-3 py-1"
          disabled={isLoading}
        />
      </div>

      {rentals.length > 0 ? (
        <div className="space-y-3">
          {rentals.map((rental) => (
            <div
              key={rental.tokenId}
              className="p-4 rounded-lg bg-secondary/50 border border-secondary hover:border-accent/20 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-accent font-mono">Token #{rental.tokenId}</span>
                  <p className="text-sm text-lightText/80">
                    Renter: {formatAddress(rental.renter)}
                  </p>
                  <p className="text-sm text-lightText/60">
                    Email: {rental.renterEmail}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-lightText/80">Time Remaining</span>
                  <p className="text-accent font-mono">
                    {formatTime(rental.remainingTime)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-lightText/60 text-center py-4">
          No active rentals found
        </p>
      )}
    </div>
  );
};

export default ActiveRentals; 