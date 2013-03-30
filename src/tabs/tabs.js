angular.module('ui.bootstrap.tabs', [])

.controller('TabsetController', ['$scope', '$element', 
function TabsetCtrl($scope, $element) {
  var ctrl = this,
    tabs = ctrl.tabs = [];

  ctrl.select = function(tab) {
    angular.forEach(tabs, ctrl.deselect);  
    tab.active = true;
    ctrl.activeTab = tab;
  };

  ctrl.deselect = function(tab) {
    if (ctrl.activeTab === tab) {
      ctrl.activeTab = null;
    }
    tab.active = false;
  };


  ctrl.addTab = function addTab(tab) {
    if (!tabs.length) {
      ctrl.select(tab);
    }
    tabs.push(tab);
  };

  ctrl.removeTab = function removeTab(tab) { 
    var index = tabs.indexOf(tab);
    tabs.splice(index, 1);
    //Select a new tab if removed tab was selected 
    if (tab.active && tabs.length > 0) {
      ctrl.select(tabs[index < tabs.length ? index : index-1]);
    }
  };
}])

.directive('tabset', function() {
  return {
    restrict: 'EA',
    transclude: true,
    controller: 'TabsetController',
    templateUrl: 'template/tabs/tabset.html'
  };
})

.directive('tab', ['$parse', '$http', '$templateCache', '$compile',
function($parse, $http, $templateCache, $compile) {
  return {
    require: '^tabset',
    restrict: 'EA',
    replace: true,
    templateUrl: 'template/tabs/tab.html',
    transclude: true,
    scope: {
      heading: '@'
    },
    controller: ['$scope', function TabCtrl($scope) {
      this.getHeadingElement = function() {
        return $scope.headingElement;
      };
    }],
    compile: function(elm, attrs, transclude) {
      return function postLink(scope, elm, attrs, tabsetCtrl) {
        var getActive, setActive;
        scope.active = false; // default value
        if (attrs.active) {
          getActive = $parse(attrs.active);
          setActive = getActive.assign;
          scope.$watch(function watchActive() {
            return getActive(scope.$parent);
          }, function updateActive(value) {
            scope.active = !!value;
          });
        } else {
          setActive = getActive = angular.noop;
        }

        scope.$watch('active', function(active) {
          setActive(scope.$parent, active);
          if (active) {
            tabsetCtrl.select(scope);
            if (attrs.select) {
              scope.$parent.$eval(attrs.select);
            }
          } else {
            tabsetCtrl.deselect(scope);
          }
        });

        scope.select = function() {
          scope.active = true;
        };

        tabsetCtrl.addTab(scope);
        scope.$on('$destroy', function() {
          tabsetCtrl.removeTab(scope);
        });
        //If the tabset sets this guy to active, set the parent too
        //We have to do this because the parent watcher will fire and
        //set active to false again before the watcher on line 82
        //can go
        if (scope.active) {
          setActive(scope.$parent, true);
        }

        transclude(scope.$parent, function(clone) {
          //Create a wrapper around clone - originally clone is just a
          //collection of sibling elements with no parent.
          //The wrapper lets us easily find things without looping through
          //a collection of elements.
          var wrapper = angular.element('<div />');
          wrapper.append(clone);

          //Find the heading if it exists
          //We don't use a directive for tab-heading because
          //it presents too many problems.
          //Some of them are expounded upon here 
          //https://github.com/angular-ui/bootstrap/pull/186/
          var headingElm = wrapper.find(
            '[tab-heading],[data-tab-heading],tab-heading,data-tab-heading'
          );
          if (headingElm.length) {
            headingElm.remove();
            scope.headingElement = headingElm.contents();
          }

          //Everything else is the content we need, since we removed
          //the heading element if it existed
          scope.contentElement = wrapper.contents();
        });
      };
    }
  };
}])

.directive('tabHeadingTransclude', [function() {
  return {
    restrict: 'A',
    require: '^tab', 
    link: function(scope, elm, attrs, tabCtrl) {
      scope.$watch(function getHeadingElement() {
        return tabCtrl.getHeadingElement();
      }, function(heading) {
        if (heading) {
          elm.html('');
          elm.append(heading);
        }
      });
    }
  };
}])

.directive('tabContentTransclude', [function() {
  return {
    restrict: 'A',
    require: '^tabset',
    link: function(scope, elm, attrs, tabsetCtrl) {
      scope.$watch(function() {
        return tabsetCtrl.activeTab;
      }, function(activeTab) {
        elm.html('');
        if (activeTab) {
          elm.append(activeTab.contentElement);
        }
      });
    }
  };
}])

;

