//LIB
import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

import { Container, Row, Col } from 'reactstrap';
import AutoResponsive from 'autoresponsive-react';

//STORE
// import store from './tools/Store.js';
// import { toJS } from "mobx";
// import { observer } from "mobx-react";

//COMPONENTS
import DomeCalculator from './../components/calculator/DomeCalculator';
import InfoPanel from './../components/calculator/InfoPanel';
import Title from './../components/calculator/Title';

//STYLE
//import css from './style.css';

var totalMaterial = 0;

export default class Calculator extends React.Component {
	constructor(props) {
		super(props);
    }
    
	render() {
		return (
			<div className="main-content">
				<Title/>
        <DomeCalculator/>
        <InfoPanel/>
			</div>
		);
	}
}