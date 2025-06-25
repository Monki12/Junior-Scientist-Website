
import Image from 'next/image';
import { cn } from '@/lib/utils';

export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative", className)}>
      <Image 
        src="/logos/logo-black.png" 
        alt="Junior Scientist Logo" 
        fill
        sizes="100vw"
        style={{ objectFit: 'contain' }}
        className="block dark:hidden"
        priority
      />
      <Image 
        src="/logos/logo-white.png" 
        alt="Junior Scientist Logo" 
        fill
        sizes="100vw"
        style={{ objectFit: 'contain' }}
        className="hidden dark:block"
        priority
      />
    </div>
  );
};
