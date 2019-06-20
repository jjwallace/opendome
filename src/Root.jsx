//LIB
import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

import { Container, Row, Col } from 'reactstrap';

//STORE
// import store from './tools/Store.js';
// import { toJS } from "mobx";
// import { observer } from "mobx-react";

//COMPONENTS
import DomeCalculator from './components/calculator/DomeCalculator';
import Calculator from './state/Calculator';


//STYLE
import main from './assets/main.css';

export default class Root extends React.Component {
    constructor(props, context) {
      super(props, context)
          
      this.state = {
        user: null,
      }
    }
      
      componentWillUpdate(){
          
      }
  
    render() {
          //var data = toJS(this.state.data);
    console.log('ONLINE');

      return (
        <BrowserRouter>
            <div className='main'>
                  <Container>
                      <Calculator/>
                      
                  </Container>
                
            </div>
        </BrowserRouter>
      )
    }
  }
  