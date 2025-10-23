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
  SerializationFactory,
  usingConstantValueSchema,
  usingModelSchema,
  type PlainObject,
} from '@finos/legend-shared';
import {
  createModelSchema,
  custom,
  list,
  optional,
  primitive,
} from 'serializr';
import {
  deserializeLakehouseBatchDetails,
  serializeLakehouseBatchDetails,
} from '../helpers/LakehouseIngestSerializationHelper.js';

export enum IngestRequestType {
  INGEST = 'INGEST',
  SEEDING = 'SEEDING',
  CREATE_INGEST_DEFINITION = 'CREATE_INGEST_DEFINITION',
  DELETE_INGEST_DEFINITION = 'DELETE_INGEST_DEFINITION',
}

export enum LakehouseBatchDetailsType {
  CREATE_INGEST_DEFINITION = 'CreateIngestDefinition',
  DELETE_INGEST_DEFINITION = 'DeleteIngestDefinition',
  INGEST = 'Ingest',
  MATVIEW = 'MatView',
}

class LakehouseIngestDefinitionReference {
  ingestDefinitionUrn!: string;

  static readonly serialization = new SerializationFactory(
    createModelSchema(LakehouseIngestDefinitionReference, {
      ingestDefinitionUrn: primitive(),
    }),
  );
}

class LakehouseIngestRequestReference {
  ingestDefinitionReference!: LakehouseIngestDefinitionReference;
  ingestRequestId!: string;

  static readonly serialization = new SerializationFactory(
    createModelSchema(LakehouseIngestRequestReference, {
      ingestDefinitionReference: usingModelSchema(
        LakehouseIngestDefinitionReference.serialization.schema,
      ),
      ingestRequestId: primitive(),
    }),
  );
}

// ---------------------------------- Batch Details ----------------------------------

export abstract class LakehouseBatchDetails {}

export class LakehouseCreateIngestDefinitionBatchDetails extends LakehouseBatchDetails {
  static readonly serialization = new SerializationFactory(
    createModelSchema(LakehouseCreateIngestDefinitionBatchDetails, {
      _type: usingConstantValueSchema(
        LakehouseBatchDetailsType.CREATE_INGEST_DEFINITION,
      ),
    }),
  );
}

export class LakehouseDeleteIngestDefinitionBatchDetails extends LakehouseBatchDetails {
  static readonly serialization = new SerializationFactory(
    createModelSchema(LakehouseDeleteIngestDefinitionBatchDetails, {
      _type: usingConstantValueSchema(
        LakehouseBatchDetailsType.DELETE_INGEST_DEFINITION,
      ),
    }),
  );
}

class LakehouseIngestBatchDataDetails {
  dataset!: string;
  paths: string[] = [];
  deletePartitionPaths: string[] = [];

  static readonly serialization = new SerializationFactory(
    createModelSchema(LakehouseIngestBatchDataDetails, {
      dataset: primitive(),
      paths: list(primitive()),
      deletePartitionPaths: list(primitive()),
    }),
  );
}

export class LakehouseIngestBatchDetails extends LakehouseBatchDetails {
  data: LakehouseIngestBatchDataDetails[] = [];

  static readonly serialization = new SerializationFactory(
    createModelSchema(LakehouseIngestBatchDetails, {
      _type: usingConstantValueSchema(LakehouseBatchDetailsType.INGEST),
      data: list(
        usingModelSchema(LakehouseIngestBatchDataDetails.serialization.schema),
      ),
    }),
  );
}

export class LakehouseMatViewBatchDetails extends LakehouseBatchDetails {
  static readonly serialization = new SerializationFactory(
    createModelSchema(LakehouseMatViewBatchDetails, {
      _type: usingConstantValueSchema(LakehouseBatchDetailsType.MATVIEW),
    }),
  );
}

export class INTERNAL__UnknownLakehouseBatchDetails extends LakehouseBatchDetails {
  content!: PlainObject;
}

// ---------------------------------- Ingest Request ----------------------------------

export class LakehouseIngestRequest {
  ingestRequestType!: IngestRequestType;
  ingestRequestReference!: LakehouseIngestRequestReference;
  batchDetails!: LakehouseBatchDetails;

  static readonly serialization = new SerializationFactory(
    createModelSchema(LakehouseIngestRequest, {
      ingestRequestType: primitive(),
      ingestRequestReference: usingModelSchema(
        LakehouseIngestRequestReference.serialization.schema,
      ),
      batchDetails: custom(
        serializeLakehouseBatchDetails,
        deserializeLakehouseBatchDetails,
      ),
    }),
  );
}

// ------------------------------- Ingest Request Status -------------------------------

export enum LakehouseIngestRequestState {
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMED_OUT = 'TIMED_OUT',
  CANCELLED = 'CANCELLED',
  RETRY_REQUESTED = 'RETRY_REQUESTED',
  KILLED = 'KILLED',
}

export class LakehouseIngestRequestStatus {
  ingestRequestReference!: LakehouseIngestRequestReference;
  state!: LakehouseIngestRequestState;
  effectiveFrom!: string;
  effectiveTo!: string | undefined;

  static readonly serialization = new SerializationFactory(
    createModelSchema(LakehouseIngestRequestStatus, {
      ingestRequestReference: usingModelSchema(
        LakehouseIngestRequestReference.serialization.schema,
      ),
      state: primitive(),
      effectiveFrom: primitive(),
      effectiveTo: optional(primitive()),
    }),
  );
}
