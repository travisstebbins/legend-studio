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
  type GenericLegendApplicationStore,
  type NavigationZone,
} from '@finos/legend-application';
import {
  type GraphManagerState,
  type V1_AccessPointGroup,
  type V1_CreateContractPayload,
  type V1_DataContract,
  type V1_DataContractsResponse,
  type V1_DataProduct,
  type V1_EntitlementsDataProductDetails,
  type V1_OrganizationalScope,
  V1_AdhocTeam,
  V1_AppDirLevel,
  V1_AppDirNode,
  V1_AppDirNodeModelSchema,
  V1_createContractPayloadModelSchema,
  V1_dataContractsResponseModelSchemaToContracts,
  V1_ResourceType,
} from '@finos/legend-graph';
import { action, computed, flow, makeObservable, observable } from 'mobx';
import { DataProductLayoutState } from './DataProductLayoutState.js';
import { DATA_PRODUCT_VIEWER_SECTION } from './DataProductViewerNavigation.js';
import { DataProductDataAccessState } from './DataProductDataAccessState.js';
import {
  ActionState,
  assertErrorThrown,
  type GeneratorFn,
  type PlainObject,
} from '@finos/legend-shared';
import { serialize } from 'serializr';
import { dataContractContainsDataProduct } from './LakehouseUtils.js';
import type { LakehouseContractServerClient } from '@finos/legend-server-marketplace';
import type { MarketplaceLakehouseStore } from './MarketplaceLakehouseStore.js';

export class DataProductViewerState {
  readonly applicationStore: GenericLegendApplicationStore;
  readonly lakehouseStore: MarketplaceLakehouseStore;
  readonly graphManagerState: GraphManagerState;
  readonly layoutState: DataProductLayoutState;

  readonly product: V1_DataProduct;
  readonly entitlementsDataProductDetails: V1_EntitlementsDataProductDetails;
  readonly viewDataProductSource: () => void;
  readonly onZoneChange?:
    | ((zone: NavigationZone | undefined) => void)
    | undefined;

  // we may want to move this out eventually
  readonly lakeServerClient: LakehouseContractServerClient;
  accessState: DataProductDataAccessState;
  associatedContracts: V1_DataContract[] | undefined;
  dataContractAccessPointGroup: V1_AccessPointGroup | undefined;
  dataContract: V1_DataContract | undefined;
  // actions

  creatingContractState = ActionState.create();

  constructor(
    applicationStore: GenericLegendApplicationStore,
    lakehouseStore: MarketplaceLakehouseStore,
    graphManagerState: GraphManagerState,
    lakeServerClient: LakehouseContractServerClient,
    product: V1_DataProduct,
    entitlementsDataProductDetails: V1_EntitlementsDataProductDetails,
    actions: {
      viewDataProductSource: () => void;
      onZoneChange?: ((zone: NavigationZone | undefined) => void) | undefined;
    },
  ) {
    makeObservable(this, {
      isVerified: computed,
      accessState: observable,
      fetchContracts: flow,
      associatedContracts: observable,
      dataContractAccessPointGroup: observable,
      setDataContractAccessPointGroup: action,
      dataContract: observable,
      setDataContract: action,
      setAssociatedContracts: action,
      createContract: flow,
      creatingContractState: observable,
    });

    this.applicationStore = applicationStore;
    this.lakehouseStore = lakehouseStore;
    this.graphManagerState = graphManagerState;

    this.product = product;
    this.entitlementsDataProductDetails = entitlementsDataProductDetails;
    this.viewDataProductSource = actions.viewDataProductSource;
    this.onZoneChange = actions.onZoneChange;
    this.layoutState = new DataProductLayoutState(this);
    this.accessState = new DataProductDataAccessState(this);
    this.lakeServerClient = lakeServerClient;
  }

  setAssociatedContracts(val: V1_DataContract[] | undefined): void {
    this.associatedContracts = val;
  }

  setDataContractAccessPointGroup(val: V1_AccessPointGroup | undefined) {
    this.dataContractAccessPointGroup = val;
  }

  setDataContract(val: V1_DataContract | undefined) {
    this.dataContract = val;
  }

  *fetchContracts(token: string | undefined): GeneratorFn<void> {
    try {
      this.accessState.accessGroupStates.forEach((e) =>
        e.fetchingAccessState.inProgress(),
      );
      const didNode = new V1_AppDirNode();
      didNode.appDirId = this.deploymentId;
      didNode.level = V1_AppDirLevel.DEPLOYMENT;
      const _contracts = (yield this.lakeServerClient.getDataContractsFromDID(
        [serialize(V1_AppDirNodeModelSchema, didNode)],
        token,
      )) as PlainObject<V1_DataContractsResponse>;
      const dataProductContracts =
        V1_dataContractsResponseModelSchemaToContracts(
          _contracts,
          this.lakehouseStore.applicationStore.pluginManager.getPureProtocolProcessorPlugins(),
        ).filter((_contract) =>
          dataContractContainsDataProduct(
            this.product,
            this.deploymentId,
            _contract,
          ),
        );
      const dataProductContractIds = dataProductContracts.map((e) => e.guid);
      const enrichedContracts = (yield Promise.all(
        dataProductContractIds.map(async (contractId) => {
          const rawContracts = await this.lakeServerClient.getDataContract(
            contractId,
            token,
          );
          const contract = V1_dataContractsResponseModelSchemaToContracts(
            rawContracts,
            this.lakehouseStore.applicationStore.pluginManager.getPureProtocolProcessorPlugins(),
          );
          return contract;
        }),
      )).flat() as V1_DataContract[];
      this.setAssociatedContracts(enrichedContracts);
      this.accessState.accessGroupStates.forEach((e) =>
        e.handleDataProductContracts(enrichedContracts, token),
      );
    } catch (error) {
      assertErrorThrown(error);
      this.accessState.viewerState.applicationStore.notificationService.notifyError(
        `${error.message}`,
      );
    } finally {
      this.accessState.accessGroupStates.forEach((e) =>
        e.fetchingAccessState.complete(),
      );
    }
  }

  *createContract(
    consumer: V1_OrganizationalScope,
    description: string,
    group: V1_AccessPointGroup,
    token: string | undefined,
  ): GeneratorFn<void> {
    try {
      this.creatingContractState.inProgress();
      const request = serialize(
        V1_createContractPayloadModelSchema(
          this.lakehouseStore.applicationStore.pluginManager.getPureProtocolProcessorPlugins(),
        ),
        {
          description,
          resourceId: this.product.name,
          resourceType: V1_ResourceType.ACCESS_POINT_GROUP,
          deploymentId: this.deploymentId,
          accessPointGroup: group.id,
          consumer,
        } satisfies V1_CreateContractPayload,
      ) as PlainObject<V1_CreateContractPayload>;
      const contracts = V1_dataContractsResponseModelSchemaToContracts(
        (yield this.lakeServerClient.createContract(
          request,
          token,
        )) as unknown as PlainObject<V1_DataContractsResponse>,
        this.lakehouseStore.applicationStore.pluginManager.getPureProtocolProcessorPlugins(),
      );
      const associatedContract = contracts[0];
      // Only if the user has requested a contract for themself do we update the associated contract.
      if (
        associatedContract?.consumer instanceof V1_AdhocTeam &&
        associatedContract.consumer.users.some(
          (u) => u.name === this.applicationStore.identityService.currentUser,
        )
      ) {
        const groupAccessState = this.accessState.accessGroupStates.find(
          (e) => e.group === group,
        );
        groupAccessState?.setAssociatedContract(associatedContract, token);
      }

      this.setDataContractAccessPointGroup(undefined);
      this.setDataContract(associatedContract);
      this.applicationStore.notificationService.notifySuccess(
        `Contract created, please go to contract view for pending tasks`,
      );
    } catch (error) {
      assertErrorThrown(error);
      this.accessState.viewerState.applicationStore.notificationService.notifyError(
        `${error.message}`,
      );
    } finally {
      this.creatingContractState.complete();
    }
  }

  get isVerified(): boolean {
    // TODO what does it mean if data product is vertified ?
    return true;
  }

  get deploymentId(): number {
    return this.entitlementsDataProductDetails.deploymentId;
  }

  changeZone(zone: NavigationZone, force = false): void {
    if (force) {
      this.layoutState.setCurrentNavigationZone('');
    }
    if (zone !== this.layoutState.currentNavigationZone) {
      if (
        Object.values(DATA_PRODUCT_VIEWER_SECTION)
          .map((e) => e.toString())
          .includes(zone)
      ) {
        this.layoutState.setWikiPageAnchorToNavigate({
          anchor: zone,
        });
      }
      this.onZoneChange?.(zone);
      this.layoutState.setCurrentNavigationZone(zone);
    }
  }
}
