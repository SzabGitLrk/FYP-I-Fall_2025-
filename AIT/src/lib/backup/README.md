# Backup System Infrastructure

This directory contains the core infrastructure for the AI Timetable Generator backup and restore system.

## Directory Structure

```
backup/
├── index.ts           # Main exports and error classes
├── types.ts           # TypeScript type definitions
├── interfaces.ts      # Service interface definitions
├── storage.ts         # File storage management
├── utils.ts           # Utility functions
├── config.ts          # Configuration management
└── README.md          # This documentation
```

## Core Components

### Types (`types.ts`)
- `BackupOptions` - Configuration for backup creation
- `BackupResult` - Result of backup operations
- `BackupMetadata` - Metadata stored with each backup
- `RestoreOptions` - Configuration for restore operations
- `DatabaseSnapshot` - Structure for database exports
- Progress tracking types for UI feedback

### Interfaces (`interfaces.ts`)
- `BackupService` - Main backup operations interface
- `RestoreService` - Restore operations interface
- `DatabaseExporter/Importer` - Database operation interfaces
- `ArchiveManager` - File compression and archiving
- `ValidationService` - Backup validation interface
- `StorageManager` - File storage management interface

### Storage Management (`storage.ts`)
- `BackupStorageManager` - Handles file system operations
- Directory structure creation and management
- Backup file organization and cleanup
- Metadata file handling

### Utilities (`utils.ts`)
- `BackupUtils` - Static utility methods
- Checksum generation (SHA-256)
- Metadata creation and validation
- File size and duration formatting
- Backup ID generation and validation

### Configuration (`config.ts`)
- `BackupConfigManager` - Configuration management
- Default settings for backup operations
- Configurable compression, retention, and scheduling
- Performance and validation settings

## File Storage Structure

The backup system creates the following directory structure:

```
backups/
├── backup-{timestamp}-{id}.backup     # Compressed backup archives
├── metadata/
│   ├── backup-{id}.json              # Backup metadata files
│   └── checksums.json                # Integrity checksums
└── logs/
    ├── backup-{date}.log             # Backup operation logs
    └── restore-{date}.log            # Restore operation logs
```

## Usage

```typescript
import { 
  BackupStorageManager, 
  BackupUtils, 
  BackupConfigManager,
  BackupOptions 
} from '@/lib/backup'

// Initialize storage manager
const storage = new BackupStorageManager()
await storage.ensureBackupDirectory()

// Generate backup ID
const backupId = storage.generateBackupId()

// Create backup metadata
const metadata = BackupUtils.generateMetadata(backupId, 'Manual backup')

// Configuration management
const configManager = new BackupConfigManager()
const config = configManager.getConfig()
```

## Error Handling

The system provides specific error classes:
- `BackupError` - General backup operation errors
- `RestoreError` - Restore operation errors  
- `ValidationError` - Backup validation errors
- `StorageError` - File storage errors

## Next Steps

This infrastructure provides the foundation for:
1. Database export/import services (Task 2)
2. API endpoints (Task 3)
3. Restore functionality (Task 4)
4. User interface components (Task 5)
5. Automated scheduling (Task 6)
6. Monitoring and logging (Task 7)