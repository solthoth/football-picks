import { buildPools } from './buildPools'

const rawFiles = import.meta.glob('/data/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const pools = buildPools(rawFiles)
