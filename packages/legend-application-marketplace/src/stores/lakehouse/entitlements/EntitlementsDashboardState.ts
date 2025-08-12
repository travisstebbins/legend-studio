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
  ActionState,
  assertErrorThrown,
  type GeneratorFn,
  type PlainObject,
} from '@finos/legend-shared';
import { deserialize } from 'serializr';
import {
  type V1_ContractUserEventRecord,
  type V1_LiteDataContractWithUserDetails,
  type V1_PendingTasksResponse,
  type V1_TaskStatus,
  type V1_TaskStatusChangeResponse,
  V1_LiteDataContractWithUserDetailsModelSchema,
  V1_pendingTasksResponseModelSchema,
  V1_TaskStatusChangeResponseModelSchema,
} from '@finos/legend-graph';
import {
  makeObservable,
  flow,
  observable,
  action,
  flowResult,
  computed,
} from 'mobx';
import {
  TEST_USER,
  type LakehouseEntitlementsStore,
} from './LakehouseEntitlementsStore.js';
import { isContractInTerminalState } from '../LakehouseUtils.js';

export class EntitlementsDashboardState {
  readonly lakehouseEntitlementsStore: LakehouseEntitlementsStore;
  pendingTasks: V1_ContractUserEventRecord[] | undefined;
  allUserContracts: V1_LiteDataContractWithUserDetails[] | undefined;
  initializationState = ActionState.create();
  changingState = ActionState.create();

  constructor(state: LakehouseEntitlementsStore) {
    this.lakehouseEntitlementsStore = state;

    makeObservable(this, {
      pendingTasks: observable,
      allUserContracts: observable,
      changingState: observable,
      initializationState: observable,
      setPendingTasks: action,
      setAllUserContracts: action,
      approve: flow,
      fetchPendingTasks: flow,
      fetchAllUserContracts: flow,
      init: flow,
      deny: flow,
      pendingUserContracts: computed,
    });
  }

  get pendingUserContracts(): V1_LiteDataContractWithUserDetails[] {
    return (
      this.allUserContracts?.filter(
        (_contract) => !isContractInTerminalState(_contract.contractResultLite),
      ) ?? []
    );
  }

  *init(token: string | undefined): GeneratorFn<void> {
    this.initializationState.inProgress();
    Promise.all([
      flowResult(this.fetchPendingTasks(token)).catch(
        this.lakehouseEntitlementsStore.applicationStore.alertUnhandledError,
      ),
      flowResult(this.fetchAllUserContracts(token)).catch(
        this.lakehouseEntitlementsStore.applicationStore.alertUnhandledError,
      ),
    ])
      .catch(
        this.lakehouseEntitlementsStore.applicationStore.alertUnhandledError,
      )
      .finally(() => this.initializationState.complete());
  }

  *fetchPendingTasks(token: string | undefined): GeneratorFn<void> {
    try {
      this.setPendingTasks(undefined);
      const rawTasks =
        (yield this.lakehouseEntitlementsStore.lakehouseServerClient.getPendingTasks(
          TEST_USER,
          token,
        )) as PlainObject<V1_PendingTasksResponse>;
      const tasks = deserialize(V1_pendingTasksResponseModelSchema, rawTasks);
      this.setPendingTasks([...tasks.dataOwner, ...tasks.privilegeManager]);
    } catch (error) {
      assertErrorThrown(error);
      this.lakehouseEntitlementsStore.applicationStore.notificationService.notifyError(
        `Error fetching pending tasks: ${error.message}`,
      );
    }
  }

  *fetchAllUserContracts(token: string | undefined): GeneratorFn<void> {
    try {
      this.setAllUserContracts(undefined);
      const rawContracts =
        (yield this.lakehouseEntitlementsStore.lakehouseServerClient.getDataContractsForUser(
          this.lakehouseEntitlementsStore.applicationStore.identityService
            .currentUser,
          token,
        )) as PlainObject<V1_LiteDataContractWithUserDetails>[];
      const contracts = rawContracts.map((_rawContract) =>
        deserialize(
          V1_LiteDataContractWithUserDetailsModelSchema(
            this.lakehouseEntitlementsStore.applicationStore.pluginManager.getPureProtocolProcessorPlugins(),
          ),
          _rawContract,
        ),
      );
      this.setAllUserContracts([...contracts]);
    } catch (error) {
      assertErrorThrown(error);
      this.lakehouseEntitlementsStore.applicationStore.notificationService.notifyError(
        `Error fetching all data contracts: ${error.message}`,
      );
    }
  }

  setPendingTasks(val: V1_ContractUserEventRecord[] | undefined): void {
    this.pendingTasks = val;
  }

  setAllUserContracts(
    val: V1_LiteDataContractWithUserDetails[] | undefined,
  ): void {
    this.allUserContracts = val;
  }

  *approve(
    task: V1_ContractUserEventRecord,
    token: string | undefined,
  ): GeneratorFn<void> {
    try {
      this.changingState.inProgress();
      this.changingState.setMessage('Approving Task');
      const response =
        (yield this.lakehouseEntitlementsStore.lakehouseServerClient.approveTask(
          task.taskId,
          token,
        )) as PlainObject<V1_TaskStatusChangeResponse>;
      const change = deserialize(
        V1_TaskStatusChangeResponseModelSchema,
        response,
      );
      if (change.errorMessage) {
        throw new Error(
          `Unable to approve task: ${task.taskId}: ${change.errorMessage}`,
        );
      }
      task.status = change.status;
      this.setPendingTasks([...(this.pendingTasks ?? [])]);
      this.lakehouseEntitlementsStore.applicationStore.notificationService.notifySuccess(
        `Task has been Approved`,
      );
    } finally {
      this.changingState.complete();
      this.changingState.setMessage(undefined);
    }
  }

  *deny(
    task: V1_ContractUserEventRecord,
    token: string | undefined,
  ): GeneratorFn<void> {
    try {
      this.changingState.inProgress();
      this.lakehouseEntitlementsStore.applicationStore.alertService.setBlockingAlert(
        {
          message: 'Denying Task',
          prompt: 'Denying task...',
          showLoading: true,
        },
      );
      const response =
        (yield this.lakehouseEntitlementsStore.lakehouseServerClient.denyTask(
          task.taskId,
          token,
        )) as PlainObject<V1_TaskStatus>;
      const change = deserialize(
        V1_TaskStatusChangeResponseModelSchema,
        response,
      );
      if (change.errorMessage) {
        throw new Error(
          `Unable to deny task: ${task.taskId}: ${change.errorMessage}`,
        );
      }
      task.status = change.status;
      this.setPendingTasks([...(this.pendingTasks ?? [])]);
      this.lakehouseEntitlementsStore.applicationStore.notificationService.notifySuccess(
        `Task has been denied`,
      );
    } finally {
      this.changingState.complete();
      this.changingState.setMessage(undefined);
      this.lakehouseEntitlementsStore.applicationStore.alertService.setBlockingAlert(
        undefined,
      );
    }
  }
}
