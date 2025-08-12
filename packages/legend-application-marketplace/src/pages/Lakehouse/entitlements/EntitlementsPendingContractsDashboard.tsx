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
  type V1_LiteDataContractWithUserDetails,
  V1_AdhocTeam,
  V1_ContractState,
  V1_deserializeTaskResponse,
  V1_ResourceType,
} from '@finos/legend-graph';
import {
  DataGrid,
  type DataGridCellClickedEvent,
  type DataGridCellRendererParams,
  type DataGridColumnDefinition,
} from '@finos/legend-lego/data-grid';
import {
  Box,
  CircularProgress,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { EntitlementsDashboardState } from '../../../stores/lakehouse/entitlements/EntitlementsDashboardState.js';
import { EntitlementsDataContractViewer } from './EntitlementsDataContractViewer.js';
import { EntitlementsDataContractViewerState } from '../../../stores/lakehouse/entitlements/EntitlementsDataContractViewerState.js';
import { useLegendMarketplaceBaseStore } from '../../../application/LegendMarketplaceFrameworkProvider.js';
import { observer } from 'mobx-react-lite';
import { UserRenderer } from '../../../components/UserRenderer/UserRenderer.js';
import {
  getOrganizationalScopeTypeDetails,
  getOrganizationalScopeTypeName,
  isContractInTerminalState,
} from '../../../stores/lakehouse/LakehouseUtils.js';
import type { LegendMarketplaceBaseStore } from '../../../stores/LegendMarketplaceBaseStore.js';
import { assertErrorThrown, startCase } from '@finos/legend-shared';
import { useAuth } from 'react-oidc-context';
import { MultiUserCellRenderer } from '../../../components/MultiUserCellRenderer/MultiUserCellRenderer.js';
import { InfoCircleIcon } from '@finos/legend-art';

const TargetUserCellRenderer = (props: {
  dataContract: V1_LiteDataContractWithUserDetails | undefined;
  marketplaceStore: LegendMarketplaceBaseStore;
  token: string | undefined;
}): React.ReactNode => {
  const { dataContract, marketplaceStore, token } = props;
  const [targetUsers, setTargetUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchTargetUsers = async () => {
      if (dataContract) {
        setLoading(true);
        try {
          // We try to get the target users from the associated tasks first, since the
          // tasks are what drive the timeline view. If there are no associated tasks,
          // then we use the contract consumer.
          const rawTasks =
            await marketplaceStore.lakehouseContractServerClient.getContractTasks(
              dataContract.contractResultLite.guid,
              token,
            );
          const tasks = V1_deserializeTaskResponse(rawTasks);
          const taskTargetUsers = Array.from(
            new Set<string>(tasks.map((task) => task.rec.consumer)),
          );
          const _targetUsers = taskTargetUsers.length
            ? taskTargetUsers
            : dataContract.contractResultLite.consumer instanceof V1_AdhocTeam
              ? dataContract.contractResultLite.consumer.users.map(
                  (user) => user.name,
                )
              : [];
          setTargetUsers(_targetUsers);
        } catch (error) {
          assertErrorThrown(error);
          marketplaceStore.applicationStore.notificationService.notifyError(
            `Can't fetch target users for contract ${dataContract.contractResultLite.guid}: ${error.message}`,
          );
          setTargetUsers(
            dataContract.contractResultLite.consumer instanceof V1_AdhocTeam
              ? dataContract.contractResultLite.consumer.users.map(
                  (user) => user.name,
                )
              : [],
          );
        } finally {
          setLoading(false);
        }
      }
    };
    // eslint-disable-next-line no-void
    void fetchTargetUsers();
  }, [
    dataContract,
    marketplaceStore.applicationStore.notificationService,
    marketplaceStore.lakehouseContractServerClient,
    token,
  ]);

  return loading ? (
    <CircularProgress size={20} />
  ) : targetUsers.length > 0 ? (
    <MultiUserCellRenderer
      userIds={targetUsers}
      marketplaceStore={marketplaceStore}
      singleUserClassName="marketplace-lakehouse-entitlements__grid__user-display"
    />
  ) : (
    <>Unknown</>
  );
};

export const EntitlementsPendingContractsDashbaord = observer(
  (props: { dashboardState: EntitlementsDashboardState }): React.ReactNode => {
    const { dashboardState } = props;
    const { allUserContracts, pendingUserContracts } = dashboardState;

    const pendingContractsForOthers =
      allUserContracts?.filter(
        (contract) =>
          contract.contractResultLite.createdBy ===
            dashboardState.lakehouseEntitlementsStore.applicationStore
              .identityService.currentUser &&
          !isContractInTerminalState(contract.contractResultLite) &&
          !pendingUserContracts.includes(contract),
      ) ?? [];

    const marketplaceBaseStore = useLegendMarketplaceBaseStore();
    const [selectedContract, setSelectedContract] = useState<
      V1_LiteDataContractWithUserDetails | undefined
    >();
    const [showForOthers, setShowForOthers] = useState<boolean>(
      pendingUserContracts.length === 0 && pendingContractsForOthers.length > 0,
    );
    const auth = useAuth();

    const handleCellClicked = (
      event: DataGridCellClickedEvent<V1_LiteDataContractWithUserDetails>,
    ) => {
      if (
        event.colDef.colId !== 'targetUser' &&
        event.colDef.colId !== 'requester' &&
        event.colDef.colId !== 'assignees'
      ) {
        setSelectedContract(event.data);
      }
    };

    const defaultColDef: DataGridColumnDefinition<V1_LiteDataContractWithUserDetails> =
      {
        minWidth: 50,
        sortable: true,
        resizable: true,
        flex: 1,
      };

    const colDefs: DataGridColumnDefinition<V1_LiteDataContractWithUserDetails>[] =
      [
        {
          colId: 'consumerType',
          headerName: 'Consumer Type',
          cellRenderer: (
            params: DataGridCellRendererParams<V1_LiteDataContractWithUserDetails>,
          ) => {
            const consumer = params.data?.contractResultLite.consumer;
            const typeName = consumer
              ? getOrganizationalScopeTypeName(
                  consumer,
                  dashboardState.lakehouseEntitlementsStore.applicationStore.pluginManager.getApplicationPlugins(),
                )
              : undefined;
            const typeDetails = consumer
              ? getOrganizationalScopeTypeDetails(
                  consumer,
                  dashboardState.lakehouseEntitlementsStore.applicationStore.pluginManager.getApplicationPlugins(),
                )
              : undefined;
            return (
              <>
                {typeName ?? 'Unknown'}
                {typeDetails !== undefined && (
                  <Tooltip
                    className="marketplace-lakehouse-entitlements__grid__consumer-type__tooltip__icon"
                    title={typeDetails}
                  >
                    <InfoCircleIcon />
                  </Tooltip>
                )}
              </>
            );
          },
        },
        {
          headerName: 'Target User(s)',
          colId: 'targetUser',
          cellRenderer: (
            params: DataGridCellRendererParams<V1_LiteDataContractWithUserDetails>,
          ) => (
            <TargetUserCellRenderer
              dataContract={params.data}
              marketplaceStore={marketplaceBaseStore}
              token={auth.user?.access_token}
            />
          ),
        },
        {
          headerName: 'Requester',
          colId: 'requester',
          cellRenderer: (
            params: DataGridCellRendererParams<V1_LiteDataContractWithUserDetails>,
          ) => {
            const requester = params.data?.contractResultLite.createdBy;
            return requester ? (
              <UserRenderer
                userId={requester}
                marketplaceStore={marketplaceBaseStore}
                className="marketplace-lakehouse-entitlements__grid__user-display"
              />
            ) : (
              <>Unknown</>
            );
          },
        },
        {
          headerName: 'Target Data Product',
          valueGetter: (params) => {
            return params.data?.contractResultLite.resourceId ?? 'Unknown';
          },
        },
        {
          headerName: 'Target Access Point Group',
          valueGetter: (params) => {
            const accessPointGroup =
              params.data?.contractResultLite.resourceType ===
              V1_ResourceType.ACCESS_POINT_GROUP
                ? params.data.contractResultLite.accessPointGroup
                : `${params.data?.contractResultLite.accessPointGroup ?? 'Unknown'} (${params.data?.contractResultLite.resourceType ?? 'Unknown Type'})`;
            return accessPointGroup ?? 'Unknown';
          },
        },
        {
          headerName: 'State',
          valueGetter: (params) => {
            const state = params.data?.contractResultLite.state;
            switch (state) {
              case V1_ContractState.PENDING_DATA_OWNER_APPROVAL:
                return 'Data Owner Approval';
              case V1_ContractState.OPEN_FOR_PRIVILEGE_MANAGER_APPROVAL:
                return 'Privilege Manager Approval';
              default:
                return state ? startCase(state) : 'Unknown';
            }
          },
        },
        {
          headerName: 'Business Justification',
          valueGetter: (p) => p.data?.contractResultLite.description,
        },
        {
          headerName: 'Assignees',
          colId: 'assignees',
          cellRenderer: (
            params: DataGridCellRendererParams<V1_LiteDataContractWithUserDetails>,
          ) => (
            <MultiUserCellRenderer
              userIds={params.data?.pendingTaskWithAssignees?.assignees ?? []}
              marketplaceStore={marketplaceBaseStore}
              singleUserClassName="marketplace-lakehouse-entitlements__grid__user-display"
            />
          ),
        },
        {
          hide: true,
          headerName: 'Contract ID',
          valueGetter: (p) => p.data?.contractResultLite.guid,
        },
      ];

    return (
      <Box className="marketplace-lakehouse-entitlements__pending-contracts">
        <Box className="marketplace-lakehouse-entitlements__pending-contracts__action-btns">
          <FormControlLabel
            control={
              <Switch
                checked={showForOthers}
                onChange={(event) => setShowForOthers(event.target.checked)}
              />
            }
            label="Show my requests for others"
          />
        </Box>
        <Box className="marketplace-lakehouse-entitlements__pending-contracts__grid ag-theme-balham">
          <DataGrid
            rowData={
              showForOthers
                ? [...pendingUserContracts, ...pendingContractsForOthers]
                : pendingUserContracts
            }
            onRowDataUpdated={(params) => {
              params.api.refreshCells({ force: true });
            }}
            suppressFieldDotNotation={true}
            suppressContextMenu={false}
            columnDefs={colDefs}
            onCellClicked={handleCellClicked}
            defaultColDef={defaultColDef}
            rowHeight={45}
            overlayNoRowsTemplate="You have no pending contracts"
          />
        </Box>
        {selectedContract !== undefined && (
          <EntitlementsDataContractViewer
            open={true}
            currentViewer={
              new EntitlementsDataContractViewerState(
                selectedContract.contractResultLite,
                marketplaceBaseStore.lakehouseContractServerClient,
              )
            }
            onClose={() => setSelectedContract(undefined)}
          />
        )}
      </Box>
    );
  },
);
