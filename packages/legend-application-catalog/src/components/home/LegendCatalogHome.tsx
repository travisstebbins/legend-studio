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

import { observer } from 'mobx-react-lite';
import { LegendCatalogHeader } from '../header/LegendCatalogHeader.js';

export const LegendCatalogHome = observer(() => {
  return (
    <div className="app__page">
      <div className="legend-catalog-home">
        <div className="legend-catalog-home__body">
          <LegendCatalogHeader />
          <div className="legend-catalog-home__content">
            <div className="legend-catalog-home__content__title">
              Welcome to Legend Catalog
            </div>
            <div className="legend-catalog-home__content__description">
              <p>
                Legend Catalog is a WIP. Please check back in the future for
                updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
