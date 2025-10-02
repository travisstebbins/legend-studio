/**
 * Copyright (c) 2020-present, Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DEFAULT_TAB_SIZE } from '@finos/legend-application';
import { action, computed, flow, makeObservable, observable } from 'mobx';
import type { LegendMarketplaceBaseStore } from '../LegendMarketplaceBaseStore.js';
import {
  ActionState,
  assertErrorThrown,
  guaranteeNonNullable,
  type GeneratorFn,
  type PlainObject,
} from '@finos/legend-shared';
import {
  V1_IngestEnvironmentClassification,
  V1_PureGraphManager,
} from '@finos/legend-graph';
import { LegendMarketplaceUserDataHelper } from '../../__lib__/LegendMarketplaceUserDataHelper.js';
import {
  DataProductSearchResult,
  LakehouseDataProductSearchResultDetails,
  LakehouseSDLCDataProductSearchResultOrigin,
  LegacyDataProductSearchResultDetails,
  TMP__DataProductSearchResult,
  type MarketplaceServerClient,
} from '@finos/legend-server-marketplace';
import { ProductCardState } from './dataProducts/ProductCardState.js';
import { parseGAVCoordinates } from '@finos/legend-storage';

export enum DataProductFilterType {
  MODELED_DATA_PRODUCTS = 'MODELED_DATA_PRODUCTS',
  UNMODELED_DATA_PRODUCTS = 'UNMODELED_DATA_PRODUCTS',
  UNMODELED_DATA_PRODUCTS__DEPLOY_TYPE = 'UNMODELED_DATA_PRODUCTS.DEPLOY_TYPE',
  UNMODELED_DATA_PRODUCTS__ENVIRONMENT_CLASSIFICATION = 'UNMODELED_DATA_PRODUCTS.ENVIRONMENT_CLASSIFICATION',
}

export enum UnmodeledDataProductDeployType {
  SDLC = 'SDLC',
  SANDBOX = 'SANDBOX',
}

export interface DataProductFilterConfig {
  modeledDataProducts?: boolean;
  unmodeledDataProducts?: boolean;
  unmodeledDataProductsConfig?: {
    sdlcDeploy: boolean;
    sandboxDeploy: boolean;
    devEnvironmentClassification: boolean;
    prodParallelEnvironmentClassification: boolean;
    prodEnvironmentClassification: boolean;
  };
}

class DataProductFilterState {
  modeledDataProducts: boolean;
  unmodeledDataProducts: boolean;
  unmodeledDataProductsConfig: {
    sdlcDeploy: boolean;
    sandboxDeploy: boolean;
    devEnvironmentClassification: boolean;
    prodParallelEnvironmentClassification: boolean;
    prodEnvironmentClassification: boolean;
  };
  search?: string | undefined;

  constructor(
    defaultBooleanFilters: DataProductFilterConfig,
    search?: string | undefined,
  ) {
    makeObservable(this, {
      modeledDataProducts: observable,
      unmodeledDataProducts: observable,
      unmodeledDataProductsConfig: observable,
      search: observable,
    });
    this.modeledDataProducts =
      defaultBooleanFilters.modeledDataProducts ??
      DataProductFilterState.default().modeledDataProducts;
    this.unmodeledDataProducts =
      defaultBooleanFilters.unmodeledDataProducts ??
      DataProductFilterState.default().unmodeledDataProducts;
    this.unmodeledDataProductsConfig =
      defaultBooleanFilters.unmodeledDataProductsConfig ??
      DataProductFilterState.default().unmodeledDataProductsConfig;
    this.search = search;
  }

  static default(): DataProductFilterState {
    return new DataProductFilterState(
      {
        modeledDataProducts: false,
        unmodeledDataProducts: true,
        unmodeledDataProductsConfig: {
          sdlcDeploy: true,
          sandboxDeploy: false,
          devEnvironmentClassification: false,
          prodParallelEnvironmentClassification: false,
          prodEnvironmentClassification: true,
        },
      },
      undefined,
    );
  }

  get currentFilterValues(): DataProductFilterConfig {
    return {
      modeledDataProducts: this.modeledDataProducts,
      unmodeledDataProducts: this.unmodeledDataProducts,
      unmodeledDataProductsConfig: {
        sdlcDeploy: this.unmodeledDataProductsConfig.sdlcDeploy,
        sandboxDeploy: this.unmodeledDataProductsConfig.sandboxDeploy,
        devEnvironmentClassification:
          this.unmodeledDataProductsConfig.devEnvironmentClassification,
        prodParallelEnvironmentClassification:
          this.unmodeledDataProductsConfig
            .prodParallelEnvironmentClassification,
        prodEnvironmentClassification:
          this.unmodeledDataProductsConfig.prodEnvironmentClassification,
      },
    };
  }
}

export enum DataProductSort {
  NAME_ALPHABETICAL = 'Name A-Z',
  NAME_REVERSE_ALPHABETICAL = 'Name Z-A',
}

export class LegendMarketplaceSearchResultsStore {
  readonly marketplaceBaseStore: LegendMarketplaceBaseStore;
  readonly marketplaceServerClient: MarketplaceServerClient;
  readonly displayImageMap = new Map<string, string>();
  productCardStates: ProductCardState[] = [];
  filterState: DataProductFilterState;
  sort: DataProductSort = DataProductSort.NAME_ALPHABETICAL;

  executingSearchState = ActionState.create();

  constructor(marketplaceBaseStore: LegendMarketplaceBaseStore) {
    this.marketplaceBaseStore = marketplaceBaseStore;
    this.marketplaceServerClient = marketplaceBaseStore.marketplaceServerClient;

    const savedFilterConfig =
      LegendMarketplaceUserDataHelper.getSavedDataProductFilterConfig(
        this.marketplaceBaseStore.applicationStore.userDataService,
      );
    this.filterState = savedFilterConfig
      ? new DataProductFilterState(savedFilterConfig, undefined)
      : DataProductFilterState.default();

    makeObservable(this, {
      productCardStates: observable,
      filterState: observable,
      sort: observable,
      handleFilterChange: action,
      handleSearch: action,
      setProductCardStates: action,
      setSort: action,
      filterSortProducts: computed,
      executeSearch: flow,
    });
  }

  get filterSortProducts(): ProductCardState[] | undefined {
    return this.productCardStates.slice().sort((a, b) => {
      if (this.sort === DataProductSort.NAME_ALPHABETICAL) {
        return a.title.localeCompare(b.title);
      } else {
        return b.title.localeCompare(a.title);
      }
    });
  }

  setProductCardStates(dataProductCardStates: ProductCardState[]): void {
    this.productCardStates = dataProductCardStates;
  }

  handleFilterChange(
    filterType: DataProductFilterType,
    val:
      | UnmodeledDataProductDeployType
      | V1_IngestEnvironmentClassification
      | undefined,
  ): void {
    switch (filterType) {
      case DataProductFilterType.MODELED_DATA_PRODUCTS:
        this.filterState.modeledDataProducts =
          !this.filterState.modeledDataProducts;
        break;
      case DataProductFilterType.UNMODELED_DATA_PRODUCTS:
        this.filterState.unmodeledDataProducts =
          !this.filterState.unmodeledDataProducts;
        break;
      case DataProductFilterType.UNMODELED_DATA_PRODUCTS__DEPLOY_TYPE:
        switch (val) {
          case UnmodeledDataProductDeployType.SDLC:
            this.filterState.unmodeledDataProductsConfig.sdlcDeploy =
              !this.filterState.unmodeledDataProductsConfig.sdlcDeploy;
            break;
          case UnmodeledDataProductDeployType.SANDBOX:
            this.filterState.unmodeledDataProductsConfig.sandboxDeploy =
              !this.filterState.unmodeledDataProductsConfig.sandboxDeploy;
            break;
          default:
            break;
        }
        break;
      case DataProductFilterType.UNMODELED_DATA_PRODUCTS__ENVIRONMENT_CLASSIFICATION:
        switch (val) {
          case V1_IngestEnvironmentClassification.DEV:
            this.filterState.unmodeledDataProductsConfig.devEnvironmentClassification =
              !this.filterState.unmodeledDataProductsConfig
                .devEnvironmentClassification;
            break;
          case V1_IngestEnvironmentClassification.PROD_PARALLEL:
            this.filterState.unmodeledDataProductsConfig.prodParallelEnvironmentClassification =
              !this.filterState.unmodeledDataProductsConfig
                .prodParallelEnvironmentClassification;
            break;
          case V1_IngestEnvironmentClassification.PROD:
            this.filterState.unmodeledDataProductsConfig.prodEnvironmentClassification =
              !this.filterState.unmodeledDataProductsConfig
                .prodEnvironmentClassification;
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
    LegendMarketplaceUserDataHelper.saveDataProductFilterConfig(
      this.marketplaceBaseStore.applicationStore.userDataService,
      this.filterState.currentFilterValues,
    );
  }

  handleSearch(query: string | undefined) {
    this.filterState.search = query;
  }

  setSort(sort: DataProductSort): void {
    this.sort = sort;
  }

  *executeSearch(query: string, token: string | undefined): GeneratorFn<void> {
    try {
      this.executingSearchState.inProgress();
      const rawResults = (yield this.marketplaceServerClient.semanticSearch(
        query,
      )) as PlainObject<TMP__DataProductSearchResult>[];
      const results = rawResults.map((result) =>
        TMP__DataProductSearchResult.serialization.fromJson(result),
      );

      // tmp convert to new type
      const convertedResults = results.map((result) => {
        const newResult = new DataProductSearchResult();
        newResult.dataProductName = result.data_product_name;
        newResult.dataProductDescription = result.data_product_description;
        const legacyMatch = result.data_product_link.match(
          /taxonomy\/dataspace\/(?<gav>.+)\/(?<path>.+)/,
        );
        const lakehouseMatch = result.data_product_link.match(
          /lakehouse\/dataproduct\/deployed\/(?<dataProductId>.+)\/(?<deploymentId>.+)/,
        );
        if (legacyMatch !== null && legacyMatch.groups !== undefined) {
          const { gav, path } = legacyMatch.groups;
          const coordinates = parseGAVCoordinates(guaranteeNonNullable(gav));
          const details = new LegacyDataProductSearchResultDetails();
          details.groupId = coordinates.groupId;
          details.artifactId = coordinates.artifactId;
          details.versionId = coordinates.versionId;
          details.path = guaranteeNonNullable(path);
          newResult.dataProductDetails = details;
        } else if (
          lakehouseMatch !== null &&
          lakehouseMatch.groups !== undefined
        ) {
          const { dataProductId, deploymentId } = lakehouseMatch.groups;
          const lakehouseDetails =
            new LakehouseDataProductSearchResultDetails();
          lakehouseDetails.dataProductId = guaranteeNonNullable(dataProductId);
          lakehouseDetails.did = parseInt(guaranteeNonNullable(deploymentId));
          lakehouseDetails.producerEnvironmentName = '';
          lakehouseDetails.producerEnvironmentType = '';
          const origin = new LakehouseSDLCDataProductSearchResultOrigin();
          origin.groupId = '';
          origin.artifactId = '';
          origin.versionId = '';
          origin.path = '';
          lakehouseDetails.origin = origin;
          newResult.dataProductDetails = lakehouseDetails;
        } else {
          const details = new LegacyDataProductSearchResultDetails();
          details.groupId = '';
          details.artifactId = '';
          details.versionId = '';
          details.path = '';
          newResult.dataProductDetails = details;
        }
        return newResult;
      });

      // Crete graph manager for parsing ad-hoc deployed data products
      const graphManager = new V1_PureGraphManager(
        this.marketplaceBaseStore.applicationStore.pluginManager,
        this.marketplaceBaseStore.applicationStore.logService,
        this.marketplaceBaseStore.remoteEngine,
      );

      // Create data product card states
      const dataProductCardStates: ProductCardState[] = convertedResults.map(
        (result) =>
          new ProductCardState(
            this.marketplaceBaseStore,
            result,
            graphManager,
            this.displayImageMap,
          ),
      );
      this.setProductCardStates(dataProductCardStates);

      yield graphManager.initialize(
        {
          env: this.marketplaceBaseStore.applicationStore.config.env,
          tabSize: DEFAULT_TAB_SIZE,
          clientConfig: {
            baseUrl:
              this.marketplaceBaseStore.applicationStore.config.engineServerUrl,
          },
        },
        { engine: this.marketplaceBaseStore.remoteEngine },
      );

      this.productCardStates.forEach((dataProductCardState) =>
        dataProductCardState.init(token),
      );
    } catch (error) {
      assertErrorThrown(error);
      this.marketplaceBaseStore.applicationStore.notificationService.notifyError(
        `Error executing search: ${error.message}`,
      );
    } finally {
      this.executingSearchState.complete();
    }
  }
}
