import {
  PRIMITIVE_TYPE,
  V1_AppliedProperty,
  V1_CBoolean,
  V1_CByteArray,
  V1_CDate,
  V1_CDateTime,
  V1_CDecimal,
  V1_CFloat,
  V1_CInteger,
  V1_CLatestDate,
  V1_Collection,
  V1_CStrictDate,
  V1_CStrictTime,
  V1_CString,
  V1_EnumValue,
  V1_PrimitiveValueSpecification,
  V1_ValueSpecification,
} from '@finos/legend-graph';
import { buildDatePickerOption } from '../../components/shared/CustomDatePickerHelper.js';
import type {
  ApplicationStore,
  LegendApplicationConfig,
  LegendApplicationPluginManager,
  LegendApplicationPlugin,
} from '@finos/legend-application';

export const isPritiveType = (type: string): boolean =>
  !Object.values(PRIMITIVE_TYPE)
    .map((type) => type.toString())
    .includes(type);

export const getV1_ValueSpecificationStringValue = (
  valueSpecification: V1_ValueSpecification,
  applicationStore: ApplicationStore<
    LegendApplicationConfig,
    LegendApplicationPluginManager<LegendApplicationPlugin>
  >,
  options?: {
    omitEnumOwnerName?: boolean;
    wrapStringInDoubleQuotes?: boolean;
  },
): string | undefined => {
  if (
    valueSpecification instanceof V1_CDate ||
    valueSpecification instanceof V1_CStrictTime
  ) {
    return buildDatePickerOption(valueSpecification, applicationStore).label;
  } else if (valueSpecification instanceof V1_CString) {
    return options?.wrapStringInDoubleQuotes
      ? `"${valueSpecification.value?.toString()}"`
      : valueSpecification.value?.toString();
  } else if (
    valueSpecification instanceof V1_CBoolean ||
    valueSpecification instanceof V1_CByteArray ||
    valueSpecification instanceof V1_CDecimal ||
    valueSpecification instanceof V1_CFloat ||
    valueSpecification instanceof V1_CInteger ||
    valueSpecification instanceof V1_EnumValue
  ) {
    return valueSpecification.value.toString();
  } else if (valueSpecification instanceof V1_AppliedProperty) {
    return valueSpecification.property;
  } else if (valueSpecification instanceof V1_Collection) {
    return valueSpecification.values
      .map((valueSpec) =>
        getV1_ValueSpecificationStringValue(
          valueSpec,
          applicationStore,
          options,
        ),
      )
      .join(',');
  }
  return undefined;
};

export const isValidV1_ValueSpecification = (
  valueSpecification: V1_ValueSpecification,
): boolean => {
  if (valueSpecification instanceof V1_PrimitiveValueSpecification) {
    const isRequired = valueSpecification.multiplicity.lowerBound >= 1;
    // required and no values provided. LatestDate doesn't have any values so we skip that check for it.
    if (
      isRequired &&
      (valueSpecification instanceof V1_CBoolean ||
        valueSpecification instanceof V1_CByteArray ||
        valueSpecification instanceof V1_CDecimal ||
        valueSpecification instanceof V1_CFloat ||
        valueSpecification instanceof V1_CInteger ||
        valueSpecification instanceof V1_CStrictTime ||
        valueSpecification instanceof V1_CString ||
        valueSpecification instanceof V1_CDateTime ||
        valueSpecification instanceof V1_CStrictDate)
    ) {
      return (
        valueSpecification.value !== null &&
        valueSpecification.value !== undefined
      );
    }
  } else if (valueSpecification instanceof V1_Collection) {
    // collection instance must have all valid values.
    return valueSpecification.values.every(isValidV1_ValueSpecification);
  }

  return true;
};
