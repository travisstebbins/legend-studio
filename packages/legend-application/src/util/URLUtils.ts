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

import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useGlobalSyncSearchParams } from '../components/GlobalSyncSearchParamsProvider.js';

/**
 * Util hook to keep a state variable in sync with a URL search parameter.
 *
 * @param stateVar the state variable to sync
 * @param updateStateVar setter function to update the state variable (should be memoized with useCallback)
 * @param searchParamKey the key of the URL search parameter to sync with
 * @param initializedCallback function to check if the underlying state is initialized and ready to sync with URL (should be memoized with useCallback)
 */
export const useSyncStateAndSearchParam = (
  stateVar: string | boolean | number | Date | null | undefined,
  updateStateVar: (updatedValue: string | null | undefined) => void,
  searchParamKey: string,
  initializedCallback: () => boolean,
): void => {
  const {
    searchParams: contextSearchParams,
    setSearchParam: setContextSearchParam,
    deleteSearchParam: deleteContextSearchParam,
  } = useGlobalSyncSearchParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync URL search param to context
  useEffect(() => {
    if (initializedCallback()) {
      // On mount or when search param value changes, update context from URL
      if (searchParams.get(searchParamKey) !== stateVar) {
        if (searchParams.get(searchParamKey) !== null) {
          setContextSearchParam(
            searchParamKey,
            String(searchParams.get(searchParamKey)),
          );
        } else {
          deleteContextSearchParam(searchParamKey);
        }
      }
    }
  }, [
    deleteContextSearchParam,
    initializedCallback,
    searchParamKey,
    searchParams,
    setContextSearchParam,
    stateVar,
  ]);

  // Sync context to URL search param
  useEffect(() => {
    if (initializedCallback()) {
      // When context value changes, update search URL search params
      setSearchParams((params) => {
        const newParams = new URLSearchParams(params);
        const contextValue = contextSearchParams.get(searchParamKey);
        if (contextValue !== undefined) {
          newParams.set(searchParamKey, String(contextValue));
        } else {
          newParams.delete(searchParamKey);
        }
        return newParams;
      });
    }
  }, [
    contextSearchParams,
    initializedCallback,
    searchParamKey,
    setSearchParams,
  ]);

  // Sync context to state variable
  useEffect(() => {
    if (initializedCallback()) {
      const contextValue = contextSearchParams.get(searchParamKey);
      updateStateVar(contextValue);
    }
  }, [
    contextSearchParams,
    initializedCallback,
    searchParamKey,
    updateStateVar,
  ]);

  // Sync state variable to context
  useEffect(() => {
    if (initializedCallback()) {
      const contextValue = contextSearchParams.get(searchParamKey);
      if (contextValue !== String(stateVar)) {
        if (stateVar !== undefined && stateVar !== null) {
          setContextSearchParam(searchParamKey, String(stateVar));
        } else {
          deleteContextSearchParam(searchParamKey);
        }
      }
    }
  }, [
    contextSearchParams,
    deleteContextSearchParam,
    initializedCallback,
    searchParamKey,
    setContextSearchParam,
    stateVar,
  ]);
};
