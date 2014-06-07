/* global $, document, sigma */

var prepareGraph = function() {
    // Add a method to the graph model that returns an
    // object with every neighbors of a node inside:
    sigma.classes.graph.addMethod('neighbors', function(nodeId) {
        var k,
            neighbors = {},
            index = this.allNeighborsIndex[nodeId] || {};

        for (k in index)
            neighbors[k] = this.nodesIndex[k];

        return neighbors;
    });
};

var drawGraph = function(name) {

    $('#graph').html('');

    sigma.parsers.gexf('data/layouted/' + name + '.gexf', {
            container: 'graph',
            settings: {
                defaultNodeColor: '#ec5148',
                minEdgeSize: 0.3,
                maxEdgeSize: 0.3,

                defaultLabelColor: '#fff',

                defaultLabelSize: 11,

                defaultLabelBGColor: '#fff',
                defaultLabelHoverColor: '#000',
                labelThreshold: 7,

                defaultEdgeType: 'curve',
                enableHovering: true,

                borderSize: 2,
                defaultNodeBorderColor: '#FFF',
                doubleClickZoomingRatio: 4,
                zoomMin: 0.02,
                zoomMax: 2

            }
        },
        function(s) {

            window.graph = s;

            // We first need to save the original colors of our
            // nodes and edges, like this:
            s.graph.nodes().forEach(function(n) {
                n.originalColor = n.color;
            });
            s.graph.edges().forEach(function(e) {
                e.originalColor = e.color;
            });

            // When a node is clicked, we check for each node
            // if it is a neighbor of the clicked one. If not,
            // we set its color as grey, and else, it takes its
            // original color.
            // We do the same for the edges, and we only keep
            // edges that have both extremities colored.
            s.bind('clickNode', function(e) {
                var nodeId = e.data.node.id,
                    toKeep = s.graph.neighbors(nodeId);
                toKeep[nodeId] = e.data.node;

                // Print Node Infos to Detail Div
                var html = '';
                html += '<div class="node-title" style="border-color: ' + e.data.node.viz.color + '">' + e.data.node.label + '</div>';
                html += '<strong>Naive Score</strong>: ' + e.data.node.attributes.score + '<br>';
                html += '<strong>DBLP Score</strong>: ' + e.data.node.attributes.dblpscore + '<br>';
                html += '<div class="publications-title"><strong>Publications</strong>:</div>';

                html += '<ol class="publications">';
                var pubArray = e.data.node.attributes.publications.split(';');
                for (var i = 0; i < pubArray.length; i++) {
                    var pub = pubArray[i];
                    html += '<li>' + pub + '</li>';
                }

                html += '</ol>';

                $('#node-details').html(html);

                s.graph.nodes().forEach(function(n) {
                    if (toKeep[n.id])
                        n.color = n.originalColor;
                    else
                        n.color = '#333';
                });

                s.graph.edges().forEach(function(e) {
                    if (toKeep[e.source] && toKeep[e.target])
                        e.color = e.originalColor;
                    else
                        e.color = '#333';
                });

                // Since the data has been modified, we need to
                // call the refresh method to make the colors
                // update effective.
                s.refresh();
            });

            // When the stage is clicked, we just color each
            // node and edge with its original color.
            s.bind('clickStage', function(e) {
                s.graph.nodes().forEach(function(n) {
                    n.color = n.originalColor;
                });

                s.graph.edges().forEach(function(e) {
                    e.color = e.originalColor;
                });

                $('#node-details').html('');

                // Same as in the previous event:
                s.refresh();
            });
        }
    );
};
