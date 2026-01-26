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
  createContext,
  useContext,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react';

interface GlobalSyncSearchParamsContextValue {
  searchParamsMap: Map<string, string>;
  setSearchParamsMap: (map: Map<string, string>) => void;
}

const GlobalSyncSearchParamsContext = createContext<
  GlobalSyncSearchParamsContextValue | undefined
>(undefined);

export const GlobalSyncSearchParamsProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const [searchParamsMap, setSearchParamsMap] = useState<Map<string, string>>(
    new Map(),
  );

  const value = useMemo(
    () => ({
      searchParamsMap,
      setSearchParamsMap,
    }),
    [searchParamsMap],
  );

  return (
    <GlobalSyncSearchParamsContext.Provider value={value}>
      {children}
    </GlobalSyncSearchParamsContext.Provider>
  );
};

export const useGlobalSyncSearchParams =
  (): GlobalSyncSearchParamsContextValue => {
    const context = useContext(GlobalSyncSearchParamsContext);
    if (context === undefined) {
      throw new Error(
        'useGlobalSyncSearchParams must be used within GlobalSyncSearchParamsProvider',
      );
    }
    return context;
  };
