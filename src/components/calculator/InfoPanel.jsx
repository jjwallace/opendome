

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
import bolts from './img/bolt.png';
import dome from './img/iso-dome.png';
import domeTop from './img/iso-dome-top.png';
import wood from './img/wood.png';

var totalMaterial = 0;

export default class InfoPanel extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="infoPanel panel">
                <img src={bolts} alt="Bolts" width="100%"/>
				<img src={domeTop} alt="Dome Top View" width="100%"/>
				<img src={wood} alt="Bolts"/>
			</div>
		);
	}
}