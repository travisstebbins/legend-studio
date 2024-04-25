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
import {
  CollectionInstanceValue,
  EnumValueInstanceValue,
  PrimitiveInstanceValue,
} from './InstanceValue.js';

export class INTERNAL__NullPrimitiveInstanceValue extends PrimitiveInstanceValue {
  override accept_ValueSpecificationVisitor<T>(
    visitor: ValueSpecificationVisitor<T>,
  ): T {
    return visitor.visit_INTERNAL__NullPrimitiveInstanceValue(this);
  }
}

export class INTERNAL__NullEnumValueInstanceValue extends EnumValueInstanceValue {
  override accept_ValueSpecificationVisitor<T>(
    visitor: ValueSpecificationVisitor<T>,
  ): T {
    return visitor.visit_INTERNAL__NullEnumValueInstanceValue(this);
  }
}

export class INTERNAL__NullCollectionInstanceValue extends CollectionInstanceValue {
  override accept_ValueSpecificationVisitor<T>(
    visitor: ValueSpecificationVisitor<T>,
  ): T {
    return visitor.visit_INTERNAL__NullCollectionInstanceValue(this);
  }
}
