import { ConnectButton } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">NFT Rental Marketplace</h1>
        <ConnectButton />
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* NFT listings will go here */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p>NFT rental listings will appear here.</p>
        </div>
      </div>
    </main>
  );
} 