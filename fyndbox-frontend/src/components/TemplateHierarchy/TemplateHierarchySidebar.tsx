import { FC, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  ChevronRightRounded,
  ExpandMoreRounded,
  FolderRounded,
  Inventory2Rounded,
  LibraryBooksRounded,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  TemplateHierarchyBox,
  TemplateHierarchyStorage,
  TemplateSelectionStorage,
} from '../../types/templateHierarchy';

interface TemplateHierarchySidebarProps {
  errorMessage: string | null;
  isProcessing: boolean;
  onClose: () => void;
  onConfirmSelection: (selection: TemplateSelectionStorage[]) => Promise<void>;
  open: boolean;
  successMessage: string | null;
  templates: TemplateHierarchyStorage[];
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
    if (!open) {
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
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box
          sx={{
            width: { xs: '100vw', sm: 360 },
            maxWidth: '100vw',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Box display="flex" alignItems="center" p={2}>
            <Typography variant="h5" textAlign="center">
              {t('templatesSidebar.title', {
                defaultValue: 'Template Library',
              })}
            </Typography>
          </Box>
          <Divider orientation="horizontal" />

          <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                {t('templatesSidebar.subtitle', {
                  defaultValue:
                    'Expand folders, tick what you want to create, and confirm before anything is saved.',
                })}
              </Typography>

              {successMessage && (
                <Alert severity="success">{successMessage}</Alert>
              )}
              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

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
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      sx={{ minHeight: 40 }}
                    >
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
                      <LibraryBooksRounded fontSize="small" color="primary" />
                      <Typography variant="body1" fontWeight={600}>
                        {storage.storageName}
                      </Typography>
                    </Stack>

                    {storageExpanded &&
                      storage.boxes.map((box) => {
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
                          <Box key={box.name} sx={{ pl: 4 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.5}
                              sx={{ minHeight: 38 }}
                            >
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
                              <FolderRounded fontSize="small" color="primary" />
                              <Typography variant="body2" fontWeight={600}>
                                {box.name}
                              </Typography>
                            </Stack>

                            {boxExpanded &&
                              box.items.map((item) => (
                                <Stack
                                  key={item.name}
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{ pl: 7.5, minHeight: 36 }}
                                >
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
                                  <Inventory2Rounded
                                    fontSize="small"
                                    color="primary"
                                  />
                                  <Typography variant="body2">
                                    {item.name}
                                  </Typography>
                                </Stack>
                              ))}
                          </Box>
                        );
                      })}
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Divider orientation="horizontal" />
          <Box p={2}>
            <Typography variant="caption" color="text.secondary">
              {t('templatesSidebar.footerHint', {
                defaultValue:
                  'Existing descriptions and quantities are preserved automatically.',
              })}
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setConfirmOpen(true)}
              disabled={selectedStructure.length === 0 || isProcessing}
              sx={{ mt: 1.5 }}
            >
              {isProcessing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                t('templatesSidebar.reviewSelection', {
                  defaultValue: 'Review Selection',
                })
              )}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Dialog
        open={isConfirmOpen}
        onClose={() => {
          if (!isProcessing) {
            setConfirmOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {t('templatesSidebar.confirmTitle', {
            defaultValue: 'Confirm Creation',
          })}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {t('templatesSidebar.confirmMessage', {
                defaultValue:
                  'The checked storage, boxes, and items below will be created if they are missing.',
              })}
            </Typography>

            <Alert severity="info">
              {t('templatesSidebar.confirmSummary', {
                defaultValue:
                  '{{storages}} storages, {{boxes}} boxes, and {{items}} items selected.',
                storages: selectedSummary.storages,
                boxes: selectedSummary.boxes,
                items: selectedSummary.items,
              })}
            </Alert>

            {selectedStructure.map((storage) => (
              <Box key={storage.storageName}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {storage.storageName}
                </Typography>
                {storage.boxes.map((box) => (
                  <Box key={box.name} sx={{ pl: 2, pt: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {box.name}
                    </Typography>
                    {box.items.map((item) => (
                      <Typography
                        key={item.name}
                        variant="body2"
                        color="text.secondary"
                        sx={{ pl: 2, pt: 0.25 }}
                      >
                        {item.name}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={isProcessing}
            variant="outlined"
          >
            {t('modal.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleConfirmCreate}
            disabled={isProcessing || selectedStructure.length === 0}
            variant="contained"
          >
            {isProcessing
              ? t('templatesSidebar.creating', { defaultValue: 'Creating...' })
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
