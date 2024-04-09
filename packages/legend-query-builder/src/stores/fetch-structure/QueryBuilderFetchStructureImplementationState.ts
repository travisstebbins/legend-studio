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
  Class,
  CompilationError,
  LambdaFunction,
  VariableExpression,
} from '@finos/legend-graph';
import type { Hashable } from '@finos/legend-shared';
import { action, computed, makeObservable, observable } from 'mobx';
import type { QueryBuilderExplorerTreePropertyNodeData } from '../explorer/QueryBuilderExplorerState.js';
import type { QueryBuilderState } from '../QueryBuilderState.js';
import type { LambdaFunctionBuilderOption } from '../QueryBuilderValueSpecificationBuilderHelper.js';
import type { QueryBuilderFetchStructureState } from './QueryBuilderFetchStructureState.js';
import type { ExportDataInfo } from '../QueryBuilderResultState.js';

export enum FETCH_STRUCTURE_IMPLEMENTATION {
  TABULAR_DATA_STRUCTURE = 'TABULAR_DATA_STRUCTURE',
  GRAPH_FETCH = 'GRAPH_FETCH',
}

export abstract class QueryBuilderFetchStructureImplementationState
  implements Hashable
{
  readonly queryBuilderState: QueryBuilderState;
  readonly fetchStructureState: QueryBuilderFetchStructureState;
  isInitialQuery = true;

  constructor(
    queryBuilderState: QueryBuilderState,
    fetchStructureState: QueryBuilderFetchStructureState,
  ) {
    makeObservable(this, {
      isInitialQuery: observable,
      usedExplorerTreePropertyNodeIDs: computed,
      fetchStructureValidationIssues: computed,
      allValidationIssues: computed,
      hashCode: computed,
      setIsInitialQuery: action,
    });

    this.queryBuilderState = queryBuilderState;
    this.fetchStructureState = fetchStructureState;
  }

  abstract get type(): string;
  abstract get usedExplorerTreePropertyNodeIDs(): string[];
  abstract get fetchStructureValidationIssues(): string[];
  abstract get allValidationIssues(): string[];

  abstract onClassChange(_class: Class | undefined): void;
  abstract revealCompilationError(compilationError: CompilationError): boolean;
  abstract clearCompilationError(): void;
  abstract fetchProperty(node: QueryBuilderExplorerTreePropertyNodeData): void;
  abstract fetchProperties(
    nodes: QueryBuilderExplorerTreePropertyNodeData[],
  ): void;
  abstract isVariableUsed(variable: VariableExpression): boolean;
  abstract checkBeforeChangingImplementation(onChange: () => void): void;
  abstract appendFetchStructure(
    lambdaFunction: LambdaFunction,
    options?: LambdaFunctionBuilderOption,
  ): void;
  abstract initialize(): void;
  abstract initializeWithQuery(): void;
  abstract get hashCode(): string;
  setIsInitialQuery = (val: boolean): void => {
    this.isInitialQuery = val;
  };

  get TEMPORARY__showPostFetchStructurePanel(): boolean {
    return this.queryBuilderState.filterState.showPanel;
  }

  // export options
  abstract get exportDataFormatOptions(): string[];
  abstract getExportDataInfo(format: string): ExportDataInfo;
}
