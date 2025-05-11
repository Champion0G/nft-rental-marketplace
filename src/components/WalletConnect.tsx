'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { hardhat } from 'wagmi/chains';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  if (isConnected) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-gray-600">
          Connected to {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <button
          onClick={() => disconnect()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Connect Wallet
    </button>
  );
} 