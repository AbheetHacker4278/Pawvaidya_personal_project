// Utility function to translate doctor specialities
export const translateSpeciality = (speciality, t) => {
  if (!speciality || !t) return speciality;
  
  const specialityMap = {
    'marineVet': t('doctorSpecialities.marineVet'),
    'smallAnimalVet': t('doctorSpecialities.smallAnimalVet'),
    'largeAnimalVet': t('doctorSpecialities.largeAnimalVet'),
    'militaryVet': t('doctorSpecialities.militaryVet'),
    'Marine vet': t('doctorSpecialities.marineVet'),
    'Small animal vet': t('doctorSpecialities.smallAnimalVet'),
    'Large animal vet': t('doctorSpecialities.largeAnimalVet'),
    'Military vet': t('doctorSpecialities.militaryVet'),
  };
  
  // If translation exists, return it; otherwise return original
  return specialityMap[speciality] || speciality;
};

