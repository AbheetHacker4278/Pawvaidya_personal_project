import crypto from 'crypto';
import CSEmployee from '../models/csEmployeeModel.js';
import { v2 as cloudinary } from 'cloudinary';

// ─── DigiLocker Simulation Layer ─────────────────────────────────────────────
// Since DigiLocker's actual API requires government registration & OAuth approval,
// we simulate the flow while maintaining the same architecture that would work
// with real DigiLocker APIs. The flow is:
//   1. Agent initiates DigiLocker linking → gets redirect URI
//   2. Agent "authorizes" → callback stores access token
//   3. Agent fetches documents → simulated govt documents returned
// ─────────────────────────────────────────────────────────────────────────────

const DIGILOCKER_DOCS = {
    aadhaar: {
        docName: 'Aadhaar Card',
        issuer: 'UIDAI - Unique Identification Authority of India',
        icon: '🪪',
    },
    abha: {
        docName: 'ABHA Health ID (National Health ID)',
        issuer: 'National Health Authority (NHA)',
        icon: '🏥',
    },
    apaar: {
        docName: 'APAAR ID (Academic Bank of Credits)',
        issuer: 'Ministry of Education, Government of India',
        icon: '🎓',
    },
    pan: {
        docName: 'PAN Card',
        issuer: 'Income Tax Department, Government of India',
        icon: '💳',
    },
    driving_license: {
        docName: 'Driving License',
        issuer: 'Ministry of Road Transport & Highways',
        icon: '🚗',
    }
};

// Generate masked document numbers
const generateMaskedNumber = (type, employeeName) => {
    const seed = crypto.createHash('md5').update(employeeName + type).digest('hex');
    const last4 = seed.substring(0, 4).toUpperCase();
    switch (type) {
        case 'aadhaar':
            return `XXXX-XXXX-${last4.substring(0, 4).replace(/[A-F]/g, d => (parseInt(d, 16) % 10).toString())}`;
        case 'abha':
            return `${seed.substring(0, 2).replace(/[a-f]/g, d => (parseInt(d, 16) % 10).toString())}-${seed.substring(2, 6).replace(/[a-f]/g, d => (parseInt(d, 16) % 10).toString())}-${seed.substring(6, 10).replace(/[a-f]/g, d => (parseInt(d, 16) % 10).toString())}-${seed.substring(10, 14).replace(/[a-f]/g, d => (parseInt(d, 16) % 10).toString())}`;
        case 'apaar':
            return `APAAR-${last4}-XXXX`;
        case 'pan':
            return `XXXPX${last4.substring(0, 4).replace(/[a-f]/g, d => (parseInt(d, 16) % 10).toString())}X`;
        case 'driving_license':
            return `DL-${seed.substring(0, 2).toUpperCase()}-${last4}XXXX`;
        default:
            return `XXXX-${last4}`;
    }
};

// Generate a deterministic issued date based on doc type
const generateIssuedDate = (type) => {
    const dates = {
        aadhaar: '2019-03-15',
        abha: '2022-07-22',
        apaar: '2023-11-05',
        pan: '2018-01-10',
        driving_license: '2020-06-18',
    };
    return dates[type] || '2021-01-01';
};

// ─── POST /api/cs/digilocker/initiate ────────────────────────────────────────
// Initiates the DigiLocker OAuth flow. Returns a simulated authorization URL.
export const initiateDigilockerLink = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const employee = await CSEmployee.findById(employeeId);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        if (employee.digilocker?.linked) {
            return res.json({ success: false, message: 'DigiLocker is already linked to your account.' });
        }

        // In production, this would redirect to DigiLocker's OAuth page
        // For simulation, we generate a unique state token and return a callback URL
        const stateToken = crypto.randomBytes(32).toString('hex');

        // Store temporary state token for verification
        await CSEmployee.findByIdAndUpdate(employeeId, {
            'digilocker.accessToken': `pending:${stateToken}`
        });

        return res.json({
            success: true,
            message: 'DigiLocker authorization initiated.',
            authorizationUrl: `/api/cs/digilocker/callback?state=${stateToken}&employee=${employeeId}`,
            stateToken,
            // In production: redirectUrl would be DigiLocker's OAuth URL
            // e.g., https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize
        });
    } catch (error) {
        console.error('initiateDigilockerLink error:', error);
        res.json({ success: false, message: error.message });
    }
};

// ─── POST /api/cs/digilocker/callback ────────────────────────────────────────
// Handles the OAuth callback from DigiLocker. Simulates token exchange.
export const digilockerCallback = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { stateToken } = req.body;

        if (!stateToken) return res.json({ success: false, message: 'Missing state token.' });

        const employee = await CSEmployee.findById(employeeId);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        // Verify state token
        if (employee.digilocker?.accessToken !== `pending:${stateToken}`) {
            return res.json({ success: false, message: 'Invalid or expired authorization state.' });
        }

        // Simulate DigiLocker token exchange
        const accessToken = crypto.randomBytes(48).toString('hex');
        const maskedAadhaar = generateMaskedNumber('aadhaar', employee.name);

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(employeeId, {
            'digilocker.linked': true,
            'digilocker.accessToken': accessToken,
            'digilocker.linkedAt': new Date(),
            'digilocker.aadhaarNumber': maskedAadhaar,
            'digilocker.digilockerName': employee.name,
        }, { new: true }).select('-password -plainPassword -faceDescriptor -digilocker.accessToken');

        return res.json({
            success: true,
            message: 'DigiLocker linked successfully! You can now fetch your documents.',
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('digilockerCallback error:', error);
        res.json({ success: false, message: error.message });
    }
};

// ─── POST /api/cs/digilocker/fetch-documents ────────────────────────────────
// Fetches documents from DigiLocker. Simulates the API response.
export const fetchDigilockerDocuments = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { docTypes } = req.body; // Array of doc types to fetch, e.g. ['aadhaar', 'abha']

        const employee = await CSEmployee.findById(employeeId);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        if (!employee.digilocker?.linked) {
            return res.json({ success: false, message: 'DigiLocker is not linked. Please link your DigiLocker account first.' });
        }

        const requestedTypes = docTypes || Object.keys(DIGILOCKER_DOCS);
        const fetchedDocs = [];

        for (const type of requestedTypes) {
            const docInfo = DIGILOCKER_DOCS[type];
            if (!docInfo) continue;

            // Check if already fetched
            const existing = employee.digilockerDocuments?.find(d => d.docType === type);
            if (existing) {
                fetchedDocs.push(existing);
                continue;
            }

            // Generate simulated document
            const docNumber = generateMaskedNumber(type, employee.name);
            const issuedDate = generateIssuedDate(type);

            fetchedDocs.push({
                docType: type,
                docName: docInfo.docName,
                docNumber,
                issuer: docInfo.issuer,
                issuedDate,
                docData: '', // In production, would be the actual doc image/PDF
                fetchedAt: new Date(),
                verified: true,
            });
        }

        // Store the newly fetched documents
        const newDocs = fetchedDocs.filter(d => !employee.digilockerDocuments?.find(existing => existing.docType === d.docType));
        
        const updatedEmployee = await CSEmployee.findByIdAndUpdate(
            employeeId,
            { $push: { digilockerDocuments: { $each: newDocs } } },
            { new: true }
        ).select('-password -plainPassword -faceDescriptor -digilocker.accessToken');

        return res.json({
            success: true,
            message: `${newDocs.length} new document(s) fetched from DigiLocker.`,
            employee: updatedEmployee,
            fetchedDocuments: fetchedDocs,
        });
    } catch (error) {
        console.error('fetchDigilockerDocuments error:', error);
        res.json({ success: false, message: error.message });
    }
};

// ─── POST /api/cs/digilocker/unlink ──────────────────────────────────────────
// Unlinks DigiLocker from the employee account.
export const unlinkDigilocker = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const employee = await CSEmployee.findById(employeeId);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        if (!employee.digilocker?.linked) {
            return res.json({ success: false, message: 'DigiLocker is not linked to your account.' });
        }

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(employeeId, {
            'digilocker.linked': false,
            'digilocker.accessToken': '',
            'digilocker.linkedAt': null,
            'digilocker.aadhaarNumber': '',
            'digilocker.digilockerName': '',
            digilockerDocuments: []
        }, { new: true }).select('-password -plainPassword -faceDescriptor -digilocker.accessToken');

        return res.json({
            success: true,
            message: 'DigiLocker unlinked. All fetched documents have been removed.',
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('unlinkDigilocker error:', error);
        res.json({ success: false, message: error.message });
    }
};

// ─── GET /api/cs/digilocker/status ───────────────────────────────────────────
// Returns the current DigiLocker status and document list.
export const getDigilockerStatus = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const employee = await CSEmployee.findById(employeeId)
            .select('digilocker digilockerDocuments name');

        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        return res.json({
            success: true,
            digilocker: {
                linked: employee.digilocker?.linked || false,
                linkedAt: employee.digilocker?.linkedAt,
                aadhaarNumber: employee.digilocker?.aadhaarNumber,
                digilockerName: employee.digilocker?.digilockerName,
            },
            documents: employee.digilockerDocuments || [],
            availableDocTypes: Object.entries(DIGILOCKER_DOCS).map(([key, val]) => ({
                type: key,
                name: val.docName,
                issuer: val.issuer,
                icon: val.icon,
                alreadyFetched: !!employee.digilockerDocuments?.find(d => d.docType === key)
            }))
        });
    } catch (error) {
        console.error('getDigilockerStatus error:', error);
        res.json({ success: false, message: error.message });
    }
};
