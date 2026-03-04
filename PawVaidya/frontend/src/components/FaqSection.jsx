import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

const FaqCard = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex justify-between items-center gap-4 focus:outline-none"
      >
        <h3 className="text-lg font-semibold text-gray-800">
          {question}
        </h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-green-600 transition-transform duration-300" />
        ) : (
          <ChevronDown className="w-5 h-5 text-green-600 transition-transform duration-300" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="p-6 pt-0 text-gray-600">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FaqSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFaqs, setFilteredFaqs] = useState(faqData);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = {
    all: 'All Questions',
    health: 'Health & Wellness',
    behavior: 'Behavior & Training',
    care: 'General Care',
  };

  useEffect(() => {
    const filtered = faqData.filter((faq) => {
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (selectedCategory === 'all') return matchesSearch;
      
      const categoryMatches = {
        health: ['vet', 'pain', 'vaccinations', 'teeth', 'fleas', 'ticks'],
        behavior: ['bark', 'anxiety', 'stressed', 'entertained', 'separation'],
        care: ['feed', 'bathe', 'exercise', 'nails', 'pet-proof', 'weather'],
      };
      
      const matchesCategory = categoryMatches[selectedCategory]?.some(keyword =>
        faq.question.toLowerCase().includes(keyword) || 
        faq.answer.toLowerCase().includes(keyword)
      );
      
      return matchesSearch && matchesCategory;
    });
    
    setFilteredFaqs(filtered);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16 space-y-8">
        <h1 className="text-4xl font-bold text-green-700 mb-4 relative inline-block">
          Pet Care FAQ 🐾
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full"></div>
        </h1>
        
        <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
          Find answers to common questions about pet care and wellness.
        </p>

        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${
                selectedCategory === key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaqs.map((faq, index) => (
          <div
            key={index}
            className="transform hover:-translate-y-1 transition-all duration-300 opacity-0 animate-fade-in"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'forwards',
            }}
          >
            <FaqCard
              question={faq.question}
              answer={faq.answer}
            />
          </div>
        ))}
      </div>

      {filteredFaqs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">
            No FAQs found matching your search. Try adjusting your search terms.
          </p>
        </div>
      )}
    </div>
  );
};

// FAQ Data with proper case formatting
const faqData = [
  {
    question: "What vaccinations does my pet need?",
    answer: "Essential vaccines for dogs include rabies, distemper, and parvovirus. For cats, rabies, feline leukemia, and FVRCP (feline distemper) are commonly recommended. Your vet can tailor a vaccination plan based on your pet's lifestyle and environment."
  },
  {
    question: "What should I do if my pet has fleas or ticks?",
    answer: "Start with a vet-recommended flea or tick treatment. Clean your pet's bedding and vacuum your home thoroughly to remove pests. In severe cases, you may need professional pest control. Preventative treatments are key to keeping fleas and ticks away."
  },
  {
    question: "Why does my dog bark so much?",
    answer: "Dogs can bark for various reasons due to boredom, anxiety, excitement, or to alert you. You should definitely identify the trigger first. Keep your dog mentally and physically stimulated with toys, walks, and training. If anxiety causes it, you should consult a vet or professional trainer."
  },
  {
    question: "How can I tell if my cat is stressed?",
    answer: "Cats can express stress in subtle ways such as hiding, over-grooming, or changes in appetite. Create a calm, safe space for them, minimize changes in their environment, and consider using calming sprays or pheromones."
  },
  {
    question: "What are the signs of separation anxiety in pets?",
    answer: "Pets with separation anxiety may chew destructively, howl, or pace when left alone. Gradual training, calming collars, or interactive toys can help. If the issue persists, a vet or animal behaviorist can offer additional solutions."
  },
  {
    question: "How can I tell if my pet is in pain?",
    answer: "Pets are skilled at hiding discomfort, but signs like limping, whining, reduced appetite, or avoiding touch might indicate pain. If you notice unusual behavior, schedule a vet visit—better to be cautious."
  },
  {
    question: "What should I feed my pet?",
    answer: "Choose a balanced diet appropriate for your pet's age, breed, and health. High-quality commercial food is usually a safe choice. If you prefer homemade meals, consult a vet or pet nutritionist to ensure the diet meets their nutritional needs."
  },
  {
    question: "How much exercise does my pet need?",
    answer: "Exercise requirements vary. Most dogs thrive with 30 minutes to 2 hours of activity daily, while cats enjoy short, playful bursts. Adjust based on your pet's age, breed, and health, and monitor for signs of fatigue or overexertion."
  },
  {
    question: "How often should I bathe my pet?",
    answer: "Dogs generally need a bath every month unless they get especially dirty. Cats usually handle grooming themselves but may need a bath if they get into something sticky. Always use pet-specific shampoos."
  },
  {
    question: "How can I take care of my pet's teeth?",
    answer: "Brush your pet's teeth a few times a week with pet-safe toothpaste. Dental treats and chew toys can help reduce plaque. Regular dental checkups with your vet are essential to catching any issues early."
  },
  {
    question: "What should I do if my pet's nails are too long?",
    answer: "If you hear their nails clicking on the floor, it's time for a trim. Use pet nail clippers or grinders and be careful not to cut into the quick. If you're unsure, a vet or groomer can help."
  },
  {
    question: "How do I pet-proof my home?",
    answer: "Store chemicals, small objects, and toxic plants out of reach. Hide electrical cords and secure windows and balconies. Use covered trash cans and ensure your home is free of hazards that curious pets might explore."
  },
  {
    question: "How can I keep my pet safe during extreme weather?",
    answer: "In hot weather, keep your pet hydrated and limit outdoor activities during peak sun hours. In the cold, provide a warm indoor space and consider pet-safe boots or jackets for short-haired breeds. Monitor their comfort closely."
  },
  {
    question: "How do I keep my pet entertained when I'm away?",
    answer: "Interactive toys, puzzle feeders, and chew toys are great for keeping pets occupied. Calming music or a pet camera with a microphone can help them feel less alone. A morning play session or walk can also tire them out before you leave."
  }
];

// Add the fade-in animation to your global CSS or Tailwind config
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
`;
document.head.appendChild(style);

export default FaqSection;