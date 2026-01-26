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
import type { SetURLSearchParams } from 'react-router';
import { useGlobalSyncSearchParams } from '../components/GlobalSyncSearchParamsProvider.js';

/**
 * Util hook to keep a state variable in sync with a URL search parameter.
 *
 * @param stateVar the state variable to sync
 * @param updateStateVar setter function to update the state variable (should be memoized with useCallback)
 * @param searchParamKey the key of the URL search parameter to sync with
 * @param searchParamValue the current URL search parameter value (i.e., from useSearchParams)
 * @param setSearchParams function to update the URL search parameters (i.e., from useSearchParams)
 * @param initializedCallback function to check if the underlying state is initialized and ready to sync with URL (should be memoized with useCallback)
 */
export const useSyncStateAndSearchParam = (
  stateVars: Map<string, string | boolean | number | Date | null | undefined>,
  updateStateVar: (updatedValues: Map<string, string | null>) => void,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
  initializedCallback: () => boolean,
): void => {
  const { searchParamsMap, setSearchParamsMap } = useGlobalSyncSearchParams();

  // Sync context with URL search param
  useEffect(() => {
    if (initializedCallback()) {
      // On mount or when search param value changes, update context from URL
      const updatedValues = searchParams.keys().reduce((acc, key) => {
        if (searchParams.get(key) !== stateVars.get(key)) {
          acc.set(key, searchParams.get(key));
        }
        return acc;
      }, new Map<string, string | null>());
      updateStateVar(updatedValues);
    }
  }, [initializedCallback, searchParams, stateVars, updateStateVar]);

  // Sync URL search param with map from context
  useEffect(() => {
    if (initializedCallback()) {
      // When state changes, update URL param and context map
      const paramsToUpdate = stateVars.keys().reduce((acc, key) => {
        if (stateVars.get(key) !== searchParams.get(key)) {
          acc.set(key, stateVars.get(key));
        }
        return acc;
      }, new Map<string, string | boolean | number | Date | null | undefined>());

      setSearchParams((params) => {
        const newParams = new URLSearchParams(params);
        paramsToUpdate.entries().forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            newParams.set(key, String(value));
          } else {
            newParams.delete(key);
          }
        });
        return newParams;
      });

      // Update the global context map
      const newMap = new Map(searchParamsMap);
      paramsToUpdate.entries().forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          newMap.set(key, String(value));
        } else {
          newMap.delete(key);
        }
      });
      setSearchParamsMap(newMap);
    }
  }, [
    initializedCallback,
    searchParams,
    setSearchParams,
    stateVars,
    searchParamsMap,
    setSearchParamsMap,
  ]);
};
