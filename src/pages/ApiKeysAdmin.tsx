import React from 'react';
import ApiKeysManager from '@/components/ApiKeysManager';

const ApiKeysAdmin = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <ApiKeysManager />
      </div>
    </div>
  );
};

export default ApiKeysAdmin;