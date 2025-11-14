export function generateBlankVouchers(storeId: string, count: number) {
  return Array.from({ length: count }).map(() => ({
    store_id: storeId,
    code: 'MKD-' + crypto.randomUUID().split('-')[0].toUpperCase(),
    status: 'blank',
    initial_amount: 0,
    balance: 0,
  }))
}
