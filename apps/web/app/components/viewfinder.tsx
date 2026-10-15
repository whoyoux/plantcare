import { cn } from '~/lib/utils';

/** Camera viewfinder corners, the app icon's motif. Fills its positioned parent. */
export function Viewfinder({ className }: { className?: string }) {
  const corner = 'absolute size-7 border-primary';
  return (
    <span aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      <span className={cn(corner, 'left-0 top-0 rounded-tl-xl border-l-[3px] border-t-[3px]')} />
      <span className={cn(corner, 'right-0 top-0 rounded-tr-xl border-r-[3px] border-t-[3px]')} />
      <span className={cn(corner, 'bottom-0 left-0 rounded-bl-xl border-b-[3px] border-l-[3px]')} />
      <span className={cn(corner, 'bottom-0 right-0 rounded-br-xl border-b-[3px] border-r-[3px]')} />
    </span>
  );
}
