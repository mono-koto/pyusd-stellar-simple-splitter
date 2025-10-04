import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/wallet-context';
import { createSplitter } from '@/lib/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RecipientShare {
  address: string;
  share: string;
}

export function CreateSplitter() {
  const { kit, address, isConnected } = useWallet();
  const [, setLocation] = useLocation();
  const [recipients, setRecipients] = useState<RecipientShare[]>([
    { address: '', share: '' },
    { address: '', share: '' },
  ]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!kit || !address) throw new Error('Wallet not connected');

      const recipientAddresses = recipients.map((r) => r.address);
      const shares = recipients.map((r) => parseInt(r.share));

      // Validate
      if (recipientAddresses.some((addr) => !addr)) {
        throw new Error('All recipient addresses are required');
      }
      if (shares.some((s) => isNaN(s) || s <= 0)) {
        throw new Error('All shares must be positive numbers');
      }

      return createSplitter(kit, address, recipientAddresses, shares);
    },
    onSuccess: (splitterAddress) => {
      toast.success('Splitter created successfully!');
      setLocation(`/${splitterAddress}`);
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to create splitter';

      // Check for "already exists" error
      if (message.includes('ExistingValue') || message.includes('already exists')) {
        toast.error('A splitter with this exact configuration already exists. Try different recipients or shares.');
      } else {
        toast.error(message);
      }
    },
  });

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', share: '' }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: 'address' | 'share', value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Splitter</CardTitle>
        <CardDescription>
          Split PYUSD payments among multiple recipients based on share ratios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor={`address-${index}`}>Recipient Address</Label>
                  <Input
                    id={`address-${index}`}
                    placeholder="GXXXXXXX..."
                    value={recipient.address}
                    onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                    required
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor={`share-${index}`}>Share</Label>
                  <Input
                    id={`share-${index}`}
                    type="number"
                    placeholder="1"
                    value={recipient.share}
                    onChange={(e) => updateRecipient(index, 'share', e.target.value)}
                    required
                    min="1"
                  />
                </div>
                {recipients.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRecipient(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addRecipient} className="w-full">
            Add Recipient
          </Button>

          <Button
            type="submit"
            className="w-full"
            disabled={!isConnected || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Splitter'}
          </Button>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">
              Please connect your wallet to create a splitter
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
