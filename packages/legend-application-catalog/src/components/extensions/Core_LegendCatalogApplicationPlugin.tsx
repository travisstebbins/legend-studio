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

import packageJson from '../../../package.json' with { type: 'json' };
import { LegendCatalogApplicationPlugin } from '../../stores/LegendCatalogApplicationPlugin.js';

export class Core_LegendCatalogApplicationPlugin extends LegendCatalogApplicationPlugin {
  static NAME = packageJson.extensions.applicationCatalogPlugin;

  constructor() {
    super(Core_LegendCatalogApplicationPlugin.NAME, packageJson.version);
  }
}
