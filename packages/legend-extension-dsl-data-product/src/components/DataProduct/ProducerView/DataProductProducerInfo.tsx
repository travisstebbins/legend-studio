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
  AnchorLinkIcon,
  CubesLoadingIndicator,
  CubesLoadingIndicatorIcon,
} from '@finos/legend-art';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { DataProductIngestDefinitionView } from './DataProductIngestDefinitionView.js';
import type { DataProductProducerViewerState } from '../../../stores/DataProduct/ProducerView/DataProductProducerViewerState.js';
import {
  DATA_PRODUCT_PRODUCER_VIEWER_SECTION,
  generateAnchorForSection,
} from '../../../stores/ProductViewerNavigation.js';
import { ProductWikiPlaceholder } from '../../ProductWiki.js';

export const DataProductProducerInfo = observer(
  (props: {
    dataProductProducerViewerState: DataProductProducerViewerState;
  }) => {
    const { dataProductProducerViewerState } = props;
    const sectionRef = useRef<HTMLDivElement>(null);

    const anchor = generateAnchorForSection(
      DATA_PRODUCT_PRODUCER_VIEWER_SECTION.INGEST_DETAILS,
    );

    const ingestDefinitions = dataProductProducerViewerState.ingestDefinitions;

    useEffect(() => {
      if (sectionRef.current) {
        dataProductProducerViewerState.layoutState.setWikiPageAnchor(
          anchor,
          sectionRef.current,
        );
      }
      return () =>
        dataProductProducerViewerState.layoutState.unsetWikiPageAnchor(anchor);
    }, [anchor, dataProductProducerViewerState.layoutState]);

    return (
      <div ref={sectionRef} className="data-product__viewer__wiki__section">
        <div className="data-product__viewer__wiki__section__header">
          <div className="data-product__viewer__wiki__section__header__label">
            Ingest Definitions
            <button
              className="data-product__viewer__wiki__section__header__anchor"
              tabIndex={-1}
              onClick={() =>
                dataProductProducerViewerState.changeZone(anchor, true)
              }
            >
              <AnchorLinkIcon />
            </button>
          </div>
        </div>
        <div className="data-product__viewer__wiki__section__content">
          {dataProductProducerViewerState.initState.isInProgress ? (
            <CubesLoadingIndicator isLoading={true}>
              <CubesLoadingIndicatorIcon />
            </CubesLoadingIndicator>
          ) : ingestDefinitions.length ? (
            <>
              {ingestDefinitions.map((ingestDefinition) => (
                <DataProductIngestDefinitionView
                  key={ingestDefinition.ingestDefinitionUrn}
                  ingestDefinition={ingestDefinition}
                />
              ))}
            </>
          ) : (
            <ProductWikiPlaceholder message="(no ingeset definitions found)" />
          )}
        </div>
      </div>
    );
  },
);
