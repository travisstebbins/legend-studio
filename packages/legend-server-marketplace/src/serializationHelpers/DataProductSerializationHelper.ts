import {
  createModelSchema,
  custom,
  deserialize,
  primitive,
  serialize,
} from 'serializr';
import {
  type DataProductSearchResultDetails,
  type LakehouseDataProductSearchResultOrigin,
  DataProductSearchResult,
  LakehouseAdHocDataProductSearchResultOrigin,
  LakehouseDataProductSearchResultDetails,
  LakehouseSDLCDataProductSearchResultOrigin,
  LegacyDataProductSearchResultDetails,
} from '../models/DataProduct.js';
import {
  UnsupportedOperationError,
  usingConstantValueSchema,
  type PlainObject,
} from '@finos/legend-shared';

export enum LakehouseDataProductSearchResultOriginType {
  sdlc = 'sdlc',
  adhoc = 'adhoc',
}

export const lakehouseSDLCDataProductSearchResultOriginModelSchema =
  createModelSchema(LakehouseSDLCDataProductSearchResultOrigin, {
    _type: usingConstantValueSchema(
      LakehouseDataProductSearchResultOriginType.sdlc,
    ),
    groupId: primitive(),
    artifactId: primitive(),
    versionId: primitive(),
    path: primitive(),
  });

export const lakehouseAdHocDataProductSearchResultOriginModelSchema =
  createModelSchema(LakehouseAdHocDataProductSearchResultOrigin, {
    _type: usingConstantValueSchema(
      LakehouseDataProductSearchResultOriginType.adhoc,
    ),
  });

const deserializeLakehouseDataProductSearchResultOrigin = (
  json: PlainObject<LakehouseDataProductSearchResultOrigin> | null,
): LakehouseDataProductSearchResultOrigin | null => {
  if (json === null) {
    return null;
  }
  switch (json._type) {
    case LakehouseDataProductSearchResultOriginType.sdlc:
      return deserialize(
        lakehouseSDLCDataProductSearchResultOriginModelSchema,
        json,
      );
    case LakehouseDataProductSearchResultOriginType.adhoc:
      return deserialize(
        lakehouseAdHocDataProductSearchResultOriginModelSchema,
        json,
      );
    default: {
      throw new UnsupportedOperationError();
    }
  }
};

const serializeLakehouseDataProductSearchResultOrigin = (
  origin: LakehouseDataProductSearchResultOrigin | null,
): PlainObject<LakehouseDataProductSearchResultOrigin> => {
  if (origin instanceof LakehouseSDLCDataProductSearchResultOrigin) {
    return serialize(
      lakehouseSDLCDataProductSearchResultOriginModelSchema,
      origin,
    );
  }
  if (origin instanceof LakehouseAdHocDataProductSearchResultOrigin) {
    return serialize(
      lakehouseAdHocDataProductSearchResultOriginModelSchema,
      origin,
    );
  }
  throw new UnsupportedOperationError();
};

export enum DataProductSearchResultDetailsType {
  lakehouse = 'lakehouse',
  legacy = 'legacy',
}

export const lakehouseDataProductSearchResultDetailsModelSchema =
  createModelSchema(LakehouseDataProductSearchResultDetails, {
    _type: usingConstantValueSchema(
      DataProductSearchResultDetailsType.lakehouse,
    ),
    dataProductId: primitive(),
    did: primitive(),
    producerEnviornmentName: primitive(),
    producerEnvironmentType: primitive(),
    origin: custom(
      serializeLakehouseDataProductSearchResultOrigin,
      deserializeLakehouseDataProductSearchResultOrigin,
    ),
  });

export const legacyDataProductSearchResultDetailsModelSchema =
  createModelSchema(LegacyDataProductSearchResultDetails, {
    _type: usingConstantValueSchema(DataProductSearchResultDetailsType.legacy),
    groupId: primitive(),
    artifactId: primitive(),
    versionId: primitive(),
    path: primitive(),
  });

const deserializeDataProductSearchResultDetails = (
  json: PlainObject<DataProductSearchResultDetails> | null,
): DataProductSearchResultDetails | null => {
  if (json === null) {
    return null;
  }
  switch (json._type) {
    case DataProductSearchResultDetailsType.lakehouse:
      return deserialize(
        lakehouseDataProductSearchResultDetailsModelSchema,
        json,
      );
    case DataProductSearchResultDetailsType.legacy:
      return deserialize(legacyDataProductSearchResultDetailsModelSchema, json);
    default: {
      throw new UnsupportedOperationError();
    }
  }
};

const serializeDataProductSearchResultDetails = (
  details: DataProductSearchResultDetails | null,
): PlainObject<DataProductSearchResultDetails> => {
  if (details instanceof LakehouseDataProductSearchResultDetails) {
    return serialize(
      lakehouseDataProductSearchResultDetailsModelSchema,
      details,
    );
  }
  if (details instanceof LegacyDataProductSearchResultDetails) {
    return serialize(legacyDataProductSearchResultDetailsModelSchema, details);
  }
  throw new UnsupportedOperationError();
};

export const dataProductSearchResultModelSchema = createModelSchema(
  DataProductSearchResult,
  {
    dataProductName: primitive(),
    dataProductDescription: primitive(),
    dataProductDetails: custom(
      serializeDataProductSearchResultDetails,
      deserializeDataProductSearchResultDetails,
    ),
    similarity: primitive(),
    id: primitive(),
  },
);
