import savedCardModel from '../models/savedCardModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import { deleteCache } from '../utils/cacheUtils.js';
import crypto from 'crypto';

// Luhn Algorithm Validation based on the provided card validation method
const validateLuhn = (cardNumber) => {
    // Remove spaces and non-digits
    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (!cleanNumber || cleanNumber.length < 13 || cleanNumber.length > 19) {
        return false;
    }
    
    const digits = cleanNumber.split('').map(Number);
    let sum = 0;
    const isEven = digits.length % 2 === 0;

    for (let i = 0; i < digits.length; i++) {
        let digit = digits[i];
        
        // Double every second digit starting from the first (0-indexed even positions for even length, odd positions for odd length)
        if ((i % 2 === 0) === isEven) {
            digit *= 2;
            // If result is greater than 9, add the digits (e.g. 16 -> 1 + 6 = 7)
            if (digit > 9) {
                digit = Math.floor(digit / 10) + (digit % 10);
            }
        }
        sum += digit;
    }
    
    // If the total ends in zero, it's a valid card number
    return sum % 10 === 0;
};

// Detect card brand automatically from number prefix
const getCardType = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cleanNumber)) return 'Mastercard';
    if (/^(34|37)/.test(cleanNumber)) return 'American Express';
    if (/^65/.test(cleanNumber) || /^6011/.test(cleanNumber) || /^(64[4-9])/.test(cleanNumber) || /^(622126|622925)/.test(cleanNumber)) return 'Discover';
    if (/^(30[0-5]|36|38|39)/.test(cleanNumber)) return 'Diners Club';
    if (/^(352[89]|35[3-8][0-9])/.test(cleanNumber)) return 'JCB';
    if (/^(5018|5020|5038|6304|6759|6761|6763)/.test(cleanNumber)) return 'Switch/Solo';
    if (/^(5019)/.test(cleanNumber)) return 'Dankort';
    if (/^(508|60|65|81|82)/.test(cleanNumber)) return 'RuPay';
    return 'Other';
};

// Save a card
export const saveCard = async (req, res) => {
    try {
        const { cardNumber, cardHolderName, expiryMonth, expiryYear } = req.body;
        const userId = req.userId;

        if (!cardNumber || !cardHolderName || !expiryMonth || !expiryYear) {
            return res.json({ success: false, message: "All fields are required" });
        }

        // 1. Run Luhn validation
        if (!validateLuhn(cardNumber)) {
            return res.json({ success: false, message: "Invalid card number (Luhn validation failed)" });
        }

        // 2. Validate Expiry Date
        const monthNum = Number(expiryMonth);
        const yearNum = Number(expiryYear);
        const currentYear = new Date().getFullYear() % 100; // e.g. 26
        const currentMonth = new Date().getMonth() + 1;

        if (monthNum < 1 || monthNum > 12) {
            return res.json({ success: false, message: "Invalid expiry month" });
        }

        if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
            return res.json({ success: false, message: "Card has expired" });
        }

        // 3. Determine owner type (User or Doctor)
        let ownerType = 'user';
        let owner = await userModel.findById(userId);
        if (!owner) {
            owner = await doctorModel.findById(userId);
            ownerType = 'doctor';
        }
        if (!owner) {
            return res.json({ success: false, message: "Profile not found" });
        }

        const cleanNumber = cardNumber.replace(/\D/g, '');
        const maskedCardNumber = `**** **** **** ${cleanNumber.slice(-4)}`;
        const cardType = getCardType(cleanNumber);

        // 4. Prevent duplicate card saving
        const existingCard = await savedCardModel.findOne({
            ownerId: userId,
            cardNumber: maskedCardNumber,
            expiryMonth: monthNum,
            expiryYear: yearNum
        });

        if (existingCard) {
            return res.json({ success: false, message: "This card is already saved" });
        }

        // 5. Generate mock card token and save
        const cardToken = `tok_${crypto.randomBytes(8).toString('hex')}`;

        const newCard = new savedCardModel({
            ownerId: userId,
            ownerType,
            cardHolderName,
            cardNumber: maskedCardNumber,
            cardType,
            expiryMonth: monthNum,
            expiryYear: yearNum,
            cardToken
        });

        await newCard.save();

        res.json({
            success: true,
            message: "Card saved successfully",
            card: {
                id: newCard._id,
                cardHolderName: newCard.cardHolderName,
                cardNumber: newCard.cardNumber,
                cardType: newCard.cardType,
                expiryMonth: newCard.expiryMonth,
                expiryYear: newCard.expiryYear
            }
        });

    } catch (error) {
        console.error("Save Card Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// List saved cards
export const listCards = async (req, res) => {
    try {
        const userId = req.userId;
        const cards = await savedCardModel.find({ ownerId: userId }).select('-cardToken');
        res.json({ success: true, cards });
    } catch (error) {
        console.error("List Cards Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Delete a saved card
export const deleteCard = async (req, res) => {
    try {
        const { cardId } = req.params;
        const userId = req.userId;

        const card = await savedCardModel.findById(cardId);
        if (!card) {
            return res.json({ success: false, message: "Card not found" });
        }

        if (card.ownerId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        await savedCardModel.findByIdAndDelete(cardId);
        res.json({ success: true, message: "Card deleted successfully" });

    } catch (error) {
        console.error("Delete Card Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Direct Wallet/Philanthropy Wallet Top-up using Saved Card
export const topupWithSavedCard = async (req, res) => {
    try {
        const { cardId, cvv, amount } = req.body;
        const userId = req.userId;

        if (!cardId || !cvv || !amount) {
            return res.json({ success: false, message: "All fields are required" });
        }

        if (amount < 100) {
            return res.json({ success: false, message: "Minimum top-up is ₹100" });
        }

        // 1. Verify CVV format
        if (!/^\d{3,4}$/.test(cvv)) {
            return res.json({ success: false, message: "Invalid CVV format" });
        }

        // 2. Fetch Card and verify ownership
        const card = await savedCardModel.findById(cardId);
        if (!card) {
            return res.json({ success: false, message: "Saved card not found" });
        }

        if (card.ownerId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Unauthorized: Card does not belong to you" });
        }

        // 3. Increment Wallet balance based on Owner Type (User -> Paw Wallet, Doctor -> Philanthropy Wallet)
        let amountAdded = Number(amount);
        let currentBalance = 0;
        let responseMessage = "";

        if (card.ownerType === 'user') {
            const user = await userModel.findByIdAndUpdate(userId, {
                $inc: { pawWallet: amountAdded }
            }, { new: true });
            
            if (!user) {
                return res.json({ success: false, message: "User profile not found" });
            }
            
            await deleteCache(`user_profile_${userId}`);
            currentBalance = user.pawWallet;
            responseMessage = `Successfully added ₹${amountAdded} to Paw Wallet using saved card (${card.cardNumber})`;
        } else if (card.ownerType === 'doctor') {
            const doctor = await doctorModel.findByIdAndUpdate(userId, {
                $inc: { pawWallet: amountAdded }
            }, { new: true });
            
            if (!doctor) {
                return res.json({ success: false, message: "Doctor profile not found" });
            }
            
            await deleteCache(`doctor_profile_${userId}`);
            currentBalance = doctor.pawWallet;
            responseMessage = `Successfully added ₹${amountAdded} to Philanthropy Wallet using saved card (${card.cardNumber})`;
        }

        // 4. Generate mock Razorpay details for verification / reporting consistency
        const mockOrderId = `order_saved_card_${crypto.randomBytes(12).toString('hex')}`;
        const mockPaymentId = `pay_saved_card_${crypto.randomBytes(12).toString('hex')}`;

        res.json({
            success: true,
            message: responseMessage,
            wallet: currentBalance,
            paymentDetails: {
                orderId: mockOrderId,
                paymentId: mockPaymentId,
                amount: amountAdded,
                cardUsed: card.cardNumber,
                cardType: card.cardType
            }
        });

    } catch (error) {
        console.error("Saved Card Topup Error:", error);
        res.json({ success: false, message: error.message });
    }
};
