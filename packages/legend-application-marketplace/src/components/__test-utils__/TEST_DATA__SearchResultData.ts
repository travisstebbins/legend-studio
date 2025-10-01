import type { DataProductSearchResult } from '@finos/legend-server-marketplace';

export const mockSearchResult: DataProductSearchResult = {
  dataProductName: 'SDLC Release Data Product',
  dataProductDescription:
    'Comprehensive customer analytics data for business intelligence and reporting',
  dataProductDetails: {
    group: 'com.example.analytics',
    artifact: 'customer-analytics',
    version: '1.2.0',
    path: 'test::SDLC_RELEASE_DATAPRODUCT',
  },
};
