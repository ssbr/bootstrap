describe('tabs', function() {
  beforeEach(module('ui.bootstrap.tabs', 'template/tabs/tabset.html', 'template/tabs/tab.html'));

  var scope, elm;
  beforeEach(inject(function($compile, $rootScope) {
    scope = $rootScope.$new();
    scope.first = '1';
    scope.second = '2';
    scope.actives = {};
    scope.selectFirst = function() {};
    scope.selectSecond = function() {};
    elm = $compile([
      '<div>',
      '  <tabset>',
      '    <tab heading="First Tab {{first}}" active="actives.one" select="selectFirst()">',
      '      first content is {{first}}',
      '    </tab>',
      '    <tab active="actives.two" select="selectSecond()">',
      '      <tab-heading><b>Second</b> Tab {{second}}</tab-heading>',
      '      second content is {{second}}',
      '    </tab>',
      '  </tabs>',
      '</div>'
    ].join('\n'))(scope);
    scope.$apply();
    return elm;
  }));

  function titles() {
    return elm.find('ul.nav-tabs li');
  }
  function content() {
    return elm.find('div.tab-content div.tab-pane');
  }

  it('should create clickable titles', function() {
    var t = titles();
    expect(t.length).toBe(2);
    expect(t.find('a').eq(0).text()).toBe('First Tab 1');
    expect(t.find('a').eq(1).html()).toBe('<b>Second</b> Tab 2');
  });

  it('should bind first tab content and set active by default', function() {
    expect(content().length).toBe(1);
    expect(content().text().trim()).toBe('first content is 1');
    expect(titles().eq(0)).toHaveClass('active');
    expect(titles().eq(1)).not.toHaveClass('active');
    expect(scope.actives.one).toBe(true);
    expect(scope.actives.two).toBe(false);
  });

  it('should change active on click', function() {
    titles().eq(1).find('a').click();
    expect(content().text().trim()).toBe('second content is 2');
    expect(titles().eq(0)).not.toHaveClass('active');
    expect(titles().eq(1)).toHaveClass('active');
    expect(scope.actives.one).toBe(false);
    expect(scope.actives.two).toBe(true);
  });

  it('should call select callback on select', function() {
    spyOn(scope, 'selectFirst');
    spyOn(scope, 'selectSecond');
    titles().eq(1).find('a').click();
    expect(scope.selectSecond).toHaveBeenCalled();
    titles().eq(0).find('a').click();
    expect(scope.selectFirst).toHaveBeenCalled();
  });

});

describe('ng-repeat', function() {
  beforeEach(module('ui.bootstrap.tabs', 'template/tabs/tabset.html', 'template/tabs/tab.html'));

  var scope, elm;
  beforeEach(inject(function($compile, $rootScope) {
    scope = $rootScope.$new();

    function makeTab() {
      var t = {active: false, select: function() {}};
      t.selectSpy = spyOn(t, 'select');
      return t;
    }
    scope.tabs = [
      makeTab(), makeTab(), makeTab(), makeTab()
    ];
    elm = $compile([
      '<tabset>',
      '  <tab ng-repeat="t in tabs" active="t.active" select="t.select()">',
      '    <tab-heading><b>heading</b> {{index}}</tab-heading>',
      '    content {{$index}}',
      '  </tab>',
      '</tabset>'
    ].join('\n'))(scope);
    scope.$apply();
  }));

  function titles() {
    return elm.find('ul.nav-tabs li');
  }
  function content() {
    return elm.find('div.tab-content div.tab-pane');
  }

  function expectTabActive(activeTab) {
    var _titles = titles();
    angular.forEach(scope.tabs, function(tab, i) {
      if (activeTab === tab) {
        expect(tab.active).toBe(true);
        //It should only call select ONCE for each select
        expect(tab.selectSpy.callCount).toBe(1);
        expect(_titles.eq(i)).toHaveClass('active');
        expect(content().text().trim()).toBe('content ' + i);
      } else {
        expect(tab.active).toBe(false);
        expect(_titles.eq(i)).not.toHaveClass('active');
      }
    });
  }

  it('should make tab titles with first content and first active', function() {
    expect(titles().length).toBe(scope.tabs.length);
    expectTabActive(scope.tabs[0]);
  });

  it('should switch active when clicking', function() {
    titles().eq(3).find('a').click();
    expectTabActive(scope.tabs[3]);
  });

  it('should switch active when setting active=true', function() {
    scope.$apply('tabs[2].active = true');
    expectTabActive(scope.tabs[2]);
  });

  it('should deselect all when no tabs are active', function() {
    angular.forEach(scope.tabs, function(t) { t.active = false; });
    scope.$apply();
    expectTabActive(null);
    expect(content().html()).toBe('');

    scope.tabs[2].active = true;
    scope.$apply();
    expectTabActive(scope.tabs[2]);
  });
});

describe('tabset controller', function() {
  function mockTab() {
    return {
      select: function() { this.active = true; },
      deselect: function() { this.active = false; },
      active: false
    };
  }

  var scope, ctrl;
  beforeEach(module('ui.bootstrap.tabs'));
  beforeEach(inject(function($controller, $rootScope) {
    scope = $rootScope;
    //instantiate the controller stand-alone, without the directive
    ctrl = $controller('TabsetController', {$scope: scope, $element: null});
  }));


  describe('select', function() {

    it('should mark given tab selected', function() {
      var tab = mockTab();

      ctrl.select(tab);
      expect(tab.active).toBe(true);
    });


    it('should deselect other tabs', function() {
      var tab1 = mockTab(), tab2 = mockTab(), tab3 = mockTab();

      ctrl.addTab(tab1);
      ctrl.addTab(tab2);
      ctrl.addTab(tab3);

      ctrl.select(tab1);
      expect(tab1.active).toBe(true);
      expect(tab2.active).toBe(false);
      expect(tab3.active).toBe(false);

      ctrl.select(tab2);
      expect(tab1.active).toBe(false);
      expect(tab2.active).toBe(true);
      expect(tab3.active).toBe(false);

      ctrl.select(tab3);
      expect(tab1.active).toBe(false);
      expect(tab2.active).toBe(false);
      expect(tab3.active).toBe(true);
    });
  });


  describe('addTab', function() {

    it('should append tab', function() {
      var tab1 = mockTab(), tab2 = mockTab();

      expect(ctrl.tabs).toEqual([]);

      ctrl.addTab(tab1);
      expect(ctrl.tabs).toEqual([tab1]);

      ctrl.addTab(tab2);
      expect(ctrl.tabs).toEqual([tab1, tab2]);
    });


    it('should select the first one', function() {
      var tab1 = mockTab(), tab2 = mockTab();

      ctrl.addTab(tab1);
      expect(tab1.active).toBe(true);

      ctrl.addTab(tab2);
      expect(tab1.active).toBe(true);
    });
  });
});

