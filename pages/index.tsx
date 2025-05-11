import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <main className="min-h-screen p-4">
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">NFT Rental Marketplace</h1>
        <div>
          {isConnected ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Connect Wallet
            </button>
          )}
        </div>
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