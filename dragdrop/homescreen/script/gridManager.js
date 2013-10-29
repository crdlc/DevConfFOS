'use strict';
var owd = window.owd || {};

if (!owd.GridManager) {

  (function(doc) {
    'use strict';

    var container, counter, pages, startEvent = 'mousedown',
        moveEvent = 'mousemove', endEvent = 'mouseup', elementTarget, iniPosX, curPosX,
        winInnerWidth = window.innerWidth, threshold = window.innerWidth / 3,
        tapHoldTimeout = 400, tapHoldTimer, status, draggableIcon, draggableElem,
        limits, canceledTapListener = false, wmode;

    function init() {
      status = {
        target: undefined, // target element
        iCoords: {},       // inital position
        pCoords: {},       // previous position
        cCoords: {},       // current position
        pDir: undefined,   // last direction
        dropped: undefined // last dropped element
      };

      pages = {
        list: [],
        current: 0,
        total: 0
      };

      container.innerHTML = '';
    }

    /*
     * Creates the HTML-markup for a new page and it is appended as
     * child the main container
     */
    function createPageMarkup() {
      var ret = doc.createElement('div');
      container.appendChild(ret);
      return ret;
    }

    /*
     * Returns the coordinates x and y given an event. The returned object
     * is composed of two attributes named x and y
     *
     * @param {Object} the event object
     */
    function getCoordinates(evt) {
      if (evt.touches) {
        return {
          x: evt.touches[0].pageX,
          y: evt.touches[0].pageY
        }
      } else {
        return {
          x: evt.pageX,
          y: evt.pageY
        }
      }
    }

    /*
     * This method moves the pages following the gesture of the user
     *
     * @param {int} the difference between the last and initial position
     */
    function translate(movementX) {
      var currentPage = pages.current;

      pageHelper.getCurrent().moveTo(movementX);

      if (movementX > 0 && currentPage > 0) {
        pageHelper.getPrevious().moveTo(movementX - winInnerWidth);
      }

      if (movementX < 0 && currentPage < pages.total - 1) {
        pageHelper.getNext().moveTo(movementX + winInnerWidth);
      }
    }

    /*
     * This method is in charge of keeping the position of the
     * current page when the swipe is not enough for paginating
     */
    function keepPosition() {
      var currentPage = pages.current;

      pageHelper.getCurrent().moveToCenter();

      if (currentPage > 0) {
        pageHelper.getPrevious().moveToLeft();
      }

      if (currentPage < pages.total - 1) {
        pageHelper.getNext().moveToRight();
      }
    }

    /*
     * Navigates to next page
     */
    function goNext() {
      setTimeout(function() {
        pageHelper.getNext().moveToCenter();
        pageHelper.getCurrent().moveToLeft();
        pages.current++;
        updateCounter();
      }, 0);
    }

    /*
     * Navigates to previous page
     */
    function goPrev() {
      setTimeout(function() {
        pageHelper.getPrevious().moveToCenter();
        pageHelper.getCurrent().moveToRight();
        pages.current--;
        updateCounter();
      }, 0);
    }

    /*
     * It only updates the user interface with the information
     * about current page and total number of pages
     */
    function updateCounter() {
      counter.innerHTML = (pages.current + 1) + '/' + pages.total;
    }

    /*
     * It handles touchstart events, dragging and swiping
     *
     * @param{Object} Event object
     */
    function onStartEvent(evt) {
      if (evt.target.dataset.uuid) {
        tapHoldTimer = setTimeout(function() {
          keepPosition();
          owd.GridManager.setMode('edit');
          dragger.start(evt.target);
        }, tapHoldTimeout);
      }
      status.cCoords = status.iCoords = getCoordinates(evt);
      window.addEventListener(moveEvent, owd.GridManager);
      window.addEventListener(endEvent, owd.GridManager);
    }

    /*
     * It handles touchmove events, dragging and swiping
     *
     * @param{Object} Event object
     */
    function onMoveEvent(evt) {
      evt.preventDefault();
      status.pCoords = status.cCoords;
      status.cCoords = getCoordinates(evt);
      if (dragger.dragging) {
        draggableElem.style.MozTransform = 'translate('
          + (status.cCoords.x - status.iCoords.x) + 'px,'
          + (status.cCoords.y - status.iCoords.y) + 'px)';
        dragger.onMove(evt.target);
      } else {
        if (!canceledTapListener && Math.abs(status.cCoords.x - status.iCoords.x) > 5
          || Math.abs(status.cCoords.y - status.iCoords.y) > 5) {
          clearTimeout(tapHoldTimer);
          canceledTapListener = true;
        }
        translate(status.cCoords.x - status.iCoords.x);
      }
    }

    function isEditMode() {
      return wmode === 'edit';
    }

    /*
     * It handles touchend events, dragging and swiping
     *
     * @param{Object} Event object
     */
    function onEndEvent(evt) {
      clearTimeout(tapHoldTimer);
      window.removeEventListener(moveEvent, owd.GridManager);
      window.removeEventListener(endEvent, owd.GridManager);

      if (dragger.dragging) {
        canceledTapListener = false;
        dragger.stop();
      } else {
        var movementX = status.cCoords.x - status.iCoords.x;
        var absMovementX = Math.abs(movementX);
        if (absMovementX > threshold) {
          var currentPage = pages.current;
          if (movementX < 0 && currentPage < pages.total - 1) {
            // Swipe from right to left
            goNext();
          } else if (movementX > 0 && currentPage > 0) {
            // Swipe from left to right
            goPrev();
          } else {
            // Bouncing effect (first or last pages)
            keepPosition();
          }
        } else if (absMovementX === 0) {
          var dataset = status.target.dataset;
          if (dataset.uuid && !isEditMode()) {
            // Click on icon
            pageHelper.getCurrent().click(status.target);
          } else if (dataset.menu) {
            // Click on menu button
            owd.GridManager.remove({name: dataset.menu});
            checkEmptyPages();
          }
        } else {
          keepPosition();
        }
      }
    }

    /*
     * Renders a list of applications
     *
     * @param {Array} list of apps
     */
    function render(apps) {
      init();
      var slot = pageHelper.getMaxPerPage();
      var total = Math.ceil(apps.length / slot);

      for (var i = 1; i <= total; i++) {
        var from = (i - 1) * slot;
        var appsSubset = apps.slice(from, from + slot);
        pageHelper.push(appsSubset);
      }
    }

    function checkEmptyPages() {
      var index = 0;
      var total = pages.total;

      while(index < total) {
        var page = pages.list[index];
        if (page.length === 0) {
          pageHelper.remove(index);
          break;
        }
        index++
      }
    }

    /*
     * Checks number of apps per page
     *
     * It propagates icons in order to avoiding overflow in
     * pages with a number of apps greater that the maximum
     */
    function checkOverflow() {
      var index = pages.current;
      var total = pages.total;

      while(index < total) {
        var page = pages.list[index];
        if (page.length > pageHelper.getMaxPerPage()) {
          var propagateIco = page.popIcon();
          if (index === total - 1) { // index of the last page
            pageHelper.push([propagateIco]);
          } else {
            pages.list[index + 1].prependIcon(propagateIco);
          }
        } else {
          break;
        }
        index++
      }
    }

    function getDirection() {
      var x = status.cCoords.x - status.pCoords.x;
      var y = status.cCoords.y - status.pCoords.y;

      if (Math.abs(x) > Math.abs(y)) {
        if (x > 0) {
          return 0; // right
        } else {
          return 1 // left
        }
      } else {
        if (y > 0) {
          return 2 // down
        } else {
          return 3 // top
        }
      }
    }

    var inRedZone = false;

    /*
     * Detects when users are touching on the limits of a page during
     * the dragging. So we can change the current page and navigate
     * to prev/next page depending on the position.
     * Furthermore, this method is in charge of creating a new page when
     * it's needed
     */
    function detectBorders() {
      var curPageIndex = pages.current;
      var curPageObj = pageHelper.getCurrent();
      // This condition avoids an empty page in the middle
      if (!(curPageObj.length === 1 && curPageIndex < pages.total - 1)) {
        var x = status.cCoords.x;
        if (x > limits.max) { // Next page
          if (curPageIndex < pages.total - 1  && !inRedZone) {
            curPageObj.remove(draggableIcon);
            pageHelper.getNext().prependIcon(draggableIcon);
            goNext();
            inRedZone = true;
          } else if (curPageObj.length > 1 && !inRedZone) {
            // New page if there are two or more icons
            curPageObj.remove(draggableIcon);
            pageHelper.push([draggableIcon]);
            goNext();
            inRedZone = true;
          }
        } else if (x < limits.min) { // Previous page
          if (pages.current > 0 && !inRedZone) {
            curPageObj.remove(draggableIcon);
            pageHelper.getPrevious().appendIcon(draggableIcon);
            goPrev();
            inRedZone = true;
          }
        } else {
          inRedZone = false;
        }
      }
    }

    var pageHelper = {

      /*
       * Adds a new page to the grid layout
       *
       * @param {Array} initial list of apps or icons
       */
      push: function (lapps) {
        var page = new owd.Page();
        var index = this.total() + 1;
        page.render(lapps, createPageMarkup());
        if (index === 1) {
          page.moveToCenter();
        } else {
          page.moveToRight();
        }
        pages.list.push(page);
        pages.total = this.total();
        updateCounter();
      },

      remove: function(index) {
        if (pages.current === index) {
          if (index === 0) {
            // If current page is the first -> seconds page to the center
            // Not fear because we cannot have only one page
            pages.list[index + 1].moveToCenter();
          } else {
            // Move to center the previous page
            pages.list[index - 1].moveToCenter();
            pages.current--;
          }
        }

        pages.list[index].destroy(); // Destroy page
        pages.list.splice(index,1); // Removes page from the list
        pages.total = this.total(); // Reset total number of pages
        updateCounter();
      },

      /*
       * Removes the last page
       */
      pop: function() {
        pages.list.pop();
        pages.total = this.total();
        updateCounter();
      },

      total: function() {
        return pages.list.length;
      },

      /*
       * Returns the total number of apps for each page. It could be
       * more clever. Currently there're twelve apps for page
       */
      getMaxPerPage: function() {
        return 4 * 4;
      },

      /*
       * Returns the next page object
       */
      getNext: function() {
        return pages.list[pages.current + 1];
      },

      /*
       * Returns the previous page object
       */
      getPrevious: function() {
        return pages.list[pages.current - 1];
      },

      /*
       * Returns the current page object
       */
      getCurrent: function() {
        return pages.list[pages.current];
      },

      /*
       * Returns the last page object
       */
      getLast: function() {
        return pages.list[this.total() - 1];
      }
    }

    /*
     * This module leads to dragging feature
     */
    var dragger = {

      /*
       * It's true when an user is dragging
       */
      dragging: false,

      /*
       * This method is executed when dragging starts
       *
       * {Object} This is the DOMElement which was tapped and hold
       */
      start: function(elem) {
        this.dragging = true;
        draggableIcon = pageHelper.getCurrent().getIcon(elem);
        draggableElem = draggableIcon.newDragabbleElem(container);
      },

      /*
       * This method is invoked when dragging is finished. It checks if
       * there is overflow or not in a page and removes the last page when
       * is empty
       */
      stop: function() {
        this.dragging = false;
        draggableIcon.removeDragabbleElem(container);
        // The overflow of icons implies propagation the last icon to
        // next page with a free space
        checkOverflow();
        // When the last page is empty we have to delete it
        if (pageHelper.getLast().length === 0) {
          pageHelper.pop();
        }
      },

      /*
       * It's performed when the draggable element is moving
       *
       * @param {Object} DOMElement behind draggable icon
       */
      onMove: function(overElement) {
        try {
          var uuid = overElement.dataset.uuid;
          if (typeof uuid !== 'undefined' && uuid != draggableIcon.id) {
            var dir = getDirection();
            if (dir !== status.pDir || (dir === status.pDir && uuid !== status.dropped)) {
              // Dragging over an icon -> changing positions
              pageHelper.getCurrent().drop(draggableIcon.id, uuid);
              status.dropped = uuid;
            }
            status.pDir = dir;
          } else {
            detectBorders();
          }
        } catch (ex) {
          var currentPage = pageHelper.getCurrent();
          if (draggableIcon !== currentPage.getLastIcon()) {
            currentPage.remove(draggableIcon);
            currentPage.appendIcon(draggableIcon);
          }
          detectBorders();
        }
      }
    }

    owd.GridManager = {

      /*
       * Initializes the grid manager
       *
       * @param {String} selector of the container for applications
       *
       * @param {String} selector of the container for displaying the
       *                 current page number and the total
       *
       * @param {Array}  list of applications from mozApps API
       */
      init: function(tApps, tCounter, apps) {
        container = typeof tApps === 'object' ? tApps : doc.querySelector(tApps);
        counter = typeof tCounter === 'object' ? tCounter : doc.querySelector(tCounter);
        owd.GridManager.setMode('normal');
        render(apps);
        container.addEventListener(startEvent, this);
        container.addEventListener('contextmenu', this);
        updateCounter();
        // We decide when the user wants to change to another page
        limits = {
          min: container.offsetWidth * 0.08, // 8%
          max: container.offsetWidth * 0.92 // 8%
        };
      },

      /*
       * Event handling in the grid layout
       *
       * @param {Object} The event object from browser
       */
      handleEvent: function(evt) {
        status.target = evt.target;
        switch (evt.type) {
          case startEvent:
            onStartEvent(evt);
            break;
          case moveEvent:
            onMoveEvent(evt);
            break;
          case endEvent:
            onEndEvent(evt);
            break;
          case 'contextmenu':
            evt.preventDefault();
            evt.stopPropagation();
            break;
        }
      },

      /*
       * Adds a new application to the layout when the user installed it
       * from market
       *
       * {Object} moz app
       */
      add: function(app) {
        var lastPage = pageHelper.getLast();
        if (lastPage.length < pageHelper.getMaxPerPage()) {
          lastPage.add(app);
        } else {
          pageHelper.push([app]);
        }
      },

      /*
       * Removes an application from the layout
       *
       * {Object} moz app
       */
      remove: function(app) {
        // Users can only uninstall apps by means of the menu-icon.
        // It implies the app what will be uninstalled should belong
        // to the current page
        pageHelper.getCurrent().remove(app);
      },

      setMode: function(mode) {
        container.dataset.mode = wmode = mode;
      }
    }
  })(document);
}