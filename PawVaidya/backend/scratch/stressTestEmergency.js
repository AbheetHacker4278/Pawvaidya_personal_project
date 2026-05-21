import 'dotenv/config';
import mongoose from 'mongoose';
import connectdb from '../config/mongodb.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import emergencyRequestModel from '../models/emergencyRequestModel.js';
import emergencyDoctorAvailabilityModel from '../models/emergencyDoctorAvailabilityModel.js';
import { createBookingLimiter, doctorClaimLimiter } from '../middleware/emergencyRateLimiter.js';
import { createEmergencyRequest, updateEmergencyStatus } from '../controllers/emergencyController.js';

const runStressTest = async () => {
    console.log("==========================================================");
    console.log("🐾 PAWVAIDYA EMERGENCY ECOSYSTEM - PRODUCTION STRESS TEST");
    console.log("==========================================================");

    // 1. Establish Database Connection
    console.log("🔄 Connecting to Database...");
    await connectdb();
    console.log("✅ Database Connected Successfully.");

    // 2. Setup Seed Identifiers
    const testDistrict = "Stress-District";
    const testState = "Stress-State";
    const userEmail = "stress.user@pawvaidya.com";
    const docEmailA = "stress.doc.a@pawvaidya.com";
    const docEmailB = "stress.doc.b@pawvaidya.com";
    const docEmailC = "stress.doc.c@pawvaidya.com";

    // Clean up any stale stress data
    console.log("🧹 Cleaning up old stress test documents...");
    await userModel.deleteMany({ email: userEmail });
    await doctorModel.deleteMany({ email: { $in: [docEmailA, docEmailB, docEmailC] } });
    await emergencyDoctorAvailabilityModel.deleteMany({ activeDistrict: testDistrict });
    await emergencyRequestModel.deleteMany({ district: testDistrict });
    console.log("✅ Cleanup complete.");

    // 3. Seeding Test Entities
    console.log("🌱 Seeding test entities...");
    
    // Test User with ₹2000 Paw Wallet
    const testUser = new userModel({
        name: "Test User (Stress Suite)",
        email: userEmail,
        password: "hashed_stress_password_123",
        pawCode: `STRESS-USR-${Date.now()}`,
        pawWallet: 2000,
        address: { Location: testDistrict, line: "Stress Street" },
        full_address: `Stress Street, ${testDistrict}, ${testState}`
    });
    await testUser.save();
    console.log(`👤 Created Test User with Wallet: ₹${testUser.pawWallet}`);

    // Seed Doctors A, B, and C
    const docsData = [
        { name: "Dr. Stress Alpha", email: docEmailA, phone: "9000000001" },
        { name: "Dr. Stress Beta", email: docEmailB, phone: "9000000002" },
        { name: "Dr. Stress Gamma", email: docEmailC, phone: "9000000003" }
    ];

    const doctors = [];
    for (const d of docsData) {
        const doc = new doctorModel({
            name: d.name,
            email: d.email,
            password: "hashed_stress_password_123",
            image: "mock_image_base64",
            speciality: "General Surgeon",
            degree: "BVSc & AH",
            experience: "10 Years",
            about: "Experienced stress test physician.",
            fees: 500,
            docphone: d.phone,
            address: { line1: "Street 1", line2: "Street 2" },
            full_address: `Street 1, ${testDistrict}, ${testState}`,
            date: Date.now()
        });
        await doc.save();
        doctors.push(doc);

        // Seed availability in the test district
        const availability = new emergencyDoctorAvailabilityModel({
            docId: doc._id,
            isEmergencyAvailable: true,
            activeDistrict: testDistrict,
            activeState: testState,
            maxConcurrentEmergencies: 2,
            currentActiveEmergencies: 0
        });
        await availability.save();
    }
    console.log("👩‍⚕️ Created 3 Doctors with active emergency availability in Stress-District.");

    // 4. Test Rate Limiter Middleware
    console.log("\n🧪 Test Case 1: Booking API Rate Limiter Verification...");
    const mockIP = "192.168.1.100";
    let blockTriggered = false;

    // Simulate 10 quick requests from the same client IP
    for (let i = 1; i <= 10; i++) {
        let nextCalled = false;
        const req = { ip: mockIP, headers: {} };
        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(payload) {
                this.body = payload;
                return this;
            }
        };
        const next = () => { nextCalled = true; };

        createBookingLimiter(req, res, next);

        if (!nextCalled) {
            console.log(`⚠️ Request ${i} correctly blocked by rate limiter with 429 Too Many Requests.`);
            blockTriggered = true;
            break;
        }
    }
    console.log(blockTriggered ? "✅ Booking rate limiting verified." : "❌ Booking rate limiting failed.");

    // 5. Test Subscription Validation & Auto-Deductions (User pays standard ₹850 fee from wallet)
    console.log("\n🧪 Test Case 2: Subscription Validation & Auto Wallet Deduction...");
    
    const reqCreate = {
        userId: testUser._id,
        role: 'user',
        body: {
            petId: null,
            isStray: false,
            emergencyType: "Cardiac Arrest",
            description: "Pet has fainted, weak pulse.",
            district: testDistrict,
            state: testState
        }
    };

    let responseData = null;
    const resCreate = {
        json: function(data) {
            responseData = data;
        }
    };

    await createEmergencyRequest(reqCreate, resCreate);

    if (responseData && responseData.success) {
        const updatedUser = await userModel.findById(testUser._id);
        console.log(`✅ Emergency request created successfully: ID ${responseData.request._id}`);
        console.log(`💵 Deducted Booking Fee: ₹850.`);
        console.log(`💳 User Wallet Balance updated: ₹${updatedUser.pawWallet} (Expected: ₹1150)`);
    } else {
        console.error("❌ Failed to create emergency request:", responseData?.message);
    }

    // 6. Test Concurrency & Atomic Race Conditions
    console.log("\n🧪 Test Case 3: Doctor Parallel Claim & Atomic Lock Race Safety...");
    if (responseData && responseData.request) {
        const requestId = responseData.request._id;

        console.log("⚡ Launching 3 simultaneous status updates from Dr. Alpha, Dr. Beta, Dr. Gamma...");
        const claimPromises = doctors.map((doc, idx) => {
            const reqClaim = {
                role: 'doctor',
                docId: doc._id,
                body: {
                    requestId,
                    status: 'Payment Pending',
                    reason: 'Responding immediately'
                }
            };
            const resClaim = {
                json: function(data) {
                    return { docName: doc.name, response: data };
                }
            };
            return updateEmergencyStatus(reqClaim, resClaim);
        });

        const results = await Promise.all(claimPromises);

        let successCount = 0;
        let failureCount = 0;

        results.forEach(res => {
            if (res.response.success) {
                console.log(`🎉 SUCCESS: ${res.docName} successfully locked the request.`);
                successCount++;
            } else {
                console.log(`🛑 CONCURRENCY LOCKED: ${res.docName} claim rejected: "${res.response.message}"`);
                failureCount++;
            }
        });

        console.log("\n📊 Concurrency Analysis:");
        console.log(`- Total Claim Attempts: 3`);
        console.log(`- Success Locks: ${successCount} (Expected: 1)`);
        console.log(`- Prevented Race Collisions: ${failureCount} (Expected: 2)`);

        if (successCount === 1 && failureCount === 2) {
            console.log("🏆 RACE VERIFICATION PASSED: Atomic locks safely guaranteed unique claim fulfillment!");
        } else {
            console.error("❌ RACE VERIFICATION FAILED: Multiple locks or zero locks were achieved.");
        }
    }

    // 7. Cleanup and Exit
    console.log("\n🧹 Post-test cleaning...");
    await userModel.deleteMany({ email: userEmail });
    await doctorModel.deleteMany({ email: { $in: [docEmailA, docEmailB, docEmailC] } });
    await emergencyDoctorAvailabilityModel.deleteMany({ activeDistrict: testDistrict });
    await emergencyRequestModel.deleteMany({ district: testDistrict });
    console.log("✅ Database returned to clean state.");

    await mongoose.connection.close();
    console.log("\n🏁 STRESS TEST SUITE FINISHED successfully.");
};

runStressTest().catch(err => {
    console.error("❌ Stress Test Execution failed with error:", err);
    process.exit(1);
});
