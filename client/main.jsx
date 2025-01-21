//import './routes';
import './css/summernote-lite.min.css';
import '../imports/api/methods';

import React from 'react';
import { Meteor } from 'meteor/meteor';
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from '/imports/ui/App';

const root = document.getElementById("react-root");
Meteor.startup(() => {
    ReactDOM.createRoot(root).render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
});
