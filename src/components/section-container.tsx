
import * as React from 'react';
import { cn } from '@/lib/utils';

interface SectionContainerProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  ariaLabelledBy?: string;
}

const SectionContainer = React.forwardRef<HTMLElement, SectionContainerProps>(
  ({ id, children, className, ariaLabelledBy }, ref) => {
    return (
      <section
        id={id}
        ref={ref}
        className={cn(
          'py-16 md:py-24 px-4 sm:px-6 lg:px-8 slide-up-fade-in', // Applied new animation class
          className
        )}
        aria-labelledby={ariaLabelledBy || `${id}-heading`}
        style={{ animationDelay: '0.2s', opacity: 0 }} // Initial state for animation
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
