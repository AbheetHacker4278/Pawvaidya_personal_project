import fs from 'fs';
import path from 'path';
import emergencyRequestModel from '../models/emergencyRequestModel.js';
import emergencyPaymentDueModel from '../models/emergencyPaymentDueModel.js';
import emergencyDoctorAvailabilityModel from '../models/emergencyDoctorAvailabilityModel.js';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Creates a complete database backup of the emergency ecosystem models
 * @returns {Promise<string>} Path of the created backup file
 */
export const createEcosystemBackup = async () => {
  try {
    console.log('[Backup System] Initiating complete backup of emergency ecosystem...');
    
    const [requests, dues, availabilities] = await Promise.all([
      emergencyRequestModel.find({}),
      emergencyPaymentDueModel.find({}),
      emergencyDoctorAvailabilityModel.find({})
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        requests,
        dues,
        availabilities
      }
    };

    const fileName = `emergency_backup_${Date.now()}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`[Backup System] Emergency database backup created successfully: ${filePath}`);
    return filePath;
  } catch (err) {
    console.error('[Backup System] Backup failed:', err.message);
    throw err;
  }
};

/**
 * Restores the emergency ecosystem models from a specified backup JSON file
 * @param {string} fileName Name of the backup file inside /backups
 */
export const restoreEcosystemFromBackup = async (fileName) => {
  try {
    const filePath = path.join(BACKUP_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found at path: ${filePath}`);
    }

    console.log(`[Backup System] Restoring emergency database from backup file: ${filePath}...`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const backup = JSON.parse(fileContent);

    const { requests, dues, availabilities } = backup.data;

    // Begin restoring with complete collection purging for clean replacements
    await Promise.all([
      emergencyRequestModel.deleteMany({}),
      emergencyPaymentDueModel.deleteMany({}),
      emergencyDoctorAvailabilityModel.deleteMany({})
    ]);

    console.log('[Backup System] Purged existing collections. Inserting restored documents...');

    await Promise.all([
      requests.length > 0 ? emergencyRequestModel.insertMany(requests) : Promise.resolve(),
      dues.length > 0 ? emergencyPaymentDueModel.insertMany(dues) : Promise.resolve(),
      availabilities.length > 0 ? emergencyDoctorAvailabilityModel.insertMany(availabilities) : Promise.resolve()
    ]);

    // Rebuild indexes
    await Promise.all([
      emergencyRequestModel.syncIndexes(),
      emergencyPaymentDueModel.syncIndexes(),
      emergencyDoctorAvailabilityModel.syncIndexes()
    ]);

    console.log('[Backup System] Restore operation and index syncing completed successfully.');
    return true;
  } catch (err) {
    console.error('[Backup System] Restore failed:', err.message);
    throw err;
  }
};
