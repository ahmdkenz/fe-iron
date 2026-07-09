import { computed, toValue } from 'vue'

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Simulasi client-side dari InvoiceService::settleOriginalsFromOpeningBalance().
 * Mengurutkan invoiceSource (sudah terurut tanggal_invoice ASC, id ASC dari backend)
 * dan mengalokasikan dana secara waterfall hanya ke invoice yang dicentang, meniru
 * persis logika backend. Hasilnya adalah ESTIMASI untuk keperluan UI — backend tetap
 * otoritatif dan menghitung ulang alokasi final secara independen.
 */
export function useSettleWaterfall(invoicesSource, selectedIdsSource, availableSource, incomingSource, obSisaSource) {
  // Estimasi dana OB yang tersedia setelah transaksi baru ini tercatat:
  // dana yang sudah ada (belum teralokasi) + pembayaran baru (dibatasi oleh sisa OB itu sendiri,
  // meniru min(kredit, sisaEfektif) di BankStatementService::matchWithNewPayment).
  const predictedAvailable = computed(() => {
    const base     = Number(toValue(availableSource) || 0)
    const incoming = Math.min(Number(toValue(incomingSource) || 0), Number(toValue(obSisaSource) || 0))
    
    return Math.max(0, round2(base + incoming))
  })

  const rows = computed(() => {
    const selectedIds = new Set(toValue(selectedIdsSource))
    let pool = predictedAvailable.value

    return toValue(invoicesSource).map(inv => {
      const selected = selectedIds.has(inv.id)
      if (!selected) {
        return { ...inv, selected, predictedAmount: 0, predictedStatus: null }
      }

      const sisa = Number(inv.sisa_tagihan || 0)
      if (pool <= 0.01) {
        return { ...inv, selected, predictedAmount: 0, predictedStatus: 'UNPAID' }
      }

      const amount = round2(Math.min(sisa, pool))

      pool = round2(pool - amount)

      const status = amount + 0.01 >= sisa ? 'LUNAS' : 'SEBAGIAN'
      
      return { ...inv, selected, predictedAmount: amount, predictedStatus: status }
    })
  })

  const selectedTotal = computed(() =>
    rows.value.filter(r => r.selected).reduce((sum, r) => sum + Number(r.sisa_tagihan || 0), 0),
  )

  const predictedTotalAllocated = computed(() =>
    rows.value.reduce((sum, r) => sum + r.predictedAmount, 0),
  )

  const shortfall = computed(() => Math.max(0, round2(selectedTotal.value - predictedTotalAllocated.value)))
  const hasShortfall = computed(() => shortfall.value > 0.01)

  const summary = computed(() => {
    const selected = rows.value.filter(r => r.selected)
    
    return {
      fullCount: selected.filter(r => r.predictedStatus === 'LUNAS').length,
      partialCount: selected.filter(r => r.predictedStatus === 'SEBAGIAN').length,
      partialAmount: selected.find(r => r.predictedStatus === 'SEBAGIAN')?.predictedAmount ?? 0,
      unpaidCount: selected.filter(r => r.predictedStatus === 'UNPAID').length,
    }
  })

  return { predictedAvailable, rows, selectedTotal, predictedTotalAllocated, shortfall, hasShortfall, summary }
}
