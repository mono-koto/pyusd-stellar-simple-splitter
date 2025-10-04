export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Made by{' '}
            <a
              href="https://mono-koto.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Mono Koto
            </a>
          </p>
          <a
            href="https://github.com/mono-koto/pyusd-stellar-simple-splitter/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
