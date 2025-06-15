module.exports = {
  app: {
    getVersion: () => '1.0.0',
    getName: () => 'Sticky Notes',
    getPath: name => `/mock/path/${name}`,
    quit: jest.fn(),
    on: jest.fn(),
    whenReady: jest.fn().mockResolvedValue(),
    dock: {
      hide: jest.fn(),
      show: jest.fn(),
    },
  },

  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    loadURL: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
    minimize: jest.fn(),
    setAlwaysOnTop: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
    },
  })),

  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn(),
  },

  Tray: jest.fn().mockImplementation(() => ({
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  })),

  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },

  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    send: jest.fn(),
  },

  nativeImage: {
    createFromPath: jest.fn().mockReturnValue({
      resize: jest.fn().mockReturnThis(),
    }),
  },

  nativeTheme: {
    shouldUseDarkColors: false,
    on: jest.fn(),
  },

  shell: {
    openExternal: jest.fn(),
  },
};
