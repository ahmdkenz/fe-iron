import Swal from 'sweetalert2'
import { useTheme } from 'vuetify'

function normalizeOptions(defaults, options = {}) {
  if (typeof options === 'string')
    return { ...defaults, text: options }

  return { ...defaults, ...options }
}

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ')
}

function wrapHook(options, hookName, callback) {
  const userHook = options[hookName]

  return {
    ...options,
    [hookName]: (...args) => {
      callback(...args)
      userHook?.(...args)
    },
  }
}

export function useSweetAlert() {
  const theme = useTheme()

  function resolveThemeTokens() {
    const currentTheme = theme?.global?.current?.value
    const colors = currentTheme?.colors ?? {}
    const isDark = currentTheme?.dark ?? theme?.global?.name?.value === 'dark'

    return {
      isDark,
      primary: colors.primary ?? '#666CFF',
      secondary: colors.secondary ?? '#6D788D',
      surface: colors.surface ?? (isDark ? '#30334E' : '#FFFFFF'),
      onSurface: colors['on-surface'] ?? (isDark ? '#EAEAFF' : '#262B43'),
      backdrop: isDark ? 'rgba(16, 17, 33, 0.78)' : 'rgba(38, 43, 67, 0.5)',
    }
  }

  function showAlert(options = {}) {
    const themeTokens = resolveThemeTokens()
    const customClass = options.customClass ?? {}

    return Swal.fire({
      heightAuto: false,
      ...options,
      background: options.background ?? themeTokens.surface,
      color: options.color ?? themeTokens.onSurface,
      backdrop: options.backdrop ?? themeTokens.backdrop,
      confirmButtonColor: options.confirmButtonColor ?? themeTokens.primary,
      cancelButtonColor: options.cancelButtonColor ?? themeTokens.secondary,
      customClass: {
        ...customClass,
        container: joinClasses('iron-swal-container', customClass.container),
        popup: joinClasses(
          'iron-swal-popup',
          themeTokens.isDark ? 'iron-swal-dark' : 'iron-swal-light',
          customClass.popup,
        ),
        title: joinClasses('iron-swal-title', customClass.title),
        htmlContainer: joinClasses('iron-swal-html', customClass.htmlContainer),
        actions: joinClasses('iron-swal-actions', customClass.actions),
        confirmButton: joinClasses('iron-swal-confirm', customClass.confirmButton),
        cancelButton: joinClasses('iron-swal-cancel', customClass.cancelButton),
        icon: joinClasses('iron-swal-icon', customClass.icon),
        loader: joinClasses('iron-swal-loader', customClass.loader),
      },
    })
  }

  function showSuccess(options = {}) {
    return showAlert(normalizeOptions({
      icon: 'success',
      title: 'Berhasil',
      confirmButtonText: 'OK',
      showConfirmButton: true,
    }, options))
  }

  function showError(options = {}) {
    return showAlert(normalizeOptions({
      icon: 'error',
      title: 'Terjadi Kesalahan',
      confirmButtonText: 'Tutup',
    }, options))
  }

  function showLoading(options = {}) {
    const customClass = options.customClass ?? {}
    let alertOptions = normalizeOptions({
      title: 'Memproses Data',
      text: 'Mohon tunggu sebentar...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
    }, options)

    alertOptions = wrapHook(alertOptions, 'didOpen', () => {
      Swal.showLoading()
    })

    alertOptions.customClass = {
      ...customClass,
      popup: joinClasses('iron-swal-loading-popup', customClass.popup),
    }

    return showAlert(alertOptions)
  }

  function closeAlert(options = {}) {
    const { onlyLoading = false } = options
    const popup = Swal.getPopup()
    if (!popup)
      return

    if (onlyLoading && !popup.classList.contains('iron-swal-loading-popup'))
      return

    Swal.close()
  }

  function confirmDelete(options = {}) {
    return showAlert(normalizeOptions({
      icon: 'warning',
      title: 'Hapus Data?',
      text: 'Data yang dihapus tidak dapat dikembalikan.',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      focusCancel: true,
      reverseButtons: true,
      showCancelButton: true,
    }, options))
  }

  return {
    showAlert,
    showSuccess,
    showError,
    showLoading,
    closeAlert,
    confirmDelete,
  }
}
