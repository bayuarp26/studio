import * as React from 'react';
import { cn } from '@/lib/utils';

interface SectionContainerProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  ariaLabelledBy?: string;
  applyFadeIn?: boolean;
}

const SectionContainer = React.forwardRef<HTMLElement, SectionContainerProps>(
  ({ id, children, className, ariaLabelledBy, applyFadeIn = false }, ref) => {
    return (
      <section
        id={id}
        ref={ref}
        className={cn(
          'py-16 px-4 sm:px-6 lg:px-8',
          applyFadeIn && 'fade-in',
          className
        )}
        aria-labelledby={ariaLabelledBy || `${id}-heading`}
      >
        <div className="container mx-auto max-w-screen-lg">
          {children}
        </div>
      </section>
    );
  }
);

SectionContainer.displayName = 'SectionContainer';
export default SectionContainer;
