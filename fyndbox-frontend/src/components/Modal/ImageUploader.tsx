import { FC, useEffect, useRef, useState } from 'react';
import { CircularProgress, Typography } from '@mui/material';
import {
  Clear,
  ImageRounded,
  MoreVertRounded,
  PauseRounded,
} from '@mui/icons-material';
import { useDeleteImage, useUploadImage } from '../../hooks/useImage';
import {
  BrowseText,
  ImageUploaderContainer,
  ImageDropContent,
  ImageDropZone,
  ImageLabel,
  ImageBox,
  ClearButton,
  StatusIconButton,
  UploadIconWrap,
  UploadStatusActions,
  UploadStatusCard,
  UploadStatusText,
} from './EntityActionModal.styles';

interface ImageUploaderProps {
  initialImage?: string;
  onImageUpload: (image: string | undefined) => void;
  label?: string;
}

const ImageUploader: FC<ImageUploaderProps> = ({
  initialImage,
  onImageUpload,
  label = 'Image',
}) => {
  const [image, setImage] = useState<string | undefined>(initialImage);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    mutate: uploadImage,
    error: uploadError,
    isPending,
  } = useUploadImage();
  const { mutate: deleteImage, error: deleteError } = useDeleteImage();

  useEffect(() => {
    setImage(initialImage);
  }, [initialImage]);

  const submitFile = (file: File) => {
    uploadImage(file, {
      onSuccess: (uploadedImageUrl) => {
        setImage(uploadedImageUrl.imageUrl);
        onImageUpload(uploadedImageUrl.imageUrl);
      },
      onError: (err) => {
        console.error('Error uploading image:', err);
      },
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    submitFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    submitFile(file);
  };

  const handleClearImage = () => {
    if (!image) return;

    try {
      // If it's a full URL, extract the path. If not, assume it's already the key/path.
      let imageKey = image;
      if (image.startsWith('http')) {
        const url = new URL(image);
        imageKey = url.pathname.substring(1);
      } else if (image.startsWith('/')) {
        imageKey = image.substring(1);
      }

      const decodedKey = decodeURIComponent(imageKey);

      deleteImage(decodedKey, {
        onSuccess: () => {
          setImage(undefined);
          onImageUpload(undefined);
        },
        onError: (error) => {
          console.error('Error deleting image:', error);
        },
      });
    } catch (error) {
      console.error('Invalid image URL or path:', image, error);
    }
  };

  return (
    <ImageUploaderContainer
      display="flex"
      flexDirection="column"
      alignItems="stretch"
    >
      <ImageLabel variant="body1">{label}</ImageLabel>
      <ImageDropZone
        dragActive={dragActive}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
      >
        <ImageDropContent>
          {image ? (
            <>
              <ImageBox src={image} alt="Uploaded image" />
              <Typography variant="body1" fontWeight={700}>
                Image ready
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tap to replace it with another image
              </Typography>
            </>
          ) : (
            <>
              <UploadIconWrap>
                <ImageRounded sx={{ fontSize: 34, color: '#3B82F6' }} />
              </UploadIconWrap>
              <Typography variant="body1" fontWeight={700} color="text.primary">
                Drop your image here, or <BrowseText>browse</BrowseText>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports JPG, JPEG2000, PNG
              </Typography>
            </>
          )}
        </ImageDropContent>
        <input
          type="file"
          hidden
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
        />
      </ImageDropZone>

      <UploadStatusCard>
        <UploadStatusText>
          <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
            {isPending
              ? 'Uploading...'
              : image
                ? 'Upload complete'
                : 'No image selected'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isPending
              ? '100% - finalizing upload'
              : image
                ? 'Your image is attached and ready'
                : 'Choose or drop an image to continue'}
          </Typography>
        </UploadStatusText>

        <UploadStatusActions>
          {isPending && <CircularProgress size={20} />}
          <StatusIconButton size="small" disabled={!isPending}>
            <PauseRounded fontSize="small" />
          </StatusIconButton>
          <ClearButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleClearImage();
            }}
            disabled={!image || isPending}
          >
            <Clear fontSize="small" />
          </ClearButton>
          <StatusIconButton size="small">
            <MoreVertRounded fontSize="small" />
          </StatusIconButton>
        </UploadStatusActions>
      </UploadStatusCard>

      {uploadError && (
        <Typography variant="caption" color="error">
          {uploadError.message}
        </Typography>
      )}
      {deleteError && (
        <Typography variant="caption" color="error">
          {deleteError.message}
        </Typography>
      )}
    </ImageUploaderContainer>
  );
};

export default ImageUploader;
