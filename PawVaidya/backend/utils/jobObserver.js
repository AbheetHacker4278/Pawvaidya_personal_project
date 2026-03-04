import backgroundJobModel from '../models/backgroundJobModel.js';

/**
 * Wraps a task with observation logic
 * @param {string} name Unique name of the job
 * @param {Function} task The async function to execute
 */
export const observeJob = async (name, task) => {
    const start = Date.now();

    // Update status to Running
    await backgroundJobModel.findOneAndUpdate(
        { name },
        { status: 'Running' },
        { upsert: true }
    );

    try {
        await task();
        const duration = Date.now() - start;

        await backgroundJobModel.findOneAndUpdate(
            { name },
            {
                status: 'Success',
                lastRun: new Date(),
                lastDuration: duration,
                $inc: { runCount: 1 },
                lastError: null
            }
        );
    } catch (error) {
        const duration = Date.now() - start;
        console.error(`Job [${name}] failed:`, error.message);

        await backgroundJobModel.findOneAndUpdate(
            { name },
            {
                status: 'Failure',
                lastRun: new Date(),
                lastDuration: duration,
                lastError: error.message,
                $inc: { runCount: 1 }
            }
        );
    }
};
