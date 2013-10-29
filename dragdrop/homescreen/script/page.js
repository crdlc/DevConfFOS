'use strict';
var owd = window.owd || {};

if (!owd.Icon) {

  owd.Icon = function(descriptor) {
    this.descriptor = descriptor;
    this.id = descriptor.name;
    this.type = 'owd.Icon';
  }

  owd.Icon.prototype = {
    render: function(target) {
      this.node = document.createElement('li');

      var name = this.id;

      // Icon container
      this.icon = document.createElement('div');
      this.icon.className = 'icon';

      // Image
      var img = document.createElement('img');
      img.src = 'resources/images/' + name + '.png';
      this.icon.appendChild(img);

      // Label
      var label = document.createElement('span');
      label.textContent = name;
      this.icon.appendChild(label);

      this.node.appendChild(this.icon);

      // Shader
      var shader = document.createElement('div');
      shader.className = 'shader';
      shader.dataset.uuid = name;
      this.node.appendChild(shader);

      // Menu button
      var menu = document.createElement('span');
      menu.className = 'options';
      menu.dataset.menu = name;
      this.node.appendChild(menu);

      // ID element
      this.node.dataset.uuid = name;

      target.appendChild(this.node);
    },

    getNode: function() {
      return this.node;
    },

    click: function() {
      console.log('Clicked: ' + this.id);
    },

    newDragabbleElem: function(container) {
      this.draggableElem = this.icon.cloneNode();
      this.draggableElem.className = 'draggableElem';

      var px = 'px';
      var style = this.draggableElem.style;
      style.left = this.node.offsetLeft + px;
      style.top = this.node.offsetTop + px;

      this.node.dataset.dragging = 'true';
      container.appendChild(this.draggableElem);

      return this.draggableElem;
    },

    removeDragabbleElem: function(container) {
      delete this.node.dataset.dragging;
      delete this.node.parentNode.dataset.mode;
      container.removeChild(this.draggableElem);
    }
  }

}

if (!owd.Page) {

  owd.Page = function() {
    this.licons = {};
  }

  owd.Page.prototype = {

    vars: {
      transitionend: 'transitionend',
      right: 'right',
      left: 'left',
      center: 'center',
      indexOf: Array.prototype.indexOf
    },

    length: 0,

    render: function(apps, target) {
      this.container = target;
      var len = apps.length;
      this.olist = document.createElement('ol');
      for (var i = 0; i < len; i++) {
        var app = apps[i];
        if (app.type === 'owd.Icon') {
          this.appendIcon(app);
        } else {
          this.install(app);
        }
      }
      target.appendChild(this.olist);
    },

    onTransitionEnd: function() {
      this.container.dataset.transitioning = '';
      var that = this;
      this.container.addEventListener(this.vars.transitionend, function tEndListener() {
        delete that.container.dataset.transitioning;
        that.container.removeEventListener(that.vars.transitionend, tEndListener);
      });
    },

    moveToRight: function() {
      this.onTransitionEnd();
      this.container.style.MozTransform = 'translateX(100%)';
    },

    moveToLeft: function() {
      this.onTransitionEnd();
      this.container.style.MozTransform = 'translateX(-100%)';
    },

    moveToCenter: function() {
      this.onTransitionEnd();
      this.container.style.MozTransform = 'translateX(0)';
    },

    moveTo: function(x) {
      this.container.style.MozTransform = 'translateX(' + x + 'px)';
    },

    install: function(app) {
      var icon = new owd.Icon(app);
      icon.render(this.olist);
      this.licons[icon.id] = icon;
      this.length++;
    },

    indexOf: function(node) {
      return this.vars.indexOf.call(this.olist.childNodes, node);
    },

    getIcon: function(element) {
      return this.licons[element.dataset.uuid];
    },

    drop: function(origin, target) {
      var oNode = this.licons[origin].getNode();
      var tNode = this.licons[target].getNode();
      var targetIndex = this.indexOf(tNode);
      if (targetIndex >= 0) {
        if (this.indexOf(oNode) > targetIndex) {
          // backwards
          this.olist.insertBefore(oNode, tNode);
        } else {
          // upwards
          this.olist.insertBefore(oNode, tNode.nextSibling);
        }
      }
    },

    click: function(node) {
      var id = node.dataset.uuid;
      if (id) {
        this.licons[id].click();
      }
    },

    prependIcon: function(icon) {
      var len = this.length;
      if (len > 0) {
        this.olist.insertBefore(icon.getNode(), this.olist.firstChild);
      } else {
        this.olist.appendChild(icon.getNode());
      }
      this.licons[icon.id] = icon;
      this.length++;
    },

    appendIcon: function(icon) {
      this.olist.appendChild(icon.getNode());
      this.licons[icon.id] = icon;
      this.length++;
    },

    popIcon: function() {
      var icon = this.getLastIcon();
      this.remove(icon);
      return icon;
    },

    getLastIcon: function() {
      return this.licons[this.olist.lastChild.dataset.uuid];
    },

    remove: function(app) {
      var icon = app;
      if (app.type !== 'owd.Icon') {
        // This is a moz app
        icon = this.licons[app.name];
      }
      this.olist.removeChild(icon.getNode());
      delete this.licons[icon.id];
      this.length--;
    },

    destroy: function() {
      delete this.licons;
      this.container.parentNode.removeChild(this.container);
    }
  }
}