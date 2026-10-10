import React from "react";
import ReactApexChart from "react-apexcharts";
import useChartColors from "@common/useChartColors";

const ProjectsOverviewCharts = ({ chartId, series }: any) => {
  const chartColors = useChartColors(chartId);

  var options: any = {
    chart: {
      height: 374,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      dashArray: [0, 3, 0],
      width: [0, 1, 0],
    },
    fill: {
      opacity: [1, 0.1, 1],
    },
    markers: {
      size: [0, 4, 0],
      strokeWidth: 2,
      hover: {
        size: 4,
      },
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
    },
    grid: {
      show: true,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
      padding: {
        top: 0,
        right: -2,
        bottom: 15,
        left: 10,
      },
    },
    legend: {
      show: true,
      horizontalAlign: "center",
      offsetX: 0,
      offsetY: -5,
      markers: {
        width: 9,
        height: 9,
        radius: 6,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 0,
      },
    },
    plotOptions: {
      bar: {
        columnWidth: "30%",
        barHeight: "70%",
      },
    },
    colors: chartColors,
    tooltip: {
      shared: true,
      y: [
        {
          formatter: function (y: any) {
            if (typeof y !== "undefined") {
              return y.toFixed(0);
            }
            return y;
          },
        },
        {
          formatter: function (y: any) {
            if (typeof y !== "undefined") {
              return "$" + y.toFixed(2) + "k";
            }
            return y;
          },
        },
        {
          formatter: function (y: any) {
            if (typeof y !== "undefined") {
              return y.toFixed(0);
            }
            return y;
          },
        },
      ],
    },
  };
  return (
    <React.Fragment>
      <ReactApexChart
        dir="ltr"
        options={options}
        series={series}
        id={chartId}
        type="line"
        height="374"
        data-colors='["--vz-primary", "--vz-warning", "--vz-success"]'
        data-colors-minimal='["--vz-primary", "--vz-primary-rgb, 0.1", "--vz-primary-rgb, 0.50"]'
        data-colors-interactive='["--vz-primary", "--vz-info", "--vz-warning"]'
        data-colors-creative='["--vz-secondary", "--vz-warning", "--vz-success"]'
        data-colors-corporate='["--vz-primary", "--vz-secondary", "--vz-danger"]'
        data-colors-galaxy='["--vz-primary", "--vz-primary-rgb, 0.1", "--vz-primary-rgb, 0.50"]'
        data-colors-classic='["--vz-primary", "--vz-secondary", "--vz-warning"]'
        className="apex-charts"
      />
    </React.Fragment>
  );
};

const TeamMembersCharts = ({ seriesData, chartsColor }: any) => {
  // const series=  isApexSeriesData.series,
  let series;
  if (Array.isArray(seriesData)) {
    // If already an array, extract first value and ensure it's a number
    const firstValue = seriesData.length > 0 ? seriesData[0] : 0;
    const numValue = typeof firstValue === 'number' ? firstValue : parseFloat(firstValue);
    series = [isNaN(numValue) ? 0 : numValue];
  } else if (seriesData != null && typeof seriesData === 'object' && 'data' in seriesData) {
    // Handle object with data property (extract first value from data array)
    const dataArray = Array.isArray(seriesData.data) ? seriesData.data : [];
    const firstValue = dataArray.length > 0 ? dataArray[0] : 0;
    const numValue = typeof firstValue === 'number' ? firstValue : parseFloat(firstValue);
    series = [isNaN(numValue) ? 0 : numValue];
  } else if (seriesData != null) {
    // Convert string/number to number
    const numValue = typeof seriesData === 'number' ? seriesData : parseFloat(seriesData);
    series = [isNaN(numValue) ? 0 : numValue];
  } else {
    // Fallback for null/undefined
    series = [0];
  }

  const options: any = {
    chart: {
      type: "radialBar",
      width: 36,
      height: 36,
      sparkline: {
        enabled: !0,
      },
    },
    dataLabels: {
      enabled: !1,
    },
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: "50%",
        },
        track: {
          margin: 1,
        },
        dataLabels: {
          show: !1,
        },
      },
    },
    colors: [chartsColor],
  };

  // Final validation: ensure series is a valid array of numbers
  const validSeries = Array.isArray(series) && series.length > 0 && series.every(v => typeof v === 'number' && !isNaN(v))
    ? series
    : [0];

  return (
    <React.Fragment>
      <ReactApexChart
        dir="ltr"
        options={options}
        series={validSeries}
        type="radialBar"
        height={36}
        width={36}
        className="apex-charts"
      />
    </React.Fragment>
  );
};

const PrjectsStatusCharts = ({ chartId, series }: any) => {
  var donutchartProjectsStatusColors = useChartColors(chartId);

  var options: any = {
    labels: ["Completed", "In Progress", "Yet to Start", "Cancelled"],
    chart: {
      type: "donut",
      height: 200,
    },
    plotOptions: {
      pie: {
        size: 100,
        offsetX: 0,
        offsetY: 0,
        donut: {
          size: "90%",
          labels: {
            show: false,
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    stroke: {
      lineCap: "round",
      width: 0,
    },
    colors: donutchartProjectsStatusColors,
  };
  return (
    <React.Fragment>
      <ReactApexChart
        dir="ltr"
        options={options}
        series={series}
        id={chartId}
        type="donut"
        height="200"
        data-colors='["--vz-info","--vz-success", "--vz-warning", "--vz-danger"]'
        data-colors-minimal='["--vz-primary", "--vz-primary-rgb, 0.85", "--vz-primary-rgb, 0.70", "--vz-primary-rgb, 0.50"]'
        data-colors-galaxy='["--vz-primary", "--vz-primary-rgb, 0.85", "--vz-primary-rgb, 0.70", "--vz-primary-rgb, 0.50"]'
        className="apex-charts"
      />
    </React.Fragment>
  );
};

export { ProjectsOverviewCharts, TeamMembersCharts, PrjectsStatusCharts };
