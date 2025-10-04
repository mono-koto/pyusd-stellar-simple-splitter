import { useLocation } from 'wouter';
import { useWallet } from '@/contexts/wallet-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { EXPLORER_URL } from '@/config';

export function Header() {
  const [, setLocation] = useLocation();
  const { address, isConnected, connect, disconnect } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };


  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1
            className="text-xl font-semibold cursor-pointer hover:opacity-80"
            onClick={() => setLocation('/')}
          >
            PYUSD Splitter
          </h1>
          <Badge variant="outline" className="text-xs">
            Testnet
          </Badge>
        </div>
        <div>
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1">
                <a
                  href={`${EXPLORER_URL}/account/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:underline"
                >
                  {address.slice(0, 4)}...{address.slice(-4)}
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(address);
                    toast.success('Address copied to clipboard');
                  }}
                  className="hover:opacity-70 cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnect}>Connect Wallet</Button>
          )}
        </div>
      </div>
    </header>
  );
}
