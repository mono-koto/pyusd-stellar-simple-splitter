import { useLocation } from 'wouter';
import { useWallet } from '@/contexts/wallet-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
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
              <span className="text-sm text-muted-foreground">{truncateAddress(address)}</span>
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
