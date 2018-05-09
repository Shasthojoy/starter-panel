'use strict';

System.register(['app/plugins/sdk', 'lodash', 'jquery', './css/starter-panel.css!', 'app/core/time_series2', 'app/core/utils/kbn'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, _, $, TimeSeries, kbn, _createClass, panelDefaults, StarterCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_cssStarterPanelCss) {}, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      panelDefaults = {
        bgColor: null,
        format: 'none',
        thresholds: '',
        colors: ['#299c46', 'rgba(237, 129, 40, 0.89)', '#d44a3a'],
        colorBackground: false,
        colorValue: false,
        sparkline: {
          show: true,
          lineColor: 'rgb(31, 120, 193)',
          fillColor: 'rgba(31, 118, 189, 0.18)'
        }
      };

      _export('StarterCtrl', StarterCtrl = function (_MetricsPanelCtrl) {
        _inherits(StarterCtrl, _MetricsPanelCtrl);

        function StarterCtrl($scope, $injector) {
          _classCallCheck(this, StarterCtrl);

          var _this = _possibleConstructorReturn(this, (StarterCtrl.__proto__ || Object.getPrototypeOf(StarterCtrl)).call(this, $scope, $injector));

          // Set panel defaults for properties that the user has not set explicitly
          _.defaultsDeep(_this.panel, panelDefaults);

          // init-edit-mode event is triggered when the user clicks on edit
          // the editor tabs are initialized in the handler
          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));

          // The panel-teardown event is useful for cleaning up to avoid memory leaks
          _this.events.on('panel-teardown', _this.onPanelTeardown.bind(_this));

          // The panel initialized event can be useful for panels that inherit PanelCtrl instead of MetricsPanelCtrl
          // With a MetricsPanelCtrl panel, you usually want to wait for some data to be received
          _this.events.on('panel-initialized', _this.render.bind(_this));

          // The data-received event is triggered when the datasource returns with data
          _this.events.on('data-received', _this.onDataReceived.bind(_this));

          // The data-error event can be handled by showing a friendly error message to the user or to ignore the error
          _this.events.on('data-error', _this.onDataError.bind(_this));

          // The data-snapshot-load event is triggered when the dashboard is loading as a snapshot
          // Read more about saving and loading snapshot data here:
          _this.events.on('data-snapshot-load', _this.onDataSnapshotLoad.bind(_this));

          _this.onSparklineColorChange = _this.onSparklineColorChange.bind(_this);
          _this.onSparklineFillChange = _this.onSparklineFillChange.bind(_this);
          return _this;
        }

        _createClass(StarterCtrl, [{
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Options', 'public/plugins/grafana-starter-panel/editor.html', 2);
            this.unitFormats = kbn.getUnitFormats();
          }
        }, {
          key: 'setUnitFormat',
          value: function setUnitFormat(subItem) {
            this.panel.format = subItem.value;
            this.refresh();
          }
        }, {
          key: 'onPanelTeardown',
          value: function onPanelTeardown() {}
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
            if (!dataList) return;

            this.data = dataList.map(this.seriesHandler.bind(this));
            this.render();
          }
        }, {
          key: 'seriesHandler',
          value: function seriesHandler(seriesData) {
            var series = new TimeSeries({
              datapoints: seriesData.datapoints || [],
              alias: seriesData.target
            });

            series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
            series.value = series.stats['current'];
            var formatFunc = kbn.valueFormats[this.panel.format];
            series.valueFormatted = formatFunc(series.value, 0, 1);
            return series;
          }
        }, {
          key: 'setThresholds',
          value: function setThresholds(thresholds) {
            for (var i = 0; i < this.data.length; i++) {
              this.data[i].thresholdColor = this.getColorForValue(this.data[i].value, thresholds);
            }
          }
        }, {
          key: 'getColorForValue',
          value: function getColorForValue(value, thresholds) {
            if (!_.isFinite(value)) {
              return null;
            }
            for (var i = thresholds.length; i > 0; i--) {
              if (value >= thresholds[i - 1]) {
                return this.panel.colors[i];
              }
            }
            return _.first(this.panel.colors);
          }
        }, {
          key: 'invertColorOrder',
          value: function invertColorOrder() {
            var tmp = this.panel.colors[0];
            this.panel.colors[0] = this.panel.colors[2];
            this.panel.colors[2] = tmp;
            this.render();
          }
        }, {
          key: 'onColorChange',
          value: function onColorChange(panelColorIndex) {
            var _this2 = this;

            return function (color) {
              _this2.panel.colors[panelColorIndex] = color;
              _this2.render();
            };
          }
        }, {
          key: 'onDataError',
          value: function onDataError() {
            this.onDataReceived();
          }
        }, {
          key: 'onDataSnapshotLoad',
          value: function onDataSnapshotLoad(snapshotData) {
            this.onDataReceived(snapshotData);
          }
        }, {
          key: 'onSparklineColorChange',
          value: function onSparklineColorChange(newColor) {
            this.panel.sparkline.lineColor = newColor;
            this.render();
          }
        }, {
          key: 'onSparklineFillChange',
          value: function onSparklineFillChange(newColor) {
            this.panel.sparkline.fillColor = newColor;
            this.render();
          }
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
            var _this3 = this;

            var data = void 0;
            var templateSrv = this.templateSrv;

            this.events.on('render', function () {
              var $panelContainer = elem.find('.panel-container');

              if (_this3.panel.bgColor) {
                $panelContainer.css('background-color', _this3.panel.bgColor);
              } else {
                $panelContainer.css('background-color', '');
              }

              if (!ctrl.data) {
                return;
              }
              data = _this3.data;

              var thresholds = templateSrv.replace(_this3.panel.thresholds || '').split(',').map(function (strVal) {
                return Number(strVal.trim());
              });
              _this3.setThresholds(thresholds);

              generateHtml();

              addSparklines();
            });

            function generateHtml() {
              var body = '';

              for (var i = 0; i < data.length; i++) {
                var bgThresholdColor = ctrl.panel.colorBackground ? 'background-color: ' + data[i].thresholdColor : '';
                body += '<span class="starter-panel-multistat" style="' + bgThresholdColor + '">';
                body += '<span class="starter-panel-multistat-value">';
                body += '<span class="starter-panel-multistat-value__text">' + data[i].alias + '</span>';
                var valueThresholdColor = ctrl.panel.colorValue ? 'color: ' + data[i].thresholdColor : '';
                body += '<span class="starter-panel-multistat-value__value" style="' + valueThresholdColor + '">' + data[i].valueFormatted + '</span>';
                body += '</span>';
                body += '<span class="starter-panel-multistat-sparkline"></span>';
                body += '</span>';
              }
              var starterElem = elem.find('.starter-panel');
              starterElem.html(body);
            }

            function addSparklines() {
              var rootElems = elem.find('.starter-panel-multistat');

              if (rootElems.length === 0) {
                // delay sparkline render
                setTimeout(function () {
                  return addSparklines();
                }, 30);
              }

              for (var i = 0; i < data.length; i++) {
                addSparkline(data[i], $(rootElems[i]));
              }
            }

            function addSparkline(data, rootElem) {
              var width = elem.width() + 20;
              if (width < 30 || rootElem.length === 0) {
                // element has not gotten it's width yet
                return;
              }
              var sparkLineElem = rootElem.find('.starter-panel-multistat-sparkline');
              sparkLineElem.empty();

              var plotCanvas = $('<div></div>');
              var plotCss = {};
              plotCss.width = rootElem.width() / 2 + 'px';
              plotCss.height = rootElem.height() - 20 + 'px';

              plotCanvas.css(plotCss);

              var options = {
                legend: { show: false },
                series: {
                  lines: {
                    show: true,
                    fill: 1,
                    lineWidth: 1,
                    fillColor: ctrl.panel.sparkline.fillColor
                  }
                },
                yaxes: { show: false },
                xaxis: {
                  show: false,
                  mode: 'time',
                  min: ctrl.range.from.valueOf(),
                  max: ctrl.range.to.valueOf()
                },
                grid: { hoverable: false, show: false, borderWidth: 0 }
              };

              sparkLineElem.append(plotCanvas);

              var plotSeries = {
                data: data.flotpairs,
                color: ctrl.panel.sparkline.lineColor
              };

              $.plot(plotCanvas, [plotSeries], options);
            }
          }
        }]);

        return StarterCtrl;
      }(MetricsPanelCtrl));

      _export('StarterCtrl', StarterCtrl);

      StarterCtrl.templateUrl = 'module.html';
    }
  };
});
//# sourceMappingURL=starter_ctrl.js.map
