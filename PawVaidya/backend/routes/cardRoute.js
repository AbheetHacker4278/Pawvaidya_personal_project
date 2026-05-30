import express from 'express';
import { saveCard, listCards, deleteCard, topupWithSavedCard } from '../controllers/cardController.js';
import authUserOrDoctor from '../middleware/authUserOrDoctor.js';

const cardRouter = express.Router();

// Save a card (validates via Luhn Algorithm)
cardRouter.post('/save', authUserOrDoctor, saveCard);

// List all saved cards for user/doctor
cardRouter.get('/list', authUserOrDoctor, listCards);

// Delete a saved card
cardRouter.delete('/delete/:cardId', authUserOrDoctor, deleteCard);

// Direct top-up (Paw Wallet or Philanthropy Wallet) using saved card
cardRouter.post('/topup-saved', authUserOrDoctor, topupWithSavedCard);

export default cardRouter;
