import pollModel from '../models/pollModel.js';

// Create a new poll
const createPoll = async (req, res) => {
    try {
        const { question, options, target, category } = req.body;

        if (!question || !options || options.length < 2) {
            return res.json({ success: false, message: "Question and at least two options are required" });
        }

        const formattedOptions = options.map(opt => ({ text: opt, votes: 0 }));

        const newPoll = new pollModel({
            question,
            options: formattedOptions,
            target,
            category
        });

        await newPoll.save();
        res.json({ success: true, message: "Poll created successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all polls (for admin)
const getAllPolls = async (req, res) => {
    try {
        const polls = await pollModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, polls });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get active polls for users/doctors
const getActivePolls = async (req, res) => {
    try {
        const { target } = req.query; // 'user' or 'doctor'
        let query = { isActive: true };

        if (target) {
            query.target = { $in: [target, 'all'] };
        }

        const polls = await pollModel.find(query).sort({ createdAt: -1 });
        res.json({ success: true, polls });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Toggle poll status (isActive)
const togglePollStatus = async (req, res) => {
    try {
        const { pollId } = req.body;
        const poll = await pollModel.findById(pollId);
        if (!poll) {
            return res.json({ success: false, message: "Poll not found" });
        }

        poll.isActive = !poll.isActive;
        await poll.save();
        res.json({ success: true, message: `Poll ${poll.isActive ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete a poll
const deletePoll = async (req, res) => {
    try {
        const { pollId } = req.body;
        await pollModel.findByIdAndDelete(pollId);
        res.json({ success: true, message: "Poll deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Vote in a poll (Generic for both users and doctors if they hit this from admin or their respective apps)
const voteInPoll = async (req, res) => {
    try {
        let { pollId, optionIndex, userId, userType } = req.body;

        // If docId is provided by middleware, use it as userId
        if (req.body.docId && !userId) {
            userId = req.body.docId;
            userType = 'doctor';
        }

        const poll = await pollModel.findById(pollId);
        if (!poll) {
            return res.json({ success: false, message: "Poll not found" });
        }

        if (!poll.isActive) {
            return res.json({ success: false, message: "Poll is not active" });
        }

        // Check if user already voted
        const alreadyVoted = poll.votedBy.find(v => v.userId === userId);
        if (alreadyVoted) {
            return res.json({ success: false, message: "You have already voted in this poll" });
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.json({ success: false, message: "Invalid option" });
        }

        poll.options[optionIndex].votes += 1;
        poll.totalVotes += 1;
        poll.votedBy.push({ userId, userType, optionIndex });

        await poll.save();
        res.json({ success: true, message: "Vote cast successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { createPoll, getAllPolls, getActivePolls, togglePollStatus, deletePoll, voteInPoll };
