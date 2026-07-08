// Axios requests with responseType: 'blob' also return error bodies as a Blob,
// so err.response.data.message is always undefined even when the backend sent
// a proper JSON error (e.g. "Opening balance belum disetujui"). This reads the
// blob back out so real backend messages reach the user instead of a generic fallback.
export async function readBlobError(error, fallbackMessage = 'Terjadi kesalahan, silakan coba lagi.') {
  const data = error?.response?.data

  if (!(data instanceof Blob))
    return error?.response?.data?.message ?? fallbackMessage

  try {
    const parsed = JSON.parse(await data.text())
    return parsed?.message ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}
