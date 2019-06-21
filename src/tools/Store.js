//LIB
import { action, autorun, observable, computed, toJS } from 'mobx';
import { onError } from 'mobx-react';

//SRC
//import Brain from '../Brain';

class MainStore {
  @observable
  data = [
    {
      id: 0, 
  ];
  
  @action
  addData(node) {

    return true;
  }
}

const store = (window.store = new MainStore());

autorun(() => {
  console.log('STORE:', store);
});

onError(error => {
  console.log('STORE ERROR:', error);
});

export default store;