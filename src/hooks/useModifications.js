import { useState } from 'react';

const useModifications = (initialCount = 4) => {
  const [remainingModifications, setRemainingModifications] = useState(initialCount);
  const [showExtraCreditsMessage, setShowExtraCreditsMessage] = useState(false);

  const handleModifyClick = () => {
    if (remainingModifications > 0) {
      setRemainingModifications(remainingModifications - 1);
    }
    
    if (remainingModifications <= 1) {
      setShowExtraCreditsMessage(true);
    }
  };

  const decrementModifications = () => {
    if (remainingModifications > 0) {
      setRemainingModifications(remainingModifications - 1);
    }
    
    if (remainingModifications <= 1) {
      setShowExtraCreditsMessage(true);
    }
  };

  return {
    remainingModifications,
    showExtraCreditsMessage,
    handleModifyClick,
    decrementModifications
  };
};

export default useModifications;
