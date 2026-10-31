import { consumptionRule, consumableThreshold } from '@/lib/db/schema'

test('consumptionRule table has correct columns', () => {
  const cols = Object.keys(consumptionRule)
  expect(cols).toEqual(expect.arrayContaining([
    'id', 'locationId', 'serviceType', 'machineType', 'hasImportedFabcon',
    'detergentMl', 'regularFabconMl', 'importedFabconMl', 'plasticsCount', 'gasKg',
    'createdAt', 'updatedAt'
  ]))
})

test('consumableThreshold table has correct columns', () => {
  const cols = Object.keys(consumableThreshold)
  expect(cols).toEqual(expect.arrayContaining([
    'id', 'locationId', 'consumableType', 'minimumQty', 'unit',
    'createdAt', 'updatedAt'
  ]))
})