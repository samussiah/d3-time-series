export default function updatefocusRing(xdate) {
    var s = annotationsContainer.selectAll('circle.d3_timeseries.focusring');

    if (xdate == null) {
        s = s.data([]);
    } else {
        s = s.data(
            series
                .map(function(s) {
                    return {
                        x: xdate,
                        item: s.find(xdate),
                        aes: s.aes,
                        color: s.options.color
                    };
                })
                .filter(function(d) {
                    return (
                        d.item !== undefined &&
                        d.item !== null &&
                        d.item[d.aes.y] !== null &&
                        !isNaN(d.item[d.aes.y])
                    );
                })
        );
    }

    s.transition()
        .duration(50)
        .attr('cx', function(d) {
            return xscale(d.item[d.aes.x]);
        })
        .attr('cy', function(d) {
            return yscale(d.item[d.aes.y]);
        });

    s.enter()
        .append('circle')
        .attr('class', 'd3_timeseries focusring')
        .attr('fill', 'none')
        .attr('stroke-width', 2)
        .attr('r', 5)
        .attr('stroke', fk('color'));

    s.exit().remove();
}
