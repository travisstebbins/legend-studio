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

import { LegendApplicationPlugin } from '@finos/legend-application';
import { type LegendDataCubePluginManager } from './LegendDataCubePluginManager.js';
import type { LegendDataCubeBuilderState } from '../stores/builder/LegendDataCubeBuilderStore.js';

export class LegendDataCubeApplicationPlugin extends LegendApplicationPlugin {
  /**
   * This helps to better type-check for this empty abtract type
   * See https://github.com/finos/legend-studio/blob/master/docs/technical/typescript-usage.md#understand-typescript-structual-type-system
   */
  private readonly _$nominalTypeBrand!: 'LegendDataCubeApplicationPlugin';

  install(pluginManager: LegendDataCubePluginManager): void {
    pluginManager.registerApplicationPlugin(this);
  }

  /**
   * Custom renderer for the builder header, before the load/new/save buttons
   */
  builderInnerHeaderRenderer?(
    builder: LegendDataCubeBuilderState | undefined,
  ): React.ReactNode | null;

  /**
   * Returns the height that should be used when rendering the DataCube source viewer.
   */
  getSourceViewerHeight?(
    builder: LegendDataCubeBuilderState | undefined,
  ): number | undefined;
}
