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
import {
  Dialog,
  Modal,
  ModalBody,
  ModalFooter,
  ModalFooterButton,
  ModalHeader,
  PanelListItem,
  PanelLoadingIndicator,
  QuestionIcon,
  clsx,
} from '@finos/legend-art';
import { useLegendDataCubeBaseStore } from './LegendDataCubeFrameworkProvider.js';
import { DataCubeSourceEditor } from './source/DataCubeSourceEditor.js';
import { useEffect, useRef, useState } from 'react';
import { DataCube } from '@finos/legend-data-cube';
import type { LegendDataCubeStore } from '../stores/LegendDataCubeEditorStore.js';
import type { LegendCubeViewer } from '../stores/source/LegendCubeViewer.js';
import { flowResult } from 'mobx';

const CreateQueryDialog = observer(
  (props: { view: LegendCubeViewer; store: LegendDataCubeStore }) => {
    const { store } = props;
    const close = (): void => store.setSaveModal(false);
    const [queryName, setQueryName] = useState('');
    const create = (): void => {
      flowResult(store.saveQuery(queryName)).catch(
        store.applicationStore.alertUnhandledError,
      );
    };
    const isEmptyName = !queryName;
    // name
    const nameInputRef = useRef<HTMLInputElement>(null);
    const setFocus = (): void => {
      nameInputRef.current?.focus();
    };

    const changeName: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      setQueryName(event.target.value);
    };

    useEffect(() => {
      setTimeout(() => setFocus(), 1);
    }, []);
    return (
      <Dialog
        open={store.saveModal}
        onClose={close}
        classes={{
          root: 'editor-modal__root-container',
          container: 'editor-modal__container',
          paper: 'editor-modal__content',
        }}
      >
        <Modal darkMode={false} className="query-export">
          <ModalHeader title="Create New Query" />
          <ModalBody>
            <PanelLoadingIndicator
              isLoading={store.saveModalState.isInProgress}
            />
            <PanelListItem>
              <div className="input--with-validation">
                <input
                  ref={nameInputRef}
                  className={clsx('input input--dark', {
                    'input--caution': false,
                  })}
                  spellCheck={false}
                  value={queryName}
                  onChange={changeName}
                  title="New Query Name"
                />
              </div>
            </PanelListItem>
          </ModalBody>
          <ModalFooter>
            <ModalFooterButton
              text="Create Query"
              title="Create new query"
              disabled={isEmptyName}
              onClick={create}
            />
          </ModalFooter>
        </Modal>
      </Dialog>
    );
  },
);

export const DataCubeEditor = observer(() => {
  const dataCubeStore = useLegendDataCubeBaseStore();
  const sourceSelector = dataCubeStore.sourceSelector;

  useEffect(() => {
    dataCubeStore.context.initialize();
  }, [dataCubeStore]);
  return (
    <>
      <div className="h-full w-full bg-white">
        <div className="bg-sky-900">
          <div className="mx-auto max-w-full px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-12 items-center justify-between">
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <div className="text-gray-300">Legend Data Cube</div>
                </div>
              </div>
              <div className="md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  <button
                    type="button"
                    className="relative rounded-full bg-sky-900 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <QuestionIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {dataCubeStore.cubeViewer ? (
          <>
            <div className="h-[calc(100%_-_30px)]">
              <div className="h-12 w-full bg-gray-200">
                <button
                  onClick={() => dataCubeStore.setSaveModal(true)}
                  type="button"
                  className="relative rounded-full bg-sky-900 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  Save
                </button>
              </div>
              <div className="h-[calc(100%_-_30px)]">
                <DataCube engine={dataCubeStore.cubeViewer.engine} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              onClick={() => sourceSelector.openModal()}
              className="bg-white shadow"
            >
              <div className="mx-auto h-40 px-4 py-6 sm:px-6 lg:px-8">
                <div className="group flex w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 py-3 text-base font-medium leading-6 text-slate-900 hover:cursor-pointer hover:border-solid hover:border-blue-500 hover:bg-white hover:text-blue-500">
                  <svg
                    className="mb-1 text-slate-400 group-hover:text-blue-500"
                    width="20"
                    height="20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1Z" />
                  </svg>
                  Add Source
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {sourceSelector.open && (
        <DataCubeSourceEditor sourceBuilder={sourceSelector} />
      )}
      {dataCubeStore.cubeViewer && dataCubeStore.saveModal && (
        <CreateQueryDialog
          store={dataCubeStore}
          view={dataCubeStore.cubeViewer}
        />
      )}
    </>
  );
});
