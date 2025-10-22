/**
 * Copyright (c) 2025-present, Goldman Sachs
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

import { V1_EntitlementsLakehouseEnvironmentType } from '@finos/legend-graph';
import type { ProductCardState } from './lakehouse/dataProducts/ProductCardState.js';
import {
  LakehouseDataProductSearchResultDetails,
  LegacyDataProductSearchResultDetails,
} from '@finos/legend-server-marketplace';

export enum LegendMarketplaceEnv {
  PRODUCTION = 'PRODUCTION',
  PRODUCTION_PARALLEL = 'PRODUCTION_PARALLEL',
}

export abstract class LegendMarketplaceEnvState {
  abstract key: LegendMarketplaceEnv;

  abstract supportsLegacyDataProducts(): boolean;
  filterDataProduct(
    productCardState: ProductCardState,
    includeLegacyDataProducts: boolean,
  ): boolean {
    if (
      productCardState.searchResult.dataProductDetails instanceof
      LegacyDataProductSearchResultDetails
    ) {
      if (this.supportsLegacyDataProducts() && includeLegacyDataProducts) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
}

export class ProdLegendMarketplaceEnvState extends LegendMarketplaceEnvState {
  key = LegendMarketplaceEnv.PRODUCTION;

  supportsLegacyDataProducts(): boolean {
    return true;
  }

  override filterDataProduct(
    productCardState: ProductCardState,
    includeLegacyDataProducts: boolean,
  ): boolean {
    const dataProductTypeFilter = super.filterDataProduct(
      productCardState,
      includeLegacyDataProducts,
    );
    const classification =
      productCardState.searchResult.dataProductDetails instanceof
      LakehouseDataProductSearchResultDetails
        ? productCardState.searchResult.dataProductDetails
            .producerEnvironmentType
        : undefined;
    const classificationFilter =
      classification === V1_EntitlementsLakehouseEnvironmentType.PRODUCTION;
    return dataProductTypeFilter && classificationFilter;
  }
}

export class ProdParallelLegendMarketplaceEnvState extends LegendMarketplaceEnvState {
  key = LegendMarketplaceEnv.PRODUCTION_PARALLEL;

  supportsLegacyDataProducts(): boolean {
    return false;
  }

  override filterDataProduct(
    productCardState: ProductCardState,
    includeLegacyDataProducts: boolean,
  ): boolean {
    const dataProductTypeFilter = super.filterDataProduct(
      productCardState,
      includeLegacyDataProducts,
    );
    const classification =
      productCardState.searchResult.dataProductDetails instanceof
      LakehouseDataProductSearchResultDetails
        ? productCardState.searchResult.dataProductDetails
            .producerEnvironmentType
        : undefined;
    const classificationFilter =
      classification ===
        V1_EntitlementsLakehouseEnvironmentType.PRODUCTION_PARALLEL ||
      classification === V1_EntitlementsLakehouseEnvironmentType.DEVELOPMENT ||
      classification === undefined;
    return dataProductTypeFilter && classificationFilter;
  }
}
