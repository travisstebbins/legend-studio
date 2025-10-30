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

import type {
  GenericLegendApplicationStore,
  NavigationZone,
} from '@finos/legend-application';
import {
  type V1_DataProduct,
  type V1_EntitlementsDataProductDetails,
  V1_AppDirLevel,
} from '@finos/legend-graph';
import { computed, flow, makeObservable, observable } from 'mobx';
import { BaseViewerState } from '../../BaseViewerState.js';
import { DataProductLayoutState } from '../../BaseLayoutState.js';
import { DATA_PRODUCT_VIEWER_SECTION } from '../../ProductViewerNavigation.js';
import {
  ActionState,
  assertErrorThrown,
  guaranteeNonNullable,
  type GeneratorFn,
} from '@finos/legend-shared';
import {
  IngestDeploymentServerConfig,
  type LakehouseIngestServerClient,
  type LakehousePlatformServerClient,
} from '@finos/legend-server-lakehouse';
import { DataProductIngestDefinitionState } from './DataProductIngestDefinitionState.js';

export class DataProductProducerViewerState extends BaseViewerState<
  V1_DataProduct,
  DataProductLayoutState
> {
  readonly entitlementsDataProductDetails: V1_EntitlementsDataProductDetails;
  readonly platformServerClient: LakehousePlatformServerClient;
  readonly ingestServerClient: LakehouseIngestServerClient;
  ingestServerConfig: IngestDeploymentServerConfig | undefined;
  ingestDefinitions: DataProductIngestDefinitionState[] = [];

  // actions
  readonly viewDataProductSource?: (() => void) | undefined;

  readonly initState = ActionState.create();

  constructor(
    product: V1_DataProduct,
    entitlementsDataProductDetails: V1_EntitlementsDataProductDetails,
    applicationStore: GenericLegendApplicationStore,
    platformServerClient: LakehousePlatformServerClient,
    ingestServerClient: LakehouseIngestServerClient,
    actions: {
      viewDataProductSource?: (() => void) | undefined;
      onZoneChange?: ((zone: NavigationZone | undefined) => void) | undefined;
    },
  ) {
    super(product, applicationStore, new DataProductLayoutState(), actions);

    makeObservable(this, {
      ingestServerConfig: observable,
      nonNullIngestServerUrl: computed,
      init: flow,
    });

    this.entitlementsDataProductDetails = entitlementsDataProductDetails;
    this.platformServerClient = platformServerClient;
    this.ingestServerClient = ingestServerClient;

    // actions
    this.viewDataProductSource = actions.viewDataProductSource;
  }

  get nonNullIngestServerUrl(): string {
    return guaranteeNonNullable(
      this.ingestServerConfig?.ingestServerUrl,
      'Ingest server URL is not available',
    );
  }

  protected getValidSections(): string[] {
    return Object.values(DATA_PRODUCT_VIEWER_SECTION).map((section) =>
      section.toString(),
    );
  }

  async fetchIngestServerConfig(token: string | undefined): Promise<void> {
    const rawIngestServerConfig =
      await this.platformServerClient.findProducerServer(
        this.entitlementsDataProductDetails.deploymentId,
        V1_AppDirLevel.DEPLOYMENT,
        token,
      );
    const ingestServerConfig =
      IngestDeploymentServerConfig.serialization.fromJson(
        rawIngestServerConfig,
      );
    this.ingestServerConfig = ingestServerConfig;
  }

  async fetchIngestDefinitions(token: string | undefined): Promise<void> {
    const ingestDefinitionUrns =
      await this.ingestServerClient.getIngestDefinitions(
        guaranteeNonNullable(
          this.entitlementsDataProductDetails.lakehouseEnvironment
            ?.producerEnvironmentName,
          'Unable to fetch ingest definition URNs. Producer environment name is missing.',
        ),
        this.nonNullIngestServerUrl,
        token,
      );
    this.ingestDefinitions = ingestDefinitionUrns.map(
      (urn) => new DataProductIngestDefinitionState(this, urn),
    );
  }

  *init(token: string | undefined): GeneratorFn<void> {
    this.initState.inProgress();
    try {
      yield this.fetchIngestServerConfig(token);
      yield this.fetchIngestDefinitions(token);
      this.ingestDefinitions.map((definition) => definition.init(token));
    } catch (error) {
      assertErrorThrown(error);
      this.applicationStore.notificationService.notifyError(error.message);
    } finally {
      this.initState.complete();
    }
  }
}
