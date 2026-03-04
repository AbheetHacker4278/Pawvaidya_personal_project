import React from 'react';

const PasswordStrengthMeter = ({ password }) => {
  const calculateStrength = (pass) => {
    let strength = 0;
    //strength
    
    if (pass.length >= 8) strength += 25;
    if (pass.match(/[a-z]+/)) strength += 25;
    if (pass.match(/[A-Z]+/)) strength += 25;
    if (pass.match(/[0-9]+/)) strength += 12.5;
    if (pass.match(/[$@#&!]+/)) strength += 12.5;

    return Math.min(100, strength);
  };

  const getStrengthText = (strength) => {
    if (strength === 0) return ['Poor', 'bg-red-500'];
    if (strength <= 25) return ['Weak', 'bg-red-500'];
    if (strength <= 50) return ['Fair', 'bg-yellow-500'];
    if (strength <= 75) return ['Good', 'bg-blue-500'];
    return ['Strong', 'bg-green-500'];
  };

  const getSuggestion = (pass) => {
    const missing = [];
    if (!pass.match(/[A-Z]+/)) missing.push('uppercase');
    if (!pass.match(/[a-z]+/)) missing.push('lowercase');
    if (!pass.match(/[0-9]+/)) missing.push('number');
    if (!pass.match(/[$@#&!]+/)) missing.push('special character');
    if (pass.length < 8) missing.push('at least 8 characters');

    if (missing.length === 0) return "Great password! 🎉";
    return `Tip: Add ${missing.join(', ')} for a stronger password`;
  };

  const strength = calculateStrength(password);
  const [strengthText, colorClass] = getStrengthText(strength);

  return (
    <div className="w-full space-y-2">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-300`} 
          style={{ width: `${strength}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>Strength: {strengthText}</span>
        <span>{strength}%</span>
      </div>
      <p className="text-xs text-gray-500 italic">
        {getSuggestion(password)}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;