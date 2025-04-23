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

import { type JSX } from 'react';
import { Button, Card, CardActions, CardContent, Chip } from '@mui/material';
import type { ProviderResult } from '@finos/legend-server-marketplace';

export const LegendMarketplaceProviderCard = (props: {
  providerResult: ProviderResult;
  onAddToCartClick: (providerResult: ProviderResult) => void;
}): JSX.Element => {
  const { providerResult, onAddToCartClick } = props;
  return (
    <Card variant="outlined" className="legend-marketplace-vendor-card">
      <CardContent className="legend-marketplace-vendor-card__content">
        <div className="legend-marketplace-vendor-card__vendor-name">
          {providerResult.providerName}
        </div>
        <div className="legend-marketplace-vendor-card__product-name">
          {providerResult.productName || 'N/A'}
        </div>
        <div className="legend-marketplace-vendor-card__description">
          {providerResult.description}
        </div>
      </CardContent>
      <CardActions className="legend-marketplace-vendor-card__actions">
        {providerResult.isOwned ? (
          <span>Already have access</span>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={() => onAddToCartClick(providerResult)}
            >
              Add to cart
            </Button>
            <Chip
              label={providerResult.price}
              className="legend-marketplace-vendor-card__price"
            />
          </>
        )}
      </CardActions>
    </Card>
  );
};
