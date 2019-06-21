

//LIB
import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

//STORE
// import store from './tools/Store.js';
// import { toJS } from "mobx";
// import { observer } from "mobx-react";

//COMPONENTS
//import DomeCalculator from './components/calculator/DomeCalculator';

//STYLE
import css from './style.css';

//ASSETS
import dome from './img/iso-dome.png';

var totalMaterial = 0;

export default class Title extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		return (
			<div className="infoPanel panel">
				<img src={dome} alt="Bolts" width="100%"/>
			</div>
		);
	}
}