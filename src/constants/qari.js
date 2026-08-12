// Daftar 6 qari yang disediakan API equran.id (audio per-surah & per-ayat).
// Statis karena datanya tetap — tidak ada endpoint backend terpisah untuk ini.
export const QARI_LIST = [
  { kode: '01', nama: 'Abdullah Al-Juhany' },
  { kode: '02', nama: 'Abdul Muhsin Al-Qasim' },
  { kode: '03', nama: 'Abdurrahman As-Sudais' },
  { kode: '04', nama: 'Ibrahim Al-Dossari' },
  { kode: '05', nama: 'Misyari Rasyid Al-Afasi' },
  { kode: '06', nama: 'Yasser Al-Dosari' },
]

export const DEFAULT_QARI_KODE = '05'

export function namaQari(kode) {
  return QARI_LIST.find(q => q.kode === kode)?.nama ?? kode
}
