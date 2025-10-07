import { Route, Router, useHashLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { WalletProvider } from '@/contexts/WalletProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CreateSplitter } from '@/components/CreateSplitter';
import { ViewSplitter } from '@/components/ViewSplitter';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <Router hook={useHashLocation}>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
              <Route path="/">
                <CreateSplitter />
              </Route>
              <Route path="/:address">
                {(params) => <ViewSplitter address={params.address} />}
              </Route>
            </main>
            <Footer />
            <Toaster />
          </div>
        </Router>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
