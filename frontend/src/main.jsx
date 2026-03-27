import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import './index.css';
import './styles/AdminGlobal.css';
import { ValidationProvider } from './context/ValidationContext.jsx';
import { Provider } from 'react-redux';
import store from './store';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ValidationProvider>
          <App />
        </ValidationProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
