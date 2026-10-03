// The only file that touches the `psgc` npm package.
// It turns the package's data into two simple things the UI needs:
//   provinces:        string[]                      (sorted)
//   townsByProvince:  Record<province, string[]>    (sorted)
//
// The package is loaded with a dynamic import so it becomes its own chunk
// and does not slow down the first paint.

type Rec = Record<string, unknown>

export type Places = {
  provinces: string[]
  townsByProvince: Record<string, string[]>
}

// Field on a municipality record that holds its province's name.
// If your installed version uses a different field, add it here.
const PARENT_KEYS = ['province', 'provinceName', 'prov']

// PSGC lists NCR cities directly under the region, with no province.
const METRO_MANILA = 'Metro Manila'

const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const sort = (a: string, b: string) => a.localeCompare(b, 'en')

let cache: Promise<Places> | null = null

export function loadPlaces(): Promise<Places> {
  cache ??= import('psgc')
    .then((mod) => {
      const provinceRecs = mod.provinces.all() as Rec[]
      const townRecs = mod.municipalities.all() as Rec[]

      const provinces = new Set(provinceRecs.map((r) => clean(r.name)).filter(Boolean))
      const grouped: Record<string, Set<string>> = {}

      const parentKey = PARENT_KEYS.find((k) => townRecs.some((r) => clean(r[k])))
      if (!parentKey) {
        console.warn(
          '[psgc] Could not find the province field on municipalities. Fields seen:',
          Object.keys(townRecs[0] ?? {}),
          '- add the right one to PARENT_KEYS in src/lib/psgc.ts'
        )
      }

      for (const r of townRecs) {
        const town = clean(r.name)
        if (!town) continue
        const parent = (parentKey && clean(r[parentKey])) || METRO_MANILA
        ;(grouped[parent] ??= new Set()).add(town)
      }

      if (grouped[METRO_MANILA]) provinces.add(METRO_MANILA)

      const townsByProvince: Record<string, string[]> = {}
      for (const [prov, towns] of Object.entries(grouped)) townsByProvince[prov] = [...towns].sort(sort)

      return { provinces: [...provinces].sort(sort), townsByProvince }
    })
    .catch((e) => {
      cache = null // allow a retry
      throw e
    })
  return cache
}
