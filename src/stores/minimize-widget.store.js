import { defineStore } from 'pinia'

export const useMinimizeWidgetStore = defineStore('minimize-widgets', {
  state: () => ({
    widgets: {},
  }),

  getters: {
    minimizedWidgets: (state) => Object.values(state.widgets).filter(w => w.minimized),
  },

  actions: {
    register(id, config) {
      this.widgets[id] = {
        id,
        title: config.title,
        type: config.type,
        routeName: config.routeName,
        minimized: config.minimized ?? false,
        pendingRestore: false,
        importing: false,
        progress: null,
        result: null,
        mode: config.mode ?? null,
        recordId: config.recordId ?? null,
        endpoint: config.endpoint ?? null,
      }
    },

    remove(id) {
      delete this.widgets[id]
    },

    setMinimized(id, val) {
      if (this.widgets[id]) {
        this.widgets[id].minimized = val
      }
    },

    setMinimizedFalse(id) {
      if (this.widgets[id]) {
        this.widgets[id].minimized = false
      }
    },

    markPendingRestore(id) {
      if (this.widgets[id]) {
        this.widgets[id].pendingRestore = true
      }
    },

    clearPendingRestore(id) {
      if (this.widgets[id]) {
        this.widgets[id].pendingRestore = false
      }
    },

    updateImportState(id, { importing, progress, result }) {
      if (this.widgets[id]) {
        this.widgets[id].importing = importing
        this.widgets[id].progress  = progress
        this.widgets[id].result    = result
      }
    },
  },
})
