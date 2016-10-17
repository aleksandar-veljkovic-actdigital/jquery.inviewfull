/**
 * author Aleksandar Veljkovic
 *    based on https://github.com/protonet/jquery.inview
 */

(function (factory) {
  if (typeof define == 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node, CommonJS
    module.exports = factory(require('jquery'));
  } else {
      // Browser globals
    factory(jQuery);
  }
}(function ($) {

  var inviewfullObjects = [], viewportSize, viewportOffset,
      d = document, w = window, documentElement = d.documentElement, timer;

  $.event.special.inviewfull = {
    add: function(data) {
      inviewfullObjects.push({ data: data, $element: $(this), element: this });
      // Use setInterval in order to also make sure this captures elements within
      // "overflow:scroll" elements or elements that appeared in the dom tree due to
      // dom manipulation and reflow
      // old: $(window).scroll(checkInView);
      //
      // By the way, iOS (iPad, iPhone, ...) seems to not execute, or at least delays
      // intervals while the user scrolls. Therefore the inview event might fire a bit late there
      //
      // Don't waste cycles with an interval until we get at least one element that
      // has bound to the inview event.
      if (!timer && inviewfullObjects.length) {
         timer = setInterval(checkInView, 250);
      }
    },

    remove: function(data) {
      for (var i=0; i<inviewfullObjects.length; i++) {
        var inviewfullObject = inviewfullObjects[i];
        if (inviewfullObject.element === this && inviewfullObject.data.guid === data.guid) {
          inviewfullObjects.splice(i, 1);
          break;
        }
      }

      // Clear interval when we no longer have any elements listening
      if (!inviewfullObjects.length) {
         clearInterval(timer);
         timer = null;
      }
    }
  };

  function getViewportSize() {
    var mode, domObject, size = { height: w.innerHeight, width: w.innerWidth };

    // if this is correct then return it. iPad has compat Mode, so will
    // go into check clientHeight/clientWidth (which has the wrong value).
    if (!size.height) {
      mode = d.compatMode;
      if (mode || !$.support.boxModel) { // IE, Gecko
        domObject = mode === 'CSS1Compat' ?
          documentElement : // Standards
          d.body; // Quirks
        size = {
          height: domObject.clientHeight,
          width:  domObject.clientWidth
        };
      }
    }

    return size;
  }

  function getViewportOffset() {
    return {
      top:  w.pageYOffset || documentElement.scrollTop   || d.body.scrollTop,
      left: w.pageXOffset || documentElement.scrollLeft  || d.body.scrollLeft
    };
  }

  function checkInView() {
    if (!inviewfullObjects.length) {
      return;
    }

    var i = 0, $elements = $.map(inviewfullObjects, function(inviewfullObject) {
      var selector  = inviewfullObject.data.selector,
          $element  = inviewfullObject.$element;
      return selector ? $element.find(selector) : $element;
    });

    viewportSize   = viewportSize   || getViewportSize();
    viewportOffset = viewportOffset || getViewportOffset();

    for (; i<inviewfullObjects.length; i++) {
      // Ignore elements that are not in the DOM tree
      if (!$.contains(documentElement, $elements[i][0])) {
        continue;
      }

      var $element      = $($elements[i]),
          elementSize   = { height: $element[0].offsetHeight, width: $element[0].offsetWidth },
          elementOffset = $element.offset(),
          inView        = $element.data('inviewfull');

      // Don't ask me why because I haven't figured out yet:
      // viewportOffset and viewportSize are sometimes suddenly null in Firefox 5.
      // Even though it sounds weird:
      // It seems that the execution of this function is interferred by the onresize/onscroll event
      // where viewportOffset and viewportSize are unset
      if (!viewportOffset || !viewportSize) {
        return;
      }
      if (
            (
              viewportSize.height < elementSize.height &&
              viewportOffset.top + 40 > elementOffset.top &&
              viewportOffset.top + viewportSize.height < elementOffset.top + elementSize.height + 40
            ) ||
            (
              viewportSize.height >= elementSize.height &&
              viewportOffset.top < elementOffset.top + 40 &&
              viewportOffset.top + viewportSize.height + 40 > elementOffset.top + elementSize.height
            )
      ) {        
        if (!inView) {
          $element.data('inviewfull', true).trigger('inviewfull', [true]);
        }
      } else if (inView) {
        $element.data('inviewfull', false).trigger('inviewfull', [false]);
      }
    }
  }

  $(w).on("scroll resize scrollstop", function() {
    viewportSize = viewportOffset = null;
  });

  // IE < 9 scrolls to focused elements without firing the "scroll" event
  if (!documentElement.addEventListener && documentElement.attachEvent) {
    documentElement.attachEvent("onfocusin", function() {
      viewportOffset = null;
    });
  }
}));
