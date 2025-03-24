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

import {
  type PlainObject,
  assertErrorThrown,
  guaranteeNonNullable,
  guaranteeType,
  IllegalStateError,
  LogEvent,
} from '@finos/legend-shared';
import {
  QuerySearchSpecification,
  type V1_EngineServerClient,
  type V1_PureGraphManager,
  V1_Query,
  type LightQuery,
  V1_Lambda,
  V1_Variable,
  V1_ValueSpecification,
  V1_PackageableType,
  observe_V1ValueSpecification,
  V1_deserializeRawValueSpecificationType,
  V1_serializeValueSpecification,
  V1_deserializePackageableElement,
  Enumeration,
  V1_AppliedProperty,
  V1_PackageableElementPtr,
  V1_Enumeration,
} from '@finos/legend-graph';
import {
  buildV1PrimitiveValueSpecification,
  QUERY_LOADER_TYPEAHEAD_SEARCH_LIMIT,
  QueryLoaderState,
} from '@finos/legend-query-builder';
import { action, makeObservable, observable, runInAction } from 'mobx';
import {
  LegendDataCubeSourceBuilderState,
  LegendDataCubeSourceBuilderType,
} from './LegendDataCubeSourceBuilderState.js';
import { RawLegendQueryDataCubeSource } from '../../model/LegendQueryDataCubeSource.js';
import { APPLICATION_EVENT } from '@finos/legend-application';
import type { LegendDataCubeDataCubeEngine } from '../../LegendDataCubeDataCubeEngine.js';
import type { LegendDataCubeApplicationStore } from '../../LegendDataCubeBaseStore.js';
import {
  _defaultPrimitiveTypeValue,
  type DataCubeAlertService,
  type DataCubeConfiguration,
} from '@finos/legend-data-cube';
import type { DepotServerClient } from '@finos/legend-server-depot';

export class LegendQueryDataCubeSourceBuilderState extends LegendDataCubeSourceBuilderState {
  private readonly _engineServerClient: V1_EngineServerClient;
  private readonly _depotServerClient: DepotServerClient;
  private readonly _graphManager: V1_PureGraphManager;

  readonly queryLoader: QueryLoaderState;

  query?: LightQuery | undefined;
  queryCode?: string | undefined;
  queryParameters?: V1_Variable[] | undefined;
  queryParameterValues?:
    | {
        [paramName: string]: V1_ValueSpecification;
      }
    | undefined;
  queryEnumerations?: { [paramName: string]: V1_Enumeration };

  constructor(
    application: LegendDataCubeApplicationStore,
    engine: LegendDataCubeDataCubeEngine,
    engineServerClient: V1_EngineServerClient,
    depotServerClient: DepotServerClient,
    graphManager: V1_PureGraphManager,
    alertService: DataCubeAlertService,
  ) {
    super(application, engine, alertService);

    makeObservable(this, {
      query: observable,
      unsetQuery: action,

      queryCode: observable,
      queryParameters: observable,
      queryParameterValues: observable,
      queryEnumerations: observable,

      setQueryParameterValue: action,
    });

    this._graphManager = graphManager;
    this._engineServerClient = engineServerClient;
    this._depotServerClient = depotServerClient;

    this.queryLoader = new QueryLoaderState(
      this._application,
      this._graphManager,
      {
        loadQuery: (query) => {
          this.setQuery(query).catch((error) =>
            this._alertService.alertUnhandledError(error),
          );
        },
        decorateSearchSpecification: (val) => val,
        fetchDefaultQueries: async () => {
          const searchSpecification = new QuerySearchSpecification();
          searchSpecification.limit = QUERY_LOADER_TYPEAHEAD_SEARCH_LIMIT;
          return this._graphManager.searchQueries(
            QuerySearchSpecification.createDefault(undefined),
          );
        },
        isReadOnly: true,
      },
    );
  }

  async setQuery(lightQuery: LightQuery) {
    try {
      const processedQuery = V1_Query.serialization.fromJson(
        await this._engineServerClient.getQuery(lightQuery.id),
      );
      const queryLambda = guaranteeType(
        await this._engine.parseValueSpecification(processedQuery.content),
        V1_Lambda,
        'Expected query content to be a V1_Lambda',
      );
      const queryCode = await this._engine.getValueSpecificationCode(
        queryLambda,
        true,
      );
      const queryParameters = queryLambda.parameters;
      const queryInfo = await this._graphManager.getQueryInfo(
        processedQuery.id,
      );

      const queryParameterValues: {
        [paramName: string]: V1_ValueSpecification;
      } = {};
      for (const param of queryParameters) {
        const type = guaranteeType(
          param?.genericType?.rawType,
          V1_PackageableType,
        );
        const defaultValue = queryInfo.defaultParameterValues?.find(
          (defaultParam) => defaultParam.name === param.name,
        );
        const defaultValueSpec =
          defaultValue?.content !== undefined
            ? await this._engine.parseValueSpecification(defaultValue.content)
            : buildV1PrimitiveValueSpecification(
                V1_deserializeRawValueSpecificationType(type.fullPath),
                _defaultPrimitiveTypeValue(type.fullPath),
              );
        queryParameterValues[param.name] =
          observe_V1ValueSpecification(defaultValueSpec);
      }
      const enumerationParameters = Object.entries(queryParameterValues).filter(
        ([_, param]) => param instanceof V1_AppliedProperty,
      ) as [string, V1_AppliedProperty][];
      this.populateEnumerations(enumerationParameters, lightQuery);
      runInAction(() => {
        this.query = lightQuery;
        this.queryCode = queryCode;
        this.queryParameters = queryParameters;
        this.queryParameterValues = queryParameterValues;
      });
    } catch (error) {
      assertErrorThrown(error);
      this._application.logService.error(
        LogEvent.create(APPLICATION_EVENT.GENERIC_FAILURE),
        `Can't get code for query with ID '${lightQuery.id}'`,
      );
      runInAction(() => {
        this.query = lightQuery;
        this.queryCode = undefined;
      });
    }
  }

  unsetQuery(): void {
    this.query = undefined;
    this.queryCode = undefined;
  }

  setQueryParameterValue(name: string, value: V1_ValueSpecification) {
    if (this.queryParameterValues) {
      this.queryParameterValues[name] = value;
    }
  }

  override get label() {
    return LegendDataCubeSourceBuilderType.LEGEND_QUERY;
  }

  override get isValid(): boolean {
    return Boolean(this.query);
  }

  override async generateSourceData() {
    if (!this.query) {
      throw new IllegalStateError(
        `Can't generate source data: query is not set`,
      );
    }
    const source = new RawLegendQueryDataCubeSource();
    source.queryId = this.query.id;
    source.parameterValues = this.queryParameterValues
      ? Object.entries(this.queryParameterValues).map(([name, value]) => [
          JSON.stringify(
            V1_serializeValueSpecification(
              guaranteeNonNullable(
                this.queryParameters?.find((param) => param.name === name),
              ),
              this._application.pluginManager.getPureProtocolProcessorPlugins(),
            ),
          ),
          JSON.stringify(
            V1_serializeValueSpecification(
              value,
              this._application.pluginManager.getPureProtocolProcessorPlugins(),
            ),
          ),
        ])
      : [];
    return RawLegendQueryDataCubeSource.serialization.toJson(source);
  }

  override finalizeConfiguration(configuration: DataCubeConfiguration) {
    if (this.query) {
      configuration.name = this.query.name;
    }
  }

  private async populateEnumerations(
    queryParameters: [string, V1_AppliedProperty][],
    query: LightQuery,
  ): Promise<void> {
    const queryEnumerations: { [paramName: string]: V1_Enumeration } = {};
    for (const [name, param] of queryParameters) {
      const enumerationValue = await this.getEnumerationValues(
        guaranteeNonNullable(
          guaranteeType(param.parameters?.[0], V1_PackageableElementPtr)
            ?.fullPath,
        ),
        query,
      );
      queryEnumerations[name] = enumerationValue;
    }
    runInAction(() => {
      this.queryEnumerations = queryEnumerations;
    });
  }

  private async getEnumerationValues(
    enumerationPath: string,
    query: LightQuery,
  ): Promise<V1_Enumeration> {
    const enumerationElement = (
      await this._depotServerClient.getVersionEntity(
        query.groupId,
        query.artifactId,
        query.versionId,
        enumerationPath,
      )
    ).content as PlainObject<Enumeration>;
    const enumeration = guaranteeType(
      V1_deserializePackageableElement(
        enumerationElement,
        this._application.pluginManager.getPureProtocolProcessorPlugins(),
      ),
      V1_Enumeration,
    );
    return enumeration;
  }
}
