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

import type { GenericLegendApplicationStore } from '@finos/legend-application';
import { flow, makeObservable, observable } from 'mobx';
import {
  ActionState,
  assertErrorThrown,
  type GeneratorFn,
} from '@finos/legend-shared';
import type { DataProductProducerViewerState } from './DataProductProducerViewerState.js';
import {
  LakehouseIngestRequest,
  LakehouseIngestRequestStatus,
} from '@finos/legend-server-lakehouse';

export class DataProductIngestDefinitionState {
  readonly producerViewerState: DataProductProducerViewerState;
  readonly applicationStore: GenericLegendApplicationStore;
  readonly ingestDefinitionUrn: string;
  ingestDefinitionGrammar: string | undefined;
  ingestRequests: LakehouseIngestRequest[] = [];
  ingestRequestStatuses: Map<string, LakehouseIngestRequestStatus> = new Map();

  readonly initState = ActionState.create();

  constructor(
    producerViewerState: DataProductProducerViewerState,
    ingestDefinitionUrn: string,
  ) {
    makeObservable(this, {
      ingestDefinitionGrammar: observable,
      ingestRequests: observable,
      ingestRequestStatuses: observable,
      init: flow,
    });

    this.producerViewerState = producerViewerState;
    this.applicationStore = producerViewerState.applicationStore;
    this.ingestDefinitionUrn = ingestDefinitionUrn;
  }

  async fetchIngestDefinitionGrammar(token: string | undefined): Promise<void> {
    this.ingestDefinitionGrammar =
      await this.producerViewerState.ingestServerClient.getIngestDefinitionGrammar(
        this.ingestDefinitionUrn,
        this.producerViewerState.nonNullIngestServerUrl,
        token,
      );
  }

  async fetchIngestRequests(token: string | undefined): Promise<void> {
    const rawIngestDefinitionRequests =
      await this.producerViewerState.ingestServerClient.getIngestRequests(
        this.ingestDefinitionUrn,
        this.producerViewerState.nonNullIngestServerUrl,
        token,
      );
    this.ingestRequests = rawIngestDefinitionRequests
      .slice(0, 10)
      .map((request) => LakehouseIngestRequest.serialization.fromJson(request));
  }

  async fetchIngestRequestStatus(
    request: LakehouseIngestRequest,
    token: string | undefined,
  ): Promise<void> {
    const rawStatus =
      await this.producerViewerState.ingestServerClient.getIngestRequestStatus(
        this.ingestDefinitionUrn,
        request.ingestRequestReference.ingestRequestId,
        this.producerViewerState.nonNullIngestServerUrl,
        token,
      );
    const status =
      LakehouseIngestRequestStatus.serialization.fromJson(rawStatus);
    this.ingestRequestStatuses.set(
      request.ingestRequestReference.ingestRequestId,
      status,
    );
  }

  *init(token: string | undefined): GeneratorFn<void> {
    this.initState.inProgress();
    try {
      yield Promise.all([
        this.fetchIngestDefinitionGrammar(token),
        (async () => {
          await this.fetchIngestRequests(token);
          await Promise.all(
            this.ingestRequests.map(async (request) =>
              this.fetchIngestRequestStatus(request, token),
            ),
          );
        })(),
      ]);
    } catch (error) {
      assertErrorThrown(error);
      this.applicationStore.notificationService.notifyError(error.message);
    } finally {
      this.initState.complete();
    }
  }
}
