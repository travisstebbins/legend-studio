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

import { useRef, useState, type JSX } from 'react';
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  ClickAwayListener,
  Slide,
} from '@mui/material';
import { clsx, deserializeIcon } from '@finos/legend-art';
import {
  type V1_DataProductIcon,
  V1_DataProductEmbeddedImageIcon,
  V1_DataProductLibraryIcon,
} from '@finos/legend-graph';

export const LegendMarketplaceCard = (props: {
  content: JSX.Element;
  size: 'small' | 'large';
  actions?: JSX.Element;
  onClick?: () => void;
  moreInfo?: JSX.Element | undefined;
  className?: string;
  cardMedia?: V1_DataProductIcon | string | undefined;
}): JSX.Element => {
  const { content, size, actions, onClick, moreInfo, className, cardMedia } =
    props;

  const cardImage =
    cardMedia instanceof V1_DataProductEmbeddedImageIcon
      ? cardMedia.imageUrl
      : typeof cardMedia === 'string'
        ? cardMedia
        : undefined;
  const cardIcon =
    cardMedia instanceof V1_DataProductLibraryIcon ? cardMedia : undefined;

  const [isMouseOver, setIsMouseOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const CardContentComponent = (
    <>
      <CardContent
        className={clsx('legend-marketplace-card__content', {
          'legend-marketplace-card__content--with-actions':
            actions !== undefined,
        })}
      >
        {content}
      </CardContent>
      {actions && (
        <CardActions className="legend-marketplace-card__actions">
          {actions}
        </CardActions>
      )}
      {moreInfo && (
        <ClickAwayListener onClickAway={() => setIsMouseOver(false)}>
          <Slide
            direction="up"
            in={isMouseOver}
            appear={isMouseOver}
            container={containerRef.current}
          >
            <CardContent className="legend-marketplace-card__more-info">
              {moreInfo}
            </CardContent>
          </Slide>
        </ClickAwayListener>
      )}
    </>
  );

  return (
    <Card
      variant="outlined"
      className={clsx(
        'legend-marketplace-card',
        {
          'legend-marketplace-card--small': size === 'small',
          'legend-marketplace-card--large': size === 'large',
          'legend-marketplace-card--with-icon': cardIcon !== undefined,
        },
        className,
      )}
      ref={containerRef}
      sx={
        cardImage
          ? {
              background: `url(${cardImage})`,
            }
          : {}
      }
    >
      {cardIcon !== undefined && (
        <div className="legend-marketplace-card__icon">
          {deserializeIcon(cardIcon.libraryId, cardIcon.iconId)}
        </div>
      )}
      {onClick ? (
        <CardActionArea
          onClick={onClick}
          onMouseEnter={() => setIsMouseOver(true)}
          onMouseLeave={() => setIsMouseOver(false)}
          className="legend-marketplace-card__content-container"
          component="div"
        >
          {CardContentComponent}
        </CardActionArea>
      ) : (
        <div
          onMouseEnter={() => setIsMouseOver(true)}
          onMouseLeave={() => setIsMouseOver(false)}
          className="legend-marketplace-card__content-container"
        >
          {CardContentComponent}
        </div>
      )}
    </Card>
  );
};
