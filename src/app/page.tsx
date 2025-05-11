'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import NFTListing from '@/components/NFTListing';
import ListNFT from '@/components/ListNFT';
import MarketplaceSettings from '@/components/MarketplaceSettings';
import MarketplaceStats from '@/components/MarketplaceStats';
import NFTBalance from '@/components/NFTBalance';
import TokenBalance from '@/components/TokenBalance';

interface Listing {
  listingId: number;
  nftContract: string;
  tokenId: number;
  rentalPricePerDay: bigint;
  maxRentDurationDays: number;
  lister: string;
  status: number;
  aiSuggestedPricePerDay: bigint;
  useAISuggestedPrice: boolean;
  minPriceLimit: bigint;
  maxPriceLimit: bigint;
}

export default function Home() {
  const { address } = useAccount();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/listings');
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to fetch listings');
        return;
      }

      const fetchedListings = data.map((listing: any) => ({
        listingId: Number(listing.listingId),
        nftContract: listing.nftContract,
        tokenId: Number(listing.tokenId),
        rentalPricePerDay: BigInt(listing.rentalPricePerDay),
        maxRentDurationDays: Number(listing.maxRentDurationDays),
        lister: listing.lister,
        status: listing.status,
        aiSuggestedPricePerDay: BigInt(listing.aiSuggestedPricePerDay),
        useAISuggestedPrice: listing.useAISuggestedPrice,
        minPriceLimit: BigInt(listing.minPriceLimit),
        maxPriceLimit: BigInt(listing.maxPriceLimit)
      }));

      setListings(fetchedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('Failed to fetch listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {!address ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">Please connect your wallet using the button above to interact with the marketplace</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <MarketplaceStats />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <NFTBalance />
            <TokenBalance />
            <ListNFT onList={fetchListings} />
          </div>

          <div className="mb-8">
            <MarketplaceSettings />
          </div>

          <h2 className="text-2xl font-bold mb-6">Available NFTs</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading listings...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={fetchListings}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No NFTs available for rent</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <NFTListing
                  key={listing.listingId}
                  {...listing}
                  onRent={fetchListings}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
