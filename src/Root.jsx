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
import { slide as Menu } from 'react-burger-menu'

//STYLE
import main from './assets/main.css';
import menu from './assets/menu.css';

import dome from './components/calculator/img/iso-dome.png';

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
              <Menu pageWrapId={ "page-wrap" } outerContainerId={ "main" } customCrossIcon={ false } disableAutoFocus >
              <img src={dome} alt="Bolts" width="100%"/>
                <a id="home" className="bm-item" href="/">Home</a>
                <a id="about" className="bm-item" href="/about">About</a>
                <a id="contact" className="bm-item" href="/contact">Contact</a>
                <a onClick={ this.showSettings } className="bm-item" href="">Settings</a>
              </Menu>
              <Container>
                  <Calculator/>
                  
              </Container>
                
            </div>
        </BrowserRouter>
      )
    }
  }
  