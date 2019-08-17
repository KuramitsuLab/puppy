import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter as Router, Route } from 'react-router-dom';

const queryParser = (query: string) =>
  query
    .substr(1)
    .split('&')
    .reduce((obj, v) => {
      const pair = v.split('=');
      obj[pair[0]] = pair[1];
      return obj;
    }, {});

ReactDOM.render(
  <Router>
    <Route render={props => <App qs={queryParser(props.location.search)} />} />
  </Router>,
  document.getElementById('root')
);
