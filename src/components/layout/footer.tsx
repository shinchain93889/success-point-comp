import { Copyright } from 'lucide-react';
import Logo from '@/components/icons/logo';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-card border-t text-card-foreground">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/">
              <Logo className="h-8 w-auto" />
            </Link>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Copyright className="h-4 w-4 mr-1" />
            <span>{new Date().getFullYear()} Success Point Computer. All Rights Reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
