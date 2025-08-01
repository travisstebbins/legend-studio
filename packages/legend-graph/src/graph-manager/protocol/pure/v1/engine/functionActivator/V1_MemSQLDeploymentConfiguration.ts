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

import { hashArray, type Hashable } from '@finos/legend-shared';
import { V1_DeploymentConfiguration } from './V1_DeploymentConfiguration.js';
import type { V1_ConnectionPointer } from '../../model/packageableElements/connection/V1_ConnectionPointer.js';

export class V1_MemSQLDeploymentConfiguration
  extends V1_DeploymentConfiguration
  implements Hashable
{
  activationConnection: V1_ConnectionPointer | undefined;

  override get hashCode(): string {
    return hashArray([this.activationConnection ?? '']);
  }
}
