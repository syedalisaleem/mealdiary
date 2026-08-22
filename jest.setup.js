jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-purchases', () => ({
  LOG_LEVEL: { WARN: 'WARN' },
  Purchases: {
    setLogLevel: jest.fn(),
    configure: jest.fn(async () => {}),
    getCustomerInfo: jest.fn(async () => null),
    getOfferings: jest.fn(async () => ({ current: null })),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  },
}));
