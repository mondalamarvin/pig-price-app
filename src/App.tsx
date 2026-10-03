import { useMemo, useState } from 'react';
import { usePrices } from './hooks/usePrices';
import { usePlaces } from './hooks/usePlaces';
import { Filters, type FilterState } from './components/Filters';
import { Summary } from './components/Summary';
import { PriceCard } from './components/PriceCard';
import { AddPriceDialog } from './components/AddPriceDialog';
import { Button } from './components/ui/button';
import type { NewPrice, Price } from './types';

const sorters: Record<FilterState['sort'], (a: Price, b: Price) => number> = {
  recent: (a, b) => +new Date(b.updated_at) - +new Date(a.updated_at),
  votes: (a, b) => b.up - b.down - (a.up - a.down),
  liveHigh: (a, b) => b.live_price - a.live_price,
  liveLow: (a, b) => a.live_price - b.live_price,
};

export default function App() {
  const { prices, myVotes, loading, error, addPrice, vote } = usePrices();
  const { places, placesError } = usePlaces();
  const [filters, setFilters] = useState<FilterState>({
    province: '',
    town: '',
    sort: 'recent',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState('');

  const rows = useMemo(
    () =>
      prices
        .filter(
          (p) =>
            (!filters.province || p.province === filters.province) &&
            (!filters.town || p.town === filters.town),
        )
        .sort(sorters[filters.sort]),
    [prices, filters],
  );

  const areaName = filters.town
    ? `${filters.town}, ${filters.province || prices.find((p) => p.town === filters.town)?.province}`
    : filters.province || 'all provinces';

  async function handleAdd(input: NewPrice) {
    await addPrice(input);
    setToast('Price posted');
    setTimeout(() => setToast(''), 2200);
  }

  return (
    <>
      <header className='border-b border-border bg-card'>
        <div className='mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3'>
          <div className='flex items-center gap-2.5'>
            <span
              className='grid h-9 w-9 place-items-center rounded-lg bg-primary text-lg text-primary-foreground'
              aria-hidden
            >
              🐖
            </span>
            <div className='leading-tight'>
              <p className='text-base font-semibold'>Pig Price App</p>
              <p className='text-xs text-muted-foreground'>
                Pig prices, reported by your neighbors
              </p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)}>Add price</Button>
        </div>
      </header>

      <main className='mx-auto max-w-5xl space-y-6 px-4 py-6'>
        <Summary rows={rows} areaName={areaName} />
        <Filters
          value={filters}
          provinces={places?.provinces ?? []}
          towns={places?.townsByProvince[filters.province] ?? []}
          onChange={setFilters}
        />

        <section aria-label='Reported prices'>
          <div className='mb-3 flex items-baseline justify-between'>
            <h2 className='text-lg font-semibold'>Reported prices</h2>
            <p className='text-sm text-muted-foreground'>{rows.length} shown</p>
          </div>

          {(error || placesError) && (
            <p
              className='mb-3 rounded-md border border-primary/30 bg-accent p-3 text-sm text-accent-foreground'
              role='alert'
            >
              Something went wrong: {error || placesError}
            </p>
          )}

          {loading ? (
            <p className='py-10 text-center text-sm text-muted-foreground'>
              Loading prices…
            </p>
          ) : rows.length === 0 ? (
            <div className='rounded-lg border border-dashed border-border p-10 text-center'>
              <p className='font-medium'>No prices reported here yet</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Be the first to share what pigs are selling for in this area.
              </p>
              <Button className='mt-4' onClick={() => setDialogOpen(true)}>
                Add price
              </Button>
            </div>
          ) : (
            <ul className='space-y-3'>
              {rows.map((p) => (
                <PriceCard
                  key={p.id}
                  price={p}
                  myVote={myVotes[p.id]}
                  onVote={vote}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <AddPriceDialog
        open={dialogOpen}
        places={places}
        defaultProvince={filters.province}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAdd}
      />

      <div
        role='status'
        className={`pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-border bg-card px-4 py-2 text-sm shadow-lg transition ${
          toast ? 'opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {toast}
      </div>
    </>
  );
}
