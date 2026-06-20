import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { TrainingProvider } from './store/TrainingContext';
import './app.scss';

function App(props) {
  useEffect(() => {});
  useDidShow(() => {});
  useDidHide(() => {});

  return (
    <TrainingProvider>
      {props.children}
    </TrainingProvider>
  );
}

export default App;
