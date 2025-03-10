import { observer } from 'mobx-react-lite';
import type React from 'react';
import { useLegendCatalogApplicationStore } from '../LegendCatalogFrameworkProvider.js';
import { isNonNullable } from '@finos/legend-shared';
import {
  BlankPanelContent,
  CopyIcon,
  Dialog,
  InfoCircleIcon,
  Modal,
  ModalBody,
  ModalHeader,
  ModalHeaderActions,
  ModalTitle,
  TimesIcon,
  TreeView,
} from '@finos/legend-art';

export const LegendCatalogAppInfo: React.FC<{
  open: boolean;
  closeModal: () => void;
}> = (props) => {
  const { open, closeModal } = props;
  const applicationStore = useLegendCatalogApplicationStore();
  const config = applicationStore.config;
  const copyInfo = (): void => {
    applicationStore.clipboardService
      .copyTextToClipboard(
        [
          `Environment: ${config.env}`,
          `Version: ${config.appVersion}`,
          `Revision: ${config.appVersionCommitId}`,
          `Build Time: ${config.appVersionBuildTime}`,
          `SDLC Server: ${config.sdlcServerUrl}`,
          `Engine Server: ${config.engineServerUrl}`,
          `Depot Server: ${config.depotServerUrl}`,
        ]
          .filter(isNonNullable)
          .join('\n'),
      )
      .then(() =>
        applicationStore.notificationService.notifySuccess(
          'Copied application info to clipboard',
        ),
      )
      .catch(applicationStore.alertUnhandledError);
  };

  return (
    <Dialog onClose={closeModal} open={open}>
      <Modal
        darkMode={
          !applicationStore.layoutService.TEMPORARY__isLightColorThemeEnabled
        }
        className="modal--scrollable app__info"
      >
        <ModalHeader>
          <ModalTitle icon={<InfoCircleIcon />} title="About" />
          <ModalHeaderActions>
            <button
              className="modal__header__action"
              tabIndex={-1}
              onClick={copyInfo}
              title="Copy application info"
            >
              <CopyIcon />
            </button>
            <button
              className="modal__header__action"
              tabIndex={-1}
              onClick={closeModal}
            >
              <TimesIcon />
            </button>
          </ModalHeaderActions>
        </ModalHeader>
        <ModalBody>
          <div className="app__info__entry">
            <div className="app__info__entry__title">Environment:</div>
            <div className="app__info__entry__value">{config.env}</div>
          </div>
          <div className="app__info__entry">
            <div className="app__info__entry__title">Version:</div>
            <div className="app__info__entry__value">{config.appVersion}</div>
          </div>
          <div className="app__info__entry">
            <div className="app__info__entry__title">Revision:</div>
            <div className="app__info__entry__value">
              {config.appVersionCommitId}
            </div>
          </div>
          <div className="app__info__entry">
            <div className="app__info__entry__title">Build Time:</div>
            <div className="app__info__entry__value">
              {config.appVersionBuildTime}
            </div>
          </div>
          <div className="app__info__group">
            <div className="app__info__entry">
              <div className="app__info__entry__title">SDLC Server:</div>
              <div className="app__info__entry__value">
                <a
                  href={config.sdlcServerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {config.sdlcServerUrl}
                </a>
              </div>
            </div>
            <div className="app__info__entry">
              <div className="app__info__entry__title">Engine Server:</div>
              <div className="app__info__entry__value">
                <a
                  href={config.engineServerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {config.engineServerUrl}
                </a>
              </div>
            </div>
            <div className="app__info__entry">
              <div className="app__info__entry__title">Depot Server:</div>
              <div className="app__info__entry__value">
                <a
                  href={config.depotServerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {config.depotServerUrl}
                </a>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </Dialog>
  );
};
