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

import { deserialize, serialize } from 'serializr';
import {
  INTERNAL__UnknownLakehouseBatchDetails,
  type LakehouseBatchDetails,
  LakehouseBatchDetailsType,
  LakehouseCreateIngestDefinitionBatchDetails,
  LakehouseDeleteIngestDefinitionBatchDetails,
  LakehouseIngestBatchDetails,
  LakehouseMatViewBatchDetails,
} from '../models/LakehouseIngestRequest.js';
import {
  UnsupportedOperationError,
  type PlainObject,
} from '@finos/legend-shared';

export const serializeLakehouseBatchDetails = (
  batchDetails: LakehouseBatchDetails,
): PlainObject<LakehouseBatchDetails> => {
  if (batchDetails instanceof LakehouseCreateIngestDefinitionBatchDetails) {
    return serialize(
      LakehouseCreateIngestDefinitionBatchDetails.serialization.schema,
      batchDetails,
    );
  } else if (
    batchDetails instanceof LakehouseDeleteIngestDefinitionBatchDetails
  ) {
    return serialize(
      LakehouseDeleteIngestDefinitionBatchDetails.serialization.schema,
      batchDetails,
    );
  } else if (batchDetails instanceof LakehouseIngestBatchDetails) {
    return serialize(
      LakehouseIngestBatchDetails.serialization.schema,
      batchDetails,
    );
  } else if (batchDetails instanceof LakehouseMatViewBatchDetails) {
    return serialize(
      LakehouseMatViewBatchDetails.serialization.schema,
      batchDetails,
    );
  }
  throw new UnsupportedOperationError(
    `Can't serialize batch details type`,
    batchDetails,
  );
};

export const deserializeLakehouseBatchDetails = (
  json: PlainObject<LakehouseBatchDetails>,
): LakehouseBatchDetails => {
  switch (json._type) {
    case LakehouseBatchDetailsType.CREATE_INGEST_DEFINITION:
      return deserialize(
        LakehouseCreateIngestDefinitionBatchDetails.serialization.schema,
        json,
      );
    case LakehouseBatchDetailsType.DELETE_INGEST_DEFINITION:
      return deserialize(
        LakehouseDeleteIngestDefinitionBatchDetails.serialization.schema,
        json,
      );
    case LakehouseBatchDetailsType.INGEST:
      return deserialize(
        LakehouseIngestBatchDetails.serialization.schema,
        json,
      );
    case LakehouseBatchDetailsType.MATVIEW:
      return deserialize(
        LakehouseMatViewBatchDetails.serialization.schema,
        json,
      );
    default: {
      const unknownBatchDetails = new INTERNAL__UnknownLakehouseBatchDetails();
      unknownBatchDetails.content = json;
      return unknownBatchDetails;
    }
  }
};
