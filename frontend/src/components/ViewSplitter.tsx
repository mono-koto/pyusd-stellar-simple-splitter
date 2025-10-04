import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';
import { getSplitterConfig, getSplitterBalance, distributeSplitter } from '@/lib/contracts';
import { EXPLORER_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ViewSplitterProps {
  address: string;
}

export function ViewSplitter({ address }: ViewSplitterProps) {
  const { kit, address: userAddress, isConnected } = useWallet();
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading, error: configError } = useQuery({
    queryKey: ['splitter-config', address],
    queryFn: () => getSplitterConfig(address),
    enabled: !!address && address.length === 56 && address.startsWith('C'),
  });

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['splitter-balance', address],
    queryFn: () => getSplitterBalance(address),
    refetchInterval: 10000, // Refresh every 10s
    enabled: !!address && address.length === 56 && address.startsWith('C'),
  });

  const distributeMutation = useMutation({
    mutationFn: async () => {
      if (!kit || !userAddress) throw new Error('Wallet not connected');
      return distributeSplitter(kit, userAddress, address);
    },
    onSuccess: () => {
      toast.success('Distribution initiated successfully!');
      queryClient.invalidateQueries({ queryKey: ['splitter-balance', address] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to distribute');
    },
  });

  const totalShares = config?.shares.reduce((a, b) => a + b, 0) || 1;
  const balanceNum = parseFloat(balance || '0');

  const calculateDistributableAmount = (share: number) => {
    return ((balanceNum * share) / totalShares).toFixed(7);
  };

  const calculatePercentage = (share: number) => {
    return ((share / totalShares) * 100).toFixed(2);
  };

  // Invalid address format
  if (!address || address.length !== 56 || !address.startsWith('C')) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-destructive">Invalid splitter address format</p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Expected a 56-character contract address starting with 'C'
          </p>
        </CardContent>
      </Card>
    );
  }

  if (configLoading || balanceLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading splitter details...</p>
        </CardContent>
      </Card>
    );
  }

  if (configError || !config) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-destructive">Failed to load splitter configuration</p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {configError instanceof Error ? configError.message : 'Contract may not exist or be initialized'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Splitter Details</CardTitle>
          <CardDescription>
            <div className="inline-flex items-center gap-1">
              <a
                href={`${EXPLORER_URL}/contract/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {address}
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
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold">{balance || '0'} PYUSD</p>
          </div>

          <Button
            onClick={() => distributeMutation.mutate()}
            disabled={!isConnected || distributeMutation.isPending || balanceNum === 0}
            className="w-full"
          >
            {distributeMutation.isPending ? 'Distributing...' : 'Distribute'}
          </Button>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to distribute funds
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
          <CardDescription>Share allocation and distributable amounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Share</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
                <TableHead className="text-right">Distributable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.recipients.map((recipient, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">
                    <div className="inline-flex items-center gap-1">
                      <a
                        href={`${EXPLORER_URL}/account/${recipient}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {recipient.slice(0, 4)}...{recipient.slice(-4)}
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(recipient);
                          toast.success('Address copied to clipboard');
                        }}
                        className="hover:opacity-70 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{config.shares[index]}</TableCell>
                  <TableCell className="text-right">
                    {calculatePercentage(config.shares[index])}%
                  </TableCell>
                  <TableCell className="text-right">
                    {calculateDistributableAmount(config.shares[index])} PYUSD
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
