"use strict";
//RequestService
//Handles HTTP requests to a Server
app.service('ChartService', ["$filter", function($filter) {
    Chart.types.Bar.extend({
        name: "BarLayout",
        showTooltip: function() {
            this.chart.ctx.save();
            Chart.types.Bar.prototype.showTooltip.apply(this, arguments);
            this.chart.ctx.restore();
        },
        initialize: function (data) {
            Chart.types.Bar.prototype.initialize.apply(this, arguments);

            if (this.options.curvature !== undefined && this.options.curvature <= 1) {
                var rectangleDraw = this.datasets[0].bars[0].draw;
                var self = this;
                var radius = this.datasets[0].bars[0].width * this.options.curvature * 0.5;

                // override the rectangle draw with ours
                this.datasets.forEach(function (dataset) {
                    dataset.bars.forEach(function (bar) {
                        bar.draw = function () {
                            // draw the original bar a little down (so that our curve brings it to its original position)
                            var y = bar.y;
                            // the min is required so animation does not start from below the axes
                            bar.y = Math.min(bar.y + radius, self.scale.endPoint - 1);
                            // adjust the bar radius depending on how much of a curve we can draw
                            var barRadius = (bar.y - y);
                            rectangleDraw.apply(bar, arguments);

                            // draw a rounded rectangle on top
                            Chart.helpers.drawRoundedRectangle(self.chart.ctx, bar.x - bar.width / 2, bar.y - barRadius + 1, bar.width, bar.height, barRadius);
                            self.chart.ctx.fill();
                            self.chart.ctx.save();


                            //draw circle on top of bars
                            var circleWidth = bar.width/2;

                            self.chart.ctx.beginPath();
                            self.chart.ctx.arc(bar.x,bar.y,circleWidth/2,0,2*Math.PI);
                            self.chart.ctx.strokeStyle = '#f13879';
                            self.chart.ctx.lineWidth=2;
                            self.chart.ctx.stroke();
                            self.chart.ctx.closePath();

                            self.chart.ctx.fillStyle = "white";
                            self.chart.ctx.fill();

                            self.chart.ctx.save();

                            self.chart.ctx.fillStyle = "#f13879";
                            var font = "normal " + circleWidth/1.5 +"px monteserrat-regular";
                            self.chart.ctx.font = font;

                            var text = bar.value.toString();
                            var width = self.chart.ctx.measureText(text).width;
                            var height = self.chart.ctx.measureText(text).width; // this is a GUESS of height
                            self.chart.ctx.fillText(text, bar.x + (width/2),bar.y);
                            self.chart.ctx.save();

                            self.chart.ctx.strokeStyle = '#f13879';

                            // restore the y value
                            bar.y = y;
                        }
                    })
                })
            }
        },
        draw: function() {
            Chart.types.Bar.prototype.draw.apply(this, arguments);
        }
    });

    //Doughnut chart extension in order to allow to put some text inside it
	Chart.types.Doughnut.extend({
		name: "DoughnutTextInside",
		showTooltip: function() {
			this.chart.ctx.save();
			Chart.types.Doughnut.prototype.showTooltip.apply(this, arguments);
			this.chart.ctx.restore();
		},
		draw: function() {
			Chart.types.Doughnut.prototype.draw.apply(this, arguments);

			var width = this.chart.width,
			height = this.chart.height;

			var fontSize = (height / 114).toFixed(2) * .60;
			var fontFamily = "monteserrat-regular"
			this.chart.ctx.font = fontSize + "em " + fontFamily;
			this.chart.ctx.fillStyle = "black";
			this.chart.ctx.textBaseline = "middle";

			var value = $filter('currency')(this.total, "€", 2);
			var labelText = "Total";
			var textValueX = Math.round((width - this.chart.ctx.measureText(value).width) / 2);
			var textY = (height * .70) / 3;

			//total value text inside chart
			this.chart.ctx.fillText(value, textValueX, textY*2);
			this.chart.ctx.save();

			fontSize = fontSize*.75;
			this.chart.ctx.font = fontSize + "em " + fontFamily;

			var textLabelX = Math.round((width - this.chart.ctx.measureText(labelText).width) / 2);

			//total label text inside chart
			this.chart.ctx.fillText(labelText, textLabelX, textY*2.5);
			this.chart.ctx.save();

		}
	});


}]);
