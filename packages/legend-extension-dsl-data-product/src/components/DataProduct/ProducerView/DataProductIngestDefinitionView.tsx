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
import type { DataProductIngestDefinitionState } from '../../../stores/DataProduct/ProducerView/DataProductIngestDefinitionState.js';
import { Box, Tab, Tabs } from '@mui/material';
import { useMemo, useState } from 'react';
import { clsx } from '@finos/legend-art';
import { CodeEditor } from '@finos/legend-lego/code-editor';
import {
  CODE_EDITOR_LANGUAGE,
  CODE_EDITOR_THEME,
} from '@finos/legend-code-editor';
import {
  DataGrid,
  type DataGridColumnDefinition,
} from '@finos/legend-lego/data-grid';
import type { LakehouseIngestRequestStatus } from '@finos/legend-server-lakehouse';

const MAX_GRID_AUTO_HEIGHT_ROWS = 10;

export const DataProductIngestDefinitionView = observer(
  (props: { ingestDefinition: DataProductIngestDefinitionState }) => {
    const { ingestDefinition } = props;

    const enum IngestDefinitionTabs {
      GRAMMAR = 'Grammar',
      INGEST_REQUESTS = 'Ingest Requests',
    }
    const [selectedTab, setSelectedTab] = useState(
      IngestDefinitionTabs.GRAMMAR,
    );
    const handleTabChange = (
      _: React.SyntheticEvent,
      newValue: IngestDefinitionTabs,
    ) => {
      setSelectedTab(newValue);
    };

    const ingestRequestStatuses = useMemo(
      () => Array.from(ingestDefinition.ingestRequestStatuses.values()),
      [ingestDefinition.ingestRequestStatuses],
    );

    const defaultStatusColDefs: DataGridColumnDefinition<LakehouseIngestRequestStatus> =
      useMemo(
        () => ({
          sortable: true,
          flex: 1,
        }),
        [],
      );

    const statusColDefs: DataGridColumnDefinition<LakehouseIngestRequestStatus>[] =
      useMemo(
        () => [
          {
            headerName: 'Ingest Request ID',
            field: 'ingestRequestReference.ingestRequestId',
          },
          {
            headerName: 'Status',
            field: 'state',
          },
          {
            headerName: 'Effective From',
            field: 'effectiveFrom',
          },
          {
            headerName: 'Effective To',
            field: 'effectiveTo',
          },
        ],
        [],
      );

    return (
      <Box>
        {ingestDefinition.ingestDefinitionUrn}
        <Box className="data-product__viewer__tabs-bar">
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            className="data-product__viewer__tabs"
          >
            <Tab
              className={clsx('data-product__viewer__tab', {
                'data-product__viewer__tab--selected':
                  selectedTab === IngestDefinitionTabs.GRAMMAR,
              })}
              label={<span>Grammar</span>}
              value={IngestDefinitionTabs.GRAMMAR}
            />
            <Tab
              className={clsx('data-product__viewer__tab', {
                'data-product__viewer__tab--selected':
                  selectedTab === IngestDefinitionTabs.INGEST_REQUESTS,
              })}
              label={<span>Ingest Requests</span>}
              value={IngestDefinitionTabs.INGEST_REQUESTS}
            />
          </Tabs>
        </Box>
        <Box className="data-product__viewer__more-info__container">
          {selectedTab === IngestDefinitionTabs.GRAMMAR && (
            <Box className="data-product__viewer__more-info__grammar">
              <CodeEditor
                inputValue={
                  ingestDefinition.ingestDefinitionGrammar ??
                  'Unable to fetch grammar'
                }
                isReadOnly={true}
                language={CODE_EDITOR_LANGUAGE.PURE}
                hideMinimap={true}
                hideGutter={true}
                hideActionBar={true}
                lightTheme={CODE_EDITOR_THEME.GITHUB_LIGHT}
                extraEditorOptions={{
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </Box>
          )}
          {selectedTab === IngestDefinitionTabs.INGEST_REQUESTS && (
            <Box
              className={clsx(
                'data-product__viewer__more-info__grammar ag-theme-balham',
                {
                  'data-product__viewer__more-info__grammar--auto-height':
                    (ingestRequestStatuses.length ?? 0) <=
                    MAX_GRID_AUTO_HEIGHT_ROWS,
                  'data-product__viewer__more-info__grammar--auto-height--empty':
                    (ingestRequestStatuses.length ?? 0) === 0,
                  'data-product__viewer__more-info__grammar--auto-height--non-empty':
                    (ingestRequestStatuses.length ?? 0) > 0 &&
                    (ingestRequestStatuses.length ?? 0) <=
                      MAX_GRID_AUTO_HEIGHT_ROWS,
                },
              )}
            >
              <DataGrid
                rowData={ingestRequestStatuses ?? []}
                columnDefs={statusColDefs}
                defaultColDef={defaultStatusColDefs}
                domLayout={
                  (ingestRequestStatuses.length ?? 0) >
                  MAX_GRID_AUTO_HEIGHT_ROWS
                    ? 'normal'
                    : 'autoHeight'
                }
              />
            </Box>
          )}
        </Box>
      </Box>
    );
  },
);
