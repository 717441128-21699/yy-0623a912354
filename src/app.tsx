import React from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { TrainingProvider } from './store/TrainingContext';
import './app.scss';

const App: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useDidShow(() => {});
  useDidHide(() => {});

  return (
    <TrainingProvider>
      {children}
    </TrainingProvider>
  );
};

export default App;
