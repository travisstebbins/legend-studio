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
import { DataCubeQueryFilterOperation } from './DataCubeQueryFilterOperation.js';
import type { DataCubeSnapshotFilterCondition } from '../DataCubeSnapshot.js';
import type { DataCubeColumn } from '../model/DataCubeColumn.js';
import {
  DataCubeColumnDataType,
  DataCubeFunction,
  DataCubeQueryFilterOperator,
  isPrimitiveType,
  ofDataType,
  _defaultPrimitiveTypeValue,
  type DataCubeOperationValue,
} from '../DataCubeQueryEngine.js';
import {
  _function,
  _functionName,
  _property,
  _value,
} from '../DataCubeQueryBuilderUtils.js';
import { type V1_AppliedFunction } from '@finos/legend-graph';
import { _filterCondition_base } from '../DataCubeSnapshotBuilderUtils.js';
import { isString } from '@finos/legend-shared';

export class DataCubeQueryFilterOperation__Contain extends DataCubeQueryFilterOperation {
  override get label() {
    return 'contains';
  }

  override get textLabel() {
    return 'contains';
  }

  override get description() {
    return 'contains';
  }

  override get operator() {
    return DataCubeQueryFilterOperator.CONTAIN;
  }

  isCompatibleWithColumn(column: DataCubeColumn) {
    return ofDataType(column.type, [DataCubeColumnDataType.TEXT]);
  }

  isCompatibleWithValue(value: DataCubeOperationValue) {
    return (
      value.value !== undefined &&
      isPrimitiveType(value.type) &&
      ofDataType(value.type, [DataCubeColumnDataType.TEXT]) &&
      !Array.isArray(value.value) &&
      isString(value.value)
    );
  }

  generateDefaultValue(column: DataCubeColumn) {
    return {
      type: column.type,
      value: _defaultPrimitiveTypeValue(column.type),
    };
  }

  buildConditionSnapshot(
    expression: V1_AppliedFunction,
    columnGetter: (name: string) => DataCubeColumn,
  ) {
    return this._finalizeConditionSnapshot(
      _filterCondition_base(
        expression,
        DataCubeFunction.CONTAINS,
        columnGetter,
      ),
    );
  }

  buildConditionExpression(condition: DataCubeSnapshotFilterCondition) {
    return _function(_functionName(DataCubeFunction.CONTAINS), [
      _property(condition.name),
      _value(condition.value),
    ]);
  }
}
