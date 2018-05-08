import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import $ from 'jquery';
import './css/starter-panel.css!';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';

const panelDefaults = {
  bgColor: null,
  format: 'none',
  sparkline: {
    show: true,
    full: false,
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

      const rootElem = elem.find('.temp-sparkline');

      addSparklines(rootElem);
    });

    function addSparklines(rootElem) {
      const width = elem.width() + 20;
      if (width < 30) {
        // element has not gotten it's width yet
        // delay sparkline render
        setTimeout(() => addSparklines(rootElem), 30);
        return;
      }

      rootElem.empty();

      const height = ctrl.height;
      const plotCanvas = $('<div></div>');
      const plotCss = {};
      plotCss.position = 'absolute';

      if (ctrl.panel.sparkline.full) {
        plotCss.bottom = '5px';
        plotCss.left = '-5px';
        plotCss.width = width - 10 + 'px';
        const dynamicHeightMargin = height <= 100 ? 5 : Math.round(height / 100) * 15 + 5;
        plotCss.height = height - dynamicHeightMargin + 'px';
      } else {
        plotCss.bottom = '0px';
        plotCss.left = '-5px';
        plotCss.width = width - 10 + 'px';
        plotCss.height = Math.floor(height * 0.25) + 'px';
      }

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
        grid: { hoverable: false, show: false },
      };

      rootElem.append(plotCanvas);

      const plotSeries = {
        data: ctrl.data[0].flotpairs,
        color: ctrl.panel.sparkline.lineColor,
      };

      $.plot(plotCanvas, [plotSeries], options);
    }
  }
}

StarterCtrl.templateUrl = 'module.html';
