var owd = window.owd || {};

if(!owd.Homescreen) {

  (function(doc) {
    'use strict';

    var apps = [
      {name: 'calculator'}, {name: 'clock'}, {name: 'contacts'}, {name: 'dialer'},
      {name: 'ereader'}, {name: 'facebook'}, {name: 'gallery'}, {name: 'jajah'},
      {name: 'maps'}, {name: 'messages'}, {name: 'penguin'}, {name: 'puzzle'},
      {name: 'settings'}, {name: 'torus'}, {name: 'towerjelly'}, {name: 'twitter'},
      {name: 'youtube'},
      
      {name: 'calculator'}, {name: 'clock'}, {name: 'contacts'}, {name: 'dialer'},
      {name: 'ereader'}, {name: 'facebook'}, {name: 'gallery'}, {name: 'jajah'},
      {name: 'maps'}, {name: 'messages'}, {name: 'penguin'}, {name: 'puzzle'},
      {name: 'settings'}, {name: 'torus'}, {name: 'towerjelly'}, {name: 'twitter'},
      {name: 'youtube'}
    ];
    
    owd.GridManager.init('.apps', '.counter', apps);
    
    owd.Homescreen = {
      install: function(app) {
        owd.GridManager.add(app);
      },
      
      uninstall: function(app) {
        owd.GridManager.remove(app);
      },
      
      setMode: function(mode) {
        owd.GridManager.setMode(mode);
      }
    };

  })(document);
  
}