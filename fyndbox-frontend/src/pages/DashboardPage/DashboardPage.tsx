import { FC, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
  ExpandLessRounded,
  ExpandMoreRounded,
  KeyboardArrowRightRounded,
} from '@mui/icons-material';
import TopBar from '../../components/TopBar/TopBar';
import EntityCard from '../../components/EntityCard/EntityCard';
import AddEntityButton from '../../components/AddEntityButton/AddEntityButton';
import DashboardFooter from '../../components/DashboardFooter/DashboardFooter';
import SmartAssistButton from '../../components/SmartAssist/SmartAssistButton';
import { CustomIcon } from '../../styles/commonStyles';
import {
  DashboardContainer,
  MainContainer,
  PrimaryActionsContainer,
  SmartAddEntryContainer,
  SmartAddEntryLabel,
  SubContainer,
} from './DashboardPage.styles';
import { EntityType } from '../../types/entityTypes';
import EntityActionModal from '../../components/Modal/EntityActionModal';
import {
  useCreateStorage,
  useDeleteStorage,
  useStorages,
  useUpdateStorage,
} from '../../hooks/useStorage';
import {
  useCreateBox,
  useDeleteBox,
  useUpdateBox,
  useFavoriteBoxes,
} from '../../hooks/useBox';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../../components/QRScanner/QRScanner';
import Sidebar from '../../components/Sidebar/Sidebar';
import { useFooterActions } from '../../hooks/useFooterActions';
import SearchField from '../../components/SearchField/SearchField';
import FavoritesSidebar from '../../components/FavoritesSidebar/FavoritesSidebar';
import SmartAssistModal from '../../components/SmartAssist/SmartAssistModal';
import SmartAssistResultDialog from '../../components/SmartAssist/SmartAssistResultDialog';
import SmartAssistActionDialog from '../../components/SmartAssist/SmartAssistActionDialog';
import SmartAssistVoiceModal from '../../components/SmartAssist/SmartAssistVoiceModal';

const DashboardPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedStorageIndex, setExpandedStorageIndex] = useState<
    number | null
  >(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [entityType, setEntityType] = useState<EntityType>('storage');
  const [editingData, setEditingData] = useState<any | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  // This chooser lets Smart Add expose text, voice, and image entry points from one button.
  const [isSmartAddChooserOpen, setSmartAddChooserOpen] = useState(false);
  const [isSmartAddOpen, setSmartAddOpen] = useState(false);
  const [isSmartAddVoiceOpen, setSmartAddVoiceOpen] = useState(false);
  const [smartAddResult, setSmartAddResult] = useState<{
    open: boolean;
    message: string;
    warnings: string[];
  }>({ open: false, message: '', warnings: [] });
  const { data: storages, isLoading, error } = useStorages(searchKeyword);
  const { mutate: createStorage } = useCreateStorage();
  const { mutate: updateStorage } = useUpdateStorage();
  const { mutate: deleteStorage } = useDeleteStorage();
  const { mutate: createBox } = useCreateBox();
  const { mutate: updateBox } = useUpdateBox();
  const { mutate: deleteBox } = useDeleteBox();
  const { data: favoriteBoxes } = useFavoriteBoxes();
  const {
    handleFavoriteClick,
    handleScanClick,
    handleScanSuccess,
    handleCancelScan,
    handleSettingsClick,
    handleCloseSidebar,
    handleCloseFavbar,
    showQRScanner,
    showFavorites,
    isSidebarOpen,
  } = useFooterActions();

  const handleToggleExpand = (index: number) => {
    setExpandedStorageIndex(expandedStorageIndex === index ? null : index);
  };

  const handleBoxOpen = (storageId: string, boxId: string) => {
    navigate(`/box/${storageId}/${boxId}`);
  };

  const handleAddEntity = (type: EntityType) => {
    setEntityType(type);
    setModalMode('add');
    setEditingData(null);
    setModalOpen(true);
  };

  const handleEditEntity = (
    type: EntityType,
    data: { id: string; name: string; description?: string; image?: string },
  ) => {
    setEntityType(type);
    setModalMode('edit');
    setEditingData(data);
    setModalOpen(true);
  };

  const handleSave = (data: {
    name: string;
    description?: string;
    image?: string;
  }) => {
    if (modalMode === 'add') {
      if (entityType === 'storage') {
        createStorage(data);
      } else if (entityType === 'box' && expandedStorageIndex !== null) {
        const storageId = storages?.[expandedStorageIndex].id; // Get the current storageId
        if (storageId) {
          createBox({ storageId, boxData: data });
        }
      }
    } else if (modalMode === 'edit' && editingData?.id) {
      if (entityType === 'storage') {
        updateStorage({ id: editingData.id, storage: data });
      } else if (entityType === 'box' && expandedStorageIndex !== null) {
        const storageId = storages?.[expandedStorageIndex].id;
        if (storageId) {
          updateBox({ boxId: editingData.id, storageId, boxData: data });
        }
      }
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (entityType === 'storage') {
      deleteStorage(editingData.id);
    } else if (entityType === 'box' && expandedStorageIndex !== null) {
      const storageId = storages?.[expandedStorageIndex].id;
      if (storageId) {
        deleteBox({ boxId: editingData.id, storageId });
      }
    }
    setModalOpen(false);
  };

  const handleSearchChange = (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleOpenSmartAssistModal = () => {
    setSmartAddChooserOpen(false);
    setSmartAddOpen(true);
  };

  const handleOpenSmartAssistVoiceModal = () => {
    setSmartAddChooserOpen(false);
    setSmartAddVoiceOpen(true);
  };

  const handleOpenSmartAddChooser = () => {
    setSmartAddChooserOpen(true);
  };

  const handleSmartAddSaved = (result: {
    message: string;
    warnings?: string[];
    reviewed?: boolean;
  }) => {
    setSmartAddResult({
      open: true,
      message: result.message,
      warnings: result.warnings ?? [],
    });
  };

  return (
    <DashboardContainer>
      <TopBar />
      <SearchField onSearch={handleSearchChange} />
      <MainContainer>
        {isLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" p={5}>
            <Typography variant="body1">Loading...</Typography>
          </Box>
        )}
        {error && (
          <Typography variant="body1" color="error">
            {error.message || 'Error loading storages'}
          </Typography>
        )}
        {!isLoading && storages?.length === 0 && (
          <Typography variant="h6" textAlign="center" color="textSecondary">
            No Storages Found
          </Typography>
        )}
        {storages?.map((storage, index) => (
          <Box key={index}>
            <EntityCard
              name={storage.name}
              description={storage.description ?? ''}
              image={storage.image ?? ''}
              iconButton={
                <IconButton onClick={() => handleToggleExpand(index)}>
                  {expandedStorageIndex === index ? (
                    <CustomIcon>
                      <ExpandLessRounded />
                    </CustomIcon>
                  ) : (
                    <CustomIcon>
                      <ExpandMoreRounded />
                    </CustomIcon>
                  )}
                </IconButton>
              }
              entityType="storage"
              onEdit={() => handleEditEntity('storage', storage)}
            />
            {expandedStorageIndex === index && (
              <SubContainer>
                {storage.boxes && storage.boxes?.length > 0 ? (
                  storage.boxes?.map((box, boxIndex) => (
                    <EntityCard
                      key={boxIndex}
                      name={box.name}
                      description={box.description}
                      iconButton={
                        <IconButton
                          onClick={() => handleBoxOpen(storage.id, box.id)}
                        >
                          <CustomIcon>
                            <KeyboardArrowRightRounded />
                          </CustomIcon>
                        </IconButton>
                      }
                      image={box.image ?? ''}
                      entityType="box"
                      onEdit={() => handleEditEntity('box', box)}
                    />
                  ))
                ) : (
                  <Typography variant="h6" textAlign="center">
                    {t('common.notifications.noBoxForStorage')}
                  </Typography>
                )}
                <AddEntityButton
                  entityType="box"
                  onAdd={() => handleAddEntity('box')}
                />
              </SubContainer>
            )}
          </Box>
        ))}
        {showQRScanner && (
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onCancel={handleCancelScan}
          />
        )}
        <PrimaryActionsContainer>
          <AddEntityButton
            entityType="storage"
            layout="inline"
            onAdd={() => handleAddEntity('storage')}
          />
          <SmartAddEntryContainer>
            <SmartAddEntryLabel variant="h6">
              {t('smartAdd.entryTitle', { defaultValue: 'Smart Add' })}
            </SmartAddEntryLabel>
            <SmartAssistButton
              placement="inline"
              onClick={handleOpenSmartAddChooser}
            />
          </SmartAddEntryContainer>
        </PrimaryActionsContainer>
      </MainContainer>
      <DashboardFooter
        onFavoriteClick={handleFavoriteClick}
        onScanClick={handleScanClick}
        onSettingsClick={handleSettingsClick}
      />
      <EntityActionModal
        key={modalMode}
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        entityType={entityType}
        mode={modalMode}
        initialData={editingData || undefined}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <SmartAssistActionDialog
        open={isSmartAddChooserOpen}
        onClose={() => setSmartAddChooserOpen(false)}
        onSelectTextAdd={handleOpenSmartAssistModal}
        onSelectVoiceAdd={handleOpenSmartAssistVoiceModal}
      />
      <SmartAssistModal
        open={isSmartAddOpen}
        onClose={() => setSmartAddOpen(false)}
        onSaved={handleSmartAddSaved}
      />
      <SmartAssistVoiceModal
        open={isSmartAddVoiceOpen}
        onClose={() => setSmartAddVoiceOpen(false)}
        onSaved={handleSmartAddSaved}
      />
      <SmartAssistResultDialog
        open={smartAddResult.open}
        message={smartAddResult.message}
        warnings={smartAddResult.warnings}
        onClose={() =>
          setSmartAddResult((current) => ({ ...current, open: false }))
        }
      />
      <Sidebar open={isSidebarOpen} onClose={handleCloseSidebar} />
      <FavoritesSidebar
        open={showFavorites}
        favorites={favoriteBoxes}
        onClose={handleCloseFavbar}
      />
    </DashboardContainer>
  );
};

export default DashboardPage;
