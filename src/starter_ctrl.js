import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import $ from 'jquery';
import './css/starter-panel.css!';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';

const panelDefaults = {
  bgColor: null,
  format: 'none',
  thresholds: '',
  colors: ['#299c46', 'rgba(237, 129, 40, 0.89)', '#d44a3a'],
  colorBackground: false,
  colorValue: false,
  sparkline: {
    show: true,
    lineColor: 'rgb(31, 120, 193)',
    fillColor: 'rgba(31, 118, 189, 0.18)',
  },
};

export class StarterCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector) {
    super($scope, $injector);

    // Set panel defaults for properties that the user has not set explicitly
    _.defaultsDeep(this.panel, panelDefaults);

    // init-edit-mode event is triggered when the user clicks on edit
    // the editor tabs are initialized in the handler
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));

    // The panel-teardown event is useful for cleaning up to avoid memory leaks
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));

    // The panel initialized event can be useful for panels that inherit PanelCtrl instead of MetricsPanelCtrl
    // With a MetricsPanelCtrl panel, you usually want to wait for some data to be received
    this.events.on('panel-initialized', this.render.bind(this));

    // The data-received event is triggered when the datasource returns with data
    this.events.on('data-received', this.onDataReceived.bind(this));

    // The data-error event can be handled by showing a friendly error message to the user or to ignore the error
    this.events.on('data-error', this.onDataError.bind(this));

    // The data-snapshot-load event is triggered when the dashboard is loading as a snapshot
    // Read more about saving and loading snapshot data here:
    this.events.on('data-snapshot-load', this.onDataSnapshotLoad.bind(this));

    this.onSparklineColorChange = this.onSparklineColorChange.bind(this);
    this.onSparklineFillChange = this.onSparklineFillChange.bind(this);
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/grafana-starter-panel/editor.html', 2);
    this.unitFormats = kbn.getUnitFormats();
  }

  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
    this.refresh();
  }

  onPanelTeardown() {
  }

  onDataReceived(dataList) {
    if (!dataList) return;

    this.data = dataList.map(this.seriesHandler.bind(this));
    this.render();
  }

  seriesHandler(seriesData) {
    const series = new TimeSeries({
      datapoints: seriesData.datapoints || [],
      alias: seriesData.target,
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    series.value = series.stats['current'];
    const formatFunc = kbn.valueFormats[this.panel.format];
    series.valueFormatted = formatFunc(series.value, 0, 1);
    return series;
  }

  setThresholds(thresholds) {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i].thresholdColor = this.getColorForValue(this.data[i].value, thresholds);
    }
  }

  getColorForValue(value, thresholds) {
    if (!_.isFinite(value)) {
      return null;
    }
    for (let i = thresholds.length; i > 0; i--) {
      if (value >= thresholds[i - 1]) {
        return this.panel.colors[i];
      }
    }
    return _.first(this.panel.colors);
  }

  invertColorOrder() {
    const tmp = this.panel.colors[0];
    this.panel.colors[0] = this.panel.colors[2];
    this.panel.colors[2] = tmp;
    this.render();
  }

  onColorChange(panelColorIndex) {
    return color => {
      this.panel.colors[panelColorIndex] = color;
      this.render();
    };
  }

  onDataError() {
    this.onDataReceived();
  }

  onDataSnapshotLoad(snapshotData) {
    this.onDataReceived(snapshotData);
  }

  onSparklineColorChange(newColor) {
    this.panel.sparkline.lineColor = newColor;
    this.render();
  }

  onSparklineFillChange(newColor) {
    this.panel.sparkline.fillColor = newColor;
    this.render();
  }

  /*
  The link function is an Angular function that can be used to access the HTML element for the panel
  */
  /* eslint class-methods-use-this: 0 */
  link(scope, elem, attrs, ctrl) {
    let data;
    const templateSrv = this.templateSrv;

    this.events.on('render', () => {
      const $panelContainer = elem.find('.panel-container');

      if (this.panel.bgColor) {
        $panelContainer.css('background-color', this.panel.bgColor);
      } else {
        $panelContainer.css('background-color', '');
      }

      if (!ctrl.data) {
        return;
      }
      data = this.data;

      const thresholds = templateSrv.replace(this.panel.thresholds || '').split(',').map(strVal => {
        return Number(strVal.trim());
      });
      this.setThresholds(thresholds);

      generateHtml();

      addSparklines();
    });

    function generateHtml() {
      let body = '';

      for (let i = 0; i < data.length; i++) {
        const bgThresholdColor = ctrl.panel.colorBackground ? 'background-color: ' + data[i].thresholdColor : '';
        body += `<span class="starter-panel-multistat" style="${bgThresholdColor}">`;
        body += '<span class="starter-panel-multistat-value">';
        body += '<span class="starter-panel-multistat-value__text">' + data[i].alias + '</span>';
        const valueThresholdColor = ctrl.panel.colorValue ? 'color: ' + data[i].thresholdColor : '';
        body += `<span class="starter-panel-multistat-value__value" style="${valueThresholdColor}">${data[i].valueFormatted}</span>`;
        body += '</span>';
        body += '<span class="starter-panel-multistat-sparkline"></span>';
        body += '</span>';
      }
      const starterElem = elem.find('.starter-panel');
      starterElem.html(body);
    }

    function addSparklines() {
      const rootElems = elem.find('.starter-panel-multistat');

      if (rootElems.length === 0) {
        // delay sparkline render
        setTimeout(() => addSparklines(), 30);
      }

      for (let i = 0; i < data.length; i++) {
        addSparkline(data[i], $(rootElems[i]));
      }
    }

    function addSparkline(data, rootElem) {
      const width = elem.width() + 20;
      if (width < 30 || rootElem.length === 0) {
        // element has not gotten it's width yet
        return;
      }
      const sparkLineElem = rootElem.find('.starter-panel-multistat-sparkline');
      sparkLineElem.empty();

      const plotCanvas = $('<div></div>');
      const plotCss = {};
      plotCss.width = (rootElem.width() / 2) + 'px';
      plotCss.height = (rootElem.height() - 20) + 'px';

      plotCanvas.css(plotCss);

      const options = {
        legend: { show: false },
        series: {
          lines: {
            show: true,
            fill: 1,
            lineWidth: 1,
            fillColor: ctrl.panel.sparkline.fillColor,
          },
        },
        yaxes: { show: false },
        xaxis: {
          show: false,
          mode: 'time',
          min: ctrl.range.from.valueOf(),
          max: ctrl.range.to.valueOf(),
        },
        grid: { hoverable: false, show: false, borderWidth: 0 },
      };

      sparkLineElem.append(plotCanvas);

      const plotSeries = {
        data: data.flotpairs,
        color: ctrl.panel.sparkline.lineColor,
      };

      $.plot(plotCanvas, [plotSeries], options);
    }
  }
}

StarterCtrl.templateUrl = 'module.html';
