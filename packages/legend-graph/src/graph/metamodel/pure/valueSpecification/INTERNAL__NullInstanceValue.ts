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

import { type ValueSpecificationVisitor } from './ValueSpecification.js';
import { InstanceValue } from './InstanceValue.js';
import type { GenericTypeReference } from '../packageableElements/domain/GenericTypeReference.js';
import { Multiplicity } from '../packageableElements/domain/Multiplicity.js';
import { hashArray } from '@finos/legend-shared';
import { CORE_HASH_STRUCTURE } from '../../../Core_HashUtils.js';

export class INTERNAL__NullInstanceValue extends InstanceValue {
  override genericType: GenericTypeReference;

  constructor(genericType: GenericTypeReference) {
    super(Multiplicity.ONE, genericType);
    this.genericType = genericType;
  }

  override get hashCode(): string {
    return hashArray([
      CORE_HASH_STRUCTURE.INTERNAL__NULL_INSTANCE_VALUE,
      this.genericType?.ownerReference.valueForSerialization ?? '',
      this.multiplicity,
    ]);
  }

  override accept_ValueSpecificationVisitor<T>(
    visitor: ValueSpecificationVisitor<T>,
  ): T {
    return visitor.visit_INTERNAL__NullInstanceValue(this);
  }
}
