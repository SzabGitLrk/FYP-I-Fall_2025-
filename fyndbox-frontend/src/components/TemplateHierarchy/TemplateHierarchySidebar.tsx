import { FC, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress, Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  ChevronRightRounded,
  ExpandMoreRounded,
} from '@mui/icons-material';
import StorageIconSvg from '../../assets/storage-icon.svg';
import BoxIconSvg from '../../assets/box-icon.svg';
import ItemIconSvg from '../../assets/item-icon.svg';
import { useTranslation } from 'react-i18next';
import {
  TemplateHierarchyBox,
  TemplateHierarchyStorage,
  TemplateSelectionStorage,
} from '../../types/templateHierarchy';
import { Storage } from '../../types/storage';
import {
  BoxChildren,
  BoxLabel,
  BoxRow,
  FooterHint,
  HeaderSpacer,
  HeaderTitle,
  HierarchyIcon,
  ItemLabel,
  ItemRow,
  ReviewButton,
  StorageChildren,
  StorageLabel,
  StorageRow,
  TemplateContent,
  TemplateDrawer,
  TemplateFooter,
  TemplateHeader,
} from './TemplateHierarchySidebar.styles';

interface TemplateHierarchySidebarProps {
  errorMessage: string | null;
  isProcessing: boolean;
  onClose: () => void;
  onConfirmSelection: (selection: TemplateSelectionStorage[]) => Promise<void>;
  open: boolean;
  successMessage: string | null;
  templates: TemplateHierarchyStorage[];
  existingStorages: Storage[];
}

const createItemKey = (
  storageName: string,
  boxName: string,
  itemName: string,
) => `${storageName}::${boxName}::${itemName}`;

const TemplateHierarchySidebar: FC<TemplateHierarchySidebarProps> = ({
  errorMessage,
  isProcessing,
  onClose,
  onConfirmSelection,
  open,
  successMessage,
  templates,
  existingStorages,
}) => {
  const { t } = useTranslation();
  const [expandedStorages, setExpandedStorages] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedBoxes, setExpandedBoxes] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    () => new Set(),
  );
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setExpandedStorages(new Set());
      setExpandedBoxes(new Set());
      setSelectedItems(new Set());
      setConfirmOpen(false);
    }
  }, [open]);

  const totalItemCountByStorage = useMemo(() => {
    const map = new Map<string, number>();

    templates.forEach((storage) => {
      map.set(
        storage.storageName,
        storage.boxes.reduce((count, box) => count + box.items.length, 0),
      );
    });

    return map;
  }, [templates]);

  const toggleStorageExpanded = (storageName: string) => {
    setExpandedStorages((current) => {
      const next = new Set(current);
      if (next.has(storageName)) {
        next.delete(storageName);
      } else {
        next.add(storageName);
      }
      return next;
    });
  };

  const toggleBoxExpanded = (storageName: string, boxName: string) => {
    const key = `${storageName}::${boxName}`;

    setExpandedBoxes((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isItemSelected = (
    storageName: string,
    boxName: string,
    itemName: string,
  ) => selectedItems.has(createItemKey(storageName, boxName, itemName));

  const getSelectedCountForBox = (
    storageName: string,
    box: TemplateHierarchyBox,
  ) =>
    box.items.filter((item) =>
      isItemSelected(storageName, box.name, item.name),
    ).length;

  const getSelectedCountForStorage = (storage: TemplateHierarchyStorage) =>
    storage.boxes.reduce(
      (count, box) => count + getSelectedCountForBox(storage.storageName, box),
      0,
    );

  const handleStorageToggle = (
    storage: TemplateHierarchyStorage,
    checked: boolean,
  ) => {
    setSelectedItems((current) => {
      const next = new Set(current);

      storage.boxes.forEach((box) => {
        box.items.forEach((item) => {
          const key = createItemKey(storage.storageName, box.name, item.name);
          if (checked) {
            next.add(key);
          } else {
            next.delete(key);
          }
        });
      });

      return next;
    });
  };

  const handleBoxToggle = (
    storage: TemplateHierarchyStorage,
    box: TemplateHierarchyBox,
    checked: boolean,
  ) => {
    setSelectedItems((current) => {
      const next = new Set(current);

      box.items.forEach((item) => {
        const key = createItemKey(storage.storageName, box.name, item.name);
        if (checked) {
          next.add(key);
        } else {
          next.delete(key);
        }
      });

      return next;
    });
  };

  const handleItemToggle = (
    storageName: string,
    boxName: string,
    itemName: string,
    checked: boolean,
  ) => {
    const key = createItemKey(storageName, boxName, itemName);

    setSelectedItems((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const selectedStructure = useMemo<TemplateSelectionStorage[]>(() => {
    return templates
      .map((storage) => {
        const selectedBoxes = storage.boxes
          .map((box) => {
            const selectedBoxItems = box.items
              .filter((item) =>
                isItemSelected(storage.storageName, box.name, item.name),
              )
              .map((item) => ({ name: item.name }));

            if (selectedBoxItems.length === 0) {
              return null;
            }

            return {
              name: box.name,
              items: selectedBoxItems,
            };
          })
          .filter((box): box is NonNullable<typeof box> => Boolean(box));

        if (selectedBoxes.length === 0) {
          return null;
        }

        return {
          storageName: storage.storageName,
          boxes: selectedBoxes,
        };
      })
      .filter(
        (storage): storage is NonNullable<typeof storage> => Boolean(storage),
      );
  }, [selectedItems, templates]);

  const isUpdating = useMemo(() => {
    return selectedStructure.some((selected) =>
      existingStorages.some(
        (existing) =>
          existing.name.trim().toLowerCase() ===
          selected.storageName.trim().toLowerCase()
      )
    );
  }, [selectedStructure, existingStorages]);

  const selectedSummary = useMemo(() => {
    return selectedStructure.reduce(
      (summary, storage) => {
        summary.storages += 1;
        summary.boxes += storage.boxes.length;
        summary.items += storage.boxes.reduce(
          (count, box) => count + box.items.length,
          0,
        );
        return summary;
      },
      { storages: 0, boxes: 0, items: 0 },
    );
  }, [selectedStructure]);

  const handleConfirmCreate = async () => {
    await onConfirmSelection(selectedStructure);
    setConfirmOpen(false);
  };

  return (
    <>
      <TemplateDrawer anchor="right" open={open} onClose={onClose}>
        <TemplateHeader>
          <IconButton onClick={onClose} aria-label={t('common.back')}>
            <ArrowBack />
          </IconButton>
          <HeaderTitle variant="h6">
            {t('templatesSidebar.title', {
              defaultValue: 'Templates',
            })}
          </HeaderTitle>
          <HeaderSpacer />
        </TemplateHeader>

        <TemplateContent>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 1.5 }}>{successMessage}</Alert>
          )}
          {errorMessage && <Alert severity="error" sx={{ mb: 1.5 }}>{errorMessage}</Alert>}

          <Stack spacing={1.5}>
            {templates.map((storage) => {
              const selectedStorageCount = getSelectedCountForStorage(storage);
              const totalStorageItems =
                totalItemCountByStorage.get(storage.storageName) ?? 0;
              const storageChecked =
                totalStorageItems > 0 &&
                selectedStorageCount === totalStorageItems;
              const storageIndeterminate =
                selectedStorageCount > 0 && !storageChecked;
              const storageExpanded = expandedStorages.has(storage.storageName);

              return (
                <Box key={storage.storageName}>
                  <StorageRow>
                    <IconButton
                      size="small"
                      onClick={() => toggleStorageExpanded(storage.storageName)}
                    >
                      {storageExpanded ? (
                        <ExpandMoreRounded />
                      ) : (
                        <ChevronRightRounded />
                      )}
                    </IconButton>
                    <Checkbox
                      checked={storageChecked}
                      indeterminate={storageIndeterminate}
                      onChange={(event) =>
                        handleStorageToggle(storage, event.target.checked)
                      }
                    />
                    <HierarchyIcon src={StorageIconSvg} alt="Storage" />
                    <StorageLabel>
                      {storage.storageName}
                    </StorageLabel>
                  </StorageRow>

                  {storageExpanded && (
                    <StorageChildren>
                    {storage.boxes.map((box) => {
                      const selectedBoxCount = getSelectedCountForBox(
                        storage.storageName,
                        box,
                      );
                      const boxChecked =
                        box.items.length > 0 &&
                        selectedBoxCount === box.items.length;
                      const boxIndeterminate =
                        selectedBoxCount > 0 && !boxChecked;
                      const boxKey = `${storage.storageName}::${box.name}`;
                      const boxExpanded = expandedBoxes.has(boxKey);

                      return (
                        <Box key={box.name}>
                          <BoxRow>
                            <IconButton
                              size="small"
                              onClick={() =>
                                toggleBoxExpanded(storage.storageName, box.name)
                              }
                            >
                              {boxExpanded ? (
                                <ExpandMoreRounded />
                              ) : (
                                <ChevronRightRounded />
                              )}
                            </IconButton>
                            <Checkbox
                              checked={boxChecked}
                              indeterminate={boxIndeterminate}
                              onChange={(event) =>
                                handleBoxToggle(
                                  storage,
                                  box,
                                  event.target.checked,
                                )
                              }
                            />
                            <HierarchyIcon src={BoxIconSvg} alt="Box" />
                            <BoxLabel>
                              {box.name}
                            </BoxLabel>
                          </BoxRow>

                          {boxExpanded && (
                            <BoxChildren>
                            {box.items.map((item) => (
                              <ItemRow key={item.name}>
                                <Checkbox
                                  checked={isItemSelected(
                                    storage.storageName,
                                    box.name,
                                    item.name,
                                  )}
                                  onChange={(event) =>
                                    handleItemToggle(
                                      storage.storageName,
                                      box.name,
                                      item.name,
                                      event.target.checked,
                                    )
                                  }
                                />
                                <HierarchyIcon src={ItemIconSvg} alt="Item" />
                                <ItemLabel>
                                  {item.name}
                                </ItemLabel>
                              </ItemRow>
                            ))}
                            </BoxChildren>
                          )}
                        </Box>
                      );
                    })}
                    </StorageChildren>
                  )}
                </Box>
              );
            })}
          </Stack>
        </TemplateContent>

        <TemplateFooter>
          <FooterHint>
            {t('templatesSidebar.footerHint', {
              defaultValue:
                'Existing descriptions and quantities are preserved automatically.',
            })}
          </FooterHint>
          <ReviewButton
            fullWidth
            variant="contained"
            onClick={() => setConfirmOpen(true)}
            disabled={selectedStructure.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('templatesSidebar.reviewSelection', {
                defaultValue: 'Review Selection',
              })
            )}
          </ReviewButton>
        </TemplateFooter>
      </TemplateDrawer>

      <Dialog
        open={isConfirmOpen}
        onClose={() => {
          if (!isProcessing) {
            setConfirmOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(8, 38, 27, 0.18)',
          },
        }}
      >
        {/* ── Gradient header ──────────────────────── */}
        <Box
          sx={{
            background:
              'linear-gradient(135deg, rgba(73, 139, 96, 0.98) 0%, rgba(93, 157, 113, 0.98) 48%, rgba(137, 183, 153, 0.98) 100%)',
            px: 3,
            py: 2.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem' }}
          >
            {isUpdating
              ? t('templatesSidebar.confirmUpdateTitle', {
                  defaultValue: 'Update',
                })
              : t('templatesSidebar.confirmCreateTitle', {
                  defaultValue: 'Confirm Creation',
                })}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.78)', mt: 0.5, lineHeight: 1.5 }}
          >
            {isUpdating
              ? t('templatesSidebar.confirmUpdateMessage', {
                  defaultValue:
                    'Checked items will be created. Unchecked items will be removed. Existing matched items will remain intact.',
                })
              : t('templatesSidebar.confirmCreateMessage', {
                  defaultValue:
                    'The checked storage, boxes, and items below will be created.',
                })}
          </Typography>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          <Stack spacing={0} sx={{ px: 3, py: 2.5 }}>
            {/* ── Summary pill ──────────────────────── */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: '#EEF6F1',
                borderRadius: 1.5,
                px: 2,
                py: 1.25,
                mb: 2.5,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: 'primary.dark', fontWeight: 600 }}
              >
                {t('templatesSidebar.confirmSummary', {
                  defaultValue:
                    '{{storages}} storages, {{boxes}} boxes, and {{items}} items selected.',
                  storages: selectedSummary.storages,
                  boxes: selectedSummary.boxes,
                  items: selectedSummary.items,
                })}
              </Typography>
            </Box>

            {/* ── Storage cards ─────────────────────── */}
            <Stack spacing={2}>
              {templates.map((storage) => {
                const selectedStorageCount =
                  getSelectedCountForStorage(storage);
                const isStorageSelected = selectedStorageCount > 0;

                if (!isStorageSelected) return null;

                const existingStorage = existingStorages.find(
                  (s) =>
                    s.name.toLowerCase() ===
                    storage.storageName.toLowerCase(),
                );

                return (
                  <Box
                    key={storage.storageName}
                    sx={{
                      border: '1px solid',
                      borderColor: 'grey.200',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Storage header row */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        bgcolor: '#F6FAF7',
                        px: 2,
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'grey.200',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HierarchyIcon
                          src={StorageIconSvg}
                          alt="Storage"
                          style={{ width: 20, height: 20 }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: 'primary.dark' }}
                        >
                          {storage.storageName}
                        </Typography>
                      </Stack>
                      <Chip
                        size="small"
                        label={existingStorage ? 'Remain Same' : 'Create'}
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: existingStorage ? '#E8E8E8' : '#D4EDDA',
                          color: existingStorage ? '#555' : '#155724',
                        }}
                      />
                    </Stack>

                    {/* Boxes inside storage */}
                    <Box sx={{ px: 2, py: 1.5 }}>
                      {storage.boxes.map((box) => {
                        const selectedBoxCount = getSelectedCountForBox(
                          storage.storageName,
                          box,
                        );
                        const isBoxSelected = selectedBoxCount > 0;
                        const existingBox = existingStorage?.boxes?.find(
                          (b) =>
                            b.name.toLowerCase() === box.name.toLowerCase(),
                        );

                        if (!isBoxSelected && !existingBox) return null;

                        return (
                          <Box
                            key={box.name}
                            sx={{
                              ml: 1,
                              pl: 2,
                              py: 0.75,
                              borderLeft: '2px solid',
                              borderColor: 'grey.300',
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <HierarchyIcon
                                src={BoxIconSvg}
                                alt="Box"
                                style={{ width: 18, height: 18 }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: 'primary.dark',
                                  textDecoration: !isBoxSelected
                                    ? 'line-through'
                                    : 'none',
                                  opacity: !isBoxSelected ? 0.5 : 1,
                                }}
                              >
                                {box.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={
                                  isBoxSelected
                                    ? existingBox
                                      ? 'Remain Same'
                                      : 'Create'
                                    : 'Remove'
                                }
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  bgcolor: isBoxSelected
                                    ? existingBox
                                      ? '#E8E8E8'
                                      : '#D4EDDA'
                                    : '#F8D7DA',
                                  color: isBoxSelected
                                    ? existingBox
                                      ? '#555'
                                      : '#155724'
                                    : '#721C24',
                                }}
                              />
                            </Stack>

                            {/* Items inside box */}
                            {box.items.map((item) => {
                              const isSelected = isItemSelected(
                                storage.storageName,
                                box.name,
                                item.name,
                              );

                              if (!isSelected && !existingBox) return null;

                              return (
                                <Stack
                                  key={item.name}
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  sx={{
                                    ml: 2,
                                    pl: 2,
                                    py: 0.4,
                                    borderLeft: '2px solid',
                                    borderColor: 'grey.200',
                                  }}
                                >
                                  <HierarchyIcon
                                    src={ItemIconSvg}
                                    alt="Item"
                                    style={{ width: 16, height: 16 }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: 'text.secondary',
                                      fontSize: '0.85rem',
                                      textDecoration: !isSelected
                                        ? 'line-through'
                                        : 'none',
                                      opacity: !isSelected ? 0.5 : 1,
                                    }}
                                  >
                                    {item.name}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={
                                      isSelected
                                        ? existingBox
                                          ? 'Remain Same'
                                          : 'Create'
                                        : 'Remove'
                                    }
                                    sx={{
                                      height: 18,
                                      fontSize: '0.6rem',
                                      fontWeight: 600,
                                      bgcolor: isSelected
                                        ? existingBox
                                          ? '#E8E8E8'
                                          : '#D4EDDA'
                                        : '#F8D7DA',
                                      color: isSelected
                                        ? existingBox
                                          ? '#555'
                                          : '#155724'
                                        : '#721C24',
                                    }}
                                  />
                                </Stack>
                              );
                            })}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </DialogContent>

        {/* ── Footer actions ───────────────────────── */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'grey.200',
            gap: 1,
          }}
        >
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={isProcessing}
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderColor: 'grey.300',
              color: 'text.primary',
              '&:hover': { borderColor: 'grey.500', bgcolor: 'grey.50' },
            }}
          >
            {t('modal.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleConfirmCreate}
            disabled={isProcessing || selectedStructure.length === 0}
            variant="contained"
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              boxShadow: '0 4px 14px rgba(21, 113, 69, 0.25)',
              '&:hover': {
                boxShadow: '0 6px 18px rgba(21, 113, 69, 0.35)',
              },
            }}
          >
            {isUpdating
              ? isProcessing
                ? t('templatesSidebar.updating', {
                    defaultValue: 'Updating...',
                  })
                : t('templatesSidebar.confirmUpdate', {
                    defaultValue: 'Update Selected',
                  })
              : isProcessing
                ? t('templatesSidebar.creating', {
                    defaultValue: 'Creating...',
                  })
                : t('templatesSidebar.confirmCreate', {
                    defaultValue: 'Create Selected',
                  })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TemplateHierarchySidebar;

